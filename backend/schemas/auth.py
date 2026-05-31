from pydantic import BaseModel, SecretStr


class LoginRequest(BaseModel):
    login: str
    password: SecretStr


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
