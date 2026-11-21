"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { saveAuth } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<"user" | "merchant">("user");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, account_type: accountType }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.detail || "Registration failed");

    saveAuth(data.access_token, data.user);
    router.push(data.user.role === "merchant" ? "/merchant" : "/");
  };

  return (
    <main className="max-w-md mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-6">Create Account</h1>

      <div className="grid grid-cols-2 gap-2 mb-6">
        <button
          type="button"
          onClick={() => setAccountType("user")}
          className={`py-2.5 rounded-lg border text-sm font-medium transition ${
            accountType === "user" ? "bg-black text-white border-black" : "bg-white text-black"
          }`}
        >
          Normal User
        </button>
        <button
          type="button"
          onClick={() => setAccountType("merchant")}
          className={`py-2.5 rounded-lg border text-sm font-medium transition ${
            accountType === "merchant" ? "bg-black text-white border-black" : "bg-white text-black"
          }`}
        >
          Merchant (Seller)
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          required
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded-lg px-4 py-2.5"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-lg px-4 py-2.5"
        />
        <input
          required
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-lg px-4 py-2.5"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800">
          Sign Up as {accountType === "merchant" ? "Merchant" : "User"}
        </button>
      </form>
      <p className="text-sm text-gray-600 mt-4">
        Already have an account? <Link href="/login" className="underline">Login</Link>
      </p>
    </main>
  );
}