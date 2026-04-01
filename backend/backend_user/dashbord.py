
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
        houses = (
            db.query(Property, User)
            .join(User, User.id == Property.owner_id)
            .all()
        )
        result["houses"] = [
            {
                "id": property_item.id,
                "owner_id": property_item.owner_id,
                "owner_name": owner.full_name or owner.email,
                "title": property_item.title,
                "address": property_item.address,
                "city": property_item.city,
                "rooms": property_item.rooms,
                "price": property_item.price,
                "description": property_item.description,
                "image_url": property_item.image_url,
                "created_at": property_item.created_at,
            }
            for property_item, owner in houses
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
