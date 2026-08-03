export const REST_URL: string = process.env.NEXT_PUBLIC_REST_URL ?? 'https://hedy.store/wp-json';
export const GRAPHQL_URL: string = 'https://hedy.store/graphql';
export const SITE_URL: string = 'https://hedy.store';
export const PUBLIC_SITE_URL: string = 'https://hedy.store';

export const MAIN_CATEGORY_SLUGS: string[] = [
  'dabs', 'nicotine', 'disposables', 'gummies', 'flower', 'pre-rolls-blunts', 'edibles', 'cartridges', 'shrooms', 'tinctures'
];

export const BRAND_FILTERS = [
  { name: 'Dazed', slug: 'dazed' },
  { name: 'Brixz', slug: 'brixz' },
  { name: 'Shrumfuzed', slug: 'shrumfuzed' },
  { name: 'MyZen', slug: 'myzen' },
  { name: 'Ronin', slug: 'ronin' },
  { name: '7ROX', slug: '7rox' },
  { name: 'Smokin Tenns', slug: 'smokin-tenns' },
  { name: 'Hytz', slug: 'hytz' },
  { name: 'CannaXtra', slug: 'cannaxtra' },
  { name: 'KROX', slug: 'krox' }
];

export const ISR_REVALIDATE_SECONDS = 60;
export const STATIC_PRODUCT_LIMIT = 20;
