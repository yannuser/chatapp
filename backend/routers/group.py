from fastapi import APIRouter, Depends
from core.security import get_current_user
from schemas.group import GroupCreate, GroupUpdate, GroupResponse
from services.group import create_groupe, get_by_id, get_by_title, update_groupe, delete_group

router = APIRouter()

@router.post("/", response_model=GroupResponse, status_code=201)
def create_group_endpoint(group: GroupCreate, current_user=Depends(get_current_user)):
    group.creator_id = str(current_user.id)
    if group.creator_id not in group.member_ids:
        group.member_ids.append(group.creator_id)
    return create_groupe(group)

@router.get("/title/{group_name}", response_model=GroupResponse)
def get_group_by_title_endpoint(group_name: str, current_user=Depends(get_current_user)):
    return get_by_title(group_name, str(current_user.id))

@router.get("/{group_id}", response_model=GroupResponse)
def get_group_by_id_endpoint(group_id: str, current_user=Depends(get_current_user)):
    return get_by_id(group_id, str(current_user.id))

@router.put("/{group_id}", response_model=GroupResponse)
def update_group_endpoint(group_id: str, group_update: GroupUpdate, current_user=Depends(get_current_user)):
    return update_groupe(group_id, group_update, str(current_user.id))

@router.delete("/{group_id}", status_code=204)
def delete_group_endpoint(group_id: str, current_user=Depends(get_current_user)):
    delete_group(group_id, str(current_user.id))
    return None
