import {
  OptimizationConfig,
  OptimizationResult,
  OptimizationParameter,
  WalkForwardConfig,
  WalkForwardResult,
  Strategy
} from '../../types/backtesting';
import axios from 'axios';

/**
 * Service for optimizing trading strategies
 */
export default class OptimizationService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  }

  /**
   * Create a new optimization configuration
   * @param config Optimization configuration
   * @returns Created optimization configuration with ID
   */
  public async createOptimizationConfig(
    config: Omit<OptimizationConfig, 'id' | 'createdAt'>
  ): Promise<OptimizationConfig> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/optimizations/configs`, config);
      return response.data;
    } catch (error) {
      console.error('Error creating optimization configuration:', error);
      throw error;
    }
  }

  /**
   * Get optimization configuration by ID
   * @param id Optimization configuration ID
   * @returns Optimization configuration
   */
  public async getOptimizationConfig(id: string): Promise<OptimizationConfig> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/optimizations/configs/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting optimization configuration with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all optimization configurations for the current user
   * @returns Array of optimization configurations
   */
  public async getOptimizationConfigs(): Promise<OptimizationConfig[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/optimizations/configs`);
      return response.data;
    } catch (error) {
      console.error('Error getting optimization configurations:', error);
      throw error;
    }
  }

  /**
   * Update an existing optimization configuration
   * @param id Optimization configuration ID
   * @param config Updated optimization configuration
   * @returns Updated optimization configuration
   */
  public async updateOptimizationConfig(
    id: string,
    config: Partial<OptimizationConfig>
  ): Promise<OptimizationConfig> {
    try {
      const response = await axios.put(`${this.apiUrl}/api/backtesting/optimizations/configs/${id}`, config);
      return response.data;
    } catch (error) {
      console.error(`Error updating optimization configuration with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete an optimization configuration
   * @param id Optimization configuration ID
   * @returns Success status
   */
  public async deleteOptimizationConfig(id: string): Promise<{ success: boolean }> {
    try {
      const response = await axios.delete(`${this.apiUrl}/api/backtesting/optimizations/configs/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting optimization configuration with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Execute an optimization with the given configuration
   * @param configId Optimization configuration ID
   * @returns Optimization result
   */
  public async executeOptimization(configId: string): Promise<OptimizationResult> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/optimizations/execute`, { configId });
      return response.data;
    } catch (error) {
      console.error(`Error executing optimization with configuration ID ${configId}:`, error);
      throw error;
    }
  }

  /**
   * Get optimization result by ID
   * @param id Optimization result ID
   * @returns Optimization result
   */
  public async getOptimizationResult(id: string): Promise<OptimizationResult> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/optimizations/results/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting optimization result with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all optimization results for the current user
   * @returns Array of optimization results
   */
  public async getOptimizationResults(): Promise<OptimizationResult[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/optimizations/results`);
      return response.data;
    } catch (error) {
      console.error('Error getting optimization results:', error);
      throw error;
    }
  }

  /**
   * Delete an optimization result
   * @param id Optimization result ID
   * @returns Success status
   */
  public async deleteOptimizationResult(id: string): Promise<{ success: boolean }> {
    try {
      const response = await axios.delete(`${this.apiUrl}/api/backtesting/optimizations/results/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting optimization result with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Apply optimized parameters to a strategy
   * @param strategyId Strategy ID
   * @param optimizationResultId Optimization result ID
   * @returns Updated strategy
   */
  public async applyOptimizedParameters(strategyId: string, optimizationResultId: string): Promise<Strategy> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/optimizations/apply`, {
        strategyId,
        optimizationResultId
      });
      return response.data;
    } catch (error) {
      console.error(
        `Error applying optimized parameters from result ID ${optimizationResultId} to strategy ID ${strategyId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Create a new walk-forward configuration
   * @param config Walk-forward configuration
   * @returns Created walk-forward configuration with ID
   */
  public async createWalkForwardConfig(
    config: Omit<WalkForwardConfig, 'id' | 'createdAt'>
  ): Promise<WalkForwardConfig> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/walk-forward/configs`, config);
      return response.data;
    } catch (error) {
      console.error('Error creating walk-forward configuration:', error);
      throw error;
    }
  }

  /**
   * Get walk-forward configuration by ID
   * @param id Walk-forward configuration ID
   * @returns Walk-forward configuration
   */
  public async getWalkForwardConfig(id: string): Promise<WalkForwardConfig> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/walk-forward/configs/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting walk-forward configuration with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all walk-forward configurations for the current user
   * @returns Array of walk-forward configurations
   */
  public async getWalkForwardConfigs(): Promise<WalkForwardConfig[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/walk-forward/configs`);
      return response.data;
    } catch (error) {
      console.error('Error getting walk-forward configurations:', error);
      throw error;
    }
  }

  /**
   * Update an existing walk-forward configuration
   * @param id Walk-forward configuration ID
   * @param config Updated walk-forward configuration
   * @returns Updated walk-forward configuration
   */
  public async updateWalkForwardConfig(
    id: string,
    config: Partial<WalkForwardConfig>
  ): Promise<WalkForwardConfig> {
    try {
      const response = await axios.put(`${this.apiUrl}/api/backtesting/walk-forward/configs/${id}`, config);
      return response.data;
    } catch (error) {
      console.error(`Error updating walk-forward configuration with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a walk-forward configuration
   * @param id Walk-forward configuration ID
   * @returns Success status
   */
  public async deleteWalkForwardConfig(id: string): Promise<{ success: boolean }> {
    try {
      const response = await axios.delete(`${this.apiUrl}/api/backtesting/walk-forward/configs/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting walk-forward configuration with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Execute a walk-forward analysis with the given configuration
   * @param configId Walk-forward configuration ID
   * @returns Walk-forward result
   */
  public async executeWalkForward(configId: string): Promise<WalkForwardResult> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/walk-forward/execute`, { configId });
      return response.data;
    } catch (error) {
      console.error(`Error executing walk-forward analysis with configuration ID ${configId}:`, error);
      throw error;
    }
  }

  /**
   * Get walk-forward result by ID
   * @param id Walk-forward result ID
   * @returns Walk-forward result
   */
  public async getWalkForwardResult(id: string): Promise<WalkForwardResult> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/walk-forward/results/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting walk-forward result with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all walk-forward results for the current user
   * @returns Array of walk-forward results
   */
  public async getWalkForwardResults(): Promise<WalkForwardResult[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/walk-forward/results`);
      return response.data;
    } catch (error) {
      console.error('Error getting walk-forward results:', error);
      throw error;
    }
  }

  /**
   * Delete a walk-forward result
   * @param id Walk-forward result ID
   * @returns Success status
   */
  public async deleteWalkForwardResult(id: string): Promise<{ success: boolean }> {
    try {
      const response = await axios.delete(`${this.apiUrl}/api/backtesting/walk-forward/results/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting walk-forward result with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get optimization parameter suggestions for a strategy
   * @param strategyId Strategy ID
   * @returns Array of suggested optimization parameters
   */
  public async getOptimizationParameterSuggestions(strategyId: string): Promise<OptimizationParameter[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/optimizations/suggestions/${strategyId}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting optimization parameter suggestions for strategy ID ${strategyId}:`, error);
      throw error;
    }
  }

  /**
   * Get optimization surface for two parameters
   * @param resultId Optimization result ID
   * @param param1 First parameter name
   * @param param2 Second parameter name
   * @returns Optimization surface data
   */
  public async getOptimizationSurface(
    resultId: string,
    param1: string,
    param2: string
  ): Promise<{
    param1Values: number[];
    param2Values: number[];
    objectiveValues: number[][];
  }> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/optimizations/results/${resultId}/surface`, {
        params: { param1, param2 }
      });
      return response.data;
    } catch (error) {
      console.error(`Error getting optimization surface for result ID ${resultId}:`, error);
      throw error;
    }
  }

  /**
   * Get parameter sensitivity analysis
   * @param resultId Optimization result ID
   * @returns Parameter sensitivity data
   */
  public async getParameterSensitivity(resultId: string): Promise<{
    parameters: string[];
    sensitivity: number[];
  }> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/optimizations/results/${resultId}/sensitivity`);
      return response.data;
    } catch (error) {
      console.error(`Error getting parameter sensitivity for result ID ${resultId}:`, error);
      throw error;
    }
  }

  /**
   * Get optimization convergence data
   * @param resultId Optimization result ID
   * @returns Convergence data
   */
  public async getOptimizationConvergence(resultId: string): Promise<{
    iterations: number[];
    objectiveValues: number[];
  }> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/optimizations/results/${resultId}/convergence`);
      return response.data;
    } catch (error) {
      console.error(`Error getting optimization convergence for result ID ${resultId}:`, error);
      throw error;
    }
  }

  /**
   * Get parameter distribution in top results
   * @param resultId Optimization result ID
   * @param topPercent Percentage of top results to consider
   * @returns Parameter distribution data
   */
  public async getParameterDistribution(
    resultId: string,
    topPercent: number = 10
  ): Promise<{
    parameters: {
      name: string;
      type: string;
      distribution: { value: any; frequency: number }[];
      statistics: { mean?: number; median?: number; mode?: any; std?: number };
    }[];
  }> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/optimizations/results/${resultId}/distribution`, {
        params: { topPercent }
      });
      return response.data;
    } catch (error) {
      console.error(`Error getting parameter distribution for result ID ${resultId}:`, error);
      throw error;
    }
  }
}