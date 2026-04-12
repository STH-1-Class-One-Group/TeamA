from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from ..api_deps import get_session_user, require_session_user
from ..config import Settings, get_settings
from ..db import get_db
from ..models import (
    BootstrapResponse,
    CategoryFilter,
    CourseMood,
    CourseOut,
    HealthResponse,
    PlaceOut,
    RouteSort,
    SessionUser,
    StampState,
    StampToggleRequest,
    UserRouteCreate,
    UserRouteLikeResponse,
    UserRouteOut,
)
from ..services.bootstrap_service import read_bootstrap_service
from ..services.course_service import read_courses_service
from ..services.place_service import read_place_service, read_places_service
from ..services.route_service import (
    create_community_route_service,
    delete_community_route_service,
    read_community_routes_service,
    toggle_community_route_like_service,
)
from ..services.stamp_service import read_stamps_service, toggle_stamp_service

router = APIRouter()


@router.get("/api/health", response_model=HealthResponse, tags=["system"])
def health_check(app_settings: Settings = Depends(get_settings)) -> HealthResponse:
    return HealthResponse(
        status="ok",
        env=app_settings.env,
        databaseUrl=app_settings.database_display_url,
        databaseProvider=app_settings.database_provider,
        storageBackend=app_settings.storage_provider,
        storagePath=app_settings.storage_target_label,
        supabaseConfigured=app_settings.supabase_configured,
    )


@router.get("/api/bootstrap", response_model=BootstrapResponse, tags=["bootstrap"])
def bootstrap(
    db: Session = Depends(get_db),
    session_user: SessionUser | None = Depends(get_session_user),
) -> BootstrapResponse:
    return read_bootstrap_service(db, session_user)


@router.get("/api/places", response_model=list[PlaceOut], tags=["places"])
def read_places(
    category: CategoryFilter = Query(default="all"),
    db: Session = Depends(get_db),
) -> list[PlaceOut]:
    return read_places_service(db, category)


@router.get("/api/places/{place_id}", response_model=PlaceOut, tags=["places"])
def read_place(place_id: str, db: Session = Depends(get_db)) -> PlaceOut:
    return read_place_service(db, place_id)


@router.get("/api/courses", response_model=list[CourseOut], tags=["courses"])
def read_courses(
    mood: CourseMood | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[CourseOut]:
    return read_courses_service(db, mood)


@router.get("/api/community-routes", response_model=list[UserRouteOut], tags=["community-routes"])
def read_community_routes(
    sort: RouteSort = Query(default="popular"),
    db: Session = Depends(get_db),
    session_user: SessionUser | None = Depends(get_session_user),
) -> list[UserRouteOut]:
    return read_community_routes_service(db, sort, session_user)


@router.post("/api/community-routes", response_model=UserRouteOut, status_code=status.HTTP_201_CREATED, tags=["community-routes"])
def write_community_route(
    payload: UserRouteCreate,
    db: Session = Depends(get_db),
    session_user: SessionUser = Depends(require_session_user),
) -> UserRouteOut:
    return create_community_route_service(db, payload, session_user)


@router.post("/api/community-routes/{route_id}/like", response_model=UserRouteLikeResponse, tags=["community-routes"])
def like_community_route(
    route_id: str,
    db: Session = Depends(get_db),
    session_user: SessionUser = Depends(require_session_user),
) -> UserRouteLikeResponse:
    return toggle_community_route_like_service(db, route_id, session_user)


@router.delete("/api/community-routes/{route_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["community-routes"])
def remove_community_route(
    route_id: str,
    db: Session = Depends(get_db),
    session_user: SessionUser = Depends(require_session_user),
) -> Response:
    delete_community_route_service(db, route_id, session_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/api/stamps", response_model=StampState, tags=["stamps"])
def read_stamps(
    db: Session = Depends(get_db),
    session_user: SessionUser | None = Depends(get_session_user),
) -> StampState:
    return read_stamps_service(db, session_user)


@router.post("/api/stamps/toggle", response_model=StampState, tags=["stamps"])
def write_stamp_toggle(
    payload: StampToggleRequest,
    db: Session = Depends(get_db),
    session_user: SessionUser = Depends(require_session_user),
    app_settings: Settings = Depends(get_settings),
) -> StampState:
    return toggle_stamp_service(db, payload, session_user, app_settings)

