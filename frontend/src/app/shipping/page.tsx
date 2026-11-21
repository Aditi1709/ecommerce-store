"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  COURIER_PARTNERS,
  DeliveryAttempt,
  DeliverySpeed,
  FREE_SHIPPING_THRESHOLD_INR,
  INTERNATIONAL_ZONES,
  SHIPPING_RESTRICTIONS,
  ShipmentRecord,
  calculateShippingQuote,
  checkPincodeServiceability,
  downloadShippingLabel,
  getServerShipmentsSnapshot,
  getShipmentsSnapshot,
  parseShipments,
  saveShipments,
  subscribeShipments,
} from "@/lib/shipping";
import {
  getReturnsSnapshot,
  getServerReturnsSnapshot,
  parseReturns,
  saveReturns,
  subscribeReturns,
} from "@/lib/returns";

type ShippingTab = "calculator" | "shipments" | "returns_pickup" | "partners";

export default function ShippingDeliveryPage() {
  const rawShipments = useSyncExternalStore(
    subscribeShipments,
    getShipmentsSnapshot,
    getServerShipmentsSnapshot
  );
  const rawReturns = useSyncExternalStore(
    subscribeReturns,
    getReturnsSnapshot,
    getServerReturnsSnapshot
  );

  const shipments = useMemo(() => parseShipments(rawShipments), [rawShipments]);
  const returnPickups = useMemo(() => parseReturns(rawReturns), [rawReturns]);

  const [tab, setTab] = useState<ShippingTab>("calculator");
  const [msg, setMsg] = useState("");

  // Rate Calculator & Pincode Checker state
  const [country, setCountry] = useState("IN");
  const [pincode, setPincode] = useState("560038");
  const [weightKg, setWeightKg] = useState("1.5");
  const [orderValueInr, setOrderValueInr] = useState("1299");
  const [speed, setSpeed] = useState<DeliverySpeed>("standard");

  // Create Shipment & Label Form state
  const [orderId, setOrderId] = useState("ORD-90124");
  const [courier, setCourier] = useState(COURIER_PARTNERS[0].name);
  const [destination, setDestination] = useState("Koramangala, Bengaluru, Karnataka");
  const [pickupDate, setPickupDate] = useState("2026-11-22");
  const [pickupSlot, setPickupSlot] = useState("Morning (9 AM – 12 PM)");

  const serviceability = useMemo(
    () => (country === "IN" ? checkPincodeServiceability(pincode) : null),
    [country, pincode]
  );

  const quote = useMemo(
    () =>
      calculateShippingQuote({
        country,
        pincode,
        weightKg: Number(weightKg) || 1,
        orderValueInr: Number(orderValueInr) || 0,
        speed: country !== "IN" ? "international" : speed,
      }),
    [country, pincode, weightKg, orderValueInr, speed]
  );

  const flash = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 3500);
  };

  const handleCreateShipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote.allowed) {
      flash(quote.restrictionNote || "Cannot create shipment due to shipping restrictions.");
      return;
    }

    const prefix = courier.slice(0, 3).toUpperCase();
    const record: ShipmentRecord = {
      awb: `${prefix}-${Date.now().toString().slice(-8)}`,
      orderId: orderId.trim() || `ORD-${Date.now().toString().slice(-5)}`,
      courier: country !== "IN" ? "DHL Express Worldwide" : courier,
      speed: country !== "IN" ? "international" : speed,
      destination: destination.trim(),
      pincode: country === "IN" ? pincode.trim() : country,
      country,
      weightKg: Number(weightKg) || 1,
      shippingFeeInr: quote.feeInr,
      pickupDate,
      pickupSlot,
      status: "Pickup Scheduled",
      attempts: [],
      createdAt: new Date().toISOString(),
    };

    saveShipments([record, ...shipments]);
    flash(`Shipment ${record.awb} created & pickup scheduled!`);
    setTab("shipments");
  };

  const handleLogAttempt = (
    awb: string,
    status: DeliveryAttempt["status"],
    note: string
  ) => {
    const next: ShipmentRecord[] = shipments.map((s) => {
      if (s.awb !== awb) return s;
      const attempt: DeliveryAttempt = {
        attemptNo: s.attempts.length + 1,
        timestamp: new Date().toLocaleString("en-IN"),
        status,
        note,
      };
      return {
        ...s,
        status: status === "Delivered" ? "Delivered" : "Out for Delivery",
        attempts: [attempt, ...s.attempts],
      };
    });
    saveShipments(next);
    flash(`Logged delivery attempt for ${awb}: ${status}`);
  };

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Shipping & Delivery Hub</h1>
          <p className="text-sm text-gray-500 mt-1">
            Pincode serviceability, live rate calculator, courier labels, delivery attempts & return pickups.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ["calculator", "Rate & Pincode Checker"],
              ["shipments", `Labels & Tracking (${shipments.length})`],
              ["returns_pickup", `Return Pickups (${returnPickups.length})`],
              ["partners", "Couriers & Restrictions"],
            ] as [ShippingTab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition ${
                tab === key ? "bg-black text-white" : "border hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm font-medium">
          {msg}
        </div>
      )}

      {/* TAB 1: RATE CALCULATOR, PINCODE SERVICEABILITY & LABEL CREATOR */}
      {tab === "calculator" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="border rounded-2xl p-6 bg-white space-y-4 text-sm">
            <h2 className="text-xl font-bold">Shipping Cost & Pincode Checker</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Destination Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="IN">India (Domestic)</option>
                  {Object.entries(INTERNATIONAL_ZONES).map(([code, z]) => (
                    <option key={code} value={code}>
                      {z.label} (International)
                    </option>
                  ))}
                </select>
              </div>

              {country === "IN" && (
                <div>
                  <label className="block text-xs font-medium mb-1">6-Digit Pincode</label>
                  <input
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="e.g. 560038"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium mb-1">Parcel Weight (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Order Value (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={orderValueInr}
                  onChange={(e) => setOrderValueInr(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>

            {country === "IN" && (
              <div>
                <label className="block text-xs font-medium mb-1.5">Delivery Speed</label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {(
                    [
                      ["standard", "Standard"],
                      ["express", "Express"],
                      ["same_day", "Same-Day"],
                    ] as [DeliverySpeed, string][]
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSpeed(key)}
                      className={`py-2 rounded-lg border font-medium ${
                        speed === key ? "bg-black text-white border-black" : "hover:border-black"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Serviceability Status */}
            {serviceability && (
              <div
                className={`p-3 rounded-xl text-xs border ${
                  serviceability.valid
                    ? "bg-blue-50 border-blue-200 text-blue-900"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                <p className="font-semibold">Zone: {serviceability.zone}</p>
                <p>{serviceability.message}</p>
              </div>
            )}

            {/* Live Quote Output */}
            <div className="border rounded-xl p-4 bg-gray-50 space-y-1.5">
              {quote.allowed ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Estimated Shipping Fee</span>
                    <span className="text-xl font-bold">
                      {quote.feeInr === 0 ? "FREE" : `₹${quote.feeInr}`}
                    </span>
                  </div>
                  {quote.freeApplied && (
                    <p className="text-xs text-green-700 font-medium">
                      ✓ Free Shipping Rule applied (Order ≥ ₹{FREE_SHIPPING_THRESHOLD_INR})
                    </p>
                  )}
                  <p className="text-xs text-gray-600">
                    <strong>Estimated Delivery:</strong> {quote.etaText}
                  </p>
                  <p className="text-xs text-gray-600">
                    <strong>Recommended Partner:</strong> {quote.recommendedCourier}
                  </p>
                </>
              ) : (
                <p className="text-xs text-red-600 font-medium">✕ {quote.restrictionNote}</p>
              )}
            </div>
          </section>

          {/* Generate Shipping Label & Schedule Pickup */}
          <form onSubmit={handleCreateShipment} className="border rounded-2xl p-6 bg-white space-y-4 text-sm h-fit">
            <h2 className="text-xl font-bold">Generate Label & Schedule Pickup</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                required
                placeholder="Order ID"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="border rounded-lg px-3 py-2"
              />
              <select
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
                className="border rounded-lg px-3 py-2"
              >
                {COURIER_PARTNERS.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <input
                required
                placeholder="Destination Address"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="sm:col-span-2 border rounded-lg px-3 py-2"
              />
              <input
                required
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="border rounded-lg px-3 py-2"
              />
              <select
                value={pickupSlot}
                onChange={(e) => setPickupSlot(e.target.value)}
                className="border rounded-lg px-3 py-2"
              >
                <option>Morning (9 AM – 12 PM)</option>
                <option>Afternoon (12 PM – 4 PM)</option>
                <option>Evening (4 PM – 8 PM)</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={!quote.allowed}
              className="w-full py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-300"
            >
              Generate AWB Label & Schedule Pickup
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: SHIPMENTS, LABELS & DELIVERY ATTEMPT UPDATES */}
      {tab === "shipments" && (
        <section className="space-y-4">
          {shipments.map((s) => (
            <div key={s.awb} className="border rounded-2xl p-5 bg-white space-y-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base">{s.awb}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 font-semibold">
                      {s.status}
                    </span>
                    <span className="text-xs uppercase text-gray-500">{s.speed.replace("_", " ")}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {s.courier} • Order: <span className="font-mono">{s.orderId}</span> • {s.destination} ({s.pincode})
                  </p>
                  <p className="text-xs text-gray-400">
                    Pickup: {s.pickupDate} ({s.pickupSlot}) • {s.weightKg} kg • Fee: ₹{s.shippingFeeInr}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    onClick={() => downloadShippingLabel(s)}
                    className="px-3.5 py-1.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800"
                  >
                    Download Label
                  </button>
                  <Link
                    href={`/track?order=${encodeURIComponent(s.orderId)}`}
                    className="px-3.5 py-1.5 border rounded-lg hover:bg-gray-50"
                  >
                    Track Shipment
                  </Link>
                </div>
              </div>

              {/* Delivery Attempt Updates */}
              <div className="border-t pt-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Delivery Attempt Updates ({s.attempts.length})
                  </p>
                  {s.status !== "Delivered" && (
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      <button
                        onClick={() =>
                          handleLogAttempt(
                            s.awb,
                            "Attempted - Customer Unavailable",
                            "Customer did not answer door/call."
                          )
                        }
                        className="px-2.5 py-1 border rounded hover:bg-gray-50"
                      >
                        + Log Failed Attempt
                      </button>
                      <button
                        onClick={() =>
                          handleLogAttempt(s.awb, "Delivered", "Handed over to recipient.")
                        }
                        className="px-2.5 py-1 bg-green-700 text-white rounded hover:bg-green-800"
                      >
                        ✓ Mark Delivered
                      </button>
                    </div>
                  )}
                </div>

                {s.attempts.length === 0 ? (
                  <p className="text-xs text-gray-400">No delivery attempts logged yet.</p>
                ) : (
                  <ul className="space-y-1.5 text-xs">
                    {s.attempts.map((a) => (
                      <li key={a.attemptNo} className="bg-gray-50 p-2.5 rounded-lg flex justify-between gap-2">
                        <span>
                          <strong>Attempt #{a.attemptNo}:</strong> {a.status} — {a.note}
                        </span>
                        <span className="text-gray-400 shrink-0">{a.timestamp}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* TAB 3: RETURN PICKUP MANAGEMENT */}
      {tab === "returns_pickup" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Reverse / Return Pickup Management</h2>
            <Link href="/returns" className="text-xs underline">
              Open Returns Portal →
            </Link>
          </div>

          {returnPickups.length === 0 ? (
            <div className="border rounded-2xl p-10 text-center text-sm text-gray-500 bg-white">
              No return pickups scheduled yet. Submit a return on <Link href="/returns" className="underline text-black">/returns</Link> to manage its pickup here.
            </div>
          ) : (
            <div className="space-y-3">
              {returnPickups.map((r) => (
                <div key={r.id} className="border rounded-xl p-4 bg-white flex flex-wrap items-center justify-between gap-4 text-sm">
                  <div>
                    <p className="font-mono font-bold">{r.id} • Order: {r.orderId}</p>
                    <p className="text-xs text-gray-600">
                      Pickup: {r.pickupDate || "Not scheduled"} ({r.pickupSlot || "—"}) • Reason: {r.reason}
                    </p>
                  </div>
                  <button
                    disabled={r.stageIndex >= 2}
                    onClick={() => {
                      saveReturns(
                        returnPickups.map((x) => (x.id === r.id ? { ...x, stageIndex: 2 } : x))
                      );
                      flash(`Reverse pickup completed for ${r.id}`);
                    }}
                    className="px-4 py-1.5 bg-black text-white rounded-lg text-xs font-medium disabled:bg-gray-300"
                  >
                    {r.stageIndex >= 2 ? "Picked Up ✓" : "Mark Reverse Picked Up"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 4: COURIER PARTNERS & SHIPPING RESTRICTIONS */}
      {tab === "partners" && (
        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-xl font-bold">Integrated Courier Partners</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {COURIER_PARTNERS.map((c) => (
                <div key={c.id} className="border rounded-2xl p-5 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">{c.name}</h3>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 font-semibold">
                      {c.apiStatus}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Base: ₹{c.baseRateInr} + ₹{c.perKgInr}/kg • ETA: {c.etaDays}
                  </p>
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    {c.supportsCod && <span className="px-2 py-0.5 rounded bg-gray-100">COD</span>}
                    {c.supportsSameDay && <span className="px-2 py-0.5 rounded bg-gray-100">Same-Day</span>}
                    {c.supportsInternational && <span className="px-2 py-0.5 rounded bg-gray-100">International</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="border rounded-2xl p-6 bg-white space-y-3">
            <h2 className="text-xl font-bold">Shipping Restrictions & Free Shipping Rules</h2>
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
              <li>
                <strong>Free Shipping Rule:</strong> Standard domestic shipping is FREE on all orders of ₹{FREE_SHIPPING_THRESHOLD_INR} or more.
              </li>
              {SHIPPING_RESTRICTIONS.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </main>
  );
}