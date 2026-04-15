from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from ..db_models import MapPlace, TravelSession, UserRoute, UserStamp
from ..models import StampLogOut, StampState, TravelSessionOut
from ..repository_support import (
    build_session_duration_label,
    ensure_stamp_can_be_collected,
    format_date,
    format_datetime,
    format_visit_label,
    to_seoul_date,
    utcnow_naive,
)
from .user_data_repository import get_or_create_user


def build_stamp_logs(stamps: list[UserStamp]) -> list[StampLogOut]:
    today_key = to_seoul_date().isoformat()
    ordered_stamps = sorted(stamps, key=lambda item: (item.created_at, item.stamp_id), reverse=True)
    return [
        StampLogOut(
            id=str(stamp.stamp_id),
            placeId=stamp.place.slug,
            placeName=stamp.place.name,
            stampedAt=format_datetime(stamp.created_at),
            stampedDate=format_date(stamp.stamp_date),
            visitNumber=stamp.visit_ordinal,
            visitLabel=format_visit_label(stamp.visit_ordinal),
            travelSessionId=str(stamp.travel_session_id) if stamp.travel_session_id else None,
            isToday=format_date(stamp.stamp_date) == today_key,
        )
        for stamp in ordered_stamps
        if stamp.place and stamp.place.is_active
    ]


def build_travel_sessions(
    sessions: list[TravelSession],
    user_stamps: list[UserStamp],
    owner_routes: list[UserRoute],
) -> list[TravelSessionOut]:
    stamps_by_session_id: dict[int, list[UserStamp]] = defaultdict(list)
    for stamp in user_stamps:
        if stamp.travel_session_id:
            stamps_by_session_id[stamp.travel_session_id].append(stamp)

    published_route_id_by_session = {
        route.travel_session_id: str(route.route_id)
        for route in owner_routes
        if route.travel_session_id is not None
    }

    session_payloads: list[TravelSessionOut] = []
    for session in sorted(sessions, key=lambda item: (item.started_at, item.travel_session_id), reverse=True):
        ordered_stamps = sorted(
            stamps_by_session_id.get(session.travel_session_id, []),
            key=lambda item: (item.created_at, item.stamp_id),
        )
        unique_place_ids: list[str] = []
        unique_place_names: list[str] = []
        seen_place_ids: set[str] = set()
        for stamp in ordered_stamps:
            if not stamp.place or not stamp.place.is_active:
                continue
            if stamp.place.slug in seen_place_ids:
                continue
            seen_place_ids.add(stamp.place.slug)
            unique_place_ids.append(stamp.place.slug)
            unique_place_names.append(stamp.place.name)

        session_payloads.append(
            TravelSessionOut(
                id=str(session.travel_session_id),
                startedAt=session.started_at.isoformat(),
                endedAt=session.ended_at.isoformat(),
                durationLabel=build_session_duration_label(session),
                stampCount=session.stamp_count,
                placeIds=unique_place_ids,
                placeNames=unique_place_names,
                canPublish=len(unique_place_ids) >= 2,
                publishedRouteId=published_route_id_by_session.get(session.travel_session_id),
                coverPlaceId=unique_place_ids[0] if unique_place_ids else None,
            )
        )
    return session_payloads


def _build_stamp_state(db: Session, user_id: str | None) -> StampState:
    if not user_id:
        return StampState(collectedPlaceIds=[], logs=[], travelSessions=[])

    stamp_rows = db.scalars(
        select(UserStamp)
        .options(joinedload(UserStamp.place))
        .where(UserStamp.user_id == user_id)
        .order_by(UserStamp.created_at.desc(), UserStamp.stamp_id.desc())
    ).unique().all()
    collected_place_ids: list[str] = []
    seen_place_ids: set[str] = set()
    for stamp in stamp_rows:
        if not stamp.place or not stamp.place.is_active:
            continue
        if stamp.place.slug in seen_place_ids:
            continue
        seen_place_ids.add(stamp.place.slug)
        collected_place_ids.append(stamp.place.slug)

    travel_sessions = db.scalars(
        select(TravelSession)
        .where(TravelSession.user_id == user_id)
        .order_by(TravelSession.started_at.desc(), TravelSession.travel_session_id.desc())
    ).all()
    owner_routes = db.scalars(
        select(UserRoute)
        .where(UserRoute.user_id == user_id)
        .order_by(UserRoute.created_at.desc(), UserRoute.route_id.desc())
    ).all()

    return StampState(
        collectedPlaceIds=collected_place_ids,
        logs=build_stamp_logs(stamp_rows),
        travelSessions=build_travel_sessions(travel_sessions, stamp_rows, owner_routes),
    )


def _find_or_create_travel_session(db: Session, user_id: str, now: datetime, last_stamp: UserStamp | None) -> TravelSession:
    if last_stamp and now - last_stamp.created_at <= timedelta(hours=24):
        if last_stamp.travel_session_id:
            session = db.get(TravelSession, last_stamp.travel_session_id)
            if session:
                session.ended_at = now
                session.last_stamp_at = now
                session.stamp_count += 1
                session.updated_at = now
                return session

        session = TravelSession(
            user_id=user_id,
            started_at=last_stamp.created_at,
            ended_at=now,
            last_stamp_at=now,
            stamp_count=2,
            created_at=now,
            updated_at=now,
        )
        db.add(session)
        db.flush()
        last_stamp.travel_session_id = session.travel_session_id
        return session

    session = TravelSession(
        user_id=user_id,
        started_at=now,
        ended_at=now,
        last_stamp_at=now,
        stamp_count=1,
        created_at=now,
        updated_at=now,
    )
    db.add(session)
    db.flush()
    return session


def get_stamps(db: Session, user_id: str | None) -> StampState:
    return _build_stamp_state(db, user_id)


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

    now = utcnow_naive()
    stamp_date = to_seoul_date(now)
    existing_today = db.scalars(
        select(UserStamp).where(
            UserStamp.user_id == user_id,
            UserStamp.position_id == place.position_id,
            UserStamp.stamp_date == stamp_date,
        )
    ).first()
    if existing_today:
        return get_stamps(db, user_id)

    ensure_stamp_can_be_collected(place, latitude, longitude, radius_meters)
    visit_count = db.scalar(
        select(func.count()).select_from(UserStamp).where(UserStamp.user_id == user_id, UserStamp.position_id == place.position_id)
    ) or 0
    last_stamp = db.scalars(
        select(UserStamp)
        .where(UserStamp.user_id == user_id)
        .order_by(UserStamp.created_at.desc(), UserStamp.stamp_id.desc())
        .limit(1)
    ).first()
    session = _find_or_create_travel_session(db, user_id, now, last_stamp)

    db.add(
        UserStamp(
            user_id=user_id,
            position_id=place.position_id,
            travel_session_id=session.travel_session_id,
            stamp_date=stamp_date,
            visit_ordinal=int(visit_count) + 1,
            created_at=now,
        )
    )
    db.commit()
    return get_stamps(db, user_id)
