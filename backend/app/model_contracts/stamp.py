"""Stamping and travel-session API models."""

from __future__ import annotations

from pydantic import Field

from .core import ApiModel


class StampLogOut(ApiModel):
    id: str
    place_id: str = Field(alias='placeId')
    place_name: str = Field(alias='placeName')
    stamped_at: str = Field(alias='stampedAt')
    stamped_date: str = Field(alias='stampedDate')
    visit_number: int = Field(alias='visitNumber')
    visit_label: str = Field(alias='visitLabel')
    travel_session_id: str | None = Field(default=None, alias='travelSessionId')
    is_today: bool = Field(alias='isToday')


class TravelSessionOut(ApiModel):
    id: str
    started_at: str = Field(alias='startedAt')
    ended_at: str = Field(alias='endedAt')
    duration_label: str = Field(alias='durationLabel')
    stamp_count: int = Field(alias='stampCount')
    place_ids: list[str] = Field(alias='placeIds')
    place_names: list[str] = Field(alias='placeNames')
    can_publish: bool = Field(alias='canPublish')
    published_route_id: str | None = Field(default=None, alias='publishedRouteId')
    cover_place_id: str | None = Field(default=None, alias='coverPlaceId')


class StampState(ApiModel):
    collected_place_ids: list[str] = Field(alias='collectedPlaceIds')
    logs: list[StampLogOut] = Field(default_factory=list)
    travel_sessions: list[TravelSessionOut] = Field(default_factory=list, alias='travelSessions')


class StampToggleRequest(ApiModel):
    place_id: str = Field(alias='placeId')
    latitude: float
    longitude: float
