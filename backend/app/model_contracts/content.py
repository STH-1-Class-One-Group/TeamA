"""Place, course, and bootstrap API models."""

from __future__ import annotations

from pydantic import Field

from .core import ApiModel, CategoryType, CourseMood
from .review import ReviewOut
from .stamp import StampState


class PlaceOut(ApiModel):
    id: str
    position_id: str | None = Field(default=None, alias='positionId')
    name: str
    district: str
    category: CategoryType
    jam_color: str = Field(alias='jamColor')
    accent_color: str = Field(alias='accentColor')
    image_url: str | None = Field(default=None, alias='imageUrl')
    image_storage_path: str | None = Field(default=None, alias='imageStoragePath')
    latitude: float
    longitude: float
    summary: str
    description: str
    vibe_tags: list[str] = Field(alias='vibeTags')
    visit_time: str = Field(alias='visitTime')
    route_hint: str = Field(alias='routeHint')
    stamp_reward: str = Field(alias='stampReward')
    hero_label: str = Field(alias='heroLabel')
    total_visit_count: int = Field(default=0, alias='totalVisitCount')


class CourseOut(ApiModel):
    id: str
    title: str
    mood: CourseMood | str
    duration: str
    note: str
    color: str
    place_ids: list[str] = Field(alias='placeIds')


class BootstrapResponse(ApiModel):
    places: list[PlaceOut]
    reviews: list[ReviewOut]
    courses: list[CourseOut]
    stamps: StampState
    has_real_data: bool = Field(alias='hasRealData')
