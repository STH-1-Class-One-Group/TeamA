from collections.abc import Callable

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..config import Settings
from ..models import SessionUser
from ..repositories.my_page_data_repository import get_my_page as read_my_page_entry


def _raise_not_found(detail: str) -> None:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


def _run_not_found_policy(action: Callable[[], object]):
    try:
        return action()
    except ValueError as error:
        _raise_not_found(str(error))


def read_my_page_service(db: Session, session_user: SessionUser, app_settings: Settings):
    return _run_not_found_policy(lambda: read_my_page_entry(db, session_user.id, app_settings.is_admin(session_user.id)))
