from starlette.types import ASGIApp, Receive, Scope, Send
from starlette.responses import Response
from core.config import settings


class RequestSizeLimiterMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app
        self.max_size = settings.MAX_REQUEST_SIZE

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers", []))
        content_length = headers.get(b"content-length")
        if content_length:
            if int(content_length) > self.max_size:
                response = Response(
                    content="Request body too large",
                    status_code=413
                )
                await response(scope, receive, send)
                return

        total_received = 0

        async def receive_with_size_limit():
            nonlocal total_received

            message = await receive()

            if message["type"] == "http.request":
                total_received += len(message.get("body", b""))

                if total_received > self.max_size:
                    response = Response(
                        content="Request body too large",
                        status_code=413
                    )
                    await response(scope, receive, send)
                    # Raise to break out of the app's receive loop
                    raise RuntimeError("Request body exceeded size limit")

            return message

        try:
            await self.app(scope, receive_with_size_limit, send)
        except RuntimeError as e:
            if "exceeded size limit" not in str(e):
                raise