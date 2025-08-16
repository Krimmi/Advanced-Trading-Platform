/**
 * Risk Management API Service
 * This service provides methods to interact with the risk management API endpoints.
 */
import axios from 'axios';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/risk-management`;

/**
 * Interface for portfolio weights
 */
export interface PortfolioWeights {
  [symbol: string]: number;
}

/**
 * Interface for risk metrics
 */
export interface RiskMetrics {
  expected_return: number;
  volatility: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  var_95: number;
  cvar_95: number;
  max_drawdown: number;
  annualized_return: number;
  annualized_volatility: number;
  [key: string]: number;
}

/**
 * Interface for portfolio constraints
 */
export interface PortfolioConstraints {
  bounds?: [number, number];
  weight_constraints?: {
    [symbol: string]: [number | null, number | null];
  };
  group_constraints?: {
    [group: string]: {
      assets: string[];
      min_weight?: number;
      max_weight?: number;
    };
  };
}

/**
 * Interface for efficient frontier portfolio
 */
export interface EfficientFrontierPortfolio {
  return: number;
  volatility: number;
  sharpe_ratio: number;
  [key: string]: number;
}

/**
 * Interface for stress test scenario
 */
export interface StressTestScenario {
  scenario: string;
  portfolio_impact: number;
  final_portfolio_value: number;
  [key: string]: any;
}

/**
 * Interface for Monte Carlo stress test result
 */
export interface MonteCarloStressTest {
  mean_final_value: number;
  median_final_value: number;
  min_final_value: number;
  max_final_value: number;
  var: number;
  cvar: number;
  probability_of_loss: number;
  [key: string]: any;
}

/**
 * Risk Management API Service
 */
const riskManagementService = {
  /**
   * Calculate risk metrics for a portfolio
   */
  async calculateRiskMetrics(
    symbols: string[],
    weights: PortfolioWeights,
    lookbackDays: number = 252,
    riskFreeRate: number = 0.0
  ): Promise<RiskMetrics> {
    try {
      const response = await axios.post(`${API_URL}/risk-metrics`, {
        symbols,
        weights,
        lookback_days: lookbackDays,
        risk_free_rate: riskFreeRate
      });
      
      return response.data.metrics;
    } catch (error) {
      console.error('Error calculating risk metrics:', error);
      throw error;
    }
  },

  /**
   * Optimize a portfolio using the specified method
   */
  async optimizePortfolio(
    symbols: string[],
    optimizationMethod: string,
    lookbackDays: number = 252,
    riskFreeRate: number = 0.0,
    targetReturn?: number,
    targetVolatility?: number,
    bounds?: [number, number],
    weightConstraints?: { [symbol: string]: [number | null, number | null] }
  ): Promise<{
    weights: PortfolioWeights;
    expected_return: number;
    volatility: number;
    sharpe_ratio: number;
    metrics: RiskMetrics;
  }> {
    try {
      const response = await axios.post(`${API_URL}/optimize-portfolio`, {
        symbols,
        optimization_method: optimizationMethod,
        lookback_days: lookbackDays,
        risk_free_rate: riskFreeRate,
        target_return: targetReturn,
        target_volatility: targetVolatility,
        bounds,
        weight_constraints: weightConstraints
      });
      
      return {
        weights: response.data.weights,
        expected_return: response.data.expected_return,
        volatility: response.data.volatility,
        sharpe_ratio: response.data.sharpe_ratio,
        metrics: response.data.metrics
      };
    } catch (error) {
      console.error('Error optimizing portfolio:', error);
      throw error;
    }
  },

  /**
   * Generate the efficient frontier
   */
  async generateEfficientFrontier(
    symbols: string[],
    numPortfolios: number = 100,
    lookbackDays: number = 252,
    riskFreeRate: number = 0.0,
    bounds?: [number, number]
  ): Promise<EfficientFrontierPortfolio[]> {
    try {
      const response = await axios.post(`${API_URL}/efficient-frontier`, {
        symbols,
        num_portfolios: numPortfolios,
        lookback_days: lookbackDays,
        risk_free_rate: riskFreeRate,
        bounds
      });
      
      return response.data.efficient_frontier;
    } catch (error) {
      console.error('Error generating efficient frontier:', error);
      throw error;
    }
  },

  /**
   * Run stress tests on a portfolio
   */
  async runStressTest(
    symbols: string[],
    weights: PortfolioWeights,
    lookbackDays: number = 252,
    testTypes: string[] = ['historical', 'monte_carlo', 'custom']
  ): Promise<{
    historical_scenarios?: any[];
    monte_carlo?: MonteCarloStressTest;
    custom_scenarios?: StressTestScenario[];
  }> {
    try {
      const response = await axios.post(`${API_URL}/stress-test`, {
        symbols,
        weights,
        lookback_days: lookbackDays,
        test_types: testTypes
      });
      
      return response.data.stress_test_results;
    } catch (error) {
      console.error('Error running stress tests:', error);
      throw error;
    }
  },

  /**
   * Construct a portfolio using the specified strategy and constraints
   */
  async constructPortfolio(
    symbols: string[],
    strategy: string,
    lookbackDays: number = 252,
    riskFreeRate: number = 0.0,
    constraints?: PortfolioConstraints,
    targetReturn?: number,
    targetVolatility?: number,
    targetRiskContribution?: { [symbol: string]: number },
    runStressTest: boolean = true
  ): Promise<{
    weights: PortfolioWeights;
    expected_return: number;
    volatility: number;
    sharpe_ratio: number;
    metrics: RiskMetrics;
    stress_test?: any;
  }> {
    try {
      const response = await axios.post(`${API_URL}/construct-portfolio`, {
        symbols,
        strategy,
        lookback_days: lookbackDays,
        risk_free_rate: riskFreeRate,
        constraints,
        target_return: targetReturn,
        target_volatility: targetVolatility,
        target_risk_contribution: targetRiskContribution,
        run_stress_test: runStressTest
      });
      
      return {
        weights: response.data.weights,
        expected_return: response.data.expected_return,
        volatility: response.data.volatility,
        sharpe_ratio: response.data.sharpe_ratio,
        metrics: response.data.metrics,
        stress_test: response.data.stress_test
      };
    } catch (error) {
      console.error('Error constructing portfolio:', error);
      throw error;
    }
  },

  /**
   * Rebalance an existing portfolio
   */
  async rebalancePortfolio(
    symbols: string[],
    currentWeights: PortfolioWeights,
    strategy: string,
    lookbackDays: number = 252,
    riskFreeRate: number = 0.0,
    constraints?: PortfolioConstraints,
    transactionCosts?: { [symbol: string]: number },
    maxTurnover?: number
  ): Promise<{
    current_weights: PortfolioWeights;
    target_weights: PortfolioWeights;
    trades: PortfolioWeights;
    turnover: number;
    trade_costs: PortfolioWeights;
    total_cost: number;
    expected_return: number;
    volatility: number;
    sharpe_ratio: number;
    metrics: RiskMetrics;
  }> {
    try {
      const response = await axios.post(`${API_URL}/rebalance-portfolio`, {
        symbols,
        current_weights: currentWeights,
        strategy,
        lookback_days: lookbackDays,
        risk_free_rate: riskFreeRate,
        constraints,
        transaction_costs: transactionCosts,
        max_turnover: maxTurnover
      });
      
      return {
        current_weights: response.data.current_weights,
        target_weights: response.data.target_weights,
        trades: response.data.trades,
        turnover: response.data.turnover,
        trade_costs: response.data.trade_costs,
        total_cost: response.data.total_cost,
        expected_return: response.data.expected_return,
        volatility: response.data.volatility,
        sharpe_ratio: response.data.sharpe_ratio,
        metrics: response.data.metrics
      };
    } catch (error) {
      console.error('Error rebalancing portfolio:', error);
      throw error;
    }
  },

  /**
   * Compare different portfolio construction strategies
   */
  async compareStrategies(
    symbols: string[],
    strategies: string[],
    lookbackDays: number = 252,
    riskFreeRate: number = 0.0,
    constraints?: PortfolioConstraints
  ): Promise<any[]> {
    try {
      const response = await axios.post(`${API_URL}/compare-strategies`, {
        symbols,
        strategies,
        lookback_days: lookbackDays,
        risk_free_rate: riskFreeRate,
        constraints
      });
      
      return response.data.comparison;
    } catch (error) {
      console.error('Error comparing strategies:', error);
      throw error;
    }
  }
};

export default riskManagementService;