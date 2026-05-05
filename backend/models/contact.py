from mongoengine import Document, StringField, EmailField, DateTimeField, DateField, ReferenceField
from  datetime import datetime, timezone
from dateutil.relativedelta import relativedelta
import backend.models.user as user
import re

def check_birthdate(given_date):
    now = datetime.now()
    if given_date > now - relativedelta(years= 10):
        raise ValueError("Date is wrong.")

class Contact(Document):
    user = ReferenceField(user, required=True)
    email = EmailField(required=True, unique=True)
    first_name = StringField(required=True, max_length=250)
    last_name = StringField(required=True, max_length=250)
    birthdate = DateField(required=True, validation=check_birthdate)
    username = StringField(required=True, unique=True, max_length=150)
    created_at = DateTimeField(default= datetime.now(timezone.utc))
    updated_at = DateTimeField(required=False)

    meta = {
        "collection" : "conversations",
        "ordering": ["-created_at"],
        "indexes": ["members"],
        "allow_inheritance": False,
        "strict": True,
    }