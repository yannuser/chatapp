import logging
from fastapi import Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("api_middleware")

class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = getattr(request.state, "request_id", "unknown")
        try:
            return await call_next(request)
        except Exception as e:
            logger.error(f"RID: {request_id} | Global Error: {str(e)}", exc_info=True)
            return Response(
                content="Internal Server Error", 
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
