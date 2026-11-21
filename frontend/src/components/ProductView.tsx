"use client";

import { useEffect, useState } from "react";
import { Product, formatPrice } from "@/lib/api";
import { getAestheticImage } from "@/lib/productImage";
import { useCart } from "@/context/CartContext";

export default function ProductView({ product }: { product: Product }) {
  const [selected, setSelected] = useState(product.variants[0]);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  // Save to Recently Viewed in localStorage
  useEffect(() => {
    try {
      const existing: Product[] = JSON.parse(localStorage.getItem("recently_viewed") || "[]");
      const updated = [product, ...existing.filter((p) => p.id !== product.id)].slice(0, 6);
      localStorage.setItem("recently_viewed", JSON.stringify(updated));
    } catch {
      // ignore storage errors
    }
  }, [product]);

  const handleAdd = () => {
    if (!selected) return;
    addItem({
      variantId: selected.id,
      productName: product.name,
      slug: product.slug,
      sku: selected.sku,
      label: Object.values(selected.attributes).join(" / ") || selected.sku,
      priceMinor: selected.price_minor,
      imageUrl: selected.image_url,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
      <img
        src={selected?.image_url || "https://placehold.co/600x600"}
        alt={product.name}
        className="w-full aspect-square object-cover rounded-xl border"
      />

      <div>
        <p className="text-sm text-gray-500 uppercase">{product.category.name}</p>
        <h1 className="text-3xl font-bold mt-1">{product.name}</h1>
        <p className="text-2xl font-semibold mt-4">
          {selected ? formatPrice(selected.price_minor) : "Unavailable"}
        </p>
        <p className="text-gray-600 mt-4">{product.description}</p>

        <div className="mt-6">
          <p className="text-sm font-medium mb-2">Select Variant</p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => {
              const label = Object.values(v.attributes).join(" / ") || v.sku;
              const isSelected = selected?.id === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelected(v)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                    isSelected
                      ? "bg-[#C81E1E] text-white border-[#C81E1E]"
                      : "bg-white text-black hover:border-[#C81E1E]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-sm mt-4 text-gray-600">
          {selected && selected.stock_qty > 0
            ? `In stock (${selected.stock_qty} available) • SKU: ${selected.sku}`
            : "Out of stock"}
        </p>

        <button
          onClick={handleAdd}
          disabled={!selected || selected.stock_qty === 0}
          className="mt-6 w-full bg-[#C81E1E] text-white py-3 rounded-lg font-medium hover:bg-[#A81818] disabled:bg-gray-300 transition"
        >
          {added ? "Added to Cart ✓" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}