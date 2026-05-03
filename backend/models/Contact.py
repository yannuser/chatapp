from mongoengine import Document, StringField, EmailField, DateTimeField, DateField, ReferenceField
from  datetime import datetime, timezone
from dateutil.relativedelta import relativedelta
import User
import re

def check_birthdate(given_date):
    now = datetime.now()
    if given_date > now - relativedelta(years= 10):
        raise ValueError("Date is wrong.")

def check_password(given_pwd):
    pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"

    if not re.findall(pattern, given_pwd):
        raise ValueError("Password not right")

class Contact(Document):
    user = ReferenceField(User, required=True)
    email = EmailField(required=True, unique=True)
    first_name = StringField(required=True, max_length=250)
    last_name = StringField(required=True, max_length=250)
    birthdate = DateField(required=True, validation=check_birthdate)
    username = StringField(required=True, unique=True, max_length=150)
    password = StringField(required=True, validation=check_password)
    created_at = DateTimeField(default= datetime.now(timezone.utc))
    updated_at = DateTimeField()

    meta = {
        "collection" : "conversations",
        "ordering": ["-created_at"],
        "indexes": ["members"],
        "allow_inheritance": False,
        "strict": True,
    }