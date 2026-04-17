from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .core import Base, utcnow_naive


class MapPlace(Base):
    __tablename__ = "map"

    position_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    district: Mapped[str] = mapped_column(String(50), nullable=False)
    category: Mapped[str] = mapped_column(String(20), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    summary: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[str] = mapped_column(String(255), nullable=True)
    image_storage_path: Mapped[str] = mapped_column(String(255), nullable=True)
    vibe_tags: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    visit_time: Mapped[str] = mapped_column(String(50), nullable=False)
    route_hint: Mapped[str] = mapped_column(String(255), nullable=False)
    stamp_reward: Mapped[str] = mapped_column(String(120), nullable=False)
    hero_label: Mapped[str] = mapped_column(String(60), nullable=False)
    jam_color: Mapped[str] = mapped_column(String(20), nullable=False)
    accent_color: Mapped[str] = mapped_column(String(20), nullable=False)
    is_manual_override: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, onupdate=utcnow_naive, nullable=False)

    feeds: Mapped[list["Feed"]] = relationship(back_populates="place")
    course_places: Mapped[list["CoursePlace"]] = relationship(back_populates="place")
    stamps: Mapped[list["UserStamp"]] = relationship(back_populates="place")
    public_links: Mapped[list["PublicPlaceMapLink"]] = relationship(back_populates="place")
    public_event_links: Mapped[list["PublicEventMapLink"]] = relationship(back_populates="place")
    user_route_places: Mapped[list["UserRoutePlace"]] = relationship(back_populates="place")


class PublicDataSource(Base):
    __tablename__ = "public_data_source"

    source_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_key: Mapped[str] = mapped_column(String(80), unique=True, nullable=False, index=True)
    provider: Mapped[str] = mapped_column(String(40), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    source_url: Mapped[str] = mapped_column(String(255), nullable=True)
    last_imported_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, onupdate=utcnow_naive, nullable=False)

    public_places: Mapped[list["PublicPlace"]] = relationship(back_populates="source")
    public_events: Mapped[list["PublicEvent"]] = relationship(back_populates="source")


class PublicPlace(Base):
    __tablename__ = "public_place"
    __table_args__ = (UniqueConstraint("source_id", "external_id", name="uq_public_place_source_external"),)

    public_place_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_id: Mapped[int] = mapped_column(ForeignKey("public_data_source.source_id"), nullable=False, index=True)
    external_id: Mapped[str] = mapped_column(String(120), nullable=False)
    map_slug: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    display_name: Mapped[str] = mapped_column(String(140), nullable=False)
    district: Mapped[str] = mapped_column(String(50), nullable=False)
    category: Mapped[str] = mapped_column(String(20), nullable=False)
    address: Mapped[str] = mapped_column(String(255), nullable=True)
    road_address: Mapped[str] = mapped_column(String(255), nullable=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=True)
    longitude: Mapped[float] = mapped_column(Float, nullable=True)
    summary: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    image_url: Mapped[str] = mapped_column(String(255), nullable=True)
    contact: Mapped[str] = mapped_column(String(100), nullable=True)
    source_page_url: Mapped[str] = mapped_column(String(255), nullable=True)
    source_updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    sync_status: Mapped[str] = mapped_column(String(20), nullable=False, default="imported")
    raw_payload: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    normalized_payload: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, onupdate=utcnow_naive, nullable=False)

    source: Mapped["PublicDataSource"] = relationship(back_populates="public_places")
    map_links: Mapped[list["PublicPlaceMapLink"]] = relationship(back_populates="public_place")


class PublicPlaceMapLink(Base):
    __tablename__ = "public_place_map_link"
    __table_args__ = (UniqueConstraint("public_place_id", "position_id", name="uq_public_place_map_link"),)

    public_place_map_link_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    public_place_id: Mapped[int] = mapped_column(ForeignKey("public_place.public_place_id"), nullable=False, index=True)
    position_id: Mapped[int] = mapped_column(ForeignKey("map.position_id"), nullable=False, index=True)
    match_method: Mapped[str] = mapped_column(String(30), nullable=False, default="slug")
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    linked_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, onupdate=utcnow_naive, nullable=False)

    public_place: Mapped["PublicPlace"] = relationship(back_populates="map_links")
    place: Mapped["MapPlace"] = relationship(back_populates="public_links")


class PublicEvent(Base):
    __tablename__ = "public_event"
    __table_args__ = (UniqueConstraint("source_id", "external_id", name="uq_public_event_source_external"),)

    public_event_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_id: Mapped[int] = mapped_column(ForeignKey("public_data_source.source_id"), nullable=False, index=True)
    external_id: Mapped[str] = mapped_column(String(120), nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    venue_name: Mapped[str] = mapped_column(String(140), nullable=True)
    district: Mapped[str] = mapped_column(String(50), nullable=False, default="")
    address: Mapped[str] = mapped_column(String(255), nullable=True)
    road_address: Mapped[str] = mapped_column(String(255), nullable=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=True)
    longitude: Mapped[float] = mapped_column(Float, nullable=True)
    starts_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    ends_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    summary: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    image_url: Mapped[str] = mapped_column(String(255), nullable=True)
    contact: Mapped[str] = mapped_column(String(100), nullable=True)
    source_page_url: Mapped[str] = mapped_column(String(255), nullable=True)
    source_updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    sync_status: Mapped[str] = mapped_column(String(20), nullable=False, default="imported")
    raw_payload: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    normalized_payload: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, onupdate=utcnow_naive, nullable=False)

    source: Mapped["PublicDataSource"] = relationship(back_populates="public_events")
    map_links: Mapped[list["PublicEventMapLink"]] = relationship(back_populates="public_event")


class PublicEventMapLink(Base):
    __tablename__ = "public_event_map_link"
    __table_args__ = (UniqueConstraint("public_event_id", "position_id", name="uq_public_event_map_link"),)

    public_event_map_link_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    public_event_id: Mapped[int] = mapped_column(ForeignKey("public_event.public_event_id"), nullable=False, index=True)
    position_id: Mapped[int] = mapped_column(ForeignKey("map.position_id"), nullable=False, index=True)
    match_method: Mapped[str] = mapped_column(String(30), nullable=False, default="name-exact")
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    linked_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, onupdate=utcnow_naive, nullable=False)

    public_event: Mapped["PublicEvent"] = relationship(back_populates="map_links")
    place: Mapped["MapPlace"] = relationship(back_populates="public_event_links")


__all__ = [
    "MapPlace",
    "PublicDataSource",
    "PublicEvent",
    "PublicEventMapLink",
    "PublicPlace",
    "PublicPlaceMapLink",
]
