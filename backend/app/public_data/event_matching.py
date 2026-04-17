"""Helpers for linking imported public events to existing map places."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db_models import MapPlace, PublicEvent, PublicEventMapLink


def normalize_match_text(value: str | None) -> str:
    """행사명과 장소명을 비교하기 위한 정규화 문자열을 만듭니다."""

    if not value:
        return ""
    return "".join(ch for ch in value.lower().strip() if ch.isalnum() or "가" <= ch <= "힣")


def find_primary_map_place(db: Session, event: PublicEvent) -> tuple[MapPlace | None, str | None, float]:
    """행사와 가장 적합하게 연결할 수 있는 지도 장소를 찾습니다."""

    venue_key = normalize_match_text(event.venue_name)
    title_key = normalize_match_text(event.title)
    if not venue_key and not title_key:
        return None, None, 0.0

    for place in db.scalars(select(MapPlace).where(MapPlace.is_active.is_(True))).all():
        place_key = normalize_match_text(place.name)
        if venue_key and place_key == venue_key:
            return place, "name-exact", 1.0
        if title_key and place_key and place_key in title_key:
            return place, "title-contains", 0.82
    return None, None, 0.0


def upsert_event_map_link(
    db: Session,
    event: PublicEvent,
    place: MapPlace,
    match_method: str,
    confidence: float,
    now: datetime,
) -> None:
    """행사와 지도 장소 간 연결 정보를 갱신합니다."""

    for existing_link in event.map_links:
        existing_link.is_primary = existing_link.position_id == place.position_id
        existing_link.updated_at = now

    link = db.scalars(
        select(PublicEventMapLink).where(
            PublicEventMapLink.public_event_id == event.public_event_id,
            PublicEventMapLink.position_id == place.position_id,
        )
    ).first()
    if not link:
        link = PublicEventMapLink(
            public_event_id=event.public_event_id,
            position_id=place.position_id,
            linked_at=now,
            created_at=now,
        )
        db.add(link)

    link.match_method = match_method
    link.confidence_score = confidence
    link.is_primary = True
    link.updated_at = now
