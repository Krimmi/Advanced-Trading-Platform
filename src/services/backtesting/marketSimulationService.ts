import {
  MarketEnvironment,
  SimulationConfig,
  SimulationResult,
  BacktestConfig,
  BacktestResult
} from '../../types/backtesting';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for simulating market conditions during backtesting
 */
export default class MarketSimulationService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  }

  /**
   * Create a new market environment configuration
   * @param environment Market environment configuration
   * @returns Created market environment with ID
   */
  public async createMarketEnvironment(
    environment: Omit<MarketEnvironment, 'id'>
  ): Promise<MarketEnvironment> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/environments`, environment);
      return response.data;
    } catch (error) {
      console.error('Error creating market environment:', error);
      throw error;
    }
  }

  /**
   * Get market environment by ID
   * @param id Market environment ID
   * @returns Market environment
   */
  public async getMarketEnvironment(id: string): Promise<MarketEnvironment> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/environments/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting market environment with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all market environments for the current user
   * @returns Array of market environments
   */
  public async getMarketEnvironments(): Promise<MarketEnvironment[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/environments`);
      return response.data;
    } catch (error) {
      console.error('Error getting market environments:', error);
      throw error;
    }
  }

  /**
   * Update an existing market environment
   * @param id Market environment ID
   * @param environment Updated market environment
   * @returns Updated market environment
   */
  public async updateMarketEnvironment(
    id: string,
    environment: Partial<MarketEnvironment>
  ): Promise<MarketEnvironment> {
    try {
      const response = await axios.put(`${this.apiUrl}/api/backtesting/environments/${id}`, environment);
      return response.data;
    } catch (error) {
      console.error(`Error updating market environment with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a market environment
   * @param id Market environment ID
   * @returns Success status
   */
  public async deleteMarketEnvironment(id: string): Promise<{ success: boolean }> {
    try {
      const response = await axios.delete(`${this.apiUrl}/api/backtesting/environments/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting market environment with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new simulation configuration
   * @param config Simulation configuration
   * @returns Created simulation configuration with ID
   */
  public async createSimulationConfig(
    config: Omit<SimulationConfig, 'id' | 'createdAt'>
  ): Promise<SimulationConfig> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/simulations/configs`, config);
      return response.data;
    } catch (error) {
      console.error('Error creating simulation configuration:', error);
      throw error;
    }
  }

  /**
   * Get simulation configuration by ID
   * @param id Simulation configuration ID
   * @returns Simulation configuration
   */
  public async getSimulationConfig(id: string): Promise<SimulationConfig> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/simulations/configs/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting simulation configuration with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all simulation configurations for the current user
   * @returns Array of simulation configurations
   */
  public async getSimulationConfigs(): Promise<SimulationConfig[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/simulations/configs`);
      return response.data;
    } catch (error) {
      console.error('Error getting simulation configurations:', error);
      throw error;
    }
  }

  /**
   * Update an existing simulation configuration
   * @param id Simulation configuration ID
   * @param config Updated simulation configuration
   * @returns Updated simulation configuration
   */
  public async updateSimulationConfig(
    id: string,
    config: Partial<SimulationConfig>
  ): Promise<SimulationConfig> {
    try {
      const response = await axios.put(`${this.apiUrl}/api/backtesting/simulations/configs/${id}`, config);
      return response.data;
    } catch (error) {
      console.error(`Error updating simulation configuration with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a simulation configuration
   * @param id Simulation configuration ID
   * @returns Success status
   */
  public async deleteSimulationConfig(id: string): Promise<{ success: boolean }> {
    try {
      const response = await axios.delete(`${this.apiUrl}/api/backtesting/simulations/configs/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting simulation configuration with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Execute a simulation with the given configuration
   * @param configId Simulation configuration ID
   * @returns Simulation result
   */
  public async executeSimulation(configId: string): Promise<SimulationResult> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/simulations/execute`, { configId });
      return response.data;
    } catch (error) {
      console.error(`Error executing simulation with configuration ID ${configId}:`, error);
      throw error;
    }
  }

  /**
   * Get simulation result by ID
   * @param id Simulation result ID
   * @returns Simulation result
   */
  public async getSimulationResult(id: string): Promise<SimulationResult> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/simulations/results/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting simulation result with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all simulation results for the current user
   * @returns Array of simulation results
   */
  public async getSimulationResults(): Promise<SimulationResult[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/simulations/results`);
      return response.data;
    } catch (error) {
      console.error('Error getting simulation results:', error);
      throw error;
    }
  }

  /**
   * Delete a simulation result
   * @param id Simulation result ID
   * @returns Success status
   */
  public async deleteSimulationResult(id: string): Promise<{ success: boolean }> {
    try {
      const response = await axios.delete(`${this.apiUrl}/api/backtesting/simulations/results/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting simulation result with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get available market environment templates
   * @returns Array of market environment templates
   */
  public async getMarketEnvironmentTemplates(): Promise<
    {
      id: string;
      name: string;
      description: string;
      category: string;
      environment: Omit<MarketEnvironment, 'id'>;
    }[]
  > {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/environment-templates`);
      return response.data;
    } catch (error) {
      console.error('Error getting market environment templates:', error);
      throw error;
    }
  }

  /**
   * Create a market environment from a template
   * @param templateId Template ID
   * @param name Name for the new environment
   * @returns Created market environment
   */
  public async createEnvironmentFromTemplate(templateId: string, name: string): Promise<MarketEnvironment> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/environment-templates/${templateId}/create`, {
        name
      });
      return response.data;
    } catch (error) {
      console.error(`Error creating environment from template with ID ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Run a Monte Carlo simulation
   * @param backtestId Backtest result ID to use as base
   * @param iterations Number of iterations
   * @param confidenceLevels Array of confidence levels (e.g., [0.95, 0.99])
   * @returns Monte Carlo simulation results
   */
  public async runMonteCarloSimulation(
    backtestId: string,
    iterations: number,
    confidenceLevels: number[]
  ): Promise<{
    iterations: { id: string; equity: { timestamp: string; value: number }[] }[];
    probabilityOfProfit: number;
    expectedReturn: number;
    expectedDrawdown: number;
    confidenceIntervals: { level: number; lowerBound: number; upperBound: number }[];
  }> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/monte-carlo`, {
        backtestId,
        iterations,
        confidenceLevels
      });
      return response.data;
    } catch (error) {
      console.error(`Error running Monte Carlo simulation for backtest ID ${backtestId}:`, error);
      throw error;
    }
  }

  /**
   * Run a stress test on a strategy
   * @param strategyId Strategy ID
   * @param scenarios Array of scenario IDs to test
   * @returns Stress test results
   */
  public async runStressTest(
    strategyId: string,
    scenarios: string[]
  ): Promise<{
    scenarioResults: {
      scenarioId: string;
      scenarioName: string;
      result: BacktestResult;
    }[];
    summary: {
      worstCase: { scenarioId: string; return: number; drawdown: number };
      bestCase: { scenarioId: string; return: number; drawdown: number };
      averageReturn: number;
      averageDrawdown: number;
      robustnessScore: number;
    };
  }> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/stress-test`, {
        strategyId,
        scenarios
      });
      return response.data;
    } catch (error) {
      console.error(`Error running stress test for strategy ID ${strategyId}:`, error);
      throw error;
    }
  }

  /**
   * Get available stress test scenarios
   * @returns Array of stress test scenarios
   */
  public async getStressTestScenarios(): Promise<
    {
      id: string;
      name: string;
      description: string;
      category: string;
      parameters: Record<string, any>;
    }[]
  > {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/stress-test/scenarios`);
      return response.data;
    } catch (error) {
      console.error('Error getting stress test scenarios:', error);
      throw error;
    }
  }

  /**
   * Create a custom stress test scenario
   * @param scenario Scenario configuration
   * @returns Created scenario with ID
   */
  public async createStressTestScenario(scenario: {
    name: string;
    description?: string;
    category: string;
    parameters: Record<string, any>;
  }): Promise<{
    id: string;
    name: string;
    description: string;
    category: string;
    parameters: Record<string, any>;
  }> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/stress-test/scenarios`, scenario);
      return response.data;
    } catch (error) {
      console.error('Error creating stress test scenario:', error);
      throw error;
    }
  }

  /**
   * Convert a backtest configuration to a simulation configuration
   * @param backtestConfig Backtest configuration
   * @param environmentId Market environment ID
   * @param iterations Number of iterations
   * @param monteCarlo Whether to use Monte Carlo simulation
   * @returns Simulation configuration
   */
  public async convertToSimulationConfig(
    backtestConfig: BacktestConfig,
    environmentId: string,
    iterations: number,
    monteCarlo: boolean
  ): Promise<SimulationConfig> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/convert-to-simulation`, {
        backtestConfig,
        environmentId,
        iterations,
        monteCarlo
      });
      return response.data;
    } catch (error) {
      console.error('Error converting to simulation configuration:', error);
      throw error;
    }
  }
}