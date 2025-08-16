import { 
  Order, 
  OrderParams, 
  OrderBook, 
  ExecutionReport,
  ExecutionAlgorithmParams
} from '../../../models/algorithmic-trading/OrderTypes';

/**
 * Interface for execution services
 */
export interface IExecutionService {
  /**
   * Unique identifier for the execution service
   */
  readonly id: string;
  
  /**
   * Human-readable name of the execution service
   */
  readonly name: string;
  
  /**
   * Initialize the execution service
   * @param config Configuration for the execution service
   */
  initialize(config: Record<string, any>): Promise<void>;
  
  /**
   * Create a new order
   * @param params Order parameters
   * @returns Created order
   */
  createOrder(params: OrderParams): Promise<Order>;
  
  /**
   * Cancel an order
   * @param orderId ID of the order to cancel
   * @returns Cancelled order
   */
  cancelOrder(orderId: string): Promise<Order>;
  
  /**
   * Get an order by ID
   * @param orderId ID of the order
   * @returns The order
   */
  getOrder(orderId: string): Promise<Order>;
  
  /**
   * Get all open orders
   * @param symbol Optional symbol to filter by
   * @returns Array of open orders
   */
  getOpenOrders(symbol?: string): Promise<Order[]>;
  
  /**
   * Get order history
   * @param symbol Optional symbol to filter by
   * @param limit Maximum number of orders to return
   * @param startTime Start time for the query
   * @param endTime End time for the query
   * @returns Array of historical orders
   */
  getOrderHistory(
    symbol?: string,
    limit?: number,
    startTime?: Date,
    endTime?: Date
  ): Promise<Order[]>;
  
  /**
   * Get execution reports for an order
   * @param orderId ID of the order
   * @returns Array of execution reports
   */
  getExecutionReports(orderId: string): Promise<ExecutionReport[]>;
  
  /**
   * Get the order book for a symbol
   * @param symbol Symbol to get the order book for
   * @param depth Depth of the order book
   * @returns The order book
   */
  getOrderBook(symbol: string, depth?: number): Promise<OrderBook>;
  
  /**
   * Execute an order using a specific algorithm
   * @param params Algorithm parameters
   * @returns The created orders
   */
  executeAlgorithmicOrder(params: ExecutionAlgorithmParams): Promise<Order[]>;
  
  /**
   * Cancel all algorithmic orders
   * @param algorithmId ID of the algorithm
   * @returns The cancelled orders
   */
  cancelAlgorithmicOrders(algorithmId: string): Promise<Order[]>;
  
  /**
   * Get the status of an algorithmic order
   * @param algorithmId ID of the algorithm
   * @returns Status information
   */
  getAlgorithmicOrderStatus(algorithmId: string): Promise<Record<string, any>>;
}