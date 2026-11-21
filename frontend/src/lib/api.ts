const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export interface Variant {
  id: string;
  sku: string;
  price_minor: number;
  stock_qty: number;
  attributes: Record<string, string>;
  image_url: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: { id: string; name: string; slug: string };
  variants: Variant[];
}

export function formatPrice(priceMinor: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(priceMinor / 100);
}

export async function getProducts(): Promise<Product[]> {
    try {
      const res = await fetch(`${API_URL}/products/`, { cache: "no-store" });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

export async function getProduct(slug: string): Promise<Product | null> {
    const res = await fetch(`${API_URL}/products/${slug}`, { cache: "no-store" });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to fetch product");
    return res.json();
  }