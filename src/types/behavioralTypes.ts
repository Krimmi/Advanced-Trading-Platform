/**
 * Type definitions for behavioral metrics and analysis
 */

export interface BehavioralIndicator {
  name: string;
  value: number;
  classification: string;
  description: string;
  trend: string;
}

export interface TradingPattern {
  name: string;
  type: string;
  strength: number;
  description: string;
  startIndex: number;
  endIndex: number;
}

export interface MarketAnomaly {
  type: string;
  date: Date;
  value: number;
  significance: number;
  description: string;
}

export interface MarketRegime {
  regime: string;
  confidence: number;
  description: string;
  characteristics: string[];
}

export interface BehavioralMetricsResult {
  ticker: string;
  behavioralIndicators: BehavioralIndicator[];
  tradingPatterns: TradingPattern[];
  marketAnomalies: MarketAnomaly[];
  marketRegime: MarketRegime;
  timestamp: Date;
}

export interface FearGreedIndex {
  value: number;
  classification: string;
  components: {
    name: string;
    value: number;
    contribution: number;
  }[];
  previousValue: number;
  change: number;
  trend: string;
}

export interface VolatilityRegime {
  current: string;
  value: number;
  historicalPercentile: number;
  trend: string;
  forecast: string;
  forecastConfidence: number;
}

export interface MarketBreadth {
  advanceDeclineRatio: number;
  percentAboveMA50: number;
  percentAboveMA200: number;
  newHighsNewLows: number;
  mcClellanOscillator: number;
  interpretation: string;
}

export interface OptionsSentiment {
  putCallRatio: number;
  putCallRatioPercentile: number;
  impliedVolatility: number;
  impliedVolatilityPercentile: number;
  volatilitySkew: number;
  volatilityTerm: number;
  interpretation: string;
}

export interface BehavioralAlert {
  id: string;
  ticker: string;
  triggerType: 'fear_greed' | 'volatility' | 'anomaly' | 'pattern' | 'regime_change';
  triggerValue: number | string;
  triggerCondition: 'above' | 'below' | 'increase' | 'decrease' | 'detected';
  triggered: boolean;
  triggeredAt?: Date;
  message: string;
  severity: 'low' | 'medium' | 'high';
}