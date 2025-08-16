import BacktestingService from './backtestingService';
import MonteCarloService from './monteCarloService';
import { 
  BacktestResult, 
  BacktestConfig, 
  EquityCurvePoint, 
  DrawdownPoint, 
  MonthlyReturn, 
  TradeStatistics 
} from '../../types/backtesting';
import { MonteCarloConfig, MonteCarloResult, ValueAtRiskMetrics, DrawdownAnalysis } from '../../types/backtesting/monteCarloTypes';

/**
 * Extension methods for BacktestingService
 * These methods are used by the BacktestHistoryPanel and BacktestComparisonPanel components
 */

/**
 * Duplicate a backtest
 * @param backtestId Backtest ID to duplicate
 * @returns The newly created backtest result
 */
BacktestingService.prototype.duplicateBacktest = async function(
  backtestId: string
): Promise<BacktestResult> {
  try {
    // Get the original backtest result
    const originalBacktest = await this.getBacktestResult(backtestId);
    
    // Get the original backtest configuration
    const originalConfig = await this.getBacktestConfig(originalBacktest.configId);
    
    // Create a new backtest configuration based on the original
    const newConfig: Omit<BacktestConfig, 'id' | 'createdAt'> = {
      ...originalConfig,
      name: `${originalConfig.name} (Copy)`,
      description: originalConfig.description ? `${originalConfig.description} (Duplicated from ${originalBacktest.configId})` : `Duplicated from ${originalBacktest.configId}`
    };
    
    // Create the new backtest configuration
    const createdConfig = await this.createBacktestConfig(newConfig);
    
    // Execute the backtest with the new configuration
    const newBacktestResult = await this.executeBacktest(createdConfig.id!);
    
    return newBacktestResult;
  } catch (error) {
    console.error(`Error duplicating backtest with ID ${backtestId}:`, error);
    throw error;
  }
};

/**
 * Get backtest configurations with filtering
 * @param filters Optional filters for backtest configurations
 * @returns Array of backtest configurations matching the filters
 */
BacktestingService.prototype.getBacktestConfigs = async function(
  filters?: { strategyId?: string; dateRange?: [string, string] }
): Promise<BacktestConfig[]> {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (filters?.strategyId) {
      params.append('strategyId', filters.strategyId);
    }
    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange[0]);
      params.append('endDate', filters.dateRange[1]);
    }
    
    // Make the API request with query parameters
    const response = await fetch(`${this.apiUrl}/api/backtesting/configs?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get backtest configurations: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting backtest configurations:', error);
    throw error;
  }
};

/**
 * Get equity curve for a backtest
 * @param backtestId Backtest ID
 * @returns Array of equity curve points
 */
BacktestingService.prototype.getBacktestEquityCurve = async function(
  backtestId: string
): Promise<EquityCurvePoint[]> {
  try {
    const response = await fetch(`${this.apiUrl}/api/backtesting/results/${backtestId}/equity-curve`);
    
    if (!response.ok) {
      throw new Error(`Failed to get equity curve: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error getting equity curve for backtest ID ${backtestId}:`, error);
    throw error;
  }
};

/**
 * Get drawdown curve for a backtest
 * @param backtestId Backtest ID
 * @returns Array of drawdown points
 */
BacktestingService.prototype.getBacktestDrawdownCurve = async function(
  backtestId: string
): Promise<DrawdownPoint[]> {
  try {
    const response = await fetch(`${this.apiUrl}/api/backtesting/results/${backtestId}/drawdown-curve`);
    
    if (!response.ok) {
      throw new Error(`Failed to get drawdown curve: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error getting drawdown curve for backtest ID ${backtestId}:`, error);
    throw error;
  }
};

/**
 * Get monthly returns for a backtest
 * @param backtestId Backtest ID
 * @returns Array of monthly returns
 */
BacktestingService.prototype.getBacktestMonthlyReturns = async function(
  backtestId: string
): Promise<MonthlyReturn[]> {
  try {
    const response = await fetch(`${this.apiUrl}/api/backtesting/results/${backtestId}/monthly-returns`);
    
    if (!response.ok) {
      throw new Error(`Failed to get monthly returns: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error getting monthly returns for backtest ID ${backtestId}:`, error);
    throw error;
  }
};

/**
 * Get trade statistics for a backtest
 * @param backtestId Backtest ID
 * @returns Trade statistics
 */
BacktestingService.prototype.getBacktestTradeStatistics = async function(
  backtestId: string
): Promise<TradeStatistics> {
  try {
    const response = await fetch(`${this.apiUrl}/api/backtesting/results/${backtestId}/trade-statistics`);
    
    if (!response.ok) {
      throw new Error(`Failed to get trade statistics: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error getting trade statistics for backtest ID ${backtestId}:`, error);
    throw error;
  }
};

/**
 * Get trades for a backtest with optional filtering
 * @param backtestId Backtest ID
 * @param filters Optional filters for trades
 * @returns Array of trades matching the filters
 */
BacktestingService.prototype.getBacktestTrades = async function(
  backtestId: string,
  filters?: {
    symbol?: string;
    direction?: 'long' | 'short';
    result?: 'win' | 'loss' | 'breakeven';
    dateRange?: [string, string];
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }
) {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (filters?.symbol) {
      params.append('symbol', filters.symbol);
    }
    if (filters?.direction) {
      params.append('direction', filters.direction);
    }
    if (filters?.result) {
      params.append('result', filters.result);
    }
    if (filters?.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
      params.append('startDate', filters.dateRange[0]);
      params.append('endDate', filters.dateRange[1]);
    }
    if (filters?.page !== undefined) {
      params.append('page', filters.page.toString());
    }
    if (filters?.pageSize !== undefined) {
      params.append('pageSize', filters.pageSize.toString());
    }
    if (filters?.sortBy) {
      params.append('sortBy', filters.sortBy);
    }
    if (filters?.sortDirection) {
      params.append('sortDirection', filters.sortDirection);
    }
    
    // Make the API request with query parameters
    const response = await fetch(`${this.apiUrl}/api/backtesting/results/${backtestId}/trades?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get trades: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error getting trades for backtest ID ${backtestId}:`, error);
    throw error;
  }
};

/**
 * Get detailed information about a specific trade
 * @param backtestId Backtest ID
 * @param tradeId Trade ID
 * @returns Detailed trade information
 */
BacktestingService.prototype.getTradeDetails = async function(
  backtestId: string,
  tradeId: string
) {
  try {
    const response = await fetch(`${this.apiUrl}/api/backtesting/results/${backtestId}/trades/${tradeId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get trade details: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error getting trade details for trade ID ${tradeId}:`, error);
    throw error;
  }
};

/**
 * Run a Monte Carlo simulation on a backtest result
 * @param backtestId Backtest result ID
 * @param config Monte Carlo configuration
 * @returns Monte Carlo simulation result
 */
BacktestingService.prototype.runMonteCarloSimulation = async function(
  backtestId: string,
  config: MonteCarloConfig
): Promise<MonteCarloResult> {
  const monteCarloService = new MonteCarloService();
  return await monteCarloService.runAdvancedMonteCarloSimulation(backtestId, config);
};

/**
 * Calculate Value at Risk (VaR) for a backtest result
 * @param backtestId Backtest result ID
 * @param confidenceLevels Array of confidence levels (e.g., [0.95, 0.99])
 * @param timeHorizons Array of time horizons in days (e.g., [1, 5, 10, 20])
 * @returns Value at Risk metrics
 */
BacktestingService.prototype.calculateValueAtRisk = async function(
  backtestId: string,
  confidenceLevels?: number[],
  timeHorizons?: number[]
): Promise<ValueAtRiskMetrics> {
  const monteCarloService = new MonteCarloService();
  return await monteCarloService.calculateValueAtRisk(backtestId, confidenceLevels, timeHorizons);
};

/**
 * Analyze drawdowns for a backtest result
 * @param backtestId Backtest result ID
 * @returns Drawdown analysis
 */
BacktestingService.prototype.analyzeDrawdowns = async function(
  backtestId: string
): Promise<DrawdownAnalysis> {
  const monteCarloService = new MonteCarloService();
  return await monteCarloService.analyzeDrawdowns(backtestId);
};

/**
 * Generate extreme scenarios for a backtest result
 * @param backtestId Backtest result ID
 * @param scenarioTypes Array of scenario types to generate
 * @returns Extreme scenarios
 */
BacktestingService.prototype.generateExtremeScenarios = async function(
  backtestId: string,
  scenarioTypes?: string[]
): Promise<Record<string, any>> {
  const monteCarloService = new MonteCarloService();
  return await monteCarloService.generateExtremeScenarios(backtestId, scenarioTypes);
};

// Add TypeScript interface extensions
declare module './backtestingService' {
  interface BacktestingService {
    runMonteCarloSimulation(backtestId: string, config: MonteCarloConfig): Promise<MonteCarloResult>;
    calculateValueAtRisk(
      backtestId: string,
      confidenceLevels?: number[],
      timeHorizons?: number[]
    ): Promise<ValueAtRiskMetrics>;
    analyzeDrawdowns(backtestId: string): Promise<DrawdownAnalysis>;
    generateExtremeScenarios(backtestId: string, scenarioTypes?: string[]): Promise<Record<string, any>>;
  }
}

export default BacktestingService;