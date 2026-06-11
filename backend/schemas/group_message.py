from pydantic import BaseModel, Field, ConfigDict, field_validator
from schemas.user import UserResponse
from schemas.group import GroupResponse
from datetime import datetime, timezone
from typing import Optional, Any, List

class GroupMessageCreate(BaseModel):
    group_id : str
    content : str = Field(max_length=3000)
    sender_id : str
    sent_at : datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at : Optional[datetime] = None


class GroupMessageupdate(BaseModel):
    content : str = Field(max_length=3000)
    updated_at : datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class GroupMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    group : GroupResponse
    content : str
    sender : UserResponse
    sent_at : datetime
    updated_at : Optional[datetime] = None

    @field_validator("id", mode="before")
    @classmethod
    def transform_id(cls, value: Any) -> str:
        if isinstance(value, str):
            return value
        return str(value)


class GroupMessagePage(BaseModel):
    messages: List[GroupMessageResponse]
    next_cursor: Optional[str] = None
