from sqlalchemy.orm import Session

from ..models import SessionUser
from ..repositories.bootstrap_repository import read_bootstrap_bundle


def read_bootstrap_service(db: Session, session_user: SessionUser | None):
    return read_bootstrap_bundle(db, session_user.id if session_user else None)
