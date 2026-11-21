"use client";

import { useState } from "react";
import Link from "next/link";
import { Product, formatPrice } from "@/lib/api";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const primaryVariant = product.variants[0];
  const inStock = primaryVariant ? primaryVariant.stock_qty > 0 : false;
  const variantLabel = primaryVariant
    ? Object.values(primaryVariant.attributes || {}).join(" / ") || primaryVariant.sku
    : "";

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!primaryVariant || !inStock) return;

    addItem({
      variantId: primaryVariant.id,
      productName: product.name,
      slug: product.slug,
      sku: primaryVariant.sku,
      label: variantLabel,
      priceMinor: primaryVariant.price_minor,
      imageUrl: primaryVariant.image_url,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="group flex flex-col">
      <Link
        href={`/products/${product.slug}`}
        className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#F2EFE9] border border-[#E7E2D8] shadow-sm group-hover:shadow-md transition-shadow"
      >
        <img
          src={primaryVariant?.image_url || "https://placehold.co/600x750/EBF3EF/0F3D2E?text=Zeno"}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
        />

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {product.category?.name && (
            <span className="px-2.5 py-1 rounded-full bg-[#EBF3EF]/95 text-[#0F3D2E] text-[11px] font-semibold">
              {product.category.name}
            </span>
          )}
          {!inStock && (
            <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[11px] font-semibold">
              Sold Out
            </span>
          )}
        </div>

        {inStock && (
          <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <button
              onClick={handleQuickAdd}
              className={`w-full py-2.5 rounded-xl text-white text-xs font-semibold tracking-wide transition shadow-lg ${
                added
                  ? "bg-emerald-600"
                  : "bg-[#D95D39] hover:bg-[#C24B29]"
              }`}
            >
              {added ? "Added to Bag ✓" : "+ Quick Add"}
            </button>
          </div>
        )}
      </Link>

      <div className="pt-3.5 px-0.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/products/${product.slug}`}
            className="block font-semibold text-[15px] text-[#18181B] group-hover:text-[#0F3D2E] transition truncate"
          >
            {product.name}
          </Link>
          {variantLabel && (
            <p className="text-xs text-zinc-500 mt-0.5 truncate">{variantLabel}</p>
          )}
        </div>

        <p className="text-[15px] font-bold text-[#0F3D2E] shrink-0">
          {primaryVariant ? formatPrice(primaryVariant.price_minor) : ""}
        </p>
      </div>
    </div>
  );
}