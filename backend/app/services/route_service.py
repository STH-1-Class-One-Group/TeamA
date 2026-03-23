from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..models import RouteSort, SessionUser, UserRouteCreate
from ..user_routes_normalized import (
    create_user_route,
    delete_user_route,
    list_public_user_routes,
    list_user_routes_for_owner,
    toggle_user_route_like,
)


def read_community_routes_service(db: Session, sort: RouteSort, session_user: SessionUser | None):
    return list_public_user_routes(db, sort, session_user.id if session_user else None)


def create_community_route_service(db: Session, payload: UserRouteCreate, session_user: SessionUser):
    try:
        return create_user_route(db, payload, session_user.id, session_user.nickname)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


def toggle_community_route_like_service(db: Session, route_id: str, session_user: SessionUser):
    try:
        return toggle_user_route_like(db, route_id, session_user.id, session_user.nickname)
    except ValueError as error:
        detail = str(error)
        status_code = status.HTTP_400_BAD_REQUEST
        if "찾지 못" in detail:
            status_code = status.HTTP_404_NOT_FOUND
        raise HTTPException(status_code=status_code, detail=detail) from error


def delete_community_route_service(db: Session, route_id: str, session_user: SessionUser) -> None:
    try:
        delete_user_route(db, route_id, session_user.id, is_admin=session_user.is_admin)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error


def read_my_routes_service(db: Session, session_user: SessionUser):
    return list_user_routes_for_owner(db, session_user.id)
