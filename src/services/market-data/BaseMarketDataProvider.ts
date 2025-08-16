import { v4 as uuidv4 } from 'uuid';
import {
  IMarketDataProvider,
  ConnectionStatus,
  MarketDataType,
  MarketDataEventType,
  SubscriptionInfo,
  MarketData,
  Quote,
  Trade,
  OrderBook,
  MarketDataListener
} from './IMarketDataProvider';

/**
 * Base class for market data providers
 */
export abstract class BaseMarketDataProvider implements IMarketDataProvider {
  readonly id: string;
  readonly name: string;
  
  protected _status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  protected _subscriptions: Map<string, Set<MarketDataType>> = new Map();
  protected _listeners: Map<MarketDataEventType, Set<MarketDataListener>> = new Map();
  protected _isInitialized: boolean = false;
  protected _config: Record<string, any> = {};
  
  // Cache for latest data
  protected _latestQuotes: Map<string, Quote> = new Map();
  protected _latestTrades: Map<string, Trade> = new Map();
  protected _latestBars: Map<string, Map<string, Bar>> = new Map(); // symbol -> timeframe -> bar
  protected _orderBooks: Map<string, OrderBook> = new Map();
  
  /**
   * Constructor for BaseMarketDataProvider
   * @param name Provider name
   */
  constructor(name: string) {
    this.id = uuidv4();
    this.name = name;
    
    // Initialize listener maps for all event types
    Object.values(MarketDataEventType).forEach(eventType => {
      this._listeners.set(eventType, new Set());
    });
  }
  
  /**
   * Initialize the market data provider
   * @param config Configuration for the market data provider
   */
  async initialize(config: Record<string, any>): Promise<void> {
    if (this._isInitialized) {
      throw new Error('Market data provider is already initialized');
    }
    
    try {
      this._config = { ...config };
      
      // Call implementation-specific initialization
      await this.onInitialize(config);
      
      this._isInitialized = true;
    } catch (error) {
      this._status = ConnectionStatus.ERROR;
      this.emitEvent(MarketDataEventType.ERROR, error);
      throw error;
    }
  }
  
  /**
   * Connect to the market data provider
   */
  async connect(): Promise<void> {
    if (!this._isInitialized) {
      throw new Error('Market data provider must be initialized before connecting');
    }
    
    if (this._status === ConnectionStatus.CONNECTED) {
      return; // Already connected
    }
    
    try {
      this._status = ConnectionStatus.CONNECTING;
      
      // Call implementation-specific connection
      await this.onConnect();
      
      this._status = ConnectionStatus.CONNECTED;
      this.emitEvent(MarketDataEventType.CONNECTED, { providerId: this.id });
      
      // Resubscribe to all previous subscriptions
      await this.resubscribeAll();
    } catch (error) {
      this._status = ConnectionStatus.ERROR;
      this.emitEvent(MarketDataEventType.ERROR, error);
      throw error;
    }
  }
  
  /**
   * Disconnect from the market data provider
   */
  async disconnect(): Promise<void> {
    if (this._status === ConnectionStatus.DISCONNECTED) {
      return; // Already disconnected
    }
    
    try {
      // Call implementation-specific disconnection
      await this.onDisconnect();
      
      this._status = ConnectionStatus.DISCONNECTED;
      this.emitEvent(MarketDataEventType.DISCONNECTED, { providerId: this.id });
    } catch (error) {
      this._status = ConnectionStatus.ERROR;
      this.emitEvent(MarketDataEventType.ERROR, error);
      throw error;
    }
  }
  
  /**
   * Get the current status of the connection
   */
  getStatus(): ConnectionStatus {
    return this._status;
  }
  
  /**
   * Subscribe to real-time market data for a symbol
   * @param symbol Symbol to subscribe to
   * @param dataTypes Types of data to subscribe to
   */
  async subscribe(symbol: string, dataTypes: MarketDataType[]): Promise<void> {
    if (!this._isInitialized) {
      throw new Error('Market data provider must be initialized before subscribing');
    }
    
    if (this._status !== ConnectionStatus.CONNECTED) {
      throw new Error('Market data provider must be connected before subscribing');
    }
    
    try {
      // Get current subscriptions for this symbol
      const currentTypes = this._subscriptions.get(symbol) || new Set();
      
      // Filter out already subscribed types
      const newTypes = dataTypes.filter(type => !currentTypes.has(type));
      
      if (newTypes.length === 0) {
        return; // Already subscribed to all requested types
      }
      
      // Call implementation-specific subscription
      await this.onSubscribe(symbol, newTypes);
      
      // Update subscriptions
      newTypes.forEach(type => currentTypes.add(type));
      this._subscriptions.set(symbol, currentTypes);
      
      // Emit subscription changed event
      this.emitEvent(MarketDataEventType.SUBSCRIPTION_CHANGED, {
        symbol,
        dataTypes: Array.from(currentTypes),
        action: 'subscribe'
      });
    } catch (error) {
      this.emitEvent(MarketDataEventType.ERROR, error);
      throw error;
    }
  }
  
  /**
   * Unsubscribe from real-time market data for a symbol
   * @param symbol Symbol to unsubscribe from
   * @param dataTypes Types of data to unsubscribe from
   */
  async unsubscribe(symbol: string, dataTypes?: MarketDataType[]): Promise<void> {
    if (!this._isInitialized) {
      throw new Error('Market data provider must be initialized before unsubscribing');
    }
    
    // Get current subscriptions for this symbol
    const currentTypes = this._subscriptions.get(symbol);
    
    if (!currentTypes || currentTypes.size === 0) {
      return; // Not subscribed to this symbol
    }
    
    try {
      // If no specific types are provided, unsubscribe from all
      const typesToRemove = dataTypes || Array.from(currentTypes);
      
      // Filter out types that are not currently subscribed
      const validTypes = typesToRemove.filter(type => currentTypes.has(type));
      
      if (validTypes.length === 0) {
        return; // Not subscribed to any of the specified types
      }
      
      // Call implementation-specific unsubscription
      await this.onUnsubscribe(symbol, validTypes);
      
      // Update subscriptions
      validTypes.forEach(type => currentTypes.delete(type));
      
      if (currentTypes.size === 0) {
        // Remove the symbol if no subscriptions remain
        this._subscriptions.delete(symbol);
      } else {
        this._subscriptions.set(symbol, currentTypes);
      }
      
      // Emit subscription changed event
      this.emitEvent(MarketDataEventType.SUBSCRIPTION_CHANGED, {
        symbol,
        dataTypes: dataTypes ? Array.from(currentTypes) : [],
        action: 'unsubscribe'
      });
    } catch (error) {
      this.emitEvent(MarketDataEventType.ERROR, error);
      throw error;
    }
  }
  
  /**
   * Get the list of currently subscribed symbols
   */
  async getSubscriptions(): Promise<SubscriptionInfo[]> {
    const subscriptions: SubscriptionInfo[] = [];
    
    for (const [symbol, dataTypes] of this._subscriptions.entries()) {
      subscriptions.push({
        symbol,
        dataTypes: Array.from(dataTypes),
        subscribeTime: new Date() // We don't track the actual subscribe time in this base implementation
      });
    }
    
    return subscriptions;
  }
  
  /**
   * Get historical market data for a symbol
   * @param symbol Symbol to get data for
   * @param timeframe Timeframe for the data
   * @param start Start time for the data
   * @param end End time for the data
   * @param limit Maximum number of data points to return
   */
  async getHistoricalData(
    symbol: string,
    timeframe: string,
    start: Date,
    end: Date,
    limit?: number
  ): Promise<MarketData[]> {
    if (!this._isInitialized) {
      throw new Error('Market data provider must be initialized before getting historical data');
    }
    
    try {
      // Call implementation-specific historical data retrieval
      return await this.onGetHistoricalData(symbol, timeframe, start, end, limit);
    } catch (error) {
      this.emitEvent(MarketDataEventType.ERROR, error);
      throw error;
    }
  }
  
  /**
   * Get the latest quote for a symbol
   * @param symbol Symbol to get quote for
   */
  async getQuote(symbol: string): Promise<Quote> {
    if (!this._isInitialized) {
      throw new Error('Market data provider must be initialized before getting quotes');
    }
    
    try {
      // Check cache first
      const cachedQuote = this._latestQuotes.get(symbol);
      
      if (cachedQuote) {
        return cachedQuote;
      }
      
      // Call implementation-specific quote retrieval
      const quote = await this.onGetQuote(symbol);
      
      // Update cache
      this._latestQuotes.set(symbol, quote);
      
      return quote;
    } catch (error) {
      this.emitEvent(MarketDataEventType.ERROR, error);
      throw error;
    }
  }
  
  /**
   * Get the latest trade for a symbol
   * @param symbol Symbol to get trade for
   */
  async getTrade(symbol: string): Promise<Trade> {
    if (!this._isInitialized) {
      throw new Error('Market data provider must be initialized before getting trades');
    }
    
    try {
      // Check cache first
      const cachedTrade = this._latestTrades.get(symbol);
      
      if (cachedTrade) {
        return cachedTrade;
      }
      
      // Call implementation-specific trade retrieval
      const trade = await this.onGetTrade(symbol);
      
      // Update cache
      this._latestTrades.set(symbol, trade);
      
      return trade;
    } catch (error) {
      this.emitEvent(MarketDataEventType.ERROR, error);
      throw error;
    }
  }
  
  /**
   * Get the order book for a symbol
   * @param symbol Symbol to get order book for
   * @param depth Depth of the order book
   */
  async getOrderBook(symbol: string, depth?: number): Promise<OrderBook> {
    if (!this._isInitialized) {
      throw new Error('Market data provider must be initialized before getting order book');
    }
    
    try {
      // Check cache first
      const cachedOrderBook = this._orderBooks.get(symbol);
      
      if (cachedOrderBook) {
        // Apply depth if provided
        if (depth && depth > 0) {
          return {
            ...cachedOrderBook,
            bids: cachedOrderBook.bids.slice(0, depth),
            asks: cachedOrderBook.asks.slice(0, depth)
          };
        }
        return cachedOrderBook;
      }
      
      // Call implementation-specific order book retrieval
      const orderBook = await this.onGetOrderBook(symbol, depth);
      
      // Update cache
      this._orderBooks.set(symbol, orderBook);
      
      return orderBook;
    } catch (error) {
      this.emitEvent(MarketDataEventType.ERROR, error);
      throw error;
    }
  }
  
  /**
   * Add a listener for market data events
   * @param eventType Type of event to listen for
   * @param listener Listener function
   */
  addListener(eventType: MarketDataEventType, listener: MarketDataListener): void {
    const listeners = this._listeners.get(eventType);
    
    if (listeners) {
      listeners.add(listener);
    }
  }
  
  /**
   * Remove a listener for market data events
   * @param eventType Type of event to listen for
   * @param listener Listener function
   */
  removeListener(eventType: MarketDataEventType, listener: MarketDataListener): void {
    const listeners = this._listeners.get(eventType);
    
    if (listeners) {
      listeners.delete(listener);
    }
  }
  
  /**
   * Emit an event to all registered listeners
   * @param eventType Type of event to emit
   * @param data Event data
   */
  protected emitEvent(eventType: MarketDataEventType, data: any): void {
    const listeners = this._listeners.get(eventType);
    
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in market data listener for ${eventType}:`, error);
        }
      });
    }
  }
  
  /**
   * Handle a new trade
   * @param trade Trade data
   */
  protected handleTrade(trade: Trade): void {
    // Update cache
    this._latestTrades.set(trade.symbol, trade);
    
    // Emit event
    this.emitEvent(MarketDataEventType.TRADE, trade);
  }
  
  /**
   * Handle a new quote
   * @param quote Quote data
   */
  protected handleQuote(quote: Quote): void {
    // Update cache
    this._latestQuotes.set(quote.symbol, quote);
    
    // Emit event
    this.emitEvent(MarketDataEventType.QUOTE, quote);
  }
  
  /**
   * Handle a new bar
   * @param bar Bar data
   */
  protected handleBar(bar: any): void {
    // Get or create timeframe map
    let timeframeMap = this._latestBars.get(bar.symbol);
    
    if (!timeframeMap) {
      timeframeMap = new Map();
      this._latestBars.set(bar.symbol, timeframeMap);
    }
    
    // Update cache
    timeframeMap.set(bar.timeframe, bar);
    
    // Emit event
    this.emitEvent(MarketDataEventType.BAR, bar);
  }
  
  /**
   * Handle a new order book
   * @param orderBook Order book data
   */
  protected handleOrderBook(orderBook: OrderBook): void {
    // Update cache
    this._orderBooks.set(orderBook.symbol, orderBook);
    
    // Emit event
    this.emitEvent(MarketDataEventType.ORDER_BOOK, orderBook);
  }
  
  /**
   * Resubscribe to all previous subscriptions
   */
  protected async resubscribeAll(): Promise<void> {
    for (const [symbol, dataTypes] of this._subscriptions.entries()) {
      try {
        await this.onSubscribe(symbol, Array.from(dataTypes));
      } catch (error) {
        console.error(`Error resubscribing to ${symbol}:`, error);
        this.emitEvent(MarketDataEventType.ERROR, error);
      }
    }
  }
  
  // Abstract methods to be implemented by concrete providers
  
  /**
   * Implementation-specific initialization logic
   * @param config Configuration object
   */
  protected abstract onInitialize(config: Record<string, any>): Promise<void>;
  
  /**
   * Implementation-specific connection logic
   */
  protected abstract onConnect(): Promise<void>;
  
  /**
   * Implementation-specific disconnection logic
   */
  protected abstract onDisconnect(): Promise<void>;
  
  /**
   * Implementation-specific subscription logic
   * @param symbol Symbol to subscribe to
   * @param dataTypes Types of data to subscribe to
   */
  protected abstract onSubscribe(symbol: string, dataTypes: MarketDataType[]): Promise<void>;
  
  /**
   * Implementation-specific unsubscription logic
   * @param symbol Symbol to unsubscribe from
   * @param dataTypes Types of data to unsubscribe from
   */
  protected abstract onUnsubscribe(symbol: string, dataTypes: MarketDataType[]): Promise<void>;
  
  /**
   * Implementation-specific historical data retrieval logic
   * @param symbol Symbol to get data for
   * @param timeframe Timeframe for the data
   * @param start Start time for the data
   * @param end End time for the data
   * @param limit Maximum number of data points to return
   */
  protected abstract onGetHistoricalData(
    symbol: string,
    timeframe: string,
    start: Date,
    end: Date,
    limit?: number
  ): Promise<MarketData[]>;
  
  /**
   * Implementation-specific quote retrieval logic
   * @param symbol Symbol to get quote for
   */
  protected abstract onGetQuote(symbol: string): Promise<Quote>;
  
  /**
   * Implementation-specific trade retrieval logic
   * @param symbol Symbol to get trade for
   */
  protected abstract onGetTrade(symbol: string): Promise<Trade>;
  
  /**
   * Implementation-specific order book retrieval logic
   * @param symbol Symbol to get order book for
   * @param depth Depth of the order book
   */
  protected abstract onGetOrderBook(symbol: string, depth?: number): Promise<OrderBook>;
}

/**
 * Bar/Candle interface
 */
interface Bar {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: Date;
  timeframe: string;
}