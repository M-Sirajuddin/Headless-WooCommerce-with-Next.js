"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Eye, EyeOff, Lock, User, CheckCircle, AlertCircle } from "lucide-react";
import { useAppDispatch } from "@/hooks/redux";
import { setAuth } from "@/store/authSlice";
import { setCartItems, clearCart } from "@/store/cartSlice";
import { loginUser, fetchUserProfile } from "@/lib/mock";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setApiError("");
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username or email is required";
    }
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setApiError("");

    try {
      const result = await loginUser(formData.username, formData.password);
      // Fetch full WooCommerce profile (firstName, lastName, billing, shipping)
      let fullUser = result.user;
      try {
        fullUser = await fetchUserProfile(result.token);
      } catch {
        // fallback to basic JWT data if profile fetch fails
      }
      dispatch(setAuth({ token: result.token, user: fullUser }));
      setIsSuccess(true);
      setTimeout(() => {
        const redirectTo = searchParams.get("redirect") || "/account";
        router.push(redirectTo);
      }, 1200);
    } catch (err: any) {
      setApiError(err.message || "Invalid username or password. Please try again.");
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
            <span className="text-black/45">Login</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="mx-auto max-w-[1440px] px-6 pt-12 flex justify-center">
        <div className="w-full max-w-[460px] border border-black/10 bg-white p-8 md:p-10 shadow-sm">
          
          <h1 className="text-3xl font-black uppercase tracking-tight text-black text-center mb-2">
            Sign In
          </h1>
          <p className="text-xs text-black/55 text-center uppercase tracking-widest mb-8">
            Access your wholesale catalog
          </p>

          {isSuccess ? (
            <div className="text-center py-6 space-y-3 animate-fade-in">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <h3 className="text-lg font-bold uppercase text-black">
                Login Successful
              </h3>
              <p className="text-xs text-black/65">
                Redirecting to your wholesale dashboard...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {apiError && (
                <div className="flex items-center gap-2 border border-[#d93b2e]/25 bg-[#d93b2e]/5 p-4 text-xs font-semibold text-[#d93b2e] animate-fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{apiError}</span>
                </div>
              )}

              {/* Username/Email */}
              <div className="space-y-2">
                <label htmlFor="username-or-email" className="text-[11px] font-black uppercase tracking-wider text-black/70 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-black/40" />
                  Username or Email Address <span className="text-[#d93b2e]">*</span>
                </label>
                <input
                  id="username-or-email"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={loading}
                  className={`w-full h-12 border bg-white px-4 text-sm outline-none transition focus:border-black ${
                    errors.username ? "border-[#d93b2e]" : "border-black/15"
                  }`}
                />
                {errors.username && (
                  <p className="text-xs font-semibold text-[#d93b2e]">{errors.username}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password-field" className="text-[11px] font-black uppercase tracking-wider text-black/70 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-black/40" />
                    Password <span className="text-[#d93b2e]">*</span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-[#d93b2e] hover:underline font-semibold"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password-field"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
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

              {/* Remember Me */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="h-4.5 w-4.5 border-black/15 rounded-sm focus:ring-0 focus:ring-offset-0 accent-black"
                />
                <span className="text-xs font-semibold text-black/65">
                  Remember my credentials
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 inline-flex items-center justify-center bg-black text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#d93b2e] disabled:opacity-50"
              >
                {loading ? "Signing In..." : "Log In"}
              </button>
            </form>
          )}

          <div className="mt-8 border-t border-black/10 pt-6 text-center">
            <p className="text-xs text-black/65">
              New to Dazed Wholesale?{" "}
              <Link href="/register" className="font-bold text-black underline hover:text-[#d93b2e] transition">
                Create an account
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="bg-[#f7f7f7] min-h-[calc(100vh-140px)] flex items-center justify-center text-xs text-black/65 font-sans pb-16">
        <div className="w-full max-w-[460px] border border-black/10 bg-white p-8 md:p-10 shadow-sm text-center">
          Loading...
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
