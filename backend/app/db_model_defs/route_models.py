from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .core import Base, utcnow_naive


class Course(Base):
    __tablename__ = "course"

    course_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    mood: Mapped[str] = mapped_column(String(20), nullable=False)
    duration: Mapped[str] = mapped_column(String(40), nullable=False)
    note: Mapped[str] = mapped_column(String(255), nullable=False)
    color: Mapped[str] = mapped_column(String(20), nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    course_places: Mapped[list["CoursePlace"]] = relationship(back_populates="course")


class CoursePlace(Base):
    __tablename__ = "course_place"
    __table_args__ = (UniqueConstraint("course_id", "position_id", name="uq_course_place"),)

    course_place_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("course.course_id"), nullable=False)
    position_id: Mapped[int] = mapped_column(ForeignKey("map.position_id"), nullable=False)
    stop_order: Mapped[int] = mapped_column(Integer, nullable=False)

    course: Mapped["Course"] = relationship(back_populates="course_places")
    place: Mapped["MapPlace"] = relationship(back_populates="course_places")


class TravelSession(Base):
    __tablename__ = "travel_session"

    travel_session_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False, index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    ended_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    last_stamp_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    stamp_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, onupdate=utcnow_naive, nullable=False)

    user: Mapped["User"] = relationship(back_populates="travel_sessions")
    stamp_logs: Mapped[list["UserStamp"]] = relationship(back_populates="travel_session")
    routes: Mapped[list["UserRoute"]] = relationship(back_populates="travel_session")


class UserStamp(Base):
    __tablename__ = "user_stamp"
    __table_args__ = (UniqueConstraint("user_id", "position_id", "stamp_date", name="uq_user_stamp_per_day"),)

    stamp_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False, index=True)
    position_id: Mapped[int] = mapped_column(ForeignKey("map.position_id"), nullable=False, index=True)
    travel_session_id: Mapped[int] = mapped_column(ForeignKey("travel_session.travel_session_id", ondelete="SET NULL"), nullable=True, index=True)
    stamp_date: Mapped[date] = mapped_column(Date, nullable=False)
    visit_ordinal: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, nullable=False)

    user: Mapped["User"] = relationship(back_populates="stamps")
    place: Mapped["MapPlace"] = relationship(back_populates="stamps")
    travel_session: Mapped["TravelSession"] = relationship(back_populates="stamp_logs")
    feeds: Mapped[list["Feed"]] = relationship(back_populates="stamp")


class UserRoute(Base):
    __tablename__ = "user_route"

    route_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False, index=True)
    travel_session_id: Mapped[int] = mapped_column(ForeignKey("travel_session.travel_session_id", ondelete="SET NULL"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    mood: Mapped[str] = mapped_column(String(20), nullable=False)
    is_public: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_user_generated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    like_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, onupdate=utcnow_naive, nullable=False)

    user: Mapped["User"] = relationship(back_populates="created_routes")
    travel_session: Mapped["TravelSession"] = relationship(back_populates="routes")
    route_places: Mapped[list["UserRoutePlace"]] = relationship(back_populates="route", cascade="all, delete-orphan", passive_deletes=True)
    likes: Mapped[list["UserRouteLike"]] = relationship(back_populates="route", cascade="all, delete-orphan", passive_deletes=True)


class UserRoutePlace(Base):
    __tablename__ = "user_route_place"
    __table_args__ = (UniqueConstraint("route_id", "position_id", name="uq_user_route_place"),)

    user_route_place_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    route_id: Mapped[int] = mapped_column(ForeignKey("user_route.route_id", ondelete="CASCADE"), nullable=False, index=True)
    position_id: Mapped[int] = mapped_column(ForeignKey("map.position_id"), nullable=False, index=True)
    stop_order: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, nullable=False)

    route: Mapped["UserRoute"] = relationship(back_populates="route_places")
    place: Mapped["MapPlace"] = relationship(back_populates="user_route_places")


class UserRouteLike(Base):
    __tablename__ = "user_route_like"
    __table_args__ = (UniqueConstraint("route_id", "user_id", name="uq_user_route_like"),)

    route_like_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    route_id: Mapped[int] = mapped_column(ForeignKey("user_route.route_id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, nullable=False)

    route: Mapped["UserRoute"] = relationship(back_populates="likes")
    user: Mapped["User"] = relationship(back_populates="route_likes")


__all__ = [
    "Course",
    "CoursePlace",
    "TravelSession",
    "UserRoute",
    "UserRouteLike",
    "UserRoutePlace",
    "UserStamp",
]
