from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from ..db_models import UserNotification
from ..models import NotificationDeleteResponse, NotificationReadResponse, UserNotificationOut
from ..repository_support import format_datetime, utcnow_naive


def to_notification_out(notification: UserNotification) -> UserNotificationOut:
    return UserNotificationOut(
        id=str(notification.notification_id),
        type=notification.type,
        title=notification.title,
        body=notification.body,
        createdAt=format_datetime(notification.created_at),
        isRead=notification.is_read,
        reviewId=str(notification.review_id) if notification.review_id else None,
        commentId=str(notification.comment_id) if notification.comment_id else None,
        routeId=str(notification.route_id) if notification.route_id else None,
        actorName=notification.actor.nickname if notification.actor else None,
    )


def list_user_notifications(db: Session, user_id: str, *, limit: int = 50) -> list[UserNotificationOut]:
    notifications = db.scalars(
        select(UserNotification)
        .options(joinedload(UserNotification.actor))
        .where(UserNotification.user_id == user_id)
        .order_by(UserNotification.created_at.desc(), UserNotification.notification_id.desc())
        .limit(limit)
    ).unique().all()
    return [to_notification_out(notification) for notification in notifications]


def get_unread_notification_count(db: Session, user_id: str) -> int:
    return int(
        db.scalar(
            select(func.count())
            .select_from(UserNotification)
            .where(UserNotification.user_id == user_id, UserNotification.is_read.is_(False))
        )
        or 0
    )


def get_unread_notification_counts(db: Session, user_ids: list[str]) -> dict[str, int]:
    if not user_ids:
        return {}

    counts = {
        user_id: int(total)
        for user_id, total in db.execute(
            select(UserNotification.user_id, func.count(UserNotification.notification_id))
            .where(UserNotification.user_id.in_(user_ids), UserNotification.is_read.is_(False))
            .group_by(UserNotification.user_id)
        ).all()
    }
    return {user_id: counts.get(user_id, 0) for user_id in user_ids}


def create_user_notification(
    db: Session,
    *,
    user_id: str,
    actor_user_id: str | None,
    notification_type: str,
    title: str,
    body: str,
    review_id: int | None = None,
    comment_id: int | None = None,
    route_id: int | None = None,
    payload_metadata: dict | None = None,
) -> UserNotificationOut | None:
    if user_id == actor_user_id:
        return None

    now = utcnow_naive()
    notification = UserNotification(
        user_id=user_id,
        actor_user_id=actor_user_id,
        type=notification_type,
        title=title,
        body=body,
        review_id=review_id,
        comment_id=comment_id,
        route_id=route_id,
        is_read=False,
        read_at=None,
        payload_metadata=payload_metadata or {},
        created_at=now,
        updated_at=now,
    )
    db.add(notification)
    db.flush()
    stored_notification = db.scalars(
        select(UserNotification)
        .options(joinedload(UserNotification.actor))
        .where(UserNotification.notification_id == notification.notification_id)
    ).unique().one()
    return to_notification_out(stored_notification)


def mark_notification_read(db: Session, notification_id: str, user_id: str) -> NotificationReadResponse:
    try:
        notification_key = int(notification_id)
    except ValueError as error:
        raise ValueError("알림 ID 형식이 올바르지 않아요.") from error

    notification = db.scalars(
        select(UserNotification).where(
            UserNotification.notification_id == notification_key,
            UserNotification.user_id == user_id,
        )
    ).first()
    if not notification:
        raise ValueError("알림을 찾지 못했어요.")
    if not notification.is_read:
        notification.is_read = True
        notification.read_at = utcnow_naive()
        notification.updated_at = utcnow_naive()
        db.commit()
    return NotificationReadResponse(notificationId=str(notification.notification_id), read=True)


def mark_all_notifications_read(db: Session, user_id: str) -> int:
    notifications = db.scalars(
        select(UserNotification).where(UserNotification.user_id == user_id, UserNotification.is_read.is_(False))
    ).all()
    if not notifications:
        return 0
    now = utcnow_naive()
    for notification in notifications:
        notification.is_read = True
        notification.read_at = now
        notification.updated_at = now
    db.commit()
    return len(notifications)


def delete_notification(db: Session, notification_id: str, user_id: str) -> NotificationDeleteResponse:
    try:
        notification_key = int(notification_id)
    except ValueError as error:
        raise ValueError("알림 ID 형식이 올바르지 않아요.") from error

    notification = db.scalars(
        select(UserNotification).where(
            UserNotification.notification_id == notification_key,
            UserNotification.user_id == user_id,
        )
    ).first()
    if not notification:
        raise ValueError("알림을 찾지 못했어요.")
    db.delete(notification)
    db.commit()
    return NotificationDeleteResponse(notificationId=str(notification_key), deleted=True)
