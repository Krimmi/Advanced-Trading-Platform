import { DataNormalizer, NormalizedData } from './normalization/DataNormalizer';
import { marketDataService, MarketDataProvider } from './marketData/MarketDataServiceFactory';
import { financialDataService, FinancialDataProvider } from './financialData/FinancialDataServiceFactory';
import { newsService, NewsProvider } from './news/NewsServiceFactory';
import { tradingService, TradingProvider } from './trading/TradingServiceFactory';
import { performanceMonitoring, MetricType } from '../monitoring/performanceMonitoring';
import { cachingService, CacheVolatility } from './cache/CachingService';

/**
 * Unified data provider options
 */
export interface UnifiedDataOptions {
  useAllProviders?: boolean;
  preferredMarketDataProvider?: MarketDataProvider;
  preferredFinancialDataProvider?: FinancialDataProvider;
  preferredNewsProvider?: NewsProvider;
  preferredTradingProvider?: TradingProvider;
  forceRefresh?: boolean;
  timeout?: number;
}

/**
 * Unified data provider for accessing data from multiple providers
 */
export class UnifiedDataProvider {
  private static instance: UnifiedDataProvider;

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): UnifiedDataProvider {
    if (!UnifiedDataProvider.instance) {
      UnifiedDataProvider.instance = new UnifiedDataProvider();
    }
    return UnifiedDataProvider.instance;
  }

  /**
   * Get comprehensive market data for a symbol
   * @param symbol - Stock symbol
   * @param options - Unified data options
   * @returns Promise with normalized market data
   */
  public async getMarketData(symbol: string, options: UnifiedDataOptions = {}): Promise<NormalizedData<any>> {
    const metricId = performanceMonitoring.startMetric(
      `UnifiedDataProvider.getMarketData.${symbol}`,
      MetricType.DATA_PROCESSING,
      { symbol, options }
    );

    try {
      // Check cache first if not forcing refresh
      if (!options.forceRefresh) {
        const cacheKey = `unified:market:${symbol}`;
        const cachedData = await cachingService.get<NormalizedData<any>>(cacheKey);
        if (cachedData) {
          performanceMonitoring.endMetric(metricId, true, { cached: true });
          return cachedData;
        }
      }

      // Determine which providers to use
      const providers: MarketDataProvider[] = options.useAllProviders
        ? ['alphaVantage', 'polygon', 'iexCloud']
        : options.preferredMarketDataProvider
          ? [options.preferredMarketDataProvider]
          : ['auto'];

      // Create a promise for each provider with timeout
      const timeout = options.timeout || 10000; // 10 seconds default
      const quotePromises = providers.map(provider => {
        return Promise.race([
          marketDataService.getQuote(symbol, provider).catch(error => {
            console.warn(`Failed to get quote from ${provider}:`, error);
            return null;
          }),
          new Promise<null>(resolve => setTimeout(() => resolve(null), timeout))
        ]);
      });

      // Wait for all promises to resolve
      const quotes = (await Promise.all(quotePromises)).filter(quote => quote !== null);

      // If no quotes were returned, throw an error
      if (quotes.length === 0) {
        throw new Error(`Failed to get market data for ${symbol} from any provider`);
      }

      // Normalize the quotes
      const normalizedData = DataNormalizer.normalizeMarketQuote(quotes);

      // Cache the normalized data
      await cachingService.set(
        `unified:market:${symbol}`,
        normalizedData,
        {
          ttl: 60000, // 1 minute
          volatility: CacheVolatility.HIGH,
          persistToDisk: false
        }
      );

      performanceMonitoring.endMetric(metricId, true, { 
        providerCount: providers.length,
        successCount: quotes.length
      });

      return normalizedData;
    } catch (error) {
      performanceMonitoring.endMetric(metricId, false, { error: error.message });
      throw error;
    }
  }

  /**
   * Get comprehensive financial data for a symbol
   * @param symbol - Stock symbol
   * @param options - Unified data options
   * @returns Promise with normalized financial data
   */
  public async getFinancialData(symbol: string, options: UnifiedDataOptions = {}): Promise<NormalizedData<any>> {
    const metricId = performanceMonitoring.startMetric(
      `UnifiedDataProvider.getFinancialData.${symbol}`,
      MetricType.DATA_PROCESSING,
      { symbol, options }
    );

    try {
      // Check cache first if not forcing refresh
      if (!options.forceRefresh) {
        const cacheKey = `unified:financial:${symbol}`;
        const cachedData = await cachingService.get<NormalizedData<any>>(cacheKey);
        if (cachedData) {
          performanceMonitoring.endMetric(metricId, true, { cached: true });
          return cachedData;
        }
      }

      // Determine which providers to use
      const providers: FinancialDataProvider[] = options.useAllProviders
        ? ['financialModelingPrep', 'quandl']
        : options.preferredFinancialDataProvider
          ? [options.preferredFinancialDataProvider]
          : ['auto'];

      // Create a promise for each provider with timeout
      const timeout = options.timeout || 15000; // 15 seconds default
      const profilePromises = providers.map(provider => {
        return Promise.race([
          financialDataService.getCompanyProfile(symbol, provider).catch(error => {
            console.warn(`Failed to get company profile from ${provider}:`, error);
            return null;
          }),
          new Promise<null>(resolve => setTimeout(() => resolve(null), timeout))
        ]);
      });

      // Wait for all promises to resolve
      const profiles = (await Promise.all(profilePromises)).filter(profile => profile !== null);

      // If no profiles were returned, throw an error
      if (profiles.length === 0) {
        throw new Error(`Failed to get financial data for ${symbol} from any provider`);
      }

      // Normalize the profiles
      const normalizedData = DataNormalizer.normalizeCompanyProfile(profiles);

      // Cache the normalized data
      await cachingService.set(
        `unified:financial:${symbol}`,
        normalizedData,
        {
          ttl: 86400000, // 24 hours
          volatility: CacheVolatility.LOW,
          persistToDisk: true
        }
      );

      performanceMonitoring.endMetric(metricId, true, { 
        providerCount: providers.length,
        successCount: profiles.length
      });

      return normalizedData;
    } catch (error) {
      performanceMonitoring.endMetric(metricId, false, { error: error.message });
      throw error;
    }
  }

  /**
   * Get comprehensive news data for a symbol
   * @param symbol - Stock symbol
   * @param options - Unified data options
   * @returns Promise with normalized news data
   */
  public async getNewsData(symbol: string, options: UnifiedDataOptions = {}): Promise<NormalizedData<any[]>> {
    const metricId = performanceMonitoring.startMetric(
      `UnifiedDataProvider.getNewsData.${symbol}`,
      MetricType.DATA_PROCESSING,
      { symbol, options }
    );

    try {
      // Check cache first if not forcing refresh
      if (!options.forceRefresh) {
        const cacheKey = `unified:news:${symbol}`;
        const cachedData = await cachingService.get<NormalizedData<any[]>>(cacheKey);
        if (cachedData) {
          performanceMonitoring.endMetric(metricId, true, { cached: true });
          return cachedData;
        }
      }

      // Determine which providers to use
      const providers: NewsProvider[] = options.useAllProviders
        ? ['newsApi', 'finnhub']
        : options.preferredNewsProvider
          ? [options.preferredNewsProvider]
          : ['auto'];

      // Create a promise for each provider with timeout
      const timeout = options.timeout || 10000; // 10 seconds default
      const newsPromises = providers.map(provider => {
        return Promise.race([
          newsService.getNewsBySymbol(symbol, { limit: 20 }, provider).catch(error => {
            console.warn(`Failed to get news from ${provider}:`, error);
            return { articles: [] };
          }),
          new Promise<{ articles: [] }>(resolve => setTimeout(() => resolve({ articles: [] }), timeout))
        ]);
      });

      // Wait for all promises to resolve
      const newsResults = await Promise.all(newsPromises);
      
      // Combine all articles
      const allArticles = newsResults.flatMap(result => result.articles || []);

      // Normalize the articles
      const normalizedData = DataNormalizer.normalizeNewsArticles(allArticles);

      // Cache the normalized data
      await cachingService.set(
        `unified:news:${symbol}`,
        normalizedData,
        {
          ttl: 1800000, // 30 minutes
          volatility: CacheVolatility.MEDIUM,
          persistToDisk: true
        }
      );

      performanceMonitoring.endMetric(metricId, true, { 
        providerCount: providers.length,
        articleCount: normalizedData.data.length
      });

      return normalizedData;
    } catch (error) {
      performanceMonitoring.endMetric(metricId, false, { error: error.message });
      throw error;
    }
  }

  /**
   * Get comprehensive data for a symbol (market, financial, and news)
   * @param symbol - Stock symbol
   * @param options - Unified data options
   * @returns Promise with all data
   */
  public async getComprehensiveData(symbol: string, options: UnifiedDataOptions = {}): Promise<{
    market: NormalizedData<any>;
    financial: NormalizedData<any>;
    news: NormalizedData<any[]>;
  }> {
    const metricId = performanceMonitoring.startMetric(
      `UnifiedDataProvider.getComprehensiveData.${symbol}`,
      MetricType.DATA_PROCESSING,
      { symbol, options }
    );

    try {
      // Run all requests in parallel
      const [market, financial, news] = await Promise.all([
        this.getMarketData(symbol, options),
        this.getFinancialData(symbol, options),
        this.getNewsData(symbol, options)
      ]);

      performanceMonitoring.endMetric(metricId, true);

      return {
        market,
        financial,
        news
      };
    } catch (error) {
      performanceMonitoring.endMetric(metricId, false, { error: error.message });
      throw error;
    }
  }

  /**
   * Prefetch data for a list of symbols
   * @param symbols - Array of stock symbols
   * @param options - Unified data options
   */
  public async prefetchData(symbols: string[], options: UnifiedDataOptions = {}): Promise<void> {
    // Limit the number of concurrent requests
    const concurrency = 5;
    const chunks = [];
    
    // Split symbols into chunks
    for (let i = 0; i < symbols.length; i += concurrency) {
      chunks.push(symbols.slice(i, i + concurrency));
    }
    
    // Process each chunk sequentially
    for (const chunk of chunks) {
      // Process symbols in each chunk concurrently
      await Promise.all(chunk.map(symbol => {
        return this.getMarketData(symbol, options).catch(error => {
          console.warn(`Failed to prefetch market data for ${symbol}:`, error);
        });
      }));
    }
  }
}

// Export singleton instance
export const unifiedDataProvider = UnifiedDataProvider.getInstance();