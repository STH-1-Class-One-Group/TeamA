"""Normalized repository for JamIssue domain flows."""

from __future__ import annotations

from sqlalchemy.orm import Session

from .config import Settings
from .db_models import Course, Feed, UserNotification
from .models import (
    AdminPlaceOut,
    AdminSummaryResponse,
    BootstrapResponse,
    CategoryFilter,
    CommentCreate,
    CommentOut,
    CourseMood,
    CourseOut,
    MyCommentOut,
    MyPageResponse,
    NotificationDeleteResponse,
    NotificationReadResponse,
    PlaceOut,
    ProfileUpdateRequest,
    PublicImportResponse,
    ReviewCreate,
    ReviewLikeResponse,
    ReviewOut,
    StampState,
    UserNotificationOut,
)
from .naver_oauth import NaverProfile
from .repositories.admin_data_repository import (
    get_admin_summary as get_admin_summary_entry,
    import_public_bundle as import_public_bundle_entry,
    update_place_visibility as update_place_visibility_entry,
)
from .repositories.content_query_repository import (
    get_bootstrap as get_bootstrap_entry,
    get_place as get_place_entry,
    list_courses as list_courses_entry,
    list_places as list_places_entry,
    to_course_out as to_course_out_entry,
)
from .repositories.account_data_repository import delete_account as delete_account_entry
from .repositories.my_page_data_repository import build_my_comments as build_my_comments_entry, get_my_page as get_my_page_entry
from .repositories.notification_data_repository import (
    create_user_notification as create_user_notification_entry,
    delete_notification as delete_notification_entry,
    get_unread_notification_count as get_unread_notification_count_entry,
    get_unread_notification_counts as get_unread_notification_counts_entry,
    list_user_notifications as list_user_notifications_entry,
    mark_all_notifications_read as mark_all_notifications_read_entry,
    mark_notification_read as mark_notification_read_entry,
    to_notification_out as to_notification_out_entry,
)
from .repositories.profile_data_repository import (
    build_unique_social_nickname as build_unique_social_nickname_entry,
    ensure_unique_nickname as ensure_unique_nickname_entry,
    link_naver_identity as link_naver_identity_entry,
    link_social_identity as link_social_identity_entry,
    update_user_profile as update_user_profile_entry,
    upsert_naver_user as upsert_naver_user_entry,
    upsert_social_user as upsert_social_user_entry,
)
from .repositories.public_bundle_repository import cleanup_legacy_demo_content as cleanup_legacy_demo_content_entry, load_public_bundle as load_public_bundle_entry
from .repositories.review_query_repository import (
    get_review_comments as get_review_comments_entry,
    list_reviews as list_reviews_entry,
    to_review_out as to_review_out_entry,
)
from .repositories.review_write_repository import (
    create_comment_with_notifications as create_comment_with_notifications_entry,
    create_review as create_review_entry,
    delete_comment as delete_comment_entry,
    delete_review as delete_review_entry,
    toggle_review_like as toggle_review_like_entry,
)
from .repositories.stamp_data_repository import get_stamps as get_stamps_entry, toggle_stamp as toggle_stamp_entry
from .repositories.user_data_repository import get_or_create_user as get_or_create_user_entry
from .repository_support import utcnow_naive

def get_or_create_user(
    db: Session,
    user_id: str,
    nickname: str | None = None,
    *,
    email: str | None = None,
    provider: str = "demo",
) -> User:
    return get_or_create_user_entry(
        db,
        user_id,
        nickname,
        email=email,
        provider=provider,
    )
def ensure_unique_nickname(db: Session, nickname: str, *, exclude_user_id: str | None = None) -> str:
    return ensure_unique_nickname_entry(db, nickname, exclude_user_id=exclude_user_id)


def build_unique_social_nickname(db: Session, nickname: str, *, exclude_user_id: str | None = None) -> str:
    return build_unique_social_nickname_entry(db, nickname, exclude_user_id=exclude_user_id)


def upsert_social_user(
    db: Session,
    *,
    provider: str,
    provider_user_id: str,
    nickname: str,
    email: str | None = None,
    profile_image: str | None = None,
) -> User:
    return upsert_social_user_entry(
        db,
        provider=provider,
        provider_user_id=provider_user_id,
        nickname=nickname,
        email=email,
        profile_image=profile_image,
    )

def link_social_identity(
    db: Session,
    *,
    user_id: str,
    provider: str,
    provider_user_id: str,
    email: str | None = None,
    profile_image: str | None = None,
) -> User:
    return link_social_identity_entry(
        db,
        user_id=user_id,
        provider=provider,
        provider_user_id=provider_user_id,
        email=email,
        profile_image=profile_image,
    )


def upsert_naver_user(db: Session, profile: NaverProfile) -> User:
    return upsert_naver_user_entry(db, profile)


def link_naver_identity(db: Session, user_id: str, profile: NaverProfile) -> User:
    return link_naver_identity_entry(db, user_id, profile)


def update_user_profile(db: Session, user_id: str, payload: ProfileUpdateRequest) -> User:
    return update_user_profile_entry(db, user_id, payload)


def to_review_out(
    feed: Feed,
    current_user_id: str | None = None,
    *,
    comment_count: int | None = None,
    include_comments: bool = True,
) -> ReviewOut:
    return to_review_out_entry(
        feed,
        current_user_id=current_user_id,
        comment_count=comment_count,
        include_comments=include_comments,
    )


def to_course_out(course: Course) -> CourseOut:
    return to_course_out_entry(course)


def list_places(db: Session, category: CategoryFilter = "all") -> list[PlaceOut]:
    return list_places_entry(db, category)


def get_place(db: Session, place_id: str) -> PlaceOut:
    return get_place_entry(db, place_id)

def list_reviews(
    db: Session,
    place_id: str | None = None,
    user_id: str | None = None,
    current_user_id: str | None = None,
    *,
    include_comments: bool = False,
) -> list[ReviewOut]:
    return list_reviews_entry(
        db,
        place_id=place_id,
        user_id=user_id,
        current_user_id=current_user_id,
        include_comments=include_comments,
    )


def get_review_comments(db: Session, review_id: str) -> list[CommentOut]:
    return get_review_comments_entry(db, review_id)


def create_review(db: Session, payload: ReviewCreate, user_id: str, nickname: str) -> ReviewOut:
    return create_review_entry(db, payload, user_id, nickname)


def toggle_review_like(db: Session, review_id: str, user_id: str, nickname: str) -> ReviewLikeResponse:
    return toggle_review_like_entry(db, review_id, user_id, nickname)

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


def delete_comment(
    db: Session,
    review_id: str,
    comment_id: str,
    user_id: str,
    *,
    is_admin: bool = False,
) -> list[CommentOut]:
    return delete_comment_entry(db, review_id, comment_id, user_id, is_admin=is_admin)


def delete_review(db: Session, review_id: str, user_id: str, *, is_admin: bool = False) -> None:
    delete_review_entry(db, review_id, user_id, is_admin=is_admin)


def delete_account(db: Session, user_id: str) -> None:
    delete_account_entry(db, user_id)

def list_courses(db: Session, mood: CourseMood | None = None) -> list[CourseOut]:
    return list_courses_entry(db, mood)


def get_stamps(db: Session, user_id: str | None) -> StampState:
    return get_stamps_entry(db, user_id)


def toggle_stamp(
    db: Session,
    user_id: str,
    place_id: str,
    latitude: float,
    longitude: float,
    radius_meters: int,
) -> StampState:
    return toggle_stamp_entry(
        db,
        user_id,
        place_id,
        latitude,
        longitude,
        radius_meters,
    )


def build_my_comments(db: Session, user_id: str) -> list[MyCommentOut]:
    return build_my_comments_entry(db, user_id)


def to_notification_out(notification: UserNotification) -> UserNotificationOut:
    return to_notification_out_entry(notification)


def list_user_notifications(db: Session, user_id: str, *, limit: int = 50) -> list[UserNotificationOut]:
    return list_user_notifications_entry(db, user_id, limit=limit)


def get_unread_notification_count(db: Session, user_id: str) -> int:
    return get_unread_notification_count_entry(db, user_id)


def get_unread_notification_counts(db: Session, user_ids: list[str]) -> dict[str, int]:
    return get_unread_notification_counts_entry(db, user_ids)


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
    return create_user_notification_entry(
        db,
        user_id=user_id,
        actor_user_id=actor_user_id,
        notification_type=notification_type,
        title=title,
        body=body,
        review_id=review_id,
        comment_id=comment_id,
        route_id=route_id,
        payload_metadata=payload_metadata,
    )


def mark_notification_read(db: Session, notification_id: str, user_id: str) -> NotificationReadResponse:
    return mark_notification_read_entry(db, notification_id, user_id)


def mark_all_notifications_read(db: Session, user_id: str) -> int:
    return mark_all_notifications_read_entry(db, user_id)


def delete_notification(db: Session, notification_id: str, user_id: str) -> NotificationDeleteResponse:
    return delete_notification_entry(db, notification_id, user_id)

def get_my_page(db: Session, user_id: str, is_admin: bool) -> MyPageResponse:
    return get_my_page_entry(db, user_id, is_admin)

def get_bootstrap(db: Session, user_id: str | None) -> BootstrapResponse:
    return get_bootstrap_entry(db, user_id)


def get_admin_summary(db: Session, settings: Settings) -> AdminSummaryResponse:
    return get_admin_summary_entry(db, settings)


def update_place_visibility(
    db: Session,
    place_id: str,
    is_active: bool | None = None,
    is_manual_override: bool | None = None,
) -> AdminPlaceOut:
    return update_place_visibility_entry(
        db,
        place_id,
        is_active=is_active,
        is_manual_override=is_manual_override,
    )


def cleanup_legacy_demo_content(db: Session) -> None:
    cleanup_legacy_demo_content_entry(db)


def load_public_bundle(settings: Settings) -> dict:
    return load_public_bundle_entry(settings)


def import_public_bundle(db: Session, settings: Settings) -> PublicImportResponse:
    return import_public_bundle_entry(db, settings)


