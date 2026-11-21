"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Invalid email or password");
      localStorage.setItem("token", data.access_token);
      window.location.href = "/account";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError("Google OAuth client ID not configured yet. Use email login or sign up below.");
  };

  return (
    <main className="max-w-md mx-auto px-6 py-16">
      <div className="border rounded-2xl p-8 bg-white space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to manage orders, addresses, and wishlist.</p>
        </div>

        {error && <p className="p-3 rounded-lg bg-red-50 text-red-700 text-xs font-medium">{error}</p>}

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full py-2.5 border rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition"
        >
          <span>G</span>
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-3 text-xs text-gray-400">
          <div className="flex-1 h-px bg-gray-200" />
          <span>OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-medium mb-1">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3.5 py-2.5"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium">Password</label>
              <Link href="/forgot-password" className="text-xs text-gray-500 hover:text-black underline">
                Forgot password?
              </Link>
            </div>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3.5 py-2.5"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/register")}
            className="text-black font-semibold underline"
          >
            Sign Up
          </button>
        </p>
      </div>
    </main>
  );
}