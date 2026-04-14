"""Legacy compatibility exports for older repository imports."""

from __future__ import annotations

from .repository_normalized import get_or_create_user
from .repository_support import format_datetime, to_seoul_date, utcnow_naive
from .repositories.legacy_stamp_repository import get_stamps, toggle_stamp

__all__ = [
    "format_datetime",
    "get_or_create_user",
    "get_stamps",
    "to_seoul_date",
    "toggle_stamp",
    "utcnow_naive",
]
