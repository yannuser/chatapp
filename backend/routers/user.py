from typing import List
from fastapi import APIRouter, Query, Request, Depends, HTTPException, status
from core.ratelimit import limiter
from core.security import get_current_user
from schemas.user import UserCreate, UserUpdate, UserResponse
from services.user import (
    create_user,
    update_user,
    get_user_by_id,
    get_user_by_email,
    get_user_by_username,
    search_users,
    delete_user,
)


router = APIRouter()


@router.post("/", response_model=UserResponse, status_code=201)
@limiter.limit("3 per minute")
def create_user_endpoint(user: UserCreate, request: Request):
    return create_user(user)


@router.get("/search", response_model=List[UserResponse])
def search_users_endpoint(
    q: str = Query(min_length=1, max_length=254),
    current_user=Depends(get_current_user),
):
    return search_users(q, exclude_id=str(current_user.id))


@router.get("/email/{email}", response_model=UserResponse)
def get_user_by_email_endpoint(email: str, current_user=Depends(get_current_user)):
    return get_user_by_email(email)


@router.get("/username/{username}", response_model=UserResponse)
def get_user_by_username_endpoint(username: str, current_user=Depends(get_current_user)):
    return get_user_by_username(username)


@router.get("/{user_id}", response_model=UserResponse)
def get_user_endpoint(user_id: str, current_user=Depends(get_current_user)):
    return get_user_by_id(user_id)


@router.put("/{user_id}", response_model=UserResponse)
def update_user_endpoint(user_id: str, user_update: UserUpdate, current_user=Depends(get_current_user)):
    if str(current_user.id) != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this user")
    return update_user(user_id, user_update)


@router.delete("/{user_id}", status_code=204)
def delete_user_endpoint(user_id: str, current_user=Depends(get_current_user)):
    if str(current_user.id) != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this user")
    delete_user(user_id)
    return None
