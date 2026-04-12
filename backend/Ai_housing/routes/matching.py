"""Matching endpoints — Modèle Hybride."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from ...db import get_db
from ..property_match import match_properties

router = APIRouter(prefix="/ai", tags=["AI Matching"])


class PropertyMatchRequest(BaseModel):
    budget: float
    city: str
    rooms_needed: int
    sleep_schedule: Optional[str] = "flexible"
    cleanliness: Optional[str] = "moderate"
    social_life: Optional[str] = "moderate"
    work_style: Optional[str] = "hybrid"
    filter_by: Optional[str] = None


@router.post("/match-properties")
def get_property_matches(
    request: PropertyMatchRequest,
    db: Session = Depends(get_db)
):
    user_profile = request.dict()
    
    results = match_properties(
        db=db,
        user_profile=user_profile,
        filter_by=request.filter_by,
        top_n=50
    )
    return {
        "matches": results,
        "total": len(results)
    }