from mongoengine import Document, StringField, EmailField, DateField
from datetime import datetime
from dateutil.relativedelta import relativedelta
import re

def check_birthdate(given_date):
    now = datetime.now()
    if given_date > now - relativedelta(years= 10):
        raise ValueError("Date is wrong.")

def check_passwork(given_pwd):
    pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"

    if not re.findall(pattern, given_pwd):
        raise ValueError("Password's too short.")

class User(Document):
    email = EmailField(required=True, unique=True)
    first_name = StringField(required=True, max_length=50)
    last_name = StringField(required=True, max_length=50)
    birthdate = DateField(required=True, validation=check_birthdate)
    username = StringField(rquired=True, unique=True)
    password = StringField(required=True, validate=check_passwork)