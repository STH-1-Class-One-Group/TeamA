"""Database engine and session helpers."""

from __future__ import annotations

from collections.abc import Generator
from typing import cast

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import NullPool

from .config import Settings, get_settings


class Base(DeclarativeBase):
    """Base class for ORM models."""


settings = get_settings()
_engine: Engine | None = None
_session_factory: sessionmaker[Session] | None = None


def build_engine_options(app_settings: Settings) -> dict[str, object]:
    """Build SQLAlchemy engine options for the current runtime."""

    engine_options: dict[str, object] = {"future": True}
    connect_args = app_settings.database_connect_args.copy()

    if not app_settings.is_sqlite_database:
        engine_options["pool_pre_ping"] = True
        engine_options["pool_recycle"] = 1800
        engine_options["pool_use_lifo"] = True

    if app_settings.prefer_sqlalchemy_null_pool:
        engine_options["poolclass"] = NullPool

    if connect_args:
        engine_options["connect_args"] = connect_args

    return engine_options


def _enable_sqlite_foreign_keys(engine: Engine, app_settings: Settings) -> None:
    if not app_settings.is_sqlite_database:
        return

    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, _connection_record) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def create_sqlalchemy_engine(app_settings: Settings) -> Engine:
    """Create a SQLAlchemy engine from the configured database URL."""

    engine = create_engine(app_settings.normalized_database_url, **build_engine_options(app_settings))
    _enable_sqlite_foreign_keys(engine, app_settings)
    return cast(Engine, engine)


def get_engine(app_settings: Settings | None = None) -> Engine:
    """Return a lazily initialized SQLAlchemy engine."""

    global _engine
    if _engine is None:
        _engine = create_sqlalchemy_engine(app_settings or settings)
    return _engine


def get_session_factory(app_settings: Settings | None = None) -> sessionmaker[Session]:
    """Return a lazily initialized SQLAlchemy session factory."""

    global _session_factory
    if _session_factory is None:
        _session_factory = sessionmaker(
            bind=get_engine(app_settings),
            autoflush=False,
            autocommit=False,
            future=True,
        )
    return _session_factory


def get_db() -> Generator[Session, None, None]:
    """Yield a request-scoped SQLAlchemy session."""

    db = get_session_factory()()
    try:
        yield db
    finally:
        db.close()
