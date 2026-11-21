from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.v1.auth import get_current_user  # adjust if your auth dep is elsewhere
from app.models.address import Address

router = APIRouter(prefix="/addresses", tags=["addresses"])


class AddressIn(BaseModel):
    label: str = "Home"
    full_name: str
    phone: str
    line1: str
    city: str
    state: str
    pincode: str = Field(..., pattern=r"^[1-9][0-9]{5}$")


class AddressOut(AddressIn):
    id: str

    class Config:
        from_attributes = True


@router.get("/", response_model=List[AddressOut])
def list_my_addresses(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return (
        db.query(Address)
        .filter(Address.user_id == str(user.id))
        .order_by(Address.created_at.desc())
        .all()
    )


@router.post("/", response_model=AddressOut)
def create_address(payload: AddressIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    addr = Address(user_id=str(user.id), **payload.model_dump())
    db.add(addr)
    db.commit()
    db.refresh(addr)
    return addr


@router.put("/{address_id}", response_model=AddressOut)
def update_address(
    address_id: str,
    payload: AddressIn,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    addr = (
        db.query(Address)
        .filter(Address.id == address_id, Address.user_id == str(user.id))
        .first()
    )
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")
    for k, v in payload.model_dump().items():
        setattr(addr, k, v)
    db.commit()
    db.refresh(addr)
    return addr


@router.delete("/{address_id}")
def delete_address(address_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    addr = (
        db.query(Address)
        .filter(Address.id == address_id, Address.user_id == str(user.id))
        .first()
    )
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")
    db.delete(addr)
    db.commit()
    return {"ok": True}