/**
 * Product fetching via WooCommerce Store API.
 * No GraphQL / WPGraphQL plugin required.
 */
import 'server-only';
import { ISR_REVALIDATE_SECONDS, REST_URL } from '@/lib/env';
import type { ProductConnection, Product } from '@/types/woocommerce';
import { deepDecodeHtmlEntities } from '@/lib/utils';
import { readCache, writeCache } from '@/lib/api-cache';

const STORE_API = `${REST_URL.replace(/\/$/, '')}/wc/store/v1`;
const FETCH_TIMEOUT_MS = 15000;

function fetchWithTimeout(url: string, options: RequestInit & { next?: any } = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

async function storeApiFetch<T>(
  path: string,
  params: Record<string, string | number> = {}
): Promise<{ data: T; headers: Headers }> {
  const url = new URL(`${STORE_API}/${path.replace(/^\//, '')}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  });
  const res = await fetchWithTimeout(url.toString(), {
    next: { revalidate: ISR_REVALIDATE_SECONDS },
  });
  if (!res.ok) throw new Error(`Store API ${path} failed: ${res.status}`);
  const data = await res.json();
  return { data: deepDecodeHtmlEntities(data), headers: res.headers };
}

// Map Store API product shape → shared Product type
export function mapProduct(p: any): Product {
  const minorUnit = p.prices?.currency_minor_unit ?? 2;
  const factor = 10 ** minorUnit;

  function formatPrice(raw: string | undefined): string {
    if (!raw) return '';
    const num = Number(raw) / factor;
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: p.prices?.currency_code || 'USD',
      }).format(num);
    } catch {
      return `${p.prices?.currency_prefix ?? '$'}${num.toFixed(2)}`;
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
    stockStatus: p.is_in_stock ? 'IN_STOCK' : p.is_on_backorder ? 'ON_BACKORDER' : 'OUT_OF_STOCK',
    averageRating: parseFloat(p.average_rating) || 0,
    reviewCount: p.review_count || 0,
    image: p.images?.[0]
      ? {
          id: String(p.images[0].id),
          sourceUrl: p.images[0].src,
          thumbnailUrl: p.images[0].thumbnail || p.images[0].src,
          altText: p.images[0].alt || '',
        }
      : null,
    galleryImages: (p.images || []).slice(1).map((img: any) => ({
      id: String(img.id),
      sourceUrl: img.src,
      thumbnailUrl: img.thumbnail || img.src,
      altText: img.alt || '',
    })),
    productCategories: p.categories?.length
      ? { nodes: p.categories.map((c: any) => ({ id: String(c.id), name: c.name, slug: c.slug })) }
      : undefined,
    productTags: p.tags?.length
      ? { nodes: p.tags.map((t: any) => ({ id: String(t.id), name: t.name, slug: t.slug })) }
      : undefined,
  };
}

export async function getProducts(
  first = 24,
  after?: string
): Promise<ProductConnection> {
  let page = 1;
  if (after) {
    try {
      const decoded = atob(after);
      const match = decoded.match(/page:(\d+)/);
      if (match) page = parseInt(match[1], 10);
    } catch {}
  }

  const cacheKey = `gql_products_p${page}_pp${first}`;
  const cached = readCache<ProductConnection>(cacheKey);
  if (cached) return cached;

  try {
    const { data, headers } = await storeApiFetch<any[]>('products', {
      per_page: first,
      page,
      status: 'publish',
    });

    const totalPages = Number(headers.get('X-WP-TotalPages') ?? 1);
    const hasNextPage = page < totalPages;
    const nextCursor = hasNextPage ? btoa(`page:${page + 1}`) : null;
    const result: ProductConnection = {
      edges: data.map((p: any) => ({ cursor: btoa(`id:${p.id}`), node: mapProduct(p) })),
      pageInfo: { hasNextPage, endCursor: nextCursor },
    };
    writeCache(cacheKey, result);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function getProduct(slug: string): Promise<Product | null> {
  const cacheKey = `gql_product_${slug}`;
  const cached = readCache<Product>(cacheKey);
  if (cached) return cached;
  try {
    const { data } = await storeApiFetch<any[]>('products', { slug });
    const product = data && data.length > 0 ? mapProduct(data[0]) : null;
    if (product) writeCache(cacheKey, product);
    return product;
  } catch (err) {
    throw err;
  }
}

// Re-export for any files that imported gqlFetch (they should be migrated, but keep compat)
export async function gqlFetch<T>(_query: string, _variables?: Record<string, unknown>): Promise<T> {
  throw new Error('gqlFetch: GraphQL has been removed. Use Store API or custom REST endpoints.');
}
