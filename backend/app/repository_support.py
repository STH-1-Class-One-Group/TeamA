"""Shared helper façade for repository helper modules."""

from __future__ import annotations

from .repository_support_comments import build_comment_tree, count_visible_comments
from .repository_support_geo import calculate_distance_meters, ensure_stamp_can_be_collected
from .repository_support_parsing import parse_comment_id, parse_review_id, parse_stamp_id
from .repository_support_serializers import to_admin_place_out, to_place_out, to_session_user
from .repository_support_time import (
    KST,
    build_session_duration_label,
    format_date,
    format_datetime,
    format_visit_label,
    generate_user_id,
    to_seoul_date,
    utcnow_naive,
)

LEGACY_PROVIDERS = ("demo", "seed")
BADGE_BY_MOOD = {
    "설렘": "첫 방문",
    "친구랑": "친구 추천",
    "혼자서": "로컬 탐방",
    "야경 맛집": "야경 성공",
}

__all__ = [
    "KST",
    "LEGACY_PROVIDERS",
    "BADGE_BY_MOOD",
    "utcnow_naive",
    "to_seoul_date",
    "generate_user_id",
    "format_datetime",
    "format_date",
    "format_visit_label",
    "build_session_duration_label",
    "calculate_distance_meters",
    "ensure_stamp_can_be_collected",
    "parse_review_id",
    "parse_comment_id",
    "parse_stamp_id",
    "to_place_out",
    "to_session_user",
    "to_admin_place_out",
    "build_comment_tree",
    "count_visible_comments",
]
