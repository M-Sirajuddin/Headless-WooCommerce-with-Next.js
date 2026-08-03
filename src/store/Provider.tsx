'use client';

import { useRef, useEffect, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { makeStore, type AppStore } from '@/store';
import { setAuth, setHydrated } from '@/store/authSlice';
import { setCartItems, clearCart, setCoupons } from '@/store/cartSlice';
import { setQuoteItems } from '@/store/quoteSlice';
import { fetchUserProfile } from '@/lib/auth-api';
import {
  loadCartItems,
  loadCoupons,
  loadCachedUser,
  loadQuoteItems,
  userCartKey,
} from '@/store/middleware/localStorageMiddleware';

export default function StoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }
  // Guards against React StrictMode running this effect twice on mount,
  // which would fire a duplicate /customer request.
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const store = storeRef.current!;

    // Hydrate the quote list (guest-shared) from localStorage.
    const quoteItems = loadQuoteItems();
    if (quoteItems.length > 0) {
      store.dispatch(setQuoteItems(quoteItems));
    }

    const token = localStorage.getItem('woo_auth_token');
    if (!token) {
      store.dispatch(setHydrated());
      return;
    }

    // If Redux lost auth state (e.g. page refresh), re-hydrate from saved token
    const currentUser = store.getState().auth.user;
    if (currentUser) {
      store.dispatch(setHydrated());
      return;
    }

    // Fast path: hydrate from the cached user (persisted on every auth change)
    // so a reload is as instant as client navigation — no /customer call.
    // The cache is kept fresh because profile/address edits update the store,
    // which the persistence middleware writes straight back to localStorage.
    const cachedUser = loadCachedUser();
    if (cachedUser) {
      const userItems = loadCartItems(userCartKey(cachedUser.id));
      const userCoupons = loadCoupons(userCartKey(cachedUser.id));
      store.dispatch(setAuth({ token, user: cachedUser }));
      if (userItems.length > 0) {
        store.dispatch(setCartItems(userItems));
        store.dispatch(setCoupons(userCoupons));
      }
      store.dispatch(setHydrated());
      return;
    }

    // No cache (first login on this device) → fetch once.
    fetchUserProfile(token)
      .then((user) => {
        // Read BEFORE setAuth — middleware fires on setAuth and would overwrite
        // woo_cart_user_{id} with the current (guest/empty) cart if we read after.
        const userItems = loadCartItems(userCartKey(user.id));
        const userCoupons = loadCoupons(userCartKey(user.id));
        store.dispatch(setAuth({ token, user }));
        if (userItems.length > 0) {
          store.dispatch(setCartItems(userItems));
          store.dispatch(setCoupons(userCoupons));
        } else {
          store.dispatch(clearCart());
        }
      })
      .catch(() => {
        localStorage.removeItem('woo_auth_token');
        document.cookie = "woo_auth_token=; path=/; max-age=0";
      })
      .finally(() => {
        store.dispatch(setHydrated());
      });
  }, []);

  return <Provider store={storeRef.current}>{children}</Provider>;
}
