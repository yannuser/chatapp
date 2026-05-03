from mongoengine import Document, StringField, DateTimeField, ReferenceField, CASCADE
from datetime import datetime, timezone
import User
import Conversation

class DirectMessage(Document):
    content = StringField(required=True, max_length=3000)
    sent_at = DateTimeField(default= datetime.now(timezone.utc))
    updated_at = DateTimeField()
    sender = ReferenceField(User, reverse_delete_rule=CASCADE, required=True)
    conversation = ReferenceField(Conversation, required=True)

    def clean(self):
        if not self.created_at:
            self.created_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)

    meta = {
        "collection": "messages",
        "ordering": ["-created_at"],
        "indexes": ["content"],
        "allow_inheritance": False,
        "strict": False,
    }