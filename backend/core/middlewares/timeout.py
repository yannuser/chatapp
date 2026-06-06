import asyncio
import logging
from starlette.types import ASGIApp, Receive, Scope, Send
from starlette.responses import Response
from core.config import settings

logger = logging.getLogger("api_middleware")

class TimeoutMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request_id = scope.get("state", {}).get("request_id", "unknown")
        
        try:
            await asyncio.wait_for(
                self.app(scope, receive, send),
                timeout=settings.REQUEST_TIMEOUT
            )
        except asyncio.TimeoutError:
            logger.error(f"RID: {request_id} | Timeout")
            response = Response(content="Request Timeout", status_code=504)
            await response(scope, receive, send)
