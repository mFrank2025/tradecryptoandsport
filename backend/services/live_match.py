"""
Live match WebSocket manager - broadcasts events to connected clients.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections per match."""

    def __init__(self) -> None:
        # match_id -> list of active WebSocket connections
        self._connections: dict[int, list[WebSocket]] = {}
        # match_id -> current match state snapshot
        self._match_states: dict[int, dict[str, Any]] = {}

    async def connect(self, match_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        if match_id not in self._connections:
            self._connections[match_id] = []
        self._connections[match_id].append(websocket)
        logger.info(
            f"Client connesso a partita {match_id}. "
            f"Totale: {len(self._connections[match_id])}"
        )

        # Send current state to new connection
        state = self._match_states.get(match_id)
        if state:
            await self._send_to_socket(
                websocket,
                {"type": "state_sync", "data": state},
            )

    def disconnect(self, match_id: int, websocket: WebSocket) -> None:
        if match_id in self._connections:
            try:
                self._connections[match_id].remove(websocket)
            except ValueError:
                pass
            if not self._connections[match_id]:
                del self._connections[match_id]
        logger.info(
            f"Client disconnesso da partita {match_id}. "
            f"Rimasti: {len(self._connections.get(match_id, []))}"
        )

    async def broadcast(self, match_id: int, message: dict[str, Any]) -> None:
        """Broadcast a message to all clients watching a match."""
        if match_id not in self._connections:
            return
        dead: list[WebSocket] = []
        for ws in list(self._connections[match_id]):
            try:
                await self._send_to_socket(ws, message)
            except Exception as exc:
                logger.warning(f"Errore invio a client: {exc}")
                dead.append(ws)
        for ws in dead:
            self.disconnect(match_id, ws)

    async def broadcast_event(self, match_id: int, event: dict[str, Any]) -> None:
        """Broadcast a new match event."""
        message = {
            "type": "new_event",
            "timestamp": datetime.utcnow().isoformat(),
            "data": event,
        }
        # Update match state events list
        state = self._match_states.setdefault(match_id, {"events": [], "match_id": match_id})
        state.setdefault("events", []).append(event)
        await self.broadcast(match_id, message)

    async def broadcast_score_update(
        self, match_id: int, score_home: int, score_away: int, minute: int
    ) -> None:
        """Broadcast a score change."""
        state = self._match_states.setdefault(match_id, {"match_id": match_id})
        state["score_home"] = score_home
        state["score_away"] = score_away
        state["current_minute"] = minute
        message = {
            "type": "score_update",
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "score_home": score_home,
                "score_away": score_away,
                "minute": minute,
            },
        }
        await self.broadcast(match_id, message)

    async def broadcast_match_status(self, match_id: int, status: str) -> None:
        """Broadcast match status change (live/completed)."""
        state = self._match_states.setdefault(match_id, {"match_id": match_id})
        state["status"] = status
        message = {
            "type": "status_change",
            "timestamp": datetime.utcnow().isoformat(),
            "data": {"status": status},
        }
        await self.broadcast(match_id, message)

    def update_match_state(self, match_id: int, state_data: dict[str, Any]) -> None:
        """Update stored match state (called by REST endpoints)."""
        current = self._match_states.setdefault(match_id, {"match_id": match_id})
        current.update(state_data)

    def get_match_state(self, match_id: int) -> dict[str, Any] | None:
        return self._match_states.get(match_id)

    def get_connected_count(self, match_id: int) -> int:
        return len(self._connections.get(match_id, []))

    @staticmethod
    async def _send_to_socket(ws: WebSocket, message: dict[str, Any]) -> None:
        await ws.send_text(json.dumps(message, ensure_ascii=False, default=str))


# Singleton instance shared across the application
manager = ConnectionManager()
