import { MarketQuote, MarketHistoricalPrice, MarketSearchResult } from './MarketDataServiceFactory';

/**
 * Mock data provider for market data services
 * Used when real API keys are not available or when in development mode
 */
export class MockMarketDataProvider {
  private static instance: MockMarketDataProvider;
  
  // Cache for generated data to ensure consistency
  private quoteCache: Map<string, MarketQuote> = new Map();
  private historicalCache: Map<string, MarketHistoricalPrice[]> = new Map();
  
  // Common stock symbols for realistic mock data
  private readonly commonStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Cyclical' },
    { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology' },
    { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financial Services' },
    { symbol: 'V', name: 'Visa Inc.', sector: 'Financial Services' },
    { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
    { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer Defensive' },
    { symbol: 'PG', name: 'Procter & Gamble Co.', sector: 'Consumer Defensive' },
    { symbol: 'MA', name: 'Mastercard Inc.', sector: 'Financial Services' },
    { symbol: 'UNH', name: 'UnitedHealth Group Inc.', sector: 'Healthcare' },
    { symbol: 'HD', name: 'Home Depot Inc.', sector: 'Consumer Cyclical' },
    { symbol: 'BAC', name: 'Bank of America Corp.', sector: 'Financial Services' },
    { symbol: 'DIS', name: 'Walt Disney Co.', sector: 'Communication Services' },
    { symbol: 'ADBE', name: 'Adobe Inc.', sector: 'Technology' },
    { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Communication Services' },
    { symbol: 'CRM', name: 'Salesforce Inc.', sector: 'Technology' }
  ];

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): MockMarketDataProvider {
    if (!MockMarketDataProvider.instance) {
      MockMarketDataProvider.instance = new MockMarketDataProvider();
    }
    return MockMarketDataProvider.instance;
  }

  /**
   * Get a mock quote for a symbol
   * @param symbol - Stock symbol
   * @returns Mock quote data
   */
  public getQuote(symbol: string): MarketQuote {
    // Check if we already have a cached quote for this symbol
    if (this.quoteCache.has(symbol)) {
      return this.quoteCache.get(symbol)!;
    }

    // Find the stock in our common stocks list or create a generic one
    const stockInfo = this.commonStocks.find(s => s.symbol === symbol) || 
      { symbol, name: `${symbol} Inc.`, sector: 'Unknown' };

    // Generate a realistic price based on the symbol's character codes
    const basePrice = this.getBasePrice(symbol);
    
    // Generate a random change within a reasonable range (-5% to +5%)
    const changePercent = (Math.random() * 10) - 5;
    const change = basePrice * (changePercent / 100);
    const price = basePrice + change;
    
    // Generate other realistic values
    const previousClose = basePrice;
    const open = previousClose * (1 + (Math.random() * 0.02 - 0.01)); // ±1% from previous close
    const high = Math.max(price, open) * (1 + (Math.random() * 0.02)); // Up to 2% higher than max of price/open
    const low = Math.min(price, open) * (1 - (Math.random() * 0.02)); // Up to 2% lower than min of price/open
    const volume = Math.floor(Math.random() * 10000000) + 500000; // Between 500K and 10.5M
    
    // Create the quote
    const quote: MarketQuote = {
      symbol,
      price: parseFloat(price.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume,
      previousClose: parseFloat(previousClose.toFixed(2)),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      timestamp: new Date().toISOString()
    };
    
    // Cache the quote
    this.quoteCache.set(symbol, quote);
    
    return quote;
  }

  /**
   * Get mock historical prices for a symbol
   * @param symbol - Stock symbol
   * @param range - Time range
   * @returns Array of mock historical prices
   */
  public getHistoricalPrices(symbol: string, range: string = '1m'): MarketHistoricalPrice[] {
    // Create a cache key that includes the range
    const cacheKey = `${symbol}-${range}`;
    
    // Check if we already have cached data
    if (this.historicalCache.has(cacheKey)) {
      return this.historicalCache.get(cacheKey)!;
    }
    
    // Determine number of data points based on range
    let days: number;
    switch (range) {
      case '1d': days = 1; break;
      case '5d': days = 5; break;
      case '1m': days = 30; break;
      case '3m': days = 90; break;
      case '6m': days = 180; break;
      case 'ytd': days = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24)); break;
      case '1y': days = 365; break;
      case '2y': days = 730; break;
      case '5y': days = 1825; break;
      case 'max': days = 3650; break; // ~10 years
      default: days = 30; // Default to 1 month
    }
    
    // For intraday data (1d), generate hourly data points
    const dataPoints: MarketHistoricalPrice[] = [];
    const basePrice = this.getBasePrice(symbol);
    let currentPrice = basePrice;
    
    // Generate data points
    if (range === '1d') {
      // For 1d, generate hourly data (market hours: 9:30 AM - 4:00 PM = 6.5 hours)
      const today = new Date();
      today.setHours(9, 30, 0, 0); // Start at market open
      
      for (let i = 0; i < 7; i++) { // 7 hourly points
        const pointDate = new Date(today);
        pointDate.setHours(pointDate.getHours() + i);
        
        // Random walk from previous price
        currentPrice = this.getNextPrice(currentPrice);
        
        // Generate OHLC data
        const open = currentPrice;
        const close = this.getNextPrice(open);
        const high = Math.max(open, close) * (1 + (Math.random() * 0.01)); // Up to 1% higher
        const low = Math.min(open, close) * (1 - (Math.random() * 0.01)); // Up to 1% lower
        const volume = Math.floor(Math.random() * 1000000) + 100000; // Between 100K and 1.1M
        
        dataPoints.push({
          date: pointDate.toISOString(),
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume
        });
        
        currentPrice = close;
      }
    } else {
      // For other ranges, generate daily data
      const endDate = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const pointDate = new Date(endDate);
        pointDate.setDate(pointDate.getDate() - i);
        
        // Skip weekends
        const dayOfWeek = pointDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;
        
        // Random walk from previous price
        currentPrice = this.getNextPrice(currentPrice);
        
        // Generate OHLC data
        const open = currentPrice;
        const close = this.getNextPrice(open);
        const high = Math.max(open, close) * (1 + (Math.random() * 0.02)); // Up to 2% higher
        const low = Math.min(open, close) * (1 - (Math.random() * 0.02)); // Up to 2% lower
        const volume = Math.floor(Math.random() * 10000000) + 500000; // Between 500K and 10.5M
        
        dataPoints.push({
          date: pointDate.toISOString().split('T')[0],
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume
        });
        
        currentPrice = close;
      }
    }
    
    // Cache the data
    this.historicalCache.set(cacheKey, dataPoints);
    
    return dataPoints;
  }

  /**
   * Search for symbols
   * @param query - Search query
   * @returns Array of search results
   */
  public searchSymbols(query: string): MarketSearchResult[] {
    query = query.toLowerCase();
    
    // Filter common stocks based on the query
    const results = this.commonStocks
      .filter(stock => 
        stock.symbol.toLowerCase().includes(query) || 
        stock.name.toLowerCase().includes(query) ||
        stock.sector.toLowerCase().includes(query)
      )
      .map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        type: 'Common Stock',
        exchange: 'NASDAQ'
      }));
    
    // If no results or very few, add some generic ones
    if (results.length < 3) {
      for (let i = results.length; i < 3; i++) {
        results.push({
          symbol: `${query.toUpperCase()}${i}`,
          name: `${query.charAt(0).toUpperCase() + query.slice(1)} Corporation ${i}`,
          type: 'Common Stock',
          exchange: 'NYSE'
        });
      }
    }
    
    return results;
  }

  /**
   * Generate a base price for a symbol
   * @param symbol - Stock symbol
   * @returns Base price
   */
  private getBasePrice(symbol: string): number {
    // Generate a consistent price based on the symbol's character codes
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      hash = ((hash << 5) - hash) + symbol.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    
    // Use the hash to generate a price between $10 and $1000
    const basePrice = Math.abs(hash % 990) + 10;
    return basePrice;
  }

  /**
   * Generate the next price in a random walk
   * @param currentPrice - Current price
   * @returns Next price
   */
  private getNextPrice(currentPrice: number): number {
    // Random walk with drift
    const percentChange = (Math.random() * 2 - 1) * 2; // -2% to +2%
    return currentPrice * (1 + percentChange / 100);
  }
}

// Export singleton instance
export const mockMarketDataProvider = MockMarketDataProvider.getInstance();