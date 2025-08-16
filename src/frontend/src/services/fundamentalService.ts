import { apiRequest } from './api';

// Types
export interface CompanyProfile {
  symbol: string;
  name: string;
  exchange: string;
  industry: string;
  sector: string;
  description: string;
  website: string;
  ceo: string;
  employees: number;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  image: string;
  ipoDate: string;
}

export interface FinancialStatement {
  date: string;
  symbol: string;
  reportedCurrency: string;
  [key: string]: any; // For various financial metrics
}

export interface KeyMetric {
  date: string;
  symbol: string;
  [key: string]: any; // For various key metrics
}

export interface EarningsData {
  date: string;
  symbol: string;
  eps: number;
  epsEstimated: number;
  revenue: number;
  revenueEstimated: number;
  [key: string]: any;
}

// Fundamental data service
const fundamentalService = {
  // Get company profile
  getCompanyProfile: (symbol: string) => {
    return apiRequest<CompanyProfile>({
      method: 'GET',
      url: `/api/fundamental/company-profile/${symbol}`,
    });
  },

  // Get income statement
  getIncomeStatement: (
    symbol: string,
    params?: {
      period?: 'annual' | 'quarter';
      limit?: number;
    }
  ) => {
    return apiRequest<FinancialStatement[]>({
      method: 'GET',
      url: `/api/fundamental/income-statement/${symbol}`,
      params,
    });
  },

  // Get balance sheet
  getBalanceSheet: (
    symbol: string,
    params?: {
      period?: 'annual' | 'quarter';
      limit?: number;
    }
  ) => {
    return apiRequest<FinancialStatement[]>({
      method: 'GET',
      url: `/api/fundamental/balance-sheet/${symbol}`,
      params,
    });
  },

  // Get cash flow statement
  getCashFlowStatement: (
    symbol: string,
    params?: {
      period?: 'annual' | 'quarter';
      limit?: number;
    }
  ) => {
    return apiRequest<FinancialStatement[]>({
      method: 'GET',
      url: `/api/fundamental/cash-flow/${symbol}`,
      params,
    });
  },

  // Get key metrics
  getKeyMetrics: (
    symbol: string,
    params?: {
      period?: 'annual' | 'quarter';
      limit?: number;
    }
  ) => {
    return apiRequest<KeyMetric[]>({
      method: 'GET',
      url: `/api/fundamental/key-metrics/${symbol}`,
      params,
    });
  },

  // Get financial ratios
  getFinancialRatios: (
    symbol: string,
    params?: {
      period?: 'annual' | 'quarter';
      limit?: number;
    }
  ) => {
    return apiRequest<any[]>({
      method: 'GET',
      url: `/api/fundamental/financial-ratios/${symbol}`,
      params,
    });
  },

  // Get earnings data
  getEarnings: (symbol: string, limit?: number) => {
    return apiRequest<EarningsData[]>({
      method: 'GET',
      url: `/api/fundamental/earnings/${symbol}`,
      params: { limit },
    });
  },

  // Get earnings calendar
  getEarningsCalendar: (params?: { from_date?: string; to_date?: string }) => {
    return apiRequest<any[]>({
      method: 'GET',
      url: '/api/fundamental/earnings-calendar',
      params,
    });
  },

  // Get analyst estimates
  getAnalystEstimates: (symbol: string, limit?: number) => {
    return apiRequest<any[]>({
      method: 'GET',
      url: `/api/fundamental/analyst-estimates/${symbol}`,
      params: { limit },
    });
  },

  // Get insider trading
  getInsiderTrading: (symbol: string, limit?: number) => {
    return apiRequest<any[]>({
      method: 'GET',
      url: `/api/fundamental/insider-trading/${symbol}`,
      params: { limit },
    });
  },
};

export default fundamentalService;