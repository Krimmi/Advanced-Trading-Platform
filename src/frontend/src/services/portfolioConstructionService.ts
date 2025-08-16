import { apiRequest } from './api';

// Types
export interface Portfolio {
  id: string;
  name: string;
  description: string;
  creation_date: string;
  last_modified: string;
  holdings: PortfolioHolding[];
  total_value: number;
  currency: string;
  benchmark: string | null;
  tags: string[];
  performance: {
    return_1d: number | null;
    return_1w: number | null;
    return_1m: number | null;
    return_3m: number | null;
    return_6m: number | null;
    return_ytd: number | null;
    return_1y: number | null;
    return_3y: number | null;
    return_5y: number | null;
    return_all: number | null;
  };
  risk_metrics: {
    volatility: number | null;
    sharpe_ratio: number | null;
    max_drawdown: number | null;
    beta: number | null;
    alpha: number | null;
    var_95: number | null;
  };
  allocations: {
    asset_class: Record<string, number>;
    sector: Record<string, number>;
    geography: Record<string, number>;
    currency: Record<string, number>;
  };
}

export interface PortfolioHolding {
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  value: number;
  weight: number;
  cost_basis: number;
  unrealized_pnl: number;
  unrealized_pnl_percent: number;
  asset_class: string;
  sector: string;
  industry: string;
  country: string;
  currency: string;
  attributes: Record<string, any>;
}

export interface PortfolioTransaction {
  id: string;
  portfolio_id: string;
  date: string;
  symbol: string;
  transaction_type: 'buy' | 'sell' | 'dividend' | 'interest' | 'fee' | 'transfer' | 'other';
  quantity: number;
  price: number;
  amount: number;
  fees: number;
  taxes: number;
  currency: string;
  notes: string;
}

export interface RebalancingTarget {
  symbol: string;
  target_weight: number;
  current_weight: number;
  current_value: number;
  target_value: number;
  difference_value: number;
  difference_weight: number;
  action: 'buy' | 'sell' | 'hold';
  shares_to_trade: number;
  estimated_amount: number;
}

export interface RebalancingPlan {
  portfolio_id: string;
  current_total_value: number;
  target_total_value: number;
  cash_to_add: number;
  cash_to_withdraw: number;
  trades: RebalancingTarget[];
  estimated_transaction_costs: number;
  post_rebalance_allocations: {
    asset_class: Record<string, number>;
    sector: Record<string, number>;
    geography: Record<string, number>;
    currency: Record<string, number>;
  };
  risk_metrics_before: {
    volatility: number;
    sharpe_ratio: number;
    var_95: number;
    expected_return: number;
  };
  risk_metrics_after: {
    volatility: number;
    sharpe_ratio: number;
    var_95: number;
    expected_return: number;
  };
}

export interface PortfolioTemplate {
  id: string;
  name: string;
  description: string;
  allocations: Record<string, number>;
  risk_level: number;
  expected_return: number;
  expected_risk: number;
  sharpe_ratio: number;
  asset_classes: Record<string, number>;
  sectors: Record<string, number>;
  suitable_for: string[];
  time_horizon: string;
}

// Portfolio Construction Service
const portfolioConstructionService = {
  // Get all portfolios
  getAllPortfolios: () => {
    return apiRequest<Portfolio[]>({
      method: 'GET',
      url: '/api/portfolio-construction/portfolios',
    });
  },

  // Get portfolio by ID
  getPortfolio: (portfolioId: string) => {
    return apiRequest<Portfolio>({
      method: 'GET',
      url: `/api/portfolio-construction/portfolios/${portfolioId}`,
    });
  },

  // Create new portfolio
  createPortfolio: (
    portfolio: {
      name: string;
      description: string;
      benchmark?: string;
      currency: string;
      tags?: string[];
    }
  ) => {
    return apiRequest<Portfolio>({
      method: 'POST',
      url: '/api/portfolio-construction/portfolios',
      data: portfolio,
    });
  },

  // Update portfolio
  updatePortfolio: (
    portfolioId: string,
    updates: {
      name?: string;
      description?: string;
      benchmark?: string;
      tags?: string[];
    }
  ) => {
    return apiRequest<Portfolio>({
      method: 'PUT',
      url: `/api/portfolio-construction/portfolios/${portfolioId}`,
      data: updates,
    });
  },

  // Delete portfolio
  deletePortfolio: (portfolioId: string) => {
    return apiRequest<{ success: boolean }>({
      method: 'DELETE',
      url: `/api/portfolio-construction/portfolios/${portfolioId}`,
    });
  },

  // Add holding to portfolio
  addHolding: (
    portfolioId: string,
    holding: {
      symbol: string;
      quantity: number;
      price?: number;
      cost_basis?: number;
      date?: string;
    }
  ) => {
    return apiRequest<Portfolio>({
      method: 'POST',
      url: `/api/portfolio-construction/portfolios/${portfolioId}/holdings`,
      data: holding,
    });
  },

  // Update holding
  updateHolding: (
    portfolioId: string,
    symbol: string,
    updates: {
      quantity?: number;
      cost_basis?: number;
    }
  ) => {
    return apiRequest<Portfolio>({
      method: 'PUT',
      url: `/api/portfolio-construction/portfolios/${portfolioId}/holdings/${symbol}`,
      data: updates,
    });
  },

  // Remove holding
  removeHolding: (portfolioId: string, symbol: string) => {
    return apiRequest<Portfolio>({
      method: 'DELETE',
      url: `/api/portfolio-construction/portfolios/${portfolioId}/holdings/${symbol}`,
    });
  },

  // Get portfolio transactions
  getTransactions: (
    portfolioId: string,
    params?: {
      start_date?: string;
      end_date?: string;
      transaction_type?: string;
      symbol?: string;
      limit?: number;
      offset?: number;
    }
  ) => {
    return apiRequest<{ transactions: PortfolioTransaction[]; total: number }>({
      method: 'GET',
      url: `/api/portfolio-construction/portfolios/${portfolioId}/transactions`,
      params,
    });
  },

  // Add transaction
  addTransaction: (portfolioId: string, transaction: Omit<PortfolioTransaction, 'id' | 'portfolio_id'>) => {
    return apiRequest<PortfolioTransaction>({
      method: 'POST',
      url: `/api/portfolio-construction/portfolios/${portfolioId}/transactions`,
      data: transaction,
    });
  },

  // Get portfolio performance
  getPerformance: (
    portfolioId: string,
    params?: {
      start_date?: string;
      end_date?: string;
      frequency?: 'daily' | 'weekly' | 'monthly';
      benchmark?: string;
    }
  ) => {
    return apiRequest<{
      dates: string[];
      portfolio_values: number[];
      benchmark_values?: number[];
      portfolio_returns: number[];
      benchmark_returns?: number[];
      cumulative_portfolio_returns: number[];
      cumulative_benchmark_returns?: number[];
    }>({
      method: 'GET',
      url: `/api/portfolio-construction/portfolios/${portfolioId}/performance`,
      params,
    });
  },

  // Generate rebalancing plan
  generateRebalancingPlan: (
    portfolioId: string,
    params: {
      target_weights?: Record<string, number>;
      cash_to_add?: number;
      cash_to_withdraw?: number;
      tolerance?: number;
      min_trade_size?: number;
      target_template_id?: string;
    }
  ) => {
    return apiRequest<RebalancingPlan>({
      method: 'POST',
      url: `/api/portfolio-construction/portfolios/${portfolioId}/rebalancing-plan`,
      data: params,
    });
  },

  // Execute rebalancing plan
  executeRebalancingPlan: (portfolioId: string, planId: string) => {
    return apiRequest<Portfolio>({
      method: 'POST',
      url: `/api/portfolio-construction/portfolios/${portfolioId}/execute-rebalancing/${planId}`,
    });
  },

  // Get portfolio templates
  getPortfolioTemplates: (params?: { risk_level?: number; time_horizon?: string }) => {
    return apiRequest<PortfolioTemplate[]>({
      method: 'GET',
      url: '/api/portfolio-construction/portfolio-templates',
      params,
    });
  },

  // Create portfolio from template
  createPortfolioFromTemplate: (
    templateId: string,
    params: {
      name: string;
      description?: string;
      initial_investment: number;
      currency: string;
    }
  ) => {
    return apiRequest<Portfolio>({
      method: 'POST',
      url: `/api/portfolio-construction/create-from-template/${templateId}`,
      data: params,
    });
  },

  // Get asset allocation recommendations
  getAssetAllocationRecommendations: (
    params: {
      risk_profile: number;
      time_horizon: string;
      investment_goal: string;
      constraints?: Record<string, any>;
    }
  ) => {
    return apiRequest<{
      asset_classes: Record<string, number>;
      expected_return: number;
      expected_risk: number;
      sharpe_ratio: number;
      recommended_portfolio_template_id?: string;
    }>({
      method: 'POST',
      url: '/api/portfolio-construction/asset-allocation-recommendations',
      data: params,
    });
  },

  // Get portfolio drift analysis
  getPortfolioDrift: (portfolioId: string) => {
    return apiRequest<{
      overall_drift: number;
      asset_class_drift: Record<string, { target: number; current: number; drift: number }>;
      sector_drift: Record<string, { target: number; current: number; drift: number }>;
      security_drift: Record<string, { target: number; current: number; drift: number }>;
      needs_rebalancing: boolean;
    }>({
      method: 'GET',
      url: `/api/portfolio-construction/portfolios/${portfolioId}/drift-analysis`,
    });
  },

  // Get tax-efficient rebalancing plan
  getTaxEfficientRebalancingPlan: (
    portfolioId: string,
    params: {
      target_weights?: Record<string, number>;
      tax_rate_short_term?: number;
      tax_rate_long_term?: number;
      tax_loss_harvesting?: boolean;
      max_tax_impact?: number;
    }
  ) => {
    return apiRequest<RebalancingPlan & {
      tax_impact: number;
      tax_savings_from_harvesting: number;
      deferred_gains: number;
      realized_losses: number;
      realized_gains: number;
    }>({
      method: 'POST',
      url: `/api/portfolio-construction/portfolios/${portfolioId}/tax-efficient-rebalancing`,
      data: params,
    });
  },
};

export default portfolioConstructionService;