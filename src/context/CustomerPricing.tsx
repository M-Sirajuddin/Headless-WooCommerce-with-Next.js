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

// Persist resolved prices per user so a page reload / re-navigation shows them
// instantly (no "Loading price…" flash) and doesn't re-hit the backend.
const PRICE_TTL_MS = 30 * 60 * 1000; // 30 min — refresh in the background after this
const priceKey = (userId: number | undefined) => `woo_prices_${userId ?? "guest"}`;

export function CustomerPricingProvider({ children }: { children: ReactNode }) {
  const token = useAppSelector((state) => state.auth.token);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const [prices, setPrices] = useState<Record<string, CustomerPrice>>({});

  // IDs already sent to the server (so we never re-request the same product).
  const requested = useRef<Set<number>>(new Set());
  // IDs collected since the last flush.
  const pending = useRef<Set<number>>(new Set());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track previous token and user ID to reset caches during render phase.
  // This avoids parent useEffect race conditions with child register calls on reload.
  const prevToken = useRef<string | null>(null);
  const prevUserId = useRef<number | undefined>(undefined);

  if (prevToken.current !== token || prevUserId.current !== userId) {
    prevToken.current = token;
    prevUserId.current = userId;
    requested.current = new Set();
    pending.current = new Set();
  }

  // On login / reload: hydrate cached prices immediately, and only skip the
  // network for a product if the cache is still fresh (< TTL).
  useEffect(() => {
    if (typeof window === "undefined") {
      setPrices({});
      return;
    }
    try {
      const raw = localStorage.getItem(priceKey(userId));
      if (raw) {
        const { prices: cached, ts } = JSON.parse(raw);
        if (cached && typeof cached === "object") {
          setPrices(cached);
          // Fresh cache → treat these ids as already-fetched (no re-request).
          if (Date.now() - (ts || 0) < PRICE_TTL_MS) {
            Object.keys(cached).forEach((id) => requested.current.add(Number(id)));
          }
          return;
        }
      }
    } catch {
      /* ignore corrupt cache */
    }
    setPrices({});
  }, [token, userId]);

  // Persist prices whenever they change.
  useEffect(() => {
    if (typeof window === "undefined" || !token) return;
    try {
      localStorage.setItem(
        priceKey(userId),
        JSON.stringify({ prices, ts: Date.now() })
      );
    } catch {
      /* quota / private mode */
    }
  }, [prices, token, userId]);

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
