import logging
from core.security import hash_password
from models.user import User
from schemas.user import UserCreate, UserUpdate
from fastapi import HTTPException

logger = logging.getLogger("user_service")


def create_user(data: UserCreate) -> User:
    try:
        if User.objects(email=data.email).first():  # type: ignore
            raise HTTPException(status_code=400, detail="Email already registered")
        if User.objects(username=data.username).first():  # type: ignore
            raise HTTPException(status_code=400, detail="Username already taken")
        user = User(
            email=data.email,
            first_name=data.first_name,
            last_name=data.last_name,
            birthdate=data.birthdate,
            username=data.username,
            password=hash_password(data.password.get_secret_value()),
        )
        user.save()
        return user
    except Exception as e:
        logger.error(f"CREATE USER ERROR: {str(e)}", exc_info=True)
        raise


def update_user(user_id: str, data: UserUpdate) -> User:
    try:
        user = User.objects(id=user_id).first()  # type: ignore
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        update_data = data.model_dump(exclude_none=True, exclude={"password", "updated_at"})
        if data.password is not None:
            update_data["password"] = hash_password(data.password.get_secret_value())
        if not update_data:
            return user
        user.update(**update_data)
        user.reload()
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"UPDATE USER ERROR: {str(e)}", exc_info=True)
        raise


def get_user_by_id(user_id: str) -> User:
    try:
        user = User.objects(id=user_id).first()  # type: ignore
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"GET USER BY ID ERROR: {str(e)}", exc_info=True)
        raise


def get_by_email(user_email: str) -> User:
    try:
        user = User.objects(email=user_email).first()  # type: ignore
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"GET USER BY EMAIL ERROR: {str(e)}", exc_info=True)
        raise


def get_by_username(user_username: str) -> User:
    try:
        user = User.objects(username=user_username).first()  # type: ignore
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"GET USER BY USERNAME ERROR: {str(e)}", exc_info=True)
        raise


def delete_user(user_id: str) -> None:
    try:
        user = User.objects(id=user_id).first()  # type: ignore
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.delete()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"DELETE USER ERROR: {str(e)}", exc_info=True)
        raise
