import logging
from datetime import datetime, timezone
from models.group_message import GroupMessage
from models.group import Group
from models.user import User
from schemas.group_message import GroupMessageCreate, GroupMessageupdate, GroupMessageResponse
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

        grp_msg = GroupMessage(group=group, content=data.content, sender=sender)
        grp_msg.save()

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


async def update_group_message(msg_id: str, user_id: str, data: GroupMessageupdate) -> GroupMessage:
    try:
        grp_msg = GroupMessage.objects(id=msg_id, sender=user_id).first()  # type: ignore
        if not grp_msg:
            raise HTTPException(status_code=404, detail="Message not found.")

        update_data = data.model_dump(exclude_none=True)
        if not update_data:
            return grp_msg

        grp_msg.update(**update_data)
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

        group_id = str(grp_msg.group.id)
        members = list(grp_msg.group.members)
        grp_msg.delete()

        payload = {"type": "deleted_group_message", "id": msg_id, "group_id": group_id}
        for member in members:
            await manager.send_personal_message(str(member.id), payload)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"DELETE GROUP MESSAGE ERROR: {str(e)}", exc_info=True)
        raise
