from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.notification import Notification

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationIn(BaseModel):
    event: str
    title: str
    message: str
    category: str = "orders"
    channels: str = "email,push"
    link: Optional[str] = None


@router.get("/me")
def list_my_notifications(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return (
        db.query(Notification)
        .filter(Notification.user_id == str(user.id))
        .order_by(Notification.created_at.desc())
        .all()
    )


@router.post("/")
def create_notification(payload: NotificationIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    item = Notification(user_id=str(user.id), **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{notif_id}/read")
def mark_read(notif_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    item = (
        db.query(Notification)
        .filter(Notification.id == notif_id, Notification.user_id == str(user.id))
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Notification not found")
    item.is_read = True
    db.commit()
    return {"ok": True}


@router.post("/mark-all-read")
def mark_all_read(db: Session = Depends(get_db), user=Depends(get_current_user)):
    (
        db.query(Notification)
        .filter(Notification.user_id == str(user.id), Notification.is_read == False)
        .update({"is_read": True})
    )
    db.commit()
    return {"ok": True}