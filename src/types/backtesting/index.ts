/**
 * Core type definitions for the Backtesting & Simulation Engine
 */

// Time periods for backtesting
export enum BacktestPeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
  CUSTOM = 'custom'
}

// Frequency of data for backtesting
export enum DataFrequency {
  MINUTE = '1min',
  FIVE_MINUTES = '5min',
  FIFTEEN_MINUTES = '15min',
  THIRTY_MINUTES = '30min',
  HOUR = '1hour',
  FOUR_HOURS = '4hour',
  DAY = '1day',
  WEEK = '1week',
  MONTH = '1month'
}

// Types of strategies that can be backtested
export enum StrategyType {
  TECHNICAL = 'technical',
  FUNDAMENTAL = 'fundamental',
  SENTIMENT = 'sentiment',
  MACHINE_LEARNING = 'machine_learning',
  MULTI_FACTOR = 'multi_factor',
  CUSTOM = 'custom'
}

// Order types for backtesting
export enum OrderType {
  MARKET = 'market',
  LIMIT = 'limit',
  STOP = 'stop',
  STOP_LIMIT = 'stop_limit',
  TRAILING_STOP = 'trailing_stop'
}

// Order side (buy/sell)
export enum OrderSide {
  BUY = 'buy',
  SELL = 'sell'
}

// Order status
export enum OrderStatus {
  PENDING = 'pending',
  FILLED = 'filled',
  PARTIALLY_FILLED = 'partially_filled',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

// Position status
export enum PositionStatus {
  OPEN = 'open',
  CLOSED = 'closed'
}

// Risk management rules
export interface RiskRule {
  id: string;
  name: string;
  type: 'stop_loss' | 'take_profit' | 'max_drawdown' | 'max_position_size' | 'max_concentration' | 'custom';
  parameters: Record<string, any>;
  description: string;
  enabled: boolean;
}

// Strategy condition
export interface StrategyCondition {
  id: string;
  type: 'indicator' | 'price' | 'volume' | 'sentiment' | 'fundamental' | 'custom';
  indicator?: string;
  operator: 'greater_than' | 'less_than' | 'equal' | 'crosses_above' | 'crosses_below' | 'between';
  value: number | [number, number]; // Single value or range
  lookback?: number; // Number of periods to look back
  parameters?: Record<string, any>; // Additional parameters
}

// Strategy action
export interface StrategyAction {
  id: string;
  type: 'buy' | 'sell' | 'close' | 'adjust_position' | 'custom';
  orderType: OrderType;
  quantity?: number | 'all' | 'percentage'; // Specific quantity, all, or percentage
  quantityValue?: number; // Value if quantity is percentage
  price?: number | 'market'; // Specific price or market
  timeInForce?: 'day' | 'gtc' | 'ioc' | 'fok';
  parameters?: Record<string, any>; // Additional parameters
}

// Strategy rule combining condition and action
export interface StrategyRule {
  id: string;
  name: string;
  description?: string;
  conditions: StrategyCondition[];
  actions: StrategyAction[];
  logicOperator: 'and' | 'or'; // How to combine multiple conditions
  enabled: boolean;
  priority: number; // Order of evaluation
}

// Complete strategy definition
export interface Strategy {
  id: string;
  name: string;
  description: string;
  type: StrategyType;
  rules: StrategyRule[];
  riskManagement: RiskRule[];
  parameters: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isPublic: boolean;
  tags: string[];
  version: string;
}

// Order in backtesting
export interface BacktestOrder {
  id: string;
  strategyId: string;
  backtestId: string;
  ticker: string;
  side: OrderSide;
  type: OrderType;
  status: OrderStatus;
  quantity: number;
  price: number;
  stopPrice?: number;
  limitPrice?: number;
  createdAt: string;
  updatedAt: string;
  filledAt?: string;
  filledPrice?: number;
  filledQuantity?: number;
  commission?: number;
  ruleId?: string; // Which strategy rule triggered this order
}

// Position in backtesting
export interface BacktestPosition {
  id: string;
  backtestId: string;
  ticker: string;
  side: OrderSide;
  status: PositionStatus;
  quantity: number;
  entryPrice: number;
  entryDate: string;
  exitPrice?: number;
  exitDate?: string;
  unrealizedPnl?: number;
  realizedPnl?: number;
  commission?: number;
}

// Trade in backtesting
export interface BacktestTrade {
  id: string;
  backtestId: string;
  positionId: string;
  ticker: string;
  side: OrderSide;
  quantity: number;
  price: number;
  timestamp: string;
  commission: number;
  pnl: number;
}

// Portfolio snapshot
export interface PortfolioSnapshot {
  timestamp: string;
  cash: number;
  equity: number;
  positions: {
    ticker: string;
    quantity: number;
    marketValue: number;
    unrealizedPnl: number;
    allocation: number; // Percentage of portfolio
  }[];
  totalValue: number; // cash + equity
  dailyPnl: number;
  dailyPnlPct: number;
  totalPnl: number;
  totalPnlPct: number;
}

// Performance metrics
export interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  maxDrawdownDuration: number;
  volatility: number;
  beta: number;
  alpha: number;
  winRate: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  averageHoldingPeriod: number;
  calmarRatio: number;
  informationRatio: number;
  trackingError: number;
  treynorRatio: number;
  ulcerIndex: number;
  marketCorrelation: number;
}

// Backtest configuration
export interface BacktestConfig {
  id: string;
  name: string;
  description?: string;
  strategyId: string;
  tickers: string[];
  startDate: string;
  endDate: string;
  initialCapital: number;
  dataFrequency: DataFrequency;
  includeFees: boolean;
  feeStructure: {
    percentage?: number;
    fixed?: number;
    minimum?: number;
  };
  slippage: number; // Percentage
  benchmark?: string; // Ticker for benchmark comparison
  useHistoricalData: boolean; // Use actual historical data or simulation
  includeDividends: boolean;
  includeSplits: boolean;
  parameters: Record<string, any>; // Additional parameters
  createdAt: string;
  createdBy: string;
}

// Backtest result
export interface BacktestResult {
  id: string;
  configId: string;
  strategyId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startDate: string;
  endDate: string;
  executionTime: number; // In milliseconds
  orders: BacktestOrder[];
  trades: BacktestTrade[];
  positions: BacktestPosition[];
  portfolioSnapshots: PortfolioSnapshot[];
  metrics: PerformanceMetrics;
  equity: { timestamp: string; value: number }[]; // Equity curve
  drawdowns: { timestamp: string; value: number }[]; // Drawdown curve
  returns: { timestamp: string; value: number }[]; // Returns curve
  logs: { timestamp: string; level: string; message: string }[];
  errors: { timestamp: string; message: string }[];
  createdAt: string;
  completedAt?: string;
}

// Simulation market environment
export interface MarketEnvironment {
  id: string;
  name: string;
  description?: string;
  volatility: number;
  trend: 'bullish' | 'bearish' | 'sideways' | 'custom';
  volumeProfile: 'normal' | 'high' | 'low' | 'custom';
  correlations: Record<string, number>; // Correlations between assets
  shocks: {
    timestamp: string;
    magnitude: number;
    affectedTickers: string[];
    duration: number;
  }[];
  seasonality: boolean;
  parameters: Record<string, any>;
}

// Simulation configuration
export interface SimulationConfig extends BacktestConfig {
  environment: MarketEnvironment;
  iterations: number; // Number of simulation runs
  monteCarlo: boolean; // Use Monte Carlo simulation
  stressTest: boolean; // Include stress testing
  scenarios: {
    id: string;
    name: string;
    description?: string;
    parameters: Record<string, any>;
  }[];
}

// Simulation result
export interface SimulationResult extends BacktestResult {
  iterations: {
    id: string;
    metrics: PerformanceMetrics;
    equity: { timestamp: string; value: number }[];
  }[];
  probabilityOfProfit: number;
  expectedReturn: number;
  expectedDrawdown: number;
  confidenceIntervals: {
    level: number; // e.g., 0.95 for 95%
    lowerBound: number;
    upperBound: number;
  }[];
}

// Strategy optimization parameters
export interface OptimizationParameter {
  name: string;
  type: 'number' | 'boolean' | 'string' | 'enum';
  min?: number;
  max?: number;
  step?: number;
  values?: any[];
  default: any;
}

// Strategy optimization configuration
export interface OptimizationConfig {
  id: string;
  backtestConfigId: string;
  parameters: OptimizationParameter[];
  objectiveFunction: 'sharpe_ratio' | 'total_return' | 'drawdown' | 'profit_factor' | 'custom';
  customObjective?: string; // JavaScript function as string
  method: 'grid_search' | 'random_search' | 'bayesian' | 'genetic' | 'particle_swarm';
  maxIterations: number;
  parallelRuns: number;
  createdAt: string;
  createdBy: string;
}

// Strategy optimization result
export interface OptimizationResult {
  id: string;
  configId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  iterations: {
    id: string;
    parameters: Record<string, any>;
    metrics: PerformanceMetrics;
    objectiveValue: number;
  }[];
  bestParameters: Record<string, any>;
  bestObjectiveValue: number;
  executionTime: number;
  createdAt: string;
  completedAt?: string;
}

// Walk-forward analysis configuration
export interface WalkForwardConfig {
  id: string;
  backtestConfigId: string;
  optimizationConfigId: string;
  inSamplePeriod: number; // Number of bars
  outOfSamplePeriod: number; // Number of bars
  numberOfFolds: number;
  anchored: boolean; // Whether to use anchored walk-forward
  createdAt: string;
  createdBy: string;
}

// Walk-forward analysis result
export interface WalkForwardResult {
  id: string;
  configId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  folds: {
    id: string;
    inSampleStart: string;
    inSampleEnd: string;
    outOfSampleStart: string;
    outOfSampleEnd: string;
    parameters: Record<string, any>;
    inSampleMetrics: PerformanceMetrics;
    outOfSampleMetrics: PerformanceMetrics;
  }[];
  aggregateMetrics: PerformanceMetrics;
  robustnessScore: number; // Measure of strategy robustness
  executionTime: number;
  createdAt: string;
  completedAt?: string;
}