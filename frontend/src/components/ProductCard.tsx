"use client";

import { useState } from "react";
import Link from "next/link";
import { Product, formatPrice } from "@/lib/api";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: Product;
  tintIndex?: number;
}

const PASTEL_TINTS = [
  "bg-[#FAD5DC]",
  "bg-[#D2E4F6]",
  "bg-[#F4DDD6]",
  "bg-[#EFE8DF]",
];

export default function ProductCard({ product, tintIndex = 0 }: ProductCardProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [liked, setLiked] = useState(false);

  const primaryVariant = product.variants[0];
  const inStock = primaryVariant ? primaryVariant.stock_qty > 0 : false;
  const variantLabel = primaryVariant
    ? Object.values(primaryVariant.attributes || {}).join(" / ") || primaryVariant.sku
    : "";
  const tintClass = PASTEL_TINTS[tintIndex % PASTEL_TINTS.length];

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
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <div className="group flex flex-col bg-[#FFFDFB] rounded-2xl p-3 border border-[#EFE0DD] shadow-[0_6px_20px_rgba(140,45,55,0.05)] hover:shadow-[0_12px_28px_rgba(200,30,30,0.12)] transition-all">
      <Link
        href={`/products/${product.slug}`}
        className={`relative aspect-square w-full overflow-hidden rounded-xl ${tintClass}`}
      >
        <img
          src={primaryVariant?.image_url || "https://placehold.co/600x600/FAD5DC/C81E1E?text=Zenoo"}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Top-Right Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setLiked((v) => !v);
          }}
          aria-label="Save to wishlist"
          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center text-[#231819] hover:text-[#C81E1E] transition shadow-xs"
        >
          <svg
            className="w-4 h-4"
            fill={liked ? "#C81E1E" : "none"}
            stroke={liked ? "#C81E1E" : "currentColor"}
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 20.5s-7.5-4.7-9.3-9.1C1.3 8 3.6 4.8 7 4.8c2 0 3.7 1.1 5 2.7 1.3-1.6 3-2.7 5-2.7 3.4 0 5.7 3.2 4.3 6.6-1.8 4.4-9.3 9.1-9.3 9.1Z"
            />
          </svg>
        </button>

        {!inStock && (
          <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-[#C81E1E] text-white text-[10px] font-semibold">
            Sold Out
          </span>
        )}
      </Link>

      {/* Bottom Title, Price & Circular Crimson '+' Button */}
      <div className="pt-3 px-1 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/products/${product.slug}`}
            className="block font-semibold text-sm text-[#231819] group-hover:text-[#C81E1E] transition truncate"
          >
            {product.name}
          </Link>
          <p className="text-xs font-bold text-[#C81E1E] mt-0.5">
            {primaryVariant ? formatPrice(primaryVariant.price_minor) : "Out of stock"}
          </p>
        </div>

        {inStock && (
          <button
            type="button"
            onClick={handleQuickAdd}
            title={added ? "Added!" : "Quick Add"}
            className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 transition shadow-sm ${
              added ? "bg-emerald-600 scale-110" : "bg-[#C81E1E] hover:bg-[#A81818]"
            }`}
          >
            {added ? "✓" : "+"}
          </button>
        )}
      </div>
    </div>
  );
}
