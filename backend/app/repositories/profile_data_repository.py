from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from ..db_models import User, UserIdentity
from ..models import ProfileUpdateRequest
from ..naver_oauth import NaverProfile
from ..repository_support import generate_user_id, utcnow_naive


def _nickname_exists(db: Session, nickname: str, *, exclude_user_id: str | None = None) -> bool:
    stmt = select(User.user_id).where(func.lower(User.nickname) == nickname.lower())
    if exclude_user_id:
        stmt = stmt.where(User.user_id != exclude_user_id)
    return db.scalar(stmt.limit(1)) is not None


def ensure_unique_nickname(db: Session, nickname: str, *, exclude_user_id: str | None = None) -> str:
    normalized = nickname.strip()
    if len(normalized) < 2:
        raise ValueError("?됰꽕?꾩? ??湲???댁긽?쇰줈 ?곸뼱 二쇱꽭??")
    if _nickname_exists(db, normalized, exclude_user_id=exclude_user_id):
        raise ValueError("?대? ?ъ슜 以묒씤 ?됰꽕?꾩씠?먯슂.")
    return normalized


def build_unique_social_nickname(db: Session, nickname: str, *, exclude_user_id: str | None = None) -> str:
    base = nickname.strip() or "?대쫫 ?놁쓬"
    if not _nickname_exists(db, base, exclude_user_id=exclude_user_id):
        return base
    for suffix in range(2, 10000):
        candidate = f"{base[:95]}{suffix}"
        if not _nickname_exists(db, candidate, exclude_user_id=exclude_user_id):
            return candidate
    raise ValueError("?ъ슜 媛?ν븳 ?됰꽕?꾩쓣 留뚮뱾 ???놁뼱??")


def upsert_social_user(
    db: Session,
    *,
    provider: str,
    provider_user_id: str,
    nickname: str,
    email: str | None = None,
    profile_image: str | None = None,
) -> User:
    identity = db.scalars(
        select(UserIdentity)
        .options(joinedload(UserIdentity.user))
        .where(UserIdentity.provider == provider, UserIdentity.provider_user_id == provider_user_id)
    ).first()
    now = utcnow_naive()

    if identity:
        user = identity.user
        changed = False
        if user.email != email:
            user.email = email
            changed = True
        if user.provider != provider:
            user.provider = provider
            changed = True
        if identity.email != email:
            identity.email = email
            changed = True
        if identity.profile_image != profile_image:
            identity.profile_image = profile_image
            changed = True
        if changed:
            identity.updated_at = now
            user.updated_at = now
        db.commit()
        db.refresh(user)
        return user

    safe_nickname = build_unique_social_nickname(db, nickname)
    user = User(
        user_id=generate_user_id(),
        nickname=safe_nickname,
        email=email,
        provider=provider,
        created_at=now,
        updated_at=now,
    )
    db.add(user)
    db.flush()
    db.add(
        UserIdentity(
            user_id=user.user_id,
            provider=provider,
            provider_user_id=provider_user_id,
            email=email,
            profile_image=profile_image,
            created_at=now,
            updated_at=now,
        )
    )
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise ValueError("?대? ?ъ슜 以묒씤 ?됰꽕?꾩씠?먯슂.") from error
    db.refresh(user)
    return user


def link_social_identity(
    db: Session,
    *,
    user_id: str,
    provider: str,
    provider_user_id: str,
    email: str | None = None,
    profile_image: str | None = None,
) -> User:
    user = db.get(User, user_id)
    if not user:
        raise ValueError("?곌껐??湲곗〈 怨꾩젙??李얠쓣 ???놁뼱??")

    now = utcnow_naive()
    existing_identity = db.scalars(
        select(UserIdentity).where(UserIdentity.provider == provider, UserIdentity.provider_user_id == provider_user_id)
    ).first()
    if existing_identity:
        if existing_identity.user_id != user_id:
            raise ValueError("?대? ?ㅻⅨ 怨꾩젙???곌껐??濡쒓렇???섎떒?댁뿉??")
        if existing_identity.email != email or existing_identity.profile_image != profile_image:
            existing_identity.email = email
            existing_identity.profile_image = profile_image
            existing_identity.updated_at = now
            db.commit()
            db.refresh(user)
        return user

    provider_slot = db.scalars(
        select(UserIdentity).where(UserIdentity.user_id == user_id, UserIdentity.provider == provider)
    ).first()
    if provider_slot:
        raise ValueError("?대? 媛숈? ?쒓났?먯쓽 怨꾩젙???곌껐?섏뼱 ?덉뼱??")

    if email and not user.email:
        user.email = email
        user.updated_at = now

    db.add(
        UserIdentity(
            user_id=user.user_id,
            provider=provider,
            provider_user_id=provider_user_id,
            email=email,
            profile_image=profile_image,
            created_at=now,
            updated_at=now,
        )
    )
    db.commit()
    db.refresh(user)
    return user


def upsert_naver_user(db: Session, profile: NaverProfile) -> User:
    nickname = profile.nickname or profile.name or "?대쫫 ?놁쓬"
    return upsert_social_user(
        db,
        provider="naver",
        provider_user_id=profile.id,
        nickname=nickname,
        email=profile.email,
        profile_image=profile.profile_image,
    )


def link_naver_identity(db: Session, user_id: str, profile: NaverProfile) -> User:
    return link_social_identity(
        db,
        user_id=user_id,
        provider="naver",
        provider_user_id=profile.id,
        email=profile.email,
        profile_image=profile.profile_image,
    )


def update_user_profile(db: Session, user_id: str, payload: ProfileUpdateRequest) -> User:
    user = db.get(User, user_id)
    if not user:
        raise ValueError("?ъ슜???뺣낫瑜?李얠쓣 ???놁뼱??")

    nickname = ensure_unique_nickname(db, payload.nickname, exclude_user_id=user_id)
    now = utcnow_naive()
    user.nickname = nickname
    if user.profile_completed_at is None:
        user.profile_completed_at = now
    user.updated_at = now
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise ValueError("?대? ?ъ슜 以묒씤 ?됰꽕?꾩씠?먯슂.") from error
    db.refresh(user)
    return user
