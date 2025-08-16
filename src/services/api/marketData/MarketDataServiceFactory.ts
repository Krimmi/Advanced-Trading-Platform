import { API_KEYS, DATA_SOURCE_CONFIG } from '../../../config/apiConfig';
import { AlphaVantageService, alphaVantageService } from './AlphaVantageService';
import { PolygonService, polygonService } from './PolygonService';
import { IEXCloudService, iexCloudService } from './IEXCloudService';
import { ApiError } from '../BaseApiService';

/**
 * Common interface for market data across all providers
 */
export interface MarketQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  timestamp: string | number;
}

/**
 * Common interface for historical price data
 */
export interface MarketHistoricalPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Common interface for search results
 */
export interface MarketSearchResult {
  symbol: string;
  name: string;
  type: string;
  exchange?: string;
}

/**
 * Market data provider type
 */
export type MarketDataProvider = 'alphaVantage' | 'polygon' | 'iexCloud' | 'auto';

/**
 * Factory for creating and managing market data services
 */
export class MarketDataServiceFactory {
  private static instance: MarketDataServiceFactory;

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): MarketDataServiceFactory {
    if (!MarketDataServiceFactory.instance) {
      MarketDataServiceFactory.instance = new MarketDataServiceFactory();
    }
    return MarketDataServiceFactory.instance;
  }

  /**
   * Get the best available market data service
   * @param preferredProvider - Preferred provider (optional)
   * @returns The best available service
   */
  public getBestAvailableService(preferredProvider: MarketDataProvider = 'auto'): 
    AlphaVantageService | PolygonService | IEXCloudService {
    
    // If we're forcing mock data, return the first service (it will use mock data)
    if (DATA_SOURCE_CONFIG.forceMockData) {
      return alphaVantageService;
    }

    // If a specific provider is requested and available, use it
    if (preferredProvider !== 'auto') {
      switch (preferredProvider) {
        case 'alphaVantage':
          if (API_KEYS.alphaVantage) return alphaVantageService;
          break;
        case 'polygon':
          if (API_KEYS.polygon) return polygonService;
          break;
        case 'iexCloud':
          if (API_KEYS.iexCloud) return iexCloudService;
          break;
      }
    }

    // Otherwise, find the first available service in order of preference
    // Polygon is preferred for real-time data
    if (API_KEYS.polygon) return polygonService;
    
    // IEX Cloud is second choice
    if (API_KEYS.iexCloud) return iexCloudService;
    
    // Alpha Vantage is third choice
    if (API_KEYS.alphaVantage) return alphaVantageService;

    // If no service is available, return Alpha Vantage (it will use mock data)
    return alphaVantageService;
  }

  /**
   * Get a quote for a symbol
   * @param symbol - Stock symbol
   * @param provider - Preferred provider
   * @returns Promise with normalized quote data
   */
  public async getQuote(symbol: string, provider: MarketDataProvider = 'auto'): Promise<MarketQuote> {
    const service = this.getBestAvailableService(provider);
    
    try {
      if (service instanceof AlphaVantageService) {
        const quote = await service.getQuote(symbol);
        return {
          symbol: quote.symbol,
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          volume: quote.volume,
          previousClose: quote.previousClose,
          open: quote.open,
          high: quote.high,
          low: quote.low,
          timestamp: quote.latestTradingDay
        };
      } 
      else if (service instanceof PolygonService) {
        const quote = await service.getLatestQuote(symbol);
        // Get previous close to calculate change
        const prevClose = await service.getPreviousClose(symbol);
        const change = quote.price - prevClose.close;
        const changePercent = (change / prevClose.close) * 100;
        
        return {
          symbol: quote.symbol,
          price: quote.price,
          change: change,
          changePercent: changePercent,
          volume: quote.size, // Not exactly volume, but closest available
          previousClose: prevClose.close,
          open: prevClose.open, // Using previous day's data
          high: prevClose.high, // Using previous day's data
          low: prevClose.low, // Using previous day's data
          timestamp: quote.timestamp
        };
      }
      else if (service instanceof IEXCloudService) {
        const quote = await service.getQuote(symbol);
        return {
          symbol: quote.symbol,
          price: quote.latestPrice,
          change: quote.change,
          changePercent: quote.changePercent * 100, // IEX returns as decimal
          volume: quote.latestVolume,
          previousClose: quote.previousClose,
          open: quote.open,
          high: quote.high,
          low: quote.low,
          timestamp: quote.latestUpdate
        };
      }
      
      throw new Error('No market data service available');
    } catch (error) {
      console.error(`Error getting quote for ${symbol}:`, error);
      
      // If the preferred provider failed and wasn't 'auto', try with 'auto'
      if (provider !== 'auto') {
        console.log(`Retrying with best available provider...`);
        return this.getQuote(symbol, 'auto');
      }
      
      throw new ApiError(`Failed to get quote for ${symbol}`, 
        error instanceof ApiError ? error.status : undefined);
    }
  }

  /**
   * Get historical prices for a symbol
   * @param symbol - Stock symbol
   * @param range - Time range
   * @param provider - Preferred provider
   * @returns Promise with normalized historical price data
   */
  public async getHistoricalPrices(
    symbol: string, 
    range: string = '1m',
    provider: MarketDataProvider = 'auto'
  ): Promise<MarketHistoricalPrice[]> {
    const service = this.getBestAvailableService(provider);
    
    try {
      if (service instanceof AlphaVantageService) {
        // Map range to Alpha Vantage parameters
        let interval = 'daily';
        let outputSize = 'compact';
        
        if (range === '1d') interval = '5min';
        else if (range === '5d') interval = '60min';
        else if (range === '1m') { interval = 'daily'; outputSize = 'compact'; }
        else if (range === '3m' || range === '6m' || range === 'ytd') { 
          interval = 'daily'; outputSize = 'full'; 
        }
        else if (range === '1y' || range === '2y' || range === '5y' || range === 'max') {
          interval = 'weekly';
        }
        
        const data = await service.getTimeSeries(symbol, interval, outputSize);
        
        return data.data.map(point => ({
          date: point.timestamp,
          open: point.open,
          high: point.high,
          low: point.low,
          close: point.close,
          volume: point.volume
        }));
      } 
      else if (service instanceof PolygonService) {
        // Map range to Polygon parameters
        let multiplier = 1;
        let timespan: 'minute' | 'hour' | 'day' | 'week' | 'month' = 'day';
        let from = new Date();
        const to = new Date();
        
        if (range === '1d') {
          timespan = 'minute';
          multiplier = 5;
          from.setDate(from.getDate() - 1);
        } else if (range === '5d') {
          timespan = 'hour';
          multiplier = 1;
          from.setDate(from.getDate() - 5);
        } else if (range === '1m') {
          timespan = 'day';
          multiplier = 1;
          from.setMonth(from.getMonth() - 1);
        } else if (range === '3m') {
          timespan = 'day';
          multiplier = 1;
          from.setMonth(from.getMonth() - 3);
        } else if (range === '6m') {
          timespan = 'day';
          multiplier = 1;
          from.setMonth(from.getMonth() - 6);
        } else if (range === 'ytd') {
          timespan = 'day';
          multiplier = 1;
          from = new Date(to.getFullYear(), 0, 1); // January 1st of current year
        } else if (range === '1y') {
          timespan = 'day';
          multiplier = 1;
          from.setFullYear(from.getFullYear() - 1);
        } else if (range === '2y') {
          timespan = 'week';
          multiplier = 1;
          from.setFullYear(from.getFullYear() - 2);
        } else if (range === '5y') {
          timespan = 'week';
          multiplier = 1;
          from.setFullYear(from.getFullYear() - 5);
        } else if (range === 'max') {
          timespan = 'month';
          multiplier = 1;
          from.setFullYear(from.getFullYear() - 20); // Arbitrary "max" of 20 years
        }
        
        const fromStr = from.toISOString().split('T')[0];
        const toStr = to.toISOString().split('T')[0];
        
        const bars = await service.getAggregatedBars(symbol, multiplier, timespan, fromStr, toStr);
        
        return bars.map(bar => ({
          date: new Date(bar.timestamp).toISOString().split('T')[0],
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
          volume: bar.volume
        }));
      }
      else if (service instanceof IEXCloudService) {
        // IEX Cloud range parameter matches our input format
        const prices = await service.getHistoricalPrices(symbol, range as any);
        
        return prices.map(price => ({
          date: price.date,
          open: price.open,
          high: price.high,
          low: price.low,
          close: price.close,
          volume: price.volume
        }));
      }
      
      throw new Error('No market data service available');
    } catch (error) {
      console.error(`Error getting historical prices for ${symbol}:`, error);
      
      // If the preferred provider failed and wasn't 'auto', try with 'auto'
      if (provider !== 'auto') {
        console.log(`Retrying with best available provider...`);
        return this.getHistoricalPrices(symbol, range, 'auto');
      }
      
      throw new ApiError(`Failed to get historical prices for ${symbol}`, 
        error instanceof ApiError ? error.status : undefined);
    }
  }

  /**
   * Search for symbols
   * @param query - Search query
   * @param provider - Preferred provider
   * @returns Promise with normalized search results
   */
  public async searchSymbols(
    query: string,
    provider: MarketDataProvider = 'auto'
  ): Promise<MarketSearchResult[]> {
    const service = this.getBestAvailableService(provider);
    
    try {
      if (service instanceof AlphaVantageService) {
        const results = await service.searchStocks(query);
        return results.map(result => ({
          symbol: result.symbol,
          name: result.name,
          type: result.type,
          exchange: result.region
        }));
      } 
      else if (service instanceof PolygonService) {
        const results = await service.searchTickers(query);
        return results.map(result => ({
          symbol: result.ticker,
          name: result.name,
          type: result.type,
          exchange: result.primaryExchange
        }));
      }
      else if (service instanceof IEXCloudService) {
        const results = await service.searchSymbols(query);
        return results.map(result => ({
          symbol: result.symbol,
          name: result.securityName || '',
          type: result.securityType || '',
          exchange: result.exchange || ''
        }));
      }
      
      throw new Error('No market data service available');
    } catch (error) {
      console.error(`Error searching for symbols with query "${query}":`, error);
      
      // If the preferred provider failed and wasn't 'auto', try with 'auto'
      if (provider !== 'auto') {
        console.log(`Retrying with best available provider...`);
        return this.searchSymbols(query, 'auto');
      }
      
      throw new ApiError(`Failed to search for symbols with query "${query}"`, 
        error instanceof ApiError ? error.status : undefined);
    }
  }
}

// Export singleton instance
export const marketDataService = MarketDataServiceFactory.getInstance();