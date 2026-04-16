"""Parsing helpers shared across repository flows."""

from __future__ import annotations


def parse_review_id(review_id: str) -> int:
    try:
        return int(review_id)
    except ValueError as error:
        raise ValueError("리뷰 ID 형식이 올바르지 않아요.") from error


def parse_comment_id(comment_id: str) -> int:
    try:
        return int(comment_id)
    except ValueError as error:
        raise ValueError("댓글 ID 형식이 올바르지 않아요.") from error


def parse_stamp_id(stamp_id: str) -> int:
    try:
        return int(stamp_id)
    except ValueError as error:
        raise ValueError("스탬프 ID 형식이 올바르지 않아요.") from error
