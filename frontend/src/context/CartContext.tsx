"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";

export interface CartItem {
  variantId: string;
  productName: string;
  slug: string;
  sku: string;
  label: string;
  priceMinor: number;
  imageUrl: string | null;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  savedForLater: CartItem[];
  wishlist: CartItem[];
  couponCode: string;
  giftWrap: boolean;
  giftMessage: string;
  specialInstructions: string;
  updatedAt: number;
}

const DEFAULT_STATE: CartState = {
  items: [],
  savedForLater: [],
  wishlist: [],
  couponCode: "",
  giftWrap: false,
  giftMessage: "",
  specialInstructions: "",
  updatedAt: 0,
};

const STORAGE_KEY = "storefront_cart_v2";
const EMPTY_JSON = JSON.stringify(DEFAULT_STATE);

function subscribeCart(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener("cart-updated", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("cart-updated", cb);
  };
}

function getCartSnapshot() {
  return localStorage.getItem(STORAGE_KEY) ?? EMPTY_JSON;
}

function getServerSnapshot() {
  return EMPTY_JSON;
}

function saveState(next: CartState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, updatedAt: Date.now() }));
  window.dispatchEvent(new Event("cart-updated"));
}

export const FREE_SHIPPING_MIN_MINOR = 99900; // ₹999
export const SHIPPING_FEE_MINOR = 7900; // ₹79
export const GIFT_WRAP_FEE_MINOR = 4900; // ₹49

interface CartContextType {
  items: CartItem[];
  savedForLater: CartItem[];
  wishlist: CartItem[];
  couponCode: string;
  giftWrap: boolean;
  giftMessage: string;
  specialInstructions: string;
  itemCount: number;
  subtotalMinor: number;
  discountMinor: number;
  shippingMinor: number;
  giftWrapMinor: number;
  taxMinor: number;
  totalMinor: number;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  changeVariant: (oldVariantId: string, nextVariant: Omit<CartItem, "quantity">) => void;
  saveForLater: (variantId: string) => void;
  moveSavedToCart: (variantId: string) => void;
  removeSaved: (variantId: string) => void;
  moveToWishlist: (variantId: string) => void;
  moveWishlistToCart: (variantId: string) => void;
  removeWishlist: (variantId: string) => void;
  applyCoupon: (code: string) => { ok: boolean; message: string };
  removeCoupon: () => void;
  setGiftWrap: (enabled: boolean) => void;
  setGiftMessage: (msg: string) => void;
  setSpecialInstructions: (notes: string) => void;
  importItems: (incoming: CartItem[]) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribeCart, getCartSnapshot, getServerSnapshot);

  const state: CartState = useMemo(() => {
    try {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_STATE, ...parsed };
    } catch {
      return DEFAULT_STATE;
    }
  }, [raw]);

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotalMinor = state.items.reduce((sum, i) => sum + i.priceMinor * i.quantity, 0);

  let discountMinor = 0;
  if (state.couponCode === "SAVE20") {
    discountMinor = Math.round(subtotalMinor * 0.2);
  } else if (state.couponCode === "FIRST100") {
    discountMinor = Math.min(subtotalMinor, 10000);
  }

  const shippingMinor =
    state.items.length === 0 ||
    subtotalMinor >= FREE_SHIPPING_MIN_MINOR ||
    state.couponCode === "FREESHIP"
      ? 0
      : SHIPPING_FEE_MINOR;

  const giftWrapMinor = state.items.length > 0 && state.giftWrap ? GIFT_WRAP_FEE_MINOR : 0;
  const taxableMinor = Math.max(0, subtotalMinor - discountMinor);
  const taxMinor = Math.round(taxableMinor * 0.18); // 18% GST
  const totalMinor = taxableMinor + taxMinor + shippingMinor + giftWrapMinor;

  const addItem = (item: Omit<CartItem, "quantity">) => {
    const existing = state.items.find((i) => i.variantId === item.variantId);
    const items = existing
      ? state.items.map((i) =>
          i.variantId === item.variantId ? { ...i, quantity: i.quantity + 1 } : i
        )
      : [...state.items, { ...item, quantity: 1 }];
    saveState({ ...state, items });
  };

  const removeItem = (variantId: string) => {
    saveState({ ...state, items: state.items.filter((i) => i.variantId !== variantId) });
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(variantId);
      return;
    }
    saveState({
      ...state,
      items: state.items.map((i) => (i.variantId === variantId ? { ...i, quantity } : i)),
    });
  };

  const changeVariant = (oldVariantId: string, nextVariant: Omit<CartItem, "quantity">) => {
    const current = state.items.find((i) => i.variantId === oldVariantId);
    if (!current) return;
    const withoutOld = state.items.filter((i) => i.variantId !== oldVariantId);
    const existingTarget = withoutOld.find((i) => i.variantId === nextVariant.variantId);
    const items = existingTarget
      ? withoutOld.map((i) =>
          i.variantId === nextVariant.variantId
            ? { ...i, quantity: i.quantity + current.quantity }
            : i
        )
      : [...withoutOld, { ...nextVariant, quantity: current.quantity }];
    saveState({ ...state, items });
  };

  const saveForLater = (variantId: string) => {
    const target = state.items.find((i) => i.variantId === variantId);
    if (!target) return;
    const items = state.items.filter((i) => i.variantId !== variantId);
    const savedForLater = [
      target,
      ...state.savedForLater.filter((i) => i.variantId !== variantId),
    ];
    saveState({ ...state, items, savedForLater });
  };

  const moveSavedToCart = (variantId: string) => {
    const target = state.savedForLater.find((i) => i.variantId === variantId);
    if (!target) return;
    const savedForLater = state.savedForLater.filter((i) => i.variantId !== variantId);
    const existing = state.items.find((i) => i.variantId === variantId);
    const items = existing
      ? state.items.map((i) =>
          i.variantId === variantId ? { ...i, quantity: i.quantity + target.quantity } : i
        )
      : [...state.items, target];
    saveState({ ...state, items, savedForLater });
  };

  const removeSaved = (variantId: string) => {
    saveState({
      ...state,
      savedForLater: state.savedForLater.filter((i) => i.variantId !== variantId),
    });
  };

  const moveToWishlist = (variantId: string) => {
    const target = state.items.find((i) => i.variantId === variantId);
    if (!target) return;
    const items = state.items.filter((i) => i.variantId !== variantId);
    const wishlist = [target, ...state.wishlist.filter((i) => i.variantId !== variantId)];
    saveState({ ...state, items, wishlist });
  };

  const moveWishlistToCart = (variantId: string) => {
    const target = state.wishlist.find((i) => i.variantId === variantId);
    if (!target) return;
    const wishlist = state.wishlist.filter((i) => i.variantId !== variantId);
    const existing = state.items.find((i) => i.variantId === variantId);
    const items = existing
      ? state.items.map((i) =>
          i.variantId === variantId ? { ...i, quantity: i.quantity + 1 } : i
        )
      : [...state.items, { ...target, quantity: 1 }];
    saveState({ ...state, items, wishlist });
  };

  const removeWishlist = (variantId: string) => {
    saveState({
      ...state,
      wishlist: state.wishlist.filter((i) => i.variantId !== variantId),
    });
  };

  const applyCoupon = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (!["SAVE20", "FIRST100", "FREESHIP"].includes(clean)) {
      return { ok: false, message: "Invalid coupon. Try SAVE20, FIRST100, or FREESHIP." };
    }
    saveState({ ...state, couponCode: clean });
    return { ok: true, message: `Coupon ${clean} applied!` };
  };

  const removeCoupon = () => saveState({ ...state, couponCode: "" });
  const setGiftWrap = (giftWrap: boolean) => saveState({ ...state, giftWrap });
  const setGiftMessage = (giftMessage: string) => saveState({ ...state, giftMessage });
  const setSpecialInstructions = (specialInstructions: string) =>
    saveState({ ...state, specialInstructions });

  const importItems = (incoming: CartItem[]) => {
    const merged = [...state.items];
    for (const item of incoming) {
      const idx = merged.findIndex((i) => i.variantId === item.variantId);
      if (idx >= 0) {
        merged[idx] = { ...merged[idx], quantity: merged[idx].quantity + item.quantity };
      } else {
        merged.push(item);
      }
    }
    saveState({ ...state, items: merged });
  };

  const clearCart = () =>
    saveState({
      ...state,
      items: [],
      couponCode: "",
      giftWrap: false,
      giftMessage: "",
      specialInstructions: "",
    });

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        savedForLater: state.savedForLater,
        wishlist: state.wishlist,
        couponCode: state.couponCode,
        giftWrap: state.giftWrap,
        giftMessage: state.giftMessage,
        specialInstructions: state.specialInstructions,
        itemCount,
        subtotalMinor,
        discountMinor,
        shippingMinor,
        giftWrapMinor,
        taxMinor,
        totalMinor,
        addItem,
        removeItem,
        updateQuantity,
        changeVariant,
        saveForLater,
        moveSavedToCart,
        removeSaved,
        moveToWishlist,
        moveWishlistToCart,
        removeWishlist,
        applyCoupon,
        removeCoupon,
        setGiftWrap,
        setGiftMessage,
        setSpecialInstructions,
        importItems,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}