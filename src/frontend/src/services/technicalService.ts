import { apiRequest } from './api';

// Types
export interface TechnicalIndicator {
  date: string;
  value: number;
}

export interface ChartPattern {
  pattern: string;
  probability: number;
  startDate: string;
  endDate: string;
  priceTarget?: number;
}

export interface SupportResistanceLevel {
  level: number;
  strength: number;
  type: 'support' | 'resistance';
}

export interface FibonacciLevel {
  level: number;
  value: number;
  ratio: string;
}

// Technical analysis service
const technicalService = {
  // Get Simple Moving Average (SMA)
  getSMA: (symbol: string, period: number, timeframe: 'daily' | 'weekly' | 'monthly' = 'daily') => {
    return apiRequest<TechnicalIndicator[]>({
      method: 'GET',
      url: `/api/technical/sma/${symbol}`,
      params: {
        period,
        timeframe,
      },
    });
  },

  // Get Exponential Moving Average (EMA)
  getEMA: (symbol: string, period: number, timeframe: 'daily' | 'weekly' | 'monthly' = 'daily') => {
    return apiRequest<TechnicalIndicator[]>({
      method: 'GET',
      url: `/api/technical/ema/${symbol}`,
      params: {
        period,
        timeframe,
      },
    });
  },

  // Get Relative Strength Index (RSI)
  getRSI: (symbol: string, period: number = 14, timeframe: 'daily' | 'weekly' | 'monthly' = 'daily') => {
    return apiRequest<TechnicalIndicator[]>({
      method: 'GET',
      url: `/api/technical/rsi/${symbol}`,
      params: {
        period,
        timeframe,
      },
    });
  },

  // Get Moving Average Convergence Divergence (MACD)
  getMACD: (
    symbol: string,
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9,
    timeframe: 'daily' | 'weekly' | 'monthly' = 'daily'
  ) => {
    return apiRequest<any[]>({
      method: 'GET',
      url: `/api/technical/macd/${symbol}`,
      params: {
        fast_period: fastPeriod,
        slow_period: slowPeriod,
        signal_period: signalPeriod,
        timeframe,
      },
    });
  },

  // Get Bollinger Bands
  getBollingerBands: (
    symbol: string,
    period: number = 20,
    stdDev: number = 2,
    timeframe: 'daily' | 'weekly' | 'monthly' = 'daily'
  ) => {
    return apiRequest<any[]>({
      method: 'GET',
      url: `/api/technical/bollinger/${symbol}`,
      params: {
        period,
        std_dev: stdDev,
        timeframe,
      },
    });
  },

  // Get Stochastic Oscillator
  getStochastic: (
    symbol: string,
    kPeriod: number = 14,
    dPeriod: number = 3,
    timeframe: 'daily' | 'weekly' | 'monthly' = 'daily'
  ) => {
    return apiRequest<any[]>({
      method: 'GET',
      url: `/api/technical/stochastic/${symbol}`,
      params: {
        k_period: kPeriod,
        d_period: dPeriod,
        timeframe,
      },
    });
  },

  // Get Average Directional Index (ADX)
  getADX: (symbol: string, period: number = 14, timeframe: 'daily' | 'weekly' | 'monthly' = 'daily') => {
    return apiRequest<TechnicalIndicator[]>({
      method: 'GET',
      url: `/api/technical/adx/${symbol}`,
      params: {
        period,
        timeframe,
      },
    });
  },

  // Get On-Balance Volume (OBV)
  getOBV: (symbol: string, timeframe: 'daily' | 'weekly' | 'monthly' = 'daily') => {
    return apiRequest<TechnicalIndicator[]>({
      method: 'GET',
      url: `/api/technical/obv/${symbol}`,
      params: {
        timeframe,
      },
    });
  },

  // Get chart patterns
  getChartPatterns: (symbol: string, timeframe: 'daily' | 'weekly' | 'monthly' = 'daily') => {
    return apiRequest<ChartPattern[]>({
      method: 'GET',
      url: `/api/technical/patterns/${symbol}`,
      params: {
        timeframe,
      },
    });
  },

  // Get support and resistance levels
  getSupportResistance: (symbol: string, timeframe: 'daily' | 'weekly' | 'monthly' = 'daily') => {
    return apiRequest<SupportResistanceLevel[]>({
      method: 'GET',
      url: `/api/technical/support-resistance/${symbol}`,
      params: {
        timeframe,
      },
    });
  },

  // Get Fibonacci retracements
  getFibonacciLevels: (
    symbol: string,
    startDate: string,
    endDate: string,
    timeframe: 'daily' | 'weekly' | 'monthly' = 'daily'
  ) => {
    return apiRequest<FibonacciLevel[]>({
      method: 'GET',
      url: `/api/technical/fibonacci/${symbol}`,
      params: {
        start_date: startDate,
        end_date: endDate,
        timeframe,
      },
    });
  },

  // Get pivot points
  getPivotPoints: (symbol: string, type: 'standard' | 'fibonacci' | 'woodie' | 'camarilla' = 'standard') => {
    return apiRequest<any>({
      method: 'GET',
      url: `/api/technical/pivot-points/${symbol}`,
      params: {
        type,
      },
    });
  },
};

export default technicalService;