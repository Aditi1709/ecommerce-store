import asyncio
from app.core.database import AsyncSessionLocal
from app.models.product import Category, Product, ProductVariant


async def seed():
    async with AsyncSessionLocal() as db:
        apparel = Category(name="Apparel", slug="apparel")
        db.add(apparel)
        await db.flush()

        hoodie = Product(
            category_id=apparel.id,
            name="Heavyweight Cotton Hoodie",
            slug="heavyweight-cotton-hoodie",
            description="400 GSM combed cotton oversized hoodie.",
            variants=[
                ProductVariant(
                    sku="HCH-BLK-M",
                    price_minor=249900,
                    stock_qty=15,
                    attributes={"color": "Black", "size": "M"},
                    image_url="https://placehold.co/600x600/111/fff?text=Black+Hoodie+M",
                ),
                ProductVariant(
                    sku="HCH-BLK-L",
                    price_minor=249900,
                    stock_qty=8,
                    attributes={"color": "Black", "size": "L"},
                    image_url="https://placehold.co/600x600/111/fff?text=Black+Hoodie+L",
                ),
            ],
        )

        tee = Product(
            category_id=apparel.id,
            name="Essential Boxy Tee",
            slug="essential-boxy-tee",
            description="Breathable 240 GSM everyday tee.",
            variants=[
                ProductVariant(
                    sku="EBT-WHT-M",
                    price_minor=99900,
                    stock_qty=25,
                    attributes={"color": "White", "size": "M"},
                    image_url="https://placehold.co/600x600/eee/111?text=White+Tee+M",
                ),
            ],
        )

        db.add_all([hoodie, tee])
        await db.commit()
        print("Seeded sample products!")


if __name__ == "__main__":
    asyncio.run(seed())