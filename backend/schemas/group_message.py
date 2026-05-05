from pydantic import BaseModel, Field
from backend.schemas.user import UserResponse
from backend.schemas.group import GroupResponse
from datetime import datetime, timezone

class GroupMessageCreate(BaseModel):
    group : GroupResponse
    content : str = Field(max_length=3000)
    sender : UserResponse
    sent_at : datetime  = Field(default=datetime.now(timezone.utc))
    updated_at : datetime | None


class GroupMessageResponse(BaseModel):
    group : GroupResponse
    content : str
    sender : UserResponse
    sent_at : datetime
    updated_at : datetime
