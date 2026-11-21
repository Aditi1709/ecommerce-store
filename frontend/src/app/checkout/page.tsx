"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/lib/api";
import { PaymentMethodId, PaymentTransaction, saveTransaction } from "@/lib/payments";

interface SavedAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
}

const ADDR_KEY = "storefront_addresses_v1";
const EMPTY_ADDR = "[]";
const EXPRESS_FEE_MINOR = 14900;

function subscribeAddresses(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener("addresses-updated", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("addresses-updated", cb);
  };
}
const getAddressesSnapshot = () => localStorage.getItem(ADDR_KEY) ?? EMPTY_ADDR;
const getServerAddressesSnapshot = () => EMPTY_ADDR;

function persistAddresses(list: SavedAddress[]) {
  localStorage.setItem(ADDR_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("addresses-updated"));
}

function isValidIndianPincode(pin: string) {
  return /^[1-9][0-9]{5}$/.test(pin.trim());
}

const METHOD_LABELS: Record<PaymentMethodId, string> = {
  upi: "UPI",
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  net_banking: "Net Banking",
  wallet: "Digital Wallet",
  emi: "EMI Payment",
  cod: "Cash on Delivery",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const {
    items,
    couponCode,
    giftWrap,
    giftMessage,
    specialInstructions,
    subtotalMinor,
    discountMinor,
    shippingMinor,
    giftWrapMinor,
    taxMinor,
    applyCoupon,
    removeCoupon,
    clearCart,
  } = useCart();

  // Account mode
  const [authMode, setAuthMode] = useState<"guest" | "login" | "signup">("guest");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMsg, setAuthMsg] = useState("");

  // Contact + OTP
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpInput, setEmailOtpInput] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpInput, setPhoneOtpInput] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);

  // Addresses
  const rawAddresses = useSyncExternalStore(
    subscribeAddresses,
    getAddressesSnapshot,
    getServerAddressesSnapshot
  );
  const savedAddresses: SavedAddress[] = useMemo(() => {
    try {
      const parsed = JSON.parse(rawAddresses);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [rawAddresses]);

  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [editingAddrId, setEditingAddrId] = useState<string | null>(null);
  const [addrLabel, setAddrLabel] = useState("Home");
  const [addrFullName, setAddrFullName] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrPincode, setAddrPincode] = useState("");

  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [billingAddress, setBillingAddress] = useState("");
  const [deliveryOption, setDeliveryOption] = useState<"standard" | "express">("standard");
  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState("");

  // 7 Payment Methods state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("upi");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [bankName, setBankName] = useState("HDFC Bank");
  const [walletName, setWalletName] = useState("PhonePe Wallet");
  const [emiBank, setEmiBank] = useState("HDFC Bank");
  const [emiMonths, setEmiMonths] = useState(6);
  const [gatewayMode, setGatewayMode] = useState<"success" | "pending" | "failed">("success");

  // Submission lock
  const [submitting, setSubmitting] = useState(false);
  const submitLockRef = useRef(false);
  const [error, setError] = useState("");

  const activeName = user?.name || guestName;
  const activeEmail = user?.email || guestEmail;
  const activeAddress =
    savedAddresses.find((a) => a.id === selectedAddressId) || savedAddresses[0] || null;

  const finalShippingMinor = deliveryOption === "express" ? EXPRESS_FEE_MINOR : shippingMinor;
  const taxableMinor = Math.max(0, subtotalMinor - discountMinor);
  const finalTotalMinor = taxableMinor + taxMinor + finalShippingMinor + giftWrapMinor;
  const cgstMinor = Math.round(taxMinor / 2);
  const sgstMinor = taxMinor - cgstMinor;

  const estimatedDate = useMemo(() => {
    const fmt = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    };
    return deliveryOption === "express" ? `${fmt(1)} – ${fmt(2)}` : `${fmt(4)} – ${fmt(6)}`;
  }, [deliveryOption]);

  const handleInlineAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMsg("");
    const endpoint = authMode === "login" ? "login" : "register";
    const body =
      authMode === "login"
        ? { email: authEmail, password: authPassword }
        : { name: authName, email: authEmail, password: authPassword, role: "user" };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Authentication failed");
      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
        window.location.reload();
      }
    } catch (err: unknown) {
      setAuthMsg(err instanceof Error ? err.message : "Auth error");
    }
  };

  const openNewAddressForm = () => {
    setEditingAddrId(null);
    setAddrLabel("Home");
    setAddrFullName(activeName);
    setAddrPhone(phone);
    setAddrLine1("");
    setAddrCity("");
    setAddrState("");
    setAddrPincode("");
    setShowAddrForm(true);
  };

  const openEditAddressForm = (addr: SavedAddress) => {
    setEditingAddrId(addr.id);
    setAddrLabel(addr.label);
    setAddrFullName(addr.fullName);
    setAddrPhone(addr.phone);
    setAddrLine1(addr.line1);
    setAddrCity(addr.city);
    setAddrState(addr.state);
    setAddrPincode(addr.pincode);
    setShowAddrForm(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidIndianPincode(addrPincode)) {
      setError("Please enter a valid 6-digit Indian pincode.");
      return;
    }
    setError("");
    const entry: SavedAddress = {
      id: editingAddrId || `addr-${Date.now()}`,
      label: addrLabel || "Home",
      fullName: addrFullName,
      phone: addrPhone,
      line1: addrLine1,
      city: addrCity,
      state: addrState,
      pincode: addrPincode.trim(),
    };
    const next = editingAddrId
      ? savedAddresses.map((a) => (a.id === editingAddrId ? entry : a))
      : [entry, ...savedAddresses];
    persistAddresses(next);
    setSelectedAddressId(entry.id);
    setShowAddrForm(false);
    setEditingAddrId(null);
  };

  const handleDeleteAddress = (id: string) => {
    const next = savedAddresses.filter((a) => a.id !== id);
    persistAddresses(next);
    if (selectedAddressId === id) setSelectedAddressId(next[0]?.id || "");
  };

  const getPaymentDetails = (): { valid: boolean; error?: string; details: string; ref: string | null } => {
    if (paymentMethod === "upi") {
      return { valid: true, details: "YouPI-PG Dynamic UPI Checkout", ref: "YOUPI-PENDING" };
    }
    if (paymentMethod === "credit_card" || paymentMethod === "debit_card") {
      const digits = cardNumber.replace(/\D/g, "");
      if (digits.length < 12 || !cardExpiry.trim() || cardCvv.trim().length < 3) {
        return { valid: false, error: "Enter valid card number, expiry (MM/YY), and CVV.", details: "", ref: null };
      }
      const masked = `•••• ${digits.slice(-4)}`;
      return { valid: true, details: `${cardName || "Card"} (${masked})`, ref: `CARD-${digits.slice(-4)}` };
    }
    if (paymentMethod === "net_banking") {
      return { valid: true, details: `Net Banking — ${bankName}`, ref: `NB-${bankName.slice(0, 4).toUpperCase()}` };
    }
    if (paymentMethod === "wallet") {
      return { valid: true, details: walletName, ref: `WAL-${walletName.slice(0, 4).toUpperCase()}` };
    }
    if (paymentMethod === "emi") {
      const monthly = Math.round(finalTotalMinor / emiMonths);
      return {
        valid: true,
        details: `${emiBank} • ${emiMonths} months @ ${formatPrice(monthly)}/mo`,
        ref: `EMI-${emiMonths}M`,
      };
    }
    return { valid: true, details: "Pay on Delivery", ref: null };
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockRef.current || submitting) return;

    setError("");
    if (items.length === 0) return setError("Your cart is empty.");
    if (!activeName.trim() || !activeEmail.trim()) return setError("Please enter your name and email.");
    if (!activeAddress) return setError("Please add and select a shipping address.");
    if (!isValidIndianPincode(activeAddress.pincode)) return setError("Invalid 6-digit pincode.");
    if (!sameAsShipping && !billingAddress.trim()) return setError("Enter your billing address.");

    const payCheck = getPaymentDetails();
    if (!payCheck.valid) return setError(payCheck.error || "Invalid payment details.");

    submitLockRef.current = true;
    setSubmitting(true);

    const txId = `TXN-${Date.now().toString().slice(-8)}`;
    const formattedShipping = `${activeAddress.fullName}, ${activeAddress.line1}, ${activeAddress.city}, ${activeAddress.state} - ${activeAddress.pincode} (Ph: ${activeAddress.phone})`;
    const orderItemsSnapshot = items.map((i) => ({
      name: i.productName,
      label: i.label,
      qty: i.quantity,
      priceMinor: i.priceMinor,
    }));

    try {
      if (gatewayMode === "failed") {
        const failedTx: PaymentTransaction = {
          txId,
          orderId: null,
          customerName: activeName.trim(),
          customerEmail: activeEmail.trim(),
          method: paymentMethod,
          methodLabel: METHOD_LABELS[paymentMethod],
          details: payCheck.details,
          gateway: "Razorpay / SecurePay Gateway (TLS 1.3)",
          amountMinor: finalTotalMinor,
          status: "failed",
          failureReason: "Bank authorization declined. No amount was deducted.",
          createdAt: new Date().toISOString(),
          items: orderItemsSnapshot,
          shippingAddress: formattedShipping,
        };
        saveTransaction(failedTx);
        router.push(`/payment/failure?tx=${encodeURIComponent(txId)}`);
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}/orders/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          customer_name: activeName.trim(),
          customer_email: activeEmail.trim(),
          shipping_address: {
            label: activeAddress.label,
            full_name: activeAddress.fullName,
            phone: activeAddress.phone,
            line1: activeAddress.line1,
            city: activeAddress.city,
            state: activeAddress.state,
            pincode: activeAddress.pincode,
            ...(specialInstructions ? { note: specialInstructions } : {}),
            ...(giftWrap ? { gift_wrap: giftMessage || "Yes" } : {}),
          },
          payment_method: paymentMethod,
          payment_ref: payCheck.ref,
          items: items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data.detail)
          ? data.detail.map((d: { loc?: string[]; msg?: string }) => `${d.loc?.join(".")}: ${d.msg}`).join(" | ")
          : typeof data.detail === "string"
          ? data.detail
          : JSON.stringify(data.detail || data);
        throw new Error(msg || "Order failed. Your cart has been preserved.");
      }

      const createdOrderId = String(data.id || data.order_id || `ORD-${Date.now()}`);

      if (paymentMethod === "upi") {
        const w = window as unknown as {
          Youpi?: {
            pay: (opts: {
              order_id: string;
              amount: number;
              currency: string;
              name: string;
              description: string;
              handler: (res: { status?: string; order_id?: string; utr?: string }) => void;
              onClose?: () => void;
            }) => void;
          };
        };

        if (w.Youpi?.pay) {
          w.Youpi.pay({
            order_id: createdOrderId,
            amount: Number((finalTotalMinor / 100).toFixed(2)),
            currency: "INR",
            name: "Zeno",
            description: `Order #${createdOrderId}`,
            handler: (response) => {
              const tx: PaymentTransaction = {
                txId,
                orderId: createdOrderId,
                customerName: activeName.trim(),
                customerEmail: activeEmail.trim(),
                method: "upi",
                methodLabel: "UPI (YouPI-PG)",
                details: response.utr ? `UPI UTR: ${response.utr}` : "Paid via YouPI-PG",
                gateway: "YouPI-PG Local Gateway",
                amountMinor: finalTotalMinor,
                status: response.status === "RECONCILED" ? "success" : "pending",
                createdAt: new Date().toISOString(),
                items: orderItemsSnapshot,
                shippingAddress: formattedShipping,
              };
              saveTransaction(tx);
              clearCart();
              router.push(
                tx.status === "success"
                  ? `/payment/success?tx=${encodeURIComponent(txId)}`
                  : `/payment/pending?tx=${encodeURIComponent(txId)}`
              );
            },
            onClose: () => {
              setSubmitting(false);
              submitLockRef.current = false;
            },
          });
          return;
        }

        const fallbackStatus = gatewayMode === "pending" ? "pending" : "success";
        const tx: PaymentTransaction = {
          txId,
          orderId: createdOrderId,
          customerName: activeName.trim(),
          customerEmail: activeEmail.trim(),
          method: "upi",
          methodLabel: "UPI",
          details: "UPI Checkout Completed",
          gateway: "YouPI-PG Local Gateway",
          amountMinor: finalTotalMinor,
          status: fallbackStatus,
          createdAt: new Date().toISOString(),
          items: orderItemsSnapshot,
          shippingAddress: formattedShipping,
        };
        saveTransaction(tx);
        clearCart();
        router.push(
          fallbackStatus === "pending"
            ? `/payment/pending?tx=${encodeURIComponent(txId)}`
            : `/payment/success?tx=${encodeURIComponent(txId)}`
        );
        return;
      }

      const finalStatus = gatewayMode === "pending" ? "pending" : "success";

      const tx: PaymentTransaction = {
        txId,
        orderId: createdOrderId,
        customerName: activeName.trim(),
        customerEmail: activeEmail.trim(),
        method: paymentMethod,
        methodLabel: METHOD_LABELS[paymentMethod],
        details: payCheck.details,
        gateway: paymentMethod === "cod" ? "Direct COD" : "Razorpay / SecurePay Gateway (TLS 1.3)",
        amountMinor: finalTotalMinor,
        status: finalStatus,
        createdAt: new Date().toISOString(),
        items: orderItemsSnapshot,
        shippingAddress: formattedShipping,
      };
      saveTransaction(tx);
      clearCart();

      if (finalStatus === "pending") {
        router.push(`/payment/pending?tx=${encodeURIComponent(txId)}`);
      } else {
        router.push(`/payment/success?tx=${encodeURIComponent(txId)}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Payment failed. Your cart is safe.");
    } finally {
      setSubmitting(false);
      submitLockRef.current = false;
    }
  };

  if (items.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <div className="flex justify-center gap-3">
          <Link href="/" className="px-6 py-3 bg-black text-white rounded-lg text-sm">
            Return to Store
          </Link>
          <Link href="/payments" className="px-6 py-3 border rounded-lg text-sm">
            Payment History
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Secure Checkout</h1>
        <div className="flex items-center gap-3 text-xs">
          <span className="px-3 py-1 rounded-full bg-green-50 text-green-800 border border-green-200 font-medium">
            🔒 256-bit SSL Encrypted
          </span>
          <Link href="/payments" className="underline text-gray-600 hover:text-black">
            Payment History
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* 1. ACCOUNT */}
          <section className="border rounded-2xl p-6 bg-white space-y-4">
            <h2 className="text-lg font-bold">1. Account & Contact Verification</h2>
            {user ? (
              <div className="text-sm bg-gray-50 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-gray-500">{user.email}</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-800 font-medium">
                  Logged In ✓
                </span>
              </div>
            ) : (
              <>
                <div className="flex gap-2 border-b pb-3">
                  {(["guest", "login", "signup"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setAuthMode(mode)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-medium ${
                        authMode === mode ? "bg-black text-white" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {mode === "guest" ? "Guest Checkout" : mode === "login" ? "Login" : "Sign Up"}
                    </button>
                  ))}
                </div>
                {authMode === "guest" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <input
                      placeholder="Full Name"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="border rounded-lg px-3 py-2"
                    />
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={guestEmail}
                        onChange={(e) => {
                          setGuestEmail(e.target.value);
                          setEmailVerified(false);
                        }}
                        className="flex-1 border rounded-lg px-3 py-2"
                      />
                      {!emailVerified ? (
                        <button
                          type="button"
                          onClick={() => guestEmail.includes("@") && setEmailOtpSent(true)}
                          className="px-3 py-2 border rounded-lg text-xs hover:bg-gray-50"
                        >
                          Verify
                        </button>
                      ) : (
                        <span className="px-2 py-2 text-xs text-green-700 font-medium">Verified ✓</span>
                      )}
                    </div>
                    {emailOtpSent && !emailVerified && (
                      <div className="sm:col-span-2 flex items-center gap-2 bg-gray-50 p-2.5 rounded-lg text-xs">
                        <span>Email OTP (demo: <strong>1234</strong>):</span>
                        <input
                          value={emailOtpInput}
                          onChange={(e) => setEmailOtpInput(e.target.value)}
                          className="border rounded px-2 py-1 w-20 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (emailOtpInput === "1234") {
                              setEmailVerified(true);
                              setEmailOtpSent(false);
                            }
                          }}
                          className="px-3 py-1 bg-black text-white rounded"
                        >
                          Confirm
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleInlineAuth} className="space-y-3 text-sm max-w-md">
                    {authMode === "signup" && (
                      <input required placeholder="Full Name" value={authName} onChange={(e) => setAuthName(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
                    )}
                    <input required type="email" placeholder="Email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
                    <input required type="password" placeholder="Password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
                    <button className="px-5 py-2 bg-black text-white rounded-lg text-xs font-medium">
                      {authMode === "login" ? "Login & Continue" : "Sign Up & Continue"}
                    </button>
                    {authMsg && <p className="text-xs text-red-600">{authMsg}</p>}
                  </form>
                )}
              </>
            )}

            <div className="pt-2 border-t space-y-2 text-sm">
              <div className="flex gap-2 max-w-md">
                <input
                  type="tel"
                  placeholder="10-digit Mobile Number"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setPhoneVerified(false);
                  }}
                  className="flex-1 border rounded-lg px-3 py-2"
                />
                {!phoneVerified ? (
                  <button
                    type="button"
                    onClick={() => phone.trim().length >= 10 && setPhoneOtpSent(true)}
                    className="px-3 py-2 border rounded-lg text-xs hover:bg-gray-50"
                  >
                    Verify Phone
                  </button>
                ) : (
                  <span className="px-2 py-2 text-xs text-green-700 font-medium">Verified ✓</span>
                )}
              </div>
              {phoneOtpSent && !phoneVerified && (
                <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-lg text-xs max-w-md">
                  <span>SMS OTP (demo: <strong>1234</strong>):</span>
                  <input value={phoneOtpInput} onChange={(e) => setPhoneOtpInput(e.target.value)} className="border rounded px-2 py-1 w-20 bg-white" />
                  <button
                    type="button"
                    onClick={() => {
                      if (phoneOtpInput === "1234") {
                        setPhoneVerified(true);
                        setPhoneOtpSent(false);
                      }
                    }}
                    className="px-3 py-1 bg-black text-white rounded"
                  >
                    Confirm
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* 2. ADDRESSES */}
          <section className="border rounded-2xl p-6 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">2. Shipping & Billing Address</h2>
              <button type="button" onClick={openNewAddressForm} className="text-xs px-3 py-1.5 bg-black text-white rounded-lg">
                + Add New Address
              </button>
            </div>

            {savedAddresses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {savedAddresses.map((addr) => {
                  const isSelected = activeAddress?.id === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`border rounded-xl p-4 cursor-pointer text-sm space-y-1 ${
                        isSelected ? "border-black bg-gray-50" : "hover:border-gray-400"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase font-bold">{addr.label}</span>
                        <div className="flex gap-2 text-xs">
                          <button type="button" onClick={(e) => { e.stopPropagation(); openEditAddressForm(addr); }} className="underline text-gray-600">Edit</button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr.id); }} className="underline text-red-600">Delete</button>
                        </div>
                      </div>
                      <p className="font-semibold">{addr.fullName}</p>
                      <p className="text-xs text-gray-600">{addr.line1}, {addr.city}, {addr.state} - {addr.pincode}</p>
                      <p className="text-xs text-gray-500">Ph: {addr.phone}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No saved addresses yet. Click &ldquo;+ Add New Address&rdquo; above.</p>
            )}

            {showAddrForm && (
              <form onSubmit={handleSaveAddress} className="border rounded-xl p-4 bg-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <input required placeholder="Label (Home / Office)" value={addrLabel} onChange={(e) => setAddrLabel(e.target.value)} className="border rounded-lg px-3 py-2 bg-white" />
                <input required placeholder="Recipient Name" value={addrFullName} onChange={(e) => setAddrFullName(e.target.value)} className="border rounded-lg px-3 py-2 bg-white" />
                <input required placeholder="Phone Number" value={addrPhone} onChange={(e) => setAddrPhone(e.target.value)} className="border rounded-lg px-3 py-2 bg-white" />
                <div>
                  <input required placeholder="6-Digit Pincode" value={addrPincode} onChange={(e) => setAddrPincode(e.target.value)} className="w-full border rounded-lg px-3 py-2 bg-white" />
                  {addrPincode && (
                    <p className={`text-[11px] mt-1 ${isValidIndianPincode(addrPincode) ? "text-green-700" : "text-red-600"}`}>
                      {isValidIndianPincode(addrPincode) ? "✓ Delivery available" : "Invalid 6-digit pincode"}
                    </p>
                  )}
                </div>
                <input required placeholder="House No, Street, Area" value={addrLine1} onChange={(e) => setAddrLine1(e.target.value)} className="sm:col-span-2 border rounded-lg px-3 py-2 bg-white" />
                <input required placeholder="City" value={addrCity} onChange={(e) => setAddrCity(e.target.value)} className="border rounded-lg px-3 py-2 bg-white" />
                <input required placeholder="State" value={addrState} onChange={(e) => setAddrState(e.target.value)} className="border rounded-lg px-3 py-2 bg-white" />
                <div className="sm:col-span-2 flex gap-2">
                  <button className="px-4 py-2 bg-black text-white rounded-lg text-xs font-medium">{editingAddrId ? "Update" : "Save Address"}</button>
                  <button type="button" onClick={() => setShowAddrForm(false)} className="px-4 py-2 border rounded-lg text-xs bg-white">Cancel</button>
                </div>
              </form>
            )}

            <div className="pt-3 border-t space-y-3 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={sameAsShipping} onChange={(e) => setSameAsShipping(e.target.checked)} />
                <span>Use shipping address as billing address</span>
              </label>
              {!sameAsShipping && (
                <textarea rows={2} placeholder="Billing address..." value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
              )}
            </div>
          </section>

          {/* 3. DELIVERY OPTIONS */}
          <section className="border rounded-2xl p-6 bg-white space-y-3">
            <h2 className="text-lg font-bold">3. Delivery Options</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <label className={`border rounded-xl p-4 cursor-pointer flex justify-between ${deliveryOption === "standard" ? "border-black bg-gray-50" : ""}`}>
                <div className="flex gap-2">
                  <input type="radio" checked={deliveryOption === "standard"} onChange={() => setDeliveryOption("standard")} />
                  <div>
                    <p className="font-semibold">Standard Delivery</p>
                    <p className="text-xs text-gray-500">4–6 business days</p>
                  </div>
                </div>
                <span className="font-bold">{shippingMinor === 0 ? "FREE" : formatPrice(shippingMinor)}</span>
              </label>
              <label className={`border rounded-xl p-4 cursor-pointer flex justify-between ${deliveryOption === "express" ? "border-black bg-gray-50" : ""}`}>
                <div className="flex gap-2">
                  <input type="radio" checked={deliveryOption === "express"} onChange={() => setDeliveryOption("express")} />
                  <div>
                    <p className="font-semibold">Express Delivery</p>
                    <p className="text-xs text-gray-500">1–2 business days</p>
                  </div>
                </div>
                <span className="font-bold">{formatPrice(EXPRESS_FEE_MINOR)}</span>
              </label>
            </div>
            <p className="text-xs text-gray-600">Estimated Delivery Date: <strong>{estimatedDate}</strong></p>
          </section>

          {/* 4. ALL 7 PAYMENT METHODS + GATEWAY */}
          <section className="border rounded-2xl p-6 bg-white space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold">4. Payment Method</h2>
              <span className="text-xs text-gray-500">Powered by YouPI-PG &amp; SecurePay</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {(Object.keys(METHOD_LABELS) as PaymentMethodId[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`py-2.5 px-3 rounded-xl border font-medium transition ${
                    paymentMethod === m ? "bg-black text-white border-black" : "hover:border-black"
                  }`}
                >
                  {METHOD_LABELS[m]}
                </button>
              ))}
            </div>

            {/* Method-specific fields */}
            {paymentMethod === "upi" && (
              <div className="border rounded-xl p-4 bg-gray-50 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Instant UPI via YouPI-PG</p>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">
                    Ready
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Click <strong>Pay {formatPrice(finalTotalMinor)}</strong> below to complete your UPI checkout and confirm the order.
                </p>
              </div>
            )}

            {(paymentMethod === "credit_card" || paymentMethod === "debit_card") && (
              <div className="border rounded-xl p-4 bg-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <input
                  placeholder="Cardholder Name"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="sm:col-span-2 border rounded-lg px-3 py-2 bg-white"
                />
                <input
                  placeholder="Card Number (16 digits)"
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="sm:col-span-2 border rounded-lg px-3 py-2 bg-white font-mono"
                />
                <input
                  placeholder="Expiry (MM/YY)"
                  maxLength={5}
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  className="border rounded-lg px-3 py-2 bg-white"
                />
                <input
                  type="password"
                  placeholder="CVV"
                  maxLength={4}
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value)}
                  className="border rounded-lg px-3 py-2 bg-white"
                />
              </div>
            )}

            {paymentMethod === "net_banking" && (
              <div className="border rounded-xl p-4 bg-gray-50 space-y-2 text-sm">
                <p className="font-medium">Select Your Bank</p>
                <select value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full border rounded-lg px-3 py-2 bg-white">
                  {["HDFC Bank", "ICICI Bank", "State Bank of India (SBI)", "Axis Bank", "Kotak Mahindra Bank"].map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            )}

            {paymentMethod === "wallet" && (
              <div className="border rounded-xl p-4 bg-gray-50 space-y-2 text-sm">
                <p className="font-medium">Select Digital Wallet</p>
                <div className="grid grid-cols-2 gap-2">
                  {["PhonePe Wallet", "Paytm Wallet", "Amazon Pay", "Mobikwik"].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setWalletName(w)}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium ${
                        walletName === w ? "bg-black text-white border-black" : "bg-white"
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {paymentMethod === "emi" && (
              <div className="border rounded-xl p-4 bg-gray-50 space-y-3 text-sm">
                <select value={emiBank} onChange={(e) => setEmiBank(e.target.value)} className="w-full border rounded-lg px-3 py-2 bg-white">
                  {["HDFC Bank", "ICICI Bank", "Axis Bank", "SBI Card"].map((b) => (
                    <option key={b} value={b}>{b} No-Cost EMI</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[3, 6, 9, 12].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setEmiMonths(m)}
                      className={`p-2.5 rounded-lg border text-left ${
                        emiMonths === m ? "bg-black text-white border-black" : "bg-white"
                      }`}
                    >
                      <p className="font-bold">{m} Months</p>
                      <p className="opacity-80">{formatPrice(Math.round(finalTotalMinor / m))}/mo</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {paymentMethod === "cod" && (
              <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border">
                Pay in cash or UPI directly to the delivery partner when your order arrives.
              </p>
            )}

            {/* Sandbox Gateway Outcome Tester */}
            <div className="pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
              <span>Gateway Test Mode:</span>
              <div className="flex gap-2">
                {(["success", "pending", "failed"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setGatewayMode(m)}
                    className={`px-2.5 py-1 rounded border capitalize ${
                      gatewayMode === m ? "bg-gray-900 text-white border-gray-900" : "bg-white"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* ORDER SUMMARY */}
        <aside className="border rounded-2xl p-6 bg-white h-fit space-y-5">
          <h2 className="text-lg font-bold">Order Summary ({items.length})</h2>
          <div className="space-y-2 text-sm max-h-48 overflow-y-auto border-b pb-3">
            {items.map((i) => (
              <div key={i.variantId} className="flex justify-between gap-2">
                <span className="truncate">{i.quantity}× {i.productName}</span>
                <span className="font-medium shrink-0">{formatPrice(i.priceMinor * i.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <input placeholder="Coupon (SAVE20, FIRST100)" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-xs uppercase" />
              <button
                type="button"
                onClick={() => {
                  const res = applyCoupon(couponInput);
                  setCouponMsg(res.message);
                  if (res.ok) setCouponInput("");
                }}
                className="px-3 py-2 bg-black text-white rounded-lg text-xs font-medium"
              >
                Apply
              </button>
            </div>
            {couponCode && (
              <div className="flex justify-between text-xs bg-green-50 text-green-800 px-3 py-1.5 rounded-lg">
                <span>Coupon: <strong>{couponCode}</strong></span>
                <button onClick={removeCoupon} className="underline">Remove</button>
              </div>
            )}
            {couponMsg && <p className="text-xs text-gray-500">{couponMsg}</p>}
          </div>

          <div className="space-y-2 text-sm border-t pt-4">
            <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>{formatPrice(subtotalMinor)}</span></div>
            {discountMinor > 0 && <div className="flex justify-between text-green-700"><span>Discount ({couponCode})</span><span>−{formatPrice(discountMinor)}</span></div>}
            {giftWrapMinor > 0 && <div className="flex justify-between"><span className="text-gray-600">Gift Wrap</span><span>{formatPrice(giftWrapMinor)}</span></div>}
            <div className="flex justify-between"><span className="text-gray-600">Shipping</span><span>{finalShippingMinor === 0 ? "FREE" : formatPrice(finalShippingMinor)}</span></div>
            <div className="flex justify-between text-xs text-gray-500"><span>CGST (9%)</span><span>{formatPrice(cgstMinor)}</span></div>
            <div className="flex justify-between text-xs text-gray-500"><span>SGST (9%)</span><span>{formatPrice(sgstMinor)}</span></div>
            <div className="flex justify-between text-base font-bold border-t pt-3">
              <span>Final Payable</span>
              <span>{formatPrice(finalTotalMinor)}</span>
            </div>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handlePlaceOrder}
            className="w-full bg-black text-white py-3.5 rounded-xl font-semibold hover:bg-gray-800 disabled:bg-gray-400 transition"
          >
            {submitting ? "Processing Secure Payment..." : `Pay ${formatPrice(finalTotalMinor)}`}
          </button>
        </aside>
      </div>
    </main>
  );
}