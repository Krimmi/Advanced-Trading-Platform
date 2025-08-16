import {
  BacktestResult,
  BacktestTrade,
  PerformanceMetrics,
  PortfolioSnapshot
} from '../../types/backtesting';
import axios from 'axios';

/**
 * Service for analyzing performance of backtests and simulations
 */
export default class PerformanceAnalyticsService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  }

  /**
   * Calculate performance metrics for a backtest result
   * @param resultId Backtest result ID
   * @returns Performance metrics
   */
  public async calculatePerformanceMetrics(resultId: string): Promise<PerformanceMetrics> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/results/${resultId}/metrics`);
      return response.data;
    } catch (error) {
      console.error(`Error calculating performance metrics for backtest result ID ${resultId}:`, error);
      throw error;
    }
  }

  /**
   * Compare multiple backtest results
   * @param resultIds Array of backtest result IDs to compare
   * @returns Comparison data
   */
  public async compareBacktestResults(resultIds: string[]): Promise<{
    results: {
      id: string;
      name: string;
      metrics: PerformanceMetrics;
    }[];
    comparisonTable: {
      metric: string;
      values: { resultId: string; value: number }[];
    }[];
    bestPerformer: {
      resultId: string;
      name: string;
      metrics: Record<string, number>;
    };
  }> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/compare`, { resultIds });
      return response.data;
    } catch (error) {
      console.error('Error comparing backtest results:', error);
      throw error;
    }
  }

  /**
   * Get equity curve data for a backtest result
   * @param resultId Backtest result ID
   * @returns Equity curve data
   */
  public async getEquityCurve(resultId: string): Promise<{ timestamp: string; value: number }[]> {
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
  public async getDrawdownCurve(resultId: string): Promise<{ timestamp: string; value: number }[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/results/${resultId}/drawdown`);
      return response.data;
    } catch (error) {
      console.error(`Error getting drawdown curve for backtest result ID ${resultId}:`, error);
      throw error;
    }
  }

  /**
   * Get monthly returns for a backtest result
   * @param resultId Backtest result ID
   * @returns Monthly returns data
   */
  public async getMonthlyReturns(resultId: string): Promise<{ year: number; month: number; return: number }[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/results/${resultId}/monthly-returns`);
      return response.data;
    } catch (error) {
      console.error(`Error getting monthly returns for backtest result ID ${resultId}:`, error);
      throw error;
    }
  }

  /**
   * Get trade statistics for a backtest result
   * @param resultId Backtest result ID
   * @returns Trade statistics
   */
  public async getTradeStatistics(resultId: string): Promise<{
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    averageWin: number;
    averageLoss: number;
    largestWin: number;
    largestLoss: number;
    averageHoldingPeriod: number;
    profitFactor: number;
    expectancy: number;
    maxConsecutiveWins: number;
    maxConsecutiveLosses: number;
  }> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/results/${resultId}/trade-statistics`);
      return response.data;
    } catch (error) {
      console.error(`Error getting trade statistics for backtest result ID ${resultId}:`, error);
      throw error;
    }
  }

  /**
   * Get trade distribution by day of week
   * @param resultId Backtest result ID
   * @returns Trade distribution by day of week
   */
  public async getTradeDistributionByDayOfWeek(resultId: string): Promise<{
    day: string;
    trades: number;
    winRate: number;
    averageReturn: number;
  }[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/results/${resultId}/trade-distribution/day-of-week`);
      return response.data;
    } catch (error) {
      console.error(`Error getting trade distribution by day of week for backtest result ID ${resultId}:`, error);
      throw error;
    }
  }

  /**
   * Get trade distribution by month
   * @param resultId Backtest result ID
   * @returns Trade distribution by month
   */
  public async getTradeDistributionByMonth(resultId: string): Promise<{
    month: string;
    trades: number;
    winRate: number;
    averageReturn: number;
  }[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/results/${resultId}/trade-distribution/month`);
      return response.data;
    } catch (error) {
      console.error(`Error getting trade distribution by month for backtest result ID ${resultId}:`, error);
      throw error;
    }
  }

  /**
   * Get trade distribution by holding period
   * @param resultId Backtest result ID
   * @returns Trade distribution by holding period
   */
  public async getTradeDistributionByHoldingPeriod(resultId: string): Promise<{
    period: string;
    trades: number;
    winRate: number;
    averageReturn: number;
  }[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/results/${resultId}/trade-distribution/holding-period`);
      return response.data;
    } catch (error) {
      console.error(`Error getting trade distribution by holding period for backtest result ID ${resultId}:`, error);
      throw error;
    }
  }

  /**
   * Get trade distribution by return
   * @param resultId Backtest result ID
   * @returns Trade distribution by return
   */
  public async getTradeDistributionByReturn(resultId: string): Promise<{
    range: string;
    trades: number;
    percentage: number;
  }[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/results/${resultId}/trade-distribution/return`);
      return response.data;
    } catch (error) {
      console.error(`Error getting trade distribution by return for backtest result ID ${resultId}:`, error);
      throw error;
    }
  }

  /**
   * Get benchmark comparison for a backtest result
   * @param resultId Backtest result ID
   * @param benchmarkSymbol Benchmark symbol (e.g., "SPY")
   * @returns Benchmark comparison data
   */
  public async getBenchmarkComparison(resultId: string, benchmarkSymbol: string): Promise<{
    strategy: { timestamp: string; value: number }[];
    benchmark: { timestamp: string; value: number }[];
    metrics: {
      alpha: number;
      beta: number;
      correlation: number;
      trackingError: number;
      informationRatio: number;
      upCapture: number;
      downCapture: number;
    };
  }> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/results/${resultId}/benchmark`, {
        params: { symbol: benchmarkSymbol }
      });
      return response.data;
    } catch (error) {
      console.error(`Error getting benchmark comparison for backtest result ID ${resultId}:`, error);
      throw error;
    }
  }

  /**
   * Get rolling performance metrics for a backtest result
   * @param resultId Backtest result ID
   * @param window Rolling window size in days
   * @returns Rolling performance metrics
   */
  public async getRollingPerformance(resultId: string, window: number): Promise<{
    timestamps: string[];
    returns: number[];
    volatility: number[];
    sharpeRatio: number[];
    drawdown: number[];
  }> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/results/${resultId}/rolling-performance`, {
        params: { window }
      });
      return response.data;
    } catch (error) {
      console.error(`Error getting rolling performance for backtest result ID ${resultId}:`, error);
      throw error;
    }
  }

  /**
   * Get underwater chart data for a backtest result
   * @param resultId Backtest result ID
   * @returns Underwater chart data
   */
  public async getUnderwaterChart(resultId: string): Promise<{ timestamp: string; value: number }[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/results/${resultId}/underwater`);
      return response.data;
    } catch (error) {
      console.error(`Error getting underwater chart for backtest result ID ${resultId}:`, error);
      throw error;
    }
  }

  /**
   * Get trade analysis by ticker for a backtest result
   * @param resultId Backtest result ID
   * @returns Trade analysis by ticker
   */
  public async getTradeAnalysisByTicker(resultId: string): Promise<{
    ticker: string;
    trades: number;
    winRate: number;
    profitFactor: number;
    averageReturn: number;
    totalReturn: number;
  }[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/results/${resultId}/trade-analysis/ticker`);
      return response.data;
    } catch (error) {
      console.error(`Error getting trade analysis by ticker for backtest result ID ${resultId}:`, error);
      throw error;
    }
  }

  /**
   * Get trade analysis by signal for a backtest result
   * @param resultId Backtest result ID
   * @returns Trade analysis by signal
   */
  public async getTradeAnalysisBySignal(resultId: string): Promise<{
    signal: string;
    trades: number;
    winRate: number;
    profitFactor: number;
    averageReturn: number;
    totalReturn: number;
  }[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/results/${resultId}/trade-analysis/signal`);
      return response.data;
    } catch (error) {
      console.error(`Error getting trade analysis by signal for backtest result ID ${resultId}:`, error);
      throw error;
    }
  }

  /**
   * Get portfolio allocation over time for a backtest result
   * @param resultId Backtest result ID
   * @returns Portfolio allocation over time
   */
  public async getPortfolioAllocation(resultId: string): Promise<{
    timestamp: string;
    allocations: { ticker: string; percentage: number }[];
  }[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/results/${resultId}/portfolio-allocation`);
      return response.data;
    } catch (error) {
      console.error(`Error getting portfolio allocation for backtest result ID ${resultId}:`, error);
      throw error;
    }
  }

  /**
   * Get risk metrics for a backtest result
   * @param resultId Backtest result ID
   * @returns Risk metrics
   */
  public async getRiskMetrics(resultId: string): Promise<{
    volatility: number;
    downside: number;
    maxDrawdown: number;
    maxDrawdownDuration: number;
    valueAtRisk: number;
    conditionalValueAtRisk: number;
    calmarRatio: number;
    sortinoRatio: number;
    ulcerIndex: number;
    painIndex: number;
    omega: number;
  }> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/results/${resultId}/risk-metrics`);
      return response.data;
    } catch (error) {
      console.error(`Error getting risk metrics for backtest result ID ${resultId}:`, error);
      throw error;
    }
  }

  /**
   * Get return distribution for a backtest result
   * @param resultId Backtest result ID
   * @returns Return distribution data
   */
  public async getReturnDistribution(resultId: string): Promise<{
    bins: { min: number; max: number }[];
    frequencies: number[];
    statistics: {
      mean: number;
      median: number;
      standardDeviation: number;
      skewness: number;
      kurtosis: number;
    };
  }> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/results/${resultId}/return-distribution`);
      return response.data;
    } catch (error) {
      console.error(`Error getting return distribution for backtest result ID ${resultId}:`, error);
      throw error;
    }
  }

  /**
   * Generate a performance report for a backtest result
   * @param resultId Backtest result ID
   * @returns Report data
   */
  public async generatePerformanceReport(resultId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/results/${resultId}/report`);
      return response.data;
    } catch (error) {
      console.error(`Error generating performance report for backtest result ID ${resultId}:`, error);
      throw error;
    }
  }

  /**
   * Export performance metrics to CSV
   * @param resultId Backtest result ID
   * @returns CSV data as string
   */
  public async exportPerformanceMetricsToCsv(resultId: string): Promise<string> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/results/${resultId}/metrics/export/csv`, {
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
      console.error(`Error exporting performance metrics for backtest result ID ${resultId} to CSV:`, error);
      throw error;
    }
  }
}