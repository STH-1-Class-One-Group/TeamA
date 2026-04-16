"""Location and stamp validation helpers."""

from __future__ import annotations

from math import asin, cos, radians, sin, sqrt

from .db_models import MapPlace


def calculate_distance_meters(
    start_latitude: float,
    start_longitude: float,
    end_latitude: float,
    end_longitude: float,
) -> float:
    earth_radius_meters = 6_371_000
    latitude_delta = radians(end_latitude - start_latitude)
    longitude_delta = radians(end_longitude - start_longitude)
    start_latitude_radians = radians(start_latitude)
    end_latitude_radians = radians(end_latitude)
    haversine = (
        sin(latitude_delta / 2) ** 2
        + cos(start_latitude_radians) * cos(end_latitude_radians) * sin(longitude_delta / 2) ** 2
    )
    return earth_radius_meters * (2 * asin(sqrt(haversine)))


def ensure_stamp_can_be_collected(
    place: MapPlace,
    current_latitude: float,
    current_longitude: float,
    radius_meters: int,
) -> None:
    distance_meters = calculate_distance_meters(
        current_latitude,
        current_longitude,
        place.latitude,
        place.longitude,
    )
    if distance_meters > radius_meters:
        raise PermissionError(
            f"{place.name} 현장 반경 {radius_meters}m 안에 들어와야 스탬프를 받을 수 있어요. 현재 약 {round(distance_meters)}m 떨어져 있어요."
        )
