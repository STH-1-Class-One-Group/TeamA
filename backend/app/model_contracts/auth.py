"""Authentication and profile API models."""

from __future__ import annotations

from pydantic import Field

from .core import ApiModel, ProviderKey


class SessionUser(ApiModel):
    id: str
    nickname: str
    email: str | None = None
    provider: str
    profile_image: str | None = Field(default=None, alias='profileImage')
    is_admin: bool = Field(default=False, alias='isAdmin')
    profile_completed_at: str | None = Field(default=None, alias='profileCompletedAt')


class AuthProviderOut(ApiModel):
    key: ProviderKey
    label: str
    is_enabled: bool = Field(alias='isEnabled')
    login_url: str | None = Field(default=None, alias='loginUrl')


class AuthSessionResponse(ApiModel):
    is_authenticated: bool = Field(alias='isAuthenticated')
    user: SessionUser | None = None
    providers: list[AuthProviderOut] = Field(default_factory=list)


class ProfileUpdateRequest(ApiModel):
    nickname: str
