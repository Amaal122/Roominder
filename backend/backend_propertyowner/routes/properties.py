"""Endpoints pour la gestion des logements."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from db import get_db
from backend_user.auth import get_current_user   # retourne l'utilisateur connecté via JWT

from backend_propertyowner.models  import Property
from backend_propertyowner.schemas import PropertyCreate, PropertyUpdate, PropertyOut

router = APIRouter(prefix="/properties", tags=["Properties"])


# ─────────────────────────────────────────────
#  GET /properties  →  liste tous les logements
# ─────────────────────────────────────────────
@router.get("/", response_model=List[PropertyOut])
def get_all_properties(db: Session = Depends(get_db)):
    """Retourne tous les logements disponibles (visible par tout le monde)."""
    properties = db.query(Property).all()
    return properties


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
    return properties


# ─────────────────────────────────────────────
#  GET /properties/{id}  →  un seul logement
# ─────────────────────────────────────────────
@router.get("/{property_id}", response_model=PropertyOut)
def get_property(property_id: int, db: Session = Depends(get_db)):
    """Retourne un logement par son ID."""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Logement introuvable")
    return prop


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
        description = data.description,
        image_url   = data.image_url,
    )
    db.add(new_property)
    db.commit()
    db.refresh(new_property)
    return new_property


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
    return prop


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

    db.delete(prop)
    db.commit()
    return None
