"""Endpoints chatbot — Owner et Seeker."""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import Optional
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from sqlalchemy import func

from ...db import get_db
from ...config import settings
from ..llama_chatbot import chat

router = APIRouter(prefix="/chatbot", tags=["Chatbot"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


class ChatRequest(BaseModel):
    message: str
    history: Optional[list] = []


def get_user_info(token: str = Depends(oauth2_scheme)) -> dict:
    try:
        payload = jwt.decode(
            token, settings.jwt_secret,
            algorithms=[settings.jwt_algorithm]
        )
        return {
            "user_id": payload.get("sub"),
            "role":    payload.get("role", "tenant"),
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide")


@router.post("/owner/message")
def owner_chat(
    req: ChatRequest,
    user_info: dict = Depends(get_user_info),
    db: Session = Depends(get_db),
):
    """Chatbot dédié aux propriétaires."""
    user_id = int(user_info.get("user_id", 0))

    from backend.backend_propertyowner.models import Property, Application

    total    = db.query(Property).filter(Property.owner_id == user_id).count()
    monthly  = db.query(func.sum(Property.price)).filter(Property.owner_id == user_id, Property.status == "occupied").scalar() or 0.0
    pending  = db.query(Application).join(Property).filter(Property.owner_id == user_id, Application.status == "pending").count()
    occupied = db.query(Property).filter(Property.owner_id == user_id, Property.status == "occupied").count()

    user_data = {
        "total_properties":  total,
        "monthly_revenue":   round(monthly, 2),
        "pending_count":     pending,
        "occupancy_percent": round((occupied / total * 100) if total > 0 else 0),
    }

    response = chat(
        message=req.message,
        history=req.history,
        user_role="property_owner",
        user_data=user_data,
    )
    return {"response": response, "model": "groq-llama"}


@router.post("/seeker/message")
def seeker_chat(
    req: ChatRequest,
    user_info: dict = Depends(get_user_info),
    db: Session = Depends(get_db),
):
    """Chatbot dédié aux locataires."""
    user_id = int(user_info.get("user_id", 0))

    # ── Profil du locataire ──────────────────────────────
    try:
        from backend.backend_user.auth import SeekerProfile
        profile = db.query(SeekerProfile).filter(
            SeekerProfile.user_id == user_id
        ).first()
        user_data = {
            "budget":       "non défini", # budget n'est pas dans SeekerProfile
            "city":         profile.location if profile and profile.location else "non définie",
            "rooms_needed": 1, # rooms_needed n'est pas dans SeekerProfile
        }
    except Exception as e:
        print(f"❌ Error getting profile: {e}")
        user_data = {}

    # ── Cherche les logements dans la BDD ────────────────
    try:
        from backend.backend_propertyowner.models import Property

        query = db.query(Property).filter(Property.status == "available")

        # Cherche la ville dans le MESSAGE
        message_lower = req.message.lower()
        villes_tunisie = [
            "tunis", "sfax", "sousse", "bizerte", "nabeul", "monastir",
            "mahdia", "gabes", "gafsa", "kairouan", "hammamet", "ariana",
            "ben arous", "manouba", "zaghouan", "beja", "jendouba",
            "siliana", "kasserine", "sidi bouzid", "tozeur", "kebili",
            "tataouine", "medenine", "imarates", "la marsa", "marsa", "carthage",
            "lac 1", "lac 2", "lac", "centre ville", "el menzah", "menzah", "el manar", "manar",
            "cite olympique", "aouina", "soukra", "raoued", "ariana", "ennasr", "nasr",
            "mutuelleville", "bardo", "kram", "goulette"
        ]

        import re
        ville_trouvee = None
        for ville in villes_tunisie:
            # check with word boundaries to avoid matching "lac" inside "place"
            # and ignore punctuation
            if re.search(rf"\b{re.escape(ville)}\b", message_lower):
                ville_trouvee = ville
                break

        # Si pas dans le message → utilise le profil
        if not ville_trouvee and user_data.get("city") and user_data["city"] != "non définie":
            ville_trouvee = user_data["city"].lower()

        if ville_trouvee:
            user_data["city"] = ville_trouvee.title()
            query = query.filter(
                Property.city.ilike(f"%{ville_trouvee}%")
            )

        # Filtre budget
        if user_data.get("budget") and user_data["budget"] != "non défini":
            query = query.filter(
                Property.price <= float(user_data["budget"])
            )

        properties = query.limit(5).all()

        if properties:
            properties_text = "\n\nLogements disponibles dans la base de données :\n"
            for p in properties:
                properties_text += f"""
- ID: {p.id} | {p.title}
  Ville: {p.city} | Prix: {p.price} DT | Chambres: {p.rooms}
  Adresse: {p.address}
  Description: {p.description or 'Non disponible'}
"""
        else:
            properties_text = "\n\nAucun logement disponible correspond aux critères."

    except Exception as e:
        print(f"❌ DB error: {e}")
        properties_text = ""

    # ── Ajoute les logements au contexte ─────────────────
    user_data["properties_context"] = properties_text

    response = chat(
        message=req.message,
        history=req.history,
        user_role="tenant",
        user_data=user_data,
    )
    return {"response": response, "model": "groq-llama"}


@router.get("/health")
def health():
    try:
        from groq import Groq
        return {
            "groq": "ok",
            "model": "llama-3.1-8b-instant",
        }
    except Exception as e:
        return {"groq": "error", "message": str(e)}