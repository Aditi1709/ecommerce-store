"use client";

import { Suspense, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth, ROLE_RANK } from "@/context/AuthContext";
import { Product, formatPrice } from "@/lib/api";

import {
  MEGA_MENU,
  TRENDING_SEARCHES,
  POPULAR_SEARCHES,
  getTypoSuggestion,
  searchProducts,
} from "@/lib/searchUtils";

interface SpeechRecognitionEventLike {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}

interface SpeechRecognitionLike {
  lang: string;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
}

const EMPTY_HISTORY = "[]";
function subscribeHistory(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener("history-updated", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("history-updated", cb);
  };
}
const getHistorySnapshot = () => localStorage.getItem("search_history") ?? EMPTY_HISTORY;
const getServerHistorySnapshot = () => EMPTY_HISTORY;

function NavbarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";

  const { itemCount } = useCart();
  const { user, logout } = useAuth();
  const rank = user ? ROLE_RANK[user.role] ?? 0 : 0;

  const [products, setProducts] = useState<Product[]>([]);
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);
  const [query, setQuery] = useState(urlQuery);
  const [searchOpen, setSearchOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery);
    setQuery(urlQuery);
  }

  const rawHistory = useSyncExternalStore(
    subscribeHistory,
    getHistorySnapshot,
    getServerHistorySnapshot
  );
  const history: string[] = useMemo(() => {
    try {
      const parsed = JSON.parse(rawHistory);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [rawHistory]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}/products/`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setProducts(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const suggestions = useMemo(
    () => (query.trim() ? searchProducts(products, query).slice(0, 5) : []),
    [products, query]
  );

  const typoSuggestion = useMemo(
    () => (query.trim() && suggestions.length === 0 ? getTypoSuggestion(query, products) : null),
    [query, suggestions.length, products]
  );

  const saveHistory = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    const updated = [clean, ...history.filter((h) => h.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
    localStorage.setItem("search_history", JSON.stringify(updated));
    window.dispatchEvent(new Event("history-updated"));
  };

  const clearHistory = () => {
    localStorage.removeItem("search_history");
    window.dispatchEvent(new Event("history-updated"));
  };

  const goSearch = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setQuery(clean);
    saveHistory(clean);
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(clean)}`);
  };

  const handleVoiceSearch = () => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SpeechRec = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Voice search is not supported in this browser.");
      return;
    }
    const rec = new SpeechRec();
    rec.lang = "en-IN";
    setListening(true);
    rec.onresult = (e) => {
      const spoken = e.results[0][0].transcript;
      setQuery(spoken);
      goSearch(spoken);
    };
    rec.onend = () => setListening(false);
    rec.start();
  };

  return (
    <header className="border-b bg-white sticky top-0 z-40">
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo + Mega Menu Trigger */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold shrink-0">
            Zeno
          </Link>

          <div
            className="relative hidden md:block"
            onMouseEnter={() => setMegaOpen(true)}
            onMouseLeave={() => setMegaOpen(false)}
          >
            <button
              onClick={() => setMegaOpen((o) => !o)}
              className="text-sm font-medium py-5 hover:underline"
            >
              Categories ▾
            </button>

            {megaOpen && (
              <div className="absolute left-0 top-full w-[680px] bg-white border rounded-2xl shadow-xl p-6 grid grid-cols-3 gap-6 z-50">
                {MEGA_MENU.map((group) => (
                  <div key={group.category}>
                    <Link
                      href={`/search?category=${encodeURIComponent(group.category)}`}
                      onClick={() => setMegaOpen(false)}
                      className="font-bold text-sm hover:underline"
                    >
                      {group.category}
                    </Link>
                    <ul className="mt-2 space-y-1.5">
                      {group.subcategories.map((sub) => (
                        <li key={sub}>
                          <Link
                            href={`/search?q=${encodeURIComponent(sub)}`}
                            onClick={() => {
                              setQuery(sub);
                              setMegaOpen(false);
                            }}
                            className="text-xs text-gray-600 hover:text-black hover:underline"
                          >
                            {sub}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Global Search Bar with Autocomplete & Voice Search */}
        <div ref={searchBoxRef} className="relative flex-1 max-w-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              goSearch(query);
            }}
            className="flex items-center border rounded-xl overflow-hidden bg-gray-50 focus-within:bg-white focus-within:border-black"
          >
            <input
              type="text"
              placeholder="Search name, brand, SKU, category..."
              value={query}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
              className="w-full px-3 py-2 text-sm bg-transparent focus:outline-none"
            />
            <button
              type="button"
              onClick={handleVoiceSearch}
              title="Voice Search"
              className={`px-2.5 text-sm ${listening ? "text-red-600 animate-pulse" : "text-gray-500 hover:text-black"}`}
            >
              🎤
            </button>
            <button
              type="submit"
              className="px-3.5 py-2 bg-black text-white text-xs font-medium hover:bg-gray-800"
            >
              Search
            </button>
          </form>

          {/* Autocomplete Dropdown */}
          {searchOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white border rounded-2xl shadow-xl p-4 space-y-4 z-50">
              {query.trim() ? (
                <>
                  {suggestions.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-[11px] uppercase font-bold text-gray-400">Live Suggestions</p>
                      {suggestions.map((p) => (
                        <Link
                          key={p.id}
                          href={`/products/${p.slug}`}
                          onClick={() => {
                            setQuery(p.name);
                            saveHistory(p.name);
                            setSearchOpen(false);
                          }}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                        >
                          <img
                            src={p.variants[0]?.image_url || "https://placehold.co/60x60"}
                            alt={p.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{p.name}</p>
                            <p className="text-xs text-gray-500">
                              {p.category.name} • {p.variants[0]?.sku}
                            </p>
                          </div>
                          <span className="text-xs font-bold">
                            {p.variants[0] ? formatPrice(p.variants[0].price_minor) : ""}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600 space-y-2">
                      <p>No instant matches for &ldquo;{query}&rdquo;.</p>
                      {typoSuggestion && (
                        <button
                          onClick={() => {
                            setQuery(typoSuggestion);
                            goSearch(typoSuggestion);
                          }}
                          className="text-blue-700 font-medium hover:underline"
                        >
                          Did you mean &ldquo;{typoSuggestion}&rdquo;?
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {history.length > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <p className="text-[11px] uppercase font-bold text-gray-400">Search History</p>
                        <button
                          onClick={clearHistory}
                          className="text-[11px] text-gray-400 hover:text-black"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {history.map((term) => (
                          <button
                            key={term}
                            onClick={() => goSearch(term)}
                            className="text-xs px-2.5 py-1 rounded-full bg-gray-100 hover:bg-gray-200"
                          >
                            🕒 {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-[11px] uppercase font-bold text-gray-400 mb-1.5">Trending Searches</p>
                    <div className="flex flex-wrap gap-1.5">
                      {TRENDING_SEARCHES.map((term) => (
                        <button
                          key={term}
                          onClick={() => goSearch(term)}
                          className="text-xs px-2.5 py-1 rounded-full border hover:border-black"
                        >
                          🔥 {term}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] uppercase font-bold text-gray-400 mb-1.5">Popular Categories</p>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_SEARCHES.map((term) => (
                        <button
                          key={term}
                          onClick={() => goSearch(term)}
                          className="text-xs px-2.5 py-1 rounded-full bg-gray-50 border hover:border-black"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Account Dropdown + Cart */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setAccountOpen((o) => !o)}
                className="text-sm font-medium border rounded-lg px-3 py-1.5 hover:border-black"
              >
                {user.name.split(" ")[0]} ▾
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border rounded-xl shadow-lg p-2 space-y-1 z-50 text-sm">
                  <div className="px-3 py-1.5 border-b">
                    <p className="font-semibold truncate">{user.name}</p>
                    <p className="text-[10px] uppercase text-gray-500">{user.role.replace("_", " ")}</p>
                  </div>
                  <Link
                    href="/account"
                    onClick={() => setAccountOpen(false)}
                    className="block px-3 py-1.5 rounded hover:bg-gray-100"
                  >
                    My Account
                  </Link>
                  {rank >= ROLE_RANK.merchant && (
                    <Link
                      href="/merchant"
                      onClick={() => setAccountOpen(false)}
                      className="block px-3 py-1.5 rounded hover:bg-gray-100"
                    >
                      Merchant Portal
                    </Link>
                  )}
                  {rank >= ROLE_RANK.admin && (
                    <Link
                      href="/admin"
                      onClick={() => setAccountOpen(false)}
                      className="block px-3 py-1.5 rounded hover:bg-gray-100"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setAccountOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-1.5 rounded text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium hover:underline">
                Login
              </Link>
              <Link href="/register" className="text-sm font-medium hover:underline">
                Sign Up
              </Link>
            </div>
          )}

          <Link
            href="/cart"
            className="px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800 transition"
          >
            Cart ({itemCount})
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<header className="border-b bg-white h-16" />}>
      <NavbarContent />
    </Suspense>
  );
}