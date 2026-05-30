from pydantic import BaseModel, Field
from schemas.user import UserResponse
from schemas.group import GroupResponse
from datetime import datetime, timezone
from typing import Optional

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
    group : GroupResponse
    content : str
    sender : UserResponse
    sent_at : datetime
    updated_at : datetime
