from fastapi import APIRouter
from schemas.direct_message import DirectMessageSave, DirectMessageUpdate, DirectMessageResponse
from services.direct_message import create_direct_message, update_direct_message, delete_direct_message

router = APIRouter()

@router.post("/", response_model=DirectMessageResponse, status_code=201)
async def create_direct_message_endpoint(msg: DirectMessageSave):
    return await create_direct_message(msg)

@router.put("/{msg_id}/user/{user_id}", response_model=DirectMessageResponse)
def update_direct_message_endpoint(msg_id: str, user_id: str, msg_update: DirectMessageUpdate):
    return update_direct_message(msg_id, user_id, msg_update)

@router.delete("/{msg_id}", status_code=204)
def delete_direct_message_endpoint(msg_id: str):
    delete_direct_message(msg_id)
    return None