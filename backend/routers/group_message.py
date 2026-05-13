from fastapi import APIRouter
from schemas.group_message import GroupMessageCreate, GroupMessageupdate, GroupMessageResponse
from services.group_message import create_group_message, update_group_message, delete_group_message

router = APIRouter()

@router.post("/", response_model=GroupMessageResponse, status_code=201)
def create_group_message_endpoint(msg: GroupMessageCreate):
    return create_group_message(msg)

@router.put("/{msg_id}/user/{user_id}", response_model=GroupMessageResponse)
def update_group_message_endpoint(msg_id: str, user_id: str, msg_update: GroupMessageupdate):
    return update_group_message(msg_id, user_id, msg_update)

@router.delete("/{msg_id}/user/{user_id}", status_code=204)
def delete_group_message_endpoint(msg_id: str, user_id: str):
    delete_group_message(msg_id, user_id)
    return None