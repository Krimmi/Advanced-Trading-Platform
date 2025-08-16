import unifiedDataProvider from '../api/providers/UnifiedDataProvider';
import { store } from '../../store';
import { updateMarketData } from '../../store/slices/marketSlice';
import { addNotification } from '../../store/slices/uiSlice';

/**
 * Market data types
 */
export enum MarketDataType {
  QUOTE = 'quote',
  TRADE = 'trade',
  BAR = 'bar',
  DAILY_BAR = 'dailyBar',
  NEWS = 'news',
  COMPANY = 'company',
  FINANCIALS = 'financials',
  MARKET_STATUS = 'marketStatus'
}

/**
 * Bar timeframes
 */
export enum BarTimeframe {
  ONE_MINUTE = '1m',
  FIVE_MINUTES = '5m',
  FIFTEEN_MINUTES = '15m',
  THIRTY_MINUTES = '30m',
  ONE_HOUR = '1h',
  ONE_DAY = '1d'
}

/**
 * Financial statement types
 */
export enum FinancialStatementType {
  INCOME = 'income',
  BALANCE = 'balance',
  CASH_FLOW = 'cash'
}

/**
 * Financial statement periods
 */
export enum FinancialPeriod {
  ANNUAL = 'annual',
  QUARTER = 'quarter'
}

/**
 * Market data service
 * Provides access to market data through the unified data provider
 */
export class MarketDataService {
  private watchedSymbols: Set<string> = new Set();
  private isWebSocketConnected: boolean = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private reconnectAttempts = 0;

  /**
   * Initialize the market data service
   */
  public async initialize(): Promise<void> {
    try {
      // Get market status
      const marketStatus = await this.getMarketStatus();
      console.log('Market status:', marketStatus);

      // Initialize watched symbols from store
      const state = store.getState();
      if (state.trading && state.trading.watchedSymbols) {
        state.trading.watchedSymbols.forEach(symbol => {
          this.watchedSymbols.add(symbol);
        });
      }

      // Connect to WebSocket if we have watched symbols
      if (this.watchedSymbols.size > 0) {
        await this.connectRealTimeData();
      }
    } catch (error) {
      console.error('Failed to initialize market data service:', error);
      
      store.dispatch(addNotification({
        type: 'error',
        title: 'Initialization Error',
        message: 'Failed to initialize market data service. Some features may be unavailable.',
        autoHideDuration: 10000,
      }));
    }
  }

  /**
   * Connect to real-time data stream
   */
  public async connectRealTimeData(): Promise<void> {
    if (this.isWebSocketConnected || this.watchedSymbols.size === 0) {
      return;
    }

    try {
      const symbols = Array.from(this.watchedSymbols);
      const dataTypes = ['quotes', 'trades', 'bars'];

      await unifiedDataProvider.connectWebSocket(symbols, dataTypes, {
        trade: this.handleTradeUpdate.bind(this),
        quote: this.handleQuoteUpdate.bind(this),
        bar: this.handleBarUpdate.bind(this)
      });

      this.isWebSocketConnected = true;
      this.reconnectAttempts = 0;

      console.log('Connected to real-time market data');
    } catch (error) {
      console.error('Failed to connect to real-time market data:', error);
      
      // Attempt to reconnect
      this.attemptReconnect();
    }
  }

  /**
   * Attempt to reconnect to WebSocket
   */
  private attemptReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnect attempts reached');
      
      store.dispatch(addNotification({
        type: 'error',
        title: 'Connection Error',
        message: 'Failed to connect to real-time market data. Please refresh the page.',
        autoHideDuration: 0, // Don't auto-hide this critical error
      }));
      
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`Attempting to reconnect in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connectRealTimeData().catch(console.error);
    }, delay);
  }

  /**
   * Disconnect from real-time data stream
   */
  public disconnectRealTimeData(): void {
    if (!this.isWebSocketConnected) {
      return;
    }

    try {
      unifiedDataProvider.disconnectWebSocket();
      this.isWebSocketConnected = false;
      console.log('Disconnected from real-time market data');
    } catch (error) {
      console.error('Error disconnecting from real-time market data:', error);
    }
  }

  /**
   * Add a symbol to watch list
   * @param symbol Symbol to watch
   */
  public async addSymbolToWatchList(symbol: string): Promise<void> {
    if (this.watchedSymbols.has(symbol)) {
      return;
    }

    this.watchedSymbols.add(symbol);

    // If WebSocket is connected, subscribe to the new symbol
    if (this.isWebSocketConnected) {
      try {
        await unifiedDataProvider.connectWebSocket([symbol], ['quotes', 'trades', 'bars'], {
          trade: this.handleTradeUpdate.bind(this),
          quote: this.handleQuoteUpdate.bind(this),
          bar: this.handleBarUpdate.bind(this)
        });
      } catch (error) {
        console.error(`Failed to subscribe to ${symbol}:`, error);
      }
    }
    // Otherwise connect if this is the first symbol
    else if (this.watchedSymbols.size === 1) {
      await this.connectRealTimeData();
    }

    // Prefetch data for the new symbol
    this.prefetchSymbolData(symbol);
  }

  /**
   * Remove a symbol from watch list
   * @param symbol Symbol to remove
   */
  public removeSymbolFromWatchList(symbol: string): void {
    if (!this.watchedSymbols.has(symbol)) {
      return;
    }

    this.watchedSymbols.delete(symbol);

    // If WebSocket is connected, unsubscribe from the symbol
    if (this.isWebSocketConnected) {
      try {
        // Note: This is a simplified approach. In a real implementation,
        // you would need to track subscriptions per symbol and unsubscribe accordingly.
        // For now, we'll just disconnect and reconnect if there are still symbols to watch.
        unifiedDataProvider.disconnectWebSocket();
        this.isWebSocketConnected = false;

        if (this.watchedSymbols.size > 0) {
          this.connectRealTimeData().catch(console.error);
        }
      } catch (error) {
        console.error(`Failed to unsubscribe from ${symbol}:`, error);
      }
    }
  }

  /**
   * Prefetch data for a symbol
   * @param symbol Symbol to prefetch data for
   */
  private prefetchSymbolData(symbol: string): void {
    // Add common data types to prefetch queue
    unifiedDataProvider.addToPrefetchQueue('getQuote', symbol);
    unifiedDataProvider.addToPrefetchQueue('getCompanyInfo', symbol);
    unifiedDataProvider.addToPrefetchQueue('getBars', symbol, '1d', this.getStartDate(30), this.getEndDate());
    unifiedDataProvider.addToPrefetchQueue('getNews', symbol, 5);
  }

  /**
   * Handle trade update from WebSocket
   * @param data Trade data
   */
  private handleTradeUpdate(data: any): void {
    store.dispatch(updateMarketData({
      type: 'TRADE_UPDATE',
      data
    }));
  }

  /**
   * Handle quote update from WebSocket
   * @param data Quote data
   */
  private handleQuoteUpdate(data: any): void {
    store.dispatch(updateMarketData({
      type: 'QUOTE_UPDATE',
      data
    }));
  }

  /**
   * Handle bar update from WebSocket
   * @param data Bar data
   */
  private handleBarUpdate(data: any): void {
    store.dispatch(updateMarketData({
      type: 'BAR_UPDATE',
      data
    }));
  }

  /**
   * Get quote for a symbol
   * @param symbol Symbol to get quote for
   */
  public async getQuote(symbol: string): Promise<any> {
    try {
      return await unifiedDataProvider.getQuote(symbol);
    } catch (error) {
      console.error(`Failed to get quote for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get quotes for multiple symbols
   * @param symbols Symbols to get quotes for
   */
  public async getQuotes(symbols: string[]): Promise<Record<string, any>> {
    try {
      return await unifiedDataProvider.getQuotes(symbols);
    } catch (error) {
      console.error(`Failed to get quotes for ${symbols.join(', ')}:`, error);
      throw error;
    }
  }

  /**
   * Get historical bars for a symbol
   * @param symbol Symbol to get bars for
   * @param timeframe Bar timeframe
   * @param days Number of days of history to get
   */
  public async getBars(
    symbol: string,
    timeframe: BarTimeframe = BarTimeframe.ONE_DAY,
    days: number = 30
  ): Promise<any[]> {
    try {
      const start = this.getStartDate(days);
      const end = this.getEndDate();
      
      return await unifiedDataProvider.getBars(symbol, timeframe, start, end);
    } catch (error) {
      console.error(`Failed to get bars for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get company information
   * @param symbol Symbol to get company info for
   */
  public async getCompanyInfo(symbol: string): Promise<any> {
    try {
      return await unifiedDataProvider.getCompanyInfo(symbol);
    } catch (error) {
      console.error(`Failed to get company info for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get news for a symbol
   * @param symbol Symbol to get news for
   * @param limit Maximum number of news items to return
   */
  public async getNews(symbol: string, limit: number = 10): Promise<any[]> {
    try {
      return await unifiedDataProvider.getNews(symbol, limit);
    } catch (error) {
      console.error(`Failed to get news for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get financial statements
   * @param symbol Symbol to get financials for
   * @param type Statement type
   * @param period Statement period
   * @param limit Number of statements to return
   */
  public async getFinancials(
    symbol: string,
    type: FinancialStatementType = FinancialStatementType.INCOME,
    period: FinancialPeriod = FinancialPeriod.QUARTER,
    limit: number = 4
  ): Promise<any> {
    try {
      return await unifiedDataProvider.getFinancials(symbol, type, period, limit);
    } catch (error) {
      console.error(`Failed to get financials for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get market status
   */
  public async getMarketStatus(): Promise<any> {
    try {
      return await unifiedDataProvider.getMarketStatus();
    } catch (error) {
      console.error('Failed to get market status:', error);
      throw error;
    }
  }

  /**
   * Get start date for historical data
   * @param days Number of days to go back
   */
  private getStartDate(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get end date for historical data
   */
  private getEndDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}

// Create singleton instance
const marketDataService = new MarketDataService();
export default marketDataService;