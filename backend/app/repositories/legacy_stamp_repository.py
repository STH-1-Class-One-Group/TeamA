"""Legacy stamp repository helpers kept for compatibility tests."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from ..db_models import MapPlace, UserStamp
from ..models import StampState
from ..repository_normalized import get_or_create_user
from ..repository_support import ensure_stamp_can_be_collected, to_seoul_date, utcnow_naive


def get_stamps(db: Session, user_id: str | None) -> StampState:
    if not user_id:
        return StampState(collectedPlaceIds=[])

    stamps = db.scalars(
        select(UserStamp)
        .options(joinedload(UserStamp.place))
        .where(UserStamp.user_id == user_id)
        .order_by(UserStamp.created_at.asc(), UserStamp.stamp_id.asc())
    ).unique().all()
    return StampState(collectedPlaceIds=[stamp.place.slug for stamp in stamps])


def toggle_stamp(
    db: Session,
    user_id: str,
    place_id: str,
    latitude: float,
    longitude: float,
    radius_meters: int,
) -> StampState:
    get_or_create_user(db, user_id, user_id)
    place = db.scalars(select(MapPlace).where(MapPlace.slug == place_id, MapPlace.is_active.is_(True))).first()
    if not place:
        raise ValueError("장소를 찾을 수 없어요.")

    today = to_seoul_date()
    existing_today = db.scalars(
        select(UserStamp).where(
            UserStamp.user_id == user_id,
            UserStamp.position_id == place.position_id,
            UserStamp.stamp_date == today,
        )
    ).first()
    if existing_today:
        raise ValueError("이미 오늘 스탬프를 획득했습니다.")

    ensure_stamp_can_be_collected(place, latitude, longitude, radius_meters)
    db.add(UserStamp(user_id=user_id, position_id=place.position_id, stamp_date=today, created_at=utcnow_naive()))
    db.commit()
    return get_stamps(db, user_id)
