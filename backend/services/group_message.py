from models.group_message import GroupMessage
from models.group import Group
from models.user import User
from schemas.group_message import GroupMessageCreate, GroupMessageupdate, GroupMessageResponse
from fastapi import HTTPException


def create_group_message(data: GroupMessageCreate) -> GroupMessage:
    try:
        group = Group.objects(id=data.group_id).first()  # type: ignore
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        sender = User.objects(id=data.sender_id).first()  # type: ignore
        if not sender:
            raise HTTPException(status_code=404, detail="Sender not found")
        grp_msg = GroupMessage(group=group, content=data.content, sender=sender)
        grp_msg.save()
        return grp_msg
    except HTTPException:
        raise
    except Exception as e:
        print("CREATE GROUP MESSAGE ERROR:", str(e))
        raise


def update_group_message(msg_id: str, user_id: str, data: GroupMessageupdate) -> GroupMessage:
    try:
        grp_msg = GroupMessage.objects(id=msg_id, sender=user_id).first()  # type: ignore
        if not grp_msg:
            raise HTTPException(status_code=404, detail="Message not found.")
        update_data = data.model_dump(exclude_none=True)
        if not update_data:
            return grp_msg
        grp_msg.update(**update_data)
        grp_msg.reload()
        return grp_msg
    except HTTPException:
        raise
    except Exception as e:
        print("UPDATE GROUP MESSAGE ERROR:", str(e))
        raise


def delete_group_message(msg_id: str, user_id: str) -> None:
    try:
        grp_msg = GroupMessage.objects(id=msg_id, sender=user_id).first()  # type: ignore
        if not grp_msg:
            raise HTTPException(status_code=404, detail="Message not found.")
        grp_msg.delete()
    except HTTPException:
        raise
    except Exception as e:
        print("DELETE GROUP MESSAGE ERROR:", str(e))
        raise
