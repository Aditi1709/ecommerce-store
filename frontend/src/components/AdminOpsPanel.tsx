"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/lib/api";
import { RETURN_STAGES } from "@/lib/returns";
import {
  BackendReturn,
  BackendTicket,
  fetchAllReturnsAdmin,
  fetchAllTicketsAdmin,
  updateBackendReturnStage,
  updateTicketStatusAdmin,
} from "@/lib/backendApi";

const TICKET_STATUSES = ["Open", "In Progress", "Escalated", "Resolved"];

export default function AdminOpsPanel() {
  const { token } = useAuth();
  const [returns, setReturns] = useState<BackendReturn[]>([]);
  const [tickets, setTickets] = useState<BackendTicket[]>([]);
  const [subTab, setSubTab] = useState<"returns" | "tickets">("returns");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    Promise.all([fetchAllReturnsAdmin(token), fetchAllTicketsAdmin(token)]).then(
      ([retList, tktList]) => {
        if (cancelled) return;
        setReturns(retList);
        setTickets(tktList);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [token]);

  const flash = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  };

  const handleReturnStage = async (id: string, stageIndex: number) => {
    if (!token) return;
    const updated = await updateBackendReturnStage(token, id, stageIndex);
    setReturns((prev) => prev.map((r) => (r.id === id ? updated : r)));
    flash(`Return ${id.slice(0, 8)} updated to "${RETURN_STAGES[stageIndex]}".`);
  };

  const handleTicketStatus = async (id: string, status: string) => {
    if (!token) return;
    const updated = await updateTicketStatusAdmin(token, id, status);
    setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
    flash(`Ticket ${id.slice(0, 8)} marked "${status}".`);
  };

  return (
    <section className="border rounded-2xl p-6 bg-white space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Customer Operations (PostgreSQL)</h2>
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => setSubTab("returns")}
            className={`px-3.5 py-1.5 rounded-lg font-medium ${
              subTab === "returns" ? "bg-black text-white" : "border hover:bg-gray-50"
            }`}
          >
            Returns ({returns.length})
          </button>
          <button
            onClick={() => setSubTab("tickets")}
            className={`px-3.5 py-1.5 rounded-lg font-medium ${
              subTab === "tickets" ? "bg-black text-white" : "border hover:bg-gray-50"
            }`}
          >
            Support Tickets ({tickets.length})
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs font-medium">
          {msg}
        </div>
      )}

      {subTab === "returns" ? (
        returns.length === 0 ? (
          <p className="text-sm text-gray-500">No return requests in database.</p>
        ) : (
          <div className="space-y-3">
            {returns.map((r) => (
              <div
                key={r.id}
                className="border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <p className="font-mono font-bold text-sm">
                    {r.id.slice(0, 8)} • <span className="uppercase">{r.action_type}</span> •{" "}
                    {formatPrice(r.amount_minor)}
                  </p>
                  <p className="text-gray-600">
                    Order: <span className="font-mono">{r.order_id.slice(0, 10)}</span> • Reason:{" "}
                    {r.reason}
                  </p>
                  <p className="text-gray-400">Refund Status: {r.refund_status}</p>
                </div>

                <select
                  value={r.stage_index}
                  onChange={(e) => handleReturnStage(r.id, Number(e.target.value))}
                  className="border rounded-lg px-2.5 py-1.5 bg-gray-50"
                >
                  {RETURN_STAGES.map((label, idx) => (
                    <option key={label} value={idx}>
                      {idx + 1}. {label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )
      ) : tickets.length === 0 ? (
        <p className="text-sm text-gray-500">No support tickets in database.</p>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div
              key={t.id}
              className="border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5 max-w-xl">
                <p className="font-semibold text-sm">
                  <span className="font-mono">{t.id.slice(0, 8)}</span> — {t.subject}
                </p>
                <p className="text-gray-600">{t.description}</p>
                <p className="text-gray-400">
                  {t.category} • Level {t.escalation_level}/3 ({t.assigned_to})
                  {t.order_id ? ` • Order: ${t.order_id}` : ""}
                </p>
              </div>

              <select
                value={t.status}
                onChange={(e) => handleTicketStatus(t.id, e.target.value)}
                className="border rounded-lg px-2.5 py-1.5 bg-gray-50"
              >
                {TICKET_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}