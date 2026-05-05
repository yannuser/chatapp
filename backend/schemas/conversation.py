from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import List, Optional
from backend.schemas.user import UserResponse


class ConversationCreate(BaseModel):
    members : List[UserResponse] = Field(max_length=2)
    created_at : datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at : Optional[datetime] = None


class ConversationUpdate(BaseModel):
    members : Optional[List[UserResponse]] = Field(max_length=2)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ConversationResponse(BaseModel):
    members : List[UserResponse]
    created_at : datetime
    updated_at : datetime