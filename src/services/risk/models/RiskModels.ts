/**
 * Core interfaces and types for the risk management system
 */

/**
 * Position represents a financial position in a portfolio
 */
export interface Position {
  symbol: string;
  quantity: number;
  price: number;
  value: number;
  currency: string;
  assetClass: AssetClass;
  sector?: string;
  industry?: string;
  country?: string;
  exchange?: string;
  metadata?: Record<string, any>;
}

/**
 * Portfolio represents a collection of positions
 */
export interface Portfolio {
  id: string;
  name: string;
  positions: Position[];
  cash: number;
  currency: string;
  totalValue: number;
  lastUpdated: number;
  metadata?: Record<string, any>;
}

/**
 * Asset classes
 */
export enum AssetClass {
  EQUITY = 'equity',
  FIXED_INCOME = 'fixed_income',
  COMMODITY = 'commodity',
  CURRENCY = 'currency',
  CRYPTO = 'crypto',
  OPTION = 'option',
  FUTURE = 'future',
  ETF = 'etf',
  MUTUAL_FUND = 'mutual_fund',
  OTHER = 'other'
}

/**
 * Risk metric types
 */
export enum RiskMetricType {
  VAR_HISTORICAL = 'var_historical',
  VAR_PARAMETRIC = 'var_parametric',
  VAR_MONTE_CARLO = 'var_monte_carlo',
  EXPECTED_SHORTFALL = 'expected_shortfall',
  VOLATILITY = 'volatility',
  BETA = 'beta',
  SHARPE_RATIO = 'sharpe_ratio',
  SORTINO_RATIO = 'sortino_ratio',
  MAX_DRAWDOWN = 'max_drawdown',
  DOWNSIDE_DEVIATION = 'downside_deviation',
  CORRELATION = 'correlation',
  STRESS_TEST = 'stress_test',
  SCENARIO_ANALYSIS = 'scenario_analysis'
}

/**
 * Risk metric result
 */
export interface RiskMetricResult {
  type: RiskMetricType;
  value: number | number[] | Record<string, number>;
  portfolioId: string;
  timestamp: number;
  confidenceLevel?: number;
  timeHorizon?: number;
  metadata?: Record<string, any>;
}

/**
 * Risk factor represents a factor that can affect portfolio risk
 */
export interface RiskFactor {
  id: string;
  name: string;
  type: RiskFactorType;
  value: number;
  sensitivity?: number;
  metadata?: Record<string, any>;
}

/**
 * Risk factor types
 */
export enum RiskFactorType {
  MARKET = 'market',
  INTEREST_RATE = 'interest_rate',
  CREDIT = 'credit',
  LIQUIDITY = 'liquidity',
  VOLATILITY = 'volatility',
  FOREIGN_EXCHANGE = 'foreign_exchange',
  COMMODITY = 'commodity',
  INFLATION = 'inflation',
  POLITICAL = 'political',
  OTHER = 'other'
}

/**
 * Risk scenario for stress testing
 */
export interface RiskScenario {
  id: string;
  name: string;
  description: string;
  factors: RiskFactorShift[];
  isHistorical: boolean;
  date?: number;
  probability?: number;
  metadata?: Record<string, any>;
}

/**
 * Risk factor shift for scenario analysis
 */
export interface RiskFactorShift {
  factorId: string;
  factorName: string;
  shiftType: 'absolute' | 'relative' | 'percentage';
  shiftValue: number;
}

/**
 * Stress test result
 */
export interface StressTestResult {
  scenarioId: string;
  scenarioName: string;
  portfolioId: string;
  portfolioValueBefore: number;
  portfolioValueAfter: number;
  absoluteChange: number;
  percentageChange: number;
  positionResults: PositionStressResult[];
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Position stress test result
 */
export interface PositionStressResult {
  symbol: string;
  valueBefore: number;
  valueAfter: number;
  absoluteChange: number;
  percentageChange: number;
}

/**
 * Value at Risk (VaR) configuration
 */
export interface VaRConfig {
  confidenceLevel: number;
  timeHorizon: number;
  method: 'historical' | 'parametric' | 'monte_carlo';
  lookbackPeriod?: number;
  iterations?: number;
  decayFactor?: number;
  returnDistribution?: 'normal' | 't' | 'empirical';
  degreesOfFreedom?: number;
}

/**
 * Value at Risk (VaR) result
 */
export interface VaRResult extends RiskMetricResult {
  type: RiskMetricType.VAR_HISTORICAL | RiskMetricType.VAR_PARAMETRIC | RiskMetricType.VAR_MONTE_CARLO;
  value: number;
  confidenceLevel: number;
  timeHorizon: number;
  currency: string;
  percentOfPortfolio: number;
  contributionByPosition: Record<string, number>;
  contributionByAssetClass: Record<string, number>;
  contributionBySector?: Record<string, number>;
  method: 'historical' | 'parametric' | 'monte_carlo';
}

/**
 * Correlation matrix result
 */
export interface CorrelationMatrixResult extends RiskMetricResult {
  type: RiskMetricType.CORRELATION;
  value: Record<string, Record<string, number>>;
  symbols: string[];
  lookbackPeriod: number;
}

/**
 * Risk calculation parameters
 */
export interface RiskCalculationParams {
  portfolioId: string;
  metricType: RiskMetricType;
  confidenceLevel?: number;
  timeHorizon?: number;
  lookbackPeriod?: number;
  iterations?: number;
  decayFactor?: number;
  returnDistribution?: 'normal' | 't' | 'empirical';
  degreesOfFreedom?: number;
  riskFactors?: RiskFactor[];
  scenarios?: RiskScenario[];
  metadata?: Record<string, any>;
}

/**
 * Position sizing recommendation
 */
export interface PositionSizingRecommendation {
  symbol: string;
  currentSize: number;
  recommendedSize: number;
  sizeChange: number;
  sizeChangePercentage: number;
  riskContribution: number;
  riskContributionPercentage: number;
  method: 'kelly' | 'optimal_f' | 'equal_risk' | 'fixed_fractional' | 'other';
  confidence: number;
  metadata?: Record<string, any>;
}

/**
 * Risk alert level
 */
export enum RiskAlertLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Risk alert
 */
export interface RiskAlert {
  id: string;
  level: RiskAlertLevel;
  title: string;
  message: string;
  portfolioId: string;
  metricType: RiskMetricType;
  timestamp: number;
  thresholdValue: number;
  actualValue: number;
  symbols?: string[];
  metadata?: Record<string, any>;
}