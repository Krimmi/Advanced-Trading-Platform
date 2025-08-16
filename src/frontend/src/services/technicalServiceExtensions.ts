import { apiRequest } from './api';
import { TechnicalIndicator, ChartPattern, SupportResistanceLevel, FibonacciLevel } from './technicalService';

// Types for advanced technical analysis
export interface MultiTimeframeAnalysis {
  symbol: string;
  indicator: string;
  timeframes: {
    timeframe: 'minute' | '5min' | '15min' | '30min' | 'hourly' | '4hour' | 'daily' | 'weekly' | 'monthly';
    data: TechnicalIndicator[];
  }[];
}

export interface IndicatorComparison {
  symbol: string;
  indicators: {
    name: string;
    type: string;
    parameters: Record<string, any>;
    data: TechnicalIndicator[];
  }[];
  correlations?: {
    indicator1: string;
    indicator2: string;
    correlation: number;
    significance: number;
  }[];
}

export interface CustomIndicator {
  id?: string;
  name: string;
  description?: string;
  formula: string;
  parameters: {
    name: string;
    type: 'number' | 'string' | 'boolean';
    defaultValue: any;
    min?: number;
    max?: number;
    options?: string[];
  }[];
  userId?: string;
  isPublic: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PatternScan {
  symbol: string;
  timeframe: 'minute' | '5min' | '15min' | '30min' | 'hourly' | '4hour' | 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  patterns: ChartPattern[];
}

export interface HeatmapData {
  symbol: string;
  indicator: string;
  timeframe: 'minute' | '5min' | '15min' | '30min' | 'hourly' | '4hour' | 'daily' | 'weekly' | 'monthly';
  data: {
    date: string;
    value: number;
    intensity: 'very_low' | 'low' | 'neutral' | 'high' | 'very_high';
  }[];
}

export interface DivergenceAnalysis {
  symbol: string;
  indicator: string;
  timeframe: 'minute' | '5min' | '15min' | '30min' | 'hourly' | '4hour' | 'daily' | 'weekly' | 'monthly';
  divergences: {
    type: 'bullish' | 'bearish';
    startDate: string;
    endDate: string;
    priceStart: number;
    priceEnd: number;
    indicatorStart: number;
    indicatorEnd: number;
    significance: number;
  }[];
}

// Technical analysis service extensions
const technicalServiceExtensions = {
  // Get multi-timeframe analysis for an indicator
  getMultiTimeframeAnalysis: (
    symbol: string,
    indicator: string,
    parameters: Record<string, any>,
    timeframes: ('minute' | '5min' | '15min' | '30min' | 'hourly' | '4hour' | 'daily' | 'weekly' | 'monthly')[]
  ) => {
    return apiRequest<MultiTimeframeAnalysis>({
      method: 'GET',
      url: `/api/technical/multi-timeframe/${symbol}`,
      params: {
        indicator,
        parameters: JSON.stringify(parameters),
        timeframes: timeframes.join(','),
      },
    });
  },

  // Compare multiple indicators for a symbol
  compareIndicators: (
    symbol: string,
    indicators: {
      name: string;
      type: string;
      parameters: Record<string, any>;
    }[],
    calculateCorrelations: boolean = false
  ) => {
    return apiRequest<IndicatorComparison>({
      method: 'POST',
      url: `/api/technical/compare/${symbol}`,
      data: {
        indicators,
        calculateCorrelations,
      },
    });
  },

  // Get all custom indicators
  getCustomIndicators: () => {
    return apiRequest<CustomIndicator[]>({
      method: 'GET',
      url: '/api/technical/custom-indicators',
    });
  },

  // Get a specific custom indicator
  getCustomIndicator: (indicatorId: string) => {
    return apiRequest<CustomIndicator>({
      method: 'GET',
      url: `/api/technical/custom-indicators/${indicatorId}`,
    });
  },

  // Create a new custom indicator
  createCustomIndicator: (indicator: Omit<CustomIndicator, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    return apiRequest<CustomIndicator>({
      method: 'POST',
      url: '/api/technical/custom-indicators',
      data: indicator,
    });
  },

  // Update a custom indicator
  updateCustomIndicator: (indicatorId: string, indicator: Partial<CustomIndicator>) => {
    return apiRequest<CustomIndicator>({
      method: 'PUT',
      url: `/api/technical/custom-indicators/${indicatorId}`,
      data: indicator,
    });
  },

  // Delete a custom indicator
  deleteCustomIndicator: (indicatorId: string) => {
    return apiRequest<void>({
      method: 'DELETE',
      url: `/api/technical/custom-indicators/${indicatorId}`,
    });
  },

  // Calculate a custom indicator for a symbol
  calculateCustomIndicator: (
    symbol: string,
    indicatorId: string,
    parameters: Record<string, any>,
    timeframe: 'minute' | '5min' | '15min' | '30min' | 'hourly' | '4hour' | 'daily' | 'weekly' | 'monthly' = 'daily'
  ) => {
    return apiRequest<TechnicalIndicator[]>({
      method: 'GET',
      url: `/api/technical/custom-indicators/${indicatorId}/calculate/${symbol}`,
      params: {
        parameters: JSON.stringify(parameters),
        timeframe,
      },
    });
  },

  // Scan for chart patterns
  scanPatterns: (
    symbol: string,
    timeframe: 'minute' | '5min' | '15min' | '30min' | 'hourly' | '4hour' | 'daily' | 'weekly' | 'monthly' = 'daily',
    startDate?: string,
    endDate?: string,
    patterns?: string[]
  ) => {
    return apiRequest<PatternScan>({
      method: 'GET',
      url: `/api/technical/patterns/scan/${symbol}`,
      params: {
        timeframe,
        start_date: startDate,
        end_date: endDate,
        patterns: patterns?.join(','),
      },
    });
  },

  // Get indicator heatmap data
  getIndicatorHeatmap: (
    symbol: string,
    indicator: string,
    parameters: Record<string, any>,
    timeframe: 'minute' | '5min' | '15min' | '30min' | 'hourly' | '4hour' | 'daily' | 'weekly' | 'monthly' = 'daily'
  ) => {
    return apiRequest<HeatmapData>({
      method: 'GET',
      url: `/api/technical/heatmap/${symbol}`,
      params: {
        indicator,
        parameters: JSON.stringify(parameters),
        timeframe,
      },
    });
  },

  // Analyze divergences between price and indicator
  analyzeDivergences: (
    symbol: string,
    indicator: string,
    parameters: Record<string, any>,
    timeframe: 'minute' | '5min' | '15min' | '30min' | 'hourly' | '4hour' | 'daily' | 'weekly' | 'monthly' = 'daily'
  ) => {
    return apiRequest<DivergenceAnalysis>({
      method: 'GET',
      url: `/api/technical/divergences/${symbol}`,
      params: {
        indicator,
        parameters: JSON.stringify(parameters),
        timeframe,
      },
    });
  },

  // Get available technical indicators
  getAvailableIndicators: () => {
    return apiRequest<{
      category: string;
      indicators: {
        id: string;
        name: string;
        description: string;
        parameters: {
          name: string;
          type: string;
          defaultValue: any;
          min?: number;
          max?: number;
          options?: string[];
        }[];
      }[];
    }[]>({
      method: 'GET',
      url: '/api/technical/indicators',
    });
  },

  // Get available chart patterns
  getAvailablePatterns: () => {
    return apiRequest<{
      id: string;
      name: string;
      description: string;
      reliability: number;
      bullish: boolean;
      bearish: boolean;
    }[]>({
      method: 'GET',
      url: '/api/technical/patterns/available',
    });
  },
};

export default technicalServiceExtensions;