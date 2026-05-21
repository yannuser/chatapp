from models.direct_message import DirectMessage
from schemas.direct_message import DirectMessageSave, DirectMessageUpdate
from fastapi import HTTPException


def create_direct_message(data: DirectMessageSave) -> DirectMessage:
    try:
        msg = DirectMessage(content=data.content, sender=data.sender, linked_conversation=data.linked_conversation)
        msg.save()
        return msg
    except Exception as e:
        print("CREATE MESSAGE ERROR:", str(e))
        raise


def update_direct_message(msg_id: str, user_id: str, data: DirectMessageUpdate) -> DirectMessage:
    try:
        msg = DirectMessage.objects(id=msg_id).first()  # type: ignore
        if not msg:
            raise HTTPException(status_code=404, detail="Message not found")
        if msg.sender != user_id:
            raise HTTPException(status_code=403, detail="You do not have the rights to do that")
        if not data:
            return msg
        msg.update(data)
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