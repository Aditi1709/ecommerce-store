from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.return_request import ReturnRequest
from app.models.order import Order

router = APIRouter(prefix="/returns", tags=["returns"])


class ReturnIn(BaseModel):
    order_id: str
    action_type: str
    reason: str
    exchange_variant: Optional[str] = None
    pickup_date: Optional[str] = None
    pickup_slot: Optional[str] = None
    refund_method: Optional[str] = "original_payment"


class ReturnStageUpdate(BaseModel):
    stage_index: int
    refund_status: Optional[str] = None


@router.get("/me")
def list_my_returns(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return (
        db.query(ReturnRequest)
        .filter(ReturnRequest.user_id == str(user.id))
        .order_by(ReturnRequest.created_at.desc())
        .all()
    )


@router.get("/all")
def list_all_returns(db: Session = Depends(get_db), user=Depends(get_current_user)):
    if getattr(user, "role", "user") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return db.query(ReturnRequest).order_by(ReturnRequest.created_at.desc()).all()


@router.post("/")
def create_return(payload: ReturnIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == payload.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    is_cancel = payload.action_type == "cancel"
    rec = ReturnRequest(
        user_id=str(user.id),
        order_id=str(order.id),
        action_type=payload.action_type,
        reason=payload.reason,
        exchange_variant=payload.exchange_variant,
        pickup_date=payload.pickup_date,
        pickup_slot=payload.pickup_slot,
        refund_method=payload.refund_method,
        amount_minor=getattr(order, "total_minor", 0),
        stage_index=4 if is_cancel else 1,
        refund_status="Credited" if is_cancel else "Pending QC",
    )
    if is_cancel:
        order.status = "cancelled"

    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


@router.patch("/{return_id}/stage")
def update_return_stage(
    return_id: str,
    payload: ReturnStageUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    rec = db.query(ReturnRequest).filter(ReturnRequest.id == return_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Return request not found")

    rec.stage_index = max(0, min(4, payload.stage_index))
    if payload.refund_status:
        rec.refund_status = payload.refund_status
    elif rec.stage_index == 4:
        rec.refund_status = "Credited"

    db.commit()
    db.refresh(rec)
    return rec