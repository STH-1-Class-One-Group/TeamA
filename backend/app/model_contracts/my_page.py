"""My page, comments, and notification API models."""

from __future__ import annotations

from pydantic import Field

from .auth import SessionUser
from .content import PlaceOut
from .core import ApiModel
from .review import ReviewOut
from .routes import UserRouteOut
from .stamp import StampLogOut, TravelSessionOut


class MyCommentOut(ApiModel):
    id: str
    review_id: str = Field(alias='reviewId')
    place_id: str = Field(alias='placeId')
    place_name: str = Field(alias='placeName')
    body: str
    is_deleted: bool = Field(alias='isDeleted')
    parent_id: str | None = Field(default=None, alias='parentId')
    created_at: str = Field(alias='createdAt')
    review_body: str = Field(alias='reviewBody')


class UserNotificationOut(ApiModel):
    id: str
    type: str
    title: str
    body: str
    created_at: str = Field(alias='createdAt')
    is_read: bool = Field(alias='isRead')
    review_id: str | None = Field(default=None, alias='reviewId')
    comment_id: str | None = Field(default=None, alias='commentId')
    route_id: str | None = Field(default=None, alias='routeId')
    actor_name: str | None = Field(default=None, alias='actorName')


class NotificationReadResponse(ApiModel):
    notification_id: str = Field(alias='notificationId')
    read: bool


class NotificationDeleteResponse(ApiModel):
    notification_id: str = Field(alias='notificationId')
    deleted: bool


class MyStatsOut(ApiModel):
    review_count: int = Field(alias='reviewCount')
    stamp_count: int = Field(alias='stampCount')
    unique_place_count: int = Field(alias='uniquePlaceCount')
    total_place_count: int = Field(alias='totalPlaceCount')
    route_count: int = Field(default=0, alias='routeCount')


class MyPageResponse(ApiModel):
    user: SessionUser
    stats: MyStatsOut
    reviews: list[ReviewOut]
    comments: list[MyCommentOut] = Field(default_factory=list)
    notifications: list[UserNotificationOut] = Field(default_factory=list)
    unread_notification_count: int = Field(default=0, alias='unreadNotificationCount')
    stamp_logs: list[StampLogOut] = Field(default_factory=list, alias='stampLogs')
    travel_sessions: list[TravelSessionOut] = Field(default_factory=list, alias='travelSessions')
    visited_places: list[PlaceOut] = Field(default_factory=list, alias='visitedPlaces')
    unvisited_places: list[PlaceOut] = Field(default_factory=list, alias='unvisitedPlaces')
    collected_places: list[PlaceOut] = Field(default_factory=list, alias='collectedPlaces')
    routes: list[UserRouteOut] = Field(default_factory=list)
