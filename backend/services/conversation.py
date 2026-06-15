import logging
from bson import ObjectId
from models.conversation import Conversation
from models.user import User
from schemas.conversation import ConversationCreate, ConversationResponse, ConversationPage, LastMessagePreview
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


def get_user_conversations(user_id: str, limit: int = 20, before_id: str | None = None) -> ConversationPage:
    try:
        from models.direct_message import DirectMessage

        query = Conversation.objects(members=user_id)  # type: ignore
        if before_id:
            query = query.filter(id__lt=ObjectId(before_id))

        items = list(query.order_by("-id").limit(limit + 1))
        has_more = len(items) > limit
        if has_more:
            items = items[:limit]

        next_cursor = str(items[-1].id) if has_more else None

        out = []
        for convo in items:
            resp = ConversationResponse.model_validate(convo)
            last = DirectMessage.objects(linked_conversation=convo.id).order_by("-sent_at").first()  # type: ignore
            if last:
                resp.last_message = LastMessagePreview(
                    id=str(last.id),
                    content=last.content,
                    sender_id=str(last.sender.id),
                    sent_at=last.sent_at,
                    is_deleted=getattr(last, "is_deleted", False),
                )
            out.append(resp)

        return ConversationPage(conversations=out, next_cursor=next_cursor)
    except Exception as e:
        logger.error(f"GET USER CONVERSATIONS ERROR: {str(e)}", exc_info=True)
        raise
