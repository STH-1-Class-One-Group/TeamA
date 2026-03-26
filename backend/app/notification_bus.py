"""In-process SSE notification bus.

Bridges synchronous SQLAlchemy code with async FastAPI SSE streams.
When a notification is committed to the DB the synchronous repository layer
calls ``push()``, which is thread-safe and forwards the serialised payload to
every open ``EventSource`` connection belonging to that user.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

logger = logging.getLogger(__name__)

# user_id → list of per-stream queues
_bus: dict[str, list[asyncio.Queue[str]]] = {}

# The running asyncio event loop, captured once at app startup
_loop: asyncio.AbstractEventLoop | None = None


def set_event_loop(loop: asyncio.AbstractEventLoop) -> None:
    """Store the running event loop so sync code can schedule work on it."""
    global _loop  # noqa: PLW0603
    _loop = loop


def register_stream(user_id: str) -> asyncio.Queue[str]:
    """Create and register a new queue for an SSE stream. Call from async code."""
    queue: asyncio.Queue[str] = asyncio.Queue()
    _bus.setdefault(user_id, []).append(queue)
    return queue


def unregister_stream(user_id: str, queue: asyncio.Queue[str]) -> None:
    """Remove a queue when its SSE stream closes. Call from async code."""
    queues = _bus.get(user_id)
    if queues and queue in queues:
        queues.remove(queue)
    if not _bus.get(user_id):
        _bus.pop(user_id, None)


def push(user_id: str, payload: dict[str, Any]) -> None:
    """Thread-safe: schedule a push from synchronous (SQLAlchemy) code.

    If no SSE stream is open for this user the call is silently ignored.
    """
    loop = _loop
    if loop is None:
        return
    queues = _bus.get(user_id)
    if not queues:
        return
    data = json.dumps(payload, ensure_ascii=False)
    for queue in list(queues):
        try:
            loop.call_soon_threadsafe(queue.put_nowait, data)
        except Exception:  # pragma: no cover
            logger.debug("Failed to push SSE notification for user %s", user_id)
