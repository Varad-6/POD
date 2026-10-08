/**
 * In-memory TTL Cache with Stale-While-Revalidate semantics for SAP data
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class SAPCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private ttlMs: number;

  constructor(ttlMinutes: number = 15) {
    this.ttlMs = ttlMinutes * 60 * 1000;
  }

  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get(key: string): { data: T | null; isStale: boolean; lastFetchedAt?: string } {
    const entry = this.cache.get(key);
    if (!entry) {
      return { data: null, isStale: true };
    }

    const isStale = Date.now() - entry.timestamp > this.ttlMs;
    return {
      data: entry.data,
      isStale,
      lastFetchedAt: new Date(entry.timestamp).toISOString(),
    };
  }

  clear(): void {
    this.cache.clear();
  }
}
