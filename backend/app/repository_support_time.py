"""Time and formatting helpers shared across repository flows."""

from __future__ import annotations

from datetime import date, datetime, timedelta
from uuid import uuid4
from zoneinfo import ZoneInfo

from .db_models import TravelSession

KST = ZoneInfo("Asia/Seoul")


def utcnow_naive() -> datetime:
    return datetime.now(KST).replace(tzinfo=None)


def to_seoul_date(value: datetime | None = None) -> date:
    if value is None:
        return datetime.now(KST).date()
    if value.tzinfo is None:
        return value.date()
    return value.astimezone(KST).date()


def generate_user_id() -> str:
    return f"user-{uuid4().hex[:20]}"


def format_datetime(value: datetime | None) -> str:
    if not value:
        return ""
    return value.strftime("%m. %d. %H:%M")


def format_date(value: date | datetime | None) -> str:
    if value is None:
        return ""
    if isinstance(value, datetime):
        return to_seoul_date(value).isoformat()
    return value.isoformat()


def format_visit_label(visit_number: int | None) -> str:
    safe_visit_number = visit_number if visit_number and visit_number > 0 else 1
    return f"{safe_visit_number}번째 방문"


def build_session_duration_label(session: TravelSession) -> str:
    diff = max(session.ended_at - session.started_at, timedelta())
    diff_days = diff.days
    if diff_days <= 0:
        return f"당일 코스 · 스탬프 {session.stamp_count}개"
    return f"{diff_days}박 {diff_days + 1}일 · 스탬프 {session.stamp_count}개"
