/**
 * RealTimeMarketDataService - Service for real-time market data streaming
 * 
 * This service provides real-time market data through WebSocket connections,
 * with support for price updates, order book data, and trade information.
 */

import { EventEmitter } from 'events';
import { MarketDataService } from '../MarketDataService';

export interface MarketDataUpdate {
  ticker: string;
  timestamp: Date;
  price: number;
  volume?: number;
  bid?: number;
  ask?: number;
  high?: number;
  low?: number;
  open?: number;
  close?: number;
  source: string;
}

export interface OrderBookUpdate {
  ticker: string;
  timestamp: Date;
  bids: Array<{ price: number; quantity: number }>;
  asks: Array<{ price: number; quantity: number }>;
  source: string;
}

export interface TradeUpdate {
  ticker: string;
  timestamp: Date;
  price: number;
  quantity: number;
  side: 'buy' | 'sell';
  source: string;
}

export interface MarketNewsUpdate {
  ticker: string;
  timestamp: Date;
  headline: string;
  summary: string;
  url: string;
  source: string;
  sentiment?: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
}

export interface WebSocketConnectionConfig {
  url: string;
  apiKey?: string;
  subscriptions: Array<{
    type: 'price' | 'orderbook' | 'trades' | 'news';
    tickers: string[];
    interval?: string;
  }>;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export class RealTimeMarketDataService extends EventEmitter {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly wsConnections: Map<string, WebSocket>;
  private readonly dataCache: Map<string, MarketDataUpdate>;
  private readonly orderBookCache: Map<string, OrderBookUpdate>;
  private readonly tradeCache: Map<string, TradeUpdate[]>;
  private readonly newsCache: Map<string, MarketNewsUpdate[]>;
  private readonly marketDataService: MarketDataService;
  private readonly cacheTTL: number; // Time to live in milliseconds
  private readonly maxCacheSize: number;
  private reconnectTimers: Map<string, NodeJS.Timeout>;
  private reconnectAttempts: Map<string, number>;
  private isInitialized: boolean;

  constructor(apiKey: string, baseUrl: string = 'https://api.ninjatechfinance.com/v1') {
    super();
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.wsConnections = new Map<string, WebSocket>();
    this.dataCache = new Map<string, MarketDataUpdate>();
    this.orderBookCache = new Map<string, OrderBookUpdate>();
    this.tradeCache = new Map<string, TradeUpdate[]>();
    this.newsCache = new Map<string, MarketNewsUpdate[]>();
    this.marketDataService = new MarketDataService(apiKey, baseUrl);
    this.cacheTTL = 60000; // 1 minute default
    this.maxCacheSize = 10000; // Maximum number of items in cache
    this.reconnectTimers = new Map<string, NodeJS.Timeout>();
    this.reconnectAttempts = new Map<string, number>();
    this.isInitialized = false;
  }

  /**
   * Initialize the service and establish WebSocket connections
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Get available data sources
      const dataSources = await this.getAvailableDataSources();
      
      // Initialize connections to each data source
      for (const source of dataSources) {
        await this.initializeDataSource(source);
      }
      
      this.isInitialized = true;
      this.emit('initialized');
      console.log('RealTimeMarketDataService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RealTimeMarketDataService:', error);
      throw new Error('Failed to initialize RealTimeMarketDataService');
    }
  }

  /**
   * Get available real-time data sources
   */
  private async getAvailableDataSources(): Promise<string[]> {
    try {
      // In a real implementation, this would fetch from an API
      // For now, return hardcoded sources
      return ['primary', 'secondary', 'news'];
    } catch (error) {
      console.error('Error fetching available data sources:', error);
      return ['primary']; // Default to primary source only
    }
  }

  /**
   * Initialize a specific data source
   */
  private async initializeDataSource(source: string): Promise<void> {
    try {
      // Get connection config for the source
      const config = await this.getConnectionConfig(source);
      
      // Establish WebSocket connection
      await this.connectWebSocket(source, config);
    } catch (error) {
      console.error(`Error initializing data source ${source}:`, error);
      throw new Error(`Failed to initialize data source ${source}`);
    }
  }

  /**
   * Get WebSocket connection configuration for a data source
   */
  private async getConnectionConfig(source: string): Promise<WebSocketConnectionConfig> {
    // In a real implementation, this would fetch from an API or config
    // For now, return hardcoded configs
    switch (source) {
      case 'primary':
        return {
          url: `wss://realtime.ninjatechfinance.com/v1/market-data`,
          apiKey: this.apiKey,
          subscriptions: [
            {
              type: 'price',
              tickers: ['SPY', 'QQQ', 'AAPL', 'MSFT', 'GOOGL'],
              interval: '1s'
            },
            {
              type: 'orderbook',
              tickers: ['SPY', 'QQQ', 'AAPL'],
              interval: '1s'
            }
          ],
          reconnectInterval: 5000,
          maxReconnectAttempts: 10
        };
      case 'secondary':
        return {
          url: `wss://realtime-backup.ninjatechfinance.com/v1/market-data`,
          apiKey: this.apiKey,
          subscriptions: [
            {
              type: 'trades',
              tickers: ['SPY', 'QQQ', 'AAPL', 'MSFT', 'GOOGL'],
              interval: '1s'
            }
          ],
          reconnectInterval: 5000,
          maxReconnectAttempts: 5
        };
      case 'news':
        return {
          url: `wss://realtime-news.ninjatechfinance.com/v1/news`,
          apiKey: this.apiKey,
          subscriptions: [
            {
              type: 'news',
              tickers: ['SPY', 'QQQ', 'AAPL', 'MSFT', 'GOOGL'],
            }
          ],
          reconnectInterval: 10000,
          maxReconnectAttempts: 3
        };
      default:
        throw new Error(`Unknown data source: ${source}`);
    }
  }

  /**
   * Connect to a WebSocket endpoint
   */
  private async connectWebSocket(source: string, config: WebSocketConnectionConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // In a browser environment, we would use the WebSocket API
        // For Node.js, we need to use a WebSocket library
        // This is a simplified implementation
        console.log(`Connecting to WebSocket for ${source}: ${config.url}`);
        
        // Simulate WebSocket connection
        const mockWs = {
          send: (data: string) => {
            console.log(`Sending to ${source}:`, data);
          },
          close: () => {
            console.log(`Closing connection to ${source}`);
            this.handleWebSocketClose(source);
          }
        };
        
        // Store the connection
        this.wsConnections.set(source, mockWs as any);
        
        // Reset reconnect attempts
        this.reconnectAttempts.set(source, 0);
        
        // Subscribe to data
        this.subscribeToData(source, config.subscriptions);
        
        // Set up mock data simulation for development
        this.setupMockDataSimulation(source, config.subscriptions);
        
        resolve();
      } catch (error) {
        console.error(`Error connecting to WebSocket for ${source}:`, error);
        this.scheduleReconnect(source, config);
        reject(error);
      }
    });
  }

  /**
   * Subscribe to data streams
   */
  private subscribeToData(source: string, subscriptions: WebSocketConnectionConfig['subscriptions']): void {
    const ws = this.wsConnections.get(source);
    if (!ws) {
      console.error(`No WebSocket connection for ${source}`);
      return;
    }
    
    // Send subscription messages
    subscriptions.forEach(sub => {
      const subscriptionMessage = {
        type: 'subscribe',
        channel: sub.type,
        tickers: sub.tickers,
        interval: sub.interval
      };
      
      ws.send(JSON.stringify(subscriptionMessage));
    });
  }

  /**
   * Handle WebSocket messages
   */
  private handleWebSocketMessage(source: string, data: any): void {
    try {
      // Parse the message
      const message = typeof data === 'string' ? JSON.parse(data) : data;
      
      // Process based on message type
      switch (message.type) {
        case 'price':
          this.handlePriceUpdate(message);
          break;
        case 'orderbook':
          this.handleOrderBookUpdate(message);
          break;
        case 'trade':
          this.handleTradeUpdate(message);
          break;
        case 'news':
          this.handleNewsUpdate(message);
          break;
        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  /**
   * Handle price update messages
   */
  private handlePriceUpdate(message: any): void {
    const update: MarketDataUpdate = {
      ticker: message.ticker,
      timestamp: new Date(message.timestamp),
      price: message.price,
      volume: message.volume,
      bid: message.bid,
      ask: message.ask,
      high: message.high,
      low: message.low,
      open: message.open,
      close: message.close,
      source: message.source
    };
    
    // Update cache
    this.dataCache.set(message.ticker, update);
    
    // Emit event
    this.emit('price-update', update);
    this.emit(`price-update:${message.ticker}`, update);
  }

  /**
   * Handle order book update messages
   */
  private handleOrderBookUpdate(message: any): void {
    const update: OrderBookUpdate = {
      ticker: message.ticker,
      timestamp: new Date(message.timestamp),
      bids: message.bids,
      asks: message.asks,
      source: message.source
    };
    
    // Update cache
    this.orderBookCache.set(message.ticker, update);
    
    // Emit event
    this.emit('orderbook-update', update);
    this.emit(`orderbook-update:${message.ticker}`, update);
  }

  /**
   * Handle trade update messages
   */
  private handleTradeUpdate(message: any): void {
    const update: TradeUpdate = {
      ticker: message.ticker,
      timestamp: new Date(message.timestamp),
      price: message.price,
      quantity: message.quantity,
      side: message.side,
      source: message.source
    };
    
    // Update cache
    const trades = this.tradeCache.get(message.ticker) || [];
    trades.push(update);
    
    // Limit cache size
    if (trades.length > 100) {
      trades.shift(); // Remove oldest trade
    }
    
    this.tradeCache.set(message.ticker, trades);
    
    // Emit event
    this.emit('trade-update', update);
    this.emit(`trade-update:${message.ticker}`, update);
  }

  /**
   * Handle news update messages
   */
  private handleNewsUpdate(message: any): void {
    const update: MarketNewsUpdate = {
      ticker: message.ticker,
      timestamp: new Date(message.timestamp),
      headline: message.headline,
      summary: message.summary,
      url: message.url,
      source: message.source,
      sentiment: message.sentiment
    };
    
    // Update cache
    const news = this.newsCache.get(message.ticker) || [];
    news.push(update);
    
    // Limit cache size
    if (news.length > 50) {
      news.shift(); // Remove oldest news
    }
    
    this.newsCache.set(message.ticker, news);
    
    // Emit event
    this.emit('news-update', update);
    this.emit(`news-update:${message.ticker}`, update);
  }

  /**
   * Handle WebSocket close events
   */
  private handleWebSocketClose(source: string): void {
    console.log(`WebSocket connection closed for ${source}`);
    
    // Remove from connections map
    this.wsConnections.delete(source);
    
    // Get connection config and attempt to reconnect
    this.getConnectionConfig(source)
      .then(config => this.scheduleReconnect(source, config))
      .catch(error => console.error(`Error getting connection config for ${source}:`, error));
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(source: string, config: WebSocketConnectionConfig): void {
    // Clear any existing reconnect timer
    if (this.reconnectTimers.has(source)) {
      clearTimeout(this.reconnectTimers.get(source)!);
    }
    
    // Get current reconnect attempts
    const attempts = this.reconnectAttempts.get(source) || 0;
    
    // Check if max attempts reached
    if (attempts >= (config.maxReconnectAttempts || 10)) {
      console.error(`Max reconnect attempts reached for ${source}`);
      this.emit('reconnect-failed', { source });
      return;
    }
    
    // Increment attempts
    this.reconnectAttempts.set(source, attempts + 1);
    
    // Schedule reconnect
    const timer = setTimeout(() => {
      console.log(`Attempting to reconnect to ${source} (${attempts + 1}/${config.maxReconnectAttempts || 10})`);
      this.connectWebSocket(source, config)
        .catch(error => console.error(`Reconnect attempt failed for ${source}:`, error));
    }, config.reconnectInterval || 5000);
    
    this.reconnectTimers.set(source, timer);
  }

  /**
   * Set up mock data simulation for development
   */
  private setupMockDataSimulation(source: string, subscriptions: WebSocketConnectionConfig['subscriptions']): void {
    // Only run in development
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    
    console.log(`Setting up mock data simulation for ${source}`);
    
    subscriptions.forEach(sub => {
      sub.tickers.forEach(ticker => {
        // Generate initial price
        const basePrice = this.getBasePrice(ticker);
        
        // Set up interval for price updates
        if (sub.type === 'price') {
          setInterval(() => {
            const priceChange = (Math.random() - 0.5) * 0.01 * basePrice;
            const newPrice = basePrice + priceChange;
            
            const mockPriceUpdate = {
              type: 'price',
              ticker,
              timestamp: new Date().toISOString(),
              price: newPrice,
              volume: Math.floor(Math.random() * 10000),
              bid: newPrice - 0.01,
              ask: newPrice + 0.01,
              high: newPrice + Math.random() * 0.5,
              low: newPrice - Math.random() * 0.5,
              open: basePrice,
              close: newPrice,
              source
            };
            
            this.handleWebSocketMessage(source, mockPriceUpdate);
          }, parseInt(sub.interval || '1000'));
        }
        
        // Set up interval for order book updates
        if (sub.type === 'orderbook') {
          setInterval(() => {
            const price = this.getBasePrice(ticker);
            
            const mockOrderBookUpdate = {
              type: 'orderbook',
              ticker,
              timestamp: new Date().toISOString(),
              bids: Array(5).fill(0).map((_, i) => ({
                price: price - (i + 1) * 0.01,
                quantity: Math.floor(Math.random() * 1000)
              })),
              asks: Array(5).fill(0).map((_, i) => ({
                price: price + (i + 1) * 0.01,
                quantity: Math.floor(Math.random() * 1000)
              })),
              source
            };
            
            this.handleWebSocketMessage(source, mockOrderBookUpdate);
          }, parseInt(sub.interval || '1000'));
        }
        
        // Set up interval for trade updates
        if (sub.type === 'trades') {
          setInterval(() => {
            const price = this.getBasePrice(ticker) + (Math.random() - 0.5) * 0.05;
            
            const mockTradeUpdate = {
              type: 'trade',
              ticker,
              timestamp: new Date().toISOString(),
              price,
              quantity: Math.floor(Math.random() * 100) + 1,
              side: Math.random() > 0.5 ? 'buy' : 'sell',
              source
            };
            
            this.handleWebSocketMessage(source, mockTradeUpdate);
          }, Math.floor(Math.random() * 5000) + 1000); // Random interval between 1-6 seconds
        }
        
        // Set up interval for news updates
        if (sub.type === 'news') {
          setInterval(() => {
            // Only generate news occasionally
            if (Math.random() > 0.8) {
              const sentiment = Math.random();
              let sentimentLabel: 'positive' | 'negative' | 'neutral';
              
              if (sentiment > 0.6) {
                sentimentLabel = 'positive';
              } else if (sentiment < 0.4) {
                sentimentLabel = 'negative';
              } else {
                sentimentLabel = 'neutral';
              }
              
              const mockNewsUpdate = {
                type: 'news',
                ticker,
                timestamp: new Date().toISOString(),
                headline: this.generateMockHeadline(ticker, sentimentLabel),
                summary: this.generateMockSummary(ticker, sentimentLabel),
                url: `https://example.com/news/${ticker}/${Date.now()}`,
                source: 'Mock News Service',
                sentiment: {
                  score: sentiment,
                  label: sentimentLabel,
                  confidence: 0.7 + Math.random() * 0.3
                }
              };
              
              this.handleWebSocketMessage(source, mockNewsUpdate);
            }
          }, 30000); // Every 30 seconds
        }
      });
    });
  }

  /**
   * Get base price for a ticker
   */
  private getBasePrice(ticker: string): number {
    // Return realistic base prices for common tickers
    switch (ticker) {
      case 'SPY': return 450 + Math.random() * 10;
      case 'QQQ': return 380 + Math.random() * 10;
      case 'AAPL': return 180 + Math.random() * 5;
      case 'MSFT': return 350 + Math.random() * 10;
      case 'GOOGL': return 140 + Math.random() * 5;
      case 'AMZN': return 180 + Math.random() * 5;
      case 'TSLA': return 250 + Math.random() * 10;
      case 'META': return 300 + Math.random() * 10;
      case 'NVDA': return 450 + Math.random() * 20;
      default: return 100 + Math.random() * 10;
    }
  }

  /**
   * Generate a mock news headline
   */
  private generateMockHeadline(ticker: string, sentiment: 'positive' | 'negative' | 'neutral'): string {
    const positiveHeadlines = [
      `${ticker} Exceeds Quarterly Expectations, Shares Surge`,
      `${ticker} Announces Major Product Launch, Analysts Bullish`,
      `${ticker} Secures Strategic Partnership, Expanding Market Reach`,
      `${ticker} Reports Record Revenue Growth in Latest Quarter`,
      `${ticker} Increases Dividend, Signaling Strong Financial Position`
    ];
    
    const negativeHeadlines = [
      `${ticker} Misses Earnings Targets, Shares Tumble`,
      `${ticker} Faces Regulatory Investigation, Uncertainty Ahead`,
      `${ticker} Announces Layoffs Amid Restructuring Efforts`,
      `${ticker} Lowers Guidance, Citing Market Headwinds`,
      `${ticker} Product Recall Impacts Sales Forecast`
    ];
    
    const neutralHeadlines = [
      `${ticker} Reports Mixed Quarterly Results`,
      `${ticker} Announces Leadership Changes`,
      `${ticker} Maintains Current Outlook Despite Market Volatility`,
      `${ticker} Completes Previously Announced Acquisition`,
      `${ticker} Presents at Industry Conference, Outlines Strategy`
    ];
    
    switch (sentiment) {
      case 'positive':
        return positiveHeadlines[Math.floor(Math.random() * positiveHeadlines.length)];
      case 'negative':
        return negativeHeadlines[Math.floor(Math.random() * negativeHeadlines.length)];
      case 'neutral':
        return neutralHeadlines[Math.floor(Math.random() * neutralHeadlines.length)];
    }
  }

  /**
   * Generate a mock news summary
   */
  private generateMockSummary(ticker: string, sentiment: 'positive' | 'negative' | 'neutral'): string {
    const positiveSummaries = [
      `${ticker} reported quarterly earnings that exceeded analyst expectations, with revenue growing by 15% year-over-year. The company also raised its full-year guidance, citing strong demand for its products and services.`,
      `${ticker} announced a major new product line that analysts believe will significantly expand its market share. The company expects the new offerings to contribute to revenue growth starting next quarter.`,
      `${ticker} has formed a strategic partnership that will allow it to enter new markets and reach additional customer segments. Executives project this will add 5-10% to annual revenue within two years.`
    ];
    
    const negativeSummaries = [
      `${ticker} reported quarterly earnings below consensus estimates, with revenue declining by 5% compared to the same period last year. The company cited supply chain challenges and increased competition as key factors.`,
      `${ticker} is facing a regulatory investigation related to its business practices, creating uncertainty for investors. The company stated it is cooperating fully but cannot predict the outcome at this time.`,
      `${ticker} announced it will reduce its workforce by approximately 8% as part of a cost-cutting initiative. The restructuring is expected to result in significant one-time charges in the current quarter.`
    ];
    
    const neutralSummaries = [
      `${ticker} reported quarterly results that met expectations, with revenue up 3% year-over-year. The company maintained its previous guidance for the full fiscal year.`,
      `${ticker} announced that its CEO will retire at the end of the year, with the current COO set to take over the position. The transition is part of the company's long-term succession planning.`,
      `${ticker} completed its previously announced acquisition of a smaller competitor. Integration is expected to take 6-12 months, with synergies realized in the following fiscal year.`
    ];
    
    switch (sentiment) {
      case 'positive':
        return positiveSummaries[Math.floor(Math.random() * positiveSummaries.length)];
      case 'negative':
        return negativeSummaries[Math.floor(Math.random() * negativeSummaries.length)];
      case 'neutral':
        return neutralSummaries[Math.floor(Math.random() * neutralSummaries.length)];
    }
  }

  /**
   * Get the latest price data for a ticker
   */
  public getLatestPrice(ticker: string): MarketDataUpdate | null {
    return this.dataCache.get(ticker) || null;
  }

  /**
   * Get the latest order book data for a ticker
   */
  public getLatestOrderBook(ticker: string): OrderBookUpdate | null {
    return this.orderBookCache.get(ticker) || null;
  }

  /**
   * Get recent trades for a ticker
   */
  public getRecentTrades(ticker: string, limit: number = 10): TradeUpdate[] {
    const trades = this.tradeCache.get(ticker) || [];
    return trades.slice(-limit);
  }

  /**
   * Get recent news for a ticker
   */
  public getRecentNews(ticker: string, limit: number = 10): MarketNewsUpdate[] {
    const news = this.newsCache.get(ticker) || [];
    return news.slice(-limit);
  }

  /**
   * Subscribe to price updates for a ticker
   */
  public subscribeToPriceUpdates(ticker: string, callback: (update: MarketDataUpdate) => void): () => void {
    const eventName = `price-update:${ticker}`;
    this.on(eventName, callback);
    
    // Return unsubscribe function
    return () => {
      this.off(eventName, callback);
    };
  }

  /**
   * Subscribe to order book updates for a ticker
   */
  public subscribeToOrderBookUpdates(ticker: string, callback: (update: OrderBookUpdate) => void): () => void {
    const eventName = `orderbook-update:${ticker}`;
    this.on(eventName, callback);
    
    // Return unsubscribe function
    return () => {
      this.off(eventName, callback);
    };
  }

  /**
   * Subscribe to trade updates for a ticker
   */
  public subscribeToTradeUpdates(ticker: string, callback: (update: TradeUpdate) => void): () => void {
    const eventName = `trade-update:${ticker}`;
    this.on(eventName, callback);
    
    // Return unsubscribe function
    return () => {
      this.off(eventName, callback);
    };
  }

  /**
   * Subscribe to news updates for a ticker
   */
  public subscribeToNewsUpdates(ticker: string, callback: (update: MarketNewsUpdate) => void): () => void {
    const eventName = `news-update:${ticker}`;
    this.on(eventName, callback);
    
    // Return unsubscribe function
    return () => {
      this.off(eventName, callback);
    };
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    // Close all WebSocket connections
    this.wsConnections.forEach((ws, source) => {
      ws.close();
    });
    
    // Clear all reconnect timers
    this.reconnectTimers.forEach((timer) => {
      clearTimeout(timer);
    });
    
    // Clear all event listeners
    this.removeAllListeners();
    
    console.log('RealTimeMarketDataService disposed');
  }
}

export default RealTimeMarketDataService;