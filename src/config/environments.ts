/**
 * Environment-specific configuration
 * 
 * This file provides configuration values based on the current environment
 * (development, staging, production).
 */

// Environment types
export type Environment = 'development' | 'staging' | 'production';

// Base configuration interface
export interface EnvironmentConfig {
  apiUrl: string;
  wsUrl: string;
  enableMockData: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  cacheTTL: {
    marketData: number;
    fundamentalData: number;
    newsData: number;
    portfolioData: number;
    // New cache volatility levels
    lowVolatility: number;
    mediumVolatility: number;
    highVolatility: number;
  };
  features: {
    enableRealTimeData: boolean;
    enableTradingFeatures: boolean;
    enableMLFeatures: boolean;
    enableBacktesting: boolean;
    enableAnomalyDetection: boolean;
    enablePredictiveAnalytics: boolean;
  };
  monitoring: {
    sentryDsn: string;
    sentryEnvironment: string;
    sentryTracesSampleRate: number;
    performanceMonitoring: boolean;
    errorTracking: boolean;
  };
  featureFlagsUrl: string;
  version: string;
}

// Get environment variables with fallbacks
const getEnvVar = (name: string, fallback: string = ''): string => {
  return process.env[`REACT_APP_${name}`] || fallback;
};

// Environment-specific configurations
const environments: Record<Environment, EnvironmentConfig> = {
  development: {
    apiUrl: getEnvVar('API_URL', 'http://localhost:3001/api'),
    wsUrl: getEnvVar('WS_URL', 'ws://localhost:3001/ws'),
    enableMockData: true,
    logLevel: 'debug',
    cacheTTL: {
      marketData: 30000, // 30 seconds
      fundamentalData: 300000, // 5 minutes
      newsData: 60000, // 1 minute
      portfolioData: 30000, // 30 seconds
      // New cache volatility levels
      lowVolatility: 300000, // 5 minutes in development
      mediumVolatility: 60000, // 1 minute in development
      highVolatility: 30000 // 30 seconds in development
    },
    features: {
      enableRealTimeData: true,
      enableTradingFeatures: true,
      enableMLFeatures: true,
      enableBacktesting: true,
      enableAnomalyDetection: true,
      enablePredictiveAnalytics: true
    },
    monitoring: {
      sentryDsn: getEnvVar('SENTRY_DSN', ''),
      sentryEnvironment: 'development',
      sentryTracesSampleRate: 1.0, // 100% of transactions in development
      performanceMonitoring: true,
      errorTracking: true
    },
    featureFlagsUrl: getEnvVar('FEATURE_FLAGS_URL', 'http://localhost:3001/api/feature-flags'),
    version: getEnvVar('VERSION', '0.0.0-dev')
  },
  staging: {
    apiUrl: getEnvVar('API_URL', 'https://api.staging.hedgefund-app.com'),
    wsUrl: getEnvVar('WS_URL', 'wss://ws.staging.hedgefund-app.com'),
    enableMockData: false,
    logLevel: 'info',
    cacheTTL: {
      marketData: 60000, // 1 minute
      fundamentalData: 3600000, // 1 hour
      newsData: 300000, // 5 minutes
      portfolioData: 60000, // 1 minute
      // New cache volatility levels
      lowVolatility: 3600000, // 1 hour in staging
      mediumVolatility: 300000, // 5 minutes in staging
      highVolatility: 60000 // 1 minute in staging
    },
    features: {
      enableRealTimeData: true,
      enableTradingFeatures: true,
      enableMLFeatures: true,
      enableBacktesting: true,
      enableAnomalyDetection: true,
      enablePredictiveAnalytics: true
    },
    monitoring: {
      sentryDsn: getEnvVar('SENTRY_DSN', ''),
      sentryEnvironment: 'staging',
      sentryTracesSampleRate: 0.5, // 50% of transactions in staging
      performanceMonitoring: true,
      errorTracking: true
    },
    featureFlagsUrl: getEnvVar('FEATURE_FLAGS_URL', 'https://api.staging.hedgefund-app.com/feature-flags'),
    version: getEnvVar('VERSION', '0.0.0-staging')
  },
  production: {
    apiUrl: getEnvVar('API_URL', 'https://api.hedgefund-app.com'),
    wsUrl: getEnvVar('WS_URL', 'wss://ws.hedgefund-app.com'),
    enableMockData: false,
    logLevel: 'error',
    cacheTTL: {
      marketData: 60000, // 1 minute
      fundamentalData: 86400000, // 24 hours
      newsData: 300000, // 5 minutes
      portfolioData: 60000, // 1 minute
      // New cache volatility levels
      lowVolatility: 86400000, // 24 hours in production
      mediumVolatility: 3600000, // 1 hour in production
      highVolatility: 300000 // 5 minutes in production
    },
    features: {
      enableRealTimeData: true,
      enableTradingFeatures: true,
      enableMLFeatures: true,
      enableBacktesting: true,
      enableAnomalyDetection: true,
      enablePredictiveAnalytics: true
    },
    monitoring: {
      sentryDsn: getEnvVar('SENTRY_DSN', ''),
      sentryEnvironment: 'production',
      sentryTracesSampleRate: 0.2, // 20% of transactions in production
      performanceMonitoring: true,
      errorTracking: true
    },
    featureFlagsUrl: getEnvVar('FEATURE_FLAGS_URL', 'https://api.hedgefund-app.com/feature-flags'),
    version: getEnvVar('VERSION', '0.0.0')
  }
};

// Determine current environment
const getEnvironment = (): Environment => {
  const env = process.env.REACT_APP_ENV || process.env.NODE_ENV;
  
  switch (env) {
    case 'production':
      return 'production';
    case 'staging':
      return 'staging';
    default:
      return 'development';
  }
};

// Get current environment configuration
export const currentEnvironment = getEnvironment();
export const config = environments[currentEnvironment];

// Feature flag checking
export const isFeatureEnabled = (featureName: keyof EnvironmentConfig['features']): boolean => {
  return config.features[featureName];
};

// Export environment-specific configurations for direct access if needed
export const developmentConfig = environments.development;
export const stagingConfig = environments.staging;
export const productionConfig = environments.production;