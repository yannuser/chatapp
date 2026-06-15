from pydantic import BaseModel, SecretStr, EmailStr


class LoginRequest(BaseModel):
    login: str
    password: SecretStr


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: SecretStr
