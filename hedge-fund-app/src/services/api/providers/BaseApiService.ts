import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { store } from '../../../store';
import { addNotification } from '../../../store/slices/uiSlice';

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN',     // Circuit is open, requests will fail fast
  HALF_OPEN = 'HALF_OPEN' // Testing if service is back online
}

/**
 * Base API Service with circuit breaker pattern
 */
export abstract class BaseApiService {
  protected axiosInstance: AxiosInstance;
  protected baseUrl: string;
  protected apiKey: string;
  protected apiSecret?: string;
  protected circuitState: CircuitState = CircuitState.CLOSED;
  protected failureCount: number = 0;
  protected lastFailureTime: number = 0;
  protected resetTimeout: number = 60000; // 1 minute
  protected failureThreshold: number = 5;
  protected requestTimeout: number = 30000; // 30 seconds
  protected retryCount: number = 3;
  protected retryDelay: number = 1000; // 1 second

  constructor(baseUrl: string, apiKey: string, apiSecret?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: this.requestTimeout,
      headers: this.getDefaultHeaders(),
    });

    this.setupInterceptors();
  }

  /**
   * Get default headers for API requests
   */
  protected abstract getDefaultHeaders(): Record<string, string>;

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config: AxiosRequestConfig) => {
        // Check if circuit is open
        if (this.circuitState === CircuitState.OPEN) {
          const now = Date.now();
          if (now - this.lastFailureTime > this.resetTimeout) {
            // Try to close circuit
            this.circuitState = CircuitState.HALF_OPEN;
            console.log(`Circuit breaker transitioning to HALF_OPEN state for ${this.baseUrl}`);
          } else {
            // Circuit is open, fail fast
            return Promise.reject(new Error(`Circuit breaker is OPEN for ${this.baseUrl}`));
          }
        }
        
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Reset failure count on successful response if in HALF_OPEN state
        if (this.circuitState === CircuitState.HALF_OPEN) {
          this.closeCircuit();
        }
        
        return response;
      },
      (error: AxiosError) => {
        this.handleRequestError(error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Handle request errors and update circuit breaker state
   */
  private handleRequestError(error: AxiosError): void {
    // Don't count user errors (4xx) except for 429 (rate limit)
    const status = error.response?.status;
    
    if (status && status >= 400 && status < 500 && status !== 429) {
      // User error, don't count towards circuit breaker
      return;
    }
    
    // Count failure
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    // Check if threshold is reached
    if (this.circuitState === CircuitState.CLOSED && this.failureCount >= this.failureThreshold) {
      this.openCircuit();
    } else if (this.circuitState === CircuitState.HALF_OPEN) {
      this.openCircuit();
    }
  }

  /**
   * Open the circuit
   */
  private openCircuit(): void {
    this.circuitState = CircuitState.OPEN;
    console.log(`Circuit breaker OPENED for ${this.baseUrl}`);
    
    store.dispatch(addNotification({
      type: 'error',
      title: 'API Service Unavailable',
      message: `Service at ${this.baseUrl} is currently unavailable. Requests will be blocked temporarily.`,
      autoHideDuration: 10000,
    }));
  }

  /**
   * Close the circuit
   */
  private closeCircuit(): void {
    this.circuitState = CircuitState.CLOSED;
    this.failureCount = 0;
    console.log(`Circuit breaker CLOSED for ${this.baseUrl}`);
    
    store.dispatch(addNotification({
      type: 'success',
      title: 'API Service Restored',
      message: `Service at ${this.baseUrl} is now available again.`,
      autoHideDuration: 5000,
    }));
  }

  /**
   * Make a GET request with retry logic
   */
  protected async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.executeWithRetry(() => this.axiosInstance.get<T>(url, config));
  }

  /**
   * Make a POST request with retry logic
   */
  protected async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.executeWithRetry(() => this.axiosInstance.post<T>(url, data, config));
  }

  /**
   * Make a PUT request with retry logic
   */
  protected async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.executeWithRetry(() => this.axiosInstance.put<T>(url, data, config));
  }

  /**
   * Make a DELETE request with retry logic
   */
  protected async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.executeWithRetry(() => this.axiosInstance.delete<T>(url, config));
  }

  /**
   * Execute a request with retry logic
   */
  private async executeWithRetry<T>(requestFn: () => Promise<AxiosResponse<T>>): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.retryCount; attempt++) {
      try {
        // If not the first attempt, wait before retrying
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
        
        const response = await requestFn();
        return response.data;
      } catch (error: any) {
        lastError = error;
        
        // Don't retry if circuit is open
        if (this.circuitState === CircuitState.OPEN) {
          break;
        }
        
        // Don't retry on certain error types
        if (error.response) {
          const status = error.response.status;
          
          // Don't retry on client errors except rate limiting
          if (status >= 400 && status < 500 && status !== 429) {
            break;
          }
        }
        
        console.log(`Request failed, attempt ${attempt + 1}/${this.retryCount + 1}`);
      }
    }
    
    throw lastError || new Error('Request failed after retries');
  }
}