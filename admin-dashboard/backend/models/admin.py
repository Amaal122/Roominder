from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String

from database import Base


class Admin(Base):
    __tablename__ = "admin"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False, default="Roominder Admin")
    role = Column(String(50), nullable=False, default="administrator")
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
