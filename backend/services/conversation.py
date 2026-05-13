from models.conversation import Conversation
from schemas.conversation import ConversationCreate
from fastapi import HTTPException


def create_conversation(data : ConversationCreate) -> Conversation:
    convo = Conversation(members=data.members)
    convo.save()
    return convo


def get_conversation_by_id(convo_id : str) -> Conversation:
    convo =  Conversation.objects(id=convo_id).first() # type: ignore
    if not convo :
        raise HTTPException(status_code=404, detail="Conversation not found")
    return convo


def delete_conversation(convo_id : str):
    convo =  Conversation.objects(id=convo_id).first() # type: ignore
    if not convo :
        raise HTTPException(status_code=404, detail="Conversation not found")
    convo.delete()