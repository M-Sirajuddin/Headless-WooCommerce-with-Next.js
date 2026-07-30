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
