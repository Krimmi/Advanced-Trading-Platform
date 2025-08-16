import { BaseApiService, ApiError } from '../BaseApiService';
import { API_KEYS, DATA_SOURCE_CONFIG } from '../../../config/apiConfig';
import { AxiosRequestConfig } from 'axios';

/**
 * Order side type
 */
export type OrderSide = 'BUY' | 'SELL';

/**
 * Order type
 */
export type OrderType = 'MKT' | 'LMT' | 'STP' | 'STP_LMT';

/**
 * Order time in force
 */
export type TimeInForce = 'DAY' | 'GTC' | 'IOC' | 'FOK';

/**
 * Order status
 */
export type OrderStatus = 
  | 'Submitted'
  | 'Filled'
  | 'Cancelled'
  | 'PendingSubmit'
  | 'PendingCancel'
  | 'PreSubmitted'
  | 'Inactive';

/**
 * Account interface
 */
export interface IBAccount {
  id: string;
  accountId: string;
  accountType: string;
  accountTitle: string;
  currency: string;
  availableFunds: number;
  cashBalance: number;
  equityWithLoanValue: number;
  buyingPower: number;
  netLiquidation: number;
  totalCashValue: number;
  totalPositionsValue: number;
  realizedPnL: number;
  unrealizedPnL: number;
}

/**
 * Position interface
 */
export interface IBPosition {
  conid: number;
  symbol: string;
  position: number;
  avgCost: number;
  marketPrice: number;
  marketValue: number;
  realizedPnL: number;
  unrealizedPnL: number;
}

/**
 * Order interface
 */
export interface IBOrder {
  orderId: number;
  clientId: number;
  permId: number;
  symbol: string;
  side: OrderSide;
  orderType: OrderType;
  quantity: number;
  filledQuantity: number;
  limitPrice: number | null;
  stopPrice: number | null;
  timeInForce: TimeInForce;
  status: OrderStatus;
  createTime: string;
  updateTime: string;
  fillTime: string | null;
  remainingQuantity: number;
  avgFillPrice: number | null;
}

/**
 * Order request interface
 */
export interface IBOrderRequest {
  symbol: string;
  side: OrderSide;
  orderType: OrderType;
  quantity: number;
  limitPrice?: number;
  stopPrice?: number;
  timeInForce?: TimeInForce;
  outsideRth?: boolean;
  tif?: string;
  account?: string;
}

/**
 * Interactive Brokers API service for trading operations
 * Note: This is a simplified implementation as IB typically requires a more complex setup
 * with their Client Portal API or TWS API
 */
export class InteractiveBrokersService extends BaseApiService {
  private readonly accountId: string;
  private readonly apiKey: string;

  /**
   * Constructor
   */
  constructor() {
    // In a real implementation, this would connect to IB's Client Portal API or TWS API
    super('https://localhost:5000/v1/api');
    
    this.accountId = API_KEYS.interactiveBrokers?.accountId || '';
    this.apiKey = API_KEYS.interactiveBrokers?.apiKey || '';
  }

  /**
   * Check if the service is available
   * @returns True if the API keys are configured and not using mock data
   */
  public isAvailable(): boolean {
    return Boolean(this.accountId && this.apiKey) && !DATA_SOURCE_CONFIG.forceMockData;
  }

  /**
   * Request interceptor to add API key
   * @param config - Axios request config
   * @returns Modified config with API key
   */
  protected requestInterceptor(config: AxiosRequestConfig): AxiosRequestConfig {
    // Call parent interceptor
    config = super.requestInterceptor(config);
    
    // Add API key to headers
    config.headers = {
      ...config.headers,
      'X-API-KEY': this.apiKey
    };
    
    return config;
  }

  /**
   * Get account information
   * @returns Promise with account information
   */
  public async getAccount(): Promise<IBAccount> {
    try {
      return await this.get<IBAccount>(`/portfolio/${this.accountId}/summary`);
    } catch (error) {
      console.error('Error fetching account information from Interactive Brokers:', error);
      throw error;
    }
  }

  /**
   * Get all positions
   * @returns Promise with array of positions
   */
  public async getPositions(): Promise<IBPosition[]> {
    try {
      return await this.get<IBPosition[]>(`/portfolio/${this.accountId}/positions`);
    } catch (error) {
      console.error('Error fetching positions from Interactive Brokers:', error);
      throw error;
    }
  }

  /**
   * Get all orders
   * @returns Promise with array of orders
   */
  public async getOrders(): Promise<IBOrder[]> {
    try {
      return await this.get<IBOrder[]>(`/iserver/account/${this.accountId}/orders`);
    } catch (error) {
      console.error('Error fetching orders from Interactive Brokers:', error);
      throw error;
    }
  }

  /**
   * Get order by ID
   * @param orderId - Order ID
   * @returns Promise with order information
   */
  public async getOrder(orderId: number): Promise<IBOrder> {
    try {
      const orders = await this.getOrders();
      const order = orders.find(o => o.orderId === orderId);
      
      if (!order) {
        throw new ApiError(`Order ${orderId} not found`, 404);
      }
      
      return order;
    } catch (error) {
      console.error(`Error fetching order ${orderId} from Interactive Brokers:`, error);
      throw error;
    }
  }

  /**
   * Create a new order
   * @param orderRequest - Order request
   * @returns Promise with created order
   */
  public async createOrder(orderRequest: IBOrderRequest): Promise<IBOrder> {
    try {
      // Set default account if not provided
      const request = {
        ...orderRequest,
        account: orderRequest.account || this.accountId
      };
      
      return await this.post<IBOrder>('/iserver/account/orders', request);
    } catch (error) {
      console.error('Error creating order with Interactive Brokers:', error);
      throw error;
    }
  }

  /**
   * Cancel an order
   * @param orderId - Order ID
   * @returns Promise with cancellation status
   */
  public async cancelOrder(orderId: number): Promise<any> {
    try {
      return await this.delete<any>(`/iserver/account/${this.accountId}/order/${orderId}`);
    } catch (error) {
      console.error(`Error canceling order ${orderId} with Interactive Brokers:`, error);
      throw error;
    }
  }

  /**
   * Get account portfolio allocation
   * @returns Promise with portfolio allocation
   */
  public async getPortfolioAllocation(): Promise<any> {
    try {
      return await this.get<any>(`/portfolio/${this.accountId}/allocation`);
    } catch (error) {
      console.error('Error fetching portfolio allocation from Interactive Brokers:', error);
      throw error;
    }
  }

  /**
   * Get account performance
   * @param period - Time period ('1D', '1W', '1M', '3M', '1Y', 'YTD')
   * @returns Promise with performance data
   */
  public async getPerformance(period: string = '1M'): Promise<any> {
    try {
      return await this.get<any>(`/portfolio/${this.accountId}/performance`, {
        params: { period }
      });
    } catch (error) {
      console.error('Error fetching performance data from Interactive Brokers:', error);
      throw error;
    }
  }

  /**
   * Get market data for a symbol
   * @param symbol - Stock symbol
   * @returns Promise with market data
   */
  public async getMarketData(symbol: string): Promise<any> {
    try {
      return await this.get<any>('/iserver/marketdata/snapshot', {
        params: { symbols: symbol }
      });
    } catch (error) {
      console.error(`Error fetching market data for ${symbol} from Interactive Brokers:`, error);
      throw error;
    }
  }

  /**
   * Search for contracts
   * @param symbol - Symbol to search for
   * @returns Promise with search results
   */
  public async searchContracts(symbol: string): Promise<any[]> {
    try {
      return await this.get<any[]>('/iserver/secdef/search', {
        params: { symbol }
      });
    } catch (error) {
      console.error(`Error searching contracts for ${symbol} with Interactive Brokers:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const interactiveBrokersService = new InteractiveBrokersService();