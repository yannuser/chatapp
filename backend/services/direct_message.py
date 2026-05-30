from models.direct_message import DirectMessage
from models.conversation import Conversation
from models.user import User
from schemas.direct_message import DirectMessageSave, DirectMessageUpdate
from fastapi import HTTPException


def create_direct_message(data: DirectMessageSave) -> DirectMessage:
    try:
        sender = User.objects(id=data.sender_id).first()  # type: ignore
        if not sender:
            raise HTTPException(status_code=404, detail="Sender not found")
        conversation = Conversation.objects(id=data.linked_conversation_id).first()  # type: ignore
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        msg = DirectMessage(content=data.content, sender=sender, linked_conversation=conversation)
        msg.save()
        return msg
    except HTTPException:
        raise
    except Exception as e:
        print("CREATE MESSAGE ERROR:", str(e))
        raise


def update_direct_message(msg_id: str, user_id: str, data: DirectMessageUpdate) -> DirectMessage:
    try:
        msg = DirectMessage.objects(id=msg_id).first()  # type: ignore
        if not msg:
            raise HTTPException(status_code=404, detail="Message not found")
        if str(msg.sender.id) != user_id:
            raise HTTPException(status_code=403, detail="You do not have the rights to do that")
        update_data = data.model_dump(exclude_none=True)
        if not update_data:
            return msg
        msg.update(**update_data)
        msg.reload()
        return msg
    except HTTPException:
        raise
    except Exception as e:
        print("UPDATE MESSAGE ERROR:", str(e))
        raise


def delete_direct_message(msg_id: str) -> None:
    try:
        msg = DirectMessage.objects(id=msg_id).first()  # type: ignore
        if not msg:
            raise HTTPException(status_code=404, detail="Message not found")
        msg.delete()
    except HTTPException:
        raise
    except Exception as e:
        print("DELETE MESSAGE ERROR:", str(e))
        raise
