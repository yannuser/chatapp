from backend.models.group import Group
from  backend.schemas.group import GroupCreate, GroupUpdate, GroupResponse
from fastapi import HTTPException


def create_groupe(data : GroupCreate) -> Group:
    group =  Group(title=data.title, description=data.description, 
                   members=data.members, creator=data.creator)
    return group


def get_by_id(group_id : str,) -> Group:
    group = Group.objects(id=group_id).first()  # type: ignore

    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    return group


def get_by_title(group_name : str, user_id : str) -> Group:
    groups = Group.objects(title=group_name, members=user_id)  # type: ignore

    if not groups:
        raise HTTPException(status_code=404, detail="Group not found")
    
    return groups


def update_groupe(group_id : str, data : GroupUpdate) -> Group:
    group = Group.objects(id=group_id).first()  # type: ignore

    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if not data:
        return group

    group.update(data)
    group.reload()
    return group

def delete_group(group_id : str, user_id : str) -> None:
    group = Group.objects(id=group_id).first()  # type: ignore

    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if not user_id == group.creator:
        raise HTTPException(status_code=403, detail="You do not have the rights to do that")

    group.delete()

