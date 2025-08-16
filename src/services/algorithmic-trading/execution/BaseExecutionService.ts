import { v4 as uuidv4 } from 'uuid';
import { 
  Order, 
  OrderParams, 
  OrderBook, 
  OrderStatus,
  TimeInForce,
  ExecutionReport,
  ExecutionAlgorithmParams
} from '../../../models/algorithmic-trading/OrderTypes';
import { IExecutionService } from './IExecutionService';

/**
 * Base class for execution services providing common functionality
 */
export abstract class BaseExecutionService implements IExecutionService {
  readonly id: string;
  readonly name: string;
  
  protected _isInitialized: boolean = false;
  protected _orders: Map<string, Order> = new Map();
  protected _executionReports: Map<string, ExecutionReport[]> = new Map();
  protected _algorithmicOrders: Map<string, {
    id: string;
    orders: string[];
    status: string;
    params: ExecutionAlgorithmParams;
    startTime: Date;
    endTime?: Date;
    metadata: Record<string, any>;
  }> = new Map();
  
  /**
   * Constructor for BaseExecutionService
   * @param name Execution service name
   */
  constructor(name: string) {
    this.id = uuidv4();
    this.name = name;
  }
  
  /**
   * Initialize the execution service
   * @param config Configuration for the execution service
   */
  async initialize(config: Record<string, any>): Promise<void> {
    if (this._isInitialized) {
      throw new Error('Execution service is already initialized');
    }
    
    try {
      // Call implementation-specific initialization
      await this.onInitialize(config);
      
      this._isInitialized = true;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Create a new order
   * @param params Order parameters
   * @returns Created order
   */
  async createOrder(params: OrderParams): Promise<Order> {
    if (!this._isInitialized) {
      throw new Error('Execution service must be initialized before creating orders');
    }
    
    try {
      // Validate order parameters
      this.validateOrderParams(params);
      
      // Generate client order ID if not provided
      const clientOrderId = params.clientOrderId || `order_${uuidv4()}`;
      
      // Create order object
      const order: Order = {
        id: uuidv4(),
        clientOrderId,
        symbol: params.symbol,
        side: params.side,
        type: params.type,
        status: OrderStatus.CREATED,
        quantity: params.quantity,
        price: params.price,
        stopPrice: params.stopPrice,
        executedQuantity: 0,
        timeInForce: params.timeInForce || TimeInForce.GTC,
        createdAt: new Date(),
        updatedAt: new Date(),
        strategyId: params.strategyId,
        metadata: params.metadata || {}
      };
      
      // Call implementation-specific order creation
      const createdOrder = await this.onCreateOrder(order);
      
      // Store the order
      this._orders.set(createdOrder.id, createdOrder);
      
      return createdOrder;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Cancel an order
   * @param orderId ID of the order to cancel
   * @returns Cancelled order
   */
  async cancelOrder(orderId: string): Promise<Order> {
    if (!this._isInitialized) {
      throw new Error('Execution service must be initialized before cancelling orders');
    }
    
    try {
      // Get the order
      const order = this._orders.get(orderId);
      if (!order) {
        throw new Error(`Order not found: ${orderId}`);
      }
      
      // Check if the order can be cancelled
      if (
        order.status === OrderStatus.FILLED ||
        order.status === OrderStatus.CANCELLED ||
        order.status === OrderStatus.REJECTED ||
        order.status === OrderStatus.EXPIRED
      ) {
        throw new Error(`Cannot cancel order with status: ${order.status}`);
      }
      
      // Call implementation-specific order cancellation
      const cancelledOrder = await this.onCancelOrder(order);
      
      // Update the order
      this._orders.set(cancelledOrder.id, cancelledOrder);
      
      return cancelledOrder;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get an order by ID
   * @param orderId ID of the order
   * @returns The order
   */
  async getOrder(orderId: string): Promise<Order> {
    if (!this._isInitialized) {
      throw new Error('Execution service must be initialized before getting orders');
    }
    
    try {
      // Get the order from local cache
      const cachedOrder = this._orders.get(orderId);
      if (!cachedOrder) {
        throw new Error(`Order not found: ${orderId}`);
      }
      
      // Call implementation-specific order retrieval to get latest status
      const order = await this.onGetOrder(orderId);
      
      // Update the cache
      this._orders.set(order.id, order);
      
      return order;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get all open orders
   * @param symbol Optional symbol to filter by
   * @returns Array of open orders
   */
  async getOpenOrders(symbol?: string): Promise<Order[]> {
    if (!this._isInitialized) {
      throw new Error('Execution service must be initialized before getting open orders');
    }
    
    try {
      // Call implementation-specific open orders retrieval
      const openOrders = await this.onGetOpenOrders(symbol);
      
      // Update the cache
      for (const order of openOrders) {
        this._orders.set(order.id, order);
      }
      
      return openOrders;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get order history
   * @param symbol Optional symbol to filter by
   * @param limit Maximum number of orders to return
   * @param startTime Start time for the query
   * @param endTime End time for the query
   * @returns Array of historical orders
   */
  async getOrderHistory(
    symbol?: string,
    limit?: number,
    startTime?: Date,
    endTime?: Date
  ): Promise<Order[]> {
    if (!this._isInitialized) {
      throw new Error('Execution service must be initialized before getting order history');
    }
    
    try {
      // Call implementation-specific order history retrieval
      const orderHistory = await this.onGetOrderHistory(symbol, limit, startTime, endTime);
      
      // Update the cache
      for (const order of orderHistory) {
        this._orders.set(order.id, order);
      }
      
      return orderHistory;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get execution reports for an order
   * @param orderId ID of the order
   * @returns Array of execution reports
   */
  async getExecutionReports(orderId: string): Promise<ExecutionReport[]> {
    if (!this._isInitialized) {
      throw new Error('Execution service must be initialized before getting execution reports');
    }
    
    try {
      // Get the order
      const order = this._orders.get(orderId);
      if (!order) {
        throw new Error(`Order not found: ${orderId}`);
      }
      
      // Call implementation-specific execution reports retrieval
      const executionReports = await this.onGetExecutionReports(orderId);
      
      // Update the cache
      this._executionReports.set(orderId, executionReports);
      
      return executionReports;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get the order book for a symbol
   * @param symbol Symbol to get the order book for
   * @param depth Depth of the order book
   * @returns The order book
   */
  async getOrderBook(symbol: string, depth?: number): Promise<OrderBook> {
    if (!this._isInitialized) {
      throw new Error('Execution service must be initialized before getting order book');
    }
    
    try {
      // Call implementation-specific order book retrieval
      return await this.onGetOrderBook(symbol, depth);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Execute an order using a specific algorithm
   * @param params Algorithm parameters
   * @returns The created orders
   */
  async executeAlgorithmicOrder(params: ExecutionAlgorithmParams): Promise<Order[]> {
    if (!this._isInitialized) {
      throw new Error('Execution service must be initialized before executing algorithmic orders');
    }
    
    try {
      // Validate algorithm parameters
      this.validateAlgorithmParams(params);
      
      // Generate algorithm ID
      const algorithmId = uuidv4();
      
      // Call implementation-specific algorithmic order execution
      const orders = await this.onExecuteAlgorithmicOrder(algorithmId, params);
      
      // Store the algorithmic order
      this._algorithmicOrders.set(algorithmId, {
        id: algorithmId,
        orders: orders.map(o => o.id),
        status: 'ACTIVE',
        params,
        startTime: new Date(),
        metadata: {}
      });
      
      // Store the orders
      for (const order of orders) {
        this._orders.set(order.id, order);
      }
      
      return orders;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Cancel all algorithmic orders
   * @param algorithmId ID of the algorithm
   * @returns The cancelled orders
   */
  async cancelAlgorithmicOrders(algorithmId: string): Promise<Order[]> {
    if (!this._isInitialized) {
      throw new Error('Execution service must be initialized before cancelling algorithmic orders');
    }
    
    try {
      // Get the algorithmic order
      const algorithmicOrder = this._algorithmicOrders.get(algorithmId);
      if (!algorithmicOrder) {
        throw new Error(`Algorithmic order not found: ${algorithmId}`);
      }
      
      // Call implementation-specific algorithmic order cancellation
      const cancelledOrders = await this.onCancelAlgorithmicOrders(algorithmId);
      
      // Update the algorithmic order
      algorithmicOrder.status = 'CANCELLED';
      algorithmicOrder.endTime = new Date();
      this._algorithmicOrders.set(algorithmId, algorithmicOrder);
      
      // Update the orders
      for (const order of cancelledOrders) {
        this._orders.set(order.id, order);
      }
      
      return cancelledOrders;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get the status of an algorithmic order
   * @param algorithmId ID of the algorithm
   * @returns Status information
   */
  async getAlgorithmicOrderStatus(algorithmId: string): Promise<Record<string, any>> {
    if (!this._isInitialized) {
      throw new Error('Execution service must be initialized before getting algorithmic order status');
    }
    
    try {
      // Get the algorithmic order
      const algorithmicOrder = this._algorithmicOrders.get(algorithmId);
      if (!algorithmicOrder) {
        throw new Error(`Algorithmic order not found: ${algorithmId}`);
      }
      
      // Call implementation-specific algorithmic order status retrieval
      const status = await this.onGetAlgorithmicOrderStatus(algorithmId);
      
      // Update the algorithmic order
      algorithmicOrder.metadata = { ...algorithmicOrder.metadata, ...status };
      this._algorithmicOrders.set(algorithmId, algorithmicOrder);
      
      return {
        id: algorithmicOrder.id,
        status: algorithmicOrder.status,
        startTime: algorithmicOrder.startTime,
        endTime: algorithmicOrder.endTime,
        orderCount: algorithmicOrder.orders.length,
        ...status
      };
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Validate order parameters
   * @param params Order parameters to validate
   */
  protected validateOrderParams(params: OrderParams): void {
    if (!params.symbol) {
      throw new Error('Symbol is required');
    }
    
    if (!params.side) {
      throw new Error('Side is required');
    }
    
    if (!params.type) {
      throw new Error('Type is required');
    }
    
    if (params.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
    
    // Call implementation-specific validation
    this.onValidateOrderParams(params);
  }
  
  /**
   * Validate algorithm parameters
   * @param params Algorithm parameters to validate
   */
  protected validateAlgorithmParams(params: ExecutionAlgorithmParams): void {
    if (!params.type) {
      throw new Error('Algorithm type is required');
    }
    
    if (!params.orderParams) {
      throw new Error('Order parameters are required');
    }
    
    // Validate order parameters
    this.validateOrderParams(params.orderParams);
    
    // Call implementation-specific validation
    this.onValidateAlgorithmParams(params);
  }
  
  // Abstract methods to be implemented by concrete execution services
  
  /**
   * Implementation-specific initialization logic
   * @param config Configuration object
   */
  protected abstract onInitialize(config: Record<string, any>): Promise<void>;
  
  /**
   * Implementation-specific order creation logic
   * @param order Order to create
   * @returns Created order
   */
  protected abstract onCreateOrder(order: Order): Promise<Order>;
  
  /**
   * Implementation-specific order cancellation logic
   * @param order Order to cancel
   * @returns Cancelled order
   */
  protected abstract onCancelOrder(order: Order): Promise<Order>;
  
  /**
   * Implementation-specific order retrieval logic
   * @param orderId ID of the order to retrieve
   * @returns Retrieved order
   */
  protected abstract onGetOrder(orderId: string): Promise<Order>;
  
  /**
   * Implementation-specific open orders retrieval logic
   * @param symbol Optional symbol to filter by
   * @returns Array of open orders
   */
  protected abstract onGetOpenOrders(symbol?: string): Promise<Order[]>;
  
  /**
   * Implementation-specific order history retrieval logic
   * @param symbol Optional symbol to filter by
   * @param limit Maximum number of orders to return
   * @param startTime Start time for the query
   * @param endTime End time for the query
   * @returns Array of historical orders
   */
  protected abstract onGetOrderHistory(
    symbol?: string,
    limit?: number,
    startTime?: Date,
    endTime?: Date
  ): Promise<Order[]>;
  
  /**
   * Implementation-specific execution reports retrieval logic
   * @param orderId ID of the order
   * @returns Array of execution reports
   */
  protected abstract onGetExecutionReports(orderId: string): Promise<ExecutionReport[]>;
  
  /**
   * Implementation-specific order book retrieval logic
   * @param symbol Symbol to get the order book for
   * @param depth Depth of the order book
   * @returns The order book
   */
  protected abstract onGetOrderBook(symbol: string, depth?: number): Promise<OrderBook>;
  
  /**
   * Implementation-specific algorithmic order execution logic
   * @param algorithmId ID of the algorithm
   * @param params Algorithm parameters
   * @returns The created orders
   */
  protected abstract onExecuteAlgorithmicOrder(
    algorithmId: string,
    params: ExecutionAlgorithmParams
  ): Promise<Order[]>;
  
  /**
   * Implementation-specific algorithmic order cancellation logic
   * @param algorithmId ID of the algorithm
   * @returns The cancelled orders
   */
  protected abstract onCancelAlgorithmicOrders(algorithmId: string): Promise<Order[]>;
  
  /**
   * Implementation-specific algorithmic order status retrieval logic
   * @param algorithmId ID of the algorithm
   * @returns Status information
   */
  protected abstract onGetAlgorithmicOrderStatus(algorithmId: string): Promise<Record<string, any>>;
  
  /**
   * Implementation-specific order parameters validation logic
   * @param params Order parameters to validate
   */
  protected abstract onValidateOrderParams(params: OrderParams): void;
  
  /**
   * Implementation-specific algorithm parameters validation logic
   * @param params Algorithm parameters to validate
   */
  protected abstract onValidateAlgorithmParams(params: ExecutionAlgorithmParams): void;
}