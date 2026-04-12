from fastapi import Depends, HTTPException, Request, status

from .config import Settings, get_settings
from .jwt_auth import ACCESS_TOKEN_COOKIE, read_access_token
from .models import SessionUser


def get_session_user(request: Request, app_settings: Settings = Depends(get_settings)) -> SessionUser | None:
    auth_header = request.headers.get("Authorization", "")
    header_token = auth_header.removeprefix("Bearer ").strip() if auth_header.startswith("Bearer ") else None
    cookie_token = request.cookies.get(ACCESS_TOKEN_COOKIE)
    session_user = read_access_token(app_settings, header_token or cookie_token)
    if not session_user:
        return None
    return session_user.model_copy(update={"is_admin": app_settings.is_admin(session_user.id)})


def require_session_user(session_user: SessionUser | None = Depends(get_session_user)) -> SessionUser:
    if not session_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="로그인이 필요합니다.")
    return session_user


def require_admin_user(
    session_user: SessionUser = Depends(require_session_user),
    app_settings: Settings = Depends(get_settings),
) -> SessionUser:
    if not app_settings.is_admin(session_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="관리자 권한이 필요합니다.")
    return session_user.model_copy(update={"is_admin": True})

