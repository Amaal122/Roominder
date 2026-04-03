"""Stats endpoint for the property owner dashboard."""

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ...backend_user.applicationrequest import RentalApplication
from ...backend_user.auth import get_current_user
from ...backend_user.models import User
from ...db import get_db
from ..models import Property, Visit

router = APIRouter(prefix="/stats", tags=["Stats"])


@router.get("/me")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    owner_id = current_user.id

    total_properties = (
        db.query(Property)
        .filter(Property.owner_id == owner_id)
        .count()
    )

    occupied_properties = (
        db.query(Property)
        .filter(
            Property.owner_id == owner_id,
            func.lower(func.coalesce(Property.status, "available")) == "occupied",
        )
        .count()
    )

    accepted_property_ids = (
        db.query(RentalApplication.property_id)
        .join(Property, Property.id == RentalApplication.property_id)
        .filter(
            Property.owner_id == owner_id,
            RentalApplication.status == "accepted",
        )
        .distinct()
        .subquery()
    )

    monthly_revenue = (
        db.query(func.coalesce(func.sum(Property.price), 0.0))
        .filter(Property.id.in_(db.query(accepted_property_ids.c.property_id)))
        .scalar()
        or 0.0
    )

    pending_visits = (
        db.query(Visit)
        .join(Property, Property.id == Visit.property_id)
        .filter(
            Property.owner_id == owner_id,
            Visit.status == "pending",
        )
        .count()
    )

    occupancy_percent = (
        round((occupied_properties / total_properties) * 100)
        if total_properties > 0
        else 0
    )

    return {
        "monthly_revenue": monthly_revenue,
        "occupancy_percent": occupancy_percent,
        "pending_count": pending_visits,
        "total_properties": total_properties,
        "currency": "DT",
    }
