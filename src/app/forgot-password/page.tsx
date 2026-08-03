"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronRight, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { forgotPasswordRequest } from "@/lib/mock";

export default function ForgotPasswordPage() {
  const [emailOrUser, setEmailOrUser] = useState("");
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUser.trim()) {
      setError("Username or email is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await forgotPasswordRequest(emailOrUser);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f7f7f7] min-h-[calc(100vh-140px)] text-[#333333] font-sans pb-16">
      {/* Breadcrumbs */}
      <div className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-[1440px] px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-black/65">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-black transition">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-black">My Account</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-black/45">Forgot Password</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="mx-auto max-w-[1440px] px-6 pt-12 flex justify-center">
        <div className="w-full max-w-[460px] border border-black/10 bg-white p-8 md:p-10 shadow-sm">
          
          <h1 className="text-3xl font-black uppercase tracking-tight text-black text-center mb-2">
            Lost Password
          </h1>
          <p className="text-xs text-black/55 text-center uppercase tracking-widest mb-8">
            Recover your wholesale partner credentials
          </p>

          {isSuccess ? (
            <div className="text-center py-6 space-y-3 animate-fade-in">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <h3 className="text-lg font-bold uppercase text-black">
                Reset Link Sent
              </h3>
              <p className="text-xs text-black/65">
                If an account exists for <strong className="text-black">{emailOrUser}</strong>, a password reset link has been sent to the associated email address.
              </p>
              <div className="pt-4">
                <Link href="/login" className="font-bold text-black underline hover:text-[#d93b2e] transition text-xs uppercase tracking-wider">
                  Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <p className="text-xs text-black/65 leading-relaxed">
                Lost your password? Please enter your username or email address. You will receive a link to create a new password via email.
              </p>

              {error && (
                <div className="flex items-center gap-2 border border-[#d93b2e]/25 bg-[#d93b2e]/5 p-4 text-xs font-semibold text-[#d93b2e] animate-fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Username/Email */}
              <div className="space-y-2">
                <label htmlFor="email-or-username" className="text-[11px] font-black uppercase tracking-wider text-black/70 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-black/40" />
                  Username or Email <span className="text-[#d93b2e]">*</span>
                </label>
                <input
                  id="email-or-username"
                  type="text"
                  value={emailOrUser}
                  onChange={(e) => {
                    setEmailOrUser(e.target.value);
                    if (error) setError("");
                  }}
                  disabled={loading}
                  className={`w-full h-12 border bg-white px-4 text-sm outline-none transition focus:border-black ${
                    error ? "border-[#d93b2e]" : "border-black/15"
                  }`}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 inline-flex items-center justify-center bg-black text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#d93b2e] disabled:opacity-50"
              >
                {loading ? "Sending..." : "Reset Password"}
              </button>
            </form>
          )}

          {!isSuccess && (
            <div className="mt-8 border-t border-black/10 pt-6 text-center">
              <p className="text-xs text-black/65">
                Remember your password?{" "}
                <Link href="/login" className="font-bold text-black underline hover:text-[#d93b2e] transition">
                  Sign In
                </Link>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
