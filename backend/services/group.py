from models.group import Group
from schemas.group import GroupCreate, GroupUpdate
from fastapi import HTTPException

def create_groupe(data: GroupCreate) -> Group:
    try:
        group = Group(title=data.title, description=data.description,
                      members=data.members, creator=data.creator)
        group.save()
        return group
    except Exception as e:
        print("CREATE GROUP ERROR:", str(e))
        raise


def get_by_id(group_id: str) -> Group:
    try:
        group = Group.objects(id=group_id).first()  # type: ignore
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        return group
    except HTTPException:
        raise
    except Exception as e:
        print("GET GROUP BY ID ERROR:", str(e))
        raise


def get_by_title(group_name: str, user_id: str) -> Group:
    try:
        groups = Group.objects(title=group_name, members=user_id)  # type: ignore
        if not groups:
            raise HTTPException(status_code=404, detail="Group not found")
        return groups
    except HTTPException:
        raise
    except Exception as e:
        print("GET GROUP BY TITLE ERROR:", str(e))
        raise


def update_groupe(group_id: str, data: GroupUpdate) -> Group:
    try:
        group = Group.objects(id=group_id).first()  # type: ignore
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        if not data:
            return group
        group.update(data)
        group.reload()
        return group
    except HTTPException:
        raise
    except Exception as e:
        print("UPDATE GROUP ERROR:", str(e))
        raise


def delete_group(group_id: str, user_id: str) -> None:
    try:
        group = Group.objects(id=group_id).first()  # type: ignore
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        if user_id != group.creator:
            raise HTTPException(status_code=403, detail="You do not have the rights to do that")
        group.delete()
    except HTTPException:
        raise
    except Exception as e:
        print("DELETE GROUP ERROR:", str(e))
        raise