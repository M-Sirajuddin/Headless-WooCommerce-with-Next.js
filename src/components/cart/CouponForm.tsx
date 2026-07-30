"use client";

import { useState } from "react";
import { Tag, X, Loader2, Check } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { addCoupon, removeCoupon } from "@/store/cartSlice";
import type { CartTotals } from "@/lib/cart-api";

interface CouponFormProps {
  totals: CartTotals | null;
  loading?: boolean;
  disabled?: boolean;
}

export default function CouponForm({ totals, loading = false, disabled = false }: CouponFormProps) {
  const dispatch = useAppDispatch();
  const coupons = useAppSelector((s) => s.cart.coupons);
  const [code, setCode] = useState("");

  const applied = totals?.appliedCoupons ?? [];
  const appliedCodes = new Set(applied.map((c) => c.code.toLowerCase()));

  // Coupons the user entered but WooCommerce rejected.
  const errors = totals?.couponErrors ?? [];
  const errorMap = new Map(errors.map((e) => [e.code.toLowerCase(), e.message]));

  const submit = () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    dispatch(addCoupon(trimmed));
    setCode("");
  };

  return (
    <div className="rounded-xl border border-black/10 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <Tag className="h-4 w-4 text-[#d93b2e]" />
        <h3 className="text-sm font-black uppercase tracking-[0.14em] text-black">
          Have a coupon?
        </h3>
      </div>

      {/* Not a <form> — this component renders inside the checkout <form>. */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={code}
            disabled={disabled}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Enter code"
            className="h-12 w-full rounded-lg border border-black/15 bg-[#fafafa] px-4 text-sm font-semibold uppercase tracking-wider outline-none transition focus:border-black focus:bg-white disabled:opacity-50"
          />
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={disabled || !code.trim() || loading}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-black px-5 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-[#d93b2e] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
        </button>
      </div>

      {/* Applied coupon chips */}
      {applied.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {applied.map((c) => (
            <span
              key={c.code}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 py-1.5 pl-3 pr-1.5 text-xs font-bold text-emerald-700"
            >
              <Check className="h-3.5 w-3.5" />
              <span className="uppercase tracking-wider">{c.code}</span>
              <span className="text-emerald-600/80">−{c.discountFormatted}</span>
              <button
                type="button"
                aria-label={`Remove coupon ${c.code}`}
                onClick={() => dispatch(removeCoupon(c.code))}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-emerald-700/70 transition hover:bg-emerald-600 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Rejected coupons (entered but invalid) */}
      {coupons
        .filter((c) => !appliedCodes.has(c) && !loading)
        .map((c) => (
          <div
            key={c}
            className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-[#d93b2e]/25 bg-[#d93b2e]/5 px-3 py-2"
          >
            <span className="text-xs font-semibold text-[#d93b2e]">
              <span className="uppercase tracking-wider">{c}</span>
              {" — "}
              {errorMap.get(c) || "Not applicable to your cart."}
            </span>
            <button
              type="button"
              aria-label={`Remove ${c}`}
              onClick={() => dispatch(removeCoupon(c))}
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[#d93b2e]/70 transition hover:bg-[#d93b2e] hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
    </div>
  );
}
