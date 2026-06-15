import json
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from core.websocket import manager
from core.security import get_current_user_ws

router = APIRouter()
logger = logging.getLogger("websocket_router")


def _get_contact_ids(user_id: str) -> list[str]:
    from models.contact import Contact
    contact_list = Contact.objects(user=user_id).first()  # type: ignore
    if not contact_list:
        return []
    return [str(c.id) for c in contact_list.contacts]


async def _replay_missed_events(user_id: str, since: datetime, websocket: WebSocket):
    from models.conversation import Conversation
    from models.direct_message import DirectMessage
    from models.group import Group
    from models.group_message import GroupMessage
    from schemas.direct_message import DirectMessageResponse
    from schemas.group_message import GroupMessageResponse

    try:
        convo_ids = [c.id for c in Conversation.objects(members=user_id)]  # type: ignore
        if convo_ids:
            missed_dms = (
                DirectMessage.objects(linked_conversation__in=convo_ids, sent_at__gt=since)  # type: ignore
                .order_by("sent_at")
                .limit(200)
            )
            for msg in missed_dms:
                if getattr(msg, "is_deleted", False):
                    continue
                payload = DirectMessageResponse.model_validate(msg).model_dump(mode="json")
                payload["type"] = "new_direct_message"
                await websocket.send_json(payload)

        group_ids = [g.id for g in Group.objects(members=user_id)]  # type: ignore
        if group_ids:
            missed_group_msgs = (
                GroupMessage.objects(group__in=group_ids, sent_at__gt=since)  # type: ignore
                .order_by("sent_at")
                .limit(200)
            )
            for msg in missed_group_msgs:
                if getattr(msg, "is_deleted", False):
                    continue
                payload = GroupMessageResponse.model_validate(msg).model_dump(mode="json")
                payload["type"] = "new_group_message"
                await websocket.send_json(payload)
    except Exception as e:
        logger.error(f"REPLAY MISSED EVENTS ERROR user={user_id}: {e}", exc_info=True)


async def _handle_typing_dm(user_id: str, data: dict):
    from models.conversation import Conversation
    conversation_id = data.get("conversation_id")
    if not conversation_id:
        return
    conversation = Conversation.objects(id=conversation_id).first()  # type: ignore
    if not conversation:
        return
    if all(str(m.id) != user_id for m in conversation.members):
        return
    payload = {
        "type": "typing",
        "conversation_id": conversation_id,
        "user_id": user_id,
        "is_typing": bool(data.get("is_typing")),
    }
    for member in conversation.members:
        mid = str(member.id)
        if mid != user_id:
            await manager.send_personal_message(mid, payload)


async def _handle_typing_group(user_id: str, data: dict):
    from models.group import Group
    group_id = data.get("group_id")
    if not group_id:
        return
    group = Group.objects(id=group_id).first()  # type: ignore
    if not group:
        return
    if all(str(m.id) != user_id for m in group.members):
        return
    payload = {
        "type": "typing_group",
        "group_id": group_id,
        "user_id": user_id,
        "is_typing": bool(data.get("is_typing")),
    }
    for member in group.members:
        mid = str(member.id)
        if mid != user_id:
            await manager.send_personal_message(mid, payload)


async def _handle_read_dm(user_id: str, data: dict):
    from models.conversation import Conversation
    from models.settings import Settings
    conversation_id = data.get("conversation_id")
    if not conversation_id:
        return
    conversation = Conversation.objects(id=conversation_id).first()  # type: ignore
    if not conversation:
        return
    if all(str(m.id) != user_id for m in conversation.members):
        return

    now = datetime.now(timezone.utc)
    conversation.update(**{f"set__last_read__{user_id}": now})

    s = Settings.objects(user=user_id).first()  # type: ignore
    if s and not s.privacy.read_receipts:
        return

    payload = {
        "type": "read_receipt",
        "conversation_id": conversation_id,
        "user_id": user_id,
        "read_at": now.isoformat(),
    }
    for member in conversation.members:
        mid = str(member.id)
        if mid != user_id:
            await manager.send_personal_message(mid, payload)


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    current_user=Depends(get_current_user_ws)
):
    if not current_user:
        return

    user_id = str(current_user.id)
    await manager.connect(user_id, websocket)

    contact_ids = _get_contact_ids(user_id)

    from models.settings import Settings
    user_settings = Settings.objects(user=user_id).first()  # type: ignore
    show_presence = not user_settings or user_settings.privacy.show_online_status

    if show_presence:
        for cid in contact_ids:
            await manager.send_personal_message(cid, {"type": "user_online", "user_id": user_id})

    online_ids = []
    for cid in contact_ids:
        if not manager.is_connected(cid):
            continue
        contact_settings = Settings.objects(user=cid).first()  # type: ignore
        if contact_settings and not contact_settings.privacy.show_online_status:
            continue
        online_ids.append(cid)
    await websocket.send_json({"type": "online_contacts", "user_ids": online_ids})

    last_disconnect = manager.pop_last_disconnect(user_id)
    if last_disconnect:
        await _replay_missed_events(user_id, last_disconnect, websocket)

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except Exception:
                continue

            event_type = data.get("type")
            if event_type == "typing":
                await _handle_typing_dm(user_id, data)
            elif event_type == "typing_group":
                await _handle_typing_group(user_id, data)
            elif event_type == "read":
                await _handle_read_dm(user_id, data)

    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
        if show_presence and not manager.is_connected(user_id):
            for cid in contact_ids:
                await manager.send_personal_message(cid, {"type": "user_offline", "user_id": user_id})
    except Exception as e:
        logger.error(f"WEBSOCKET ERROR user={user_id}: {e}", exc_info=True)
        manager.disconnect(user_id, websocket)
        if show_presence and not manager.is_connected(user_id):
            for cid in contact_ids:
                await manager.send_personal_message(cid, {"type": "user_offline", "user_id": user_id})
