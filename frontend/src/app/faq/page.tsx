"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "How do UPI QR payments work?",
    a: "At checkout, select 'Pay via UPI QR', scan the generated QR code with GPay, PhonePe, or Paytm, and paste the 12-digit UTR/Transaction ID. Our team verifies it and confirms your order.",
  },
  {
    q: "How long does shipping take?",
    a: "Orders are dispatched within 1–2 business days and typically arrive within 3–7 business days across India. Orders over ₹999 qualify for free shipping.",
  },
  {
    q: "How do I return or exchange an item?",
    a: "You can request a return or size exchange within 7 days of delivery by contacting support@zeno.in with your Order ID.",
  },
  {
    q: "Can I sell my own products on Zeno?",
    a: "Yes! Click 'Sign Up', choose 'Merchant (Seller)', and you will immediately get access to the Merchant Portal to upload product images, prices, and stock.",
  },
  {
    q: "Do you provide GST-compliant invoices?",
    a: "Yes. Every confirmed order includes a GST-compliant invoice detailing the applicable tax breakdown.",
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
        <p className="text-gray-600 mt-2">Quick answers about orders, payments, returns, and selling.</p>
      </div>

      <div className="space-y-3">
        {FAQS.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={item.q} className="border rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full px-5 py-4 text-left font-semibold flex items-center justify-between hover:bg-gray-50"
              >
                <span>{item.q}</span>
                <span className="text-xl leading-none">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && (
                <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}