from collections.abc import Callable

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..config import Settings
from ..models import SessionUser, StampToggleRequest
from ..repositories.stamp_data_repository import get_stamps as read_stamp_state, toggle_stamp as toggle_stamp_entry


def _raise_not_found(detail: str) -> None:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


def _raise_forbidden(detail: str) -> None:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


def _run_stamp_policy(action: Callable[[], object]):
    try:
        return action()
    except PermissionError as error:
        _raise_forbidden(str(error))
    except ValueError as error:
        _raise_not_found(str(error))


def read_stamps_service(db: Session, session_user: SessionUser | None):
    return read_stamp_state(db, session_user.id if session_user else None)


def toggle_stamp_service(db: Session, payload: StampToggleRequest, session_user: SessionUser, app_settings: Settings):
    return _run_stamp_policy(
        lambda: toggle_stamp_entry(
            db,
            session_user.id,
            payload.place_id,
            payload.latitude,
            payload.longitude,
            app_settings.stamp_unlock_radius_meters,
        ),
    )
