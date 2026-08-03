import 'server-only';
import {
  getStoreProducts as _getStoreProducts,
  getStoreCategories as _getStoreCategories,
  getAllStoreCategories as _getAllStoreCategories,
  getFilteredStoreProducts as _getFilteredStoreProducts,
  type StoreProductQuery,
  type StoreProductsResult,
  type StoreApiCategory,
  type FilteredProductQuery,
} from './store-api';

export async function getStoreProductsCached(
  query: StoreProductQuery = {}
): Promise<StoreProductsResult> {
  return _getStoreProducts(query);
}

export async function getStoreCategoriesCached(perPage = 20): Promise<StoreApiCategory[]> {
  return _getStoreCategories();
}

export async function getFilteredStoreProductsCached(
  query: FilteredProductQuery = {}
): Promise<StoreProductsResult> {
  return _getFilteredStoreProducts(query);
}

export async function getAllStoreCategoriesCached(): Promise<StoreApiCategory[]> {
  return _getAllStoreCategories();
}

export async function getStoreCategoryBySlugCached(
  slug: string
): Promise<StoreApiCategory | null> {
  const all = await getAllStoreCategoriesCached();
  return all.find((c) => c.slug === slug) ?? null;
}
