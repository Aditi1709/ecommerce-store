import Link from "next/link";
import { getProducts } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

const CATEGORIES = [
  {
    name: "Apparel",
    subtitle: "Everyday silhouettes & hoodies",
    query: "Hoodies",
    bg: "bg-[#EBF3EF] hover:border-[#0F3D2E]",
    tag: "text-[#0F3D2E]",
  },
  {
    name: "Footwear",
    subtitle: "Crafted for daily movement",
    query: "shoes",
    bg: "bg-[#FDF1EC] hover:border-[#D95D39]",
    tag: "text-[#D95D39]",
  },
  {
    name: "Electronics",
    subtitle: "Minimal desk & audio gear",
    query: "electronics",
    bg: "bg-[#EEF4FA] hover:border-[#2563EB]",
    tag: "text-[#1D4ED8]",
  },
  {
    name: "Accessories",
    subtitle: "Finishing touches & bags",
    query: "accessories",
    bg: "bg-[#FEF6E6] hover:border-[#D97706]",
    tag: "text-[#B45309]",
  },
];

export default async function HomePage() {
  const products = await getProducts();
  const featured = products.slice(0, 8);

  return (
    <main className="pb-20">
      {/* Colorful Deep Emerald Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-8 pb-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F3D2E] via-[#14503D] to-[#1D6B52] text-[#FAF8F5] px-8 py-14 md:px-16 md:py-20 shadow-lg">
          <div className="max-w-2xl space-y-6 relative z-10">
            <span className="inline-block px-3.5 py-1 rounded-full bg-white/15 text-[#FDE68A] text-xs font-semibold tracking-wide">
              New Season • Autumn / Winter 2026
            </span>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight">
              Elevated essentials,{" "}
              <span className="text-[#FDBA74]">designed for everyday life.</span>
            </h1>
            <p className="text-base text-emerald-50/90 max-w-lg leading-relaxed">
              Curated pieces from independent merchants—backed by verified quality,
              express doorstep delivery, and effortless 7-day returns.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/search"
                className="px-7 py-3.5 rounded-full bg-[#D95D39] text-white text-sm font-semibold hover:bg-[#C24B29] transition shadow-md"
              >
                Shop Collection →
              </Link>
              <Link
                href="/wishlist"
                className="px-7 py-3.5 rounded-full bg-white/10 border border-white/25 text-white text-sm font-semibold hover:bg-white/20 transition"
              >
                View Wishlists
              </Link>
            </div>
          </div>

          {/* Soft Decorative Blobs */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#D95D39]/25 blur-3xl" />
          <div className="pointer-events-none absolute right-24 -bottom-24 h-72 w-72 rounded-full bg-[#FBBF24]/20 blur-3xl" />
        </div>
      </section>

      {/* Value Proposition Strip */}
      <section className="border-y border-[#E7E2D8] bg-white">
        <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div>
            <p className="font-semibold text-[#0F3D2E]">Free Express Shipping</p>
            <p className="text-xs text-zinc-500 mt-0.5">On all domestic orders over ₹999</p>
          </div>
          <div>
            <p className="font-semibold text-[#0F3D2E]">7-Day Hassle-Free Returns</p>
            <p className="text-xs text-zinc-500 mt-0.5">Doorstep reverse pickup & instant credit</p>
          </div>
          <div>
            <p className="font-semibold text-[#0F3D2E]">Verified Merchants</p>
            <p className="text-xs text-zinc-500 mt-0.5">Quality-checked before every dispatch</p>
          </div>
          <div>
            <p className="font-semibold text-[#0F3D2E]">24/7 AI & Live Support</p>
            <p className="text-xs text-zinc-500 mt-0.5">Instant shopping help & ticket tracking</p>
          </div>
        </div>
      </section>

      {/* Colorful Category Spotlight */}
      <section className="max-w-7xl mx-auto px-6 pt-16 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#D95D39]">Browse</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#18181B] mt-1">
              Shop by Category
            </h2>
          </div>
          <Link
            href="/search"
            className="text-sm font-semibold text-[#0F3D2E] hover:text-[#D95D39] transition"
          >
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={`/search?q=${encodeURIComponent(cat.query)}`}
              className={`group rounded-2xl border border-transparent p-6 flex flex-col justify-between min-h-[148px] transition ${cat.bg}`}
            >
              <span className={`text-xs font-bold uppercase tracking-wider ${cat.tag}`}>
                Collection
              </span>
              <div>
                <h3 className="font-display text-2xl font-bold text-[#18181B] group-hover:translate-x-1 transition-transform">
                  {cat.name}
                </h3>
                <p className="text-xs text-zinc-600 mt-1">{cat.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="max-w-7xl mx-auto px-6 pt-20 space-y-8">
        <div className="flex items-end justify-between border-b border-[#E7E2D8] pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#D95D39]">Curated</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#18181B] mt-1">
              New Arrivals
            </h2>
          </div>
          <Link
            href="/search"
            className="text-sm font-semibold text-[#0F3D2E] hover:text-[#D95D39] transition"
          >
            Explore Catalog →
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="rounded-2xl border border-[#E7E2D8] bg-white p-14 text-center space-y-3">
            <p className="font-display text-2xl font-bold">No products loaded</p>
            <p className="text-sm text-zinc-500">
              Make sure your FastAPI backend is running on port 8000, or add products from the Merchant portal.
            </p>
            <Link
              href="/merchant"
              className="inline-block mt-2 px-6 py-2.5 rounded-full bg-[#0F3D2E] text-white text-sm font-semibold"
            >
              Go to Merchant Portal
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Warm Terracotta Promo Banner */}
      <section className="max-w-7xl mx-auto px-6 pt-20">
        <div className="rounded-3xl bg-gradient-to-r from-[#FDF1EC] to-[#FEF6E6] border border-[#F5D5C8] p-8 md:p-14 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#D95D39]">
              Limited Time Offer
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#18181B]">
              Take 20% off your entire bag with{" "}
              <span className="text-[#D95D39]">SAVE20</span>.
            </h2>
            <p className="text-sm text-zinc-600">
              Apply at checkout—plus unlock complimentary shipping on orders over ₹999.
            </p>
          </div>
          <Link
            href="/search"
            className="px-7 py-3.5 rounded-full bg-[#0F3D2E] text-white text-sm font-semibold hover:bg-[#14503D] transition shrink-0 text-center shadow-sm"
          >
            Start Shopping
          </Link>
        </div>
      </section>
    </main>
  );
}