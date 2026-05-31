from fastapi import APIRouter, Depends
from core.security import get_current_user
from schemas.group_message import GroupMessageCreate, GroupMessageupdate, GroupMessageResponse
from services.group_message import create_group_message, update_group_message, delete_group_message

router = APIRouter()

@router.post("/", response_model=GroupMessageResponse, status_code=201)
async def create_group_message_endpoint(msg: GroupMessageCreate, current_user=Depends(get_current_user)):
    msg.sender_id = str(current_user.id)
    return await create_group_message(msg)

@router.put("/{msg_id}", response_model=GroupMessageResponse)
def update_group_message_endpoint(msg_id: str, msg_update: GroupMessageupdate, current_user=Depends(get_current_user)):
    return update_group_message(msg_id, str(current_user.id), msg_update)

@router.delete("/{msg_id}", status_code=204)
def delete_group_message_endpoint(msg_id: str, current_user=Depends(get_current_user)):
    delete_group_message(msg_id, str(current_user.id))
    return None