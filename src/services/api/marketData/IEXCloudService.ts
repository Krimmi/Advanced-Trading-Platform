import { BaseApiService } from '../BaseApiService';
import { API_KEYS, DATA_SOURCE_CONFIG } from '../../../config/apiConfig';
import { AxiosRequestConfig } from 'axios';

/**
 * Quote data interface
 */
export interface Quote {
  symbol: string;
  companyName: string;
  primaryExchange: string;
  latestPrice: number;
  latestTime: string;
  latestUpdate: number;
  latestVolume: number;
  previousClose: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  marketCap: number;
  peRatio: number;
  week52High: number;
  week52Low: number;
  ytdChange: number;
  isUSMarketOpen: boolean;
}

/**
 * Historical price data interface
 */
export interface HistoricalPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
  label: string;
  changeOverTime: number;
}

/**
 * Company data interface
 */
export interface Company {
  symbol: string;
  companyName: string;
  exchange: string;
  industry: string;
  website: string;
  description: string;
  CEO: string;
  securityName: string;
  issueType: string;
  sector: string;
  employees: number;
  tags: string[];
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

/**
 * Symbol search result interface
 */
export interface SymbolSearchResult {
  symbol: string;
  securityName: string;
  securityType: string;
  region: string;
  exchange: string;
}

/**
 * IEX Cloud API service for market data
 */
export class IEXCloudService extends BaseApiService {
  private readonly apiKey: string;

  /**
   * Constructor
   */
  constructor() {
    super('https://cloud.iexapis.com/stable');
    this.apiKey = API_KEYS.iexCloud || '';
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
    
    // Add API key to all requests
    config.params = {
      ...config.params,
      token: this.apiKey
    };
    return config;
  }

  /**
   * Get a quote for a symbol
   * @param symbol - Stock symbol
   * @returns Promise with quote data
   */
  public async getQuote(symbol: string): Promise<Quote> {
    try {
      return await this.get<Quote>(`/stock/${symbol}/quote`, {}, {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.marketData
      });
    } catch (error) {
      console.error('Error fetching quote from IEX Cloud:', error);
      throw error;
    }
  }

  /**
   * Get quotes for multiple symbols
   * @param symbols - Array of stock symbols
   * @returns Promise with object mapping symbols to quotes
   */
  public async getBatchQuotes(symbols: string[]): Promise<Record<string, Quote>> {
    try {
      const symbolsStr = symbols.join(',');
      const response = await this.get<Record<string, { quote: Quote }>>('/stock/market/batch', {
        params: {
          symbols: symbolsStr,
          types: 'quote'
        }
      }, {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.marketData
      });

      // Transform the response
      const quotes: Record<string, Quote> = {};
      for (const symbol in response) {
        quotes[symbol] = response[symbol].quote;
      }

      return quotes;
    } catch (error) {
      console.error('Error fetching batch quotes from IEX Cloud:', error);
      throw error;
    }
  }

  /**
   * Get historical prices for a symbol
   * @param symbol - Stock symbol
   * @param range - Time range (1d, 5d, 1m, 3m, 6m, ytd, 1y, 2y, 5y, max)
   * @returns Promise with array of historical prices
   */
  public async getHistoricalPrices(
    symbol: string,
    range: '1d' | '5d' | '1m' | '3m' | '6m' | 'ytd' | '1y' | '2y' | '5y' | 'max' = '1m'
  ): Promise<HistoricalPrice[]> {
    try {
      return await this.get<HistoricalPrice[]>(`/stock/${symbol}/chart/${range}`, {}, {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.marketData
      });
    } catch (error) {
      console.error('Error fetching historical prices from IEX Cloud:', error);
      throw error;
    }
  }

  /**
   * Get company information
   * @param symbol - Stock symbol
   * @returns Promise with company information
   */
  public async getCompany(symbol: string): Promise<Company> {
    try {
      return await this.get<Company>(`/stock/${symbol}/company`, {}, {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.fundamentalData
      });
    } catch (error) {
      console.error('Error fetching company information from IEX Cloud:', error);
      throw error;
    }
  }

  /**
   * Get top market gainers
   * @param listLimit - Maximum number of results
   * @returns Promise with array of quotes
   */
  public async getMarketGainers(listLimit: number = 10): Promise<Quote[]> {
    try {
      return await this.get<Quote[]>('/stock/market/list/gainers', {
        params: {
          listLimit
        }
      }, {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.marketData
      });
    } catch (error) {
      console.error('Error fetching market gainers from IEX Cloud:', error);
      throw error;
    }
  }

  /**
   * Get top market losers
   * @param listLimit - Maximum number of results
   * @returns Promise with array of quotes
   */
  public async getMarketLosers(listLimit: number = 10): Promise<Quote[]> {
    try {
      return await this.get<Quote[]>('/stock/market/list/losers', {
        params: {
          listLimit
        }
      }, {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.marketData
      });
    } catch (error) {
      console.error('Error fetching market losers from IEX Cloud:', error);
      throw error;
    }
  }

  /**
   * Get most active stocks
   * @param listLimit - Maximum number of results
   * @returns Promise with array of quotes
   */
  public async getMostActive(listLimit: number = 10): Promise<Quote[]> {
    try {
      return await this.get<Quote[]>('/stock/market/list/mostactive', {
        params: {
          listLimit
        }
      }, {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.marketData
      });
    } catch (error) {
      console.error('Error fetching most active stocks from IEX Cloud:', error);
      throw error;
    }
  }

  /**
   * Search for symbols
   * @param fragment - Search fragment
   * @returns Promise with array of search results
   */
  public async searchSymbols(fragment: string): Promise<SymbolSearchResult[]> {
    try {
      return await this.get<SymbolSearchResult[]>(`/search/${fragment}`, {}, {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.marketData
      });
    } catch (error) {
      console.error('Error searching symbols from IEX Cloud:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const iexCloudService = new IEXCloudService();