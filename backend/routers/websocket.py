from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from core.websocket import manager
from core.security import get_current_user_ws

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    current_user = Depends(get_current_user_ws)
):
    if not current_user:
        return

    user_id = str(current_user.id)
    await manager.connect(user_id, websocket)
    try:
        while True:
            # Keep the connection open and wait for messages (ping/pong)
            data = await websocket.receive_text()
            # For now, we don't handle incoming messages via WS, 
            # we just use it for server-to-client notifications.
    except WebSocketDisconnect:
        manager.disconnect(user_id)
