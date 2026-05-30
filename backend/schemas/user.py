from typing import Optional
from pydantic import BaseModel, EmailStr, SecretStr, Field, field_validator
from datetime import datetime, date, timezone
from dateutil.relativedelta import relativedelta
import re


USERNAME_PATTERN = r"^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$"
PASSWORD_PATTERN = r"^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$"


class UserCreate(BaseModel):
    email :EmailStr
    first_name : str = Field(max_length=250)
    last_name : str = Field(max_length=250)
    birthdate : date
    username : str = Field(max_length=150)
    password :  SecretStr
    created_at : datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at : Optional[datetime] = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, passwd: SecretStr) -> SecretStr:
        if not re.match(PASSWORD_PATTERN, passwd.get_secret_value()):
            raise ValueError("Password must be at least 8 chars, contain uppercase and lowercase, digit and special character")
        return passwd
    
    @field_validator("username")
    @classmethod
    def validate_username(cls, username : str) ->  str:
        if not re.match(USERNAME_PATTERN, username):
            raise ValueError("Username is not valid")  
        return username

    @field_validator("birthdate")
    @classmethod
    def validate_birthdate(cls, given_date: date) -> date:
        if given_date > date.today() - relativedelta(years=10):
             raise ValueError("You have to be atleast 10yo.") 
        return given_date  
    
    
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = Field(default=None, max_length=250)
    last_name: Optional[str] = Field(default=None, max_length=250)
    birthdate: Optional[date] = None
    username: Optional[str] = Field(default=None, max_length=150)
    password: Optional[SecretStr] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @field_validator("password")
    @classmethod
    def validate_password(cls, passwd: SecretStr) -> SecretStr:
        if not re.match(PASSWORD_PATTERN, passwd.get_secret_value()):
            raise ValueError("Password must be at least 8 chars, contain uppercase and lowercase, digit and special character")
        return passwd
    
    @field_validator("username")
    @classmethod
    def validate_username(cls, username : str) ->  str:
        if not re.match(USERNAME_PATTERN, username):
            raise ValueError("Username is not valid")  
        return username

    @field_validator("birthdate")
    @classmethod
    def validate_birthdate(cls, given_date: date) -> date:
        if given_date > date.today() - relativedelta(years=10):
             raise ValueError("You have to be atleast 10yo.") 
        return given_date 
    

class UserResponse(BaseModel):
    email :EmailStr
    first_name : str
    last_name : str
    birthdate : date
    username : str
    password :  SecretStr = Field(exclude=True)
    created_at : datetime
    updated_at : datetime
