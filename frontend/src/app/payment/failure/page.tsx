"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/api";
import {
  getPaymentsSnapshot,
  getServerPaymentsSnapshot,
  parseTransactions,
  subscribePayments,
} from "@/lib/payments";

const subscribeUrl = (cb: () => void) => {
  window.addEventListener("popstate", cb);
  return () => window.removeEventListener("popstate", cb);
};
const getTxParam = () => new URLSearchParams(window.location.search).get("tx") ?? "";
const getServerTxParam = () => "";

export default function PaymentFailurePage() {
  const txId = useSyncExternalStore(subscribeUrl, getTxParam, getServerTxParam);
  const raw = useSyncExternalStore(subscribePayments, getPaymentsSnapshot, getServerPaymentsSnapshot);

  const tx = useMemo(
    () => parseTransactions(raw).find((t) => t.txId === txId) || null,
    [raw, txId]
  );

  return (
    <main className="max-w-2xl mx-auto px-6 py-14">
      <div className="border rounded-2xl p-8 bg-white space-y-6">
        <span className="inline-block text-xs px-3 py-1 rounded-full bg-red-100 text-red-800 font-semibold">
          Payment Failed ✕
        </span>
        <h1 className="text-3xl font-bold">We couldn&apos;t complete your payment</h1>
        <p className="text-sm text-gray-600">
          Don&apos;t worry — your shopping cart items are completely safe. If any amount was debited, it will be auto-refunded within 3–5 business days.
        </p>

        {tx && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm space-y-1">
            <p><strong>Transaction ID:</strong> <span className="font-mono">{tx.txId}</span></p>
            <p><strong>Attempted Amount:</strong> {formatPrice(tx.amountMinor)}</p>
            <p><strong>Method:</strong> {tx.methodLabel}</p>
            <p className="text-red-700"><strong>Reason:</strong> {tx.failureReason || "Transaction declined"}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/checkout"
            className="px-6 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800"
          >
            Retry Payment
          </Link>
          <Link href="/payments" className="px-5 py-2.5 border rounded-lg text-sm font-medium hover:bg-gray-50">
            View Transaction History
          </Link>
        </div>
      </div>
    </main>
  );
}