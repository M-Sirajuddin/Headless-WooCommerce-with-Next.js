import dummyData from "./dummy-data.json";
import type { ProductConnection, Product } from "@/types/woocommerce";
import type { UserDetails, UserAddress } from "@/store/authSlice";

// ── ENV CONFIGS ──────────────────────────────────────────────────────────────
export const REST_URL = "https://hedy.store/wp-json";
export const GRAPHQL_URL = "https://hedy.store/graphql";
export const SITE_URL = "https://hedy.store";
export const PUBLIC_SITE_URL = "https://hedy.store";

export const MAIN_CATEGORY_SLUGS: string[] = [
  "dabs", "nicotine", "disposables", "gummies", "flower", "pre-rolls-blunts", "edibles", "cartridges", "shrooms", "tinctures"
];

export const BRAND_FILTERS = [
  { name: "Dazed", slug: "dazed" },
  { name: "Brixz", slug: "brixz" },
  { name: "Shrumfuzed", slug: "shrumfuzed" },
  { name: "MyZen", slug: "myzen" },
  { name: "Ronin", slug: "ronin" },
  { name: "7ROX", slug: "7rox" },
  { name: "Smokin Tenns", slug: "smokin-tenns" },
  { name: "Hytz", slug: "hytz" },
  { name: "CannaXtra", slug: "cannaxtra" },
  { name: "KROX", slug: "krox" }
];

export const ISR_REVALIDATE_SECONDS = 60;
export const STATIC_PRODUCT_LIMIT = 20;

// ── TYPES ────────────────────────────────────────────────────────────────────
export interface StoreApiImage {
  id: number;
  src: string;
  thumbnail: string;
  alt: string;
}

export interface StoreApiCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
  parent?: number;
  image: StoreApiImage | null;
  permalink: string;
}

export interface StoreApiProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  sku: string;
  short_description: string;
  description: string;
  on_sale: boolean;
  images: StoreApiImage[];
  categories: StoreApiCategory[];
  average_rating: string;
  review_count: number;
  is_in_stock: boolean;
  is_on_backorder: boolean;
  prices: {
    price: string;
    regular_price: string;
    sale_price: string;
    currency_code: string;
    currency_symbol: string;
    currency_minor_unit: number;
    currency_decimal_separator: string;
    currency_thousand_separator: string;
    currency_prefix: string;
    currency_suffix: string;
  };
}

export interface StoreProductQuery {
  search?: string;
  page?: number;
  perPage?: number;
  category?: string;
  tag?: string;
  orderby?: "date" | "price" | "title" | "popularity" | "rating" | "menu_order";
  order?: "asc" | "desc";
  minPrice?: string;
  maxPrice?: string;
}

export interface StoreProductsResult {
  items: StoreApiProduct[];
  total: number;
  totalPages: number;
}

export interface FilteredProductQuery extends StoreProductQuery {
  categories?: string[];
  brands?: string[];
}

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

export interface CustomerPrice {
  price: number | null;
  regularPrice: number | null;
  salePrice: number | null;
  currency: string;
}

export interface PlacedOrder {
  orderId?: number;
  orderNumber: string;
  orderKey?: string;
  total: string;
  status: string;
  date: string;
  needsPayment?: boolean;
  paymentUrl?: string;
}

export interface CheckoutAddress {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface CheckoutPayload {
  billing: CheckoutAddress;
  shipping?: CheckoutAddress;
  shipToDifferentAddress: boolean;
  paymentMethod: string;
  paymentMethodTitle: string;
  customerNote?: string;
  lineItems: Array<{ id: string; quantity: number }>;
  coupons?: string[];
  shippingMethodId?: string | null;
}

export interface OrderStatus {
  orderNumber: string;
  status: string;
  isPaid: boolean;
  total: string;
  date: string;
  paymentMethodTitle: string;
  email: string;
  items: Array<{ name: string; quantity: number; total: string }>;
}

// ── SHARED PARSERS ───────────────────────────────────────────────────────────
export function mapProduct(p: any): Product {
  const minorUnit = p.prices?.currency_minor_unit ?? 2;
  const factor = 10 ** minorUnit;

  function formatPrice(raw: string | undefined): string {
    if (!raw) return "";
    const num = Number(raw) / factor;
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: p.prices?.currency_code || "USD",
      }).format(num);
    } catch {
      return `${p.prices?.currency_prefix ?? "$"}${num.toFixed(2)}`;
    }
  }

  return {
    id: String(p.id),
    databaseId: p.id,
    slug: p.slug,
    name: p.name,
    shortDescription: p.short_description || null,
    description: p.description || null,
    price: formatPrice(p.prices?.price),
    regularPrice: p.prices?.regular_price ? formatPrice(p.prices.regular_price) : null,
    salePrice: p.prices?.sale_price && p.prices.sale_price !== p.prices.regular_price
      ? formatPrice(p.prices.sale_price)
      : null,
    stockStatus: p.is_in_stock ? "IN_STOCK" : p.is_on_backorder ? "ON_BACKORDER" : "OUT_OF_STOCK",
    averageRating: parseFloat(p.average_rating) || 0,
    reviewCount: p.review_count || 0,
    image: p.images?.[0]
      ? {
          id: String(p.images[0].id),
          sourceUrl: p.images[0].src,
          thumbnailUrl: p.images[0].thumbnail || p.images[0].src,
          altText: p.images[0].alt || "",
        }
      : null,
    galleryImages: (p.images || []).slice(1).map((img: any) => ({
      id: String(img.id),
      sourceUrl: img.src,
      thumbnailUrl: img.thumbnail || img.src,
      altText: img.alt || "",
    })),
    productCategories: p.categories?.length
      ? { nodes: p.categories.map((c: any) => ({ id: String(c.id), name: c.name, slug: c.slug })) }
      : undefined,
    productTags: p.tags?.length
      ? { nodes: p.tags.map((t: any) => ({ id: String(t.id), name: t.name, slug: t.slug })) }
      : undefined,
  };
}

export function formatStorePrice(product: StoreApiProduct): string {
  const {
    price,
    currency_minor_unit,
    currency_prefix,
    currency_suffix,
    currency_symbol,
  } = product.prices;

  const numericValue = Number(price) / 10 ** currency_minor_unit;
  const value = Number.isFinite(numericValue) ? numericValue : 0;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: product.prices.currency_code || "USD",
    }).format(value);
  } catch {
    return `${currency_prefix || currency_symbol}${value.toFixed(2)}${currency_suffix}`;
  }
}

// ── GRAPHQL MOCK FLOWS ───────────────────────────────────────────────────────
export async function getProducts(_first = 24, _after?: string): Promise<ProductConnection> {
  const allMapped = dummyData.products.map(mapProduct);
  return {
    edges: allMapped.map((p) => ({ cursor: btoa(`id:${p.id}`), node: p })),
    pageInfo: { hasNextPage: false, endCursor: null },
  };
}

export async function getProduct(slug: string): Promise<Product | null> {
  const p = dummyData.products.find((prod) => prod.slug === slug);
  return p ? mapProduct(p) : null;
}

export async function gqlFetch<T>(_query: string, _variables?: Record<string, unknown>): Promise<T> {
  throw new Error("GraphQL has been removed. Use mock services.");
}

// ── STORE PRODUCTS MOCK FLOWS ────────────────────────────────────────────────
export async function getStoreProducts(q: StoreProductQuery = {}): Promise<StoreProductsResult> {
  let list = [...dummyData.products] as StoreApiProduct[];
  if (q.search) {
    list = list.filter((p) => p.name.toLowerCase().includes(q.search!.toLowerCase()));
  }
  return { items: list, total: list.length, totalPages: 1 };
}

export async function getStoreProductsCached(q: StoreProductQuery = {}): Promise<StoreProductsResult> {
  return getStoreProducts(q);
}

export async function getStoreCategories(_perPage?: number): Promise<StoreApiCategory[]> {
  return dummyData.categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    count: c.count,
    image: null,
    permalink: `/category/${c.slug}`,
  }));
}

export async function getStoreCategoriesCached(_perPage?: number): Promise<StoreApiCategory[]> {
  return getStoreCategories(_perPage);
}

export async function getAllStoreCategories(_perPage?: number): Promise<StoreApiCategory[]> {
  return getStoreCategories(_perPage);
}

export async function getAllStoreCategoriesCached(_perPage?: number): Promise<StoreApiCategory[]> {
  return getStoreCategories(_perPage);
}

export async function getStoreCategoryBySlug(slug: string): Promise<StoreApiCategory | null> {
  const cats = await getStoreCategories();
  return cats.find((c) => c.slug === slug) ?? null;
}

export async function getStoreCategoryBySlugCached(slug: string): Promise<StoreApiCategory | null> {
  return getStoreCategoryBySlug(slug);
}

export async function getFilteredStoreProducts(q: FilteredProductQuery = {}): Promise<StoreProductsResult> {
  let list = [...dummyData.products] as StoreApiProduct[];

  if (q.search) {
    list = list.filter((p) => p.name.toLowerCase().includes(q.search!.toLowerCase()));
  }

  if (q.categories && q.categories.length > 0) {
    list = list.filter((p) => p.categories.some((c) => q.categories!.includes(c.slug)));
  }

  const requestingMarketing = q.categories && q.categories.includes("marketing-materials");
  if (!requestingMarketing) {
    list = list.filter((p) => !p.categories.some((c) => c.slug === "marketing-materials"));
  }

  return { items: list, total: list.length, totalPages: 1 };
}

export async function getFilteredStoreProductsCached(q: FilteredProductQuery = {}): Promise<StoreProductsResult> {
  return getFilteredStoreProducts(q);
}

// ── CUSTOMER AUTH MOCK FLOWS ─────────────────────────────────────────────────
export async function loginUser(username: string, _password?: string) {
  return {
    token: "mock-jwt-token-12345",
    user: {
      id: 99,
      username: username,
      email: `${username}@example.com`,
      firstName: "Test",
      lastName: "User",
      nickname: "Tester",
      displayName: "Brainbean Dev Tester",
    } as UserDetails,
  };
}

export async function registerUser(username: string, email: string, _password?: string) {
  return { id: 99, username, email };
}

export async function fetchUserProfile(_token: string): Promise<UserDetails> {
  return {
    id: 99,
    username: "brainbean",
    email: "tester@example.com",
    firstName: "Test",
    lastName: "User",
    nickname: "Tester",
    displayName: "Brainbean Dev Tester",
    billing: {
      firstName: "Test",
      lastName: "User",
      company: "Hedy Store",
      address1: "123 Main St",
      address2: "",
      city: "Los Angeles",
      state: "CA",
      postcode: "90001",
      country: "US",
      phone: "555-555-5555",
      email: "tester@example.com",
    },
    shipping: {
      firstName: "Test",
      lastName: "User",
      company: "Hedy Store",
      address1: "123 Main St",
      address2: "",
      city: "Los Angeles",
      state: "CA",
      postcode: "90001",
      country: "US",
      phone: "555-555-5555",
    },
  };
}

export async function updateUserProfile(
  _token: string,
  _userId: number,
  profileData: { firstName: string; lastName: string; email: string; displayName?: string; nickname?: string }
) {
  return { success: true, nickname: profileData.nickname, ...profileData };
}

export async function updateUserAddresses(_token: string, billing: UserAddress, shipping: UserAddress) {
  return { success: true, billing, shipping };
}

export async function fetchUserOrders(_token: string): Promise<any[]> {
  return [
    {
      orderId: 1001,
      orderNumber: "1001",
      date: new Date().toISOString(),
      status: "COMPLETED",
      total: "$120.00",
      needsPayment: false,
    }
  ];
}

export async function placeOrder(_token: string | null, _payload: CheckoutPayload): Promise<PlacedOrder> {
  return {
    orderId: 1002,
    orderNumber: "1002",
    orderKey: "wc_order_mockkey123",
    total: "$120.00",
    status: "PROCESSING",
    date: new Date().toISOString(),
    needsPayment: false,
  };
}

export async function fetchQuoteRequests(_token: string): Promise<any[]> {
  return [];
}

export async function submitQuoteRequest(_token: string, _payload: { product_name: string; quantity: number; notes: string }): Promise<{ id: number }> {
  return { id: 5001 };
}

export async function submitMultiQuoteRequest(_token: string, _payload: { items: Array<{ name: string; quantity: number; price?: string }>; notes?: string }): Promise<{ id: number }> {
  return { id: 5002 };
}

export async function fetchCustomerPrices(_token: string, ids: number[]): Promise<Record<string, CustomerPrice>> {
  const map: Record<string, CustomerPrice> = {};
  ids.forEach((id) => {
    map[String(id)] = { price: 120.0, regularPrice: 190.0, salePrice: 120.0, currency: "USD" };
  });
  return map;
}

export async function getOrderStatus(order: string, _key: string): Promise<OrderStatus> {
  return {
    orderNumber: order,
    status: "COMPLETED",
    isPaid: true,
    total: "$120.00",
    date: new Date().toISOString(),
    paymentMethodTitle: "Credit Card",
    email: "tester@example.com",
    items: [{ name: "MyZen Poppy & Lotus 6pk Tablet - Wild Cherry", quantity: 1, total: "$120.00" }],
  };
}

export async function forgotPasswordRequest(_email: string) {
  return true;
}

export async function resetPasswordSubmit(_password: string) {
  return true;
}

// ── CART MOCK FLOWS ──────────────────────────────────────────────────────────
export async function getCartTotals(
  payload: { line_items: CartLineItem[]; coupons?: string[]; destination?: CartDestination },
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
    shippingMethods: [{ id: "flat_rate", label: "Flat Rate Shipping", cost: 15, costFormatted: "$15.00" }],
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
  payload: { line_items: CartLineItem[]; destination?: CartDestination; coupons?: string[] },
  _token?: string | null,
  _options?: { force?: boolean }
): Promise<TaxShippingConfig> {
  return {
    state: payload.destination?.state || "CA",
    taxRates: [{ type: "sales", label: "Sales Tax", rate: 8.25 }],
    shippingMethods: [{ id: "flat_rate", label: "Flat Rate Shipping", cost: 15, costFormatted: "$15.00" }],
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
