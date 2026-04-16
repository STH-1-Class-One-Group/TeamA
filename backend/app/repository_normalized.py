"""Normalized repository for JamIssue domain flows."""

from __future__ import annotations

from sqlalchemy.orm import Session

from .models import CommentCreate, CommentOut, UserNotificationOut
from .repositories.account_data_repository import delete_account as delete_account
from .repositories.admin_data_repository import (
    get_admin_summary as get_admin_summary,
    import_public_bundle as import_public_bundle,
    update_place_visibility as update_place_visibility,
)
from .repositories.content_query_repository import (
    get_bootstrap as get_bootstrap,
    get_place as get_place,
    list_courses as list_courses,
    list_places as list_places,
    to_course_out as to_course_out,
)
from .repositories.my_page_data_repository import build_my_comments as build_my_comments, get_my_page as get_my_page
from .repositories.notification_data_repository import (
    create_user_notification as create_user_notification,
    delete_notification as delete_notification,
    get_unread_notification_count as get_unread_notification_count,
    get_unread_notification_counts as get_unread_notification_counts,
    list_user_notifications as list_user_notifications,
    mark_all_notifications_read as mark_all_notifications_read,
    mark_notification_read as mark_notification_read,
    to_notification_out as to_notification_out,
)
from .repositories.profile_data_repository import (
    build_unique_social_nickname as build_unique_social_nickname,
    ensure_unique_nickname as ensure_unique_nickname,
    link_naver_identity as link_naver_identity,
    link_social_identity as link_social_identity,
    update_user_profile as update_user_profile,
    upsert_naver_user as upsert_naver_user,
    upsert_social_user as upsert_social_user,
)
from .repositories.public_bundle_repository import cleanup_legacy_demo_content as cleanup_legacy_demo_content, load_public_bundle as load_public_bundle
from .repositories.review_query_repository import (
    get_review_comments as get_review_comments,
    list_reviews as list_reviews,
    to_review_out as to_review_out,
)
from .repositories.review_write_repository import (
    create_comment_with_notifications as create_comment_with_notifications_entry,
    create_review as create_review,
    delete_comment as delete_comment,
    delete_review as delete_review,
    toggle_review_like as toggle_review_like,
)
from .repositories.stamp_data_repository import get_stamps as get_stamps, toggle_stamp as toggle_stamp
from .repositories.user_data_repository import get_or_create_user as get_or_create_user
from .repository_support import utcnow_naive as utcnow_naive_entry


__all__ = [
    "build_my_comments",
    "build_unique_social_nickname",
    "cleanup_legacy_demo_content",
    "create_comment",
    "create_comment_with_notifications",
    "create_review",
    "create_user_notification",
    "delete_account",
    "delete_comment",
    "delete_notification",
    "delete_review",
    "ensure_unique_nickname",
    "get_admin_summary",
    "get_bootstrap",
    "get_my_page",
    "get_or_create_user",
    "get_place",
    "get_review_comments",
    "get_stamps",
    "get_unread_notification_count",
    "get_unread_notification_counts",
    "import_public_bundle",
    "link_naver_identity",
    "link_social_identity",
    "list_courses",
    "list_places",
    "list_reviews",
    "list_user_notifications",
    "load_public_bundle",
    "mark_all_notifications_read",
    "mark_notification_read",
    "to_course_out",
    "to_notification_out",
    "to_review_out",
    "toggle_review_like",
    "toggle_stamp",
    "update_place_visibility",
    "update_user_profile",
    "upsert_naver_user",
    "upsert_social_user",
    "utcnow_naive",
]


def utcnow_naive():
    return utcnow_naive_entry()

def create_comment_with_notifications(
    db: Session,
    review_id: str,
    payload: CommentCreate,
    user_id: str,
    nickname: str,
) -> tuple[list[CommentOut], list[tuple[str, UserNotificationOut]]]:
    return create_comment_with_notifications_entry(db, review_id, payload, user_id, nickname)


def create_comment(
    db: Session,
    review_id: str,
    payload: CommentCreate,
    user_id: str,
    nickname: str,
) -> list[CommentOut]:
    comments, _ = create_comment_with_notifications(db, review_id, payload, user_id, nickname)
    return comments


