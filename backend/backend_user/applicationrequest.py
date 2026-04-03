from datetime import datetime
from typing import List, Optional

import os

import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Session

from ..backend_propertyowner.property_status import sync_property_status
from ..db import Base, get_db
from .auth import get_current_user
from .models import User
from ..backend_propertyowner.models import Application, Property
from ..backend_user.notifications import create_notification
from ..backend_user.models import Notification

load_dotenv()

cloudinary.config(
	cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
	api_key=os.getenv("CLOUDINARY_API_KEY"),
	api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)


async def upload_to_cloudinary(file: Optional[UploadFile]) -> Optional[str]:
	if not file or not file.filename:
		return None
	contents = await file.read()
	if not contents:
		return None
	# cloudinary-python accepts bytes
	result = cloudinary.uploader.upload(contents, folder="rental_applications")
	return result.get("secure_url")

class RentalApplication(Base):
    __tablename__ = "rental_applications"
    __table_args__ = (UniqueConstraint("application_id"),)

    id                 = Column(Integer, primary_key=True, index=True)
    application_id     = Column(Integer, ForeignKey("applications.id"), nullable=False)
    property_id        = Column(Integer, ForeignKey("properties.id"), nullable=False)
    seeker_id          = Column(Integer, ForeignKey("users.id"), nullable=False)
    message            = Column(String, nullable=True)
    status             = Column(String, default="pending")
    id_doc_url         = Column(String, nullable=True)
    income_doc_url     = Column(String, nullable=True)
    employment_doc_url = Column(String, nullable=True)
    guarantor_doc_url  = Column(String, nullable=True)
    created_at         = Column(DateTime, default=datetime.utcnow, nullable=False)


class RentalApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:                 int
    application_id:     int
    property_id:        int
    seeker_id:          int
    message:            Optional[str]
    status:             str
    id_doc_url:         Optional[str]
    income_doc_url:     Optional[str]
    employment_doc_url: Optional[str]
    guarantor_doc_url:  Optional[str]
    created_at:         datetime
    seeker_name:        Optional[str] = None
    seeker_email:       Optional[str] = None
    property_title:     Optional[str] = None
    property_location:  Optional[str] = None


def _clear_owner_application_notifications(
    db: Session,
    *,
    owner_id: int,
    application_id: int,
    rental_application_id: int,
) -> None:
    owner_notifications = (
        db.query(Notification)
        .filter(
            Notification.user_id == owner_id,
            Notification.type == "application_submitted",
        )
        .all()
    )

    for notification in owner_notifications:
        payload = notification.data if isinstance(notification.data, dict) else {}
        if (
            payload.get("application_id") == application_id
            or payload.get("rental_application_id") == rental_application_id
        ):
            db.delete(notification)


def _notify_seeker_about_application_decision(
    db: Session,
    *,
    rental_app: "RentalApplication",
    owner: User,
    prop: Property,
) -> None:
    owner_name = owner.full_name or owner.email
    property_location = f"{prop.address}, {prop.city}" if prop.city else prop.address
    decision = rental_app.status

    if decision == "accepted":
        title = "Application accepted"
        body = f"{owner_name} accepted your rental application for {prop.title}."
    else:
        title = "Application rejected"
        body = f"{owner_name} declined your rental application for {prop.title}."

    create_notification(
        db,
        user_id=rental_app.seeker_id,
        type=f"application_{decision}",
        title=title,
        body=body,
        data={
            "application_id": rental_app.application_id,
            "rental_application_id": rental_app.id,
            "property_id": prop.id,
            "property_title": prop.title,
            "property_location": property_location,
            "owner_id": owner.id,
            "owner_name": owner_name,
            "status": decision,
            "audience": "seeker",
        },
    )


def _build_rental_application_out(
    rental_app: "RentalApplication",
    db: Session,
) -> RentalApplicationOut:
    seeker = db.query(User).filter(User.id == rental_app.seeker_id).first()
    prop = db.query(Property).filter(Property.id == rental_app.property_id).first()
    property_location = None
    if prop:
        property_location = f"{prop.address}, {prop.city}" if prop.city else prop.address

    return RentalApplicationOut(
        id=rental_app.id,
        application_id=rental_app.application_id,
        property_id=rental_app.property_id,
        seeker_id=rental_app.seeker_id,
        message=rental_app.message,
        status=rental_app.status,
        id_doc_url=rental_app.id_doc_url,
        income_doc_url=rental_app.income_doc_url,
        employment_doc_url=rental_app.employment_doc_url,
        guarantor_doc_url=rental_app.guarantor_doc_url,
        created_at=rental_app.created_at,
        seeker_name=(seeker.full_name if seeker else None) or (seeker.email if seeker else None),
        seeker_email=seeker.email if seeker else None,
        property_title=prop.title if prop else None,
        property_location=property_location,
    )


router = APIRouter(prefix="/rental-applications", tags=["rental-applications"])

# ─────────────────────────────────────────────
#  POST /rental-applications/
#  Seeker submits full application
#  Only allowed if visit was accepted
# ─────────────────────────────────────────────
@router.post("/", response_model=RentalApplicationOut, status_code=status.HTTP_201_CREATED)
async def create_rental_application(
    application_id: int = Form(...),
    message: str = Form(""),
    id_doc: Optional[UploadFile] = File(None),
    income_doc: Optional[UploadFile] = File(None),
    employment_doc: Optional[UploadFile] = File(None),
    guarantor_doc: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate the base "applications" row exists and belongs to this seeker.
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    if application.tenant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    prop = db.query(Property).filter(Property.id == application.property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    # Create or update the rental_applications row (idempotent for retries).
    rental_app = db.query(RentalApplication).filter(RentalApplication.application_id == application_id).first()
    is_new = rental_app is None
    if rental_app is None:
        rental_app = RentalApplication(
            application_id=application_id,
            property_id=application.property_id,
            seeker_id=current_user.id,
        )
        db.add(rental_app)
        db.flush()

    # Upload files (only if provided) and store URLs.
    if id_doc is not None:
        rental_app.id_doc_url = await upload_to_cloudinary(id_doc)
    if income_doc is not None:
        rental_app.income_doc_url = await upload_to_cloudinary(income_doc)
    if employment_doc is not None:
        rental_app.employment_doc_url = await upload_to_cloudinary(employment_doc)
    if guarantor_doc is not None:
        rental_app.guarantor_doc_url = await upload_to_cloudinary(guarantor_doc)

    if message.strip():
        rental_app.message = message

    # Keep status as pending unless explicitly managed elsewhere.
    if is_new and not rental_app.status:
        rental_app.status = "pending"

    # ✅ Notify the property owner (best-effort)
    seeker_name = current_user.full_name or current_user.email
    property_location = f"{prop.address}, {prop.city}" if prop.city else prop.address
    create_notification(
        db,
        user_id=prop.owner_id,
        type="application_submitted",
        title="New rental application",
        body=f"{seeker_name} submitted a full application for {prop.title}.",
        data={
            "application_id": application_id,
            "rental_application_id": rental_app.id,
            "property_id": prop.id,
            "property_title": prop.title,
            "property_location": property_location,
            "seeker_name": seeker_name,
            "seeker_email": current_user.email,
            "message": rental_app.message,
            "audience": "owner",
            "id_doc_url": rental_app.id_doc_url,
            "income_doc_url": rental_app.income_doc_url,
            "employment_doc_url": rental_app.employment_doc_url,
            "guarantor_doc_url": rental_app.guarantor_doc_url,
        },
    )
    sync_property_status(db, prop.id)

    db.add(rental_app)
    db.commit()
    db.refresh(rental_app)
    return _build_rental_application_out(rental_app, db)


# ─────────────────────────────────────────────
#  GET /rental-applications/mine
#  Seeker sees their submitted applications
# ─────────────────────────────────────────────
@router.get("/mine", response_model=List[RentalApplicationOut])
def get_my_rental_applications(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    rental_applications = (
        db.query(RentalApplication)
        .filter(RentalApplication.seeker_id == current_user.id)
        .order_by(RentalApplication.created_at.desc())
        .all()
    )
    return [_build_rental_application_out(rental_app, db) for rental_app in rental_applications]


# ─────────────────────────────────────────────
#  GET /rental-applications/property/{id}
#  Owner sees all applications for their property
# ─────────────────────────────────────────────
@router.get("/property/{property_id}", response_model=List[RentalApplicationOut])
def get_rental_applications_for_property(
    property_id:  int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    if prop.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    rental_applications = (
        db.query(RentalApplication)
        .filter(RentalApplication.property_id == property_id)
        .order_by(RentalApplication.created_at.desc())
        .all()
    )
    return [_build_rental_application_out(rental_app, db) for rental_app in rental_applications]


# ─────────────────────────────────────────────
#  PUT /rental-applications/{id}/status
#  Owner accepts or rejects
# ─────────────────────────────────────────────
@router.put("/{rental_app_id}/status", response_model=RentalApplicationOut)
def update_rental_application_status(
    rental_app_id: int,
    status:        str,
    db:            Session = Depends(get_db),
    current_user:  User    = Depends(get_current_user),
):
    rental_app = db.query(RentalApplication).filter(
        RentalApplication.id == rental_app_id
    ).first()
    if not rental_app:
        raise HTTPException(status_code=404, detail="Application not found")

    prop = db.query(Property).filter(
        Property.id == rental_app.property_id
    ).first()
    if not prop or prop.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if status not in ("pending", "accepted", "rejected"):
        raise HTTPException(status_code=400, detail="Invalid status")

    if rental_app.status == status:
        return _build_rental_application_out(rental_app, db)

    rental_app.status = status
    base_application = db.query(Application).filter(
        Application.id == rental_app.application_id
    ).first()
    if base_application:
        base_application.status = status

    if status in ("accepted", "rejected"):
        _clear_owner_application_notifications(
            db,
            owner_id=prop.owner_id,
            application_id=rental_app.application_id,
            rental_application_id=rental_app.id,
        )
        _notify_seeker_about_application_decision(
            db,
            rental_app=rental_app,
            owner=current_user,
            prop=prop,
        )

    db.flush()
    sync_property_status(db, rental_app.property_id)
    db.commit()
    db.refresh(rental_app)
    return _build_rental_application_out(rental_app, db)
