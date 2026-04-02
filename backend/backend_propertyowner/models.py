"""Database models for the property owner service."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from backend.db import Base


class Property(Base):
    __tablename__ = "properties"

    id         = Column(Integer, primary_key=True, index=True)
    owner_id   = Column(Integer, nullable=False)          # lien avec users
    title      = Column(String(200), nullable=False)
    address    = Column(String(300), nullable=False)
    city       = Column(String(100), nullable=False)
    price      = Column(Float, nullable=False)
    rooms      = Column(Integer, default=1)
    bathrooms  = Column(Integer, default=1)
    space      = Column(Float, default=0)
    description= Column(Text, nullable=True)
    status     = Column(String(20), default="available")  # available / occupied
    image_url  = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relations
    applications = relationship("Application", back_populates="property")


class Application(Base):
    __tablename__ = "applications"

    id          = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    tenant_id   = Column(Integer, nullable=False)         # lien avec users
    status      = Column(String(20), default="pending")   # pending / accepted / rejected
    message     = Column(Text, nullable=True)
    created_at  = Column(DateTime, default=datetime.utcnow)

    # Relations
    property = relationship("Property", back_populates="applications")


class Message(Base):
    __tablename__ = "messages"

    id          = Column(Integer, primary_key=True, index=True)
    sender_id   = Column(Integer, nullable=False)
    receiver_id = Column(Integer, nullable=False)
    content     = Column(Text, nullable=False)
    is_read     = Column(Boolean, default=False)
    created_at  = Column(DateTime, default=datetime.utcnow)

class Visit(Base):
    __tablename__ = "visits"

    id             = Column(Integer, primary_key=True, index=True)
    property_id    = Column(Integer, ForeignKey("properties.id"), nullable=False)
    tenant_id      = Column(Integer, nullable=False)
    full_name      = Column(String(100), nullable=False)
    phone          = Column(String(20), nullable=False)
    preferred_time = Column(String(20), nullable=False)  # Today/Tomorrow/Weekend
    message        = Column(Text, nullable=True)
    status         = Column(String(20), default="pending")  # pending/confirmed/cancelled
    created_at     = Column(DateTime, default=datetime.utcnow)

    # Relation
    property = relationship("Property", backref="visits")
