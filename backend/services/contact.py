import logging
from fastapi import HTTPException
from models.contact import Contact
from models.user import User
from schemas.contact import ContactCreate

logger = logging.getLogger("contact_service")


def _get_user(user_id: str) -> User:
    user = User.objects(id=user_id).first()  # type: ignore
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def _get_contact_list(user_id: str) -> Contact:
    contact_list = Contact.objects(user=user_id).first()  # type: ignore
    if not contact_list:
        raise HTTPException(status_code=404, detail="Contact list not found")
    return contact_list


def create_contact_list(data: ContactCreate) -> Contact:
    try:
        user = _get_user(data.user_id)
        if Contact.objects(user=user).first():  # type: ignore
            raise HTTPException(status_code=400, detail="Contact list already exists")

        contact_ids = list(dict.fromkeys(data.contact_ids))
        if data.user_id in contact_ids:
            raise HTTPException(status_code=400, detail="User cannot be their own contact")

        contacts = list(User.objects(id__in=contact_ids))  # type: ignore
        if len(contacts) != len(contact_ids):
            raise HTTPException(status_code=404, detail="One or more contacts were not found")

        contact_list = Contact(user=user, contacts=contacts)
        contact_list.save()
        return contact_list
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CREATE CONTACT LIST ERROR: {str(e)}", exc_info=True)
        raise


def get_contacts(user_id: str) -> Contact:
    try:
        _get_user(user_id)
        return _get_contact_list(user_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"GET CONTACTS ERROR: {str(e)}", exc_info=True)
        raise


def add_contact(user_id: str, contact_id: str) -> Contact:
    try:
        user = _get_user(user_id)
        contact_user = _get_user(contact_id)
        if user_id == contact_id:
            raise HTTPException(status_code=400, detail="User cannot be their own contact")

        contact_list = Contact.objects(user=user).first()  # type: ignore
        if not contact_list:
            contact_list = Contact(user=user, contacts=[])

        if any(str(existing.id) == contact_id for existing in contact_list.contacts):
            raise HTTPException(status_code=400, detail="Contact already exists")

        from models.settings import Settings
        target_settings = Settings.objects(user=contact_id).first()  # type: ignore
        if target_settings and target_settings.privacy.who_can_add_me == "nobody":
            raise HTTPException(status_code=403, detail="This user does not accept contact requests")

        contact_list.contacts.append(contact_user)
        contact_list.save()
        return contact_list
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ADD CONTACT ERROR: {str(e)}", exc_info=True)
        raise


def remove_contact(user_id: str, contact_id: str) -> Contact:
    try:
        _get_user(user_id)
        contact_list = _get_contact_list(user_id)

        remaining_contacts = [
            contact for contact in contact_list.contacts if str(contact.id) != contact_id
        ]
        if len(remaining_contacts) == len(contact_list.contacts):
            raise HTTPException(status_code=404, detail="Contact not found")

        contact_list.contacts = remaining_contacts
        contact_list.save()
        return contact_list
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"REMOVE CONTACT ERROR: {str(e)}", exc_info=True)
        raise


def delete_contact_list(user_id: str) -> None:
    try:
        _get_user(user_id)
        contact_list = _get_contact_list(user_id)
        contact_list.delete()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"DELETE CONTACT LIST ERROR: {str(e)}", exc_info=True)
        raise
