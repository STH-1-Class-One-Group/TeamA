from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..api_deps import require_admin_user
from ..config import Settings, get_settings
from ..db import get_db
from ..models import AdminPlaceOut, AdminSummaryResponse, PlaceVisibilityUpdate, PublicImportResponse, SessionUser
from ..services.admin_service import import_public_data_service, patch_admin_place_service, read_admin_summary_service

router = APIRouter(tags=["admin"])


@router.get("/api/admin/summary", response_model=AdminSummaryResponse)
def read_admin_summary(
    db: Session = Depends(get_db),
    _: SessionUser = Depends(require_admin_user),
    app_settings: Settings = Depends(get_settings),
) -> AdminSummaryResponse:
    return read_admin_summary_service(db, app_settings)


@router.patch("/api/admin/places/{place_id}", response_model=AdminPlaceOut)
def patch_place_visibility(
    place_id: str,
    payload: PlaceVisibilityUpdate,
    db: Session = Depends(get_db),
    _: SessionUser = Depends(require_admin_user),
) -> AdminPlaceOut:
    return patch_admin_place_service(db, place_id, payload)


@router.post("/api/admin/import/public-data", response_model=PublicImportResponse)
def import_public_data(
    db: Session = Depends(get_db),
    _: SessionUser = Depends(require_admin_user),
    app_settings: Settings = Depends(get_settings),
) -> PublicImportResponse:
    return import_public_data_service(db, app_settings)

