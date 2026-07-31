import 'server-only';
import { readCache, writeCache } from './api-cache';
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
  const key = `products_${JSON.stringify(query)}`;
  const cached = readCache<StoreProductsResult>(key);
  if (cached) return cached;
  try {
    const result = await _getStoreProducts(query);
    writeCache(key, result);
    return result;
  } catch {
    return { items: [], total: 0, totalPages: 1 };
  }
}

export async function getStoreCategoriesCached(perPage = 20): Promise<StoreApiCategory[]> {
  const key = `categories_${perPage}`;
  const cached = readCache<StoreApiCategory[]>(key);
  if (cached) return cached;
  try {
    const result = await _getStoreCategories(perPage);
    writeCache(key, result);
    return result;
  } catch {
    return [];
  }
}

export async function getFilteredStoreProductsCached(
  query: FilteredProductQuery = {}
): Promise<StoreProductsResult> {
  const key = `filtered_${JSON.stringify(query)}`;
  const cached = readCache<StoreProductsResult>(key);
  if (cached) return cached;
  try {
    const result = await _getFilteredStoreProducts(query);
    writeCache(key, result);
    return result;
  } catch {
    return { items: [], total: 0, totalPages: 1 };
  }
}

export async function getAllStoreCategoriesCached(): Promise<StoreApiCategory[]> {
  const key = `categories_all`;
  const cached = readCache<StoreApiCategory[]>(key);
  if (cached) return cached;
  try {
    const result = await _getAllStoreCategories();
    writeCache(key, result);
    return result;
  } catch {
    return [];
  }
}

export async function getStoreCategoryBySlugCached(
  slug: string
): Promise<StoreApiCategory | null> {
  const all = await getAllStoreCategoriesCached();
  return all.find((c) => c.slug === slug) ?? null;
}
