export type DeliverySpeed = "same_day" | "express" | "standard" | "international";

export interface CourierPartner {
  id: string;
  name: string;
  apiStatus: "Connected" | "Sandbox";
  supportsCod: boolean;
  supportsSameDay: boolean;
  supportsInternational: boolean;
  baseRateInr: number;
  perKgInr: number;
  etaDays: string;
}

export interface DeliveryAttempt {
  attemptNo: number;
  timestamp: string;
  status: "Attempted - Customer Unavailable" | "Attempted - Address Issue" | "Rescheduled" | "Delivered";
  note: string;
}

export interface ShipmentRecord {
  awb: string;
  orderId: string;
  courier: string;
  speed: DeliverySpeed;
  destination: string;
  pincode: string;
  country: string;
  weightKg: number;
  shippingFeeInr: number;
  pickupDate: string;
  pickupSlot: string;
  status: "Label Generated" | "Pickup Scheduled" | "In Transit" | "Out for Delivery" | "Delivered";
  attempts: DeliveryAttempt[];
  createdAt: string;
}

export const COURIER_PARTNERS: CourierPartner[] = [
  {
    id: "bluedart",
    name: "BlueDart Express",
    apiStatus: "Connected",
    supportsCod: true,
    supportsSameDay: true,
    supportsInternational: false,
    baseRateInr: 79,
    perKgInr: 40,
    etaDays: "1–3 days",
  },
  {
    id: "delhivery",
    name: "Delhivery Surface & Air",
    apiStatus: "Connected",
    supportsCod: true,
    supportsSameDay: false,
    supportsInternational: false,
    baseRateInr: 59,
    perKgInr: 30,
    etaDays: "3–6 days",
  },
  {
    id: "xpressbees",
    name: "XpressBees",
    apiStatus: "Connected",
    supportsCod: true,
    supportsSameDay: true,
    supportsInternational: false,
    baseRateInr: 69,
    perKgInr: 35,
    etaDays: "2–4 days",
  },
  {
    id: "dhl",
    name: "DHL Express Worldwide",
    apiStatus: "Sandbox",
    supportsCod: false,
    supportsSameDay: false,
    supportsInternational: true,
    baseRateInr: 1499,
    perKgInr: 650,
    etaDays: "5–9 days",
  },
];

export const SHIPPING_RESTRICTIONS = [
  "Maximum parcel weight: 20 kg per box (heavier items require freight shipping).",
  "Flammable liquids, aerosols, and loose lithium-ion batteries are restricted on Air Express & International routes.",
  "Same-day delivery is available only in Bengaluru (560xxx), Mumbai (400xxx), Delhi NCR (110xxx), and Hyderabad (500xxx) for orders placed before 2:00 PM.",
  "Cash on Delivery (COD) is unavailable for International orders and orders above ₹25,000.",
  "Remote / restricted pin codes (e.g. 799xxx, 194xxx) require +2 extra business days and prepaid payment only.",
];

export const INTERNATIONAL_ZONES: Record<string, { label: string; baseInr: number; perKgInr: number; days: string }> = {
  US: { label: "United States", baseInr: 1699, perKgInr: 750, days: "6–9 business days" },
  UK: { label: "United Kingdom", baseInr: 1599, perKgInr: 700, days: "5–8 business days" },
  AE: { label: "United Arab Emirates", baseInr: 1199, perKgInr: 500, days: "4–6 business days" },
  SG: { label: "Singapore", baseInr: 1099, perKgInr: 450, days: "4–6 business days" },
  AU: { label: "Australia", baseInr: 1799, perKgInr: 800, days: "7–10 business days" },
};

export const FREE_SHIPPING_THRESHOLD_INR = 999;

export function checkPincodeServiceability(pincode: string): {
  valid: boolean;
  serviceable: boolean;
  zone: string;
  sameDayAvailable: boolean;
  codAvailable: boolean;
  standardEta: string;
  expressEta: string;
  message: string;
} {
  const clean = pincode.trim();
  if (!/^[1-9][0-9]{5}$/.test(clean)) {
    return {
      valid: false,
      serviceable: false,
      zone: "Invalid",
      sameDayAvailable: false,
      codAvailable: false,
      standardEta: "—",
      expressEta: "—",
      message: "Enter a valid 6-digit Indian pincode.",
    };
  }

  const prefix3 = clean.slice(0, 3);
  const metroPrefixes = ["560", "400", "110", "500"];
  const remotePrefixes = ["799", "194", "744"];

  if (remotePrefixes.includes(prefix3)) {
    return {
      valid: true,
      serviceable: true,
      zone: "Remote / Restricted Zone",
      sameDayAvailable: false,
      codAvailable: false,
      standardEta: "7–10 business days",
      expressEta: "4–6 business days",
      message: "Serviceable (Prepaid only — COD & Same-Day unavailable in remote zones).",
    };
  }

  if (metroPrefixes.includes(prefix3)) {
    return {
      valid: true,
      serviceable: true,
      zone: "Metro Hub",
      sameDayAvailable: true,
      codAvailable: true,
      standardEta: "2–4 business days",
      expressEta: "1–2 business days",
      message: "Serviceable! Same-Day, Express, Standard & COD are all available.",
    };
  }

  return {
    valid: true,
    serviceable: true,
    zone: "Standard Domestic",
    sameDayAvailable: false,
    codAvailable: true,
    standardEta: "4–6 business days",
    expressEta: "2–3 business days",
    message: "Serviceable! Express, Standard & COD are available.",
  };
}

export function calculateShippingQuote(params: {
  country: string;
  pincode: string;
  weightKg: number;
  orderValueInr: number;
  speed: DeliverySpeed;
}): {
  allowed: boolean;
  feeInr: number;
  freeApplied: boolean;
  etaText: string;
  recommendedCourier: string;
  restrictionNote?: string;
} {
  const { country, pincode, weightKg, orderValueInr, speed } = params;
  const safeWeight = Math.max(0.5, weightKg);

  if (safeWeight > 20) {
    return {
      allowed: false,
      feeInr: 0,
      freeApplied: false,
      etaText: "—",
      recommendedCourier: "—",
      restrictionNote: "Weight exceeds 20 kg parcel limit. Split into multiple shipments.",
    };
  }

  if (country !== "IN" || speed === "international") {
    const zone = INTERNATIONAL_ZONES[country] || INTERNATIONAL_ZONES.US;
    const fee = Math.round(zone.baseInr + Math.max(0, safeWeight - 1) * zone.perKgInr);
    return {
      allowed: true,
      feeInr: fee,
      freeApplied: false,
      etaText: zone.days,
      recommendedCourier: "DHL Express Worldwide",
    };
  }

  const check = checkPincodeServiceability(pincode);
  if (!check.valid) {
    return {
      allowed: false,
      feeInr: 0,
      freeApplied: false,
      etaText: "—",
      recommendedCourier: "—",
      restrictionNote: check.message,
    };
  }

  if (speed === "same_day") {
    if (!check.sameDayAvailable) {
      return {
        allowed: false,
        feeInr: 0,
        freeApplied: false,
        etaText: "—",
        recommendedCourier: "—",
        restrictionNote: "Same-day delivery is only available in Metro Hubs (560xxx, 400xxx, 110xxx, 500xxx).",
      };
    }
    return {
      allowed: true,
      feeInr: Math.round(199 + Math.max(0, safeWeight - 1) * 40),
      freeApplied: false,
      etaText: "Today by 9:00 PM",
      recommendedCourier: "BlueDart Express",
    };
  }

  if (speed === "express") {
    return {
      allowed: true,
      feeInr: Math.round(149 + Math.max(0, safeWeight - 1) * 35),
      freeApplied: false,
      etaText: check.expressEta,
      recommendedCourier: "BlueDart Express",
    };
  }

  // Standard domestic with Free Shipping Rule (≥ ₹999)
  const qualifiesFree = orderValueInr >= FREE_SHIPPING_THRESHOLD_INR;
  const rawFee = Math.round(79 + Math.max(0, safeWeight - 1) * 30);
  return {
    allowed: true,
    feeInr: qualifiesFree ? 0 : rawFee,
    freeApplied: qualifiesFree,
    etaText: check.standardEta,
    recommendedCourier: "Delhivery Surface & Air",
  };
}

const SHIPMENTS_KEY = "storefront_shipments_v1";

const INITIAL_SHIPMENTS: ShipmentRecord[] = [
  {
    awb: "BLD-88421094",
    orderId: "ORD-88421",
    courier: "BlueDart Express",
    speed: "express",
    destination: "Indiranagar, Bengaluru, Karnataka",
    pincode: "560038",
    country: "IN",
    weightKg: 1.2,
    shippingFeeInr: 149,
    pickupDate: "2026-11-21",
    pickupSlot: "Morning (9 AM – 12 PM)",
    status: "Out for Delivery",
    attempts: [
      {
        attemptNo: 1,
        timestamp: "21 Nov 2026, 11:20 AM",
        status: "Attempted - Customer Unavailable",
        note: "Gate closed; re-attempt scheduled for evening.",
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
];

const INITIAL_JSON = JSON.stringify(INITIAL_SHIPMENTS);

export function subscribeShipments(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener("shipments-updated", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("shipments-updated", cb);
  };
}

export function getShipmentsSnapshot(): string {
  return localStorage.getItem(SHIPMENTS_KEY) ?? INITIAL_JSON;
}

export function getServerShipmentsSnapshot(): string {
  return INITIAL_JSON;
}

export function parseShipments(raw: string): ShipmentRecord[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_SHIPMENTS;
  } catch {
    return INITIAL_SHIPMENTS;
  }
}

export function saveShipments(list: ShipmentRecord[]) {
  localStorage.setItem(SHIPMENTS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("shipments-updated"));
}

export function downloadShippingLabel(s: ShipmentRecord) {
  const html = `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Shipping Label ${s.awb}</title></head>
<body style="font-family:monospace;max-width:460px;margin:30px auto;border:2px solid #000;padding:20px">
  <div style="display:flex;justify-content:space-between;border-bottom:2px solid #000;padding-bottom:10px">
    <strong>STOREFRONT LOGISTICS</strong>
    <span>${s.speed.toUpperCase()}</span>
  </div>
  <h2 style="text-align:center;letter-spacing:3px;margin:16px 0;border:1px dashed #000;padding:10px">
    ||| |||| || ||| ${s.awb} ||| || ||||
  </h2>
  <p><strong>COURIER:</strong> ${s.courier}</p>
  <p><strong>ORDER ID:</strong> ${s.orderId}</p>
  <p><strong>WEIGHT:</strong> ${s.weightKg} kg &nbsp;|&nbsp; <strong>FEE:</strong> ₹${s.shippingFeeInr}</p>
  <hr />
  <p><strong>SHIP TO:</strong><br/>${s.destination}<br/>PIN: ${s.pincode} (${s.country})</p>
  <p><strong>FROM:</strong><br/>Zeno Fulfillment Hub, Bengaluru 560001, India</p>
  <hr />
  <p style="font-size:11px">Pickup: ${s.pickupDate} (${s.pickupSlot}) • Generated ${new Date(s.createdAt).toLocaleString("en-IN")}</p>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `shipping-label-${s.awb}.html`;
  a.click();
  URL.revokeObjectURL(url);
}