"use client";

import { useEffect, useState } from "react";
import { useAuth, ROLE_RANK, Role } from "@/context/AuthContext";
import { Product, formatPrice } from "@/lib/api";
import AdminOpsPanel from "@/components/AdminOpsPanel";

type Tab = "overview" | "products" | "orders" | "users" | "marketing" | "settings" | "logs";

interface OverviewData {
  total_revenue_minor: number;
  total_orders: number;
  pending_orders: number;
  cancelled_orders: number;
  total_customers: number;
  total_products: number;
  low_stock: { product_id: string; name: string; sku: string; stock_qty: number }[];
  sales_chart: { label: string; amount: number }[];
}

interface AdminOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  status: string;
  payment_method: string;
  payment_ref: string | null;
  total_minor: number;
  created_at: string;
  items: { product_name_snapshot: string; sku_snapshot: string; quantity: number }[];
}

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

const ALL_ROLES: Role[] = ["owner", "pro_admin", "admin", "merchant", "user", "null"];

export default function AdminPage() {
  const { user, token } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [refreshKey, setRefreshKey] = useState(0);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<string[]>([
    "Admin dashboard initialized",
    "Role-based permissions active",
  ]);

  // Product edit & delete states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Add product form
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Apparel");
  const [newSku, setNewSku] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("15");

  // Marketing & Settings states
  const [coupons, setCoupons] = useState([
    { code: "SAVE20", discount: "20% OFF", active: true },
    { code: "FIRST100", discount: "₹100 OFF", active: true },
  ]);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState("");
  const [bannerText, setBannerText] = useState("⚡ Flash Sale Live — Use code SAVE20 • Free shipping over ₹999");
  const [upiId, setUpiId] = useState("yourupi@oksbi");
  const [freeShipMin, setFreeShipMin] = useState("999");
  const [savedMsg, setSavedMsg] = useState("");

  const isAdmin = Boolean(user && ROLE_RANK[user.role] >= ROLE_RANK.admin);

  const addLog = (entry: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${user?.name}: ${entry}`, ...prev]);
  };

  useEffect(() => {
    if (!token || !isAdmin) return;
    let cancelled = false;
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}/admin/overview`, { headers }).then((r) => (r.ok ? r.json() : null)),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}/admin/products`, { headers }).then((r) => (r.ok ? r.json() : [])),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}/admin/orders`, { headers }).then((r) => (r.ok ? r.json() : [])),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}/admin/users`, { headers }).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([ov, prod, ord, usr]) => {
        if (cancelled) return;
        if (ov) setOverview(ov);
        if (Array.isArray(prod)) setProducts(prod);
        if (Array.isArray(ord)) setOrders(ord);
        if (Array.isArray(usr)) setUsers(usr);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [token, isAdmin, refreshKey]);

  const handleExportCsv = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}/admin/reports/orders.csv`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders-report.csv";
    a.click();
    addLog("Exported orders CSV report");
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}/admin/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: newName,
        category_name: newCategory,
        sku: newSku,
        price_inr: Number(newPrice),
        stock_qty: Number(newStock),
      }),
    });
    if (res.ok) {
      addLog(`Added product "${newName}"`);
      setNewName("");
      setNewSku("");
      setNewPrice("");
      setRefreshKey((k) => k + 1);
    }
  };

  const handleSaveEdit = async (productId: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}/admin/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: editName,
        price_inr: Number(editPrice),
        stock_qty: Number(editStock),
      }),
    });
    if (res.ok) {
      addLog(`Updated product "${editName}" (₹${editPrice}, stock ${editStock})`);
      setEditingId(null);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleDeleteProduct = async (productId: string, name: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}/admin/products/${productId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      addLog(`Deleted product "${name}"`);
      setConfirmDeleteId(null);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleStatusChange = async (orderId: string, status: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
      addLog(`Changed order ${orderId.slice(0, 8)} status to ${status}`);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleRoleChange = async (userId: string, targetName: string, newRole: Role) => {
    setError("");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role: newRole }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.detail || "Not allowed");
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: data.role } : u)));
    addLog(`Changed ${targetName}'s role to ${newRole}`);
  };

  if (!isAdmin || !user) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-bold">Admin access required</h1>
      </main>
    );
  }

  const actorRank = ROLE_RANK[user.role];
  const maxChart = Math.max(...(overview?.sales_chart.map((c) => c.amount) || [1]), 1);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
      {/* Sidebar */}
      <aside className="lg:col-span-1 space-y-1">
        <div className="p-4 rounded-xl bg-black text-white mb-4">
          <p className="text-xs uppercase text-gray-400">Admin Panel</p>
          <p className="font-bold mt-0.5">{user.name}</p>
          <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-white/20 uppercase">
            {user.role.replace("_", " ")}
          </span>
        </div>

        {(
          [
            ["overview", "Overview & Analytics"],
            ["products", "Products & Inventory"],
            ["orders", "Orders & Returns"],
            ["users", "Customers & Roles"],
            ["marketing", "Coupons & Banners"],
            ["settings", "Shipping & Payments"],
            ["logs", "Support & Activity Logs"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              tab === key ? "bg-black text-white" : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </aside>

      {/* Main Content */}
      <main className="lg:col-span-4 space-y-8">
        {error && <p className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</p>}

        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {tab === "overview" && (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h1 className="text-2xl font-bold">Sales Overview & Analytics</h1>
              <button
                onClick={handleExportCsv}
                className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800"
              >
                Export Orders CSV
              </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                ["Total Revenue", formatPrice(overview?.total_revenue_minor || 0)],
                ["Total Orders", String(overview?.total_orders || 0)],
                ["Total Customers", String(overview?.total_customers || 0)],
                ["Total Products", String(overview?.total_products || 0)],
                ["Pending Orders", String(overview?.pending_orders || 0)],
                ["Cancelled Orders", String(overview?.cancelled_orders || 0)],
              ].map(([label, val]) => (
                <div key={label} className="border rounded-xl p-5 bg-white">
                  <p className="text-xs text-gray-500 uppercase">{label}</p>
                  <p className="text-2xl font-bold mt-1">{val}</p>
                </div>
              ))}
            </div>

            {/* Sales Chart */}
            <section className="border rounded-xl p-6 bg-white">
              <h2 className="font-semibold mb-4">Revenue Chart (INR)</h2>
              {overview?.sales_chart.length ? (
                <div className="flex items-end gap-4 h-44 pt-4">
                  {overview.sales_chart.map((bar) => (
                    <div key={bar.label} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-xs font-medium">₹{bar.amount}</span>
                      <div
                        className="w-full max-w-12 bg-black rounded-t-md"
                        style={{ height: `${Math.max((bar.amount / maxChart) * 120, 12)}px` }}
                      />
                      <span className="text-xs text-gray-500">{bar.label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Place an order to see live sales chart data.</p>
              )}
            </section>

            {/* Low-Stock Alerts & Recent Transactions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="border rounded-xl p-5 bg-white">
                <h2 className="font-semibold mb-3">Low-Stock Alerts (≤ 10)</h2>
                {overview?.low_stock.length ? (
                  <ul className="space-y-2 text-sm">
                    {overview.low_stock.slice(0, 6).map((item) => (
                      <li key={item.sku} className="flex justify-between border-b pb-2">
                        <span>{item.name} ({item.sku})</span>
                        <span className="text-red-600 font-semibold">{item.stock_qty} left</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">All products are well stocked.</p>
                )}
              </section>

              <section className="border rounded-xl p-5 bg-white">
                <h2 className="font-semibold mb-3">Recent Transactions</h2>
                <ul className="space-y-2 text-sm">
                  {orders.slice(0, 5).map((o) => (
                    <li key={o.id} className="flex justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{o.customer_name}</p>
                        <p className="text-xs text-gray-500 uppercase">{o.payment_method} • {o.status}</p>
                      </div>
                      <span className="font-semibold">{formatPrice(o.total_minor)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS & INVENTORY */}
        {tab === "products" && (
          <div className="space-y-8">
            <h1 className="text-2xl font-bold">Manage Products & Inventory ({products.length})</h1>

            <form onSubmit={handleCreateProduct} className="border rounded-xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input required placeholder="Product Name" value={newName} onChange={(e) => setNewName(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
              <input required placeholder="Category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
              <input required placeholder="SKU (e.g. CAP-01)" value={newSku} onChange={(e) => setNewSku(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
              <input required type="number" placeholder="Price (₹)" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
              <input required type="number" placeholder="Stock" value={newStock} onChange={(e) => setNewStock(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
              <button className="bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800">Add Product</button>
            </form>

            <div className="space-y-3">
              {products.map((p) => {
                const v = p.variants[0];
                const isEditing = editingId === p.id;
                return (
                  <div key={p.id} className="border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img src={v?.image_url || "https://placehold.co/80x80"} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                      {isEditing ? (
                        <div className="flex flex-wrap gap-2">
                          <input value={editName} onChange={(e) => setEditName(e.target.value)} className="border rounded px-2 py-1 text-sm" />
                          <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="border rounded px-2 py-1 text-sm w-24" placeholder="₹" />
                          <input type="number" value={editStock} onChange={(e) => setEditStock(e.target.value)} className="border rounded px-2 py-1 text-sm w-20" placeholder="Stock" />
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold text-sm">{p.name}</p>
                          <p className="text-xs text-gray-500">
                            {p.category.name} • {v ? formatPrice(v.price_minor) : "—"} • Stock: {v?.stock_qty ?? 0}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      {isEditing ? (
                        <>
                          <button onClick={() => handleSaveEdit(p.id)} className="px-3 py-1.5 bg-black text-white rounded">Save</button>
                          <button onClick={() => setEditingId(null)} className="px-3 py-1.5 border rounded">Cancel</button>
                        </>
                      ) : confirmDeleteId === p.id ? (
                        <>
                          <span className="text-gray-600">Delete?</span>
                          <button onClick={() => handleDeleteProduct(p.id, p.name)} className="px-2.5 py-1 bg-red-600 text-white rounded">Yes</button>
                          <button onClick={() => setConfirmDeleteId(null)} className="px-2.5 py-1 border rounded">No</button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingId(p.id);
                              setEditName(p.name);
                              setEditPrice(String((v?.price_minor || 0) / 100));
                              setEditStock(String(v?.stock_qty || 0));
                            }}
                            className="px-3 py-1.5 border rounded hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button onClick={() => setConfirmDeleteId(p.id)} className="px-3 py-1.5 text-red-600 border border-red-200 rounded hover:bg-red-50">
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: ORDERS & RETURNS */}
        {tab === "orders" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Manage Orders, Returns & Refunds ({orders.length})</h1>
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      {order.customer_name} <span className="text-sm text-gray-500 font-normal">({order.customer_email})</span>
                    </p>
                    <p className="text-xs font-mono text-gray-500">{order.id}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Payment: <span className="uppercase font-medium">{order.payment_method}</span>
                      {order.payment_ref ? ` • UTR: ${order.payment_ref}` : ""}
                    </p>
                    <p className="text-sm mt-1">
                      {order.items.map((i) => `${i.quantity}x ${i.product_name_snapshot}`).join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{formatPrice(order.total_minor)}</span>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="border rounded-lg px-3 py-1.5 text-sm"
                    >
                      <option value="pending_verification">pending verification</option>
                      <option value="pending">pending</option>
                      <option value="confirmed">confirmed</option>
                      <option value="paid">paid</option>
                      <option value="shipped">shipped</option>
                      <option value="delivered">delivered</option>
                      <option value="return_requested">return requested</option>
                      <option value="refunded">refunded</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: USERS & ROLES */}
        {tab === "users" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Customers & Role Permissions ({users.length})</h1>
            <div className="space-y-3">
              {users.map((u) => {
                const canEdit = actorRank > ROLE_RANK[u.role];
                const assignableRoles = ALL_ROLES.filter((r) => actorRank > ROLE_RANK[r]);
                return (
                  <div key={u.id} className="border rounded-xl p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">{u.name}</p>
                      <p className="text-sm text-gray-500">{u.email}</p>
                    </div>
                    {canEdit ? (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, u.name, e.target.value as Role)}
                        className="border rounded-lg px-3 py-1.5 text-sm uppercase"
                      >
                        {assignableRoles.map((r) => (
                          <option key={r} value={r}>{r.replace("_", " ")}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 uppercase font-medium">
                        {u.role.replace("_", " ")} (Locked)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: MARKETING (COUPONS & BANNERS) */}
        {tab === "marketing" && (
          <div className="space-y-8">
            <h1 className="text-2xl font-bold">Coupons, Discounts & Banners</h1>

            <section className="border rounded-xl p-5 space-y-4">
              <h2 className="font-semibold">Manage Coupons</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!couponCode || !couponDiscount) return;
                  setCoupons((prev) => [...prev, { code: couponCode.toUpperCase(), discount: couponDiscount, active: true }]);
                  addLog(`Created coupon ${couponCode.toUpperCase()}`);
                  setCouponCode("");
                  setCouponDiscount("");
                }}
                className="flex flex-wrap gap-2"
              >
                <input placeholder="Code (e.g. FESTIVE15)" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
                <input placeholder="Discount (e.g. 15% OFF)" value={couponDiscount} onChange={(e) => setCouponDiscount(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
                <button className="px-4 py-2 bg-black text-white rounded-lg text-sm">Add Coupon</button>
              </form>
              <div className="space-y-2">
                {coupons.map((c) => (
                  <div key={c.code} className="flex items-center justify-between border rounded-lg px-4 py-2.5 text-sm">
                    <span className="font-mono font-semibold">{c.code} — {c.discount}</span>
                    <button
                      onClick={() => setCoupons((prev) => prev.filter((x) => x.code !== c.code))}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="border rounded-xl p-5 space-y-3">
              <h2 className="font-semibold">Announcement Banner</h2>
              <input value={bannerText} onChange={(e) => setBannerText(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
              <button
                onClick={() => {
                  setSavedMsg("Banner updated!");
                  addLog("Updated homepage announcement banner");
                  setTimeout(() => setSavedMsg(""), 2000);
                }}
                className="px-4 py-2 bg-black text-white rounded-lg text-sm"
              >
                Save Banner
              </button>
              {savedMsg && <p className="text-xs text-green-700">{savedMsg}</p>}
            </section>
          </div>
        )}

        {/* TAB 6: SHIPPING & PAYMENT SETTINGS */}
        {tab === "settings" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Shipping & Payment Settings</h1>
            <div className="border rounded-xl p-6 space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-medium mb-1">Store UPI ID (for QR Checkout)</label>
                <input value={upiId} onChange={(e) => setUpiId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Free Shipping Minimum Order (₹)</label>
                <input type="number" value={freeShipMin} onChange={(e) => setFreeShipMin(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <button
                onClick={() => {
                  setSavedMsg("Settings saved!");
                  addLog(`Updated UPI ID (${upiId}) & Free Shipping (₹${freeShipMin})`);
                  setTimeout(() => setSavedMsg(""), 2000);
                }}
                className="px-5 py-2.5 bg-black text-white rounded-lg text-sm font-medium"
              >
                Save Settings
              </button>
              {savedMsg && <p className="text-xs text-green-700">{savedMsg}</p>}
            </div>
          </div>
        )}

        {/* TAB 7: SUPPORT & ACTIVITY LOGS */}
        {tab === "logs" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Support, Reviews & Admin Activity Logs</h1>

            <section className="border rounded-xl p-5">
              <h2 className="font-semibold mb-3">Admin Activity Logs</h2>
              <ul className="space-y-2 text-xs font-mono text-gray-700">
                {logs.map((entry, idx) => (
                  <li key={idx} className="border-b pb-1.5">{entry}</li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}