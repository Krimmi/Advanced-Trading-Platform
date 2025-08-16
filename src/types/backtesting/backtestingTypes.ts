/**
 * Core type definitions for the Backtesting & Simulation Engine
 */

import { TimeFrame } from '../common/timeFrameTypes';

/**
 * Represents a backtest configuration
 */
export interface BacktestConfig {
  id?: string;
  name: string;
  description?: string;
  strategyId: string;
  symbols: string[];
  startDate: string; // ISO format date
  endDate: string; // ISO format date
  initialCapital: number;
  timeFrame: TimeFrame;
  commissionType: CommissionType;
  commissionValue: number;
  slippageModel: SlippageModel;
  slippageValue: number;
  dataSource: DataSource;
  includeDividends: boolean;
  includeCorporateActions: boolean;
  executionDelay: number; // in milliseconds
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}

/**
 * Represents a backtest result
 */
export interface BacktestResult {
  id: string;
  configId: string;
  strategyId: string;
  status: BacktestStatus;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalCapital: number;
  totalReturn: number;
  annualizedReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  trades: Trade[];
  equityCurve: EquityPoint[];
  drawdownCurve: DrawdownPoint[];
  monthlyReturns: MonthlyReturn[];
  performanceMetrics: PerformanceMetrics;
  executionTime: number; // in milliseconds
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

/**
 * Status of a backtest
 */
export enum BacktestStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * Commission types for backtest
 */
export enum CommissionType {
  FIXED = 'fixed',
  PERCENTAGE = 'percentage',
  PER_SHARE = 'per_share',
  TIERED = 'tiered',
  CUSTOM = 'custom'
}

/**
 * Slippage models for backtest
 */
export enum SlippageModel {
  NONE = 'none',
  FIXED = 'fixed',
  PERCENTAGE = 'percentage',
  MARKET_IMPACT = 'market_impact',
  CUSTOM = 'custom'
}

/**
 * Data sources for backtest
 */
export enum DataSource {
  FINANCIAL_MODELING_PREP = 'financial_modeling_prep',
  ALPHA_VANTAGE = 'alpha_vantage',
  YAHOO_FINANCE = 'yahoo_finance',
  CUSTOM = 'custom'
}

/**
 * Represents a trade executed during backtest
 */
export interface Trade {
  id: string;
  backtestId: string;
  symbol: string;
  direction: TradeDirection;
  entryDate: string;
  entryPrice: number;
  entrySignal: string;
  quantity: number;
  exitDate?: string;
  exitPrice?: number;
  exitSignal?: string;
  pnl?: number;
  pnlPercentage?: number;
  commission: number;
  slippage: number;
  holdingPeriod?: number; // in days
  status: TradeStatus;
}

/**
 * Direction of a trade
 */
export enum TradeDirection {
  LONG = 'long',
  SHORT = 'short'
}

/**
 * Status of a trade
 */
export enum TradeStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  CANCELLED = 'cancelled'
}

/**
 * Represents a point in the equity curve
 */
export interface EquityPoint {
  date: string;
  equity: number;
  drawdown: number;
  cash: number;
  positions: number;
}

/**
 * Represents a point in the drawdown curve
 */
export interface DrawdownPoint {
  date: string;
  drawdown: number;
  drawdownPercentage: number;
}

/**
 * Represents monthly return data
 */
export interface MonthlyReturn {
  year: number;
  month: number;
  return: number;
}

/**
 * Performance metrics for a backtest
 */
export interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  maxDrawdown: number;
  maxDrawdownPercentage: number;
  maxDrawdownDuration: number; // in days
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  alpha: number;
  beta: number;
  informationRatio: number;
  treynorRatio: number;
  volatility: number;
  downside: number;
  winRate: number;
  profitFactor: number;
  expectancy: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  averageHoldingPeriod: number; // in days
  averageWinHoldingPeriod: number; // in days
  averageLossHoldingPeriod: number; // in days
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  recoveryFactor: number;
  payoffRatio: number;
  profitPerDay: number;
  returnOnMaxDrawdown: number;
  ulcerIndex: number;
  marketCorrelation: number;
}