export type PaymentMethodId =
  | "upi"
  | "credit_card"
  | "debit_card"
  | "net_banking"
  | "wallet"
  | "emi"
  | "cod";

export type PaymentStatus = "success" | "pending" | "failed" | "refunded";

export interface PaymentTransaction {
  txId: string;
  orderId: string | null;
  customerName: string;
  customerEmail: string;
  method: PaymentMethodId;
  methodLabel: string;
  details: string;
  gateway: string;
  amountMinor: number;
  status: PaymentStatus;
  failureReason?: string;
  refundId?: string;
  refundedAt?: string;
  createdAt: string;
  items: { name: string; label: string; qty: number; priceMinor: number }[];
  shippingAddress: string;
}

const TX_KEY = "storefront_payments_v1";
const EMPTY_TX = "[]";

export function subscribePayments(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener("payments-updated", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("payments-updated", cb);
  };
}

export function getPaymentsSnapshot(): string {
  return localStorage.getItem(TX_KEY) ?? EMPTY_TX;
}

export function getServerPaymentsSnapshot(): string {
  return EMPTY_TX;
}

export function parseTransactions(raw: string): PaymentTransaction[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTransaction(tx: PaymentTransaction) {
  const existing = parseTransactions(getPaymentsSnapshot());
  const next = [tx, ...existing.filter((t) => t.txId !== tx.txId)];
  localStorage.setItem(TX_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("payments-updated"));
}

export function processAutoRefund(txId: string): PaymentTransaction | null {
  const existing = parseTransactions(getPaymentsSnapshot());
  let updatedTx: PaymentTransaction | null = null;
  const next = existing.map((t) => {
    if (t.txId === txId && (t.status === "success" || t.status === "pending")) {
      updatedTx = {
        ...t,
        status: "refunded",
        refundId: `RFND-${Date.now().toString().slice(-8)}`,
        refundedAt: new Date().toISOString(),
      };
      return updatedTx;
    }
    return t;
  });
  localStorage.setItem(TX_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("payments-updated"));
  return updatedTx;
}

export function downloadPaymentReceipt(tx: PaymentTransaction) {
  const amount = `₹${(tx.amountMinor / 100).toFixed(2)}`;
  const rows = tx.items
    .map(
      (i) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.name} (${i.label})</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.qty}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₹${((i.priceMinor * i.qty) / 100).toFixed(2)}</td></tr>`
    )
    .join("");

  const html = `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Receipt ${tx.txId}</title></head>
<body style="font-family:system-ui,sans-serif;max-width:680px;margin:40px auto;color:#111">
  <h1>Storefront Marketplace — Payment Receipt</h1>
  <p style="color:#555;font-size:13px">GSTIN: 29XXXXX0000X1Z5 • Bengaluru, India</p>
  <hr />
  <p><strong>Transaction ID:</strong> ${tx.txId}</p>
  <p><strong>Order ID:</strong> ${tx.orderId || "N/A"}</p>
  <p><strong>Date:</strong> ${new Date(tx.createdAt).toLocaleString("en-IN")}</p>
  <p><strong>Status:</strong> ${tx.status.toUpperCase()}</p>
  <p><strong>Customer:</strong> ${tx.customerName} (${tx.customerEmail})</p>
  <p><strong>Payment Method:</strong> ${tx.methodLabel} (${tx.details})</p>
  <p><strong>Gateway:</strong> ${tx.gateway}</p>
  <p><strong>Shipping Address:</strong> ${tx.shippingAddress}</p>
  ${tx.refundId ? `<p><strong>Refund ID:</strong> ${tx.refundId} (Auto-Refunded)</p>` : ""}
  <table style="width:100%;border-collapse:collapse;margin-top:20px">
    <thead>
      <tr style="background:#f5f5f5">
        <th style="padding:8px;text-align:left">Item</th>
        <th style="padding:8px;text-align:center">Qty</th>
        <th style="padding:8px;text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <h2 style="text-align:right;margin-top:20px">Total: ${amount}</h2>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `receipt-${tx.txId}.html`;
  a.click();
  URL.revokeObjectURL(url);
}