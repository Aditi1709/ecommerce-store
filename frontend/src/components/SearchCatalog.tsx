"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Product, formatPrice } from "@/lib/api";
import { getAestheticImage } from "@/lib/productImage";
import { useCart } from "@/context/CartContext";
import {
  POPULAR_SEARCHES,
  TRENDING_SEARCHES,
  getTypoSuggestion,
  searchProducts,
} from "@/lib/searchUtils";

type SortOption =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "popularity"
  | "rating"
  | "discount";

interface EnrichedProduct {
  product: Product;
  categoryName: string;
  priceInr: number;
  inStock: boolean;
  brand: string;
  material: string;
  productType: string;
  colors: string[];
  sizes: string[];
  rating: number;
  discountPct: number;
  popularity: number;
  createdIndex: number;
}

const BRANDS = ["Northline", "Kinetic", "Mono Studio", "Veloura", "Craftlab"];

function hashIndex(str: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) % 100000;
  }
  return Math.abs(h) % mod;
}

function inferMaterial(p: Product): string {
  const catName = p.category?.name || "";
  const text = `${p.name} ${p.description || ""} ${catName}`.toLowerCase();
  if (text.includes("linen")) return "Linen";
  if (text.includes("leather")) return "Leather";
  if (text.includes("suede")) return "Suede";
  if (text.includes("wool") || text.includes("felt")) return "Wool";
  if (text.includes("cotton") || text.includes("hoodie") || text.includes("tee") || text.includes("cargo"))
    return "Cotton";
  if (text.includes("canvas")) return "Canvas";
  if (text.includes("steel") || text.includes("aluminum")) return "Metal";
  if (catName.toLowerCase() === "electronics") return "Aluminum / Polymer";
  return "Synthetic Blend";
}

function inferType(p: Product): string {
  const name = p.name.toLowerCase();
  if (name.includes("top") || name.includes("blouse") || name.includes("shirt") || name.includes("corset") || name.includes("camisole") || name.includes("bodysuit") || name.includes("kaftan"))
    return "Tops & Blouses";
  if (name.includes("jean") || name.includes("palazzo") || name.includes("pant") || name.includes("culotte") || name.includes("short"))
    return "Jeans & Trousers";
  if (name.includes("skirt") || name.includes("skort"))
    return "Skirts & Skorts";
  if (name.includes("dress") || name.includes("jumpsuit") || name.includes("romper") || name.includes("dungaree"))
    return "Dresses & Jumpsuits";
  if (name.includes("saree") || name.includes("anarkali") || name.includes("lehenga") || name.includes("sharara") || name.includes("kurti") || name.includes("ethnic"))
    return "Indian & Ethnic Wear";
  if (name.includes("trench") || name.includes("cardigan") || name.includes("blazer") || name.includes("jacket") || name.includes("turtleneck"))
    return "Coats, Blazers & Knits";
  if (name.includes("sports") || name.includes("yoga") || name.includes("swimsuit") || name.includes("tracksuit"))
    return "Activewear & Swimwear";
  if (name.includes("pajama") || name.includes("bralette") || name.includes("kimono") || name.includes("loungewear"))
    return "Innerwear & Sleepwear";
  return "Women's Essentials";
}

function getAttr(attrs: Record<string, string> | undefined, key: string): string | undefined {
  if (!attrs) return undefined;
  const foundKey = Object.keys(attrs).find((k) => k.toLowerCase() === key.toLowerCase());
  return foundKey ? attrs[foundKey]?.trim() : undefined;
}

export default function SearchCatalog({
  allProducts,
  initialQuery,
  initialCategory,
}: {
  allProducts: Product[];
  initialQuery: string;
  initialCategory: string;
}) {
  // Extract unique categories from catalog
  const allCategories = useMemo(
    () => Array.from(new Set(allProducts.map((p) => p.category?.name || "General"))),
    [allProducts]
  );

  // Resolve initialCategory case-insensitively against real category names
  const resolveCategory = (cat: string) => {
    if (!cat) return [];
    const match = allCategories.find((c) => c.toLowerCase() === cat.trim().toLowerCase());
    return [match || cat.trim()];
  };

  const [prevNavKey, setPrevNavKey] = useState(`${initialQuery}::${initialCategory}`);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() =>
    resolveCategory(initialCategory)
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState<number>(0);
  const [minDiscount, setMinDiscount] = useState<number>(0);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyPopular, setOnlyPopular] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Sync category filter whenever the URL query/category changes
  const navKey = `${initialQuery}::${initialCategory}`;
  if (navKey !== prevNavKey) {
    setPrevNavKey(navKey);
    setSelectedCategories(resolveCategory(initialCategory));
  }

  // Enrich products with deterministic metadata so all filters work reliably
  const enriched = useMemo<EnrichedProduct[]>(() => {
    const base = initialQuery ? searchProducts(allProducts, initialQuery) : allProducts;
    return base.map((product, idx) => {
      const variants = product.variants || [];
      const firstVariant = variants[0];
      const priceInr = firstVariant ? Math.round(firstVariant.price_minor / 100) : 0;
      const inStock = variants.some((v) => v.stock_qty > 0);
      const colors = Array.from(
        new Set(
          variants
            .map((v) => getAttr(v.attributes, "color"))
            .filter((c): c is string => Boolean(c))
        )
      );
      const sizes = Array.from(
        new Set(
          variants
            .map((v) => getAttr(v.attributes, "size"))
            .filter((s): s is string => Boolean(s))
        )
      );

      const brand = BRANDS[hashIndex(product.slug, BRANDS.length)];
      const rating = Number((3.6 + hashIndex(product.id, 15) / 10).toFixed(1));
      const discountPct = [0, 10, 15, 20, 25, 30, 40][hashIndex(product.name, 7)];
      const popularity = 50 + hashIndex(product.slug + product.name, 450);

      return {
        product,
        categoryName: product.category?.name || "General",
        priceInr,
        inStock,
        brand,
        material: inferMaterial(product),
        productType: inferType(product),
        colors,
        sizes,
        rating: Math.min(rating, 5.0),
        discountPct,
        popularity,
        createdIndex: idx,
      };
    });
  }, [allProducts, initialQuery]);

  const allColors = useMemo(
    () => Array.from(new Set(enriched.flatMap((e) => e.colors))),
    [enriched]
  );
  const allSizes = useMemo(
    () => Array.from(new Set(enriched.flatMap((e) => e.sizes))),
    [enriched]
  );
  const allMaterials = useMemo(
    () => Array.from(new Set(enriched.map((e) => e.material))),
    [enriched]
  );
  const allTypes = useMemo(
    () => Array.from(new Set(enriched.map((e) => e.productType))),
    [enriched]
  );

  const toggleItem = (list: string[], value: string, setter: (next: string[]) => void) => {
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  };

  // Apply all filters simultaneously + sorting
  const filtered = useMemo(() => {
    const parsedMin = minPrice.trim() !== "" ? Number(minPrice) : 0;
    const parsedMax = maxPrice.trim() !== "" ? Number(maxPrice) : Infinity;
    const minP = Number.isFinite(parsedMin) ? parsedMin : 0;
    const maxP = Number.isFinite(parsedMax) ? parsedMax : Infinity;

    const selectedCatsLower = selectedCategories.map((c) => c.toLowerCase());
    const selectedColorsLower = selectedColors.map((c) => c.toLowerCase());
    const selectedSizesLower = selectedSizes.map((s) => s.toLowerCase());

    const list = enriched.filter((item) => {
      if (selectedCatsLower.length && !selectedCatsLower.includes(item.categoryName.toLowerCase()))
        return false;
      if (selectedBrands.length && !selectedBrands.includes(item.brand)) return false;
      if (
        selectedColorsLower.length &&
        !item.colors.some((c) => selectedColorsLower.includes(c.toLowerCase()))
      )
        return false;
      if (
        selectedSizesLower.length &&
        !item.sizes.some((s) => selectedSizesLower.includes(s.toLowerCase()))
      )
        return false;
      if (selectedMaterials.length && !selectedMaterials.includes(item.material)) return false;
      if (selectedTypes.length && !selectedTypes.includes(item.productType)) return false;
      if (item.priceInr < minP || item.priceInr > maxP) return false;
      if (minRating > 0 && item.rating < minRating) return false;
      if (minDiscount > 0 && item.discountPct < minDiscount) return false;
      if (onlyInStock && !item.inStock) return false;
      if (onlyPopular && item.popularity < 250) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === "price_asc") return a.priceInr - b.priceInr;
      if (sortBy === "price_desc") return b.priceInr - a.priceInr;
      if (sortBy === "popularity") return b.popularity - a.popularity;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "discount") return b.discountPct - a.discountPct;
      return a.createdIndex - b.createdIndex;
    });
  }, [
    enriched,
    selectedCategories,
    selectedBrands,
    selectedColors,
    selectedSizes,
    selectedMaterials,
    selectedTypes,
    minPrice,
    maxPrice,
    minRating,
    minDiscount,
    onlyInStock,
    onlyPopular,
    sortBy,
  ]);

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedMaterials([]);
    setSelectedTypes([]);
    setMinPrice("");
    setMaxPrice("");
    setMinRating(0);
    setMinDiscount(0);
    setOnlyInStock(false);
    setOnlyPopular(false);
  };

  // Build active filter chips
  const activeChips: { label: string; onRemove: () => void }[] = [
    ...selectedCategories.map((c) => ({
      label: `Category: ${c}`,
      onRemove: () => setSelectedCategories((prev) => prev.filter((x) => x !== c)),
    })),
    ...selectedBrands.map((b) => ({
      label: `Brand: ${b}`,
      onRemove: () => setSelectedBrands((prev) => prev.filter((x) => x !== b)),
    })),
    ...selectedColors.map((c) => ({
      label: `Color: ${c}`,
      onRemove: () => setSelectedColors((prev) => prev.filter((x) => x !== c)),
    })),
    ...selectedSizes.map((s) => ({
      label: `Size: ${s}`,
      onRemove: () => setSelectedSizes((prev) => prev.filter((x) => x !== s)),
    })),
    ...selectedMaterials.map((m) => ({
      label: `Material: ${m}`,
      onRemove: () => setSelectedMaterials((prev) => prev.filter((x) => x !== m)),
    })),
    ...selectedTypes.map((t) => ({
      label: `Type: ${t}`,
      onRemove: () => setSelectedTypes((prev) => prev.filter((x) => x !== t)),
    })),
    ...(minPrice || maxPrice
      ? [
          {
            label: `Price: ₹${minPrice || "0"} – ₹${maxPrice || "∞"}`,
            onRemove: () => {
              setMinPrice("");
              setMaxPrice("");
            },
          },
        ]
      : []),
    ...(minRating > 0
      ? [{ label: `Rating: ${minRating}★ & up`, onRemove: () => setMinRating(0) }]
      : []),
    ...(minDiscount > 0
      ? [{ label: `Discount: ${minDiscount}%+`, onRemove: () => setMinDiscount(0) }]
      : []),
    ...(onlyInStock ? [{ label: "In Stock Only", onRemove: () => setOnlyInStock(false) }] : []),
    ...(onlyPopular ? [{ label: "Popular Only", onRemove: () => setOnlyPopular(false) }] : []),
  ];

  const typoSuggestion =
    filtered.length === 0 && initialQuery ? getTypoSuggestion(initialQuery, allProducts) : null;

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs text-gray-500 flex items-center gap-2">
        <Link href="/" className="hover:underline">Home</Link>
        <span>/</span>
        <span>Shop</span>
        {initialCategory && (
          <>
            <span>/</span>
            <span className="text-black font-medium">{initialCategory}</span>
          </>
        )}
        {initialQuery && (
          <>
            <span>/</span>
            <span className="text-black font-medium">&ldquo;{initialQuery}&rdquo;</span>
          </>
        )}
      </nav>

      {/* Header + Matching Count + Sort Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">
            {initialQuery
              ? `Search results for "${initialQuery}"`
              : initialCategory || "All Products"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Showing <span className="font-semibold text-black">{filtered.length}</span> matching product(s)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="border rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="popularity">Popularity</option>
            <option value="rating">Customer Ratings</option>
            <option value="discount">Highest Discount</option>
          </select>
        </div>
      </div>

      {/* Selected Filters Bar */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeChips.map((chip) => (
            <button
              type="button"
              key={chip.label}
              onClick={chip.onRemove}
              className="text-xs px-3 py-1.5 rounded-full bg-black text-white flex items-center gap-1.5 hover:bg-gray-800"
            >
              <span>{chip.label}</span>
              <span>×</span>
            </button>
          ))}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs px-3 py-1.5 rounded-full border border-red-300 text-red-600 hover:bg-red-50 font-medium"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Typo Correction Banner */}
      {typoSuggestion && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm">
          Did you mean{" "}
          <Link
            href={`/search?q=${encodeURIComponent(typoSuggestion)}`}
            className="font-bold text-blue-700 underline"
          >
            {typoSuggestion}
          </Link>
          ?
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filter Sidebar */}
        <aside className="lg:col-span-1 space-y-6 border rounded-2xl p-5 h-fit bg-white text-sm">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-bold text-base">Filters</h2>
            {activeChips.length > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs text-red-600 hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <p className="font-semibold text-xs uppercase text-gray-500">Price (₹)</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full border rounded-lg px-2.5 py-1.5 text-xs"
              />
              <span>–</span>
              <input
                type="number"
                min="0"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full border rounded-lg px-2.5 py-1.5 text-xs"
              />
            </div>
          </div>

          {/* Availability & Popularity */}
          <div className="space-y-2">
            <p className="font-semibold text-xs uppercase text-gray-500">Quick Filters</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
              />
              <span>In Stock Only</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyPopular}
                onChange={(e) => setOnlyPopular(e.target.checked)}
              />
              <span>Customer Favorites (Popular)</span>
            </label>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <p className="font-semibold text-xs uppercase text-gray-500">Category</p>
            {allCategories.map((cat) => (
              <label key={cat} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat)}
                  onChange={() => toggleItem(selectedCategories, cat, setSelectedCategories)}
                />
                <span>{cat}</span>
              </label>
            ))}
          </div>

          {/* Brand */}
          <div className="space-y-1.5">
            <p className="font-semibold text-xs uppercase text-gray-500">Brand</p>
            {BRANDS.map((brand) => (
              <label key={brand} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => toggleItem(selectedBrands, brand, setSelectedBrands)}
                />
                <span>{brand}</span>
              </label>
            ))}
          </div>

          {/* Product Type */}
          <div className="space-y-1.5">
            <p className="font-semibold text-xs uppercase text-gray-500">Product Type</p>
            {allTypes.map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type)}
                  onChange={() => toggleItem(selectedTypes, type, setSelectedTypes)}
                />
                <span>{type}</span>
              </label>
            ))}
          </div>

          {/* Color */}
          {allColors.length > 0 && (
            <div className="space-y-2">
              <p className="font-semibold text-xs uppercase text-gray-500">Color</p>
              <div className="flex flex-wrap gap-1.5">
                {allColors.map((color) => (
                  <button
                    type="button"
                    key={color}
                    onClick={() => toggleItem(selectedColors, color, setSelectedColors)}
                    className={`text-xs px-2.5 py-1 rounded-full border ${
                      selectedColors.includes(color)
                        ? "bg-black text-white border-black"
                        : "hover:border-black"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size */}
          {allSizes.length > 0 && (
            <div className="space-y-2">
              <p className="font-semibold text-xs uppercase text-gray-500">Size</p>
              <div className="flex flex-wrap gap-1.5">
                {allSizes.map((size) => (
                  <button
                    type="button"
                    key={size}
                    onClick={() => toggleItem(selectedSizes, size, setSelectedSizes)}
                    className={`text-xs px-2.5 py-1 rounded border ${
                      selectedSizes.includes(size)
                        ? "bg-black text-white border-black"
                        : "hover:border-black"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Material */}
          <div className="space-y-1.5">
            <p className="font-semibold text-xs uppercase text-gray-500">Material</p>
            {allMaterials.map((mat) => (
              <label key={mat} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedMaterials.includes(mat)}
                  onChange={() => toggleItem(selectedMaterials, mat, setSelectedMaterials)}
                />
                <span>{mat}</span>
              </label>
            ))}
          </div>

          {/* Rating */}
          <div className="space-y-1.5">
            <p className="font-semibold text-xs uppercase text-gray-500">Customer Rating</p>
            {[4.5, 4.0, 3.5].map((r) => (
              <label key={r} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={minRating === r}
                  onChange={() => setMinRating(minRating === r ? 0 : r)}
                />
                <span>{r}★ & above</span>
              </label>
            ))}
          </div>

          {/* Discount */}
          <div className="space-y-1.5">
            <p className="font-semibold text-xs uppercase text-gray-500">Discount</p>
            {[10, 20, 30].map((d) => (
              <label key={d} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={minDiscount === d}
                  onChange={() => setMinDiscount(minDiscount === d ? 0 : d)}
                />
                <span>{d}% off or more</span>
              </label>
            ))}
          </div>
        </aside>

        {/* Product Grid */}
        <section className="lg:col-span-3">
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {filtered.map((item, idx) => {
                const p = item.product;
                const firstVariant = p.variants?.[0];
                const imgSrc = getAestheticImage(p, firstVariant?.image_url);
                const tints = ["bg-[#FAD5DC]", "bg-[#CFE2F7]", "bg-[#F6D7DF]", "bg-[#EFE7DD]"];
                const tint = tints[idx % tints.length];
                return (
                  <Link
                    key={p.id}
                    href={`/products/${p.slug}`}
                    className="group bg-[#FFFDFB] border border-[#EFE0DD] rounded-2xl p-3 shadow-[0_6px_20px_rgba(140,45,55,0.05)] hover:shadow-[0_12px_28px_rgba(200,30,30,0.12)] transition flex flex-col"
                  >
                    <div className={`relative aspect-square rounded-xl ${tint} overflow-hidden`}>
                      <img
                        src={imgSrc}
                        alt={p.name}
                        onError={(e) => {
                          const el = e.currentTarget;
                          const fb = getAestheticImage(p, null);
                          if (el.src !== fb) el.src = fb;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      {item.discountPct > 0 && (
                        <span className="absolute top-2.5 left-2.5 bg-[#C81E1E] text-white text-[10px] px-2.5 py-0.5 rounded-full font-semibold">
                          {item.discountPct}% OFF
                        </span>
                      )}
                      {!item.inStock && (
                        <span className="absolute top-2.5 right-2.5 bg-[#231819]/80 text-white text-[10px] px-2.5 py-0.5 rounded-full">
                          Sold Out
                        </span>
                      )}
                    </div>
                    <div className="pt-3 px-1 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <p className="text-[10px] text-[#9B7E80] uppercase font-semibold tracking-wider">
                          {item.brand} • {item.categoryName}
                        </p>
                        <h3 className="font-semibold text-sm text-[#231819] group-hover:text-[#C81E1E] transition mt-0.5 line-clamp-1">
                          {p.name}
                        </h3>
                        <p className="text-[11px] text-[#7D6668] mt-0.5">
                          ✦ {item.rating.toFixed(1)} • {item.material}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <p className="font-bold text-sm text-[#C81E1E]">
                          {firstVariant ? formatPrice(firstVariant.price_minor) : "Unavailable"}
                        </p>
                        <span className="w-7 h-7 rounded-full bg-[#C81E1E] text-white text-sm font-bold flex items-center justify-center group-hover:bg-[#A81818] transition">
                          +
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="border border-[#EAD9D6] rounded-2xl p-10 text-center space-y-4 bg-[#FAD2D8]/30">
              <h2 className="font-editorial text-2xl font-bold text-[#C81E1E]">
                No products match your filters
              </h2>
              <p className="text-sm text-[#5C494B]">
                Try clearing some filters or exploring popular searches below.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-5 py-2.5 bg-[#C81E1E] text-white rounded-full text-xs font-semibold hover:bg-[#A81818]"
              >
                Clear All Filters
              </button>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {[...TRENDING_SEARCHES, ...POPULAR_SEARCHES].map((term) => (
                  <Link
                    key={term}
                    href={`/search?q=${encodeURIComponent(term)}`}
                    className="px-3.5 py-1.5 rounded-full bg-[#FFFDFB] border border-[#E4CFC9] text-xs hover:border-[#C81E1E] hover:text-[#C81E1E]"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
