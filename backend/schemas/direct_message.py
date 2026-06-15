from pydantic import BaseModel, Field, ConfigDict, field_validator
from schemas.conversation import ConversationResponse
from schemas.user import UserResponse
from datetime import datetime, timezone
from typing import Optional, Any, List, Dict


class DirectMessageSave(BaseModel):
    content: str = Field(max_length=3000)
    sender_id: str
    linked_conversation_id: str
    reply_to_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None


class DirectMessageUpdate(BaseModel):
    content: str = Field(max_length=3000)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ReactRequest(BaseModel):
    emoji: str = Field(max_length=10)


class EditEntry(BaseModel):
    content: str
    edited_at: datetime


class ReplyPreview(BaseModel):
    id: str
    content: str
    sender_name: str
    is_deleted: bool = False


class ReactionGroup(BaseModel):
    emoji: str
    user_ids: List[str] = []


class DirectMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    content: str
    sender: UserResponse
    linked_conversation: ConversationResponse
    sent_at: datetime
    updated_at: Optional[datetime] = None
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    reply_to: Optional[ReplyPreview] = None
    edits: List[EditEntry] = []
    reactions: List[ReactionGroup] = []

    @field_validator("id", mode="before")
    @classmethod
    def transform_id(cls, value: Any) -> str:
        if isinstance(value, str):
            return value
        return str(value)

    @field_validator("reply_to", mode="before")
    @classmethod
    def build_reply_preview(cls, value: Any) -> Optional[dict]:
        if value is None:
            return None
        try:
            sender = value.sender
            return {
                "id": str(value.id),
                "content": value.content if not getattr(value, "is_deleted", False) else "",
                "sender_name": f"{sender.first_name} {sender.last_name}",
                "is_deleted": bool(getattr(value, "is_deleted", False)),
            }
        except Exception:
            return None

    @field_validator("edits", mode="before")
    @classmethod
    def build_edits(cls, value: Any) -> List[dict]:
        if not value:
            return []
        return [{"content": e.content, "edited_at": e.edited_at} for e in value]

    @field_validator("reactions", mode="before")
    @classmethod
    def build_reactions(cls, value: Any) -> List[dict]:
        if not value:
            return []
        return [{"emoji": r.emoji, "user_ids": list(r.user_ids or [])} for r in value]


class DirectMessagePage(BaseModel):
    messages: List[DirectMessageResponse]
    next_cursor: Optional[str] = None
    last_read: Optional[Dict[str, datetime]] = None
