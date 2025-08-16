/**
 * API Configuration for the Hedge Fund Trading Application
 * 
 * This file controls whether the application uses real API data or mock data.
 * When API keys are provided, the application will use real data from the respective APIs.
 * When API keys are missing, the application will fall back to mock data.
 */

// API Keys Configuration
export interface ApiKeysConfig {
  // Market Data APIs
  alphaVantage?: string;
  polygon?: string;
  iexCloud?: string;
  
  // Trading APIs
  alpaca?: {
    apiKey: string;
    apiSecret: string;
    paper: boolean; // Set to true for paper trading, false for live trading
  };
  interactiveBrokers?: {
    accountId: string;
    apiKey: string;
  };
  
  // Financial Data APIs
  financialModelingPrep?: string;
  quandl?: string;
  
  // News and Sentiment APIs
  newsApi?: string;
  finnhub?: string;
}

// Data Source Configuration
export interface DataSourceConfig {
  // Controls whether to use mock data when API calls fail
  useMockDataAsFallback: boolean;
  
  // Controls whether to use mock data even when API keys are available (for testing)
  forceMockData: boolean;
  
  // Controls whether to cache API responses
  enableApiCache: boolean;
  
  // Cache expiration times in milliseconds
  cacheTTL: {
    marketData: number;
    fundamentalData: number;
    newsData: number;
    portfolioData: number;
  };
}

// Default API Keys (empty by default - will use mock data)
export const API_KEYS: ApiKeysConfig = {
  // Add your API keys here
  // Example:
  // alphaVantage: 'YOUR_ALPHA_VANTAGE_API_KEY',
  // polygon: 'YOUR_POLYGON_API_KEY',
};

// Default Data Source Configuration
export const DATA_SOURCE_CONFIG: DataSourceConfig = {
  useMockDataAsFallback: true,
  forceMockData: false,
  enableApiCache: true,
  cacheTTL: {
    marketData: 60000, // 1 minute
    fundamentalData: 86400000, // 24 hours
    newsData: 300000, // 5 minutes
    portfolioData: 60000, // 1 minute
  }
};

/**
 * Checks if an API key is configured
 * @param keyName The name of the API key to check
 * @returns True if the API key is configured, false otherwise
 */
export function isApiKeyConfigured(keyName: keyof ApiKeysConfig): boolean {
  if (DATA_SOURCE_CONFIG.forceMockData) {
    return false;
  }
  
  const key = API_KEYS[keyName];
  
  if (!key) {
    return false;
  }
  
  if (typeof key === 'string') {
    return key.trim().length > 0;
  }
  
  if (typeof key === 'object') {
    // For complex API configurations like Alpaca
    return Object.values(key).every(value => 
      typeof value === 'boolean' || (typeof value === 'string' && value.trim().length > 0)
    );
  }
  
  return false;
}

/**
 * Determines whether to use real API data or mock data
 * @param apiName The name of the API to check
 * @returns True if real API data should be used, false for mock data
 */
export function useRealData(apiName: keyof ApiKeysConfig): boolean {
  return isApiKeyConfigured(apiName) && !DATA_SOURCE_CONFIG.forceMockData;
}

/**
 * Updates API keys configuration
 * @param newKeys The new API keys configuration
 */
export function updateApiKeys(newKeys: Partial<ApiKeysConfig>): void {
  Object.assign(API_KEYS, newKeys);
}

/**
 * Updates data source configuration
 * @param newConfig The new data source configuration
 */
export function updateDataSourceConfig(newConfig: Partial<DataSourceConfig>): void {
  Object.assign(DATA_SOURCE_CONFIG, newConfig);
}