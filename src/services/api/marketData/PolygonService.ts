import { BaseApiService } from '../BaseApiService';
import { API_KEYS, DATA_SOURCE_CONFIG } from '../../../config/apiConfig';
import { AxiosRequestConfig } from 'axios';

/**
 * Quote data interface
 */
export interface Quote {
  symbol: string;
  price: number;
  size: number;
  timestamp: number;
  conditions?: number[];
  exchange?: number;
  tape?: string;
}

/**
 * Bar data interface
 */
export interface Bar {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

/**
 * Ticker data interface
 */
export interface Ticker {
  ticker: string;
  name: string;
  market: string;
  locale: string;
  primaryExchange: string;
  type: string;
  active: boolean;
  currencyName: string;
  cik?: string;
  compositeFigi?: string;
  shareClassFigi?: string;
  lastUpdated: string;
}

/**
 * Polygon.io API service for market data
 */
export class PolygonService extends BaseApiService {
  private readonly apiKey: string;

  /**
   * Constructor
   */
  constructor() {
    super('https://api.polygon.io');
    this.apiKey = API_KEYS.polygon || '';
  }

  /**
   * Check if the service is available
   * @returns True if the API key is configured and not using mock data
   */
  public isAvailable(): boolean {
    return Boolean(this.apiKey) && !DATA_SOURCE_CONFIG.forceMockData;
  }

  /**
   * Request interceptor to add API key
   * @param config - Axios request config
   * @returns Modified config with API key
   */
  protected requestInterceptor(config: AxiosRequestConfig): AxiosRequestConfig {
    // Call parent interceptor
    config = super.requestInterceptor(config);
    
    // Add API key as Authorization header
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${this.apiKey}`
    };
    return config;
  }

  /**
   * Get the latest quote for a symbol
   * @param symbol - Stock symbol
   * @returns Promise with quote data
   */
  public async getLatestQuote(symbol: string): Promise<Quote> {
    try {
      const response = await this.get<any>(`/v2/last/trade/${symbol}`, {}, {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.marketData
      });

      // Check if we got an error response
      if (!response.success) {
        throw new Error(response.error || 'Failed to get quote');
      }

      const result = response.results;
      return {
        symbol: result.T,
        price: result.p,
        size: result.s,
        timestamp: result.t,
        conditions: result.c,
        exchange: result.x,
        tape: result.z
      };
    } catch (error) {
      console.error('Error fetching quote from Polygon:', error);
      throw error;
    }
  }

  /**
   * Get aggregated bars for a symbol
   * @param symbol - Stock symbol
   * @param multiplier - Time multiplier
   * @param timespan - Time span unit (minute, hour, day, week, month, quarter, year)
   * @param from - Start date (YYYY-MM-DD)
   * @param to - End date (YYYY-MM-DD)
   * @returns Promise with array of bars
   */
  public async getAggregatedBars(
    symbol: string,
    multiplier: number,
    timespan: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year',
    from: string,
    to: string
  ): Promise<Bar[]> {
    try {
      const response = await this.get<any>(
        `/v2/aggs/ticker/${symbol}/range/${multiplier}/${timespan}/${from}/${to}`,
        {},
        {
          ttl: DATA_SOURCE_CONFIG.cacheTTL.marketData
        }
      );

      // Check if we got an error response
      if (!response.results) {
        throw new Error(response.error || 'No results found');
      }

      // Transform the response
      return response.results.map((bar: any) => ({
        open: bar.o,
        high: bar.h,
        low: bar.l,
        close: bar.c,
        volume: bar.v,
        timestamp: bar.t
      }));
    } catch (error) {
      console.error('Error fetching bars from Polygon:', error);
      throw error;
    }
  }

  /**
   * Search for tickers
   * @param search - Search term
   * @param active - Only active tickers
   * @param market - Filter by market (stocks, crypto, fx)
   * @param limit - Maximum number of results
   * @returns Promise with array of tickers
   */
  public async searchTickers(
    search: string,
    active: boolean = true,
    market: 'stocks' | 'crypto' | 'fx' | '' = '',
    limit: number = 10
  ): Promise<Ticker[]> {
    try {
      const response = await this.get<any>('/v3/reference/tickers', {
        params: {
          search,
          active: active.toString(),
          market: market || undefined,
          limit
        }
      }, {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.marketData
      });

      // Check if we got an error response
      if (!response.results) {
        throw new Error(response.error || 'No results found');
      }

      // Transform the response
      return response.results.map((ticker: any) => ({
        ticker: ticker.ticker,
        name: ticker.name,
        market: ticker.market,
        locale: ticker.locale,
        primaryExchange: ticker.primary_exchange,
        type: ticker.type,
        active: ticker.active,
        currencyName: ticker.currency_name,
        cik: ticker.cik,
        compositeFigi: ticker.composite_figi,
        shareClassFigi: ticker.share_class_figi,
        lastUpdated: ticker.last_updated_utc
      }));
    } catch (error) {
      console.error('Error searching tickers from Polygon:', error);
      throw error;
    }
  }

  /**
   * Get real-time quotes for multiple symbols
   * @param symbols - Array of stock symbols
   * @returns Promise with object mapping symbols to quotes
   */
  public async getRealtimeQuotes(symbols: string[]): Promise<Record<string, Quote>> {
    try {
      const symbolsStr = symbols.join(',');
      const response = await this.get<any>('/v2/snapshot/locale/us/markets/stocks/tickers', {
        params: {
          tickers: symbolsStr
        }
      }, {
        ttl: 30000 // Short cache time for real-time data
      });

      // Check if we got an error response
      if (!response.tickers) {
        throw new Error(response.error || 'No results found');
      }

      // Transform the response
      const quotes: Record<string, Quote> = {};
      response.tickers.forEach((ticker: any) => {
        const lastQuote = ticker.lastQuote;
        if (lastQuote) {
          quotes[ticker.ticker] = {
            symbol: ticker.ticker,
            price: lastQuote.p,
            size: lastQuote.s,
            timestamp: lastQuote.t,
            conditions: lastQuote.c || [],
            exchange: lastQuote.x,
            tape: lastQuote.z
          };
        }
      });

      return quotes;
    } catch (error) {
      console.error('Error fetching realtime quotes from Polygon:', error);
      throw error;
    }
  }

  /**
   * Get previous close for a symbol
   * @param symbol - Stock symbol
   * @returns Promise with previous day's bar
   */
  public async getPreviousClose(symbol: string): Promise<Bar> {
    try {
      const response = await this.get<any>(`/v2/aggs/ticker/${symbol}/prev`, {}, {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.marketData
      });

      // Check if we got an error response
      if (!response.results || response.results.length === 0) {
        throw new Error(response.error || 'No results found');
      }

      // Transform the response
      const result = response.results[0];
      return {
        open: result.o,
        high: result.h,
        low: result.l,
        close: result.c,
        volume: result.v,
        timestamp: result.t
      };
    } catch (error) {
      console.error('Error fetching previous close from Polygon:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const polygonService = new PolygonService();