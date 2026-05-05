from mongoengine import CASCADE, PULL, Document, ListField, ReferenceField, StringField, DateTimeField, ValidationError
import backend.models.direct_message as direct_message
import backend.models.user as user
from datetime import datetime, timezone


class SizedListField(ListField):
    def __init__(self, field=None, max_length=None, **kwargs):
        self.max_length = max_length
        super(SizedListField, self).__init__(field, **kwargs)

    def validate(self, value):
        # Call base validation first
        super(SizedListField, self).validate(value)
        # Check size directly on the instance value
        if self.max_length is not None and len(value) > self.max_length:
            raise ValidationError(f'List exceeds max_length of {self.max_length}')

class Conversation(Document):
    members = SizedListField(ReferenceField(user, reverse_delete_rule=CASCADE), max_length=2)
    created_at = DateTimeField(default= datetime.now(timezone.utc))
    updated_at = DateTimeField(required=False)

    def clean(self):
        if not self.created_at:
            self.created_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)

    meta = {
        "collection" : "conversations",
        "ordering": ["-created_at"],
        "indexes": ["members"],
        "allow_inheritance": False,
        "strict": True,
    }