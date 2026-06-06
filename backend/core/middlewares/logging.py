import time
import logging
import json
from starlette.types import ASGIApp, Receive, Scope, Send
from core.config import settings

logger = logging.getLogger("api_middleware")

class LoggingMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request_id = scope.get("state", {}).get("request_id", "unknown")
        user_id = scope.get("state", {}).get("user_id", None)
        
        start_time = time.time()
        
        user_info = f" | User: {user_id}" if user_id else ""
        logger.info(f"RID: {request_id}{user_info} | Start | {scope['method']} {scope['path']}")

        body = b""
        
        async def receive_wrapper():
            nonlocal body
            message = await receive()
            if settings.DEBUG and message["type"] == "http.request":
                body += message.get("body", b"")
                if not message.get("more_body", False):
                    # Request body fully received
                    try:
                        request_body = json.loads(body)
                    except Exception:
                        try:
                            request_body = body.decode()
                        except Exception:
                            request_body = "<binary data>"
                    
                    if request_body:
                        log_body = request_body
                        if isinstance(log_body, dict):
                            log_body = log_body.copy()
                            for key in ["password", "token", "access_token", "refresh_token", "secret"]:
                                if key in log_body:
                                    log_body[key] = "********"
                        logger.info(f"RID: {request_id} | Body: {log_body}")
            return message

        status_code = [None]

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                status_code[0] = message["status"]
            
            if message["type"] == "http.response.body":
                # Only log end on the last chunk
                if not message.get("more_body", False):
                    process_time = time.time() - start_time
                    logger.info(f"RID: {request_id} | End | Status: {status_code[0]} | Time: {process_time:.4f}s")
            
            await send(message)

        await self.app(scope, receive_wrapper, send_wrapper)
