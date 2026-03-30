
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.db import get_db
from backend.backend_user.auth import SeekerProfile, User, get_current_user
from backend.backend_propertyowner.models import Property

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = (
        db.query(SeekerProfile)
        .filter(SeekerProfile.user_id == current_user.id)
        .first()
    )

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    result = {}

    # 🏠 GET HOUSES FROM LOCAL DB
    if profile.looking_for in ["house", "both"]:
        houses = db.query(Property).all()
        result["houses"] = [
            {
                "id": h.id,
                "owner_id": h.owner_id,
                "title": h.title,
                "address": h.address,
                "city": h.city,
                "rooms": h.rooms,
                "price": h.price,
                "description": h.description,
                "image_url": h.image_url,
                "created_at": h.created_at,
            }
            for h in houses
        ]

    # 👥 GET ROOMMATES FROM LOCAL DB (other seekers)
    if profile.looking_for in ["roommate", "both"]:
        roommates = (
            db.query(SeekerProfile)
            .filter(SeekerProfile.user_id != current_user.id)
            .all()
        )
        result["roommates"] = [
            {
                "id": r.id,
                "age": r.age,
                "gender": r.gender,
                "occupation": r.occupation,
                "image_url": r.image_url,
                "sleep_schedule": r.sleep_schedule,
                "cleanliness": r.cleanliness,
                "social_life": r.social_life,
                "guests": r.guests,
                "work_style": r.work_style,
            }
            for r in roommates
        ]

    return result