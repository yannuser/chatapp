# app/routers/conversations.py
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
def create_conversation_endpoint(conversation: ConversationCreate):
    return create_conversation(conversation)


@router.get("/{convo_id}", response_model=ConversationResponse)
def get_conversation_endpoint(convo_id: str):
    return get_conversation_by_id(convo_id)


@router.delete("/{convo_id}", status_code=204)
def delete_conversation_endpoint(convo_id: str):
    delete_conversation(convo_id)
    return None