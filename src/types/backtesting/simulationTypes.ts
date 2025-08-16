/**
 * Type definitions for market simulation in the Backtesting & Simulation Engine
 */

/**
 * Represents a simulation configuration
 */
export interface SimulationConfig {
  id?: string;
  name: string;
  description?: string;
  backtestConfigId: string;
  scenarioType: ScenarioType;
  parameters: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}

/**
 * Types of simulation scenarios
 */
export enum ScenarioType {
  HISTORICAL_REPLAY = 'historical_replay',
  MONTE_CARLO = 'monte_carlo',
  STRESS_TEST = 'stress_test',
  CUSTOM_SCENARIO = 'custom_scenario',
  REGIME_CHANGE = 'regime_change',
  BLACK_SWAN = 'black_swan',
  VOLATILITY_SHOCK = 'volatility_shock',
  CORRELATION_BREAKDOWN = 'correlation_breakdown',
  LIQUIDITY_CRISIS = 'liquidity_crisis',
  MARKET_CRASH = 'market_crash'
}

/**
 * Represents a simulation result
 */
export interface SimulationResult {
  id: string;
  configId: string;
  backtestConfigId: string;
  scenarioType: ScenarioType;
  status: SimulationStatus;
  iterations: SimulationIteration[];
  summary: SimulationSummary;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

/**
 * Status of a simulation
 */
export enum SimulationStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * Represents an iteration in a simulation
 */
export interface SimulationIteration {
  id: string;
  simulationId: string;
  iterationNumber: number;
  parameters: Record<string, any>;
  backtestResult: string; // ID of the backtest result
  metrics: Record<string, number>;
}

/**
 * Summary of simulation results
 */
export interface SimulationSummary {
  averageReturn: number;
  medianReturn: number;
  returnStandardDeviation: number;
  minReturn: number;
  maxReturn: number;
  averageDrawdown: number;
  maxDrawdown: number;
  valueAtRisk: number; // 95% VaR
  conditionalValueAtRisk: number; // 95% CVaR/Expected Shortfall
  winRate: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  successProbability: number;
}

/**
 * Represents a stress test configuration
 */
export interface StressTestConfig extends SimulationConfig {
  stressFactors: StressFactor[];
}

/**
 * Represents a stress factor for stress testing
 */
export interface StressFactor {
  type: StressFactorType;
  intensity: number; // 0-1 scale
  duration: number; // in days
  affectedSymbols?: string[]; // if empty, affects all symbols
  parameters: Record<string, any>;
}

/**
 * Types of stress factors
 */
export enum StressFactorType {
  PRICE_SHOCK = 'price_shock',
  VOLATILITY_INCREASE = 'volatility_increase',
  LIQUIDITY_REDUCTION = 'liquidity_reduction',
  CORRELATION_CHANGE = 'correlation_change',
  INTEREST_RATE_SHOCK = 'interest_rate_shock',
  SECTOR_ROTATION = 'sector_rotation',
  MARKET_CRASH = 'market_crash',
  CUSTOM = 'custom'
}

/**
 * Represents a Monte Carlo simulation configuration
 */
export interface MonteCarloConfig extends SimulationConfig {
  iterations: number;
  confidenceLevel: number; // 0-1 scale
  simulationMethod: MonteCarloMethod;
  returnDistribution: DistributionType;
  preserveCorrelation: boolean;
  seed?: number;
}

/**
 * Monte Carlo simulation methods
 */
export enum MonteCarloMethod {
  BOOTSTRAP = 'bootstrap',
  PARAMETRIC = 'parametric',
  HISTORICAL = 'historical',
  CUSTOM = 'custom'
}

/**
 * Types of statistical distributions
 */
export enum DistributionType {
  NORMAL = 'normal',
  LOGNORMAL = 'lognormal',
  STUDENT_T = 'student_t',
  EMPIRICAL = 'empirical',
  CUSTOM = 'custom'
}

/**
 * Represents a regime change simulation configuration
 */
export interface RegimeChangeConfig extends SimulationConfig {
  regimes: MarketRegime[];
  transitionProbabilities: number[][]; // Matrix of transition probabilities
  initialRegime: number; // Index of the starting regime
  regimeDurations: number[]; // Average duration of each regime in days
}

/**
 * Represents a market regime
 */
export interface MarketRegime {
  name: string;
  volatility: number;
  trend: number;
  correlationMatrix?: number[][]; // Correlation matrix for multi-asset simulations
  parameters: Record<string, any>;
}