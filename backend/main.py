import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.sessions import SessionMiddleware
from contextlib import asynccontextmanager
from core.config import settings
from core.database import connect_db, disconnect_db
from routers import user, conversation, direct_message, group, group_message, contact, auth, websocket
from core.ratelimit import limiter, RateLimitExceeded, _rate_limit_exceeded_handler
from core.middlewares.security_headers import SecurityHeadersMiddleware
from core.middlewares.maintenance import MaintenanceModeMiddleware
from core.middlewares.size_limit import RequestSizeLimiterMiddleware
from core.middlewares.logging import LoggingMiddleware
from core.middlewares.user_context import UserContextMiddleware
from core.middlewares.request_id import RequestIdMiddleware
from core.middlewares.timeout import TimeoutMiddleware
from core.middlewares.error_handling import ErrorHandlerMiddleware


from core.websocket import manager as ws_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up...") 
    connect_db()
    await ws_manager.start()

    
    yield  # This hands control back to the FastAPI app
    
    print("Shutting down...")
    await ws_manager.stop()
    disconnect_db()


app = FastAPI(lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=settings.ALLOWED_HOSTS
)

# Custom Middlewares - Order of execution (Request phase) is bottom to top
app.add_middleware(RequestSizeLimiterMiddleware)
app.add_middleware(UserContextMiddleware)
app.add_middleware(MaintenanceModeMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(TimeoutMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(RequestIdMiddleware)
app.add_middleware(ErrorHandlerMiddleware)

app.add_middleware(
    SessionMiddleware, 
    secret_key=settings.SESSION_SECRET_KEY
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=500)

app.include_router(user.router, prefix="/users", tags=["users"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(websocket.router, tags=["websocket"])
app.include_router(conversation.router, prefix="/conversations", tags=["conversations"])
app.include_router(direct_message.router, prefix="/direct-messages", tags=["direct_messages"])
app.include_router(group.router, prefix="/groups", tags=["groups"])
app.include_router(group_message.router, prefix="/group-messages", tags=["group_messages"])
app.include_router(contact.router, prefix="/contacts", tags=["contacts"])
