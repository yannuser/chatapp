from pydantic import BaseModel, Field, ConfigDict, field_validator
from datetime import datetime, timezone
from typing import List, Optional, Any
from schemas.user import UserResponse


class ConversationCreate(BaseModel):
    member_ids : List[str] = Field(min_length=2, max_length=2)
    created_at : datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at : Optional[datetime] = None


class LastMessagePreview(BaseModel):
    """Slim message summary for list views (sidebar previews)."""
    id: str
    content: str
    sender_id: str
    sent_at: datetime


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    members : List[UserResponse]
    created_at : datetime
    updated_at : Optional[datetime] = None
    last_message : Optional[LastMessagePreview] = None

    @field_validator("id", mode="before")
    @classmethod
    def transform_id(cls, value: Any) -> str:
        if isinstance(value, str):
            return value
        return str(value)
