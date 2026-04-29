from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from ..db_models import Feed, MapPlace, User, UserComment
from ..models import MyCommentOut, MyPageResponse, MyStatsOut
from ..repository_support import format_datetime, to_place_out, to_session_user
from .errors import RepositoryNotFoundError
from .notification_data_repository import get_unread_notification_count, list_user_notifications
from .review_query_repository import list_reviews
from .stamp_data_repository import get_stamps


def build_my_comments(db: Session, user_id: str) -> list[MyCommentOut]:
    comment_rows = db.scalars(
        select(UserComment)
        .options(joinedload(UserComment.feed).joinedload(Feed.place))
        .where(UserComment.user_id == user_id)
        .order_by(UserComment.created_at.desc(), UserComment.comment_id.desc())
    ).unique().all()
    return [
        MyCommentOut(
            id=str(comment.comment_id),
            reviewId=str(comment.feed_id),
            placeId=comment.feed.place.slug,
            placeName=comment.feed.place.name,
            body="삭제된 댓글입니다." if comment.is_deleted else comment.body,
            isDeleted=comment.is_deleted,
            parentId=str(comment.parent_id) if comment.parent_id else None,
            createdAt=format_datetime(comment.created_at),
            reviewBody=comment.feed.body,
        )
        for comment in comment_rows
        if comment.feed and comment.feed.place and not comment.is_deleted
    ]


def get_my_page(db: Session, user_id: str, is_admin: bool) -> MyPageResponse:
    user = db.get(User, user_id)
    if not user:
        raise RepositoryNotFoundError("사용자 정보를 찾을 수 없어요.")

    reviews = list_reviews(db, user_id=user_id, current_user_id=user_id, include_comments=False)
    stamp_state = get_stamps(db, user_id)
    active_places = db.scalars(select(MapPlace).where(MapPlace.is_active.is_(True)).order_by(MapPlace.position_id.asc())).all()
    visited_place_ids = set(stamp_state.collected_place_ids)
    visited_places = [to_place_out(place) for place in active_places if place.slug in visited_place_ids]
    unvisited_places = [to_place_out(place) for place in active_places if place.slug not in visited_place_ids]

    from .route_data_repository import list_user_routes_for_owner

    routes = list_user_routes_for_owner(db, user_id)
    comments = build_my_comments(db, user_id)
    notifications = list_user_notifications(db, user_id)
    return MyPageResponse(
        user=to_session_user(user, is_admin),
        stats=MyStatsOut(
            reviewCount=len(reviews),
            stampCount=len(stamp_state.logs),
            uniquePlaceCount=len(visited_places),
            totalPlaceCount=len(active_places),
            routeCount=len(routes),
        ),
        reviews=reviews,
        comments=comments,
        notifications=notifications,
        unreadNotificationCount=get_unread_notification_count(db, user_id),
        stampLogs=stamp_state.logs,
        travelSessions=stamp_state.travel_sessions,
        visitedPlaces=visited_places,
        unvisitedPlaces=unvisited_places,
        collectedPlaces=visited_places,
        routes=routes,
    )
