import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';
import authReducer from './authSlice';
import quoteReducer from './quoteSlice';
import {
  localStorageMiddleware,
  loadCartFromStorage,
} from './middleware/localStorageMiddleware';

/**
 * Build a fresh store. The `loadCartFromStorage` helper is a no-op on the
 * server (it checks `typeof window === 'undefined'`) so it's safe to call in
 * every environment.
 */
export function makeStore() {
  return configureStore({
    reducer: {
      cart: cartReducer,
      auth: authReducer,
      quote: quoteReducer,
    },
    middleware: (getDefault) => getDefault().concat(localStorageMiddleware),
    preloadedState: loadCartFromStorage(),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
