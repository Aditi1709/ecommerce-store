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
    <footer className="bg-black text-white mt-20">
      <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <h3 className="text-xl font-bold mb-3">Storefront</h3>
          <p className="text-sm text-gray-400">
            Multi-vendor marketplace for curated apparel, gear, and everyday essentials.
          </p>
          <div className="flex gap-4 mt-4 text-sm text-gray-300">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-white">
              Instagram
            </a>
            <a href="https://x.com" target="_blank" rel="noreferrer" className="hover:text-white">
              X
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-white">
              YouTube
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Shop</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><Link href="/#new-arrivals" className="hover:text-white">New Arrivals</Link></li>
            <li><Link href="/#flash-sales" className="hover:text-white">Flash Sales</Link></li>
            <li><Link href="/#bestsellers" className="hover:text-white">Bestsellers</Link></li>
            <li><Link href="/#collections" className="hover:text-white">Seasonal Collections</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Account</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><Link href="/cart" className="hover:text-white">Your Cart</Link></li>
            <li><Link href="/login" className="hover:text-white">Login</Link></li>
            <li><Link href="/register" className="hover:text-white">Become a Merchant</Link></li>
            <li><Link href="/merchant" className="hover:text-white">Merchant Portal</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Newsletter</h4>
          <p className="text-sm text-gray-400 mb-3">
            Get early access to flash sales and exclusive drops.
          </p>
          {subscribed ? (
            <p className="text-sm text-green-400 font-medium">Thanks for subscribing!</p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                required
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-sm text-white"
              />
              <button className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200">
                Join
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="border-t border-gray-800 py-5 text-center text-xs text-gray-500">
        © 2026 Storefront. All rights reserved.
      </div>
    </footer>
  );
}