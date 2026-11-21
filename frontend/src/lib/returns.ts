import { PaymentTransaction } from "@/lib/payments";
import {
  NotificationItem,
  getNotificationsSnapshot,
  parseNotifications,
  saveNotifications,
} from "@/lib/notifications";

export type ReturnActionType = "return" | "replacement" | "exchange" | "refund" | "cancel";
export type RefundMethod = "original_payment" | "store_credit";
export type RefundTrackStatus = "Not Applicable" | "Pending QC" | "Initiated" | "Credited";

export interface ReturnRecord {
  id: string;
  orderId: string;
  txId: string;
  type: ReturnActionType;
  reason: string;
  exchangeVariant?: string;
  images: string[];
  pickupDate?: string;
  pickupSlot?: string;
  refundMethod?: RefundMethod;
  amountMinor: number;
  stageIndex: number; // 0: Requested, 1: Pickup Scheduled, 2: Picked Up, 3: QC Passed, 4: Completed
  refundStatus: RefundTrackStatus;
  createdAt: string;
}

export const RETURN_STAGES = [
  "Requested",
  "Pickup Scheduled",
  "Picked Up",
  "Quality Check Passed",
  "Completed",
] as const;

const RETURNS_KEY = "storefront_returns_v2";
const EMPTY_RETURNS = "[]";

export function subscribeReturns(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener("returns-updated", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("returns-updated", cb);
  };
}

export function getReturnsSnapshot(): string {
  return localStorage.getItem(RETURNS_KEY) ?? EMPTY_RETURNS;
}

export function getServerReturnsSnapshot(): string {
  return EMPTY_RETURNS;
}

export function parseReturns(raw: string): ReturnRecord[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveReturns(list: ReturnRecord[]) {
  localStorage.setItem(RETURNS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("returns-updated"));
}

export function checkReturnEligibility(order: PaymentTransaction): {
  eligible: boolean;
  daysLeft: number;
  message: string;
} {
  if (order.status === "failed") {
    return { eligible: false, daysLeft: 0, message: "Failed transactions are not eligible for return." };
  }
  if (order.status === "refunded") {
    return { eligible: false, daysLeft: 0, message: "This order has already been refunded." };
  }
  const daysSinceOrder = Math.floor(
    (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysLeft = Math.max(0, 7 - daysSinceOrder);
  if (daysLeft === 0) {
    return { eligible: false, daysLeft: 0, message: "7-day return window has expired." };
  }
  return {
    eligible: true,
    daysLeft,
    message: `Eligible for return/exchange (${daysLeft} day${daysLeft === 1 ? "" : "s"} left in 7-day window).`,
  };
}

export function creditStoreWallet(amountMinor: number) {
  const key = "storefront_profile_prefs_v2";
  try {
    const raw = localStorage.getItem(key);
    const prefs = raw ? JSON.parse(raw) : { walletMinor: 25000 };
    prefs.walletMinor = (Number(prefs.walletMinor) || 0) + amountMinor;
    localStorage.setItem(key, JSON.stringify(prefs));
    window.dispatchEvent(new Event("prefs-updated"));
  } catch {
    // ignore storage errors
  }
}

export function sendAutoRefundNotification(
  orderId: string,
  amountMinor: number,
  method: RefundMethod
) {
  const amount = `₹${(amountMinor / 100).toFixed(2)}`;
  const dest =
    method === "store_credit"
      ? "your Zeno Wallet (instant store credit)"
      : "your original payment method (3–5 business days)";

  const item: NotificationItem = {
    id: `ntf-rfnd-${Date.now()}`,
    event: "Automatic Refund Notification",
    title: `Refund of ${amount} Processed`,
    message: `Your refund for order ${orderId} has been credited to ${dest}.`,
    category: "orders",
    channels: ["email", "sms", "whatsapp", "push"],
    read: false,
    createdAt: new Date().toISOString(),
    link: "/returns",
  };

  const current = parseNotifications(getNotificationsSnapshot());
  saveNotifications([item, ...current]);
}