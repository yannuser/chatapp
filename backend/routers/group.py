from fastapi import APIRouter
from schemas.group import GroupCreate, GroupUpdate, GroupResponse
from services.group import create_groupe, get_by_id, get_by_title, update_groupe, delete_group

router = APIRouter()

@router.post("/", response_model=GroupResponse, status_code=201)
def create_group_endpoint(group: GroupCreate):
    return create_groupe(group)

@router.get("/title/{group_name}/user/{user_id}", response_model=GroupResponse)
def get_group_by_title_endpoint(group_name: str, user_id: str):
    return get_by_title(group_name, user_id)

@router.get("/{group_id}", response_model=GroupResponse)
def get_group_by_id_endpoint(group_id: str):
    return get_by_id(group_id)

@router.put("/{group_id}", response_model=GroupResponse)
def update_group_endpoint(group_id: str, group_update: GroupUpdate):
    return update_groupe(group_id, group_update)

@router.delete("/{group_id}/user/{user_id}", status_code=204)
def delete_group_endpoint(group_id: str, user_id: str):
    delete_group(group_id, user_id)
    return None
