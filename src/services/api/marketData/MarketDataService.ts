import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { isApiKeyConfigured, useRealData } from '../../../config/apiConfig';

/**
 * Base class for market data API services
 * Provides common functionality for making API requests and handling responses
 */
export abstract class MarketDataService {
  protected client: AxiosInstance;
  protected apiName: string;
  protected baseUrl: string;
  protected apiKey: string | null;
  protected useCache: boolean;
  protected cacheTTL: number;

  constructor(apiName: string, baseUrl: string, useCache = true, cacheTTL = 60000) {
    this.apiName = apiName;
    this.baseUrl = baseUrl;
    this.useCache = useCache;
    this.cacheTTL = cacheTTL;
    this.apiKey = null;

    // Create axios instance with base configuration
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor
    this.client.interceptors.request.use(
      this.requestInterceptor.bind(this),
      this.requestErrorInterceptor.bind(this)
    );

    // Add response interceptor
    this.client.interceptors.response.use(
      this.responseInterceptor.bind(this),
      this.responseErrorInterceptor.bind(this)
    );
  }

  /**
   * Check if the API is configured and available
   * @returns True if the API is available, false otherwise
   */
  public isAvailable(): boolean {
    return useRealData(this.apiName as any);
  }

  /**
   * Make an API request
   * @param config Request configuration
   * @returns Promise with the response data
   */
  protected async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      // Check if API is available
      if (!this.isAvailable()) {
        throw new Error(`${this.apiName} API is not configured or forced to use mock data`);
      }

      // Check cache if enabled
      if (this.useCache) {
        const cachedData = this.getCachedData<T>(config);
        if (cachedData) {
          return cachedData;
        }
      }

      // Make the request
      const response = await this.client.request<T>(config);

      // Cache the response if enabled
      if (this.useCache) {
        this.cacheData(config, response.data);
      }

      return response.data;
    } catch (error) {
      console.error(`${this.apiName} API request failed:`, error);
      throw error;
    }
  }

  /**
   * Request interceptor to add API key and other headers
   * @param config Request configuration
   * @returns Modified request configuration
   */
  protected requestInterceptor(config: AxiosRequestConfig): AxiosRequestConfig {
    // Add API key to request if available
    if (this.apiKey) {
      // Implementation depends on the specific API
      // This will be overridden by subclasses
    }

    // Add request timestamp for debugging
    config.headers = {
      ...config.headers,
      'X-Request-Time': new Date().toISOString(),
    };

    return config;
  }

  /**
   * Request error interceptor
   * @param error Request error
   * @returns Rejected promise with error
   */
  protected requestErrorInterceptor(error: any): Promise<never> {
    console.error(`${this.apiName} request error:`, error);
    return Promise.reject(error);
  }

  /**
   * Response interceptor to handle successful responses
   * @param response API response
   * @returns Modified response
   */
  protected responseInterceptor(response: AxiosResponse): AxiosResponse {
    // Add response processing logic here if needed
    return response;
  }

  /**
   * Response error interceptor to handle API errors
   * @param error Response error
   * @returns Rejected promise with error
   */
  protected responseErrorInterceptor(error: any): Promise<never> {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`${this.apiName} API error:`, {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error(`${this.apiName} API no response:`, error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error(`${this.apiName} API request setup error:`, error.message);
    }

    return Promise.reject(error);
  }

  /**
   * Generate a cache key for a request
   * @param config Request configuration
   * @returns Cache key
   */
  protected generateCacheKey(config: AxiosRequestConfig): string {
    const { url, method, params, data } = config;
    return JSON.stringify({
      url,
      method,
      params,
      data,
    });
  }

  /**
   * Get cached data for a request
   * @param config Request configuration
   * @returns Cached data or null if not found
   */
  protected getCachedData<T>(config: AxiosRequestConfig): T | null {
    if (!this.useCache) return null;

    const cacheKey = this.generateCacheKey(config);
    const cachedItem = localStorage.getItem(`${this.apiName}_${cacheKey}`);

    if (!cachedItem) return null;

    try {
      const { data, timestamp } = JSON.parse(cachedItem);
      const now = Date.now();

      // Check if cache is still valid
      if (now - timestamp <= this.cacheTTL) {
        return data as T;
      }

      // Cache expired, remove it
      localStorage.removeItem(`${this.apiName}_${cacheKey}`);
      return null;
    } catch (error) {
      console.error(`Error parsing cached data for ${this.apiName}:`, error);
      return null;
    }
  }

  /**
   * Cache data for a request
   * @param config Request configuration
   * @param data Response data
   */
  protected cacheData<T>(config: AxiosRequestConfig, data: T): void {
    if (!this.useCache) return;

    const cacheKey = this.generateCacheKey(config);
    const cacheItem = JSON.stringify({
      data,
      timestamp: Date.now(),
    });

    try {
      localStorage.setItem(`${this.apiName}_${cacheKey}`, cacheItem);
    } catch (error) {
      console.error(`Error caching data for ${this.apiName}:`, error);
    }
  }

  /**
   * Clear all cached data for this API
   */
  public clearCache(): void {
    if (!this.useCache) return;

    const prefix = `${this.apiName}_`;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    }
  }
}