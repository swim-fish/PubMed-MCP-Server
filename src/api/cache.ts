// src/utils/cache.ts
import Database from "better-sqlite3";
import path from "path";
import fs from "fs-extra";
import { fileURLToPath } from "url";

// ES Modules interop to get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set cache database location, ENV variable or default to ./data/cache.db
const CACHE_DIR = process.env.CACHE_DIR || path.resolve(process.cwd(), "data");
const DB_PATH = path.join(CACHE_DIR, "cache.db");

// Define cache TTL (e.g., 7 days)
const TTL_MS = 1000 * 60 * 60 * 24 * 7;

// Ensure cache directory exists
fs.ensureDirSync(CACHE_DIR);

console.error(`[Cache] Database path: ${DB_PATH}`); // Log to stderr for MCP

const db = new Database(DB_PATH);

// Initialize cache table, if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS api_cache (
    key TEXT PRIMARY KEY,
    value TEXT,
    created_at INTEGER
  )
`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_created_at ON api_cache(created_at)`);

// Cleanup incomplete loading states on startup
try {
    // console.log('[Cache] Cleaning up stale loading states...');
    db.prepare(`
    DELETE FROM api_cache
    WHERE value LIKE '%"state":"loading"%'
       OR value LIKE '%"previous":"empty"%'
  `).run();
} catch (e) {
    // silent fail
}

export const cacheManager = {
    get: <T>(key: string): T | null => {
        try {
            const stmt = db.prepare(
                "SELECT value, created_at FROM api_cache WHERE key = ?",
            );
            const row = stmt.get(key) as
                | { value: string; created_at: number }
                | undefined;

            if (!row) return null;

            const data = JSON.parse(row.value) as any;
            const now = Date.now();
            const age = now - row.created_at;

            // Use TTL from data if available, else default TTL_MS
            const effectiveTTL = typeof data.ttl === 'number' ? data.ttl : TTL_MS;
            if (age > effectiveTTL) {
                db.prepare("DELETE FROM api_cache WHERE key = ?").run(key);
                return null;
            }

            // Zombie Loadiing Checking: In 10 seconds, if still loading, purge it
            if (data.state === "loading" && age > 10000) {
                db.prepare("DELETE FROM api_cache WHERE key = ?").run(key);
                return null;
            }

            return data as T;
        } catch (error) {
            // console.error(`[Cache] Error getting key ${key}:`, error);
            return null;
        }
    },

    /**
     * Write to cache
     * @param key Cache key
     * @param value Object to store
     */
    set: (key: string, value: any): void => {
        try {
            const stmt = db.prepare(`
        INSERT OR REPLACE INTO api_cache (key, value, created_at)
        VALUES (?, ?, ?)
      `);
            stmt.run(key, JSON.stringify(value), Date.now());
        } catch (error) {
            // console.error(`[Cache] Error setting key ${key}:`, error);
        }
    },

    delete: (key: string): void => {
        try {
            const stmt = db.prepare("DELETE FROM api_cache WHERE key = ?");
            stmt.run(key);
        } catch (error) {
            // silent fail
        }
    },

    /**
     * Clear all cache
     */
    clear: (): void => {
        db.exec("DELETE FROM api_cache");
        db.exec("VACUUM"); // Optimize database file size
    },
};
