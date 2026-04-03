"""Notification endpoints and helpers."""

from datetime import timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..backend_propertyowner.models import Property, Visit
from ..db import get_db
from .auth import get_current_user
from .models import Notification, User

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationOut(BaseModel):
    id: int
    user_id: int
    type: str
    title: str
    body: str
    data: Optional[dict[str, Any]] = None
    is_read: bool
    created_at: str
    visit_id: Optional[int] = None
    visit_status: Optional[str] = None
    can_act: bool = False


def create_notification(
    db: Session,
    *,
    user_id: int,
    type: str,
    title: str,
    body: str,
    data: Optional[dict[str, Any]] = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        body=body,
        data=data or None,
    )
    db.add(notification)
    db.flush()
    return notification


def _build_notification_out(
    notification: Notification,
    db: Session,
    current_user: User,
) -> NotificationOut:
    payload = notification.data if isinstance(notification.data, dict) else None
    visit_id: Optional[int] = None
    visit_status: Optional[str] = None
    can_act = False

    if payload and payload.get("visit_id") is not None:
        try:
            visit_id = int(payload["visit_id"])
        except (TypeError, ValueError):
            visit_id = None

    if visit_id is not None:
        visit = db.query(Visit).filter(Visit.id == visit_id).first()
        if visit:
            visit_status = visit.status
            can_act = current_user.role == "owner" and visit.status == "pending"

            if can_act:
                prop = db.query(Property).filter(Property.id == visit.property_id).first()
                can_act = bool(prop and prop.owner_id == current_user.id)

    created_at = notification.created_at
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)

    return NotificationOut(
        id=notification.id,
        user_id=notification.user_id,
        type=notification.type,
        title=notification.title,
        body=notification.body,
        data=payload,
        is_read=notification.is_read,
        created_at=created_at.isoformat(),
        visit_id=visit_id,
        visit_status=visit_status,
        can_act=can_act,
    )


@router.get("/", response_model=list[NotificationOut])
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    raw_notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )

    filtered_notifications = []
    for notification in raw_notifications:
        data = notification.data if isinstance(notification.data, dict) else {}
        audience = data.get("audience")

        if current_user.role == "owner" and audience == "seeker":
            continue

        if current_user.role != "owner" and audience == "owner":
            continue

        filtered_notifications.append(notification)

    return [_build_notification_out(notification, db, current_user) for notification in filtered_notifications]


@router.put("/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id, Notification.is_read.is_(False))
        .all()
    )
    for notification in notifications:
        notification.is_read = True
    db.commit()
    return {"updated": len(notifications)}


@router.put("/{notification_id}/read", response_model=NotificationOut)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id)
        .first()
    )
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return _build_notification_out(notification, db, current_user)
