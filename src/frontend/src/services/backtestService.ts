/**
 * Backtest service for the Ultimate Hedge Fund & Trading Application.
 * Handles strategy creation, execution, and results management.
 */
import { apiRequest } from './api';

// Types
export interface Strategy {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BacktestConfig {
  strategy_id: string;
  symbols: string[];
  timeframe: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  parameters?: Record<string, any>;
}

export interface BacktestResult {
  id: string;
  strategy_id: string;
  config: BacktestConfig;
  summary: {
    total_return: number;
    annualized_return: number;
    sharpe_ratio: number;
    max_drawdown: number;
    win_rate: number;
    profit_factor: number;
    total_trades: number;
    profitable_trades: number;
    unprofitable_trades: number;
  };
  equity_curve: Array<{
    date: string;
    equity: number;
  }>;
  monthly_returns: Array<{
    month: string;
    return: number;
  }>;
  trades: Array<{
    id: number;
    symbol: string;
    type: 'Long' | 'Short';
    entry_date: string;
    exit_date: string;
    entry_price: number;
    exit_price: number;
    quantity: number;
    pnl: number;
    pnl_percent: number;
  }>;
  created_at: string;
}

// Backtest service
const backtestService = {
  // Get all strategies
  getStrategies: () => {
    return apiRequest<Strategy[]>({
      method: 'GET',
      url: '/api/backtest/strategies',
    });
  },

  // Get strategy by ID
  getStrategy: (id: string) => {
    return apiRequest<Strategy>({
      method: 'GET',
      url: `/api/backtest/strategies/${id}`,
    });
  },

  // Create new strategy
  createStrategy: (data: Omit<Strategy, 'id' | 'created_at' | 'updated_at'>) => {
    return apiRequest<Strategy>({
      method: 'POST',
      url: '/api/backtest/strategies',
      data,
    });
  },

  // Update strategy
  updateStrategy: (id: string, data: Partial<Omit<Strategy, 'id' | 'created_at' | 'updated_at'>>) => {
    return apiRequest<Strategy>({
      method: 'PUT',
      url: `/api/backtest/strategies/${id}`,
      data,
    });
  },

  // Delete strategy
  deleteStrategy: (id: string) => {
    return apiRequest<{ message: string }>({
      method: 'DELETE',
      url: `/api/backtest/strategies/${id}`,
    });
  },

  // Run backtest
  runBacktest: (config: BacktestConfig) => {
    return apiRequest<BacktestResult>({
      method: 'POST',
      url: '/api/backtest/run',
      data: config,
    });
  },

  // Get backtest results
  getBacktestResults: () => {
    return apiRequest<BacktestResult[]>({
      method: 'GET',
      url: '/api/backtest/results',
    });
  },

  // Get backtest result by ID
  getBacktestResult: (id: string) => {
    return apiRequest<BacktestResult>({
      method: 'GET',
      url: `/api/backtest/results/${id}`,
    });
  },

  // Delete backtest result
  deleteBacktestResult: (id: string) => {
    return apiRequest<{ message: string }>({
      method: 'DELETE',
      url: `/api/backtest/results/${id}`,
    });
  },

  // Get available strategy templates
  getStrategyTemplates: () => {
    return apiRequest<Strategy[]>({
      method: 'GET',
      url: '/api/backtest/templates',
    });
  },

  // Export backtest result as CSV
  exportBacktestResultCSV: (id: string) => {
    return apiRequest<Blob>({
      method: 'GET',
      url: `/api/backtest/results/${id}/export/csv`,
      responseType: 'blob',
    });
  },

  // Export backtest result as PDF
  exportBacktestResultPDF: (id: string) => {
    return apiRequest<Blob>({
      method: 'GET',
      url: `/api/backtest/results/${id}/export/pdf`,
      responseType: 'blob',
    });
  },
};

export default backtestService;