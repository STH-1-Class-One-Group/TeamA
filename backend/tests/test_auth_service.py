from fastapi import HTTPException

from app.config import Settings
from app.models import SessionUser
from app.services import auth_service


def test_update_profile_session_payload_uses_auth_repository(monkeypatch):
    payload = object()
    user = type("UserLike", (), {"user_id": "user-1", "provider": "naver"})()
    session_user = SessionUser(
        id="user-1",
        nickname="테스터",
        email=None,
        provider="naver",
        profileImage=None,
        isAdmin=True,
        profileCompletedAt=None,
    )

    monkeypatch.setattr(auth_service, "update_user_profile_entry", lambda db, user_id, incoming: user)
    monkeypatch.setattr(
        auth_service,
        "build_session_user",
        lambda incoming_user, **kwargs: session_user,
    )
    monkeypatch.setattr(auth_service, "issue_access_token", lambda settings, current_user: "token-123")

    response, access_token = auth_service.update_profile_session_payload(
        "db-session",
        "user-1",
        payload,
        Settings(admin_user_ids="user-1"),
    )

    assert response.user is session_user
    assert access_token == "token-123"


def test_update_profile_session_payload_maps_value_error(monkeypatch):
    monkeypatch.setattr(
        auth_service,
        "update_user_profile_entry",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(ValueError("닉네임 형식이 올바르지 않아요.")),
    )

    try:
        auth_service.update_profile_session_payload("db-session", "user-1", object(), Settings())
    except HTTPException as error:
        assert error.status_code == 400
        assert error.detail == "닉네임 형식이 올바르지 않아요."
    else:
        raise AssertionError("Expected HTTPException")
