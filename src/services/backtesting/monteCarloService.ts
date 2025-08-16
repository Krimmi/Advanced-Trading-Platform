import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { 
  MonteCarloConfig, 
  MonteCarloResult, 
  MonteCarloParameters,
  ValueAtRiskMetrics,
  DrawdownAnalysis
} from '../../types/backtesting/monteCarloTypes';

/**
 * Service for Monte Carlo simulations in the backtesting engine
 */
export default class MonteCarloService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  }

  /**
   * Run a Monte Carlo simulation with advanced parameters
   * @param backtestId Backtest result ID to use as base
   * @param config Monte Carlo configuration
   * @returns Monte Carlo simulation results
   */
  public async runAdvancedMonteCarloSimulation(
    backtestId: string,
    config: MonteCarloConfig
  ): Promise<MonteCarloResult> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/monte-carlo/advanced`, {
        backtestId,
        config
      });
      return response.data;
    } catch (error) {
      console.error(`Error running advanced Monte Carlo simulation for backtest ID ${backtestId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate Value at Risk (VaR) metrics for a backtest result
   * @param backtestId Backtest result ID
   * @param confidenceLevels Array of confidence levels (e.g., [0.95, 0.99])
   * @param timeHorizons Array of time horizons in days (e.g., [1, 5, 10, 20])
   * @returns Value at Risk metrics
   */
  public async calculateValueAtRisk(
    backtestId: string,
    confidenceLevels: number[] = [0.95, 0.99],
    timeHorizons: number[] = [1, 5, 10, 20]
  ): Promise<ValueAtRiskMetrics> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/risk/var`, {
        backtestId,
        confidenceLevels,
        timeHorizons
      });
      return response.data;
    } catch (error) {
      console.error(`Error calculating VaR for backtest ID ${backtestId}:`, error);
      throw error;
    }
  }

  /**
   * Perform drawdown analysis on a backtest result
   * @param backtestId Backtest result ID
   * @returns Drawdown analysis results
   */
  public async analyzeDrawdowns(backtestId: string): Promise<DrawdownAnalysis> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/risk/drawdowns/${backtestId}`);
      return response.data;
    } catch (error) {
      console.error(`Error analyzing drawdowns for backtest ID ${backtestId}:`, error);
      throw error;
    }
  }

  /**
   * Generate extreme scenarios based on a backtest result
   * @param backtestId Backtest result ID
   * @param scenarioTypes Array of scenario types to generate
   * @returns Extreme scenarios results
   */
  public async generateExtremeScenarios(
    backtestId: string,
    scenarioTypes: string[] = ['best', 'worst', 'highVol', 'lowVol', 'fastRecovery', 'slowRecovery']
  ): Promise<Record<string, any>> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/monte-carlo/extreme-scenarios`, {
        backtestId,
        scenarioTypes
      });
      return response.data;
    } catch (error) {
      console.error(`Error generating extreme scenarios for backtest ID ${backtestId}:`, error);
      throw error;
    }
  }

  /**
   * Save a Monte Carlo simulation configuration
   * @param config Monte Carlo configuration
   * @param name Configuration name
   * @param description Configuration description
   * @returns Saved configuration with ID
   */
  public async saveMonteCarloConfig(
    config: MonteCarloConfig,
    name: string,
    description?: string
  ): Promise<{ id: string; name: string; config: MonteCarloConfig; createdAt: string }> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/monte-carlo/configs`, {
        name,
        description,
        config
      });
      return response.data;
    } catch (error) {
      console.error('Error saving Monte Carlo configuration:', error);
      throw error;
    }
  }

  /**
   * Get saved Monte Carlo configurations
   * @returns Array of saved Monte Carlo configurations
   */
  public async getMonteCarloConfigs(): Promise<
    { id: string; name: string; description?: string; config: MonteCarloConfig; createdAt: string }[]
  > {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/monte-carlo/configs`);
      return response.data;
    } catch (error) {
      console.error('Error getting Monte Carlo configurations:', error);
      throw error;
    }
  }

  /**
   * Get a saved Monte Carlo simulation result
   * @param id Monte Carlo simulation result ID
   * @returns Monte Carlo simulation result
   */
  public async getMonteCarloResult(id: string): Promise<MonteCarloResult> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/monte-carlo/results/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting Monte Carlo result with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all Monte Carlo simulation results
   * @returns Array of Monte Carlo simulation results
   */
  public async getMonteCarloResults(): Promise<{ id: string; name: string; result: MonteCarloResult }[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/monte-carlo/results`);
      return response.data;
    } catch (error) {
      console.error('Error getting Monte Carlo results:', error);
      throw error;
    }
  }

  /**
   * Compare multiple Monte Carlo simulations
   * @param resultIds Array of Monte Carlo simulation result IDs to compare
   * @returns Comparison results
   */
  public async compareMonteCarloResults(resultIds: string[]): Promise<Record<string, any>> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/monte-carlo/compare`, {
        resultIds
      });
      return response.data;
    } catch (error) {
      console.error('Error comparing Monte Carlo results:', error);
      throw error;
    }
  }
}