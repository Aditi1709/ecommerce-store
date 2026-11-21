"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/api";
import {
  downloadPaymentReceipt,
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

export default function PaymentSuccessPage() {
  const txId = useSyncExternalStore(subscribeUrl, getTxParam, getServerTxParam);
  const raw = useSyncExternalStore(subscribePayments, getPaymentsSnapshot, getServerPaymentsSnapshot);

  const tx = useMemo(
    () => parseTransactions(raw).find((t) => t.txId === txId) || null,
    [raw, txId]
  );

  return (
    <main className="max-w-2xl mx-auto px-6 py-14">
      <div className="border rounded-2xl p-8 bg-white space-y-6">
        <span className="inline-block text-xs px-3 py-1 rounded-full bg-green-100 text-green-800 font-semibold">
          Payment Successful ✓
        </span>
        <h1 className="text-3xl font-bold">Thank you for your payment!</h1>

        {tx ? (
          <div className="space-y-4 text-sm">
            <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
              <p><strong>Transaction ID:</strong> <span className="font-mono">{tx.txId}</span></p>
              <p><strong>Order ID:</strong> <span className="font-mono">{tx.orderId}</span></p>
              <p><strong>Amount Paid:</strong> {formatPrice(tx.amountMinor)}</p>
              <p><strong>Method:</strong> {tx.methodLabel} ({tx.details})</p>
              <p><strong>Gateway:</strong> {tx.gateway}</p>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => downloadPaymentReceipt(tx)}
                className="px-5 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800"
              >
                Download Payment Receipt
              </button>
              <Link href="/payments" className="px-5 py-2.5 border rounded-lg text-sm font-medium hover:bg-gray-50">
                Transaction History
              </Link>
              <Link href="/" className="px-5 py-2.5 border rounded-lg text-sm font-medium hover:bg-gray-50">
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Transaction record not found.</p>
        )}
      </div>
    </main>
  );
}