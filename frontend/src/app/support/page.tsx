"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { HELP_ARTICLES, TicketCategory } from "@/lib/support";
import {
  BackendTicket,
  createBackendTicket,
  escalateBackendTicket,
  fetchMyTickets,
} from "@/lib/backendApi";

const CATEGORIES: TicketCategory[] = [
  "Order Complaint",
  "Return Support",
  "Refund Support",
  "Report a Problem",
  "General Inquiry",
];

export default function SupportCenterPage() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<BackendTicket[]>([]);
  const [helpSearch, setHelpSearch] = useState("");
  const [category, setCategory] = useState<TicketCategory>("Order Complaint");
  const [orderId, setOrderId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchMyTickets(token).then((list) => {
      if (!cancelled) setTickets(list);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const filteredArticles = useMemo(() => {
    const q = helpSearch.trim().toLowerCase();
    if (!q) return HELP_ARTICLES;
    return HELP_ARTICLES.filter(
      (a) =>
        a.q.toLowerCase().includes(q) ||
        a.a.toLowerCase().includes(q) ||
        a.topic.toLowerCase().includes(q)
    );
  }, [helpSearch]);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Please log in to create a support ticket.");
      return;
    }
    setError("");
    setMsg("");
    setSubmitting(true);
    try {
      const created = await createBackendTicket(token, {
        category,
        order_id: orderId.trim() || undefined,
        subject: subject.trim(),
        description: description.trim(),
      });
      setTickets((prev) => [created, ...prev]);
      setOrderId("");
      setSubject("");
      setDescription("");
      setMsg(`Ticket ${created.id.slice(0, 8)} saved to database!`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEscalate = async (ticketId: string) => {
    if (!token) return;
    setError("");
    try {
      const updated = await escalateBackendTicket(token, ticketId);
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
      setMsg(`Ticket escalated to ${updated.assigned_to}.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Escalation failed");
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
      <section className="rounded-2xl bg-black text-white p-8 space-y-4">
        <h1 className="text-3xl font-bold">Help Center & Customer Support</h1>
        <input
          placeholder="Search help articles (refund, return, tracking, escalation)..."
          value={helpSearch}
          onChange={(e) => setHelpSearch(e.target.value)}
          className="w-full max-w-xl px-4 py-2.5 rounded-xl bg-white text-black text-sm focus:outline-none"
        />
      </section>

      {error && <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
      {msg && <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm">{msg}</div>}

      {/* Help Articles */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredArticles.map((art) => (
          <div key={art.q} className="border rounded-xl p-5 bg-white space-y-1.5">
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
              {art.topic}
            </span>
            <h3 className="font-semibold text-sm">{art.q}</h3>
            <p className="text-xs text-gray-600">{art.a}</p>
          </div>
        ))}
      </section>

      {/* Ticket Form + Live DB Tickets */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <form onSubmit={handleSubmitTicket} className="lg:col-span-2 border rounded-2xl p-6 bg-white space-y-4 h-fit text-sm">
          <h2 className="text-xl font-bold">Raise a Support Ticket</h2>
          {!token && (
            <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg">
              Please <Link href="/login" className="underline font-semibold">login</Link> to submit and track tickets.
            </p>
          )}
          <select value={category} onChange={(e) => setCategory(e.target.value as TicketCategory)} className="w-full border rounded-lg px-3 py-2">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input placeholder="Order ID (optional)" value={orderId} onChange={(e) => setOrderId(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          <input required placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          <textarea required rows={4} placeholder="Describe the issue..." value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          <button disabled={submitting || !token} className="w-full py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-300">
            {submitting ? "Submitting..." : "Submit Ticket"}
          </button>
        </form>

        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-xl font-bold">Your Support Tickets ({tickets.length})</h2>
          {tickets.length === 0 ? (
            <div className="border rounded-2xl p-10 text-center text-sm text-gray-500 bg-white">
              {token ? "No support tickets yet." : "Log in to view your support tickets."}
            </div>
          ) : (
            tickets.map((t) => (
              <div key={t.id} className="border rounded-2xl p-5 bg-white space-y-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">{t.id.slice(0, 8)}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{t.category}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${t.status === "Escalated" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-800"}`}>
                      {t.status}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">Level {t.escalation_level} / 3</span>
                </div>
                <p className="font-semibold">{t.subject}</p>
                <p className="text-xs text-gray-600">{t.description}</p>
                <p className="text-[11px] text-gray-400">
                  Assigned to: <strong>{t.assigned_to}</strong>
                  {t.order_id ? ` • Order: ${t.order_id}` : ""}
                </p>
                {t.status !== "Resolved" && t.escalation_level < 3 && (
                  <button
                    onClick={() => handleEscalate(t.id)}
                    className="px-3.5 py-1.5 border border-red-300 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50"
                  >
                    Escalate to Level {t.escalation_level + 1}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}