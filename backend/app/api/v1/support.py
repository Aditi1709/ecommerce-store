from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.support_ticket import SupportTicket

router = APIRouter(prefix="/support", tags=["support"])


class TicketIn(BaseModel):
    category: str
    order_id: Optional[str] = None
    subject: str
    description: str


class TicketStatusIn(BaseModel):
    status: str  # Open | In Progress | Escalated | Resolved


@router.get("/me")
def list_my_tickets(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return (
        db.query(SupportTicket)
        .filter(SupportTicket.user_id == str(user.id))
        .order_by(SupportTicket.created_at.desc())
        .all()
    )


@router.get("/all")
def list_all_tickets(db: Session = Depends(get_db), user=Depends(get_current_user)):
    if getattr(user, "role", "user") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return db.query(SupportTicket).order_by(SupportTicket.created_at.desc()).all()


@router.post("/tickets")
def create_ticket(payload: TicketIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ticket = SupportTicket(
        user_id=str(user.id),
        order_id=payload.order_id,
        category=payload.category,
        subject=payload.subject,
        description=payload.description,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.post("/tickets/{ticket_id}/escalate")
def escalate_ticket(ticket_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.escalation_level >= 3:
        raise HTTPException(status_code=400, detail="Already at maximum escalation level")

    ticket.escalation_level += 1
    ticket.status = "Escalated"
    ticket.assigned_to = (
        "Level 2 Senior Support Specialist"
        if ticket.escalation_level == 2
        else "Level 3 Grievance Officer (Priority)"
    )
    db.commit()
    db.refresh(ticket)
    return ticket


@router.patch("/tickets/{ticket_id}/status")
def update_ticket_status(
    ticket_id: str,
    payload: TicketStatusIn,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    if getattr(user, "role", "user") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ticket.status = payload.status
    db.commit()
    db.refresh(ticket)
    return ticket