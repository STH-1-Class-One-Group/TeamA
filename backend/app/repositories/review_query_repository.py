from __future__ import annotations

from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from ..db_models import Feed, MapPlace, TravelSession, UserComment, UserStamp
from ..models import CommentOut, ReviewOut
from ..repository_support import (
    build_comment_tree,
    count_visible_comments,
    format_datetime,
    format_visit_label,
    parse_review_id,
)
from ..storage import derive_review_thumbnail_url


def to_review_out(
    feed: Feed,
    current_user_id: str | None = None,
    *,
    comment_count: int | None = None,
    include_comments: bool = True,
) -> ReviewOut:
    comments = list(feed.comments or []) if include_comments else []
    likes = list(feed.likes or [])
    liked_by_me = any(like.user_id == current_user_id for like in likes) if current_user_id else False
    visit_number = feed.stamp.visit_ordinal if feed.stamp else 1
    has_published_route = bool(
        feed.stamp
        and feed.stamp.travel_session
        and any(route.route_id for route in (feed.stamp.travel_session.routes or []))
    )
    return ReviewOut(
        id=str(feed.feed_id),
        userId=feed.user_id,
        placeId=feed.place.slug,
        placeName=feed.place.name,
        author=feed.user.nickname,
        body=feed.body,
        mood=feed.mood,
        badge=feed.badge,
        visitedAt=format_datetime(feed.created_at),
        imageUrl=feed.image_url,
        thumbnailUrl=derive_review_thumbnail_url(feed.image_url),
        commentCount=comment_count if comment_count is not None else count_visible_comments(comments),
        likeCount=len(likes),
        likedByMe=liked_by_me,
        stampId=str(feed.stamp_id) if feed.stamp_id else None,
        visitNumber=visit_number,
        visitLabel=format_visit_label(visit_number),
        travelSessionId=str(feed.stamp.travel_session_id) if feed.stamp and feed.stamp.travel_session_id else None,
        hasPublishedRoute=has_published_route,
        comments=build_comment_tree(comments) if include_comments else [],
    )


def list_reviews(
    db: Session,
    place_id: str | None = None,
    user_id: str | None = None,
    current_user_id: str | None = None,
    *,
    include_comments: bool = False,
) -> list[ReviewOut]:
    stmt = (
        select(Feed)
        .options(
            joinedload(Feed.user),
            joinedload(Feed.place),
            joinedload(Feed.stamp).joinedload(UserStamp.travel_session).joinedload(TravelSession.routes),
            joinedload(Feed.likes),
        )
        .order_by(Feed.created_at.desc(), Feed.feed_id.desc())
    )
    if include_comments:
        stmt = stmt.options(joinedload(Feed.comments).joinedload(UserComment.user))
    if place_id:
        stmt = stmt.join(Feed.place).where(MapPlace.slug == place_id)
    if user_id:
        stmt = stmt.where(Feed.user_id == user_id)
    feeds = db.scalars(stmt).unique().all()
    if include_comments:
        return [to_review_out(feed, current_user_id=current_user_id, include_comments=True) for feed in feeds]

    comment_count_by_feed_id: dict[int, int] = {}
    if feeds:
        feed_ids = [feed.feed_id for feed in feeds]
        comments = db.scalars(
            select(UserComment)
            .where(UserComment.feed_id.in_(feed_ids))
            .order_by(UserComment.feed_id.asc(), UserComment.created_at.asc(), UserComment.comment_id.asc())
        ).all()
        comments_by_feed_id: dict[int, list[UserComment]] = defaultdict(list)
        for comment in comments:
            comments_by_feed_id[comment.feed_id].append(comment)
        comment_count_by_feed_id = {
            feed_id: count_visible_comments(comments_by_feed_id.get(feed_id, []))
            for feed_id in feed_ids
        }
    return [
        to_review_out(
            feed,
            current_user_id=current_user_id,
            comment_count=comment_count_by_feed_id.get(feed.feed_id, 0),
            include_comments=False,
        )
        for feed in feeds
    ]


def get_review_comments(db: Session, review_id: str) -> list[CommentOut]:
    review_key = parse_review_id(review_id)
    comments = db.scalars(
        select(UserComment)
        .options(joinedload(UserComment.user))
        .where(UserComment.feed_id == review_key)
        .order_by(UserComment.created_at.asc(), UserComment.comment_id.asc())
    ).unique().all()
    return build_comment_tree(comments)
