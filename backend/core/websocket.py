import json
import asyncio
from fastapi import WebSocket
from typing import Dict, List
from core.redis import async_redis_client


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.redis_client = async_redis_client
        self.pubsub = None
        self._listener_task = None

    async def start(self):
        if self.redis_client is None:
            return
        self.pubsub = self.redis_client.pubsub()
        await self.pubsub.subscribe("user_messages", "broadcast_messages")
        self._listener_task = asyncio.create_task(self._redis_listener())

    async def stop(self):
        if self._listener_task:
            self._listener_task.cancel()
        if self.pubsub:
            await self.pubsub.unsubscribe()
        if self.redis_client:
            await self.redis_client.aclose()

    async def _redis_listener(self):
        try:
            async for message in self.pubsub.listen():
                if message["type"] == "message":
                    data = json.loads(message["data"])
                    channel = message["channel"]
                    if channel == "broadcast_messages":
                        await self._local_broadcast(data)
                    elif channel == "user_messages":
                        target_user_id = data.get("target_user_id")
                        if target_user_id:
                            await self._local_send(target_user_id, data["payload"])
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"REDIS LISTENER ERROR: {e}")

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id] = [
                ws for ws in self.active_connections[user_id] if ws is not websocket
            ]
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    def is_connected(self, user_id: str) -> bool:
        return bool(self.active_connections.get(user_id))

    async def send_personal_message(self, user_id: str, message: dict):
        if self.redis_client is None:
            await self._local_send(user_id, message)
            return
        payload = {"target_user_id": user_id, "payload": message}
        await self.redis_client.publish("user_messages", json.dumps(payload))

    async def broadcast(self, message: dict):
        if self.redis_client is None:
            await self._local_broadcast(message)
            return
        await self.redis_client.publish("broadcast_messages", json.dumps(message))

    async def _local_send(self, user_id: str, message: dict):
        sockets = list(self.active_connections.get(user_id, []))
        for ws in sockets:
            try:
                await ws.send_json(message)
            except Exception:
                self.disconnect(user_id, ws)

    async def _local_broadcast(self, message: dict):
        for user_id in list(self.active_connections.keys()):
            await self._local_send(user_id, message)


manager = ConnectionManager()
