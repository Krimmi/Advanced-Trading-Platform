import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { IExecutionService } from './IExecutionService';
import { OrderParams, OrderStatus, OrderSide, OrderType, TimeInForce } from '../../../models/algorithmic-trading/OrderTypes';
import { Signal, SignalType } from '../../../models/algorithmic-trading/StrategyTypes';
import { PositionTrackingService } from '../portfolio/PositionTrackingService';

/**
 * Order interface
 */
export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  filledQuantity: number;
  limitPrice?: number;
  stopPrice?: number;
  timeInForce: TimeInForce;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  filledAt?: Date;
  canceledAt?: Date;
  rejectedAt?: Date;
  expiredAt?: Date;
  averageFilledPrice?: number;
  commission?: number;
  strategyId?: string;
  signalId?: string;
  metadata?: Record<string, any>;
}

/**
 * Order management system
 * 
 * This service manages orders, including creation, tracking, and management
 */
export class OrderManagementSystem extends EventEmitter {
  private static instance: OrderManagementSystem;
  
  private executionService?: IExecutionService;
  private positionTrackingService: PositionTrackingService;
  private orders: Map<string, Order> = new Map();
  private activeOrders: Map<string, Order> = new Map(); // Orders that are not in a final state
  private ordersByStrategy: Map<string, Set<string>> = new Map(); // strategyId -> order IDs
  private ordersBySymbol: Map<string, Set<string>> = new Map(); // symbol -> order IDs
  private isInitialized: boolean = false;
  private updateInterval?: NodeJS.Timeout;
  private updateFrequencyMs: number = 30000; // 30 seconds by default
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    super();
    this.positionTrackingService = PositionTrackingService.getInstance();
  }
  
  /**
   * Get the singleton instance
   * @returns The singleton instance
   */
  public static getInstance(): OrderManagementSystem {
    if (!OrderManagementSystem.instance) {
      OrderManagementSystem.instance = new OrderManagementSystem();
    }
    return OrderManagementSystem.instance;
  }
  
  /**
   * Initialize the order management system
   * @param executionService Execution service to use
   * @param config Configuration for the service
   */
  public async initialize(executionService: IExecutionService, config: Record<string, any> = {}): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    this.executionService = executionService;
    
    // Set update frequency if provided
    if (config.updateFrequencyMs) {
      this.updateFrequencyMs = config.updateFrequencyMs;
    }
    
    // Initialize the position tracking service if not already initialized
    if (!this.positionTrackingService.getPortfolio().lastUpdateTime) {
      await this.positionTrackingService.initialize(executionService, config);
    }
    
    // Load existing orders
    await this.loadExistingOrders();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Start periodic updates
    this.startPeriodicUpdates();
    
    this.isInitialized = true;
    console.log('Order Management System initialized');
  }
  
  /**
   * Load existing orders from the execution service
   */
  private async loadExistingOrders(): Promise<void> {
    if (!this.executionService) {
      throw new Error('Execution service is not set');
    }
    
    try {
      // Get all orders (active and closed)
      const allOrders = await this.executionService.getOrders({ status: 'all', limit: 500 });
      
      // Process each order
      for (const order of allOrders) {
        this.addOrUpdateOrder(order);
      }
      
      console.log(`Loaded ${allOrders.length} existing orders`);
    } catch (error) {
      console.error('Error loading existing orders:', error);
      this.emit('error', error);
    }
  }
  
  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    if (!this.executionService) {
      throw new Error('Execution service is not set');
    }
    
    // Listen for order updates from the execution service
    this.executionService.on('order_updated', (order: any) => {
      this.addOrUpdateOrder(order);
    });
    
    // Listen for order fills
    this.executionService.on('order_filled', (order: any) => {
      this.addOrUpdateOrder(order);
      this.emit('order_filled', order);
    });
    
    // Listen for order cancellations
    this.executionService.on('order_canceled', (order: any) => {
      this.addOrUpdateOrder(order);
      this.emit('order_canceled', order);
    });
    
    // Listen for order rejections
    this.executionService.on('order_rejected', (order: any) => {
      this.addOrUpdateOrder(order);
      this.emit('order_rejected', order);
    });
  }
  
  /**
   * Start periodic updates
   */
  private startPeriodicUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    this.updateInterval = setInterval(async () => {
      try {
        await this.updateActiveOrders();
      } catch (error) {
        console.error('Error updating active orders:', error);
      }
    }, this.updateFrequencyMs);
  }
  
  /**
   * Stop periodic updates
   */
  private stopPeriodicUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
  }
  
  /**
   * Update active orders
   */
  public async updateActiveOrders(): Promise<void> {
    if (!this.executionService) {
      throw new Error('Execution service is not set');
    }
    
    try {
      // Get all active orders
      const activeOrderIds = Array.from(this.activeOrders.keys());
      
      if (activeOrderIds.length === 0) {
        return; // No active orders to update
      }
      
      console.log(`Updating ${activeOrderIds.length} active orders`);
      
      // Update each active order
      for (const orderId of activeOrderIds) {
        try {
          const updatedOrder = await this.executionService.getOrder(orderId);
          this.addOrUpdateOrder(updatedOrder);
        } catch (error) {
          console.error(`Error updating order ${orderId}:`, error);
        }
      }
    } catch (error) {
      console.error('Error updating active orders:', error);
      this.emit('error', error);
    }
  }
  
  /**
   * Add or update an order in our tracking
   * @param order Order to add or update
   */
  private addOrUpdateOrder(order: any): void {
    const orderId = order.internalId || order.id;
    const existingOrder = this.orders.get(orderId);
    
    // Add or update the order in our maps
    this.orders.set(orderId, order);
    
    // Check if the order is in a final state
    const isFinalState = this.isOrderInFinalState(order.status);
    
    if (isFinalState) {
      // Remove from active orders if it's in a final state
      this.activeOrders.delete(orderId);
    } else {
      // Add to active orders if it's not in a final state
      this.activeOrders.set(orderId, order);
    }
    
    // Update order by strategy map
    if (order.strategyId) {
      if (!this.ordersByStrategy.has(order.strategyId)) {
        this.ordersByStrategy.set(order.strategyId, new Set());
      }
      this.ordersByStrategy.get(order.strategyId)!.add(orderId);
    }
    
    // Update order by symbol map
    if (order.symbol) {
      if (!this.ordersBySymbol.has(order.symbol)) {
        this.ordersBySymbol.set(order.symbol, new Set());
      }
      this.ordersBySymbol.get(order.symbol)!.add(orderId);
    }
    
    // Emit events
    if (existingOrder) {
      // Order was updated
      this.emit('order_updated', order);
      
      // Check for status changes
      if (existingOrder.status !== order.status) {
        this.emit(`order_status_changed`, { order, previousStatus: existingOrder.status });
        
        // Emit specific status change events
        switch (order.status) {
          case OrderStatus.FILLED:
            this.emit('order_filled', order);
            break;
          case OrderStatus.PARTIALLY_FILLED:
            this.emit('order_partially_filled', order);
            break;
          case OrderStatus.CANCELED:
            this.emit('order_canceled', order);
            break;
          case OrderStatus.REJECTED:
            this.emit('order_rejected', order);
            break;
        }
      }
    } else {
      // New order
      this.emit('order_added', order);
    }
  }
  
  /**
   * Check if an order is in a final state
   * @param status Order status
   * @returns True if the order is in a final state
   */
  private isOrderInFinalState(status: OrderStatus): boolean {
    return [
      OrderStatus.FILLED,
      OrderStatus.CANCELED,
      OrderStatus.REJECTED,
      OrderStatus.EXPIRED
    ].includes(status);
  }
  
  /**
   * Create an order from a signal
   * @param signal Signal to create order from
   * @param params Additional order parameters
   * @returns Created order
   */
  public async createOrderFromSignal(signal: Signal, params: Partial<OrderParams> = {}): Promise<Order> {
    if (!this.executionService) {
      throw new Error('Execution service is not set');
    }
    
    // Determine order side based on signal type
    let side: OrderSide;
    switch (signal.type) {
      case SignalType.BUY:
      case SignalType.STRONG_BUY:
        side = OrderSide.BUY;
        break;
      case SignalType.SELL:
      case SignalType.STRONG_SELL:
        side = OrderSide.SELL;
        break;
      default:
        throw new Error(`Cannot create order from signal type: ${signal.type}`);
    }
    
    // Calculate quantity if not provided
    let quantity = params.quantity;
    if (!quantity) {
      // If no quantity provided, use position sizing based on portfolio percentage
      const portfolioPercentage = params.portfolioPercentage || 5; // Default to 5% of portfolio
      const price = signal.metadata?.price || await this.getLatestPrice(signal.symbol);
      
      quantity = this.positionTrackingService.calculatePositionSizeByPortfolioPercentage(
        portfolioPercentage,
        price
      );
      
      if (quantity <= 0) {
        throw new Error(`Calculated quantity is zero or negative for ${signal.symbol}`);
      }
    }
    
    // Create order parameters
    const orderParams: OrderParams = {
      symbol: signal.symbol,
      side,
      type: params.type || OrderType.MARKET,
      quantity,
      timeInForce: params.timeInForce || TimeInForce.DAY,
      limitPrice: params.limitPrice,
      stopPrice: params.stopPrice,
      clientOrderId: params.clientOrderId || `signal-${signal.timestamp.getTime()}`,
      strategyId: params.strategyId,
      internalId: uuidv4(),
      metadata: {
        ...params.metadata,
        signalId: signal.id,
        signalType: signal.type,
        signalConfidence: signal.confidence,
        signalTimestamp: signal.timestamp,
        signalMetadata: signal.metadata
      }
    };
    
    // Create the order
    const order = await this.executionService.createOrder(orderParams);
    
    // Add to our tracking
    this.addOrUpdateOrder(order);
    
    return order;
  }
  
  /**
   * Create an order
   * @param params Order parameters
   * @returns Created order
   */
  public async createOrder(params: OrderParams): Promise<Order> {
    if (!this.executionService) {
      throw new Error('Execution service is not set');
    }
    
    // Ensure we have an internal ID
    if (!params.internalId) {
      params.internalId = uuidv4();
    }
    
    // Create the order
    const order = await this.executionService.createOrder(params);
    
    // Add to our tracking
    this.addOrUpdateOrder(order);
    
    return order;
  }
  
  /**
   * Cancel an order
   * @param orderId Order ID to cancel
   * @returns Canceled order
   */
  public async cancelOrder(orderId: string): Promise<Order> {
    if (!this.executionService) {
      throw new Error('Execution service is not set');
    }
    
    // Check if we have this order
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    // Cancel the order
    const canceledOrder = await this.executionService.cancelOrder(orderId);
    
    // Update our tracking
    this.addOrUpdateOrder(canceledOrder);
    
    return canceledOrder;
  }
  
  /**
   * Cancel all orders
   * @param filter Optional filter for orders to cancel
   * @returns Array of canceled orders
   */
  public async cancelAllOrders(filter?: (order: Order) => boolean): Promise<Order[]> {
    if (!this.executionService) {
      throw new Error('Execution service is not set');
    }
    
    // Get active orders
    const activeOrders = Array.from(this.activeOrders.values());
    
    // Apply filter if provided
    const ordersToCancel = filter ? activeOrders.filter(filter) : activeOrders;
    
    if (ordersToCancel.length === 0) {
      return []; // No orders to cancel
    }
    
    // Cancel each order
    const canceledOrders: Order[] = [];
    for (const order of ordersToCancel) {
      try {
        const canceledOrder = await this.cancelOrder(order.id);
        canceledOrders.push(canceledOrder);
      } catch (error) {
        console.error(`Error canceling order ${order.id}:`, error);
      }
    }
    
    return canceledOrders;
  }
  
  /**
   * Cancel all orders for a symbol
   * @param symbol Symbol to cancel orders for
   * @returns Array of canceled orders
   */
  public async cancelOrdersForSymbol(symbol: string): Promise<Order[]> {
    return this.cancelAllOrders(order => order.symbol === symbol);
  }
  
  /**
   * Cancel all orders for a strategy
   * @param strategyId Strategy ID to cancel orders for
   * @returns Array of canceled orders
   */
  public async cancelOrdersForStrategy(strategyId: string): Promise<Order[]> {
    return this.cancelAllOrders(order => order.strategyId === strategyId);
  }
  
  /**
   * Get an order by ID
   * @param orderId Order ID
   * @returns Order or undefined if not found
   */
  public getOrder(orderId: string): Order | undefined {
    return this.orders.get(orderId);
  }
  
  /**
   * Get all orders
   * @returns Array of all orders
   */
  public getAllOrders(): Order[] {
    return Array.from(this.orders.values());
  }
  
  /**
   * Get active orders
   * @returns Array of active orders
   */
  public getActiveOrders(): Order[] {
    return Array.from(this.activeOrders.values());
  }
  
  /**
   * Get orders for a symbol
   * @param symbol Symbol to get orders for
   * @returns Array of orders for the symbol
   */
  public getOrdersForSymbol(symbol: string): Order[] {
    const orderIds = this.ordersBySymbol.get(symbol);
    if (!orderIds) {
      return [];
    }
    
    return Array.from(orderIds)
      .map(id => this.orders.get(id))
      .filter((order): order is Order => !!order);
  }
  
  /**
   * Get orders for a strategy
   * @param strategyId Strategy ID to get orders for
   * @returns Array of orders for the strategy
   */
  public getOrdersForStrategy(strategyId: string): Order[] {
    const orderIds = this.ordersByStrategy.get(strategyId);
    if (!orderIds) {
      return [];
    }
    
    return Array.from(orderIds)
      .map(id => this.orders.get(id))
      .filter((order): order is Order => !!order);
  }
  
  /**
   * Get the latest price for a symbol
   * @param symbol Symbol to get price for
   * @returns Latest price
   */
  private async getLatestPrice(symbol: string): Promise<number> {
    // First check if we have a position with a current price
    const position = this.positionTrackingService.getPosition(symbol);
    if (position) {
      return position.currentPrice;
    }
    
    // Otherwise, get the latest quote from the execution service
    if (!this.executionService) {
      throw new Error('Execution service is not set');
    }
    
    try {
      const quote = await this.executionService.getQuote(symbol);
      return (quote.bidPrice + quote.askPrice) / 2; // Use midpoint price
    } catch (error) {
      console.error(`Error getting latest price for ${symbol}:`, error);
      throw new Error(`Could not get latest price for ${symbol}`);
    }
  }
  
  /**
   * Shutdown the service
   */
  public shutdown(): void {
    this.stopPeriodicUpdates();
    this.removeAllListeners();
    console.log('Order Management System shut down');
  }
}

// Export singleton instance
export const orderManagementSystem = OrderManagementSystem.getInstance();