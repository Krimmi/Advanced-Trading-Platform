import { Order, OrderRequest } from './TradingServiceFactory';
import { tradingService } from './TradingServiceFactory';
import { ApiError } from '../BaseApiService';

/**
 * Order status filter type
 */
export type OrderStatusFilter = 'all' | 'open' | 'filled' | 'canceled' | 'rejected';

/**
 * Order management service for handling orders
 */
export class OrderManagementService {
  private static instance: OrderManagementService;

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): OrderManagementService {
    if (!OrderManagementService.instance) {
      OrderManagementService.instance = new OrderManagementService();
    }
    return OrderManagementService.instance;
  }

  /**
   * Submit a new order
   * @param orderRequest - Order request
   * @returns Promise with created order
   */
  public async submitOrder(orderRequest: OrderRequest): Promise<Order> {
    try {
      // Validate order before submission
      this.validateOrder(orderRequest);
      
      // Submit order through trading service
      return await tradingService.createOrder(orderRequest);
    } catch (error) {
      console.error('Error submitting order:', error);
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
      return await tradingService.cancelOrder(orderId);
    } catch (error) {
      console.error(`Error canceling order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Get orders with filtering
   * @param status - Order status filter
   * @param symbol - Symbol filter (optional)
   * @param limit - Maximum number of orders to return (optional)
   * @returns Promise with filtered orders
   */
  public async getOrders(
    status: OrderStatusFilter = 'all',
    symbol?: string,
    limit?: number
  ): Promise<Order[]> {
    try {
      // Get all orders
      const allOrders = await tradingService.getOrders();
      
      // Apply filters
      let filteredOrders = allOrders;
      
      // Filter by status
      if (status !== 'all') {
        const statusMap: Record<OrderStatusFilter, string[]> = {
          'open': ['new', 'pending_new', 'accepted', 'partially_filled', 'pending_replace'],
          'filled': ['filled', 'done_for_day'],
          'canceled': ['canceled', 'pending_cancel'],
          'rejected': ['rejected', 'expired'],
          'all': []
        };
        
        filteredOrders = filteredOrders.filter(order => 
          statusMap[status].includes(order.status)
        );
      }
      
      // Filter by symbol
      if (symbol) {
        filteredOrders = filteredOrders.filter(order => 
          order.symbol.toUpperCase() === symbol.toUpperCase()
        );
      }
      
      // Apply limit
      if (limit && limit > 0) {
        filteredOrders = filteredOrders.slice(0, limit);
      }
      
      return filteredOrders;
    } catch (error) {
      console.error('Error getting orders:', error);
      throw error;
    }
  }

  /**
   * Get order by ID
   * @param orderId - Order ID
   * @returns Promise with order
   */
  public async getOrder(orderId: string): Promise<Order> {
    try {
      const orders = await tradingService.getOrders();
      const order = orders.find(o => o.id === orderId);
      
      if (!order) {
        throw new ApiError(`Order ${orderId} not found`, 404);
      }
      
      return order;
    } catch (error) {
      console.error(`Error getting order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Replace an existing order
   * @param orderId - Order ID to replace
   * @param newOrder - New order request
   * @returns Promise with new order
   */
  public async replaceOrder(orderId: string, newOrder: OrderRequest): Promise<Order> {
    try {
      // Validate new order
      this.validateOrder(newOrder);
      
      // Cancel existing order
      await this.cancelOrder(orderId);
      
      // Create new order
      return await this.submitOrder(newOrder);
    } catch (error) {
      console.error(`Error replacing order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Validate order request
   * @param order - Order request to validate
   * @throws ApiError if validation fails
   */
  private validateOrder(order: OrderRequest): void {
    // Check required fields
    if (!order.symbol) {
      throw new ApiError('Order symbol is required', 400);
    }
    
    if (!order.side) {
      throw new ApiError('Order side is required', 400);
    }
    
    if (!order.type) {
      throw new ApiError('Order type is required', 400);
    }
    
    if (order.quantity <= 0) {
      throw new ApiError('Order quantity must be greater than zero', 400);
    }
    
    // Check type-specific requirements
    if ((order.type === 'limit' || order.type === 'stop_limit') && !order.limitPrice) {
      throw new ApiError('Limit price is required for limit orders', 400);
    }
    
    if ((order.type === 'stop' || order.type === 'stop_limit') && !order.stopPrice) {
      throw new ApiError('Stop price is required for stop orders', 400);
    }
  }
}

// Export singleton instance
export const orderManagementService = OrderManagementService.getInstance();