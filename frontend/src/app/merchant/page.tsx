"use client";

import { useEffect, useState } from "react";
import { useAuth, ROLE_RANK } from "@/context/AuthContext";
import { Product, formatPrice } from "@/lib/api";

export default function MerchantPage() {
  const { user, token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [categoryName, setCategoryName] = useState("General");
  const [description, setDescription] = useState("");
  const [priceInr, setPriceInr] = useState("");
  const [stockQty, setStockQty] = useState("10");
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const isMerchant = Boolean(user && ROLE_RANK[user.role] >= ROLE_RANK.merchant);

  useEffect(() => {
    if (!token || !isMerchant) return;
    let cancelled = false;

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}/merchant/products`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setProducts(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [token, isMerchant, refreshKey]);

  const handleUploadAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      let imageUrl: string | null = null;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const upRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}/uploads/image`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const upData = await upRes.json();
        if (!upRes.ok) throw new Error(upData.detail || "Image upload failed");
        imageUrl = upData.url;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}/merchant/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          category_name: categoryName,
          description,
          price_inr: Number(priceInr),
          stock_qty: Number(stockQty),
          image_url: imageUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to publish product");

      setMsg("Product published to storefront!");
      setName("");
      setDescription("");
      setPriceInr("");
      setFile(null);
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}/merchant/products/${productId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setConfirmDeleteId(null);
    }
  };

  if (!isMerchant) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-bold">Merchant access required</h1>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
      <h1 className="text-3xl font-bold">Merchant Portal</h1>

      {/* Upload Product Form */}
      <section className="border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Upload New Good</h2>
        <form onSubmit={handleUploadAndCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            required
            placeholder="Product Title"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border rounded-lg px-4 py-2"
          />
          <input
            required
            placeholder="Category (e.g. Apparel, Electronics)"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="border rounded-lg px-4 py-2"
          />
          <input
            required
            type="number"
            placeholder="Price in ₹"
            value={priceInr}
            onChange={(e) => setPriceInr(e.target.value)}
            className="border rounded-lg px-4 py-2"
          />
          <input
            required
            type="number"
            placeholder="Stock Quantity"
            value={stockQty}
            onChange={(e) => setStockQty(e.target.value)}
            className="border rounded-lg px-4 py-2"
          />
          <textarea
            required
            placeholder="Product Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border rounded-lg px-4 py-2 md:col-span-2"
          />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Product Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="md:col-span-2 bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400"
          >
            {loading ? "Uploading..." : "Publish Product"}
          </button>
        </form>
        {msg && <p className="mt-3 text-sm font-medium text-blue-700">{msg}</p>}
      </section>

      {/* Merchant's Listed Products */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Your Listed Goods ({products.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((p) => (
            <div key={p.id} className="border rounded-xl overflow-hidden">
              <img
                src={p.variants[0]?.image_url || "https://placehold.co/600x600"}
                alt={p.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {p.variants[0] ? formatPrice(p.variants[0].price_minor) : "—"} • Stock:{" "}
                  {p.variants[0]?.stock_qty ?? 0}
                </p>

                {confirmDeleteId === p.id ? (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-gray-600">Delete?</span>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="px-2.5 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2.5 py-1 text-xs border rounded hover:bg-gray-100"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(p.id)}
                    className="mt-3 text-xs text-red-600 hover:underline"
                  >
                    Delete Product
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}