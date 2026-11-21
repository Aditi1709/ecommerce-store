import csv
import io
import re
import uuid
from collections import defaultdict
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import require_admin, can_manage, ROLE_RANK
from app.models.product import Category, Product, ProductVariant
from app.models.order import Order
from app.models.user import User
from app.schemas.product import ProductOut
from app.schemas.user import UserOut

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])


class AdminProductCreate(BaseModel):
    name: str
    category_name: str
    description: str = ""
    sku: str
    price_inr: int
    stock_qty: int
    color: str = "Default"
    size: str = "M"
    image_url: str | None = None


class AdminProductUpdate(BaseModel):
    name: str | None = None
    price_inr: int | None = None
    stock_qty: int | None = None


class OrderStatusUpdate(BaseModel):
    status: str


class RoleUpdate(BaseModel):
    role: str


class AdminOrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    product_name_snapshot: str
    sku_snapshot: str
    quantity: int
    unit_price_minor: int


class AdminOrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    customer_name: str
    customer_email: str
    status: str
    payment_method: str
    payment_ref: str | None = None
    total_minor: int
    created_at: datetime
    items: list[AdminOrderItemOut]


def slugify(text: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return f"{base}-{uuid.uuid4().hex[:5]}"


@router.get("/overview")
async def get_overview(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    orders = (
        await db.execute(select(Order).options(selectinload(Order.items)).order_by(Order.created_at.desc()))
    ).scalars().all()
    products = (
        await db.execute(select(Product).options(selectinload(Product.variants), selectinload(Product.category)))
    ).scalars().all()
    users = (await db.execute(select(User))).scalars().all()

    total_revenue_minor = sum(o.total_minor for o in orders if o.status not in ("cancelled", "refunded"))
    pending_orders = sum(1 for o in orders if o.status in ("pending", "pending_verification"))
    cancelled_orders = sum(1 for o in orders if o.status == "cancelled")

    low_stock = []
    for p in products:
        for v in p.variants:
            if v.stock_qty <= 10:
                low_stock.append({
                    "product_id": str(p.id),
                    "name": p.name,
                    "sku": v.sku,
                    "stock_qty": v.stock_qty,
                })

    # Group revenue by date for sales chart
    daily_sales: dict[str, int] = defaultdict(int)
    for o in orders:
        if o.status not in ("cancelled", "refunded"):
            day = o.created_at.strftime("%b %d")
            daily_sales[day] += o.total_minor // 100

    sales_chart = [{"label": k, "amount": v} for k, v in list(daily_sales.items())[:7]][::-1]

    return {
        "total_revenue_minor": total_revenue_minor,
        "total_orders": len(orders),
        "pending_orders": pending_orders,
        "cancelled_orders": cancelled_orders,
        "total_customers": len(users),
        "total_products": len(products),
        "low_stock": low_stock,
        "sales_chart": sales_chart,
    }


@router.get("/products", response_model=list[ProductOut])
async def list_all_products(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    stmt = (
        select(Product)
        .options(selectinload(Product.variants), selectinload(Product.category))
        .order_by(Product.created_at.desc())
    )
    return (await db.execute(stmt)).scalars().all()


@router.post("/products", status_code=201)
async def create_product(
    payload: AdminProductCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    cat_slug = re.sub(r"[^a-z0-9]+", "-", payload.category_name.lower()).strip("-")
    category = (await db.execute(select(Category).where(Category.slug == cat_slug))).scalar_one_or_none()
    if not category:
        category = Category(name=payload.category_name, slug=cat_slug)
        db.add(category)
        await db.flush()

    product = Product(
        category_id=category.id,
        name=payload.name,
        slug=slugify(payload.name),
        description=payload.description,
        variants=[
            ProductVariant(
                sku=payload.sku,
                price_minor=payload.price_inr * 100,
                stock_qty=payload.stock_qty,
                attributes={"color": payload.color, "size": payload.size},
                image_url=payload.image_url or None,
            )
        ],
    )
    db.add(product)
    await db.commit()
    return {"id": str(product.id), "slug": product.slug}


@router.patch("/products/{product_id}")
async def update_product(
    product_id: uuid.UUID,
    payload: AdminProductUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    stmt = select(Product).where(Product.id == product_id).options(selectinload(Product.variants))
    product = (await db.execute(stmt)).scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if payload.name is not None:
        product.name = payload.name
    if product.variants:
        if payload.price_inr is not None:
            product.variants[0].price_minor = payload.price_inr * 100
        if payload.stock_qty is not None:
            product.variants[0].stock_qty = payload.stock_qty

    await db.commit()
    return {"updated": True}


@router.delete("/products/{product_id}")
async def delete_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    product = (await db.execute(select(Product).where(Product.id == product_id))).scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    await db.delete(product)
    await db.commit()
    return {"deleted": True}


@router.get("/orders", response_model=list[AdminOrderOut])
async def list_orders(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    stmt = select(Order).options(selectinload(Order.items)).order_by(Order.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.patch("/orders/{order_id}/status")
async def update_order_status(
    order_id: uuid.UUID,
    payload: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    order = (await db.execute(select(Order).where(Order.id == order_id))).scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = payload.status
    await db.commit()
    return {"id": str(order.id), "status": order.status}


@router.get("/reports/orders.csv")
async def export_orders_csv(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    orders = (await db.execute(select(Order).order_by(Order.created_at.desc()))).scalars().all()
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["Order ID", "Customer", "Email", "Status", "Payment", "UTR", "Total (INR)", "Date"])
    for o in orders:
        writer.writerow([
            str(o.id),
            o.customer_name,
            o.customer_email,
            o.status,
            o.payment_method,
            o.payment_ref or "",
            f"{o.total_minor / 100:.2f}",
            o.created_at.isoformat(),
        ])
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=orders-report.csv"},
    )


@router.get("/users", response_model=list[UserOut])
async def list_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    return (await db.execute(select(User).order_by(User.created_at.desc()))).scalars().all()


@router.patch("/users/{user_id}/role", response_model=UserOut)
async def update_user_role(
    user_id: uuid.UUID,
    payload: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require_admin),
):
    if payload.role not in ROLE_RANK:
        raise HTTPException(status_code=400, detail="Invalid role")

    target = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    if not can_manage(actor.role, target.role):
        raise HTTPException(status_code=403, detail=f"{actor.role} cannot manage {target.role}")
    if not can_manage(actor.role, payload.role):
        raise HTTPException(status_code=403, detail=f"{actor.role} cannot assign {payload.role}")

    target.role = payload.role
    await db.commit()
    await db.refresh(target)
    return target