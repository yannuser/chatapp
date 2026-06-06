import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    )
    MONGO_URI: str
    MONGO_DB: str = "chatapp"
    JWT_PRIVATE_KEY: str
    JWT_PUBLIC_KEY: str
    JWT_ALGORITHM: str = "RS256"
    JWT_ISSUER: str = "chatapp-api"
    JWT_AUDIENCE: str = "chatapp-client"
    JWT_KEY_ID: str = "local-dev-key"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str | None = None
    REDIS_ENABLED: bool = False

    MAX_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_DURATION_MINUTES: int = 15

    ALLOWED_HOSTS: list[str] = ["*"]
    ALLOWED_ORIGINS: list[str] = ["*"]

    DEBUG: bool = False
    TESTING: bool = False

    MAINTENANCE_MODE: bool = False
    MAX_REQUEST_SIZE: int = 5 * 1024 * 1024  # 5MB
    REQUEST_TIMEOUT: int = 30 
    SESSION_SECRET_KEY: str 

settings = Settings()
