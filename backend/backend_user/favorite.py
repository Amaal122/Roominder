"""Favorites endpoints.

Stores a seeker's favorite properties in the database.
"""

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Session

from ..db import Base, get_db
from ..backend_propertyowner.models import Property
from .auth import get_current_user
from .models import User


class Favorite(Base):
    __tablename__ = "favorites"
    __table_args__ = (UniqueConstraint("user_id", "property_id"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    property_id = Column(
        Integer, ForeignKey("properties.id"), nullable=False, index=True
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class FavoriteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    property_id: int
    created_at: datetime


router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("/", response_model=List[FavoriteOut])
def list_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Favorite)
        .filter(Favorite.user_id == current_user.id)
        .order_by(Favorite.created_at.desc())
        .all()
    )


@router.post("/{property_id}", response_model=FavoriteOut, status_code=status.HTTP_201_CREATED)
def add_favorite(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    existing = (
        db.query(Favorite)
        .filter(Favorite.user_id == current_user.id, Favorite.property_id == property_id)
        .first()
    )
    if existing:
        return existing

    fav = Favorite(user_id=current_user.id, property_id=property_id)
    db.add(fav)
    db.commit()
    db.refresh(fav)
    return fav


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = (
        db.query(Favorite)
        .filter(Favorite.user_id == current_user.id, Favorite.property_id == property_id)
        .first()
    )
    if not existing:
        return None

    db.delete(existing)
    db.commit()
    return None
