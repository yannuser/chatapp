# app/routers/conversations.py
from fastapi import APIRouter
from typing import List
from schemas.conversation import ConversationCreate, ConversationResponse
from services.conversation import create_conversation, get_conversation_by_id, delete_conversation


router = APIRouter()


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