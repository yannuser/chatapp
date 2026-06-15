import logging
from datetime import datetime, timezone
from models.group_message import GroupMessage, EditEntry as EditEntryDoc, Reaction as ReactionDoc
from models.group import Group
from models.user import User
from schemas.group_message import GroupMessageCreate, GroupMessageUpdate, GroupMessageResponse
from fastapi import HTTPException
from core.websocket import manager

logger = logging.getLogger("group_message_service")


def get_group_messages(group_id: str, user_id: str, before: datetime | None, limit: int) -> dict:
    try:
        group = Group.objects(id=group_id).first()  # type: ignore
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        if all(str(m.id) != user_id for m in group.members):
            raise HTTPException(status_code=403, detail="You are not a member of this group")

        query = GroupMessage.objects(group=group_id)  # type: ignore
        if before:
            if before.tzinfo is None:
                before = before.replace(tzinfo=timezone.utc)
            query = query.filter(sent_at__lt=before)

        msgs = list(query.order_by("-sent_at").limit(limit + 1))
        has_more = len(msgs) > limit
        if has_more:
            msgs = msgs[:limit]

        next_cursor = msgs[-1].sent_at.isoformat() if has_more else None
        msgs.reverse()
        return {"messages": msgs, "next_cursor": next_cursor}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"GET GROUP MESSAGES ERROR: {str(e)}", exc_info=True)
        raise


async def create_group_message(data: GroupMessageCreate) -> GroupMessage:
    try:
        group = Group.objects(id=data.group_id).first()  # type: ignore
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")

        if all(str(member.id) != data.sender_id for member in group.members):
            raise HTTPException(status_code=403, detail="You are not a member of this group")

        sender = User.objects(id=data.sender_id).first()  # type: ignore
        if not sender:
            raise HTTPException(status_code=404, detail="Sender not found")

        reply_msg = None
        if data.reply_to_id:
            reply_msg = GroupMessage.objects(id=data.reply_to_id, group=group).first()  # type: ignore

        grp_msg = GroupMessage(
            group=group,
            content=data.content,
            sender=sender,
            reply_to=reply_msg,
        )
        grp_msg.save()

        group.update(set__updated_at=grp_msg.sent_at)

        payload = GroupMessageResponse.model_validate(grp_msg).model_dump(mode="json")
        payload["type"] = "new_group_message"
        for member in group.members:
            await manager.send_personal_message(str(member.id), payload)

        return grp_msg
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CREATE GROUP MESSAGE ERROR: {str(e)}", exc_info=True)
        raise


async def update_group_message(msg_id: str, user_id: str, data: GroupMessageUpdate) -> GroupMessage:
    try:
        grp_msg = GroupMessage.objects(id=msg_id, sender=user_id).first()  # type: ignore
        if not grp_msg:
            raise HTTPException(status_code=404, detail="Message not found.")

        if getattr(grp_msg, "is_deleted", False):
            raise HTTPException(status_code=400, detail="Cannot edit a deleted message")

        now = datetime.now(timezone.utc)
        grp_msg.update(
            push__edits=EditEntryDoc(content=grp_msg.content, edited_at=now),
            set__content=data.content,
            set__updated_at=now,
        )
        grp_msg.reload()

        payload = GroupMessageResponse.model_validate(grp_msg).model_dump(mode="json")
        payload["type"] = "updated_group_message"
        for member in grp_msg.group.members:
            await manager.send_personal_message(str(member.id), payload)

        return grp_msg
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"UPDATE GROUP MESSAGE ERROR: {str(e)}", exc_info=True)
        raise


async def delete_group_message(msg_id: str, user_id: str) -> None:
    try:
        grp_msg = GroupMessage.objects(id=msg_id, sender=user_id).first()  # type: ignore
        if not grp_msg:
            raise HTTPException(status_code=404, detail="Message not found.")

        if getattr(grp_msg, "is_deleted", False):
            return

        members = list(grp_msg.group.members)
        now = datetime.now(timezone.utc)
        grp_msg.update(
            set__is_deleted=True,
            set__content="",
            set__deleted_at=now,
            set__updated_at=now,
        )
        grp_msg.reload()

        payload = GroupMessageResponse.model_validate(grp_msg).model_dump(mode="json")
        payload["type"] = "deleted_group_message"
        for member in members:
            await manager.send_personal_message(str(member.id), payload)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"DELETE GROUP MESSAGE ERROR: {str(e)}", exc_info=True)
        raise


async def react_to_group_message(msg_id: str, user_id: str, emoji: str) -> GroupMessage:
    try:
        grp_msg = GroupMessage.objects(id=msg_id).first()  # type: ignore
        if not grp_msg:
            raise HTTPException(status_code=404, detail="Message not found")

        members = list(grp_msg.group.members)
        if all(str(m.id) != user_id for m in members):
            raise HTTPException(status_code=403, detail="You are not a member of this group")

        reactions = [
            {"emoji": r.emoji, "user_ids": list(r.user_ids or [])}
            for r in (grp_msg.reactions or [])
        ]

        idx = next((i for i, r in enumerate(reactions) if r["emoji"] == emoji), None)

        if idx is None:
            reactions.append({"emoji": emoji, "user_ids": [user_id]})
        else:
            users = reactions[idx]["user_ids"]
            if user_id in users:
                users.remove(user_id)
            else:
                users.append(user_id)
            if not users:
                reactions.pop(idx)

        new_reactions = [ReactionDoc(emoji=r["emoji"], user_ids=r["user_ids"]) for r in reactions]
        grp_msg.update(set__reactions=new_reactions)
        grp_msg.reload()

        payload = GroupMessageResponse.model_validate(grp_msg).model_dump(mode="json")
        payload["type"] = "updated_group_message"
        for member in members:
            await manager.send_personal_message(str(member.id), payload)

        return grp_msg
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"REACT GROUP MESSAGE ERROR: {str(e)}", exc_info=True)
        raise
