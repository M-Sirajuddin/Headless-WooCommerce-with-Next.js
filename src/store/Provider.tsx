'use client';

import { useRef, useEffect, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { makeStore, type AppStore } from '@/store';
import { setAuth, setHydrated } from '@/store/authSlice';
import { setCartItems, clearCart, setCoupons } from '@/store/cartSlice';
import { setQuoteItems } from '@/store/quoteSlice';
import { fetchUserProfile } from '@/lib/mock';


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
    store.dispatch(setHydrated());
  }, []);

  return <Provider store={storeRef.current}>{children}</Provider>;
}
