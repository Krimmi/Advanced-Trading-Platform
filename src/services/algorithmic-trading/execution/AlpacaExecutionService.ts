import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { BaseExecutionService } from './BaseExecutionService';
import { OrderParams, OrderType, OrderSide, TimeInForce, OrderStatus } from '../../../models/algorithmic-trading/OrderTypes';
import { environmentConfig } from '../../config/EnvironmentConfig';
import { secretManager } from '../../config/SecretManager';

/**
 * Alpaca API execution service
 * 
 * Implements order execution through the Alpaca API
 */
export class AlpacaExecutionService extends BaseExecutionService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;
  private isPaperTrading: boolean;
  private accountId: string = '';
  private isInitialized: boolean = false;
  
  /**
   * Constructor
   * @param config Configuration for the service
   */
  constructor(config: Record<string, any> = {}) {
    super('Alpaca Execution Service');
    
    // Set default values
    this.apiKey = config.apiKey || '';
    this.apiSecret = config.apiSecret || '';
    this.baseUrl = config.baseUrl || '';
    this.isPaperTrading = config.isPaperTrading !== false;
  }
  
  /**
   * Initialize the execution service
   * @param config Configuration for the service
   */
  protected async onInitialize(config: Record<string, any>): Promise<void> {
    // Get API credentials from config or secret manager
    if (!this.apiKey || !this.apiSecret) {
      const credentials = secretManager.getApiCredentials('alpaca');
      this.apiKey = credentials.apiKey;
      this.apiSecret = credentials.apiSecret;
    }
    
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('Alpaca API key and secret are required');
    }
    
    // Set base URL based on paper/live mode
    if (!this.baseUrl) {
      const alpacaConfig = environmentConfig.getApiConfig('alpaca');
      this.baseUrl = alpacaConfig.baseUrl;
      this.isPaperTrading = alpacaConfig.paperTrading;
    }
    
    // Validate the API credentials
    try {
      const account = await this.getAccount();
      this.accountId = account.id;
      console.log(`Connected to Alpaca account: ${this.accountId} (${account.account_number})`);
      console.log(`Trading mode: ${this.isPaperTrading ? 'Paper' : 'Live'}`);
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Alpaca execution service:', error);
      throw new Error('Failed to initialize Alpaca execution service: Invalid credentials or API error');
    }
  }
  
  /**
   * Create an order
   * @param params Order parameters
   * @returns Created order
   */
  protected async onCreateOrder(params: OrderParams): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Alpaca execution service is not initialized');
    }
    
    try {
      // Convert our order params to Alpaca format
      const alpacaOrder = this.convertToAlpacaOrder(params);
      
      // Send the order to Alpaca
      const response = await axios.post(
        `${this.baseUrl}/v2/orders`,
        alpacaOrder,
        {
          headers: this.getHeaders()
        }
      );
      
      // Convert Alpaca response to our format
      const order = this.convertFromAlpacaOrder(response.data);
      
      // Add our internal order ID and metadata
      order.internalId = params.internalId || uuidv4();
      order.metadata = {
        ...order.metadata,
        ...params.metadata,
        alpacaId: response.data.id,
        createdAt: new Date(),
        source: 'alpaca'
      };
      
      return order;
    } catch (error: any) {
      console.error('Error creating order with Alpaca:', error);
      
      // Throw a more informative error
      if (error.response) {
        throw new Error(`Alpaca API error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        throw new Error('Alpaca API request failed: No response received');
      } else {
        throw new Error(`Alpaca order creation error: ${error.message}`);
      }
    }
  }
  
  /**
   * Cancel an order
   * @param orderId Order ID to cancel
   * @returns Canceled order
   */
  protected async onCancelOrder(orderId: string): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Alpaca execution service is not initialized');
    }
    
    try {
      // First, check if the order exists and get its Alpaca ID
      const order = await this.getOrder(orderId);
      const alpacaId = order.metadata?.alpacaId;
      
      if (!alpacaId) {
        throw new Error(`Order ${orderId} does not have an Alpaca ID`);
      }
      
      // Cancel the order with Alpaca
      await axios.delete(
        `${this.baseUrl}/v2/orders/${alpacaId}`,
        {
          headers: this.getHeaders()
        }
      );
      
      // Update the order status
      order.status = OrderStatus.CANCELED;
      order.metadata = {
        ...order.metadata,
        canceledAt: new Date()
      };
      
      return order;
    } catch (error: any) {
      console.error('Error canceling order with Alpaca:', error);
      
      // Throw a more informative error
      if (error.response) {
        throw new Error(`Alpaca API error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        throw new Error('Alpaca API request failed: No response received');
      } else {
        throw new Error(`Alpaca order cancellation error: ${error.message}`);
      }
    }
  }
  
  /**
   * Get an order by ID
   * @param orderId Order ID
   * @returns Order details
   */
  protected async onGetOrder(orderId: string): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Alpaca execution service is not initialized');
    }
    
    // First check our internal order cache
    const cachedOrder = this.orders.get(orderId);
    if (cachedOrder) {
      // If the order has an Alpaca ID, get the latest status from Alpaca
      const alpacaId = cachedOrder.metadata?.alpacaId;
      
      if (alpacaId) {
        try {
          const response = await axios.get(
            `${this.baseUrl}/v2/orders/${alpacaId}`,
            {
              headers: this.getHeaders()
            }
          );
          
          // Update the cached order with the latest status
          const updatedOrder = this.convertFromAlpacaOrder(response.data);
          updatedOrder.internalId = cachedOrder.internalId;
          updatedOrder.metadata = {
            ...cachedOrder.metadata,
            ...updatedOrder.metadata,
            lastUpdated: new Date()
          };
          
          // Update the cache
          this.orders.set(orderId, updatedOrder);
          
          return updatedOrder;
        } catch (error: any) {
          // If the order is not found on Alpaca, it might have been filled or canceled
          if (error.response && error.response.status === 404) {
            // Try to get the order from the order history
            try {
              const orders = await this.getOrders({ status: 'all', limit: 100 });
              const matchingOrder = orders.find(o => o.metadata?.alpacaId === alpacaId);
              
              if (matchingOrder) {
                // Update the cache
                this.orders.set(orderId, matchingOrder);
                return matchingOrder;
              }
            } catch (historyError) {
              console.error('Error getting order history:', historyError);
            }
          }
          
          console.error('Error getting order from Alpaca:', error);
          
          // Return the cached order with a warning
          cachedOrder.metadata = {
            ...cachedOrder.metadata,
            warning: 'Order status may be outdated - failed to get latest status from Alpaca',
            lastAttemptedUpdate: new Date()
          };
          
          return cachedOrder;
        }
      }
      
      // If no Alpaca ID, just return the cached order
      return cachedOrder;
    }
    
    // If not in cache, throw an error
    throw new Error(`Order ${orderId} not found`);
  }
  
  /**
   * Get all orders
   * @param params Query parameters
   * @returns Array of orders
   */
  protected async onGetOrders(params?: Record<string, any>): Promise<any[]> {
    if (!this.isInitialized) {
      throw new Error('Alpaca execution service is not initialized');
    }
    
    try {
      // Convert our params to Alpaca format
      const queryParams: Record<string, any> = {};
      
      if (params) {
        if (params.status) {
          queryParams.status = params.status;
        }
        if (params.limit) {
          queryParams.limit = params.limit;
        }
        if (params.after) {
          queryParams.after = params.after;
        }
        if (params.until) {
          queryParams.until = params.until;
        }
        if (params.direction) {
          queryParams.direction = params.direction;
        }
        if (params.symbols) {
          queryParams.symbols = Array.isArray(params.symbols) ? params.symbols.join(',') : params.symbols;
        }
      }
      
      // Get orders from Alpaca
      const response = await axios.get(
        `${this.baseUrl}/v2/orders`,
        {
          headers: this.getHeaders(),
          params: queryParams
        }
      );
      
      // Convert Alpaca orders to our format
      const orders = response.data.map((alpacaOrder: any) => {
        const order = this.convertFromAlpacaOrder(alpacaOrder);
        
        // Check if we have this order in our cache
        const cachedOrder = Array.from(this.orders.values()).find(
          o => o.metadata?.alpacaId === alpacaOrder.id
        );
        
        if (cachedOrder) {
          order.internalId = cachedOrder.internalId;
          order.metadata = {
            ...cachedOrder.metadata,
            ...order.metadata,
            lastUpdated: new Date()
          };
          
          // Update the cache
          this.orders.set(cachedOrder.internalId, order);
        } else {
          // Add to cache with a new internal ID
          order.internalId = uuidv4();
          order.metadata = {
            ...order.metadata,
            alpacaId: alpacaOrder.id,
            source: 'alpaca'
          };
          
          this.orders.set(order.internalId, order);
        }
        
        return order;
      });
      
      return orders;
    } catch (error: any) {
      console.error('Error getting orders from Alpaca:', error);
      
      // Throw a more informative error
      if (error.response) {
        throw new Error(`Alpaca API error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        throw new Error('Alpaca API request failed: No response received');
      } else {
        throw new Error(`Alpaca get orders error: ${error.message}`);
      }
    }
  }
  
  /**
   * Get account information
   * @returns Account details
   */
  public async getAccount(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v2/account`,
        {
          headers: this.getHeaders()
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Error getting account from Alpaca:', error);
      
      // Throw a more informative error
      if (error.response) {
        throw new Error(`Alpaca API error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        throw new Error('Alpaca API request failed: No response received');
      } else {
        throw new Error(`Alpaca get account error: ${error.message}`);
      }
    }
  }
  
  /**
   * Get positions
   * @returns Array of positions
   */
  public async getPositions(): Promise<any[]> {
    if (!this.isInitialized) {
      throw new Error('Alpaca execution service is not initialized');
    }
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/v2/positions`,
        {
          headers: this.getHeaders()
        }
      );
      
      // Convert Alpaca positions to our format
      return response.data.map((alpacaPosition: any) => ({
        symbol: alpacaPosition.symbol,
        quantity: parseFloat(alpacaPosition.qty),
        side: parseFloat(alpacaPosition.qty) > 0 ? 'LONG' : 'SHORT',
        averageEntryPrice: parseFloat(alpacaPosition.avg_entry_price),
        marketValue: parseFloat(alpacaPosition.market_value),
        costBasis: parseFloat(alpacaPosition.cost_basis),
        unrealizedPnl: parseFloat(alpacaPosition.unrealized_pl),
        unrealizedPnlPercent: parseFloat(alpacaPosition.unrealized_plpc),
        currentPrice: parseFloat(alpacaPosition.current_price),
        lastdayPrice: parseFloat(alpacaPosition.lastday_price),
        changeToday: parseFloat(alpacaPosition.change_today),
        metadata: {
          alpacaAssetId: alpacaPosition.asset_id,
          alpacaAssetClass: alpacaPosition.asset_class,
          alpacaAssetExchange: alpacaPosition.exchange
        }
      }));
    } catch (error: any) {
      console.error('Error getting positions from Alpaca:', error);
      
      // Throw a more informative error
      if (error.response) {
        throw new Error(`Alpaca API error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        throw new Error('Alpaca API request failed: No response received');
      } else {
        throw new Error(`Alpaca get positions error: ${error.message}`);
      }
    }
  }
  
  /**
   * Get a position for a symbol
   * @param symbol Symbol to get position for
   * @returns Position details
   */
  public async getPosition(symbol: string): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Alpaca execution service is not initialized');
    }
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/v2/positions/${symbol}`,
        {
          headers: this.getHeaders()
        }
      );
      
      const alpacaPosition = response.data;
      
      // Convert Alpaca position to our format
      return {
        symbol: alpacaPosition.symbol,
        quantity: parseFloat(alpacaPosition.qty),
        side: parseFloat(alpacaPosition.qty) > 0 ? 'LONG' : 'SHORT',
        averageEntryPrice: parseFloat(alpacaPosition.avg_entry_price),
        marketValue: parseFloat(alpacaPosition.market_value),
        costBasis: parseFloat(alpacaPosition.cost_basis),
        unrealizedPnl: parseFloat(alpacaPosition.unrealized_pl),
        unrealizedPnlPercent: parseFloat(alpacaPosition.unrealized_plpc),
        currentPrice: parseFloat(alpacaPosition.current_price),
        lastdayPrice: parseFloat(alpacaPosition.lastday_price),
        changeToday: parseFloat(alpacaPosition.change_today),
        metadata: {
          alpacaAssetId: alpacaPosition.asset_id,
          alpacaAssetClass: alpacaPosition.asset_class,
          alpacaAssetExchange: alpacaPosition.exchange
        }
      };
    } catch (error: any) {
      // If 404, the position doesn't exist
      if (error.response && error.response.status === 404) {
        return null;
      }
      
      console.error(`Error getting position for ${symbol} from Alpaca:`, error);
      
      // Throw a more informative error
      if (error.response) {
        throw new Error(`Alpaca API error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        throw new Error('Alpaca API request failed: No response received');
      } else {
        throw new Error(`Alpaca get position error: ${error.message}`);
      }
    }
  }
  
  /**
   * Close a position
   * @param symbol Symbol to close position for
   * @param percentage Percentage of position to close (default: 100%)
   * @returns Closed position details
   */
  public async closePosition(symbol: string, percentage: number = 100): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Alpaca execution service is not initialized');
    }
    
    try {
      // If percentage is 100%, use the close endpoint
      if (percentage >= 100) {
        const response = await axios.delete(
          `${this.baseUrl}/v2/positions/${symbol}`,
          {
            headers: this.getHeaders()
          }
        );
        
        return {
          symbol,
          status: 'CLOSED',
          closedAt: new Date()
        };
      } else {
        // Otherwise, get the current position and create an order to close the specified percentage
        const position = await this.getPosition(symbol);
        
        if (!position) {
          throw new Error(`No position found for ${symbol}`);
        }
        
        const quantityToClose = Math.abs(position.quantity) * (percentage / 100);
        
        // Create an order to close the position
        const orderParams: OrderParams = {
          symbol,
          side: position.side === 'LONG' ? OrderSide.SELL : OrderSide.BUY,
          type: OrderType.MARKET,
          quantity: quantityToClose,
          timeInForce: TimeInForce.DAY,
          metadata: {
            action: 'CLOSE_POSITION',
            positionPercentage: percentage
          }
        };
        
        return await this.createOrder(orderParams);
      }
    } catch (error: any) {
      console.error(`Error closing position for ${symbol} with Alpaca:`, error);
      
      // Throw a more informative error
      if (error.response) {
        throw new Error(`Alpaca API error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        throw new Error('Alpaca API request failed: No response received');
      } else {
        throw new Error(`Alpaca close position error: ${error.message}`);
      }
    }
  }
  
  /**
   * Close all positions
   * @returns Array of closed position details
   */
  public async closeAllPositions(): Promise<any[]> {
    if (!this.isInitialized) {
      throw new Error('Alpaca execution service is not initialized');
    }
    
    try {
      const response = await axios.delete(
        `${this.baseUrl}/v2/positions`,
        {
          headers: this.getHeaders()
        }
      );
      
      return response.data.map((item: any) => ({
        symbol: item.symbol,
        status: 'CLOSED',
        closedAt: new Date()
      }));
    } catch (error: any) {
      console.error('Error closing all positions with Alpaca:', error);
      
      // Throw a more informative error
      if (error.response) {
        throw new Error(`Alpaca API error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        throw new Error('Alpaca API request failed: No response received');
      } else {
        throw new Error(`Alpaca close all positions error: ${error.message}`);
      }
    }
  }
  
  /**
   * Get headers for Alpaca API requests
   * @returns Headers object
   */
  private getHeaders(): Record<string, string> {
    return {
      'APCA-API-KEY-ID': this.apiKey,
      'APCA-API-SECRET-KEY': this.apiSecret,
      'Content-Type': 'application/json'
    };
  }
  
  /**
   * Convert our order parameters to Alpaca format
   * @param params Our order parameters
   * @returns Alpaca order parameters
   */
  private convertToAlpacaOrder(params: OrderParams): Record<string, any> {
    const alpacaOrder: Record<string, any> = {
      symbol: params.symbol,
      qty: params.quantity.toString(),
      side: params.side.toLowerCase(),
      type: params.type.toLowerCase(),
      time_in_force: this.convertTimeInForceToAlpaca(params.timeInForce || TimeInForce.DAY)
    };
    
    // Add optional parameters
    if (params.limitPrice !== undefined) {
      alpacaOrder.limit_price = params.limitPrice.toString();
    }
    
    if (params.stopPrice !== undefined) {
      alpacaOrder.stop_price = params.stopPrice.toString();
    }
    
    if (params.clientOrderId) {
      alpacaOrder.client_order_id = params.clientOrderId;
    }
    
    if (params.extendedHours !== undefined) {
      alpacaOrder.extended_hours = params.extendedHours;
    }
    
    if (params.orderClass) {
      alpacaOrder.order_class = params.orderClass.toLowerCase();
      
      // Add take profit and stop loss for bracket orders
      if (params.orderClass === 'bracket') {
        if (params.takeProfitLimitPrice !== undefined) {
          alpacaOrder.take_profit = {
            limit_price: params.takeProfitLimitPrice.toString()
          };
        }
        
        if (params.stopLossStopPrice !== undefined) {
          alpacaOrder.stop_loss = {
            stop_price: params.stopLossStopPrice.toString()
          };
          
          if (params.stopLossLimitPrice !== undefined) {
            alpacaOrder.stop_loss.limit_price = params.stopLossLimitPrice.toString();
          }
        }
      }
      
      // Add take profit for oco orders
      if (params.orderClass === 'oco') {
        if (params.takeProfitLimitPrice !== undefined) {
          alpacaOrder.take_profit = {
            limit_price: params.takeProfitLimitPrice.toString()
          };
        }
        
        if (params.stopLossStopPrice !== undefined) {
          alpacaOrder.stop_loss = {
            stop_price: params.stopLossStopPrice.toString()
          };
          
          if (params.stopLossLimitPrice !== undefined) {
            alpacaOrder.stop_loss.limit_price = params.stopLossLimitPrice.toString();
          }
        }
      }
      
      // Add legs for trailing stop orders
      if (params.orderClass === 'trailing_stop') {
        if (params.trailPercent !== undefined) {
          alpacaOrder.trail_percent = params.trailPercent.toString();
        } else if (params.trailPrice !== undefined) {
          alpacaOrder.trail_price = params.trailPrice.toString();
        }
      }
    }
    
    return alpacaOrder;
  }
  
  /**
   * Convert Alpaca order to our format
   * @param alpacaOrder Alpaca order
   * @returns Our order format
   */
  private convertFromAlpacaOrder(alpacaOrder: any): any {
    // Map Alpaca status to our status
    let status: OrderStatus;
    switch (alpacaOrder.status) {
      case 'new':
      case 'accepted':
      case 'pending_new':
        status = OrderStatus.PENDING;
        break;
      case 'filled':
        status = OrderStatus.FILLED;
        break;
      case 'partially_filled':
        status = OrderStatus.PARTIALLY_FILLED;
        break;
      case 'canceled':
      case 'expired':
        status = OrderStatus.CANCELED;
        break;
      case 'rejected':
        status = OrderStatus.REJECTED;
        break;
      case 'suspended':
      case 'pending_cancel':
      case 'pending_replace':
      case 'replaced':
      case 'stopped':
      case 'done_for_day':
        status = OrderStatus.OTHER;
        break;
      default:
        status = OrderStatus.UNKNOWN;
    }
    
    // Convert to our format
    return {
      symbol: alpacaOrder.symbol,
      side: alpacaOrder.side.toUpperCase(),
      type: alpacaOrder.type.toUpperCase(),
      quantity: parseFloat(alpacaOrder.qty),
      filledQuantity: parseFloat(alpacaOrder.filled_qty || '0'),
      limitPrice: alpacaOrder.limit_price ? parseFloat(alpacaOrder.limit_price) : undefined,
      stopPrice: alpacaOrder.stop_price ? parseFloat(alpacaOrder.stop_price) : undefined,
      timeInForce: this.convertTimeInForceFromAlpaca(alpacaOrder.time_in_force),
      status,
      createdAt: new Date(alpacaOrder.created_at),
      updatedAt: new Date(alpacaOrder.updated_at),
      submittedAt: alpacaOrder.submitted_at ? new Date(alpacaOrder.submitted_at) : undefined,
      filledAt: alpacaOrder.filled_at ? new Date(alpacaOrder.filled_at) : undefined,
      expiredAt: alpacaOrder.expired_at ? new Date(alpacaOrder.expired_at) : undefined,
      canceledAt: alpacaOrder.canceled_at ? new Date(alpacaOrder.canceled_at) : undefined,
      rejectedAt: alpacaOrder.failed_at ? new Date(alpacaOrder.failed_at) : undefined,
      averageFilledPrice: alpacaOrder.filled_avg_price ? parseFloat(alpacaOrder.filled_avg_price) : undefined,
      commission: alpacaOrder.commission ? parseFloat(alpacaOrder.commission) : undefined,
      extendedHours: alpacaOrder.extended_hours,
      clientOrderId: alpacaOrder.client_order_id,
      orderClass: alpacaOrder.order_class ? alpacaOrder.order_class.toUpperCase() : undefined,
      metadata: {
        alpacaId: alpacaOrder.id,
        alpacaStatus: alpacaOrder.status,
        alpacaReplacedBy: alpacaOrder.replaced_by,
        alpacaReplacesId: alpacaOrder.replaces,
        alpacaAssetId: alpacaOrder.asset_id,
        alpacaAssetClass: alpacaOrder.asset_class,
        alpacaNotional: alpacaOrder.notional,
        takeProfitLimitPrice: alpacaOrder.legs?.find((leg: any) => leg.side === 'sell')?.limit_price,
        stopLossStopPrice: alpacaOrder.legs?.find((leg: any) => leg.side === 'sell')?.stop_price,
        stopLossLimitPrice: alpacaOrder.legs?.find((leg: any) => leg.side === 'sell')?.limit_price,
        trailPercent: alpacaOrder.trail_percent,
        trailPrice: alpacaOrder.trail_price
      }
    };
  }
  
  /**
   * Convert our time in force to Alpaca format
   * @param timeInForce Our time in force
   * @returns Alpaca time in force
   */
  private convertTimeInForceToAlpaca(timeInForce: TimeInForce): string {
    switch (timeInForce) {
      case TimeInForce.DAY:
        return 'day';
      case TimeInForce.GTC:
        return 'gtc';
      case TimeInForce.OPG:
        return 'opg';
      case TimeInForce.CLS:
        return 'cls';
      case TimeInForce.IOC:
        return 'ioc';
      case TimeInForce.FOK:
        return 'fok';
      default:
        return 'day';
    }
  }
  
  /**
   * Convert Alpaca time in force to our format
   * @param alpacaTimeInForce Alpaca time in force
   * @returns Our time in force
   */
  private convertTimeInForceFromAlpaca(alpacaTimeInForce: string): TimeInForce {
    switch (alpacaTimeInForce) {
      case 'day':
        return TimeInForce.DAY;
      case 'gtc':
        return TimeInForce.GTC;
      case 'opg':
        return TimeInForce.OPG;
      case 'cls':
        return TimeInForce.CLS;
      case 'ioc':
        return TimeInForce.IOC;
      case 'fok':
        return TimeInForce.FOK;
      default:
        return TimeInForce.DAY;
    }
  }
}