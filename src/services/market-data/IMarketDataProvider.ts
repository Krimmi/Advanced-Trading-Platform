/**
 * Interface for market data providers
 */
export interface IMarketDataProvider {
  /**
   * Unique identifier for the market data provider
   */
  readonly id: string;
  
  /**
   * Human-readable name of the market data provider
   */
  readonly name: string;
  
  /**
   * Initialize the market data provider
   * @param config Configuration for the market data provider
   */
  initialize(config: Record<string, any>): Promise<void>;
  
  /**
   * Connect to the market data provider
   */
  connect(): Promise<void>;
  
  /**
   * Disconnect from the market data provider
   */
  disconnect(): Promise<void>;
  
  /**
   * Get the current status of the connection
   */
  getStatus(): ConnectionStatus;
  
  /**
   * Subscribe to real-time market data for a symbol
   * @param symbol Symbol to subscribe to
   * @param dataTypes Types of data to subscribe to
   */
  subscribe(symbol: string, dataTypes: MarketDataType[]): Promise<void>;
  
  /**
   * Unsubscribe from real-time market data for a symbol
   * @param symbol Symbol to unsubscribe from
   * @param dataTypes Types of data to unsubscribe from
   */
  unsubscribe(symbol: string, dataTypes?: MarketDataType[]): Promise<void>;
  
  /**
   * Get the list of currently subscribed symbols
   */
  getSubscriptions(): Promise<SubscriptionInfo[]>;
  
  /**
   * Get historical market data for a symbol
   * @param symbol Symbol to get data for
   * @param timeframe Timeframe for the data
   * @param start Start time for the data
   * @param end End time for the data
   * @param limit Maximum number of data points to return
   */
  getHistoricalData(
    symbol: string,
    timeframe: string,
    start: Date,
    end: Date,
    limit?: number
  ): Promise<MarketData[]>;
  
  /**
   * Get the latest quote for a symbol
   * @param symbol Symbol to get quote for
   */
  getQuote(symbol: string): Promise<Quote>;
  
  /**
   * Get the latest trade for a symbol
   * @param symbol Symbol to get trade for
   */
  getTrade(symbol: string): Promise<Trade>;
  
  /**
   * Get the order book for a symbol
   * @param symbol Symbol to get order book for
   * @param depth Depth of the order book
   */
  getOrderBook(symbol: string, depth?: number): Promise<OrderBook>;
  
  /**
   * Add a listener for market data events
   * @param eventType Type of event to listen for
   * @param listener Listener function
   */
  addListener(eventType: MarketDataEventType, listener: MarketDataListener): void;
  
  /**
   * Remove a listener for market data events
   * @param eventType Type of event to listen for
   * @param listener Listener function
   */
  removeListener(eventType: MarketDataEventType, listener: MarketDataListener): void;
}

/**
 * Connection status enum
 */
export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  RECONNECTING = 'RECONNECTING',
  ERROR = 'ERROR'
}

/**
 * Market data type enum
 */
export enum MarketDataType {
  TRADE = 'TRADE',
  QUOTE = 'QUOTE',
  BAR = 'BAR',
  ORDER_BOOK = 'ORDER_BOOK'
}

/**
 * Market data event type enum
 */
export enum MarketDataEventType {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
  TRADE = 'TRADE',
  QUOTE = 'QUOTE',
  BAR = 'BAR',
  ORDER_BOOK = 'ORDER_BOOK',
  SUBSCRIPTION_CHANGED = 'SUBSCRIPTION_CHANGED'
}

/**
 * Subscription info interface
 */
export interface SubscriptionInfo {
  symbol: string;
  dataTypes: MarketDataType[];
  subscribeTime: Date;
}

/**
 * Market data interface
 */
export interface MarketData {
  symbol: string;
  timestamp: Date;
  [key: string]: any;
}

/**
 * Quote interface
 */
export interface Quote extends MarketData {
  bidPrice: number;
  bidSize: number;
  askPrice: number;
  askSize: number;
  timestamp: Date;
}

/**
 * Trade interface
 */
export interface Trade extends MarketData {
  price: number;
  size: number;
  timestamp: Date;
  tradeId?: string;
}

/**
 * Bar/Candle interface
 */
export interface Bar extends MarketData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: Date;
  timeframe: string;
}

/**
 * Order book entry interface
 */
export interface OrderBookEntry {
  price: number;
  size: number;
}

/**
 * Order book interface
 */
export interface OrderBook extends MarketData {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  timestamp: Date;
}

/**
 * Market data listener type
 */
export type MarketDataListener = (data: any) => void;