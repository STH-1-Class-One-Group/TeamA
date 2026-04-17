"""Import public event payloads into the local persistence model."""

from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import Settings
from ..db_models import PublicEvent
from .event_client import default_event_source_payload, read_public_event_payload
from .event_matching import find_primary_map_place, upsert_event_map_link
from .event_normalizer import normalize_public_event
from .service import upsert_public_source, utc_now


def extract_event_items(payload: Any) -> list[dict[str, Any]]:
    """여러 OpenAPI 응답 형식에서 행사 리스트를 추출합니다."""

    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if not isinstance(payload, dict):
        return []

    candidates: list[Any] = [
        payload.get("items"),
        payload.get("data"),
        payload.get("records"),
        payload.get("result"),
        payload.get("response", {}).get("body", {}).get("items"),
        payload.get("response", {}).get("body", {}).get("item"),
    ]

    for candidate in candidates:
        if isinstance(candidate, dict):
            if isinstance(candidate.get("item"), list):
                return [item for item in candidate["item"] if isinstance(item, dict)]
            if isinstance(candidate.get("item"), dict):
                return [candidate["item"]]
        if isinstance(candidate, list):
            return [item for item in candidate if isinstance(item, dict)]
    return []


def import_public_events(db: Session, settings: Settings) -> int:
    """행사 원본을 읽어 public_event 테이블에 적재합니다."""

    raw_payload = read_public_event_payload(settings)
    source_payload = default_event_source_payload(settings)
    now = utc_now()
    source = upsert_public_source(db, source_payload, now)
    db.flush()

    imported_count = 0
    seen_external_ids: set[str] = set()
    for raw_event in extract_event_items(raw_payload):
        normalized = normalize_public_event(raw_event, settings.public_event_city_keyword)
        if not normalized:
            continue

        event = db.scalars(
            select(PublicEvent).where(
                PublicEvent.source_id == source.source_id,
                PublicEvent.external_id == normalized.external_id,
            )
        ).first()
        created = event is None
        if not event:
            event = PublicEvent(
                source_id=source.source_id,
                external_id=normalized.external_id,
                created_at=now,
            )
            db.add(event)

        event.title = normalized.title
        event.venue_name = normalized.venue_name
        event.district = normalized.district
        event.address = normalized.address
        event.road_address = normalized.road_address
        event.latitude = normalized.latitude
        event.longitude = normalized.longitude
        event.starts_at = normalized.starts_at
        event.ends_at = normalized.ends_at
        event.summary = normalized.summary
        event.description = normalized.description
        event.image_url = normalized.image_url
        event.contact = normalized.contact
        event.source_page_url = normalized.source_page_url
        event.source_updated_at = normalized.source_updated_at
        event.raw_payload = raw_event
        event.normalized_payload = normalized.normalized_payload
        event.sync_status = "imported"
        event.updated_at = now
        db.flush()

        map_place, match_method, confidence = find_primary_map_place(db, event)
        if map_place and match_method:
            upsert_event_map_link(db, event, map_place, match_method, confidence, now)
            event.sync_status = "linked"

        if created:
            imported_count += 1
        seen_external_ids.add(normalized.external_id)

    stale_events = db.scalars(select(PublicEvent).where(PublicEvent.source_id == source.source_id)).all()
    for stale_event in stale_events:
        if stale_event.external_id in seen_external_ids:
            continue
        stale_event.sync_status = "stale"
        stale_event.updated_at = now

    source.last_imported_at = now
    source.updated_at = now
    db.commit()
    return imported_count
