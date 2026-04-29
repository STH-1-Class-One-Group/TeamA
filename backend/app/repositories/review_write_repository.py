from __future__ import annotations

from datetime import datetime, time, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from ..db_models import Feed, FeedLike, MapPlace, TravelSession, UserComment, UserStamp
from ..models import CommentCreate, CommentOut, ReviewCreate, ReviewLikeResponse, ReviewOut, UserNotificationOut
from ..repository_support import BADGE_BY_MOOD, format_visit_label, parse_comment_id, parse_review_id, parse_stamp_id, to_seoul_date, utcnow_naive
from .errors import RepositoryNotFoundError, RepositoryPermissionError, RepositoryValidationError
from .notification_data_repository import create_user_notification
from .review_query_repository import get_review_comments, to_review_out
from .user_data_repository import get_or_create_user


def create_review(db: Session, payload: ReviewCreate, user_id: str, nickname: str) -> ReviewOut:
    body = payload.body.strip()
    if not body:
        raise RepositoryValidationError("리뷰 본문을 적어 주세요.")

    place = db.scalars(select(MapPlace).where(MapPlace.slug == payload.place_id, MapPlace.is_active.is_(True))).first()
    if not place:
        raise RepositoryNotFoundError("장소를 찾을 수 없어요.")

    stamp = db.scalars(
        select(UserStamp)
        .options(joinedload(UserStamp.place))
        .where(UserStamp.stamp_id == parse_stamp_id(payload.stamp_id))
    ).first()
    if not stamp or stamp.user_id != user_id:
        raise RepositoryNotFoundError("해당 방문 스탬프를 찾을 수 없어요.")
    if stamp.position_id != place.position_id:
        raise RepositoryValidationError("선택한 장소와 스탬프가 일치하지 않아요.")

    existing_feed = db.scalars(select(Feed).where(Feed.stamp_id == stamp.stamp_id)).first()
    if existing_feed:
        raise RepositoryValidationError("같은 방문 기록으로는 피드를 한 번만 작성할 수 있어요.")

    now = utcnow_naive()
    today = to_seoul_date(now)
    day_start = datetime.combine(today, time.min)
    day_end = day_start + timedelta(days=1)
    existing_daily_feed = db.scalars(
        select(Feed.feed_id).where(Feed.user_id == user_id, Feed.position_id == place.position_id, Feed.created_at >= day_start, Feed.created_at < day_end)
    ).first()
    if existing_daily_feed:
        raise RepositoryValidationError("같은 장소에는 하루에 한 번만 피드를 작성할 수 있어요.")

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
        raise RepositoryNotFoundError("리뷰를 찾지 못했어요.")
    if feed.user_id == user_id:
        raise RepositoryValidationError("내 리뷰에는 좋아요를 누를 수 없어요.")

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
        raise RepositoryValidationError("댓글 내용을 적어 주세요.")

    review_key = parse_review_id(review_id)
    feed = db.get(Feed, review_key)
    if not feed:
        raise RepositoryNotFoundError("리뷰를 찾을 수 없어요.")

    parent_id: int | None = None
    parent_comment: UserComment | None = None
    if payload.parent_id:
        parent_id = parse_comment_id(payload.parent_id)
        parent_comment = db.get(UserComment, parent_id)
        if not parent_comment or parent_comment.feed_id != review_key:
            raise RepositoryValidationError("같은 리뷰 안의 댓글에만 답글을 달 수 있어요.")
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
        raise RepositoryNotFoundError("댓글을 찾지 못했어요.")
    if comment.user_id != user_id and not is_admin:
        raise RepositoryPermissionError("내 댓글만 삭제할 수 있어요.")
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
        raise RepositoryNotFoundError("리뷰를 찾지 못했어요.")
    if feed.user_id != user_id and not is_admin:
        raise RepositoryPermissionError("내 리뷰만 삭제할 수 있어요.")
    db.delete(feed)
    db.commit()
