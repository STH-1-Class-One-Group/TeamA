from datetime import UTC, datetime

from ..db import Base


def utcnow_naive() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


__all__ = ["Base", "utcnow_naive"]
