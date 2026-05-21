from models.conversation import Conversation
from schemas.conversation import ConversationCreate
from fastapi import HTTPException


def create_conversation(data: ConversationCreate) -> Conversation:
    try:
        convo = Conversation(members=data.members)
        convo.save()
        return convo
    except Exception as e:
        print("CREATE CONVERSATION ERROR:", str(e))
        raise


def get_conversation_by_id(convo_id: str) -> Conversation:
    try:
        convo = Conversation.objects(id=convo_id).first()  # type: ignore
        if not convo:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return convo
    except HTTPException:
        raise
    except Exception as e:
        print("GET CONVERSATION ERROR:", str(e))
        raise


def delete_conversation(convo_id: str):
    try:
        convo = Conversation.objects(id=convo_id).first()  # type: ignore
        if not convo:
            raise HTTPException(status_code=404, detail="Conversation not found")
        convo.delete()
    except HTTPException:
        raise
    except Exception as e:
        print("DELETE CONVERSATION ERROR:", str(e))
        raise