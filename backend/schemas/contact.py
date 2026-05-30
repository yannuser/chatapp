from datetime import datetime, timezone
from typing import List, Optional

from pydantic import BaseModel, Field

from schemas.user import UserResponse


class ContactCreate(BaseModel):
    user_id: str
    contact_ids: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None


class ContactAdd(BaseModel):
    contact_id: str


class ContactResponse(BaseModel):
    user: UserResponse
    contacts: List[UserResponse]
    created_at: datetime
    updated_at: datetime
