import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { DATA_SOURCE_CONFIG } from '../../config/apiConfig';

/**
 * Error class for API-related errors
 */
export class ApiError extends Error {
  status?: number;
  data?: any;
  isAxiosError: boolean;

  constructor(message: string, status?: number, data?: any, isAxiosError = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.isAxiosError = isAxiosError;
  }

  static fromAxiosError(error: AxiosError): ApiError {
    const status = error.response?.status;
    const data = error.response?.data;
    return new ApiError(
      error.message || 'An error occurred during the API request',
      status,
      data,
      true
    );
  }
}

/**
 * Cache item interface
 */
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

/**
 * Cache options interface
 */
interface CacheOptions {
  ttl: number; // Time to live in milliseconds
  key?: string; // Custom cache key
}

/**
 * Base API service class that provides common functionality for all API services
 */
export abstract class BaseApiService {
  protected axios: AxiosInstance;
  protected baseUrl: string;
  protected cache: Map<string, CacheItem<any>> = new Map();

  /**
   * Constructor
   * @param baseUrl - Base URL for the API
   * @param config - Axios configuration
   */
  constructor(baseUrl: string, config?: AxiosRequestConfig) {
    this.baseUrl = baseUrl;
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
    
    // Check if we should retry the request
    if (this.shouldRetry(error)) {
      return this.retryRequest(error);
    }
    
    return Promise.reject(ApiError.fromAxiosError(error));
  }

  /**
   * Determine if a request should be retried
   * @param error - Axios error
   * @returns True if the request should be retried
   */
  protected shouldRetry(error: AxiosError): boolean {
    // Retry on network errors or 5xx status codes
    const status = error.response?.status;
    return !status || (status >= 500 && status < 600);
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
      // Exponential backoff
      const delay = Math.pow(2, retryCount) * 1000;
      
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
    // Skip cache if disabled
    if (!DATA_SOURCE_CONFIG.enableApiCache || !cacheOptions) {
      return this.axios.get<T>(url, config).then(response => response.data);
    }

    // Generate cache key
    const cacheKey = cacheOptions.key || `${url}:${JSON.stringify(config?.params || {})}`;
    
    // Check if we have a valid cached response
    const cachedItem = this.cache.get(cacheKey);
    const now = Date.now();
    
    if (cachedItem && (now - cachedItem.timestamp) < cacheOptions.ttl) {
      return cachedItem.data as T;
    }
    
    // Make the request
    const response = await this.axios.get<T>(url, config);
    
    // Cache the response
    this.cache.set(cacheKey, {
      data: response.data,
      timestamp: now
    });
    
    return response.data;
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
    const response = await this.axios.post<T>(url, data, config);
    return response.data;
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
    const response = await this.axios.put<T>(url, data, config);
    return response.data;
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
    const response = await this.axios.delete<T>(url, config);
    return response.data;
  }

  /**
   * Clear the cache
   * @param keyPattern - Optional regex pattern to clear specific cache entries
   */
  public clearCache(keyPattern?: RegExp): void {
    if (!keyPattern) {
      this.cache.clear();
      return;
    }

    // Clear specific cache entries
    for (const key of this.cache.keys()) {
      if (keyPattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}