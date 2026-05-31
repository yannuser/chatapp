import logging
from models.conversation import Conversation
from models.user import User
from schemas.conversation import ConversationCreate
from fastapi import HTTPException

logger = logging.getLogger("conversation_service")


def create_conversation(data: ConversationCreate) -> Conversation:
    try:
        members = list(User.objects(id__in=data.member_ids))  # type: ignore
        if len(members) != len(set(data.member_ids)):
            raise HTTPException(status_code=404, detail="One or more users were not found")
        convo = Conversation(members=members)
        convo.save()
        return convo
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CREATE CONVERSATION ERROR: {str(e)}", exc_info=True)
        raise


def get_conversation_by_id(convo_id: str, user_id: str) -> Conversation:
    try:
        convo = Conversation.objects(id=convo_id).first()  # type: ignore
        if not convo:
            raise HTTPException(status_code=404, detail="Conversation not found")
        if all(str(member.id) != user_id for member in convo.members):
            raise HTTPException(status_code=403, detail="You are not a member of this conversation")
        return convo
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"GET CONVERSATION ERROR: {str(e)}", exc_info=True)
        raise


def delete_conversation(convo_id: str, user_id: str):
    try:
        convo = Conversation.objects(id=convo_id).first()  # type: ignore
        if not convo:
            raise HTTPException(status_code=404, detail="Conversation not found")
        if all(str(member.id) != user_id for member in convo.members):
            raise HTTPException(status_code=403, detail="You do not have the rights to delete this conversation")
        convo.delete()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"DELETE CONVERSATION ERROR: {str(e)}", exc_info=True)
        raise


def get_user_conversations(user_id: str) -> list[Conversation]:
    try:
        return list(Conversation.objects(members=user_id))  # type: ignore
    except Exception as e:
        logger.error(f"GET USER CONVERSATIONS ERROR: {str(e)}", exc_info=True)
        raise
