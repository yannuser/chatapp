import logging
from models.group import Group
from models.user import User
from schemas.group import GroupCreate, GroupUpdate
from fastapi import HTTPException

logger = logging.getLogger("group_service")

def create_group(data: GroupCreate) -> Group:
    try:
        if len(set(data.member_ids)) < 2:
            raise HTTPException(status_code=400, detail="A group must have at least 2 members")
        
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
        logger.error(f"CREATE GROUP ERROR: {str(e)}", exc_info=True)
        raise


def get_by_id(group_id: str, user_id: str) -> Group:
    try:
        group = Group.objects(id=group_id).first()  # type: ignore
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        if all(str(member.id) != user_id for member in group.members):
            raise HTTPException(status_code=403, detail="You are not a member of this group")
        
        return group
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"GET GROUP BY ID ERROR: {str(e)}", exc_info=True)
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
        logger.error(f"GET GROUP BY TITLE ERROR: {str(e)}", exc_info=True)
        raise


def update_group(group_id: str, data: GroupUpdate, user_id: str) -> Group:
    try:
        group = Group.objects(id=group_id).first()  # type: ignore
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        if str(group.creator.id) != user_id:
            raise HTTPException(status_code=403, detail="Only the creator can update the group")
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
        logger.error(f"UPDATE GROUP ERROR: {str(e)}", exc_info=True)
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
        logger.error(f"DELETE GROUP ERROR: {str(e)}", exc_info=True)
        raise
