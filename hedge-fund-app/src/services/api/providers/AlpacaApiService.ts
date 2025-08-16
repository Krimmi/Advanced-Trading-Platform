import { BaseApiService } from './BaseApiService';
import { addNotification } from '../../../store/slices/uiSlice';
import { store } from '../../../store';

/**
 * Alpaca API environments
 */
export enum AlpacaEnvironment {
  PAPER = 'paper',
  LIVE = 'live'
}

/**
 * Alpaca API endpoints
 */
export enum AlpacaEndpoint {
  DATA_API = 'data',
  TRADING_API = 'trading'
}

/**
 * Alpaca order types
 */
export enum AlpacaOrderType {
  MARKET = 'market',
  LIMIT = 'limit',
  STOP = 'stop',
  STOP_LIMIT = 'stop_limit'
}

/**
 * Alpaca order sides
 */
export enum AlpacaOrderSide {
  BUY = 'buy',
  SELL = 'sell'
}

/**
 * Alpaca time in force options
 */
export enum AlpacaTimeInForce {
  DAY = 'day',
  GTC = 'gtc',
  IOC = 'ioc',
  FOK = 'fok'
}

/**
 * Alpaca order status
 */
export enum AlpacaOrderStatus {
  NEW = 'new',
  PARTIALLY_FILLED = 'partially_filled',
  FILLED = 'filled',
  DONE_FOR_DAY = 'done_for_day',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
  REPLACED = 'replaced',
  PENDING_CANCEL = 'pending_cancel',
  PENDING_REPLACE = 'pending_replace',
  ACCEPTED = 'accepted',
  PENDING_NEW = 'pending_new',
  ACCEPTED_FOR_BIDDING = 'accepted_for_bidding',
  STOPPED = 'stopped',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
  CALCULATED = 'calculated'
}

/**
 * Alpaca bar timeframe
 */
export enum AlpacaBarTimeframe {
  ONE_MIN = '1Min',
  FIVE_MIN = '5Min',
  FIFTEEN_MIN = '15Min',
  THIRTY_MIN = '30Min',
  ONE_HOUR = '1Hour',
  ONE_DAY = '1Day'
}

/**
 * Alpaca API service for interacting with Alpaca APIs
 */
export class AlpacaApiService extends BaseApiService {
  private environment: AlpacaEnvironment;
  private endpoint: AlpacaEndpoint;
  private rateLimitRemaining: number = 200;
  private rateLimitReset: number = 0;
  private websocket: WebSocket | null = null;
  private websocketReconnectAttempts: number = 0;
  private maxWebsocketReconnectAttempts: number = 5;
  private websocketMessageHandlers: Map<string, ((data: any) => void)[]> = new Map();

  /**
   * Create a new Alpaca API service
   * @param apiKey Alpaca API key
   * @param apiSecret Alpaca API secret
   * @param environment Alpaca environment (paper or live)
   * @param endpoint Alpaca endpoint (data or trading)
   */
  constructor(
    apiKey: string,
    apiSecret: string,
    environment: AlpacaEnvironment = AlpacaEnvironment.PAPER,
    endpoint: AlpacaEndpoint = AlpacaEndpoint.TRADING_API
  ) {
    const baseUrl = AlpacaApiService.getBaseUrl(environment, endpoint);
    super(baseUrl, apiKey, apiSecret);
    
    this.environment = environment;
    this.endpoint = endpoint;
    
    // Override default settings for Alpaca
    this.requestTimeout = 60000; // 60 seconds
    this.failureThreshold = 3;   // 3 failures to open circuit
    this.retryCount = 2;         // 2 retries (3 attempts total)
  }

  /**
   * Get the base URL for Alpaca API
   */
  private static getBaseUrl(environment: AlpacaEnvironment, endpoint: AlpacaEndpoint): string {
    if (endpoint === AlpacaEndpoint.DATA_API) {
      return 'https://data.alpaca.markets/v2';
    } else {
      return environment === AlpacaEnvironment.PAPER
        ? 'https://paper-api.alpaca.markets/v2'
        : 'https://api.alpaca.markets/v2';
    }
  }

  /**
   * Get default headers for Alpaca API
   */
  protected getDefaultHeaders(): Record<string, string> {
    return {
      'APCA-API-KEY-ID': this.apiKey,
      'APCA-API-SECRET-KEY': this.apiSecret!,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Connect to Alpaca WebSocket
   * @param streams Array of streams to subscribe to
   */
  public connectWebSocket(streams: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Determine WebSocket URL based on environment and endpoint
        let wsUrl: string;
        
        if (this.endpoint === AlpacaEndpoint.DATA_API) {
          wsUrl = 'wss://stream.data.alpaca.markets/v2/sip';
        } else {
          wsUrl = this.environment === AlpacaEnvironment.PAPER
            ? 'wss://paper-api.alpaca.markets/stream'
            : 'wss://api.alpaca.markets/stream';
        }
        
        // Close existing connection if any
        if (this.websocket) {
          this.websocket.close();
          this.websocket = null;
        }
        
        // Create new WebSocket connection
        this.websocket = new WebSocket(wsUrl);
        
        // Connection opened
        this.websocket.addEventListener('open', () => {
          console.log('Alpaca WebSocket connected');
          this.websocketReconnectAttempts = 0;
          
          // Authenticate
          this.sendWebSocketMessage({
            action: 'auth',
            key: this.apiKey,
            secret: this.apiSecret
          });
          
          // Subscribe to streams
          this.sendWebSocketMessage({
            action: 'subscribe',
            streams: streams
          });
          
          resolve();
        });
        
        // Connection error
        this.websocket.addEventListener('error', (error) => {
          console.error('Alpaca WebSocket error:', error);
          reject(error);
        });
        
        // Connection closed
        this.websocket.addEventListener('close', (event) => {
          console.log(`Alpaca WebSocket closed: ${event.code} - ${event.reason}`);
          
          // Attempt to reconnect
          if (this.websocketReconnectAttempts < this.maxWebsocketReconnectAttempts) {
            this.websocketReconnectAttempts++;
            
            const delay = Math.min(1000 * Math.pow(2, this.websocketReconnectAttempts), 30000);
            console.log(`Attempting to reconnect in ${delay / 1000}s (attempt ${this.websocketReconnectAttempts}/${this.maxWebsocketReconnectAttempts})`);
            
            setTimeout(() => {
              this.connectWebSocket(streams).catch(console.error);
            }, delay);
          } else {
            console.error('Max WebSocket reconnect attempts reached');
            
            store.dispatch(addNotification({
              type: 'error',
              title: 'Connection Error',
              message: 'Failed to maintain connection to Alpaca real-time data. Please refresh the page.',
              autoHideDuration: 0, // Don't auto-hide this critical error
            }));
          }
        });
        
        // Listen for messages
        this.websocket.addEventListener('message', (event) => {
          try {
            const message = JSON.parse(event.data);
            
            // Handle authentication response
            if (message.stream === 'authorization') {
              if (message.data.status === 'authorized') {
                console.log('Alpaca WebSocket authenticated successfully');
              } else {
                console.error('Alpaca WebSocket authentication failed:', message.data);
                reject(new Error('Authentication failed'));
              }
              return;
            }
            
            // Handle stream messages
            if (message.stream) {
              const handlers = this.websocketMessageHandlers.get(message.stream);
              if (handlers) {
                handlers.forEach(handler => handler(message.data));
              }
              
              // Also call handlers for wildcard subscriptions
              const wildcardHandlers = this.websocketMessageHandlers.get('*');
              if (wildcardHandlers) {
                wildcardHandlers.forEach(handler => handler(message));
              }
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        });
      } catch (error) {
        console.error('Error connecting to Alpaca WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Send a message to the WebSocket
   */
  private sendWebSocketMessage(message: any): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket not connected');
    }
  }

  /**
   * Register a WebSocket message handler
   * @param stream Stream name or '*' for all streams
   * @param handler Handler function
   * @returns Function to unregister the handler
   */
  public onWebSocketMessage(stream: string, handler: (data: any) => void): () => void {
    if (!this.websocketMessageHandlers.has(stream)) {
      this.websocketMessageHandlers.set(stream, []);
    }
    
    this.websocketMessageHandlers.get(stream)!.push(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.websocketMessageHandlers.get(stream);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Disconnect from WebSocket
   */
  public disconnectWebSocket(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  /**
   * Get account information
   */
  public async getAccount(): Promise<any> {
    try {
      return await this.get('/account');
    } catch (error: any) {
      this.handleAlpacaError(error, 'Failed to get account information');
      throw error;
    }
  }

  /**
   * Get positions
   */
  public async getPositions(): Promise<any[]> {
    try {
      return await this.get('/positions');
    } catch (error: any) {
      this.handleAlpacaError(error, 'Failed to get positions');
      throw error;
    }
  }

  /**
   * Get position for a specific symbol
   */
  public async getPosition(symbol: string): Promise<any> {
    try {
      return await this.get(`/positions/${symbol}`);
    } catch (error: any) {
      // 404 means no position, which is a valid state
      if (error.response && error.response.status === 404) {
        return null;
      }
      
      this.handleAlpacaError(error, `Failed to get position for ${symbol}`);
      throw error;
    }
  }

  /**
   * Get orders
   * @param status Filter by status
   * @param limit Maximum number of orders to return
   * @param after Only return orders after this order ID
   * @param until Only return orders until this timestamp
   * @param direction Order direction (asc or desc)
   */
  public async getOrders(
    status?: string,
    limit?: number,
    after?: string,
    until?: string,
    direction?: string
  ): Promise<any[]> {
    try {
      const params: Record<string, any> = {};
      
      if (status) params.status = status;
      if (limit) params.limit = limit;
      if (after) params.after = after;
      if (until) params.until = until;
      if (direction) params.direction = direction;
      
      return await this.get('/orders', { params });
    } catch (error: any) {
      this.handleAlpacaError(error, 'Failed to get orders');
      throw error;
    }
  }

  /**
   * Get a specific order
   * @param orderId Order ID
   */
  public async getOrder(orderId: string): Promise<any> {
    try {
      return await this.get(`/orders/${orderId}`);
    } catch (error: any) {
      this.handleAlpacaError(error, `Failed to get order ${orderId}`);
      throw error;
    }
  }

  /**
   * Place an order
   * @param symbol Symbol to trade
   * @param qty Quantity to trade
   * @param side Buy or sell
   * @param type Order type
   * @param timeInForce Time in force
   * @param limitPrice Limit price (required for limit and stop_limit orders)
   * @param stopPrice Stop price (required for stop and stop_limit orders)
   * @param clientOrderId Client order ID
   * @param extendedHours Whether to allow trading during extended hours
   */
  public async placeOrder(
    symbol: string,
    qty: number,
    side: AlpacaOrderSide,
    type: AlpacaOrderType,
    timeInForce: AlpacaTimeInForce,
    limitPrice?: number,
    stopPrice?: number,
    clientOrderId?: string,
    extendedHours?: boolean
  ): Promise<any> {
    try {
      const order: Record<string, any> = {
        symbol,
        qty: qty.toString(),
        side,
        type,
        time_in_force: timeInForce
      };
      
      if (limitPrice && (type === AlpacaOrderType.LIMIT || type === AlpacaOrderType.STOP_LIMIT)) {
        order.limit_price = limitPrice.toString();
      }
      
      if (stopPrice && (type === AlpacaOrderType.STOP || type === AlpacaOrderType.STOP_LIMIT)) {
        order.stop_price = stopPrice.toString();
      }
      
      if (clientOrderId) {
        order.client_order_id = clientOrderId;
      }
      
      if (extendedHours !== undefined) {
        order.extended_hours = extendedHours;
      }
      
      return await this.post('/orders', order);
    } catch (error: any) {
      this.handleAlpacaError(error, `Failed to place order for ${symbol}`);
      throw error;
    }
  }

  /**
   * Cancel an order
   * @param orderId Order ID
   */
  public async cancelOrder(orderId: string): Promise<void> {
    try {
      await this.delete(`/orders/${orderId}`);
    } catch (error: any) {
      // 404 means order doesn't exist or was already cancelled
      if (error.response && error.response.status === 404) {
        console.warn(`Order ${orderId} not found or already cancelled`);
        return;
      }
      
      this.handleAlpacaError(error, `Failed to cancel order ${orderId}`);
      throw error;
    }
  }

  /**
   * Get bars (OHLCV) data
   * @param symbols Array of symbols
   * @param timeframe Bar timeframe
   * @param start Start date (ISO format)
   * @param end End date (ISO format)
   * @param limit Maximum number of bars to return
   */
  public async getBars(
    symbols: string[],
    timeframe: AlpacaBarTimeframe,
    start: string,
    end: string,
    limit?: number
  ): Promise<Record<string, any[]>> {
    try {
      // This endpoint is only available in the Data API
      if (this.endpoint !== AlpacaEndpoint.DATA_API) {
        throw new Error('getBars is only available in the Data API');
      }
      
      const params: Record<string, any> = {
        symbols: symbols.join(','),
        timeframe,
        start,
        end
      };
      
      if (limit) {
        params.limit = limit;
      }
      
      const response = await this.get('/bars', { params });
      return response.bars || {};
    } catch (error: any) {
      this.handleAlpacaError(error, 'Failed to get bars data');
      throw error;
    }
  }

  /**
   * Get latest quotes
   * @param symbols Array of symbols
   */
  public async getQuotes(symbols: string[]): Promise<Record<string, any>> {
    try {
      // This endpoint is only available in the Data API
      if (this.endpoint !== AlpacaEndpoint.DATA_API) {
        throw new Error('getQuotes is only available in the Data API');
      }
      
      const params: Record<string, any> = {
        symbols: symbols.join(',')
      };
      
      const response = await this.get('/quotes/latest', { params });
      return response.quotes || {};
    } catch (error: any) {
      this.handleAlpacaError(error, 'Failed to get quotes');
      throw error;
    }
  }

  /**
   * Get latest trades
   * @param symbols Array of symbols
   */
  public async getTrades(symbols: string[]): Promise<Record<string, any>> {
    try {
      // This endpoint is only available in the Data API
      if (this.endpoint !== AlpacaEndpoint.DATA_API) {
        throw new Error('getTrades is only available in the Data API');
      }
      
      const params: Record<string, any> = {
        symbols: symbols.join(',')
      };
      
      const response = await this.get('/trades/latest', { params });
      return response.trades || {};
    } catch (error: any) {
      this.handleAlpacaError(error, 'Failed to get trades');
      throw error;
    }
  }

  /**
   * Get market clock
   */
  public async getClock(): Promise<any> {
    try {
      return await this.get('/clock');
    } catch (error: any) {
      this.handleAlpacaError(error, 'Failed to get market clock');
      throw error;
    }
  }

  /**
   * Get market calendar
   * @param start Start date (YYYY-MM-DD)
   * @param end End date (YYYY-MM-DD)
   */
  public async getCalendar(start?: string, end?: string): Promise<any[]> {
    try {
      const params: Record<string, any> = {};
      
      if (start) params.start = start;
      if (end) params.end = end;
      
      return await this.get('/calendar', { params });
    } catch (error: any) {
      this.handleAlpacaError(error, 'Failed to get market calendar');
      throw error;
    }
  }

  /**
   * Get assets
   * @param status Asset status (active, inactive)
   * @param assetClass Asset class (us_equity, crypto)
   */
  public async getAssets(status?: string, assetClass?: string): Promise<any[]> {
    try {
      const params: Record<string, any> = {};
      
      if (status) params.status = status;
      if (assetClass) params.asset_class = assetClass;
      
      return await this.get('/assets', { params });
    } catch (error: any) {
      this.handleAlpacaError(error, 'Failed to get assets');
      throw error;
    }
  }

  /**
   * Get a specific asset
   * @param symbol Asset symbol
   */
  public async getAsset(symbol: string): Promise<any> {
    try {
      return await this.get(`/assets/${symbol}`);
    } catch (error: any) {
      this.handleAlpacaError(error, `Failed to get asset ${symbol}`);
      throw error;
    }
  }

  /**
   * Handle Alpaca API errors
   */
  private handleAlpacaError(error: any, defaultMessage: string): void {
    // Check for rate limiting headers
    if (error.response && error.response.headers) {
      const remaining = error.response.headers['x-ratelimit-remaining'];
      const reset = error.response.headers['x-ratelimit-reset'];
      
      if (remaining !== undefined) {
        this.rateLimitRemaining = parseInt(remaining, 10);
      }
      
      if (reset !== undefined) {
        this.rateLimitReset = parseInt(reset, 10);
      }
    }
    
    // Handle specific error cases
    if (error.response) {
      const { status, data } = error.response;
      
      // Rate limiting
      if (status === 429) {
        const resetDate = new Date(this.rateLimitReset * 1000);
        const resetTime = resetDate.toLocaleTimeString();
        
        store.dispatch(addNotification({
          type: 'warning',
          title: 'Rate Limit Exceeded',
          message: `Alpaca API rate limit exceeded. Limit will reset at ${resetTime}.`,
          autoHideDuration: 10000,
        }));
        
        console.warn(`Alpaca API rate limit exceeded. Remaining: ${this.rateLimitRemaining}, Reset: ${resetTime}`);
      }
      // Authentication error
      else if (status === 401 || status === 403) {
        store.dispatch(addNotification({
          type: 'error',
          title: 'Authentication Error',
          message: 'Invalid Alpaca API credentials. Please check your API key and secret.',
          autoHideDuration: 0, // Don't auto-hide this critical error
        }));
        
        console.error('Alpaca API authentication error:', data);
      }
      // Bad request
      else if (status === 400) {
        const errorMessage = data.message || defaultMessage;
        
        store.dispatch(addNotification({
          type: 'error',
          title: 'Invalid Request',
          message: errorMessage,
          autoHideDuration: 7000,
        }));
        
        console.error('Alpaca API bad request:', data);
      }
      // Not found
      else if (status === 404) {
        console.warn('Alpaca API resource not found:', error.config?.url);
      }
      // Server error
      else if (status >= 500) {
        store.dispatch(addNotification({
          type: 'error',
          title: 'Alpaca API Error',
          message: 'Alpaca API server error. Please try again later.',
          autoHideDuration: 10000,
        }));
        
        console.error('Alpaca API server error:', data);
      }
    }
    // Network error
    else if (error.request) {
      store.dispatch(addNotification({
        type: 'error',
        title: 'Connection Error',
        message: 'Unable to connect to Alpaca API. Please check your internet connection.',
        autoHideDuration: 10000,
      }));
      
      console.error('Alpaca API network error:', error);
    }
    // Other errors
    else {
      console.error('Alpaca API error:', error);
    }
  }
}

// Create singleton instances for different API endpoints
const alpacaTradingApi = new AlpacaApiService(
  process.env.REACT_APP_ALPACA_API_KEY || '',
  process.env.REACT_APP_ALPACA_API_SECRET || '',
  process.env.REACT_APP_ALPACA_ENVIRONMENT === 'live' ? AlpacaEnvironment.LIVE : AlpacaEnvironment.PAPER,
  AlpacaEndpoint.TRADING_API
);

const alpacaDataApi = new AlpacaApiService(
  process.env.REACT_APP_ALPACA_API_KEY || '',
  process.env.REACT_APP_ALPACA_API_SECRET || '',
  process.env.REACT_APP_ALPACA_ENVIRONMENT === 'live' ? AlpacaEnvironment.LIVE : AlpacaEnvironment.PAPER,
  AlpacaEndpoint.DATA_API
);

export { alpacaTradingApi, alpacaDataApi };