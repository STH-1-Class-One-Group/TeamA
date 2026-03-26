from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..models import NotificationDeleteResponse, NotificationReadResponse, SessionUser, UserNotificationOut
from ..notification_broker import notification_broker
from ..repository_normalized import (
    delete_notification,
    get_unread_notification_count,
    list_user_notifications,
    mark_all_notifications_read,
    mark_notification_read,
)


def read_notifications_service(db: Session, session_user: SessionUser) -> list[UserNotificationOut]:
    return list_user_notifications(db, session_user.id)


def mark_notification_read_service(db: Session, notification_id: str, session_user: SessionUser) -> NotificationReadResponse:
    try:
        response = mark_notification_read(db, notification_id, session_user.id)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    unread_count = get_unread_notification_count(db, session_user.id)
    notification_broker.publish(
        session_user.id,
        {
            "event": "notification.read",
            "notificationId": response.notification_id,
            "unreadCount": unread_count,
        },
    )
    return response


def mark_all_notifications_read_service(db: Session, session_user: SessionUser) -> dict[str, int]:
    updated = mark_all_notifications_read(db, session_user.id)
    notification_broker.publish(
        session_user.id,
        {
            "event": "notification.all-read",
            "updated": updated,
            "unreadCount": 0,
        },
    )
    return {"updated": updated}


def delete_notification_service(db: Session, notification_id: str, session_user: SessionUser) -> NotificationDeleteResponse:
    try:
        response = delete_notification(db, notification_id, session_user.id)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    unread_count = get_unread_notification_count(db, session_user.id)
    notification_broker.publish(
        session_user.id,
        {
            "event": "notification.deleted",
            "notificationId": response.notification_id,
            "unreadCount": unread_count,
        },
    )
    return response
