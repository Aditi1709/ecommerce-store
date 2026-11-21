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
  const [searchBarExpanded, setSearchBarExpanded] = useState(false);
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
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}/products/?limit=100`)
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
    <header className="bg-[#FAF3EB]/95 backdrop-blur-md border-b border-[#EAD9D6] sticky top-0 z-40">
      <nav className="max-w-6xl mx-auto px-5 sm:px-8 h-20 flex items-center justify-between gap-4">
        {/* Crimson Emblem + ZENOO Editorial Wordmark */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <span className="w-10 h-10 rounded-full bg-[#C81E1E] text-white flex items-center justify-center font-editorial font-bold text-xl shadow-sm group-hover:scale-105 transition">
            Z
          </span>
          <div className="leading-none">
            <span className="block text-xl font-bold tracking-[0.12em] text-[#231819]">
              ZENOO
            </span>
            <span className="block text-[9px] tracking-[0.26em] text-[#7D6668] uppercase mt-1">
              Modern Essentials
            </span>
          </div>
        </Link>

        {/* Centered Navigation Links */}
        <div className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#231819]">
          <Link
            href="/"
            className="underline decoration-[#C81E1E] decoration-2 underline-offset-8 text-[#C81E1E] font-semibold"
          >
            Shop
          </Link>

          <div
            className="relative"
            onMouseEnter={() => setMegaOpen(true)}
            onMouseLeave={() => setMegaOpen(false)}
          >
            <button
              onClick={() => setMegaOpen((o) => !o)}
              className="py-5 hover:text-[#C81E1E] transition flex items-center gap-1"
            >
              Categories <span className="text-xs">▾</span>
            </button>

            {megaOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-[660px] bg-[#FFFDFB] border border-[#EAD9D6] rounded-3xl shadow-2xl p-7 grid grid-cols-3 gap-6 z-50">
                {MEGA_MENU.map((group) => (
                  <div key={group.category}>
                    <Link
                      href={`/search?category=${encodeURIComponent(group.category)}`}
                      onClick={() => setMegaOpen(false)}
                      className="font-editorial font-bold text-base text-[#C81E1E] hover:underline"
                    >
                      {group.category}
                    </Link>
                    <ul className="mt-2.5 space-y-1.5">
                      {group.subcategories.map((sub) => (
                        <li key={sub}>
                          <Link
                            href={`/search?q=${encodeURIComponent(sub)}`}
                            onClick={() => {
                              setQuery(sub);
                              setMegaOpen(false);
                            }}
                            className="text-xs text-[#6E5A5C] hover:text-[#C81E1E] transition"
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

          <Link href="/#new-arrivals" className="hover:text-[#C81E1E] transition">
            New Favorites
          </Link>
          <Link href="/#collections" className="hover:text-[#C81E1E] transition">
            Stories
          </Link>
          <Link href="/contact" className="hover:text-[#C81E1E] transition">
            Contact
          </Link>
        </div>

        {/* Right Utility Icons + Search + Account + Bag */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Expandable Search */}
          <div ref={searchBoxRef} className="relative">
            {searchBarExpanded ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  goSearch(query);
                }}
                className="flex items-center border border-[#D8BEBA] rounded-full overflow-hidden bg-[#FFFDFB] w-48 sm:w-64 shadow-sm"
              >
                <input
                  type="text"
                  autoFocus
                  placeholder="Search Zenoo..."
                  value={query}
                  onFocus={() => setSearchOpen(true)}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSearchOpen(true);
                  }}
                  className="w-full px-3.5 py-1.5 text-xs bg-transparent focus:outline-none border-none shadow-none"
                />
                <button
                  type="button"
                  onClick={handleVoiceSearch}
                  title="Voice Search"
                  className={`px-2 text-xs ${listening ? "text-[#C81E1E] animate-pulse" : "text-[#7D6668] hover:text-[#C81E1E]"}`}
                >
                  🎤
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchBarExpanded(false);
                    setSearchOpen(false);
                  }}
                  className="pr-3 text-xs text-[#7D6668] hover:text-[#231819]"
                >
                  ✕
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearchBarExpanded(true);
                  setSearchOpen(true);
                }}
                aria-label="Search"
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#231819] hover:bg-[#FAD2D8]/60 hover:text-[#C81E1E] transition"
              >
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="7" />
                  <path strokeLinecap="round" d="m20 20-3.5-3.5" />
                </svg>
              </button>
            )}

            {/* Autocomplete Dropdown */}
            {searchOpen && (
              <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-[#FFFDFB] border border-[#EAD9D6] rounded-3xl shadow-2xl p-5 space-y-4 z-50">
                {query.trim() ? (
                  <>
                    {suggestions.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-[11px] uppercase font-bold text-[#9B7E80]">Live Matches</p>
                        {suggestions.map((p) => (
                          <Link
                            key={p.id}
                            href={`/products/${p.slug}`}
                            onClick={() => {
                              setQuery(p.name);
                              saveHistory(p.name);
                              setSearchOpen(false);
                            }}
                            className="flex items-center gap-3 p-2 rounded-2xl hover:bg-[#FAD2D8]/35 transition"
                          >
                            <img
                              src={p.variants[0]?.image_url || "https://placehold.co/60x60"}
                              alt={p.name}
                              className="w-10 h-10 rounded-xl object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate text-[#231819]">{p.name}</p>
                              <p className="text-xs text-[#7D6668]">
                                {p.category.name}
                              </p>
                            </div>
                            <span className="text-xs font-bold text-[#C81E1E]">
                              {p.variants[0] ? formatPrice(p.variants[0].price_minor) : ""}
                            </span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-[#6E5A5C] space-y-2">
                        <p>No instant matches for &ldquo;{query}&rdquo;.</p>
                        {typoSuggestion && (
                          <button
                            onClick={() => {
                              setQuery(typoSuggestion);
                              goSearch(typoSuggestion);
                            }}
                            className="text-[#C81E1E] font-semibold hover:underline"
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
                          <p className="text-[11px] uppercase font-bold text-[#9B7E80]">Recent</p>
                          <button
                            onClick={clearHistory}
                            className="text-[11px] text-[#9B7E80] hover:text-[#C81E1E]"
                          >
                            Clear
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {history.map((term) => (
                            <button
                              key={term}
                              onClick={() => goSearch(term)}
                              className="text-xs px-3 py-1 rounded-full bg-[#FAD2D8]/50 text-[#231819] hover:bg-[#FAD2D8]"
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-[11px] uppercase font-bold text-[#9B7E80] mb-1.5">Trending</p>
                      <div className="flex flex-wrap gap-1.5">
                        {TRENDING_SEARCHES.map((term) => (
                          <button
                            key={term}
                            onClick={() => goSearch(term)}
                            className="text-xs px-3 py-1 rounded-full border border-[#EAD9D6] hover:border-[#C81E1E] hover:text-[#C81E1E]"
                          >
                            ✦ {term}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] uppercase font-bold text-[#9B7E80] mb-1.5">Categories</p>
                      <div className="flex flex-wrap gap-1.5">
                        {POPULAR_SEARCHES.map((term) => (
                          <button
                            key={term}
                            onClick={() => goSearch(term)}
                            className="text-xs px-3 py-1 rounded-full bg-[#F6EBE3] hover:bg-[#FAD2D8]/60"
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

          {/* Wishlist Heart Icon */}
          <Link
            href="/wishlist"
            aria-label="Wishlist"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#231819] hover:bg-[#FAD2D8]/60 hover:text-[#C81E1E] transition"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 20.5s-7.5-4.7-9.3-9.1C1.3 8 3.6 4.8 7 4.8c2 0 3.7 1.1 5 2.7 1.3-1.6 3-2.7 5-2.7 3.4 0 5.7 3.2 4.3 6.6-1.8 4.4-9.3 9.1-9.3 9.1Z"
              />
            </svg>
          </Link>

          {/* Bag Icon with Count */}
          <Link
            href="/cart"
            aria-label="Shopping Bag"
            className="relative w-9 h-9 rounded-full flex items-center justify-center text-[#231819] hover:bg-[#FAD2D8]/60 hover:text-[#C81E1E] transition"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 8h12l1 12H5L6 8Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#C81E1E] text-white text-[10px] font-bold flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Account Pill / Auth Links */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setAccountOpen((o) => !o)}
                className="text-xs font-semibold border border-[#E2C6C2] bg-[#FFFDFB] text-[#231819] rounded-full px-3.5 py-1.5 hover:border-[#C81E1E] hover:text-[#C81E1E] transition"
              >
                {user.name.split(" ")[0]} ▾
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#FFFDFB] border border-[#EAD9D6] rounded-2xl shadow-xl p-2 space-y-1 z-50 text-sm">
                  <div className="px-3 py-1.5 border-b border-[#EAD9D6]">
                    <p className="font-semibold truncate text-[#231819]">{user.name}</p>
                    <p className="text-[10px] uppercase text-[#8A7072]">{user.role.replace("_", " ")}</p>
                  </div>
                  <Link
                    href="/account"
                    onClick={() => setAccountOpen(false)}
                    className="block px-3 py-1.5 rounded-xl hover:bg-[#FAD2D8]/40"
                  >
                    My Account
                  </Link>
                  {rank >= ROLE_RANK.merchant && (
                    <Link
                      href="/merchant"
                      onClick={() => setAccountOpen(false)}
                      className="block px-3 py-1.5 rounded-xl hover:bg-[#FAD2D8]/40"
                    >
                      Merchant Portal
                    </Link>
                  )}
                  {rank >= ROLE_RANK.admin && (
                    <Link
                      href="/admin"
                      onClick={() => setAccountOpen(false)}
                      className="block px-3 py-1.5 rounded-xl hover:bg-[#FAD2D8]/40"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setAccountOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-xl text-[#C81E1E] hover:bg-[#FAD2D8]/40"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-full bg-[#C81E1E] text-white text-xs font-semibold hover:bg-[#A81818] transition shadow-sm"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<header className="border-b border-[#EAD9D6] bg-[#FAF3EB] h-20" />}>
      <NavbarContent />
    </Suspense>
  );
}
