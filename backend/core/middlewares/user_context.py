from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from core.security import decode_access_token

class UserContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request.state.user_id = None
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            try:
                token = auth_header.split(" ")[1]
                payload = decode_access_token(token)
                request.state.user_id = payload.get("sub")
            except Exception:
                pass
        
        return await call_next(request)
