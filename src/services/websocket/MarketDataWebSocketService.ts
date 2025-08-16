import { WebSocketService, WebSocketConfig, ConnectionState, Subscription } from './WebSocketService';

/**
 * Market data types that can be subscribed to
 */
export enum MarketDataType {
  QUOTES = 'quotes',
  TRADES = 'trades',
  BARS = 'bars',
  LEVEL2 = 'level2',
  NEWS = 'news',
  SENTIMENT = 'sentiment'
}

/**
 * Market data message interface
 */
export interface MarketDataMessage {
  type: string;
  symbol: string;
  data: any;
  timestamp: number;
}

/**
 * Configuration for MarketDataWebSocketService
 */
export interface MarketDataWebSocketConfig extends WebSocketConfig {
  apiKey?: string;
  authToken?: string;
  provider: string;
}

/**
 * MarketDataWebSocketService specializes in handling real-time market data streams
 * from various providers with standardized interfaces.
 */
export class MarketDataWebSocketService extends WebSocketService {
  private provider: string;
  private apiKey?: string;
  private authToken?: string;
  private authenticated: boolean = false;
  private dataListeners: Map<string, Set<(data: any) => void>> = new Map();
  private throttleConfig: Map<MarketDataType, number> = new Map();
  private lastMessageTime: Map<string, number> = new Map();

  /**
   * Creates a new MarketDataWebSocketService
   * @param config Configuration options
   */
  constructor(config: MarketDataWebSocketConfig) {
    super(config);
    this.provider = config.provider;
    this.apiKey = config.apiKey;
    this.authToken = config.authToken;

    // Set default throttle rates (messages per second)
    this.throttleConfig.set(MarketDataType.QUOTES, 5);  // 5 updates per second
    this.throttleConfig.set(MarketDataType.TRADES, 10); // 10 updates per second
    this.throttleConfig.set(MarketDataType.BARS, 1);    // 1 update per second
    this.throttleConfig.set(MarketDataType.LEVEL2, 2);  // 2 updates per second
    this.throttleConfig.set(MarketDataType.NEWS, 0.2);  // 1 update per 5 seconds
    this.throttleConfig.set(MarketDataType.SENTIMENT, 0.1); // 1 update per 10 seconds

    // Set up event listeners
    this.on('open', this.handleAuthentication.bind(this));
    this.on('message', this.processMarketData.bind(this));
  }

  /**
   * Subscribes to market data for specific symbols
   * @param dataType Type of market data to subscribe to
   * @param symbols Array of symbols to subscribe to
   * @param listener Callback function for data updates
   * @returns Subscription ID
   */
  public subscribeMarketData(
    dataType: MarketDataType, 
    symbols: string[], 
    listener: (data: any) => void
  ): string {
    const subscriptionId = this.subscribe(dataType, symbols);
    
    // Register the listener for this data type
    const key = this.getListenerKey(dataType, symbols);
    if (!this.dataListeners.has(key)) {
      this.dataListeners.set(key, new Set());
    }
    
    this.dataListeners.get(key)?.add(listener);
    
    return subscriptionId;
  }

  /**
   * Unsubscribes from market data
   * @param subscriptionId Subscription ID to unsubscribe
   * @param listener Optional listener to remove (if not provided, all listeners are removed)
   * @returns True if unsubscribed successfully
   */
  public unsubscribeMarketData(subscriptionId: string, listener?: (data: any) => void): boolean {
    const subscription = this.getSubscriptions().find(sub => sub.id === subscriptionId);
    
    if (!subscription) {
      return false;
    }
    
    const key = this.getListenerKey(subscription.channel as MarketDataType, subscription.symbols);
    
    if (listener) {
      // Remove specific listener
      this.dataListeners.get(key)?.delete(listener);
    } else {
      // Remove all listeners
      this.dataListeners.delete(key);
    }
    
    return this.unsubscribe(subscriptionId);
  }

  /**
   * Sets the throttle rate for a specific data type
   * @param dataType Market data type
   * @param messagesPerSecond Maximum messages per second
   */
  public setThrottleRate(dataType: MarketDataType, messagesPerSecond: number): void {
    this.throttleConfig.set(dataType, messagesPerSecond);
  }

  /**
   * Gets the current throttle rate for a data type
   * @param dataType Market data type
   * @returns Messages per second rate
   */
  public getThrottleRate(dataType: MarketDataType): number {
    return this.throttleConfig.get(dataType) || 1;
  }

  /**
   * Handles authentication after connection is established
   */
  private handleAuthentication(): void {
    if (!this.authenticated && (this.apiKey || this.authToken)) {
      const authMessage = {
        type: 'auth',
        provider: this.provider,
        apiKey: this.apiKey,
        token: this.authToken
      };
      
      this.send(authMessage);
      
      // Listen for auth response
      const authListener = (data: any) => {
        if (data.type === 'auth' && data.status === 'success') {
          this.authenticated = true;
          this.emit('authenticated');
          this.removeListener('message', authListener);
        } else if (data.type === 'auth' && data.status === 'error') {
          this.emit('auth_error', data.message || 'Authentication failed');
          this.removeListener('message', authListener);
        }
      };
      
      this.on('message', authListener);
    }
  }

  /**
   * Processes incoming market data messages
   * @param data Received market data
   */
  private processMarketData(data: any): void {
    // Skip non-market data messages
    if (!data.type || !data.symbol) {
      return;
    }
    
    // Apply throttling
    if (this.shouldThrottle(data.type, data.symbol)) {
      return;
    }
    
    // Update last message timestamp
    this.lastMessageTime.set(`${data.type}-${data.symbol}`, Date.now());
    
    // Normalize the data format
    const normalizedData = this.normalizeData(data);
    
    // Find all matching listeners
    const dataType = data.type as MarketDataType;
    const symbol = data.symbol;
    
    // Notify symbol-specific listeners
    const specificKey = this.getListenerKey(dataType, [symbol]);
    this.notifyListeners(specificKey, normalizedData);
    
    // Notify wildcard listeners
    const wildcardKey = this.getListenerKey(dataType, ['*']);
    this.notifyListeners(wildcardKey, normalizedData);
    
    // Emit event for this data type and symbol
    this.emit(`data:${dataType}:${symbol}`, normalizedData);
    
    // Emit event for this data type (all symbols)
    this.emit(`data:${dataType}`, normalizedData);
  }

  /**
   * Determines if a message should be throttled
   * @param dataType Type of market data
   * @param symbol Symbol the data is for
   * @returns True if the message should be throttled
   */
  private shouldThrottle(dataType: string, symbol: string): boolean {
    const key = `${dataType}-${symbol}`;
    const lastTime = this.lastMessageTime.get(key) || 0;
    const now = Date.now();
    
    // Get throttle rate for this data type
    const throttleRate = this.throttleConfig.get(dataType as MarketDataType) || 1;
    
    // Calculate minimum time between messages
    const minInterval = 1000 / throttleRate;
    
    // Check if enough time has passed
    return now - lastTime < minInterval;
  }

  /**
   * Normalizes data from different providers into a standard format
   * @param data Raw market data
   * @returns Normalized market data
   */
  private normalizeData(data: any): MarketDataMessage {
    // Default normalized structure
    const normalized: MarketDataMessage = {
      type: data.type,
      symbol: data.symbol,
      data: data,
      timestamp: data.timestamp || Date.now()
    };
    
    // Provider-specific normalization
    switch (this.provider) {
      case 'alpaca':
        return this.normalizeAlpacaData(data, normalized);
      case 'finnhub':
        return this.normalizeFinnhubData(data, normalized);
      case 'iex':
        return this.normalizeIEXData(data, normalized);
      case 'polygon':
        return this.normalizePolygonData(data, normalized);
      default:
        return normalized;
    }
  }

  /**
   * Normalizes Alpaca market data
   */
  private normalizeAlpacaData(data: any, normalized: MarketDataMessage): MarketDataMessage {
    switch (data.type) {
      case 'quote':
        normalized.type = MarketDataType.QUOTES;
        normalized.data = {
          bid: data.bp,
          bidSize: data.bs,
          ask: data.ap,
          askSize: data.as,
          timestamp: data.t
        };
        break;
      case 'trade':
        normalized.type = MarketDataType.TRADES;
        normalized.data = {
          price: data.p,
          size: data.s,
          timestamp: data.t,
          exchange: data.x
        };
        break;
      case 'bar':
        normalized.type = MarketDataType.BARS;
        normalized.data = {
          open: data.o,
          high: data.h,
          low: data.l,
          close: data.c,
          volume: data.v,
          timestamp: data.t
        };
        break;
    }
    return normalized;
  }

  /**
   * Normalizes Finnhub market data
   */
  private normalizeFinnhubData(data: any, normalized: MarketDataMessage): MarketDataMessage {
    switch (data.type) {
      case 'trade':
        normalized.type = MarketDataType.TRADES;
        normalized.data = {
          price: data.data[0].p,
          size: data.data[0].v,
          timestamp: data.data[0].t,
          exchange: data.data[0].x
        };
        break;
      case 'quote':
        normalized.type = MarketDataType.QUOTES;
        normalized.data = {
          bid: data.data.b,
          bidSize: data.data.bs,
          ask: data.data.a,
          askSize: data.data.as,
          timestamp: data.data.t
        };
        break;
    }
    return normalized;
  }

  /**
   * Normalizes IEX market data
   */
  private normalizeIEXData(data: any, normalized: MarketDataMessage): MarketDataMessage {
    // IEX specific normalization
    return normalized;
  }

  /**
   * Normalizes Polygon market data
   */
  private normalizePolygonData(data: any, normalized: MarketDataMessage): MarketDataMessage {
    // Polygon specific normalization
    return normalized;
  }

  /**
   * Creates a key for the listener map
   * @param dataType Market data type
   * @param symbols Array of symbols
   * @returns Listener key
   */
  private getListenerKey(dataType: MarketDataType, symbols: string[]): string {
    return `${dataType}:${symbols.sort().join(',')}`;
  }

  /**
   * Notifies all listeners for a specific key
   * @param key Listener key
   * @param data Data to send to listeners
   */
  private notifyListeners(key: string, data: any): void {
    const listeners = this.dataListeners.get(key);
    
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('Error in market data listener:', error);
        }
      });
    }
  }
}