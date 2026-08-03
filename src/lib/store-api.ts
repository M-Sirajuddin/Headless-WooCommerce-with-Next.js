import dummyData from "./dummy-data.json";

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

export async function getStoreProducts(
  q: StoreProductQuery = {}
): Promise<StoreProductsResult> {
  let list = [...dummyData.products] as StoreApiProduct[];

  if (q.search) {
    list = list.filter((p) =>
      p.name.toLowerCase().includes(q.search!.toLowerCase())
    );
  }

  return {
    items: list,
    total: list.length,
    totalPages: 1,
  };
}

export async function getStoreCategories(): Promise<StoreApiCategory[]> {
  return dummyData.categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    count: c.count,
    image: null,
    permalink: `/category/${c.slug}`,
  }));
}

export async function getAllStoreCategories(): Promise<StoreApiCategory[]> {
  return getStoreCategories();
}

export async function getStoreCategoryBySlug(
  slug: string
): Promise<StoreApiCategory | null> {
  const cats = await getStoreCategories();
  return cats.find((c) => c.slug === slug) ?? null;
}

export interface FilteredProductQuery extends StoreProductQuery {
  categories?: string[];
  brands?: string[];
}

export async function getFilteredStoreProducts(
  q: FilteredProductQuery = {}
): Promise<StoreProductsResult> {
  let list = [...dummyData.products] as StoreApiProduct[];

  if (q.search) {
    list = list.filter((p) =>
      p.name.toLowerCase().includes(q.search!.toLowerCase())
    );
  }

  if (q.categories && q.categories.length > 0) {
    list = list.filter((p) =>
      p.categories.some((c) => q.categories!.includes(c.slug))
    );
  }

  // Filter out marketing materials by default unless requested
  const requestingMarketing = q.categories && q.categories.includes("marketing-materials");
  if (!requestingMarketing) {
    list = list.filter((p) =>
      !p.categories.some((c) => c.slug === "marketing-materials")
    );
  }

  return {
    items: list,
    total: list.length,
    totalPages: 1,
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
