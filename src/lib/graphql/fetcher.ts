import 'server-only';
import type { ProductConnection, Product } from '@/types/woocommerce';
import dummyData from '../dummy-data.json';

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
    regularPrice: p.prices?.regular_price ? formatPrice(p.prices.regular_price) : null,
    salePrice: p.prices?.sale_price && p.prices.sale_price !== p.prices.regular_price
      ? formatPrice(p.prices.sale_price)
      : null,
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
  throw new Error('gqlFetch: GraphQL has been removed. Use Store API or custom REST endpoints.');
}
