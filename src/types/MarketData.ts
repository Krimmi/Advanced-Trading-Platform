/**
 * Market Data Type Definitions
 * 
 * These types define the structure of market data used throughout the application.
 */

export interface Quote {
  symbol: string;
  bidPrice: number;
  bidSize: number;
  askPrice: number;
  askSize: number;
  timestamp: Date;
}

export interface Trade {
  symbol: string;
  price: number;
  size: number;
  timestamp: Date;
  exchange: string;
  tradeId?: string;
}

export interface Bar {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: Date;
  interval: '1min' | '5min' | '15min' | '30min' | '1hour' | '1day' | '1week' | '1month';
}

export interface MarketData {
  symbol: string;
  latestQuote?: Quote;
  latestTrade?: Trade;
  latestBar?: Bar;
  bars?: Bar[];
  technicalIndicators?: {
    [indicator: string]: number | number[] | object;
  };
  fundamentals?: {
    [key: string]: any;
  };
}