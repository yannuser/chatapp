from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from core.redis import REDIS_URL
from core.config import settings

limiter_kwargs = {
    "key_func": get_remote_address,
    "default_limits": ["200 per minute"],
    "enabled": not settings.TESTING
}

if settings.REDIS_ENABLED:
    limiter_kwargs["storage_uri"] = REDIS_URL

limiter = Limiter(**limiter_kwargs)
