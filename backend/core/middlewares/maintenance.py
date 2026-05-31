from fastapi import Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware
from core.config import settings

class MaintenanceModeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if settings.MAINTENANCE_MODE:
            return Response(
                content="System is under maintenance", 
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        return await call_next(request)
