"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/lib/api";
import {
  BackendOrder,
  TrackedOrder,
  cancelBackendOrder,
  fetchMyOrders,
  fetchTrackedOrder,
} from "@/lib/backendApi";

const STAGES = [
  { key: "order_confirmed", label: "Order Confirmed", desc: "Order received." },
  { key: "payment_confirmed", label: "Payment Confirmed", desc: "Payment verified." },
  { key: "processing", label: "Processing", desc: "Preparing your items." },
  { key: "packed", label: "Packed", desc: "Sealed for dispatch." },
  { key: "shipped", label: "Shipped", desc: "Handed to courier." },
  { key: "out_for_delivery", label: "Out for Delivery", desc: "Agent on the way." },
  { key: "delivered", label: "Delivered", desc: "Delivered at doorstep." },
] as const;

export default function OrderTrackingPage() {
  const { token } = useAuth();
  const [myOrders, setMyOrders] = useState<BackendOrder[]>([]);
  const [tracked, setTracked] = useState<TrackedOrder | null>(null);
  const [lookupInput, setLookupInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bannerMsg, setBannerMsg] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  const loadOrder = async (orderId: string) => {
    setError("");
    setLoading(true);
    try {
      const data = await fetchTrackedOrder(orderId);
      setTracked(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Order not found");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    const urlOrder = params.get("order");

    if (token) {
      fetchMyOrders(token).then((list) => {
        if (cancelled) return;
        setMyOrders(list);
        const firstId = urlOrder || list[0]?.id;
        if (firstId) {
          fetchTrackedOrder(firstId)
            .then((data) => !cancelled && setTracked(data))
            .catch(() => {});
        }
      });
    } else if (urlOrder) {
      fetchTrackedOrder(urlOrder)
        .then((data) => !cancelled && setTracked(data))
        .catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [token]);

  const estimatedDelivery = useMemo(() => {
    if (!tracked) return "";
    const d = new Date(tracked.created_at);
    d.setDate(d.getDate() + 4);
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [tracked]);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupInput.trim()) return;
    loadOrder(lookupInput.trim());
  };

  const handleCancel = async () => {
    if (!tracked || !token) return;
    setError("");
    try {
      await cancelBackendOrder(token, tracked.id);
      setConfirmCancel(false);
      setBannerMsg("Order cancelled in database.");
      await loadOrder(tracked.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not cancel order");
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Order Tracking</h1>
          <p className="text-sm text-gray-500 mt-1">
            Live order status synced directly with your Zeno database.
          </p>
        </div>

        <form onSubmit={handleLookup} className="flex gap-2">
          <input
            placeholder="Enter Order ID"
            value={lookupInput}
            onChange={(e) => setLookupInput(e.target.value)}
            className="border rounded-lg px-3.5 py-2 text-sm w-64"
          />
          <button
            disabled={loading}
            className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:bg-gray-400"
          >
            {loading ? "..." : "Track"}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      {bannerMsg && (
        <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm font-medium">
          {bannerMsg}
        </div>
      )}

      {/* Logged-in user's real orders */}
      {myOrders.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-gray-500 font-medium">Your Orders:</span>
          {myOrders.map((o) => (
            <button
              key={o.id}
              onClick={() => loadOrder(o.id)}
              className={`px-3 py-1.5 rounded-full border font-mono ${
                tracked?.id === o.id
                  ? "bg-black text-white border-black"
                  : "bg-white hover:border-black"
              }`}
            >
              {o.id.slice(0, 8)} • {o.status}
            </button>
          ))}
        </div>
      )}

      {!tracked ? (
        <div className="border rounded-2xl p-12 text-center space-y-4 bg-white">
          <h2 className="text-xl font-semibold">No order selected</h2>
          <p className="text-sm text-gray-500">
            {token
              ? "Place an order at checkout or enter an Order ID above."
              : "Log in to see your orders, or paste an Order ID above."}
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/" className="px-5 py-2.5 bg-black text-white rounded-lg text-sm">
              Shop Now
            </Link>
            {!token && (
              <Link href="/login" className="px-5 py-2.5 border rounded-lg text-sm">
                Login
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="border rounded-2xl p-6 bg-white grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 uppercase">Order ID</p>
              <p className="font-mono font-bold mt-0.5 truncate">{tracked.id}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(tracked.created_at).toLocaleDateString("en-IN")}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Courier Partner</p>
              <p className="font-semibold mt-0.5">{tracked.courier}</p>
              <p className="text-xs font-mono text-gray-600 mt-0.5">
                AWB: {tracked.tracking_number}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Estimated Delivery</p>
              <p className="font-semibold mt-0.5">
                {tracked.cancelled
                  ? "Cancelled"
                  : tracked.stage_index === 6
                  ? "Delivered ✓"
                  : estimatedDelivery}
              </p>
              <p className="text-xs text-green-700 mt-0.5 uppercase">{tracked.status}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Total Amount</p>
              <p className="font-bold text-base mt-0.5">
                {formatPrice(tracked.total_minor)}
              </p>
              <p className="text-xs text-gray-500 uppercase">{tracked.payment_method}</p>
            </div>
          </section>

          {/* 7-Stage Progress */}
          <section className="border rounded-2xl p-6 bg-white space-y-4">
            <h2 className="text-lg font-bold">
              {tracked.cancelled
                ? "Order Cancelled"
                : `Current Status: ${STAGES[tracked.stage_index]?.label || tracked.status}`}
            </h2>

            {tracked.cancelled ? (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                This order has been cancelled.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {STAGES.map((stage, idx) => {
                  const done = idx <= tracked.stage_index;
                  const current = idx === tracked.stage_index;
                  return (
                    <div
                      key={stage.key}
                      className={`border rounded-xl p-3 text-xs space-y-1 ${
                        current
                          ? "border-black bg-black text-white"
                          : done
                          ? "border-green-300 bg-green-50 text-green-900"
                          : "border-gray-200 text-gray-400"
                      }`}
                    >
                      <p className="font-bold">
                        {done ? "✓" : idx + 1}. {stage.label}
                      </p>
                      <p className="text-[11px] opacity-80">{stage.desc}</p>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs">
              <p className="text-gray-600">
                <strong>Shipping To:</strong> {tracked.shipping_address}
              </p>

              {token && !tracked.cancelled && tracked.stage_index < 4 && (
                confirmCancel ? (
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 font-medium">Confirm cancel?</span>
                    <button
                      onClick={handleCancel}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg"
                    >
                      Yes, Cancel
                    </button>
                    <button
                      onClick={() => setConfirmCancel(false)}
                      className="px-3 py-1.5 border rounded-lg"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmCancel(true)}
                    className="px-3.5 py-1.5 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50"
                  >
                    Cancel Order
                  </button>
                )
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}