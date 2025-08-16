import { DATA_SOURCE_CONFIG } from '../../../config/apiConfig';
import localforage from 'localforage';

/**
 * Cache item interface
 */
export interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  volatility: CacheVolatility;
}

/**
 * Cache volatility levels
 */
export enum CacheVolatility {
  LOW = 'low',       // Data that rarely changes (e.g., company profiles)
  MEDIUM = 'medium', // Data that changes periodically (e.g., financial statements)
  HIGH = 'high'      // Data that changes frequently (e.g., market quotes)
}

/**
 * Cache options interface
 */
export interface CacheOptions {
  ttl: number;            // Time to live in milliseconds
  key?: string;           // Custom cache key
  volatility?: CacheVolatility; // Cache volatility level
  persistToDisk?: boolean; // Whether to persist to disk
}

/**
 * Cache service for managing API response caching
 */
export class CachingService {
  private static instance: CachingService;
  private memoryCache: Map<string, CacheItem<any>> = new Map();
  private diskCache: LocalForage;
  private compressionEnabled: boolean = true;
  private maxMemoryCacheSize: number = 100; // Maximum number of items in memory cache
  private memoryCacheHits: Map<string, number> = new Map(); // Track cache hits for LRU eviction

  private constructor() {
    // Initialize disk cache
    this.diskCache = localforage.createInstance({
      name: 'hedge-fund-app-cache',
      storeName: 'api-responses'
    });

    // Periodically clean up expired cache items
    setInterval(() => this.cleanupExpiredItems(), 60000); // Every minute
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): CachingService {
    if (!CachingService.instance) {
      CachingService.instance = new CachingService();
    }
    return CachingService.instance;
  }

  /**
   * Get an item from cache
   * @param key - Cache key
   * @returns Promise with cached item or null if not found
   */
  public async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    if (this.memoryCache.has(key)) {
      const item = this.memoryCache.get(key)!;
      
      // Check if item is expired
      if (item.expiresAt > Date.now()) {
        // Update hit count for LRU
        this.updateCacheHit(key);
        return item.data as T;
      } else {
        // Remove expired item
        this.memoryCache.delete(key);
      }
    }

    // If not in memory, check disk cache
    try {
      const item = await this.diskCache.getItem<CacheItem<T>>(key);
      
      if (item && item.expiresAt > Date.now()) {
        // Move to memory cache for faster access next time
        this.memoryCache.set(key, item);
        this.updateCacheHit(key);
        
        // Ensure memory cache doesn't grow too large
        this.enforceMemoryCacheLimit();
        
        return item.data;
      }
    } catch (error) {
      console.error('Error reading from disk cache:', error);
    }

    return null;
  }

  /**
   * Set an item in cache
   * @param key - Cache key
   * @param data - Data to cache
   * @param options - Cache options
   */
  public async set<T>(key: string, data: T, options: CacheOptions): Promise<void> {
    // Skip if caching is disabled
    if (!DATA_SOURCE_CONFIG.enableApiCache) {
      return;
    }

    const now = Date.now();
    const volatility = options.volatility || CacheVolatility.MEDIUM;
    
    // Calculate TTL based on volatility if not specified
    const ttl = options.ttl || this.getTtlForVolatility(volatility);
    
    const item: CacheItem<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      volatility
    };

    // Always store in memory cache
    this.memoryCache.set(key, item);
    this.updateCacheHit(key);
    
    // Ensure memory cache doesn't grow too large
    this.enforceMemoryCacheLimit();

    // Store in disk cache if persistToDisk is true
    if (options.persistToDisk !== false) {
      try {
        // Compress large objects if compression is enabled
        const dataToStore = this.compressionEnabled && JSON.stringify(data).length > 10000 
          ? await this.compressData(item)
          : item;
          
        await this.diskCache.setItem(key, dataToStore);
      } catch (error) {
        console.error('Error writing to disk cache:', error);
      }
    }
  }

  /**
   * Clear cache items
   * @param keyPattern - Optional regex pattern to clear specific cache entries
   * @param volatility - Optional volatility level to clear
   */
  public async clear(keyPattern?: RegExp, volatility?: CacheVolatility): Promise<void> {
    // Clear memory cache
    if (!keyPattern && !volatility) {
      // Clear all cache
      this.memoryCache.clear();
      this.memoryCacheHits.clear();
      await this.diskCache.clear();
      return;
    }

    // Clear by pattern or volatility
    const keysToRemove: string[] = [];

    // Check memory cache
    for (const [key, item] of this.memoryCache.entries()) {
      if ((keyPattern && keyPattern.test(key)) || 
          (volatility && item.volatility === volatility)) {
        keysToRemove.push(key);
      }
    }

    // Remove from memory cache
    keysToRemove.forEach(key => {
      this.memoryCache.delete(key);
      this.memoryCacheHits.delete(key);
    });

    // Clear disk cache
    if (keyPattern || volatility) {
      try {
        const keys = await this.diskCache.keys();
        
        for (const key of keys) {
          if (keyPattern && keyPattern.test(key)) {
            await this.diskCache.removeItem(key);
            continue;
          }
          
          if (volatility) {
            const item = await this.diskCache.getItem<CacheItem<any>>(key);
            if (item && item.volatility === volatility) {
              await this.diskCache.removeItem(key);
            }
          }
        }
      } catch (error) {
        console.error('Error clearing disk cache:', error);
      }
    }
  }

  /**
   * Invalidate cache based on data changes
   * @param dataType - Type of data that changed
   * @param identifier - Identifier for the data (e.g., symbol)
   */
  public async invalidateRelatedData(dataType: string, identifier: string): Promise<void> {
    const relatedPatterns: RegExp[] = [];
    
    switch (dataType) {
      case 'quote':
        // Invalidate all data related to this symbol
        relatedPatterns.push(new RegExp(`${identifier}_quote`));
        relatedPatterns.push(new RegExp(`${identifier}_chart`));
        break;
      case 'financials':
        // Invalidate financial data for this symbol
        relatedPatterns.push(new RegExp(`${identifier}_income`));
        relatedPatterns.push(new RegExp(`${identifier}_balance`));
        relatedPatterns.push(new RegExp(`${identifier}_cashflow`));
        break;
      case 'news':
        // Invalidate news for this symbol
        relatedPatterns.push(new RegExp(`${identifier}_news`));
        relatedPatterns.push(new RegExp(`${identifier}_sentiment`));
        break;
    }
    
    // Clear cache for each pattern
    for (const pattern of relatedPatterns) {
      await this.clear(pattern);
    }
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  public async getStats(): Promise<{
    memoryCacheSize: number;
    diskCacheSize: number;
    memoryCacheItems: number;
    diskCacheItems: number;
  }> {
    const keys = await this.diskCache.keys();
    
    return {
      memoryCacheSize: this.memoryCache.size,
      diskCacheSize: keys.length,
      memoryCacheItems: this.memoryCache.size,
      diskCacheItems: keys.length
    };
  }

  /**
   * Clean up expired items from cache
   */
  private async cleanupExpiredItems(): Promise<void> {
    const now = Date.now();
    
    // Clean memory cache
    for (const [key, item] of this.memoryCache.entries()) {
      if (item.expiresAt <= now) {
        this.memoryCache.delete(key);
        this.memoryCacheHits.delete(key);
      }
    }
    
    // Clean disk cache (sample a subset of keys to avoid performance issues)
    try {
      const keys = await this.diskCache.keys();
      const sampleSize = Math.min(keys.length, 50); // Check up to 50 keys at a time
      
      if (sampleSize > 0) {
        const sampleKeys = keys.sort(() => 0.5 - Math.random()).slice(0, sampleSize);
        
        for (const key of sampleKeys) {
          const item = await this.diskCache.getItem<CacheItem<any>>(key);
          if (item && item.expiresAt <= now) {
            await this.diskCache.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up disk cache:', error);
    }
  }

  /**
   * Get TTL based on volatility
   * @param volatility - Cache volatility level
   * @returns TTL in milliseconds
   */
  private getTtlForVolatility(volatility: CacheVolatility): number {
    switch (volatility) {
      case CacheVolatility.LOW:
        return DATA_SOURCE_CONFIG.cacheTTL?.lowVolatility || 86400000; // 24 hours
      case CacheVolatility.MEDIUM:
        return DATA_SOURCE_CONFIG.cacheTTL?.mediumVolatility || 3600000; // 1 hour
      case CacheVolatility.HIGH:
        return DATA_SOURCE_CONFIG.cacheTTL?.highVolatility || 300000; // 5 minutes
      default:
        return 3600000; // 1 hour default
    }
  }

  /**
   * Update cache hit count for LRU eviction
   * @param key - Cache key
   */
  private updateCacheHit(key: string): void {
    const hits = this.memoryCacheHits.get(key) || 0;
    this.memoryCacheHits.set(key, hits + 1);
  }

  /**
   * Enforce memory cache size limit using LRU eviction
   */
  private enforceMemoryCacheLimit(): void {
    if (this.memoryCache.size <= this.maxMemoryCacheSize) {
      return;
    }
    
    // Sort keys by hit count (least used first)
    const sortedKeys = Array.from(this.memoryCacheHits.entries())
      .sort((a, b) => a[1] - b[1])
      .map(entry => entry[0]);
    
    // Remove least used items
    const itemsToRemove = this.memoryCache.size - this.maxMemoryCacheSize;
    for (let i = 0; i < itemsToRemove; i++) {
      if (i < sortedKeys.length) {
        const key = sortedKeys[i];
        this.memoryCache.delete(key);
        this.memoryCacheHits.delete(key);
      }
    }
  }

  /**
   * Compress data for storage
   * @param data - Data to compress
   * @returns Compressed data
   */
  private async compressData<T>(data: T): Promise<T> {
    // In a real implementation, you would use a compression library
    // For now, we'll just return the original data
    return data;
  }
}

// Export singleton instance
export const cachingService = CachingService.getInstance();