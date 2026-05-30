from fastapi import APIRouter

from schemas.contact import ContactAdd, ContactCreate, ContactResponse
from services.contact import (
    add_contact,
    create_contact_list,
    delete_contact_list,
    get_contacts,
    remove_contact,
)

router = APIRouter()


@router.post("/", response_model=ContactResponse, status_code=201)
def create_contact_list_endpoint(contact_list: ContactCreate):
    return create_contact_list(contact_list)


@router.get("/user/{user_id}", response_model=ContactResponse)
def get_contacts_endpoint(user_id: str):
    return get_contacts(user_id)


@router.post("/user/{user_id}", response_model=ContactResponse)
def add_contact_endpoint(user_id: str, contact: ContactAdd):
    return add_contact(user_id, contact.contact_id)


@router.delete("/user/{user_id}/contact/{contact_id}", response_model=ContactResponse)
def remove_contact_endpoint(user_id: str, contact_id: str):
    return remove_contact(user_id, contact_id)


@router.delete("/user/{user_id}", status_code=204)
def delete_contact_list_endpoint(user_id: str):
    delete_contact_list(user_id)
    return None
