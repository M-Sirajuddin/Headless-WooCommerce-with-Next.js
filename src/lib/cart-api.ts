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
  _token?: string | null
): Promise<CartTotals> {
  const subtotal = payload.line_items.reduce((sum, item) => sum + 120 * item.quantity, 0);
  const discountTotal = payload.coupons?.length ? 20 : 0;
  const shippingTotal = 15;
  const total = Math.max(0, subtotal - discountTotal + shippingTotal);

  return {
    currencySymbol: "$",
    subtotal: subtotal,
    subtotalFormatted: `$${subtotal.toFixed(2)}`,
    discountTotal: discountTotal,
    discountFormatted: `$${discountTotal.toFixed(2)}`,
    shippingTotal: shippingTotal,
    shippingFormatted: `$${shippingTotal.toFixed(2)}`,
    shippingMethods: [
      { id: "flat_rate", label: "Flat Rate Shipping", cost: 15, costFormatted: "$15.00" }
    ],
    feeTotal: 0,
    fees: [],
    taxTotal: 0,
    taxFormatted: "$0.00",
    taxLines: [],
    total: total,
    totalFormatted: `$${total.toFixed(2)}`,
    appliedCoupons: payload.coupons?.map(c => ({ code: c, discount: 20, discountFormatted: "$20.00" })) || [],
    couponErrors: [],
  };
}

export function invalidateTaxShippingConfig() {}

export async function getTaxShippingConfig(
  payload: {
    line_items: CartLineItem[];
    destination?: CartDestination;
    coupons?: string[];
  },
  _token?: string | null,
  _options?: { force?: boolean }
): Promise<TaxShippingConfig> {
  return {
    state: payload.destination?.state || "CA",
    taxRates: [
      { type: "sales", label: "Sales Tax", rate: 8.25 }
    ],
    shippingMethods: [
      { id: "flat_rate", label: "Flat Rate Shipping", cost: 15, costFormatted: "$15.00" }
    ],
    fees: [],
    exciseEnabled: false,
    appliedCoupons: payload.coupons?.map(c => ({ code: c, discount: 20, discountFormatted: "$20.00" })) || [],
    couponErrors: [],
  };
}

export async function getPaymentGateways(): Promise<PaymentGateway[]> {
  return [
    { id: "cod", title: "Cash on Delivery", description: "Pay with cash upon delivery.", order: 1 },
    { id: "bacs", title: "Direct Bank Transfer", description: "Make payment directly into our bank account.", order: 2 }
  ];
}
