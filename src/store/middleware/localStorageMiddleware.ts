import { Middleware } from '@reduxjs/toolkit';
import { deepDecodeHtmlEntities } from '@/lib/utils';
import type { CartItem } from '@/store/cartSlice';
import type { UserDetails } from '@/store/authSlice';

export const GUEST_CART_KEY = 'woo_cart_guest';
export const AUTH_USER_KEY = 'woo_auth_user';
export const QUOTE_KEY = 'woo_quote';
export const userCartKey = (id: string | number) => `woo_cart_user_${id}`;

interface StoreStatePartial {
  cart: { items: CartItem[]; coupons: string[] };
  auth: { user: UserDetails | null; token: string | null };
  quote: { items: unknown[] };
}

export function loadQuoteItems(): any[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(QUOTE_KEY);
    if (!raw) return [];
    const items = JSON.parse(raw);
    return Array.isArray(items) ? (deepDecodeHtmlEntities(items) as any[]) : [];
  } catch {
    return [];
  }
}

export function loadCachedUser(): UserDetails | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    return deepDecodeHtmlEntities(JSON.parse(raw)) as UserDetails;
  } catch {
    return null;
  }
}

export function loadCoupons(key: string): string[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.coupons) ? parsed.coupons : [];
  } catch {
    return [];
  }
}

// Persists cart to the correct key after every Redux action.
// Guest → woo_cart_guest  |  Logged-in → woo_cart_user_{id}
export const localStorageMiddleware: Middleware<object, StoreStatePartial> =
  (store) => (next) => (action) => {
    const result = next(action);
    try {
      const state = store.getState() as StoreStatePartial;
      const userId = state.auth?.user?.id;
      const key = userId ? userCartKey(userId) : GUEST_CART_KEY;
      localStorage.setItem(key, JSON.stringify(state.cart));

      // Cache the authenticated user so reloads hydrate instantly without a
      // /customer round-trip. Cleared on logout (user === null).
      if (state.auth?.user && state.auth?.token) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(state.auth.user));
      } else {
        localStorage.removeItem(AUTH_USER_KEY);
      }

      // Persist the quote list (shared across guest/user — it's a request list).
      localStorage.setItem(QUOTE_KEY, JSON.stringify(state.quote?.items ?? []));
    } catch {
      // ignore quota / private browsing errors
    }
    return result;
  };

export function loadCartItems(key: string): CartItem[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const items = parsed?.items ?? parsed ?? [];
    return deepDecodeHtmlEntities(items) as CartItem[];
  } catch {
    return [];
  }
}

// Initial store hydration: load guest cart.
// If the old single-key woo_cart_state exists, migrate it first.
export function loadCartFromStorage():
  | { cart: { items: CartItem[]; coupons: string[] } }
  | undefined {
  if (typeof window === 'undefined') return undefined;
  const OLD_KEY = 'woo_cart_state';
  if (!localStorage.getItem(GUEST_CART_KEY) && localStorage.getItem(OLD_KEY)) {
    localStorage.setItem(GUEST_CART_KEY, localStorage.getItem(OLD_KEY)!);
    localStorage.removeItem(OLD_KEY);
  }
  // On initial load we don't know who's logged in yet — start with guest cart.
  // StoreProvider will replace it with the user cart once auth is resolved.
  const items = loadCartItems(GUEST_CART_KEY);
  const coupons = loadCoupons(GUEST_CART_KEY);
  return items.length > 0 ? { cart: { items, coupons } } : undefined;
}
