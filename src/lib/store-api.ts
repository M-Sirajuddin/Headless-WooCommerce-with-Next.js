import { ISR_REVALIDATE_SECONDS, REST_URL } from "@/lib/env";
import { deepDecodeHtmlEntities } from "@/lib/utils";

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

const STORE_API_BASE = `${REST_URL.replace(/\/$/, "")}/wc/store/v1`;

const FETCH_TIMEOUT_MS = 15000;

function fetchWithTimeout(url: string, options: RequestInit & { next?: any } = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  // Try to retrieve JWT Bearer token dynamically
  let token: string | undefined;
  if (typeof window === "undefined") {
    try {
      const { cookies } = require("next/headers");
      token = cookies().get("woo_auth_token")?.value;
    } catch {
      // Cookies context might not be available during static generation
    }
  } else {
    token = localStorage.getItem("woo_auth_token") || undefined;
  }

  const headers = new Headers(options.headers);
  let nextOpts = options.next ? { ...options.next } : {};

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
    nextOpts.revalidate = 0; // Bypass static cache for logged-in users
  }

  return fetch(url, {
    ...options,
    headers,
    next: nextOpts,
    signal: controller.signal,
  }).finally(() => clearTimeout(timer));
}

async function fetchStore<T>(
  path: string,
  params?: Record<string, string | number | undefined>
): Promise<{ data: T; headers: Headers }> {
  const url = new URL(`${STORE_API_BASE}/${path.replace(/^\//, "")}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetchWithTimeout(url.toString(), {
    next: { revalidate: ISR_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`Store API request failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as T;
  return { data: deepDecodeHtmlEntities(data), headers: response.headers };
}

export async function getStoreProducts({
  search,
  page = 1,
  perPage = 20,
  category,
  tag,
  orderby = "date",
  order = "desc",
  minPrice,
  maxPrice,
}: StoreProductQuery = {}): Promise<StoreProductsResult> {
  const { data, headers } = await fetchStore<StoreApiProduct[]>("products", {
    search,
    page,
    per_page: perPage,
    category,
    tag,
    orderby,
    order,
    min_price: minPrice,
    max_price: maxPrice,
  });
  return {
    items: data,
    total: Number(headers.get("X-WP-Total") ?? data.length),
    totalPages: Number(headers.get("X-WP-TotalPages") ?? 1),
  };
}

export async function getStoreCategories(
  perPage = 20
): Promise<StoreApiCategory[]> {
  const { data } = await fetchStore<StoreApiCategory[]>("products/categories", {
    per_page: perPage,
    orderby: "count",
    order: "desc",
  });
  return data.filter((category) => category.count > 0);
}

/**
 * Fetch EVERY product category (all pages, empty ones included). The Store API
 * ignores `slug`/`parent` filters, so hierarchy has to be derived client-side
 * from each category's `parent` field.
 */
export async function getAllStoreCategories(): Promise<StoreApiCategory[]> {
  const perPage = 100;
  let page = 1;
  let totalPages = 1;
  const all: StoreApiCategory[] = [];
  do {
    const { data, headers } = await fetchStore<StoreApiCategory[]>(
      "products/categories",
      { per_page: perPage, page, hide_empty: "false" }
    );
    all.push(...data);
    totalPages = Number(headers.get("X-WP-TotalPages") ?? 1);
    page += 1;
  } while (page <= totalPages);
  return all;
}

/**
 * Resolve a single category by slug. Needed for sub-category URLs like
 * /category/tabz that sit beyond the first page of results.
 */
export async function getStoreCategoryBySlug(
  slug: string
): Promise<StoreApiCategory | null> {
  const all = await getAllStoreCategories();
  return all.find((c) => c.slug === slug) ?? null;
}

const CWOO_BASE = `${REST_URL.replace(/\/$/, "")}/custom-woo/v1`;

export interface FilteredProductQuery extends StoreProductQuery {
  categories?: string[]; // category slugs
  brands?: string[]; // product_brand slugs
}

/**
 * Filtered listing via the custom endpoint — supports the product_brand
 * taxonomy (which the Store API cannot filter) plus multi category slugs.
 */
export async function getFilteredStoreProducts(
  q: FilteredProductQuery = {}
): Promise<StoreProductsResult> {
  const url = new URL(`${CWOO_BASE}/products`);
  const set = (k: string, v: string | number | undefined) => {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  };
  set("page", q.page ?? 1);
  set("per_page", q.perPage ?? 20);
  set("search", q.search);
  set("orderby", q.orderby ?? "date");
  set("order", q.order ?? "desc");
  set("min_price", q.minPrice);
  set("max_price", q.maxPrice);
  if (q.categories?.length) set("category", q.categories.join(","));
  if (q.brands?.length) set("brand", q.brands.join(","));

  const response = await fetchWithTimeout(url.toString(), {
    next: { revalidate: ISR_REVALIDATE_SECONDS },
  });
  if (!response.ok) {
    throw new Error(`Filtered products request failed: ${response.status}`);
  }
  const data = deepDecodeHtmlEntities(await response.json()) as StoreApiProduct[];
  return {
    items: data,
    total: Number(response.headers.get("X-WP-Total") ?? data.length),
    totalPages: Number(response.headers.get("X-WP-TotalPages") ?? 1),
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
