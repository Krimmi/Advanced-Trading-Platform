/**
 * StrategyTypes - Type definitions for AI-driven trading strategy recommendations
 * 
 * This file contains type definitions for trading strategies, recommendations,
 * evaluation metrics, and related concepts.
 */

/**
 * Enum for different types of trading strategies
 */
export enum StrategyType {
  MOMENTUM = 'momentum',
  MEAN_REVERSION = 'mean_reversion',
  TREND_FOLLOWING = 'trend_following',
  BREAKOUT = 'breakout',
  STATISTICAL_ARBITRAGE = 'statistical_arbitrage',
  SENTIMENT_BASED = 'sentiment_based',
  MACHINE_LEARNING = 'machine_learning',
  MULTI_FACTOR = 'multi_factor',
  EVENT_DRIVEN = 'event_driven',
  PAIRS_TRADING = 'pairs_trading',
  VOLATILITY = 'volatility',
  CUSTOM = 'custom'
}

/**
 * Enum for different timeframes
 */
export enum Timeframe {
  INTRADAY = 'intraday',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

/**
 * Enum for different risk levels
 */
export enum RiskLevel {
  VERY_LOW = 'very_low',
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

/**
 * Enum for different market conditions
 */
export enum MarketCondition {
  BULL = 'bull',
  BEAR = 'bear',
  SIDEWAYS = 'sideways',
  VOLATILE = 'volatile',
  LOW_VOLATILITY = 'low_volatility',
  HIGH_LIQUIDITY = 'high_liquidity',
  LOW_LIQUIDITY = 'low_liquidity'
}

/**
 * Interface for strategy parameters
 */
export interface StrategyParameter {
  id: string;
  name: string;
  description: string;
  type: 'number' | 'boolean' | 'string' | 'enum';
  defaultValue: any;
  minValue?: number;
  maxValue?: number;
  step?: number;
  options?: string[];
  required: boolean;
  advanced: boolean;
}

/**
 * Interface for a trading strategy
 */
export interface TradingStrategy {
  id: string;
  name: string;
  description: string;
  type: StrategyType;
  timeframes: Timeframe[];
  riskLevel: RiskLevel;
  suitableMarketConditions: MarketCondition[];
  parameters: StrategyParameter[];
  performanceMetrics: StrategyPerformanceMetrics;
  tags: string[];
  author: string;
  createdAt: Date;
  updatedAt: Date;
  version: string;
  popularity: number; // 0-100 scale
  complexity: number; // 0-100 scale
}

/**
 * Interface for strategy performance metrics
 */
export interface StrategyPerformanceMetrics {
  sharpeRatio: number;
  sortino: number;
  maxDrawdown: number;
  annualizedReturn: number;
  winRate: number;
  profitFactor: number;
  volatility: number;
  beta: number;
  alpha: number;
  informationRatio: number;
  calmarRatio: number;
  averageWin: number;
  averageLoss: number;
  averageHoldingPeriod: number;
  tradesPerMonth: number;
}

/**
 * Interface for strategy backtest results
 */
export interface StrategyBacktestResult {
  strategyId: string;
  ticker: string;
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  finalCapital: number;
  totalReturn: number;
  annualizedReturn: number;
  trades: {
    entryDate: Date;
    exitDate: Date;
    entryPrice: number;
    exitPrice: number;
    quantity: number;
    direction: 'long' | 'short';
    pnl: number;
    pnlPercentage: number;
    holdingPeriod: number;
  }[];
  metrics: StrategyPerformanceMetrics;
  equityCurve: {
    date: Date;
    equity: number;
    drawdown: number;
  }[];
  parameters: Record<string, any>;
  marketConditions: {
    condition: MarketCondition;
    startDate: Date;
    endDate: Date;
    performance: number;
  }[];
}

/**
 * Interface for user preferences
 */
export interface UserPreferences {
  riskTolerance: RiskLevel;
  preferredTimeframes: Timeframe[];
  preferredStrategyTypes: StrategyType[];
  excludedStrategyTypes: StrategyType[];
  preferredMarketConditions: MarketCondition[];
  maxComplexity: number; // 0-100 scale
  minSharpeRatio: number;
  maxDrawdown: number;
  minWinRate: number;
  customTags: string[];
}

/**
 * Interface for a strategy recommendation
 */
export interface StrategyRecommendation {
  strategy: TradingStrategy;
  score: number; // 0-100 scale
  matchReasons: {
    reason: string;
    impact: number; // -100 to 100 scale
  }[];
  customizedParameters: Record<string, any>;
  expectedPerformance: {
    estimatedReturn: number;
    estimatedRisk: number;
    confidenceLevel: number; // 0-100 scale
  };
  suitableTickers: {
    ticker: string;
    suitabilityScore: number; // 0-100 scale
    reason: string;
  }[];
  backtestSummary?: {
    bestPerformance: {
      ticker: string;
      period: {
        start: Date;
        end: Date;
      };
      return: number;
      sharpeRatio: number;
    };
    worstPerformance: {
      ticker: string;
      period: {
        start: Date;
        end: Date;
      };
      return: number;
      sharpeRatio: number;
    };
    averagePerformance: {
      return: number;
      sharpeRatio: number;
      winRate: number;
    };
  };
}

/**
 * Interface for strategy explanation
 */
export interface StrategyExplanation {
  strategyId: string;
  overview: string;
  keyComponents: {
    component: string;
    description: string;
    importance: number; // 0-100 scale
  }[];
  marketConditionAnalysis: {
    condition: MarketCondition;
    suitability: number; // 0-100 scale
    explanation: string;
  }[];
  parameterExplanations: {
    parameterId: string;
    explanation: string;
    sensitivityLevel: number; // 0-100 scale
    recommendedValues: {
      marketCondition: MarketCondition;
      value: any;
      explanation: string;
    }[];
  }[];
  riskAnalysis: {
    riskFactor: string;
    impact: number; // 0-100 scale
    mitigationApproach: string;
  }[];
  comparisonWithSimilarStrategies: {
    strategyId: string;
    similarityScore: number; // 0-100 scale
    keyDifferences: string[];
    relativeStrengths: string[];
    relativeWeaknesses: string[];
  }[];
  academicResearch: {
    title: string;
    authors: string[];
    year: number;
    summary: string;
    url?: string;
  }[];
  visualExplanations: {
    type: 'decision_tree' | 'flowchart' | 'example_trade' | 'performance_comparison';
    title: string;
    description: string;
    data: any; // Structure depends on the type
  }[];
}

/**
 * Interface for strategy optimization result
 */
export interface StrategyOptimizationResult {
  strategyId: string;
  ticker: string;
  timeframe: Timeframe;
  optimizationTarget: 'sharpe_ratio' | 'return' | 'drawdown' | 'win_rate' | 'profit_factor';
  optimizationMethod: 'grid_search' | 'genetic_algorithm' | 'bayesian_optimization' | 'monte_carlo';
  iterations: number;
  parameters: {
    parameter: string;
    testedValues: any[];
    optimalValue: any;
    sensitivity: number; // 0-100 scale
  }[];
  optimalParameters: Record<string, any>;
  baselinePerformance: StrategyPerformanceMetrics;
  optimizedPerformance: StrategyPerformanceMetrics;
  improvementPercentage: number;
  robustnessScore: number; // 0-100 scale
  overfittingRisk: number; // 0-100 scale
  walkForwardValidation?: {
    periods: {
      trainStart: Date;
      trainEnd: Date;
      testStart: Date;
      testEnd: Date;
      trainPerformance: StrategyPerformanceMetrics;
      testPerformance: StrategyPerformanceMetrics;
    }[];
    overallRobustness: number; // 0-100 scale
  };
}

/**
 * Interface for market regime
 */
export interface MarketRegime {
  regime: MarketCondition;
  startDate: Date;
  endDate?: Date; // Undefined for current regime
  confidence: number; // 0-100 scale
  indicators: {
    name: string;
    value: number;
    contribution: number; // 0-100 scale
  }[];
  suitableStrategyTypes: StrategyType[];
  historicalPerformance: {
    strategyType: StrategyType;
    averageReturn: number;
    winRate: number;
    sharpeRatio: number;
  }[];
}

/**
 * Interface for strategy combination
 */
export interface StrategyCombination {
  id: string;
  name: string;
  description: string;
  strategies: {
    strategyId: string;
    weight: number; // 0-100 scale
    allocation: number; // 0-100 scale
    parameters: Record<string, any>;
  }[];
  correlationMatrix: number[][]; // Correlation between strategies
  combinedPerformanceMetrics: StrategyPerformanceMetrics;
  diversificationScore: number; // 0-100 scale
  riskReductionPercentage: number;
  returnEnhancementPercentage: number;
  synergies: {
    description: string;
    impact: number; // 0-100 scale
  }[];
}