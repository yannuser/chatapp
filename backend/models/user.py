from mongoengine import Document, StringField, EmailField, DateField, DateTimeField, IntField
from datetime import datetime, timezone, date
from dateutil.relativedelta import relativedelta
import re


def validate_birthdate(given_date : date):
    if given_date > datetime.today().date() - relativedelta(years= 10):
        raise ValueError("Date is wrong.")


def validate_username(given_username):
    pattern = r"^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$"
    if not re.match(pattern, given_username):
        raise ValueError("Username is not valid")


class User(Document):
    email = EmailField(required=True, unique=True)
    first_name = StringField(required=True, max_length=250)
    last_name = StringField(required=True, max_length=250)
    birthdate = DateField(required=True, validation=validate_birthdate)
    username = StringField(required=True, unique=True, max_length=150, validation=validate_username)
    password = StringField(required=True)
    created_at = DateTimeField(default=lambda: datetime.now(timezone.utc))
    updated_at = DateTimeField(required=False)
    
    failed_login_attempts = IntField(default=0)
    locked_until = DateTimeField(required=False)

    def clean(self):
        if not self.created_at:
            self.created_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)

    meta = {
        "collection" : "users",
        "ordering": ["-created_at"],
        "indexes": ["email", "username", "first_name", "locked_until"],
        "allow_inheritance": False,
        "strict": True,
    }
