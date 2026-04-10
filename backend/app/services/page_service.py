from sqlalchemy.orm import Session

from ..models import SessionUser
from ..repositories.review_repository import list_review_entries

def read_reviews_service(db: Session, place_id: str | None, user_id: str | None, session_user: SessionUser | None):
    return list_review_entries(db, place_id=place_id, user_id=user_id, current_user_id=session_user.id if session_user else None)
