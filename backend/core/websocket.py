import json
import asyncio
from fastapi import WebSocket
from typing import Dict
from core.redis import async_redis_client


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.redis_client = async_redis_client
        self.pubsub = None
        self._listener_task = None

    async def start(self):
        """Initializes Redis Pub/Sub and starts the listening task."""
        self.pubsub = self.redis_client.pubsub()
        await self.pubsub.subscribe("user_messages", "broadcast_messages")
        self._listener_task = asyncio.create_task(self._redis_listener())

    async def stop(self):
        """Stops the listening task and cleans up."""
        if self._listener_task:
            self._listener_task.cancel()
        if self.pubsub:
            await self.pubsub.unsubscribe()

    async def _redis_listener(self):
        """Listens to Redis messages and routes them to local WebSockets."""
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
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, user_id: str, message: dict):
        """Publishes a message to Redis to reach the user regardless of server instance."""
        payload = {
            "target_user_id": user_id,
            "payload": message
        }
        await self.redis_client.publish("user_messages", json.dumps(payload))

    async def broadcast(self, message: dict):
        """Publishes a broadcast message to Redis."""
        await self.redis_client.publish("broadcast_messages", json.dumps(message))

    async def _local_send(self, user_id: str, message: dict):
        """Sends a message to a locally connected user."""
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except Exception:
                self.disconnect(user_id)

    async def _local_broadcast(self, message: dict):
        """Broadcasts a message to all users connected to this instance."""
        for user_id in list(self.active_connections.keys()):
            await self._local_send(user_id, message)


manager = ConnectionManager()
