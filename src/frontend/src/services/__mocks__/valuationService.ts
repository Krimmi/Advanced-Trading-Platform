// Mock implementation of valuationService

export interface DCFValuationResult {
  symbol: string;
  forecasted_cash_flows: number[];
  present_values: number[];
  terminal_value: number;
  terminal_value_pv: number;
  enterprise_value: number;
  equity_value: number;
  share_price: number;
  discount_rate: number;
  terminal_growth_rate: number;
  forecast_period: number;
}

export interface ComparableCompanyResult {
  symbol: string;
  comparable_symbols: string[];
  average_multiples: Record<string, number>;
  median_multiples: Record<string, number>;
  implied_values_avg: Record<string, number>;
  implied_values_median: Record<string, number>;
  avg_implied_equity_value: number;
  median_implied_equity_value: number;
  avg_share_price: number;
  median_share_price: number;
}

export interface ConsensusValuationResult {
  symbol: string;
  dcf?: DCFValuationResult;
  cca?: ComparableCompanyResult;
  consensus: {
    equity_value: number;
    share_price: number;
  };
}

export interface PeerValuationMetrics {
  company: {
    symbol: string;
    name: string;
    sector: string;
    industry: string;
    [key: string]: any;
  };
  peers: Array<{
    symbol: string;
    name: string;
    sector: string;
    industry: string;
    [key: string]: any;
  }>;
  average_metrics: Record<string, number>;
  percentile_ranks: Record<string, number>;
}

// Mock data
const mockDCFValuation: DCFValuationResult = {
  symbol: 'AAPL',
  forecasted_cash_flows: [85000000000, 92000000000, 98000000000, 105000000000, 112000000000],
  present_values: [80000000000, 82000000000, 83000000000, 84000000000, 85000000000],
  terminal_value: 4500000000000,
  terminal_value_pv: 2800000000000,
  enterprise_value: 3200000000000,
  equity_value: 3050000000000,
  share_price: 195.23,
  discount_rate: 0.09,
  terminal_growth_rate: 0.03,
  forecast_period: 5
};

const mockComparableCompanyResult: ComparableCompanyResult = {
  symbol: 'AAPL',
  comparable_symbols: ['MSFT', 'GOOGL', 'AMZN', 'META'],
  average_multiples: {
    pe_ratio: 28.5,
    ps_ratio: 6.8,
    pb_ratio: 12.3,
    ev_ebitda: 18.7
  },
  median_multiples: {
    pe_ratio: 27.2,
    ps_ratio: 6.5,
    pb_ratio: 11.8,
    ev_ebitda: 17.9
  },
  implied_values_avg: {
    pe_ratio: 185.25,
    ps_ratio: 190.40,
    pb_ratio: 182.70,
    ev_ebitda: 191.45
  },
  implied_values_median: {
    pe_ratio: 176.80,
    ps_ratio: 182.00,
    pb_ratio: 175.42,
    ev_ebitda: 188.25
  },
  avg_implied_equity_value: 2950000000000,
  median_implied_equity_value: 2850000000000,
  avg_share_price: 187.45,
  median_share_price: 190.12
};

const mockConsensusValuation: ConsensusValuationResult = {
  symbol: 'AAPL',
  dcf: mockDCFValuation,
  cca: mockComparableCompanyResult,
  consensus: {
    equity_value: 3000000000000,
    share_price: 192.35
  }
};

const mockPeerValuationMetrics: PeerValuationMetrics = {
  company: {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Technology',
    industry: 'Consumer Electronics'
  },
  peers: [
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      sector: 'Technology',
      industry: 'Software—Infrastructure'
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      sector: 'Communication Services',
      industry: 'Internet Content & Information'
    },
    {
      symbol: 'AMZN',
      name: 'Amazon.com, Inc.',
      sector: 'Consumer Cyclical',
      industry: 'Internet Retail'
    },
    {
      symbol: 'META',
      name: 'Meta Platforms, Inc.',
      sector: 'Communication Services',
      industry: 'Internet Content & Information'
    }
  ],
  average_metrics: {
    pe_ratio: 31.56,
    ps_ratio: 6.6,
    pb_ratio: 16.02,
    ev_ebitda: 19.0,
    gross_margin: 0.59,
    operating_margin: 0.28,
    net_margin: 0.23,
    debt_to_equity: 0.61
  },
  percentile_ranks: {
    pe_ratio: 50,
    ps_ratio: 60,
    pb_ratio: 90,
    ev_ebitda: 70,
    gross_margin: 20,
    operating_margin: 60,
    net_margin: 60,
    debt_to_equity: 80
  }
};

// Mock valuation summary data
const mockValuationSummary = {
  symbol: 'AAPL',
  current_price: 175.84,
  dcf: {
    share_price: 195.23,
    equity_value: 3050000000000,
    enterprise_value: 3200000000000,
    terminal_value: 4500000000000,
    terminal_value_pv: 2800000000000,
    forecasted_cash_flows: [85000000000, 92000000000, 98000000000, 105000000000, 112000000000],
    present_values: [80000000000, 82000000000, 83000000000, 84000000000, 85000000000],
    discount_rate: 0.09,
    terminal_growth_rate: 0.03,
    forecast_period: 5
  },
  comparable: {
    comparable_symbols: ['MSFT', 'GOOGL', 'AMZN', 'META'],
    average_multiples: {
      pe_ratio: 28.5,
      ps_ratio: 6.8,
      pb_ratio: 12.3,
      ev_ebitda: 18.7
    },
    median_multiples: {
      pe_ratio: 27.2,
      ps_ratio: 6.5,
      pb_ratio: 11.8,
      ev_ebitda: 17.9
    },
    avg_share_price: 187.45,
    median_share_price: 190.12,
    implied_values_avg: {
      pe_ratio: 185.25,
      ps_ratio: 190.40,
      pb_ratio: 182.70,
      ev_ebitda: 191.45
    },
    implied_values_median: {
      pe_ratio: 176.80,
      ps_ratio: 182.00,
      pb_ratio: 175.42,
      ev_ebitda: 188.25
    }
  },
  analyst_consensus: {
    target_price: 192.50,
    high_target: 215.00,
    low_target: 170.00,
    num_buy_ratings: 28,
    num_hold_ratings: 8,
    num_sell_ratings: 2,
    consensus_rating: 'Buy',
    upside_potential: 0.095
  },
  consensus: {
    share_price: 192.35,
    upside_potential: 0.094,
    model_weights: {
      dcf: 0.4,
      comparable: 0.3,
      analyst: 0.3
    }
  }
};

// Mock service
const valuationService = {
  getDCFValuation: jest.fn().mockResolvedValue(mockDCFValuation),
  
  getComparableCompanyAnalysis: jest.fn().mockResolvedValue(mockComparableCompanyResult),
  
  getConsensusValuation: jest.fn().mockResolvedValue(mockConsensusValuation),
  
  getPeerValuationMetrics: jest.fn().mockResolvedValue(mockPeerValuationMetrics),
  
  getValuationSummary: jest.fn().mockResolvedValue(mockValuationSummary)
};

export default valuationService;