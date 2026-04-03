"""Helpers for keeping property availability in sync with requests."""

from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session

from .models import Property, Visit

ACTIVE_VISIT_STATUSES = ("pending", "confirmed")
ACTIVE_RENTAL_APPLICATION_STATUSES = ("pending", "accepted")


def sync_property_status(db: Session, property_id: int) -> Optional[Property]:
    """Set a property to occupied when it has active visits/applications."""

    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        return None

    has_active_visit = (
        db.query(Visit.id)
        .filter(
            Visit.property_id == property_id,
            Visit.status.in_(ACTIVE_VISIT_STATUSES),
        )
        .first()
        is not None
    )

    from ..backend_user.applicationrequest import RentalApplication

    has_active_rental_application = (
        db.query(RentalApplication.id)
        .filter(
            RentalApplication.property_id == property_id,
            RentalApplication.status.in_(ACTIVE_RENTAL_APPLICATION_STATUSES),
        )
        .first()
        is not None
    )

    prop.status = "occupied" if has_active_visit or has_active_rental_application else "available"
    return prop
