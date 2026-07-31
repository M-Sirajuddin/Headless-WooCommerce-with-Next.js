import 'server-only';

/**
 * Server-side file cache.
 * Writes successful API responses to .cache/ on disk so pages
 * can be served when the remote API is unreachable.
 * Only runs in Node (server components / API routes).
 */
import fs from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), '.cache');
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function cacheFile(key: string) {
  return path.join(CACHE_DIR, `${key.replace(/[^a-z0-9_-]/gi, '_')}.json`);
}

export function readCache<T>(key: string): T | null {
  try {
    const file = cacheFile(key);
    if (!fs.existsSync(file)) return null;
    const raw = fs.readFileSync(file, 'utf-8');
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > MAX_AGE_MS) return null;
    return data as T;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(cacheFile(key), JSON.stringify({ data, ts: Date.now() }), 'utf-8');
  } catch {}
}

/**
 * Recursively updates any object matching databaseId or id in JSON files.
 */
export function updateProductInCache(productId: number, updatedFields: Partial<any>): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) return;
    const files = fs.readdirSync(CACHE_DIR);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const filePath = path.join(CACHE_DIR, file);
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const content = JSON.parse(raw);
        let modified = false;

        const updateObj = (obj: any): boolean => {
          if (obj && typeof obj === 'object') {
            const matchesId = 
              obj.id === productId || 
              obj.id === String(productId) ||
              obj.databaseId === productId ||
              obj.databaseId === String(productId);

            if (matchesId) {
              Object.assign(obj, updatedFields);
              return true;
            }
            let childModified = false;
            for (const k of Object.keys(obj)) {
              if (updateObj(obj[k])) {
                childModified = true;
              }
            }
            return childModified;
          }
          return false;
        };

        if (updateObj(content)) {
          fs.writeFileSync(filePath, JSON.stringify(content), 'utf-8');
        }
      } catch {
        // Skip corrupted or unreadable cache files
      }
    }
  } catch {}
}

/**
 * Recursively removes a product matching databaseId or id from arrays in JSON files,
 * or deletes the cache file if it's the individual product page cache.
 */
export function deleteProductFromCache(productId: number): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) return;
    const files = fs.readdirSync(CACHE_DIR);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const filePath = path.join(CACHE_DIR, file);

      // If it's the individual product cache file, delete it
      if (file.startsWith(`gql_product_`)) {
        try {
          const raw = fs.readFileSync(filePath, 'utf-8');
          const content = JSON.parse(raw);
          if (content.data?.databaseId === productId || content.data?.id === String(productId)) {
            fs.unlinkSync(filePath);
            continue;
          }
        } catch {}
      }

      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const content = JSON.parse(raw);

        const filterObj = (obj: any): boolean => {
          if (obj && typeof obj === 'object') {
            let childModified = false;
            for (const k of Object.keys(obj)) {
              if (Array.isArray(obj[k])) {
                const prevLen = obj[k].length;
                obj[k] = obj[k].filter((item: any) => {
                  if (item && typeof item === 'object') {
                    const matchesId = 
                      item.id === productId || 
                      item.id === String(productId) ||
                      item.databaseId === productId ||
                      item.databaseId === String(productId);
                    return !matchesId;
                  }
                  return true;
                });
                if (obj[k].length !== prevLen) {
                  childModified = true;
                }
              } else if (typeof obj[k] === 'object') {
                if (filterObj(obj[k])) {
                  childModified = true;
                }
              }
            }
            return childModified;
          }
          return false;
        };

        if (filterObj(content)) {
          fs.writeFileSync(filePath, JSON.stringify(content), 'utf-8');
        }
      } catch {}
    }
  } catch {}
}

