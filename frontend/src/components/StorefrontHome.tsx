"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Product, formatPrice } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { getAestheticImage } from "@/lib/productImage";

const EMPTY_LIST = "[]";
const subscribeStorage = (cb: () => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};
const getRecentlyViewedSnapshot = () => localStorage.getItem("recently_viewed") ?? EMPTY_LIST;
const getServerSnapshot = () => EMPTY_LIST;

const CARD_TINTS = [
  "bg-[#FAD5DC]",
  "bg-[#CFE2F7]",
  "bg-[#F6D7DF]",
  "bg-[#EFE7DD]",
];

function EditorialCard({
  product,
  index = 0,
  badge,
}: {
  product: Product;
  index?: number;
  badge?: string;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [liked, setLiked] = useState(false);

  const firstVariant = product.variants[0];
  const primarySrc = getAestheticImage(product, firstVariant?.image_url);
  const fallbackSrc = getAestheticImage(product, null);
  const [imgSrc, setImgSrc] = useState(primarySrc);

  const inStock = firstVariant ? firstVariant.stock_qty > 0 : false;
  const tint = CARD_TINTS[index % CARD_TINTS.length];

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firstVariant || !inStock) return;
    addItem({
      variantId: firstVariant.id,
      productName: product.name,
      slug: product.slug,
      sku: firstVariant.sku,
      label: Object.values(firstVariant.attributes || {}).join(" / ") || firstVariant.sku,
      priceMinor: firstVariant.price_minor,
      imageUrl: imgSrc,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <div className="group bg-[#FFFDFB] rounded-2xl p-3 border border-[#EFE0DD] shadow-[0_6px_20px_rgba(140,45,55,0.05)] hover:shadow-[0_14px_30px_rgba(200,30,30,0.12)] transition-all flex flex-col">
      <Link
        href={`/products/${product.slug}`}
        className={`relative aspect-square rounded-xl overflow-hidden ${tint}`}
      >
        <img
          src={imgSrc}
          alt={product.name}
          onError={() => {
            if (imgSrc !== fallbackSrc) setImgSrc(fallbackSrc);
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />

        {badge && (
          <span className="absolute top-2.5 left-2.5 bg-[#C81E1E] text-white text-[10px] px-2.5 py-0.5 rounded-full font-semibold tracking-wide">
            {badge}
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setLiked((v) => !v);
          }}
          aria-label="Favorite"
          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#231819] hover:text-[#C81E1E] transition"
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
      </Link>

      <div className="pt-3 px-1 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/products/${product.slug}`}
            className="block font-semibold text-sm text-[#231819] group-hover:text-[#C81E1E] transition truncate"
          >
            {product.name}
          </Link>
          <p className="text-xs font-bold text-[#C81E1E] mt-0.5">
            {firstVariant ? formatPrice(firstVariant.price_minor) : "Out of stock"}
          </p>
        </div>

        {inStock && (
          <button
            type="button"
            onClick={handleQuickAdd}
            title={added ? "Added to Bag" : "Quick Add"}
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

export default function StorefrontHome({ products }: { products: Product[] }) {
  const { items: cartItems } = useCart();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [secondsLeft, setSecondsLeft] = useState(14325);
  const resultsRef = useRef<HTMLElement | null>(null);

  const rawRecent = useSyncExternalStore(
    subscribeStorage,
    getRecentlyViewedSnapshot,
    getServerSnapshot
  );
  const recentlyViewed: Product[] = useMemo(() => JSON.parse(rawRecent), [rawRecent]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 14325));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = String(Math.floor(secondsLeft / 3600)).padStart(2, "0");
  const mins = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category.name)));
    return ["All", ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = selectedCategory === "All" || p.category.name === selectedCategory;
      const matchesSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [products, search, selectedCategory]);

  const isFiltering = search.trim().length > 0 || selectedCategory !== "All";

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const heroProduct = products[0];
  const secondaryStoryProduct = products[1] || products[0];
  const featured = products.slice(0, 4);
  const bestsellers = [...products].reverse().slice(0, 4);
  const newArrivals = products.slice(0, 4);
  const deals = products.slice(0, 4);

  return (
    <main className="max-w-6xl mx-auto px-5 sm:px-8 py-7 space-y-14">
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="relative rounded-[26px] bg-[#FAD2D8] p-8 sm:p-11 flex flex-col justify-between min-h-[340px] sm:min-h-[390px] overflow-hidden border border-[#F3BFC8]">
          <span
            aria-hidden="true"
            className="absolute top-7 right-8 text-[#C81E1E] text-3xl leading-none select-none"
          >
            ✦
          </span>

          <div className="space-y-4 max-w-sm pt-2">
            <h1 className="font-editorial text-4xl sm:text-[54px] font-bold text-[#C81E1E] leading-[1.03] tracking-tight">
              Shape
              <br />
              Your Style
            </h1>
            <p className="text-sm sm:text-[15px] text-[#3B2527] leading-relaxed">
              Curated pieces for modern everyday living, direct from independent creators.
            </p>
          </div>

          <div className="flex items-end justify-between pt-8">
            <a
              href="#new-arrivals"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#C81E1E] text-white text-xs sm:text-sm font-semibold hover:bg-[#A81818] transition shadow-md"
            >
              Explore Collection <span>→</span>
            </a>

            <div className="grid grid-cols-3 gap-1.5 opacity-70" aria-hidden="true">
              {Array.from({ length: 9 }).map((_, idx) => (
                <span key={idx} className="w-1.5 h-1.5 rounded-full bg-[#C81E1E]" />
              ))}
            </div>
          </div>
        </div>

        <Link
          href={heroProduct ? `/products/${heroProduct.slug}` : "/search"}
          className="group relative rounded-[26px] bg-[#F2D5C8] overflow-hidden min-h-[340px] sm:min-h-[390px] border border-[#EBC5B6] flex items-center justify-center"
        >
          <img
            src={
              heroProduct
                ? getAestheticImage(heroProduct, heroProduct.variants[0]?.image_url)
                : "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80"
            }
            alt={heroProduct?.name || "Zenoo Studio"}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
          />

          {heroProduct && (
            <div className="absolute bottom-4 left-4 right-4 bg-[#FAF3EB]/92 backdrop-blur-md rounded-2xl px-4 py-3 flex items-center justify-between border border-[#EAD9D6]">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#9B7E80] font-semibold">
                  Featured Drop
                </p>
                <p className="text-sm font-bold text-[#231819]">{heroProduct.name}</p>
              </div>
              <span className="px-3.5 py-1.5 rounded-full bg-[#C81E1E] text-white text-xs font-bold">
                {heroProduct.variants[0] ? formatPrice(heroProduct.variants[0].price_minor) : "Shop"}
              </span>
            </div>
          )}
        </Link>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium border transition ${
                  selectedCategory === cat
                    ? "bg-[#C81E1E] text-white border-[#C81E1E] shadow-xs"
                    : "bg-[#FFFDFB] text-[#231819] border-[#E4CFC9] hover:border-[#C81E1E] hover:text-[#C81E1E]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Filter products..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setSearch(e.target.value);
              }}
              className="border border-[#E4CFC9] bg-[#FFFDFB] rounded-full px-4 py-2 text-xs sm:text-sm w-full sm:w-56"
            />
            {isFiltering && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setSelectedCategory("All");
                }}
                className="px-3.5 py-2 rounded-full border border-[#E4CFC9] text-xs hover:bg-[#FAD2D8]/40"
              >
                Reset
              </button>
            )}
          </form>
        </div>
      </section>

      {isFiltering && (
        <section ref={resultsRef} className="space-y-5">
          <div className="flex items-center gap-2">
            <span className="text-[#C81E1E] text-xl">✦</span>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#C81E1E]">
              Filtered Pieces ({filteredProducts.length})
            </h2>
          </div>
          {filteredProducts.length === 0 ? (
            <p className="text-sm text-[#6E5A5C]">No products match your filter.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
              {filteredProducts.map((p, idx) => (
                <EditorialCard key={p.id} product={p} index={idx} />
              ))}
            </div>
          )}
        </section>
      )}

      {cartItems.length > 0 && (
        <section className="border border-[#F1C5CC] rounded-[24px] p-5 sm:p-6 bg-[#FAD2D8]/35">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-editorial text-xl font-bold text-[#C81E1E]">✦ In Your Bag</h2>
            <Link href="/cart" className="text-xs font-semibold text-[#C81E1E] underline">
              Open Bag ({cartItems.length}) →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {cartItems.slice(0, 4).map((item) => (
              <Link
                key={item.variantId}
                href={`/products/${item.slug}`}
                className="flex items-center gap-3 bg-[#FFFDFB] border border-[#EAD9D6] rounded-2xl p-2.5 hover:border-[#C81E1E] transition"
              >
                <img
                  src={
                    item.imageUrl && !item.imageUrl.includes("placehold.co")
                      ? item.imageUrl
                      : "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=200&q=80"
                  }
                  alt={item.productName}
                  className="w-12 h-12 object-cover rounded-xl"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate text-[#231819]">{item.productName}</p>
                  <p className="text-[11px] text-[#7D6668]">Qty: {item.quantity}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section id="new-arrivals" className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-[#C81E1E] text-xl">✦</span>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#C81E1E]">
              New Favorites
            </h2>
          </div>
          <Link
            href="/search"
            className="text-xs font-semibold text-[#C81E1E] border border-[#E4CFC9] bg-[#FFFDFB] px-3.5 py-1.5 rounded-full hover:bg-[#FAD2D8]/40 transition"
          >
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
          {newArrivals.map((p, idx) => (
            <EditorialCard key={`new-${p.id}`} product={p} index={idx} />
          ))}
        </div>

        <div className="pt-2">
          <div className="h-[2px] w-full bg-[#EAD9D6] rounded-full overflow-hidden">
            <div className="h-full w-1/4 bg-[#C81E1E] rounded-full" />
          </div>
        </div>
      </section>

      <section id="collections" className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-2">
        <div className="md:col-span-6 rounded-[26px] overflow-hidden bg-[#F1D4C6] border border-[#EAD9D6] aspect-[4/3]">
          <img
            src={
              secondaryStoryProduct
                ? getAestheticImage(secondaryStoryProduct, secondaryStoryProduct.variants[0]?.image_url)
                : "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=800&q=80"
            }
            alt="Made for Everyday"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="md:col-span-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pl-0 md:pl-4">
          <div className="space-y-4 max-w-xs">
            <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#C81E1E] leading-tight">
              Made for
              <br />
              Everyday <span className="text-2xl align-top">✦</span>
            </h2>
            <p className="text-sm text-[#5C494B] leading-relaxed">
              Thoughtful pieces, modern silhouettes, and timeless comfort — designed for the moments you live in, not just look at.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#D4B3AE] bg-[#FFFDFB] text-xs font-semibold text-[#C81E1E] hover:bg-[#FAD2D8]/50 transition"
            >
              Shop the Look <span>→</span>
            </Link>
          </div>

          {featured[2] && (
            <Link
              href={`/products/${featured[2].slug}`}
              className="w-36 sm:w-40 shrink-0 group"
            >
              <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-[#CFE2F7] border border-[#EAD9D6] shadow-sm">
                <img
                  src={getAestheticImage(featured[2], featured[2].variants[0]?.image_url)}
                  alt={featured[2].name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C81E1E]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#D8BEBA]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#D8BEBA]" />
              </div>
            </Link>
          )}
        </div>
      </section>

      <section id="flash-sales" className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="text-[#C81E1E] text-xl">✦</span>
            <div>
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#C81E1E]">
                Flash Drops &amp; Deals
              </h2>
              <p className="text-xs text-[#6E5A5C]">Limited-edition runs before stock sells out.</p>
            </div>
          </div>
          <div className="font-mono text-xs font-bold bg-[#C81E1E] text-white px-4 py-2 rounded-full w-fit shadow-xs">
            Ends in {hours}:{mins}:{secs}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
          {deals.map((p, idx) => (
            <EditorialCard key={`deal-${p.id}`} product={p} index={idx + 1} badge="Deal" />
          ))}
        </div>
      </section>

      <section id="bestsellers" className="space-y-5">
        <div className="flex items-center gap-2.5">
          <span className="text-[#C81E1E] text-xl">✦</span>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#C81E1E]">
            Most Loved Pieces
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
          {bestsellers.map((p, idx) => (
            <EditorialCard key={`best-${p.id}`} product={p} index={idx + 2} badge="Popular" />
          ))}
        </div>
      </section>

      {recentlyViewed.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center gap-2.5">
            <span className="text-[#C81E1E] text-xl">✦</span>
            <h2 className="font-editorial text-2xl font-bold text-[#C81E1E]">Recently Viewed</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
            {recentlyViewed.slice(0, 4).map((p, idx) => (
              <EditorialCard key={`recent-${p.id}`} product={p} index={idx} />
            ))}
          </div>
        </section>
      )}

      <section className="rounded-[26px] bg-[#FAD2D8]/55 border border-[#F2C3CB] p-7 sm:p-10 space-y-6">
        <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#C81E1E] text-center">
          ✦ Notes from Our Community
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { name: "Rohan M.", text: "Super fast delivery and the heavyweight fabric feels genuinely luxe." },
            { name: "Ananya S.", text: "Checkout took 10 seconds and every piece feels thoughtfully curated." },
            { name: "Kabir V.", text: "Clean storefront, accurate sizing, and zero hassle on my order." },
          ].map((t) => (
            <div
              key={t.name}
              className="border border-[#EAD9D6] rounded-2xl p-5 bg-[#FFFDFB] space-y-2.5 shadow-xs"
            >
              <p className="text-sm text-[#4A383A] leading-relaxed">&ldquo;{t.text}&rdquo;</p>
              <p className="text-xs font-bold text-[#C81E1E]">— {t.name}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
