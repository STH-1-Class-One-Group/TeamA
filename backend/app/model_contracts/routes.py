"""User route and course publishing API models."""

from __future__ import annotations

from pydantic import Field

from .core import ApiModel


class UserRouteOut(ApiModel):
    id: str
    author_id: str = Field(alias='authorId')
    author: str
    title: str
    description: str
    mood: str
    like_count: int = Field(alias='likeCount')
    liked_by_me: bool = Field(alias='likedByMe')
    created_at: str = Field(alias='createdAt')
    place_ids: list[str] = Field(alias='placeIds')
    place_names: list[str] = Field(alias='placeNames')
    is_user_generated: bool = Field(alias='isUserGenerated')
    travel_session_id: str | None = Field(default=None, alias='travelSessionId')


class UserRouteLikeResponse(ApiModel):
    route_id: str = Field(alias='routeId')
    like_count: int = Field(alias='likeCount')
    liked_by_me: bool = Field(alias='likedByMe')


class UserRouteCreate(ApiModel):
    title: str
    description: str
    mood: str
    travel_session_id: str = Field(alias='travelSessionId')
    is_public: bool = Field(default=True, alias='isPublic')
