import { 
  Order, 
  OrderParams, 
  OrderBook, 
  OrderStatus,
  OrderType,
  OrderSide,
  ExecutionReport,
  ExecutionAlgorithmParams
} from '../../../models/algorithmic-trading/OrderTypes';
import { BaseExecutionService } from './BaseExecutionService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Mock execution service for testing and development
 */
export class MockExecutionService extends BaseExecutionService {
  // Mock order book data
  private orderBooks: Map<string, OrderBook> = new Map();
  
  // Mock market data
  private marketPrices: Map<string, number> = new Map();
  
  // Simulated latency in milliseconds
  private latency: number = 100;
  
  /**
   * Constructor
   */
  constructor() {
    super('Mock Execution Service');
  }
  
  /**
   * Implementation-specific initialization logic
   * @param config Configuration object
   */
  protected async onInitialize(config: Record<string, any>): Promise<void> {
    // Set latency if provided
    if (config.latency !== undefined) {
      this.latency = config.latency;
    }
    
    // Initialize mock market data
    if (config.symbols && Array.isArray(config.symbols)) {
      for (const symbol of config.symbols) {
        // Generate random price between 10 and 1000
        const price = 10 + Math.random() * 990;
        this.marketPrices.set(symbol, price);
        
        // Generate mock order book
        this.generateMockOrderBook(symbol, price);
      }
    }
  }
  
  /**
   * Generate a mock order book for a symbol
   * @param symbol Symbol to generate for
   * @param price Current market price
   */
  private generateMockOrderBook(symbol: string, price: number): void {
    const bids = [];
    const asks = [];
    
    // Generate 20 bid levels
    for (let i = 0; i < 20; i++) {
      const bidPrice = price * (1 - 0.0001 * (i + 1));
      const bidQuantity = 100 + Math.random() * 900;
      bids.push({ price: bidPrice, quantity: bidQuantity });
    }
    
    // Generate 20 ask levels
    for (let i = 0; i < 20; i++) {
      const askPrice = price * (1 + 0.0001 * (i + 1));
      const askQuantity = 100 + Math.random() * 900;
      asks.push({ price: askPrice, quantity: askQuantity });
    }
    
    // Create order book
    const orderBook: OrderBook = {
      symbol,
      timestamp: new Date(),
      bids,
      asks
    };
    
    this.orderBooks.set(symbol, orderBook);
  }
  
  /**
   * Simulate network latency
   */
  private async simulateLatency(): Promise<void> {
    if (this.latency > 0) {
      await new Promise(resolve => setTimeout(resolve, this.latency));
    }
  }
  
  /**
   * Get the current market price for a symbol
   * @param symbol Symbol to get price for
   * @returns Current market price
   */
  private getMarketPrice(symbol: string): number {
    let price = this.marketPrices.get(symbol);
    
    if (price === undefined) {
      // Generate random price between 10 and 1000
      price = 10 + Math.random() * 990;
      this.marketPrices.set(symbol, price);
      
      // Generate mock order book
      this.generateMockOrderBook(symbol, price);
    }
    
    // Add some random price movement
    const movement = price * 0.001 * (Math.random() - 0.5);
    price += movement;
    this.marketPrices.set(symbol, price);
    
    return price;
  }
  
  /**
   * Implementation-specific order creation logic
   * @param order Order to create
   * @returns Created order
   */
  protected async onCreateOrder(order: Order): Promise<Order> {
    // Simulate network latency
    await this.simulateLatency();
    
    // Get current market price
    const marketPrice = this.getMarketPrice(order.symbol);
    
    // Update order status based on order type
    switch (order.type) {
      case OrderType.MARKET:
        // Market orders are filled immediately
        order.status = OrderStatus.FILLED;
        order.executedQuantity = order.quantity;
        order.averagePrice = marketPrice;
        order.filledAt = new Date();
        
        // Create execution report
        this.createExecutionReport(order);
        break;
        
      case OrderType.LIMIT:
        // Limit orders are filled if the price is favorable
        if (
          (order.side === OrderSide.BUY && order.price! >= marketPrice) ||
          (order.side === OrderSide.SELL && order.price! <= marketPrice)
        ) {
          order.status = OrderStatus.FILLED;
          order.executedQuantity = order.quantity;
          order.averagePrice = order.price;
          order.filledAt = new Date();
          
          // Create execution report
          this.createExecutionReport(order);
        } else {
          order.status = OrderStatus.OPEN;
        }
        break;
        
      case OrderType.STOP:
      case OrderType.STOP_LIMIT:
        // Stop orders are pending until triggered
        order.status = OrderStatus.PENDING;
        break;
        
      case OrderType.TRAILING_STOP:
        // Trailing stop orders are pending until triggered
        order.status = OrderStatus.PENDING;
        break;
    }
    
    return order;
  }
  
  /**
   * Create an execution report for an order
   * @param order Order to create report for
   */
  private createExecutionReport(order: Order): void {
    const report: ExecutionReport = {
      orderId: order.id,
      symbol: order.symbol,
      side: order.side,
      price: order.averagePrice!,
      quantity: order.executedQuantity,
      executedAt: new Date(),
      fee: order.averagePrice! * order.executedQuantity * 0.001, // 0.1% fee
      feeCurrency: order.symbol.split('/')[1] || 'USD',
      metadata: {}
    };
    
    const reports = this._executionReports.get(order.id) || [];
    reports.push(report);
    this._executionReports.set(order.id, reports);
  }
  
  /**
   * Implementation-specific order cancellation logic
   * @param order Order to cancel
   * @returns Cancelled order
   */
  protected async onCancelOrder(order: Order): Promise<Order> {
    // Simulate network latency
    await this.simulateLatency();
    
    // Update order status
    order.status = OrderStatus.CANCELLED;
    order.updatedAt = new Date();
    
    return order;
  }
  
  /**
   * Implementation-specific order retrieval logic
   * @param orderId ID of the order to retrieve
   * @returns Retrieved order
   */
  protected async onGetOrder(orderId: string): Promise<Order> {
    // Simulate network latency
    await this.simulateLatency();
    
    // Get the order
    const order = this._orders.get(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }
    
    // Check if the order should be filled
    if (order.status === OrderStatus.OPEN || order.status === OrderStatus.PENDING) {
      const marketPrice = this.getMarketPrice(order.symbol);
      
      // Check if limit order should be filled
      if (order.type === OrderType.LIMIT) {
        if (
          (order.side === OrderSide.BUY && order.price! >= marketPrice) ||
          (order.side === OrderSide.SELL && order.price! <= marketPrice)
        ) {
          order.status = OrderStatus.FILLED;
          order.executedQuantity = order.quantity;
          order.averagePrice = order.price;
          order.filledAt = new Date();
          order.updatedAt = new Date();
          
          // Create execution report
          this.createExecutionReport(order);
        }
      }
      
      // Check if stop order should be triggered
      if (order.type === OrderType.STOP || order.type === OrderType.STOP_LIMIT) {
        if (
          (order.side === OrderSide.BUY && marketPrice >= order.stopPrice!) ||
          (order.side === OrderSide.SELL && marketPrice <= order.stopPrice!)
        ) {
          if (order.type === OrderType.STOP) {
            // Stop orders become market orders when triggered
            order.status = OrderStatus.FILLED;
            order.executedQuantity = order.quantity;
            order.averagePrice = marketPrice;
            order.filledAt = new Date();
            order.updatedAt = new Date();
            
            // Create execution report
            this.createExecutionReport(order);
          } else {
            // Stop-limit orders become limit orders when triggered
            order.status = OrderStatus.OPEN;
            order.updatedAt = new Date();
          }
        }
      }
    }
    
    return order;
  }
  
  /**
   * Implementation-specific open orders retrieval logic
   * @param symbol Optional symbol to filter by
   * @returns Array of open orders
   */
  protected async onGetOpenOrders(symbol?: string): Promise<Order[]> {
    // Simulate network latency
    await this.simulateLatency();
    
    // Get all orders
    const allOrders = Array.from(this._orders.values());
    
    // Filter by status
    const openOrders = allOrders.filter(order => 
      order.status === OrderStatus.OPEN || 
      order.status === OrderStatus.PENDING ||
      order.status === OrderStatus.PARTIALLY_FILLED
    );
    
    // Filter by symbol if provided
    if (symbol) {
      return openOrders.filter(order => order.symbol === symbol);
    }
    
    return openOrders;
  }
  
  /**
   * Implementation-specific order history retrieval logic
   * @param symbol Optional symbol to filter by
   * @param limit Maximum number of orders to return
   * @param startTime Start time for the query
   * @param endTime End time for the query
   * @returns Array of historical orders
   */
  protected async onGetOrderHistory(
    symbol?: string,
    limit?: number,
    startTime?: Date,
    endTime?: Date
  ): Promise<Order[]> {
    // Simulate network latency
    await this.simulateLatency();
    
    // Get all orders
    let orders = Array.from(this._orders.values());
    
    // Filter by symbol if provided
    if (symbol) {
      orders = orders.filter(order => order.symbol === symbol);
    }
    
    // Filter by time range if provided
    if (startTime) {
      orders = orders.filter(order => order.createdAt >= startTime);
    }
    
    if (endTime) {
      orders = orders.filter(order => order.createdAt <= endTime);
    }
    
    // Sort by creation time (newest first)
    orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Apply limit if provided
    if (limit && limit > 0) {
      orders = orders.slice(0, limit);
    }
    
    return orders;
  }
  
  /**
   * Implementation-specific execution reports retrieval logic
   * @param orderId ID of the order
   * @returns Array of execution reports
   */
  protected async onGetExecutionReports(orderId: string): Promise<ExecutionReport[]> {
    // Simulate network latency
    await this.simulateLatency();
    
    // Get execution reports
    return this._executionReports.get(orderId) || [];
  }
  
  /**
   * Implementation-specific order book retrieval logic
   * @param symbol Symbol to get the order book for
   * @param depth Depth of the order book
   * @returns The order book
   */
  protected async onGetOrderBook(symbol: string, depth?: number): Promise<OrderBook> {
    // Simulate network latency
    await this.simulateLatency();
    
    // Get order book
    let orderBook = this.orderBooks.get(symbol);
    
    if (!orderBook) {
      // Generate order book if it doesn't exist
      const price = this.getMarketPrice(symbol);
      this.generateMockOrderBook(symbol, price);
      orderBook = this.orderBooks.get(symbol)!;
    }
    
    // Update timestamp
    orderBook.timestamp = new Date();
    
    // Apply depth if provided
    if (depth && depth > 0) {
      return {
        ...orderBook,
        bids: orderBook.bids.slice(0, depth),
        asks: orderBook.asks.slice(0, depth)
      };
    }
    
    return orderBook;
  }
  
  /**
   * Implementation-specific algorithmic order execution logic
   * @param algorithmId ID of the algorithm
   * @param params Algorithm parameters
   * @returns The created orders
   */
  protected async onExecuteAlgorithmicOrder(
    algorithmId: string,
    params: ExecutionAlgorithmParams
  ): Promise<Order[]> {
    // Simulate network latency
    await this.simulateLatency();
    
    const orders: Order[] = [];
    
    // Handle different algorithm types
    switch (params.type) {
      case 'TWAP':
        // Time-Weighted Average Price
        orders.push(...await this.executeTWAP(algorithmId, params));
        break;
        
      case 'VWAP':
        // Volume-Weighted Average Price
        orders.push(...await this.executeVWAP(algorithmId, params));
        break;
        
      case 'ICEBERG':
        // Iceberg order
        orders.push(...await this.executeIceberg(algorithmId, params));
        break;
        
      default:
        throw new Error(`Unsupported algorithm type: ${params.type}`);
    }
    
    return orders;
  }
  
  /**
   * Execute a TWAP algorithm
   * @param algorithmId ID of the algorithm
   * @param params Algorithm parameters
   * @returns The created orders
   */
  private async executeTWAP(
    algorithmId: string,
    params: ExecutionAlgorithmParams
  ): Promise<Order[]> {
    const orders: Order[] = [];
    const { orderParams } = params;
    
    // Calculate start and end times
    const startTime = params.startTime || new Date();
    const endTime = params.endTime || new Date(startTime.getTime() + 3600000); // Default to 1 hour
    
    // Calculate duration in milliseconds
    const duration = endTime.getTime() - startTime.getTime();
    
    // Calculate number of slices (default to 10)
    const slices = params.metadata?.slices || 10;
    
    // Calculate quantity per slice
    const quantityPerSlice = orderParams.quantity / slices;
    
    // Calculate time interval between slices
    const interval = duration / slices;
    
    // Create orders for each slice
    for (let i = 0; i < slices; i++) {
      const sliceOrderParams: OrderParams = {
        ...orderParams,
        quantity: quantityPerSlice,
        clientOrderId: `${algorithmId}_${i}`,
        metadata: {
          ...orderParams.metadata,
          algorithmId,
          slice: i,
          totalSlices: slices
        }
      };
      
      // Create order object
      const order: Order = {
        id: uuidv4(),
        clientOrderId: sliceOrderParams.clientOrderId,
        symbol: sliceOrderParams.symbol,
        side: sliceOrderParams.side,
        type: sliceOrderParams.type,
        status: OrderStatus.CREATED,
        quantity: sliceOrderParams.quantity,
        price: sliceOrderParams.price,
        stopPrice: sliceOrderParams.stopPrice,
        executedQuantity: 0,
        timeInForce: sliceOrderParams.timeInForce || TimeInForce.GTC,
        createdAt: new Date(startTime.getTime() + i * interval),
        updatedAt: new Date(),
        strategyId: sliceOrderParams.strategyId,
        metadata: sliceOrderParams.metadata || {}
      };
      
      // For simulation, fill orders that would have executed already
      const now = new Date();
      if (order.createdAt <= now) {
        const marketPrice = this.getMarketPrice(order.symbol);
        
        if (order.type === OrderType.MARKET || 
            (order.type === OrderType.LIMIT && 
             ((order.side === OrderSide.BUY && order.price! >= marketPrice) ||
              (order.side === OrderSide.SELL && order.price! <= marketPrice)))) {
          order.status = OrderStatus.FILLED;
          order.executedQuantity = order.quantity;
          order.averagePrice = order.type === OrderType.MARKET ? marketPrice : order.price;
          order.filledAt = new Date();
          
          // Create execution report
          this.createExecutionReport(order);
        } else {
          order.status = OrderStatus.OPEN;
        }
      } else {
        // Order will be created in the future
        order.status = OrderStatus.CREATED;
      }
      
      orders.push(order);
    }
    
    return orders;
  }
  
  /**
   * Execute a VWAP algorithm
   * @param algorithmId ID of the algorithm
   * @param params Algorithm parameters
   * @returns The created orders
   */
  private async executeVWAP(
    algorithmId: string,
    params: ExecutionAlgorithmParams
  ): Promise<Order[]> {
    // Similar to TWAP but with volume profile
    // For mock purposes, we'll use a simple approximation
    
    const orders: Order[] = [];
    const { orderParams } = params;
    
    // Calculate start and end times
    const startTime = params.startTime || new Date();
    const endTime = params.endTime || new Date(startTime.getTime() + 3600000); // Default to 1 hour
    
    // Calculate duration in milliseconds
    const duration = endTime.getTime() - startTime.getTime();
    
    // Calculate number of slices (default to 10)
    const slices = params.metadata?.slices || 10;
    
    // Mock volume profile (higher volume in the middle of the period)
    const volumeProfile = [];
    let totalVolume = 0;
    
    for (let i = 0; i < slices; i++) {
      // Create a bell curve-like volume profile
      const normalizedPosition = i / (slices - 1);
      const volumeFactor = 1 - 4 * Math.pow(normalizedPosition - 0.5, 2);
      const sliceVolume = Math.max(0.5, volumeFactor);
      
      volumeProfile.push(sliceVolume);
      totalVolume += sliceVolume;
    }
    
    // Normalize volume profile
    const normalizedProfile = volumeProfile.map(v => v / totalVolume);
    
    // Calculate time interval between slices
    const interval = duration / slices;
    
    // Create orders for each slice
    for (let i = 0; i < slices; i++) {
      const sliceQuantity = orderParams.quantity * normalizedProfile[i];
      
      const sliceOrderParams: OrderParams = {
        ...orderParams,
        quantity: sliceQuantity,
        clientOrderId: `${algorithmId}_${i}`,
        metadata: {
          ...orderParams.metadata,
          algorithmId,
          slice: i,
          totalSlices: slices,
          volumeFactor: normalizedProfile[i]
        }
      };
      
      // Create order object
      const order: Order = {
        id: uuidv4(),
        clientOrderId: sliceOrderParams.clientOrderId,
        symbol: sliceOrderParams.symbol,
        side: sliceOrderParams.side,
        type: sliceOrderParams.type,
        status: OrderStatus.CREATED,
        quantity: sliceOrderParams.quantity,
        price: sliceOrderParams.price,
        stopPrice: sliceOrderParams.stopPrice,
        executedQuantity: 0,
        timeInForce: sliceOrderParams.timeInForce || TimeInForce.GTC,
        createdAt: new Date(startTime.getTime() + i * interval),
        updatedAt: new Date(),
        strategyId: sliceOrderParams.strategyId,
        metadata: sliceOrderParams.metadata || {}
      };
      
      // For simulation, fill orders that would have executed already
      const now = new Date();
      if (order.createdAt <= now) {
        const marketPrice = this.getMarketPrice(order.symbol);
        
        if (order.type === OrderType.MARKET || 
            (order.type === OrderType.LIMIT && 
             ((order.side === OrderSide.BUY && order.price! >= marketPrice) ||
              (order.side === OrderSide.SELL && order.price! <= marketPrice)))) {
          order.status = OrderStatus.FILLED;
          order.executedQuantity = order.quantity;
          order.averagePrice = order.type === OrderType.MARKET ? marketPrice : order.price;
          order.filledAt = new Date();
          
          // Create execution report
          this.createExecutionReport(order);
        } else {
          order.status = OrderStatus.OPEN;
        }
      } else {
        // Order will be created in the future
        order.status = OrderStatus.CREATED;
      }
      
      orders.push(order);
    }
    
    return orders;
  }
  
  /**
   * Execute an Iceberg algorithm
   * @param algorithmId ID of the algorithm
   * @param params Algorithm parameters
   * @returns The created orders
   */
  private async executeIceberg(
    algorithmId: string,
    params: ExecutionAlgorithmParams
  ): Promise<Order[]> {
    const orders: Order[] = [];
    const { orderParams } = params;
    
    // Get display size from metadata or default to 10% of total quantity
    const displaySize = params.metadata?.displaySize || orderParams.quantity * 0.1;
    
    // Calculate number of slices
    const slices = Math.ceil(orderParams.quantity / displaySize);
    
    // Create initial visible order
    const visibleOrderParams: OrderParams = {
      ...orderParams,
      quantity: Math.min(displaySize, orderParams.quantity),
      clientOrderId: `${algorithmId}_0`,
      metadata: {
        ...orderParams.metadata,
        algorithmId,
        slice: 0,
        totalSlices: slices,
        isIceberg: true,
        displaySize
      }
    };
    
    // Create order object
    const visibleOrder: Order = {
      id: uuidv4(),
      clientOrderId: visibleOrderParams.clientOrderId,
      symbol: visibleOrderParams.symbol,
      side: visibleOrderParams.side,
      type: visibleOrderParams.type,
      status: OrderStatus.OPEN,
      quantity: visibleOrderParams.quantity,
      price: visibleOrderParams.price,
      stopPrice: visibleOrderParams.stopPrice,
      executedQuantity: 0,
      timeInForce: visibleOrderParams.timeInForce || TimeInForce.GTC,
      createdAt: new Date(),
      updatedAt: new Date(),
      strategyId: visibleOrderParams.strategyId,
      metadata: visibleOrderParams.metadata || {}
    };
    
    orders.push(visibleOrder);
    
    // Create hidden orders for the rest of the quantity
    let remainingQuantity = orderParams.quantity - visibleOrder.quantity;
    let sliceIndex = 1;
    
    while (remainingQuantity > 0) {
      const sliceQuantity = Math.min(displaySize, remainingQuantity);
      
      const sliceOrderParams: OrderParams = {
        ...orderParams,
        quantity: sliceQuantity,
        clientOrderId: `${algorithmId}_${sliceIndex}`,
        metadata: {
          ...orderParams.metadata,
          algorithmId,
          slice: sliceIndex,
          totalSlices: slices,
          isIceberg: true,
          isHidden: true,
          displaySize
        }
      };
      
      // Create order object
      const hiddenOrder: Order = {
        id: uuidv4(),
        clientOrderId: sliceOrderParams.clientOrderId,
        symbol: sliceOrderParams.symbol,
        side: sliceOrderParams.side,
        type: sliceOrderParams.type,
        status: OrderStatus.CREATED, // Hidden orders are created but not sent to the market yet
        quantity: sliceOrderParams.quantity,
        price: sliceOrderParams.price,
        stopPrice: sliceOrderParams.stopPrice,
        executedQuantity: 0,
        timeInForce: sliceOrderParams.timeInForce || TimeInForce.GTC,
        createdAt: new Date(),
        updatedAt: new Date(),
        strategyId: sliceOrderParams.strategyId,
        metadata: sliceOrderParams.metadata || {}
      };
      
      orders.push(hiddenOrder);
      
      remainingQuantity -= sliceQuantity;
      sliceIndex++;
    }
    
    return orders;
  }
  
  /**
   * Implementation-specific algorithmic order cancellation logic
   * @param algorithmId ID of the algorithm
   * @returns The cancelled orders
   */
  protected async onCancelAlgorithmicOrders(algorithmId: string): Promise<Order[]> {
    // Simulate network latency
    await this.simulateLatency();
    
    // Get the algorithmic order
    const algorithmicOrder = this._algorithmicOrders.get(algorithmId);
    if (!algorithmicOrder) {
      throw new Error(`Algorithmic order not found: ${algorithmId}`);
    }
    
    const cancelledOrders: Order[] = [];
    
    // Cancel all orders associated with the algorithm
    for (const orderId of algorithmicOrder.orders) {
      const order = this._orders.get(orderId);
      
      if (order && (order.status === OrderStatus.OPEN || order.status === OrderStatus.PENDING || order.status === OrderStatus.CREATED)) {
        order.status = OrderStatus.CANCELLED;
        order.updatedAt = new Date();
        
        cancelledOrders.push(order);
      }
    }
    
    return cancelledOrders;
  }
  
  /**
   * Implementation-specific algorithmic order status retrieval logic
   * @param algorithmId ID of the algorithm
   * @returns Status information
   */
  protected async onGetAlgorithmicOrderStatus(algorithmId: string): Promise<Record<string, any>> {
    // Simulate network latency
    await this.simulateLatency();
    
    // Get the algorithmic order
    const algorithmicOrder = this._algorithmicOrders.get(algorithmId);
    if (!algorithmicOrder) {
      throw new Error(`Algorithmic order not found: ${algorithmId}`);
    }
    
    // Calculate progress
    let totalQuantity = 0;
    let executedQuantity = 0;
    let openOrders = 0;
    let filledOrders = 0;
    let cancelledOrders = 0;
    
    for (const orderId of algorithmicOrder.orders) {
      const order = this._orders.get(orderId);
      
      if (order) {
        totalQuantity += order.quantity;
        executedQuantity += order.executedQuantity;
        
        if (order.status === OrderStatus.OPEN || order.status === OrderStatus.PENDING) {
          openOrders++;
        } else if (order.status === OrderStatus.FILLED) {
          filledOrders++;
        } else if (order.status === OrderStatus.CANCELLED) {
          cancelledOrders++;
        }
      }
    }
    
    const progress = totalQuantity > 0 ? executedQuantity / totalQuantity : 0;
    
    return {
      progress,
      totalQuantity,
      executedQuantity,
      openOrders,
      filledOrders,
      cancelledOrders,
      totalOrders: algorithmicOrder.orders.length
    };
  }
  
  /**
   * Implementation-specific order parameters validation logic
   * @param params Order parameters to validate
   */
  protected onValidateOrderParams(params: OrderParams): void {
    // Validate price for limit orders
    if (params.type === OrderType.LIMIT && params.price === undefined) {
      throw new Error('Price is required for limit orders');
    }
    
    // Validate stop price for stop orders
    if ((params.type === OrderType.STOP || params.type === OrderType.STOP_LIMIT) && params.stopPrice === undefined) {
      throw new Error('Stop price is required for stop orders');
    }
    
    // Validate price for stop-limit orders
    if (params.type === OrderType.STOP_LIMIT && params.price === undefined) {
      throw new Error('Price is required for stop-limit orders');
    }
  }
  
  /**
   * Implementation-specific algorithm parameters validation logic
   * @param params Algorithm parameters to validate
   */
  protected onValidateAlgorithmParams(params: ExecutionAlgorithmParams): void {
    // Validate algorithm type
    if (!['TWAP', 'VWAP', 'ICEBERG'].includes(params.type)) {
      throw new Error(`Unsupported algorithm type: ${params.type}`);
    }
    
    // Validate start and end times for TWAP and VWAP
    if ((params.type === 'TWAP' || params.type === 'VWAP') && params.endTime) {
      const startTime = params.startTime || new Date();
      
      if (params.endTime <= startTime) {
        throw new Error('End time must be after start time');
      }
    }
    
    // Validate display size for Iceberg
    if (params.type === 'ICEBERG') {
      const displaySize = params.metadata?.displaySize;
      
      if (displaySize !== undefined && displaySize <= 0) {
        throw new Error('Display size must be greater than 0');
      }
      
      if (displaySize !== undefined && displaySize > params.orderParams.quantity) {
        throw new Error('Display size cannot be greater than total quantity');
      }
    }
  }
}