"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/api";
import {
  downloadPaymentReceipt,
  getPaymentsSnapshot,
  getServerPaymentsSnapshot,
  parseTransactions,
  processAutoRefund,
  subscribePayments,
} from "@/lib/payments";

export default function PaymentHistoryPage() {
  const raw = useSyncExternalStore(subscribePayments, getPaymentsSnapshot, getServerPaymentsSnapshot);
  const transactions = useMemo(() => parseTransactions(raw), [raw]);
  const [refundMsg, setRefundMsg] = useState("");

  const handleAutoRefund = (txId: string) => {
    const refunded = processAutoRefund(txId);
    if (refunded) {
      setRefundMsg(`Auto-refund ${refunded.refundId} processed for ${txId}.`);
      setTimeout(() => setRefundMsg(""), 4000);
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Transaction History</h1>
          <p className="text-sm text-gray-500 mt-1">
            View receipts, retry failed payments, or trigger automatic refunds.
          </p>
        </div>
        <Link href="/" className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
          Back to Store
        </Link>
      </div>

      {refundMsg && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm font-medium">
          {refundMsg}
        </div>
      )}

      {transactions.length === 0 ? (
        <div className="border rounded-2xl p-12 text-center text-gray-500">
          No payment transactions yet. Complete a checkout to see your history here.
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div
              key={tx.txId}
              className="border rounded-xl p-5 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold">{tx.txId}</span>
                  <span
                    className={`text-[11px] uppercase px-2.5 py-0.5 rounded-full font-semibold ${
                      tx.status === "success"
                        ? "bg-green-100 text-green-800"
                        : tx.status === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : tx.status === "refunded"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {tx.status}
                  </span>
                </div>
                <p className="text-gray-600">
                  {tx.methodLabel} • {tx.details}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(tx.createdAt).toLocaleString("en-IN")}
                  {tx.orderId ? ` • Order: ${tx.orderId.slice(0, 8)}` : ""}
                  {tx.refundId ? ` • Refund: ${tx.refundId}` : ""}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-base mr-2">{formatPrice(tx.amountMinor)}</span>

                {tx.status === "failed" ? (
                  <Link
                    href="/checkout"
                    className="px-3.5 py-1.5 bg-black text-white rounded-lg text-xs font-medium"
                  >
                    Retry Payment
                  </Link>
                ) : (
                  <button
                    onClick={() => downloadPaymentReceipt(tx)}
                    className="px-3.5 py-1.5 border rounded-lg text-xs font-medium hover:bg-gray-50"
                  >
                    Download Receipt
                  </button>
                )}

                {(tx.status === "success" || tx.status === "pending") && tx.method !== "cod" && (
                  <button
                    onClick={() => handleAutoRefund(tx.txId)}
                    className="px-3.5 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50"
                  >
                    Auto-Refund
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}