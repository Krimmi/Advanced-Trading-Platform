/**
 * Environment Configuration Service
 * 
 * Provides access to environment-specific configuration values with
 * appropriate fallbacks and validation.
 */
export class EnvironmentConfig {
  private static instance: EnvironmentConfig;
  private config: Record<string, any> = {};
  private secrets: Record<string, string> = {};
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.loadEnvironmentVariables();
  }
  
  /**
   * Get the singleton instance
   * @returns The singleton instance
   */
  public static getInstance(): EnvironmentConfig {
    if (!EnvironmentConfig.instance) {
      EnvironmentConfig.instance = new EnvironmentConfig();
    }
    return EnvironmentConfig.instance;
  }
  
  /**
   * Load environment variables
   */
  private loadEnvironmentVariables(): void {
    // Load from process.env in Node.js or from window._env in browser
    const env = typeof process !== 'undefined' && process.env 
      ? process.env 
      : (typeof window !== 'undefined' && (window as any)._env) 
        ? (window as any)._env 
        : {};
    
    // API keys and secrets
    this.secrets = {
      ALPACA_API_KEY: this.getEnvVar(env, 'REACT_APP_ALPACA_API_KEY', ''),
      ALPACA_API_SECRET: this.getEnvVar(env, 'REACT_APP_ALPACA_API_SECRET', ''),
      IEX_API_KEY: this.getEnvVar(env, 'REACT_APP_IEX_API_KEY', ''),
      POLYGON_API_KEY: this.getEnvVar(env, 'REACT_APP_POLYGON_API_KEY', '')
    };
    
    // General configuration
    this.config = {
      // API endpoints
      ALPACA_BASE_URL: this.getEnvVar(env, 'REACT_APP_ALPACA_BASE_URL', 'https://paper-api.alpaca.markets'),
      ALPACA_DATA_URL: this.getEnvVar(env, 'REACT_APP_ALPACA_DATA_URL', 'https://data.alpaca.markets'),
      ALPACA_WS_URL: this.getEnvVar(env, 'REACT_APP_ALPACA_WS_URL', 'wss://stream.data.alpaca.markets/v2'),
      IEX_BASE_URL: this.getEnvVar(env, 'REACT_APP_IEX_BASE_URL', 'https://cloud.iexapis.com/stable'),
      POLYGON_BASE_URL: this.getEnvVar(env, 'REACT_APP_POLYGON_BASE_URL', 'https://api.polygon.io'),
      
      // Feature flags
      ENABLE_REAL_TIME_DATA: this.getEnvVar(env, 'REACT_APP_ENABLE_REAL_TIME_DATA', 'true') === 'true',
      ENABLE_ML_PREDICTIONS: this.getEnvVar(env, 'REACT_APP_ENABLE_ML_PREDICTIONS', 'true') === 'true',
      ENABLE_TRADING: this.getEnvVar(env, 'REACT_APP_ENABLE_TRADING', 'false') === 'true',
      
      // Performance settings
      CACHE_DURATION: parseInt(this.getEnvVar(env, 'REACT_APP_CACHE_DURATION', '300'), 10),
      MAX_CONCURRENT_REQUESTS: parseInt(this.getEnvVar(env, 'REACT_APP_MAX_CONCURRENT_REQUESTS', '5'), 10),
      
      // Environment info
      NODE_ENV: this.getEnvVar(env, 'NODE_ENV', 'development'),
      IS_PRODUCTION: this.getEnvVar(env, 'NODE_ENV', 'development') === 'production'
    };
    
    console.log('Environment configuration loaded');
  }
  
  /**
   * Get an environment variable with fallback
   * @param env Environment object
   * @param key Variable key
   * @param defaultValue Default value if not found
   * @returns The environment variable value or default
   */
  private getEnvVar(env: any, key: string, defaultValue: string): string {
    return env[key] !== undefined ? env[key] : defaultValue;
  }
  
  /**
   * Get a configuration value
   * @param key Configuration key
   * @param defaultValue Default value if not found
   * @returns The configuration value
   */
  public get<T>(key: string, defaultValue?: T): T {
    return (this.config[key] !== undefined ? this.config[key] : defaultValue) as T;
  }
  
  /**
   * Get a secret value
   * @param key Secret key
   * @returns The secret value or empty string if not found
   */
  public getSecret(key: string): string {
    return this.secrets[key] || '';
  }
  
  /**
   * Check if a feature is enabled
   * @param featureKey Feature key
   * @returns True if the feature is enabled
   */
  public isFeatureEnabled(featureKey: string): boolean {
    const key = `ENABLE_${featureKey.toUpperCase()}`;
    return this.get<boolean>(key, false);
  }
  
  /**
   * Update configuration at runtime
   * @param key Configuration key
   * @param value New value
   */
  public updateConfig(key: string, value: any): void {
    this.config[key] = value;
  }
  
  /**
   * Get the current environment (development, staging, production)
   * @returns The current environment
   */
  public getEnvironment(): 'development' | 'staging' | 'production' {
    const nodeEnv = this.get<string>('NODE_ENV', 'development');
    
    if (nodeEnv === 'production') {
      return 'production';
    } else if (nodeEnv === 'staging') {
      return 'staging';
    } else {
      return 'development';
    }
  }
  
  /**
   * Check if running in production environment
   * @returns True if in production
   */
  public isProduction(): boolean {
    return this.getEnvironment() === 'production';
  }
  
  /**
   * Get API configuration for a specific provider
   * @param provider Provider name
   * @returns API configuration
   */
  public getApiConfig(provider: 'alpaca' | 'iex' | 'polygon'): Record<string, any> {
    switch (provider) {
      case 'alpaca':
        return {
          apiKey: this.getSecret('ALPACA_API_KEY'),
          apiSecret: this.getSecret('ALPACA_API_SECRET'),
          baseUrl: this.get<string>('ALPACA_BASE_URL'),
          dataUrl: this.get<string>('ALPACA_DATA_URL'),
          wsUrl: this.get<string>('ALPACA_WS_URL'),
          paperTrading: !this.get<boolean>('ENABLE_TRADING', false)
        };
        
      case 'iex':
        return {
          apiKey: this.getSecret('IEX_API_KEY'),
          baseUrl: this.get<string>('IEX_BASE_URL')
        };
        
      case 'polygon':
        return {
          apiKey: this.getSecret('POLYGON_API_KEY'),
          baseUrl: this.get<string>('POLYGON_BASE_URL')
        };
        
      default:
        throw new Error(`Unknown API provider: ${provider}`);
    }
  }
}

// Export a singleton instance
export const environmentConfig = EnvironmentConfig.getInstance();