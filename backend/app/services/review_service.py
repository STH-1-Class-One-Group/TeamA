from collections.abc import Callable

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..models import CommentCreate, ReviewCreate, ReviewLikeResponse, ReviewOut, SessionUser, UserNotificationOut
from ..notification_broker import notification_broker
from ..repositories.review_repository import (
    create_review_comment_with_notifications,
    create_review_entry,
    delete_review_comment,
    delete_review_entry,
    list_review_comments,
    list_review_entries,
    toggle_review_like_entry,
)
from ..repositories.notification_repository import read_unread_notification_counts as get_unread_notification_counts
from ..repositories.errors import RepositoryNotFoundError, RepositoryPermissionError, RepositoryValidationError


def _raise_not_found(detail: str) -> None:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


def _raise_bad_request(detail: str) -> None:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


def _raise_forbidden(detail: str) -> None:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


def _run_with_policy(action: Callable[[], object]):
    try:
        return action()
    except RepositoryNotFoundError as error:
        _raise_not_found(str(error))
    except RepositoryValidationError as error:
        _raise_bad_request(str(error))
    except RepositoryPermissionError as error:
        _raise_forbidden(str(error))
    except ValueError as error:
        _raise_bad_request(str(error))


def _run_delete_with_policy(action: Callable[[], object]):
    try:
        return action()
    except RepositoryNotFoundError as error:
        _raise_not_found(str(error))
    except RepositoryValidationError as error:
        _raise_bad_request(str(error))
    except RepositoryPermissionError as error:
        _raise_forbidden(str(error))
    except ValueError as error:
        _raise_bad_request(str(error))


def _publish_comment_notifications(
    db: Session,
    notifications: list[tuple[str, UserNotificationOut]],
) -> None:
    recipient_ids = [recipient_user_id for recipient_user_id, _ in notifications]
    unread_counts = get_unread_notification_counts(db, recipient_ids)

    for recipient_user_id, notification in notifications:
        notification_broker.publish(
            recipient_user_id,
            {
                "event": "notification.created",
                "notification": notification.model_dump(by_alias=True),
                "unreadCount": unread_counts.get(recipient_user_id, 0),
            },
        )


def create_review_service(db: Session, payload: ReviewCreate, session_user: SessionUser) -> ReviewOut:
    return _run_with_policy(
        lambda: create_review_entry(db, payload, session_user.id, session_user.nickname),
    )


def read_reviews_service(db: Session, place_id: str | None, user_id: str | None, session_user: SessionUser | None):
    return list_review_entries(
        db,
        place_id=place_id,
        user_id=user_id,
        current_user_id=session_user.id if session_user else None,
    )


def delete_review_service(db: Session, review_id: str, session_user: SessionUser) -> None:
    _run_delete_with_policy(
        lambda: delete_review_entry(db, review_id, session_user.id, is_admin=session_user.is_admin),
    )


def toggle_review_like_service(db: Session, review_id: str, session_user: SessionUser) -> ReviewLikeResponse:
    return _run_with_policy(
        lambda: toggle_review_like_entry(db, review_id, session_user.id, session_user.nickname),
    )


def read_review_comments_service(db: Session, review_id: str):
    return _run_with_policy(
        lambda: list_review_comments(db, review_id),
    )


def create_comment_service(db: Session, review_id: str, payload: CommentCreate, session_user: SessionUser):
    comments, notifications = _run_with_policy(
        lambda: create_review_comment_with_notifications(db, review_id, payload, session_user.id, session_user.nickname),
    )
    _publish_comment_notifications(db, notifications)
    return comments


def delete_comment_service(db: Session, review_id: str, comment_id: str, session_user: SessionUser):
    return _run_delete_with_policy(
        lambda: delete_review_comment(db, review_id, comment_id, session_user.id, is_admin=session_user.is_admin),
    )
