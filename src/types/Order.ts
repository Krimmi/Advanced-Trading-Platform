/**
 * Order Type Definitions
 * 
 * These types define the structure of trading orders.
 */

export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
export type OrderSide = 'buy' | 'sell' | 'buy_to_cover' | 'sell_short';
export type TimeInForce = 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok';
export type OrderStatus = 
  'new' | 
  'partially_filled' | 
  'filled' | 
  'canceled' | 
  'rejected' | 
  'pending_new' | 
  'pending_cancel' | 
  'pending_replace' | 
  'stopped' | 
  'expired';

export interface Order {
  id?: string;
  symbol: string;
  quantity: number;
  side: OrderSide;
  type: OrderType;
  timeInForce: TimeInForce;
  limitPrice?: number;
  stopPrice?: number;
  trailingPercent?: number;
  trailingAmount?: number;
  
  // Status fields
  status?: OrderStatus;
  filledQuantity?: number;
  filledAvgPrice?: number;
  createdAt?: Date;
  updatedAt?: Date;
  filledAt?: Date;
  canceledAt?: Date;
  rejectedReason?: string;
  
  // Additional metadata
  clientOrderId?: string;
  strategyId?: string;
  notes?: string;
  tags?: string[];
}

export interface OrderUpdate {
  orderId: string;
  status: OrderStatus;
  filledQuantity?: number;
  filledAvgPrice?: number;
  updatedAt: Date;
  rejectedReason?: string;
}

export interface OrderExecutionReport {
  orderId: string;
  symbol: string;
  side: OrderSide;
  quantity: number;
  filledQuantity: number;
  remainingQuantity: number;
  averagePrice: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  executionTime?: number; // in milliseconds
}