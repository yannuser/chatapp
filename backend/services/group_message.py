import logging
from models.group_message import GroupMessage
from models.group import Group
from models.user import User
from schemas.group_message import GroupMessageCreate, GroupMessageupdate, GroupMessageResponse
from fastapi import HTTPException
from core.websocket import manager

logger = logging.getLogger("group_message_service")


async def create_group_message(data: GroupMessageCreate) -> GroupMessage:
    try:
        group = Group.objects(id=data.group_id).first()  # type: ignore
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        # Verify sender is a member of the group
        if all(str(member.id) != data.sender_id for member in group.members):
            raise HTTPException(status_code=403, detail="You are not a member of this group")
            
        sender = User.objects(id=data.sender_id).first()  # type: ignore
        if not sender:
            raise HTTPException(status_code=404, detail="Sender not found")
        grp_msg = GroupMessage(group=group, content=data.content, sender=sender)
        grp_msg.save()

        # Prepare payload for real-time delivery
        payload = GroupMessageResponse.model_validate(grp_msg).model_dump(mode="json")
        payload["type"] = "new_group_message"

        # Notify all members of the group
        for member in group.members:
            await manager.send_personal_message(str(member.id), payload)

        return grp_msg
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CREATE GROUP MESSAGE ERROR: {str(e)}", exc_info=True)
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
        logger.error(f"UPDATE GROUP MESSAGE ERROR: {str(e)}", exc_info=True)
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
        logger.error(f"DELETE GROUP MESSAGE ERROR: {str(e)}", exc_info=True)
        raise
