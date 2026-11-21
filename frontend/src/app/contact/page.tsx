"use client";

import { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
      <div>
        <h1 className="text-3xl font-bold">Contact Us</h1>
        <p className="text-gray-600 mt-2">
          Questions about an order, merchant onboarding, or GST invoices? Reach out below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Contact Form */}
        <section className="border rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">Send a Message</h2>
          {sent ? (
            <p className="text-green-700 font-medium">
              Thanks! Your message has been received. We will reply within 24 hours.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                required
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border rounded-lg px-4 py-2.5 text-sm"
              />
              <input
                required
                type="email"
                placeholder="Your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-lg px-4 py-2.5 text-sm"
              />
              <textarea
                required
                rows={4}
                placeholder="How can we help?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full border rounded-lg px-4 py-2.5 text-sm"
              />
              <button className="w-full bg-black text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800">
                Submit
              </button>
            </form>
          )}
        </section>

        {/* Business, Grievance & GST Details */}
        <section className="space-y-6 text-sm">
          <div className="border rounded-2xl p-5 space-y-1">
            <h3 className="font-semibold text-base">Customer Support & Legal Details</h3>
            <p className="text-gray-600">Trade Name: Zeno Marketplace</p>
            <p className="text-gray-600">Email: support@zeno.in</p>
            <p className="text-gray-600">Phone: +91-98765-43210 (Mon–Sat, 10 AM – 6 PM IST)</p>
            <p className="text-gray-600">Address: Bengaluru, Karnataka, India</p>
            <p className="text-gray-600">GSTIN: 29XXXXX0000X1Z5</p>
          </div>

          <div className="border rounded-2xl p-5 space-y-1">
            <h3 className="font-semibold text-base">Grievance Officer</h3>
            <p className="text-gray-600">Grievance Redressal Officer, Zeno</p>
            <p className="text-gray-600">Email: grievance@zeno.in</p>
            <p className="text-gray-600">Acknowledgement within 48 hours • Resolution within 30 days</p>
          </div>
        </section>
      </div>
    </main>
  );
}