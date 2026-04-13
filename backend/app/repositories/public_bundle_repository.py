from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import Settings
from ..db_models import User
from ..models import PublicImportResponse
from ..public_data import import_public_bundle as sync_public_bundle
from ..public_data import load_public_bundle as load_public_bundle_payload
from ..repository_support import LEGACY_PROVIDERS


def cleanup_legacy_demo_content(db: Session) -> None:
    legacy_users = db.scalars(select(User).where(User.provider.in_(LEGACY_PROVIDERS))).all()
    if not legacy_users:
        return
    for user in legacy_users:
        db.delete(user)
    db.commit()


def load_public_bundle(settings: Settings) -> dict:
    return load_public_bundle_payload(settings).model_dump(by_alias=True, exclude_none=True)


def import_public_bundle(db: Session, settings: Settings) -> PublicImportResponse:
    return sync_public_bundle(db, settings)
