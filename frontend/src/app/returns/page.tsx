"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/lib/api";
import {
  BackendOrder,
  BackendReturn,
  createBackendReturn,
  fetchMyOrders,
  fetchMyReturns,
  updateBackendReturnStage,
} from "@/lib/backendApi";
import { RETURN_STAGES, RefundMethod, ReturnActionType } from "@/lib/returns";

const REASONS = [
  "Size or fit issue",
  "Received damaged or defective item",
  "Wrong item delivered",
  "Quality not as expected",
  "Changed my mind / No longer needed",
];

const PICKUP_SLOTS = [
  "Morning (9:00 AM – 12:00 PM)",
  "Afternoon (12:00 PM – 4:00 PM)",
  "Evening (4:00 PM – 8:00 PM)",
];

const ACTION_LABELS: Record<ReturnActionType, string> = {
  return: "Return & Refund",
  replacement: "Replacement",
  exchange: "Exchange Product",
  refund: "Refund Request",
  cancel: "Cancel Order",
};

export default function ReturnsPortalPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [returns, setReturns] = useState<BackendReturn[]>([]);
  const [nowMs, setNowMs] = useState<number>(0);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [actionType, setActionType] = useState<ReturnActionType>("return");
  const [reason, setReason] = useState(REASONS[0]);
  const [exchangeVariant, setExchangeVariant] = useState("Size L / Black");
  const [pickupDate, setPickupDate] = useState("2026-11-22");
  const [pickupSlot, setPickupSlot] = useState(PICKUP_SLOTS[0]);
  const [refundMethod, setRefundMethod] = useState<RefundMethod>("original_payment");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    Promise.all([fetchMyOrders(token), fetchMyReturns(token)]).then(([ordList, retList]) => {
      if (cancelled) return;
      setNowMs(Date.now());
      setOrders(ordList);
      setReturns(retList);
      if (ordList[0]) setSelectedOrderId(ordList[0].id);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const activeOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) || orders[0] || null,
    [orders, selectedOrderId]
  );

  const eligibility = useMemo(() => {
    if (!activeOrder) return null;
    if (activeOrder.status === "cancelled" || activeOrder.status === "refunded") {
      return { eligible: false, message: `Order is already ${activeOrder.status}.` };
    }
    const refTime = nowMs || new Date(activeOrder.created_at).getTime();
    const days = Math.floor(
      (refTime - new Date(activeOrder.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    const left = Math.max(0, 7 - days);
    return left > 0
      ? { eligible: true, message: `Eligible (${left} day${left === 1 ? "" : "s"} left in 7-day window).` }
      : { eligible: false, message: "7-day return window has expired." };
  }, [activeOrder, nowMs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !activeOrder || !eligibility?.eligible) return;
    setError("");
    setMsg("");
    setSubmitting(true);

    const needsPickup =
      actionType === "return" || actionType === "replacement" || actionType === "exchange";
    const needsRefund =
      actionType === "return" || actionType === "refund" || actionType === "cancel";

    try {
      const created = await createBackendReturn(token, {
        order_id: activeOrder.id,
        action_type: actionType,
        reason,
        exchange_variant: actionType === "exchange" ? exchangeVariant.trim() : undefined,
        pickup_date: needsPickup ? pickupDate : undefined,
        pickup_slot: needsPickup ? pickupSlot : undefined,
        refund_method: needsRefund ? refundMethod : undefined,
      });
      setReturns((prev) => [created, ...prev]);
      setMsg(`Request ${created.id.slice(0, 8)} saved to database!`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit return");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStageChange = async (retId: string, stageIndex: number) => {
    if (!token) return;
    try {
      const updated = await updateBackendReturnStage(token, retId, stageIndex);
      setReturns((prev) => prev.map((r) => (r.id === retId ? updated : r)));
      setMsg(`Updated stage to ${RETURN_STAGES[stageIndex]}.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Stage update failed");
    }
  };

  if (!token) {
    return (
      <main className="max-w-xl mx-auto px-6 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold">Sign in to manage returns</h1>
        <Link href="/login" className="inline-block px-6 py-2.5 bg-black text-white rounded-lg text-sm">
          Login
        </Link>
      </main>
    );
  }

  const needsPickup =
    actionType === "return" || actionType === "replacement" || actionType === "exchange";
  const needsRefund =
    actionType === "return" || actionType === "refund" || actionType === "cancel";

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Returns, Refunds & Cancellations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Synced directly with your Zeno PostgreSQL database.
          </p>
        </div>
        <Link href="/info/return-policy" className="px-3.5 py-2 border rounded-lg text-xs hover:bg-gray-50">
          Return Policy
        </Link>
      </div>

      {error && <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
      {msg && <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm">{msg}</div>}

      {orders.length === 0 ? (
        <div className="border rounded-2xl p-12 text-center space-y-4 bg-white">
          <h2 className="text-xl font-semibold">No orders found</h2>
          <Link href="/" className="inline-block px-6 py-2.5 bg-black text-white rounded-lg text-sm">
            Shop Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <form onSubmit={handleSubmit} className="lg:col-span-2 border rounded-2xl p-6 bg-white space-y-4 h-fit text-sm">
            <h2 className="text-xl font-bold">Create Request</h2>

            <div>
              <label className="block text-xs font-medium mb-1">Select Order</label>
              <select
                value={activeOrder?.id || ""}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.id.slice(0, 10)} — {formatPrice(o.total_minor)} ({o.status})
                  </option>
                ))}
              </select>
            </div>

            {eligibility && (
              <div
                className={`p-3 rounded-xl text-xs font-medium border ${
                  eligibility.eligible
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                {eligibility.eligible ? "✓ " : "✕ "}
                {eligibility.message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs">
              {(Object.keys(ACTION_LABELS) as ReturnActionType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActionType(t)}
                  className={`py-2 px-2.5 rounded-lg border font-medium ${
                    actionType === t ? "bg-black text-white border-black" : "hover:border-black"
                  }`}
                >
                  {ACTION_LABELS[t]}
                </button>
              ))}
            </div>

            <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full border rounded-lg px-3 py-2">
              {REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            {actionType === "exchange" && (
              <input
                required
                value={exchangeVariant}
                onChange={(e) => setExchangeVariant(e.target.value)}
                placeholder="New Size / Color"
                className="w-full border rounded-lg px-3 py-2"
              />
            )}

            {needsPickup && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="border rounded-lg px-2.5 py-2" />
                <select value={pickupSlot} onChange={(e) => setPickupSlot(e.target.value)} className="border rounded-lg px-2.5 py-2">
                  {PICKUP_SLOTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            {needsRefund && (
              <div className="space-y-1.5 text-xs">
                <label className="flex items-center gap-2 border rounded-lg p-2.5 cursor-pointer">
                  <input type="radio" checked={refundMethod === "original_payment"} onChange={() => setRefundMethod("original_payment")} />
                  <span>Original Payment Method</span>
                </label>
                <label className="flex items-center gap-2 border rounded-lg p-2.5 cursor-pointer">
                  <input type="radio" checked={refundMethod === "store_credit"} onChange={() => setRefundMethod("store_credit")} />
                  <span>Instant Store Credit</span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !eligibility?.eligible}
              className="w-full py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-300"
            >
              {submitting ? "Submitting..." : `Submit ${ACTION_LABELS[actionType]}`}
            </button>
          </form>

          <section className="lg:col-span-3 space-y-4">
            <h2 className="text-xl font-bold">Your Return Requests ({returns.length})</h2>
            {returns.length === 0 ? (
              <div className="border rounded-2xl p-10 text-center text-sm text-gray-500 bg-white">
                No return requests yet.
              </div>
            ) : (
              returns.map((rec) => (
                <div key={rec.id} className="border rounded-2xl p-5 bg-white space-y-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold">{rec.id.slice(0, 8)}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 uppercase">{rec.action_type}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                        Refund: {rec.refund_status}
                      </span>
                    </div>
                    <select
                      value={rec.stage_index}
                      onChange={(e) => handleStageChange(rec.id, Number(e.target.value))}
                      className="border rounded-lg px-2 py-1 text-xs bg-gray-50"
                    >
                      {RETURN_STAGES.map((label, idx) => (
                        <option key={label} value={idx}>Stage {idx + 1}: {label}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-gray-600">
                    Order: <span className="font-mono">{rec.order_id.slice(0, 10)}</span> • {formatPrice(rec.amount_minor)} • {rec.reason}
                  </p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {RETURN_STAGES.map((label, idx) => (
                      <div
                        key={label}
                        className={`text-center p-2 rounded-lg text-[10px] font-medium border ${
                          idx <= rec.stage_index ? "bg-black text-white border-black" : "bg-gray-50 text-gray-400"
                        }`}
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      )}
    </main>
  );
}