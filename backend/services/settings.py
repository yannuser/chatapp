import logging
from fastapi import HTTPException
from models.settings import Settings
from models.user import User
from models.conversation import Conversation
from models.group import Group
from schemas.settings import SettingsUpdate

logger = logging.getLogger("settings_service")


def _get_or_create(user_id: str) -> Settings:
    s = Settings.objects(user=user_id).first()  # type: ignore
    if not s:
        user = User.objects(id=user_id).first()  # type: ignore
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        s = Settings(user=user)
        s.save()
    return s


def get_settings(user_id: str) -> Settings:
    try:
        return _get_or_create(user_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"GET SETTINGS ERROR: {str(e)}", exc_info=True)
        raise


def update_settings(user_id: str, data: SettingsUpdate) -> Settings:
    try:
        s = _get_or_create(user_id)

        if data.language is not None:
            s.language = data.language

        if data.notifications is not None:
            patch = data.notifications.model_dump(exclude_none=True)
            for key, val in patch.items():
                setattr(s.notifications, key, val)

        if data.privacy is not None:
            patch = data.privacy.model_dump(exclude_none=True)
            for key, val in patch.items():
                setattr(s.privacy, key, val)

        if data.appearance is not None:
            patch = data.appearance.model_dump(exclude_none=True)
            for key, val in patch.items():
                setattr(s.appearance, key, val)

        s.save()
        return s
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"UPDATE SETTINGS ERROR: {str(e)}", exc_info=True)
        raise


def block_user(user_id: str, target_id: str) -> Settings:
    try:
        if user_id == target_id:
            raise HTTPException(status_code=400, detail="You cannot block yourself")
        target = User.objects(id=target_id).first()  # type: ignore
        if not target:
            raise HTTPException(status_code=404, detail="User not found")
        s = _get_or_create(user_id)
        if any(str(u.id) == target_id for u in s.blocked_users):
            raise HTTPException(status_code=400, detail="User already blocked")
        s.blocked_users.append(target)
        s.save()
        return s
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"BLOCK USER ERROR: {str(e)}", exc_info=True)
        raise


def unblock_user(user_id: str, target_id: str) -> Settings:
    try:
        s = _get_or_create(user_id)
        remaining = [u for u in s.blocked_users if str(u.id) != target_id]
        if len(remaining) == len(s.blocked_users):
            raise HTTPException(status_code=404, detail="User not blocked")
        s.blocked_users = remaining
        s.save()
        return s
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"UNBLOCK USER ERROR: {str(e)}", exc_info=True)
        raise


def mute_conversation(user_id: str, conversation_id: str) -> Settings:
    try:
        convo = Conversation.objects(id=conversation_id).first()  # type: ignore
        if not convo:
            raise HTTPException(status_code=404, detail="Conversation not found")
        if all(str(m.id) != user_id for m in convo.members):
            raise HTTPException(status_code=403, detail="You are not a member of this conversation")
        s = _get_or_create(user_id)
        if any(str(c.id) == conversation_id for c in s.muted_conversations):
            raise HTTPException(status_code=400, detail="Conversation already muted")
        s.muted_conversations.append(convo)
        s.save()
        return s
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"MUTE CONVERSATION ERROR: {str(e)}", exc_info=True)
        raise


def unmute_conversation(user_id: str, conversation_id: str) -> Settings:
    try:
        s = _get_or_create(user_id)
        remaining = [c for c in s.muted_conversations if str(c.id) != conversation_id]
        if len(remaining) == len(s.muted_conversations):
            raise HTTPException(status_code=404, detail="Conversation not muted")
        s.muted_conversations = remaining
        s.save()
        return s
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"UNMUTE CONVERSATION ERROR: {str(e)}", exc_info=True)
        raise


def mute_group(user_id: str, group_id: str) -> Settings:
    try:
        group = Group.objects(id=group_id).first()  # type: ignore
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        if all(str(m.id) != user_id for m in group.members):
            raise HTTPException(status_code=403, detail="You are not a member of this group")
        s = _get_or_create(user_id)
        if any(str(g.id) == group_id for g in s.muted_groups):
            raise HTTPException(status_code=400, detail="Group already muted")
        s.muted_groups.append(group)
        s.save()
        return s
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"MUTE GROUP ERROR: {str(e)}", exc_info=True)
        raise


def unmute_group(user_id: str, group_id: str) -> Settings:
    try:
        s = _get_or_create(user_id)
        remaining = [g for g in s.muted_groups if str(g.id) != group_id]
        if len(remaining) == len(s.muted_groups):
            raise HTTPException(status_code=404, detail="Group not muted")
        s.muted_groups = remaining
        s.save()
        return s
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"UNMUTE GROUP ERROR: {str(e)}", exc_info=True)
        raise
