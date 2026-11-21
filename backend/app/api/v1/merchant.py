import re
import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import require_merchant, get_rank
from app.models.product import Category, Product, ProductVariant
from app.models.user import User
from app.schemas.product import ProductOut

router = APIRouter(prefix="/api/v1/merchant", tags=["Merchant"])


class MerchantProductCreate(BaseModel):
    name: str
    category_name: str = "General"
    description: str = ""
    price_inr: int
    stock_qty: int = 10
    color: str = "Default"
    size: str = "Standard"
    image_url: str | None = None


def slugify(text: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return f"{base}-{uuid.uuid4().hex[:6]}"


@router.get("/products", response_model=list[ProductOut])
async def my_products(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_merchant),
):
    stmt = (
        select(Product)
        .options(selectinload(Product.variants), selectinload(Product.category))
        .order_by(Product.created_at.desc())
    )
    if get_rank(user.role) < get_rank("admin"):
        stmt = stmt.where(Product.merchant_id == user.id)

    return (await db.execute(stmt)).scalars().all()


@router.post("/products", status_code=201)
async def create_merchant_product(
    payload: MerchantProductCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_merchant),
):
    cat_slug = re.sub(r"[^a-z0-9]+", "-", payload.category_name.lower()).strip("-")
    category = (await db.execute(select(Category).where(Category.slug == cat_slug))).scalar_one_or_none()
    if not category:
        category = Category(name=payload.category_name, slug=cat_slug)
        db.add(category)
        await db.flush()

    sku = f"SKU-{uuid.uuid4().hex[:8].upper()}"
    product = Product(
        category_id=category.id,
        merchant_id=user.id,
        name=payload.name,
        slug=slugify(payload.name),
        description=payload.description,
        variants=[
            ProductVariant(
                sku=sku,
                price_minor=payload.price_inr * 100,
                stock_qty=payload.stock_qty,
                attributes={"color": payload.color, "size": payload.size},
                image_url=payload.image_url,
            )
        ],
    )
    db.add(product)
    await db.commit()
    return {"id": str(product.id), "slug": product.slug}


@router.delete("/products/{product_id}")
async def delete_merchant_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_merchant),
):
    product = (await db.execute(select(Product).where(Product.id == product_id))).scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.merchant_id != user.id and get_rank(user.role) < get_rank("admin"):
        raise HTTPException(status_code=403, detail="You can only delete your own products")

    await db.delete(product)
    await db.commit()
    return {"deleted": True}