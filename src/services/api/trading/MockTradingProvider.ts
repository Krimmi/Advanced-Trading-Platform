import { Account, Position, Order, OrderRequest } from './TradingServiceFactory';
import { v4 as uuidv4 } from 'uuid';

/**
 * Mock trading provider for development and testing
 */
export class MockTradingProvider {
  private static instance: MockTradingProvider;
  
  // Mock data storage
  private account: Account;
  private positions: Map<string, Position> = new Map();
  private orders: Map<string, Order> = new Map();
  
  // Common stock symbols for realistic mock data
  private readonly commonStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 150.25 },
    { symbol: 'MSFT', name: 'Microsoft Corporation', price: 290.75 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2750.50 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 3300.00 },
    { symbol: 'META', name: 'Meta Platforms Inc.', price: 325.45 },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 800.30 },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 450.80 },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 140.20 },
    { symbol: 'V', name: 'Visa Inc.', price: 230.15 },
    { symbol: 'JNJ', name: 'Johnson & Johnson', price: 170.90 }
  ];

  private constructor() {
    // Initialize mock account
    this.account = {
      id: 'mock-account-' + uuidv4().substring(0, 8),
      currency: 'USD',
      cash: 100000.00,
      buyingPower: 200000.00,
      equity: 150000.00,
      provider: 'mock'
    };
    
    // Initialize mock positions
    this.initializePositions();
    
    // Initialize mock orders
    this.initializeOrders();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): MockTradingProvider {
    if (!MockTradingProvider.instance) {
      MockTradingProvider.instance = new MockTradingProvider();
    }
    return MockTradingProvider.instance;
  }

  /**
   * Initialize mock positions
   */
  private initializePositions(): void {
    // Create positions for some common stocks
    const positionStocks = this.commonStocks.slice(0, 5); // Use first 5 stocks
    
    positionStocks.forEach(stock => {
      const quantity = Math.floor(Math.random() * 100) + 10; // 10-110 shares
      const averageEntryPrice = stock.price * (0.9 + Math.random() * 0.2); // ±10% from current price
      const marketValue = quantity * stock.price;
      const unrealizedPnl = marketValue - (quantity * averageEntryPrice);
      const unrealizedPnlPercent = (unrealizedPnl / (quantity * averageEntryPrice)) * 100;
      
      const position: Position = {
        symbol: stock.symbol,
        quantity,
        averageEntryPrice,
        marketValue,
        unrealizedPnl,
        unrealizedPnlPercent,
        currentPrice: stock.price,
        provider: 'mock'
      };
      
      this.positions.set(stock.symbol, position);
    });
  }

  /**
   * Initialize mock orders
   */
  private initializeOrders(): void {
    // Create some mock orders
    const orderStocks = [...this.commonStocks.slice(0, 3), ...this.commonStocks.slice(6, 8)]; // Mix of stocks
    
    orderStocks.forEach(stock => {
      const isBuy = Math.random() > 0.5;
      const quantity = Math.floor(Math.random() * 50) + 5; // 5-55 shares
      const isMarket = Math.random() > 0.3;
      const isComplete = Math.random() > 0.5;
      
      const createdAt = new Date();
      createdAt.setHours(createdAt.getHours() - Math.floor(Math.random() * 24)); // Random time in last 24h
      
      const updatedAt = new Date(createdAt);
      updatedAt.setMinutes(updatedAt.getMinutes() + Math.floor(Math.random() * 30)); // 0-30 minutes after creation
      
      const order: Order = {
        id: 'mock-order-' + uuidv4().substring(0, 8),
        symbol: stock.symbol,
        side: isBuy ? 'buy' : 'sell',
        type: isMarket ? 'market' : 'limit',
        quantity,
        filledQuantity: isComplete ? quantity : Math.floor(quantity * Math.random()),
        status: isComplete ? 'filled' : (Math.random() > 0.7 ? 'new' : 'partially_filled'),
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
        limitPrice: isMarket ? undefined : stock.price * (isBuy ? 0.98 : 1.02), // 2% below for buy, 2% above for sell
        provider: 'mock'
      };
      
      this.orders.set(order.id, order);
    });
  }

  /**
   * Get account information
   * @returns Mock account information
   */
  public getAccount(): Account {
    // Update equity based on positions
    let positionsValue = 0;
    this.positions.forEach(position => {
      positionsValue += position.marketValue;
    });
    
    this.account.equity = this.account.cash + positionsValue;
    this.account.buyingPower = this.account.cash * 2; // Simplified margin calculation
    
    return { ...this.account };
  }

  /**
   * Get all positions
   * @returns Array of mock positions
   */
  public getPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  /**
   * Get position for a symbol
   * @param symbol - Stock symbol
   * @returns Position or null if not found
   */
  public getPosition(symbol: string): Position | null {
    return this.positions.get(symbol) || null;
  }

  /**
   * Get all orders
   * @returns Array of mock orders
   */
  public getOrders(): Order[] {
    return Array.from(this.orders.values());
  }

  /**
   * Get order by ID
   * @param orderId - Order ID
   * @returns Order or null if not found
   */
  public getOrder(orderId: string): Order | null {
    return this.orders.get(orderId) || null;
  }

  /**
   * Create a new order
   * @param orderRequest - Order request
   * @returns Created order
   */
  public createOrder(orderRequest: OrderRequest): Order {
    // Generate a new order ID
    const orderId = 'mock-order-' + uuidv4().substring(0, 8);
    
    // Find the stock price
    const stockInfo = this.commonStocks.find(s => s.symbol === orderRequest.symbol);
    const stockPrice = stockInfo ? stockInfo.price : 100.00; // Default price if symbol not found
    
    // Create the order
    const now = new Date().toISOString();
    const order: Order = {
      id: orderId,
      symbol: orderRequest.symbol,
      side: orderRequest.side,
      type: orderRequest.type,
      quantity: orderRequest.quantity,
      filledQuantity: 0, // Not filled yet
      status: 'new',
      createdAt: now,
      updatedAt: now,
      limitPrice: orderRequest.limitPrice,
      stopPrice: orderRequest.stopPrice,
      provider: 'mock'
    };
    
    // Store the order
    this.orders.set(orderId, order);
    
    // Simulate immediate fill for market orders
    if (order.type === 'market') {
      setTimeout(() => this.simulateFill(orderId), 500);
    }
    // Simulate potential fill for limit orders
    else if (order.type === 'limit') {
      const willFill = Math.random() > 0.3; // 70% chance of fill
      if (willFill) {
        const fillDelay = Math.floor(Math.random() * 5000) + 1000; // 1-6 seconds
        setTimeout(() => this.simulateFill(orderId), fillDelay);
      }
    }
    
    return order;
  }

  /**
   * Cancel an order
   * @param orderId - Order ID
   * @returns True if canceled, false if not found or already filled
   */
  public cancelOrder(orderId: string): boolean {
    const order = this.orders.get(orderId);
    
    if (!order) {
      return false;
    }
    
    // Can't cancel filled orders
    if (order.status === 'filled') {
      return false;
    }
    
    // Update order status
    order.status = 'canceled';
    order.updatedAt = new Date().toISOString();
    
    return true;
  }

  /**
   * Simulate order fill
   * @param orderId - Order ID
   */
  private simulateFill(orderId: string): void {
    const order = this.orders.get(orderId);
    
    if (!order || order.status === 'filled' || order.status === 'canceled') {
      return;
    }
    
    // Determine if partial or complete fill
    const isPartial = Math.random() > 0.7; // 30% chance of partial fill
    
    if (isPartial) {
      // Fill 30-90% of the order
      const fillPercent = 0.3 + Math.random() * 0.6;
      order.filledQuantity = Math.floor(order.quantity * fillPercent);
      order.status = 'partially_filled';
    } else {
      // Complete fill
      order.filledQuantity = order.quantity;
      order.status = 'filled';
    }
    
    order.updatedAt = new Date().toISOString();
    
    // Update position if order is filled or partially filled
    this.updatePosition(order);
  }

  /**
   * Update position based on order
   * @param order - Order
   */
  private updatePosition(order: Order): void {
    if (order.filledQuantity <= 0) {
      return;
    }
    
    const symbol = order.symbol;
    const existingPosition = this.positions.get(symbol);
    
    // Find the stock price
    const stockInfo = this.commonStocks.find(s => s.symbol === symbol);
    const stockPrice = stockInfo ? stockInfo.price : 100.00; // Default price if symbol not found
    
    // Use limit price if available, otherwise use stock price
    const executionPrice = order.limitPrice || stockPrice;
    
    if (existingPosition) {
      // Update existing position
      if (order.side === 'buy') {
        // Buying more
        const newQuantity = existingPosition.quantity + order.filledQuantity;
        const newCost = (existingPosition.quantity * existingPosition.averageEntryPrice) + 
                        (order.filledQuantity * executionPrice);
        const newAvgPrice = newCost / newQuantity;
        
        existingPosition.quantity = newQuantity;
        existingPosition.averageEntryPrice = newAvgPrice;
      } else {
        // Selling
        const newQuantity = existingPosition.quantity - order.filledQuantity;
        
        if (newQuantity <= 0) {
          // Position closed
          this.positions.delete(symbol);
        } else {
          // Position reduced
          existingPosition.quantity = newQuantity;
        }
      }
      
      // Update market value and P&L if position still exists
      if (this.positions.has(symbol)) {
        const position = this.positions.get(symbol)!;
        position.currentPrice = stockPrice;
        position.marketValue = position.quantity * stockPrice;
        position.unrealizedPnl = position.marketValue - (position.quantity * position.averageEntryPrice);
        position.unrealizedPnlPercent = (position.unrealizedPnl / (position.quantity * position.averageEntryPrice)) * 100;
      }
    } else if (order.side === 'buy') {
      // Create new position
      const newPosition: Position = {
        symbol,
        quantity: order.filledQuantity,
        averageEntryPrice: executionPrice,
        currentPrice: stockPrice,
        marketValue: order.filledQuantity * stockPrice,
        unrealizedPnl: order.filledQuantity * (stockPrice - executionPrice),
        unrealizedPnlPercent: ((stockPrice - executionPrice) / executionPrice) * 100,
        provider: 'mock'
      };
      
      this.positions.set(symbol, newPosition);
    }
    
    // Update account cash
    const orderValue = order.filledQuantity * executionPrice;
    if (order.side === 'buy') {
      this.account.cash -= orderValue;
    } else {
      this.account.cash += orderValue;
    }
  }

  /**
   * Get portfolio history
   * @param period - Time period ('1D', '1W', '1M', '3M', '1Y')
   * @returns Portfolio history data
   */
  public getPortfolioHistory(period: string = '1M'): any {
    // Determine number of data points based on period
    let days: number;
    switch (period) {
      case '1D': days = 1; break;
      case '1W': days = 7; break;
      case '1M': days = 30; break;
      case '3M': days = 90; break;
      case '1Y': days = 365; break;
      default: days = 30;
    }
    
    // Generate data points
    const dataPoints: any[] = [];
    const endDate = new Date();
    const startValue = this.account.equity * 0.8; // Start with 80% of current equity
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      
      // Generate a random walk with slight upward bias
      const progress = (days - i) / days;
      const randomFactor = 0.02; // 2% random variation
      const trendFactor = 0.2; // 20% trend component
      
      const randomComponent = (Math.random() * 2 - 1) * randomFactor;
      const trendComponent = progress * trendFactor;
      
      const value = startValue * (1 + trendComponent + randomComponent);
      
      dataPoints.push({
        timestamp: date.toISOString(),
        equity: value,
        profit_loss: value - startValue,
        profit_loss_pct: ((value - startValue) / startValue) * 100
      });
    }
    
    return {
      period,
      timeframe: '1D',
      equity: {
        timestamps: dataPoints.map(dp => dp.timestamp),
        values: dataPoints.map(dp => dp.equity)
      },
      profit_loss: {
        timestamps: dataPoints.map(dp => dp.timestamp),
        values: dataPoints.map(dp => dp.profit_loss)
      },
      profit_loss_pct: {
        timestamps: dataPoints.map(dp => dp.timestamp),
        values: dataPoints.map(dp => dp.profit_loss_pct)
      }
    };
  }
}

// Export singleton instance
export const mockTradingProvider = MockTradingProvider.getInstance();