from fastapi import APIRouter, Depends
from core.security import get_current_user
from schemas.settings import SettingsResponse, SettingsUpdate
from services.settings import (
    get_settings,
    update_settings,
    block_user,
    unblock_user,
    mute_conversation,
    unmute_conversation,
    mute_group,
    unmute_group,
)

router = APIRouter()


@router.get("/", response_model=SettingsResponse)
def get_settings_endpoint(current_user=Depends(get_current_user)):
    return get_settings(str(current_user.id))


@router.patch("/", response_model=SettingsResponse)
def update_settings_endpoint(data: SettingsUpdate, current_user=Depends(get_current_user)):
    return update_settings(str(current_user.id), data)


@router.post("/block/{target_id}", response_model=SettingsResponse)
def block_user_endpoint(target_id: str, current_user=Depends(get_current_user)):
    return block_user(str(current_user.id), target_id)


@router.delete("/block/{target_id}", response_model=SettingsResponse)
def unblock_user_endpoint(target_id: str, current_user=Depends(get_current_user)):
    return unblock_user(str(current_user.id), target_id)


@router.post("/mute/conversation/{conversation_id}", response_model=SettingsResponse)
def mute_conversation_endpoint(conversation_id: str, current_user=Depends(get_current_user)):
    return mute_conversation(str(current_user.id), conversation_id)


@router.delete("/mute/conversation/{conversation_id}", response_model=SettingsResponse)
def unmute_conversation_endpoint(conversation_id: str, current_user=Depends(get_current_user)):
    return unmute_conversation(str(current_user.id), conversation_id)


@router.post("/mute/group/{group_id}", response_model=SettingsResponse)
def mute_group_endpoint(group_id: str, current_user=Depends(get_current_user)):
    return mute_group(str(current_user.id), group_id)


@router.delete("/mute/group/{group_id}", response_model=SettingsResponse)
def unmute_group_endpoint(group_id: str, current_user=Depends(get_current_user)):
    return unmute_group(str(current_user.id), group_id)
