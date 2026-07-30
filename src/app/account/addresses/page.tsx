"use client";

import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { updateBillingAddress, updateShippingAddress } from "@/store/authSlice";
import { updateUserAddresses } from "@/lib/auth-api";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function AddressesPage() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);

  const [editingType, setEditingType] = useState<"billing" | "shipping" | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    company: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postcode: "",
    country: "US",
    phone: "",
    email: "", // billing only
  });

  const emptyAddress = {
    firstName: "",
    lastName: "",
    company: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postcode: "",
    country: "US",
    phone: "",
  };

  const currentAddress = editingType === "billing" ? user?.billing : user?.shipping;

  useEffect(() => {
    if (editingType) {
      setFormData({
        firstName: currentAddress?.firstName || "",
        lastName: currentAddress?.lastName || "",
        company: currentAddress?.company || "",
        address1: currentAddress?.address1 || "",
        address2: currentAddress?.address2 || "",
        city: currentAddress?.city || "",
        state: currentAddress?.state || "",
        postcode: currentAddress?.postcode || "",
        country: currentAddress?.country || "US",
        phone: currentAddress?.phone || "",
        email: editingType === "billing" ? (user?.billing as any)?.email || "" : "",
      });
    }
  }, [editingType, currentAddress, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user) return;

    setLoading(true);
    setSuccess(false);
    setError("");

    try {
      const billing = editingType === "billing" 
        ? { ...formData } 
        : user.billing || { ...emptyAddress, email: user.email };
      
      const shipping = editingType === "shipping" 
        ? {
            firstName: formData.firstName,
            lastName: formData.lastName,
            company: formData.company,
            address1: formData.address1,
            address2: formData.address2,
            city: formData.city,
            state: formData.state,
            postcode: formData.postcode,
            country: formData.country,
            phone: formData.phone,
          } 
        : user.shipping || { ...emptyAddress };

      await updateUserAddresses(token, billing as any, shipping);

      if (editingType === "billing") {
        dispatch(updateBillingAddress(billing as any));
      } else {
        dispatch(updateShippingAddress(shipping));
      }

      setSuccess(true);
      setEditingType(null);
    } catch (err: any) {
      setError(err.message || "Failed to update address. Please try again.");
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

  const renderAddressDisplay = (address: any, label: string, type: "billing" | "shipping") => {
    const hasAddress = address && address.address1;
    return (
      <div>
        <div className="mb-4 flex items-center justify-between border-b border-black/10 pb-2">
          <h3 className="text-lg font-black uppercase tracking-tight text-black">
            {label}
          </h3>
          <button
            onClick={() => {
              setEditingType(type);
              setSuccess(false);
              setError("");
            }}
            className="text-[11px] font-bold uppercase tracking-[0.16em] text-black underline hover:text-[#d93b2e] transition"
          >
            {hasAddress ? "Edit" : "Set up"}
          </button>
        </div>
        {hasAddress ? (
          <div className="text-sm leading-6 text-black/70 font-semibold space-y-1">
            <p className="font-bold text-black">
              {address.firstName} {address.lastName}
            </p>
            {address.company && <p>{address.company}</p>}
            <p>{address.address1}</p>
            {address.address2 && <p>{address.address2}</p>}
            <p>
              {address.city}, {address.state} {address.postcode}
            </p>
            <p>{address.country}</p>
            {address.phone && <p className="mt-2 text-xs text-black/55">Phone: {address.phone}</p>}
            {address.email && <p className="text-xs text-black/55">Email: {address.email}</p>}
          </div>
        ) : (
          <p className="text-sm font-semibold italic text-black/45">
            You have not set up this type of address yet.
          </p>
        )}
      </div>
    );
  };

  return (
    <>
      <h2 className="text-2xl font-black tracking-tight text-black">
        Addresses
      </h2>
      <p className="mt-4 text-sm text-black/65">
        The following addresses will be used on the checkout page by default.
      </p>

      {success && (
        <div className="mt-4 flex items-center gap-2 border border-green-500/25 bg-green-500/5 p-4 text-xs font-semibold text-green-700 animate-fade-in">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>Address details updated successfully.</span>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center gap-2 border border-[#d93b2e]/25 bg-[#d93b2e]/5 p-4 text-xs font-semibold text-[#d93b2e] animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {editingType ? (
        <div className="mt-8 border border-black/10 bg-[#fafafa] p-6 animate-fade-in">
          <h3 className="text-lg font-black uppercase tracking-tight text-black border-b border-black/10 pb-3 mb-6">
            Edit {editingType === "billing" ? "Billing" : "Shipping"} Address
          </h3>
          <form onSubmit={handleSave} className="space-y-4 max-w-xl">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-black/65">First name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  className="h-10 w-full border border-black/15 bg-white px-3 text-sm outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-black/65">Last name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  className="h-10 w-full border border-black/15 bg-white px-3 text-sm outline-none focus:border-black"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-black/65">Company name</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                disabled={loading}
                className="h-10 w-full border border-black/15 bg-white px-3 text-sm outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-black/65">Street address *</label>
              <input
                type="text"
                name="address1"
                value={formData.address1}
                onChange={handleInputChange}
                required
                placeholder="House number and street name"
                disabled={loading}
                className="mb-2 h-10 w-full border border-black/15 bg-white px-3 text-sm outline-none focus:border-black"
              />
              <input
                type="text"
                name="address2"
                value={formData.address2}
                onChange={handleInputChange}
                placeholder="Apartment, suite, unit, etc. (optional)"
                disabled={loading}
                className="h-10 w-full border border-black/15 bg-white px-3 text-sm outline-none focus:border-black"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-black/65">City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  className="h-10 w-full border border-black/15 bg-white px-3 text-sm outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-black/65">State *</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  className="h-10 w-full border border-black/15 bg-white px-3 text-sm outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-black/65">Postcode *</label>
                <input
                  type="text"
                  name="postcode"
                  value={formData.postcode}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  className="h-10 w-full border border-black/15 bg-white px-3 text-sm outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-black/65">Phone *</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  className="h-10 w-full border border-black/15 bg-white px-3 text-sm outline-none focus:border-black"
                />
              </div>
              {editingType === "billing" && (
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-black/65">Email address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className="h-10 w-full border border-black/15 bg-white px-3 text-sm outline-none focus:border-black"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 items-center justify-center bg-black px-6 text-xs font-black uppercase tracking-[0.18em] text-white hover:bg-[#d93b2e] transition disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Address"}
              </button>
              <button
                type="button"
                onClick={() => setEditingType(null)}
                disabled={loading}
                className="inline-flex h-11 items-center justify-center border border-black px-6 text-xs font-black uppercase tracking-[0.18em] text-black hover:bg-black hover:text-white transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {renderAddressDisplay(user.billing, "Billing address", "billing")}
          {renderAddressDisplay(user.shipping, "Shipping address", "shipping")}
        </div>
      )}
    </>
  );
}
