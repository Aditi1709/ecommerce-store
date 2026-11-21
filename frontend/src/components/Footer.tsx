"use client";

import { useState } from "react";
import Link from "next/link";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail("");
  };

  return (
    <footer className="bg-[#F6E4E2] text-[#231819] border-t border-[#EAD2CF] mt-16 rounded-b-[28px] sm:rounded-b-[36px]">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-8 h-8 rounded-full bg-[#C81E1E] text-white flex items-center justify-center font-editorial font-bold text-base">
              Z
            </span>
            <h3 className="text-lg font-bold tracking-[0.12em] text-[#231819]">ZENOO</h3>
          </div>
          <p className="text-sm text-[#6E5A5C] leading-relaxed">
            Curated apparel, modern objects, and everyday essentials from independent creators.
          </p>
          <div className="flex gap-4 mt-4 text-xs font-semibold text-[#C81E1E]">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:underline">
              Instagram
            </a>
            <a href="https://x.com" target="_blank" rel="noreferrer" className="hover:underline">
              X
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:underline">
              YouTube
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-editorial font-bold text-base text-[#C81E1E] mb-3">Shop</h4>
          <ul className="space-y-2 text-sm text-[#5C494B]">
            <li><Link href="/#new-arrivals" className="hover:text-[#C81E1E]">New Favorites</Link></li>
            <li><Link href="/#flash-sales" className="hover:text-[#C81E1E]">Flash Drops</Link></li>
            <li><Link href="/#bestsellers" className="hover:text-[#C81E1E]">Most Loved</Link></li>
            <li><Link href="/#collections" className="hover:text-[#C81E1E]">Stories</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-editorial font-bold text-base text-[#C81E1E] mb-3">Account</h4>
          <ul className="space-y-2 text-sm text-[#5C494B]">
            <li><Link href="/cart" className="hover:text-[#C81E1E]">Your Bag</Link></li>
            <li><Link href="/wishlist" className="hover:text-[#C81E1E]">Wishlist</Link></li>
            <li><Link href="/login" className="hover:text-[#C81E1E]">Sign In</Link></li>
            <li><Link href="/merchant" className="hover:text-[#C81E1E]">Merchant Portal</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-editorial font-bold text-base text-[#C81E1E] mb-3">Newsletter</h4>
          <p className="text-sm text-[#5C494B] mb-3">
            Early access to limited drops and studio notes.
          </p>
          {subscribed ? (
            <p className="text-sm text-[#C81E1E] font-semibold">✦ Thanks for joining Zenoo!</p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                required
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-full bg-[#FFFDFB] border border-[#E2C6C2] text-sm text-[#231819]"
              />
              <button className="px-4 py-2 bg-[#C81E1E] text-white rounded-full text-xs font-semibold hover:bg-[#A81818] transition shrink-0">
                Join
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="border-t border-[#EAD2CF] py-5 text-center text-xs text-[#7D6668]">
        © 2026 Zenoo. Crafted for everyday living.
      </div>
    </footer>
  );
}
