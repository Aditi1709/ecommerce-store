"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "reset" | "done">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setStep("reset");
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (otp.trim() !== "123456") {
      setError("Invalid reset code. Use demo code: 123456");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setStep("done");
  };

  return (
    <main className="max-w-md mx-auto px-6 py-16">
      <div className="border rounded-2xl p-8 bg-white space-y-6">
        <h1 className="text-2xl font-bold">
          {step === "email"
            ? "Forgot Password"
            : step === "reset"
            ? "Reset Password"
            : "Password Updated"}
        </h1>

        {error && (
          <p className="p-3 rounded-lg bg-red-50 text-red-700 text-xs font-medium">{error}</p>
        )}

        {step === "email" && (
          <form onSubmit={handleSendCode} className="space-y-4 text-sm">
            <p className="text-gray-600">
              Enter your registered email and we&apos;ll send a 6-digit password reset code.
            </p>
            <input
              required
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3.5 py-2.5"
            />
            <button className="w-full bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800">
              Send Reset Code
            </button>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleReset} className="space-y-4 text-sm">
            <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
              Reset code sent to <strong>{email}</strong> (demo code: <strong>123456</strong>).
            </p>
            <input
              required
              placeholder="6-Digit Reset Code (123456)"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full border rounded-lg px-3.5 py-2.5"
            />
            <input
              required
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border rounded-lg px-3.5 py-2.5"
            />
            <input
              required
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border rounded-lg px-3.5 py-2.5"
            />
            <button className="w-full bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800">
              Reset Password
            </button>
          </form>
        )}

        {step === "done" && (
          <div className="space-y-4 text-sm">
            <p className="text-green-700 font-medium">
              Your password has been reset successfully. You can now log in with your new password.
            </p>
            <Link
              href="/login"
              className="block w-full text-center bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800"
            >
              Go to Login
            </Link>
          </div>
        )}

        <div className="text-center text-xs text-gray-500">
          <Link href="/login" className="underline hover:text-black">
            Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}