from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..config import Settings
from ..models import CategoryFilter, CourseMood, SessionUser, StampToggleRequest
from ..repository_normalized import (
    get_bootstrap,
    get_my_page,
    get_place,
    get_stamps,
    list_courses,
    list_places,
    list_reviews,
    toggle_stamp,
)


def read_bootstrap_service(db: Session, session_user: SessionUser | None):
    return get_bootstrap(db, session_user.id if session_user else None)


def read_places_service(db: Session, category: CategoryFilter):
    return list_places(db, category)


def read_place_service(db: Session, place_id: str):
    try:
        return get_place(db, place_id)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


def read_courses_service(db: Session, mood: CourseMood | None):
    return list_courses(db, mood)


def read_reviews_service(db: Session, place_id: str | None, user_id: str | None, session_user: SessionUser | None):
    return list_reviews(db, place_id=place_id, user_id=user_id, current_user_id=session_user.id if session_user else None)


def read_my_page_service(db: Session, session_user: SessionUser, app_settings: Settings):
    try:
        return get_my_page(db, session_user.id, app_settings.is_admin(session_user.id))
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


def read_stamps_service(db: Session, session_user: SessionUser | None):
    return get_stamps(db, session_user.id if session_user else None)


def toggle_stamp_service(db: Session, payload: StampToggleRequest, session_user: SessionUser, app_settings: Settings):
    try:
        return toggle_stamp(
            db,
            session_user.id,
            payload.place_id,
            payload.latitude,
            payload.longitude,
            app_settings.stamp_unlock_radius_meters,
        )
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
