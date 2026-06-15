from pydantic import BaseModel
from datetime import datetime
from typing import Literal


class MessageSearchResult(BaseModel):
    id: str
    content: str
    sender_name: str
    sent_at: datetime
    room_type: Literal["dm", "group"]
    room_id: str
    room_name: str
