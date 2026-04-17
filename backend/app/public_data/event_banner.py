"""Build banner responses for imported public events."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from ..config import Settings
from ..db_models import PublicDataSource, PublicEvent, PublicEventMapLink
from ..public_event_models import PublicEventBannerItem, PublicEventBannerResponse
from .event_import import import_public_events


def should_refresh_events(source: PublicDataSource | None, settings: Settings) -> bool:
    """행사 원본을 다시 가져와야 하는지 판단합니다."""

    if not (settings.public_event_source_url or settings.public_event_file_path.exists()):
        return False
    return not source or not source.last_imported_at


def format_date_label(starts_at: datetime, ends_at: datetime) -> str:
    """배너 카드의 날짜 표시 문구를 만듭니다."""

    if starts_at.date() == ends_at.date():
        return f"{starts_at.month}월 {starts_at.day}일"
    return f"{starts_at.month}월 {starts_at.day}일 - {ends_at.month}월 {ends_at.day}일"


def build_public_event_banner_response(db: Session, settings: Settings) -> PublicEventBannerResponse:
    """배너 프리뷰에 사용하는 행사 일정 응답을 만듭니다."""

    source = db.scalars(
        select(PublicDataSource).where(PublicDataSource.source_key == "jamissue-public-event-feed")
    ).first()
    if should_refresh_events(source, settings):
        try:
            import_public_events(db, settings)
            source = db.scalars(
                select(PublicDataSource).where(PublicDataSource.source_key == "jamissue-public-event-feed")
            ).first()
        except Exception:
            db.rollback()

    now = datetime.now(UTC).replace(tzinfo=None)
    events = db.scalars(
        select(PublicEvent)
        .options(joinedload(PublicEvent.map_links).joinedload(PublicEventMapLink.place))
        .where(PublicEvent.ends_at >= now)
        .where(PublicEvent.sync_status != "stale")
        .order_by(PublicEvent.starts_at.asc(), PublicEvent.public_event_id.asc())
        .limit(settings.public_event_limit)
    ).unique().all()

    items: list[PublicEventBannerItem] = []
    for event in events:
        primary_link = next((link for link in event.map_links if link.is_primary and link.place), None)
        items.append(
            PublicEventBannerItem(
                id=str(event.public_event_id),
                title=event.title,
                venueName=event.venue_name,
                district=event.district,
                startDate=event.starts_at.strftime("%Y-%m-%d"),
                endDate=event.ends_at.strftime("%Y-%m-%d"),
                dateLabel=format_date_label(event.starts_at, event.ends_at),
                summary=event.summary,
                sourcePageUrl=event.source_page_url,
                linkedPlaceName=primary_link.place.name if primary_link else None,
                isOngoing=event.starts_at <= now <= event.ends_at,
            )
        )

    return PublicEventBannerResponse(
        sourceReady=bool(settings.public_event_source_url or settings.public_event_file_path.exists()),
        sourceName=source.name if source else None,
        importedAt=source.last_imported_at.strftime("%m월%d일 %H:%M") if source and source.last_imported_at else None,
        items=items,
    )
