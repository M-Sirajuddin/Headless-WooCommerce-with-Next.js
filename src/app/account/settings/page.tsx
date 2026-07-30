"use client";

import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { updateUser } from "@/store/authSlice";
import { updateUserProfile } from "@/lib/auth-api";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    displayName: "",
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Build the display name options the same way WooCommerce does
  const displayNameOptions = () => {
    if (!user) return [];
    const opts = new Set<string>();
    if (user.username) opts.add(user.username);
    if (user.nickname && user.nickname !== user.username) opts.add(user.nickname);
    const fullName = `${user.firstName} ${user.lastName}`.trim();
    if (fullName) opts.add(fullName);
    const reverseName = `${user.lastName} ${user.firstName}`.trim();
    if (reverseName && reverseName !== fullName) opts.add(reverseName);
    return Array.from(opts);
  };

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        displayName: user.displayName || `${user.firstName} ${user.lastName}`.trim() || user.username || "",
      }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSuccess(false);
    setError("");
  };

  // When first/last name changes, update displayName options but keep selection
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSuccess(false);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user) return;

    if (formData.newPassword && formData.newPassword !== formData.confirmNewPassword) {
      setError("New passwords do not match");
      return;
    }

    setLoading(true);
    setSuccess(false);
    setError("");

    try {
      const result = await updateUserProfile(token, user.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        displayName: formData.displayName,
      });

      dispatch(
        updateUser({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          displayName: result?.displayName || formData.displayName,
          nickname: result?.nickname || user.nickname,
        })
      );

      setSuccess(true);
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      }));
    } catch (err: any) {
      setError(err.message || "Failed to save changes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#d93b2e]" />
      </div>
    );
  }

  const dnOptions = displayNameOptions();

  return (
    <>
      <h2 className="text-2xl font-black tracking-tight text-black">
        Account details
      </h2>

      {success && (
        <div className="mt-4 flex items-center gap-2 border border-green-500/25 bg-green-500/5 p-4 text-xs font-semibold text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>Your account details have been updated successfully.</span>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center gap-2 border border-[#d93b2e]/25 bg-[#d93b2e]/5 p-4 text-xs font-semibold text-[#d93b2e]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 max-w-2xl space-y-5">

        {/* Username — read-only */}
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-black/65">
            Username
          </label>
          <input
            type="text"
            value={user.username}
            readOnly
            disabled
            className="h-12 w-full border border-black/15 bg-black/5 px-4 text-sm outline-none cursor-not-allowed text-black/55"
          />
          <p className="mt-1.5 text-xs italic text-black/40">
            Usernames cannot be changed.
          </p>
        </div>

        {/* First name / Last name */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="firstName-field" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-black/65">
              First name *
            </label>
            <input
              id="firstName-field"
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleNameChange}
              required
              disabled={loading}
              className="h-12 w-full border border-black/15 bg-[#fafafa] px-4 text-sm outline-none focus:border-black"
            />
          </div>
          <div>
            <label htmlFor="lastName-field" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-black/65">
              Last name *
            </label>
            <input
              id="lastName-field"
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleNameChange}
              required
              disabled={loading}
              className="h-12 w-full border border-black/15 bg-[#fafafa] px-4 text-sm outline-none focus:border-black"
            />
          </div>
        </div>

        {/* Nickname — read-only (same as username in WooCommerce) */}
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-black/65">
            Nickname (required)
          </label>
          <input
            type="text"
            value={user.nickname || user.username}
            readOnly
            disabled
            className="h-12 w-full border border-black/15 bg-black/5 px-4 text-sm outline-none cursor-not-allowed text-black/55"
          />
        </div>

        {/* Display name — dropdown like WooCommerce */}
        <div>
          <label htmlFor="displayName-field" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-black/65">
            Display name publicly as *
          </label>
          <select
            id="displayName-field"
            name="displayName"
            value={formData.displayName}
            onChange={handleInputChange}
            disabled={loading}
            className="h-12 w-full border border-black/15 bg-[#fafafa] px-4 text-sm outline-none focus:border-black"
          >
            {dnOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
            {/* Keep current value even if not in computed list */}
            {formData.displayName && !dnOptions.includes(formData.displayName) && (
              <option value={formData.displayName}>{formData.displayName}</option>
            )}
          </select>
          <p className="mt-1.5 text-xs italic text-black/40">
            This will be how your name will be displayed in the account section and in reviews.
          </p>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email-field" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-black/65">
            Email address *
          </label>
          <input
            id="email-field"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            disabled={loading}
            className="h-12 w-full border border-black/15 bg-[#fafafa] px-4 text-sm outline-none focus:border-black"
          />
        </div>

        {/* Password change */}
        <div className="border-t border-black/10 pt-6">
          <h3 className="mb-4 text-lg font-black uppercase tracking-tight text-black">
            Password change
          </h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="currentPassword-field" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-black/65">
                Current password (leave blank to leave unchanged)
              </label>
              <input
                id="currentPassword-field"
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                disabled={loading}
                className="h-12 w-full border border-black/15 bg-[#fafafa] px-4 text-sm outline-none focus:border-black"
              />
            </div>
            <div>
              <label htmlFor="newPassword-field" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-black/65">
                New password (leave blank to leave unchanged)
              </label>
              <input
                id="newPassword-field"
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                disabled={loading}
                className="h-12 w-full border border-black/15 bg-[#fafafa] px-4 text-sm outline-none focus:border-black"
              />
            </div>
            <div>
              <label htmlFor="confirmNewPassword-field" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-black/65">
                Confirm new password
              </label>
              <input
                id="confirmNewPassword-field"
                type="password"
                name="confirmNewPassword"
                value={formData.confirmNewPassword}
                onChange={handleInputChange}
                disabled={loading}
                className="h-12 w-full border border-black/15 bg-[#fafafa] px-4 text-sm outline-none focus:border-black"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-12 items-center justify-center bg-black px-8 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#d93b2e] disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save changes"}
        </button>
      </form>
    </>
  );
}
