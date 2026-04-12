from fastapi import HTTPException

from app.services import notification_service


def test_read_notifications_service_uses_repository_entry(monkeypatch):
    session_user = type("SessionUserLike", (), {"id": "user-1"})()
    sentinel = [{"id": "notification-1"}]
    monkeypatch.setattr(notification_service, "list_user_notification_entries", lambda db, user_id: sentinel)

    assert notification_service.read_notifications_service("db-session", session_user) == sentinel


def test_mark_notification_read_service_publishes_unread_count(monkeypatch):
    session_user = type("SessionUserLike", (), {"id": "user-1"})()
    response = type("NotificationReadLike", (), {"notification_id": "notification-1"})()
    published = []

    monkeypatch.setattr(notification_service, "mark_notification_read_entry", lambda db, notification_id, user_id: response)
    monkeypatch.setattr(notification_service, "read_unread_notification_count", lambda db, user_id: 3)
    monkeypatch.setattr(notification_service.notification_broker, "publish", lambda user_id, payload: published.append((user_id, payload)))

    result = notification_service.mark_notification_read_service("db-session", "notification-1", session_user)

    assert result is response
    assert published == [
        (
            "user-1",
            {
                "event": "notification.read",
                "notificationId": "notification-1",
                "unreadCount": 3,
            },
        )
    ]


def test_delete_notification_service_maps_value_error(monkeypatch):
    session_user = type("SessionUserLike", (), {"id": "user-1"})()
    monkeypatch.setattr(
        notification_service,
        "delete_notification_entry",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(ValueError("알림을 찾을 수 없어요.")),
    )

    try:
        notification_service.delete_notification_service("db-session", "notification-1", session_user)
    except HTTPException as error:
        assert error.status_code == 404
        assert error.detail == "알림을 찾을 수 없어요."
    else:
        raise AssertionError("Expected HTTPException")
