const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export interface BackendAddress {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
}

export interface BackendOrder {
  id: string;
  status: string;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  payment_method: string;
  total_minor: number;
  created_at: string;
}

export interface TrackedOrder extends BackendOrder {
  stage_index: number;
  cancelled: boolean;
  courier: string;
  tracking_number: string;
}

export interface BackendReturn {
  id: string;
  user_id: string;
  order_id: string;
  action_type: string;
  reason: string;
  exchange_variant?: string | null;
  pickup_date?: string | null;
  pickup_slot?: string | null;
  refund_method?: string | null;
  amount_minor: number;
  stage_index: number;
  refund_status: string;
  created_at: string;
}

export interface BackendTicket {
  id: string;
  user_id?: string | null;
  order_id?: string | null;
  category: string;
  subject: string;
  description: string;
  status: string;
  escalation_level: number;
  assigned_to: string;
  created_at: string;
}

function authHeaders(token?: string | null): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// --- Addresses ---
export async function fetchMyAddresses(token: string): Promise<BackendAddress[]> {
  const res = await fetch(`${API_BASE}/addresses/`, { headers: authHeaders(token) });
  return res.ok ? res.json() : [];
}

export async function createBackendAddress(
  token: string,
  payload: Omit<BackendAddress, "id">
): Promise<BackendAddress> {
  const res = await fetch(`${API_BASE}/addresses/`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to save address");
  return data;
}

export async function updateBackendAddress(
  token: string,
  id: string,
  payload: Omit<BackendAddress, "id">
): Promise<BackendAddress> {
  const res = await fetch(`${API_BASE}/addresses/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to update address");
  return data;
}

export async function deleteBackendAddress(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/addresses/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to delete address");
}

// --- Orders ---
export async function fetchMyOrders(token: string): Promise<BackendOrder[]> {
  const res = await fetch(`${API_BASE}/orders/me`, { headers: authHeaders(token) });
  return res.ok ? res.json() : [];
}

export async function fetchTrackedOrder(orderId: string): Promise<TrackedOrder> {
  const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}/track`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Order not found");
  return data;
}

export async function cancelBackendOrder(token: string, orderId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}/cancel`, {
    method: "POST",
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Could not cancel order");
}

// --- Returns ---
export async function fetchMyReturns(token: string): Promise<BackendReturn[]> {
  const res = await fetch(`${API_BASE}/returns/me`, { headers: authHeaders(token) });
  return res.ok ? res.json() : [];
}

export async function createBackendReturn(
  token: string,
  payload: {
    order_id: string;
    action_type: string;
    reason: string;
    exchange_variant?: string;
    pickup_date?: string;
    pickup_slot?: string;
    refund_method?: string;
  }
): Promise<BackendReturn> {
  const res = await fetch(`${API_BASE}/returns/`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to submit return request");
  return data;
}

export async function updateBackendReturnStage(
  token: string,
  returnId: string,
  stageIndex: number
): Promise<BackendReturn> {
  const res = await fetch(`${API_BASE}/returns/${encodeURIComponent(returnId)}/stage`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ stage_index: stageIndex }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to update return stage");
  return data;
}

// --- Support Tickets ---
export async function fetchMyTickets(token: string): Promise<BackendTicket[]> {
  const res = await fetch(`${API_BASE}/support/me`, { headers: authHeaders(token) });
  return res.ok ? res.json() : [];
}

export async function createBackendTicket(
  token: string,
  payload: { category: string; order_id?: string; subject: string; description: string }
): Promise<BackendTicket> {
  const res = await fetch(`${API_BASE}/support/tickets`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to create ticket");
  return data;
}

export async function escalateBackendTicket(
  token: string,
  ticketId: string
): Promise<BackendTicket> {
  const res = await fetch(
    `${API_BASE}/support/tickets/${encodeURIComponent(ticketId)}/escalate`,
    {
      method: "POST",
      headers: authHeaders(token),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to escalate ticket");
  return data;
}

export interface BackendWishlistItem {
    id: string;
    list_name: string;
    variant_id: string;
    product_name: string;
    slug: string;
    sku: string;
    label: string;
    price_minor: number;
    image_url?: string | null;
    price_drop_alert: boolean;
    back_in_stock_alert: boolean;
    created_at: string;
  }
  
  export interface BackendReview {
    id: string;
    user_id: string;
    user_name: string;
    product_slug: string;
    product_name: string;
    rating: number;
    comment: string;
    created_at: string;
  }
  
  export interface BackendNotification {
    id: string;
    event: string;
    title: string;
    message: string;
    category: string;
    channels: string;
    is_read: boolean;
    link?: string | null;
    created_at: string;
  }
  
  // --- Wishlists ---
  export async function fetchMyWishlist(token: string): Promise<BackendWishlistItem[]> {
    const res = await fetch(`${API_BASE}/wishlists/me`, { headers: authHeaders(token) });
    return res.ok ? res.json() : [];
  }
  
  export async function addBackendWishlistItem(
    token: string,
    payload: Omit<BackendWishlistItem, "id" | "created_at">
  ): Promise<BackendWishlistItem> {
    const res = await fetch(`${API_BASE}/wishlists/`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to add to wishlist");
    return data;
  }
  
  export async function toggleBackendWishlistAlert(
    token: string,
    itemId: string,
    payload: { price_drop_alert?: boolean; back_in_stock_alert?: boolean }
  ): Promise<BackendWishlistItem> {
    const res = await fetch(`${API_BASE}/wishlists/${encodeURIComponent(itemId)}/alerts`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to update alert");
    return data;
  }
  
  export async function deleteBackendWishlistItem(token: string, itemId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/wishlists/${encodeURIComponent(itemId)}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    if (!res.ok) throw new Error("Failed to remove wishlist item");
  }
  
  // --- Reviews ---
  export async function fetchProductReviews(slug: string): Promise<BackendReview[]> {
    const res = await fetch(`${API_BASE}/reviews/product/${encodeURIComponent(slug)}`);
    return res.ok ? res.json() : [];
  }
  
  export async function createBackendReview(
    token: string,
    payload: { product_slug: string; product_name: string; rating: number; comment: string }
  ): Promise<BackendReview> {
    const res = await fetch(`${API_BASE}/reviews/`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to post review");
    return data;
  }
  
  // --- Notifications ---
  export async function fetchMyNotifications(token: string): Promise<BackendNotification[]> {
    const res = await fetch(`${API_BASE}/notifications/me`, { headers: authHeaders(token) });
    return res.ok ? res.json() : [];
  }
  
  export async function createBackendNotification(
    token: string,
    payload: {
      event: string;
      title: string;
      message: string;
      category: string;
      channels: string;
      link?: string;
    }
  ): Promise<BackendNotification> {
    const res = await fetch(`${API_BASE}/notifications/`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to send notification");
    return data;
  }
  
  export async function markBackendNotificationRead(token: string, notifId: string): Promise<void> {
    await fetch(`${API_BASE}/notifications/${encodeURIComponent(notifId)}/read`, {
      method: "PATCH",
      headers: authHeaders(token),
    });
  }
  
  export async function markAllBackendNotificationsRead(token: string): Promise<void> {
    await fetch(`${API_BASE}/notifications/mark-all-read`, {
      method: "POST",
      headers: authHeaders(token),
    });
  }

  // --- Admin: All Returns & Support Tickets ---
export async function fetchAllReturnsAdmin(token: string): Promise<BackendReturn[]> {
    const res = await fetch(`${API_BASE}/returns/all`, { headers: authHeaders(token) });
    return res.ok ? res.json() : [];
  }
  
  export async function fetchAllTicketsAdmin(token: string): Promise<BackendTicket[]> {
    const res = await fetch(`${API_BASE}/support/all`, { headers: authHeaders(token) });
    return res.ok ? res.json() : [];
  }
  
  export async function updateTicketStatusAdmin(
    token: string,
    ticketId: string,
    status: string
  ): Promise<BackendTicket> {
    const res = await fetch(
      `${API_BASE}/support/tickets/${encodeURIComponent(ticketId)}/status`,
      {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify({ status }),
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to update ticket status");
    return data;
  }