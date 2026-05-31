import asyncio
import logging
from fastapi import Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware
from core.config import settings

logger = logging.getLogger("api_middleware")

class TimeoutMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = getattr(request.state, "request_id", "unknown")
        try:
            return await asyncio.wait_for(call_next(request), timeout=settings.REQUEST_TIMEOUT)
        except asyncio.TimeoutError:
            logger.error(f"RID: {request_id} | Timeout")
            return Response(content="Request Timeout", status_code=status.HTTP_504_GATEWAY_TIMEOUT)
