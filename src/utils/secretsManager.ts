/**
 * Secrets Manager
 * 
 * This utility provides secure handling of sensitive information like API keys.
 * It uses the browser's localStorage with encryption for development and
 * environment variables for production deployments.
 */

import CryptoJS from 'crypto-js';
import { currentEnvironment } from '../config/environments';

// Encryption key - in a real app, this would be more securely managed
const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY || 'hedge-fund-app-secret-key';

// Secret types
export interface Secrets {
  apiKeys: {
    alphaVantage?: string;
    polygon?: string;
    iexCloud?: string;
    financialModelingPrep?: string;
    quandl?: string;
    newsApi?: string;
    finnhub?: string;
    alpaca?: string;
    interactiveBrokers?: string;
  };
  credentials: {
    [key: string]: string;
  };
}

/**
 * Secrets Manager class
 */
class SecretsManager {
  private static instance: SecretsManager;
  private secrets: Secrets;
  private storageKey = 'hedge-fund-app-secrets';
  
  private constructor() {
    this.secrets = {
      apiKeys: {},
      credentials: {}
    };
    
    // Load secrets on initialization
    this.loadSecrets();
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): SecretsManager {
    if (!SecretsManager.instance) {
      SecretsManager.instance = new SecretsManager();
    }
    return SecretsManager.instance;
  }
  
  /**
   * Get an API key
   * @param provider - API provider name
   * @returns API key or undefined if not found
   */
  public getApiKey(provider: keyof Secrets['apiKeys']): string | undefined {
    // In production, try to get from environment variables first
    if (currentEnvironment === 'production') {
      const envKey = process.env[`REACT_APP_${provider.toUpperCase()}_API_KEY`];
      if (envKey) return envKey;
    }
    
    return this.secrets.apiKeys[provider];
  }
  
  /**
   * Set an API key
   * @param provider - API provider name
   * @param key - API key
   */
  public setApiKey(provider: keyof Secrets['apiKeys'], key: string): void {
    this.secrets.apiKeys[provider] = key;
    this.saveSecrets();
  }
  
  /**
   * Get a credential
   * @param key - Credential key
   * @returns Credential value or undefined if not found
   */
  public getCredential(key: string): string | undefined {
    // In production, try to get from environment variables first
    if (currentEnvironment === 'production') {
      const envValue = process.env[`REACT_APP_${key.toUpperCase()}`];
      if (envValue) return envValue;
    }
    
    return this.secrets.credentials[key];
  }
  
  /**
   * Set a credential
   * @param key - Credential key
   * @param value - Credential value
   */
  public setCredential(key: string, value: string): void {
    this.secrets.credentials[key] = value;
    this.saveSecrets();
  }
  
  /**
   * Clear all secrets
   */
  public clearSecrets(): void {
    this.secrets = {
      apiKeys: {},
      credentials: {}
    };
    
    // Remove from localStorage
    localStorage.removeItem(this.storageKey);
  }
  
  /**
   * Check if an API key is set
   * @param provider - API provider name
   * @returns True if the API key is set
   */
  public hasApiKey(provider: keyof Secrets['apiKeys']): boolean {
    // Check environment variables in production
    if (currentEnvironment === 'production') {
      const envKey = process.env[`REACT_APP_${provider.toUpperCase()}_API_KEY`];
      if (envKey) return true;
    }
    
    return !!this.secrets.apiKeys[provider];
  }
  
  /**
   * Load secrets from storage
   */
  private loadSecrets(): void {
    try {
      // In production, secrets are loaded from environment variables
      if (currentEnvironment === 'production') {
        this.loadSecretsFromEnv();
        return;
      }
      
      // In development, load from localStorage with encryption
      const encryptedSecrets = localStorage.getItem(this.storageKey);
      if (encryptedSecrets) {
        const decrypted = CryptoJS.AES.decrypt(encryptedSecrets, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
        this.secrets = JSON.parse(decrypted);
      }
    } catch (error) {
      console.error('Error loading secrets:', error);
      // If there's an error, reset secrets to prevent using corrupted data
      this.secrets = {
        apiKeys: {},
        credentials: {}
      };
    }
  }
  
  /**
   * Save secrets to storage
   */
  private saveSecrets(): void {
    try {
      // Only save to localStorage in development
      if (currentEnvironment !== 'production') {
        const encrypted = CryptoJS.AES.encrypt(JSON.stringify(this.secrets), ENCRYPTION_KEY).toString();
        localStorage.setItem(this.storageKey, encrypted);
      }
    } catch (error) {
      console.error('Error saving secrets:', error);
    }
  }
  
  /**
   * Load secrets from environment variables
   */
  private loadSecretsFromEnv(): void {
    // API keys
    const apiProviders: Array<keyof Secrets['apiKeys']> = [
      'alphaVantage', 'polygon', 'iexCloud', 'financialModelingPrep',
      'quandl', 'newsApi', 'finnhub', 'alpaca', 'interactiveBrokers'
    ];
    
    apiProviders.forEach(provider => {
      const envKey = process.env[`REACT_APP_${provider.toUpperCase()}_API_KEY`];
      if (envKey) {
        this.secrets.apiKeys[provider] = envKey;
      }
    });
    
    // Other credentials could be loaded here if needed
  }
}

// Export singleton instance
export const secretsManager = SecretsManager.getInstance();

// Export a hook for React components
export function useSecretsManager() {
  return {
    getApiKey: (provider: keyof Secrets['apiKeys']) => secretsManager.getApiKey(provider),
    setApiKey: (provider: keyof Secrets['apiKeys'], key: string) => secretsManager.setApiKey(provider, key),
    hasApiKey: (provider: keyof Secrets['apiKeys']) => secretsManager.hasApiKey(provider),
    getCredential: (key: string) => secretsManager.getCredential(key),
    setCredential: (key: string, value: string) => secretsManager.setCredential(key, value),
    clearSecrets: () => secretsManager.clearSecrets()
  };
}