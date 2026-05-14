"""FastAPI router for AI roommate matching."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..db import get_db
from ..backend_user.auth import SeekerProfile, get_current_user
from ..backend_user.models import User


def _load_get_roommate_matches():
    """Load the matcher lazily to avoid crashing app startup.

    The repo currently does not define `get_roommate_matches` in a stable module,
    so importing it at module import-time would prevent Uvicorn from starting.
    """
    try:
        from .Maatcher import get_roommate_matches  # type: ignore
        return get_roommate_matches
    except Exception:
        # Keep the API running even if the AI matcher isn't available.
        return None

router = APIRouter(prefix="/roommates", tags=["AI Roommate Matching"])


class MatchProfile(BaseModel):
    id:        int
    name:      str
    age:       int
    role:      str
    location:  str
    match:     float
    about:     str
    lifestyle: list[str]
    reasons:   list[str]
    image:     Optional[str] = None


class RoommateProfileDetail(MatchProfile):
    profile_id:      int
    user_id:         int
    radius:          Optional[int] = None
    occupation:      Optional[str] = None
    image_url:       Optional[str] = None
    gender:          Optional[str] = None
    looking_for:     Optional[str] = None
    sleep_schedule:  Optional[str] = None
    cleanliness:     Optional[str] = None
    social_life:     Optional[str] = None
    guests:          Optional[str] = None
    work_style:      Optional[str] = None
    interests:       Optional[str] = None
    values:          Optional[str] = None


@router.get("/matches", response_model=list[MatchProfile])
def get_matches(
    top_n: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_roommate_matches = _load_get_roommate_matches()
    if get_roommate_matches is None:
        raise HTTPException(
            status_code=503,
            detail="Roommate matching is not configured (missing get_roommate_matches)",
        )

    try:
        return get_roommate_matches(
            current_user_id=current_user.id,
            db=db,
            top_n=top_n,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        # Typically model download/load issues (SentenceTransformer) or similar.
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        import traceback
        print(f"Matching error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Matching service unavailable")


@router.get("/{user_id}", response_model=RoommateProfileDetail)
def get_roommate_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Use /profile/me for your own profile")

    row = (
        db.query(SeekerProfile, User)
        .join(User, User.id == SeekerProfile.user_id)
        .filter(SeekerProfile.user_id == user_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Roommate profile not found")

    seeker, user = row

    get_roommate_matches = _load_get_roommate_matches()
    match_score = 0.0
    reasons: list[str] = []
    lifestyle: list[str] = []

    if get_roommate_matches is not None:
        try:
            matches = get_roommate_matches(
                current_user_id=current_user.id,
                db=db,
                top_n=100,
            )
            matched = next(
                (item for item in matches if str(item.get("id")) == str(user_id)),
                None,
            )
            if matched:
                match_score = float(matched.get("match") or 0)
                reasons = [
                    str(item)
                    for item in matched.get("reasons", [])
                    if isinstance(item, str)
                ]
                lifestyle = [
                    str(item)
                    for item in matched.get("lifestyle", [])
                    if isinstance(item, str)
                ]
        except Exception as e:
            print(f"[get_roommate_profile] Match metadata unavailable: {e}")

    if not lifestyle:
        lifestyle = [
            value
            for value in (
                seeker.sleep_schedule,
                seeker.cleanliness,
                seeker.social_life,
                seeker.guests,
                seeker.work_style,
            )
            if value
        ]

    occupation = seeker.occupation or "Roommate"
    about = seeker.social_life or seeker.values or "Looking for a compatible shared home."

    return RoommateProfileDetail(
        id=user.id,
        profile_id=seeker.id,
        user_id=user.id,
        name=user.full_name or user.email or f"User {user.id}",
        age=int(seeker.age or 0),
        role=occupation,
        location=seeker.location or "",
        match=match_score,
        about=about,
        lifestyle=lifestyle,
        reasons=reasons,
        image=seeker.image_url,
        radius=seeker.radius,
        occupation=seeker.occupation,
        image_url=seeker.image_url,
        gender=seeker.gender,
        looking_for=seeker.looking_for,
        sleep_schedule=seeker.sleep_schedule,
        cleanliness=seeker.cleanliness,
        social_life=seeker.social_life,
        guests=seeker.guests,
        work_style=seeker.work_style,
        interests=seeker.interests,
        values=seeker.values,
    )
