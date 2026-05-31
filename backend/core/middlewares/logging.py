import time
import logging
import json
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import Message
from core.config import settings

logger = logging.getLogger("api_middleware")

class LoggingMiddleware(BaseHTTPMiddleware):
    async def set_body(self, request: Request, body: bytes):
        async def receive() -> Message:
            return {"type": "http.request", "body": body}
        request._receive = receive

    async def dispatch(self, request: Request, call_next):
        request_id = getattr(request.state, "request_id", "unknown")
        user_id = getattr(request.state, "user_id", None)
        
        request_body = None
        if settings.DEBUG:
            body = await request.body()
            await self.set_body(request, body)
            try:
                if body:
                    request_body = json.loads(body)
            except Exception:
                try:
                    request_body = body.decode()
                except Exception:
                    request_body = "<binary data>"

        start_time = time.time()
        
        user_info = f" | User: {user_id}" if user_id else ""
        logger.info(f"RID: {request_id}{user_info} | Start | {request.method} {request.url.path}")
        if settings.DEBUG and request_body:
            logger.info(f"RID: {request_id} | Body: {request_body}")

        response = await call_next(request)
        
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)

        logger.info(f"RID: {request_id} | End | Status: {response.status_code} | Time: {process_time:.4f}s")
        
        return response
