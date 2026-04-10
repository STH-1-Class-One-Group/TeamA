from sqlalchemy.orm import Session

from ..repository_normalized import get_bootstrap


def read_bootstrap_bundle(db: Session, user_id: str | None):
    return get_bootstrap(db, user_id)
