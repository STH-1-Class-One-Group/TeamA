"""Normalized repository for JamIssue domain flows."""

from __future__ import annotations

from datetime import datetime, time, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from .config import Settings
from .db_models import Course, Feed, FeedLike, MapPlace, TravelSession, User, UserComment, UserNotification, UserStamp
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
from .repositories.content_query_repository import (
    get_bootstrap as get_bootstrap_entry,
    get_place as get_place_entry,
    list_courses as list_courses_entry,
    list_places as list_places_entry,
    to_course_out as to_course_out_entry,
)
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
from .repositories.public_bundle_repository import (
    cleanup_legacy_demo_content as cleanup_legacy_demo_content_entry,
    import_public_bundle as import_public_bundle_entry,
    load_public_bundle as load_public_bundle_entry,
)
from .repositories.review_query_repository import (
    get_review_comments as get_review_comments_entry,
    list_reviews as list_reviews_entry,
    to_review_out as to_review_out_entry,
)
from .repositories.stamp_data_repository import get_stamps as get_stamps_entry, toggle_stamp as toggle_stamp_entry
from .repositories.user_data_repository import get_or_create_user as get_or_create_user_entry
from .repository_support import (
    BADGE_BY_MOOD,
    format_visit_label,
    parse_comment_id,
    parse_review_id,
    parse_stamp_id,
    to_admin_place_out,
    to_seoul_date,
    utcnow_naive,
)

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
    body = payload.body.strip()
    if not body:
        raise ValueError("리뷰 본문을 적어 주세요.")

    place = db.scalars(select(MapPlace).where(MapPlace.slug == payload.place_id, MapPlace.is_active.is_(True))).first()
    if not place:
        raise ValueError("장소를 찾을 수 없어요.")

    stamp = db.scalars(
        select(UserStamp)
        .options(joinedload(UserStamp.place))
        .where(UserStamp.stamp_id == parse_stamp_id(payload.stamp_id))
    ).first()
    if not stamp or stamp.user_id != user_id:
        raise ValueError("해당 방문 스탬프를 찾을 수 없어요.")
    if stamp.position_id != place.position_id:
        raise ValueError("선택한 장소와 스탬프가 일치하지 않아요.")

    existing_feed = db.scalars(select(Feed).where(Feed.stamp_id == stamp.stamp_id)).first()
    if existing_feed:
        raise ValueError("같은 방문 기록으로는 피드를 한 번만 작성할 수 있어요.")

    now = utcnow_naive()
    today = to_seoul_date(now)
    day_start = datetime.combine(today, time.min)
    day_end = day_start + timedelta(days=1)
    existing_daily_feed = db.scalars(
        select(Feed.feed_id).where(Feed.user_id == user_id, Feed.position_id == place.position_id, Feed.created_at >= day_start, Feed.created_at < day_end)
    ).first()
    if existing_daily_feed:
        raise ValueError("같은 장소에는 하루에 한 번만 피드를 작성할 수 있어요.")

    user = get_or_create_user(db, user_id, nickname)
    feed = Feed(
        position_id=place.position_id,
        user_id=user.user_id,
        stamp_id=stamp.stamp_id,
        body=body,
        mood=payload.mood,
        badge=BADGE_BY_MOOD.get(payload.mood, format_visit_label(stamp.visit_ordinal)),
        image_url=payload.image_url,
        created_at=now,
        updated_at=now,
    )
    db.add(feed)
    db.commit()

    stored_feed = db.scalars(
        select(Feed)
        .options(
            joinedload(Feed.user),
            joinedload(Feed.place),
            joinedload(Feed.stamp).joinedload(UserStamp.travel_session).joinedload(TravelSession.routes),
            joinedload(Feed.likes),
            joinedload(Feed.comments).joinedload(UserComment.user),
        )
        .where(Feed.feed_id == feed.feed_id)
    ).unique().one()
    return to_review_out(stored_feed, current_user_id=user.user_id)


def toggle_review_like(db: Session, review_id: str, user_id: str, nickname: str) -> ReviewLikeResponse:
    review_key = parse_review_id(review_id)
    feed = db.scalars(select(Feed).options(joinedload(Feed.likes)).where(Feed.feed_id == review_key)).unique().first()
    if not feed:
        raise ValueError("리뷰를 찾지 못했어요.")
    if feed.user_id == user_id:
        raise ValueError("내 리뷰에는 좋아요를 누를 수 없어요.")

    user = get_or_create_user(db, user_id, nickname)
    existing_like = db.scalars(
        select(FeedLike).where(FeedLike.feed_id == feed.feed_id, FeedLike.user_id == user.user_id)
    ).first()
    if existing_like:
        db.delete(existing_like)
        liked_by_me = False
    else:
        db.add(FeedLike(feed_id=feed.feed_id, user_id=user.user_id, created_at=utcnow_naive()))
        liked_by_me = True
    db.commit()
    like_count = db.scalar(select(func.count()).select_from(FeedLike).where(FeedLike.feed_id == feed.feed_id)) or 0
    return ReviewLikeResponse(reviewId=str(feed.feed_id), likeCount=int(like_count), likedByMe=liked_by_me)

def create_comment_with_notifications(
    db: Session,
    review_id: str,
    payload: CommentCreate,
    user_id: str,
    nickname: str,
) -> tuple[list[CommentOut], list[tuple[str, UserNotificationOut]]]:
    body = payload.body.strip()
    if not body:
        raise ValueError("댓글 내용을 적어 주세요.")

    review_key = parse_review_id(review_id)
    feed = db.get(Feed, review_key)
    if not feed:
        raise ValueError("리뷰를 찾을 수 없어요.")

    parent_id: int | None = None
    parent_comment: UserComment | None = None
    if payload.parent_id:
        parent_id = parse_comment_id(payload.parent_id)
        parent_comment = db.get(UserComment, parent_id)
        if not parent_comment or parent_comment.feed_id != review_key:
            raise ValueError("같은 리뷰 안의 댓글에만 답글을 달 수 있어요.")
        # Enforce 2-level depth: if parent is itself a reply, use its root comment instead
        if parent_comment.parent_id is not None:
            parent_id = parent_comment.parent_id
            parent_comment = db.get(UserComment, parent_comment.parent_id)

    user = get_or_create_user(db, user_id, nickname)
    now = utcnow_naive()
    comment = UserComment(
        feed_id=review_key,
        user_id=user.user_id,
        parent_id=parent_id,
        body=body,
        is_deleted=False,
        created_at=now,
        updated_at=now,
    )
    db.add(comment)
    db.flush()

    notifications: list[tuple[str, UserNotificationOut]] = []
    if parent_comment and parent_comment.user_id != user.user_id:
        notification = create_user_notification(
            db,
            user_id=parent_comment.user_id,
            actor_user_id=user.user_id,
            notification_type="comment-reply",
            title=f"{user.nickname}님이 내 댓글에 답글을 남겼어요.",
            body=body[:255],
            review_id=feed.feed_id,
            comment_id=comment.comment_id,
            payload_metadata={"reviewId": str(feed.feed_id), "commentId": str(comment.comment_id)},
        )
        if notification:
            notifications.append((parent_comment.user_id, notification))

    if feed.user_id != user.user_id and feed.user_id != (parent_comment.user_id if parent_comment else None):
        notification = create_user_notification(
            db,
            user_id=feed.user_id,
            actor_user_id=user.user_id,
            notification_type="review-comment",
            title=f"{user.nickname}님이 내 피드에 댓글을 남겼어요.",
            body=body[:255],
            review_id=feed.feed_id,
            comment_id=comment.comment_id,
            payload_metadata={"reviewId": str(feed.feed_id), "commentId": str(comment.comment_id)},
        )
        if notification:
            notifications.append((feed.user_id, notification))
    db.commit()
    return get_review_comments(db, review_id), notifications


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
    review_key = parse_review_id(review_id)
    comment_key = parse_comment_id(comment_id)
    comment = db.scalars(
        select(UserComment).where(UserComment.comment_id == comment_key, UserComment.feed_id == review_key)
    ).first()
    if not comment:
        raise ValueError("댓글을 찾지 못했어요.")
    if comment.user_id != user_id and not is_admin:
        raise PermissionError("내 댓글만 삭제할 수 있어요.")
    if not comment.is_deleted:
        comment.is_deleted = True
        comment.body = ""
        comment.updated_at = utcnow_naive()
        db.commit()
    return get_review_comments(db, review_id)


def delete_review(db: Session, review_id: str, user_id: str, *, is_admin: bool = False) -> None:
    review_key = parse_review_id(review_id)
    feed = db.get(Feed, review_key)
    if not feed:
        raise ValueError("리뷰를 찾지 못했어요.")
    if feed.user_id != user_id and not is_admin:
        raise PermissionError("내 리뷰만 삭제할 수 있어요.")
    db.delete(feed)
    db.commit()


def delete_account(db: Session, user_id: str) -> None:
    user = db.get(User, user_id)
    if not user:
        raise ValueError("사용자 정보를 찾지 못했어요.")
    db.delete(user)
    db.commit()

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
    user_count = db.scalar(select(func.count()).select_from(User)) or 0
    place_count = db.scalar(select(func.count()).select_from(MapPlace)) or 0
    review_count = db.scalar(select(func.count()).select_from(Feed)) or 0
    comment_count = db.scalar(select(func.count()).select_from(UserComment)) or 0
    stamp_count = db.scalar(select(func.count()).select_from(UserStamp)) or 0
    place_rows = db.execute(
        select(MapPlace, func.count(Feed.feed_id))
        .outerjoin(Feed, Feed.position_id == MapPlace.position_id)
        .group_by(MapPlace.position_id)
        .order_by(MapPlace.is_active.desc(), MapPlace.name.asc())
    ).all()
    return AdminSummaryResponse(
        userCount=int(user_count),
        placeCount=int(place_count),
        reviewCount=int(review_count),
        commentCount=int(comment_count),
        stampCount=int(stamp_count),
        sourceReady=settings.public_data_file_path.exists() or bool(settings.public_data_source_url),
        places=[to_admin_place_out(place, int(count)) for place, count in place_rows],
    )


def update_place_visibility(
    db: Session,
    place_id: str,
    is_active: bool | None = None,
    is_manual_override: bool | None = None,
) -> AdminPlaceOut:
    """장소 노출 여부와 공공데이터 덮어쓰기 보호 여부를 변경합니다."""

    place = db.scalars(select(MapPlace).where(MapPlace.slug == place_id)).first()
    if not place:
        raise ValueError("장소를 찾을 수 없어요.")

    changed = False
    if is_active is not None and place.is_active != is_active:
        place.is_active = is_active
        changed = True
    if is_manual_override is not None and place.is_manual_override != is_manual_override:
        place.is_manual_override = is_manual_override
        changed = True
    if changed:
        place.updated_at = utcnow_naive()
        db.commit()

    review_count = db.scalar(select(func.count()).select_from(Feed).where(Feed.position_id == place.position_id)) or 0
    return to_admin_place_out(place, int(review_count))


def cleanup_legacy_demo_content(db: Session) -> None:
    cleanup_legacy_demo_content_entry(db)


def load_public_bundle(settings: Settings) -> dict:
    return load_public_bundle_entry(settings)


def import_public_bundle(db: Session, settings: Settings) -> PublicImportResponse:
    return import_public_bundle_entry(db, settings)


