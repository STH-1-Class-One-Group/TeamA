from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .core import Base, utcnow_naive


class Feed(Base):
    __tablename__ = "feed"

    feed_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    position_id: Mapped[int] = mapped_column(ForeignKey("map.position_id"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False, index=True)
    stamp_id: Mapped[int] = mapped_column(ForeignKey("user_stamp.stamp_id"), nullable=False, index=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    mood: Mapped[str] = mapped_column(String(20), nullable=False)
    badge: Mapped[str] = mapped_column(String(50), nullable=False, default="로컬 메모")
    image_url: Mapped[str] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, onupdate=utcnow_naive, nullable=False)

    place: Mapped["MapPlace"] = relationship(back_populates="feeds")
    user: Mapped["User"] = relationship(back_populates="feeds")
    stamp: Mapped["UserStamp"] = relationship(back_populates="feeds")
    likes: Mapped[list["FeedLike"]] = relationship(back_populates="feed", cascade="all, delete-orphan", passive_deletes=True)
    comments: Mapped[list["UserComment"]] = relationship(
        back_populates="feed",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class FeedLike(Base):
    __tablename__ = "feed_like"
    __table_args__ = (UniqueConstraint("feed_id", "user_id", name="uq_feed_like"),)

    feed_like_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    feed_id: Mapped[int] = mapped_column(ForeignKey("feed.feed_id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, nullable=False)

    feed: Mapped["Feed"] = relationship(back_populates="likes")
    user: Mapped["User"] = relationship(back_populates="feed_likes")


class UserComment(Base):
    __tablename__ = "user_comment"

    comment_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    feed_id: Mapped[int] = mapped_column(ForeignKey("feed.feed_id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id: Mapped[int] = mapped_column(ForeignKey("user_comment.comment_id", ondelete="SET NULL"), nullable=True, index=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, onupdate=utcnow_naive, nullable=False)

    feed: Mapped["Feed"] = relationship(back_populates="comments")
    user: Mapped["User"] = relationship(back_populates="comments")
    parent: Mapped["UserComment"] = relationship(remote_side=[comment_id], back_populates="replies")
    replies: Mapped[list["UserComment"]] = relationship(back_populates="parent", passive_deletes=True)
    notifications: Mapped[list["UserNotification"]] = relationship(back_populates="comment")


class UserNotification(Base):
    __tablename__ = "user_notification"

    notification_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False, index=True)
    actor_user_id: Mapped[str] = mapped_column(
        ForeignKey("user.user_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    type: Mapped[str] = mapped_column(String(30), nullable=False)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    body: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    review_id: Mapped[int] = mapped_column(ForeignKey("feed.feed_id", ondelete="CASCADE"), nullable=True, index=True)
    comment_id: Mapped[int] = mapped_column(
        ForeignKey("user_comment.comment_id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    route_id: Mapped[int] = mapped_column(Integer, nullable=True, index=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    read_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    payload_metadata: Mapped[dict] = mapped_column("metadata", JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, onupdate=utcnow_naive, nullable=False)

    user: Mapped["User"] = relationship(back_populates="notifications", foreign_keys=[user_id])
    actor: Mapped["User"] = relationship(back_populates="acted_notifications", foreign_keys=[actor_user_id])
    comment: Mapped["UserComment"] = relationship(back_populates="notifications")
    review: Mapped["Feed"] = relationship()


__all__ = ["Feed", "FeedLike", "UserComment", "UserNotification"]
