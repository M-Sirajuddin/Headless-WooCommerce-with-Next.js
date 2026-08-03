"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Eye, EyeOff, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { resetPasswordSubmit } from "@/lib/mock";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setApiError("");

    try {
      await resetPasswordSubmit(password);
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setApiError(err.message || "Failed to reset password. The link may have expired.");
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
            <span className="text-black/45">Reset Password</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="mx-auto max-w-[1440px] px-6 pt-12 flex justify-center">
        <div className="w-full max-w-[460px] border border-black/10 bg-white p-8 md:p-10 shadow-sm">
          
          <h1 className="text-3xl font-black uppercase tracking-tight text-black text-center mb-2">
            Reset Password
          </h1>
          <p className="text-xs text-black/55 text-center uppercase tracking-widest mb-8">
            Set a new password for your account
          </p>

          {isSuccess ? (
            <div className="text-center py-6 space-y-3 animate-fade-in">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <h3 className="text-lg font-bold uppercase text-black">
                Password Reset Successful
              </h3>
              <p className="text-xs text-black/65">
                Your password has been successfully updated. Redirecting to login page...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {apiError && (
                <div className="flex items-center gap-2 border border-[#d93b2e]/25 bg-[#d93b2e]/5 p-4 text-xs font-semibold text-[#d93b2e] animate-fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{apiError}</span>
                </div>
              )}

              {/* New Password */}
              <div className="space-y-1.5">
                <label htmlFor="password-field" className="text-[11px] font-black uppercase tracking-wider text-black/70 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-black/40" />
                  New Password <span className="text-[#d93b2e]">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password-field"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setApiError("");
                      if (errors.password) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.password;
                          return next;
                        });
                      }
                    }}
                    disabled={loading}
                    className={`w-full h-12 border bg-white pl-4 pr-12 text-sm outline-none transition focus:border-black ${
                      errors.password ? "border-[#d93b2e]" : "border-black/15"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 hover:text-black transition"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs font-semibold text-[#d93b2e]">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label htmlFor="confirm-password-field" className="text-[11px] font-black uppercase tracking-wider text-black/70 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-black/40" />
                  Confirm Password <span className="text-[#d93b2e]">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirm-password-field"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setApiError("");
                      if (errors.confirmPassword) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.confirmPassword;
                          return next;
                        });
                      }
                    }}
                    disabled={loading}
                    className={`w-full h-12 border bg-white pl-4 pr-12 text-sm outline-none transition focus:border-black ${
                      errors.confirmPassword ? "border-[#d93b2e]" : "border-black/15"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 hover:text-black transition"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs font-semibold text-[#d93b2e]">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 inline-flex items-center justify-center bg-black text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#d93b2e] mt-2 disabled:opacity-50"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

          <div className="mt-8 border-t border-black/10 pt-6 text-center">
            <p className="text-xs text-black/65">
              Remember your credentials?{" "}
              <Link href="/login" className="font-bold text-black underline hover:text-[#d93b2e] transition">
                Sign In
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
