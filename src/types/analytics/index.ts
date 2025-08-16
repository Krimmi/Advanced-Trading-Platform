/**
 * Type definitions for the Real-time Analytics Dashboard
 */

// Market Breadth Data Types
export interface MarketBreadthData {
  asOf: string;
  advanceDecline: {
    advancing: number;
    declining: number;
    unchanged: number;
    advancingPercent: number;
    decliningPercent: number;
    advanceDeclineRatio: number;
    advanceDeclineSpread: number;
  };
  advanceDeclineHistory: {
    date: string;
    advancing: number;
    declining: number;
    unchanged: number;
    advanceDeclineRatio: number;
    advanceDeclineSpread: number;
  }[];
  breadthIndicators: {
    name: string;
    value: number;
    change: number;
    signal: 'Bullish' | 'Bearish' | 'Neutral';
    description?: string;
  }[];
  highsLows: {
    date: string;
    newHighs: number;
    newLows: number;
    highLowRatio: number;
  }[];
  marketStats: {
    index: string;
    value: number;
    change: number;
    percentChange: number;
    volume: number;
  }[];
  sectorPerformance: {
    name: string;
    performance: number;
    volume: number;
    advanceDeclineRatio: number;
  }[];
}

// Anomaly Detection Types
export interface Anomaly {
  id: string;
  title: string;
  description: string;
  symbol: string;
  timestamp: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  status: 'Active' | 'Monitoring' | 'Resolved' | 'False Positive';
  confidence: number;
  metrics: {
    name: string;
    value: string | number;
    direction: 'up' | 'down' | 'flat';
  }[];
  recommendations: string[];
  historicalData: {
    timestamp: string;
    value: number;
  }[];
  thresholds: {
    type: 'upper' | 'lower';
    value: number;
  }[];
  relatedIndicators: {
    timestamp: string;
    [key: string]: string | number;
  }[];
}

export interface AnomalyData {
  asOf: string;
  anomalies: Anomaly[];
  categories: string[];
  summary: {
    totalAnomalies: number;
    newAnomalies: number;
    criticalAnomalies: number;
    highAnomalies: number;
    mediumAnomalies: number;
    lowAnomalies: number;
    infoAnomalies: number;
    marketVolatility: number;
    volatilityDirection: 'up' | 'down' | 'flat';
    riskScore: number;
    riskLevel: 'High' | 'Medium' | 'Low';
  };
}

// Correlation Analysis Types
export interface CorrelationData {
  asOf: string;
  assets: string[];
  assetClasses: string[];
  assetInfo: {
    symbol: string;
    name: string;
    assetClass: string;
    sector?: string;
    industry?: string;
  }[];
  correlationMatrix: number[][];
  correlationTimeSeries: {
    asset1: string;
    asset2: string;
    data: {
      date: string;
      correlation: number;
    }[];
  }[];
}

// Order Flow Types
export interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  timestamp: string;
  type: 'market' | 'limit' | 'stop' | 'stop-limit';
  status: 'Pending' | 'Filled' | 'Partial' | 'Canceled' | 'Rejected';
}

export interface PriceLevel {
  price: number;
  volume: number;
}

export interface MarketDepth {
  symbol: string;
  timestamp: string;
  bidPrice: number;
  askPrice: number;
  bidVolume: number;
  askVolume: number;
  bidLevels: PriceLevel[];
  askLevels: PriceLevel[];
}

export interface OrderFlowData {
  asOf: string;
  symbols: string[];
  recentOrders: Order[];
  marketDepth: MarketDepth[];
  priceImpact: {
    symbol: string;
    data: {
      timestamp: string;
      price: number;
      impact: number;
      cumulativeImpact: number;
      volume: number;
    }[];
  }[];
}