import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { DATA_SOURCE_CONFIG } from '../../config/apiConfig';
import { cachingService, CacheOptions, CacheVolatility } from './cache/CachingService';
import { performanceMonitoring, MetricType } from '../monitoring/performanceMonitoring';

/**
 * Error class for API-related errors
 */
export class ApiError extends Error {
  status?: number;
  data?: any;
  isAxiosError: boolean;
  retryable: boolean;

  constructor(message: string, status?: number, data?: any, isAxiosError = false, retryable = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.isAxiosError = isAxiosError;
    this.retryable = retryable;
  }

  static fromAxiosError(error: AxiosError): ApiError {
    const status = error.response?.status;
    const data = error.response?.data;
    
    // Determine if error is retryable
    const retryable = !status || (status >= 500 && status < 600) || status === 429;
    
    return new ApiError(
      error.message || 'An error occurred during the API request',
      status,
      data,
      true,
      retryable
    );
  }
}

/**
 * Circuit breaker states
 */
enum CircuitState {
  CLOSED, // Normal operation, requests pass through
  OPEN,   // Failing state, requests are blocked
  HALF_OPEN // Testing state, limited requests pass through
}

/**
 * Circuit breaker configuration
 */
interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenMaxRequests: number;
}

/**
 * Base API service class that provides common functionality for all API services
 */
export abstract class BaseApiService {
  protected axios: AxiosInstance;
  protected baseUrl: string;
  protected serviceName: string;
  
  // Circuit breaker properties
  private circuitState: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private halfOpenSuccesses: number = 0;
  private circuitBreakerConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    resetTimeout: 30000, // 30 seconds
    halfOpenMaxRequests: 3
  };

  /**
   * Constructor
   * @param baseUrl - Base URL for the API
   * @param serviceName - Service name for monitoring
   * @param config - Axios configuration
   */
  constructor(baseUrl: string, serviceName: string, config?: AxiosRequestConfig) {
    this.baseUrl = baseUrl;
    this.serviceName = serviceName;
    this.axios = axios.create({
      baseURL: baseUrl,
      ...config,
    });

    // Add request interceptor for authentication
    this.axios.interceptors.request.use(
      this.requestInterceptor.bind(this),
      this.requestErrorInterceptor.bind(this)
    );

    // Add response interceptor for error handling
    this.axios.interceptors.response.use(
      this.responseInterceptor.bind(this),
      this.responseErrorInterceptor.bind(this)
    );
  }

  /**
   * Request interceptor
   * @param config - Axios request config
   * @returns Modified config
   */
  protected requestInterceptor(config: AxiosRequestConfig): AxiosRequestConfig {
    // Add authentication headers if needed
    return config;
  }

  /**
   * Request error interceptor
   * @param error - Axios error
   * @returns Rejected promise
   */
  protected requestErrorInterceptor(error: any): Promise<never> {
    console.error('Request error:', error);
    return Promise.reject(ApiError.fromAxiosError(error));
  }

  /**
   * Response interceptor
   * @param response - Axios response
   * @returns Response data
   */
  protected responseInterceptor(response: AxiosResponse): any {
    // Reset circuit breaker on successful response if in HALF_OPEN state
    if (this.circuitState === CircuitState.HALF_OPEN) {
      this.halfOpenSuccesses++;
      if (this.halfOpenSuccesses >= this.circuitBreakerConfig.halfOpenMaxRequests) {
        this.closeCircuit();
      }
    }
    
    // Transform response if needed
    return response;
  }

  /**
   * Response error interceptor
   * @param error - Axios error
   * @returns Rejected promise or retry
   */
  protected async responseErrorInterceptor(error: any): Promise<any> {
    console.error('Response error:', error);
    
    // Convert to ApiError
    const apiError = ApiError.fromAxiosError(error);
    
    // Update circuit breaker state if error is retryable
    if (apiError.retryable) {
      this.recordFailure();
    }
    
    // Check if we should retry the request
    if (this.shouldRetry(apiError)) {
      return this.retryRequest(error);
    }
    
    return Promise.reject(apiError);
  }

  /**
   * Record a failure for the circuit breaker
   */
  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    // Open circuit if failure threshold is reached
    if (this.circuitState === CircuitState.CLOSED && 
        this.failures >= this.circuitBreakerConfig.failureThreshold) {
      this.openCircuit();
    }
  }

  /**
   * Open the circuit breaker
   */
  private openCircuit(): void {
    console.warn(`Circuit breaker opened for ${this.serviceName}`);
    this.circuitState = CircuitState.OPEN;
    
    // Schedule half-open state
    setTimeout(() => {
      console.log(`Circuit breaker half-open for ${this.serviceName}`);
      this.circuitState = CircuitState.HALF_OPEN;
      this.halfOpenSuccesses = 0;
    }, this.circuitBreakerConfig.resetTimeout);
  }

  /**
   * Close the circuit breaker
   */
  private closeCircuit(): void {
    console.log(`Circuit breaker closed for ${this.serviceName}`);
    this.circuitState = CircuitState.CLOSED;
    this.failures = 0;
    this.halfOpenSuccesses = 0;
  }

  /**
   * Check if circuit breaker allows the request
   * @returns True if request is allowed
   */
  private isCircuitAllowed(): boolean {
    // Always allow in CLOSED state
    if (this.circuitState === CircuitState.CLOSED) {
      return true;
    }
    
    // Never allow in OPEN state
    if (this.circuitState === CircuitState.OPEN) {
      // Check if reset timeout has passed
      const now = Date.now();
      if (now - this.lastFailureTime >= this.circuitBreakerConfig.resetTimeout) {
        // Transition to HALF_OPEN
        this.circuitState = CircuitState.HALF_OPEN;
        this.halfOpenSuccesses = 0;
      } else {
        return false;
      }
    }
    
    // In HALF_OPEN state, allow limited requests
    return true;
  }

  /**
   * Determine if a request should be retried
   * @param error - API error
   * @returns True if the request should be retried
   */
  protected shouldRetry(error: ApiError): boolean {
    // Only retry retryable errors
    return error.retryable;
  }

  /**
   * Retry a failed request
   * @param error - Axios error
   * @returns Promise with the retried request
   */
  protected async retryRequest(error: AxiosError): Promise<any> {
    const config = error.config;
    
    // Set retry count
    const retryCount = config.headers?.['x-retry-count'] ? 
      Number(config.headers['x-retry-count']) : 0;
    
    // Maximum retry attempts
    const maxRetries = 3;
    
    if (retryCount < maxRetries) {
      // Exponential backoff with jitter
      const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
      
      // Wait for the delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Update retry count
      config.headers = {
        ...config.headers,
        'x-retry-count': String(retryCount + 1)
      };
      
      // Retry the request
      return this.axios(config);
    }
    
    // Max retries reached, reject with error
    return Promise.reject(ApiError.fromAxiosError(error));
  }

  /**
   * Make a GET request with caching
   * @param url - Request URL
   * @param config - Axios request config
   * @param cacheOptions - Cache options
   * @returns Promise with the response data
   */
  protected async get<T>(
    url: string, 
    config?: AxiosRequestConfig, 
    cacheOptions?: CacheOptions
  ): Promise<T> {
    // Check circuit breaker
    if (!this.isCircuitAllowed()) {
      throw new ApiError(`Circuit breaker is open for ${this.serviceName}`, 503, null, false, false);
    }
    
    // Start performance monitoring
    const metricId = performanceMonitoring.startMetric(
      `${this.serviceName}.get.${url}`,
      MetricType.API_CALL,
      { url, params: config?.params }
    );
    
    try {
      // Skip cache if disabled
      if (!DATA_SOURCE_CONFIG.enableApiCache || !cacheOptions) {
        const response = await this.axios.get<T>(url, config);
        performanceMonitoring.endMetric(metricId, true, { status: response.status });
        return response.data;
      }

      // Generate cache key
      const cacheKey = cacheOptions.key || `${this.serviceName}:${url}:${JSON.stringify(config?.params || {})}`;
      
      // Check cache
      const cachedData = await cachingService.get<T>(cacheKey);
      if (cachedData) {
        performanceMonitoring.endMetric(metricId, true, { cached: true });
        return cachedData;
      }
      
      // Make the request
      const response = await this.axios.get<T>(url, config);
      
      // Cache the response
      await cachingService.set(cacheKey, response.data, cacheOptions);
      
      performanceMonitoring.endMetric(metricId, true, { status: response.status });
      return response.data;
    } catch (error) {
      performanceMonitoring.endMetric(metricId, false, { error: error.message });
      throw error;
    }
  }

  /**
   * Make a POST request
   * @param url - Request URL
   * @param data - Request data
   * @param config - Axios request config
   * @returns Promise with the response data
   */
  protected async post<T>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<T> {
    // Check circuit breaker
    if (!this.isCircuitAllowed()) {
      throw new ApiError(`Circuit breaker is open for ${this.serviceName}`, 503, null, false, false);
    }
    
    // Start performance monitoring
    const metricId = performanceMonitoring.startMetric(
      `${this.serviceName}.post.${url}`,
      MetricType.API_CALL,
      { url }
    );
    
    try {
      const response = await this.axios.post<T>(url, data, config);
      performanceMonitoring.endMetric(metricId, true, { status: response.status });
      return response.data;
    } catch (error) {
      performanceMonitoring.endMetric(metricId, false, { error: error.message });
      throw error;
    }
  }

  /**
   * Make a PUT request
   * @param url - Request URL
   * @param data - Request data
   * @param config - Axios request config
   * @returns Promise with the response data
   */
  protected async put<T>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<T> {
    // Check circuit breaker
    if (!this.isCircuitAllowed()) {
      throw new ApiError(`Circuit breaker is open for ${this.serviceName}`, 503, null, false, false);
    }
    
    // Start performance monitoring
    const metricId = performanceMonitoring.startMetric(
      `${this.serviceName}.put.${url}`,
      MetricType.API_CALL,
      { url }
    );
    
    try {
      const response = await this.axios.put<T>(url, data, config);
      performanceMonitoring.endMetric(metricId, true, { status: response.status });
      return response.data;
    } catch (error) {
      performanceMonitoring.endMetric(metricId, false, { error: error.message });
      throw error;
    }
  }

  /**
   * Make a DELETE request
   * @param url - Request URL
   * @param config - Axios request config
   * @returns Promise with the response data
   */
  protected async delete<T>(
    url: string, 
    config?: AxiosRequestConfig
  ): Promise<T> {
    // Check circuit breaker
    if (!this.isCircuitAllowed()) {
      throw new ApiError(`Circuit breaker is open for ${this.serviceName}`, 503, null, false, false);
    }
    
    // Start performance monitoring
    const metricId = performanceMonitoring.startMetric(
      `${this.serviceName}.delete.${url}`,
      MetricType.API_CALL,
      { url }
    );
    
    try {
      const response = await this.axios.delete<T>(url, config);
      performanceMonitoring.endMetric(metricId, true, { status: response.status });
      return response.data;
    } catch (error) {
      performanceMonitoring.endMetric(metricId, false, { error: error.message });
      throw error;
    }
  }

  /**
   * Clear the cache
   * @param keyPattern - Optional regex pattern to clear specific cache entries
   */
  public async clearCache(keyPattern?: RegExp): Promise<void> {
    if (!keyPattern) {
      await cachingService.clear(new RegExp(`^${this.serviceName}:`));
      return;
    }

    // Clear specific cache entries
    await cachingService.clear(keyPattern);
  }

  /**
   * Prefetch data that is likely to be needed soon
   * @param urls - Array of URLs to prefetch
   * @param params - Parameters for each URL
   * @param cacheOptions - Cache options
   */
  protected async prefetchData(
    urls: string[],
    params?: Record<string, any>[],
    cacheOptions?: CacheOptions
  ): Promise<void> {
    // Skip if caching is disabled
    if (!DATA_SOURCE_CONFIG.enableApiCache) {
      return;
    }
    
    // Prefetch each URL
    const promises = urls.map((url, index) => {
      const config = params && params[index] ? { params: params[index] } : undefined;
      
      // Use a lower priority for prefetch requests
      const prefetchConfig = {
        ...config,
        headers: {
          ...config?.headers,
          'X-Priority': 'low'
        }
      };
      
      // Make the request with a catch to prevent failures from affecting the app
      return this.get(url, prefetchConfig, cacheOptions).catch(error => {
        console.warn(`Failed to prefetch ${url}:`, error);
      });
    });
    
    // Wait for all prefetch requests to complete
    await Promise.all(promises);
  }

  /**
   * Batch multiple requests into a single request
   * @param requests - Array of request configurations
   * @returns Promise with array of responses
   */
  protected async batchRequests<T>(
    requests: Array<{
      url: string;
      method?: 'get' | 'post' | 'put' | 'delete';
      data?: any;
      config?: AxiosRequestConfig;
      cacheOptions?: CacheOptions;
    }>
  ): Promise<T[]> {
    // Check if batching is supported by the API
    if (!this.supportsBatching()) {
      // Fall back to individual requests
      const promises = requests.map(request => {
        switch (request.method || 'get') {
          case 'post':
            return this.post<T>(request.url, request.data, request.config);
          case 'put':
            return this.put<T>(request.url, request.data, request.config);
          case 'delete':
            return this.delete<T>(request.url, request.config);
          default:
            return this.get<T>(request.url, request.config, request.cacheOptions);
        }
      });
      
      return Promise.all(promises);
    }
    
    // Implement batching logic specific to the API
    // This is a placeholder - actual implementation depends on the API
    throw new Error('Batching not implemented for this API');
  }

  /**
   * Check if the API supports batching
   * @returns True if batching is supported
   */
  protected supportsBatching(): boolean {
    // Override in subclasses if batching is supported
    return false;
  }
}