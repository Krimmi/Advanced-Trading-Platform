/**
 * Metrics Service for Hedge Fund Trading Application
 * 
 * This service provides metrics collection, aggregation, and reporting
 * capabilities for monitoring application performance.
 */

const os = require('os');
const EventEmitter = require('events');
const logger = require('../logging/LoggingService');
const databaseService = require('../database/DatabaseService');
const cacheService = require('../cache/CacheService');

class MetricsService extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enabled: config.enabled !== undefined ? config.enabled : true,
      collectInterval: config.collectInterval || 15000, // 15 seconds
      retentionPeriod: config.retentionPeriod || 3600000, // 1 hour
      maxDataPoints: config.maxDataPoints || 1000,
      enablePrometheus: config.enablePrometheus !== undefined ? config.enablePrometheus : false,
      prometheusPort: config.prometheusPort || 9090,
      enableDatadog: config.enableDatadog !== undefined ? config.enableDatadog : false,
      enableNewRelic: config.enableNewRelic !== undefined ? config.enableNewRelic : false,
      ...config
    };
    
    // Initialize metrics storage
    this.metrics = {
      system: {
        cpu: [],
        memory: [],
        loadAvg: []
      },
      process: {
        memory: [],
        cpu: [],
        eventLoop: []
      },
      http: {
        requestCount: 0,
        responseTime: [],
        statusCodes: {},
        errorCount: 0
      },
      database: {
        operationCount: 0,
        queryTime: [],
        errorCount: 0,
        connectionStatus: []
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: [],
        size: []
      },
      api: {
        requestCount: 0,
        responseTime: [],
        errorCount: 0,
        providers: {}
      },
      business: {
        activeUsers: [],
        tradingVolume: [],
        orderCount: [],
        portfolioCount: []
      },
      custom: {}
    };
    
    // Initialize counters
    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
    
    // Initialize Prometheus if enabled
    if (this.config.enablePrometheus) {
      this.initializePrometheus();
    }
    
    // Initialize Datadog if enabled
    if (this.config.enableDatadog) {
      this.initializeDatadog();
    }
    
    // Initialize New Relic if enabled
    if (this.config.enableNewRelic) {
      this.initializeNewRelic();
    }
    
    // Start metrics collection if enabled
    if (this.config.enabled) {
      this.startCollection();
    }
    
    logger.info('Metrics Service initialized');
  }
  
  /**
   * Initialize Prometheus metrics
   */
  initializePrometheus() {
    try {
      const promClient = require('prom-client');
      const express = require('express');
      
      // Create registry
      this.prometheus = {
        client: promClient,
        registry: new promClient.Registry(),
        app: express()
      };
      
      // Enable default metrics
      promClient.collectDefaultMetrics({
        register: this.prometheus.registry,
        prefix: 'hedge_fund_'
      });
      
      // Create HTTP metrics
      this.prometheus.httpRequestDuration = new promClient.Histogram({
        name: 'hedge_fund_http_request_duration_seconds',
        help: 'Duration of HTTP requests in seconds',
        labelNames: ['method', 'route', 'status_code'],
        buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
      });
      
      this.prometheus.httpRequestsTotal = new promClient.Counter({
        name: 'hedge_fund_http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'route', 'status_code']
      });
      
      // Create database metrics
      this.prometheus.dbQueryDuration = new promClient.Histogram({
        name: 'hedge_fund_db_query_duration_seconds',
        help: 'Duration of database queries in seconds',
        labelNames: ['operation', 'collection'],
        buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
      });
      
      this.prometheus.dbOperationsTotal = new promClient.Counter({
        name: 'hedge_fund_db_operations_total',
        help: 'Total number of database operations',
        labelNames: ['operation', 'collection', 'status']
      });
      
      // Create cache metrics
      this.prometheus.cacheHits = new promClient.Counter({
        name: 'hedge_fund_cache_hits_total',
        help: 'Total number of cache hits',
        labelNames: ['cache_type']
      });
      
      this.prometheus.cacheMisses = new promClient.Counter({
        name: 'hedge_fund_cache_misses_total',
        help: 'Total number of cache misses',
        labelNames: ['cache_type']
      });
      
      // Create API metrics
      this.prometheus.apiRequestDuration = new promClient.Histogram({
        name: 'hedge_fund_api_request_duration_seconds',
        help: 'Duration of API requests in seconds',
        labelNames: ['provider', 'endpoint', 'status'],
        buckets: [0.05, 0.1, 0.5, 1, 2, 5, 10, 30]
      });
      
      this.prometheus.apiRequestsTotal = new promClient.Counter({
        name: 'hedge_fund_api_requests_total',
        help: 'Total number of API requests',
        labelNames: ['provider', 'endpoint', 'status']
      });
      
      // Register metrics
      this.prometheus.registry.registerMetric(this.prometheus.httpRequestDuration);
      this.prometheus.registry.registerMetric(this.prometheus.httpRequestsTotal);
      this.prometheus.registry.registerMetric(this.prometheus.dbQueryDuration);
      this.prometheus.registry.registerMetric(this.prometheus.dbOperationsTotal);
      this.prometheus.registry.registerMetric(this.prometheus.cacheHits);
      this.prometheus.registry.registerMetric(this.prometheus.cacheMisses);
      this.prometheus.registry.registerMetric(this.prometheus.apiRequestDuration);
      this.prometheus.registry.registerMetric(this.prometheus.apiRequestsTotal);
      
      // Setup metrics endpoint
      this.prometheus.app.get('/metrics', async (req, res) => {
        res.set('Content-Type', this.prometheus.registry.contentType);
        res.end(await this.prometheus.registry.metrics());
      });
      
      // Start server
      this.prometheus.server = this.prometheus.app.listen(this.config.prometheusPort, () => {
        logger.info(`Prometheus metrics server started on port ${this.config.prometheusPort}`);
      });
      
      logger.info('Prometheus metrics initialized');
    } catch (error) {
      logger.error('Failed to initialize Prometheus metrics:', error);
    }
  }
  
  /**
   * Initialize Datadog metrics
   */
  initializeDatadog() {
    try {
      const StatsD = require('hot-shots');
      
      this.datadog = new StatsD({
        host: process.env.DATADOG_AGENT_HOST || 'localhost',
        port: process.env.DATADOG_AGENT_PORT || 8125,
        prefix: 'hedge_fund.',
        globalTags: {
          env: process.env.NODE_ENV || 'development',
          service: 'hedge-fund-app'
        },
        errorHandler: (error) => {
          logger.error('Datadog StatsD error:', error);
        }
      });
      
      logger.info('Datadog metrics initialized');
    } catch (error) {
      logger.error('Failed to initialize Datadog metrics:', error);
    }
  }
  
  /**
   * Initialize New Relic metrics
   */
  initializeNewRelic() {
    try {
      // New Relic should be required at the entry point of the application
      // This just ensures it's loaded
      if (process.env.NEW_RELIC_LICENSE_KEY) {
        try {
          this.newrelic = require('newrelic');
          logger.info('New Relic metrics initialized');
        } catch (error) {
          logger.error('Failed to load New Relic:', error);
        }
      } else {
        logger.warn('New Relic license key not found, skipping initialization');
      }
    } catch (error) {
      logger.error('Failed to initialize New Relic metrics:', error);
    }
  }
  
  /**
   * Start metrics collection
   */
  startCollection() {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }
    
    this.collectionInterval = setInterval(() => {
      this.collectMetrics();
    }, this.config.collectInterval);
    
    logger.info(`Metrics collection started (interval: ${this.config.collectInterval}ms)`);
  }
  
  /**
   * Stop metrics collection
   */
  stopCollection() {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
      logger.info('Metrics collection stopped');
    }
  }
  
  /**
   * Collect metrics
   */
  async collectMetrics() {
    try {
      // Collect system metrics
      this.collectSystemMetrics();
      
      // Collect process metrics
      this.collectProcessMetrics();
      
      // Collect database metrics
      await this.collectDatabaseMetrics();
      
      // Collect cache metrics
      await this.collectCacheMetrics();
      
      // Emit metrics event
      this.emit('metrics', this.getLatestMetrics());
    } catch (error) {
      logger.error('Error collecting metrics:', error);
    }
  }
  
  /**
   * Collect system metrics
   */
  collectSystemMetrics() {
    try {
      // CPU usage
      const cpuUsage = os.loadavg()[0] / os.cpus().length * 100;
      this.addMetric('system.cpu', cpuUsage);
      
      // Memory usage
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryUsage = (usedMemory / totalMemory) * 100;
      this.addMetric('system.memory', memoryUsage);
      
      // Load average
      const loadAvg = os.loadavg();
      this.addMetric('system.loadAvg', loadAvg[0]);
      
      // Record to Prometheus if enabled
      if (this.prometheus) {
        // System metrics are collected by default metrics
      }
      
      // Record to Datadog if enabled
      if (this.datadog) {
        this.datadog.gauge('system.cpu.usage', cpuUsage);
        this.datadog.gauge('system.memory.usage', memoryUsage);
        this.datadog.gauge('system.load_avg', loadAvg[0]);
      }
      
      // Record to New Relic if enabled
      if (this.newrelic) {
        this.newrelic.recordMetric('system/cpu/usage', cpuUsage);
        this.newrelic.recordMetric('system/memory/usage', memoryUsage);
        this.newrelic.recordMetric('system/load_avg', loadAvg[0]);
      }
    } catch (error) {
      logger.error('Error collecting system metrics:', error);
    }
  }
  
  /**
   * Collect process metrics
   */
  collectProcessMetrics() {
    try {
      // Memory usage
      const memoryUsage = process.memoryUsage();
      this.addMetric('process.memory', {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers
      });
      
      // CPU usage
      const cpuUsage = process.cpuUsage();
      this.addMetric('process.cpu', {
        user: cpuUsage.user,
        system: cpuUsage.system
      });
      
      // Event loop lag
      const startTime = process.hrtime();
      setImmediate(() => {
        const endTime = process.hrtime(startTime);
        const lagMs = (endTime[0] * 1000) + (endTime[1] / 1000000);
        this.addMetric('process.eventLoop', lagMs);
        
        // Record to Prometheus if enabled
        if (this.prometheus) {
          // Process metrics are collected by default metrics
        }
        
        // Record to Datadog if enabled
        if (this.datadog) {
          this.datadog.gauge('process.memory.rss', memoryUsage.rss);
          this.datadog.gauge('process.memory.heap_total', memoryUsage.heapTotal);
          this.datadog.gauge('process.memory.heap_used', memoryUsage.heapUsed);
          this.datadog.gauge('process.cpu.user', cpuUsage.user);
          this.datadog.gauge('process.cpu.system', cpuUsage.system);
          this.datadog.gauge('process.event_loop.lag', lagMs);
        }
        
        // Record to New Relic if enabled
        if (this.newrelic) {
          this.newrelic.recordMetric('process/memory/rss', memoryUsage.rss);
          this.newrelic.recordMetric('process/memory/heap_total', memoryUsage.heapTotal);
          this.newrelic.recordMetric('process/memory/heap_used', memoryUsage.heapUsed);
          this.newrelic.recordMetric('process/cpu/user', cpuUsage.user);
          this.newrelic.recordMetric('process/cpu/system', cpuUsage.system);
          this.newrelic.recordMetric('process/event_loop/lag', lagMs);
        }
      });
    } catch (error) {
      logger.error('Error collecting process metrics:', error);
    }
  }
  
  /**
   * Collect database metrics
   */
  async collectDatabaseMetrics() {
    try {
      // Get database health
      const dbHealth = await databaseService.checkHealth();
      
      // Connection status
      const connectionStatus = dbHealth.status === 'ok' ? 1 : 0;
      this.addMetric('database.connectionStatus', connectionStatus);
      
      // Record to Prometheus if enabled
      if (this.prometheus) {
        // Connection status is recorded via custom metrics
        if (!this.prometheus.dbConnectionStatus) {
          this.prometheus.dbConnectionStatus = new this.prometheus.client.Gauge({
            name: 'hedge_fund_db_connection_status',
            help: 'Database connection status (1 = connected, 0 = disconnected)',
            registers: [this.prometheus.registry]
          });
        }
        
        this.prometheus.dbConnectionStatus.set(connectionStatus);
      }
      
      // Record to Datadog if enabled
      if (this.datadog) {
        this.datadog.gauge('database.connection_status', connectionStatus);
      }
      
      // Record to New Relic if enabled
      if (this.newrelic) {
        this.newrelic.recordMetric('database/connection_status', connectionStatus);
      }
    } catch (error) {
      logger.error('Error collecting database metrics:', error);
    }
  }
  
  /**
   * Collect cache metrics
   */
  async collectCacheMetrics() {
    try {
      // Get cache stats
      const cacheStats = await cacheService.getStats();
      
      // Cache hit rate
      const hitRate = cacheStats.memory.hitRate * 100;
      this.addMetric('cache.hitRate', hitRate);
      
      // Cache size
      const cacheSize = cacheStats.memory.keys;
      this.addMetric('cache.size', cacheSize);
      
      // Redis connection status
      const redisStatus = cacheStats.redis.connected ? 1 : 0;
      
      // Record to Prometheus if enabled
      if (this.prometheus) {
        // Cache metrics
        if (!this.prometheus.cacheHitRate) {
          this.prometheus.cacheHitRate = new this.prometheus.client.Gauge({
            name: 'hedge_fund_cache_hit_rate',
            help: 'Cache hit rate percentage',
            registers: [this.prometheus.registry]
          });
        }
        
        if (!this.prometheus.cacheSize) {
          this.prometheus.cacheSize = new this.prometheus.client.Gauge({
            name: 'hedge_fund_cache_size',
            help: 'Number of items in cache',
            registers: [this.prometheus.registry]
          });
        }
        
        if (!this.prometheus.redisStatus) {
          this.prometheus.redisStatus = new this.prometheus.client.Gauge({
            name: 'hedge_fund_redis_connection_status',
            help: 'Redis connection status (1 = connected, 0 = disconnected)',
            registers: [this.prometheus.registry]
          });
        }
        
        this.prometheus.cacheHitRate.set(hitRate);
        this.prometheus.cacheSize.set(cacheSize);
        this.prometheus.redisStatus.set(redisStatus);
      }
      
      // Record to Datadog if enabled
      if (this.datadog) {
        this.datadog.gauge('cache.hit_rate', hitRate);
        this.datadog.gauge('cache.size', cacheSize);
        this.datadog.gauge('cache.redis_status', redisStatus);
      }
      
      // Record to New Relic if enabled
      if (this.newrelic) {
        this.newrelic.recordMetric('cache/hit_rate', hitRate);
        this.newrelic.recordMetric('cache/size', cacheSize);
        this.newrelic.recordMetric('cache/redis_status', redisStatus);
      }
    } catch (error) {
      logger.error('Error collecting cache metrics:', error);
    }
  }
  
  /**
   * Add a metric data point
   * @param {string} name - Metric name
   * @param {*} value - Metric value
   */
  addMetric(name, value) {
    try {
      // Split name by dots
      const parts = name.split('.');
      
      if (parts.length < 2) {
        logger.warn(`Invalid metric name: ${name}`);
        return;
      }
      
      const category = parts[0];
      const metric = parts[1];
      
      // Check if category exists
      if (!this.metrics[category]) {
        this.metrics[category] = {};
      }
      
      // Check if metric exists
      if (!this.metrics[category][metric]) {
        this.metrics[category][metric] = [];
      }
      
      // Add data point
      this.metrics[category][metric].push({
        timestamp: Date.now(),
        value
      });
      
      // Trim data points if needed
      if (this.metrics[category][metric].length > this.config.maxDataPoints) {
        this.metrics[category][metric] = this.metrics[category][metric].slice(-this.config.maxDataPoints);
      }
      
      // Remove old data points
      const cutoffTime = Date.now() - this.config.retentionPeriod;
      this.metrics[category][metric] = this.metrics[category][metric].filter(point => point.timestamp >= cutoffTime);
    } catch (error) {
      logger.error(`Error adding metric ${name}:`, error);
    }
  }
  
  /**
   * Increment a counter
   * @param {string} name - Counter name
   * @param {number} value - Value to increment by
   * @param {Object} tags - Tags for the counter
   */
  incrementCounter(name, value = 1, tags = {}) {
    try {
      // Get or create counter
      if (!this.counters.has(name)) {
        this.counters.set(name, 0);
      }
      
      // Increment counter
      const newValue = this.counters.get(name) + value;
      this.counters.set(name, newValue);
      
      // Record to Prometheus if enabled
      if (this.prometheus) {
        // Create counter if it doesn't exist
        if (!this.prometheus[`counter_${name}`]) {
          this.prometheus[`counter_${name}`] = new this.prometheus.client.Counter({
            name: `hedge_fund_${name.replace(/\./g, '_')}`,
            help: `Counter for ${name}`,
            labelNames: Object.keys(tags),
            registers: [this.prometheus.registry]
          });
        }
        
        // Increment counter
        this.prometheus[`counter_${name}`].inc(tags, value);
      }
      
      // Record to Datadog if enabled
      if (this.datadog) {
        this.datadog.increment(name, value, tags);
      }
      
      // Record to New Relic if enabled
      if (this.newrelic) {
        this.newrelic.incrementMetric(`Custom/${name}`, value);
      }
      
      // Add to metrics
      this.addMetric(`custom.${name}`, newValue);
      
      return newValue;
    } catch (error) {
      logger.error(`Error incrementing counter ${name}:`, error);
      return 0;
    }
  }
  
  /**
   * Set a gauge value
   * @param {string} name - Gauge name
   * @param {number} value - Gauge value
   * @param {Object} tags - Tags for the gauge
   */
  setGauge(name, value, tags = {}) {
    try {
      // Set gauge value
      this.gauges.set(name, value);
      
      // Record to Prometheus if enabled
      if (this.prometheus) {
        // Create gauge if it doesn't exist
        if (!this.prometheus[`gauge_${name}`]) {
          this.prometheus[`gauge_${name}`] = new this.prometheus.client.Gauge({
            name: `hedge_fund_${name.replace(/\./g, '_')}`,
            help: `Gauge for ${name}`,
            labelNames: Object.keys(tags),
            registers: [this.prometheus.registry]
          });
        }
        
        // Set gauge value
        this.prometheus[`gauge_${name}`].set(tags, value);
      }
      
      // Record to Datadog if enabled
      if (this.datadog) {
        this.datadog.gauge(name, value, tags);
      }
      
      // Record to New Relic if enabled
      if (this.newrelic) {
        this.newrelic.recordMetric(`Custom/${name}`, value);
      }
      
      // Add to metrics
      this.addMetric(`custom.${name}`, value);
      
      return value;
    } catch (error) {
      logger.error(`Error setting gauge ${name}:`, error);
      return 0;
    }
  }
  
  /**
   * Record a histogram value
   * @param {string} name - Histogram name
   * @param {number} value - Value to record
   * @param {Object} tags - Tags for the histogram
   */
  recordHistogram(name, value, tags = {}) {
    try {
      // Get or create histogram
      if (!this.histograms.has(name)) {
        this.histograms.set(name, []);
      }
      
      // Add value to histogram
      const histogram = this.histograms.get(name);
      histogram.push(value);
      
      // Trim histogram if needed
      if (histogram.length > this.config.maxDataPoints) {
        this.histograms.set(name, histogram.slice(-this.config.maxDataPoints));
      }
      
      // Record to Prometheus if enabled
      if (this.prometheus) {
        // Create histogram if it doesn't exist
        if (!this.prometheus[`histogram_${name}`]) {
          this.prometheus[`histogram_${name}`] = new this.prometheus.client.Histogram({
            name: `hedge_fund_${name.replace(/\./g, '_')}`,
            help: `Histogram for ${name}`,
            labelNames: Object.keys(tags),
            registers: [this.prometheus.registry]
          });
        }
        
        // Record value
        this.prometheus[`histogram_${name}`].observe(tags, value);
      }
      
      // Record to Datadog if enabled
      if (this.datadog) {
        this.datadog.histogram(name, value, tags);
      }
      
      // Record to New Relic if enabled
      if (this.newrelic) {
        this.newrelic.recordMetric(`Custom/${name}`, value);
      }
      
      // Add to metrics
      this.addMetric(`custom.${name}`, value);
      
      return histogram;
    } catch (error) {
      logger.error(`Error recording histogram ${name}:`, error);
      return [];
    }
  }
  
  /**
   * Record HTTP request metrics
   * @param {Object} req - HTTP request
   * @param {Object} res - HTTP response
   * @param {number} duration - Request duration in milliseconds
   */
  recordHttpRequest(req, res, duration) {
    try {
      // Get request details
      const method = req.method;
      const route = req.route?.path || req.path;
      const statusCode = res.statusCode;
      
      // Increment request count
      this.metrics.http.requestCount++;
      
      // Record response time
      this.metrics.http.responseTime.push({
        timestamp: Date.now(),
        value: duration
      });
      
      // Trim response time if needed
      if (this.metrics.http.responseTime.length > this.config.maxDataPoints) {
        this.metrics.http.responseTime = this.metrics.http.responseTime.slice(-this.config.maxDataPoints);
      }
      
      // Record status code
      if (!this.metrics.http.statusCodes[statusCode]) {
        this.metrics.http.statusCodes[statusCode] = 0;
      }
      this.metrics.http.statusCodes[statusCode]++;
      
      // Record error if status code >= 400
      if (statusCode >= 400) {
        this.metrics.http.errorCount++;
      }
      
      // Record to Prometheus if enabled
      if (this.prometheus) {
        this.prometheus.httpRequestDuration.observe({ method, route, status_code: statusCode }, duration / 1000);
        this.prometheus.httpRequestsTotal.inc({ method, route, status_code: statusCode });
      }
      
      // Record to Datadog if enabled
      if (this.datadog) {
        this.datadog.timing('http.request.duration', duration, { method, route, status_code: statusCode });
        this.datadog.increment('http.request.count', 1, { method, route, status_code: statusCode });
        
        if (statusCode >= 400) {
          this.datadog.increment('http.request.error', 1, { method, route, status_code: statusCode });
        }
      }
      
      // Record to New Relic if enabled
      if (this.newrelic) {
        this.newrelic.recordMetric('http/request/duration', duration);
        this.newrelic.recordMetric('http/request/count', 1);
        
        if (statusCode >= 400) {
          this.newrelic.recordMetric('http/request/error', 1);
        }
      }
    } catch (error) {
      logger.error('Error recording HTTP request metrics:', error);
    }
  }
  
  /**
   * Record database operation metrics
   * @param {string} operation - Operation type
   * @param {string} collection - Collection name
   * @param {number} duration - Operation duration in milliseconds
   * @param {boolean} success - Whether operation was successful
   */
  recordDatabaseOperation(operation, collection, duration, success = true) {
    try {
      // Increment operation count
      this.metrics.database.operationCount++;
      
      // Record query time
      this.metrics.database.queryTime.push({
        timestamp: Date.now(),
        value: duration,
        operation,
        collection
      });
      
      // Trim query time if needed
      if (this.metrics.database.queryTime.length > this.config.maxDataPoints) {
        this.metrics.database.queryTime = this.metrics.database.queryTime.slice(-this.config.maxDataPoints);
      }
      
      // Record error if operation failed
      if (!success) {
        this.metrics.database.errorCount++;
      }
      
      // Record to Prometheus if enabled
      if (this.prometheus) {
        this.prometheus.dbQueryDuration.observe({ operation, collection }, duration / 1000);
        this.prometheus.dbOperationsTotal.inc({ operation, collection, status: success ? 'success' : 'error' });
      }
      
      // Record to Datadog if enabled
      if (this.datadog) {
        this.datadog.timing('database.operation.duration', duration, { operation, collection });
        this.datadog.increment('database.operation.count', 1, { operation, collection, success: success.toString() });
        
        if (!success) {
          this.datadog.increment('database.operation.error', 1, { operation, collection });
        }
      }
      
      // Record to New Relic if enabled
      if (this.newrelic) {
        this.newrelic.recordMetric(`database/operation/${operation}/${collection}/duration`, duration);
        this.newrelic.recordMetric(`database/operation/${operation}/${collection}/count`, 1);
        
        if (!success) {
          this.newrelic.recordMetric(`database/operation/${operation}/${collection}/error`, 1);
        }
      }
    } catch (error) {
      logger.error('Error recording database operation metrics:', error);
    }
  }
  
  /**
   * Record cache operation metrics
   * @param {string} operation - Operation type
   * @param {string} key - Cache key
   * @param {boolean} hit - Whether operation was a hit
   */
  recordCacheOperation(operation, key, hit = true) {
    try {
      // Record hit or miss
      if (hit) {
        this.metrics.cache.hits++;
      } else {
        this.metrics.cache.misses++;
      }
      
      // Calculate hit rate
      const hitRate = this.metrics.cache.hits / (this.metrics.cache.hits + this.metrics.cache.misses) * 100;
      
      // Record hit rate
      this.metrics.cache.hitRate.push({
        timestamp: Date.now(),
        value: hitRate
      });
      
      // Trim hit rate if needed
      if (this.metrics.cache.hitRate.length > this.config.maxDataPoints) {
        this.metrics.cache.hitRate = this.metrics.cache.hitRate.slice(-this.config.maxDataPoints);
      }
      
      // Record to Prometheus if enabled
      if (this.prometheus) {
        if (hit) {
          this.prometheus.cacheHits.inc({ cache_type: operation });
        } else {
          this.prometheus.cacheMisses.inc({ cache_type: operation });
        }
      }
      
      // Record to Datadog if enabled
      if (this.datadog) {
        if (hit) {
          this.datadog.increment('cache.hit', 1, { operation });
        } else {
          this.datadog.increment('cache.miss', 1, { operation });
        }
        
        this.datadog.gauge('cache.hit_rate', hitRate, { operation });
      }
      
      // Record to New Relic if enabled
      if (this.newrelic) {
        if (hit) {
          this.newrelic.recordMetric('cache/hit', 1);
        } else {
          this.newrelic.recordMetric('cache/miss', 1);
        }
        
        this.newrelic.recordMetric('cache/hit_rate', hitRate);
      }
    } catch (error) {
      logger.error('Error recording cache operation metrics:', error);
    }
  }
  
  /**
   * Record API request metrics
   * @param {string} provider - API provider
   * @param {string} endpoint - API endpoint
   * @param {number} duration - Request duration in milliseconds
   * @param {boolean} success - Whether request was successful
   */
  recordApiRequest(provider, endpoint, duration, success = true) {
    try {
      // Increment request count
      this.metrics.api.requestCount++;
      
      // Record response time
      this.metrics.api.responseTime.push({
        timestamp: Date.now(),
        value: duration,
        provider,
        endpoint
      });
      
      // Trim response time if needed
      if (this.metrics.api.responseTime.length > this.config.maxDataPoints) {
        this.metrics.api.responseTime = this.metrics.api.responseTime.slice(-this.config.maxDataPoints);
      }
      
      // Record error if request failed
      if (!success) {
        this.metrics.api.errorCount++;
      }
      
      // Record provider metrics
      if (!this.metrics.api.providers[provider]) {
        this.metrics.api.providers[provider] = {
          requestCount: 0,
          errorCount: 0,
          responseTime: []
        };
      }
      
      this.metrics.api.providers[provider].requestCount++;
      
      if (!success) {
        this.metrics.api.providers[provider].errorCount++;
      }
      
      this.metrics.api.providers[provider].responseTime.push({
        timestamp: Date.now(),
        value: duration,
        endpoint
      });
      
      // Trim provider response time if needed
      if (this.metrics.api.providers[provider].responseTime.length > this.config.maxDataPoints) {
        this.metrics.api.providers[provider].responseTime = this.metrics.api.providers[provider].responseTime.slice(-this.config.maxDataPoints);
      }
      
      // Record to Prometheus if enabled
      if (this.prometheus) {
        this.prometheus.apiRequestDuration.observe(
          { provider, endpoint, status: success ? 'success' : 'error' },
          duration / 1000
        );
        
        this.prometheus.apiRequestsTotal.inc(
          { provider, endpoint, status: success ? 'success' : 'error' }
        );
      }
      
      // Record to Datadog if enabled
      if (this.datadog) {
        this.datadog.timing('api.request.duration', duration, { provider, endpoint });
        this.datadog.increment('api.request.count', 1, { provider, endpoint, success: success.toString() });
        
        if (!success) {
          this.datadog.increment('api.request.error', 1, { provider, endpoint });
        }
      }
      
      // Record to New Relic if enabled
      if (this.newrelic) {
        this.newrelic.recordMetric(`api/request/${provider}/${endpoint}/duration`, duration);
        this.newrelic.recordMetric(`api/request/${provider}/${endpoint}/count`, 1);
        
        if (!success) {
          this.newrelic.recordMetric(`api/request/${provider}/${endpoint}/error`, 1);
        }
      }
    } catch (error) {
      logger.error('Error recording API request metrics:', error);
    }
  }
  
  /**
   * Record business metrics
   * @param {string} metric - Metric name
   * @param {*} value - Metric value
   */
  recordBusinessMetric(metric, value) {
    try {
      // Check if metric exists
      if (!this.metrics.business[metric]) {
        this.metrics.business[metric] = [];
      }
      
      // Record metric
      this.metrics.business[metric].push({
        timestamp: Date.now(),
        value
      });
      
      // Trim metric if needed
      if (this.metrics.business[metric].length > this.config.maxDataPoints) {
        this.metrics.business[metric] = this.metrics.business[metric].slice(-this.config.maxDataPoints);
      }
      
      // Record to Prometheus if enabled
      if (this.prometheus) {
        // Create gauge if it doesn't exist
        if (!this.prometheus[`business_${metric}`]) {
          this.prometheus[`business_${metric}`] = new this.prometheus.client.Gauge({
            name: `hedge_fund_business_${metric.replace(/\./g, '_')}`,
            help: `Business metric for ${metric}`,
            registers: [this.prometheus.registry]
          });
        }
        
        // Set gauge value
        this.prometheus[`business_${metric}`].set(value);
      }
      
      // Record to Datadog if enabled
      if (this.datadog) {
        this.datadog.gauge(`business.${metric}`, value);
      }
      
      // Record to New Relic if enabled
      if (this.newrelic) {
        this.newrelic.recordMetric(`business/${metric}`, value);
      }
    } catch (error) {
      logger.error(`Error recording business metric ${metric}:`, error);
    }
  }
  
  /**
   * Get latest metrics
   * @returns {Object} Latest metrics
   */
  getLatestMetrics() {
    try {
      const latestMetrics = {};
      
      // Get latest value for each metric
      for (const [category, metrics] of Object.entries(this.metrics)) {
        latestMetrics[category] = {};
        
        for (const [metric, values] of Object.entries(metrics)) {
          if (Array.isArray(values) && values.length > 0) {
            latestMetrics[category][metric] = values[values.length - 1].value;
          } else {
            latestMetrics[category][metric] = values;
          }
        }
      }
      
      return latestMetrics;
    } catch (error) {
      logger.error('Error getting latest metrics:', error);
      return {};
    }
  }
  
  /**
   * Get metrics for a specific time range
   * @param {number} startTime - Start time in milliseconds
   * @param {number} endTime - End time in milliseconds
   * @returns {Object} Metrics for time range
   */
  getMetricsForTimeRange(startTime, endTime) {
    try {
      const rangeMetrics = {};
      
      // Get metrics for each category
      for (const [category, metrics] of Object.entries(this.metrics)) {
        rangeMetrics[category] = {};
        
        for (const [metric, values] of Object.entries(metrics)) {
          if (Array.isArray(values)) {
            rangeMetrics[category][metric] = values.filter(
              point => point.timestamp >= startTime && point.timestamp <= endTime
            );
          } else {
            rangeMetrics[category][metric] = values;
          }
        }
      }
      
      return rangeMetrics;
    } catch (error) {
      logger.error('Error getting metrics for time range:', error);
      return {};
    }
  }
  
  /**
   * Create Express middleware for metrics collection
   * @returns {Function} Express middleware
   */
  createMetricsMiddleware() {
    return (req, res, next) => {
      // Record start time
      const startTime = Date.now();
      
      // Record response
      const originalEnd = res.end;
      res.end = (...args) => {
        // Calculate duration
        const duration = Date.now() - startTime;
        
        // Record metrics
        this.recordHttpRequest(req, res, duration);
        
        // Call original end
        originalEnd.apply(res, args);
      };
      
      next();
    };
  }
  
  /**
   * Create Express middleware for metrics endpoint
   * @param {Object} options - Options
   * @returns {Function} Express middleware
   */
  createMetricsEndpointMiddleware(options = {}) {
    const defaultOptions = {
      path: '/metrics',
      requireAuth: true
    };
    
    const config = { ...defaultOptions, ...options };
    
    return (req, res, next) => {
      if (req.path === config.path) {
        // Check authentication if required
        if (config.requireAuth && (!req.user || !req.user.isAdmin)) {
          return res.status(401).json({
            error: 'Unauthorized'
          });
        }
        
        // Return metrics
        res.json(this.getLatestMetrics());
      } else {
        next();
      }
    };
  }
  
  /**
   * Shutdown metrics service
   */
  async shutdown() {
    try {
      // Stop collection
      this.stopCollection();
      
      // Shutdown Prometheus server if enabled
      if (this.prometheus && this.prometheus.server) {
        await new Promise((resolve) => {
          this.prometheus.server.close(resolve);
        });
        logger.info('Prometheus metrics server stopped');
      }
      
      logger.info('Metrics Service shutdown complete');
    } catch (error) {
      logger.error('Error shutting down Metrics Service:', error);
    }
  }
}

// Create singleton instance
const metricsService = new MetricsService({
  enabled: process.env.ENABLE_METRICS !== 'false',
  collectInterval: parseInt(process.env.METRICS_COLLECT_INTERVAL || '15000', 10),
  retentionPeriod: parseInt(process.env.METRICS_RETENTION_PERIOD || '3600000', 10),
  maxDataPoints: parseInt(process.env.METRICS_MAX_DATA_POINTS || '1000', 10),
  enablePrometheus: process.env.ENABLE_PROMETHEUS === 'true',
  prometheusPort: parseInt(process.env.PROMETHEUS_PORT || '9090', 10),
  enableDatadog: process.env.ENABLE_DATADOG === 'true',
  enableNewRelic: process.env.ENABLE_NEW_RELIC === 'true'
});

module.exports = metricsService;