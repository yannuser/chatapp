from mongoengine import Document, StringField,  DateTimeField, ReferenceField, CASCADE
from datetime import datetime, timezone
import backend.models.user as user
import backend.models.group as group


class GroupMessage(Document):
    group = ReferenceField(group, required=True)
    content = StringField(required=True, max_length=3000)
    sender = ReferenceField(user, reverse_delete_rule=CASCADE, required=True)
    sent_at = DateTimeField(default=lambda: datetime.now(timezone.utc))
    updated_at = DateTimeField(required=False)

    def clean(self):
        if not self.sent_at:
            self.sent_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)

    meta = {
        "collection": "messages",
        "ordering": ["-sent_at"],
        "indexes": ["content"],
        "allow_inheritance": False,
        "strict": False,
    }