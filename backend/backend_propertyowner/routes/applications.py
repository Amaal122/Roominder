"""Endpoints pour la gestion des candidatures."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.db import get_db
from backend.backend_user.auth import get_current_user
from backend.backend_user.models import Notification, User
from backend.backend_user.notifications import create_notification

from backend.backend_propertyowner.models  import Application, Property
from backend.backend_propertyowner.schemas import ApplicationCreate, ApplicationUpdate, ApplicationOut

router = APIRouter(prefix="/applications", tags=["Applications"])


# ─────────────────────────────────────────────
#  POST /applications  →  envoyer une demande
# ─────────────────────────────────────────────
@router.post("/", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
def create_application(
    data:         ApplicationCreate,
    db:           Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Le locataire envoie une demande pour un logement."""

    # Vérifier que le logement existe
    prop = db.query(Property).filter(Property.id == data.property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Logement introuvable")

    # Vérifier que le locataire n'a pas déjà postulé
    existing = db.query(Application).filter(
        Application.property_id == data.property_id,
        Application.tenant_id   == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tu as déjà postulé pour ce logement")

    new_app = Application(
        property_id = data.property_id,
        tenant_id   = current_user.id,   # locataire connecté
        message     = data.message,
    )
    db.add(new_app)
    db.flush()

    print(f"DEBUG: application create for user={current_user.id} property={prop.id} msg={data.message}")

    requester_name = current_user.full_name or current_user.email
    create_notification(
        db,
        user_id=prop.owner_id,
        type="application_submitted",
        title="New application submitted",
        body=f"{requester_name} submitted an application for {prop.title}.",
        data={
            "application_id": new_app.id,
            "property_id": prop.id,
            "property_title": prop.title,
            "requester_name": requester_name,
            "requester_email": current_user.email,
            "message": data.message,
            "audience": "owner",
        },
    )

    db.commit()
    db.refresh(new_app)
    return new_app


# ─────────────────────────────────────────────
#  GET /applications/received  →  demandes reçues
# ─────────────────────────────────────────────
@router.get("/received", response_model=List[ApplicationOut])
def get_received_applications(
    db:           Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Le propriétaire voit toutes les demandes reçues sur ses logements."""
    # On récupère les IDs des logements du propriétaire connecté
    my_property_ids = [
        p.id for p in db.query(Property).filter(Property.owner_id == current_user.id).all()
    ]
    applications = db.query(Application).filter(
        Application.property_id.in_(my_property_ids)
    ).all()
    return applications


# ─────────────────────────────────────────────
#  GET /applications/sent  →  mes demandes envoyées
# ─────────────────────────────────────────────
@router.get("/sent", response_model=List[ApplicationOut])
def get_sent_applications(
    db:           Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Le locataire voit toutes les demandes qu'il a envoyées."""
    applications = db.query(Application).filter(
        Application.tenant_id == current_user.id
    ).all()
    return applications


# ─────────────────────────────────────────────
#  PUT /applications/{id}  →  accepter / refuser
# ─────────────────────────────────────────────
@router.put("/{application_id}", response_model=ApplicationOut)
def update_application_status(
    application_id: int,
    data:           ApplicationUpdate,
    db:             Session = Depends(get_db),
    current_user  = Depends(get_current_user)
):
    """Le propriétaire accepte ou refuse une demande."""

    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Demande introuvable")

    # Vérifier que le logement appartient bien au propriétaire connecté
    prop = db.query(Property).filter(Property.id == app.property_id).first()
    if prop.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès refusé")

    # Vérifier que le statut envoyé est valide
    if data.status not in ["accepted", "rejected"]:
        raise HTTPException(status_code=400, detail="Statut invalide (accepted / rejected)")

    app.status = data.status

    # Si accepté → on marque le logement comme occupé
    if data.status == "accepted":
        prop.status = "occupied"

    db.commit()
    db.refresh(app)
    return app


# ─────────────────────────────────────────────
#  DELETE /applications/{id}  →  annuler une demande
# ─────────────────────────────────────────────
@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    application_id: int,
    db:             Session = Depends(get_db),
    current_user  = Depends(get_current_user)
):
    """Le locataire annule sa propre demande."""
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Demande introuvable")
    if app.tenant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès refusé")

    db.delete(app)
    db.commit()
    return None
