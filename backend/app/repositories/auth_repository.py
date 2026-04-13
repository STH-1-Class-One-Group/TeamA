from sqlalchemy.orm import Session

from ..db_models import User
from ..models import ProfileUpdateRequest, SessionUser
from ..naver_oauth import NaverProfile
from .profile_data_repository import link_naver_identity, update_user_profile, upsert_naver_user
from ..repository_support import to_session_user


def update_user_profile_entry(db: Session, user_id: str, payload: ProfileUpdateRequest) -> User:
    return update_user_profile(db, user_id, payload)


def upsert_naver_user_entry(db: Session, profile: NaverProfile) -> User:
    return upsert_naver_user(db, profile)


def link_naver_identity_entry(db: Session, user_id: str, profile: NaverProfile) -> User:
    return link_naver_identity(db, user_id, profile)


def build_session_user(
    user: User,
    *,
    is_admin: bool,
    profile_image: str | None = None,
    provider: str | None = None,
) -> SessionUser:
    return to_session_user(user, is_admin, profile_image, provider)
