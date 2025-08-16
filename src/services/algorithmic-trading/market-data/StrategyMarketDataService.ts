import { EventEmitter } from 'events';
import { MarketDataWebSocketService, MarketDataType } from '../../../services/websocket/MarketDataWebSocketService';
import { WebSocketServiceFactory } from '../../../services/websocket/WebSocketServiceFactory';
import { IStrategy } from '../strategies/IStrategy';
import { StrategyRegistry } from '../registry/StrategyRegistry';
import { environmentConfig } from '../../config/EnvironmentConfig';
import { secretManager } from '../../config/SecretManager';
import { ConnectionState } from '../../../services/websocket/WebSocketService';

/**
 * Service that connects market data to trading strategies
 * 
 * This service is responsible for:
 * 1. Subscribing to market data for symbols used by active strategies
 * 2. Distributing market data to the appropriate strategies
 * 3. Managing WebSocket connections and reconnections
 * 4. Validating and normalizing market data
 */
export class StrategyMarketDataService extends EventEmitter {
  private static instance: StrategyMarketDataService;
  private marketDataService: MarketDataWebSocketService;
  private strategyRegistry: StrategyRegistry;
  private subscriptions: Map<string, Set<string>> = new Map(); // symbol -> strategy IDs
  private strategySymbols: Map<string, Set<string>> = new Map(); // strategy ID -> symbols
  private isInitialized: boolean = false;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private dataValidators: Map<MarketDataType, (data: any) => boolean> = new Map();
  private dataNormalizers: Map<MarketDataType, (data: any) => any> = new Map();

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    super();
    this.strategyRegistry = StrategyRegistry.getInstance();
    this.setupDataValidators();
    this.setupDataNormalizers();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): StrategyMarketDataService {
    if (!StrategyMarketDataService.instance) {
      StrategyMarketDataService.instance = new StrategyMarketDataService();
    }
    return StrategyMarketDataService.instance;
  }

  /**
   * Initialize the service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Get the WebSocket service factory
      const wsFactory = WebSocketServiceFactory.getInstance();

      // Configure the provider with API credentials
      const alpacaConfig = environmentConfig.getApiConfig('alpaca');
      const alpacaCredentials = secretManager.getApiCredentials('alpaca');

      // Register the provider with credentials
      wsFactory.registerProvider({
        name: 'alpaca',
        url: alpacaConfig.wsUrl,
        priority: 100,
        apiKey: alpacaCredentials.apiKey,
        authToken: alpacaCredentials.apiSecret,
        reconnectInterval: 3000,
        maxReconnectAttempts: 10,
        heartbeatInterval: 30000,
        heartbeatMessage: { action: 'ping' }
      });

      // Get the market data service
      this.marketDataService = wsFactory.getMarketDataService('alpaca');

      // Set up event listeners
      this.marketDataService.on('state_change', this.handleConnectionStateChange.bind(this));
      this.marketDataService.on('message', this.handleMarketData.bind(this));
      this.marketDataService.on('error', this.handleError.bind(this));

      // Set up strategy registry listeners
      this.strategyRegistry.on('strategy_added', this.handleStrategyAdded.bind(this));
      this.strategyRegistry.on('strategy_removed', this.handleStrategyRemoved.bind(this));
      this.strategyRegistry.on('strategy_updated', this.handleStrategyUpdated.bind(this));

      // Subscribe to market data for all active strategies
      await this.subscribeToActiveStrategies();

      // Connect to the WebSocket
      this.marketDataService.connect();

      this.isInitialized = true;
      console.log('Strategy Market Data Service initialized');
    } catch (error) {
      console.error('Error initializing Strategy Market Data Service:', error);
      throw error;
    }
  }

  /**
   * Subscribe to market data for all active strategies
   */
  private async subscribeToActiveStrategies(): Promise<void> {
    const strategies = this.strategyRegistry.getAllStrategies();
    
    for (const strategy of strategies) {
      if (strategy.state === 'ACTIVE') {
        await this.subscribeStrategyToMarketData(strategy);
      }
    }
  }

  /**
   * Subscribe a strategy to market data
   * @param strategy Strategy to subscribe
   */
  private async subscribeStrategyToMarketData(strategy: IStrategy): Promise<void> {
    const symbols = strategy.supportedAssets;
    
    if (!symbols || symbols.length === 0) {
      return;
    }

    // Store the symbols for this strategy
    this.strategySymbols.set(strategy.id, new Set(symbols));

    // Subscribe to market data for each symbol
    for (const symbol of symbols) {
      // Add this strategy to the symbol's subscribers
      if (!this.subscriptions.has(symbol)) {
        this.subscriptions.set(symbol, new Set());
      }
      this.subscriptions.get(symbol)!.add(strategy.id);

      // If this is the first strategy subscribing to this symbol, subscribe to market data
      if (this.subscriptions.get(symbol)!.size === 1) {
        await this.subscribeToSymbol(symbol);
      }
    }
  }

  /**
   * Subscribe to market data for a symbol
   * @param symbol Symbol to subscribe to
   */
  private async subscribeToSymbol(symbol: string): Promise<void> {
    if (!this.marketDataService || this.connectionState !== ConnectionState.CONNECTED) {
      console.log(`Will subscribe to ${symbol} when connected`);
      return;
    }

    try {
      // Subscribe to quotes, trades, and bars
      this.marketDataService.subscribeMarketData(
        MarketDataType.QUOTES,
        [symbol],
        this.handleQuoteData.bind(this)
      );

      this.marketDataService.subscribeMarketData(
        MarketDataType.TRADES,
        [symbol],
        this.handleTradeData.bind(this)
      );

      this.marketDataService.subscribeMarketData(
        MarketDataType.BARS,
        [symbol],
        this.handleBarData.bind(this)
      );

      console.log(`Subscribed to market data for ${symbol}`);
    } catch (error) {
      console.error(`Error subscribing to market data for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe a strategy from market data
   * @param strategyId Strategy ID to unsubscribe
   */
  private async unsubscribeStrategyFromMarketData(strategyId: string): Promise<void> {
    const symbols = this.strategySymbols.get(strategyId);
    
    if (!symbols) {
      return;
    }

    // Unsubscribe from each symbol
    for (const symbol of symbols) {
      const subscribers = this.subscriptions.get(symbol);
      
      if (subscribers) {
        subscribers.delete(strategyId);
        
        // If no more strategies are subscribed to this symbol, unsubscribe from market data
        if (subscribers.size === 0) {
          await this.unsubscribeFromSymbol(symbol);
          this.subscriptions.delete(symbol);
        }
      }
    }

    // Remove the strategy's symbols
    this.strategySymbols.delete(strategyId);
  }

  /**
   * Unsubscribe from market data for a symbol
   * @param symbol Symbol to unsubscribe from
   */
  private async unsubscribeFromSymbol(symbol: string): Promise<void> {
    if (!this.marketDataService || this.connectionState !== ConnectionState.CONNECTED) {
      return;
    }

    try {
      // Get all subscriptions for this symbol
      const subscriptions = this.marketDataService.getSubscriptions()
        .filter(sub => sub.symbols.includes(symbol));
      
      // Unsubscribe from each subscription
      for (const subscription of subscriptions) {
        this.marketDataService.unsubscribeMarketData(subscription.id);
      }

      console.log(`Unsubscribed from market data for ${symbol}`);
    } catch (error) {
      console.error(`Error unsubscribing from market data for ${symbol}:`, error);
    }
  }

  /**
   * Handle connection state changes
   * @param state New connection state
   */
  private handleConnectionStateChange(state: ConnectionState): void {
    this.connectionState = state;
    
    if (state === ConnectionState.CONNECTED) {
      // Resubscribe to all symbols when connected
      this.resubscribeAll();
    }
    
    this.emit('connection_state_changed', state);
  }

  /**
   * Resubscribe to all symbols
   */
  private async resubscribeAll(): Promise<void> {
    for (const symbol of this.subscriptions.keys()) {
      await this.subscribeToSymbol(symbol);
    }
  }

  /**
   * Handle market data
   * @param data Market data
   */
  private handleMarketData(data: any): void {
    // Skip non-market data messages
    if (!data.type || !data.symbol) {
      return;
    }

    // Validate the data
    const validator = this.dataValidators.get(data.type as MarketDataType);
    if (validator && !validator(data)) {
      console.warn(`Invalid market data received for ${data.symbol}:`, data);
      return;
    }

    // Normalize the data
    const normalizer = this.dataNormalizers.get(data.type as MarketDataType);
    const normalizedData = normalizer ? normalizer(data) : data;

    // Distribute the data to strategies
    this.distributeDataToStrategies(data.symbol, data.type, normalizedData);
  }

  /**
   * Handle quote data
   * @param data Quote data
   */
  private handleQuoteData(data: any): void {
    if (!data || !data.symbol) {
      return;
    }

    // Distribute the data to strategies
    this.distributeDataToStrategies(data.symbol, 'quote', data);
  }

  /**
   * Handle trade data
   * @param data Trade data
   */
  private handleTradeData(data: any): void {
    if (!data || !data.symbol) {
      return;
    }

    // Distribute the data to strategies
    this.distributeDataToStrategies(data.symbol, 'trade', data);
  }

  /**
   * Handle bar data
   * @param data Bar data
   */
  private handleBarData(data: any): void {
    if (!data || !data.symbol) {
      return;
    }

    // Distribute the data to strategies
    this.distributeDataToStrategies(data.symbol, 'bar', data);
  }

  /**
   * Distribute data to strategies
   * @param symbol Symbol
   * @param dataType Data type
   * @param data Data
   */
  private distributeDataToStrategies(symbol: string, dataType: string, data: any): void {
    const subscribers = this.subscriptions.get(symbol);
    
    if (!subscribers) {
      return;
    }

    // Distribute to each strategy
    for (const strategyId of subscribers) {
      const strategy = this.strategyRegistry.getStrategy(strategyId);
      
      if (strategy) {
        try {
          // Call the appropriate method on the strategy
          switch (dataType) {
            case 'quote':
            case MarketDataType.QUOTES:
              if (typeof strategy.onQuote === 'function') {
                strategy.onQuote(symbol, data);
              }
              break;
            case 'trade':
            case MarketDataType.TRADES:
              if (typeof strategy.onTrade === 'function') {
                strategy.onTrade(symbol, data);
              }
              break;
            case 'bar':
            case MarketDataType.BARS:
              if (typeof strategy.onBar === 'function') {
                strategy.onBar(symbol, data);
              }
              break;
            default:
              if (typeof strategy.onMarketData === 'function') {
                strategy.onMarketData(symbol, dataType, data);
              }
              break;
          }
        } catch (error) {
          console.error(`Error distributing ${dataType} data to strategy ${strategyId}:`, error);
        }
      }
    }

    // Emit an event for this data
    this.emit(`market_data:${dataType}:${symbol}`, data);
  }

  /**
   * Handle errors
   * @param error Error
   */
  private handleError(error: any): void {
    console.error('Market data error:', error);
    this.emit('error', error);
  }

  /**
   * Handle strategy added
   * @param strategy Strategy that was added
   */
  private handleStrategyAdded(strategy: IStrategy): void {
    if (strategy.state === 'ACTIVE') {
      this.subscribeStrategyToMarketData(strategy);
    }
  }

  /**
   * Handle strategy removed
   * @param strategyId ID of the strategy that was removed
   */
  private handleStrategyRemoved(strategyId: string): void {
    this.unsubscribeStrategyFromMarketData(strategyId);
  }

  /**
   * Handle strategy updated
   * @param strategy Strategy that was updated
   */
  private handleStrategyUpdated(strategy: IStrategy): void {
    // If the strategy is now active, subscribe it
    if (strategy.state === 'ACTIVE') {
      this.subscribeStrategyToMarketData(strategy);
    } else {
      // Otherwise, unsubscribe it
      this.unsubscribeStrategyFromMarketData(strategy.id);
    }
  }

  /**
   * Set up data validators
   */
  private setupDataValidators(): void {
    // Quote validator
    this.dataValidators.set(MarketDataType.QUOTES, (data: any) => {
      return (
        data &&
        typeof data.symbol === 'string' &&
        typeof data.data === 'object' &&
        typeof data.data.bid === 'number' &&
        typeof data.data.ask === 'number'
      );
    });

    // Trade validator
    this.dataValidators.set(MarketDataType.TRADES, (data: any) => {
      return (
        data &&
        typeof data.symbol === 'string' &&
        typeof data.data === 'object' &&
        typeof data.data.price === 'number' &&
        typeof data.data.size === 'number'
      );
    });

    // Bar validator
    this.dataValidators.set(MarketDataType.BARS, (data: any) => {
      return (
        data &&
        typeof data.symbol === 'string' &&
        typeof data.data === 'object' &&
        typeof data.data.open === 'number' &&
        typeof data.data.high === 'number' &&
        typeof data.data.low === 'number' &&
        typeof data.data.close === 'number' &&
        typeof data.data.volume === 'number'
      );
    });
  }

  /**
   * Set up data normalizers
   */
  private setupDataNormalizers(): void {
    // Quote normalizer
    this.dataNormalizers.set(MarketDataType.QUOTES, (data: any) => {
      return {
        symbol: data.symbol,
        timestamp: data.data.timestamp || Date.now(),
        bid: data.data.bid,
        bidSize: data.data.bidSize,
        ask: data.data.ask,
        askSize: data.data.askSize,
        spread: data.data.ask - data.data.bid,
        midpoint: (data.data.ask + data.data.bid) / 2
      };
    });

    // Trade normalizer
    this.dataNormalizers.set(MarketDataType.TRADES, (data: any) => {
      return {
        symbol: data.symbol,
        timestamp: data.data.timestamp || Date.now(),
        price: data.data.price,
        size: data.data.size,
        exchange: data.data.exchange,
        tradeId: data.data.tradeId
      };
    });

    // Bar normalizer
    this.dataNormalizers.set(MarketDataType.BARS, (data: any) => {
      return {
        symbol: data.symbol,
        timestamp: data.data.timestamp || Date.now(),
        open: data.data.open,
        high: data.data.high,
        low: data.data.low,
        close: data.data.close,
        volume: data.data.volume,
        vwap: data.data.volume > 0 ? data.data.close * data.data.volume : data.data.close,
        change: data.data.close - data.data.open,
        changePercent: ((data.data.close - data.data.open) / data.data.open) * 100
      };
    });
  }

  /**
   * Get the connection state
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Get all subscriptions
   */
  public getSubscriptions(): Map<string, Set<string>> {
    return new Map(this.subscriptions);
  }

  /**
   * Get all strategy symbols
   */
  public getStrategySymbols(): Map<string, Set<string>> {
    return new Map(this.strategySymbols);
  }

  /**
   * Check if a symbol is subscribed
   * @param symbol Symbol to check
   */
  public isSymbolSubscribed(symbol: string): boolean {
    return this.subscriptions.has(symbol) && this.subscriptions.get(symbol)!.size > 0;
  }

  /**
   * Check if a strategy is subscribed to a symbol
   * @param strategyId Strategy ID
   * @param symbol Symbol
   */
  public isStrategySubscribedToSymbol(strategyId: string, symbol: string): boolean {
    const subscribers = this.subscriptions.get(symbol);
    return subscribers ? subscribers.has(strategyId) : false;
  }

  /**
   * Get all symbols subscribed by a strategy
   * @param strategyId Strategy ID
   */
  public getSymbolsForStrategy(strategyId: string): string[] {
    const symbols = this.strategySymbols.get(strategyId);
    return symbols ? Array.from(symbols) : [];
  }

  /**
   * Get all strategies subscribed to a symbol
   * @param symbol Symbol
   */
  public getStrategiesForSymbol(symbol: string): string[] {
    const subscribers = this.subscriptions.get(symbol);
    return subscribers ? Array.from(subscribers) : [];
  }
}

// Export singleton instance
export const strategyMarketDataService = StrategyMarketDataService.getInstance();