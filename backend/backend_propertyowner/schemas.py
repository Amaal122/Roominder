"""Pydantic schemas for the property owner service."""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


# ─────────────────────────────────────────────
#  PROPERTY
# ─────────────────────────────────────────────

class PropertyCreate(BaseModel):
    """Données reçues quand on CRÉE un logement."""
    title:       str
    address:     str
    city:        str
    price:       float
    rooms:       int = 1
    description: Optional[str] = None
    image_url:   Optional[str] = None


class PropertyUpdate(BaseModel):
    """Données reçues quand on MODIFIE un logement (tout est optionnel)."""
    title:       Optional[str]   = None
    address:     Optional[str]   = None
    city:        Optional[str]   = None
    price:       Optional[float] = None
    rooms:       Optional[int]   = None
    description: Optional[str]   = None
    status:      Optional[str]   = None   # available / occupied
    image_url:   Optional[str]   = None


class PropertyOut(BaseModel):
    """Données renvoyées quand on LIT un logement."""
    id:          int
    owner_id:    int
    title:       str
    address:     str
    city:        str
    price:       float
    rooms:       int
    description: Optional[str]
    status:      str
    image_url:   Optional[str]
    created_at:  datetime

    class Config:
        from_attributes = True   # permet de lire un objet SQLAlchemy directement


# ─────────────────────────────────────────────
#  APPLICATION
# ─────────────────────────────────────────────

class ApplicationCreate(BaseModel):
    """Données reçues quand un locataire ENVOIE une demande."""
    property_id: int
    message:     Optional[str] = None


class ApplicationUpdate(BaseModel):
    """Données reçues quand le propriétaire RÉPOND à une demande."""
    status: str   # accepted / rejected


class ApplicationOut(BaseModel):
    """Données renvoyées quand on LIT une demande."""
    id:          int
    property_id: int
    tenant_id:   int
    status:      str
    message:     Optional[str]
    created_at:  datetime

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
#  MESSAGE
# ─────────────────────────────────────────────

class MessageCreate(BaseModel):
    """Données reçues quand on ENVOIE un message."""
    receiver_id: int
    content:     str


class MessageOut(BaseModel):
    """Données renvoyées quand on LIT un message."""
    id:          int
    sender_id:   int
    receiver_id: int
    content:     str
    is_read:     bool
    created_at:  datetime

    class Config:
        from_attributes = True

# ── Visit ─────────────────────────────────────────────
class VisitCreate(BaseModel):
    property_id:    int
    full_name:      str
    phone:          str
    preferred_time: str
    message:        Optional[str] = None

class VisitOut(BaseModel):
    id:             int
    property_id:    int
    tenant_id:      int
    full_name:      str
    phone:          str
    preferred_time: str
    message:        Optional[str]
    status:         str
    created_at:     datetime

    class Config:
        from_attributes = True        