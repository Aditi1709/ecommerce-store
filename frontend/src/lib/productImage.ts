import { Product } from "@/lib/api";

const WOMENS_IMAGES: Record<string, string[]> = {
  tops: [
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1551163943-3f6a855d1153?auto=format&fit=crop&w=800&q=80",
  ],
  bottoms: [
    "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?auto=format&fit=crop&w=800&q=80",
  ],
  skirts: [
    "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1577900232427-18219b9166a0?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1592301933927-35b597393c0a?auto=format&fit=crop&w=800&q=80",
  ],
  dresses: [
    "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80",
  ],
  ethnic: [
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
  ],
  outerwear: [
    "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=800&q=80",
  ],
  active: [
    "https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80",
  ],
  sleepwear: [
    "https://images.unsplash.com/photo-1616530940355-351fabd9524b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?auto=format&fit=crop&w=800&q=80",
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
    cat.includes("top")
      ? WOMENS_IMAGES.tops
      : cat.includes("bottom")
      ? WOMENS_IMAGES.bottoms
      : cat.includes("skirt")
      ? WOMENS_IMAGES.skirts
      : cat.includes("dress")
      ? WOMENS_IMAGES.dresses
      : cat.includes("ethnic") || cat.includes("indian")
      ? WOMENS_IMAGES.ethnic
      : cat.includes("outer")
      ? WOMENS_IMAGES.outerwear
      : cat.includes("active") || cat.includes("swim")
      ? WOMENS_IMAGES.active
      : cat.includes("inner") || cat.includes("sleep")
      ? WOMENS_IMAGES.sleepwear
      : WOMENS_IMAGES.dresses;

  const idx = hashKey(`${product.id || ""}-${product.slug || product.name}`) % pool.length;
  return pool[idx];
}
