from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from ..db import get_db
from .auth import SeekerProfile, get_current_user
from .models import User
from ..backend_propertyowner.models import Property

router = APIRouter(prefix="/seeker", tags=["seeker-dashboard"])


class DashboardStats(BaseModel):
    new_listings: int
    best_match:   int


class PropertyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:          int
    owner_id:    int
    title:       str
    address:     Optional[str] = None
    city:        Optional[str] = None
    price:       float
    rooms:       Optional[int] = None
    description: Optional[str] = None
    image_url:   Optional[str] = None


# ─────────────────────────────────────────────
#  GET /seeker/stats
#  Returns new listings count + best match %
# ─────────────────────────────────────────────
@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    # New listings = properties added in the last 7 days
    one_week_ago = datetime.utcnow() - timedelta(days=7)
    new_listings = db.query(Property).filter(
        Property.created_at >= one_week_ago
    ).count()

    # Best match = based on seeker's location preference
    my_profile = db.query(SeekerProfile).filter(
        SeekerProfile.user_id == current_user.id
    ).first()

    best_match = 0
    if my_profile and my_profile.location:
        # Count how many properties match the seeker's city
        total = db.query(Property).count()
        matched = db.query(Property).filter(
            Property.city.ilike(f"%{my_profile.location}%")
        ).count()

        if total > 0:
            best_match = int((matched / total) * 100)
    else:
        best_match = 70  # default if no profile set

    return DashboardStats(
        new_listings=new_listings,
        best_match=best_match,
    )


# ─────────────────────────────────────────────
#  GET /seeker/recommended
#  Returns personalized property listings
# ─────────────────────────────────────────────
@router.get("/recommended", response_model=List[PropertyOut])
def get_recommended_properties(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    my_profile = db.query(SeekerProfile).filter(
        SeekerProfile.user_id == current_user.id
    ).first()

    query = db.query(Property)

    if my_profile and my_profile.location:
        # Filter by seeker's city
        query = query.filter(
            Property.city.ilike(f"%{my_profile.location}%")
        )

    properties = query.order_by(Property.created_at.desc()).all()

    # If no results for their city, return all properties
    if not properties:
        properties = db.query(Property).order_by(
            Property.created_at.desc()
        ).all()

    return properties
