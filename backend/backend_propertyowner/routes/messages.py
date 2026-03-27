"""Endpoints pour la gestion des messages."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.db import get_db
from backend.backend_user.auth import get_current_user

from backend.backend_propertyowner.models  import Message
from backend.backend_propertyowner.schemas import MessageCreate, MessageOut

router = APIRouter(prefix="/messages", tags=["Messages"])


# ─────────────────────────────────────────────
#  POST /messages  →  envoyer un message
# ─────────────────────────────────────────────
@router.post("/", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def send_message(
    data:         MessageCreate,
    db:           Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Envoie un message à un autre utilisateur."""

    # On ne peut pas s'envoyer un message à soi-même
    if data.receiver_id == current_user.id:
        raise HTTPException(status_code=400, detail="Tu ne peux pas t'envoyer un message à toi-même")

    new_message = Message(
        sender_id   = current_user.id,
        receiver_id = data.receiver_id,
        content     = data.content,
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    return new_message


# ─────────────────────────────────────────────
#  GET /messages/inbox  →  messages reçus
# ─────────────────────────────────────────────
@router.get("/inbox", response_model=List[MessageOut])
def get_inbox(
    db:           Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retourne tous les messages reçus par l'utilisateur connecté."""
    messages = db.query(Message).filter(
        Message.receiver_id == current_user.id
    ).order_by(Message.created_at.desc()).all()
    return messages


# ─────────────────────────────────────────────
#  GET /messages/sent  →  messages envoyés
# ─────────────────────────────────────────────
@router.get("/sent", response_model=List[MessageOut])
def get_sent_messages(
    db:           Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retourne tous les messages envoyés par l'utilisateur connecté."""
    messages = db.query(Message).filter(
        Message.sender_id == current_user.id
    ).order_by(Message.created_at.desc()).all()
    return messages


# ─────────────────────────────────────────────
#  GET /messages/conversation/{user_id}
#  →  conversation avec une personne
# ─────────────────────────────────────────────
@router.get("/conversation/{other_user_id}", response_model=List[MessageOut])
def get_conversation(
    other_user_id: int,
    db:            Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retourne tous les messages échangés entre 2 personnes, dans l'ordre chronologique."""
    messages = db.query(Message).filter(
        (
            (Message.sender_id == current_user.id) &
            (Message.receiver_id == other_user_id)
        ) | (
            (Message.sender_id == other_user_id) &
            (Message.receiver_id == current_user.id)
        )
    ).order_by(Message.created_at.asc()).all()
    return messages


# ─────────────────────────────────────────────
#  PUT /messages/{id}/read  →  marquer comme lu
# ─────────────────────────────────────────────
@router.put("/{message_id}/read", response_model=MessageOut)
def mark_as_read(
    message_id:   int,
    db:           Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Marque un message comme lu — seulement le destinataire peut faire ça."""
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message introuvable")
    if msg.receiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès refusé")

    msg.is_read = True
    db.commit()
    db.refresh(msg)
    return msg


# ─────────────────────────────────────────────
#  DELETE /messages/{id}  →  supprimer un message
# ─────────────────────────────────────────────
@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(
    message_id:   int,
    db:           Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Supprime un message — seulement l'expéditeur peut le faire."""
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message introuvable")
    if msg.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès refusé")

    db.delete(msg)
    db.commit()
    return None
