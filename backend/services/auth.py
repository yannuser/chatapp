from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, status
from core.config import settings
from core.security import create_access_token, create_refresh_token, verify_password
from models.user import User
from schemas.auth import LoginRequest, TokenResponse


def authenticate_user(data: LoginRequest) -> dict:
    user = (
        User.objects(email=data.login).first()  # type: ignore
        or User.objects(username=data.login).first()  # type: ignore
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect login or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.locked_until and user.locked_until > datetime.now(timezone.utc):
        remaining = int((user.locked_until - datetime.now(timezone.utc)).total_seconds() / 60)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is locked. Try again in {remaining} minutes.",
        )

    if not verify_password(data.password.get_secret_value(), user.password):
        user.update(inc__failed_login_attempts=1)
        user.reload()
        
        if user.failed_login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
            locked_until = datetime.now(timezone.utc) + timedelta(minutes=settings.LOCKOUT_DURATION_MINUTES)
            user.update(set__locked_until=locked_until)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Too many failed attempts. Account locked for {settings.LOCKOUT_DURATION_MINUTES} minutes.",
            )
            
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect login or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user.update(set__failed_login_attempts=0, set__locked_until=None)
    
    return {
        "access_token": create_access_token(subject=str(user.id)),
        "refresh_token": create_refresh_token(subject=str(user.id))
    }
