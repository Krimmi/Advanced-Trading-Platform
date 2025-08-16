/**
 * Type definitions for Monte Carlo simulation in the Backtesting & Simulation Engine
 */

/**
 * Parameters for Monte Carlo simulation
 */
export interface MonteCarloParameters {
  iterations: number;
  confidenceInterval: number;
  returnDistribution: string;
  volatilityModel: string;
  correlationModel: string;
  seed: number;
  pathCount?: number;
  timeHorizon?: number;
  riskFreeRate?: number;
  includeExtremeScenarios?: boolean;
  bootstrapMethod?: string;
  customParameters?: Record<string, any>;
}

/**
 * Result of a Monte Carlo simulation
 */
export interface MonteCarloResult {
  simulationId: string;
  iterations: MonteCarloIteration[];
  statistics: MonteCarloStatistics;
  confidenceIntervals: ConfidenceInterval[];
  valueAtRisk: ValueAtRiskMetrics;
  drawdownAnalysis: DrawdownAnalysis;
  returnDistribution: DistributionMetrics;
  extremeScenarios: ExtremeScenarios;
  createdAt: string;
}

/**
 * Represents a single iteration in a Monte Carlo simulation
 */
export interface MonteCarloIteration {
  iterationId: string;
  equityCurve: { timestamp: string; value: number }[];
  finalValue: number;
  totalReturn: number;
  maxDrawdown: number;
  volatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  winRate: number;
  profitFactor: number;
  recoveryFactor: number;
  trades?: { timestamp: string; type: string; price: number; size: number; pnl: number }[];
}

/**
 * Statistical metrics for Monte Carlo simulation results
 */
export interface MonteCarloStatistics {
  meanReturn: number;
  medianReturn: number;
  standardDeviation: number;
  skewness: number;
  kurtosis: number;
  minReturn: number;
  maxReturn: number;
  meanDrawdown: number;
  medianDrawdown: number;
  maxDrawdown: number;
  meanSharpe: number;
  meanSortino: number;
  meanWinRate: number;
  meanProfitFactor: number;
  successProbability: number;
}

/**
 * Confidence interval for simulation results
 */
export interface ConfidenceInterval {
  level: number;
  returnLowerBound: number;
  returnUpperBound: number;
  drawdownLowerBound: number;
  drawdownUpperBound: number;
}

/**
 * Value at Risk metrics
 */
export interface ValueAtRiskMetrics {
  historicalVaR: { [key: string]: number }; // e.g., "95%": 0.15, "99%": 0.22
  parametricVaR: { [key: string]: number };
  conditionalVaR: { [key: string]: number }; // Expected Shortfall
  timeScaledVaR: { [key: string]: { [key: string]: number } }; // e.g., "1d": {"95%": 0.05}, "10d": {"95%": 0.15}
}

/**
 * Drawdown analysis metrics
 */
export interface DrawdownAnalysis {
  averageDrawdown: number;
  averageDrawdownDuration: number;
  maxDrawdown: number;
  maxDrawdownDuration: number;
  drawdownFrequency: number;
  recoveryStats: {
    averageRecoveryTime: number;
    maxRecoveryTime: number;
    recoveryTimeDistribution: { [key: string]: number };
  };
}

/**
 * Distribution metrics for returns
 */
export interface DistributionMetrics {
  histogram: { bin: number; frequency: number }[];
  normalityTest: {
    jarqueBera: number;
    pValue: number;
    isNormal: boolean;
  };
  quantiles: { [key: string]: number }; // e.g., "10%": -0.05, "25%": -0.02, ...
}

/**
 * Extreme scenario analysis
 */
export interface ExtremeScenarios {
  bestCase: MonteCarloIteration;
  worstCase: MonteCarloIteration;
  highVolatility: MonteCarloIteration;
  lowVolatility: MonteCarloIteration;
  fastRecovery: MonteCarloIteration;
  slowRecovery: MonteCarloIteration;
}

/**
 * Monte Carlo simulation configuration options
 */
export interface MonteCarloConfig {
  simulationMethod: 'bootstrap' | 'parametric' | 'historical' | 'custom';
  returnModel: {
    distribution: 'normal' | 'lognormal' | 'student-t' | 'empirical' | 'custom';
    parameters?: Record<string, any>;
  };
  volatilityModel: {
    type: 'constant' | 'garch' | 'ewma' | 'custom';
    parameters?: Record<string, any>;
  };
  correlationModel: {
    type: 'constant' | 'dynamic' | 'regime-switching' | 'custom';
    parameters?: Record<string, any>;
  };
  timeHorizon: number;
  iterations: number;
  confidenceLevels: number[];
  seed?: number;
  includeExtremeScenarios: boolean;
  customSettings?: Record<string, any>;
}