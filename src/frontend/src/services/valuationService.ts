import { apiRequest } from './api';

// Types
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

// Valuation service
const valuationService = {
  // Get DCF valuation
  getDCFValuation: (
    symbol: string,
    params?: {
      years?: number;
      forecast_period?: number;
      discount_rate?: number;
      terminal_growth_rate?: number;
    }
  ) => {
    return apiRequest<DCFValuationResult>({
      method: 'GET',
      url: `/api/valuation/dcf/${symbol}`,
      params,
    });
  },

  // Get comparable company analysis
  getComparableCompanyAnalysis: (
    symbol: string,
    comparable_symbols: string[],
    multiples_to_use?: string[]
  ) => {
    return apiRequest<ComparableCompanyResult>({
      method: 'POST',
      url: `/api/valuation/comparable-company-analysis/${symbol}`,
      data: {
        comparable_symbols,
        multiples_to_use,
      },
    });
  },

  // Get consensus valuation
  getConsensusValuation: (
    symbol: string,
    params: {
      comparable_symbols?: string[];
      methods?: string[];
      parameters?: Record<string, any>;
    }
  ) => {
    return apiRequest<ConsensusValuationResult>({
      method: 'POST',
      url: `/api/valuation/consensus-valuation/${symbol}`,
      data: params,
    });
  },

  // Get peer valuation metrics
  getPeerValuationMetrics: (
    symbol: string,
    params?: {
      sector?: boolean;
      industry?: boolean;
      metrics?: string[];
    }
  ) => {
    return apiRequest<PeerValuationMetrics>({
      method: 'GET',
      url: `/api/valuation/peer-valuation-metrics/${symbol}`,
      params,
    });
  },
};

export default valuationService;