import { Product } from "@/lib/api";

const CURATED_IMAGES: Record<string, string[]> = {
  apparel: [
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
  ],
  footwear: [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=800&q=80",
  ],
  electronics: [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80",
  ],
  accessories: [
    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1611923134239-b9be5816e23c?auto=format&fit=crop&w=800&q=80",
  ],
  general: [
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
  ],
};

function hashKey(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) % 100000;
  }
  return Math.abs(h);
}

export function getAestheticImage(
  product: Pick<Product, "id" | "slug" | "name"> & { category?: { name?: string } },
  rawUrl?: string | null
): string {
  const url = (rawUrl || "").trim();
  const isUnreliable =
    !url ||
    url.includes("placehold.co") ||
    url.includes("via.placeholder.com") ||
    url.includes("dummyimage.com") ||
    url.includes("localhost") ||
    url.includes("127.0.0.1");

  if (!isUnreliable) return url;

  const cat = (product.category?.name || "").toLowerCase();
  const pool =
    cat.includes("apparel") || cat.includes("cloth") || cat.includes("hoodie")
      ? CURATED_IMAGES.apparel
      : cat.includes("foot") || cat.includes("shoe")
      ? CURATED_IMAGES.footwear
      : cat.includes("elec") || cat.includes("tech") || cat.includes("audio")
      ? CURATED_IMAGES.electronics
      : cat.includes("access") || cat.includes("bag") || cat.includes("jewel")
      ? CURATED_IMAGES.accessories
      : CURATED_IMAGES.general;

  const idx = hashKey(`${product.id || ""}-${product.slug || product.name}`) % pool.length;
  return pool[idx];
}
