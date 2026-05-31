from fastapi import Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware
from core.config import settings

class RequestSizeLimiterMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > settings.MAX_REQUEST_SIZE:
            return Response(
                content="Request body too large", 
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
            )
        return await call_next(request)
