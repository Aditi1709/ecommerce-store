import { Product } from "@/lib/api";

export type TicketCategory =
  | "Order Complaint"
  | "Return Support"
  | "Refund Support"
  | "Report a Problem"
  | "General Inquiry";

export type TicketStatus = "Open" | "In Progress" | "Escalated" | "Resolved";

export interface SupportTicket {
  id: string;
  category: TicketCategory;
  orderId?: string;
  subject: string;
  description: string;
  status: TicketStatus;
  escalationLevel: 1 | 2 | 3; // 1: Support, 2: Senior Specialist, 3: Grievance Officer
  assignedTo: string;
  createdAt: string;
  updates: string[];
}

const TICKETS_KEY = "storefront_support_tickets_v1";

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: "TKT-2041",
    category: "Order Complaint",
    orderId: "ORD-88421",
    subject: "Package delayed at local hub",
    description: "Tracking has not updated since yesterday morning.",
    status: "In Progress",
    escalationLevel: 1,
    assignedTo: "Level 1 Support Desk",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updates: [
      "Ticket created and assigned to Level 1 Support.",
      "Courier partner BlueDart contacted for priority dispatch.",
    ],
  },
];

const INITIAL_JSON = JSON.stringify(INITIAL_TICKETS);

export function subscribeTickets(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener("tickets-updated", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("tickets-updated", cb);
  };
}

export function getTicketsSnapshot(): string {
  return localStorage.getItem(TICKETS_KEY) ?? INITIAL_JSON;
}

export function getServerTicketsSnapshot(): string {
  return INITIAL_JSON;
}

export function parseTickets(raw: string): SupportTicket[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_TICKETS;
  } catch {
    return INITIAL_TICKETS;
  }
}

export function saveTickets(list: SupportTicket[]) {
  localStorage.setItem(TICKETS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("tickets-updated"));
}

export function createSupportTicket(input: {
  category: TicketCategory;
  orderId?: string;
  subject: string;
  description: string;
}): SupportTicket {
  const ticket: SupportTicket = {
    id: `TKT-${Date.now().toString().slice(-4)}`,
    category: input.category,
    orderId: input.orderId?.trim() || undefined,
    subject: input.subject.trim(),
    description: input.description.trim(),
    status: "Open",
    escalationLevel: 1,
    assignedTo: "Level 1 Support Desk",
    createdAt: new Date().toISOString(),
    updates: ["Ticket created and queued for Level 1 Support."],
  };
  const current = parseTickets(getTicketsSnapshot());
  saveTickets([ticket, ...current]);
  return ticket;
}

export function escalateTicket(ticketId: string): SupportTicket | null {
  const current = parseTickets(getTicketsSnapshot());
  let updated: SupportTicket | null = null;
  const next = current.map((t) => {
    if (t.id !== ticketId || t.escalationLevel >= 3) return t;
    const nextLevel = (t.escalationLevel + 1) as 2 | 3;
    const assignee =
      nextLevel === 2
        ? "Level 2 Senior Support Specialist"
        : "Level 3 Grievance Officer (Priority)";
    updated = {
      ...t,
      status: "Escalated",
      escalationLevel: nextLevel,
      assignedTo: assignee,
      updates: [
        ...t.updates,
        `Escalated to ${assignee} at ${new Date().toLocaleTimeString("en-IN")}.`,
      ],
    };
    return updated;
  });
  saveTickets(next);
  return updated;
}

export const HELP_ARTICLES = [
  {
    topic: "Order-Related",
    q: "Where is my order and how do I track it?",
    a: "Visit the Order Tracking page (/track) and enter your Order ID or TXN ID to view live courier checkpoints and AWB details.",
  },
  {
    topic: "Returns",
    q: "How do I return or exchange an item?",
    a: "Items can be returned within 7 days of delivery from My Account → My Returns, or by raising a Return Support ticket below.",
  },
  {
    topic: "Refunds",
    q: "When will my refund be credited?",
    a: "Prepaid UPI/Card refunds are processed automatically within 2 business days and reflect in 3–5 business days.",
  },
  {
    topic: "Payments",
    q: "My payment failed but money was deducted. What should I do?",
    a: "Your cart is preserved automatically. Any debited amount is auto-refunded by the bank within 3–5 business days, or raise a Refund Support ticket.",
  },
  {
    topic: "Escalation",
    q: "How do I escalate an unresolved complaint?",
    a: "Open your ticket in the Support Tickets tab and click 'Escalate' to route it to a Senior Specialist or our statutory Grievance Officer.",
  },
];

export function generateAssistantReply(
  input: string,
  mode: "ai" | "live",
  products: Product[]
): { text: string; matchedProducts: Product[] } {
  const q = input.toLowerCase();

  if (mode === "live") {
    if (q.includes("refund")) {
      return {
        text: "Agent Riya: I can help with your refund! Please share your Order ID or open a Refund Support ticket on /support so we can prioritize it.",
        matchedProducts: [],
      };
    }
    if (q.includes("return") || q.includes("exchange")) {
      return {
        text: "Agent Riya: Returns and size exchanges are free within 7 days of delivery. You can initiate one directly from /account or /support.",
        matchedProducts: [],
      };
    }
    if (q.includes("track") || q.includes("order") || q.includes("delivery")) {
      return {
        text: "Agent Riya: You can view live BlueDart tracking and AWB updates anytime on /track. Need me to escalate a delayed shipment?",
        matchedProducts: [],
      };
    }
    return {
      text: "Agent Riya: Thanks for reaching out! I've noted your message. For faster resolution with a tracking number, you can also raise a ticket on /support or WhatsApp us at +91-98765-43210.",
      matchedProducts: [],
    };
  }

  // AI Shopping Assistant mode
  const budgetMatch = q.match(/under\s*₹?\s*(\d+)/);
  const maxInr = budgetMatch ? Number(budgetMatch[1]) : Infinity;

  const keywords = q
    .replace(/under\s*₹?\s*\d+/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !["show", "find", "need", "want", "best", "for", "with", "buy", "some"].includes(w));

  const matched = products
    .filter((p) => {
      const priceInr = (p.variants[0]?.price_minor || 0) / 100;
      if (priceInr > maxInr) return false;
      if (keywords.length === 0) return true;
      const hay = `${p.name} ${p.category.name} ${p.description}`.toLowerCase();
      return keywords.some((k) => hay.includes(k));
    })
    .slice(0, 3);

  if (matched.length > 0) {
    return {
      text:
        maxInr < Infinity
          ? `Here are top picks under ₹${maxInr} from our catalog:`
          : `Here are the best matches I found for you:`,
      matchedProducts: matched,
    };
  }

  if (q.includes("coupon") || q.includes("discount") || q.includes("offer")) {
    return {
      text: "You can use SAVE20 (20% off), FIRST100 (₹100 off), or FREESHIP (free shipping) at cart/checkout!",
      matchedProducts: [],
    };
  }

  return {
    text: "I'm your AI Shopping Assistant! Try asking: 'Show hoodies under 2000', 'Find sneakers', 'Electronics', or 'Any coupons?'",
    matchedProducts: [],
  };
}