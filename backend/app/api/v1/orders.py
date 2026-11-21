from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.product import ProductVariant
from app.models.order import Order, OrderItem
from app.schemas.order import OrderCreate, OrderOut
from app.api.v1.auth import get_current_user
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/v1/orders", tags=["Orders"])


@router.post("/", response_model=OrderOut, status_code=201)
async def create_order(payload: OrderCreate, db: AsyncSession = Depends(get_db)):
    if payload.payment_method == "upi" and not (payload.payment_ref and payload.payment_ref.strip()):
        raise HTTPException(status_code=400, detail="UPI UTR / Transaction ID is required")

    total_minor = 0
    order_items: list[OrderItem] = []

    for item in payload.items:
        stmt = (
            select(ProductVariant)
            .where(ProductVariant.id == item.variant_id)
            .options(selectinload(ProductVariant.product))
        )
        variant = (await db.execute(stmt)).scalar_one_or_none()
        if not variant:
            raise HTTPException(status_code=404, detail=f"Variant {item.variant_id} not found")

        deduct = (
            update(ProductVariant)
            .where(ProductVariant.id == item.variant_id, ProductVariant.stock_qty >= item.quantity)
            .values(stock_qty=ProductVariant.stock_qty - item.quantity)
        )
        res = await db.execute(deduct)
        if res.rowcount == 0:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {variant.sku}")

        total_minor += variant.price_minor * item.quantity
        order_items.append(
            OrderItem(
                variant_id=variant.id,
                product_name_snapshot=variant.product.name,
                sku_snapshot=variant.sku,
                unit_price_minor=variant.price_minor,
                quantity=item.quantity,
            )
        )

    initial_status = "pending_verification" if payload.payment_method == "upi" else "confirmed"

    order = Order(
        customer_name=payload.customer_name,
        customer_email=payload.customer_email,
        shipping_address=payload.shipping_address,
        payment_method=payload.payment_method,
        payment_ref=payload.payment_ref.strip() if payload.payment_ref else None,
        status=initial_status,
        total_minor=total_minor,
        items=order_items,
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order

@router.get("/me")
def list_my_orders(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return (
        db.query(Order)
        .filter(Order.customer_email == user.email)
        .order_by(Order.created_at.desc())
        .all()
    )


@router.get("/{order_id}/track")
def track_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    stage_map = {
        "pending": 0,
        "pending_verification": 1,
        "paid": 2,
        "processing": 2,
        "packed": 3,
        "shipped": 4,
        "out_for_delivery": 5,
        "delivered": 6,
    }
    return {
        "id": str(order.id),
        "status": order.status,
        "stage_index": stage_map.get(order.status, 0),
        "cancelled": order.status in ("cancelled", "refunded"),
        "customer_name": order.customer_name,
        "customer_email": order.customer_email,
        "shipping_address": order.shipping_address,
        "payment_method": order.payment_method,
        "total_minor": getattr(order, "total_minor", 0),
        "courier": "BlueDart Express",
        "tracking_number": f"BLD-{str(order.id).replace('-', '')[:8].upper()}",
        "created_at": order.created_at,
    }


@router.post("/{order_id}/cancel")
def cancel_order(order_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.customer_email == user.email)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status in ("shipped", "out_for_delivery", "delivered"):
        raise HTTPException(status_code=400, detail="Order already shipped and cannot be cancelled")

    order.status = "cancelled"
    db.commit()
    db.refresh(order)
    return {"id": str(order.id), "status": order.status}