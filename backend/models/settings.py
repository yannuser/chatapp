from mongoengine import (
    Document, EmbeddedDocument, StringField, BooleanField,
    ListField, ReferenceField, EmbeddedDocumentField, DateTimeField, CASCADE,
)
from datetime import datetime, timezone


class NotificationSettings(EmbeddedDocument):
    enabled = BooleanField(default=True)
    message_preview = BooleanField(default=True)
    group_messages = BooleanField(default=True)
    contact_requests = BooleanField(default=True)


class PrivacySettings(EmbeddedDocument):
    who_can_add_me = StringField(default="everyone", choices=["everyone", "nobody"])
    show_online_status = BooleanField(default=True)
    read_receipts = BooleanField(default=True)


class AppearanceSettings(EmbeddedDocument):
    theme = StringField(default="system", choices=["light", "dark", "system"])


class Settings(Document):
    user = ReferenceField("User", reverse_delete_rule=CASCADE, required=True, unique=True)
    language = StringField(default="en", max_length=10)
    notifications = EmbeddedDocumentField(NotificationSettings, default=NotificationSettings)
    privacy = EmbeddedDocumentField(PrivacySettings, default=PrivacySettings)
    appearance = EmbeddedDocumentField(AppearanceSettings, default=AppearanceSettings)
    blocked_users = ListField(ReferenceField("User", reverse_delete_rule=CASCADE))
    muted_conversations = ListField(ReferenceField("Conversation"))
    muted_groups = ListField(ReferenceField("Group"))
    updated_at = DateTimeField(required=False)

    def clean(self):
        self.updated_at = datetime.now(timezone.utc)

    meta = {
        "collection": "settings",
        "indexes": ["user"],
        "allow_inheritance": False,
        "strict": True,
    }
