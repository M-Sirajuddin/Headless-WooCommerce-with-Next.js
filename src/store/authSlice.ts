import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserAddress {
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
  email?: string;
}

export interface UserDetails {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  displayName?: string;
  billing?: UserAddress;
  shipping?: UserAddress;
}

interface AuthState {
  token: string | null;
  user: UserDetails | null;
  orders: any[];
  loading: boolean;
  error: string | null;
  hydrated: boolean;
}

const initialState: AuthState = {
  token: null,
  user: null,
  orders: [],
  loading: false,
  error: null,
  hydrated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth(state, action: PayloadAction<{ token: string; user: UserDetails }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.error = null;
    },
    clearAuth(state) {
      state.token = null;
      state.user = null;
      state.orders = [];
      state.error = null;
    },
    updateUser(state, action: PayloadAction<Partial<UserDetails>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    updateBillingAddress(state, action: PayloadAction<UserAddress>) {
      if (state.user) {
        state.user.billing = action.payload;
      }
    },
    updateShippingAddress(state, action: PayloadAction<UserAddress>) {
      if (state.user) {
        state.user.shipping = action.payload;
      }
    },
    setOrders(state, action: PayloadAction<any[]>) {
      state.orders = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setHydrated(state) {
      state.hydrated = true;
    },
  },
});

export const {
  setAuth,
  clearAuth,
  updateUser,
  updateBillingAddress,
  updateShippingAddress,
  setOrders,
  setLoading,
  setError,
  setHydrated,
} = authSlice.actions;

export default authSlice.reducer;
