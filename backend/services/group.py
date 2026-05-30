from models.group import Group
from models.user import User
from schemas.group import GroupCreate, GroupUpdate
from fastapi import HTTPException

def create_groupe(data: GroupCreate) -> Group:
    try:
        members = list(User.objects(id__in=data.member_ids))  # type: ignore
        if len(members) != len(set(data.member_ids)):
            raise HTTPException(status_code=404, detail="One or more users were not found")
        creator = User.objects(id=data.creator_id).first()  # type: ignore
        if not creator:
            raise HTTPException(status_code=404, detail="Creator not found")
        group = Group(title=data.title, description=data.description,
                      members=members, creator=creator)
        group.save()
        return group
    except HTTPException:
        raise
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
        group = Group.objects(title=group_name, members=user_id).first()  # type: ignore
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        return group
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
        update_data = data.model_dump(exclude_none=True, exclude={"member_ids"})
        if data.member_ids is not None:
            members = list(User.objects(id__in=data.member_ids))  # type: ignore
            if len(members) != len(set(data.member_ids)):
                raise HTTPException(status_code=404, detail="One or more users were not found")
            update_data["members"] = members
        if not update_data:
            return group
        group.update(**update_data)
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
        if str(group.creator.id) != user_id:
            raise HTTPException(status_code=403, detail="You do not have the rights to do that")
        group.delete()
    except HTTPException:
        raise
    except Exception as e:
        print("DELETE GROUP ERROR:", str(e))
        raise
