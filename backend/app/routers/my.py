import asyncio
import json
from uuid import uuid4

from fastapi import APIRouter, Depends, Request, Response, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..api_deps import require_session_user
from ..config import Settings, get_settings
from ..db import get_db
from ..jwt_auth import clear_auth_cookie
from ..models import MyPageResponse, NotificationDeleteResponse, NotificationReadResponse, SessionUser, UserNotificationOut, UserRouteOut
from ..notification_broker import notification_broker
from ..services.account_service import delete_my_account_service
from ..services.my_page_service import read_my_page_service
from ..services.notification_service import (
    delete_notification_service,
    mark_all_notifications_read_service,
    mark_notification_read_service,
    read_notifications_service,
)
from ..services.route_service import read_my_routes_service

router = APIRouter(tags=["my"])


def format_sse_event(event_name: str, payload: dict, *, event_id: str | None = None) -> str:
    lines: list[str] = []
    if event_id:
        lines.append(f"id: {event_id}")
    lines.append(f"event: {event_name}")
    lines.append(f"data: {json.dumps(payload, ensure_ascii=False)}")
    return "\n".join(lines) + "\n\n"


@router.get("/api/my/routes", response_model=list[UserRouteOut])
def read_my_routes(
    db: Session = Depends(get_db),
    session_user: SessionUser = Depends(require_session_user),
) -> list[UserRouteOut]:
    return read_my_routes_service(db, session_user)


@router.get("/api/my/summary", response_model=MyPageResponse)
def read_my_summary(
    db: Session = Depends(get_db),
    session_user: SessionUser = Depends(require_session_user),
    app_settings: Settings = Depends(get_settings),
) -> MyPageResponse:
    return read_my_page_service(db, session_user, app_settings)


@router.get("/api/my/notifications", response_model=list[UserNotificationOut])
def read_my_notifications(
    db: Session = Depends(get_db),
    session_user: SessionUser = Depends(require_session_user),
) -> list[UserNotificationOut]:
    return read_notifications_service(db, session_user)


@router.get("/api/my/notifications/stream")
async def stream_my_notifications(
    request: Request,
    session_user: SessionUser = Depends(require_session_user),
) -> StreamingResponse:
    subscription = await notification_broker.subscribe(session_user.id)

    async def event_generator():
        try:
            yield format_sse_event("connected", {"connected": True}, event_id=str(uuid4()))
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event = await asyncio.wait_for(subscription.queue.get(), timeout=15)
                    event_name = str(event.get("event", "message"))
                    payload = {key: value for key, value in event.items() if key != "event"}
                    yield format_sse_event(event_name, payload, event_id=str(uuid4()))
                except TimeoutError:
                    yield format_sse_event("heartbeat", {"ok": True}, event_id=str(uuid4()))
        finally:
            await notification_broker.unsubscribe(session_user.id, subscription)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.patch("/api/notifications/{notification_id}/read", response_model=NotificationReadResponse)
def read_notification(
    notification_id: str,
    db: Session = Depends(get_db),
    session_user: SessionUser = Depends(require_session_user),
) -> NotificationReadResponse:
    return mark_notification_read_service(db, notification_id, session_user)


@router.patch("/api/notifications/read-all")
def read_all_notifications(
    db: Session = Depends(get_db),
    session_user: SessionUser = Depends(require_session_user),
) -> dict[str, int]:
    return mark_all_notifications_read_service(db, session_user)


@router.delete("/api/notifications/{notification_id}", response_model=NotificationDeleteResponse)
def remove_notification(
    notification_id: str,
    db: Session = Depends(get_db),
    session_user: SessionUser = Depends(require_session_user),
) -> NotificationDeleteResponse:
    return delete_notification_service(db, notification_id, session_user)


@router.delete("/api/my/account", status_code=status.HTTP_204_NO_CONTENT)
def remove_my_account(
    response: Response,
    db: Session = Depends(get_db),
    session_user: SessionUser = Depends(require_session_user),
) -> Response:
    delete_my_account_service(db, session_user.id)
    clear_auth_cookie(response)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response

