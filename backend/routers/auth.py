from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Response, Cookie, HTTPException, status, Request
import jwt
from core.ratelimit import limiter
from core.config import settings
from core.security import get_current_user, create_access_token, create_refresh_token, _credentials_exception
from core.redis import blacklist_token
from schemas.auth import LoginRequest, TokenResponse
from schemas.user import UserResponse
from services.auth import authenticate_user

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5 per minute")
def login_endpoint(credentials: LoginRequest, response: Response, request: Request):
    tokens = authenticate_user(credentials)
    
    # Set refresh token in HttpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=tokens["refresh_token"],
        httponly=True,
        secure=True,  # Should be True in production
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )
    
    return TokenResponse(access_token=tokens["access_token"])


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("5 per minute")
def refresh_token_endpoint(response: Response, request: Request, refresh_token: str | None = Cookie(None)):
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing")
    
    try:
        payload = jwt.decode(
            refresh_token,
            settings.JWT_PUBLIC_KEY.replace("\\n", "\n"),
            algorithms=[settings.JWT_ALGORITHM],
            audience=settings.JWT_AUDIENCE,
            issuer=settings.JWT_ISSUER,
        )
        if payload.get("token_use") != "refresh":
            raise _credentials_exception()
        
        user_id = payload.get("sub")
        new_access_token = create_access_token(subject=user_id)
        new_refresh_token = create_refresh_token(subject=user_id)
        
        # Rotate refresh token
        response.set_cookie(
            key="refresh_token",
            value=new_refresh_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
        )
        
        return TokenResponse(access_token=new_access_token)
    except Exception:
        raise _credentials_exception()


@router.post("/logout")
def logout_endpoint(
    response: Response, 
    current_user = Depends(get_current_user),
    refresh_token: str | None = Cookie(None)
):
    # Blacklist the refresh token if provided
    if refresh_token:
        try:
            payload = jwt.decode(
                refresh_token,
                settings.JWT_PUBLIC_KEY.replace("\\n", "\n"),
                algorithms=[settings.JWT_ALGORITHM],
                options={"verify_exp": False} # Get JTI even if expired
            )
            jti = payload.get("jti")
            exp = payload.get("exp")
            now = int(datetime.now(timezone.utc).timestamp())
            if jti and exp > now:
                blacklist_token(jti, exp - now)
        except Exception:
            pass

    response.delete_cookie("refresh_token")
    return {"detail": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
def get_current_user_endpoint(current_user=Depends(get_current_user)):
    return current_user
