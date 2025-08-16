import { BaseApiService, ApiError } from '../BaseApiService';
import { API_KEYS, DATA_SOURCE_CONFIG } from '../../../config/apiConfig';
import { AxiosRequestConfig } from 'axios';

/**
 * Order side type
 */
export type OrderSide = 'buy' | 'sell';

/**
 * Order type
 */
export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit';

/**
 * Order time in force
 */
export type TimeInForce = 'day' | 'gtc' | 'ioc' | 'fok';

/**
 * Order status
 */
export type OrderStatus = 
  | 'new'
  | 'filled'
  | 'partially_filled'
  | 'canceled'
  | 'expired'
  | 'rejected'
  | 'pending_new'
  | 'pending_cancel'
  | 'accepted'
  | 'pending_replace'
  | 'replaced'
  | 'done_for_day';

/**
 * Account interface
 */
export interface Account {
  id: string;
  status: string;
  currency: string;
  buying_power: string;
  cash: string;
  portfolio_value: string;
  pattern_day_trader: boolean;
  trading_blocked: boolean;
  transfers_blocked: boolean;
  account_blocked: boolean;
  created_at: string;
  trade_suspended_by_user: boolean;
  multiplier: string;
  equity: string;
  last_equity: string;
  long_market_value: string;
  short_market_value: string;
  initial_margin: string;
  maintenance_margin: string;
  last_maintenance_margin: string;
  daytrading_buying_power: string;
  regt_buying_power: string;
}

/**
 * Position interface
 */
export interface Position {
  asset_id: string;
  symbol: string;
  exchange: string;
  asset_class: string;
  avg_entry_price: string;
  qty: string;
  side: string;
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  unrealized_intraday_pl: string;
  unrealized_intraday_plpc: string;
  current_price: string;
  lastday_price: string;
  change_today: string;
}

/**
 * Order interface
 */
export interface Order {
  id: string;
  client_order_id: string;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  filled_at: string | null;
  expired_at: string | null;
  canceled_at: string | null;
  failed_at: string | null;
  replaced_at: string | null;
  replaced_by: string | null;
  replaces: string | null;
  asset_id: string;
  symbol: string;
  asset_class: string;
  qty: string;
  filled_qty: string;
  type: OrderType;
  side: OrderSide;
  time_in_force: TimeInForce;
  limit_price: string | null;
  stop_price: string | null;
  filled_avg_price: string | null;
  status: OrderStatus;
  extended_hours: boolean;
  legs: Order[] | null;
  trail_percent: string | null;
  trail_price: string | null;
  hwm: string | null;
}

/**
 * Order request interface
 */
export interface OrderRequest {
  symbol: string;
  qty: number;
  side: OrderSide;
  type: OrderType;
  time_in_force: TimeInForce;
  limit_price?: number;
  stop_price?: number;
  client_order_id?: string;
  extended_hours?: boolean;
  order_class?: string;
  take_profit?: {
    limit_price: number;
  };
  stop_loss?: {
    stop_price: number;
    limit_price?: number;
  };
  trail_price?: number;
  trail_percent?: number;
}

/**
 * Alpaca API service for trading operations
 */
export class AlpacaService extends BaseApiService {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly isPaper: boolean;

  /**
   * Constructor
   */
  constructor() {
    // Determine if we're using paper trading or live trading
    const isPaper = API_KEYS.alpaca?.paper !== false;
    const baseUrl = isPaper 
      ? 'https://paper-api.alpaca.markets' 
      : 'https://api.alpaca.markets';
    
    super(baseUrl);
    
    this.apiKey = API_KEYS.alpaca?.apiKey || '';
    this.apiSecret = API_KEYS.alpaca?.apiSecret || '';
    this.isPaper = isPaper;
  }

  /**
   * Check if the service is available
   * @returns True if the API keys are configured and not using mock data
   */
  public isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiSecret) && !DATA_SOURCE_CONFIG.forceMockData;
  }

  /**
   * Request interceptor to add API key
   * @param config - Axios request config
   * @returns Modified config with API key
   */
  protected requestInterceptor(config: AxiosRequestConfig): AxiosRequestConfig {
    // Call parent interceptor
    config = super.requestInterceptor(config);
    
    // Add API key and secret to headers
    config.headers = {
      ...config.headers,
      'APCA-API-KEY-ID': this.apiKey,
      'APCA-API-SECRET-KEY': this.apiSecret
    };
    
    return config;
  }

  /**
   * Get account information
   * @returns Promise with account information
   */
  public async getAccount(): Promise<Account> {
    try {
      return await this.get<Account>('/v2/account');
    } catch (error) {
      console.error('Error fetching account information from Alpaca:', error);
      throw error;
    }
  }

  /**
   * Get all positions
   * @returns Promise with array of positions
   */
  public async getPositions(): Promise<Position[]> {
    try {
      return await this.get<Position[]>('/v2/positions');
    } catch (error) {
      console.error('Error fetching positions from Alpaca:', error);
      throw error;
    }
  }

  /**
   * Get position for a symbol
   * @param symbol - Stock symbol
   * @returns Promise with position information
   */
  public async getPosition(symbol: string): Promise<Position> {
    try {
      return await this.get<Position>(`/v2/positions/${symbol}`);
    } catch (error) {
      console.error(`Error fetching position for ${symbol} from Alpaca:`, error);
      throw error;
    }
  }

  /**
   * Get all orders
   * @param status - Filter by order status
   * @param limit - Maximum number of orders to return
   * @returns Promise with array of orders
   */
  public async getOrders(status?: OrderStatus, limit?: number): Promise<Order[]> {
    try {
      const params: Record<string, any> = {};
      if (status) params.status = status;
      if (limit) params.limit = limit;
      
      return await this.get<Order[]>('/v2/orders', { params });
    } catch (error) {
      console.error('Error fetching orders from Alpaca:', error);
      throw error;
    }
  }

  /**
   * Get order by ID
   * @param orderId - Order ID
   * @returns Promise with order information
   */
  public async getOrder(orderId: string): Promise<Order> {
    try {
      return await this.get<Order>(`/v2/orders/${orderId}`);
    } catch (error) {
      console.error(`Error fetching order ${orderId} from Alpaca:`, error);
      throw error;
    }
  }

  /**
   * Create a new order
   * @param orderRequest - Order request
   * @returns Promise with created order
   */
  public async createOrder(orderRequest: OrderRequest): Promise<Order> {
    try {
      return await this.post<Order>('/v2/orders', orderRequest);
    } catch (error) {
      console.error('Error creating order with Alpaca:', error);
      throw error;
    }
  }

  /**
   * Cancel an order
   * @param orderId - Order ID
   * @returns Promise with void
   */
  public async cancelOrder(orderId: string): Promise<void> {
    try {
      await this.delete(`/v2/orders/${orderId}`);
    } catch (error) {
      console.error(`Error canceling order ${orderId} with Alpaca:`, error);
      throw error;
    }
  }

  /**
   * Cancel all orders
   * @returns Promise with array of canceled orders
   */
  public async cancelAllOrders(): Promise<Order[]> {
    try {
      return await this.delete<Order[]>('/v2/orders');
    } catch (error) {
      console.error('Error canceling all orders with Alpaca:', error);
      throw error;
    }
  }

  /**
   * Get account portfolio history
   * @param period - Time period ('1D', '1W', '1M', '3M', '1A', etc.)
   * @param timeframe - Time frame ('1Min', '5Min', '15Min', '1H', '1D')
   * @returns Promise with portfolio history
   */
  public async getPortfolioHistory(
    period?: string,
    timeframe?: string
  ): Promise<any> {
    try {
      const params: Record<string, any> = {};
      if (period) params.period = period;
      if (timeframe) params.timeframe = timeframe;
      
      return await this.get<any>('/v2/account/portfolio/history', { params });
    } catch (error) {
      console.error('Error fetching portfolio history from Alpaca:', error);
      throw error;
    }
  }

  /**
   * Get account activities
   * @param activityType - Activity type ('FILL', 'TRANS', etc.)
   * @param date - Date (YYYY-MM-DD)
   * @returns Promise with array of activities
   */
  public async getAccountActivities(
    activityType?: string,
    date?: string
  ): Promise<any[]> {
    try {
      const params: Record<string, any> = {};
      if (date) params.date = date;
      
      const endpoint = activityType 
        ? `/v2/account/activities/${activityType}` 
        : '/v2/account/activities';
      
      return await this.get<any[]>(endpoint, { params });
    } catch (error) {
      console.error('Error fetching account activities from Alpaca:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const alpacaService = new AlpacaService();