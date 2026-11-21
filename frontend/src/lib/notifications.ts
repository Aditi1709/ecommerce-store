export type NotificationChannel = "email" | "sms" | "whatsapp" | "push";

export type NotificationCategory =
  | "account"
  | "orders"
  | "alerts"
  | "marketing";

export interface NotificationItem {
  id: string;
  event: string;
  title: string;
  message: string;
  category: NotificationCategory;
  channels: NotificationChannel[];
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface NotificationPreferences {
  channels: Record<NotificationChannel, boolean>;
  categories: Record<NotificationCategory, boolean>;
}

const NOTIF_KEY = "storefront_notifications_v1";
const PREFS_KEY = "storefront_notif_prefs_v1";

export const DEFAULT_PREFS: NotificationPreferences = {
  channels: {
    email: true,
    sms: true,
    whatsapp: true,
    push: true,
  },
  categories: {
    account: true,
    orders: true,
    alerts: true,
    marketing: true,
  },
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "ntf-1",
    event: "Welcome Email",
    title: "Welcome to Zeno!",
    message: "Your account is active. Enjoy ₹100 off your first order with code FIRST100.",
    category: "account",
    channels: ["email", "push"],
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    link: "/account",
  },
  {
    id: "ntf-2",
    event: "Order Confirmation",
    title: "Order Confirmed",
    message: "Your order has been confirmed and is being prepared by the merchant.",
    category: "orders",
    channels: ["email", "sms", "whatsapp"],
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    link: "/track",
  },
  {
    id: "ntf-3",
    event: "Abandoned Cart Reminder",
    title: "You left items in your cart",
    message: "Complete your checkout now and unlock free shipping on orders over ₹999.",
    category: "alerts",
    channels: ["email", "whatsapp", "push"],
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    link: "/cart",
  },
];

const INITIAL_JSON = JSON.stringify(INITIAL_NOTIFICATIONS);
const DEFAULT_PREFS_JSON = JSON.stringify(DEFAULT_PREFS);

export function subscribeNotifications(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener("notifications-updated", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("notifications-updated", cb);
  };
}

export function getNotificationsSnapshot(): string {
  return localStorage.getItem(NOTIF_KEY) ?? INITIAL_JSON;
}

export function getServerNotificationsSnapshot(): string {
  return INITIAL_JSON;
}

export function parseNotifications(raw: string): NotificationItem[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_NOTIFICATIONS;
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

export function saveNotifications(list: NotificationItem[]) {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("notifications-updated"));
}

export function subscribeNotifPrefs(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener("notif-prefs-updated", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("notif-prefs-updated", cb);
  };
}

export function getNotifPrefsSnapshot(): string {
  return localStorage.getItem(PREFS_KEY) ?? DEFAULT_PREFS_JSON;
}

export function getServerNotifPrefsSnapshot(): string {
  return DEFAULT_PREFS_JSON;
}

export function parseNotifPrefs(raw: string): NotificationPreferences {
  try {
    const parsed = JSON.parse(raw);
    return {
      channels: { ...DEFAULT_PREFS.channels, ...(parsed?.channels || {}) },
      categories: { ...DEFAULT_PREFS.categories, ...(parsed?.categories || {}) },
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function saveNotifPrefs(prefs: NotificationPreferences) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  window.dispatchEvent(new Event("notif-prefs-updated"));
}

export interface NotificationTemplate {
  event: string;
  title: string;
  message: string;
  category: NotificationCategory;
  defaultChannels: NotificationChannel[];
  link: string;
}

export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    event: "Welcome Email",
    title: "Welcome to Zeno!",
    message: "Thanks for joining. Explore curated essentials from independent merchants.",
    category: "account",
    defaultChannels: ["email"],
    link: "/account",
  },
  {
    event: "Registration Confirmation",
    title: "Registration Confirmed",
    message: "Your email address has been verified and your account is ready.",
    category: "account",
    defaultChannels: ["email", "sms"],
    link: "/account",
  },
  {
    event: "Password Reset Email",
    title: "Password Reset Requested",
    message: "Use code 123456 to reset your Zeno password. Expires in 10 minutes.",
    category: "account",
    defaultChannels: ["email"],
    link: "/forgot-password",
  },
  {
    event: "Order Confirmation",
    title: "Order Confirmed",
    message: "We received your order and sent your GST invoice to your email.",
    category: "orders",
    defaultChannels: ["email", "sms", "whatsapp"],
    link: "/track",
  },
  {
    event: "Payment Confirmation",
    title: "Payment Received",
    message: "Your payment has been verified successfully. Receipt is ready for download.",
    category: "orders",
    defaultChannels: ["email", "sms"],
    link: "/payments",
  },
  {
    event: "Order Shipped",
    title: "Order Shipped via BlueDart",
    message: "Your package has been dispatched. Track live updates with your AWB number.",
    category: "orders",
    defaultChannels: ["email", "sms", "whatsapp", "push"],
    link: "/track",
  },
  {
    event: "Out for Delivery",
    title: "Out for Delivery Today",
    message: "Our delivery partner is on the way to your address with your package.",
    category: "orders",
    defaultChannels: ["sms", "whatsapp", "push"],
    link: "/track",
  },
  {
    event: "Delivery Confirmation",
    title: "Order Delivered ✓",
    message: "Your package was delivered. Let us know how you like your items!",
    category: "orders",
    defaultChannels: ["email", "whatsapp", "push"],
    link: "/account",
  },
  {
    event: "Order Cancellation",
    title: "Order Cancelled",
    message: "Your order has been cancelled as requested. No further action is needed.",
    category: "orders",
    defaultChannels: ["email", "sms"],
    link: "/track",
  },
  {
    event: "Refund Notification",
    title: "Refund Processed",
    message: "Your refund has been initiated and will reflect in 3–5 business days.",
    category: "orders",
    defaultChannels: ["email", "sms", "whatsapp"],
    link: "/payments",
  },
  {
    event: "Back-in-Stock",
    title: "Back in Stock!",
    message: "An item from your wishlist is available again. Grab it before it sells out.",
    category: "alerts",
    defaultChannels: ["email", "push"],
    link: "/wishlist",
  },
  {
    event: "Price Drop",
    title: "Price Drop Alert",
    message: "Good news! A product in your wishlist just dropped in price by 20%.",
    category: "alerts",
    defaultChannels: ["email", "whatsapp", "push"],
    link: "/wishlist",
  },
  {
    event: "Wishlist Reminder",
    title: "Items Waiting in Your Wishlist",
    message: "Your saved favorites are selling fast. Move them to your cart anytime.",
    category: "alerts",
    defaultChannels: ["email", "push"],
    link: "/wishlist",
  },
  {
    event: "Abandoned Cart Reminder",
    title: "Complete Your Order",
    message: "You still have items in your cart. Use code SAVE20 before checkout!",
    category: "alerts",
    defaultChannels: ["email", "whatsapp", "push"],
    link: "/cart",
  },
  {
    event: "Promotional Offer",
    title: "⚡ Flash Sale — Flat 20% Off",
    message: "Limited-time deal! Apply code SAVE20 at checkout on all categories.",
    category: "marketing",
    defaultChannels: ["email", "whatsapp", "push"],
    link: "/search",
  },
  {
    event: "Newsletter",
    title: "Weekly New Arrivals Digest",
    message: "Fresh drops from independent merchants are live on Zeno.",
    category: "marketing",
    defaultChannels: ["email"],
    link: "/",
  },
];

export function dispatchNotification(
  template: NotificationTemplate,
  prefs: NotificationPreferences
): { sent: boolean; reason?: string; item?: NotificationItem } {
  if (!prefs.categories[template.category]) {
    return { sent: false, reason: `Muted in "${template.category}" preferences.` };
  }

  const activeChannels = template.defaultChannels.filter((c) => prefs.channels[c]);
  if (activeChannels.length === 0) {
    return { sent: false, reason: "All channels for this alert are turned off." };
  }

  const item: NotificationItem = {
    id: `ntf-${Date.now()}`,
    event: template.event,
    title: template.title,
    message: template.message,
    category: template.category,
    channels: activeChannels,
    read: false,
    createdAt: new Date().toISOString(),
    link: template.link,
  };

  const current = parseNotifications(getNotificationsSnapshot());
  saveNotifications([item, ...current]);

  // Fire real Browser Push Notification if enabled & permitted
  if (
    activeChannels.includes("push") &&
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    new Notification(item.title, { body: item.message });
  }

  return { sent: true, item };
}