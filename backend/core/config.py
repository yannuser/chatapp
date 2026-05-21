from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")
    MONGO_URI: str
    MONGO_DB: str = "chatapp"
    # SECRET_KEY: str

settings = Settings()