from datetime import datetime, timezone

from mongoengine import CASCADE, Document, DateTimeField, ListField, ReferenceField


class Contact(Document):
    user = ReferenceField("User", reverse_delete_rule=CASCADE, required=True, unique=True)
    contacts = ListField(ReferenceField("User", reverse_delete_rule=CASCADE))
    created_at = DateTimeField(default=lambda: datetime.now(timezone.utc))
    updated_at = DateTimeField(required=False)

    def clean(self):
        if not self.created_at:
            self.created_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)

    meta = {
        "collection": "contacts",
        "ordering": ["-created_at"],
        "indexes": ["user", "contacts"],
        "allow_inheritance": False,
        "strict": True,
    }
