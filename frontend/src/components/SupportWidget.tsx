"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Product, formatPrice } from "@/lib/api";
import { generateAssistantReply } from "@/lib/support";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  products?: Product[];
}

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"ai" | "live">("ai");
  const [input, setInput] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Hi! I'm your AI Shopping Assistant & Support Bot. Ask me to find products (e.g. 'hoodie under 2000') or switch to Live Chat.",
    },
  ]);

  useEffect(() => {
    if (!open || products.length > 0) return;
    let cancelled = false;
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}`;
    fetch(`${API_BASE}/products/?limit=100`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setProducts(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, products.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = input.trim();
    if (!clean) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: clean,
    };
    const reply = generateAssistantReply(clean, mode, products);
    const botMsg: ChatMessage = {
      id: `b-${Date.now() + 1}`,
      sender: "bot",
      text: reply.text,
      products: reply.matchedProducts,
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="w-80 sm:w-96 bg-white border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[520px]">
          {/* Header */}
          <div className="bg-black text-white p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-sm">
                {mode === "ai" ? "AI Shopping Assistant" : "Live Support Chat"}
              </p>
              <p className="text-[11px] text-gray-300">
                {mode === "ai" ? "Instant product & FAQ help" : "Connected to Agent Riya ● Online"}
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="text-lg leading-none px-1">
              ×
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="flex border-b text-xs bg-gray-50 p-1.5 gap-1.5">
            <button
              onClick={() => setMode("ai")}
              className={`flex-1 py-1.5 rounded-lg font-medium ${
                mode === "ai" ? "bg-black text-white" : "text-gray-600"
              }`}
            >
              AI Assistant
            </button>
            <button
              onClick={() => setMode("live")}
              className={`flex-1 py-1.5 rounded-lg font-medium ${
                mode === "live" ? "bg-black text-white" : "text-gray-600"
              }`}
            >
              Live Chat
            </button>
            <Link
              href="/support"
              onClick={() => setOpen(false)}
              className="px-2.5 py-1.5 rounded-lg border bg-white text-gray-700 hover:border-black"
            >
              Help Center
            </Link>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`px-3 py-2 rounded-xl max-w-[85%] ${
                    m.sender === "user" ? "bg-black text-white" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {m.text}
                </div>
                {m.products && m.products.length > 0 && (
                  <div className="mt-2 space-y-1.5 w-full">
                    {m.products.map((p) => (
                      <Link
                        key={p.id}
                        href={`/products/${p.slug}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 p-2 border rounded-lg hover:border-black bg-white"
                      >
                        <img
                          src={p.variants[0]?.image_url || "https://placehold.co/48x48"}
                          alt={p.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold truncate">{p.name}</p>
                          <p className="text-gray-500">
                            {p.variants[0] ? formatPrice(p.variants[0].price_minor) : ""}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="border-t p-2.5 flex gap-2 bg-white">
            <input
              placeholder={mode === "ai" ? "Ask AI: 'hoodies under 2000'..." : "Type a message..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-black"
            />
            <button className="px-3 py-1.5 bg-black text-white rounded-lg text-xs font-medium">
              Send
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-3 rounded-full bg-black text-white text-xs font-semibold shadow-xl hover:bg-gray-800 flex items-center gap-2"
        >
          <span>💬</span>
          <span>Live Chat & AI</span>
        </button>
      )}
    </div>
  );
}