import { Redis } from '@upstash/redis';

// Simple in-memory cache fallback for development / environment setup without Upstash Redis
class InMemoryCache {
  private cache: Map<string, { value: any; expiry: number }> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set(key: string, value: any, ttlInSeconds?: number): Promise<void> {
    const expiry = Date.now() + (ttlInSeconds ? ttlInSeconds * 1000 : 3600 * 1000);
    this.cache.set(key, { value, expiry });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }
}

const memoryCache = new InMemoryCache();

let redisInstance: {
  get: <T>(key: string) => Promise<T | null>;
  set: (key: string, value: any, options?: { ex?: number }) => Promise<any>;
};

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (redisUrl && redisToken) {
  try {
    const client = new Redis({
      url: redisUrl,
      token: redisToken,
    });
    
    redisInstance = {
      get: async <T>(key: string) => {
        try {
          return await client.get<T>(key);
        } catch (err) {
          console.warn('Redis read error, using in-memory fallback', err);
          return await memoryCache.get<T>(key);
        }
      },
      set: async (key: string, value: any, options?: { ex?: number }) => {
        try {
          return await client.set(key, value, options?.ex ? { ex: options.ex } : undefined);
        } catch (err) {
          console.warn('Redis write error, using in-memory fallback', err);
          return await memoryCache.set(key, value, options?.ex);
        }
      }
    };
    console.log('Upstash Redis client initialized successfully.');
  } catch (err) {
    console.warn('Failed to initialize Upstash Redis, falling back to in-memory cache.', err);
    redisInstance = {
      get: async <T>(key: string) => memoryCache.get<T>(key),
      set: async (key: string, value: any, options?: { ex?: number }) => memoryCache.set(key, value, options?.ex)
    };
  }
} else {
  console.log('Upstash Redis env variables missing. Initializing in-memory cache adapter.');
  redisInstance = {
    get: async <T>(key: string) => memoryCache.get<T>(key),
    set: async (key: string, value: any, options?: { ex?: number }) => memoryCache.set(key, value, options?.ex)
  };
}

export const cacheService = redisInstance;
