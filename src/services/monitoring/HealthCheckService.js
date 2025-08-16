/**
 * Health Check Service for Hedge Fund Trading Application
 * 
 * This service provides health check endpoints and monitoring capabilities
 * for the application and its dependencies.
 */

const os = require('os');
const logger = require('../logging/LoggingService');
const databaseService = require('../database/DatabaseService');
const cacheService = require('../cache/CacheService');

class HealthCheckService {
  constructor() {
    this.startTime = Date.now();
    this.services = new Map();
    
    // Register core services
    this.registerService('database', async () => await databaseService.checkHealth());
    this.registerService('cache', async () => await cacheService.checkHealth());
    
    // Register system checks
    this.registerService('system', async () => this.checkSystem());
    
    logger.info('Health Check Service initialized');
  }
  
  /**
   * Register a service for health checks
   * @param {string} name - Service name
   * @param {Function} checkFunction - Function that returns health status
   */
  registerService(name, checkFunction) {
    this.services.set(name, {
      name,
      checkFunction,
      status: 'unknown',
      lastCheck: null,
      lastSuccess: null,
      lastError: null,
      consecutiveFailures: 0
    });
    
    logger.debug(`Registered service for health checks: ${name}`);
  }
  
  /**
   * Unregister a service
   * @param {string} name - Service name
   * @returns {boolean} Success status
   */
  unregisterService(name) {
    const result = this.services.delete(name);
    
    if (result) {
      logger.debug(`Unregistered service from health checks: ${name}`);
    }
    
    return result;
  }
  
  /**
   * Check health of all registered services
   * @returns {Promise<Object>} Health status
   */
  async checkHealth() {
    logger.debug('Performing health check');
    
    const results = {
      status: 'ok',
      uptime: this.getUptime(),
      timestamp: new Date().toISOString(),
      services: {}
    };
    
    let hasErrors = false;
    let hasDegradation = false;
    
    // Check each service
    for (const [name, service] of this.services.entries()) {
      try {
        const startTime = Date.now();
        const healthResult = await service.checkFunction();
        const responseTime = Date.now() - startTime;
        
        // Update service status
        service.status = healthResult.status;
        service.lastCheck = new Date();
        service.responseTime = responseTime;
        
        if (healthResult.status === 'ok') {
          service.lastSuccess = new Date();
          service.consecutiveFailures = 0;
        } else {
          service.consecutiveFailures++;
          
          if (healthResult.status === 'error') {
            service.lastError = new Date();
            hasErrors = true;
          } else if (healthResult.status === 'warning' || healthResult.status === 'degraded') {
            hasDegradation = true;
          }
        }
        
        // Add to results
        results.services[name] = {
          status: healthResult.status,
          message: healthResult.message,
          responseTime,
          lastCheck: service.lastCheck,
          lastSuccess: service.lastSuccess,
          lastError: service.lastError,
          consecutiveFailures: service.consecutiveFailures,
          details: healthResult.details
        };
      } catch (error) {
        // Handle check failure
        service.status = 'error';
        service.lastCheck = new Date();
        service.lastError = new Date();
        service.consecutiveFailures++;
        hasErrors = true;
        
        logger.error(`Health check failed for service ${name}:`, error);
        
        // Add to results
        results.services[name] = {
          status: 'error',
          message: `Health check failed: ${error.message}`,
          lastCheck: service.lastCheck,
          lastSuccess: service.lastSuccess,
          lastError: service.lastError,
          consecutiveFailures: service.consecutiveFailures,
          error: error.message
        };
      }
    }
    
    // Determine overall status
    if (hasErrors) {
      results.status = 'error';
    } else if (hasDegradation) {
      results.status = 'degraded';
    }
    
    return results;
  }
  
  /**
   * Check system health
   * @returns {Promise<Object>} System health status
   */
  async checkSystem() {
    try {
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;
      
      const cpuUsage = await this.getCpuUsage();
      const loadAvg = os.loadavg();
      const cpuCount = os.cpus().length;
      
      // Determine status based on resource usage
      let status = 'ok';
      let message = 'System resources are healthy';
      
      if (memoryUsagePercent > 90 || (loadAvg[0] / cpuCount) > 0.9) {
        status = 'error';
        message = 'System resources are critically low';
      } else if (memoryUsagePercent > 80 || (loadAvg[0] / cpuCount) > 0.7) {
        status = 'warning';
        message = 'System resources are running low';
      }
      
      return {
        status,
        message,
        details: {
          memory: {
            total: formatBytes(totalMemory),
            free: formatBytes(freeMemory),
            used: formatBytes(usedMemory),
            usagePercent: memoryUsagePercent.toFixed(2)
          },
          cpu: {
            usage: cpuUsage.toFixed(2),
            loadAvg: loadAvg.map(load => load.toFixed(2)),
            cores: cpuCount
          },
          os: {
            platform: os.platform(),
            release: os.release(),
            hostname: os.hostname(),
            uptime: formatUptime(os.uptime())
          }
        }
      };
    } catch (error) {
      logger.error('Error checking system health:', error);
      
      return {
        status: 'error',
        message: `System health check failed: ${error.message}`,
        details: null
      };
    }
  }
  
  /**
   * Get CPU usage percentage
   * @returns {Promise<number>} CPU usage percentage
   */
  async getCpuUsage() {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = process.hrtime.bigint();
      
      // Wait for 100ms to get a sample
      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const endTime = process.hrtime.bigint();
        
        const elapsedTimeMs = Number(endTime - startTime) / 1000000;
        const elapsedUserMs = endUsage.user / 1000;
        const elapsedSystemMs = endUsage.system / 1000;
        const cpuPercent = (elapsedUserMs + elapsedSystemMs) / elapsedTimeMs * 100;
        
        resolve(cpuPercent);
      }, 100);
    });
  }
  
  /**
   * Get application uptime
   * @returns {string} Formatted uptime
   */
  getUptime() {
    const uptime = Date.now() - this.startTime;
    return formatUptime(uptime / 1000);
  }
  
  /**
   * Get detailed health metrics
   * @returns {Promise<Object>} Health metrics
   */
  async getDetailedMetrics() {
    const health = await this.checkHealth();
    
    // Add more detailed metrics
    const metrics = {
      ...health,
      process: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        pid: process.pid,
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      os: {
        loadAvg: os.loadavg(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        cpus: os.cpus().length,
        platform: os.platform(),
        release: os.release(),
        hostname: os.hostname(),
        uptime: os.uptime()
      }
    };
    
    return metrics;
  }
  
  /**
   * Create Express middleware for health check endpoint
   * @param {Object} options - Options
   * @returns {Function} Express middleware
   */
  createHealthCheckMiddleware(options = {}) {
    const defaultOptions = {
      path: '/health',
      detailed: false,
      includeDetails: true
    };
    
    const config = { ...defaultOptions, ...options };
    
    return async (req, res, next) => {
      if (req.path === config.path) {
        try {
          const health = config.detailed 
            ? await this.getDetailedMetrics()
            : await this.checkHealth();
          
          // Remove details if not requested
          if (!config.includeDetails) {
            for (const service of Object.values(health.services)) {
              delete service.details;
            }
          }
          
          // Set status code based on health status
          let statusCode = 200;
          if (health.status === 'error') {
            statusCode = 500;
          } else if (health.status === 'degraded' || health.status === 'warning') {
            statusCode = 200; // Still return 200 for degraded to avoid triggering alerts
          }
          
          res.status(statusCode).json(health);
        } catch (error) {
          logger.error('Error in health check middleware:', error);
          res.status(500).json({
            status: 'error',
            message: `Health check failed: ${error.message}`,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        next();
      }
    };
  }
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Bytes
 * @returns {string} Formatted bytes
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format uptime to human-readable string
 * @param {number} seconds - Uptime in seconds
 * @returns {string} Formatted uptime
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

// Create singleton instance
const healthCheckService = new HealthCheckService();

module.exports = healthCheckService;