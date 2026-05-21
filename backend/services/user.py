from mongoengine.errors import DoesNotExist
from models.user import User
from schemas.user import UserCreate, UserUpdate
from fastapi import HTTPException
from passlib.context import CryptContext


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


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
            password=pwd_context.hash(data.password.get_secret_value()),
        )
        user.save()
        print("SAVED USER:", user.to_json())
        return user
    except Exception as e:
        print("SAVE ERROR:", str(e))
        raise


def update_user(user_id: str, data: UserUpdate) -> User:
    try:
        user = User.objects(id=user_id).first()  # type: ignore
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        update_data = data.model_dump(exclude_none=True, exclude={"password", "updated_at"})
        if data.password is not None:
            update_data["password"] = pwd_context.hash(data.password.get_secret_value())
        if not update_data:
            return user
        user.update(**update_data)
        user.reload()
        return user
    except HTTPException:
        raise
    except Exception as e:
        print("UPDATE ERROR:", str(e))
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
        print("GET BY ID ERROR:", str(e))
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
        print("GET BY EMAIL ERROR:", str(e))
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
        print("GET BY USERNAME ERROR:", str(e))
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
        print("DELETE ERROR:", str(e))
        raise