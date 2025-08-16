/**
 * Portfolio Optimization Models
 * Defines the core interfaces and types for the portfolio optimization system
 */

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  assetClass: AssetClass;
  sector?: string;
  industry?: string;
  country?: string;
  currency: string;
}

export enum AssetClass {
  EQUITY = 'EQUITY',
  FIXED_INCOME = 'FIXED_INCOME',
  COMMODITY = 'COMMODITY',
  CRYPTO = 'CRYPTO',
  FOREX = 'FOREX',
  ALTERNATIVE = 'ALTERNATIVE',
  CASH = 'CASH'
}

export interface AssetReturn {
  assetId: string;
  timestamp: Date;
  returnValue: number;
}

export interface AssetAllocation {
  assetId: string;
  weight: number;
  targetWeight?: number;
  minWeight?: number;
  maxWeight?: number;
}

export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  assets: Asset[];
  allocations: AssetAllocation[];
  benchmarkId?: string;
}

export interface OptimizationConstraint {
  type: ConstraintType;
  parameters: Record<string, any>;
}

export enum ConstraintType {
  ASSET_WEIGHT = 'ASSET_WEIGHT',
  ASSET_CLASS_WEIGHT = 'ASSET_CLASS_WEIGHT',
  SECTOR_WEIGHT = 'SECTOR_WEIGHT',
  COUNTRY_WEIGHT = 'COUNTRY_WEIGHT',
  FACTOR_EXPOSURE = 'FACTOR_EXPOSURE',
  TURNOVER = 'TURNOVER',
  TRACKING_ERROR = 'TRACKING_ERROR',
  RISK_CONTRIBUTION = 'RISK_CONTRIBUTION'
}

export interface OptimizationObjective {
  type: ObjectiveType;
  parameters: Record<string, any>;
}

export enum ObjectiveType {
  MAXIMIZE_RETURN = 'MAXIMIZE_RETURN',
  MINIMIZE_RISK = 'MINIMIZE_RISK',
  MAXIMIZE_SHARPE = 'MAXIMIZE_SHARPE',
  MINIMIZE_TRACKING_ERROR = 'MINIMIZE_TRACKING_ERROR',
  MAXIMIZE_INFORMATION_RATIO = 'MAXIMIZE_INFORMATION_RATIO',
  RISK_PARITY = 'RISK_PARITY',
  MINIMIZE_DRAWDOWN = 'MINIMIZE_DRAWDOWN',
  MAXIMIZE_SORTINO = 'MAXIMIZE_SORTINO',
  MAXIMIZE_CALMAR = 'MAXIMIZE_CALMAR'
}

export interface OptimizationResult {
  portfolioId: string;
  timestamp: Date;
  objective: OptimizationObjective;
  constraints: OptimizationConstraint[];
  allocations: AssetAllocation[];
  metrics: OptimizationMetrics;
  status: OptimizationStatus;
  message?: string;
}

export interface OptimizationMetrics {
  expectedReturn: number;
  expectedRisk: number;
  sharpeRatio: number;
  maxDrawdown?: number;
  trackingError?: number;
  informationRatio?: number;
  sortinoRatio?: number;
  calmarRatio?: number;
  turnover?: number;
}

export enum OptimizationStatus {
  SUCCESS = 'SUCCESS',
  PARTIAL_SUCCESS = 'PARTIAL_SUCCESS',
  FAILED = 'FAILED',
  INFEASIBLE = 'INFEASIBLE'
}

export interface OptimizationRequest {
  portfolioId: string;
  objective: OptimizationObjective;
  constraints: OptimizationConstraint[];
  assetUniverse?: string[];
  useBenchmark?: boolean;
  riskFreeRate?: number;
  lookbackPeriod?: number;
}