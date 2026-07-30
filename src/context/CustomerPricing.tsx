"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAppSelector } from "@/hooks/redux";
import { fetchCustomerPrices, type CustomerPrice } from "@/lib/auth-api";

interface CustomerPricingValue {
  getPrice: (id: number | string) => CustomerPrice | undefined;
  register: (id: number | string) => void;
}

const CustomerPricingContext = createContext<CustomerPricingValue>({
  getPrice: () => undefined,
  register: () => {},
});

export function formatCustomerMoney(value: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

export function CustomerPricingProvider({ children }: { children: ReactNode }) {
  const token = useAppSelector((state) => state.auth.token);
  const [prices, setPrices] = useState<Record<string, CustomerPrice>>({});

  // IDs already sent to the server (so we never re-request the same product).
  const requested = useRef<Set<number>>(new Set());
  // IDs collected since the last flush.
  const pending = useRef<Set<number>>(new Set());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset everything when the user logs in/out — prices are per-user.
  useEffect(() => {
    setPrices({});
    requested.current = new Set();
    pending.current = new Set();
  }, [token]);

  const flush = useCallback(() => {
    if (!token) return;
    const ids = Array.from(pending.current);
    pending.current = new Set();
    if (!ids.length) return;
    fetchCustomerPrices(token, ids).then((map) => {
      if (map && Object.keys(map).length) {
        setPrices((prev) => ({ ...prev, ...map }));
      }
    });
  }, [token]);

  const register = useCallback(
    (rawId: number | string) => {
      if (!token) return;
      const id = typeof rawId === "string" ? parseInt(rawId, 10) : rawId;
      if (!id || Number.isNaN(id) || requested.current.has(id)) return;
      requested.current.add(id);
      pending.current.add(id);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, 200); // debounce: batch a render's worth of cards
    },
    [token, flush]
  );

  const getPrice = useCallback(
    (rawId: number | string) => prices[String(rawId)],
    [prices]
  );

  return (
    <CustomerPricingContext.Provider value={{ getPrice, register }}>
      {children}
    </CustomerPricingContext.Provider>
  );
}

/**
 * Registers a product id for customer-specific pricing and returns the
 * resolved price (or undefined while it loads / for guests).
 */
export function useCustomerPrice(id: number | string | undefined) {
  const { getPrice, register } = useContext(CustomerPricingContext);
  useEffect(() => {
    if (id !== undefined && id !== null) register(id);
  }, [id, register]);
  return id !== undefined && id !== null ? getPrice(id) : undefined;
}
