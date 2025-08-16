import { TimeSeriesData } from './TimeSeriesPreprocessor';

/**
 * Class for loading market data from various sources
 */
export class MarketDataLoader {
  private apiKey: string;
  private baseUrl: string;
  private dataSource: DataSource;

  /**
   * Constructor for MarketDataLoader
   * @param config Data loader configuration
   */
  constructor(config: MarketDataLoaderConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || this.getDefaultBaseUrl(config.dataSource);
    this.dataSource = config.dataSource;
  }

  /**
   * Get the default base URL for a data source
   * @param dataSource Data source
   * @returns Base URL
   */
  private getDefaultBaseUrl(dataSource: DataSource): string {
    switch (dataSource) {
      case 'alphavantage':
        return 'https://www.alphavantage.co/query';
      case 'polygon':
        return 'https://api.polygon.io';
      case 'iex':
        return 'https://cloud.iexapis.com/stable';
      case 'yahoo':
        return 'https://query1.finance.yahoo.com/v8/finance';
      default:
        return '';
    }
  }

  /**
   * Load historical market data for a symbol
   * @param symbol Stock symbol
   * @param startDate Start date
   * @param endDate End date
   * @param interval Data interval
   * @returns Promise with time series data
   */
  async loadHistoricalData(
    symbol: string,
    startDate: Date,
    endDate: Date = new Date(),
    interval: DataInterval = 'daily'
  ): Promise<TimeSeriesData[]> {
    try {
      // In a real implementation, this would make an API call
      // For now, we'll return mock data
      return this.getMockHistoricalData(symbol, startDate, endDate, interval);
    } catch (error) {
      console.error(`Error loading historical data for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Load real-time market data for a symbol
   * @param symbol Stock symbol
   * @returns Promise with time series data
   */
  async loadRealTimeData(symbol: string): Promise<TimeSeriesData> {
    try {
      // In a real implementation, this would make an API call
      // For now, we'll return mock data
      return this.getMockRealTimeData(symbol);
    } catch (error) {
      console.error(`Error loading real-time data for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Load batch market data for multiple symbols
   * @param symbols Array of stock symbols
   * @returns Promise with time series data for each symbol
   */
  async loadBatchData(symbols: string[]): Promise<Record<string, TimeSeriesData>> {
    try {
      // In a real implementation, this would make an API call
      // For now, we'll return mock data
      const result: Record<string, TimeSeriesData> = {};
      
      for (const symbol of symbols) {
        result[symbol] = this.getMockRealTimeData(symbol);
      }
      
      return result;
    } catch (error) {
      console.error(`Error loading batch data for ${symbols.join(', ')}:`, error);
      throw error;
    }
  }

  /**
   * Generate mock historical data
   * @param symbol Stock symbol
   * @param startDate Start date
   * @param endDate End date
   * @param interval Data interval
   * @returns Mock time series data
   */
  private getMockHistoricalData(
    symbol: string,
    startDate: Date,
    endDate: Date,
    interval: DataInterval
  ): TimeSeriesData[] {
    const data: TimeSeriesData[] = [];
    const currentDate = new Date(startDate);
    
    // Set base price based on symbol
    let basePrice = 100;
    if (symbol === 'AAPL') basePrice = 150;
    if (symbol === 'MSFT') basePrice = 300;
    if (symbol === 'GOOGL') basePrice = 2500;
    if (symbol === 'AMZN') basePrice = 3000;
    
    // Generate data points
    while (currentDate <= endDate) {
      // Skip weekends
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Generate random price movements
        const randomFactor = 0.02; // 2% daily volatility
        const dailyChange = (Math.random() - 0.5) * 2 * randomFactor * basePrice;
        
        const open = basePrice;
        const close = basePrice + dailyChange;
        const high = Math.max(open, close) + Math.random() * Math.abs(dailyChange);
        const low = Math.min(open, close) - Math.random() * Math.abs(dailyChange);
        const volume = Math.floor(Math.random() * 10000000) + 1000000;
        
        data.push({
          timestamp: new Date(currentDate),
          symbol,
          open,
          high,
          low,
          close,
          volume,
          adjustedClose: close
        });
        
        // Update base price for next day
        basePrice = close;
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return data;
  }

  /**
   * Generate mock real-time data
   * @param symbol Stock symbol
   * @returns Mock time series data
   */
  private getMockRealTimeData(symbol: string): TimeSeriesData {
    // Set base price based on symbol
    let basePrice = 100;
    if (symbol === 'AAPL') basePrice = 150;
    if (symbol === 'MSFT') basePrice = 300;
    if (symbol === 'GOOGL') basePrice = 2500;
    if (symbol === 'AMZN') basePrice = 3000;
    
    // Generate random price movements
    const randomFactor = 0.01; // 1% volatility
    const priceChange = (Math.random() - 0.5) * 2 * randomFactor * basePrice;
    
    const open = basePrice - priceChange / 2;
    const close = basePrice + priceChange;
    const high = Math.max(open, close) + Math.random() * Math.abs(priceChange);
    const low = Math.min(open, close) - Math.random() * Math.abs(priceChange);
    const volume = Math.floor(Math.random() * 1000000) + 100000;
    
    return {
      timestamp: new Date(),
      symbol,
      open,
      high,
      low,
      close,
      volume,
      adjustedClose: close
    };
  }

  /**
   * Get the data source
   * @returns Data source
   */
  getDataSource(): DataSource {
    return this.dataSource;
  }

  /**
   * Get the API key
   * @returns API key
   */
  getApiKey(): string {
    return this.apiKey;
  }

  /**
   * Get the base URL
   * @returns Base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

/**
 * Data source types
 */
export type DataSource = 'alphavantage' | 'polygon' | 'iex' | 'yahoo' | 'custom';

/**
 * Data interval types
 */
export type DataInterval = '1min' | '5min' | '15min' | '30min' | '60min' | 'daily' | 'weekly' | 'monthly';

/**
 * Configuration interface for market data loader
 */
export interface MarketDataLoaderConfig {
  apiKey: string;
  dataSource: DataSource;
  baseUrl?: string;
}