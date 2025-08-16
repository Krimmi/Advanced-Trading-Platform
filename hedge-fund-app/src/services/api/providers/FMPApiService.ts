import { BaseApiService } from './BaseApiService';
import { addNotification } from '../../../store/slices/uiSlice';
import { store } from '../../../store';

/**
 * Rate limiter for FMP API to ensure we don't exceed 300 calls per minute
 */
class RateLimiter {
  private callsPerMinute: number;
  private callTimestamps: number[] = [];
  private waitingQueue: { resolve: Function, reject: Function }[] = [];
  private processingQueue: boolean = false;

  constructor(callsPerMinute: number = 300) {
    this.callsPerMinute = callsPerMinute;
    
    // Clean up old timestamps every minute
    setInterval(() => this.cleanupOldTimestamps(), 60000);
  }

  /**
   * Check if a call can be made and wait if necessary
   */
  public async acquireToken(): Promise<void> {
    // Clean up old timestamps
    this.cleanupOldTimestamps();
    
    // If we haven't reached the limit, allow the call immediately
    if (this.callTimestamps.length < this.callsPerMinute) {
      this.recordCall();
      return Promise.resolve();
    }
    
    // Otherwise, wait for a token to become available
    return new Promise((resolve, reject) => {
      this.waitingQueue.push({ resolve, reject });
      
      // Start processing the queue if it's not already running
      if (!this.processingQueue) {
        this.processQueue();
      }
    });
  }

  /**
   * Record a new API call
   */
  private recordCall(): void {
    this.callTimestamps.push(Date.now());
  }

  /**
   * Clean up timestamps older than 1 minute
   */
  private cleanupOldTimestamps(): void {
    const oneMinuteAgo = Date.now() - 60000;
    this.callTimestamps = this.callTimestamps.filter(timestamp => timestamp > oneMinuteAgo);
  }

  /**
   * Process the waiting queue
   */
  private processQueue(): void {
    if (this.waitingQueue.length === 0) {
      this.processingQueue = false;
      return;
    }
    
    this.processingQueue = true;
    
    // Check if we can make a call now
    this.cleanupOldTimestamps();
    
    if (this.callTimestamps.length < this.callsPerMinute) {
      // Get the next request from the queue
      const next = this.waitingQueue.shift();
      if (next) {
        this.recordCall();
        next.resolve();
      }
      
      // Continue processing the queue
      setTimeout(() => this.processQueue(), 0);
    } else {
      // Calculate time until the oldest call is 1 minute old
      const oldestCall = this.callTimestamps[0];
      const timeToWait = Math.max(0, oldestCall + 60000 - Date.now());
      
      // Wait until we can make another call
      setTimeout(() => this.processQueue(), timeToWait + 10); // Add 10ms buffer
    }
  }
}

/**
 * Financial Modeling Prep (FMP) API service
 */
export class FMPApiService extends BaseApiService {
  private rateLimiter: RateLimiter;

  /**
   * Create a new FMP API service
   * @param apiKey FMP API key
   */
  constructor(apiKey: string) {
    super('https://financialmodelingprep.com/api/v3', apiKey);
    
    // Create rate limiter with 300 calls per minute limit
    this.rateLimiter = new RateLimiter(300);
    
    // Override default settings for FMP
    this.requestTimeout = 30000; // 30 seconds
    this.failureThreshold = 5;   // 5 failures to open circuit
    this.retryCount = 2;         // 2 retries (3 attempts total)
  }

  /**
   * Get default headers for FMP API
   */
  protected getDefaultHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Make a GET request with rate limiting
   */
  protected async get<T = any>(url: string, config?: any): Promise<T> {
    // Append the API key to the URL if not already present
    if (!url.includes('apikey=')) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}apikey=${this.apiKey}`;
    }
    
    // Acquire a token from the rate limiter
    await this.rateLimiter.acquireToken();
    
    try {
      return await super.get<T>(url, config);
    } catch (error: any) {
      this.handleFMPError(error, `Failed to get ${url}`);
      throw error;
    }
  }

  /**
   * Handle FMP API errors
   */
  private handleFMPError(error: any, defaultMessage: string): void {
    if (error.response) {
      const { status, data } = error.response;
      
      // Rate limiting
      if (status === 429) {
        store.dispatch(addNotification({
          type: 'warning',
          title: 'Rate Limit Exceeded',
          message: 'FMP API rate limit exceeded. Please try again later.',
          autoHideDuration: 10000,
        }));
        
        console.warn('FMP API rate limit exceeded');
      }
      // Authentication error
      else if (status === 401 || status === 403) {
        store.dispatch(addNotification({
          type: 'error',
          title: 'Authentication Error',
          message: 'Invalid FMP API key. Please check your API key.',
          autoHideDuration: 0, // Don't auto-hide this critical error
        }));
        
        console.error('FMP API authentication error:', data);
      }
      // Bad request
      else if (status === 400) {
        const errorMessage = typeof data === 'string' ? data : data.error || defaultMessage;
        
        store.dispatch(addNotification({
          type: 'error',
          title: 'Invalid Request',
          message: errorMessage,
          autoHideDuration: 7000,
        }));
        
        console.error('FMP API bad request:', data);
      }
      // Not found
      else if (status === 404) {
        console.warn('FMP API resource not found:', error.config?.url);
      }
      // Server error
      else if (status >= 500) {
        store.dispatch(addNotification({
          type: 'error',
          title: 'FMP API Error',
          message: 'FMP API server error. Please try again later.',
          autoHideDuration: 10000,
        }));
        
        console.error('FMP API server error:', data);
      }
    }
    // Network error
    else if (error.request) {
      store.dispatch(addNotification({
        type: 'error',
        title: 'Connection Error',
        message: 'Unable to connect to FMP API. Please check your internet connection.',
        autoHideDuration: 10000,
      }));
      
      console.error('FMP API network error:', error);
    }
    // Other errors
    else {
      console.error('FMP API error:', error);
    }
  }

  /**
   * Get company profile
   * @param symbol Stock symbol
   */
  public async getCompanyProfile(symbol: string): Promise<any> {
    return this.get(`/profile/${symbol}`).then(response => Array.isArray(response) ? response[0] : response);
  }

  /**
   * Get company quotes
   * @param symbol Stock symbol or array of symbols
   */
  public async getQuote(symbol: string | string[]): Promise<any> {
    const symbols = Array.isArray(symbol) ? symbol.join(',') : symbol;
    return this.get(`/quote/${symbols}`);
  }

  /**
   * Get historical price data
   * @param symbol Stock symbol
   * @param from Start date (YYYY-MM-DD)
   * @param to End date (YYYY-MM-DD)
   * @param timeframe Timeframe (1min, 5min, 15min, 30min, 1hour, 4hour, daily)
   */
  public async getHistoricalPrice(
    symbol: string,
    from: string,
    to: string,
    timeframe: string = 'daily'
  ): Promise<any> {
    // Map timeframe to FMP format
    let fmpTimeframe: string;
    switch (timeframe) {
      case '1m':
        fmpTimeframe = '1min';
        break;
      case '5m':
        fmpTimeframe = '5min';
        break;
      case '15m':
        fmpTimeframe = '15min';
        break;
      case '30m':
        fmpTimeframe = '30min';
        break;
      case '1h':
        fmpTimeframe = '1hour';
        break;
      case '4h':
        fmpTimeframe = '4hour';
        break;
      case '1d':
      default:
        fmpTimeframe = 'daily';
        break;
    }
    
    if (fmpTimeframe === 'daily') {
      return this.get(`/historical-price-full/${symbol}`, {
        params: {
          from,
          to
        }
      }).then(response => response.historical || []);
    } else {
      return this.get(`/historical-chart/${fmpTimeframe}/${symbol}`, {
        params: {
          from,
          to
        }
      });
    }
  }

  /**
   * Get income statement
   * @param symbol Stock symbol
   * @param period Period (annual or quarter)
   * @param limit Number of statements to return
   */
  public async getIncomeStatement(
    symbol: string,
    period: string = 'annual',
    limit: number = 5
  ): Promise<any> {
    return this.get(`/income-statement/${symbol}`, {
      params: {
        period,
        limit
      }
    });
  }

  /**
   * Get balance sheet
   * @param symbol Stock symbol
   * @param period Period (annual or quarter)
   * @param limit Number of statements to return
   */
  public async getBalanceSheet(
    symbol: string,
    period: string = 'annual',
    limit: number = 5
  ): Promise<any> {
    return this.get(`/balance-sheet-statement/${symbol}`, {
      params: {
        period,
        limit
      }
    });
  }

  /**
   * Get cash flow statement
   * @param symbol Stock symbol
   * @param period Period (annual or quarter)
   * @param limit Number of statements to return
   */
  public async getCashFlowStatement(
    symbol: string,
    period: string = 'annual',
    limit: number = 5
  ): Promise<any> {
    return this.get(`/cash-flow-statement/${symbol}`, {
      params: {
        period,
        limit
      }
    });
  }

  /**
   * Get key metrics
   * @param symbol Stock symbol
   * @param period Period (annual or quarter)
   * @param limit Number of periods to return
   */
  public async getKeyMetrics(
    symbol: string,
    period: string = 'annual',
    limit: number = 5
  ): Promise<any> {
    return this.get(`/key-metrics/${symbol}`, {
      params: {
        period,
        limit
      }
    });
  }

  /**
   * Get financial ratios
   * @param symbol Stock symbol
   * @param period Period (annual or quarter)
   * @param limit Number of periods to return
   */
  public async getFinancialRatios(
    symbol: string,
    period: string = 'annual',
    limit: number = 5
  ): Promise<any> {
    return this.get(`/ratios/${symbol}`, {
      params: {
        period,
        limit
      }
    });
  }

  /**
   * Get company financial growth
   * @param symbol Stock symbol
   * @param period Period (annual or quarter)
   * @param limit Number of periods to return
   */
  public async getFinancialGrowth(
    symbol: string,
    period: string = 'annual',
    limit: number = 5
  ): Promise<any> {
    return this.get(`/financial-growth/${symbol}`, {
      params: {
        period,
        limit
      }
    });
  }

  /**
   * Get company enterprise value
   * @param symbol Stock symbol
   * @param period Period (annual or quarter)
   * @param limit Number of periods to return
   */
  public async getEnterpriseValue(
    symbol: string,
    period: string = 'annual',
    limit: number = 5
  ): Promise<any> {
    return this.get(`/enterprise-values/${symbol}`, {
      params: {
        period,
        limit
      }
    });
  }

  /**
   * Get company DCF (Discounted Cash Flow)
   * @param symbol Stock symbol
   * @param period Period (annual or quarter)
   * @param limit Number of periods to return
   */
  public async getDCF(
    symbol: string,
    period: string = 'annual',
    limit: number = 5
  ): Promise<any> {
    return this.get(`/discounted-cash-flow/${symbol}`, {
      params: {
        period,
        limit
      }
    });
  }

  /**
   * Get company earnings
   * @param symbol Stock symbol
   * @param limit Number of earnings to return
   */
  public async getEarnings(symbol: string, limit: number = 5): Promise<any> {
    return this.get(`/earnings/${symbol}`, {
      params: {
        limit
      }
    });
  }

  /**
   * Get company earnings calendar
   * @param symbol Stock symbol
   * @param from Start date (YYYY-MM-DD)
   * @param to End date (YYYY-MM-DD)
   */
  public async getEarningsCalendar(
    symbol?: string,
    from?: string,
    to?: string
  ): Promise<any> {
    const params: Record<string, any> = {};
    
    if (symbol) params.symbol = symbol;
    if (from) params.from = from;
    if (to) params.to = to;
    
    return this.get('/earning_calendar', { params });
  }

  /**
   * Get company news
   * @param symbol Stock symbol
   * @param limit Number of news items to return
   */
  public async getNews(symbol: string, limit: number = 10): Promise<any> {
    return this.get(`/stock_news`, {
      params: {
        tickers: symbol,
        limit
      }
    });
  }

  /**
   * Get market news
   * @param limit Number of news items to return
   */
  public async getMarketNews(limit: number = 10): Promise<any> {
    return this.get('/stock_news', {
      params: {
        limit
      }
    });
  }

  /**
   * Get stock list
   */
  public async getStockList(): Promise<any> {
    return this.get('/stock/list');
  }

  /**
   * Get stock screener results
   * @param params Screening parameters
   */
  public async screenStocks(params: Record<string, any>): Promise<any> {
    return this.get('/stock-screener', { params });
  }

  /**
   * Get sector performance
   */
  public async getSectorPerformance(): Promise<any> {
    return this.get('/sector-performance');
  }

  /**
   * Get market indexes
   */
  public async getMarketIndexes(): Promise<any> {
    return this.get('/quotes/index');
  }

  /**
   * Get market movers (gainers, losers, active)
   * @param type Type of movers (gainers, losers, active)
   */
  public async getMarketMovers(type: 'gainers' | 'losers' | 'active'): Promise<any> {
    return this.get(`/stock_market/${type}`);
  }
}

// Create singleton instance
const fmpApi = new FMPApiService(
  process.env.REACT_APP_FMP_API_KEY || ''
);

export { fmpApi };