import { API_KEYS, DATA_SOURCE_CONFIG } from '../../../config/apiConfig';
import { AlpacaService, alpacaService, OrderRequest as AlpacaOrderRequest } from './AlpacaService';
import { InteractiveBrokersService, interactiveBrokersService, IBOrderRequest } from './InteractiveBrokersService';
import { ApiError } from '../BaseApiService';

/**
 * Common account interface
 */
export interface Account {
  id: string;
  currency: string;
  cash: number;
  buyingPower: number;
  equity: number;
  provider: string;
}

/**
 * Common position interface
 */
export interface Position {
  symbol: string;
  quantity: number;
  averageEntryPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  currentPrice: number;
  provider: string;
}

/**
 * Common order interface
 */
export interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  quantity: number;
  filledQuantity: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  limitPrice?: number;
  stopPrice?: number;
  provider: string;
}

/**
 * Common order request interface
 */
export interface OrderRequest {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  quantity: number;
  limitPrice?: number;
  stopPrice?: number;
  timeInForce?: 'day' | 'gtc' | 'ioc' | 'fok';
}

/**
 * Trading provider type
 */
export type TradingProvider = 'alpaca' | 'interactiveBrokers' | 'auto';

/**
 * Factory for creating and managing trading services
 */
export class TradingServiceFactory {
  private static instance: TradingServiceFactory;

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): TradingServiceFactory {
    if (!TradingServiceFactory.instance) {
      TradingServiceFactory.instance = new TradingServiceFactory();
    }
    return TradingServiceFactory.instance;
  }

  /**
   * Get the best available trading service
   * @param preferredProvider - Preferred provider (optional)
   * @returns The best available service
   */
  public getBestAvailableService(preferredProvider: TradingProvider = 'auto'): 
    AlpacaService | InteractiveBrokersService {
    
    // If we're forcing mock data, return the first service (it will use mock data)
    if (DATA_SOURCE_CONFIG.forceMockData) {
      return alpacaService;
    }

    // If a specific provider is requested and available, use it
    if (preferredProvider !== 'auto') {
      switch (preferredProvider) {
        case 'alpaca':
          if (API_KEYS.alpaca?.apiKey && API_KEYS.alpaca?.apiSecret) return alpacaService;
          break;
        case 'interactiveBrokers':
          if (API_KEYS.interactiveBrokers?.accountId && API_KEYS.interactiveBrokers?.apiKey) 
            return interactiveBrokersService;
          break;
      }
    }

    // Otherwise, find the first available service in order of preference
    // Alpaca is preferred for ease of use
    if (API_KEYS.alpaca?.apiKey && API_KEYS.alpaca?.apiSecret) return alpacaService;
    
    // Interactive Brokers is second choice
    if (API_KEYS.interactiveBrokers?.accountId && API_KEYS.interactiveBrokers?.apiKey) 
      return interactiveBrokersService;

    // If no service is available, return Alpaca (it will use mock data)
    return alpacaService;
  }

  /**
   * Get account information
   * @param provider - Preferred provider
   * @returns Promise with normalized account data
   */
  public async getAccount(provider: TradingProvider = 'auto'): Promise<Account> {
    const service = this.getBestAvailableService(provider);
    
    try {
      if (service instanceof AlpacaService) {
        const account = await service.getAccount();
        return {
          id: account.id,
          currency: account.currency,
          cash: parseFloat(account.cash),
          buyingPower: parseFloat(account.buying_power),
          equity: parseFloat(account.equity),
          provider: 'alpaca'
        };
      } 
      else if (service instanceof InteractiveBrokersService) {
        const account = await service.getAccount();
        return {
          id: account.accountId,
          currency: account.currency,
          cash: account.cashBalance,
          buyingPower: account.buyingPower,
          equity: account.equityWithLoanValue,
          provider: 'interactiveBrokers'
        };
      }
      
      throw new Error('No trading service available');
    } catch (error) {
      console.error(`Error getting account information:`, error);
      
      // If the preferred provider failed and wasn't 'auto', try with 'auto'
      if (provider !== 'auto') {
        console.log(`Retrying with best available provider...`);
        return this.getAccount('auto');
      }
      
      throw new ApiError(`Failed to get account information`, 
        error instanceof ApiError ? error.status : undefined);
    }
  }

  /**
   * Get positions
   * @param provider - Preferred provider
   * @returns Promise with normalized positions data
   */
  public async getPositions(provider: TradingProvider = 'auto'): Promise<Position[]> {
    const service = this.getBestAvailableService(provider);
    
    try {
      if (service instanceof AlpacaService) {
        const positions = await service.getPositions();
        return positions.map(position => ({
          symbol: position.symbol,
          quantity: parseFloat(position.qty),
          averageEntryPrice: parseFloat(position.avg_entry_price),
          marketValue: parseFloat(position.market_value),
          unrealizedPnl: parseFloat(position.unrealized_pl),
          unrealizedPnlPercent: parseFloat(position.unrealized_plpc) * 100,
          currentPrice: parseFloat(position.current_price),
          provider: 'alpaca'
        }));
      } 
      else if (service instanceof InteractiveBrokersService) {
        const positions = await service.getPositions();
        return positions.map(position => ({
          symbol: position.symbol,
          quantity: position.position,
          averageEntryPrice: position.avgCost,
          marketValue: position.marketValue,
          unrealizedPnl: position.unrealizedPnL,
          unrealizedPnlPercent: (position.unrealizedPnL / position.marketValue) * 100,
          currentPrice: position.marketPrice,
          provider: 'interactiveBrokers'
        }));
      }
      
      throw new Error('No trading service available');
    } catch (error) {
      console.error(`Error getting positions:`, error);
      
      // If the preferred provider failed and wasn't 'auto', try with 'auto'
      if (provider !== 'auto') {
        console.log(`Retrying with best available provider...`);
        return this.getPositions('auto');
      }
      
      throw new ApiError(`Failed to get positions`, 
        error instanceof ApiError ? error.status : undefined);
    }
  }

  /**
   * Get orders
   * @param provider - Preferred provider
   * @returns Promise with normalized orders data
   */
  public async getOrders(provider: TradingProvider = 'auto'): Promise<Order[]> {
    const service = this.getBestAvailableService(provider);
    
    try {
      if (service instanceof AlpacaService) {
        const orders = await service.getOrders();
        return orders.map(order => ({
          id: order.id,
          symbol: order.symbol,
          side: order.side as 'buy' | 'sell',
          type: order.type as 'market' | 'limit' | 'stop' | 'stop_limit',
          quantity: parseFloat(order.qty),
          filledQuantity: parseFloat(order.filled_qty),
          status: order.status,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
          limitPrice: order.limit_price ? parseFloat(order.limit_price) : undefined,
          stopPrice: order.stop_price ? parseFloat(order.stop_price) : undefined,
          provider: 'alpaca'
        }));
      } 
      else if (service instanceof InteractiveBrokersService) {
        const orders = await service.getOrders();
        return orders.map(order => ({
          id: order.orderId.toString(),
          symbol: order.symbol,
          side: order.side === 'BUY' ? 'buy' : 'sell',
          type: this.mapIBOrderType(order.orderType),
          quantity: order.quantity,
          filledQuantity: order.filledQuantity,
          status: this.mapIBOrderStatus(order.status),
          createdAt: order.createTime,
          updatedAt: order.updateTime,
          limitPrice: order.limitPrice !== null ? order.limitPrice : undefined,
          stopPrice: order.stopPrice !== null ? order.stopPrice : undefined,
          provider: 'interactiveBrokers'
        }));
      }
      
      throw new Error('No trading service available');
    } catch (error) {
      console.error(`Error getting orders:`, error);
      
      // If the preferred provider failed and wasn't 'auto', try with 'auto'
      if (provider !== 'auto') {
        console.log(`Retrying with best available provider...`);
        return this.getOrders('auto');
      }
      
      throw new ApiError(`Failed to get orders`, 
        error instanceof ApiError ? error.status : undefined);
    }
  }

  /**
   * Create an order
   * @param orderRequest - Order request
   * @param provider - Preferred provider
   * @returns Promise with normalized order data
   */
  public async createOrder(
    orderRequest: OrderRequest, 
    provider: TradingProvider = 'auto'
  ): Promise<Order> {
    const service = this.getBestAvailableService(provider);
    
    try {
      if (service instanceof AlpacaService) {
        // Map to Alpaca order request
        const alpacaRequest: AlpacaOrderRequest = {
          symbol: orderRequest.symbol,
          qty: orderRequest.quantity,
          side: orderRequest.side,
          type: orderRequest.type,
          time_in_force: orderRequest.timeInForce || 'day',
          limit_price: orderRequest.limitPrice,
          stop_price: orderRequest.stopPrice
        };
        
        const order = await service.createOrder(alpacaRequest);
        
        return {
          id: order.id,
          symbol: order.symbol,
          side: order.side as 'buy' | 'sell',
          type: order.type as 'market' | 'limit' | 'stop' | 'stop_limit',
          quantity: parseFloat(order.qty),
          filledQuantity: parseFloat(order.filled_qty),
          status: order.status,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
          limitPrice: order.limit_price ? parseFloat(order.limit_price) : undefined,
          stopPrice: order.stop_price ? parseFloat(order.stop_price) : undefined,
          provider: 'alpaca'
        };
      } 
      else if (service instanceof InteractiveBrokersService) {
        // Map to Interactive Brokers order request
        const ibRequest: IBOrderRequest = {
          symbol: orderRequest.symbol,
          side: orderRequest.side === 'buy' ? 'BUY' : 'SELL',
          orderType: this.mapToIBOrderType(orderRequest.type),
          quantity: orderRequest.quantity,
          limitPrice: orderRequest.limitPrice,
          stopPrice: orderRequest.stopPrice,
          timeInForce: this.mapToIBTimeInForce(orderRequest.timeInForce || 'day')
        };
        
        const order = await service.createOrder(ibRequest);
        
        return {
          id: order.orderId.toString(),
          symbol: order.symbol,
          side: order.side === 'BUY' ? 'buy' : 'sell',
          type: this.mapIBOrderType(order.orderType),
          quantity: order.quantity,
          filledQuantity: order.filledQuantity,
          status: this.mapIBOrderStatus(order.status),
          createdAt: order.createTime,
          updatedAt: order.updateTime,
          limitPrice: order.limitPrice !== null ? order.limitPrice : undefined,
          stopPrice: order.stopPrice !== null ? order.stopPrice : undefined,
          provider: 'interactiveBrokers'
        };
      }
      
      throw new Error('No trading service available');
    } catch (error) {
      console.error(`Error creating order:`, error);
      
      // If the preferred provider failed and wasn't 'auto', try with 'auto'
      if (provider !== 'auto') {
        console.log(`Retrying with best available provider...`);
        return this.createOrder(orderRequest, 'auto');
      }
      
      throw new ApiError(`Failed to create order`, 
        error instanceof ApiError ? error.status : undefined);
    }
  }

  /**
   * Cancel an order
   * @param orderId - Order ID
   * @param provider - Preferred provider
   * @returns Promise with void
   */
  public async cancelOrder(
    orderId: string, 
    provider: TradingProvider = 'auto'
  ): Promise<void> {
    const service = this.getBestAvailableService(provider);
    
    try {
      if (service instanceof AlpacaService) {
        await service.cancelOrder(orderId);
      } 
      else if (service instanceof InteractiveBrokersService) {
        await service.cancelOrder(parseInt(orderId));
      }
      else {
        throw new Error('No trading service available');
      }
    } catch (error) {
      console.error(`Error canceling order:`, error);
      
      // If the preferred provider failed and wasn't 'auto', try with 'auto'
      if (provider !== 'auto') {
        console.log(`Retrying with best available provider...`);
        return this.cancelOrder(orderId, 'auto');
      }
      
      throw new ApiError(`Failed to cancel order`, 
        error instanceof ApiError ? error.status : undefined);
    }
  }

  /**
   * Map IB order type to common order type
   * @param ibOrderType - IB order type
   * @returns Common order type
   */
  private mapIBOrderType(ibOrderType: string): 'market' | 'limit' | 'stop' | 'stop_limit' {
    switch (ibOrderType) {
      case 'MKT': return 'market';
      case 'LMT': return 'limit';
      case 'STP': return 'stop';
      case 'STP_LMT': return 'stop_limit';
      default: return 'market';
    }
  }

  /**
   * Map common order type to IB order type
   * @param orderType - Common order type
   * @returns IB order type
   */
  private mapToIBOrderType(orderType: string): 'MKT' | 'LMT' | 'STP' | 'STP_LMT' {
    switch (orderType) {
      case 'market': return 'MKT';
      case 'limit': return 'LMT';
      case 'stop': return 'STP';
      case 'stop_limit': return 'STP_LMT';
      default: return 'MKT';
    }
  }

  /**
   * Map IB order status to common order status
   * @param ibStatus - IB order status
   * @returns Common order status
   */
  private mapIBOrderStatus(ibStatus: string): string {
    switch (ibStatus) {
      case 'Submitted': return 'new';
      case 'PendingSubmit': return 'pending_new';
      case 'Filled': return 'filled';
      case 'Cancelled': return 'canceled';
      case 'PendingCancel': return 'pending_cancel';
      case 'PreSubmitted': return 'accepted';
      case 'Inactive': return 'rejected';
      default: return ibStatus;
    }
  }

  /**
   * Map common time in force to IB time in force
   * @param timeInForce - Common time in force
   * @returns IB time in force
   */
  private mapToIBTimeInForce(timeInForce: string): 'DAY' | 'GTC' | 'IOC' | 'FOK' {
    switch (timeInForce) {
      case 'day': return 'DAY';
      case 'gtc': return 'GTC';
      case 'ioc': return 'IOC';
      case 'fok': return 'FOK';
      default: return 'DAY';
    }
  }
}

// Export singleton instance
export const tradingService = TradingServiceFactory.getInstance();