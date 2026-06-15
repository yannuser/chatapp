import logging
from typing import List
from models.direct_message import DirectMessage
from models.group_message import GroupMessage
from models.conversation import Conversation
from models.group import Group
from schemas.search import MessageSearchResult

logger = logging.getLogger("search_service")


def search_messages(user_id: str, query: str, limit: int) -> List[MessageSearchResult]:
    try:
        results: List[MessageSearchResult] = []

        convo_ids = [c.id for c in Conversation.objects(members=user_id).only("id")]  # type: ignore
        if convo_ids:
            dms = (
                DirectMessage.objects(  # type: ignore
                    linked_conversation__in=convo_ids,
                    content__icontains=query,
                    is_deleted__ne=True,
                )
                .order_by("-sent_at")
                .limit(limit)
            )
            for msg in dms:
                convo = msg.linked_conversation
                other = next(
                    (m for m in convo.members if str(m.id) != user_id),
                    convo.members[0],
                )
                results.append(
                    MessageSearchResult(
                        id=str(msg.id),
                        content=msg.content,
                        sender_name=f"{msg.sender.first_name} {msg.sender.last_name}",
                        sent_at=msg.sent_at,
                        room_type="dm",
                        room_id=str(convo.id),
                        room_name=f"{other.first_name} {other.last_name}",
                    )
                )

        group_ids = [g.id for g in Group.objects(members=user_id).only("id")]  # type: ignore
        if group_ids:
            gms = (
                GroupMessage.objects(  # type: ignore
                    group__in=group_ids,
                    content__icontains=query,
                    is_deleted__ne=True,
                )
                .order_by("-sent_at")
                .limit(limit)
            )
            for msg in gms:
                results.append(
                    MessageSearchResult(
                        id=str(msg.id),
                        content=msg.content,
                        sender_name=f"{msg.sender.first_name} {msg.sender.last_name}",
                        sent_at=msg.sent_at,
                        room_type="group",
                        room_id=str(msg.group.id),
                        room_name=msg.group.title,
                    )
                )

        results.sort(key=lambda r: r.sent_at, reverse=True)
        return results[:limit]
    except Exception as e:
        logger.error(f"SEARCH MESSAGES ERROR: {str(e)}", exc_info=True)
        raise
