import redis
import redis.asyncio as async_redis
from core.config import settings


REDIS_URL = f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}"
if settings.REDIS_PASSWORD:
    REDIS_URL = f"redis://:{settings.REDIS_PASSWORD}@{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}"

redis_client = (
    redis.Redis.from_url(REDIS_URL, decode_responses=True)
    if settings.REDIS_ENABLED
    else None
)

async_redis_client = (
    async_redis.from_url(REDIS_URL, decode_responses=True)
    if settings.REDIS_ENABLED
    else None
)


def blacklist_token(jti: str, expire_seconds: int):
    if redis_client is None:
        return
    redis_client.setex(f"blacklist:{jti}", expire_seconds, "true")


def is_token_blacklisted(jti: str) -> bool:
    if redis_client is None:
        return False
    return redis_client.exists(f"blacklist:{jti}") > 0


def store_reset_token(token: str, user_id: str, expire_seconds: int):
    if redis_client is None:
        return
    redis_client.setex(f"reset:{token}", expire_seconds, user_id)


def get_reset_token_user_id(token: str) -> str | None:
    if redis_client is None:
        return None
    return redis_client.get(f"reset:{token}")


def delete_reset_token(token: str):
    if redis_client is None:
        return
    redis_client.delete(f"reset:{token}")
