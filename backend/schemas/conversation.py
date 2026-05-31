from pydantic import BaseModel, Field, ConfigDict, field_validator
from datetime import datetime, timezone
from typing import List, Optional, Any
from schemas.user import UserResponse


class ConversationCreate(BaseModel):
    member_ids : List[str] = Field(max_length=2)
    created_at : datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at : Optional[datetime] = None


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    members : List[UserResponse]
    created_at : datetime
    updated_at : Optional[datetime] = None

    @field_validator("id", mode="before")
    @classmethod
    def transform_id(cls, value: Any) -> str:
        if isinstance(value, str):
            return value
        return str(value)
