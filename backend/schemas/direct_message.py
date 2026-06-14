from pydantic import BaseModel, Field, ConfigDict, field_validator
from schemas.conversation import ConversationResponse
from schemas.user import UserResponse
from datetime import datetime, timezone
from typing import Optional, Any, List, Dict


class DirectMessageSave(BaseModel):
    content : str = Field(max_length=3000)
    sender_id : str
    linked_conversation_id : str
    created_at : datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at : Optional[datetime] = None


class DirectMessageUpdate(BaseModel):
    content : str = Field(max_length=3000)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DirectMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    content : str
    sender : UserResponse
    linked_conversation : ConversationResponse
    sent_at : datetime
    updated_at : Optional[datetime] = None

    @field_validator("id", mode="before")
    @classmethod
    def transform_id(cls, value: Any) -> str:
        if isinstance(value, str):
            return value
        return str(value)


class DirectMessagePage(BaseModel):
    messages: List[DirectMessageResponse]
    next_cursor: Optional[str] = None
    # Other members' last-read timestamps (privacy-gated), for read receipts.
    last_read: Optional[Dict[str, datetime]] = None
