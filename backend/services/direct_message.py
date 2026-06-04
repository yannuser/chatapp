from models.direct_message import DirectMessage
from models.conversation import Conversation
from models.user import User
from schemas.direct_message import DirectMessageSave, DirectMessageUpdate, DirectMessageResponse
from fastapi import HTTPException
from core.websocket import manager
import logging

logger = logging.getLogger("direct_message_service")


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
            
        msg = DirectMessage(content=data.content, sender=sender, linked_conversation=conversation)
        msg.save()

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


def update_direct_message(msg_id: str, user_id: str, data: DirectMessageUpdate) -> DirectMessage:
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

        return msg
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"UPDATE MESSAGE ERROR: {str(e)}", exc_info=True)
        raise


def delete_direct_message(msg_id: str, user_id: str) -> None:
    try:
        msg = DirectMessage.objects(id=msg_id).first()  # type: ignore
        if not msg:
            raise HTTPException(status_code=404, detail="Message not found")
        
        if str(msg.sender.id) != user_id:
            raise HTTPException(status_code=403, detail="You do not have the rights to do that")
        
        msg.delete()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"DELETE MESSAGE ERROR: {str(e)}", exc_info=True)
        raise
