from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, Any, List, Literal
from datetime import datetime


class NotificationSettingsSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    enabled: bool = True
    message_preview: bool = True
    group_messages: bool = True
    contact_requests: bool = True


class PrivacySettingsSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    who_can_add_me: Literal["everyone", "nobody"] = "everyone"
    show_online_status: bool = True
    read_receipts: bool = True


class AppearanceSettingsSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    theme: Literal["light", "dark", "system"] = "system"


class SettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    language: str
    notifications: NotificationSettingsSchema
    privacy: PrivacySettingsSchema
    appearance: AppearanceSettingsSchema
    blocked_users: List[str]
    muted_conversations: List[str]
    muted_groups: List[str]
    updated_at: Optional[datetime] = None

    @field_validator("id", mode="before")
    @classmethod
    def transform_id(cls, value: Any) -> str:
        return str(value)

    @field_validator("blocked_users", "muted_conversations", "muted_groups", mode="before")
    @classmethod
    def extract_ids(cls, value: Any) -> List[str]:
        if not value:
            return []
        return [str(item.id) if hasattr(item, "id") else str(item) for item in value]


class NotificationSettingsUpdate(BaseModel):
    enabled: Optional[bool] = None
    message_preview: Optional[bool] = None
    group_messages: Optional[bool] = None
    contact_requests: Optional[bool] = None


class PrivacySettingsUpdate(BaseModel):
    who_can_add_me: Optional[Literal["everyone", "nobody"]] = None
    show_online_status: Optional[bool] = None
    read_receipts: Optional[bool] = None


class AppearanceSettingsUpdate(BaseModel):
    theme: Optional[Literal["light", "dark", "system"]] = None


class SettingsUpdate(BaseModel):
    language: Optional[str] = None
    notifications: Optional[NotificationSettingsUpdate] = None
    privacy: Optional[PrivacySettingsUpdate] = None
    appearance: Optional[AppearanceSettingsUpdate] = None
