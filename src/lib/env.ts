const rawRestUrl = process.env.NEXT_PUBLIC_REST_URL ?? process.env.REST_URL;
if (!rawRestUrl) {
  throw new Error(
    `[env] Missing required environment variable "REST_URL". Ensure it is defined in .env.local or your CI environment.`
  );
}
export const REST_URL: string = rawRestUrl;

// GRAPHQL_URL kept for backwards compat but no longer required — GraphQL plugins removed.
export const GRAPHQL_URL: string =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ??
  process.env.GRAPHQL_URL ??
  `${REST_URL.replace(/\/$/, '')}/graphql`;

export const SITE_URL = REST_URL.replace(/\/wp-json\/?$/, '');

// Public URL of the *frontend* (Next.js) site — used for canonical URLs,
// Open Graph, sitemap and structured data. Falls back to the store domain.
export const PUBLIC_SITE_URL: string = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hedy.store'
).replace(/\/$/, '');

// Curated main shopping categories shown at the top level of the catalog
// sidebar (comma-separated slugs, order preserved).
export const MAIN_CATEGORY_SLUGS: string[] = (
  process.env.NEXT_PUBLIC_MAIN_CATEGORY_SLUGS ??
  'dabs,nicotine,disposables,gummies,flower,pre-rolls-blunts,edibles,cartridges,shrooms,tinctures'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Brand filter options, "Name:slug" pairs comma-separated. Slug must match the
// product_brand taxonomy slug on the WordPress side.
export const BRAND_FILTERS: Array<{ name: string; slug: string }> = (
  process.env.NEXT_PUBLIC_BRAND_FILTERS ??
  'Dazed:dazed,Brixz:brixz,Shrumfuzed:shrumfuzed,MyZen:myzen,Ronin:ronin,7ROX:7rox,Smokin Tenns:smokin-tenns,Hytz:hytz,CannaXtra:cannaxtra,KROX:krox'
)
  .split(',')
  .map((pair) => {
    const idx = pair.lastIndexOf(':');
    return { name: pair.slice(0, idx).trim(), slug: pair.slice(idx + 1).trim() };
  })
  .filter((b) => b.name && b.slug);

export const ISR_REVALIDATE_SECONDS = parseInt(
  process.env.NEXT_PUBLIC_ISR_REVALIDATE_SECONDS ??
    process.env.ISR_REVALIDATE_SECONDS ??
    '60',
  10
);

export const STATIC_PRODUCT_LIMIT = parseInt(
  process.env.NEXT_PUBLIC_STATIC_PRODUCT_LIMIT ??
    process.env.STATIC_PRODUCT_LIMIT ??
    '20',
  10
);
