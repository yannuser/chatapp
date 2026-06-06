import logging
import mongoengine
from starlette.types import ASGIApp, Receive, Scope, Send
from starlette.responses import Response

logger = logging.getLogger("api_middleware")

class ErrorHandlerMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request_id = scope.get("state", {}).get("request_id", "unknown")
        try:
            await self.app(scope, receive, send)
        except mongoengine.errors.ValidationError as e:
            logger.warning(f"RID: {request_id} | Validation Error: {str(e)}")
            response = Response(
                content=str(e),
                status_code=400
            )
            await response(scope, receive, send)
        except mongoengine.errors.NotUniqueError as e:
            logger.warning(f"RID: {request_id} | Unique Constraint Error: {str(e)}")
            response = Response(
                content="Resource already exists",
                status_code=409
            )
            await response(scope, receive, send)
        except Exception as e:
            logger.error(f"RID: {request_id} | Global Error: {str(e)}", exc_info=True)
            response = Response(
                content="Internal Server Error", 
                status_code=500
            )
            await response(scope, receive, send)
