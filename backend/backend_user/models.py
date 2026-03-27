"""SQLAlchemy ORM models for the user service."""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String

from db import Base


class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name       = Column(String(100), nullable=True)
    role            = Column(String(50), nullable=True)
    is_active       = Column(Boolean, default=True)
    created_at      = Column(DateTime, default=datetime.utcnow)
