import { EventEmitter } from 'events';
import { 
  IMarketDataProvider, 
  ConnectionStatus, 
  MarketDataType, 
  MarketDataEventType,
  Quote,
  Trade,
  OrderBook,
  Bar,
  MarketData
} from './IMarketDataProvider';
import { AlpacaMarketDataProvider } from './AlpacaMarketDataProvider';

/**
 * Market Data Service
 * 
 * Central service for managing market data providers and distributing data to consumers
 */
export class MarketDataService {
  private static instance: MarketDataService;
  
  private providers: Map<string, IMarketDataProvider> = new Map();
  private defaultProviderId?: string;
  private eventEmitter: EventEmitter = new EventEmitter();
  private symbolProviderMap: Map<string, string> = new Map(); // Maps symbols to providers
  private isInitialized: boolean = false;
  
  // Cache for latest data
  private latestQuotes: Map<string, Quote> = new Map();
  private latestTrades: Map<string, Trade> = new Map();
  private latestBars: Map<string, Map<string, Bar>> = new Map(); // symbol -> timeframe -> bar
  private orderBooks: Map<string, OrderBook> = new Map();
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}
  
  /**
   * Get the singleton instance
   * @returns The singleton instance
   */
  public static getInstance(): MarketDataService {
    if (!MarketDataService.instance) {
      MarketDataService.instance = new MarketDataService();
    }
    return MarketDataService.instance;
  }
  
  /**
   * Initialize the market data service
   * @param config Configuration for the service
   */
  public async initialize(config: Record<string, any>): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    try {
      // Create default providers based on config
      if (config.alpaca) {
        const alpacaProvider = new AlpacaMarketDataProvider();
        await alpacaProvider.initialize(config.alpaca);
        this.registerProvider(alpacaProvider);
        
        // Set as default if requested or if it's the only provider
        if (config.defaultProvider === 'alpaca' || !this.defaultProviderId) {
          this.defaultProviderId = alpacaProvider.id;
        }
      }
      
      // Add more providers here as needed
      
      // Set up event forwarding for all providers
      for (const [providerId, provider] of this.providers.entries()) {
        this.setupProviderEventForwarding(providerId, provider);
      }
      
      this.isInitialized = true;
      console.log('Market Data Service initialized');
    } catch (error) {
      console.error('Error initializing Market Data Service:', error);
      throw error;
    }
  }
  
  /**
   * Register a market data provider
   * @param provider Provider to register
   */
  public registerProvider(provider: IMarketDataProvider): void {
    if (this.providers.has(provider.id)) {
      throw new Error(`Provider with ID ${provider.id} is already registered`);
    }
    
    this.providers.set(provider.id, provider);
    this.setupProviderEventForwarding(provider.id, provider);
    
    // Set as default if no default is set
    if (!this.defaultProviderId) {
      this.defaultProviderId = provider.id;
    }
  }
  
  /**
   * Unregister a market data provider
   * @param providerId ID of the provider to unregister
   */
  public async unregisterProvider(providerId: string): Promise<boolean> {
    const provider = this.providers.get(providerId);
    
    if (!provider) {
      return false;
    }
    
    // Disconnect the provider
    if (provider.getStatus() !== ConnectionStatus.DISCONNECTED) {
      await provider.disconnect();
    }
    
    // Remove the provider
    this.providers.delete(providerId);
    
    // Update symbol provider map
    for (const [symbol, mappedProviderId] of this.symbolProviderMap.entries()) {
      if (mappedProviderId === providerId) {
        this.symbolProviderMap.delete(symbol);
      }
    }
    
    // Update default provider if needed
    if (this.defaultProviderId === providerId) {
      this.defaultProviderId = this.providers.size > 0 ? 
        Array.from(this.providers.keys())[0] : undefined;
    }
    
    return true;
  }
  
  /**
   * Get a provider by ID
   * @param providerId ID of the provider
   * @returns The provider, or undefined if not found
   */
  public getProvider(providerId: string): IMarketDataProvider | undefined {
    return this.providers.get(providerId);
  }
  
  /**
   * Get all registered providers
   * @returns Array of all registered providers
   */
  public getAllProviders(): IMarketDataProvider[] {
    return Array.from(this.providers.values());
  }
  
  /**
   * Set the default provider
   * @param providerId ID of the provider to use as default
   */
  public setDefaultProvider(providerId: string): void {
    if (!this.providers.has(providerId)) {
      throw new Error(`Provider with ID ${providerId} is not registered`);
    }
    
    this.defaultProviderId = providerId;
  }
  
  /**
   * Get the default provider
   * @returns The default provider
   */
  public getDefaultProvider(): IMarketDataProvider {
    if (!this.defaultProviderId || !this.providers.has(this.defaultProviderId)) {
      throw new Error('No default provider set');
    }
    
    return this.providers.get(this.defaultProviderId)!;
  }
  
  /**
   * Connect to a provider
   * @param providerId ID of the provider to connect to
   */
  public async connectProvider(providerId: string): Promise<void> {
    const provider = this.providers.get(providerId);
    
    if (!provider) {
      throw new Error(`Provider with ID ${providerId} is not registered`);
    }
    
    await provider.connect();
  }
  
  /**
   * Connect to all providers
   */
  public async connectAllProviders(): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (const provider of this.providers.values()) {
      promises.push(provider.connect());
    }
    
    await Promise.all(promises);
  }
  
  /**
   * Disconnect from a provider
   * @param providerId ID of the provider to disconnect from
   */
  public async disconnectProvider(providerId: string): Promise<void> {
    const provider = this.providers.get(providerId);
    
    if (!provider) {
      throw new Error(`Provider with ID ${providerId} is not registered`);
    }
    
    await provider.disconnect();
  }
  
  /**
   * Disconnect from all providers
   */
  public async disconnectAllProviders(): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (const provider of this.providers.values()) {
      promises.push(provider.disconnect());
    }
    
    await Promise.all(promises);
  }
  
  /**
   * Subscribe to market data for a symbol
   * @param symbol Symbol to subscribe to
   * @param dataTypes Types of data to subscribe to
   * @param providerId Optional provider ID to use
   */
  public async subscribe(
    symbol: string,
    dataTypes: MarketDataType[],
    providerId?: string
  ): Promise<void> {
    // Determine which provider to use
    const targetProviderId = providerId || this.getProviderForSymbol(symbol);
    const provider = this.providers.get(targetProviderId);
    
    if (!provider) {
      throw new Error(`Provider with ID ${targetProviderId} is not registered`);
    }
    
    // Subscribe
    await provider.subscribe(symbol, dataTypes);
    
    // Update symbol provider map
    this.symbolProviderMap.set(symbol, targetProviderId);
  }
  
  /**
   * Unsubscribe from market data for a symbol
   * @param symbol Symbol to unsubscribe from
   * @param dataTypes Types of data to unsubscribe from
   */
  public async unsubscribe(symbol: string, dataTypes?: MarketDataType[]): Promise<void> {
    // Check if we have a provider for this symbol
    const providerId = this.symbolProviderMap.get(symbol);
    
    if (!providerId) {
      return; // Not subscribed
    }
    
    const provider = this.providers.get(providerId);
    
    if (!provider) {
      this.symbolProviderMap.delete(symbol);
      return;
    }
    
    // Unsubscribe
    await provider.unsubscribe(symbol, dataTypes);
    
    // If no data types specified, remove from symbol provider map
    if (!dataTypes) {
      this.symbolProviderMap.delete(symbol);
    }
  }
  
  /**
   * Get historical market data for a symbol
   * @param symbol Symbol to get data for
   * @param timeframe Timeframe for the data
   * @param start Start time for the data
   * @param end End time for the data
   * @param limit Maximum number of data points to return
   * @param providerId Optional provider ID to use
   */
  public async getHistoricalData(
    symbol: string,
    timeframe: string,
    start: Date,
    end: Date,
    limit?: number,
    providerId?: string
  ): Promise<MarketData[]> {
    // Determine which provider to use
    const targetProviderId = providerId || this.getProviderForSymbol(symbol);
    const provider = this.providers.get(targetProviderId);
    
    if (!provider) {
      throw new Error(`Provider with ID ${targetProviderId} is not registered`);
    }
    
    return await provider.getHistoricalData(symbol, timeframe, start, end, limit);
  }
  
  /**
   * Get the latest quote for a symbol
   * @param symbol Symbol to get quote for
   * @param providerId Optional provider ID to use
   */
  public async getQuote(symbol: string, providerId?: string): Promise<Quote> {
    // Check cache first
    const cachedQuote = this.latestQuotes.get(symbol);
    
    if (cachedQuote) {
      return cachedQuote;
    }
    
    // Determine which provider to use
    const targetProviderId = providerId || this.getProviderForSymbol(symbol);
    const provider = this.providers.get(targetProviderId);
    
    if (!provider) {
      throw new Error(`Provider with ID ${targetProviderId} is not registered`);
    }
    
    const quote = await provider.getQuote(symbol);
    
    // Update cache
    this.latestQuotes.set(symbol, quote);
    
    return quote;
  }
  
  /**
   * Get the latest trade for a symbol
   * @param symbol Symbol to get trade for
   * @param providerId Optional provider ID to use
   */
  public async getTrade(symbol: string, providerId?: string): Promise<Trade> {
    // Check cache first
    const cachedTrade = this.latestTrades.get(symbol);
    
    if (cachedTrade) {
      return cachedTrade;
    }
    
    // Determine which provider to use
    const targetProviderId = providerId || this.getProviderForSymbol(symbol);
    const provider = this.providers.get(targetProviderId);
    
    if (!provider) {
      throw new Error(`Provider with ID ${targetProviderId} is not registered`);
    }
    
    const trade = await provider.getTrade(symbol);
    
    // Update cache
    this.latestTrades.set(symbol, trade);
    
    return trade;
  }
  
  /**
   * Get the order book for a symbol
   * @param symbol Symbol to get order book for
   * @param depth Depth of the order book
   * @param providerId Optional provider ID to use
   */
  public async getOrderBook(
    symbol: string,
    depth?: number,
    providerId?: string
  ): Promise<OrderBook> {
    // Check cache first
    const cachedOrderBook = this.orderBooks.get(symbol);
    
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
    
    // Determine which provider to use
    const targetProviderId = providerId || this.getProviderForSymbol(symbol);
    const provider = this.providers.get(targetProviderId);
    
    if (!provider) {
      throw new Error(`Provider with ID ${targetProviderId} is not registered`);
    }
    
    const orderBook = await provider.getOrderBook(symbol, depth);
    
    // Update cache
    this.orderBooks.set(symbol, orderBook);
    
    return orderBook;
  }
  
  /**
   * Add a listener for market data events
   * @param eventType Type of event to listen for
   * @param listener Listener function
   */
  public addListener(eventType: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(eventType, listener);
  }
  
  /**
   * Remove a listener for market data events
   * @param eventType Type of event to listen for
   * @param listener Listener function
   */
  public removeListener(eventType: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(eventType, listener);
  }
  
  /**
   * Get the provider ID for a symbol
   * @param symbol Symbol to get provider for
   * @returns Provider ID
   */
  private getProviderForSymbol(symbol: string): string {
    // Check if we have a provider for this symbol
    const providerId = this.symbolProviderMap.get(symbol);
    
    if (providerId && this.providers.has(providerId)) {
      return providerId;
    }
    
    // Use default provider
    if (!this.defaultProviderId) {
      throw new Error('No default provider set');
    }
    
    return this.defaultProviderId;
  }
  
  /**
   * Set up event forwarding for a provider
   * @param providerId ID of the provider
   * @param provider Provider to set up event forwarding for
   */
  private setupProviderEventForwarding(providerId: string, provider: IMarketDataProvider): void {
    // Forward all events from the provider to our event emitter
    Object.values(MarketDataEventType).forEach(eventType => {
      provider.addListener(eventType, (data: any) => {
        // Add provider ID to the event data
        const eventData = {
          ...data,
          providerId
        };
        
        // Update our cache for certain event types
        switch (eventType) {
          case MarketDataEventType.TRADE:
            this.latestTrades.set(data.symbol, data);
            break;
            
          case MarketDataEventType.QUOTE:
            this.latestQuotes.set(data.symbol, data);
            break;
            
          case MarketDataEventType.BAR:
            let timeframeMap = this.latestBars.get(data.symbol);
            if (!timeframeMap) {
              timeframeMap = new Map();
              this.latestBars.set(data.symbol, timeframeMap);
            }
            timeframeMap.set(data.timeframe, data);
            break;
            
          case MarketDataEventType.ORDER_BOOK:
            this.orderBooks.set(data.symbol, data);
            break;
        }
        
        // Emit the event
        this.eventEmitter.emit(eventType, eventData);
        
        // Also emit a combined event for the symbol
        this.eventEmitter.emit(`${eventType}:${data.symbol}`, eventData);
      });
    });
  }
}

// Re-export types for convenience
export {
  ConnectionStatus,
  MarketDataType,
  MarketDataEventType,
  Quote,
  Trade,
  OrderBook,
  MarketData
} from './IMarketDataProvider';