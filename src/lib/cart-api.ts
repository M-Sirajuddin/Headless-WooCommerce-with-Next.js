import { REST_URL } from "./env";
import { reportResponse, reportFetchError } from "./server-status-signal";

const CWOO = `${REST_URL.replace(/\/$/, "")}/custom-woo/v1`;

export interface CartLineItem {
  product_id: number;
  quantity: number;
}

export interface CartDestination {
  country?: string;
  state?: string;
  postcode?: string;
  city?: string;
}

export interface ShippingMethod {
  id: string;
  label: string;
  cost: number;
  costFormatted: string;
}

export interface FeeLine {
  name: string;
  total: number;
  totalFormatted: string;
}

export interface TaxLine {
  label: string;
  total: number;
  totalFormatted: string;
}

export interface AppliedCoupon {
  code: string;
  discount: number;
  discountFormatted: string;
}

export interface CartTotals {
  currencySymbol: string;
  subtotal: number;
  subtotalFormatted: string;
  discountTotal: number;
  discountFormatted: string;
  shippingTotal: number;
  shippingFormatted: string;
  shippingMethods: ShippingMethod[];
  feeTotal: number;
  fees: FeeLine[];
  taxTotal: number;
  taxFormatted: string;
  taxLines: TaxLine[];
  total: number;
  totalFormatted: string;
  appliedCoupons: AppliedCoupon[];
  couponErrors: Array<{ code: string; message: string }>;
}

export interface PaymentGateway {
  id: string;
  title: string;
  description: string;
  order: number;
}

async function post<T>(
  path: string,
  body: unknown,
  token?: string | null,
  timeoutMs = 12000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let res: Response;
    try {
      res = await fetch(`${CWOO}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: controller.signal,
      });
    } catch (err) {
      // Genuine network failure / timeout / abort → server unreachable.
      reportFetchError(err);
      throw err;
    }
    // 503 → down, 2xx → up, other 4xx/5xx are app errors (no status change).
    reportResponse(res);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((json as any)?.message || `HTTP ${res.status}`);
    return json as T;
  } finally {
    clearTimeout(timer);
  }
}

export interface TaxRate {
  type: string;
  label: string;
  rate: number;
}

export interface TaxShippingConfig {
  state?: string;
  taxRates: TaxRate[];
  shippingMethods: ShippingMethod[];
  fees?: FeeLine[];
  exciseEnabled?: boolean;
  exciseLabel?: string;
  /** Map of product_id → excise tax per unit, for local Σ(unit × qty) calc. */
  excisePerProduct?: Record<string, number>;
  appliedCoupons?: AppliedCoupon[];
  couponErrors?: Array<{ code: string; message: string }>;
}

export async function getCartTotals(
  payload: {
    line_items: CartLineItem[];
    coupons?: string[];
    destination?: CartDestination;
  },
  token?: string | null
): Promise<CartTotals> {
  return post<CartTotals>("/cart-totals", payload, token);
}

// ── Shared config cache ───────────────────────────────────────
// The tax/shipping config is deterministic for a given items + coupons +
// destination + token. Cache it (with a short TTL) and dedupe in-flight
// requests so the mini-cart and the cart/checkout pages don't each trigger
// their own identical call — whichever asks first pays, the rest reuse it.
const CONFIG_TTL_MS = 60_000;
const configCache = new Map<string, { ts: number; data: TaxShippingConfig }>();
const configInflight = new Map<string, Promise<TaxShippingConfig>>();

function configCacheKey(payload: unknown, token?: string | null): string {
  return JSON.stringify({ payload, token: token || null });
}

/** Drop cached config (e.g. after placing an order clears the cart). */
export function invalidateTaxShippingConfig() {
  configCache.clear();
  configInflight.clear();
}

export async function getTaxShippingConfig(
  payload: {
    line_items: CartLineItem[];
    destination?: CartDestination;
    coupons?: string[];
  },
  token?: string | null,
  options?: { force?: boolean }
): Promise<TaxShippingConfig> {
  const key = configCacheKey(payload, token);

  if (!options?.force) {
    const cached = configCache.get(key);
    if (cached && Date.now() - cached.ts < CONFIG_TTL_MS) {
      return cached.data;
    }
    const inflight = configInflight.get(key);
    if (inflight) return inflight;
  }

  const promise = post<TaxShippingConfig>("/tax-shipping-config", payload, token)
    .then((data) => {
      configCache.set(key, { ts: Date.now(), data });
      configInflight.delete(key);
      return data;
    })
    .catch((err) => {
      configInflight.delete(key);
      throw err;
    });

  configInflight.set(key, promise);
  return promise;
}

export async function getPaymentGateways(): Promise<PaymentGateway[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    let res: Response;
    try {
      res = await fetch(`${CWOO}/payment-gateways`, {
        cache: "no-store",
        signal: controller.signal,
      });
    } catch (err) {
      reportFetchError(err);
      throw err;
    }
    reportResponse(res);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } finally {
    clearTimeout(timer);
  }
}
