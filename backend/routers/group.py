from typing import List
from fastapi import APIRouter, Depends
from core.security import get_current_user
from schemas.group import GroupCreate, GroupUpdate, GroupResponse
from services.group import create_group, get_by_id, get_by_title, get_user_groups, update_group, delete_group, leave_group

router = APIRouter()

@router.get("/", response_model=List[GroupResponse])
def get_user_groups_endpoint(current_user=Depends(get_current_user)):
    return get_user_groups(str(current_user.id))

@router.post("/", response_model=GroupResponse, status_code=201)
async def create_group_endpoint(group: GroupCreate, current_user=Depends(get_current_user)):
    group.creator_id = str(current_user.id)
    if group.creator_id not in group.member_ids:
        group.member_ids.append(group.creator_id)
    return await create_group(group)

@router.get("/title/{group_name}", response_model=GroupResponse)
def get_group_by_title_endpoint(group_name: str, current_user=Depends(get_current_user)):
    return get_by_title(group_name, str(current_user.id))

@router.get("/{group_id}", response_model=GroupResponse)
def get_group_by_id_endpoint(group_id: str, current_user=Depends(get_current_user)):
    return get_by_id(group_id, str(current_user.id))

@router.put("/{group_id}", response_model=GroupResponse)
async def update_group_endpoint(group_id: str, group_update: GroupUpdate, current_user=Depends(get_current_user)):
    return await update_group(group_id, group_update, str(current_user.id))

@router.post("/{group_id}/leave", status_code=204)
async def leave_group_endpoint(group_id: str, current_user=Depends(get_current_user)):
    await leave_group(group_id, str(current_user.id))
    return None

@router.delete("/{group_id}", status_code=204)
async def delete_group_endpoint(group_id: str, current_user=Depends(get_current_user)):
    await delete_group(group_id, str(current_user.id))
    return None
