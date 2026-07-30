import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { deepDecodeHtmlEntities } from '@/lib/utils';

export interface CartItem {
  id: string;
  slug?: string;
  name: string;
  price: string;
  imageUrl: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  coupons: string[];
}

const initialState: CartState = { items: [], coupons: [] };

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<CartItem>) {
      const decodedItem = deepDecodeHtmlEntities(action.payload);
      const existing = state.items.find((i) => i.id === decodedItem.id);
      if (existing) {
        existing.quantity += decodedItem.quantity;
        existing.slug = decodedItem.slug ?? existing.slug;
      } else {
        state.items.push(decodedItem);
      }
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
    updateQuantity(
      state,
      action: PayloadAction<{ id: string; quantity: number }>
    ) {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        state.items = state.items.filter((i) => i.id !== id);
      } else {
        const item = state.items.find((i) => i.id === id);
        if (item) item.quantity = quantity;
      }
    },
    clearCart(state) {
      state.items = [];
      state.coupons = [];
    },
    setCartItems(state, action: PayloadAction<CartItem[]>) {
      state.items = action.payload;
    },
    addCoupon(state, action: PayloadAction<string>) {
      const code = action.payload.trim().toLowerCase();
      if (code && !state.coupons.includes(code)) {
        state.coupons.push(code);
      }
    },
    removeCoupon(state, action: PayloadAction<string>) {
      state.coupons = state.coupons.filter((c) => c !== action.payload.toLowerCase());
    },
    setCoupons(state, action: PayloadAction<string[]>) {
      state.coupons = action.payload;
    },
  },
});

export const {
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
  setCartItems,
  addCoupon,
  removeCoupon,
  setCoupons,
} = cartSlice.actions;
export default cartSlice.reducer;
