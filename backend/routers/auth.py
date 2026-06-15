import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Response, Cookie, HTTPException, status, Request
import jwt
from core.ratelimit import limiter
from core.config import settings
from core.security import (
    get_current_user, create_access_token, create_refresh_token,
    _credentials_exception, decode_access_token, hash_password,
)
from core.redis import (
    blacklist_token, is_token_blacklisted,
    store_reset_token, get_reset_token_user_id, delete_reset_token,
)
from core.email import send_password_reset_email
from schemas.auth import LoginRequest, TokenResponse, ForgotPasswordRequest, ResetPasswordRequest
from schemas.user import UserResponse
from services.auth import authenticate_user

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5 per minute")
def login_endpoint(credentials: LoginRequest, response: Response, request: Request):
    tokens = authenticate_user(credentials)

    response.set_cookie(
        key="refresh_token",
        value=tokens["refresh_token"],
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    )
    response.set_cookie(
        key="access_token",
        value=tokens["access_token"],
        httponly=False,
        secure=True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return TokenResponse(access_token=tokens["access_token"])


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("30 per minute")
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

        jti = payload.get("jti")
        exp = payload.get("exp")
        if jti and is_token_blacklisted(jti):
            raise _credentials_exception()

        user_id = payload.get("sub")
        new_access_token = create_access_token(subject=user_id)
        new_refresh_token = create_refresh_token(subject=user_id)

        now = int(datetime.now(timezone.utc).timestamp())
        if jti and exp and exp > now:
            blacklist_token(jti, exp - now)

        response.set_cookie(
            key="refresh_token",
            value=new_refresh_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        )
        response.set_cookie(
            key="access_token",
            value=new_access_token,
            httponly=False,
            secure=True,
            samesite="lax",
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

        return TokenResponse(access_token=new_access_token)
    except Exception:
        raise _credentials_exception()


@router.post("/logout")
def logout_endpoint(
    response: Response,
    request: Request,
    current_user=Depends(get_current_user),
    refresh_token: str | None = Cookie(None),
):
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ")[1]
            payload = decode_access_token(token)
            jti = payload.get("jti")
            exp = payload.get("exp")
            now = int(datetime.now(timezone.utc).timestamp())
            if jti and exp > now:
                blacklist_token(jti, exp - now)
        except Exception:
            pass

    if refresh_token:
        try:
            payload = jwt.decode(
                refresh_token,
                settings.JWT_PUBLIC_KEY.replace("\\n", "\n"),
                algorithms=[settings.JWT_ALGORITHM],
                options={"verify_exp": False},
            )
            jti = payload.get("jti")
            exp = payload.get("exp")
            now = int(datetime.now(timezone.utc).timestamp())
            if jti and exp > now:
                blacklist_token(jti, exp - now)
        except Exception:
            pass

    response.delete_cookie("refresh_token")
    response.delete_cookie("access_token")
    return {"detail": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
def get_current_user_endpoint(current_user=Depends(get_current_user)):
    return current_user


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit("3 per minute")
def forgot_password_endpoint(body: ForgotPasswordRequest, request: Request):
    from models.user import User

    user = User.objects(email=body.email).first()  # type: ignore
    if not user:
        return {"detail": "If that email is registered, a reset link has been sent."}

    token = secrets.token_urlsafe(32)
    expire_seconds = settings.PASSWORD_RESET_EXPIRE_MINUTES * 60
    store_reset_token(token, str(user.id), expire_seconds)

    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    try:
        send_password_reset_email(to_email=user.email, reset_link=reset_link)
    except Exception:
        pass

    return {"detail": "If that email is registered, a reset link has been sent."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
@limiter.limit("5 per minute")
def reset_password_endpoint(body: ResetPasswordRequest, request: Request):
    user_id = get_reset_token_user_id(body.token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token.",
        )

    from models.user import User

    user = User.objects(id=user_id).first()  # type: ignore
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token.")

    new_password = body.new_password.get_secret_value()
    if len(new_password) < 8:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Password must be at least 8 characters.")

    user.update(set__password=hash_password(new_password))
    delete_reset_token(body.token)

    return {"detail": "Password updated successfully."}
