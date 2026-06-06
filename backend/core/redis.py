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
    """
    Adds a token identifier (jti) to the blacklist with an expiration time.
    """
    if redis_client is None:
        return
    redis_client.setex(f"blacklist:{jti}", expire_seconds, "true")


def is_token_blacklisted(jti: str) -> bool:
    """
    Checks if a token identifier (jti) exists in the blacklist.
    """
    if redis_client is None:
        return False
    return redis_client.exists(f"blacklist:{jti}") > 0
