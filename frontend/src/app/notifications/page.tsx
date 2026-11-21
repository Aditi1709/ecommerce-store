"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { NOTIFICATION_TEMPLATES } from "@/lib/notifications";
import {
  BackendNotification,
  createBackendNotification,
  fetchMyNotifications,
  markAllBackendNotificationsRead,
  markBackendNotificationRead,
} from "@/lib/backendApi";

export default function NotificationsPage() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<BackendNotification[]>([]);
  const [tab, setTab] = useState<"inbox" | "triggers">("inbox");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchMyNotifications(token).then((list) => {
      if (!cancelled) setNotifications(list);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  const filtered = useMemo(
    () => (onlyUnread ? notifications.filter((n) => !n.is_read) : notifications),
    [notifications, onlyUnread]
  );

  const flash = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  };

  const handleMarkRead = async (id: string) => {
    if (!token) return;
    await markBackendNotificationRead(token, id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    await markAllBackendNotificationsRead(token);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    flash("All notifications marked as read.");
  };

  if (!token) {
    return (
      <main className="max-w-xl mx-auto px-6 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold">Sign in to view notifications</h1>
        <Link href="/login" className="inline-block px-6 py-2.5 bg-black text-white rounded-lg text-sm">
          Login
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">Synced directly with PostgreSQL.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab("inbox")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === "inbox" ? "bg-black text-white" : "border hover:bg-gray-50"
            }`}
          >
            Inbox ({unreadCount})
          </button>
          <button
            onClick={() => setTab("triggers")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === "triggers" ? "bg-black text-white" : "border hover:bg-gray-50"
            }`}
          >
            Test All 16 Alerts
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm font-medium">
          {msg}
        </div>
      )}

      {tab === "inbox" ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b pb-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyUnread}
                onChange={(e) => setOnlyUnread(e.target.checked)}
              />
              <span>Unread only</span>
            </label>
            <button onClick={handleMarkAllRead} className="underline text-gray-600 hover:text-black">
              Mark all read
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="border rounded-2xl p-12 text-center text-sm text-gray-500 bg-white">
              No notifications yet. Fire a test alert in the &ldquo;Test All 16 Alerts&rdquo; tab.
            </div>
          ) : (
            filtered.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.is_read && handleMarkRead(n.id)}
                className={`border rounded-xl p-4 flex items-center justify-between gap-4 cursor-pointer ${
                  n.is_read ? "bg-white" : "bg-blue-50/40 border-blue-200"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                    <span className="font-semibold text-sm">{n.title}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                      {n.event}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{n.message}</p>
                  <p className="text-[11px] text-gray-400 uppercase">
                    {new Date(n.created_at).toLocaleString("en-IN")} • {n.channels}
                  </p>
                </div>
                {n.link && (
                  <Link href={n.link} className="px-3.5 py-1.5 border rounded-lg text-xs font-medium shrink-0">
                    View →
                  </Link>
                )}
              </div>
            ))
          )}
        </section>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {NOTIFICATION_TEMPLATES.map((tpl) => (
            <div key={tpl.event} className="border rounded-xl p-4 bg-white flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="font-semibold truncate">{tpl.event}</p>
                <p className="text-xs text-gray-500 truncate">{tpl.title}</p>
              </div>
              <button
                onClick={async () => {
                  const created = await createBackendNotification(token, {
                    event: tpl.event,
                    title: tpl.title,
                    message: tpl.message,
                    category: tpl.category,
                    channels: tpl.defaultChannels.join(","),
                    link: tpl.link,
                  });
                  setNotifications((prev) => [created, ...prev]);
                  flash(`Saved "${tpl.event}" to PostgreSQL!`);
                }}
                className="px-3 py-1.5 bg-black text-white rounded-lg text-xs font-medium shrink-0"
              >
                Send
              </button>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}