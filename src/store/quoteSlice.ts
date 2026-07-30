import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { deepDecodeHtmlEntities } from '@/lib/utils';

export interface QuoteItem {
  id: string;
  name: string;
  slug?: string;
  price?: string;
  imageUrl?: string;
  quantity: number;
}

interface QuoteState {
  items: QuoteItem[];
}

const initialState: QuoteState = { items: [] };

const quoteSlice = createSlice({
  name: 'quote',
  initialState,
  reducers: {
    addQuoteItem(state, action: PayloadAction<QuoteItem>) {
      const item = deepDecodeHtmlEntities(action.payload);
      const existing = state.items.find((i) => i.id === item.id);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        state.items.push(item);
      }
    },
    removeQuoteItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
    updateQuoteQuantity(
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
    clearQuote(state) {
      state.items = [];
    },
    setQuoteItems(state, action: PayloadAction<QuoteItem[]>) {
      state.items = action.payload;
    },
  },
});

export const {
  addQuoteItem,
  removeQuoteItem,
  updateQuoteQuantity,
  clearQuote,
  setQuoteItems,
} = quoteSlice.actions;
export default quoteSlice.reducer;
