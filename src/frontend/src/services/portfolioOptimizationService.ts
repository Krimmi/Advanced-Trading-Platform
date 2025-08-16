import { apiRequest } from './api';

// Types
export interface OptimizationConstraint {
  type: 'min_weight' | 'max_weight' | 'sector_weight' | 'asset_class_weight' | 'factor_exposure' | 'custom';
  parameters: Record<string, any>;
}

export interface OptimizationObjective {
  type: 'max_return' | 'min_risk' | 'max_sharpe' | 'min_tracking_error' | 'max_diversification' | 'custom';
  parameters: Record<string, any>;
}

export interface OptimizationResult {
  portfolio_id?: string;
  weights: Record<string, number>;
  expected_return: number;
  expected_risk: number;
  sharpe_ratio: number;
  efficient_frontier?: Array<{
    return: number;
    risk: number;
    sharpe: number;
    weights: Record<string, number>;
  }>;
  risk_contributions: Record<string, number>;
  factor_exposures: Record<string, number>;
  optimization_metrics: {
    objective_value: number;
    iterations: number;
    convergence: boolean;
    computation_time: number;
  };
}

export interface AssetData {
  symbol: string;
  name: string;
  expected_return: number;
  expected_risk: number;
  asset_class: string;
  sector: string;
  factor_exposures?: Record<string, number>;
  constraints?: Record<string, any>;
}

export interface EfficientFrontierPoint {
  return: number;
  risk: number;
  sharpe: number;
  weights: Record<string, number>;
}

// Portfolio Optimization Service
const portfolioOptimizationService = {
  // Run portfolio optimization
  optimizePortfolio: (
    assets: string[],
    objective: OptimizationObjective,
    constraints: OptimizationConstraint[],
    params?: {
      risk_free_rate?: number;
      covariance_method?: 'sample' | 'shrinkage' | 'factor';
      return_estimate_method?: 'historical' | 'capm' | 'black_litterman' | 'custom';
      custom_returns?: Record<string, number>;
      custom_covariance?: number[][];
    }
  ) => {
    return apiRequest<OptimizationResult>({
      method: 'POST',
      url: '/api/portfolio-optimization/optimize',
      data: {
        assets,
        objective,
        constraints,
        ...params,
      },
    });
  },

  // Generate efficient frontier
  generateEfficientFrontier: (
    assets: string[],
    constraints: OptimizationConstraint[],
    params?: {
      points?: number;
      risk_free_rate?: number;
      covariance_method?: 'sample' | 'shrinkage' | 'factor';
      return_estimate_method?: 'historical' | 'capm' | 'black_litterman' | 'custom';
      custom_returns?: Record<string, number>;
      custom_covariance?: number[][];
    }
  ) => {
    return apiRequest<EfficientFrontierPoint[]>({
      method: 'POST',
      url: '/api/portfolio-optimization/efficient-frontier',
      data: {
        assets,
        constraints,
        ...params,
      },
    });
  },

  // Get asset data for optimization
  getAssetData: (
    assets: string[],
    params?: {
      start_date?: string;
      end_date?: string;
      frequency?: 'daily' | 'weekly' | 'monthly';
    }
  ) => {
    return apiRequest<Record<string, AssetData>>({
      method: 'POST',
      url: '/api/portfolio-optimization/asset-data',
      data: { assets },
      params,
    });
  },

  // Run Black-Litterman optimization
  runBlackLittermanOptimization: (
    assets: string[],
    market_views: Array<{
      assets: string[];
      weights: number[];
      view_return: number;
      confidence: number;
    }>,
    constraints: OptimizationConstraint[],
    params?: {
      risk_free_rate?: number;
      market_portfolio?: Record<string, number>;
      tau?: number;
    }
  ) => {
    return apiRequest<OptimizationResult>({
      method: 'POST',
      url: '/api/portfolio-optimization/black-litterman',
      data: {
        assets,
        market_views,
        constraints,
        ...params,
      },
    });
  },

  // Run risk parity optimization
  runRiskParityOptimization: (
    assets: string[],
    params?: {
      risk_budget?: Record<string, number>;
      constraints?: OptimizationConstraint[];
      covariance_method?: 'sample' | 'shrinkage' | 'factor';
    }
  ) => {
    return apiRequest<OptimizationResult>({
      method: 'POST',
      url: '/api/portfolio-optimization/risk-parity',
      data: {
        assets,
        ...params,
      },
    });
  },

  // Run hierarchical risk parity optimization
  runHierarchicalRiskParity: (
    assets: string[],
    params?: {
      linkage_method?: 'single' | 'complete' | 'average' | 'weighted';
      constraints?: OptimizationConstraint[];
    }
  ) => {
    return apiRequest<OptimizationResult>({
      method: 'POST',
      url: '/api/portfolio-optimization/hierarchical-risk-parity',
      data: {
        assets,
        ...params,
      },
    });
  },

  // Save optimized portfolio
  saveOptimizedPortfolio: (
    name: string,
    description: string,
    weights: Record<string, number>,
    optimization_params: Record<string, any>
  ) => {
    return apiRequest<{ portfolio_id: string }>({
      method: 'POST',
      url: '/api/portfolio-optimization/save-portfolio',
      data: {
        name,
        description,
        weights,
        optimization_params,
      },
    });
  },

  // Get optimization constraints templates
  getConstraintTemplates: () => {
    return apiRequest<Record<string, OptimizationConstraint>>({
      method: 'GET',
      url: '/api/portfolio-optimization/constraint-templates',
    });
  },

  // Get optimization objective templates
  getObjectiveTemplates: () => {
    return apiRequest<Record<string, OptimizationObjective>>({
      method: 'GET',
      url: '/api/portfolio-optimization/objective-templates',
    });
  },
};

export default portfolioOptimizationService;