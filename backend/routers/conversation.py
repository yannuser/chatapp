from fastapi import APIRouter, Depends
from typing import List
from schemas.conversation import ConversationCreate, ConversationResponse
from services.conversation import create_conversation, get_conversation_by_id, delete_conversation, get_user_conversations
from core.security import get_current_user


router = APIRouter()


@router.get("/", response_model=List[ConversationResponse])
def get_user_conversations_endpoint(current_user=Depends(get_current_user)):
    return get_user_conversations(str(current_user.id))


@router.post("/", response_model=ConversationResponse, status_code=201)
def create_conversation_endpoint(conversation: ConversationCreate, current_user=Depends(get_current_user)):
    if str(current_user.id) not in conversation.member_ids:
        conversation.member_ids.append(str(current_user.id))
    return create_conversation(conversation)


@router.get("/{convo_id}", response_model=ConversationResponse)
def get_conversation_endpoint(convo_id: str, current_user=Depends(get_current_user)):
    return get_conversation_by_id(convo_id, str(current_user.id))


@router.delete("/{convo_id}", status_code=204)
def delete_conversation_endpoint(convo_id: str, current_user=Depends(get_current_user)):
    delete_conversation(convo_id, str(current_user.id))
    return None