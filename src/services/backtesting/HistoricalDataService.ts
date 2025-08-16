import { EventEmitter } from 'events';
import axios from 'axios';
import { Bar } from '../../services/market-data/IMarketDataProvider';
import { environmentConfig } from '../config/EnvironmentConfig';
import { secretManager } from '../config/SecretManager';

/**
 * Historical data service options
 */
export interface HistoricalDataOptions {
  dataSource: 'alpaca' | 'polygon' | 'iex' | 'csv';
  apiKey?: string;
  apiSecret?: string;
  baseUrl?: string;
  dataDir?: string;
  cacheDuration?: number; // in seconds
}

/**
 * Historical bar data request parameters
 */
export interface HistoricalBarParams {
  symbol: string;
  timeframe: string;
  start: Date;
  end: Date;
  limit?: number;
  adjustment?: 'raw' | 'split' | 'dividend' | 'all';
}

/**
 * Historical data service
 * 
 * This service provides access to historical market data from various sources
 */
export class HistoricalDataService extends EventEmitter {
  private static instance: HistoricalDataService;
  
  private options: HistoricalDataOptions;
  private cache: Map<string, { data: Bar[], timestamp: number }> = new Map();
  private isInitialized: boolean = false;
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    super();
    
    // Default options
    this.options = {
      dataSource: 'alpaca',
      cacheDuration: 3600 // 1 hour
    };
  }
  
  /**
   * Get the singleton instance
   * @returns The singleton instance
   */
  public static getInstance(): HistoricalDataService {
    if (!HistoricalDataService.instance) {
      HistoricalDataService.instance = new HistoricalDataService();
    }
    return HistoricalDataService.instance;
  }
  
  /**
   * Initialize the historical data service
   * @param options Options for the service
   */
  public async initialize(options: Partial<HistoricalDataOptions> = {}): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    // Merge options
    this.options = {
      ...this.options,
      ...options
    };
    
    // If no API key/secret provided, get from secret manager
    if (!this.options.apiKey || !this.options.apiSecret) {
      switch (this.options.dataSource) {
        case 'alpaca':
          const alpacaCredentials = secretManager.getApiCredentials('alpaca');
          this.options.apiKey = alpacaCredentials.apiKey;
          this.options.apiSecret = alpacaCredentials.apiSecret;
          
          // Set base URL if not provided
          if (!this.options.baseUrl) {
            const alpacaConfig = environmentConfig.getApiConfig('alpaca');
            this.options.baseUrl = alpacaConfig.dataUrl || 'https://data.alpaca.markets';
          }
          break;
          
        case 'polygon':
          const polygonCredentials = secretManager.getApiCredentials('polygon');
          this.options.apiKey = polygonCredentials.apiKey;
          
          // Set base URL if not provided
          if (!this.options.baseUrl) {
            this.options.baseUrl = 'https://api.polygon.io';
          }
          break;
          
        case 'iex':
          const iexCredentials = secretManager.getApiCredentials('iex');
          this.options.apiKey = iexCredentials.apiKey;
          
          // Set base URL if not provided
          if (!this.options.baseUrl) {
            this.options.baseUrl = 'https://cloud.iexapis.com/stable';
          }
          break;
      }
    }
    
    this.isInitialized = true;
    console.log(`Historical Data Service initialized with data source: ${this.options.dataSource}`);
  }
  
  /**
   * Get historical bar data
   * @param params Request parameters
   * @returns Array of bars
   */
  public async getBars(params: HistoricalBarParams): Promise<Bar[]> {
    if (!this.isInitialized) {
      throw new Error('Historical Data Service is not initialized');
    }
    
    // Check cache first
    const cacheKey = this.getCacheKey(params);
    const cachedData = this.cache.get(cacheKey);
    
    if (cachedData && Date.now() - cachedData.timestamp < this.options.cacheDuration! * 1000) {
      return cachedData.data;
    }
    
    // Fetch data based on data source
    let bars: Bar[];
    
    switch (this.options.dataSource) {
      case 'alpaca':
        bars = await this.getAlpacaBars(params);
        break;
        
      case 'polygon':
        bars = await this.getPolygonBars(params);
        break;
        
      case 'iex':
        bars = await this.getIEXBars(params);
        break;
        
      case 'csv':
        bars = await this.getCSVBars(params);
        break;
        
      default:
        throw new Error(`Unsupported data source: ${this.options.dataSource}`);
    }
    
    // Cache the data
    this.cache.set(cacheKey, {
      data: bars,
      timestamp: Date.now()
    });
    
    return bars;
  }
  
  /**
   * Get historical bar data from Alpaca
   * @param params Request parameters
   * @returns Array of bars
   */
  private async getAlpacaBars(params: HistoricalBarParams): Promise<Bar[]> {
    try {
      // Map timeframe to Alpaca format
      const timeframe = this.mapTimeframeToAlpaca(params.timeframe);
      
      // Make API request
      const url = `${this.options.baseUrl}/v2/stocks/${params.symbol}/bars`;
      const response = await axios.get(url, {
        headers: {
          'APCA-API-KEY-ID': this.options.apiKey!,
          'APCA-API-SECRET-KEY': this.options.apiSecret!
        },
        params: {
          start: params.start.toISOString(),
          end: params.end.toISOString(),
          timeframe,
          limit: params.limit || 1000,
          adjustment: params.adjustment || 'raw'
        }
      });
      
      // Transform response to our format
      return response.data.bars.map((bar: any) => ({
        symbol: params.symbol,
        timestamp: new Date(bar.t),
        open: parseFloat(bar.o),
        high: parseFloat(bar.h),
        low: parseFloat(bar.l),
        close: parseFloat(bar.c),
        volume: parseInt(bar.v),
        timeframe: params.timeframe
      }));
    } catch (error) {
      console.error('Error fetching historical data from Alpaca:', error);
      throw error;
    }
  }
  
  /**
   * Get historical bar data from Polygon
   * @param params Request parameters
   * @returns Array of bars
   */
  private async getPolygonBars(params: HistoricalBarParams): Promise<Bar[]> {
    try {
      // Map timeframe to Polygon format
      const multiplier = parseInt(params.timeframe.match(/\d+/)![0]);
      let timespan: string;
      
      if (params.timeframe.includes('m')) {
        timespan = 'minute';
      } else if (params.timeframe.includes('h')) {
        timespan = 'hour';
      } else if (params.timeframe.includes('d')) {
        timespan = 'day';
      } else if (params.timeframe.includes('w')) {
        timespan = 'week';
      } else {
        timespan = 'minute';
      }
      
      // Format dates for Polygon API
      const from = params.start.toISOString().split('T')[0];
      const to = params.end.toISOString().split('T')[0];
      
      // Make API request
      const url = `${this.options.baseUrl}/v2/aggs/ticker/${params.symbol}/range/${multiplier}/${timespan}/${from}/${to}`;
      const response = await axios.get(url, {
        params: {
          apiKey: this.options.apiKey,
          limit: params.limit || 5000,
          adjusted: params.adjustment === 'all' || params.adjustment === 'split'
        }
      });
      
      // Transform response to our format
      return response.data.results.map((bar: any) => ({
        symbol: params.symbol,
        timestamp: new Date(bar.t),
        open: bar.o,
        high: bar.h,
        low: bar.l,
        close: bar.c,
        volume: bar.v,
        timeframe: params.timeframe
      }));
    } catch (error) {
      console.error('Error fetching historical data from Polygon:', error);
      throw error;
    }
  }
  
  /**
   * Get historical bar data from IEX
   * @param params Request parameters
   * @returns Array of bars
   */
  private async getIEXBars(params: HistoricalBarParams): Promise<Bar[]> {
    try {
      // Map timeframe to IEX format
      let range: string;
      
      if (params.timeframe === '1d') {
        // Calculate date range
        const days = Math.ceil((params.end.getTime() - params.start.getTime()) / (1000 * 60 * 60 * 24));
        
        if (days <= 5) {
          range = '5d';
        } else if (days <= 30) {
          range = '1m';
        } else if (days <= 90) {
          range = '3m';
        } else if (days <= 180) {
          range = '6m';
        } else if (days <= 365) {
          range = '1y';
        } else if (days <= 730) {
          range = '2y';
        } else if (days <= 1825) {
          range = '5y';
        } else {
          range = 'max';
        }
      } else {
        // For intraday data, IEX only supports 1d with 1m intervals
        range = 'date';
      }
      
      // Make API request
      let url: string;
      let params_: any;
      
      if (range === 'date') {
        // For specific date
        const dateStr = params.start.toISOString().split('T')[0];
        url = `${this.options.baseUrl}/stock/${params.symbol}/chart/date/${dateStr.replace(/-/g, '')}`;
        params_ = {
          token: this.options.apiKey,
          chartByDay: true
        };
      } else {
        // For date range
        url = `${this.options.baseUrl}/stock/${params.symbol}/chart/${range}`;
        params_ = {
          token: this.options.apiKey,
          chartByDay: true
        };
      }
      
      const response = await axios.get(url, { params: params_ });
      
      // Transform response to our format
      return response.data.map((bar: any) => ({
        symbol: params.symbol,
        timestamp: new Date(bar.date),
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume,
        timeframe: params.timeframe
      }));
    } catch (error) {
      console.error('Error fetching historical data from IEX:', error);
      throw error;
    }
  }
  
  /**
   * Get historical bar data from CSV files
   * @param params Request parameters
   * @returns Array of bars
   */
  private async getCSVBars(params: HistoricalBarParams): Promise<Bar[]> {
    try {
      // This is a placeholder for CSV file loading
      // In a real implementation, this would read from CSV files in the dataDir
      
      console.warn('CSV data source not fully implemented');
      return [];
    } catch (error) {
      console.error('Error fetching historical data from CSV:', error);
      throw error;
    }
  }
  
  /**
   * Map timeframe to Alpaca format
   * @param timeframe Our timeframe format
   * @returns Alpaca timeframe format
   */
  private mapTimeframeToAlpaca(timeframe: string): string {
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
        return '1Min';
    }
  }
  
  /**
   * Get a cache key for the request parameters
   * @param params Request parameters
   * @returns Cache key
   */
  private getCacheKey(params: HistoricalBarParams): string {
    return `${params.symbol}-${params.timeframe}-${params.start.getTime()}-${params.end.getTime()}-${params.adjustment || 'raw'}`;
  }
  
  /**
   * Clear the cache
   */
  public clearCache(): void {
    this.cache.clear();
    console.log('Historical data cache cleared');
  }
  
  /**
   * Clear the cache for a specific symbol
   * @param symbol Symbol to clear cache for
   */
  public clearCacheForSymbol(symbol: string): void {
    // Remove all cache entries for this symbol
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${symbol}-`)) {
        this.cache.delete(key);
      }
    }
    
    console.log(`Historical data cache cleared for ${symbol}`);
  }
}

// Export singleton instance
export const historicalDataService = HistoricalDataService.getInstance();