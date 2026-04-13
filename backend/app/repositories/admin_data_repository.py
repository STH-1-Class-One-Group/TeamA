from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import Settings
from ..db_models import Feed, MapPlace, User, UserComment, UserStamp
from ..models import AdminPlaceOut, AdminSummaryResponse, PublicImportResponse
from ..public_data import import_public_bundle as sync_public_bundle
from ..repository_support import to_admin_place_out, utcnow_naive


def get_admin_summary(db: Session, settings: Settings) -> AdminSummaryResponse:
    user_count = db.scalar(select(func.count()).select_from(User)) or 0
    place_count = db.scalar(select(func.count()).select_from(MapPlace)) or 0
    review_count = db.scalar(select(func.count()).select_from(Feed)) or 0
    comment_count = db.scalar(select(func.count()).select_from(UserComment)) or 0
    stamp_count = db.scalar(select(func.count()).select_from(UserStamp)) or 0
    place_rows = db.execute(
        select(MapPlace, func.count(Feed.feed_id))
        .outerjoin(Feed, Feed.position_id == MapPlace.position_id)
        .group_by(MapPlace.position_id)
        .order_by(MapPlace.is_active.desc(), MapPlace.name.asc())
    ).all()
    return AdminSummaryResponse(
        userCount=int(user_count),
        placeCount=int(place_count),
        reviewCount=int(review_count),
        commentCount=int(comment_count),
        stampCount=int(stamp_count),
        sourceReady=settings.public_data_file_path.exists() or bool(settings.public_data_source_url),
        places=[to_admin_place_out(place, int(count)) for place, count in place_rows],
    )


def update_place_visibility(
    db: Session,
    place_id: str,
    is_active: bool | None = None,
    is_manual_override: bool | None = None,
) -> AdminPlaceOut:
    place = db.scalars(select(MapPlace).where(MapPlace.slug == place_id)).first()
    if not place:
        raise ValueError("장소를 찾을 수 없어요.")

    changed = False
    if is_active is not None and place.is_active != is_active:
        place.is_active = is_active
        changed = True
    if is_manual_override is not None and place.is_manual_override != is_manual_override:
        place.is_manual_override = is_manual_override
        changed = True
    if changed:
        place.updated_at = utcnow_naive()
        db.commit()

    review_count = db.scalar(select(func.count()).select_from(Feed).where(Feed.position_id == place.position_id)) or 0
    return to_admin_place_out(place, int(review_count))


def import_public_bundle(db: Session, settings: Settings) -> PublicImportResponse:
    return sync_public_bundle(db, settings)
