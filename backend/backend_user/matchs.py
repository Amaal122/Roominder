from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Session
from ..db import Base, get_db
from .auth import get_current_user
from .models import User

class RoommateMatch(Base):
    __tablename__ = "roommate_matches"
    __table_args__ = (UniqueConstraint("user_id", "matched_id"),)

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    matched_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class MatchOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    matched_id: int
    created_at: datetime


router = APIRouter(prefix="/matches", tags=["matches"])


@router.post("/{matched_id}", response_model=MatchOut, status_code=201)
def add_match(
    matched_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if matched_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot match yourself")

    existing = (
        db.query(RoommateMatch)
        .filter_by(user_id=current_user.id, matched_id=matched_id)
        .first()
    )
    if existing:
        return existing

    match = RoommateMatch(user_id=current_user.id, matched_id=matched_id)
    db.add(match)
    db.commit()
    db.refresh(match)
    return match


@router.get("/", response_model=List[MatchOut])
def get_my_matches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(RoommateMatch)
        .filter(RoommateMatch.user_id == current_user.id)
        .order_by(RoommateMatch.created_at.desc())
        .all()
    )


@router.delete("/{matched_id}", status_code=204)
def remove_match(
    matched_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    match = (
        db.query(RoommateMatch)
        .filter_by(user_id=current_user.id, matched_id=matched_id)
        .first()
    )
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    db.delete(match)
    db.commit()