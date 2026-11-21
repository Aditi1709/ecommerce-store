"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { Product, formatPrice } from "@/lib/api";
import {
  BackendWishlistItem,
  addBackendWishlistItem,
  deleteBackendWishlistItem,
  fetchMyWishlist,
  toggleBackendWishlistAlert,
} from "@/lib/backendApi";

export default function WishlistPage() {
  const { user, token } = useAuth();
  const { addItem } = useCart();

  const [items, setItems] = useState<BackendWishlistItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeListName, setActiveListName] = useState("Favorites");
  const [newListName, setNewListName] = useState("");
  const [customLists, setCustomLists] = useState<string[]>(["Favorites"]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}`;
    fetch(`${API_BASE}/products/`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setProducts(data);
      })
      .catch(() => {});

    if (token) {
      fetchMyWishlist(token).then((list) => {
        if (cancelled) return;
        setItems(list);
        const names = Array.from(new Set(["Favorites", ...list.map((i) => i.list_name)]));
        setCustomLists(names);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [token]);

  const activeItems = useMemo(
    () => items.filter((i) => i.list_name === activeListName),
    [items, activeListName]
  );

  const flash = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  };

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newListName.trim();
    if (!clean) return;
    if (!customLists.includes(clean)) {
      setCustomLists((prev) => [...prev, clean]);
    }
    setActiveListName(clean);
    setNewListName("");
    flash(`Switched to "${clean}"`);
  };

  const handleAdd = async (p: Product) => {
    if (!token) {
      setError("Please log in to save wishlists to your account.");
      return;
    }
    const v = p.variants[0];
    if (!v) return;
    setError("");
    try {
      const saved = await addBackendWishlistItem(token, {
        list_name: activeListName,
        variant_id: v.id,
        product_name: p.name,
        slug: p.slug,
        sku: v.sku,
        label: Object.values(v.attributes).join(" / ") || v.sku,
        price_minor: v.price_minor,
        image_url: v.image_url,
        price_drop_alert: true,
        back_in_stock_alert: v.stock_qty === 0,
      });
      setItems((prev) => (prev.some((x) => x.id === saved.id) ? prev : [saved, ...prev]));
      flash(`Saved "${p.name}" to ${activeListName}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save item");
    }
  };

  const handleRemove = async (id: string) => {
    if (!token) return;
    try {
      await deleteBackendWishlistItem(token, id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to remove item");
    }
  };

  const handleToggleAlert = async (
    item: BackendWishlistItem,
    field: "price_drop_alert" | "back_in_stock_alert"
  ) => {
    if (!token) return;
    try {
      const updated = await toggleBackendWishlistAlert(token, item.id, {
        [field]: !item[field],
      });
      setItems((prev) => prev.map((x) => (x.id === item.id ? updated : x)));
      flash("Alert preference saved to database!");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update alert");
    }
  };

  const handleMoveToCart = async (item: BackendWishlistItem) => {
    addItem({
      variantId: item.variant_id,
      productName: item.product_name,
      slug: item.slug,
      sku: item.sku,
      label: item.label,
      priceMinor: item.price_minor,
      imageUrl: item.image_url || null,
    });
    await handleRemove(item.id);
    flash(`Moved "${item.product_name}" to cart!`);
  };

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Wishlists</h1>
          <p className="text-xs text-gray-500 mt-1">
            {user
              ? `Synced in PostgreSQL for ${user.name} (${user.email}).`
              : "Log in to sync your wishlists across devices."}
          </p>
        </div>
        {!token && (
          <Link href="/login" className="px-4 py-2 bg-black text-white rounded-lg text-xs font-medium">
            Login to Sync
          </Link>
        )}
      </div>

      {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
      {msg && <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm">{msg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="space-y-4">
          <div className="border rounded-2xl p-4 bg-white space-y-2">
            <p className="text-xs uppercase font-bold text-gray-400 px-2">Your Lists</p>
            {customLists.map((name) => {
              const count = items.filter((i) => i.list_name === name).length;
              return (
                <button
                  key={name}
                  onClick={() => setActiveListName(name)}
                  className={`w-full text-left rounded-xl p-2.5 text-sm font-medium transition ${
                    activeListName === name ? "bg-black text-white" : "hover:bg-gray-100"
                  }`}
                >
                  {name} ({count})
                </button>
              );
            })}
          </div>

          <form onSubmit={handleCreateList} className="border rounded-2xl p-4 bg-white space-y-2">
            <p className="text-xs font-semibold">New Wishlist</p>
            <input
              required
              placeholder="e.g. Winter Fits"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-xs"
            />
            <button className="w-full py-2 bg-black text-white rounded-lg text-xs font-medium">
              + Create List
            </button>
          </form>
        </aside>

        <section className="lg:col-span-3 space-y-6">
          <h2 className="text-xl font-bold border-b pb-3">
            {activeListName} ({activeItems.length})
          </h2>

          {activeItems.length === 0 ? (
            <div className="border rounded-2xl p-10 text-center text-sm text-gray-500 bg-gray-50">
              No items in <strong>{activeListName}</strong> yet. Add products below!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeItems.map((item) => (
                <div key={item.id} className="border rounded-xl p-4 bg-white space-y-3">
                  <div className="flex gap-3">
                    <img
                      src={item.image_url || "https://placehold.co/120x120"}
                      alt={item.product_name}
                      className="w-20 h-20 rounded-lg object-cover border shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <Link href={`/products/${item.slug}`} className="font-semibold text-sm hover:underline line-clamp-1">
                        {item.product_name}
                      </Link>
                      <p className="text-xs text-gray-500">{item.label}</p>
                      <p className="font-bold text-sm mt-1">{formatPrice(item.price_minor)}</p>
                    </div>
                  </div>

                  <div className="border-t pt-2 space-y-1.5 text-xs text-gray-600">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span>Price Drop Alert</span>
                      <input
                        type="checkbox"
                        checked={item.price_drop_alert}
                        onChange={() => handleToggleAlert(item, "price_drop_alert")}
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span>Back-in-Stock Alert</span>
                      <input
                        type="checkbox"
                        checked={item.back_in_stock_alert}
                        onChange={() => handleToggleAlert(item, "back_in_stock_alert")}
                      />
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMoveToCart(item)}
                      className="flex-1 py-2 bg-black text-white rounded-lg text-xs font-medium"
                    >
                      Move to Cart
                    </button>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="px-3 py-2 border border-red-200 text-red-600 rounded-lg text-xs"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {products.length > 0 && (
            <div className="pt-6 border-t space-y-4">
              <h3 className="text-lg font-bold">Quick Add to &ldquo;{activeListName}&rdquo;</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {products.slice(0, 8).map((p) => {
                  const v = p.variants[0];
                  return (
                    <div key={p.id} className="border rounded-xl overflow-hidden bg-white flex flex-col">
                      <img
                        src={v?.image_url || "https://placehold.co/300x300"}
                        alt={p.name}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                        <div>
                          <p className="font-semibold text-xs line-clamp-1">{p.name}</p>
                          <p className="font-bold text-xs mt-0.5">{v ? formatPrice(v.price_minor) : ""}</p>
                        </div>
                        <button
                          onClick={() => handleAdd(p)}
                          className="w-full py-1.5 border border-black rounded-lg text-[11px] font-medium hover:bg-black hover:text-white transition"
                        >
                          ♡ Add to List
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}