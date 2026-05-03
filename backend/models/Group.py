from mongoengine import Document, StringField, ReferenceField, CASCADE, ListField, DateTimeField
import User
import backend.models.DirectMessage as DirectMessage
from datetime import datetime, timezone


class Group(Document):
    title = StringField(max_length=100, default="New Group")
    description = StringField(max_length=5000, null=True)
    members = ListField(ReferenceField(User, reverse_delete_rule=CASCADE))
    creator = ReferenceField(User, reverse_delete_rule=CASCADE, required=True)
    created_at = DateTimeField(default = datetime.now(timezone.utc))
    messeges = ListField(ReferenceField(DirectMessage, reverse_delete_rule=CASCADE))

    meta = {
        "collection" : "groups",
        "ordering": ["-created_at"],
        "indexes": ["title"],
        "allow_inheritance": False,
        "strict": True,
    }