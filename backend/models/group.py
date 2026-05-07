from mongoengine import Document, StringField, ReferenceField, CASCADE, ListField, DateTimeField
import backend.models.user as user
from datetime import datetime, timezone


class Group(Document):
    title = StringField(max_length=100, default="New Group")
    description = StringField(max_length=5000, required=True)
    members = ListField(ReferenceField(user, reverse_delete_rule=CASCADE))
    creator = ReferenceField(user, reverse_delete_rule=CASCADE, required=True)
    created_at = DateTimeField(default =lambda: datetime.now(timezone.utc))
    updated_at = DateTimeField(required=False)

    def clean(self):
        if not self.created_at:
            self.created_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)

    meta = {
        "collection" : "groups",
        "ordering": ["-created_at"],
        "indexes": ["title"],
        "allow_inheritance": False,
        "strict": True,
    }