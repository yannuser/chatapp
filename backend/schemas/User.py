from pydantic import BaseModel, EmailStr, SecretStr, Field, field_validator, model_validator
from datetime import datetime, date
import bcrypt
import re


class UserCreate(BaseModel):
    email :EmailStr
    first_name : str
    last_name : str
    birthdate : date
    username : str
    password :  SecretStr
    created_at : datetime
    updated_at : datetime

    @field_validator("password")
    @classmethod
    def validate_password(cls, hashed_password: SecretStr) -> SecretStr:
        password = hashed_password.get_secret_value()
        pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in password):
            raise ValueError("Password must contain an uppercase letter")
        if not any(c.isdigit() for c in password):
            raise ValueError("Password must contain a digit")
        if not re.findall(pattern, password):
            raise ValueError("Password not right")
        return hashed_password
    
    @field_validator("username")
    @classmethod
    def validate_username(cls, username : str) ->  str:
        pattern = r"^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$"
        if not re.findall(pattern, username):
            raise ValueError("Username is not valid")  
        return username      

    @model_validator(mode="after")
    def hash_password(self) -> "UserCreate":
        raw = self.password.get_secret_value().encode()
        self.hashed_password = bcrypt.hashpw(raw, bcrypt.gensalt()).decode()
        return self
    
class UserResponse(BaseModel):
    email :EmailStr
    first_name : str
    last_name : str
    birthdate : date
    username : str
    password :  SecretStr = Field(exclude=True)
    created_at : datetime
    updated_at : datetime

    model_config = {"json_encoders": {SecretStr: lambda v: None}}