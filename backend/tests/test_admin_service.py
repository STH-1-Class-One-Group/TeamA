from fastapi import HTTPException

from app.models import PlaceVisibilityUpdate
from app.services import admin_service


def test_read_admin_summary_service_uses_repository_entry(monkeypatch):
    sentinel = {"places": []}
    monkeypatch.setattr(admin_service, "read_admin_summary_entry", lambda db, settings: sentinel)

    assert admin_service.read_admin_summary_service("db-session", object()) == sentinel


def test_patch_admin_place_service_maps_value_error(monkeypatch):
    monkeypatch.setattr(
        admin_service,
        "update_admin_place_visibility_entry",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(ValueError("장소를 찾을 수 없어요.")),
    )

    try:
        admin_service.patch_admin_place_service(
            "db-session",
            "place-1",
            PlaceVisibilityUpdate(is_active=True, is_manual_override=True),
        )
    except HTTPException as error:
        assert error.status_code == 404
        assert error.detail == "장소를 찾을 수 없어요."
    else:
        raise AssertionError("Expected HTTPException")
