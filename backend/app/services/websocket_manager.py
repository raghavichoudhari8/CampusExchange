from typing import Dict, List, Any
from fastapi import WebSocket

class WebSocketManager:
    def __init__(self):
        # Maps user_id -> List[WebSocket] (supports multiple tabs / mobile + desktop)
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_event(self, user_id: str, event_type: str, payload: Dict[str, Any]):
        """Pushes an authenticated real-time event to all active sessions of a specific user."""
        if user_id in self.active_connections:
            message = {"type": event_type, "data": payload}
            stale_sockets = []
            for ws in self.active_connections[user_id]:
                try:
                    await ws.send_json(message)
                except Exception:
                    stale_sockets.append(ws)
            for ws in stale_sockets:
                self.disconnect(user_id, ws)

    async def broadcast(self, event_type: str, payload: Dict[str, Any]):
        message = {"type": event_type, "data": payload}
        for user_id, sockets in list(self.active_connections.items()):
            for ws in list(sockets):
                try:
                    await ws.send_json(message)
                except Exception:
                    self.disconnect(user_id, ws)

ws_manager = WebSocketManager()
