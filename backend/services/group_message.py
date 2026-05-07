from backend.models.group_message import GroupMessage
from backend.schemas.group_message import GroupMessageCreate, GroupMessageupdate, GroupMessageResponse
from fastapi import HTTPException


def create_group_message(data : GroupMessageCreate) -> GroupMessage:
    grp_msg = GroupMessage(group=data.group, content=data.content, sender=data.sender)
    grp_msg.save()
    return grp_msg


def update_group_message(msg_id : str, user_id : str, data : GroupMessageupdate) -> GroupMessage:
    grp_msg = GroupMessage.objects(id = msg_id, sender=user_id) # type: ignore

    if not grp_msg:
        raise HTTPException(status_code=404, detail="Message not found.")
    if not data:
        return grp_msg
    
    grp_msg.update(data.content)
    grp_msg.reload()
    return grp_msg


def delete_group_message(msg_id : str, user_id : str) -> None:
    grp_msg = GroupMessage.objects(id = msg_id, sender=user_id) # type: ignore

    if not grp_msg:
        raise HTTPException(status_code=404, detail="Message not found.")
    
    grp_msg.delete()