import { apiRequest } from './api';

// Types
export interface RiskMetrics {
  symbol: string;
  date: string;
  volatility: number;
  beta: number;
  alpha: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  treynor_ratio: number;
  information_ratio: number;
  max_drawdown: number;
  var_95: number;
  var_99: number;
  expected_shortfall: number;
  downside_deviation: number;
  tracking_error: number;
}

export interface PortfolioRiskMetrics {
  portfolio_id: string;
  date: string;
  volatility: number;
  beta: number;
  alpha: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  treynor_ratio: number;
  information_ratio: number;
  max_drawdown: number;
  var_95: number;
  var_99: number;
  expected_shortfall: number;
  downside_deviation: number;
  tracking_error: number;
  diversification_ratio: number;
  concentration_ratio: number;
}

export interface StressTestScenario {
  id: string;
  name: string;
  description: string;
  market_change: number;
  interest_rate_change: number;
  volatility_change: number;
  credit_spread_change: number;
  fx_change: Record<string, number>;
  commodity_change: Record<string, number>;
  custom_factors: Record<string, number>;
}

export interface StressTestResult {
  portfolio_id: string;
  scenario_id: string;
  portfolio_value_before: number;
  portfolio_value_after: number;
  portfolio_return: number;
  asset_returns: Record<string, number>;
  risk_metrics_before: Partial<PortfolioRiskMetrics>;
  risk_metrics_after: Partial<PortfolioRiskMetrics>;
}

export interface RiskDecomposition {
  portfolio_id: string;
  date: string;
  total_risk: number;
  risk_contributions: Record<string, {
    asset_id: string;
    asset_name: string;
    weight: number;
    standalone_risk: number;
    contribution_to_risk: number;
    percentage_of_risk: number;
    marginal_risk: number;
  }>;
  factor_contributions: Record<string, {
    factor_name: string;
    contribution_to_risk: number;
    percentage_of_risk: number;
  }>;
}

export interface CorrelationMatrix {
  assets: string[];
  matrix: number[][];
  date: string;
}

// Risk Management Service
const riskManagementService = {
  // Get risk metrics for a single asset
  getAssetRiskMetrics: (
    symbol: string,
    params?: {
      period?: string;
      benchmark?: string;
      risk_free_rate?: number;
    }
  ) => {
    return apiRequest<RiskMetrics>({
      method: 'GET',
      url: `/api/risk-management/asset-risk-metrics/${symbol}`,
      params,
    });
  },

  // Get risk metrics for a portfolio
  getPortfolioRiskMetrics: (
    portfolio_id: string,
    params?: {
      date?: string;
      benchmark?: string;
      risk_free_rate?: number;
    }
  ) => {
    return apiRequest<PortfolioRiskMetrics>({
      method: 'GET',
      url: `/api/risk-management/portfolio-risk-metrics/${portfolio_id}`,
      params,
    });
  },

  // Get available stress test scenarios
  getStressTestScenarios: () => {
    return apiRequest<StressTestScenario[]>({
      method: 'GET',
      url: '/api/risk-management/stress-test-scenarios',
    });
  },

  // Create a custom stress test scenario
  createStressTestScenario: (scenario: Omit<StressTestScenario, 'id'>) => {
    return apiRequest<StressTestScenario>({
      method: 'POST',
      url: '/api/risk-management/stress-test-scenarios',
      data: scenario,
    });
  },

  // Run a stress test on a portfolio
  runStressTest: (
    portfolio_id: string,
    scenario_id: string,
    params?: {
      date?: string;
    }
  ) => {
    return apiRequest<StressTestResult>({
      method: 'POST',
      url: `/api/risk-management/run-stress-test/${portfolio_id}/${scenario_id}`,
      params,
    });
  },

  // Get risk decomposition for a portfolio
  getRiskDecomposition: (
    portfolio_id: string,
    params?: {
      date?: string;
      method?: 'variance' | 'expected_shortfall' | 'var';
      factor_model?: string;
    }
  ) => {
    return apiRequest<RiskDecomposition>({
      method: 'GET',
      url: `/api/risk-management/risk-decomposition/${portfolio_id}`,
      params,
    });
  },

  // Get correlation matrix for a set of assets
  getCorrelationMatrix: (
    assets: string[],
    params?: {
      start_date?: string;
      end_date?: string;
      frequency?: 'daily' | 'weekly' | 'monthly';
    }
  ) => {
    return apiRequest<CorrelationMatrix>({
      method: 'POST',
      url: '/api/risk-management/correlation-matrix',
      data: { assets },
      params,
    });
  },

  // Calculate Value at Risk (VaR) for a portfolio
  calculateVaR: (
    portfolio_id: string,
    params?: {
      confidence_level?: number;
      time_horizon?: number;
      method?: 'historical' | 'parametric' | 'monte_carlo';
      num_simulations?: number;
    }
  ) => {
    return apiRequest<{
      var_value: number;
      expected_shortfall: number;
      confidence_level: number;
      time_horizon: number;
      method: string;
    }>({
      method: 'GET',
      url: `/api/risk-management/calculate-var/${portfolio_id}`,
      params,
    });
  },

  // Run a scenario analysis on a portfolio
  runScenarioAnalysis: (
    portfolio_id: string,
    scenarios: Array<{
      name: string;
      factor_changes: Record<string, number>;
    }>
  ) => {
    return apiRequest<Array<{
      scenario_name: string;
      portfolio_return: number;
      asset_returns: Record<string, number>;
      risk_metrics: Partial<PortfolioRiskMetrics>;
    }>>({
      method: 'POST',
      url: `/api/risk-management/scenario-analysis/${portfolio_id}`,
      data: { scenarios },
    });
  },

  // Get historical risk metrics for a portfolio
  getHistoricalRiskMetrics: (
    portfolio_id: string,
    params?: {
      start_date?: string;
      end_date?: string;
      frequency?: 'daily' | 'weekly' | 'monthly';
      metrics?: string[];
    }
  ) => {
    return apiRequest<{
      dates: string[];
      metrics: Record<string, number[]>;
    }>({
      method: 'GET',
      url: `/api/risk-management/historical-risk-metrics/${portfolio_id}`,
      params,
    });
  },
};

export default riskManagementService;