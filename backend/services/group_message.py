from models.group_message import GroupMessage
from schemas.group_message import GroupMessageCreate, GroupMessageupdate, GroupMessageResponse
from fastapi import HTTPException


def create_group_message(data: GroupMessageCreate) -> GroupMessage:
    try:
        grp_msg = GroupMessage(group=data.group, content=data.content, sender=data.sender)
        grp_msg.save()
        return grp_msg
    except Exception as e:
        print("CREATE GROUP MESSAGE ERROR:", str(e))
        raise


def update_group_message(msg_id: str, user_id: str, data: GroupMessageupdate) -> GroupMessage:
    try:
        grp_msg = GroupMessage.objects(id=msg_id, sender=user_id)  # type: ignore
        if not grp_msg:
            raise HTTPException(status_code=404, detail="Message not found.")
        if not data:
            return grp_msg
        grp_msg.update(data.content)
        grp_msg.reload()
        return grp_msg
    except HTTPException:
        raise
    except Exception as e:
        print("UPDATE GROUP MESSAGE ERROR:", str(e))
        raise


def delete_group_message(msg_id: str, user_id: str) -> None:
    try:
        grp_msg = GroupMessage.objects(id=msg_id, sender=user_id)  # type: ignore
        if not grp_msg:
            raise HTTPException(status_code=404, detail="Message not found.")
        grp_msg.delete()
    except HTTPException:
        raise
    except Exception as e:
        print("DELETE GROUP MESSAGE ERROR:", str(e))
        raise