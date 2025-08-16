/**
 * Cache Service for Hedge Fund Trading Application
 * 
 * This service provides caching capabilities using Redis and in-memory cache.
 * It supports tiered caching, TTL, compression, and cache invalidation.
 */

const Redis = require('ioredis');
const NodeCache = require('node-cache');
const zlib = require('zlib');
const { promisify } = require('util');
const logger = require('../logging/LoggingService');

// Promisify zlib functions
const gzipAsync = promisify(zlib.gzip);
const gunzipAsync = promisify(zlib.gunzip);

class CacheService {
  constructor(config = {}) {
    this.config = {
      redis: {
        host: config.redis?.host || process.env.REDIS_HOST || 'localhost',
        port: config.redis?.port || process.env.REDIS_PORT || 6379,
        password: config.redis?.password || process.env.REDIS_PASSWORD || '',
        db: config.redis?.db || parseInt(process.env.REDIS_DB || '0', 10),
        keyPrefix: config.redis?.keyPrefix || process.env.REDIS_KEY_PREFIX || 'hedge_fund:',
        tls: config.redis?.tls || (process.env.REDIS_TLS === 'true' ? {} : undefined),
        maxRetriesPerRequest: config.redis?.maxRetriesPerRequest || 3,
        connectTimeout: config.redis?.connectTimeout || 10000,
        enableOfflineQueue: config.redis?.enableOfflineQueue !== undefined ? config.redis.enableOfflineQueue : true,
        enableReadyCheck: config.redis?.enableReadyCheck !== undefined ? config.redis.enableReadyCheck : true
      },
      memoryCache: {
        stdTTL: config.memoryCache?.stdTTL || 60, // 60 seconds
        checkperiod: config.memoryCache?.checkperiod || 120, // 120 seconds
        maxKeys: config.memoryCache?.maxKeys || 10000,
        useClones: config.memoryCache?.useClones !== undefined ? config.memoryCache.useClones : false
      },
      defaultTTL: config.defaultTTL || 300, // 5 minutes
      compression: {
        enabled: config.compression?.enabled !== undefined ? config.compression.enabled : true,
        threshold: config.compression?.threshold || 1024, // 1KB
        level: config.compression?.level || zlib.constants.Z_BEST_SPEED
      },
      tieredCache: {
        enabled: config.tieredCache?.enabled !== undefined ? config.tieredCache.enabled : true,
        levels: config.tieredCache?.levels || [
          { type: 'memory', ttl: 60 }, // 1 minute in memory
          { type: 'redis', ttl: 300 } // 5 minutes in Redis
        ]
      }
    };
    
    // Initialize memory cache
    this.memoryCache = new NodeCache(this.config.memoryCache);
    
    // Initialize Redis client
    this.redisClient = null;
    this.redisConnected = false;
    
    // Connect to Redis if not disabled
    if (!config.disableRedis) {
      this.connectRedis();
    }
    
    // Set up event listeners for memory cache
    this.memoryCache.on('expired', (key, value) => {
      logger.debug(`Memory cache key expired: ${key}`);
    });
    
    this.memoryCache.on('flush', () => {
      logger.debug('Memory cache flushed');
    });
    
    this.memoryCache.on('set', (key) => {
      logger.debug(`Memory cache key set: ${key}`);
    });
    
    this.memoryCache.on('del', (key, value) => {
      logger.debug(`Memory cache key deleted: ${key}`);
    });
  }
  
  /**
   * Connect to Redis
   */
  connectRedis() {
    try {
      logger.info('Connecting to Redis...');
      
      this.redisClient = new Redis(this.config.redis);
      
      this.redisClient.on('connect', () => {
        logger.info('Redis connected');
      });
      
      this.redisClient.on('ready', () => {
        this.redisConnected = true;
        logger.info('Redis ready');
      });
      
      this.redisClient.on('error', (err) => {
        this.redisConnected = false;
        logger.error('Redis error:', err);
      });
      
      this.redisClient.on('close', () => {
        this.redisConnected = false;
        logger.warn('Redis connection closed');
      });
      
      this.redisClient.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
      });
      
      this.redisClient.on('end', () => {
        this.redisConnected = false;
        logger.info('Redis connection ended');
      });
    } catch (error) {
      logger.error('Error connecting to Redis:', error);
      this.redisConnected = false;
    }
  }
  
  /**
   * Disconnect from Redis
   */
  async disconnect() {
    if (this.redisClient && this.redisConnected) {
      logger.info('Disconnecting from Redis...');
      await this.redisClient.quit();
      this.redisConnected = false;
      logger.info('Redis disconnected');
    }
  }
  
  /**
   * Check if Redis is connected
   * @returns {boolean} Redis connection status
   */
  isRedisConnected() {
    return this.redisConnected && this.redisClient && this.redisClient.status === 'ready';
  }
  
  /**
   * Compress data if it meets the threshold
   * @param {*} data - Data to compress
   * @returns {Promise<{compressed: boolean, data: Buffer|*}>} Compressed data
   */
  async compressData(data) {
    if (!this.config.compression.enabled) {
      return { compressed: false, data };
    }
    
    try {
      // Convert data to string
      const stringData = JSON.stringify(data);
      
      // Check if data size meets compression threshold
      if (Buffer.byteLength(stringData) >= this.config.compression.threshold) {
        // Compress data
        const compressedData = await gzipAsync(stringData, {
          level: this.config.compression.level
        });
        
        return { compressed: true, data: compressedData };
      }
    } catch (error) {
      logger.error('Error compressing data:', error);
    }
    
    return { compressed: false, data };
  }
  
  /**
   * Decompress data if it's compressed
   * @param {*} data - Data to decompress
   * @param {boolean} compressed - Whether data is compressed
   * @returns {Promise<*>} Decompressed data
   */
  async decompressData(data, compressed) {
    if (!compressed) {
      return data;
    }
    
    try {
      // Decompress data
      const decompressedData = await gunzipAsync(data);
      
      // Parse JSON string
      return JSON.parse(decompressedData.toString());
    } catch (error) {
      logger.error('Error decompressing data:', error);
      return null;
    }
  }
  
  /**
   * Set a value in the cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, ttl = this.config.defaultTTL) {
    try {
      // Use tiered caching if enabled
      if (this.config.tieredCache.enabled) {
        return await this.setTiered(key, value, ttl);
      }
      
      // Compress data if needed
      const { compressed, data } = await this.compressData(value);
      
      // Store in memory cache
      this.memoryCache.set(key, { compressed, data }, ttl);
      
      // Store in Redis if connected
      if (this.isRedisConnected()) {
        if (compressed) {
          // Store compressed data as Buffer
          await this.redisClient.set(key, data, 'EX', ttl);
        } else {
          // Store as JSON string
          await this.redisClient.set(key, JSON.stringify({ compressed, data }), 'EX', ttl);
        }
      }
      
      return true;
    } catch (error) {
      logger.error(`Error setting cache key ${key}:`, error);
      return false;
    }
  }
  
  /**
   * Set a value in tiered cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} Success status
   */
  async setTiered(key, value, ttl = this.config.defaultTTL) {
    try {
      // Compress data if needed
      const { compressed, data } = await this.compressData(value);
      
      // Store in each cache tier
      for (const level of this.config.tieredCache.levels) {
        const levelTTL = level.ttl || ttl;
        
        if (level.type === 'memory') {
          // Store in memory cache
          this.memoryCache.set(key, { compressed, data }, levelTTL);
        } else if (level.type === 'redis' && this.isRedisConnected()) {
          // Store in Redis
          if (compressed) {
            // Store compressed data as Buffer
            await this.redisClient.set(key, data, 'EX', levelTTL);
          } else {
            // Store as JSON string
            await this.redisClient.set(key, JSON.stringify({ compressed, data }), 'EX', levelTTL);
          }
        }
      }
      
      return true;
    } catch (error) {
      logger.error(`Error setting tiered cache key ${key}:`, error);
      return false;
    }
  }
  
  /**
   * Get a value from the cache
   * @param {string} key - Cache key
   * @returns {Promise<*>} Cached value or null if not found
   */
  async get(key) {
    try {
      // Use tiered caching if enabled
      if (this.config.tieredCache.enabled) {
        return await this.getTiered(key);
      }
      
      // Try memory cache first
      const memoryResult = this.memoryCache.get(key);
      
      if (memoryResult !== undefined) {
        // Found in memory cache
        return await this.decompressData(memoryResult.data, memoryResult.compressed);
      }
      
      // Try Redis if connected
      if (this.isRedisConnected()) {
        const redisResult = await this.redisClient.get(key);
        
        if (redisResult) {
          try {
            // Try to parse as JSON
            const parsed = JSON.parse(redisResult);
            const value = await this.decompressData(parsed.data, parsed.compressed);
            
            // Store in memory cache for faster access next time
            this.memoryCache.set(key, { compressed: parsed.compressed, data: parsed.data });
            
            return value;
          } catch (parseError) {
            // Not JSON, must be compressed data
            const value = await this.decompressData(redisResult, true);
            
            // Store in memory cache for faster access next time
            this.memoryCache.set(key, { compressed: true, data: redisResult });
            
            return value;
          }
        }
      }
      
      return null;
    } catch (error) {
      logger.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }
  
  /**
   * Get a value from tiered cache
   * @param {string} key - Cache key
   * @returns {Promise<*>} Cached value or null if not found
   */
  async getTiered(key) {
    try {
      // Try each cache tier in order
      for (const level of this.config.tieredCache.levels) {
        if (level.type === 'memory') {
          // Try memory cache
          const memoryResult = this.memoryCache.get(key);
          
          if (memoryResult !== undefined) {
            // Found in memory cache
            return await this.decompressData(memoryResult.data, memoryResult.compressed);
          }
        } else if (level.type === 'redis' && this.isRedisConnected()) {
          // Try Redis
          const redisResult = await this.redisClient.get(key);
          
          if (redisResult) {
            try {
              // Try to parse as JSON
              const parsed = JSON.parse(redisResult);
              const value = await this.decompressData(parsed.data, parsed.compressed);
              
              // Store in memory cache for faster access next time
              this.memoryCache.set(key, { compressed: parsed.compressed, data: parsed.data });
              
              return value;
            } catch (parseError) {
              // Not JSON, must be compressed data
              const value = await this.decompressData(redisResult, true);
              
              // Store in memory cache for faster access next time
              this.memoryCache.set(key, { compressed: true, data: redisResult });
              
              return value;
            }
          }
        }
      }
      
      return null;
    } catch (error) {
      logger.error(`Error getting tiered cache key ${key}:`, error);
      return null;
    }
  }
  
  /**
   * Delete a value from the cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Success status
   */
  async del(key) {
    try {
      // Delete from memory cache
      this.memoryCache.del(key);
      
      // Delete from Redis if connected
      if (this.isRedisConnected()) {
        await this.redisClient.del(key);
      }
      
      return true;
    } catch (error) {
      logger.error(`Error deleting cache key ${key}:`, error);
      return false;
    }
  }
  
  /**
   * Delete multiple values from the cache
   * @param {Array<string>} keys - Cache keys
   * @returns {Promise<boolean>} Success status
   */
  async delMulti(keys) {
    try {
      // Delete from memory cache
      this.memoryCache.del(keys);
      
      // Delete from Redis if connected
      if (this.isRedisConnected() && keys.length > 0) {
        await this.redisClient.del(keys);
      }
      
      return true;
    } catch (error) {
      logger.error(`Error deleting multiple cache keys:`, error);
      return false;
    }
  }
  
  /**
   * Check if a key exists in the cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Whether key exists
   */
  async exists(key) {
    try {
      // Check memory cache first
      if (this.memoryCache.has(key)) {
        return true;
      }
      
      // Check Redis if connected
      if (this.isRedisConnected()) {
        const exists = await this.redisClient.exists(key);
        return exists === 1;
      }
      
      return false;
    } catch (error) {
      logger.error(`Error checking if cache key ${key} exists:`, error);
      return false;
    }
  }
  
  /**
   * Get the TTL of a key
   * @param {string} key - Cache key
   * @returns {Promise<number>} TTL in seconds, -1 if no TTL, -2 if key doesn't exist
   */
  async ttl(key) {
    try {
      // Check memory cache first
      const memoryTTL = this.memoryCache.getTtl(key);
      
      if (memoryTTL) {
        return Math.max(0, Math.floor((memoryTTL - Date.now()) / 1000));
      }
      
      // Check Redis if connected
      if (this.isRedisConnected()) {
        return await this.redisClient.ttl(key);
      }
      
      return -2; // Key doesn't exist
    } catch (error) {
      logger.error(`Error getting TTL for cache key ${key}:`, error);
      return -2;
    }
  }
  
  /**
   * Set the TTL of a key
   * @param {string} key - Cache key
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} Success status
   */
  async expire(key, ttl) {
    try {
      // Set TTL in memory cache
      const memoryResult = this.memoryCache.ttl(key, ttl);
      
      // Set TTL in Redis if connected
      if (this.isRedisConnected()) {
        await this.redisClient.expire(key, ttl);
      }
      
      return true;
    } catch (error) {
      logger.error(`Error setting TTL for cache key ${key}:`, error);
      return false;
    }
  }
  
  /**
   * Increment a value in the cache
   * @param {string} key - Cache key
   * @param {number} value - Value to increment by
   * @returns {Promise<number>} New value
   */
  async incr(key, value = 1) {
    try {
      // Increment in Redis if connected
      if (this.isRedisConnected()) {
        const newValue = value === 1 
          ? await this.redisClient.incr(key)
          : await this.redisClient.incrby(key, value);
        
        // Update memory cache
        this.memoryCache.set(key, { compressed: false, data: newValue });
        
        return newValue;
      }
      
      // Fallback to memory cache
      const currentValue = this.memoryCache.get(key);
      const newValue = (currentValue?.data || 0) + value;
      
      this.memoryCache.set(key, { compressed: false, data: newValue });
      
      return newValue;
    } catch (error) {
      logger.error(`Error incrementing cache key ${key}:`, error);
      return 0;
    }
  }
  
  /**
   * Decrement a value in the cache
   * @param {string} key - Cache key
   * @param {number} value - Value to decrement by
   * @returns {Promise<number>} New value
   */
  async decr(key, value = 1) {
    try {
      // Decrement in Redis if connected
      if (this.isRedisConnected()) {
        const newValue = value === 1 
          ? await this.redisClient.decr(key)
          : await this.redisClient.decrby(key, value);
        
        // Update memory cache
        this.memoryCache.set(key, { compressed: false, data: newValue });
        
        return newValue;
      }
      
      // Fallback to memory cache
      const currentValue = this.memoryCache.get(key);
      const newValue = Math.max(0, (currentValue?.data || 0) - value);
      
      this.memoryCache.set(key, { compressed: false, data: newValue });
      
      return newValue;
    } catch (error) {
      logger.error(`Error decrementing cache key ${key}:`, error);
      return 0;
    }
  }
  
  /**
   * Flush all cache data
   * @returns {Promise<boolean>} Success status
   */
  async flush() {
    try {
      // Flush memory cache
      this.memoryCache.flushAll();
      
      // Flush Redis if connected
      if (this.isRedisConnected()) {
        await this.redisClient.flushdb();
      }
      
      return true;
    } catch (error) {
      logger.error('Error flushing cache:', error);
      return false;
    }
  }
  
  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache statistics
   */
  async getStats() {
    try {
      const stats = {
        memory: {
          keys: this.memoryCache.keys().length,
          hits: this.memoryCache.getStats().hits,
          misses: this.memoryCache.getStats().misses,
          hitRate: this.memoryCache.getStats().hits / (this.memoryCache.getStats().hits + this.memoryCache.getStats().misses || 1)
        },
        redis: {
          connected: this.isRedisConnected(),
          keys: 0,
          memory: 0,
          clients: 0
        }
      };
      
      // Get Redis stats if connected
      if (this.isRedisConnected()) {
        const info = await this.redisClient.info();
        const keyspace = await this.redisClient.info('keyspace');
        
        // Parse Redis info
        const dbStats = keyspace.match(/db0:keys=(\d+)/);
        const memoryStats = info.match(/used_memory:(\d+)/);
        const clientStats = info.match(/connected_clients:(\d+)/);
        
        stats.redis.keys = dbStats ? parseInt(dbStats[1], 10) : 0;
        stats.redis.memory = memoryStats ? parseInt(memoryStats[1], 10) : 0;
        stats.redis.clients = clientStats ? parseInt(clientStats[1], 10) : 0;
      }
      
      return stats;
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      return {
        memory: {
          keys: 0,
          hits: 0,
          misses: 0,
          hitRate: 0
        },
        redis: {
          connected: false,
          keys: 0,
          memory: 0,
          clients: 0
        }
      };
    }
  }
  
  /**
   * Warm up the cache with frequently accessed data
   * @param {Array<Object>} items - Items to warm up
   * @returns {Promise<boolean>} Success status
   */
  async warmUp(items) {
    try {
      logger.info(`Warming up cache with ${items.length} items...`);
      
      let successCount = 0;
      
      for (const item of items) {
        const { key, getter, ttl } = item;
        
        try {
          // Check if key already exists
          const exists = await this.exists(key);
          
          if (!exists) {
            // Get data using getter function
            const data = await getter();
            
            // Cache data
            if (data !== null && data !== undefined) {
              await this.set(key, data, ttl || this.config.defaultTTL);
              successCount++;
            }
          } else {
            successCount++;
          }
        } catch (itemError) {
          logger.error(`Error warming up cache item ${key}:`, itemError);
        }
      }
      
      logger.info(`Cache warm-up completed: ${successCount}/${items.length} items cached successfully`);
      
      return successCount === items.length;
    } catch (error) {
      logger.error('Error warming up cache:', error);
      return false;
    }
  }
  
  /**
   * Invalidate cache keys by pattern
   * @param {string} pattern - Key pattern to invalidate
   * @returns {Promise<number>} Number of keys invalidated
   */
  async invalidateByPattern(pattern) {
    try {
      let count = 0;
      
      // Invalidate in memory cache
      const memoryKeys = this.memoryCache.keys();
      const memoryKeysToDelete = memoryKeys.filter(key => {
        // Convert pattern to regex
        const regexPattern = pattern.replace(/\*/g, '.*');
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(key);
      });
      
      if (memoryKeysToDelete.length > 0) {
        this.memoryCache.del(memoryKeysToDelete);
        count += memoryKeysToDelete.length;
      }
      
      // Invalidate in Redis if connected
      if (this.isRedisConnected()) {
        const redisKeys = await this.redisClient.keys(pattern);
        
        if (redisKeys.length > 0) {
          await this.redisClient.del(redisKeys);
          count += redisKeys.length;
        }
      }
      
      logger.info(`Invalidated ${count} cache keys matching pattern: ${pattern}`);
      
      return count;
    } catch (error) {
      logger.error(`Error invalidating cache keys by pattern ${pattern}:`, error);
      return 0;
    }
  }
  
  /**
   * Check cache health
   * @returns {Promise<Object>} Health status
   */
  async checkHealth() {
    try {
      const stats = await this.getStats();
      
      return {
        status: this.isRedisConnected() ? 'ok' : 'degraded',
        message: this.isRedisConnected() 
          ? 'Cache service is healthy' 
          : 'Cache service is degraded (Redis not connected)',
        details: {
          memory: stats.memory,
          redis: stats.redis
        }
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Cache service health check failed',
        details: error.message
      };
    }
  }
}

// Create singleton instance
const cacheService = new CacheService({
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'hedge_fund:',
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined
  },
  memoryCache: {
    stdTTL: parseInt(process.env.MEMORY_CACHE_TTL || '60', 10),
    maxKeys: parseInt(process.env.MEMORY_CACHE_MAX_KEYS || '10000', 10)
  },
  defaultTTL: parseInt(process.env.DEFAULT_CACHE_TTL || '300', 10),
  compression: {
    enabled: process.env.CACHE_COMPRESSION !== 'false',
    threshold: parseInt(process.env.CACHE_COMPRESSION_THRESHOLD || '1024', 10)
  },
  tieredCache: {
    enabled: process.env.TIERED_CACHE !== 'false'
  },
  disableRedis: process.env.DISABLE_REDIS === 'true'
});

module.exports = cacheService;