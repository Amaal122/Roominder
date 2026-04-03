"""WebSocket endpoints for real-time notifications."""

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from ..db import get_db
from ..backend_user.auth import get_current_user_ws
from .websocket_manager import manager

router = APIRouter(prefix="/ws", tags=["WebSocket"])


@router.websocket("/notifications")
async def websocket_notifications(
    websocket: WebSocket,
    db: Session = Depends(get_db),
):
    # For simplicity, we'll use a token in query params
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return

    # Verify token and get user
    try:
        user = await get_current_user_ws(token, db)
    except:
        await websocket.close(code=1008)
        return

    await manager.connect(websocket, user.id)
    try:
        while True:
            data = await websocket.receive_text()
            # For now, just keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(websocket, user.id)