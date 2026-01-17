import Axios, { type AxiosRequestConfig } from 'axios';
import { setupCache, buildStorage, type AxiosCacheInstance, type StorageValue } from 'axios-cache-interceptor';
import { cacheManager } from './cache.js';

// Storage using SQLite for axios-cache-interceptor
const sqliteStorage = buildStorage({
    async find(key) {
        const result = cacheManager.get<StorageValue>(key);
        return result || undefined;
    },
    async set(key, value) {
        cacheManager.set(key, value);
    },
    async remove(key) {
        cacheManager.delete(key);
    }
});

/**
 * Create an Axios instance with caching capabilities
 * @param config Axios configuration (baseURL, timeout, headers...)
 * @returns Axios Instance with caching enabled
 */
export function createCachedClient(config: AxiosRequestConfig): AxiosCacheInstance {
    // Instantiate Axios
    const instance = Axios.create({
        timeout: 30000, // Default timeout
        ...config,      // Override with provided config (e.g., baseURL)
    });

    // Setup cache with SQLite storage
    const cachedClient = setupCache(instance, {
        storage: sqliteStorage,

        // Recommended: Set global default TTL (e.g., 7 days)
        ttl: 1000 * 60 * 60 * 24 * 7,

        // Recommended: Cache only GET requests
        methods: ['get'],

        // Ignore server headers (PubMed returns no-cache), force caching based on our TTL
        interpretHeader: false,

        generateKey: (request) => {
            // Use method, URL, and params to generate a unique cache key
            const key = `${request.method}:${request.url}:${JSON.stringify(request.params || {})}`;
            return key;
        },

        // Debugging: You can add console.log here to observe cache hits/misses
        debug: (msg) => {
            // console.log(`[Cache Debug] ${msg}`); 
        }
    });

    return cachedClient;
}