import {
  Strategy,
  StrategyRule,
  StrategyCondition,
  StrategyAction,
  BacktestOrder,
  BacktestPosition,
  OrderSide,
  OrderType,
  OrderStatus,
  PositionStatus
} from '../../types/backtesting';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for executing trading strategies during backtesting
 */
export default class StrategyExecutionService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  }

  /**
   * Create a new strategy
   * @param strategy Strategy to create
   * @returns Created strategy with ID
   */
  public async createStrategy(strategy: Omit<Strategy, 'id' | 'createdAt' | 'updatedAt'>): Promise<Strategy> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/strategies`, strategy);
      return response.data;
    } catch (error) {
      console.error('Error creating strategy:', error);
      throw error;
    }
  }

  /**
   * Get strategy by ID
   * @param id Strategy ID
   * @returns Strategy
   */
  public async getStrategy(id: string): Promise<Strategy> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/strategies/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting strategy with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all strategies for the current user
   * @returns Array of strategies
   */
  public async getStrategies(): Promise<Strategy[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/strategies`);
      return response.data;
    } catch (error) {
      console.error('Error getting strategies:', error);
      throw error;
    }
  }

  /**
   * Update an existing strategy
   * @param id Strategy ID
   * @param strategy Updated strategy
   * @returns Updated strategy
   */
  public async updateStrategy(id: string, strategy: Partial<Strategy>): Promise<Strategy> {
    try {
      const response = await axios.put(`${this.apiUrl}/api/backtesting/strategies/${id}`, strategy);
      return response.data;
    } catch (error) {
      console.error(`Error updating strategy with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a strategy
   * @param id Strategy ID
   * @returns Success status
   */
  public async deleteStrategy(id: string): Promise<{ success: boolean }> {
    try {
      const response = await axios.delete(`${this.apiUrl}/api/backtesting/strategies/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting strategy with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Clone an existing strategy
   * @param id Strategy ID to clone
   * @param newName Name for the cloned strategy
   * @returns Cloned strategy
   */
  public async cloneStrategy(id: string, newName: string): Promise<Strategy> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/strategies/${id}/clone`, { newName });
      return response.data;
    } catch (error) {
      console.error(`Error cloning strategy with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a strategy rule
   * @param strategyId Strategy ID
   * @param rule Rule to create
   * @returns Created rule with ID
   */
  public async createStrategyRule(strategyId: string, rule: Omit<StrategyRule, 'id'>): Promise<StrategyRule> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/strategies/${strategyId}/rules`, rule);
      return response.data;
    } catch (error) {
      console.error(`Error creating rule for strategy with ID ${strategyId}:`, error);
      throw error;
    }
  }

  /**
   * Update a strategy rule
   * @param strategyId Strategy ID
   * @param ruleId Rule ID
   * @param rule Updated rule
   * @returns Updated rule
   */
  public async updateStrategyRule(
    strategyId: string,
    ruleId: string,
    rule: Partial<StrategyRule>
  ): Promise<StrategyRule> {
    try {
      const response = await axios.put(
        `${this.apiUrl}/api/backtesting/strategies/${strategyId}/rules/${ruleId}`,
        rule
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating rule with ID ${ruleId} for strategy with ID ${strategyId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a strategy rule
   * @param strategyId Strategy ID
   * @param ruleId Rule ID
   * @returns Success status
   */
  public async deleteStrategyRule(strategyId: string, ruleId: string): Promise<{ success: boolean }> {
    try {
      const response = await axios.delete(
        `${this.apiUrl}/api/backtesting/strategies/${strategyId}/rules/${ruleId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error deleting rule with ID ${ruleId} for strategy with ID ${strategyId}:`, error);
      throw error;
    }
  }

  /**
   * Get available technical indicators for strategy conditions
   * @returns Array of available indicators with parameters
   */
  public async getAvailableIndicators(): Promise<
    {
      id: string;
      name: string;
      description: string;
      category: string;
      parameters: { name: string; type: string; default: any; min?: number; max?: number }[];
    }[]
  > {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/indicators`);
      return response.data;
    } catch (error) {
      console.error('Error getting available indicators:', error);
      throw error;
    }
  }

  /**
   * Get available fundamental metrics for strategy conditions
   * @returns Array of available fundamental metrics
   */
  public async getAvailableFundamentalMetrics(): Promise<
    {
      id: string;
      name: string;
      description: string;
      category: string;
    }[]
  > {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/fundamental-metrics`);
      return response.data;
    } catch (error) {
      console.error('Error getting available fundamental metrics:', error);
      throw error;
    }
  }

  /**
   * Get available sentiment metrics for strategy conditions
   * @returns Array of available sentiment metrics
   */
  public async getAvailableSentimentMetrics(): Promise<
    {
      id: string;
      name: string;
      description: string;
      source: string;
    }[]
  > {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/sentiment-metrics`);
      return response.data;
    } catch (error) {
      console.error('Error getting available sentiment metrics:', error);
      throw error;
    }
  }

  /**
   * Validate a strategy to check for errors or issues
   * @param strategy Strategy to validate
   * @returns Validation results
   */
  public async validateStrategy(strategy: Strategy): Promise<{
    valid: boolean;
    errors: { type: string; message: string; ruleId?: string; conditionId?: string; actionId?: string }[];
    warnings: { type: string; message: string; ruleId?: string; conditionId?: string; actionId?: string }[];
  }> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/strategies/validate`, strategy);
      return response.data;
    } catch (error) {
      console.error('Error validating strategy:', error);
      throw error;
    }
  }

  /**
   * Get strategy templates for common trading strategies
   * @returns Array of strategy templates
   */
  public async getStrategyTemplates(): Promise<
    {
      id: string;
      name: string;
      description: string;
      category: string;
      strategy: Omit<Strategy, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;
    }[]
  > {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/strategy-templates`);
      return response.data;
    } catch (error) {
      console.error('Error getting strategy templates:', error);
      throw error;
    }
  }

  /**
   * Create a strategy from a template
   * @param templateId Template ID
   * @param name Name for the new strategy
   * @returns Created strategy
   */
  public async createStrategyFromTemplate(templateId: string, name: string): Promise<Strategy> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/strategy-templates/${templateId}/create`, {
        name
      });
      return response.data;
    } catch (error) {
      console.error(`Error creating strategy from template with ID ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Export a strategy to JSON
   * @param id Strategy ID
   * @returns Strategy JSON
   */
  public async exportStrategyToJson(id: string): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/strategies/${id}/export`);
      return response.data;
    } catch (error) {
      console.error(`Error exporting strategy with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Import a strategy from JSON
   * @param strategyJson Strategy JSON
   * @returns Imported strategy
   */
  public async importStrategyFromJson(strategyJson: any): Promise<Strategy> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/backtesting/strategies/import`, strategyJson);
      return response.data;
    } catch (error) {
      console.error('Error importing strategy:', error);
      throw error;
    }
  }

  /**
   * Get public strategies shared by other users
   * @returns Array of public strategies
   */
  public async getPublicStrategies(): Promise<Strategy[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/strategies/public`);
      return response.data;
    } catch (error) {
      console.error('Error getting public strategies:', error);
      throw error;
    }
  }

  /**
   * Share a strategy publicly
   * @param id Strategy ID
   * @param isPublic Whether the strategy should be public
   * @returns Updated strategy
   */
  public async shareStrategy(id: string, isPublic: boolean): Promise<Strategy> {
    try {
      const response = await axios.put(`${this.apiUrl}/api/backtesting/strategies/${id}/share`, { isPublic });
      return response.data;
    } catch (error) {
      console.error(`Error sharing strategy with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get strategy performance statistics across all backtests
   * @param id Strategy ID
   * @returns Performance statistics
   */
  public async getStrategyPerformance(id: string): Promise<{
    backtestCount: number;
    averageReturn: number;
    averageSharpeRatio: number;
    averageDrawdown: number;
    bestReturn: number;
    worstReturn: number;
    winRate: number;
  }> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/backtesting/strategies/${id}/performance`);
      return response.data;
    } catch (error) {
      console.error(`Error getting performance for strategy with ID ${id}:`, error);
      throw error;
    }
  }
}