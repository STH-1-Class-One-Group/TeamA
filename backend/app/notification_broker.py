from __future__ import annotations

import asyncio
from collections import defaultdict
from dataclasses import dataclass
from typing import Any


@dataclass
class NotificationSubscription:
    queue: asyncio.Queue[dict[str, Any]]
    loop: asyncio.AbstractEventLoop


class NotificationBroker:
    def __init__(self) -> None:
        self._subscriptions: dict[str, list[NotificationSubscription]] = defaultdict(list)
        self._lock = asyncio.Lock()

    async def subscribe(self, user_id: str) -> NotificationSubscription:
        subscription = NotificationSubscription(queue=asyncio.Queue(), loop=asyncio.get_running_loop())
        async with self._lock:
            self._subscriptions[user_id].append(subscription)
        return subscription

    async def unsubscribe(self, user_id: str, subscription: NotificationSubscription) -> None:
        async with self._lock:
            subscribers = self._subscriptions.get(user_id)
            if not subscribers:
                return
            if subscription in subscribers:
                subscribers.remove(subscription)
            if not subscribers:
                self._subscriptions.pop(user_id, None)

    def publish(self, user_id: str, event: dict[str, Any]) -> None:
        subscribers = self._subscriptions.get(user_id)
        if not subscribers:
            return
        for subscription in tuple(subscribers):
            subscription.loop.call_soon_threadsafe(subscription.queue.put_nowait, event)


notification_broker = NotificationBroker()
