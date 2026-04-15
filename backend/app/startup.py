"""Application startup policy helpers."""

from __future__ import annotations

from .config import Settings
from .db import Base, get_engine, get_session_factory
from .seed import seed_database


def should_bootstrap_database(settings: Settings) -> bool:
    return settings.env != "worker"


def initialize_database_schema(settings: Settings) -> None:
    Base.metadata.create_all(bind=get_engine(settings))


def seed_application_data(settings: Settings) -> None:
    with get_session_factory(settings)() as db:
        seed_database(db, settings)


def run_startup_bootstrap(settings: Settings) -> bool:
    if not should_bootstrap_database(settings):
        return False
    initialize_database_schema(settings)
    seed_application_data(settings)
    return True
