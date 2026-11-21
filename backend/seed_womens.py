import asyncio
from sqlalchemy import select, text
from app.core.database import AsyncSessionLocal
from app.models.product import Category, Product, ProductVariant
import app.models.user  # noqa: F401

IMG_TOPS = [
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1551163943-3f6a855d1153?auto=format&fit=crop&w=800&q=80",
]
IMG_BOTTOMS = [
    "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?auto=format&fit=crop&w=800&q=80",
]
IMG_SKIRTS = [
    "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1577900232427-18219b9166a0?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1592301933927-35b597393c0a?auto=format&fit=crop&w=800&q=80",
]
IMG_DRESSES = [
    "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80",
]
IMG_ETHNIC = [
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
]
IMG_OUTERWEAR = [
    "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=800&q=80",
]
IMG_ACTIVE = [
    "https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80",
]
IMG_SLEEP = [
    "https://images.unsplash.com/photo-1616530940355-351fabd9524b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?auto=format&fit=crop&w=800&q=80",
]

WOMENS_CATALOG = [
    # 1. Tops
    ("Tops", "Blush Ribbed Crop Top", "blush-ribbed-crop-top", "Soft stretch-cotton ribbed crop top with a flattering scoop neckline.", [
        ("TOP-CRP-XS", 79900, 24, {"color": "Blush Pink", "size": "XS"}, IMG_TOPS[0]),
        ("TOP-CRP-S", 79900, 30, {"color": "Blush Pink", "size": "S"}, IMG_TOPS[0]),
        ("TOP-CRP-M", 79900, 22, {"color": "Ivory", "size": "M"}, IMG_TOPS[0]),
    ]),
    ("Tops", "Satin Wrap Blouse", "satin-wrap-blouse", "Fluid lustrous satin wrap blouse with tie-waist closure and balloon cuffs.", [
        ("TOP-WRP-S", 149900, 18, {"color": "Champagne", "size": "S"}, IMG_TOPS[1]),
        ("TOP-WRP-M", 149900, 16, {"color": "Crimson", "size": "M"}, IMG_TOPS[1]),
    ]),
    ("Tops", "Boned Lace Corset Top", "boned-lace-corset-top", "Structured sweetheart corset top with delicate floral lace paneling.", [
        ("TOP-CRS-XS", 169900, 14, {"color": "Rose", "size": "XS"}, IMG_TOPS[2]),
        ("TOP-CRS-S", 169900, 18, {"color": "Black", "size": "S"}, IMG_TOPS[2]),
    ]),
    ("Tops", "Halterneck Silk Camisole", "halterneck-silk-camisole", "Draped halterneck camisole top crafted for effortless day-to-night styling.", [
        ("TOP-HLT-S", 119900, 20, {"color": "Pearl White", "size": "S"}, IMG_TOPS[3]),
        ("TOP-HLT-M", 119900, 15, {"color": "Sage", "size": "M"}, IMG_TOPS[3]),
    ]),
    ("Tops", "Off-Shoulder Peplum Top", "off-shoulder-peplum-top", "Romantic off-shoulder puff-sleeve peplum top in breathable poplin.", [
        ("TOP-PEP-S", 129900, 19, {"color": "Soft Pink", "size": "S"}, IMG_TOPS[0]),
        ("TOP-PEP-M", 129900, 14, {"color": "White", "size": "M"}, IMG_TOPS[0]),
    ]),
    ("Tops", "Crisp Poplin Button-Down Shirt", "crisp-poplin-button-down-shirt", "Relaxed boyfriend-fit cotton button-down shirt with mother-of-pearl buttons.", [
        ("TOP-BTN-S", 159900, 25, {"color": "Sky Blue", "size": "S"}, IMG_TOPS[1]),
        ("TOP-BTN-M", 159900, 20, {"color": "Crisp White", "size": "M"}, IMG_TOPS[1]),
    ]),
    ("Tops", "Seamless Sculpt Bodysuit", "seamless-sculpt-bodysuit", "Second-skin square-neck bodysuit with snap closure for clean tucking.", [
        ("TOP-BDY-S", 109900, 28, {"color": "Mocha", "size": "S"}, IMG_TOPS[2]),
        ("TOP-BDY-M", 109900, 24, {"color": "Black", "size": "M"}, IMG_TOPS[2]),
    ]),
    ("Tops", "Boho Embroidered Kaftan Top", "boho-embroidered-kaftan-top", "Breezy tassel-tie kaftan tunic with tonal threadwork.", [
        ("TOP-KFT-FS", 139900, 17, {"color": "Terracotta", "size": "Free Size"}, IMG_TOPS[3]),
    ]),

    # 2. Bottoms
    ("Bottoms", "High-Waist Wide-Leg Jeans", "high-waist-wide-leg-jeans", "Vintage-wash rigid cotton denim with a elongating full-length wide leg.", [
        ("BTM-WDG-26", 229900, 20, {"color": "Light Indigo", "size": "26"}, IMG_BOTTOMS[0]),
        ("BTM-WDG-28", 229900, 24, {"color": "Light Indigo", "size": "28"}, IMG_BOTTOMS[0]),
        ("BTM-WDG-30", 229900, 18, {"color": "Vintage Blue", "size": "30"}, IMG_BOTTOMS[0]),
    ]),
    ("Bottoms", "Flowy Pleated Palazzo Pants", "flowy-pleated-palazzo-pants", "High-rise wide palazzo trousers in airy crepe with side pockets.", [
        ("BTM-PLZ-S", 169900, 22, {"color": "Cream", "size": "S"}, IMG_BOTTOMS[1]),
        ("BTM-PLZ-M", 169900, 19, {"color": "Dusty Rose", "size": "M"}, IMG_BOTTOMS[1]),
    ]),
    ("Bottoms", "70s Flare Bootcut Jeans", "70s-flare-bootcut-jeans", "Contouring stretch-denim bootcut jeans with retro flared hem.", [
        ("BTM-FLR-28", 219900, 16, {"color": "Mid Blue", "size": "28"}, IMG_BOTTOMS[2]),
        ("BTM-FLR-30", 219900, 14, {"color": "Mid Blue", "size": "30"}, IMG_BOTTOMS[2]),
    ]),
    ("Bottoms", "Tailored Cigarette Dress Pants", "tailored-cigarette-dress-pants", "Ankle-grazing tapered trousers ideal for office and smart-casual looks.", [
        ("BTM-CIG-S", 189900, 18, {"color": "Beige", "size": "S"}, IMG_BOTTOMS[1]),
        ("BTM-CIG-M", 189900, 15, {"color": "Black", "size": "M"}, IMG_BOTTOMS[1]),
    ]),
    ("Bottoms", "Relaxed Mom Jeans & Denim Shorts Set", "vintage-mom-jeans", "Tapered high-rise mom jeans crafted from 100% organic cotton.", [
        ("BTM-MOM-28", 199900, 21, {"color": "Ice Blue", "size": "28"}, IMG_BOTTOMS[0]),
    ]),
    ("Bottoms", "Linen Culottes & Jogger Trousers", "linen-wide-culottes", "Cropped wide-leg linen culottes with elasticated back waistband.", [
        ("BTM-CLT-M", 159900, 20, {"color": "Oatmeal", "size": "M"}, IMG_BOTTOMS[2]),
    ]),

    # 3. Skirts
    ("Skirts", "Bias-Cut Satin Midi Skirt", "bias-cut-satin-midi-skirt", "Fluid midi skirt that drapes effortlessly with an invisible side zip.", [
        ("SKT-MID-S", 169900, 22, {"color": "Rose Gold", "size": "S"}, IMG_SKIRTS[0]),
        ("SKT-MID-M", 169900, 18, {"color": "Champagne", "size": "M"}, IMG_SKIRTS[0]),
    ]),
    ("Skirts", "Knife-Pleated Mini Skort", "knife-pleated-mini-skort", "Preppy pleated mini skirt with built-in comfort shorts underneath.", [
        ("SKT-MIN-XS", 129900, 25, {"color": "Blush Pink", "size": "XS"}, IMG_SKIRTS[1]),
        ("SKT-MIN-S", 129900, 28, {"color": "White", "size": "S"}, IMG_SKIRTS[1]),
    ]),
    ("Skirts", "Tiered Ruffle Maxi Skirt", "tiered-ruffle-maxi-skirt", "Romantic three-tier cotton maxi skirt with delicate lace trim.", [
        ("SKT-MAX-S", 189900, 16, {"color": "Ivory", "size": "S"}, IMG_SKIRTS[2]),
        ("SKT-MAX-M", 189900, 15, {"color": "Lilac", "size": "M"}, IMG_SKIRTS[2]),
    ]),
    ("Skirts", "High-Slit Denim Midi Skirt", "high-slit-denim-midi-skirt", "Structured A-line denim skirt with front walking slit and raw hem.", [
        ("SKT-DNM-28", 179900, 19, {"color": "Vintage Wash", "size": "28"}, IMG_SKIRTS[0]),
    ]),
    ("Skirts", "Tailored Wrap Pencil Skirt", "tailored-wrap-pencil-skirt", "Sleek tulip-wrap pencil skirt for polished desk-to-dinner styling.", [
        ("SKT-PNC-S", 159900, 14, {"color": "Crimson", "size": "S"}, IMG_SKIRTS[1]),
    ]),

    # 4. Dresses & One-Pieces
    ("Dresses & One-Pieces", "Floral Smocked Sundress", "floral-smocked-sundress", "Sweetheart midi sundress with shirred bodice and flutter straps.", [
        ("DRS-SUN-S", 219900, 24, {"color": "Blush Floral", "size": "S"}, IMG_DRESSES[0]),
        ("DRS-SUN-M", 219900, 20, {"color": "Blush Floral", "size": "M"}, IMG_DRESSES[0]),
    ]),
    ("Dresses & One-Pieces", "Cowl-Neck Silk Slip Dress", "cowl-neck-silk-slip-dress", "Minimalist bias-cut slip dress with adjustable spaghetti straps.", [
        ("DRS-SLP-S", 269900, 15, {"color": "Crimson Red", "size": "S"}, IMG_DRESSES[1]),
        ("DRS-SLP-M", 269900, 14, {"color": "Champagne", "size": "M"}, IMG_DRESSES[1]),
    ]),
    ("Dresses & One-Pieces", "Ruched Mesh Bodycon Mini Dress", "ruched-mesh-bodycon-mini-dress", "Figure-skimming ruched cocktail mini dress with sheer long sleeves.", [
        ("DRS-BDC-XS", 199900, 18, {"color": "Berry", "size": "XS"}, IMG_DRESSES[2]),
        ("DRS-BDC-S", 199900, 20, {"color": "Black", "size": "S"}, IMG_DRESSES[2]),
    ]),
    ("Dresses & One-Pieces", "Linen Belted Shirt Dress", "linen-belted-shirt-dress", "Breathable A-line shirt dress with removable waist sash.", [
        ("DRS-SHT-S", 239900, 17, {"color": "Sand", "size": "S"}, IMG_DRESSES[3]),
        ("DRS-SHT-M", 239900, 16, {"color": "White", "size": "M"}, IMG_DRESSES[3]),
    ]),
    ("Dresses & One-Pieces", "Tailored Wide-Leg Jumpsuit", "tailored-wide-leg-jumpsuit", "Sleek sleeveless V-neck jumpsuit with pleated palazzo legs.", [
        ("DRS-JMP-S", 279900, 13, {"color": "Terracotta", "size": "S"}, IMG_DRESSES[0]),
        ("DRS-JMP-M", 279900, 12, {"color": "Black", "size": "M"}, IMG_DRESSES[0]),
    ]),
    ("Dresses & One-Pieces", "Denim Dungarees & Playful Romper", "denim-dungarees-romper", "Soft-washed cotton denim dungarees with adjustable brass buckles.", [
        ("DRS-DNG-S", 209900, 16, {"color": "Sky Wash", "size": "S"}, IMG_DRESSES[2]),
    ]),

    # 5. Indian & Ethnic Wear
    ("Indian & Ethnic Wear", "Chikankari Georgette Anarkali Suit", "chikankari-georgette-anarkali-suit", "Hand-embroidered Lucknowi chikankari Anarkali with churidar and scalloped dupatta.", [
        ("ETH-ANK-S", 349900, 15, {"color": "Pastel Pink", "size": "S"}, IMG_ETHNIC[0]),
        ("ETH-ANK-M", 349900, 18, {"color": "Pastel Pink", "size": "M"}, IMG_ETHNIC[0]),
        ("ETH-ANK-L", 349900, 12, {"color": "Ivory", "size": "L"}, IMG_ETHNIC[0]),
    ]),
    ("Indian & Ethnic Wear", "Banarasi Silk Saree & Choli Set", "banarasi-silk-saree-choli", "Woven zari Banarasi silk saree paired with matching unstitched blouse piece.", [
        ("ETH-SAR-FS", 499900, 12, {"color": "Crimson & Gold", "size": "Free Size"}, IMG_ETHNIC[1]),
        ("ETH-SAR-RS", 499900, 10, {"color": "Blush Rose", "size": "Free Size"}, IMG_ETHNIC[1]),
    ]),
    ("Indian & Ethnic Wear", "Mirror-Work Lehenga Choli Set", "mirror-work-lehenga-choli", "Festive flared lehenga skirt with embroidered choli and net dupatta.", [
        ("ETH-LHG-S", 549900, 9, {"color": "Rani Pink", "size": "S"}, IMG_ETHNIC[2]),
        ("ETH-LHG-M", 549900, 11, {"color": "Peach", "size": "M"}, IMG_ETHNIC[2]),
    ]),
    ("Indian & Ethnic Wear", "Embroidered Sharara & Kurti Set", "embroidered-sharara-kurti-set", "Short gota-patti kurti paired with tiered flared sharara pants and stole.", [
        ("ETH-SHR-S", 299900, 16, {"color": "Mint", "size": "S"}, IMG_ETHNIC[0]),
        ("ETH-SHR-M", 299900, 14, {"color": "Blush", "size": "M"}, IMG_ETHNIC[0]),
    ]),
    ("Indian & Ethnic Wear", "Indo-Western Draped Ethnic Gown", "indo-western-draped-ethnic-gown", "Pre-draped ruffle fusion gown with embroidered belt for effortless festive wear.", [
        ("ETH-IND-M", 389900, 11, {"color": "Wine", "size": "M"}, IMG_ETHNIC[1]),
    ]),
    ("Indian & Ethnic Wear", "Mulmul Cotton Straight Kurti & Patiala", "mulmul-cotton-kurti-patiala", "Everyday breathable printed mulmul kurti with pleated Patiala salwar.", [
        ("ETH-KRT-S", 149900, 24, {"color": "Rose Print", "size": "S"}, IMG_ETHNIC[2]),
        ("ETH-KRT-M", 149900, 22, {"color": "Rose Print", "size": "M"}, IMG_ETHNIC[2]),
    ]),

    # 6. Outerwear
    ("Outerwear", "Cropped Double-Breasted Trench Coat", "cropped-double-breasted-trench", "Lightweight water-repellent cotton-gabardine cropped trench with storm flap.", [
        ("OUT-TRN-S", 329900, 14, {"color": "Warm Sand", "size": "S"}, IMG_OUTERWEAR[0]),
        ("OUT-TRN-M", 329900, 12, {"color": "Warm Sand", "size": "M"}, IMG_OUTERWEAR[0]),
    ]),
    ("Outerwear", "Chunky Cable-Knit Cardigan", "chunky-cable-knit-cardigan", "Cozy oversized button-front cardigan in soft combed cotton-wool blend.", [
        ("OUT-CRD-S", 219900, 20, {"color": "Strawberry Cream", "size": "S"}, IMG_OUTERWEAR[1]),
        ("OUT-CRD-M", 219900, 18, {"color": "Oatmeal", "size": "M"}, IMG_OUTERWEAR[1]),
    ]),
    ("Outerwear", "Tailored Oversized Linen Blazer", "tailored-oversized-linen-blazer", "Single-breasted structured blazer with padded shoulders and satin lining.", [
        ("OUT-BLZ-S", 299900, 15, {"color": "Blush", "size": "S"}, IMG_OUTERWEAR[2]),
        ("OUT-BLZ-M", 299900, 14, {"color": "Ivory", "size": "M"}, IMG_OUTERWEAR[2]),
    ]),
    ("Outerwear", "Vintage Cropped Denim Jacket", "vintage-cropped-denim-jacket", "Boxy cropped trucker jacket with antique silver hardware.", [
        ("OUT-DNJ-S", 229900, 18, {"color": "Light Wash", "size": "S"}, IMG_OUTERWEAR[0]),
    ]),
    ("Outerwear", "Ribbed Turtleneck Pullover & Shrug", "ribbed-turtleneck-pullover", "Fine-knit slim turtleneck sweater for effortless layering.", [
        ("OUT-TRT-S", 159900, 22, {"color": "Crimson", "size": "S"}, IMG_OUTERWEAR[1]),
    ]),

    # 7. Activewear & Swimwear
    ("Activewear & Swimwear", "Sculpt Cross-Back Sports Bra", "sculpt-cross-back-sports-bra", "Medium-support buttery-soft studio sports bra with removable pads.", [
        ("ACT-BRA-S", 119900, 26, {"color": "Rosewood", "size": "S"}, IMG_ACTIVE[0]),
        ("ACT-BRA-M", 119900, 22, {"color": "Black", "size": "M"}, IMG_ACTIVE[0]),
    ]),
    ("Activewear & Swimwear", "Buttery-Soft High-Waist Yoga Leggings", "high-waist-yoga-leggings", "Squat-proof four-way stretch flare yoga pants and leggings with hidden waistband pocket.", [
        ("ACT-YGA-S", 169900, 25, {"color": "Mauve", "size": "S"}, IMG_ACTIVE[1]),
        ("ACT-YGA-M", 169900, 24, {"color": "Espresso", "size": "M"}, IMG_ACTIVE[1]),
    ]),
    ("Activewear & Swimwear", "Belted Halter One-Piece Swimsuit", "belted-halter-one-piece-swimsuit", "UPF 50+ ribbed one-piece swimsuit with tortoise-shell belt and sarong cover-up.", [
        ("ACT-SWM-S", 199900, 15, {"color": "Crimson", "size": "S"}, IMG_ACTIVE[0]),
        ("ACT-SWM-M", 199900, 14, {"color": "Blush", "size": "M"}, IMG_ACTIVE[0]),
    ]),
    ("Activewear & Swimwear", "Pastel Fleece Tracksuit Set", "pastel-fleece-tracksuit-set", "Cropped zip hoodie and high-waist joggers in brushed cotton fleece.", [
        ("ACT-TRK-S", 249900, 16, {"color": "Baby Pink", "size": "S"}, IMG_ACTIVE[1]),
    ]),

    # 8. Innerwear & Sleepwear
    ("Innerwear & Sleepwear", "Piped Satin Pajama Set", "piped-satin-pajama-set", "Silky button-down sleep shirt and drawstring trousers with contrast piping.", [
        ("SLP-PAJ-S", 179900, 24, {"color": "Blush Pink", "size": "S"}, IMG_SLEEP[0]),
        ("SLP-PAJ-M", 179900, 20, {"color": "Champagne", "size": "M"}, IMG_SLEEP[0]),
    ]),
    ("Innerwear & Sleepwear", "Floral Lace Bralette & Hipster Set", "floral-lace-bralette-set", "Wireless scalloped eyelash-lace bralette with matching breathable hipster briefs.", [
        ("SLP-BRL-S", 119900, 28, {"color": "Ruby", "size": "S"}, IMG_SLEEP[1]),
        ("SLP-BRL-M", 119900, 24, {"color": "Ivory", "size": "M"}, IMG_SLEEP[1]),
    ]),
    ("Innerwear & Sleepwear", "Modal Ribbed Loungewear & Kimono Robe", "modal-loungewear-kimono-robe", "Ultra-soft micro-modal camisole slip and draped kimono robe.", [
        ("SLP-KIM-S", 199900, 18, {"color": "Dusty Rose", "size": "S"}, IMG_SLEEP[0]),
    ]),
]


async def reseed_womens(force: bool = True):
    async with AsyncSessionLocal() as db:
        if not force:
            existing_cats = (await db.execute(select(Category.name))).scalars().all()
            if "Tops" in existing_cats and "Indian & Ethnic Wear" in existing_cats and "Apparel" not in existing_cats:
                print("Women's & Girls' Wear catalog already active.")
                return

        # Dynamically truncate product/category and dependent tables using actual metadata table names
        keep_tables = {"users", "addresses", "notifications", "support_tickets"}
        to_truncate = [
            f'"{t.name}"'
            for t in reversed(Base.metadata.sorted_tables)
            if t.name not in keep_tables
        ]
        if to_truncate:
            await db.execute(
                text(f"TRUNCATE TABLE {', '.join(to_truncate)} RESTART IDENTITY CASCADE")
            )
            await db.commit()

        cat_map = {}
        for cat_name, name, slug, desc, variants in WOMENS_CATALOG:
            if cat_name not in cat_map:
                cat_slug = cat_name.lower().replace(" & ", "-").replace(" ", "-")
                cat = Category(name=cat_name, slug=cat_slug)
                db.add(cat)
                await db.flush()
                cat_map[cat_name] = cat

            prod = Product(
                category_id=cat_map[cat_name].id,
                name=name,
                slug=slug,
                description=desc,
                variants=[
                    ProductVariant(
                        sku=sku,
                        price_minor=price,
                        stock_qty=stock,
                        attributes=attrs,
                        image_url=img,
                    )
                    for sku, price, stock, attrs, img in variants
                ],
            )
            db.add(prod)

        await db.commit()
        print(f"Seeded {len(WOMENS_CATALOG)} Women's & Girls' Wear products across {len(cat_map)} categories!")


if __name__ == "__main__":
    asyncio.run(reseed_womens(force=True))
