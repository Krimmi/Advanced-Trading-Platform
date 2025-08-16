import { BaseApiService } from '../BaseApiService';
import { API_KEYS, DATA_SOURCE_CONFIG } from '../../../config/apiConfig';
import { AxiosRequestConfig } from 'axios';

/**
 * Stock quote data interface
 */
export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  latestTradingDay: string;
  previousClose: number;
  open: number;
  high: number;
  low: number;
}

/**
 * Time series data point interface
 */
export interface TimeSeriesDataPoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Time series data interface
 */
export interface TimeSeriesData {
  symbol: string;
  interval: string;
  data: TimeSeriesDataPoint[];
}

/**
 * Search result interface
 */
export interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  marketOpen: string;
  marketClose: string;
  timezone: string;
  currency: string;
  matchScore: number;
}

/**
 * Alpha Vantage API service for market data
 */
export class AlphaVantageService extends BaseApiService {
  private readonly apiKey: string;

  /**
   * Constructor
   */
  constructor() {
    super('https://www.alphavantage.co/query');
    this.apiKey = API_KEYS.alphaVantage || '';
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
      apikey: this.apiKey
    };
    return config;
  }

  /**
   * Get a stock quote
   * @param symbol - Stock symbol
   * @returns Promise with stock quote data
   */
  public async getQuote(symbol: string): Promise<StockQuote> {
    try {
      const response = await this.get<any>('', {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol
        }
      }, {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.marketData
      });

      // Check if we got an error response
      if (response['Error Message']) {
        throw new Error(response['Error Message']);
      }

      // Transform the response to our StockQuote interface
      const quote = response['Global Quote'];
      if (!quote) {
        throw new Error('No quote data returned');
      }

      return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume'], 10),
        latestTradingDay: quote['07. latest trading day'],
        previousClose: parseFloat(quote['08. previous close']),
        open: parseFloat(quote['02. open']),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low'])
      };
    } catch (error) {
      console.error('Error fetching quote from Alpha Vantage:', error);
      throw error;
    }
  }

  /**
   * Get time series data
   * @param symbol - Stock symbol
   * @param interval - Time interval ('1min', '5min', '15min', '30min', '60min', 'daily', 'weekly', 'monthly')
   * @param outputSize - Output size ('compact' or 'full')
   * @returns Promise with time series data
   */
  public async getTimeSeries(
    symbol: string,
    interval: string = 'daily',
    outputSize: string = 'compact'
  ): Promise<TimeSeriesData> {
    try {
      // Determine the function based on the interval
      let functionName: string;
      switch (interval) {
        case '1min':
        case '5min':
        case '15min':
        case '30min':
        case '60min':
          functionName = 'TIME_SERIES_INTRADAY';
          break;
        case 'daily':
          functionName = 'TIME_SERIES_DAILY';
          break;
        case 'weekly':
          functionName = 'TIME_SERIES_WEEKLY';
          break;
        case 'monthly':
          functionName = 'TIME_SERIES_MONTHLY';
          break;
        default:
          throw new Error(`Invalid interval: ${interval}`);
      }

      const params: Record<string, string> = {
        function: functionName,
        symbol,
        outputsize: outputSize
      };

      // Add interval parameter for intraday data
      if (functionName === 'TIME_SERIES_INTRADAY') {
        params.interval = interval;
      }

      const response = await this.get<any>('', {
        params
      }, {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.marketData
      });

      // Check if we got an error response
      if (response['Error Message']) {
        throw new Error(response['Error Message']);
      }

      // Determine the time series key based on the function
      let timeSeriesKey: string;
      switch (functionName) {
        case 'TIME_SERIES_INTRADAY':
          timeSeriesKey = `Time Series (${interval})`;
          break;
        case 'TIME_SERIES_DAILY':
          timeSeriesKey = 'Time Series (Daily)';
          break;
        case 'TIME_SERIES_WEEKLY':
          timeSeriesKey = 'Weekly Time Series';
          break;
        case 'TIME_SERIES_MONTHLY':
          timeSeriesKey = 'Monthly Time Series';
          break;
        default:
          throw new Error(`Unknown function: ${functionName}`);
      }

      const timeSeries = response[timeSeriesKey];
      if (!timeSeries) {
        throw new Error('No time series data returned');
      }

      // Transform the response to our TimeSeriesData interface
      const data: TimeSeriesDataPoint[] = Object.entries(timeSeries).map(([timestamp, values]: [string, any]) => ({
        timestamp,
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseInt(values['5. volume'], 10)
      }));

      return {
        symbol,
        interval,
        data
      };
    } catch (error) {
      console.error('Error fetching time series from Alpha Vantage:', error);
      throw error;
    }
  }

  /**
   * Search for stocks
   * @param keywords - Search keywords
   * @returns Promise with search results
   */
  public async searchStocks(keywords: string): Promise<SearchResult[]> {
    try {
      const response = await this.get<any>('', {
        params: {
          function: 'SYMBOL_SEARCH',
          keywords
        }
      }, {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.marketData
      });

      // Check if we got an error response
      if (response['Error Message']) {
        throw new Error(response['Error Message']);
      }

      const matches = response['bestMatches'];
      if (!matches) {
        return [];
      }

      // Transform the response
      return matches.map((match: any) => ({
        symbol: match['1. symbol'],
        name: match['2. name'],
        type: match['3. type'],
        region: match['4. region'],
        marketOpen: match['5. marketOpen'],
        marketClose: match['6. marketClose'],
        timezone: match['7. timezone'],
        currency: match['8. currency'],
        matchScore: parseFloat(match['9. matchScore'])
      }));
    } catch (error) {
      console.error('Error searching stocks from Alpha Vantage:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const alphaVantageService = new AlphaVantageService();