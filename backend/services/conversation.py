from models.conversation import Conversation
from models.user import User
from schemas.conversation import ConversationCreate
from fastapi import HTTPException


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
        print("CREATE CONVERSATION ERROR:", str(e))
        raise


def get_conversation_by_id(convo_id: str) -> Conversation:
    try:
        convo = Conversation.objects(id=convo_id).first()  # type: ignore
        if not convo:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return convo
    except HTTPException:
        raise
    except Exception as e:
        print("GET CONVERSATION ERROR:", str(e))
        raise


def delete_conversation(convo_id: str):
    try:
        convo = Conversation.objects(id=convo_id).first()  # type: ignore
        if not convo:
            raise HTTPException(status_code=404, detail="Conversation not found")
        convo.delete()
    except HTTPException:
        raise
    except Exception as e:
        print("DELETE CONVERSATION ERROR:", str(e))
        raise


def get_user_conversations(user_id: str) -> list[Conversation]:
    try:
        return list(Conversation.objects(members=user_id))  # type: ignore
    except Exception as e:
        print("GET USER CONVERSATIONS ERROR:", str(e))
        raise
