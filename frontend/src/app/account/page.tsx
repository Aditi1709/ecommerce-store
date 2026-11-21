"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { Product, formatPrice } from "@/lib/api";
import {
  downloadPaymentReceipt,
  getPaymentsSnapshot,
  getServerPaymentsSnapshot,
  parseTransactions,
  processAutoRefund,
  subscribePayments,
} from "@/lib/payments";

type AccountTab =
  | "profile"
  | "orders"
  | "wishlist"
  | "reviews"
  | "addresses"
  | "returns"
  | "rewards"
  | "support"
  | "settings";

interface UserReview {
  id: string;
  productName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ReturnRequest {
  id: string;
  orderId: string;
  reason: string;
  status: "Requested" | "Pickup Scheduled" | "Completed";
  createdAt: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: "Open" | "In Progress" | "Resolved";
  createdAt: string;
}

interface ProfilePrefs {
  avatar: string;
  phone: string;
  dob: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  loyaltyPoints: number;
  walletMinor: number;
  referralRewardsMinor: number;
  savedMethods: { id: string; type: "UPI" | "Card"; label: string }[];
  notifications: {
    orderEmail: boolean;
    orderSms: boolean;
    whatsapp: boolean;
    promos: boolean;
  };
  reviews: UserReview[];
  returns: ReturnRequest[];
  tickets: SupportTicket[];
}

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

const PREFS_KEY = "storefront_profile_prefs_v2";
const ADDR_KEY = "storefront_addresses_v1";
const RECENT_KEY = "recently_viewed";

const DEFAULT_PREFS: ProfilePrefs = {
  avatar: "",
  phone: "",
  dob: "",
  emailVerified: false,
  phoneVerified: false,
  loyaltyPoints: 450,
  walletMinor: 25000, // ₹250
  referralRewardsMinor: 50000, // ₹500
  savedMethods: [{ id: "m1", type: "UPI", label: "yourname@okaxis" }],
  notifications: { orderEmail: true, orderSms: true, whatsapp: false, promos: true },
  reviews: [
    {
      id: "rev-1",
      productName: "Oversized Acid-Wash Tee",
      rating: 5,
      comment: "Heavyweight fabric and great fit.",
      createdAt: "2026-11-15",
    },
  ],
  returns: [],
  tickets: [
    {
      id: "TKT-1042",
      subject: "GST Invoice query",
      message: "Need GSTIN added to my last order invoice.",
      status: "Resolved",
      createdAt: "2026-11-12",
    },
  ],
};

const MY_COUPONS = [
  { code: "SAVE20", desc: "Flat 20% off on your order", expiry: "31 Dec 2026" },
  { code: "FIRST100", desc: "₹100 off on orders above ₹499", expiry: "31 Dec 2026" },
  { code: "FREESHIP", desc: "Free standard shipping on any order", expiry: "31 Dec 2026" },
];

const DEFAULT_PREFS_JSON = JSON.stringify(DEFAULT_PREFS);
const EMPTY_ARR = "[]";

function makeStore(key: string, eventName: string, fallback: string) {
  return {
    subscribe: (cb: () => void) => {
      window.addEventListener("storage", cb);
      window.addEventListener(eventName, cb);
      return () => {
        window.removeEventListener("storage", cb);
        window.removeEventListener(eventName, cb);
      };
    },
    getSnapshot: () => localStorage.getItem(key) ?? fallback,
    getServerSnapshot: () => fallback,
    save: (val: unknown) => {
      localStorage.setItem(key, JSON.stringify(val));
      window.dispatchEvent(new Event(eventName));
    },
  };
}

const prefsStore = makeStore(PREFS_KEY, "prefs-updated", DEFAULT_PREFS_JSON);
const addrStore = makeStore(ADDR_KEY, "addresses-updated", EMPTY_ARR);
const recentStore = makeStore(RECENT_KEY, "storage", EMPTY_ARR);

export default function AccountPage() {
  const { user, logout } = useAuth();
  const { wishlist, moveWishlistToCart, removeWishlist } = useCart();
  const [tab, setTab] = useState<AccountTab>("profile");
  const [msg, setMsg] = useState("");

  // Synced stores
  const rawPrefs = useSyncExternalStore(
    prefsStore.subscribe,
    prefsStore.getSnapshot,
    prefsStore.getServerSnapshot
  );
  const prefs: ProfilePrefs = useMemo(() => {
    try {
      return { ...DEFAULT_PREFS, ...JSON.parse(rawPrefs) };
    } catch {
      return DEFAULT_PREFS;
    }
  }, [rawPrefs]);

  const rawAddresses = useSyncExternalStore(
    addrStore.subscribe,
    addrStore.getSnapshot,
    addrStore.getServerSnapshot
  );
  const addresses: SavedAddress[] = useMemo(() => {
    try {
      const parsed = JSON.parse(rawAddresses);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [rawAddresses]);

  const rawRecent = useSyncExternalStore(
    recentStore.subscribe,
    recentStore.getSnapshot,
    recentStore.getServerSnapshot
  );
  const recentlyViewed: Product[] = useMemo(() => {
    try {
      const parsed = JSON.parse(rawRecent);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [rawRecent]);

  const rawTx = useSyncExternalStore(
    subscribePayments,
    getPaymentsSnapshot,
    getServerPaymentsSnapshot
  );
  const orders = useMemo(() => parseTransactions(rawTx), [rawTx]);
  const refundedOrders = useMemo(
    () => orders.filter((o) => o.status === "refunded"),
    [orders]
  );

  // Form states
  const [phoneInput, setPhoneInput] = useState("");
  const [dobInput, setDobInput] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [showPhoneOtp, setShowPhoneOtp] = useState(false);

  // Review form
  const [revProduct, setRevProduct] = useState("");
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState("");

  // Address form
  const [addrLabel, setAddrLabel] = useState("Home");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrPincode, setAddrPincode] = useState("");

  // Return form
  const [retOrderId, setRetOrderId] = useState("");
  const [retReason, setRetReason] = useState("Size / fit issue");

  // Wallet top-up
  const [topUpInr, setTopUpInr] = useState("500");

  // Support ticket form
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");

  // Settings forms
  const [payType, setPayType] = useState<"UPI" | "Card">("UPI");
  const [payLabel, setPayLabel] = useState("");
  const [currPass, setCurrPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const flash = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  };

  const updatePrefs = (patch: Partial<ProfilePrefs>) => {
    prefsStore.save({ ...prefs, ...patch });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updatePrefs({ avatar: reader.result });
        flash("Profile picture updated!");
      }
    };
    reader.readAsDataURL(file);
  };

  if (!user) {
    return (
      <main className="max-w-xl mx-auto px-6 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold">Sign in to view your dashboard</h1>
        <div className="flex justify-center gap-3">
          <Link href="/login" className="px-6 py-2.5 bg-black text-white rounded-lg text-sm">
            Login
          </Link>
          <Link href="/register" className="px-6 py-2.5 border rounded-lg text-sm">
            Sign Up
          </Link>
        </div>
      </main>
    );
  }

  const referralCode = `REF-${user.name.replace(/\s+/g, "").slice(0, 4).toUpperCase()}2026`;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar */}
      <aside className="space-y-1.5">
        <div className="border rounded-2xl p-5 bg-white flex items-center gap-3 mb-4">
          <img
            src={
              prefs.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=000&color=fff`
            }
            alt={user.name}
            className="w-12 h-12 rounded-full object-cover border"
          />
          <div className="min-w-0">
            <p className="font-bold truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>

        {(
          [
            ["profile", "My Profile"],
            ["orders", `My Orders & Invoices (${orders.length})`],
            ["wishlist", `My Wishlist (${wishlist.length})`],
            ["reviews", `My Reviews (${prefs.reviews.length})`],
            ["addresses", `My Addresses (${addresses.length})`],
            ["returns", `My Returns & Refunds`],
            ["rewards", "Coupons, Points & Wallet"],
            ["support", `Customer Support (${prefs.tickets.length})`],
            ["settings", "Account & Notification Settings"],
          ] as [AccountTab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              tab === key ? "bg-black text-white" : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}

        <button
          onClick={logout}
          className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="lg:col-span-3 space-y-6">
        {/* Quick Dashboard Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="border rounded-xl p-4 bg-white">
            <p className="text-[11px] uppercase text-gray-500">Orders</p>
            <p className="text-xl font-bold mt-0.5">{orders.length}</p>
          </div>
          <div className="border rounded-xl p-4 bg-white">
            <p className="text-[11px] uppercase text-gray-500">Wallet Balance</p>
            <p className="text-xl font-bold mt-0.5">{formatPrice(prefs.walletMinor)}</p>
          </div>
          <div className="border rounded-xl p-4 bg-white">
            <p className="text-[11px] uppercase text-gray-500">Loyalty Points</p>
            <p className="text-xl font-bold mt-0.5">{prefs.loyaltyPoints} pts</p>
          </div>
          <div className="border rounded-xl p-4 bg-white">
            <p className="text-[11px] uppercase text-gray-500">Referral Rewards</p>
            <p className="text-xl font-bold mt-0.5">{formatPrice(prefs.referralRewardsMinor)}</p>
          </div>
        </div>

        {msg && (
          <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm font-medium">
            {msg}
          </div>
        )}

        {/* TAB 1: MY PROFILE */}
        {tab === "profile" && (
          <section className="border rounded-2xl p-6 bg-white space-y-6">
            <h1 className="text-2xl font-bold">My Profile</h1>

            <div className="flex items-center gap-4">
              <img
                src={
                  prefs.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=000&color=fff`
                }
                alt={user.name}
                className="w-20 h-20 rounded-full object-cover border"
              />
              <div>
                <label className="inline-block px-4 py-2 border rounded-lg text-xs font-medium cursor-pointer hover:bg-gray-50">
                  Upload Profile Picture
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
                <p className="text-xs text-gray-500 mt-1">JPG or PNG image.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Full Name</label>
                <input disabled value={user.name} className="w-full border rounded-lg px-3 py-2 bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Account Role</label>
                <input disabled value={user.role.toUpperCase()} className="w-full border rounded-lg px-3 py-2 bg-gray-50" />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Email</label>
                <div className="flex gap-2">
                  <input disabled value={user.email} className="flex-1 border rounded-lg px-3 py-2 bg-gray-50" />
                  {prefs.emailVerified ? (
                    <span className="px-2.5 py-2 text-xs text-green-700 font-semibold">Verified ✓</span>
                  ) : (
                    <button onClick={() => setShowEmailOtp(true)} className="px-3 py-2 border rounded-lg text-xs">
                      Verify
                    </button>
                  )}
                </div>
                {showEmailOtp && !prefs.emailVerified && (
                  <div className="flex gap-2 mt-2 text-xs">
                    <input placeholder="OTP: 1234" value={emailOtp} onChange={(e) => setEmailOtp(e.target.value)} className="border rounded px-2 py-1 w-24" />
                    <button
                      onClick={() => {
                        if (emailOtp === "1234") {
                          updatePrefs({ emailVerified: true });
                          setShowEmailOtp(false);
                          flash("Email verified!");
                        }
                      }}
                      className="px-3 py-1 bg-black text-white rounded"
                    >
                      Confirm
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Phone</label>
                <div className="flex gap-2">
                  <input
                    placeholder="10-digit mobile"
                    value={phoneInput || prefs.phone}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="flex-1 border rounded-lg px-3 py-2"
                  />
                  {prefs.phoneVerified ? (
                    <span className="px-2.5 py-2 text-xs text-green-700 font-semibold">Verified ✓</span>
                  ) : (
                    <button onClick={() => setShowPhoneOtp(true)} className="px-3 py-2 border rounded-lg text-xs">
                      Verify
                    </button>
                  )}
                </div>
                {showPhoneOtp && !prefs.phoneVerified && (
                  <div className="flex gap-2 mt-2 text-xs">
                    <input placeholder="OTP: 1234" value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value)} className="border rounded px-2 py-1 w-24" />
                    <button
                      onClick={() => {
                        if (phoneOtp === "1234") {
                          updatePrefs({ phone: phoneInput || prefs.phone, phoneVerified: true });
                          setShowPhoneOtp(false);
                          flash("Phone verified!");
                        }
                      }}
                      className="px-3 py-1 bg-black text-white rounded"
                    >
                      Confirm
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dobInput || prefs.dob}
                  onChange={(e) => setDobInput(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <button
              onClick={() => {
                updatePrefs({ phone: phoneInput || prefs.phone, dob: dobInput || prefs.dob });
                flash("Profile saved!");
              }}
              className="px-6 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800"
            >
              Save Profile
            </button>
          </section>
        )}

        {/* TAB 2: MY ORDERS & DOWNLOAD INVOICES */}
        {tab === "orders" && (
          <section className="border rounded-2xl p-6 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">My Orders & Invoices</h1>
              <Link href="/payments" className="text-xs underline">Payment History →</Link>
            </div>
            {orders.length === 0 ? (
              <p className="text-sm text-gray-500">No orders placed yet.</p>
            ) : (
              <div className="space-y-3">
                {orders.map((o) => (
                  <div key={o.txId} className="border rounded-xl p-4 flex flex-col sm:flex-row justify-between gap-4 text-sm">
                    <div>
                      <p className="font-mono font-semibold">{o.orderId || o.txId}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(o.createdAt).toLocaleDateString("en-IN")} • {o.methodLabel} •{" "}
                        <span className="uppercase font-semibold">{o.status}</span>
                      </p>
                      <p className="text-xs mt-1">
                        {o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold mr-2">{formatPrice(o.amountMinor)}</span>
                      <button
                        onClick={() => downloadPaymentReceipt(o)}
                        className="px-3 py-1.5 bg-black text-white rounded-lg text-xs"
                      >
                        Download Invoice
                      </button>
                      {(o.status === "success" || o.status === "pending") && (
                        <button
                          onClick={() => {
                            setRetOrderId(o.orderId || o.txId);
                            setTab("returns");
                          }}
                          className="px-3 py-1.5 border rounded-lg text-xs hover:bg-gray-50"
                        >
                          Return
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: MY WISHLIST & RECENTLY VIEWED */}
        {tab === "wishlist" && (
          <div className="space-y-6">
            <section className="border rounded-2xl p-6 bg-white space-y-4">
              <h1 className="text-2xl font-bold">My Wishlist ({wishlist.length})</h1>
              {wishlist.length === 0 ? (
                <p className="text-sm text-gray-500">Your wishlist is empty.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {wishlist.map((item) => (
                    <div key={item.variantId} className="border rounded-xl p-3 space-y-2 text-sm">
                      <img src={item.imageUrl || "https://placehold.co/300x300"} alt={item.productName} className="w-full h-32 object-cover rounded-lg" />
                      <p className="font-semibold truncate">{item.productName}</p>
                      <p className="font-bold">{formatPrice(item.priceMinor)}</p>
                      <div className="flex gap-2">
                        <button onClick={() => moveWishlistToCart(item.variantId)} className="flex-1 py-1.5 bg-black text-white rounded text-xs">Add to Cart</button>
                        <button onClick={() => removeWishlist(item.variantId)} className="px-2 border rounded text-xs text-red-600">×</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="border rounded-2xl p-6 bg-white space-y-4">
              <h2 className="text-xl font-bold">Recently Viewed ({recentlyViewed.length})</h2>
              {recentlyViewed.length === 0 ? (
                <p className="text-sm text-gray-500">Browse products to see them here.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {recentlyViewed.map((p) => (
                    <Link key={p.id} href={`/products/${p.slug}`} className="border rounded-xl p-3 space-y-2 text-sm hover:border-black">
                      <img src={p.variants[0]?.image_url || "https://placehold.co/300x300"} alt={p.name} className="w-full h-32 object-cover rounded-lg" />
                      <p className="font-semibold truncate">{p.name}</p>
                      <p className="font-bold">{p.variants[0] ? formatPrice(p.variants[0].price_minor) : ""}</p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB 4: MY REVIEWS */}
        {tab === "reviews" && (
          <section className="border rounded-2xl p-6 bg-white space-y-6">
            <h1 className="text-2xl font-bold">My Reviews ({prefs.reviews.length})</h1>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!revProduct.trim() || !revComment.trim()) return;
                const entry: UserReview = {
                  id: `rev-${Date.now()}`,
                  productName: revProduct.trim(),
                  rating: revRating,
                  comment: revComment.trim(),
                  createdAt: new Date().toLocaleDateString("en-IN"),
                };
                updatePrefs({ reviews: [entry, ...prefs.reviews] });
                setRevProduct("");
                setRevComment("");
                flash("Review published!");
              }}
              className="border rounded-xl p-4 bg-gray-50 space-y-3 text-sm"
            >
              <p className="font-semibold">Write a Product Review</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input required placeholder="Product Name" value={revProduct} onChange={(e) => setRevProduct(e.target.value)} className="sm:col-span-2 border rounded-lg px-3 py-2 bg-white" />
                <select value={revRating} onChange={(e) => setRevRating(Number(e.target.value))} className="border rounded-lg px-3 py-2 bg-white">
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>{r} ★</option>
                  ))}
                </select>
              </div>
              <textarea required rows={2} placeholder="Share your experience..." value={revComment} onChange={(e) => setRevComment(e.target.value)} className="w-full border rounded-lg px-3 py-2 bg-white" />
              <button className="px-4 py-2 bg-black text-white rounded-lg text-xs font-medium">Submit Review</button>
            </form>

            <div className="space-y-3">
              {prefs.reviews.map((r) => (
                <div key={r.id} className="border rounded-xl p-4 flex justify-between items-start gap-4 text-sm">
                  <div>
                    <p className="font-semibold">{r.productName}</p>
                    <p className="text-amber-600 text-xs">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)} • {r.createdAt}</p>
                    <p className="text-gray-600 mt-1">{r.comment}</p>
                  </div>
                  <button
                    onClick={() => updatePrefs({ reviews: prefs.reviews.filter((x) => x.id !== r.id) })}
                    className="text-xs text-red-600 underline"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 5: MY ADDRESSES */}
        {tab === "addresses" && (
          <section className="border rounded-2xl p-6 bg-white space-y-6">
            <h1 className="text-2xl font-bold">My Addresses</h1>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const entry: SavedAddress = {
                  id: `addr-${Date.now()}`,
                  label: addrLabel,
                  fullName: user.name,
                  phone: prefs.phone || "9876543210",
                  line1: addrLine1,
                  city: addrCity,
                  state: addrState,
                  pincode: addrPincode,
                };
                addrStore.save([entry, ...addresses]);
                setAddrLine1("");
                setAddrCity("");
                setAddrState("");
                setAddrPincode("");
                flash("Address saved!");
              }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm border rounded-xl p-4 bg-gray-50"
            >
              <input required placeholder="Label (Home/Office)" value={addrLabel} onChange={(e) => setAddrLabel(e.target.value)} className="border rounded-lg px-3 py-2 bg-white" />
              <input required placeholder="6-Digit Pincode" value={addrPincode} onChange={(e) => setAddrPincode(e.target.value)} className="border rounded-lg px-3 py-2 bg-white" />
              <input required placeholder="Street / Area" value={addrLine1} onChange={(e) => setAddrLine1(e.target.value)} className="sm:col-span-2 border rounded-lg px-3 py-2 bg-white" />
              <input required placeholder="City" value={addrCity} onChange={(e) => setAddrCity(e.target.value)} className="border rounded-lg px-3 py-2 bg-white" />
              <input required placeholder="State" value={addrState} onChange={(e) => setAddrState(e.target.value)} className="border rounded-lg px-3 py-2 bg-white" />
              <button className="sm:col-span-2 py-2 bg-black text-white rounded-lg text-xs font-medium">Add Address</button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {addresses.map((a) => (
                <div key={a.id} className="border rounded-xl p-4 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs font-bold uppercase">{a.label}</span>
                    <button onClick={() => addrStore.save(addresses.filter((x) => x.id !== a.id))} className="text-xs text-red-600 underline">Delete</button>
                  </div>
                  <p className="font-semibold">{a.fullName}</p>
                  <p className="text-xs text-gray-600">{a.line1}, {a.city}, {a.state} - {a.pincode}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 6: MY RETURNS & MY REFUNDS */}
        {tab === "returns" && (
          <div className="space-y-6">
            <section className="border rounded-2xl p-6 bg-white space-y-5">
              <h1 className="text-2xl font-bold">My Returns ({prefs.returns.length})</h1>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!retOrderId.trim()) return;
                  const entry: ReturnRequest = {
                    id: `RET-${Date.now().toString().slice(-6)}`,
                    orderId: retOrderId.trim(),
                    reason: retReason,
                    status: "Requested",
                    createdAt: new Date().toLocaleDateString("en-IN"),
                  };
                  updatePrefs({ returns: [entry, ...prefs.returns] });
                  // Also trigger auto-refund if matching transaction exists
                  const match = orders.find((o) => o.orderId === retOrderId.trim() || o.txId === retOrderId.trim());
                  if (match && match.status !== "refunded") processAutoRefund(match.txId);
                  setRetOrderId("");
                  flash("Return request submitted!");
                }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm border rounded-xl p-4 bg-gray-50"
              >
                <input required placeholder="Order ID / TXN ID" value={retOrderId} onChange={(e) => setRetOrderId(e.target.value)} className="border rounded-lg px-3 py-2 bg-white" />
                <select value={retReason} onChange={(e) => setRetReason(e.target.value)} className="border rounded-lg px-3 py-2 bg-white">
                  <option>Size / fit issue</option>
                  <option>Damaged or defective item</option>
                  <option>Wrong item delivered</option>
                  <option>No longer needed</option>
                </select>
                <button className="bg-black text-white rounded-lg text-xs font-medium py-2">Request Return</button>
              </form>

              {prefs.returns.length === 0 ? (
                <p className="text-sm text-gray-500">No return requests yet.</p>
              ) : (
                <div className="space-y-2">
                  {prefs.returns.map((r) => (
                    <div key={r.id} className="border rounded-xl p-4 flex justify-between items-center text-sm">
                      <div>
                        <p className="font-mono font-semibold">{r.id} • Order: {r.orderId}</p>
                        <p className="text-xs text-gray-500">{r.reason} • {r.createdAt}</p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-medium">{r.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="border rounded-2xl p-6 bg-white space-y-4">
              <h2 className="text-xl font-bold">My Refunds ({refundedOrders.length})</h2>
              {refundedOrders.length === 0 ? (
                <p className="text-sm text-gray-500">No refunds processed yet.</p>
              ) : (
                <div className="space-y-2">
                  {refundedOrders.map((o) => (
                    <div key={o.txId} className="border rounded-xl p-4 flex justify-between items-center text-sm">
                      <div>
                        <p className="font-mono font-semibold">{o.refundId || o.txId}</p>
                        <p className="text-xs text-gray-500">Order: {o.orderId || o.txId} • {o.methodLabel}</p>
                      </div>
                      <span className="font-bold text-green-700">{formatPrice(o.amountMinor)} Refunded</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB 7: COUPONS, LOYALTY POINTS, WALLET & REFERRAL REWARDS */}
        {tab === "rewards" && (
          <div className="space-y-6">
            {/* My Wallet */}
            <section className="border rounded-2xl p-6 bg-white space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold">My Wallet</h2>
                  <p className="text-2xl font-bold text-green-700 mt-1">{formatPrice(prefs.walletMinor)}</p>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const amt = Number(topUpInr);
                    if (amt <= 0) return;
                    updatePrefs({ walletMinor: prefs.walletMinor + amt * 100 });
                    flash(`Added ₹${amt} to your wallet!`);
                  }}
                  className="flex gap-2 text-sm"
                >
                  <input type="number" min={100} value={topUpInr} onChange={(e) => setTopUpInr(e.target.value)} className="w-28 border rounded-lg px-3 py-2" />
                  <button className="px-4 py-2 bg-black text-white rounded-lg text-xs font-medium">Add Money</button>
                </form>
              </div>
            </section>

            {/* My Loyalty Points */}
            <section className="border rounded-2xl p-6 bg-white flex flex-wrap justify-between items-center gap-4">
              <div>
                <h2 className="text-xl font-bold">My Loyalty Points</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Balance: <strong>{prefs.loyaltyPoints} pts</strong> (100 pts = ₹50 wallet credit)
                </p>
              </div>
              <button
                disabled={prefs.loyaltyPoints < 100}
                onClick={() => {
                  updatePrefs({
                    loyaltyPoints: prefs.loyaltyPoints - 100,
                    walletMinor: prefs.walletMinor + 5000,
                  });
                  flash("Redeemed 100 points for ₹50 wallet credit!");
                }}
                className="px-4 py-2 bg-black text-white rounded-lg text-xs font-medium disabled:bg-gray-300"
              >
                Redeem 100 pts → ₹50
              </button>
            </section>

            {/* My Referral Rewards */}
            <section className="border rounded-2xl p-6 bg-white space-y-3">
              <h2 className="text-xl font-bold">My Referral Rewards</h2>
              <p className="text-sm text-gray-600">
                Earned so far: <strong>{formatPrice(prefs.referralRewardsMinor)}</strong> • Share your code to earn ₹250 per friend.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono font-bold px-4 py-2 bg-gray-100 rounded-lg border">{referralCode}</span>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(referralCode);
                    flash("Referral code copied!");
                  }}
                  className="px-4 py-2 bg-black text-white rounded-lg text-xs font-medium"
                >
                  Copy Referral Code
                </button>
              </div>
            </section>

            {/* My Coupons */}
            <section className="border rounded-2xl p-6 bg-white space-y-4">
              <h2 className="text-xl font-bold">My Coupons</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {MY_COUPONS.map((c) => (
                  <div key={c.code} className="border border-dashed rounded-xl p-4 space-y-2 bg-gray-50">
                    <p className="font-mono font-bold text-base">{c.code}</p>
                    <p className="text-xs text-gray-600">{c.desc}</p>
                    <p className="text-[11px] text-gray-400">Valid till {c.expiry}</p>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(c.code);
                        flash(`Coupon ${c.code} copied!`);
                      }}
                      className="text-xs underline font-medium"
                    >
                      Copy Code
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* TAB 8: CUSTOMER SUPPORT HISTORY */}
        {tab === "support" && (
          <section className="border rounded-2xl p-6 bg-white space-y-6">
            <h1 className="text-2xl font-bold">Customer Support History</h1>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!ticketSubject.trim() || !ticketMessage.trim()) return;
                const entry: SupportTicket = {
                  id: `TKT-${Date.now().toString().slice(-4)}`,
                  subject: ticketSubject.trim(),
                  message: ticketMessage.trim(),
                  status: "Open",
                  createdAt: new Date().toLocaleDateString("en-IN"),
                };
                updatePrefs({ tickets: [entry, ...prefs.tickets] });
                setTicketSubject("");
                setTicketMessage("");
                flash(`Support ticket ${entry.id} created!`);
              }}
              className="border rounded-xl p-4 bg-gray-50 space-y-3 text-sm"
            >
              <p className="font-semibold">Raise a New Support Ticket</p>
              <input required placeholder="Subject (e.g. Delayed delivery)" value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)} className="w-full border rounded-lg px-3 py-2 bg-white" />
              <textarea required rows={2} placeholder="Describe your issue..." value={ticketMessage} onChange={(e) => setTicketMessage(e.target.value)} className="w-full border rounded-lg px-3 py-2 bg-white" />
              <button className="px-4 py-2 bg-black text-white rounded-lg text-xs font-medium">Submit Ticket</button>
            </form>

            <div className="space-y-3">
              {prefs.tickets.map((t) => (
                <div key={t.id} className="border rounded-xl p-4 flex justify-between items-start gap-4 text-sm">
                  <div>
                    <p className="font-semibold"><span className="font-mono text-xs text-gray-500 mr-2">{t.id}</span>{t.subject}</p>
                    <p className="text-xs text-gray-600 mt-1">{t.message}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{t.createdAt}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${t.status === "Resolved" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 9: ACCOUNT SETTINGS & NOTIFICATION SETTINGS */}
        {tab === "settings" && (
          <div className="space-y-6">
            {/* Notification Settings */}
            <section className="border rounded-2xl p-6 bg-white space-y-3">
              <h2 className="text-xl font-bold">Notification Settings</h2>
              {(
                [
                  ["orderEmail", "Order & Shipping Updates via Email"],
                  ["orderSms", "Delivery & OTP Alerts via SMS"],
                  ["whatsapp", "WhatsApp Order Tracking"],
                  ["promos", "Flash Sales, Coupons & New Arrivals"],
                ] as [keyof ProfilePrefs["notifications"], string][]
              ).map(([key, label]) => (
                <label key={key} className="flex items-center justify-between border rounded-xl p-3.5 text-sm cursor-pointer">
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={prefs.notifications[key]}
                    onChange={(e) => {
                      updatePrefs({ notifications: { ...prefs.notifications, [key]: e.target.checked } });
                      flash("Notification settings saved!");
                    }}
                  />
                </label>
              ))}
            </section>

            {/* Saved Payment Methods */}
            <section className="border rounded-2xl p-6 bg-white space-y-4">
              <h2 className="text-xl font-bold">Saved Payment Methods</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!payLabel.trim()) return;
                  updatePrefs({
                    savedMethods: [...prefs.savedMethods, { id: `pm-${Date.now()}`, type: payType, label: payLabel.trim() }],
                  });
                  setPayLabel("");
                  flash("Payment method saved!");
                }}
                className="flex flex-wrap gap-2 text-sm"
              >
                <select value={payType} onChange={(e) => setPayType(e.target.value as "UPI" | "Card")} className="border rounded-lg px-3 py-2">
                  <option value="UPI">UPI ID</option>
                  <option value="Card">Card</option>
                </select>
                <input placeholder={payType === "UPI" ? "name@oksbi" : "HDFC •••• 4242"} value={payLabel} onChange={(e) => setPayLabel(e.target.value)} className="flex-1 border rounded-lg px-3 py-2" />
                <button className="px-4 py-2 bg-black text-white rounded-lg text-xs font-medium">Save</button>
              </form>
              {prefs.savedMethods.map((m) => (
                <div key={m.id} className="border rounded-xl p-3.5 flex justify-between items-center text-sm">
                  <span><strong>{m.type}:</strong> {m.label}</span>
                  <button onClick={() => updatePrefs({ savedMethods: prefs.savedMethods.filter((x) => x.id !== m.id) })} className="text-xs text-red-600 underline">Remove</button>
                </div>
              ))}
            </section>

            {/* Account Security Settings */}
            <section className="border rounded-2xl p-6 bg-white space-y-5">
              <h2 className="text-xl font-bold">Account Settings & Security</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newPass.length < 6) return flash("New password must be 6+ characters.");
                  setCurrPass("");
                  setNewPass("");
                  flash("Password updated!");
                }}
                className="space-y-3 max-w-md text-sm border-b pb-5"
              >
                <p className="font-semibold">Change Password</p>
                <input required type="password" placeholder="Current Password" value={currPass} onChange={(e) => setCurrPass(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
                <input required type="password" placeholder="New Password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
                <button className="px-5 py-2 bg-black text-white rounded-lg text-xs font-medium">Update Password</button>
              </form>

              <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5 text-sm">
                <div>
                  <p className="font-semibold">Logout from All Devices</p>
                  <p className="text-xs text-gray-500">Revokes active sessions everywhere.</p>
                </div>
                <button onClick={() => { localStorage.removeItem("token"); logout(); }} className="px-4 py-2 border rounded-lg text-xs font-medium hover:bg-gray-50">
                  Logout All Devices
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                <div>
                  <p className="font-semibold text-red-600">Delete Account</p>
                  <p className="text-xs text-gray-500">Permanently removes your account data.</p>
                </div>
                {confirmDelete ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span>Confirm?</span>
                    <button onClick={() => { localStorage.clear(); logout(); }} className="px-3 py-1.5 bg-red-600 text-white rounded-lg">Yes, Delete</button>
                    <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 border rounded-lg">No</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(true)} className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50">
                    Delete Account
                  </button>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}