"""Review and comment API models."""

from __future__ import annotations

from pydantic import Field

from .core import ApiModel, ReviewMood


class CommentOut(ApiModel):
    id: str
    user_id: str = Field(alias='userId')
    author: str
    body: str
    parent_id: str | None = Field(default=None, alias='parentId')
    is_deleted: bool = Field(alias='isDeleted')
    created_at: str = Field(alias='createdAt')
    replies: list['CommentOut'] = Field(default_factory=list)


class ReviewOut(ApiModel):
    id: str
    user_id: str = Field(alias='userId')
    place_id: str = Field(alias='placeId')
    place_name: str = Field(alias='placeName')
    author: str
    body: str
    mood: ReviewMood | str
    badge: str
    visited_at: str = Field(alias='visitedAt')
    image_url: str | None = Field(default=None, alias='imageUrl')
    thumbnail_url: str | None = Field(default=None, alias='thumbnailUrl')
    comment_count: int = Field(alias='commentCount')
    like_count: int = Field(default=0, alias='likeCount')
    liked_by_me: bool = Field(default=False, alias='likedByMe')
    stamp_id: str | None = Field(default=None, alias='stampId')
    visit_number: int = Field(default=1, alias='visitNumber')
    visit_label: str = Field(alias='visitLabel')
    travel_session_id: str | None = Field(default=None, alias='travelSessionId')
    has_published_route: bool = Field(default=False, alias='hasPublishedRoute')
    comments: list[CommentOut] = Field(default_factory=list)


class ReviewLikeResponse(ApiModel):
    review_id: str = Field(alias='reviewId')
    like_count: int = Field(alias='likeCount')
    liked_by_me: bool = Field(alias='likedByMe')


class ReviewCreate(ApiModel):
    place_id: str = Field(alias='placeId')
    stamp_id: str = Field(alias='stampId')
    body: str
    mood: ReviewMood | str
    image_url: str | None = Field(default=None, alias='imageUrl')


class CommentCreate(ApiModel):
    body: str
    parent_id: str | None = Field(default=None, alias='parentId')
