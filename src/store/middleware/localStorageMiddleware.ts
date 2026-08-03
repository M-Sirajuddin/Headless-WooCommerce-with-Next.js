import { Middleware } from '@reduxjs/toolkit';
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
  return [];
}

export function loadCachedUser(): UserDetails | null {
  return null;
}

export function loadCoupons(_key: string): string[] {
  return [];
}

export const localStorageMiddleware: Middleware<object, StoreStatePartial> =
  () => (next) => (action) => {
    return next(action);
  };

export function loadCartItems(_key: string): CartItem[] {
  return [];
}

export function loadCartFromStorage():
  | { cart: { items: CartItem[]; coupons: string[] } }
  | undefined {
  return undefined;
}
