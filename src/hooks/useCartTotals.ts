"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useAppSelector } from "@/hooks/redux";
import {
  getTaxShippingConfig,
  type CartTotals,
  type CartDestination,
  type TaxRate,
  type ShippingMethod,
  type TaxShippingConfig,
  type FeeLine,
} from "@/lib/cart-api";

function parsePrice(input: string | null | undefined): number {
  if (!input || typeof input !== "string") return 0;
  const cleaned = input.replace(/[^\d.,-]/g, "");
  if (!cleaned) return 0;
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normalised: string;
  if (lastComma === -1 && lastDot === -1) normalised = cleaned;
  else if (lastComma > lastDot) normalised = cleaned.replace(/\./g, "").replace(",", ".");
  else normalised = cleaned.replace(/,/g, "");
  const value = parseFloat(normalised);
  return Number.isFinite(value) ? value : 0;
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}


export interface UseCartTotalsResult {
  totals: CartTotals | null;
  loading: boolean;
  error: string | null;
  /** Local subtotal fallback used before the API responds or when it is down. */
  fallbackSubtotal: number;
  selectedShippingMethodId: string | null;
  setSelectedShippingMethodId: (id: string) => void;
}

/**
 * Fetches live WooCommerce tax rates and shipping methods cross-referenced
 * with user ACF settings, and performs calculation on the React frontend.
 */
export function useCartTotals(
  destination?: CartDestination,
  options?: { enabled?: boolean }
): UseCartTotalsResult {
  const items = useAppSelector((s) => s.cart.items);
  const coupons = useAppSelector((s) => s.cart.coupons);
  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);

  // Normalize the destination so the mini-cart, cart page, and checkout all
  // key on the SAME value when the address hasn't been edited. Cart/mini-cart
  // pass no destination → we derive it from the user's saved billing address,
  // which equals checkout's prefilled address → one shared cache entry.
  // A genuine address edit at checkout changes this → correct recalculation.
  const effectiveDestination = useMemo<CartDestination | undefined>(() => {
    const raw = destination ?? (user?.billing
      ? {
          country: user.billing.country,
          state: user.billing.state,
          postcode: user.billing.postcode,
          city: user.billing.city,
        }
      : undefined);
    if (!raw) return undefined;
    const country = raw.country || "";
    const state = raw.state || "";
    const postcode = raw.postcode || "";
    const city = raw.city || "";
    // All-empty → treat as "no destination" so it matches the undefined case.
    if (!country && !state && !postcode && !city) return undefined;
    // Fixed key order so JSON.stringify is identical across call sites.
    return { country, state, postcode, city };
  }, [
    destination,
    user?.billing?.country,
    user?.billing?.state,
    user?.billing?.postcode,
    user?.billing?.city,
  ]);

  const [config, setConfig] = useState<{ data: TaxShippingConfig; itemsKey: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedShippingMethodId, setSelectedShippingMethodIdState] = useState<string | null>(null);

  const isCartOrCheckout =
    options?.enabled === true ||
    (typeof window !== "undefined" &&
      (window.location.pathname.startsWith("/cart") ||
        window.location.pathname.startsWith("/checkout")));

  // Load from session storage for persistence across cart/checkout pages
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("selectedShippingMethodId");
      if (saved) {
        setSelectedShippingMethodIdState(saved);
      }
    }
  }, []);

  const setSelectedShippingMethodId = (id: string) => {
    setSelectedShippingMethodIdState(id);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("selectedShippingMethodId", id);
    }
  };

  const fallbackSubtotal = items.reduce(
    (sum, item) => sum + parsePrice(item.price) * item.quantity,
    0
  );

  // Key based only on item IDs (not quantities) — API re-fetches only when items are added/removed
  const itemsIdKey = JSON.stringify(items.map((i) => i.id).sort());
  // Key that includes quantities — used for frontend calculations only
  const currentItemsKey = JSON.stringify(items.map((i) => [i.id, i.quantity]));

  const configKey = JSON.stringify({
    items: currentItemsKey,
    destination: effectiveDestination,
    token,
    coupons,
    isCartOrCheckout,
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isCartOrCheckout) {
      setConfig(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (items.length === 0) {
      setConfig(null);
      setError(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      let cancelled = false;
      setLoading(true);
      setError(null);
 
      getTaxShippingConfig(
        {
          line_items: items.map((i) => ({
            product_id: parseInt(i.id, 10),
            quantity: i.quantity,
          })),
          destination: effectiveDestination,
          coupons,
        },
        token
      )
        .then((data) => {
          if (!cancelled) {
            setConfig({ data, itemsKey: itemsIdKey });
            if (data.shippingMethods.length > 0) {
              setSelectedShippingMethodIdState((prev) => {
                const isValid = data.shippingMethods.some((m) => m.id === prev);
                const nextId = isValid ? prev : data.shippingMethods[0].id;
                if (typeof window !== "undefined" && nextId) {
                  sessionStorage.setItem("selectedShippingMethodId", nextId);
                }
                return nextId;
              });
            } else {
              setSelectedShippingMethodIdState(null);
              if (typeof window !== "undefined") {
                sessionStorage.removeItem("selectedShippingMethodId");
              }
            }
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err?.message || "Could not fetch tax and shipping configurations.");
            setConfig(null);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey]);

  // Local synchronous calculations — runs on every items/quantity/config/coupon change
  const totals = useMemo(() => {
    if (items.length === 0) return null;

    const subtotal = fallbackSubtotal;
    const subtotalFormatted = formatMoney(subtotal);

    // Config is valid as long as the item IDs match (quantities can differ — we recalculate locally)
    const configData = config?.itemsKey === itemsIdKey ? config.data : null;

    const appliedCoupons = (configData?.appliedCoupons || []).filter((c) =>
      coupons.some((code) => code.toLowerCase() === c.code.toLowerCase())
    );
    const couponErrors = (configData?.couponErrors || []).filter((e) =>
      coupons.some((code) => code.toLowerCase() === e.code.toLowerCase())
    );

    const discountTotal = appliedCoupons.reduce((sum, c) => sum + c.discount, 0);
    const discountFormatted = formatMoney(discountTotal);

    const shippingMethods = configData?.shippingMethods || [];
    const selectedMethod = shippingMethods.find((m) => m.id === selectedShippingMethodId) || shippingMethods[0];
    const shippingTotal = selectedMethod ? selectedMethod.cost : 0;
    const shippingFormatted = selectedMethod ? selectedMethod.costFormatted : formatMoney(0);

    const taxableAmount = Math.max(0, subtotal - discountTotal);
    const taxRates = configData?.taxRates || [];
    const taxLines = taxRates.map((rate) => {
      const amt = taxableAmount * rate.rate;
      return {
        label: rate.label,
        total: amt,
        totalFormatted: formatMoney(amt),
      };
    });

    const taxTotal = taxLines.reduce((sum, t) => sum + t.total, 0);
    const taxFormatted = formatMoney(taxTotal);

    // Fees: any non-excise cart fees, plus excise computed LOCALLY from
    // per-product unit amounts — recalculates instantly on quantity/item
    // changes with no server round-trip or session-state dependency.
    const fees = [...(configData?.fees || [])];

    if (configData?.exciseEnabled && configData.excisePerProduct) {
      const perProduct = configData.excisePerProduct;
      const exciseTotal = items.reduce((sum, item) => {
        const unit = perProduct[item.id];
        return sum + (typeof unit === "number" ? unit * item.quantity : 0);
      }, 0);
      if (exciseTotal > 0) {
        fees.push({
          name: configData.exciseLabel || "Excise Tax",
          total: exciseTotal,
          totalFormatted: formatMoney(exciseTotal),
        });
      }
    }

    const feeTotal = fees.reduce((sum, f) => sum + f.total, 0);

    const total = Math.max(0, subtotal - discountTotal + shippingTotal + taxTotal + feeTotal);
    const totalFormatted = formatMoney(total);

    return {
      currencySymbol: "$",
      subtotal,
      subtotalFormatted,
      discountTotal,
      discountFormatted,
      shippingTotal,
      shippingFormatted,
      shippingMethods,
      feeTotal,
      fees,
      taxTotal,
      taxFormatted,
      taxLines,
      total,
      totalFormatted,
      appliedCoupons,
      couponErrors,
    };
  }, [items, coupons, config, selectedShippingMethodId, fallbackSubtotal, itemsIdKey, currentItemsKey, effectiveDestination]);

  return {
    totals,
    loading,
    error,
    fallbackSubtotal,
    selectedShippingMethodId,
    setSelectedShippingMethodId,
  };
}
