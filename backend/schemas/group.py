from pydantic import BaseModel, Field
from typing import List, Optional
from schemas.user import UserResponse
from datetime import datetime, timezone

class GroupCreate(BaseModel):
    title : str = Field(max_length=100, default="New Group")
    description : str | None  = Field(max_length=5000)
    member_ids : List[str]
    creator_id : str
    created_at : datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at : Optional[datetime] = None


class GroupUpdate(BaseModel):
    title : Optional[str] = Field(default=None, max_length=100)
    description : Optional[str] = Field(default=None, max_length=5000)
    member_ids : Optional[List[str]] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class GroupResponse(BaseModel):
    title : str
    description : str | None
    members : List[UserResponse]
    creator : UserResponse
    created_at : datetime
    updated_at : datetime
