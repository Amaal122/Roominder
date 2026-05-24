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
API_PUBLIC_BASE_URL = "http://127.0.0.1:8001"


class ChatRequest(BaseModel):
    message: str
    history: Optional[list] = []


def _conversation_text(req: ChatRequest) -> str:
    parts = []
    for msg in req.history or []:
        if isinstance(msg, dict) and msg.get("role") == "user":
            parts.append(str(msg.get("content", "")))
    parts.append(req.message)
    return " ".join(parts).lower()


def _extract_budget(text: str) -> Optional[float]:
    import re

    matches = re.findall(r"\b(\d{2,5})(?:\s*(?:dt|dinar|dinars|tnd))?\b", text)
    if not matches:
        return None
    return float(matches[-1])


def _requested_property_index(text: str) -> Optional[int]:
    import re
    import unicodedata

    text = unicodedata.normalize("NFKD", text or "")
    text = "".join(char for char in text if not unicodedata.combining(char)).lower()
    text = text.replace("\u00b0", " ").replace("\u00ba", " ")

    intent_words = (
        "choisi", "choisir", "aime", "interesse",
        "detail", "details", "detailles", "description", "plus",
        "nheb", "habit", "behi",
    )
    has_selection_intent = any(word in text for word in intent_words)

    if has_selection_intent:
        numeric_match = re.search(
            r"\b(?:choix|option|logement|num|numero|no|n)\s*(\d{1,2})\b",
            text,
        )
        if numeric_match:
            requested = int(numeric_match.group(1))
            if requested >= 1:
                return requested - 1

        numeric_match = re.search(r"\b(?:le|la|l'|el)?\s*(\d{1,2})(?:e|eme)?\b", text)
        if numeric_match and any(word in text for word in ("choix", "option", "logement")):
            requested = int(numeric_match.group(1))
            if requested >= 1:
                return requested - 1

    direct_choices = (
        (0, ("premier choix", "premiere choix", "premiere option", "premier option", "1er choix", "1ere choix", "choix 1", "option 1")),
        (1, ("deuxieme choix", "deuxieme option", "second choix", "seconde option", "2eme choix", "choix 2", "option 2")),
        (2, ("troisieme choix", "troisieme option", "3eme choix", "choix 3", "option 3")),
    )
    for index, phrases in direct_choices:
        if any(phrase in text for phrase in phrases):
            return index

    checks = [
        (0, ("premiere", "première", "1ere", "1ère", "1er", "first", "awal", "loula", "louel", "loweel", "lweel")),
        (1, ("deuxieme", "deuxième", "2eme", "2ème", "2e", "second", "seconda", "thenya")),
        (2, ("troisieme", "troisième", "3eme", "3ème", "3e", "third", "theltha")),
        (-1, ("derniere", "derniere", "dernier", "last", "lekhr", "lekhra", "ekher", "ekhira")),
    ]
    if not has_selection_intent:
        return None
    matches = []
    for index, words in checks:
        for word in words:
            for match in re.finditer(rf"\b{re.escape(word)}\b", text):
                prefix = text[max(0, match.start() - 12):match.start()]
                if re.search(r"\b(pas|not|non)\s+(le\s+|la\s+|l'|el\s+)?$", prefix):
                    continue
                matches.append((match.start(), index))

    if not matches:
        return None
    return sorted(matches)[0][1]


def _normalize_for_match(value: str) -> str:
    import re
    import unicodedata

    normalized = unicodedata.normalize("NFKD", value or "")
    normalized = "".join(char for char in normalized if not unicodedata.combining(char))
    normalized = normalized.lower()
    return re.sub(r"[^a-z0-9]+", " ", normalized).strip()


def _requested_property_by_name(message: str, properties: list[dict]) -> Optional[dict]:
    text = _normalize_for_match(message)
    if not text:
        return None

    for prop in properties:
        title = _normalize_for_match(str(prop.get("title", "")))
        if title and (title in text or text in title):
            return prop

    text_words = set(text.split())
    best_match = None
    best_score = 0
    for prop in properties:
        title_words = set(_normalize_for_match(str(prop.get("title", ""))).split())
        meaningful_words = {word for word in title_words if len(word) >= 4}
        score = len(text_words & meaningful_words)
        if meaningful_words and score > best_score:
            best_match = prop
            best_score = score

    return best_match if best_score >= 2 else None


def _resolve_image_url(image_url: Optional[str]) -> str:
    if not image_url:
        return ""
    if image_url.startswith(("http://", "https://", "data:", "blob:")):
        return image_url
    if image_url.startswith("/"):
        return f"{API_PUBLIC_BASE_URL}{image_url}"
    return f"{API_PUBLIC_BASE_URL}/{image_url}"


def _score_budget(price: float, budget) -> int:
    if not isinstance(budget, (int, float)) or budget <= 0:
        return 90
    if price <= budget:
        return max(80, min(100, round(100 - ((budget - price) / budget * 20))))
    over_ratio = (price - budget) / budget
    return max(35, round(75 - over_ratio * 100))


def _property_ai_scores(property_data: dict) -> dict:
    score_location = int(property_data.get("score_location", 95))
    score_budget = int(property_data.get("score_budget", 90))
    score_lifestyle = int(property_data.get("score_lifestyle", 90))
    match = round(score_location * 0.30 + score_budget * 0.35 + score_lifestyle * 0.15 + 20)
    return {
        "match": max(0, min(100, match)),
        "scoreLocation": max(0, min(100, score_location)),
        "scoreBudget": max(0, min(100, score_budget)),
        "scoreLifestyle": max(0, min(100, score_lifestyle)),
    }


def _property_links(property_data: dict) -> list[dict]:
    import json

    property_id = str(property_data["id"])
    title = str(property_data["title"])
    city = str(property_data["city"])
    address = str(property_data.get("address") or "")
    location = f"{address}, {city}" if address else city
    scores = _property_ai_scores(property_data)
    explanation = [
        f"Localisation: ce logement est a {city}.",
        f"Budget: prix de {float(property_data['price']):.0f} DT/mois.",
        f"Caracteristiques: {property_data.get('rooms') or 1} chambre(s), {property_data.get('bathrooms') or 1} salle(s) de bain, {float(property_data.get('space') or 0):.0f} m2.",
    ]
    return [
        {
            "label": "Voir le logement",
            "route": "/screens/PropertyDetail",
            "params": {
                "id": property_id,
                "title": title,
                "location": location,
                "price": f"DT {float(property_data['price']):.0f}",
                "budget": f"DT {float(property_data['price']):.0f}",
                "rooms": f"{property_data.get('rooms') or 1} Beds",
                "baths": f"{property_data.get('bathrooms') or 1} Bath",
                "size": f"{float(property_data.get('space') or 0):.0f} m²",
                "match": str(scores["match"]),
                "scoreLocation": str(scores["scoreLocation"]),
                "scoreBudget": str(scores["scoreBudget"]),
                "scoreLifestyle": str(scores["scoreLifestyle"]),
                "explanation": json.dumps(explanation),
                "description": property_data.get("description") or "",
                "ownerId": str(property_data.get("owner_id") or ""),
                "image": _resolve_image_url(property_data.get("image_url")),
            },
        },
        {
            "label": "Demander une visite",
            "route": "/screens/VisitRequest",
            "params": {
                "id": property_id,
                "title": title,
                "location": location,
            },
        },
    ]


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

        # Cherche la ville et le budget dans toute la conversation recente.
        conversation_lower = _conversation_text(req)
        requested_index = _requested_property_index(req.message.lower())
        budget = _extract_budget(conversation_lower)
        if budget is not None:
            user_data["budget"] = budget
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
            if re.search(rf"\b{re.escape(ville)}\b", conversation_lower):
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
        user_data["properties"] = [
            {
                "id": p.id,
                "title": p.title,
                "city": p.city,
                "price": p.price,
                "rooms": p.rooms,
                "bathrooms": p.bathrooms,
                "space": p.space,
                "address": p.address,
                "description": p.description,
                "owner_id": p.owner_id,
                "image_url": p.image_url,
                "score_location": 100 if ville_trouvee and ville_trouvee in (p.city or "").lower() else 90,
                "score_budget": _score_budget(float(p.price), user_data.get("budget")),
                "score_lifestyle": 90,
            }
            for p in properties
        ]
        if requested_index is not None and user_data["properties"]:
            if requested_index == -1:
                user_data["selected_property"] = user_data["properties"][-1]
                user_data["selected_property_label"] = "dernier choix"
            elif requested_index < len(user_data["properties"]):
                user_data["selected_property"] = user_data["properties"][requested_index]
                labels = ("premier choix", "deuxieme choix", "troisieme choix")
                user_data["selected_property_label"] = (
                    labels[requested_index]
                    if requested_index < len(labels)
                    else f"choix {requested_index + 1}"
                )

        if not user_data.get("selected_property"):
            selected_by_name = _requested_property_by_name(req.message, user_data["properties"])
            if selected_by_name:
                user_data["selected_property"] = selected_by_name
                user_data["selected_property_label"] = "logement choisi"

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
    selected_property = user_data.get("selected_property")
    links = _property_links(selected_property) if selected_property else []
    return {"response": response, "model": "groq-llama", "links": links}


@router.get("/health")
def health():
    try:
        from ..llama_chatbot import GROQ_API_KEY
        return {
            "groq": "configured" if GROQ_API_KEY else "missing_api_key",
            "model": "llama-3.1-8b-instant",
        }
    except Exception as e:
        return {"groq": "error", "message": str(e)}
