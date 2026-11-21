import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.product import Category, Product, ProductVariant
import app.models.user  # noqa: F401

CATALOG = [
    # Apparel
    ("Apparel", "Oversized Acid-Wash Tee", "oversized-acid-wash-tee", "Heavyweight 240 GSM combed cotton tee with a relaxed drop-shoulder fit.", [
        ("TEE-CHR-M", 129900, 25, {"color": "Charcoal", "size": "M"}, "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600"),
        ("TEE-CHR-L", 129900, 18, {"color": "Charcoal", "size": "L"}, "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600"),
    ]),
    ("Apparel", "Relaxed Utility Cargo Pants", "relaxed-utility-cargo-pants", "Durable cotton-twill cargos with six pockets and adjustable ankle toggles.", [
        ("CRG-OLV-32", 249900, 15, {"color": "Olive", "size": "32"}, "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600"),
        ("CRG-BLK-34", 249900, 12, {"color": "Black", "size": "34"}, "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600"),
    ]),
    ("Apparel", "Minimalist Bomber Jacket", "minimalist-bomber-jacket", "Water-resistant matte shell bomber with quilted lining for crisp evenings.", [
        ("BMB-BLK-M", 399900, 10, {"color": "Black", "size": "M"}, "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600"),
        ("BMB-BLK-L", 399900, 8, {"color": "Black", "size": "L"}, "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600"),
    ]),
    ("Apparel", "Linen Camp-Collar Shirt", "linen-camp-collar-shirt", "Breathable 100% European linen shirt tailored for warm weather.", [
        ("LIN-WHT-M", 189900, 20, {"color": "Off-White", "size": "M"}, "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600"),
    ]),

    # Footwear
    ("Footwear", "Mono Low-Top Leather Sneakers", "mono-low-top-sneakers", "Full-grain leather upper with cushioned EVA midsole for all-day comfort.", [
        ("SNK-WHT-9", 449900, 14, {"color": "White", "size": "UK 9"}, "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600"),
        ("SNK-WHT-10", 449900, 10, {"color": "White", "size": "UK 10"}, "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600"),
    ]),
    ("Footwear", "Trail Runner Mesh Shoes", "trail-runner-mesh-shoes", "Breathable knit upper paired with a high-traction rubber outsole.", [
        ("TRL-GRY-9", 379900, 16, {"color": "Slate Grey", "size": "UK 9"}, "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"),
    ]),
    ("Footwear", "Suede Chelsea Boots", "suede-chelsea-boots", "Classic slip-on silhouette crafted from water-repellent sand suede.", [
        ("BTS-SND-9", 529900, 9, {"color": "Sand", "size": "UK 9"}, "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=600"),
    ]),

    # Accessories
    ("Accessories", "Matte Black Polarized Sunglasses", "matte-black-polarized-sunglasses", "UV400 polarized lenses in a lightweight acetate frame.", [
        ("SUN-BLK-OS", 149900, 30, {"color": "Matte Black", "size": "One Size"}, "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600"),
    ]),
    ("Accessories", "Everyday Weatherproof Backpack", "everyday-weatherproof-backpack", "20L commuter backpack with padded 16-inch laptop sleeve and hidden passport pocket.", [
        ("BAG-BLK-20L", 329900, 18, {"color": "Black", "size": "20L"}, "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600"),
    ]),
    ("Accessories", "Minimalist Chrono Watch", "minimalist-chrono-watch", "Sapphire crystal glass with Japanese quartz movement and Italian leather strap.", [
        ("WTC-SLV-40", 599900, 11, {"color": "Silver / Black", "size": "40mm"}, "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"),
    ]),
    ("Accessories", "Canvas Baseball Cap", "canvas-baseball-cap", "Six-panel washed cotton canvas cap with antique brass buckle.", [
        ("CAP-NVY-OS", 79900, 35, {"color": "Navy", "size": "Adjustable"}, "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600"),
    ]),

    # Electronics
    ("Electronics", "Wireless ANC Over-Ear Headphones", "wireless-anc-headphones", "40-hour battery life, active noise cancellation, and USB-C fast charging.", [
        ("HDP-BLK-01", 699900, 12, {"color": "Matte Black", "size": "Standard"}, "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600"),
    ]),
    ("Electronics", "75% Mechanical Keyboard", "75-mechanical-keyboard", "Hot-swappable tactile switches, aluminum frame, and wireless Bluetooth 5.1.", [
        ("KBD-GRY-75", 549900, 14, {"color": "Space Grey", "size": "75%"}, "https://images.unsplash.com/photo-1595225476474-87563907a212?w=600"),
    ]),
    ("Electronics", "Magnetic Wireless Power Bank", "magnetic-wireless-power-bank", "10,000mAh slim MagSafe-compatible battery pack with 20W PD output.", [
        ("PWR-WHT-10K", 219900, 22, {"color": "Frost White", "size": "10000mAh"}, "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600"),
    ]),

    # Home & Desk
    ("Home & Desk", "Insulated Matte Coffee Tumbler", "insulated-matte-coffee-tumbler", "Double-wall stainless steel keeps drinks hot for 6 hours or iced for 12.", [
        ("TMB-BLK-350", 99900, 40, {"color": "Matte Black", "size": "350ml"}, "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600"),
    ]),
    ("Home & Desk", "Wool Felt Desk Mat", "wool-felt-desk-mat", "Merino wool blend desk pad that keeps your keyboard and mouse organized.", [
        ("MAT-GRY-L", 159900, 20, {"color": "Heather Grey", "size": "90x40cm"}, "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600"),
    ]),
]


async def seed():
    async with AsyncSessionLocal() as db:
        added = 0
        for cat_name, name, slug, desc, variants in CATALOG:
            # Skip if product already exists
            exists = (await db.execute(select(Product).where(Product.slug == slug))).scalar_one_or_none()
            if exists:
                continue

            cat_slug = cat_name.lower().replace(" & ", "-").replace(" ", "-")
            category = (await db.execute(select(Category).where(Category.slug == cat_slug))).scalar_one_or_none()
            if not category:
                category = Category(name=cat_name, slug=cat_slug)
                db.add(category)
                await db.flush()

            product = Product(
                category_id=category.id,
                name=name,
                slug=slug,
                description=desc,
                variants=[
                    ProductVariant(
                        sku=sku,
                        price_minor=price,
                        stock_qty=qty,
                        attributes=attrs,
                        image_url=img,
                    )
                    for sku, price, qty, attrs, img in variants
                ],
            )
            db.add(product)
            added += 1

        await db.commit()
        print(f"Done! Added {added} new products.")


if __name__ == "__main__":
    asyncio.run(seed())