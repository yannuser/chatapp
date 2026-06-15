from typing import List
from fastapi import APIRouter, Depends, Query
from core.security import get_current_user
from schemas.search import MessageSearchResult
from services.search import search_messages as search_messages_service

router = APIRouter()


@router.get("/messages", response_model=List[MessageSearchResult])
def search_messages_endpoint(
    q: str = Query(min_length=1, max_length=200),
    limit: int = Query(default=20, ge=1, le=50),
    current_user=Depends(get_current_user),
):
    return search_messages_service(str(current_user.id), q, limit)
