from pydantic import BaseModel, Field
from backend.schemas.conversation import ConversationResponse
from backend.schemas.user import UserResponse
from datetime import datetime, timezone
from typing import Optional


class DirectMessageSave(BaseModel):
    content : str = Field(max_length=3000)
    sender : UserResponse
    conversation : ConversationResponse
    created_at : datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at : Optional[datetime] = None


class DirectMessageUpdate(BaseModel):
    content : str = Field(max_length=3000)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DirectMessageResponse(BaseModel):
    content : str
    sender : UserResponse
    conversation : ConversationResponse
    sent_at : datetime
    updated_at : datetime