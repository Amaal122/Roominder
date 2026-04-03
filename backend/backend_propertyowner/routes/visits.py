"""Endpoints pour les demandes de visite."""

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from typing import List

from ...db import get_db
from ...backend_user.auth import get_current_user
from ...backend_user.models import Notification, User
from ...backend_user.notifications import create_notification

from ..models import Visit, Property
from ..property_status import sync_property_status
from ..schemas import VisitCreate, VisitOut

router = APIRouter(prefix="/visits", tags=["Visits"])


def _notify_owner_about_visit(
    db: Session,
    *,
    owner_id: int,
    visit: Visit,
    prop: Property,
    requester: User,
) -> None:
    requester_name = requester.full_name or requester.email
    create_notification(
        db,
        user_id=owner_id,
        type="visit_request",
        title="New visit request",
        body=f"{requester_name} requested a visit for {prop.title}.",
        data={
            "visit_id": visit.id,
            "property_id": prop.id,
            "property_title": prop.title,
            "requester_name": requester_name,
            "requester_email": requester.email,
            "requester_phone": visit.phone,
            "preferred_time": visit.preferred_time,
            "message": visit.message,
            "audience": "owner",
        },
    )


# ─────────────────────────────────────────────
#  POST /visits  →  demander une visite
# ─────────────────────────────────────────────
@router.post("/", response_model=VisitOut, status_code=status.HTTP_201_CREATED)
def create_visit(
    data:         VisitCreate,
    response:     Response,
    db:           Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Le locataire envoie une demande de visite pour un logement."""

    # Vérifier que le logement existe
    prop = db.query(Property).filter(Property.id == data.property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Logement introuvable")

    # Rendre la création idempotente: renvoyer la visite pending existante.
    existing = db.query(Visit).filter(
        Visit.property_id == data.property_id,
        Visit.tenant_id   == current_user.id,
        Visit.status      == "pending"
    ).first()
    if existing:
        sync_property_status(db, prop.id)
        existing_owner_notification = (
            db.query(Notification)
            .filter(
                Notification.user_id == prop.owner_id,
                Notification.type == "visit_request",
                Notification.is_read.is_(False),
            )
            .order_by(Notification.created_at.desc())
            .all()
        )
        has_active_owner_notification = any(
            (
                notification.data if isinstance(notification.data, dict) else {}
            ).get("visit_id") == existing.id
            for notification in existing_owner_notification
        )

        if not has_active_owner_notification:
            _notify_owner_about_visit(
                db,
                owner_id=prop.owner_id,
                visit=existing,
                prop=prop,
                requester=current_user,
            )

        db.commit()
        db.refresh(existing)

        response.status_code = status.HTTP_200_OK
        return existing

    new_visit = Visit(
        property_id    = data.property_id,
        tenant_id      = current_user.id,
        full_name      = data.full_name,
        phone          = data.phone,
        preferred_time = data.preferred_time,
        message        = data.message,
    )
    db.add(new_visit)
    db.flush()

    _notify_owner_about_visit(
        db,
        owner_id=prop.owner_id,
        visit=new_visit,
        prop=prop,
        requester=current_user,
    )
    sync_property_status(db, prop.id)

    db.commit()
    db.refresh(new_visit)
    return new_visit


# ─────────────────────────────────────────────
#  GET /visits/received  →  visites reçues
# ─────────────────────────────────────────────
@router.get("/received", response_model=List[VisitOut])
def get_received_visits(
    db:           Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Le propriétaire voit toutes les demandes de visite reçues."""
    my_property_ids = [
        p.id for p in db.query(Property).filter(
            Property.owner_id == current_user.id
        ).all()
    ]
    visits = db.query(Visit).filter(
        Visit.property_id.in_(my_property_ids)
    ).order_by(Visit.created_at.desc()).all()
    return visits


# ─────────────────────────────────────────────
#  GET /visits/mine  →  mes demandes envoyées
# ─────────────────────────────────────────────
@router.get("/mine", response_model=List[VisitOut])
def get_my_visits(
    db:           Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Le locataire voit toutes ses demandes de visite."""
    visits = db.query(Visit).filter(
        Visit.tenant_id == current_user.id
    ).order_by(Visit.created_at.desc()).all()
    return visits


# ─────────────────────────────────────────────
#  PUT /visits/{id}  →  confirmer / annuler
# ─────────────────────────────────────────────
@router.put("/{visit_id}", response_model=VisitOut)
def update_visit_status(
    visit_id:     int,
    status_update: dict,
    db:           Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Le propriétaire confirme ou annule une demande de visite."""
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visite introuvable")

    # Vérifier que le logement appartient au propriétaire connecté
    prop = db.query(Property).filter(Property.id == visit.property_id).first()
    if prop.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès refusé")

    new_status = status_update.get("status")
    if new_status not in ["confirmed", "cancelled"]:
        raise HTTPException(
            status_code=400,
            detail="Statut invalide (confirmed / cancelled)"
        )

    visit.status = new_status

    owner_name = current_user.full_name or current_user.email
    property_location = f"{prop.address}, {prop.city}" if prop.city else prop.address

    owner_notifications = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.type == "visit_request",
        )
        .all()
    )
    for notification in owner_notifications:
        payload = notification.data if isinstance(notification.data, dict) else {}
        if payload.get("visit_id") == visit.id:
            notification.is_read = True

    if new_status == "confirmed":
        notification_title = "Visit accepted"
        notification_body = (
            f"{owner_name} accepted your visit request for {prop.title}. "
            "Please fill in the application form to continue."
        )
        notification_data = {
            "visit_id": visit.id,
            "property_id": prop.id,
            "property_title": prop.title,
            "property_location": property_location,
            "owner_name": owner_name,
            "status": new_status,
            "preferred_time": visit.preferred_time,
            "next_step": "application_form",
            "cta_label": "Fill Application Form",
            "audience": "seeker",
        }
    else:
        notification_title = "Visit request declined"
        notification_body = (
            f"{owner_name} declined your visit request for {prop.title}."
        )
        notification_data = {
            "visit_id": visit.id,
            "property_id": prop.id,
            "property_title": prop.title,
            "property_location": property_location,
            "owner_name": owner_name,
            "status": new_status,
            "preferred_time": visit.preferred_time,
            "audience": "seeker",
        }

    create_notification(
        db,
        user_id=visit.tenant_id,
        type=f"visit_{new_status}",
        title=notification_title,
        body=notification_body,
        data=notification_data,
    )
    db.flush()
    sync_property_status(db, prop.id)

    db.commit()
    db.refresh(visit)
    return visit


# ─────────────────────────────────────────────
#  DELETE /visits/{id}  →  annuler sa demande
# ─────────────────────────────────────────────
@router.delete("/{visit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_visit(
    visit_id:     int,
    db:           Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Le locataire annule sa demande de visite."""
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visite introuvable")
    if visit.tenant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès refusé")

    property_id = visit.property_id
    db.delete(visit)
    db.flush()
    sync_property_status(db, property_id)
    db.commit()
    return None
