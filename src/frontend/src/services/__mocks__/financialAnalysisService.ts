// Mock implementation of financialAnalysisService

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

// Mock data
const mockCompanyProfile = {
  symbol: 'AAPL',
  name: 'Apple Inc.',
  sector: 'Technology',
  industry: 'Consumer Electronics',
  description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
  marketCap: 2800000000000,
  employees: 154000,
  website: 'https://www.apple.com',
  ceo: 'Tim Cook',
  exchange: 'NASDAQ'
};

const mockFinancialRatios: FinancialRatios = {
  symbol: 'AAPL',
  date: '2023-06-30',
  previous_date: '2022-06-30',
  ratios: {
    liquidity: {
      current_ratio: 0.94,
      quick_ratio: 0.88,
      cash_ratio: 0.21
    },
    profitability: {
      gross_margin: 0.44,
      operating_margin: 0.30,
      net_margin: 0.25,
      return_on_assets: 0.28,
      return_on_equity: 1.56
    },
    solvency: {
      debt_to_equity: 1.76,
      debt_ratio: 0.29,
      interest_coverage: 42.5
    },
    efficiency: {
      asset_turnover: 0.88,
      inventory_turnover: 40.2,
      receivables_turnover: 14.5
    },
    valuation: {
      pe_ratio: 30.2,
      pb_ratio: 47.1,
      ps_ratio: 7.5,
      ev_ebitda: 22.3
    },
    growth: {
      revenue_growth: 0.08,
      earnings_growth: 0.05,
      dividend_growth: 0.04
    }
  }
};

const mockIncomeStatementAnalysis: IncomeStatementAnalysis = {
  symbol: 'AAPL',
  date: '2023-06-30',
  previous_date: '2022-06-30',
  gross_margin: 0.44,
  operating_margin: 0.30,
  net_margin: 0.25,
  ebitda_margin: 0.33,
  cogs_ratio: 0.56,
  operating_expense_ratio: 0.14,
  revenue_growth: 0.08,
  gross_profit_growth: 0.10,
  operating_income_growth: 0.12,
  net_income_growth: 0.05,
  ebitda_growth: 0.09,
  gross_margin_change: 0.01,
  operating_margin_change: 0.02,
  net_margin_change: -0.01,
  ebitda_margin_change: 0.01
};

const mockBalanceSheetAnalysis: BalanceSheetAnalysis = {
  symbol: 'AAPL',
  date: '2023-06-30',
  previous_date: '2022-06-30',
  current_assets_ratio: 0.35,
  cash_ratio: 0.15,
  current_liabilities_ratio: 0.37,
  long_term_debt_ratio: 0.25,
  debt_ratio: 0.62,
  equity_ratio: 0.38,
  debt_to_equity: 1.76,
  current_ratio: 0.94,
  quick_ratio: 0.88,
  cash_to_current_liabilities: 0.41,
  total_assets_growth: 0.05,
  current_assets_growth: 0.03,
  cash_growth: -0.08,
  total_liabilities_growth: 0.07,
  current_liabilities_growth: 0.09,
  total_equity_growth: 0.02,
  long_term_debt_growth: 0.04
};

const mockCashFlowAnalysis: CashFlowAnalysis = {
  symbol: 'AAPL',
  date: '2023-06-30',
  previous_date: '2022-06-30',
  operating_cash_flow_ratio: 0.28,
  investing_cash_flow_ratio: -0.12,
  financing_cash_flow_ratio: -0.16,
  capex_to_operating_cash_flow: 0.15,
  free_cash_flow: 95000000000,
  operating_cash_flow_to_net_income: 1.25,
  free_cash_flow_to_net_income: 1.05,
  operating_cash_flow_to_revenue: 0.31,
  free_cash_flow_to_revenue: 0.26,
  operating_cash_flow_growth: 0.03,
  capital_expenditure_growth: 0.12,
  free_cash_flow_growth: 0.01
};

const mockPeerSymbols = ['MSFT', 'GOOGL', 'AMZN', 'META'];

const mockGrowthAnalysis: GrowthAnalysis = {
  symbol: 'AAPL',
  period: 'annual',
  growth_data: [
    {
      date: '2023-06-30',
      growth_ratios: {
        revenue_growth: 0.08,
        net_income_growth: 0.05,
        eps_growth: 0.07,
        dividend_growth: 0.04
      }
    },
    {
      date: '2022-06-30',
      growth_ratios: {
        revenue_growth: 0.12,
        net_income_growth: 0.09,
        eps_growth: 0.11,
        dividend_growth: 0.05
      }
    },
    {
      date: '2021-06-30',
      growth_ratios: {
        revenue_growth: 0.33,
        net_income_growth: 0.65,
        eps_growth: 0.71,
        dividend_growth: 0.07
      }
    },
    {
      date: '2020-06-30',
      growth_ratios: {
        revenue_growth: 0.05,
        net_income_growth: 0.03,
        eps_growth: 0.04,
        dividend_growth: 0.06
      }
    },
    {
      date: '2019-06-30',
      growth_ratios: {
        revenue_growth: -0.02,
        net_income_growth: -0.07,
        eps_growth: -0.03,
        dividend_growth: 0.05
      }
    }
  ],
  cagr: {
    '3Y': {
      revenue: 0.17,
      net_income: 0.24,
      eps: 0.27,
      dividend: 0.05
    },
    '5Y': {
      revenue: 0.11,
      net_income: 0.14,
      eps: 0.17,
      dividend: 0.05
    }
  }
};

// Mock service
const financialAnalysisService = {
  getCompanyProfile: jest.fn().mockResolvedValue(mockCompanyProfile),
  
  analyzeIncomeStatement: jest.fn().mockResolvedValue(mockIncomeStatementAnalysis),
  
  analyzeBalanceSheet: jest.fn().mockResolvedValue(mockBalanceSheetAnalysis),
  
  analyzeCashFlow: jest.fn().mockResolvedValue(mockCashFlowAnalysis),
  
  getComprehensiveAnalysis: jest.fn().mockResolvedValue({
    symbol: 'AAPL',
    date: '2023-06-30',
    previous_date: '2022-06-30',
    analysis: {
      income_statement: mockIncomeStatementAnalysis,
      balance_sheet: mockBalanceSheetAnalysis,
      cash_flow: mockCashFlowAnalysis,
      ratios: mockFinancialRatios.ratios
    }
  }),
  
  getFinancialTrends: jest.fn().mockResolvedValue({
    symbol: 'AAPL',
    period: 'annual',
    trend_data: {
      revenue: {
        dates: ['2019-06-30', '2020-06-30', '2021-06-30', '2022-06-30', '2023-06-30'],
        values: [260000000000, 274000000000, 365000000000, 410000000000, 442800000000]
      },
      net_income: {
        dates: ['2019-06-30', '2020-06-30', '2021-06-30', '2022-06-30', '2023-06-30'],
        values: [55000000000, 57000000000, 94000000000, 103000000000, 108000000000]
      },
      eps: {
        dates: ['2019-06-30', '2020-06-30', '2021-06-30', '2022-06-30', '2023-06-30'],
        values: [2.97, 3.10, 5.30, 5.89, 6.31]
      }
    },
    growth_rates: {
      revenue: {
        '1Y': 0.08,
        '3Y': 0.17,
        '5Y': 0.11
      },
      net_income: {
        '1Y': 0.05,
        '3Y': 0.24,
        '5Y': 0.14
      },
      eps: {
        '1Y': 0.07,
        '3Y': 0.27,
        '5Y': 0.17
      }
    }
  }),
  
  getFinancialRatios: jest.fn().mockResolvedValue(mockFinancialRatios),
  
  getPeerComparison: jest.fn().mockResolvedValue({
    target_symbol: 'AAPL',
    peer_symbols: mockPeerSymbols,
    comparison: {
      'AAPL': {
        pe_ratio: 30.2,
        ps_ratio: 7.5,
        pb_ratio: 47.1,
        ev_ebitda: 22.3,
        gross_margin: 0.44,
        operating_margin: 0.30,
        net_margin: 0.25,
        debt_to_equity: 1.76
      },
      'MSFT': {
        pe_ratio: 32.5,
        ps_ratio: 10.8,
        pb_ratio: 12.3,
        ev_ebitda: 24.1,
        gross_margin: 0.68,
        operating_margin: 0.42,
        net_margin: 0.36,
        debt_to_equity: 0.42
      },
      'GOOGL': {
        pe_ratio: 25.1,
        ps_ratio: 5.7,
        pb_ratio: 5.9,
        ev_ebitda: 15.2,
        gross_margin: 0.56,
        operating_margin: 0.28,
        net_margin: 0.23,
        debt_to_equity: 0.12
      },
      'AMZN': {
        pe_ratio: 42.8,
        ps_ratio: 2.5,
        pb_ratio: 8.7,
        ev_ebitda: 18.9,
        gross_margin: 0.45,
        operating_margin: 0.06,
        net_margin: 0.05,
        debt_to_equity: 0.58
      },
      'META': {
        pe_ratio: 27.2,
        ps_ratio: 6.5,
        pb_ratio: 6.1,
        ev_ebitda: 14.5,
        gross_margin: 0.80,
        operating_margin: 0.32,
        net_margin: 0.28,
        debt_to_equity: 0.15
      }
    },
    statistics: {
      pe_ratio: {
        average: 31.56,
        min: 25.1,
        max: 42.8,
        median: 30.2,
        percentile: 50
      },
      ps_ratio: {
        average: 6.6,
        min: 2.5,
        max: 10.8,
        median: 6.5,
        percentile: 60
      },
      gross_margin: {
        average: 0.59,
        min: 0.44,
        max: 0.80,
        median: 0.56,
        percentile: 20
      }
    }
  }),
  
  getGrowthAnalysis: jest.fn().mockResolvedValue(mockGrowthAnalysis),
  
  getPeerCompanies: jest.fn().mockResolvedValue(mockPeerSymbols)
};

export default financialAnalysisService;