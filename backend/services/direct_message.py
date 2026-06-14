from datetime import datetime, timezone
from models.direct_message import DirectMessage
from models.conversation import Conversation
from models.user import User
from schemas.direct_message import DirectMessageSave, DirectMessageUpdate, DirectMessageResponse
from fastapi import HTTPException
from core.websocket import manager
import logging

logger = logging.getLogger("direct_message_service")


def read_status_for(conversation, viewer_id: str) -> dict:
    """Other members' last-read timestamps, omitting anyone who disabled read receipts."""
    from models.settings import Settings
    out: dict[str, datetime] = {}
    last_read = getattr(conversation, "last_read", None) or {}
    for member in conversation.members:
        mid = str(member.id)
        if mid == viewer_id:
            continue
        ts = last_read.get(mid)
        if not ts:
            continue
        s = Settings.objects(user=mid).first()  # type: ignore
        if s and not s.privacy.read_receipts:
            continue
        out[mid] = ts
    return out


def get_conversation_messages(conversation_id: str, user_id: str, before: datetime | None, limit: int) -> dict:
    try:
        conversation = Conversation.objects(id=conversation_id).first()  # type: ignore
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        if all(str(m.id) != user_id for m in conversation.members):
            raise HTTPException(status_code=403, detail="You are not a member of this conversation")

        query = DirectMessage.objects(linked_conversation=conversation_id)  # type: ignore
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
        return {"messages": msgs, "next_cursor": next_cursor, "last_read": read_status_for(conversation, user_id)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"GET CONVERSATION MESSAGES ERROR: {str(e)}", exc_info=True)
        raise


async def create_direct_message(data: DirectMessageSave) -> DirectMessage:
    try:
        sender = User.objects(id=data.sender_id).first()  # type: ignore
        if not sender:
            raise HTTPException(status_code=404, detail="Sender not found")

        conversation = Conversation.objects(id=data.linked_conversation_id).first()  # type: ignore
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        if all(str(member.id) != data.sender_id for member in conversation.members):
            raise HTTPException(status_code=403, detail="You are not a member of this conversation")

        from models.settings import Settings
        for member in conversation.members:
            if str(member.id) == data.sender_id:
                continue
            s = Settings.objects(user=member.id).first()  # type: ignore
            if s and any(str(b.id) == data.sender_id for b in s.blocked_users):
                raise HTTPException(status_code=403, detail="You cannot send messages to this user")

        msg = DirectMessage(content=data.content, sender=sender, linked_conversation=conversation)
        msg.save()

        conversation.update(set__updated_at=msg.sent_at)

        payload = DirectMessageResponse.model_validate(msg).model_dump(mode="json")
        payload["type"] = "new_direct_message"
        for member in conversation.members:
            await manager.send_personal_message(str(member.id), payload)

        return msg
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CREATE MESSAGE ERROR: {str(e)}", exc_info=True)
        raise


async def update_direct_message(msg_id: str, user_id: str, data: DirectMessageUpdate) -> DirectMessage:
    try:
        msg = DirectMessage.objects(id=msg_id).first()  # type: ignore
        if not msg:
            raise HTTPException(status_code=404, detail="Message not found")

        if str(msg.sender.id) != user_id:
            raise HTTPException(status_code=403, detail="You do not have the rights")

        update_data = data.model_dump(exclude_none=True)
        if not update_data:
            return msg

        msg.update(**update_data)
        msg.reload()

        payload = DirectMessageResponse.model_validate(msg).model_dump(mode="json")
        payload["type"] = "updated_direct_message"
        for member in msg.linked_conversation.members:
            await manager.send_personal_message(str(member.id), payload)

        return msg
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"UPDATE MESSAGE ERROR: {str(e)}", exc_info=True)
        raise


async def delete_direct_message(msg_id: str, user_id: str) -> None:
    try:
        msg = DirectMessage.objects(id=msg_id).first()  # type: ignore
        if not msg:
            raise HTTPException(status_code=404, detail="Message not found")

        if str(msg.sender.id) != user_id:
            raise HTTPException(status_code=403, detail="You do not have the rights to do that")

        conversation_id = str(msg.linked_conversation.id)
        members = list(msg.linked_conversation.members)
        msg.delete()

        payload = {"type": "deleted_direct_message", "id": msg_id, "conversation_id": conversation_id}
        for member in members:
            await manager.send_personal_message(str(member.id), payload)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"DELETE MESSAGE ERROR: {str(e)}", exc_info=True)
        raise
