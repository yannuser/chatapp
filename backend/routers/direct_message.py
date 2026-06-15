from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, Request
from core.security import get_current_user
from core.ratelimit import limiter
from schemas.direct_message import (
    DirectMessageSave, DirectMessageUpdate, DirectMessageResponse,
    DirectMessagePage, ReactRequest,
)
from services.direct_message import (
    get_conversation_messages,
    create_direct_message,
    update_direct_message,
    delete_direct_message,
    react_to_direct_message,
)

router = APIRouter()


@router.get("/", response_model=DirectMessagePage)
def get_direct_messages_endpoint(
    conversation_id: str = Query(...),
    before: Optional[datetime] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    current_user=Depends(get_current_user),
):
    return get_conversation_messages(conversation_id, str(current_user.id), before, limit)


@router.post("/", response_model=DirectMessageResponse, status_code=201)
@limiter.limit("30 per minute")
async def create_direct_message_endpoint(msg: DirectMessageSave, request: Request, current_user=Depends(get_current_user)):
    msg.sender_id = str(current_user.id)
    return await create_direct_message(msg)


@router.post("/{msg_id}/react", response_model=DirectMessageResponse)
async def react_to_direct_message_endpoint(
    msg_id: str, body: ReactRequest, current_user=Depends(get_current_user)
):
    return await react_to_direct_message(msg_id, str(current_user.id), body.emoji)


@router.put("/{msg_id}", response_model=DirectMessageResponse)
async def update_direct_message_endpoint(msg_id: str, msg_update: DirectMessageUpdate, current_user=Depends(get_current_user)):
    return await update_direct_message(msg_id, str(current_user.id), msg_update)


@router.delete("/{msg_id}", status_code=204)
async def delete_direct_message_endpoint(msg_id: str, current_user=Depends(get_current_user)):
    await delete_direct_message(msg_id, str(current_user.id))
    return None
