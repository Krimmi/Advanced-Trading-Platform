import { BaseApiService } from './BaseApiService';
import { addNotification } from '../../../store/slices/uiSlice';
import { store } from '../../../store';

/**
 * Polygon API service for interacting with Polygon.io APIs
 */
export class PolygonApiService extends BaseApiService {
  private websocket: WebSocket | null = null;
  private websocketReconnectAttempts: number = 0;
  private maxWebsocketReconnectAttempts: number = 5;
  private websocketMessageHandlers: Map<string, ((data: any) => void)[]> = new Map();
  private subscriptions: Set<string> = new Set();

  /**
   * Create a new Polygon API service
   * @param apiKey Polygon API key
   */
  constructor(apiKey: string) {
    super('https://api.polygon.io', apiKey, undefined);
    
    // Override default settings for Polygon
    this.requestTimeout = 30000; // 30 seconds
    this.failureThreshold = 5;   // 5 failures to open circuit
    this.retryCount = 2;         // 2 retries (3 attempts total)
  }

  /**
   * Get default headers for Polygon API
   */
  protected getDefaultHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };
  }

  /**
   * Make a GET request with the API key
   */
  protected async get<T = any>(url: string, config?: any): Promise<T> {
    // Append the API key to the URL if not using Authorization header
    if (!url.includes('apiKey=')) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}apiKey=${this.apiKey}`;
    }
    
    try {
      return await super.get<T>(url, config);
    } catch (error: any) {
      this.handlePolygonError(error, `Failed to get ${url}`);
      throw error;
    }
  }

  /**
   * Connect to Polygon WebSocket
   * @param cluster WebSocket cluster (stocks, forex, crypto)
   */
  public connectWebSocket(cluster: 'stocks' | 'forex' | 'crypto'): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Close existing connection if any
        if (this.websocket) {
          this.websocket.close();
          this.websocket = null;
        }
        
        // Create new WebSocket connection
        const wsUrl = `wss://socket.polygon.io/${cluster}`;
        this.websocket = new WebSocket(wsUrl);
        
        // Connection opened
        this.websocket.addEventListener('open', () => {
          console.log('Polygon WebSocket connected');
          this.websocketReconnectAttempts = 0;
          
          // Authenticate
          this.sendWebSocketMessage({
            action: 'auth',
            params: this.apiKey
          });
          
          // Resubscribe to channels
          this.resubscribe();
          
          resolve();
        });
        
        // Connection error
        this.websocket.addEventListener('error', (error) => {
          console.error('Polygon WebSocket error:', error);
          reject(error);
        });
        
        // Connection closed
        this.websocket.addEventListener('close', (event) => {
          console.log(`Polygon WebSocket closed: ${event.code} - ${event.reason}`);
          
          // Attempt to reconnect
          if (this.websocketReconnectAttempts < this.maxWebsocketReconnectAttempts) {
            this.websocketReconnectAttempts++;
            
            const delay = Math.min(1000 * Math.pow(2, this.websocketReconnectAttempts), 30000);
            console.log(`Attempting to reconnect in ${delay / 1000}s (attempt ${this.websocketReconnectAttempts}/${this.maxWebsocketReconnectAttempts})`);
            
            setTimeout(() => {
              this.connectWebSocket(cluster).catch(console.error);
            }, delay);
          } else {
            console.error('Max WebSocket reconnect attempts reached');
            
            store.dispatch(addNotification({
              type: 'error',
              title: 'Connection Error',
              message: 'Failed to maintain connection to Polygon real-time data. Please refresh the page.',
              autoHideDuration: 0, // Don't auto-hide this critical error
            }));
          }
        });
        
        // Listen for messages
        this.websocket.addEventListener('message', (event) => {
          try {
            const messages = JSON.parse(event.data);
            
            // Handle messages
            for (const message of messages) {
              // Handle authentication response
              if (message.ev === 'status') {
                if (message.status === 'auth_success') {
                  console.log('Polygon WebSocket authenticated successfully');
                } else if (message.status === 'auth_failed') {
                  console.error('Polygon WebSocket authentication failed:', message);
                  reject(new Error('Authentication failed'));
                }
                continue;
              }
              
              // Handle data messages
              const eventType = message.ev;
              if (eventType) {
                const handlers = this.websocketMessageHandlers.get(eventType);
                if (handlers) {
                  handlers.forEach(handler => handler(message));
                }
                
                // Also call handlers for wildcard subscriptions
                const wildcardHandlers = this.websocketMessageHandlers.get('*');
                if (wildcardHandlers) {
                  wildcardHandlers.forEach(handler => handler(message));
                }
              }
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        });
      } catch (error) {
        console.error('Error connecting to Polygon WebSocket:', error);
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
   * Subscribe to a WebSocket channel
   * @param channel Channel to subscribe to
   */
  public subscribe(channel: string): void {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, adding to pending subscriptions');
      this.subscriptions.add(channel);
      return;
    }
    
    this.sendWebSocketMessage({
      action: 'subscribe',
      params: channel
    });
    
    this.subscriptions.add(channel);
  }

  /**
   * Unsubscribe from a WebSocket channel
   * @param channel Channel to unsubscribe from
   */
  public unsubscribe(channel: string): void {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected');
      this.subscriptions.delete(channel);
      return;
    }
    
    this.sendWebSocketMessage({
      action: 'unsubscribe',
      params: channel
    });
    
    this.subscriptions.delete(channel);
  }

  /**
   * Resubscribe to all channels
   */
  private resubscribe(): void {
    if (this.subscriptions.size === 0) {
      return;
    }
    
    const channels = Array.from(this.subscriptions);
    
    this.sendWebSocketMessage({
      action: 'subscribe',
      params: channels.join(',')
    });
  }

  /**
   * Register a WebSocket message handler
   * @param eventType Event type or '*' for all events
   * @param handler Handler function
   * @returns Function to unregister the handler
   */
  public onWebSocketMessage(eventType: string, handler: (data: any) => void): () => void {
    if (!this.websocketMessageHandlers.has(eventType)) {
      this.websocketMessageHandlers.set(eventType, []);
    }
    
    this.websocketMessageHandlers.get(eventType)!.push(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.websocketMessageHandlers.get(eventType);
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
   * Handle Polygon API errors
   */
  private handlePolygonError(error: any, defaultMessage: string): void {
    if (error.response) {
      const { status, data } = error.response;
      
      // Rate limiting
      if (status === 429) {
        store.dispatch(addNotification({
          type: 'warning',
          title: 'Rate Limit Exceeded',
          message: 'Polygon API rate limit exceeded. Please try again later.',
          autoHideDuration: 10000,
        }));
        
        console.warn('Polygon API rate limit exceeded');
      }
      // Authentication error
      else if (status === 401 || status === 403) {
        store.dispatch(addNotification({
          type: 'error',
          title: 'Authentication Error',
          message: 'Invalid Polygon API key. Please check your API key.',
          autoHideDuration: 0, // Don't auto-hide this critical error
        }));
        
        console.error('Polygon API authentication error:', data);
      }
      // Bad request
      else if (status === 400) {
        const errorMessage = data.error || defaultMessage;
        
        store.dispatch(addNotification({
          type: 'error',
          title: 'Invalid Request',
          message: errorMessage,
          autoHideDuration: 7000,
        }));
        
        console.error('Polygon API bad request:', data);
      }
      // Not found
      else if (status === 404) {
        console.warn('Polygon API resource not found:', error.config?.url);
      }
      // Server error
      else if (status >= 500) {
        store.dispatch(addNotification({
          type: 'error',
          title: 'Polygon API Error',
          message: 'Polygon API server error. Please try again later.',
          autoHideDuration: 10000,
        }));
        
        console.error('Polygon API server error:', data);
      }
    }
    // Network error
    else if (error.request) {
      store.dispatch(addNotification({
        type: 'error',
        title: 'Connection Error',
        message: 'Unable to connect to Polygon API. Please check your internet connection.',
        autoHideDuration: 10000,
      }));
      
      console.error('Polygon API network error:', error);
    }
    // Other errors
    else {
      console.error('Polygon API error:', error);
    }
  }

  /**
   * Get ticker details
   * @param ticker Ticker symbol
   */
  public async getTicker(ticker: string): Promise<any> {
    return this.get(`/v3/reference/tickers/${ticker}`);
  }

  /**
   * Get tickers
   * @param params Query parameters
   */
  public async getTickers(params: {
    type?: string;
    market?: string;
    exchange?: string;
    cusip?: string;
    cik?: string;
    date?: string;
    search?: string;
    active?: boolean;
    sort?: string;
    order?: string;
    limit?: number;
  } = {}): Promise<any> {
    return this.get('/v3/reference/tickers', { params });
  }

  /**
   * Get ticker types
   */
  public async getTickerTypes(): Promise<any> {
    return this.get('/v3/reference/tickers/types');
  }

  /**
   * Get ticker news
   * @param ticker Ticker symbol
   * @param params Query parameters
   */
  public async getTickerNews(ticker: string, params: {
    limit?: number;
    order?: string;
    sort?: string;
    published_utc?: string;
  } = {}): Promise<any> {
    return this.get(`/v2/reference/news?ticker=${ticker}`, { params });
  }

  /**
   * Get aggregates (bars)
   * @param ticker Ticker symbol
   * @param multiplier Time multiplier
   * @param timespan Timespan unit (minute, hour, day, week, month, quarter, year)
   * @param from From date (YYYY-MM-DD)
   * @param to To date (YYYY-MM-DD)
   * @param params Additional parameters
   */
  public async getAggregates(
    ticker: string,
    multiplier: number,
    timespan: string,
    from: string,
    to: string,
    params: {
      adjusted?: boolean;
      sort?: string;
      limit?: number;
    } = {}
  ): Promise<any> {
    return this.get(`/v2/aggs/ticker/${ticker}/range/${multiplier}/${timespan}/${from}/${to}`, { params });
  }

  /**
   * Get grouped daily bars
   * @param date Date (YYYY-MM-DD)
   * @param params Additional parameters
   */
  public async getGroupedDaily(
    date: string,
    params: {
      adjusted?: boolean;
      include_otc?: boolean;
    } = {}
  ): Promise<any> {
    return this.get(`/v2/aggs/grouped/locale/us/market/stocks/${date}`, { params });
  }

  /**
   * Get previous close
   * @param ticker Ticker symbol
   * @param params Additional parameters
   */
  public async getPreviousClose(
    ticker: string,
    params: {
      adjusted?: boolean;
    } = {}
  ): Promise<any> {
    return this.get(`/v2/aggs/ticker/${ticker}/prev`, { params });
  }

  /**
   * Get daily open/close
   * @param ticker Ticker symbol
   * @param date Date (YYYY-MM-DD)
   * @param params Additional parameters
   */
  public async getDailyOpenClose(
    ticker: string,
    date: string,
    params: {
      adjusted?: boolean;
    } = {}
  ): Promise<any> {
    return this.get(`/v1/open-close/${ticker}/${date}`, { params });
  }

  /**
   * Get last quote
   * @param ticker Ticker symbol
   */
  public async getLastQuote(ticker: string): Promise<any> {
    return this.get(`/v2/last/nbbo/${ticker}`);
  }

  /**
   * Get last trade
   * @param ticker Ticker symbol
   */
  public async getLastTrade(ticker: string): Promise<any> {
    return this.get(`/v2/last/trade/${ticker}`);
  }

  /**
   * Get snapshot
   * @param ticker Ticker symbol
   */
  public async getSnapshot(ticker: string): Promise<any> {
    return this.get(`/v2/snapshot/locale/us/markets/stocks/tickers/${ticker}`);
  }

  /**
   * Get snapshots for all tickers
   */
  public async getAllSnapshots(): Promise<any> {
    return this.get('/v2/snapshot/locale/us/markets/stocks/tickers');
  }

  /**
   * Get market status
   */
  public async getMarketStatus(): Promise<any> {
    return this.get('/v1/marketstatus/now');
  }

  /**
   * Get market holidays
   */
  public async getMarketHolidays(): Promise<any> {
    return this.get('/v1/marketstatus/upcoming');
  }

  /**
   * Get stock splits
   * @param ticker Ticker symbol
   * @param params Query parameters
   */
  public async getStockSplits(ticker: string, params: {
    limit?: number;
  } = {}): Promise<any> {
    return this.get(`/v3/reference/splits?ticker=${ticker}`, { params });
  }

  /**
   * Get stock dividends
   * @param ticker Ticker symbol
   * @param params Query parameters
   */
  public async getStockDividends(ticker: string, params: {
    limit?: number;
  } = {}): Promise<any> {
    return this.get(`/v3/reference/dividends?ticker=${ticker}`, { params });
  }

  /**
   * Get stock financials
   * @param ticker Ticker symbol
   * @param params Query parameters
   */
  public async getStockFinancials(ticker: string, params: {
    limit?: number;
    type?: string;
    sort?: string;
    timeframe?: string;
  } = {}): Promise<any> {
    return this.get(`/v2/reference/financials?ticker=${ticker}`, { params });
  }

  /**
   * Get technical indicators
   * @param ticker Ticker symbol
   * @param type Indicator type (sma, ema, macd, rsi)
   * @param params Query parameters
   */
  public async getTechnicalIndicators(
    ticker: string,
    type: string,
    params: {
      timespan?: string;
      adjusted?: boolean;
      window?: number;
      series_type?: string;
      order?: string;
      limit?: number;
      timestamp?: number;
      expand_underlying?: boolean;
    } = {}
  ): Promise<any> {
    return this.get(`/v1/indicators/${type}/${ticker}`, { params });
  }
}

// Create singleton instance
const polygonApi = new PolygonApiService(
  process.env.REACT_APP_POLYGON_API_KEY || ''
);

export { polygonApi };