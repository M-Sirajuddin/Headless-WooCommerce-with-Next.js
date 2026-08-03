"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Eye, EyeOff, Lock, Mail, User, CheckCircle, AlertCircle } from "lucide-react";
import { registerUser } from "@/lib/mock";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      newErrors.username = "Username is required";
    } else if (formData.username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms and conditions";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setApiError("");

    try {
      await registerUser(formData.username, formData.email, formData.password);
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setApiError(err.message || "Failed to create account. User or email might already exist.");
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
            <span className="text-black/45">Register</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="mx-auto max-w-[1440px] px-6 pt-12 flex justify-center">
        <div className="w-full max-w-[460px] border border-black/10 bg-white p-8 md:p-10 shadow-sm">
          
          <h1 className="text-3xl font-black uppercase tracking-tight text-black text-center mb-2">
            Register
          </h1>
          <p className="text-xs text-black/55 text-center uppercase tracking-widest mb-8">
            Create your wholesale partner account
          </p>

          {isSuccess ? (
            <div className="text-center py-6 space-y-3 animate-fade-in">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <h3 className="text-lg font-bold uppercase text-black">
                Registration Successful
              </h3>
              <p className="text-xs text-black/65">
                Your account request has been submitted. Redirecting to login...
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

              {/* Username */}
              <div className="space-y-1.5">
                <label htmlFor="username-field" className="text-[11px] font-black uppercase tracking-wider text-black/70 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-black/40" />
                  Username <span className="text-[#d93b2e]">*</span>
                </label>
                <input
                  id="username-field"
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

              {/* Email Address */}
              <div className="space-y-1.5">
                <label htmlFor="email-field" className="text-[11px] font-black uppercase tracking-wider text-black/70 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-black/40" />
                  Email Address <span className="text-[#d93b2e]">*</span>
                </label>
                <input
                  id="email-field"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={loading}
                  className={`w-full h-12 border bg-white px-4 text-sm outline-none transition focus:border-black ${
                    errors.email ? "border-[#d93b2e]" : "border-black/15"
                  }`}
                />
                {errors.email && (
                  <p className="text-xs font-semibold text-[#d93b2e]">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password-field" className="text-[11px] font-black uppercase tracking-wider text-black/70 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-black/40" />
                  Password <span className="text-[#d93b2e]">*</span>
                </label>
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
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
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

              {/* Agree to Terms */}
              <div className="space-y-1.5">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="mt-0.5 h-4.5 w-4.5 border-black/15 rounded-sm focus:ring-0 focus:ring-offset-0 accent-black"
                  />
                  <span className="text-xs font-semibold text-black/65 leading-tight">
                    I agree to the{" "}
                    <Link href="/terms-of-service" className="underline hover:text-black">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy-policy" className="underline hover:text-black">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
                {errors.agreeToTerms && (
                  <p className="text-xs font-semibold text-[#d93b2e]">{errors.agreeToTerms}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 inline-flex items-center justify-center bg-black text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#d93b2e] mt-2 disabled:opacity-50"
              >
                {loading ? "Registering..." : "Register"}
              </button>
            </form>
          )}

          <div className="mt-8 border-t border-black/10 pt-6 text-center">
            <p className="text-xs text-black/65">
              Already have a wholesale account?{" "}
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
