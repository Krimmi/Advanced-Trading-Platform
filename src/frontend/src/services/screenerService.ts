import { apiRequest } from './api';

// Types
export interface ScreenerFilter {
  metric: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'between' | 'not_equals';
  value: number | string | boolean;
  value2?: number | string; // For 'between' operator
  category?: string; // Added for organization
}

export interface ScreenerRequest {
  filters: ScreenerFilter[];
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  page?: number;
}

export interface ScreenerResult {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  sector: string;
  industry: string;
  volume: number;
  avgVolume: number;
  pe: number;
  eps: number;
  dividend: number;
  dividendYield: number;
  beta: number;
  [key: string]: any; // Additional metrics based on filters
}

export interface ScreenerResponse {
  results: ScreenerResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PresetScreen {
  id: string;
  name: string;
  description: string;
  filters: ScreenerFilter[];
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  isPublic?: boolean;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScreenerField {
  id: string;
  name: string;
  category: string;
  type: 'number' | 'string' | 'boolean' | 'date';
  operators: string[];
  description?: string;
}

// Screener service
const screenerService = {
  // Run stock screener with filters
  screenStocks: (request: ScreenerRequest) => {
    return apiRequest<ScreenerResponse>({
      method: 'POST',
      url: '/api/screener/screen',
      data: request,
    });
  },

  // Get available metrics for screening
  getAvailableMetrics: () => {
    return apiRequest<{ category: string; metrics: { id: string; name: string; description: string }[] }[]>({
      method: 'GET',
      url: '/api/screener/metrics',
    });
  },

  // Get preset screens
  getPresetScreens: () => {
    return apiRequest<PresetScreen[]>({
      method: 'GET',
      url: '/api/screener/presets',
    });
  },

  // Get specific preset screen
  getPresetScreen: (presetId: string) => {
    return apiRequest<PresetScreen>({
      method: 'GET',
      url: `/api/screener/presets/${presetId}`,
    });
  },

  // Save custom screen (for logged in users)
  saveCustomScreen: (name: string, description: string, filters: ScreenerFilter[], sortBy?: string, sortDirection?: 'asc' | 'desc') => {
    return apiRequest<PresetScreen>({
      method: 'POST',
      url: '/api/screener/custom',
      data: {
        name,
        description,
        filters,
        sortBy,
        sortDirection,
      },
    });
  },

  // Update custom screen
  updateCustomScreen: (screenId: string, updates: Partial<PresetScreen>) => {
    return apiRequest<PresetScreen>({
      method: 'PUT',
      url: `/api/screener/custom/${screenId}`,
      data: updates,
    });
  },

  // Get user's custom screens
  getCustomScreens: () => {
    return apiRequest<PresetScreen[]>({
      method: 'GET',
      url: '/api/screener/custom',
    });
  },

  // Delete custom screen
  deleteCustomScreen: (screenId: string) => {
    return apiRequest<void>({
      method: 'DELETE',
      url: `/api/screener/custom/${screenId}`,
    });
  },

  // Get sector performance for screener
  getSectorPerformance: () => {
    return apiRequest<any[]>({
      method: 'GET',
      url: '/api/screener/sectors',
    });
  },

  // Get industry performance for screener
  getIndustryPerformance: () => {
    return apiRequest<any[]>({
      method: 'GET',
      url: '/api/screener/industries',
    });
  },

  // Export screener results to CSV
  exportToCsv: (results: ScreenerResult[]): string => {
    if (results.length === 0) {
      return '';
    }

    const headers = Object.keys(results[0]);
    const csvRows = [
      headers.join(','),
      ...results.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle values that need quotes (strings with commas, etc.)
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  },

  // Get available operators for a specific field type
  getOperatorsForFieldType: (fieldType: string): string[] => {
    switch (fieldType) {
      case 'number':
        return ['equals', 'not_equals', 'greater_than', 'greater_than_equal', 'less_than', 'less_than_equal', 'between'];
      case 'string':
        return ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with'];
      case 'boolean':
        return ['equals', 'not_equals'];
      case 'date':
        return ['equals', 'not_equals', 'greater_than', 'greater_than_equal', 'less_than', 'less_than_equal', 'between'];
      default:
        return ['equals', 'not_equals'];
    }
  },

  // Get operator display text
  getOperatorDisplayText: (operator: string): string => {
    const operatorMap: Record<string, string> = {
      'equals': 'equals',
      'not_equals': 'not equals',
      'greater_than': 'greater than',
      'greater_than_equal': 'greater than or equal to',
      'less_than': 'less than',
      'less_than_equal': 'less than or equal to',
      'between': 'between',
      'contains': 'contains',
      'not_contains': 'does not contain',
      'starts_with': 'starts with',
      'ends_with': 'ends with',
    };
    
    return operatorMap[operator] || operator;
  },

  // Get predefined filter sets for common screening strategies
  getPredefinedFilters: (strategyName: string): ScreenerFilter[] => {
    switch (strategyName) {
      case 'value':
        return [
          {
            metric: 'pe',
            operator: 'less_than',
            value: 15,
            category: 'Valuation',
          },
          {
            metric: 'priceToBook',
            operator: 'less_than',
            value: 1.5,
            category: 'Valuation',
          },
          {
            metric: 'dividendYield',
            operator: 'greater_than',
            value: 2,
            category: 'Dividends',
          },
        ];
      case 'growth':
        return [
          {
            metric: 'revenueGrowthQuarterlyYoY',
            operator: 'greater_than',
            value: 15,
            category: 'Growth',
          },
          {
            metric: 'epsGrowthQuarterlyYoY',
            operator: 'greater_than',
            value: 15,
            category: 'Growth',
          },
          {
            metric: 'analystTargetPricePercent',
            operator: 'greater_than',
            value: 10,
            category: 'Valuation',
          },
        ];
      case 'momentum':
        return [
          {
            metric: 'performance1Month',
            operator: 'greater_than',
            value: 5,
            category: 'Performance',
          },
          {
            metric: 'volume',
            operator: 'greater_than',
            value: 1000000,
            category: 'Price & Volume',
          },
          {
            metric: 'rsi14',
            operator: 'between',
            value: 40,
            value2: 70,
            category: 'Technical',
          },
        ];
      default:
        return [];
    }
  },

  // Get field categories for organization
  getFieldCategories: (): string[] => {
    return [
      'Price & Volume',
      'Fundamentals',
      'Valuation',
      'Dividends',
      'Growth',
      'Technical',
      'Ownership',
      'Performance',
    ];
  },
};

export default screenerService;