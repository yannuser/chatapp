from fastapi import APIRouter, Depends, HTTPException, Query, status
from core.security import get_current_user
from schemas.contact import ContactAdd, ContactCreate, ContactResponse, ContactPage
from services.contact import (
    add_contact,
    create_contact_list,
    delete_contact_list,
    get_contacts,
    remove_contact,
)

router = APIRouter()


@router.post("/", response_model=ContactResponse, status_code=201)
def create_contact_list_endpoint(contact_list: ContactCreate, current_user=Depends(get_current_user)):
    if str(current_user.id) != contact_list.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return create_contact_list(contact_list)


@router.get("/", response_model=ContactPage)
def get_contacts_endpoint(
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    current_user=Depends(get_current_user),
):
    return get_contacts(str(current_user.id), limit=limit, offset=offset)


@router.post("/add", response_model=ContactResponse)
def add_contact_endpoint(contact: ContactAdd, current_user=Depends(get_current_user)):
    return add_contact(str(current_user.id), contact.contact_id)


@router.delete("/", status_code=204)
def delete_contact_list_endpoint(current_user=Depends(get_current_user)):
    delete_contact_list(str(current_user.id))
    return None


@router.delete("/{contact_id}", response_model=ContactResponse)
def remove_contact_endpoint(contact_id: str, current_user=Depends(get_current_user)):
    return remove_contact(str(current_user.id), contact_id)
