import { Product } from "@/lib/api";

export const MEGA_MENU = [
  {
    category: "Apparel",
    subcategories: ["Hoodies", "Tees", "Cargo Pants", "Jackets", "Linen Shirts"],
  },
  {
    category: "Footwear",
    subcategories: ["Sneakers", "Trail Runners", "Chelsea Boots"],
  },
  {
    category: "Accessories",
    subcategories: ["Sunglasses", "Backpacks", "Watches", "Caps"],
  },
  {
    category: "Electronics",
    subcategories: ["Headphones", "Keyboards", "Power Banks"],
  },
  {
    category: "Home & Desk",
    subcategories: ["Tumblers", "Desk Mats"],
  },
];

export const TRENDING_SEARCHES = ["Hoodie", "Sneakers", "Headphones", "Backpack", "Watch"];
export const POPULAR_SEARCHES = ["Apparel", "Electronics", "Keyboard", "Sunglasses", "Boots"];

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export function getTypoSuggestion(query: string, products: Product[]): string | null {
  const q = query.trim().toLowerCase();
  if (q.length < 3) return null;

  const dictionary = new Set<string>([...TRENDING_SEARCHES, ...POPULAR_SEARCHES]);
  for (const p of products) {
    dictionary.add(p.category.name);
    p.name.split(/\s+/).forEach((word) => {
      if (word.length >= 3) dictionary.add(word.replace(/[^a-zA-Z0-9-]/g, ""));
    });
  }

  let bestWord: string | null = null;
  let bestDist = 3; // max 2 typos allowed

  for (const word of dictionary) {
    const lower = word.toLowerCase();
    if (lower === q) return null;
    const dist = levenshtein(q, lower);
    if (dist < bestDist) {
      bestDist = dist;
      bestWord = word;
    }
  }
  return bestWord;
}

export function searchProducts(products: Product[], query: string, category?: string): Product[] {
  const q = query.trim().toLowerCase();
  return products.filter((p) => {
    const matchesCategory =
      !category || category === "All" || p.category.name.toLowerCase() === category.toLowerCase();
    if (!matchesCategory) return false;
    if (!q) return true;

    const inName = p.name.toLowerCase().includes(q);
    const inDesc = p.description.toLowerCase().includes(q);
    const inCat = p.category.name.toLowerCase().includes(q);
    const inSku = p.variants.some((v) => v.sku.toLowerCase().includes(q));
    const inAttrs = p.variants.some((v) =>
      Object.values(v.attributes || {}).some((val) => String(val).toLowerCase().includes(q))
    );

    return inName || inDesc || inCat || inSku || inAttrs;
  });
}