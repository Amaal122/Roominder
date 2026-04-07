"""SQLAlchemy ORM models for the user service."""

from datetime import datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, Integer, String, Text

from ..db import Base


class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name       = Column(String(100), nullable=True)
    role            = Column(String(50), nullable=True)
    is_active       = Column(Boolean, default=True)
    created_at      = Column(DateTime, default=datetime.utcnow)
    two_factor_enabled    = Column(Boolean, default=False)
    two_factor_secret     = Column(String, nullable=True)
    two_factor_temp_secret = Column(String, nullable=True)


class Notification(Base):
    __tablename__ = "notifications"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    type       = Column(String(50), nullable=False, index=True)
    title      = Column(String(255), nullable=False)
    body       = Column(Text, nullable=False)
    data       = Column(JSON, nullable=True)
    is_read    = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

