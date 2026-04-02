"""Endpoints pour les profils utilisateurs."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from ..db import get_db
from .models import User

router = APIRouter(prefix="/users", tags=["Users"])


# ── Schema de sortie ──────────────────────────────────────────────────────────
class UserProfileOut(BaseModel):
    id:         int
    full_name:  Optional[str]
    role:       Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
#  GET /users/{id}  →  profil public d'un user
# ─────────────────────────────────────────────
@router.get("/{user_id}", response_model=UserProfileOut)
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    """
    Retourne le profil public d'un utilisateur.
    Utilisé par le locataire pour voir le profil du propriétaire.
    On ne renvoie PAS l'email ni le mot de passe — seulement les infos publiques.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    return user
