# app/routers/users.py
from fastapi import APIRouter, Request
from core.ratelimit import limiter
from schemas.user import UserCreate, UserUpdate, UserResponse
from services.user import create_user, update_user, get_user_by_id, get_by_email, get_by_username, delete_user


router = APIRouter()


@router.post("/", response_model=UserResponse, status_code=201)
@limiter.limit("3 per minute")
def create_user_endpoint(user: UserCreate, request: Request):
    return create_user(user)


@router.get("/email/{email}", response_model=UserResponse)
def get_user_by_email_endpoint(email: str):
    return get_by_email(email)


@router.get("/username/{username}", response_model=UserResponse)
def get_user_by_username_endpoint(username: str):
    return get_by_username(username)


@router.get("/{user_id}", response_model=UserResponse)
def get_user_endpoint(user_id: str):
    return get_user_by_id(user_id)


@router.put("/{user_id}", response_model=UserResponse)
def update_user_endpoint(user_id: str, user_update: UserUpdate):
    return update_user(user_id, user_update)


@router.delete("/{user_id}", status_code=204)
def delete_user_endpoint(user_id: str):
    delete_user(user_id)
    return None
