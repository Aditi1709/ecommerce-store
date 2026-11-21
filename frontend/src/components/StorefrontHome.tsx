"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Product, formatPrice } from "@/lib/api";
import { useCart } from "@/context/CartContext";

const EMPTY_LIST = "[]";
const subscribeStorage = (cb: () => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};
const getRecentlyViewedSnapshot = () => localStorage.getItem("recently_viewed") ?? EMPTY_LIST;
const getServerSnapshot = () => EMPTY_LIST;

function ProductCard({ product, badge }: { product: Product; badge?: string }) {
  const firstVariant = product.variants[0];
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group border rounded-xl overflow-hidden hover:shadow-md transition bg-white flex flex-col"
    >
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        <img
          src={firstVariant?.image_url || "https://placehold.co/600x600"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
        {badge && (
          <span className="absolute top-3 left-3 bg-black text-white text-xs px-2.5 py-1 rounded-full font-medium">
            {badge}
          </span>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase">{product.category.name}</p>
          <h3 className="font-semibold mt-1 line-clamp-1">{product.name}</h3>
        </div>
        <p className="font-bold mt-2">
          {firstVariant ? formatPrice(firstVariant.price_minor) : "Out of stock"}
        </p>
      </div>
    </Link>
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

  const featured = products.slice(0, 4);
  const bestsellers = [...products].reverse().slice(0, 4);
  const newArrivals = products.slice(0, 4);
  const trending = products.slice(0, 4);
  const recommended = [...products].reverse().slice(0, 4);
  const deals = products.slice(0, 4);

  return (
    <main className="max-w-6xl mx-auto px-6 py-8 space-y-16">
      {/* Hero Banner with Promotional Offer */}
      <section className="rounded-2xl bg-gray-950 text-white p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-xl space-y-4">
          <span className="inline-block text-xs uppercase tracking-widest bg-white/15 px-3 py-1 rounded-full">
            Season Launch • Up to 40% Off
          </span>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Everyday Essentials, Direct from Independent Merchants.
          </h1>
          <p className="text-gray-300">
            Discover curated apparel, accessories, and gear with instant UPI checkout and free shipping over ₹999.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="#featured"
              className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition"
            >
              Shop Now
            </a>
            <Link
              href="/register"
              className="px-6 py-3 border border-white/30 rounded-lg font-medium hover:bg-white/10 transition"
            >
              Sell as a Merchant
            </Link>
          </div>
        </div>
      </section>

      {/* Search Bar & Category Navigation */}
      <section className="space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search products, hoodies, gear..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setSearch(e.target.value);
            }}
            className="flex-1 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition"
          >
            Search
          </button>
          {isFiltering && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setSearch("");
                setSelectedCategory("All");
              }}
              className="px-4 py-3 border rounded-xl text-sm hover:bg-gray-100"
            >
              Clear
            </button>
          )}
        </form>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                selectedCategory === cat
                  ? "bg-black text-white border-black"
                  : "bg-white text-black hover:border-black"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Search / Category Filter Results */}
      {isFiltering && (
        <section ref={resultsRef}>
          <h2 className="text-2xl font-bold mb-6">
            Results ({filteredProducts.length})
          </h2>
          {filteredProducts.length === 0 ? (
            <p className="text-gray-500">No products match your search.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Continue Shopping (Active Cart Items) */}
      {cartItems.length > 0 && (
        <section className="border rounded-2xl p-6 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Continue Shopping</h2>
            <Link href="/cart" className="text-sm font-medium underline">
              Go to Cart ({cartItems.length})
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {cartItems.slice(0, 4).map((item) => (
              <Link
                key={item.variantId}
                href={`/products/${item.slug}`}
                className="flex items-center gap-3 bg-white border rounded-xl p-3 hover:border-black transition"
              >
                <img
                  src={item.imageUrl || "https://placehold.co/100x100"}
                  alt={item.productName}
                  className="w-14 h-14 object-cover rounded-lg"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{item.productName}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Flash Sales & Today's Deals */}
      <section id="flash-sales" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold">⚡ Flash Sales & Today&apos;s Deals</h2>
            <p className="text-sm text-gray-500">Limited-time drops before stock runs out.</p>
          </div>
          <div className="font-mono text-sm bg-red-600 text-white px-4 py-2 rounded-lg w-fit">
            Ends in {hours}:{mins}:{secs}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {deals.map((p) => (
            <ProductCard key={`deal-${p.id}`} product={p} badge="Deal" />
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section id="featured" className="space-y-6">
        <h2 className="text-2xl font-bold">Featured Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {featured.map((p) => (
            <ProductCard key={`feat-${p.id}`} product={p} badge="Featured" />
          ))}
        </div>
      </section>

      {/* Discount Banner */}
      <section className="rounded-2xl bg-gray-100 border p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase font-bold tracking-wider text-gray-500">Limited Offer</p>
          <h3 className="text-2xl font-bold mt-1">Flat 20% Off on Your First UPI Order</h3>
          <p className="text-sm text-gray-600 mt-1">Zero gateway fees. Instant order confirmation.</p>
        </div>
        <Link
          href="/cart"
          className="px-6 py-3 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800"
        >
          Claim Offer
        </Link>
      </section>

      {/* Bestselling Products */}
      <section id="bestsellers" className="space-y-6">
        <h2 className="text-2xl font-bold">Bestselling Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {bestsellers.map((p) => (
            <ProductCard key={`best-${p.id}`} product={p} badge="Bestseller" />
          ))}
        </div>
      </section>

      {/* Seasonal Collections */}
      <section id="collections" className="space-y-6">
        <h2 className="text-2xl font-bold">Seasonal Collections</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: "Winter Streetwear", desc: "Heavyweight hoodies & layers", tag: "Winter 2026" },
            { title: "Minimalist Essentials", desc: "Clean cuts for everyday wear", tag: "Core" },
            { title: "Tech & Desk Gear", desc: "Upgrades for your workspace", tag: "New Drop" },
          ].map((col) => (
            <div key={col.title} className="border rounded-2xl p-6 bg-gray-50 flex flex-col justify-between min-h-40">
              <div>
                <span className="text-xs uppercase font-semibold text-gray-500">{col.tag}</span>
                <h3 className="text-xl font-bold mt-1">{col.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{col.desc}</p>
              </div>
              <a href="#featured" className="text-sm font-medium underline mt-4">
                Explore Collection →
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section id="new-arrivals" className="space-y-6">
        <h2 className="text-2xl font-bold">New Arrivals</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {newArrivals.map((p) => (
            <ProductCard key={`new-${p.id}`} product={p} badge="New" />
          ))}
        </div>
      </section>

      {/* Trending & Recommended */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Trending Now</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {trending.map((p) => (
            <ProductCard key={`trend-${p.id}`} product={p} badge="Trending" />
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Recommended for You</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {recommended.map((p) => (
            <ProductCard key={`rec-${p.id}`} product={p} />
          ))}
        </div>
      </section>

      {/* Recently Viewed Products */}
      {recentlyViewed.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Recently Viewed</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {recentlyViewed.slice(0, 4).map((p) => (
              <ProductCard key={`recent-${p.id}`} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Brand Showcase */}
      <section className="border-y py-10">
        <p className="text-center text-xs uppercase tracking-widest text-gray-500 mb-6">
          Featured Merchant Brands
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center font-bold text-lg text-gray-400">
          <span>NORTHLINE</span>
          <span>KINETIC</span>
          <span>MONO STUDIO</span>
          <span>VELOURA</span>
          <span>CRAFTLAB</span>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-center">What Our Customers Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: "Rohan M.", text: "Super fast delivery and the hoodie fabric feels genuinely heavyweight." },
            { name: "Ananya S.", text: "UPI checkout took 10 seconds and I love supporting independent merchants." },
            { name: "Kabir V.", text: "Clean storefront, accurate sizing, and zero hassle on my order." },
          ].map((t) => (
            <div key={t.name} className="border rounded-2xl p-6 bg-white space-y-3">
              <p className="text-sm text-gray-600">&ldquo;{t.text}&rdquo;</p>
              <p className="text-sm font-semibold">— {t.name}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}