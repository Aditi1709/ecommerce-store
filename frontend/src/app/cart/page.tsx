"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  useCart,
  CartItem,
  FREE_SHIPPING_MIN_MINOR,
  GIFT_WRAP_FEE_MINOR,
} from "@/context/CartContext";
import { Product, formatPrice } from "@/lib/api";

const subscribeUrl = (cb: () => void) => {
  window.addEventListener("popstate", cb);
  return () => window.removeEventListener("popstate", cb);
};
const getShareParam = () => new URLSearchParams(window.location.search).get("share") ?? "";
const getServerShareParam = () => "";

export default function CartPage() {
  const {
    items,
    savedForLater,
    wishlist,
    couponCode,
    giftWrap,
    giftMessage,
    specialInstructions,
    subtotalMinor,
    discountMinor,
    shippingMinor,
    giftWrapMinor,
    taxMinor,
    totalMinor,
    addItem,
    removeItem,
    updateQuantity,
    changeVariant,
    saveForLater,
    moveSavedToCart,
    removeSaved,
    moveToWishlist,
    moveWishlistToCart,
    removeWishlist,
    applyCoupon,
    removeCoupon,
    setGiftWrap,
    setGiftMessage,
    setSpecialInstructions,
    importItems,
  } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [dismissedShare, setDismissedShare] = useState(false);

  const shareParam = useSyncExternalStore(subscribeUrl, getShareParam, getServerShareParam);

  const sharedCartBanner: CartItem[] | null = useMemo(() => {
    if (!shareParam || dismissedShare) return null;
    try {
      const decoded = JSON.parse(atob(shareParam));
      return Array.isArray(decoded) && decoded.length > 0 ? decoded : null;
    } catch {
      return null;
    }
  }, [shareParam, dismissedShare]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}/products/`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setProducts(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  // Estimated delivery date (4 to 6 days from today)
  const deliveryWindow = useMemo(() => {
    const fmt = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    };
    return `${fmt(4)} – ${fmt(6)}`;
  }, []);

  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_MIN_MINOR - subtotalMinor);
  const freeShippingPct = Math.min(100, Math.round((subtotalMinor / FREE_SHIPPING_MIN_MINOR) * 100));

  const handleShareCart = async () => {
    const encoded = btoa(JSON.stringify(items));
    const url = `${window.location.origin}/cart?share=${encodeURIComponent(encoded)}`;
    await navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2500);
  };

  const recommended = useMemo(() => {
    const inCartSlugs = new Set(items.map((i) => i.slug));
    return products.filter((p) => !inCartSlugs.has(p.slug)).slice(0, 4);
  }, [products, items]);

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 space-y-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
          <p className="text-xs text-gray-500 mt-1">
            Your cart is saved automatically and persists across sessions.
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={handleShareCart}
            className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-[#FAD2D8]/30"
          >
            {shareCopied ? "Share / Sync Link Copied ✓" : "Share / Sync Cart Link"}
          </button>
        )}
      </div>

      {/* Shared / Cross-Device Cart Recovery Banner */}
      {sharedCartBanner && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-blue-900">
            Found <strong>{sharedCartBanner.length} item(s)</strong> from a shared/synced cart link.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                importItems(sharedCartBanner);
                setDismissedShare(true);
                window.history.replaceState({}, "", "/cart");
              }}
              className="px-4 py-1.5 bg-[#C81E1E] text-white rounded-lg text-xs font-medium"
            >
              Restore Items to My Cart
            </button>
            <button
              onClick={() => setDismissedShare(true)}
              className="px-3 py-1.5 border rounded-lg text-xs"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Free Shipping Progress Bar */}
      {items.length > 0 && (
        <div className="border rounded-xl p-4 bg-[#FAD2D8]/30 space-y-2">
          <div className="flex justify-between text-sm">
            {freeShippingRemaining === 0 ? (
              <span className="font-semibold text-green-700">
                🎉 You unlocked FREE Shipping!
              </span>
            ) : (
              <span>
                Add <strong>{formatPrice(freeShippingRemaining)}</strong> more for{" "}
                <strong>FREE Shipping</strong>
              </span>
            )}
            <span className="text-xs text-gray-500">Est. Delivery: {deliveryWindow}</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-black transition-all duration-300"
              style={{ width: `${freeShippingPct}%` }}
            />
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="border rounded-2xl p-12 text-center space-y-4">
          <h2 className="text-xl font-semibold">Your cart is empty</h2>
          <p className="text-sm text-gray-500">
            Explore our catalog or move items from Saved for Later / Wishlist below.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-[#C81E1E] text-white rounded-lg text-sm font-medium hover:bg-[#A81818]"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items Column */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const fullProduct = products.find((p) => p.slug === item.slug);
              return (
                <div
                  key={item.variantId}
                  className="border rounded-xl p-4 flex flex-col sm:flex-row gap-4 bg-white"
                >
                  <img
                    src={item.imageUrl || "https://placehold.co/120x120"}
                    alt={item.productName}
                    className="w-24 h-24 rounded-lg object-cover border shrink-0"
                  />

                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between gap-2">
                      <div>
                        <Link
                          href={`/products/${item.slug}`}
                          className="font-semibold hover:underline"
                        >
                          {item.productName}
                        </Link>
                        <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                      </div>
                      <p className="font-bold">
                        {formatPrice(item.priceMinor * item.quantity)}
                      </p>
                    </div>

                    {/* Change Product Variant */}
                    {fullProduct && fullProduct.variants.length > 1 ? (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500">Variant:</span>
                        <select
                          value={item.variantId}
                          onChange={(e) => {
                            const v = fullProduct.variants.find((x) => x.id === e.target.value);
                            if (!v) return;
                            changeVariant(item.variantId, {
                              variantId: v.id,
                              productName: fullProduct.name,
                              slug: fullProduct.slug,
                              sku: v.sku,
                              label: Object.values(v.attributes).join(" / ") || v.sku,
                              priceMinor: v.price_minor,
                              imageUrl: v.image_url,
                            });
                          }}
                          className="border rounded px-2 py-1 text-xs"
                        >
                          {fullProduct.variants.map((v) => (
                            <option key={v.id} value={v.id}>
                              {Object.values(v.attributes).join(" / ") || v.sku} —{" "}
                              {formatPrice(v.price_minor)}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">Variant: {item.label}</p>
                    )}

                    {/* Quantity + Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex items-center border rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="px-3 py-1 text-sm hover:bg-[#FAD5DC]"
                        >
                          −
                        </button>
                        <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="px-3 py-1 text-sm hover:bg-[#FAD5DC]"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs">
                        <button
                          onClick={() => saveForLater(item.variantId)}
                          className="text-gray-600 hover:text-black underline"
                        >
                          Save for Later
                        </button>
                        <button
                          onClick={() => moveToWishlist(item.variantId)}
                          className="text-gray-600 hover:text-black underline"
                        >
                          Move to Wishlist
                        </button>
                        <button
                          onClick={() => removeItem(item.variantId)}
                          className="text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Gift Wrapping, Gift Message & Special Instructions */}
            <div className="border rounded-xl p-5 bg-white space-y-4">
              <h2 className="font-semibold text-sm">Gift Options & Delivery Instructions</h2>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={giftWrap}
                  onChange={(e) => setGiftWrap(e.target.checked)}
                />
                <span>
                  Add Gift Wrapping (+{formatPrice(GIFT_WRAP_FEE_MINOR)})
                </span>
              </label>

              {giftWrap && (
                <textarea
                  rows={2}
                  placeholder="Write a personal gift message..."
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              )}

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Special Delivery Instructions (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Leave at security gate, call before delivery..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Order Summary Column */}
          <aside className="border rounded-2xl p-6 bg-white h-fit space-y-5">
            <h2 className="text-lg font-bold">Order Summary</h2>

            {/* Coupon Code */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  placeholder="Coupon (SAVE20, FIRST100)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-xs uppercase"
                />
                <button
                  type="button"
                  onClick={() => {
                    const res = applyCoupon(couponInput);
                    setCouponMsg(res.message);
                    if (res.ok) setCouponInput("");
                  }}
                  className="px-4 py-2 bg-[#C81E1E] text-white rounded-lg text-xs font-medium hover:bg-[#A81818]"
                >
                  Apply
                </button>
              </div>
              {couponCode && (
                <div className="flex items-center justify-between text-xs bg-green-50 text-green-800 px-3 py-1.5 rounded-lg">
                  <span>Applied: <strong>{couponCode}</strong></span>
                  <button onClick={removeCoupon} className="underline">Remove</button>
                </div>
              )}
              {couponMsg && <p className="text-xs text-gray-600">{couponMsg}</p>}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2.5 text-sm border-t pt-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Product Subtotal</span>
                <span>{formatPrice(subtotalMinor)}</span>
              </div>
              {discountMinor > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Discount ({couponCode})</span>
                  <span>−{formatPrice(discountMinor)}</span>
                </div>
              )}
              {giftWrapMinor > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Gift Wrapping</span>
                  <span>{formatPrice(giftWrapMinor)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping Charges</span>
                <span>{shippingMinor === 0 ? "FREE" : formatPrice(shippingMinor)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Tax (18% GST)</span>
                <span>{formatPrice(taxMinor)}</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t pt-3">
                <span>Final Payable Amount</span>
                <span>{formatPrice(totalMinor)}</span>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Estimated delivery: <strong>{deliveryWindow}</strong>
            </p>

            <Link
              href="/checkout"
              className="block w-full text-center bg-[#C81E1E] text-white py-3 rounded-lg font-medium hover:bg-[#A81818] transition"
            >
              Proceed to Checkout
            </Link>
          </aside>
        </div>
      )}

      {/* Saved for Later */}
      {savedForLater.length > 0 && (
        <section className="space-y-4 border-t pt-8">
          <h2 className="text-xl font-bold">Saved for Later ({savedForLater.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {savedForLater.map((item) => (
              <div key={item.variantId} className="border rounded-xl p-4 space-y-3 bg-white">
                <img
                  src={item.imageUrl || "https://placehold.co/300x300"}
                  alt={item.productName}
                  className="w-full h-36 object-cover rounded-lg"
                />
                <div>
                  <p className="font-semibold text-sm truncate">{item.productName}</p>
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="font-bold text-sm mt-1">{formatPrice(item.priceMinor)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => moveSavedToCart(item.variantId)}
                    className="flex-1 py-1.5 bg-[#C81E1E] text-white rounded-lg text-xs"
                  >
                    Move to Cart
                  </button>
                  <button
                    onClick={() => removeSaved(item.variantId)}
                    className="px-2.5 py-1.5 border rounded-lg text-xs text-red-600"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Wishlist */}
      {wishlist.length > 0 && (
        <section className="space-y-4 border-t pt-8">
          <h2 className="text-xl font-bold">Wishlist ({wishlist.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {wishlist.map((item) => (
              <div key={item.variantId} className="border rounded-xl p-4 space-y-3 bg-white">
                <img
                  src={item.imageUrl || "https://placehold.co/300x300"}
                  alt={item.productName}
                  className="w-full h-36 object-cover rounded-lg"
                />
                <div>
                  <p className="font-semibold text-sm truncate">{item.productName}</p>
                  <p className="font-bold text-sm mt-1">{formatPrice(item.priceMinor)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => moveWishlistToCart(item.variantId)}
                    className="flex-1 py-1.5 bg-[#C81E1E] text-white rounded-lg text-xs"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={() => removeWishlist(item.variantId)}
                    className="px-2.5 py-1.5 border rounded-lg text-xs text-red-600"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recommended Products */}
      {recommended.length > 0 && (
        <section className="space-y-4 border-t pt-8">
          <h2 className="text-xl font-bold">Recommended for You</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {recommended.map((p) => {
              const v = p.variants[0];
              return (
                <div key={p.id} className="border rounded-xl overflow-hidden bg-white flex flex-col">
                  <Link href={`/products/${p.slug}`}>
                    <img
                      src={v?.image_url || "https://placehold.co/400x400"}
                      alt={p.name}
                      className="w-full h-44 object-cover"
                    />
                  </Link>
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">{p.category.name}</p>
                      <h3 className="font-semibold text-sm truncate">{p.name}</h3>
                      <p className="font-bold text-sm mt-1">
                        {v ? formatPrice(v.price_minor) : ""}
                      </p>
                    </div>
                    {v && (
                      <button
                        onClick={() =>
                          addItem({
                            variantId: v.id,
                            productName: p.name,
                            slug: p.slug,
                            sku: v.sku,
                            label: Object.values(v.attributes).join(" / ") || v.sku,
                            priceMinor: v.price_minor,
                            imageUrl: v.image_url,
                          })
                        }
                        className="w-full py-2 bg-[#C81E1E] text-white rounded-lg text-xs font-medium hover:bg-[#A81818]"
                      >
                        Quick Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}