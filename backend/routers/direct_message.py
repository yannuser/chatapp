from fastapi import APIRouter, Depends, HTTPException, status
from core.security import get_current_user
from schemas.direct_message import DirectMessageSave, DirectMessageUpdate, DirectMessageResponse
from services.direct_message import create_direct_message, update_direct_message, delete_direct_message

router = APIRouter()

@router.post("/", response_model=DirectMessageResponse, status_code=201)
async def create_direct_message_endpoint(msg: DirectMessageSave, current_user=Depends(get_current_user)):
    # Override sender_id with current user to prevent impersonation
    msg.sender_id = str(current_user.id)
    return await create_direct_message(msg)

@router.put("/{msg_id}", response_model=DirectMessageResponse)
def update_direct_message_endpoint(msg_id: str, msg_update: DirectMessageUpdate, current_user=Depends(get_current_user)):
    return update_direct_message(msg_id, str(current_user.id), msg_update)

@router.delete("/{msg_id}", status_code=204)
def delete_direct_message_endpoint(msg_id: str, current_user=Depends(get_current_user)):
    delete_direct_message(msg_id, str(current_user.id))
    return None