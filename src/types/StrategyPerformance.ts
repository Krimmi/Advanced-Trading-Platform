/**
 * Strategy Performance Type Definitions
 * 
 * These types define the structure of performance metrics for trading strategies.
 */

export interface TradeRecord {
  id: string;
  symbol: string;
  entryDate: Date;
  entryPrice: number;
  entryQuantity: number;
  exitDate?: Date;
  exitPrice?: number;
  exitQuantity?: number;
  pnl?: number;
  pnlPercent?: number;
  holdingPeriod?: number; // in days
  side: 'long' | 'short';
  status: 'open' | 'closed' | 'partially_closed';
  fees?: number;
  strategyId: string;
  tags?: string[];
  notes?: string;
}

export interface EquityCurvePoint {
  date: Date;
  equity: number;
  drawdown: number;
  drawdownPercent: number;
}

export interface StrategyPerformance {
  // General information
  strategyId: string;
  strategyName: string;
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  finalCapital: number;
  
  // Return metrics
  totalReturn: number;
  totalReturnPercent: number;
  annualizedReturn: number;
  annualizedVolatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  
  // Drawdown metrics
  maxDrawdown: number;
  maxDrawdownPercent: number;
  maxDrawdownDuration: number; // in days
  averageDrawdown: number;
  averageDrawdownPercent: number;
  averageDrawdownDuration: number; // in days
  
  // Trade metrics
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  averageWinPercent: number;
  averageLossPercent: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
  expectancy: number;
  
  // Time metrics
  averageHoldingPeriod: number; // in days
  averageWinningHoldingPeriod: number; // in days
  averageLosingHoldingPeriod: number; // in days
  
  // Risk metrics
  beta?: number;
  alpha?: number;
  informationRatio?: number;
  treynorRatio?: number;
  
  // Detailed data
  equityCurve: EquityCurvePoint[];
  monthlyReturns: { [year: number]: { [month: number]: number } };
  trades: TradeRecord[];
  
  // Market comparison
  benchmarkSymbol?: string;
  benchmarkReturn?: number;
  benchmarkAlpha?: number;
  
  // Additional metrics
  customMetrics?: { [key: string]: number | string };
}