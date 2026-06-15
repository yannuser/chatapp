from fastapi import APIRouter, Depends, Query
from typing import Optional
from schemas.conversation import ConversationCreate, ConversationResponse, ConversationPage
from services.conversation import create_conversation, get_conversation_by_id, delete_conversation, get_user_conversations
from core.security import get_current_user


router = APIRouter()


@router.get("/", response_model=ConversationPage)
def get_user_conversations_endpoint(
    limit: int = Query(default=20, ge=1, le=100),
    before_id: Optional[str] = Query(default=None),
    current_user=Depends(get_current_user),
):
    return get_user_conversations(str(current_user.id), limit=limit, before_id=before_id)


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
