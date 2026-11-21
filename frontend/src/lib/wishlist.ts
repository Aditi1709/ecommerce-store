export interface WishlistItem {
    variantId: string;
    productName: string;
    slug: string;
    sku: string;
    label: string;
    priceMinor: number;
    imageUrl: string | null;
    inStock: boolean;
    priceDropAlert: boolean;
    backInStockAlert: boolean;
    addedAt: string;
  }
  
  export interface WishlistCollection {
    id: string;
    name: string;
    items: WishlistItem[];
  }
  
  const WISHLIST_KEY = "storefront_wishlists_v1";
  
  const DEFAULT_COLLECTIONS: WishlistCollection[] = [
    { id: "wl-default", name: "Favorites", items: [] },
  ];
  
  const DEFAULT_JSON = JSON.stringify(DEFAULT_COLLECTIONS);
  
  export function subscribeWishlists(cb: () => void) {
    window.addEventListener("storage", cb);
    window.addEventListener("wishlists-updated", cb);
    return () => {
      window.removeEventListener("storage", cb);
      window.removeEventListener("wishlists-updated", cb);
    };
  }
  
  export function getWishlistsSnapshot(): string {
    return localStorage.getItem(WISHLIST_KEY) ?? DEFAULT_JSON;
  }
  
  export function getServerWishlistsSnapshot(): string {
    return DEFAULT_JSON;
  }
  
  export function parseWishlists(raw: string): WishlistCollection[] {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      return DEFAULT_COLLECTIONS;
    } catch {
      return DEFAULT_COLLECTIONS;
    }
  }
  
  export function saveWishlists(next: WishlistCollection[]) {
    const safe = next.length > 0 ? next : DEFAULT_COLLECTIONS;
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(safe));
    window.dispatchEvent(new Event("wishlists-updated"));
  }