from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Identity,
    Index,
    Integer,
    Text,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class AdminUser(Base):
    __tablename__ = "admin_users"
    __table_args__ = (CheckConstraint("role IN ('ADMIN', 'MASTER')"),)
    id: Mapped[int] = mapped_column(Integer, Identity(), primary_key=True)
    email: Mapped[str] = mapped_column(Text, unique=True)
    display_name: Mapped[str] = mapped_column(Text)
    password_hash: Mapped[str] = mapped_column(Text)
    role: Mapped[str] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class AdminSession(Base):
    __tablename__ = "admin_sessions"
    token_hash: Mapped[str] = mapped_column(Text, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("admin_users.id", ondelete="CASCADE"), index=True
    )
    csrf: Mapped[str] = mapped_column(Text)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)


class LoginLimit(Base):
    __tablename__ = "admin_login_limits"
    key: Mapped[str] = mapped_column(Text, primary_key=True)
    attempts: Mapped[int] = mapped_column(Integer)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)


class DesignConfig(Base):
    __tablename__ = "design_configs"
    __table_args__ = (
        CheckConstraint("status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')"),
        Index(
            "one_published_design",
            "status",
            unique=True,
            postgresql_where=text("status = 'PUBLISHED'"),
        ),
    )
    id: Mapped[int] = mapped_column(Integer, Identity(), primary_key=True)
    version: Mapped[int] = mapped_column(Integer, unique=True)
    status: Mapped[str] = mapped_column(Text)
    config: Mapped[dict] = mapped_column(JSONB)
    created_by: Mapped[int] = mapped_column(ForeignKey("admin_users.id", ondelete="RESTRICT"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class AdminAudit(Base):
    __tablename__ = "admin_audit"
    id: Mapped[int] = mapped_column(Integer, Identity(), primary_key=True)
    actor_id: Mapped[int] = mapped_column(ForeignKey("admin_users.id", ondelete="RESTRICT"))
    action: Mapped[str] = mapped_column(Text)
    target: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
