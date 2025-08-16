import {
  BacktestConfig,
  BacktestResult,
  Strategy,
  BacktestOrder,
  BacktestPosition,
  BacktestTrade,
  PortfolioSnapshot,
  PerformanceMetrics,
  OrderSide,
  OrderType,
  OrderStatus,
  PositionStatus,
  DataFrequency
} from '../../types/backtesting';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

/**
 * Core service for backtesting trading strategies
 */
export default class BacktestingService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  }

  /**
   * Create a new backtest configuration
   * @param config Backtest configuration
   * @returns Created backtest configuration with ID
   */
  public async createBacktestConfig(config: Omit<BacktestConfig, 'id' | 'createdAt'>): Promise<BacktestConfig> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/configs`, config);
      return response.data;
    } catch (error) {
      console.error('Error creating backtest configuration:', error);
      throw error;
    }
  }

  /**
   * Get backtest configuration by ID
   * @param id Backtest configuration ID
   * @returns Backtest configuration
   */
  public async getBacktestConfig(id: string): Promise<BacktestConfig> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/configs/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting backtest configuration with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all backtest configurations for the current user
   * @returns Array of backtest configurations
   */
  public async getBacktestConfigs(): Promise<BacktestConfig[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/configs`);
      return response.data;
    } catch (error) {
      console.error('Error getting backtest configurations:', error);
      throw error;
    }
  }

  /**
   * Update an existing backtest configuration
   * @param id Backtest configuration ID
   * @param config Updated backtest configuration
   * @returns Updated backtest configuration
   */
  public async updateBacktestConfig(id: string, config: Partial<BacktestConfig>): Promise<BacktestConfig> {
    try {
      const response = await axios.put(`${this.apiUrl}/api/backtesting/configs/${id}`, config);
      return response.data;
    } catch (error) {
      console.error(`Error updating backtest configuration with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a backtest configuration
   * @param id Backtest configuration ID
   * @returns Success status
   */
  public async deleteBacktestConfig(id: string): Promise<{ success: boolean }> {
    try {
      const response = await axios.delete(`${this.apiUrl}/api/backtesting/configs/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting backtest configuration with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Execute a backtest with the given configuration
   * @param configId Backtest configuration ID
   * @returns Backtest result
   */
  public async executeBacktest(configId: string): Promise<BacktestResult> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/execute`, { configId });
      return response.data;
    } catch (error) {
      console.error(`Error executing backtest with configuration ID ${configId}:`, error);
      throw error;
    }
  }

  /**
   * Get backtest result by ID
   * @param id Backtest result ID
   * @returns Backtest result
   */
  public async getBacktestResult(id: string): Promise<BacktestResult> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/results/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting backtest result with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all backtest results for the current user
   * @returns Array of backtest results
   */
  public async getBacktestResults(): Promise<BacktestResult[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/results`);
      return response.data;
    } catch (error) {
      console.error('Error getting backtest results:', error);
      throw error;
    }
  }

  /**
   * Get backtest results for a specific configuration
   * @param configId Backtest configuration ID
   * @returns Array of backtest results
   */
  public async getBacktestResultsByConfig(configId: string): Promise<BacktestResult[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/results/config/${configId}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting backtest results for configuration ID ${configId}:`, error);
      throw error;
    }
  }

  /**
   * Get backtest results for a specific strategy
   * @param strategyId Strategy ID
   * @returns Array of backtest results
   */
  public async getBacktestResultsByStrategy(strategyId: string): Promise<BacktestResult[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/results/strategy/${strategyId}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting backtest results for strategy ID ${strategyId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a backtest result
   * @param id Backtest result ID
   * @returns Success status
   */
  public async deleteBacktestResult(id: string): Promise<{ success: boolean }> {
    try {
      const response = await axios.delete(`${this.apiUrl}/api/backtesting/results/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting backtest result with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Compare multiple backtest results
   * @param resultIds Array of backtest result IDs to compare
   * @returns Comparison data
   */
  public async compareBacktestResults(resultIds: string[]): Promise<any> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/compare`, { resultIds });
      return response.data;
    } catch (error) {
      console.error('Error comparing backtest results:', error);
      throw error;
    }
  }

  /**
   * Get detailed trades for a backtest result
   * @param resultId Backtest result ID
   * @returns Array of trades
   */
  public async getBacktestTrades(resultId: string): Promise<BacktestTrade[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/results/${resultId}/trades`);
      return response.data;
    } catch (error) {
      console.error(`Error getting trades for backtest result ID ${resultId}:`, error);
      throw error;
    }
  }

  /**
   * Get detailed positions for a backtest result
   * @param resultId Backtest result ID
   * @returns Array of positions
   */
  public async getBacktestPositions(resultId: string): Promise<BacktestPosition[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/results/${resultId}/positions`);
      return response.data;
    } catch (error) {
      console.error(`Error getting positions for backtest result ID ${resultId}:`, error);
      throw error;
    }
  }

  /**
   * Get detailed orders for a backtest result
   * @param resultId Backtest result ID
   * @returns Array of orders
   */
  public async getBacktestOrders(resultId: string): Promise<BacktestOrder[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/results/${resultId}/orders`);
      return response.data;
    } catch (error) {
      console.error(`Error getting orders for backtest result ID ${resultId}:`, error);
      throw error;
    }
  }

  /**
   * Get portfolio snapshots for a backtest result
   * @param resultId Backtest result ID
   * @returns Array of portfolio snapshots
   */
  public async getBacktestPortfolioSnapshots(resultId: string): Promise<PortfolioSnapshot[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/results/${resultId}/portfolio`);
      return response.data;
    } catch (error) {
      console.error(`Error getting portfolio snapshots for backtest result ID ${resultId}:`, error);
      throw error;
    }
  }

  /**
   * Get performance metrics for a backtest result
   * @param resultId Backtest result ID
   * @returns Performance metrics
   */
  public async getBacktestPerformanceMetrics(resultId: string): Promise<PerformanceMetrics> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/results/${resultId}/metrics`);
      return response.data;
    } catch (error) {
      console.error(`Error getting performance metrics for backtest result ID ${resultId}:`, error);
      throw error;
    }
  }

  /**
   * Get equity curve data for a backtest result
   * @param resultId Backtest result ID
   * @returns Equity curve data
   */
  public async getBacktestEquityCurve(resultId: string): Promise<{ timestamp: string; value: number }[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/results/${resultId}/equity`);
      return response.data;
    } catch (error) {
      console.error(`Error getting equity curve for backtest result ID ${resultId}:`, error);
      throw error;
    }
  }

  /**
   * Get drawdown curve data for a backtest result
   * @param resultId Backtest result ID
   * @returns Drawdown curve data
   */
  public async getBacktestDrawdownCurve(resultId: string): Promise<{ timestamp: string; value: number }[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/results/${resultId}/drawdown`);
      return response.data;
    } catch (error) {
      console.error(`Error getting drawdown curve for backtest result ID ${resultId}:`, error);
      throw error;
    }
  }

  /**
   * Get available data frequencies for backtesting
   * @returns Array of available data frequencies
   */
  public async getAvailableDataFrequencies(): Promise<{ value: DataFrequency; label: string }[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/data-frequencies`);
      return response.data;
    } catch (error) {
      console.error('Error getting available data frequencies:', error);
      throw error;
    }
  }

  /**
   * Check if historical data is available for the given tickers and time range
   * @param tickers Array of ticker symbols
   * @param startDate Start date
   * @param endDate End date
   * @param frequency Data frequency
   * @returns Availability status for each ticker
   */
  public async checkDataAvailability(
    tickers: string[],
    startDate: string,
    endDate: string,
    frequency: DataFrequency
  ): Promise<Record<string, boolean>> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/check-data`, {
        tickers,
        startDate,
        endDate,
        frequency
      });
      return response.data;
    } catch (error) {
      console.error('Error checking data availability:', error);
      throw error;
    }
  }

  /**
   * Export backtest result to CSV
   * @param resultId Backtest result ID
   * @returns CSV data as string
   */
  public async exportBacktestResultToCsv(resultId: string): Promise<string> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/results/${resultId}/export/csv`, {
        responseType: 'blob'
      });
      
      // Convert blob to string
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsText(response.data);
      });
    } catch (error) {
      console.error(`Error exporting backtest result with ID ${resultId} to CSV:`, error);
      throw error;
    }
  }

  /**
   * Export backtest result to JSON
   * @param resultId Backtest result ID
   * @returns JSON data
   */
  public async exportBacktestResultToJson(resultId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/results/${resultId}/export/json`);
      return response.data;
    } catch (error) {
      console.error(`Error exporting backtest result with ID ${resultId} to JSON:`, error);
      throw error;
    }
  }

  /**
   * Get backtest logs
   * @param resultId Backtest result ID
   * @returns Array of log entries
   */
  public async getBacktestLogs(resultId: string): Promise<{ timestamp: string; level: string; message: string }[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/results/${resultId}/logs`);
      return response.data;
    } catch (error) {
      console.error(`Error getting logs for backtest result ID ${resultId}:`, error);
      throw error;
    }
  }
}