import time
import uuid
import logging
import asyncio
import json
from fastapi import Request, Response, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import Message
from core.config import settings
from core.security import decode_access_token

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api_middleware")

class AdvancedMiddleware(BaseHTTPMiddleware):
    async def set_body(self, request: Request, body: bytes):
        async def receive() -> Message:
            return {"type": "http.request", "body": body}
        request._receive = receive

    async def dispatch(self, request: Request, call_next):
        # 3. Request ID Injection
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        # 4. User Context Middleware
        request.state.user_id = None
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            try:
                token = auth_header.split(" ")[1]
                payload = decode_access_token(token)
                request.state.user_id = payload.get("sub")
            except Exception:
                # We don't fail the request here, just don't set user_id
                # Authentication is usually handled by dependencies or guards
                pass

        # 10. Maintenance Mode Middleware
        if settings.MAINTENANCE_MODE:
            return Response(
                content="System is under maintenance", 
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # 6. Request Size Limiter
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > settings.MAX_REQUEST_SIZE:
            return Response(
                content="Request body too large", 
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
            )

        # 9. Request Body Capture for Debugging
        request_body = None
        if settings.DEBUG:
            # Reading the body can consume the stream, so we reset it
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
        
        # 1. Request Logging (Start)
        user_info = f" | User: {request.state.user_id}" if request.state.user_id else ""
        logger.info(f"RID: {request_id}{user_info} | Start | {request.method} {request.url.path}")
        if settings.DEBUG and request_body:
            logger.info(f"RID: {request_id} | Body: {request_body}")

        try:
            # 14. Timeout Middleware
            response = await asyncio.wait_for(call_next(request), timeout=settings.REQUEST_TIMEOUT)
            
            # 2. Response Time Tracker (X-Process-Time)
            process_time = time.time() - start_time
            response.headers["X-Process-Time"] = str(process_time)
            response.headers["X-Request-ID"] = request_id

            # 8. Security Header Injector
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["X-XSS-Protection"] = "1; mode=block"
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            response.headers["Content-Security-Policy"] = "default-src 'self'"

            # 1. Request Logging (End)
            logger.info(f"RID: {request_id} | End | Status: {response.status_code} | Time: {process_time:.4f}s")
            
            return response

        except asyncio.TimeoutError:
            logger.error(f"RID: {request_id} | Timeout")
            return Response(content="Request Timeout", status_code=status.HTTP_504_GATEWAY_TIMEOUT)
        
        except Exception as e:
            # 7. Custom Error Handling Middleware
            logger.error(f"RID: {request_id} | Global Error: {str(e)}", exc_info=True)
            return Response(
                content="Internal Server Error", 
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
