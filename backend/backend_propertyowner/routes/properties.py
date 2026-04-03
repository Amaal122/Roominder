"""Endpoints pour la gestion des logements."""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List
import shutil
import uuid
import os
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

from backend.db import get_db
from backend.backend_user.auth import get_current_user   # retourne l'utilisateur connecté via JWT

from backend.backend_propertyowner.models  import Application, Property, Visit
from backend.backend_propertyowner.schemas import PropertyCreate, PropertyUpdate, PropertyOut


router = APIRouter(prefix="/properties", tags=["Properties"])


def _get_rental_application_counts(db: Session, property_ids: list[int]) -> dict[int, int]:
    if not property_ids:
        return {}

    from backend.backend_user.applicationrequest import RentalApplication

    rows = (
        db.query(
            RentalApplication.property_id,
            func.count(RentalApplication.id),
        )
        .filter(RentalApplication.property_id.in_(property_ids))
        .group_by(RentalApplication.property_id)
        .all()
    )
    return {property_id: count for property_id, count in rows}


def _build_property_out(prop: Property, applications_count: int = 0) -> PropertyOut:
    return PropertyOut(
        id=prop.id,
        owner_id=prop.owner_id,
        title=prop.title,
        address=prop.address,
        city=prop.city,
        price=prop.price,
        rooms=prop.rooms,
        bathrooms=prop.bathrooms,
        space=prop.space,
        description=prop.description,
        status=prop.status,
        image_url=prop.image_url,
        created_at=prop.created_at,
        applications_count=applications_count,
    )


# ─────────────────────────────────────────────
#  GET /properties  →  liste tous les logements
# ─────────────────────────────────────────────
@router.get("/", response_model=List[PropertyOut])
def get_all_properties(db: Session = Depends(get_db)):
    """Retourne tous les logements disponibles (visible par tout le monde)."""
    properties = db.query(Property).all()
    application_counts = _get_rental_application_counts(db, [prop.id for prop in properties])
    return [
        _build_property_out(prop, application_counts.get(prop.id, 0))
        for prop in properties
    ]


# ─────────────────────────────────────────────
#  GET /properties/mine  →  mes logements à moi
# ─────────────────────────────────────────────
@router.get("/mine", response_model=List[PropertyOut])
def get_my_properties(
    db:           Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retourne uniquement les logements du propriétaire connecté."""
    properties = db.query(Property).filter(Property.owner_id == current_user.id).all()
    application_counts = _get_rental_application_counts(db, [prop.id for prop in properties])
    return [
        _build_property_out(prop, application_counts.get(prop.id, 0))
        for prop in properties
    ]

#staic routes 
load_dotenv()

cloudinary.config(
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key    = os.getenv("CLOUDINARY_API_KEY"),
    api_secret = os.getenv("CLOUDINARY_API_SECRET"),
)
@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type")
    contents = await file.read()
    result = cloudinary.uploader.upload(contents)
    return {"url": result["secure_url"]}
# ─────────────────────────────────────────────
#  GET /properties/{id}  →  un seul logement
# ─────────────────────────────────────────────
@router.get("/{property_id}", response_model=PropertyOut)
def get_property(property_id: int, db: Session = Depends(get_db)):
    """Retourne un logement par son ID."""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Logement introuvable")
    application_counts = _get_rental_application_counts(db, [prop.id])
    return _build_property_out(prop, application_counts.get(prop.id, 0))


# ─────────────────────────────────────────────
#  POST /properties  →  créer un logement
# ─────────────────────────────────────────────
@router.post("/", response_model=PropertyOut, status_code=status.HTTP_201_CREATED)
def create_property(
    data:         PropertyCreate,
    db:           Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Crée un nouveau logement pour le propriétaire connecté."""
    new_property = Property(
        owner_id    = current_user.id,   # on récupère l'id depuis le token JWT
        title       = data.title,
        address     = data.address,
        city        = data.city,
        price       = data.price,
        rooms       = data.rooms,
        bathrooms   = data.bathrooms,
        space       = data.space,
        description = data.description,
        image_url   = data.image_url,
    )
    db.add(new_property)
    db.commit()
    db.refresh(new_property)
    return _build_property_out(new_property, 0)


# ─────────────────────────────────────────────
#  PUT /properties/{id}  →  modifier un logement
# ─────────────────────────────────────────────
@router.put("/{property_id}", response_model=PropertyOut)
def update_property(
    property_id:  int,
    data:         PropertyUpdate,
    db:           Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Modifie un logement — seulement si tu en es le propriétaire."""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Logement introuvable")
    if prop.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès refusé")

    # On met à jour uniquement les champs envoyés (exclude_unset ignore les None)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(prop, field, value)

    db.commit()
    db.refresh(prop)
    application_counts = _get_rental_application_counts(db, [prop.id])
    return _build_property_out(prop, application_counts.get(prop.id, 0))


# ─────────────────────────────────────────────
#  DELETE /properties/{id}  →  supprimer
# ─────────────────────────────────────────────
@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property(
    property_id:  int,
    db:           Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Supprime un logement — seulement si tu en es le propriétaire."""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Logement introuvable")
    if prop.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès refusé")

    db.query(Application).filter(
        Application.property_id == property_id
    ).delete(synchronize_session=False)
    db.query(Visit).filter(
        Visit.property_id == property_id
    ).delete(synchronize_session=False)
    db.delete(prop)
    db.commit()
    return None
