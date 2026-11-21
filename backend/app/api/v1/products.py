from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.product import Product, Category
from app.schemas.product import ProductOut

router = APIRouter(prefix="/api/v1/products", tags=["Products"])


@router.get("/", response_model=list[ProductOut])
async def list_products(
    category: str | None = None,
    q: str | None = None,
    limit: int = Query(default=20, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Product)
        .where(Product.is_active.is_(True))
        .options(selectinload(Product.variants), selectinload(Product.category))
        .offset(offset)
        .limit(limit)
    )
    if category:
        stmt = stmt.join(Category).where(Category.slug == category)
    if q:
        stmt = stmt.where(Product.name.ilike(f"%{q}%"))

    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{slug}", response_model=ProductOut)
async def get_product(slug: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Product)
        .where(Product.slug == slug, Product.is_active.is_(True))
        .options(selectinload(Product.variants), selectinload(Product.category))
    )
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/sync-womens")
async def sync_womens_catalog():
    from seed_womens import reseed_womens
    await reseed_womens(force=True)
    return {"status": "ok", "message": "Synced Women's & Girls' Wear catalog"}
