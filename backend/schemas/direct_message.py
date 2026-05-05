from pydantic import BaseModel, Field
from backend.schemas.conversation import ConversationResponse
from backend.schemas.user import UserResponse
from datetime import datetime, timezone


class DirectMessageSave(BaseModel):
    content : str = Field(max_length=3000)
    sender : UserResponse
    conversation : ConversationResponse
    sent_at : datetime = Field(default=datetime.now(timezone.utc))
    updated_at : datetime | None

class DirectMessageResponse(BaseModel):
    content : str
    sender : UserResponse
    conversation : ConversationResponse
    sent_at : datetime
    updated_at : datetime