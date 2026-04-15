from sqlalchemy.orm import Session

from .stamp_data_repository import get_stamps, toggle_stamp


def read_stamp_state(db: Session, user_id: str | None):
    return get_stamps(db, user_id)


def toggle_stamp_entry(
    db: Session,
    user_id: str,
    place_id: str,
    latitude: float,
    longitude: float,
    unlock_radius_meters: int,
):
    return toggle_stamp(db, user_id, place_id, latitude, longitude, unlock_radius_meters)
