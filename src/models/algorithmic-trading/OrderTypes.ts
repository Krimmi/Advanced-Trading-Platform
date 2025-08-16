/**
 * Enum for order types
 */
export enum OrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  STOP = 'STOP',
  STOP_LIMIT = 'STOP_LIMIT',
  TRAILING_STOP = 'TRAILING_STOP'
}

/**
 * Enum for order sides
 */
export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL'
}

/**
 * Enum for order statuses
 */
export enum OrderStatus {
  CREATED = 'CREATED',
  PENDING = 'PENDING',
  OPEN = 'OPEN',
  FILLED = 'FILLED',
  PARTIALLY_FILLED = 'PARTIALLY_FILLED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

/**
 * Enum for time in force options
 */
export enum TimeInForce {
  GTC = 'GTC', // Good Till Cancelled
  IOC = 'IOC', // Immediate Or Cancel
  FOK = 'FOK', // Fill Or Kill
  DAY = 'DAY'  // Day Order
}

/**
 * Interface for order parameters
 */
export interface OrderParams {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: TimeInForce;
  clientOrderId?: string;
  strategyId?: string;
  metadata?: Record<string, any>;
}

/**
 * Interface for order objects
 */
export interface Order {
  id: string;
  clientOrderId?: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  status: OrderStatus;
  quantity: number;
  price?: number;
  stopPrice?: number;
  executedQuantity: number;
  averagePrice?: number;
  timeInForce: TimeInForce;
  createdAt: Date;
  updatedAt: Date;
  filledAt?: Date;
  strategyId?: string;
  metadata: Record<string, any>;
}

/**
 * Interface for order execution reports
 */
export interface ExecutionReport {
  orderId: string;
  symbol: string;
  side: OrderSide;
  price: number;
  quantity: number;
  executedAt: Date;
  fee?: number;
  feeCurrency?: string;
  metadata?: Record<string, any>;
}

/**
 * Interface for order book entry
 */
export interface OrderBookEntry {
  price: number;
  quantity: number;
}

/**
 * Interface for order book
 */
export interface OrderBook {
  symbol: string;
  timestamp: Date;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

/**
 * Interface for execution algorithm parameters
 */
export interface ExecutionAlgorithmParams {
  type: string;
  orderParams: OrderParams;
  startTime?: Date;
  endTime?: Date;
  targetPercentage?: number;
  maxParticipationRate?: number;
  priceLimit?: number;
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
  metadata?: Record<string, any>;
}