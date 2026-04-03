"""Chat backend endpoints for seeker users."""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, or_
from sqlalchemy.orm import Session, relationship

from ..db import Base, get_db
from .auth import get_current_user
from .models import User


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    content = Column(String, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])


class ChatMessageCreate(BaseModel):
    receiver_id: int
    content: str


class ChatMessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sender_id: int
    receiver_id: int
    content: str
    is_read: bool
    created_at: datetime


class ConversationItem(BaseModel):
    other_user_id: int
    other_user_name: str
    last_message: str
    last_message_at: datetime
    unread_count: int


router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/messages", response_model=ChatMessageRead, status_code=status.HTTP_201_CREATED)
def send_chat_message(
    payload: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message content cannot be empty")

    if payload.receiver_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot send a message to yourself")

    receiver = db.query(User).filter(User.id == payload.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Receiver not found")

    message = ChatMessage(
        sender_id=current_user.id,
        receiver_id=payload.receiver_id,
        content=content,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


@router.get("/messages", response_model=List[ChatMessageRead])
def get_my_messages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(ChatMessage)
        .filter(or_(ChatMessage.sender_id == current_user.id, ChatMessage.receiver_id == current_user.id))
        .order_by(ChatMessage.created_at.desc())
        .all()
    )


@router.get("/conversations", response_model=List[ConversationItem])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    messages = (
        db.query(ChatMessage)
        .filter(or_(ChatMessage.sender_id == current_user.id, ChatMessage.receiver_id == current_user.id))
        .order_by(ChatMessage.created_at.desc())
        .all()
    )

    conversations = {}
    for message in messages:
        other_user_id = message.receiver_id if message.sender_id == current_user.id else message.sender_id
        if other_user_id not in conversations:
            other_user = db.query(User).filter(User.id == other_user_id).first()
            conversations[other_user_id] = {
                "other_user_id": other_user_id,
                "other_user_name": other_user.full_name or other_user.email if other_user else f"User {other_user_id}",
                "last_message": message.content,
                "last_message_at": message.created_at,
                "unread_count": 0,
            }

        if message.receiver_id == current_user.id and not message.is_read:
            conversations[other_user_id]["unread_count"] += 1

    return [ConversationItem(**data) for data in conversations.values()]


@router.get("/conversation/{other_user_id}", response_model=List[ChatMessageRead])
def get_conversation_with_user(
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    other_user = db.query(User).filter(User.id == other_user_id).first()
    if not other_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return (
        db.query(ChatMessage)
        .filter(
            or_(
                (ChatMessage.sender_id == current_user.id) & (ChatMessage.receiver_id == other_user_id),
                (ChatMessage.sender_id == other_user_id) & (ChatMessage.receiver_id == current_user.id),
            )
        )
        .order_by(ChatMessage.created_at.asc())
        .all()
    )


@router.put("/messages/{message_id}/read", response_model=ChatMessageRead)
def mark_message_as_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    message = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    if message.receiver_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot mark this message as read")

    message.is_read = True
    db.commit()
    db.refresh(message)
    return message


@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    message = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    if current_user.id not in {message.sender_id, message.receiver_id}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot delete this message")

    db.delete(message)
    db.commit()
    return None
