from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from ..api_deps import get_session_user, require_session_user
from ..config import Settings, get_settings
from ..db import get_db
from ..jwt_auth import clear_auth_cookie, set_auth_cookie
from ..models import AuthProviderOut, AuthSessionResponse, ProfileUpdateRequest, SessionUser
from ..naver_oauth import build_naver_login_url, generate_oauth_state
from ..services.auth_service import build_auth_providers, complete_naver_login, update_profile_session_payload

router = APIRouter(tags=["auth"])

PROVIDER_LABELS = {
    "naver": "네이버",
    "kakao": "카카오",
}
SUPPORTED_PROVIDERS = tuple(PROVIDER_LABELS.keys())


def build_auth_response(session_user: SessionUser | None, app_settings: Settings) -> AuthSessionResponse:
    return AuthSessionResponse(
        isAuthenticated=bool(session_user),
        user=session_user,
        providers=build_auth_providers(app_settings),
    )


@router.get("/api/auth/providers", response_model=list[AuthProviderOut])
def read_auth_providers(app_settings: Settings = Depends(get_settings)) -> list[AuthProviderOut]:
    return build_auth_providers(app_settings)


@router.get("/api/auth/me", response_model=AuthSessionResponse)
def read_auth_session(
    session_user: SessionUser | None = Depends(get_session_user),
    app_settings: Settings = Depends(get_settings),
) -> AuthSessionResponse:
    return build_auth_response(session_user, app_settings)


@router.patch("/api/auth/profile", response_model=AuthSessionResponse)
def patch_auth_profile(
    payload: ProfileUpdateRequest,
    response: Response,
    db: Session = Depends(get_db),
    session_user: SessionUser = Depends(require_session_user),
    app_settings: Settings = Depends(get_settings),
) -> AuthSessionResponse:
    auth_response, access_token = update_profile_session_payload(db, session_user.id, payload, app_settings)
    set_auth_cookie(response, app_settings, access_token)
    return auth_response


@router.get("/api/auth/{provider}/login")
def start_login(
    provider: str,
    request: Request,
    next: str | None = None,
    app_settings: Settings = Depends(get_settings),
) -> RedirectResponse:
    if provider not in SUPPORTED_PROVIDERS:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="지원하지 않는 로그인 제공자입니다.")

    request.session["post_login_redirect"] = next or app_settings.frontend_url
    request.session.pop("oauth_link_user_id", None)
    request.session.pop("oauth_link_provider", None)

    if provider != "naver":
        if not app_settings.provider_enabled(provider):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"{PROVIDER_LABELS[provider]} 로그인이 아직 설정되지 않았습니다.",
            )
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=f"{PROVIDER_LABELS[provider]} 로그인은 아직 구현되지 않았습니다.",
        )

    state = generate_oauth_state()
    request.session["naver_oauth_state"] = state
    return RedirectResponse(build_naver_login_url(app_settings, state), status_code=status.HTTP_302_FOUND)


@router.get("/api/auth/{provider}/link")
def start_link_login(
    provider: str,
    request: Request,
    next: str | None = None,
    session_user: SessionUser = Depends(require_session_user),
    app_settings: Settings = Depends(get_settings),
) -> RedirectResponse:
    if provider not in SUPPORTED_PROVIDERS:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="지원하지 않는 로그인 제공자입니다.")

    request.session["post_login_redirect"] = next or app_settings.frontend_url
    request.session["oauth_link_user_id"] = session_user.id
    request.session["oauth_link_provider"] = provider

    if provider != "naver":
        if not app_settings.provider_enabled(provider):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"{PROVIDER_LABELS[provider]} 로그인이 아직 설정되지 않았습니다.",
            )
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=f"{PROVIDER_LABELS[provider]} 계정 연결은 아직 구현되지 않았습니다.",
        )

    state = generate_oauth_state()
    request.session["naver_oauth_state"] = state
    return RedirectResponse(build_naver_login_url(app_settings, state), status_code=status.HTTP_302_FOUND)


@router.get("/api/auth/naver/callback")
def finish_naver_login(
    request: Request,
    db: Session = Depends(get_db),
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    error_description: str | None = None,
    app_settings: Settings = Depends(get_settings),
) -> RedirectResponse:
    response, access_token = complete_naver_login(
        request,
        db,
        code=code,
        state=state,
        error=error,
        error_description=error_description,
        app_settings=app_settings,
    )
    if access_token:
        set_auth_cookie(response, app_settings, access_token)
    return response


@router.post("/api/auth/logout", response_model=AuthSessionResponse)
def logout(response: Response, app_settings: Settings = Depends(get_settings)) -> AuthSessionResponse:
    clear_auth_cookie(response)
    return build_auth_response(None, app_settings)

