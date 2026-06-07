import axios, { AxiosRequestConfig } from 'axios';

interface CacheEntry {
  data: any;
  timestamp: number;
}

// In-memory caches for different API endpoints
const cacheStore: Record<string, CacheEntry | undefined> = {};
const pendingRequests: Record<string, Promise<any> | undefined> = {};

// Helper to determine cache duration (in milliseconds) based on route and query params
function getCacheDuration(url: string, params: any = {}): number {
  if (url.includes('/api/stock/quote')) {
    return 15000; // 15 seconds for live prices
  }
  if (url.includes('/api/stock/chart')) {
    const range = params.range || '1d';
    return range === '1d' ? 30000 : 300000; // 30 seconds for intraday, 5 minutes for historical
  }
  if (url.includes('/api/stock/mutualfund')) {
    return 300000; // 5 minutes for mutual fund Navs
  }
  return 10000; // 10 seconds default
}

// Generate a unique cache key based on URL and query parameters
function generateCacheKey(url: string, params: any = {}): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return `${url}?${sortedParams}`;
}

export const apiClient = {
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<{ data: T }> => {
    const params = config?.params || {};
    const key = generateCacheKey(url, params);
    const now = Date.now();

    // 1. Check if the response is already in the cache and fresh
    const cached = cacheStore[key];
    const duration = getCacheDuration(url, params);
    if (cached && (now - cached.timestamp < duration)) {
      return { data: cached.data };
    }

    // 2. Check if there is already an identical request in-flight
    if (pendingRequests[key]) {
      const data = await pendingRequests[key];
      return { data };
    }

    // 3. Make a fresh network request and deduplicate it
    const fetchPromise = axios.get<T>(url, config).then(res => {
      // Store in cache
      cacheStore[key] = {
        data: res.data,
        timestamp: Date.now()
      };
      // Cleanup from pending request queue
      delete pendingRequests[key];
      return res.data;
    }).catch(err => {
      delete pendingRequests[key];
      throw err;
    });

    pendingRequests[key] = fetchPromise;
    const data = await fetchPromise;
    return { data };
  }
};
