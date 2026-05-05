from pydantic import BaseModel, Field
from typing import List
from backend.schemas.user import UserResponse
from datetime import datetime, timezone

class GroupCreate(BaseModel):
    title : str = Field(max_length=100, default="New Group")
    description : str | None  = Field(max_length=5000)
    members : List[UserResponse]
    creator : UserResponse
    created_at : datetime = Field(default=datetime.now(timezone.utc))
    updated_at : datetime | None
    
class GroupResponse(BaseModel):
    title : str
    description : str | None
    members : List[UserResponse]
    creator : UserResponse
    created_at : datetime
    updated_at : datetime