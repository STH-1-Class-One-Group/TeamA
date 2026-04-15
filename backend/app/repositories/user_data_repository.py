from __future__ import annotations

from sqlalchemy.orm import Session

from ..db_models import User
from ..repository_support import utcnow_naive


def get_or_create_user(
    db: Session,
    user_id: str,
    nickname: str | None = None,
    *,
    email: str | None = None,
    provider: str = "demo",
) -> User:
    user = db.get(User, user_id)
    if not user:
        user = User(
            user_id=user_id,
            nickname=nickname or user_id,
            email=email,
            provider=provider,
            created_at=utcnow_naive(),
            updated_at=utcnow_naive(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    dirty = False
    if nickname and user.nickname != nickname:
        user.nickname = nickname
        dirty = True
    if email is not None and user.email != email:
        user.email = email
        dirty = True
    if provider and user.provider != provider:
        user.provider = provider
        dirty = True
    if dirty:
        user.updated_at = utcnow_naive()
        db.commit()
        db.refresh(user)
    return user
