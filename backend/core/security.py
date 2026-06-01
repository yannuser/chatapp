import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from fastapi import Depends, HTTPException, status, WebSocket, Query
from fastapi.security import OAuth2PasswordBearer
from jwt import InvalidTokenError
from passlib.context import CryptContext

from core.config import settings
from core.redis import is_token_blacklisted


pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def _credentials_exception() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    now = datetime.now(timezone.utc)
    expire = now + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {
        "sub": subject,
        "token_use": "access",
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
        "iat": int(now.timestamp()),
        "nbf": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "jti": str(uuid.uuid4()),
    }
    headers = {"kid": settings.JWT_KEY_ID, "typ": "JWT"}
    return jwt.encode(
        payload,
        settings.JWT_PRIVATE_KEY.replace("\\n", "\n"),
        algorithm=settings.JWT_ALGORITHM,
        headers=headers,
    )


def create_refresh_token(subject: str) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": subject,
        "token_use": "refresh",
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "jti": str(uuid.uuid4()),
    }
    headers = {"kid": settings.JWT_KEY_ID, "typ": "JWT"}
    return jwt.encode(
        payload,
        settings.JWT_PRIVATE_KEY.replace("\\n", "\n"),
        algorithm=settings.JWT_ALGORITHM,
        headers=headers,
    )


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        unverified_header = jwt.get_unverified_header(token)
        if unverified_header.get("alg") != settings.JWT_ALGORITHM:
            raise _credentials_exception()
        if unverified_header.get("kid") != settings.JWT_KEY_ID:
            raise _credentials_exception()

        payload = jwt.decode(
            token,
            settings.JWT_PUBLIC_KEY.replace("\\n", "\n"),
            algorithms=[settings.JWT_ALGORITHM],
            audience=settings.JWT_AUDIENCE,
            issuer=settings.JWT_ISSUER,
            options={
                "require": ["sub", "token_use", "iss", "aud", "iat", "nbf", "exp", "jti"],
            },
        )
        
        if is_token_blacklisted(payload.get("jti")):
            raise _credentials_exception()

        if payload.get("token_use") != "access":
            raise _credentials_exception()
        return payload
    except HTTPException:
        raise
    except InvalidTokenError:
        raise _credentials_exception()


def get_current_user(token: str = Depends(oauth2_scheme)):
    from models.user import User

    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise _credentials_exception()

    user = User.objects(id=user_id).first()  # type: ignore
    if not user:
        raise _credentials_exception()
    return user


async def get_current_user_ws(
    websocket: WebSocket,
    token: str | None = Query(None),
):
    from models.user import User

    if token is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None

    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return None

        user = User.objects(id=user_id).first()  # type: ignore
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return None
        return user
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None
