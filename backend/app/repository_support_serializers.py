"""Serialization helpers shared across repository flows."""

from __future__ import annotations

from .db_models import MapPlace, User
from .models import AdminPlaceOut, PlaceOut, SessionUser
from .repository_support_time import format_datetime


def to_place_out(place: MapPlace, total_visit_count: int = 0) -> PlaceOut:
    return PlaceOut(
        id=place.slug,
        positionId=str(place.position_id),
        name=place.name,
        district=place.district,
        category=place.category,
        jamColor=place.jam_color,
        accentColor=place.accent_color,
        imageUrl=place.image_url,
        latitude=place.latitude,
        longitude=place.longitude,
        summary=place.summary,
        description=place.description,
        vibeTags=list(place.vibe_tags or []),
        visitTime=place.visit_time,
        routeHint=place.route_hint,
        stampReward=place.stamp_reward,
        heroLabel=place.hero_label,
        totalVisitCount=total_visit_count,
    )


def to_session_user(
    user: User,
    is_admin: bool,
    profile_image: str | None = None,
    provider: str | None = None,
) -> SessionUser:
    return SessionUser(
        id=user.user_id,
        nickname=user.nickname,
        email=user.email,
        provider=provider or user.provider,
        profileImage=profile_image,
        isAdmin=is_admin,
        profileCompletedAt=user.profile_completed_at.isoformat() if user.profile_completed_at else None,
    )


def to_admin_place_out(place: MapPlace, review_count: int) -> AdminPlaceOut:
    return AdminPlaceOut(
        id=place.slug,
        name=place.name,
        district=place.district,
        category=place.category,
        isActive=place.is_active,
        isManualOverride=place.is_manual_override,
        reviewCount=review_count,
        updatedAt=format_datetime(place.updated_at),
    )
