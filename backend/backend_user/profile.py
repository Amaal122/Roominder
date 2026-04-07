"""Profile endpoints (me/profile card data)."""

from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from ..db import get_db
from .auth import SeekerProfile, get_current_user
from .models import User


router = APIRouter(prefix="/profile", tags=["profile"])


class ProfileMeOut(BaseModel):
    user_id: int
    email: EmailStr
    full_name: Optional[str] = None

    image_url: Optional[str] = None
    location: Optional[str] = None
    occupation: Optional[str] = None

    looking_for: Optional[str] = None

    sleep_schedule: Optional[str] = None
    cleanliness: Optional[str] = None
    social_life: Optional[str] = None
    guests: Optional[str] = None
    work_style: Optional[str] = None

    interests: Optional[str] = None
    values: Optional[str] = None


@router.get("/me", response_model=ProfileMeOut)
def get_my_profile_card(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    seeker = (
        db.query(SeekerProfile)
        .filter(SeekerProfile.user_id == current_user.id)
        .first()
    )

    return ProfileMeOut(
        user_id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        image_url=getattr(seeker, "image_url", None),
        location=getattr(seeker, "location", None),
        occupation=getattr(seeker, "occupation", None),
        looking_for=getattr(seeker, "looking_for", None),
        sleep_schedule=getattr(seeker, "sleep_schedule", None),
        cleanliness=getattr(seeker, "cleanliness", None),
        social_life=getattr(seeker, "social_life", None),
        guests=getattr(seeker, "guests", None),
        work_style=getattr(seeker, "work_style", None),
        interests=getattr(seeker, "interests", None),
        values=getattr(seeker, "values", None),
    )
