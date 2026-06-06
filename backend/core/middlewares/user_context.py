from starlette.types import ASGIApp, Receive, Scope, Send
from core.security import decode_access_token

class UserContextMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        user_id = None
        headers = dict(scope.get("headers", []))
        auth_header = headers.get(b"authorization")
        if auth_header and auth_header.startswith(b"Bearer "):
            try:
                token = auth_header.split(b" ")[1].decode()
                payload = decode_access_token(token)
                user_id = payload.get("sub")
            except Exception:
                pass
        
        if "state" not in scope:
            scope["state"] = {}
        scope["state"]["user_id"] = user_id

        await self.app(scope, receive, send)
