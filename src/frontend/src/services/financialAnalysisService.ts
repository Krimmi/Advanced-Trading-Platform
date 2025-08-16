import { apiRequest } from './api';

// Types
export interface IncomeStatementAnalysis {
  symbol: string;
  date: string;
  previous_date?: string;
  gross_margin: number | null;
  operating_margin: number | null;
  net_margin: number | null;
  ebitda_margin: number | null;
  cogs_ratio: number | null;
  operating_expense_ratio: number | null;
  revenue_growth?: number | null;
  gross_profit_growth?: number | null;
  operating_income_growth?: number | null;
  net_income_growth?: number | null;
  ebitda_growth?: number | null;
  gross_margin_change?: number | null;
  operating_margin_change?: number | null;
  net_margin_change?: number | null;
  ebitda_margin_change?: number | null;
}

export interface BalanceSheetAnalysis {
  symbol: string;
  date: string;
  previous_date?: string;
  current_assets_ratio: number | null;
  cash_ratio: number | null;
  current_liabilities_ratio: number | null;
  long_term_debt_ratio: number | null;
  debt_ratio: number | null;
  equity_ratio: number | null;
  debt_to_equity: number | null;
  current_ratio: number | null;
  quick_ratio: number | null;
  cash_to_current_liabilities: number | null;
  total_assets_growth?: number | null;
  current_assets_growth?: number | null;
  cash_growth?: number | null;
  total_liabilities_growth?: number | null;
  current_liabilities_growth?: number | null;
  total_equity_growth?: number | null;
  long_term_debt_growth?: number | null;
}

export interface CashFlowAnalysis {
  symbol: string;
  date: string;
  previous_date?: string;
  operating_cash_flow_ratio: number | null;
  investing_cash_flow_ratio: number | null;
  financing_cash_flow_ratio: number | null;
  capex_to_operating_cash_flow: number | null;
  free_cash_flow: number | null;
  operating_cash_flow_to_net_income?: number | null;
  free_cash_flow_to_net_income?: number | null;
  operating_cash_flow_to_revenue?: number | null;
  free_cash_flow_to_revenue?: number | null;
  operating_cash_flow_growth?: number | null;
  capital_expenditure_growth?: number | null;
  free_cash_flow_growth?: number | null;
}

export interface ComprehensiveAnalysis {
  symbol: string;
  date: string;
  previous_date?: string;
  analysis: {
    income_statement: Record<string, any>;
    balance_sheet: Record<string, any>;
    cash_flow: Record<string, any>;
    ratios: {
      liquidity: Record<string, number | null>;
      profitability: Record<string, number | null>;
      solvency: Record<string, number | null>;
      efficiency: Record<string, number | null>;
      valuation: Record<string, number | null>;
      growth: Record<string, number | null>;
    };
  };
}

export interface FinancialTrends {
  symbol: string;
  period: string;
  trend_data: Record<string, {
    dates: string[];
    values: number[];
  }>;
  growth_rates: Record<string, Record<string, number>>;
}

export interface FinancialRatios {
  symbol: string;
  date: string;
  previous_date?: string;
  ratios: {
    liquidity: Record<string, number | null>;
    profitability: Record<string, number | null>;
    solvency: Record<string, number | null>;
    efficiency: Record<string, number | null>;
    valuation: Record<string, number | null>;
    growth: Record<string, number | null>;
  };
}

export interface PeerComparison {
  target_symbol: string;
  peer_symbols: string[];
  comparison: Record<string, Record<string, number | null>>;
  statistics: Record<string, {
    average: number;
    min: number;
    max: number;
    median: number;
    percentile?: number;
  }>;
}

export interface GrowthAnalysis {
  symbol: string;
  period: string;
  growth_data: Array<{
    date: string;
    growth_ratios: Record<string, number | null>;
  }>;
  cagr: {
    '3Y'?: Record<string, number>;
    '5Y'?: Record<string, number>;
  };
}

// Financial Analysis service
const financialAnalysisService = {
  // Analyze income statement
  analyzeIncomeStatement: (
    symbol: string,
    params?: {
      period?: 'annual' | 'quarter';
      limit?: number;
    }
  ) => {
    return apiRequest<IncomeStatementAnalysis>({
      method: 'GET',
      url: `/api/financial-analysis/income-statement-analysis/${symbol}`,
      params,
    });
  },

  // Analyze balance sheet
  analyzeBalanceSheet: (
    symbol: string,
    params?: {
      period?: 'annual' | 'quarter';
      limit?: number;
    }
  ) => {
    return apiRequest<BalanceSheetAnalysis>({
      method: 'GET',
      url: `/api/financial-analysis/balance-sheet-analysis/${symbol}`,
      params,
    });
  },

  // Analyze cash flow
  analyzeCashFlow: (
    symbol: string,
    params?: {
      period?: 'annual' | 'quarter';
      limit?: number;
    }
  ) => {
    return apiRequest<CashFlowAnalysis>({
      method: 'GET',
      url: `/api/financial-analysis/cash-flow-analysis/${symbol}`,
      params,
    });
  },

  // Comprehensive analysis
  getComprehensiveAnalysis: (
    symbol: string,
    params?: {
      period?: 'annual' | 'quarter';
      limit?: number;
    }
  ) => {
    return apiRequest<ComprehensiveAnalysis>({
      method: 'GET',
      url: `/api/financial-analysis/comprehensive-analysis/${symbol}`,
      params,
    });
  },

  // Financial trends
  getFinancialTrends: (
    symbol: string,
    params?: {
      period?: 'annual' | 'quarter';
      limit?: number;
      metrics?: string[];
    }
  ) => {
    return apiRequest<FinancialTrends>({
      method: 'GET',
      url: `/api/financial-analysis/financial-trends/${symbol}`,
      params,
    });
  },

  // Financial ratios
  getFinancialRatios: (
    symbol: string,
    params?: {
      period?: 'annual' | 'quarter';
      limit?: number;
    }
  ) => {
    return apiRequest<FinancialRatios>({
      method: 'GET',
      url: `/api/financial-analysis/financial-ratios/${symbol}`,
      params,
    });
  },

  // Peer comparison
  getPeerComparison: (
    symbol: string,
    peer_symbols: string[],
    metrics: string[],
    period?: 'annual' | 'quarter'
  ) => {
    return apiRequest<PeerComparison>({
      method: 'POST',
      url: `/api/financial-analysis/peer-comparison`,
      data: {
        symbol,
        peer_symbols,
        metrics,
        period: period || 'annual',
      },
    });
  },

  // Growth analysis
  getGrowthAnalysis: (
    symbol: string,
    params?: {
      period?: 'annual' | 'quarter';
      limit?: number;
    }
  ) => {
    return apiRequest<GrowthAnalysis>({
      method: 'GET',
      url: `/api/financial-analysis/growth-analysis/${symbol}`,
      params,
    });
  },
};

export default financialAnalysisService;