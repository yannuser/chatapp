from mongoengine import (
    Document, StringField, DateTimeField, ReferenceField, CASCADE,
    BooleanField, EmbeddedDocument, EmbeddedDocumentField, ListField,
)
from datetime import datetime, timezone


class EditEntry(EmbeddedDocument):
    content = StringField(required=True)
    edited_at = DateTimeField(required=True)


class Reaction(EmbeddedDocument):
    emoji = StringField(required=True, max_length=10)
    user_ids = ListField(StringField(), default=list)


class GroupMessage(Document):
    group = ReferenceField("Group", required=True)
    content = StringField(required=True, max_length=3000)
    sender = ReferenceField("User", reverse_delete_rule=CASCADE, required=True)
    reply_to = ReferenceField("GroupMessage", required=False)
    sent_at = DateTimeField(default=lambda: datetime.now(timezone.utc), required=True)
    updated_at = DateTimeField(required=False)
    is_deleted = BooleanField(default=False)
    deleted_at = DateTimeField(required=False)
    edits = ListField(EmbeddedDocumentField(EditEntry), default=list)
    reactions = ListField(EmbeddedDocumentField(Reaction), default=list)

    def clean(self):
        if not self.sent_at:
            self.sent_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)

    meta = {
        "collection": "group_messages",
        "ordering": ["-sent_at"],
        "indexes": ["content"],
        "allow_inheritance": False,
        "strict": False,
    }
