from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query
from core.security import get_current_user
from schemas.group_message import GroupMessageCreate, GroupMessageupdate, GroupMessageResponse, GroupMessagePage
from services.group_message import (
    get_group_messages,
    create_group_message,
    update_group_message,
    delete_group_message,
)

router = APIRouter()

@router.get("/", response_model=GroupMessagePage)
def get_group_messages_endpoint(
    group_id: str = Query(...),
    before: Optional[datetime] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    current_user=Depends(get_current_user),
):
    return get_group_messages(group_id, str(current_user.id), before, limit)

@router.post("/", response_model=GroupMessageResponse, status_code=201)
async def create_group_message_endpoint(msg: GroupMessageCreate, current_user=Depends(get_current_user)):
    msg.sender_id = str(current_user.id)
    return await create_group_message(msg)

@router.put("/{msg_id}", response_model=GroupMessageResponse)
async def update_group_message_endpoint(msg_id: str, msg_update: GroupMessageupdate, current_user=Depends(get_current_user)):
    return await update_group_message(msg_id, str(current_user.id), msg_update)

@router.delete("/{msg_id}", status_code=204)
async def delete_group_message_endpoint(msg_id: str, current_user=Depends(get_current_user)):
    await delete_group_message(msg_id, str(current_user.id))
    return None
