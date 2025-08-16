import { alpacaDataApi, alpacaTradingApi } from './AlpacaApiService';
import { iexCloudApi } from './IEXCloudApiService';
import { polygonApi } from './PolygonApiService';
import { fmpApi } from './FMPApiService';
import { store } from '../../../store';
import { addNotification } from '../../../store/slices/uiSlice';

/**
 * Data provider types
 */
export enum DataProviderType {
  ALPACA = 'alpaca',
  IEX_CLOUD = 'iex_cloud',
  POLYGON = 'polygon',
  FMP = 'fmp'
}

/**
 * Data quality score
 */
export interface DataQualityScore {
  provider: DataProviderType;
  score: number;
  timestamp: number;
  latency: number;
  completeness: number;
  reliability: number;
}

/**
 * Unified Data Provider service
 * Provides a unified interface to multiple data providers with fallback mechanisms
 */
export class UnifiedDataProvider {
  private dataQualityScores: Record<string, DataQualityScore[]> = {};
  private cacheData: Record<string, { data: any; timestamp: number; ttl: number }> = {};
  private prefetchQueue: string[] = [];
  private isPrefetching: boolean = false;
  private prefetchInterval: NodeJS.Timeout | null = null;
  private readonly DEFAULT_TTL = 60000; // 1 minute default TTL
  private readonly MAX_CACHE_ITEMS = 1000;
  private readonly PREFETCH_INTERVAL = 60000; // 1 minute
  private readonly PREFETCH_BATCH_SIZE = 10;

  constructor() {
    // Start prefetch process
    this.startPrefetching();
  }

  /**
   * Start the prefetching process
   */
  private startPrefetching(): void {
    if (this.prefetchInterval) {
      clearInterval(this.prefetchInterval);
    }

    this.prefetchInterval = setInterval(() => {
      this.processPrefetchQueue();
    }, this.PREFETCH_INTERVAL);
  }

  /**
   * Process the prefetch queue
   */
  private async processPrefetchQueue(): Promise<void> {
    if (this.isPrefetching || this.prefetchQueue.length === 0) {
      return;
    }

    this.isPrefetching = true;

    try {
      // Take a batch of items from the queue
      const batch = this.prefetchQueue.splice(0, this.PREFETCH_BATCH_SIZE);

      // Process each item in parallel
      await Promise.allSettled(
        batch.map(async (cacheKey) => {
          const [method, ...params] = cacheKey.split('|');
          try {
            // Call the method without using cache
            await (this as any)[method](...params.map(p => JSON.parse(p)), { useCache: false });
            console.log(`Prefetched: ${cacheKey}`);
          } catch (error) {
            console.error(`Prefetch failed for ${cacheKey}:`, error);
          }
        })
      );
    } finally {
      this.isPrefetching = false;
    }
  }

  /**
   * Add an item to the prefetch queue
   * @param method Method name
   * @param params Method parameters
   */
  public addToPrefetchQueue(method: string, ...params: any[]): void {
    // Create a cache key
    const cacheKey = this.createCacheKey(method, params);

    // Add to queue if not already in queue
    if (!this.prefetchQueue.includes(cacheKey)) {
      this.prefetchQueue.push(cacheKey);
    }
  }

  /**
   * Create a cache key from method name and parameters
   * @param method Method name
   * @param params Method parameters
   */
  private createCacheKey(method: string, params: any[]): string {
    return `${method}|${params.map(p => JSON.stringify(p)).join('|')}`;
  }

  /**
   * Get data from cache
   * @param cacheKey Cache key
   */
  private getCachedData(cacheKey: string): any | null {
    const cachedItem = this.cacheData[cacheKey];

    if (!cachedItem) {
      return null;
    }

    // Check if cache is still valid
    if (Date.now() - cachedItem.timestamp > cachedItem.ttl) {
      delete this.cacheData[cacheKey];
      return null;
    }

    return cachedItem.data;
  }

  /**
   * Set data in cache
   * @param cacheKey Cache key
   * @param data Data to cache
   * @param ttl Time to live in milliseconds
   */
  private setCachedData(cacheKey: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    // Check if we need to clean up the cache
    if (Object.keys(this.cacheData).length >= this.MAX_CACHE_ITEMS) {
      this.cleanCache();
    }

    this.cacheData[cacheKey] = {
      data,
      timestamp: Date.now(),
      ttl
    };
  }

  /**
   * Clean the cache by removing oldest items
   */
  private cleanCache(): void {
    const cacheKeys = Object.keys(this.cacheData);
    const sortedKeys = cacheKeys.sort((a, b) => {
      return this.cacheData[a].timestamp - this.cacheData[b].timestamp;
    });

    // Remove oldest 20% of items
    const removeCount = Math.floor(sortedKeys.length * 0.2);
    for (let i = 0; i < removeCount; i++) {
      delete this.cacheData[sortedKeys[i]];
    }
  }

  /**
   * Update data quality score for a provider
   * @param provider Provider type
   * @param dataType Data type
   * @param latency Request latency in milliseconds
   * @param completeness Data completeness score (0-1)
   * @param reliability Provider reliability score (0-1)
   */
  private updateDataQualityScore(
    provider: DataProviderType,
    dataType: string,
    latency: number,
    completeness: number,
    reliability: number
  ): void {
    if (!this.dataQualityScores[dataType]) {
      this.dataQualityScores[dataType] = [];
    }

    // Calculate overall score (lower is better)
    // Weight: latency 40%, completeness 30%, reliability 30%
    const normalizedLatency = Math.min(latency / 1000, 1); // Normalize to 0-1, cap at 1
    const score = (normalizedLatency * 0.4) + ((1 - completeness) * 0.3) + ((1 - reliability) * 0.3);

    // Find existing score for this provider
    const existingScoreIndex = this.dataQualityScores[dataType].findIndex(s => s.provider === provider);

    if (existingScoreIndex >= 0) {
      // Update existing score
      this.dataQualityScores[dataType][existingScoreIndex] = {
        provider,
        score,
        timestamp: Date.now(),
        latency,
        completeness,
        reliability
      };
    } else {
      // Add new score
      this.dataQualityScores[dataType].push({
        provider,
        score,
        timestamp: Date.now(),
        latency,
        completeness,
        reliability
      });
    }
  }

  /**
   * Get the best provider for a data type
   * @param dataType Data type
   * @returns Best provider type
   */
  private getBestProvider(dataType: string): DataProviderType {
    if (!this.dataQualityScores[dataType] || this.dataQualityScores[dataType].length === 0) {
      // Default to Alpaca if no scores available
      return DataProviderType.ALPACA;
    }

    // Sort by score (lower is better)
    const sortedScores = [...this.dataQualityScores[dataType]].sort((a, b) => a.score - b.score);
    return sortedScores[0].provider;
  }

  /**
   * Get all providers for a data type in order of preference
   * @param dataType Data type
   * @returns Array of provider types in order of preference
   */
  private getProvidersByPreference(dataType: string): DataProviderType[] {
    if (!this.dataQualityScores[dataType] || this.dataQualityScores[dataType].length === 0) {
      // Default order if no scores available
      return [DataProviderType.ALPACA, DataProviderType.POLYGON, DataProviderType.FMP, DataProviderType.IEX_CLOUD];
    }

    // Sort by score (lower is better)
    const sortedScores = [...this.dataQualityScores[dataType]].sort((a, b) => a.score - b.score);
    return sortedScores.map(s => s.provider);
  }

  /**
   * Execute a request with fallback to other providers
   * @param dataType Data type
   * @param primaryRequest Primary request function
   * @param fallbackRequests Fallback request functions
   * @param options Request options
   */
  private async executeWithFallback<T>(
    dataType: string,
    primaryRequest: () => Promise<T>,
    fallbackRequests: (() => Promise<T>)[],
    options: {
      useCache?: boolean;
      cacheTtl?: number;
      cacheKey?: string;
    } = {}
  ): Promise<T> {
    const { useCache = true, cacheTtl = this.DEFAULT_TTL, cacheKey } = options;

    // Check cache if enabled
    if (useCache && cacheKey && this.getCachedData(cacheKey) !== null) {
      return this.getCachedData(cacheKey);
    }

    // Try primary request
    const startTime = Date.now();
    try {
      const data = await primaryRequest();
      const latency = Date.now() - startTime;

      // Update quality score
      this.updateDataQualityScore(
        this.getBestProvider(dataType),
        dataType,
        latency,
        this.calculateCompleteness(data),
        1.0 // Successful request gets full reliability
      );

      // Cache the result if caching is enabled
      if (useCache && cacheKey) {
        this.setCachedData(cacheKey, data, cacheTtl);
      }

      return data;
    } catch (error) {
      console.error(`Primary request failed for ${dataType}:`, error);

      // Update quality score for failed request
      this.updateDataQualityScore(
        this.getBestProvider(dataType),
        dataType,
        Date.now() - startTime,
        0, // Failed request gets 0 completeness
        0  // Failed request gets 0 reliability
      );

      // Try fallback requests
      for (let i = 0; i < fallbackRequests.length; i++) {
        const fallbackStartTime = Date.now();
        try {
          const data = await fallbackRequests[i]();
          const latency = Date.now() - fallbackStartTime;

          // Update quality score for successful fallback
          const providers = this.getProvidersByPreference(dataType);
          if (providers.length > i + 1) {
            this.updateDataQualityScore(
              providers[i + 1],
              dataType,
              latency,
              this.calculateCompleteness(data),
              0.8 // Fallback gets slightly lower reliability
            );
          }

          // Cache the result if caching is enabled
          if (useCache && cacheKey) {
            this.setCachedData(cacheKey, data, cacheTtl);
          }

          // Notify user about fallback
          store.dispatch(addNotification({
            type: 'info',
            title: 'Using Fallback Data Source',
            message: `Primary data source for ${dataType} failed. Using fallback source.`,
            autoHideDuration: 5000,
          }));

          return data;
        } catch (fallbackError) {
          console.error(`Fallback request ${i + 1} failed for ${dataType}:`, fallbackError);

          // Update quality score for failed fallback
          const providers = this.getProvidersByPreference(dataType);
          if (providers.length > i + 1) {
            this.updateDataQualityScore(
              providers[i + 1],
              dataType,
              Date.now() - fallbackStartTime,
              0, // Failed request gets 0 completeness
              0  // Failed request gets 0 reliability
            );
          }
        }
      }

      // All requests failed
      store.dispatch(addNotification({
        type: 'error',
        title: 'Data Retrieval Failed',
        message: `Failed to retrieve ${dataType} data from all sources.`,
        autoHideDuration: 10000,
      }));

      throw new Error(`All requests failed for ${dataType}`);
    }
  }

  /**
   * Calculate completeness score for data
   * @param data Data to evaluate
   * @returns Completeness score (0-1)
   */
  private calculateCompleteness(data: any): number {
    if (!data) {
      return 0;
    }

    // Array completeness
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return 0.5; // Empty array is partially complete
      }
      return 1.0; // Non-empty array is complete
    }

    // Object completeness
    if (typeof data === 'object') {
      const keys = Object.keys(data);
      if (keys.length === 0) {
        return 0.5; // Empty object is partially complete
      }
      return 1.0; // Non-empty object is complete
    }

    // Primitive value
    return data !== undefined && data !== null ? 1.0 : 0;
  }

  /**
   * Get stock quote
   * @param symbol Stock symbol
   * @param options Request options
   */
  public async getQuote(symbol: string, options: {
    useCache?: boolean;
    cacheTtl?: number;
  } = {}): Promise<any> {
    const cacheKey = this.createCacheKey('getQuote', [symbol]);

    return this.executeWithFallback(
      'quote',
      // Primary request (Alpaca)
      () => alpacaDataApi.getQuotes([symbol]).then(quotes => quotes[symbol]),
      [
        // Fallback 1 (Polygon)
        () => polygonApi.getLastQuote(symbol),
        // Fallback 2 (FMP)
        () => fmpApi.getQuote(symbol).then(quotes => Array.isArray(quotes) ? quotes[0] : quotes),
        // Fallback 3 (IEX Cloud)
        () => iexCloudApi.getQuote(symbol)
      ],
      { ...options, cacheKey }
    );
  }

  /**
   * Get multiple stock quotes
   * @param symbols Array of stock symbols
   * @param options Request options
   */
  public async getQuotes(symbols: string[], options: {
    useCache?: boolean;
    cacheTtl?: number;
  } = {}): Promise<Record<string, any>> {
    const cacheKey = this.createCacheKey('getQuotes', [symbols]);

    return this.executeWithFallback(
      'quotes',
      // Primary request (Alpaca)
      () => alpacaDataApi.getQuotes(symbols),
      [
        // Fallback 1 (FMP)
        () => fmpApi.getQuote(symbols).then(quotes => {
          // Convert array to object with symbol keys
          const result: Record<string, any> = {};
          if (Array.isArray(quotes)) {
            quotes.forEach(quote => {
              if (quote.symbol) {
                result[quote.symbol] = quote;
              }
            });
          }
          return result;
        }),
        // Fallback 2 (IEX Cloud)
        () => iexCloudApi.getBatch(symbols, ['quote']),
        // Fallback 3 (Polygon - sequential requests)
        async () => {
          const quotes: Record<string, any> = {};
          await Promise.all(
            symbols.map(async symbol => {
              try {
                quotes[symbol] = await polygonApi.getLastQuote(symbol);
              } catch (error) {
                console.error(`Failed to get quote for ${symbol} from Polygon:`, error);
              }
            })
          );
          return quotes;
        }
      ],
      { ...options, cacheKey }
    );
  }

  /**
   * Get historical bars (OHLCV) data
   * @param symbol Stock symbol
   * @param timeframe Timeframe
   * @param start Start date
   * @param end End date
   * @param options Request options
   */
  public async getBars(
    symbol: string,
    timeframe: string,
    start: string,
    end: string,
    options: {
      useCache?: boolean;
      cacheTtl?: number;
      limit?: number;
    } = {}
  ): Promise<any[]> {
    const { limit, ...restOptions } = options;
    const cacheKey = this.createCacheKey('getBars', [symbol, timeframe, start, end, limit]);

    // Convert timeframe to provider-specific format
    const alpacaTimeframe = this.convertTimeframeToAlpaca(timeframe);
    const polygonMultiplier = this.getPolygonTimeframeMultiplier(timeframe);
    const polygonTimespan = this.getPolygonTimeframeTimespan(timeframe);

    return this.executeWithFallback(
      'bars',
      // Primary request (Alpaca)
      () => alpacaDataApi.getBars([symbol], alpacaTimeframe, start, end, limit)
        .then(bars => bars[symbol] || []),
      [
        // Fallback 1 (Polygon)
        () => polygonApi.getAggregates(symbol, polygonMultiplier, polygonTimespan, start, end, {
          limit: limit || 1000,
          adjusted: true
        }).then(response => response.results || []),
        // Fallback 2 (FMP)
        () => fmpApi.getHistoricalPrice(symbol, start, end, timeframe)
          .then(bars => {
            // Map FMP data to standard format
            return Array.isArray(bars) ? bars.map(bar => ({
              t: new Date(bar.date || bar.datetime).getTime(),
              o: bar.open,
              h: bar.high,
              l: bar.low,
              c: bar.close,
              v: bar.volume
            })) : [];
          }),
        // Fallback 3 (IEX Cloud)
        () => {
          // IEX Cloud has limited historical data options
          const range = this.calculateIEXRange(start, end);
          return iexCloudApi.getHistoricalPrices(symbol, range, false);
        }
      ],
      { ...restOptions, cacheKey }
    );
  }

  /**
   * Get company information
   * @param symbol Stock symbol
   * @param options Request options
   */
  public async getCompanyInfo(symbol: string, options: {
    useCache?: boolean;
    cacheTtl?: number;
  } = {}): Promise<any> {
    const cacheKey = this.createCacheKey('getCompanyInfo', [symbol]);

    return this.executeWithFallback(
      'company',
      // Primary request (IEX Cloud)
      () => iexCloudApi.getCompany(symbol),
      [
        // Fallback 1 (FMP)
        () => fmpApi.getCompanyProfile(symbol),
        // Fallback 2 (Polygon)
        () => polygonApi.getTicker(symbol),
        // Fallback 3 (Alpaca)
        () => alpacaTradingApi.getAsset(symbol)
      ],
      { ...options, cacheKey }
    );
  }

  /**
   * Get latest news for a symbol
   * @param symbol Stock symbol
   * @param limit Number of news items to return
   * @param options Request options
   */
  public async getNews(
    symbol: string,
    limit: number = 10,
    options: {
      useCache?: boolean;
      cacheTtl?: number;
    } = {}
  ): Promise<any[]> {
    const cacheKey = this.createCacheKey('getNews', [symbol, limit]);

    return this.executeWithFallback(
      'news',
      // Primary request (IEX Cloud)
      () => iexCloudApi.getNews(symbol, limit),
      [
        // Fallback 1 (FMP)
        () => fmpApi.getNews(symbol, limit),
        // Fallback 2 (Polygon)
        () => polygonApi.getTickerNews(symbol, { limit })
          .then(response => response.results || [])
      ],
      { ...options, cacheKey }
    );
  }

  /**
   * Get market status
   * @param options Request options
   */
  public async getMarketStatus(options: {
    useCache?: boolean;
    cacheTtl?: number;
  } = {}): Promise<any> {
    const cacheKey = this.createCacheKey('getMarketStatus', []);

    return this.executeWithFallback(
      'market_status',
      // Primary request (Alpaca)
      () => alpacaTradingApi.getClock(),
      [
        // Fallback 1 (Polygon)
        () => polygonApi.getMarketStatus(),
        // Fallback 2 (IEX Cloud)
        () => iexCloudApi.getMarket()
      ],
      { ...options, cacheKey }
    );
  }

  /**
   * Get account information
   * @param options Request options
   */
  public async getAccount(options: {
    useCache?: boolean;
    cacheTtl?: number;
  } = {}): Promise<any> {
    const cacheKey = this.createCacheKey('getAccount', []);

    return this.executeWithFallback(
      'account',
      // Primary request (Alpaca)
      () => alpacaTradingApi.getAccount(),
      [],  // No fallbacks for account info
      { ...options, cacheKey }
    );
  }

  /**
   * Get positions
   * @param options Request options
   */
  public async getPositions(options: {
    useCache?: boolean;
    cacheTtl?: number;
  } = {}): Promise<any[]> {
    const cacheKey = this.createCacheKey('getPositions', []);

    return this.executeWithFallback(
      'positions',
      // Primary request (Alpaca)
      () => alpacaTradingApi.getPositions(),
      [],  // No fallbacks for positions
      { ...options, cacheKey }
    );
  }

  /**
   * Get orders
   * @param status Order status filter
   * @param limit Maximum number of orders to return
   * @param options Request options
   */
  public async getOrders(
    status?: string,
    limit?: number,
    options: {
      useCache?: boolean;
      cacheTtl?: number;
    } = {}
  ): Promise<any[]> {
    const cacheKey = this.createCacheKey('getOrders', [status, limit]);

    return this.executeWithFallback(
      'orders',
      // Primary request (Alpaca)
      () => alpacaTradingApi.getOrders(status, limit),
      [],  // No fallbacks for orders
      { ...options, cacheKey }
    );
  }

  /**
   * Place an order
   * @param orderParams Order parameters
   */
  public async placeOrder(orderParams: {
    symbol: string;
    qty: number;
    side: 'buy' | 'sell';
    type: 'market' | 'limit' | 'stop' | 'stop_limit';
    timeInForce: 'day' | 'gtc' | 'ioc' | 'fok';
    limitPrice?: number;
    stopPrice?: number;
    clientOrderId?: string;
    extendedHours?: boolean;
  }): Promise<any> {
    const {
      symbol,
      qty,
      side,
      type,
      timeInForce,
      limitPrice,
      stopPrice,
      clientOrderId,
      extendedHours
    } = orderParams;

    return alpacaTradingApi.placeOrder(
      symbol,
      qty,
      side as any,
      type as any,
      timeInForce as any,
      limitPrice,
      stopPrice,
      clientOrderId,
      extendedHours
    );
  }

  /**
   * Cancel an order
   * @param orderId Order ID
   */
  public async cancelOrder(orderId: string): Promise<void> {
    return alpacaTradingApi.cancelOrder(orderId);
  }

  /**
   * Get financial statements
   * @param symbol Stock symbol
   * @param type Statement type (income, balance, cash)
   * @param period Period (annual or quarter)
   * @param limit Number of statements to return
   * @param options Request options
   */
  public async getFinancials(
    symbol: string,
    type: 'income' | 'balance' | 'cash',
    period: 'annual' | 'quarter' = 'quarter',
    limit: number = 4,
    options: {
      useCache?: boolean;
      cacheTtl?: number;
    } = {}
  ): Promise<any> {
    const cacheKey = this.createCacheKey('getFinancials', [symbol, type, period, limit]);

    return this.executeWithFallback(
      'financials',
      // Primary request (FMP)
      () => {
        switch (type) {
          case 'income':
            return fmpApi.getIncomeStatement(symbol, period, limit);
          case 'balance':
            return fmpApi.getBalanceSheet(symbol, period, limit);
          case 'cash':
            return fmpApi.getCashFlowStatement(symbol, period, limit);
          default:
            throw new Error(`Invalid statement type: ${type}`);
        }
      },
      [
        // Fallback 1 (IEX Cloud)
        () => {
          switch (type) {
            case 'income':
              return iexCloudApi.getIncome(symbol, period, limit);
            case 'balance':
              return iexCloudApi.getBalanceSheet(symbol, period, limit);
            case 'cash':
              return iexCloudApi.getCashFlow(symbol, period, limit);
            default:
              throw new Error(`Invalid statement type: ${type}`);
          }
        },
        // Fallback 2 (Polygon)
        () => polygonApi.getStockFinancials(symbol, {
          type: this.mapFinancialType(type),
          limit,
          timeframe: period === 'annual' ? 'annual' : 'quarterly'
        })
      ],
      { ...options, cacheKey }
    );
  }

  /**
   * Get key metrics for a company
   * @param symbol Stock symbol
   * @param period Period (annual or quarter)
   * @param limit Number of periods to return
   * @param options Request options
   */
  public async getKeyMetrics(
    symbol: string,
    period: 'annual' | 'quarter' = 'quarter',
    limit: number = 4,
    options: {
      useCache?: boolean;
      cacheTtl?: number;
    } = {}
  ): Promise<any> {
    const cacheKey = this.createCacheKey('getKeyMetrics', [symbol, period, limit]);

    return this.executeWithFallback(
      'key_metrics',
      // Primary request (FMP)
      () => fmpApi.getKeyMetrics(symbol, period, limit),
      [],  // No fallbacks for key metrics
      { ...options, cacheKey }
    );
  }

  /**
   * Get financial ratios for a company
   * @param symbol Stock symbol
   * @param period Period (annual or quarter)
   * @param limit Number of periods to return
   * @param options Request options
   */
  public async getFinancialRatios(
    symbol: string,
    period: 'annual' | 'quarter' = 'quarter',
    limit: number = 4,
    options: {
      useCache?: boolean;
      cacheTtl?: number;
    } = {}
  ): Promise<any> {
    const cacheKey = this.createCacheKey('getFinancialRatios', [symbol, period, limit]);

    return this.executeWithFallback(
      'financial_ratios',
      // Primary request (FMP)
      () => fmpApi.getFinancialRatios(symbol, period, limit),
      [],  // No fallbacks for financial ratios
      { ...options, cacheKey }
    );
  }

  /**
   * Get earnings for a company
   * @param symbol Stock symbol
   * @param limit Number of earnings to return
   * @param options Request options
   */
  public async getEarnings(
    symbol: string,
    limit: number = 4,
    options: {
      useCache?: boolean;
      cacheTtl?: number;
    } = {}
  ): Promise<any> {
    const cacheKey = this.createCacheKey('getEarnings', [symbol, limit]);

    return this.executeWithFallback(
      'earnings',
      // Primary request (FMP)
      () => fmpApi.getEarnings(symbol, limit),
      [
        // Fallback 1 (IEX Cloud)
        () => iexCloudApi.getEarnings(symbol, limit)
      ],
      { ...options, cacheKey }
    );
  }

  /**
   * Get market movers (gainers, losers, active)
   * @param type Type of movers (gainers, losers, active)
   * @param options Request options
   */
  public async getMarketMovers(
    type: 'gainers' | 'losers' | 'active',
    options: {
      useCache?: boolean;
      cacheTtl?: number;
    } = {}
  ): Promise<any[]> {
    const cacheKey = this.createCacheKey('getMarketMovers', [type]);

    return this.executeWithFallback(
      'market_movers',
      // Primary request (FMP)
      () => fmpApi.getMarketMovers(type),
      [],  // No fallbacks for market movers
      { ...options, cacheKey }
    );
  }

  /**
   * Connect to WebSocket for real-time data
   * @param symbols Array of symbols to subscribe to
   * @param dataTypes Array of data types to subscribe to
   * @param handlers Event handlers for different message types
   */
  public async connectWebSocket(
    symbols: string[],
    dataTypes: string[],
    handlers: Record<string, (data: any) => void>
  ): Promise<void> {
    try {
      // Try Alpaca WebSocket first
      const alpacaStreams = this.getAlpacaStreams(symbols, dataTypes);
      await alpacaDataApi.connectWebSocket(alpacaStreams);

      // Register handlers
      Object.entries(handlers).forEach(([eventType, handler]) => {
        alpacaDataApi.onWebSocketMessage(this.mapEventTypeToAlpaca(eventType), handler);
      });

      console.log('Connected to Alpaca WebSocket');
    } catch (error) {
      console.error('Failed to connect to Alpaca WebSocket:', error);

      try {
        // Fallback to Polygon WebSocket
        await polygonApi.connectWebSocket('stocks');

        // Subscribe to channels
        symbols.forEach(symbol => {
          dataTypes.forEach(dataType => {
            const channel = this.getPolygonChannel(symbol, dataType);
            if (channel) {
              polygonApi.subscribe(channel);
            }
          });
        });

        // Register handlers
        Object.entries(handlers).forEach(([eventType, handler]) => {
          polygonApi.onWebSocketMessage(this.mapEventTypeToPolygon(eventType), handler);
        });

        console.log('Connected to Polygon WebSocket (fallback)');

        // Notify user about fallback
        store.dispatch(addNotification({
          type: 'info',
          title: 'Using Fallback Data Stream',
          message: 'Primary real-time data stream unavailable. Using fallback stream.',
          autoHideDuration: 5000,
        }));
      } catch (fallbackError) {
        console.error('Failed to connect to Polygon WebSocket:', fallbackError);

        // Notify user about failure
        store.dispatch(addNotification({
          type: 'error',
          title: 'Real-Time Data Unavailable',
          message: 'Failed to connect to real-time data streams. Please refresh the page.',
          autoHideDuration: 0, // Don't auto-hide this critical error
        }));

        throw new Error('Failed to connect to any WebSocket provider');
      }
    }
  }

  /**
   * Disconnect from WebSocket
   */
  public disconnectWebSocket(): void {
    try {
      alpacaDataApi.disconnectWebSocket();
    } catch (error) {
      console.error('Error disconnecting from Alpaca WebSocket:', error);
    }

    try {
      polygonApi.disconnectWebSocket();
    } catch (error) {
      console.error('Error disconnecting from Polygon WebSocket:', error);
    }
  }

  /**
   * Convert generic timeframe to Alpaca timeframe
   * @param timeframe Generic timeframe
   */
  private convertTimeframeToAlpaca(timeframe: string): string {
    switch (timeframe) {
      case '1m':
        return '1Min';
      case '5m':
        return '5Min';
      case '15m':
        return '15Min';
      case '30m':
        return '30Min';
      case '1h':
        return '1Hour';
      case '1d':
        return '1Day';
      default:
        return '1Day';
    }
  }

  /**
   * Get Polygon timeframe multiplier
   * @param timeframe Generic timeframe
   */
  private getPolygonTimeframeMultiplier(timeframe: string): number {
    switch (timeframe) {
      case '1m':
        return 1;
      case '5m':
        return 5;
      case '15m':
        return 15;
      case '30m':
        return 30;
      case '1h':
        return 1;
      case '1d':
        return 1;
      default:
        return 1;
    }
  }

  /**
   * Get Polygon timeframe timespan
   * @param timeframe Generic timeframe
   */
  private getPolygonTimeframeTimespan(timeframe: string): string {
    switch (timeframe) {
      case '1m':
      case '5m':
      case '15m':
      case '30m':
        return 'minute';
      case '1h':
        return 'hour';
      case '1d':
        return 'day';
      default:
        return 'day';
    }
  }

  /**
   * Calculate IEX Cloud range from start and end dates
   * @param start Start date
   * @param end End date
   */
  private calculateIEXRange(start: string, end: string): string {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const now = new Date();
    const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 5) {
      return '5d';
    } else if (diffDays <= 30) {
      return '1m';
    } else if (diffDays <= 90) {
      return '3m';
    } else if (diffDays <= 180) {
      return '6m';
    } else if (startDate.getFullYear() === now.getFullYear()) {
      return 'ytd';
    } else if (diffDays <= 365) {
      return '1y';
    } else if (diffDays <= 730) {
      return '2y';
    } else if (diffDays <= 1825) {
      return '5y';
    } else {
      return 'max';
    }
  }

  /**
   * Map financial statement type to Polygon format
   * @param type Statement type
   */
  private mapFinancialType(type: string): string {
    switch (type) {
      case 'income':
        return 'income_statement';
      case 'balance':
        return 'balance_sheet';
      case 'cash':
        return 'cash_flow_statement';
      default:
        return 'income_statement';
    }
  }

  /**
   * Get Alpaca WebSocket streams for symbols and data types
   * @param symbols Array of symbols
   * @param dataTypes Array of data types
   */
  private getAlpacaStreams(symbols: string[], dataTypes: string[]): string[] {
    const streams: string[] = [];

    dataTypes.forEach(dataType => {
      switch (dataType) {
        case 'trades':
          symbols.forEach(symbol => {
            streams.push(`trades_${symbol}`);
          });
          break;
        case 'quotes':
          symbols.forEach(symbol => {
            streams.push(`quotes_${symbol}`);
          });
          break;
        case 'bars':
          symbols.forEach(symbol => {
            streams.push(`bars_${symbol}`);
          });
          break;
        case 'dailyBars':
          symbols.forEach(symbol => {
            streams.push(`dailyBars_${symbol}`);
          });
          break;
        case 'statuses':
          symbols.forEach(symbol => {
            streams.push(`statuses_${symbol}`);
          });
          break;
        case 'lulds':
          symbols.forEach(symbol => {
            streams.push(`lulds_${symbol}`);
          });
          break;
        case 'trades_updates':
          streams.push('trade_updates');
          break;
        case 'account_updates':
          streams.push('account_updates');
          break;
      }
    });

    return streams;
  }

  /**
   * Get Polygon WebSocket channel for symbol and data type
   * @param symbol Symbol
   * @param dataType Data type
   */
  private getPolygonChannel(symbol: string, dataType: string): string | null {
    switch (dataType) {
      case 'trades':
        return `T.${symbol}`;
      case 'quotes':
        return `Q.${symbol}`;
      case 'bars':
      case 'dailyBars':
        return `AM.${symbol}`;
      case 'statuses':
        return `S.${symbol}`;
      default:
        return null;
    }
  }

  /**
   * Map generic event type to Alpaca event type
   * @param eventType Generic event type
   */
  private mapEventTypeToAlpaca(eventType: string): string {
    switch (eventType) {
      case 'trade':
        return 'trade';
      case 'quote':
        return 'quote';
      case 'bar':
        return 'bar';
      case 'dailyBar':
        return 'dailyBar';
      case 'status':
        return 'status';
      case 'luld':
        return 'luld';
      case 'trade_update':
        return 'trade_update';
      case 'account_update':
        return 'account_update';
      default:
        return '*';
    }
  }

  /**
   * Map generic event type to Polygon event type
   * @param eventType Generic event type
   */
  private mapEventTypeToPolygon(eventType: string): string {
    switch (eventType) {
      case 'trade':
        return 'T';
      case 'quote':
        return 'Q';
      case 'bar':
      case 'dailyBar':
        return 'AM';
      case 'status':
        return 'S';
      default:
        return '*';
    }
  }
}

// Create singleton instance
const unifiedDataProvider = new UnifiedDataProvider();
export default unifiedDataProvider;