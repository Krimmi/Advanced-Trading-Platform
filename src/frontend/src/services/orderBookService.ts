/**
 * Order Book Service
 * This service provides methods to interact with the order book API endpoints.
 */
import axios from 'axios';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/order-book`;

/**
 * Interface for price level
 */
export interface PriceLevel {
  price: number;
  size: number;
}

/**
 * Interface for order book snapshot
 */
export interface OrderBookSnapshot {
  symbol: string;
  bids: PriceLevel[];
  asks: PriceLevel[];
  timestamp: string;
  sequence: number;
}

/**
 * Interface for market depth price level
 */
export interface MarketDepthLevel {
  price: number;
  size: number;
  cumulative: number;
}

/**
 * Interface for price impact
 */
export interface PriceImpact {
  size: number;
  size_percent: number;
  price_impact: number;
  price_impact_bps: number;
}

/**
 * Interface for market depth
 */
export interface MarketDepth {
  bid_levels: MarketDepthLevel[];
  ask_levels: MarketDepthLevel[];
  buy_impact: PriceImpact[];
  sell_impact: PriceImpact[];
}

/**
 * Interface for basic metrics
 */
export interface BasicMetrics {
  mid_price: number;
  spread: number;
  relative_spread: number;
  bid_volume: number;
  ask_volume: number;
  volume_imbalance: number;
  bid_count: number;
  ask_count: number;
  order_imbalance: number;
  best_bid: number;
  best_ask: number;
  best_bid_volume: number;
  best_ask_volume: number;
  best_volume_imbalance: number;
}

/**
 * Interface for liquidity metrics
 */
export interface LiquidityMetrics {
  spread: number;
  relative_spread: number;
  depth_1pct: number;
  depth_2pct: number;
  depth_5pct: number;
  liquidity_at_mid: number;
  resiliency: number;
}

/**
 * Interface for imbalance metrics
 */
export interface ImbalanceMetrics {
  volume_imbalance: number;
  order_imbalance: number;
  level_imbalance: number;
  weighted_imbalance: number;
}

/**
 * Interface for trading signal
 */
export interface TradingSignal {
  signal: string;
  strength: number;
  description?: string;
  confidence?: number;
}

/**
 * Interface for trading signals
 */
export interface TradingSignals {
  signals: { [key: string]: TradingSignal };
  overall_signal: TradingSignal;
  timestamp: string;
}

/**
 * Interface for order book analytics
 */
export interface OrderBookAnalytics {
  symbol: string;
  basic_metrics: BasicMetrics;
  market_depth: MarketDepth;
  liquidity_metrics: LiquidityMetrics;
  imbalance_metrics: ImbalanceMetrics;
  visualizations: {
    order_book: string;
    depth_chart: string;
    price_impact: string;
  };
  signals: TradingSignals;
  timestamp: string;
}

/**
 * Interface for time series metrics
 */
export interface TimeSeriesMetrics {
  price_volatility: number;
  spread_volatility: number;
  volume_imbalance_trend: number;
  volume_imbalance_trend_significance: number;
  liquidity_trend: number;
  liquidity_trend_significance: number;
  volume_imbalance_autocorrelation: number;
  mean_reversion_strength: number;
}

/**
 * Interface for time series analytics
 */
export interface TimeSeriesAnalytics {
  symbol: string;
  metrics: TimeSeriesMetrics;
  visualizations: {
    mid_price: string;
    volume_imbalance: string;
    spread: string;
  };
  signals: TradingSignals;
  timestamp: string;
}

/**
 * Interface for combined trading signals
 */
export interface CombinedTradingSignals {
  symbol: string;
  order_book_signals: { [key: string]: TradingSignal };
  time_series_signals: { [key: string]: TradingSignal };
  order_book_overall: TradingSignal;
  time_series_overall: TradingSignal;
  combined_signal: TradingSignal;
  timestamp: string;
}

/**
 * Interface for market microstructure metrics
 */
export interface MarketMicrostructureMetrics {
  symbol: string;
  basic_metrics: {
    mid_price: number;
    spread: number;
    relative_spread: number;
    bid_volume: number;
    ask_volume: number;
  };
  liquidity_metrics: LiquidityMetrics;
  imbalance_metrics: ImbalanceMetrics;
  order_flow_imbalance: number;
  price_impact: {
    buy_1pct: number;
    buy_5pct: number;
    buy_10pct: number;
    sell_1pct: number;
    sell_5pct: number;
    sell_10pct: number;
  };
  time_series_metrics: TimeSeriesMetrics;
  timestamp: string;
}

/**
 * Interface for market order request
 */
export interface MarketOrderRequest {
  symbol: string;
  side: string;
  size: number;
}

/**
 * Interface for market order result
 */
export interface MarketOrderResult {
  symbol: string;
  side: string;
  size: number;
  matched_size: number;
  avg_price: number;
  filled_orders: number;
  timestamp: string;
}

/**
 * Order Book Service
 */
const orderBookService = {
  /**
   * Get all symbols with order books
   */
  async getSymbols(): Promise<string[]> {
    try {
      const response = await axios.get(`${API_URL}/symbols`);
      return response.data.symbols;
    } catch (error) {
      console.error('Error fetching order book symbols:', error);
      throw error;
    }
  },

  /**
   * Get order book snapshot for a symbol
   */
  async getOrderBookSnapshot(symbol: string, depth: number = 10): Promise<OrderBookSnapshot> {
    try {
      const response = await axios.get(`${API_URL}/snapshot/${symbol}`, {
        params: { depth }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching order book snapshot:', error);
      throw error;
    }
  },

  /**
   * Submit order book snapshot
   */
  async submitOrderBookSnapshot(snapshot: OrderBookSnapshot): Promise<boolean> {
    try {
      const response = await axios.post(`${API_URL}/snapshot`, snapshot);
      return response.data.success;
    } catch (error) {
      console.error('Error submitting order book snapshot:', error);
      throw error;
    }
  },

  /**
   * Submit market order
   */
  async submitMarketOrder(order: MarketOrderRequest): Promise<MarketOrderResult> {
    try {
      const response = await axios.post(`${API_URL}/market-order`, order);
      return response.data;
    } catch (error) {
      console.error('Error submitting market order:', error);
      throw error;
    }
  },

  /**
   * Get order book analytics for a symbol
   */
  async getOrderBookAnalytics(symbol: string): Promise<OrderBookAnalytics> {
    try {
      const response = await axios.get(`${API_URL}/analytics/${symbol}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order book analytics:', error);
      throw error;
    }
  },

  /**
   * Get time series analytics for a symbol
   */
  async getTimeSeriesAnalytics(symbol: string): Promise<TimeSeriesAnalytics> {
    try {
      const response = await axios.get(`${API_URL}/time-series/${symbol}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching time series analytics:', error);
      throw error;
    }
  },

  /**
   * Get trading signals for a symbol
   */
  async getTradingSignals(symbol: string): Promise<CombinedTradingSignals> {
    try {
      const response = await axios.get(`${API_URL}/signals/${symbol}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching trading signals:', error);
      throw error;
    }
  },

  /**
   * Get market microstructure metrics for a symbol
   */
  async getMarketMicrostructure(symbol: string): Promise<MarketMicrostructureMetrics> {
    try {
      const response = await axios.get(`${API_URL}/market-microstructure/${symbol}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching market microstructure metrics:', error);
      throw error;
    }
  }
};

export default orderBookService;