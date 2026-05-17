export class CacheService {
  private cache = new Map<string, { value: any; expiry: number }>();
  private readonly maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
    // Periodic garbage collection every 5 minutes
    setInterval(() => this.cleanup(), 300000);
  }

  set(key: string, value: any, ttlMs: number) {
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
      // If still too large, forcefully remove the oldest entry (iterator yields insertion order)
      if (this.cache.size >= this.maxSize) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey !== undefined) {
          this.cache.delete(firstKey);
        }
      }
    }
    this.cache.set(key, { value, expiry: Date.now() + ttlMs });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
  }
}
export const apiCache = new CacheService();
