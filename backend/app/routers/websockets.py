from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.security.auth import decode_token
from app.services.websocket_manager import ws_manager

router = APIRouter(prefix="/api/v1", tags=["Realtime WebSockets"])

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    """
    Authenticated WebSocket connection endpoint.
    Verifies user JWT token query parameter and registers per-user channel.
    Emits real-time consent requests, approval notifications, and revocations.
    """
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=1008)
            return
    except Exception:
        await websocket.close(code=1008)
        return

    await ws_manager.connect(user_id, websocket)
    try:
        # Send initial connection acknowledgment
        await websocket.send_json({
            "type": "connection_established",
            "data": {"user_id": user_id, "status": "connected"}
        })
        while True:
            # Handle incoming ping/keepalive messages from clients
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(user_id, websocket)
    except Exception:
        ws_manager.disconnect(user_id, websocket)
