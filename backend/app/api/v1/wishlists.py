from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.wishlist import WishlistItem

router = APIRouter(prefix="/wishlists", tags=["wishlists"])


class WishlistItemIn(BaseModel):
    list_name: str = "Favorites"
    variant_id: str
    product_name: str
    slug: str
    sku: str
    label: str = ""
    price_minor: int
    image_url: Optional[str] = None
    price_drop_alert: bool = True
    back_in_stock_alert: bool = False


class AlertToggleIn(BaseModel):
    price_drop_alert: Optional[bool] = None
    back_in_stock_alert: Optional[bool] = None


@router.get("/me")
def list_my_wishlist(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return (
        db.query(WishlistItem)
        .filter(WishlistItem.user_id == str(user.id))
        .order_by(WishlistItem.created_at.desc())
        .all()
    )


@router.post("/")
def add_wishlist_item(payload: WishlistItemIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    existing = (
        db.query(WishlistItem)
        .filter(
            WishlistItem.user_id == str(user.id),
            WishlistItem.list_name == payload.list_name,
            WishlistItem.variant_id == payload.variant_id,
        )
        .first()
    )
    if existing:
        return existing

    item = WishlistItem(user_id=str(user.id), **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{item_id}/alerts")
def toggle_alerts(
    item_id: str,
    payload: AlertToggleIn,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    item = (
        db.query(WishlistItem)
        .filter(WishlistItem.id == item_id, WishlistItem.user_id == str(user.id))
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Wishlist item not found")
    if payload.price_drop_alert is not None:
        item.price_drop_alert = payload.price_drop_alert
    if payload.back_in_stock_alert is not None:
        item.back_in_stock_alert = payload.back_in_stock_alert
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete_wishlist_item(item_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    item = (
        db.query(WishlistItem)
        .filter(WishlistItem.id == item_id, WishlistItem.user_id == str(user.id))
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Wishlist item not found")
    db.delete(item)
    db.commit()
    return {"ok": True}