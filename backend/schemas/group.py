from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import List, Optional, Any
from schemas.user import UserResponse
from schemas.conversation import LastMessagePreview
from datetime import datetime, timezone


class GroupCreate(BaseModel):
    title : str = Field(max_length=100)
    description : str | None  = Field(default=None, max_length=5000)
    member_ids : List[str]
    creator_id : str
    created_at : datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at : Optional[datetime] = None


class GroupUpdate(BaseModel):
    title : Optional[str] = Field(default=None, max_length=100)
    description : Optional[str] = Field(default=None, max_length=5000)
    member_ids: Optional[List[str]] = Field(default=None, min_length=2)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class GroupResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title : str
    description : str | None
    members : List[UserResponse]
    creator : UserResponse
    created_at : datetime
    updated_at : Optional[datetime] = None
    last_message : Optional[LastMessagePreview] = None

    @field_validator("id", mode="before")
    @classmethod
    def transform_id(cls, value: Any) -> str:
        if isinstance(value, str):
            return value
        return str(value)


class GroupPage(BaseModel):
    groups: List[GroupResponse]
    next_cursor: Optional[str] = None
