import { BaseApiService } from './BaseApiService';
import { addNotification } from '../../../store/slices/uiSlice';
import { store } from '../../../store';

/**
 * IEX Cloud API environments
 */
export enum IEXEnvironment {
  SANDBOX = 'sandbox',
  PRODUCTION = 'production'
}

/**
 * IEX Cloud API service for interacting with IEX Cloud APIs
 */
export class IEXCloudApiService extends BaseApiService {
  private environment: IEXEnvironment;
  private monthlyUsage: number = 0;
  private monthlyLimit: number = 0;
  private messageUsage: number = 0;
  private messageLimit: number = 0;

  /**
   * Create a new IEX Cloud API service
   * @param apiKey IEX Cloud API key (publishable token)
   * @param apiSecret IEX Cloud API secret (secret token)
   * @param environment IEX Cloud environment (sandbox or production)
   */
  constructor(
    apiKey: string,
    apiSecret: string,
    environment: IEXEnvironment = IEXEnvironment.PRODUCTION
  ) {
    const baseUrl = IEXCloudApiService.getBaseUrl(environment);
    super(baseUrl, apiKey, apiSecret);
    
    this.environment = environment;
    
    // Override default settings for IEX Cloud
    this.requestTimeout = 30000; // 30 seconds
    this.failureThreshold = 5;   // 5 failures to open circuit
    this.retryCount = 2;         // 2 retries (3 attempts total)
  }

  /**
   * Get the base URL for IEX Cloud API
   */
  private static getBaseUrl(environment: IEXEnvironment): string {
    return environment === IEXEnvironment.SANDBOX
      ? 'https://sandbox.iexapis.com/stable'
      : 'https://cloud.iexapis.com/stable';
  }

  /**
   * Get default headers for IEX Cloud API
   */
  protected getDefaultHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Make a GET request with the API token
   */
  protected async get<T = any>(url: string, config?: any): Promise<T> {
    // Append the token to the URL
    const separator = url.includes('?') ? '&' : '?';
    const tokenParam = `token=${this.apiKey}`;
    const urlWithToken = `${url}${separator}${tokenParam}`;
    
    try {
      const response = await super.get<T>(urlWithToken, config);
      this.updateUsageStats(response);
      return response;
    } catch (error: any) {
      this.handleIEXError(error, `Failed to get ${url}`);
      throw error;
    }
  }

  /**
   * Make a POST request with the API token
   */
  protected async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    // Append the token to the URL
    const separator = url.includes('?') ? '&' : '?';
    const tokenParam = `token=${this.apiKey}`;
    const urlWithToken = `${url}${separator}${tokenParam}`;
    
    try {
      const response = await super.post<T>(urlWithToken, data, config);
      this.updateUsageStats(response);
      return response;
    } catch (error: any) {
      this.handleIEXError(error, `Failed to post to ${url}`);
      throw error;
    }
  }

  /**
   * Update usage statistics from response headers
   */
  private updateUsageStats(response: any): void {
    if (response && response.headers) {
      // Monthly usage
      const monthlyUsage = response.headers['iexcloud-messages-used'];
      const monthlyLimit = response.headers['iexcloud-premium-limit'];
      
      if (monthlyUsage !== undefined) {
        this.monthlyUsage = parseInt(monthlyUsage, 10);
      }
      
      if (monthlyLimit !== undefined) {
        this.monthlyLimit = parseInt(monthlyLimit, 10);
      }
      
      // Message usage
      const messageUsage = response.headers['iexcloud-message-used'];
      const messageLimit = response.headers['iexcloud-message-limit'];
      
      if (messageUsage !== undefined) {
        this.messageUsage = parseInt(messageUsage, 10);
      }
      
      if (messageLimit !== undefined) {
        this.messageLimit = parseInt(messageLimit, 10);
      }
      
      // Log usage
      console.log(`IEX Cloud usage: ${this.monthlyUsage}/${this.monthlyLimit} monthly, ${this.messageUsage}/${this.messageLimit} per message`);
      
      // Warn if approaching limits
      if (this.monthlyLimit > 0 && this.monthlyUsage / this.monthlyLimit > 0.9) {
        console.warn(`IEX Cloud monthly usage at ${Math.round(this.monthlyUsage / this.monthlyLimit * 100)}%`);
        
        store.dispatch(addNotification({
          type: 'warning',
          title: 'API Usage Warning',
          message: `IEX Cloud monthly usage at ${Math.round(this.monthlyUsage / this.monthlyLimit * 100)}%. Consider upgrading your plan.`,
          autoHideDuration: 10000,
        }));
      }
    }
  }

  /**
   * Handle IEX Cloud API errors
   */
  private handleIEXError(error: any, defaultMessage: string): void {
    if (error.response) {
      const { status, data } = error.response;
      
      // Rate limiting
      if (status === 429) {
        store.dispatch(addNotification({
          type: 'warning',
          title: 'Rate Limit Exceeded',
          message: 'IEX Cloud API rate limit exceeded. Please try again later.',
          autoHideDuration: 10000,
        }));
        
        console.warn('IEX Cloud API rate limit exceeded');
      }
      // Authentication error
      else if (status === 401 || status === 403) {
        store.dispatch(addNotification({
          type: 'error',
          title: 'Authentication Error',
          message: 'Invalid IEX Cloud API credentials. Please check your API key.',
          autoHideDuration: 0, // Don't auto-hide this critical error
        }));
        
        console.error('IEX Cloud API authentication error:', data);
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
        
        console.error('IEX Cloud API bad request:', data);
      }
      // Not found
      else if (status === 404) {
        console.warn('IEX Cloud API resource not found:', error.config?.url);
      }
      // Server error
      else if (status >= 500) {
        store.dispatch(addNotification({
          type: 'error',
          title: 'IEX Cloud API Error',
          message: 'IEX Cloud API server error. Please try again later.',
          autoHideDuration: 10000,
        }));
        
        console.error('IEX Cloud API server error:', data);
      }
    }
    // Network error
    else if (error.request) {
      store.dispatch(addNotification({
        type: 'error',
        title: 'Connection Error',
        message: 'Unable to connect to IEX Cloud API. Please check your internet connection.',
        autoHideDuration: 10000,
      }));
      
      console.error('IEX Cloud API network error:', error);
    }
    // Other errors
    else {
      console.error('IEX Cloud API error:', error);
    }
  }

  /**
   * Get company information
   * @param symbol Stock symbol
   */
  public async getCompany(symbol: string): Promise<any> {
    return this.get(`/stock/${symbol}/company`);
  }

  /**
   * Get company logo
   * @param symbol Stock symbol
   */
  public async getLogo(symbol: string): Promise<any> {
    return this.get(`/stock/${symbol}/logo`);
  }

  /**
   * Get company news
   * @param symbol Stock symbol
   * @param last Number of news items to return
   */
  public async getNews(symbol: string, last: number = 10): Promise<any[]> {
    return this.get(`/stock/${symbol}/news/last/${last}`);
  }

  /**
   * Get quote
   * @param symbol Stock symbol
   */
  public async getQuote(symbol: string): Promise<any> {
    return this.get(`/stock/${symbol}/quote`);
  }

  /**
   * Get batch quotes
   * @param symbols Array of stock symbols
   * @param types Array of data types to fetch
   */
  public async getBatch(symbols: string[], types: string[] = ['quote']): Promise<any> {
    const symbolsParam = symbols.join(',');
    const typesParam = types.join(',');
    return this.get(`/stock/market/batch?symbols=${symbolsParam}&types=${typesParam}`);
  }

  /**
   * Get historical prices
   * @param symbol Stock symbol
   * @param range Time range (1d, 5d, 1m, 3m, 6m, ytd, 1y, 2y, 5y, max)
   * @param chartCloseOnly Only return close prices
   */
  public async getHistoricalPrices(symbol: string, range: string = '1m', chartCloseOnly: boolean = false): Promise<any[]> {
    return this.get(`/stock/${symbol}/chart/${range}?chartCloseOnly=${chartCloseOnly}`);
  }

  /**
   * Get intraday prices
   * @param symbol Stock symbol
   */
  public async getIntradayPrices(symbol: string): Promise<any[]> {
    return this.get(`/stock/${symbol}/intraday-prices`);
  }

  /**
   * Get key stats
   * @param symbol Stock symbol
   */
  public async getStats(symbol: string): Promise<any> {
    return this.get(`/stock/${symbol}/stats`);
  }

  /**
   * Get income statement
   * @param symbol Stock symbol
   * @param period Period (annual or quarter)
   * @param last Number of statements to return
   */
  public async getIncome(symbol: string, period: string = 'quarter', last: number = 4): Promise<any> {
    return this.get(`/stock/${symbol}/income?period=${period}&last=${last}`);
  }

  /**
   * Get balance sheet
   * @param symbol Stock symbol
   * @param period Period (annual or quarter)
   * @param last Number of statements to return
   */
  public async getBalanceSheet(symbol: string, period: string = 'quarter', last: number = 4): Promise<any> {
    return this.get(`/stock/${symbol}/balance-sheet?period=${period}&last=${last}`);
  }

  /**
   * Get cash flow
   * @param symbol Stock symbol
   * @param period Period (annual or quarter)
   * @param last Number of statements to return
   */
  public async getCashFlow(symbol: string, period: string = 'quarter', last: number = 4): Promise<any> {
    return this.get(`/stock/${symbol}/cash-flow?period=${period}&last=${last}`);
  }

  /**
   * Get earnings
   * @param symbol Stock symbol
   * @param last Number of earnings to return
   */
  public async getEarnings(symbol: string, last: number = 4): Promise<any> {
    return this.get(`/stock/${symbol}/earnings?last=${last}`);
  }

  /**
   * Get dividends
   * @param symbol Stock symbol
   * @param range Time range (1m, 3m, 6m, ytd, 1y, 2y, 5y)
   */
  public async getDividends(symbol: string, range: string = '1y'): Promise<any[]> {
    return this.get(`/stock/${symbol}/dividends/${range}`);
  }

  /**
   * Get institutional ownership
   * @param symbol Stock symbol
   */
  public async getInstitutionalOwnership(symbol: string): Promise<any[]> {
    return this.get(`/stock/${symbol}/institutional-ownership`);
  }

  /**
   * Get insider transactions
   * @param symbol Stock symbol
   */
  public async getInsiderTransactions(symbol: string): Promise<any[]> {
    return this.get(`/stock/${symbol}/insider-transactions`);
  }

  /**
   * Get peers
   * @param symbol Stock symbol
   */
  public async getPeers(symbol: string): Promise<string[]> {
    return this.get(`/stock/${symbol}/peers`);
  }

  /**
   * Get market information
   */
  public async getMarket(): Promise<any> {
    return this.get('/market');
  }

  /**
   * Get sector performance
   */
  public async getSectorPerformance(): Promise<any[]> {
    return this.get('/stock/market/sector-performance');
  }

  /**
   * Get market news
   * @param last Number of news items to return
   */
  public async getMarketNews(last: number = 10): Promise<any[]> {
    return this.get(`/stock/market/news/last/${last}`);
  }

  /**
   * Get list of symbols
   */
  public async getSymbols(): Promise<any[]> {
    return this.get('/ref-data/symbols');
  }

  /**
   * Get list of exchanges
   */
  public async getExchanges(): Promise<any[]> {
    return this.get('/ref-data/exchanges');
  }

  /**
   * Get list of holidays
   */
  public async getHolidays(): Promise<any[]> {
    return this.get('/ref-data/us/dates/trade/next/5');
  }
}

// Create singleton instance
const iexCloudApi = new IEXCloudApiService(
  process.env.REACT_APP_IEX_CLOUD_API_KEY || '',
  process.env.REACT_APP_IEX_CLOUD_API_SECRET || '',
  process.env.REACT_APP_IEX_CLOUD_ENVIRONMENT === 'sandbox' ? IEXEnvironment.SANDBOX : IEXEnvironment.PRODUCTION
);

export { iexCloudApi };