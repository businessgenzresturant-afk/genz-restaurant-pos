/**
 * Client-side caching layer for performance optimization
 * Optimized for high-volume operations (1000+ orders/day)
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class ClientCache {
  private cache: Map<string, CacheEntry<any>>;
  private defaultTTL: number;

  constructor(defaultTTL: number = 30000) { // 30 seconds default
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
    
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Set cached data with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const expirationTime = ttl || this.defaultTTL;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + expirationTime,
    };
    
    this.cache.set(key, entry);
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear cache by prefix
   */
  clearPrefix(prefix: string): void {
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keys = Array.from(this.cache.keys());
    
    keys.forEach(key => {
      const entry = this.cache.get(key);
      if (entry && now > entry.expiresAt) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get or set pattern - fetch if not in cache
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }
}

// Export singleton instance
export const clientCache = new ClientCache();

// Specific cache helpers for common operations
export const CacheKeys = {
  menu: (restaurantId: string) => `menu:${restaurantId}`,
  tables: (restaurantId: string) => `tables:${restaurantId}`,
  orders: (status: string) => `orders:${status}`,
  orderDetail: (orderId: string) => `order:${orderId}`,
  billDetail: (billId: string) => `bill:${billId}`,
  customer: (phone: string) => `customer:${phone}`,
  reports: (date: string) => `reports:${date}`,
};

// Cache TTLs (in milliseconds)
export const CacheTTL = {
  menu: 5 * 60 * 1000, // 5 minutes (menu items don't change often)
  tables: 10 * 1000, // 10 seconds (tables change frequently)
  orders: 5 * 1000, // 5 seconds (orders change frequently)
  orderDetail: 10 * 1000, // 10 seconds
  billDetail: 30 * 1000, // 30 seconds
  customer: 60 * 1000, // 1 minute
  reports: 5 * 60 * 1000, // 5 minutes
};

// Invalidation helpers
export const invalidateCache = {
  menu: () => clientCache.clearPrefix('menu:'),
  tables: () => clientCache.clearPrefix('tables:'),
  orders: () => clientCache.clearPrefix('orders:'),
  order: (orderId: string) => clientCache.delete(CacheKeys.orderDetail(orderId)),
  bill: (billId: string) => clientCache.delete(CacheKeys.billDetail(billId)),
  customer: (phone: string) => clientCache.delete(CacheKeys.customer(phone)),
  reports: () => clientCache.clearPrefix('reports:'),
  all: () => clientCache.clear(),
};

export default clientCache;
