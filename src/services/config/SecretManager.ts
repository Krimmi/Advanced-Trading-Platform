import { environmentConfig } from './EnvironmentConfig';

/**
 * Secret Manager Service
 * 
 * Provides secure handling of API keys and other sensitive information.
 * Implements key rotation, obfuscation, and secure access patterns.
 */
export class SecretManager {
  private static instance: SecretManager;
  private secrets: Map<string, SecretInfo> = new Map();
  private keyRotationSchedule: Map<string, Date> = new Map();
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.initializeSecrets();
  }
  
  /**
   * Get the singleton instance
   * @returns The singleton instance
   */
  public static getInstance(): SecretManager {
    if (!SecretManager.instance) {
      SecretManager.instance = new SecretManager();
    }
    return SecretManager.instance;
  }
  
  /**
   * Initialize secrets from environment configuration
   */
  private initializeSecrets(): void {
    // Load API keys from environment config
    this.setSecret('ALPACA_API_KEY', environmentConfig.getSecret('ALPACA_API_KEY'), {
      description: 'Alpaca Markets API Key',
      rotationPeriodDays: 90,
      lastRotated: new Date()
    });
    
    this.setSecret('ALPACA_API_SECRET', environmentConfig.getSecret('ALPACA_API_SECRET'), {
      description: 'Alpaca Markets API Secret',
      rotationPeriodDays: 90,
      lastRotated: new Date()
    });
    
    this.setSecret('IEX_API_KEY', environmentConfig.getSecret('IEX_API_KEY'), {
      description: 'IEX Cloud API Key',
      rotationPeriodDays: 90,
      lastRotated: new Date()
    });
    
    this.setSecret('POLYGON_API_KEY', environmentConfig.getSecret('POLYGON_API_KEY'), {
      description: 'Polygon.io API Key',
      rotationPeriodDays: 90,
      lastRotated: new Date()
    });
    
    // Schedule key rotation checks
    this.scheduleKeyRotationChecks();
  }
  
  /**
   * Set a secret
   * @param key Secret key
   * @param value Secret value
   * @param metadata Secret metadata
   */
  public setSecret(key: string, value: string, metadata: SecretMetadata = {}): void {
    const now = new Date();
    
    this.secrets.set(key, {
      value,
      description: metadata.description || '',
      created: metadata.created || now,
      lastRotated: metadata.lastRotated || now,
      rotationPeriodDays: metadata.rotationPeriodDays || 90,
      isActive: true
    });
    
    // Schedule key rotation
    if (metadata.rotationPeriodDays) {
      const rotationDate = new Date(now);
      rotationDate.setDate(rotationDate.getDate() + metadata.rotationPeriodDays);
      this.keyRotationSchedule.set(key, rotationDate);
    }
  }
  
  /**
   * Get a secret
   * @param key Secret key
   * @returns Secret value or empty string if not found
   */
  public getSecret(key: string): string {
    const secretInfo = this.secrets.get(key);
    
    if (!secretInfo || !secretInfo.isActive) {
      console.warn(`Attempted to access inactive or non-existent secret: ${key}`);
      return '';
    }
    
    // Log access for audit purposes (in production, this would go to a secure audit log)
    if (!environmentConfig.isProduction()) {
      console.log(`Secret accessed: ${key} at ${new Date().toISOString()}`);
    }
    
    return secretInfo.value;
  }
  
  /**
   * Get a masked version of a secret (for display purposes)
   * @param key Secret key
   * @returns Masked secret value
   */
  public getMaskedSecret(key: string): string {
    const secretInfo = this.secrets.get(key);
    
    if (!secretInfo || !secretInfo.isActive) {
      return '';
    }
    
    const value = secretInfo.value;
    if (!value || value.length < 8) {
      return '********';
    }
    
    // Show first 4 and last 4 characters, mask the rest
    return `${value.substring(0, 4)}${'*'.repeat(value.length - 8)}${value.substring(value.length - 4)}`;
  }
  
  /**
   * Check if a secret exists and is active
   * @param key Secret key
   * @returns True if the secret exists and is active
   */
  public hasActiveSecret(key: string): boolean {
    const secretInfo = this.secrets.get(key);
    return !!secretInfo && secretInfo.isActive && !!secretInfo.value;
  }
  
  /**
   * Rotate a secret
   * @param key Secret key
   * @param newValue New secret value
   */
  public rotateSecret(key: string, newValue: string): void {
    const secretInfo = this.secrets.get(key);
    
    if (!secretInfo) {
      throw new Error(`Secret not found: ${key}`);
    }
    
    // Create a new secret with the new value
    this.secrets.set(key, {
      ...secretInfo,
      value: newValue,
      lastRotated: new Date()
    });
    
    // Update rotation schedule
    if (secretInfo.rotationPeriodDays) {
      const rotationDate = new Date();
      rotationDate.setDate(rotationDate.getDate() + secretInfo.rotationPeriodDays);
      this.keyRotationSchedule.set(key, rotationDate);
    }
    
    console.log(`Secret rotated: ${key} at ${new Date().toISOString()}`);
  }
  
  /**
   * Deactivate a secret
   * @param key Secret key
   */
  public deactivateSecret(key: string): void {
    const secretInfo = this.secrets.get(key);
    
    if (!secretInfo) {
      return;
    }
    
    // Deactivate the secret
    this.secrets.set(key, {
      ...secretInfo,
      isActive: false
    });
    
    // Remove from rotation schedule
    this.keyRotationSchedule.delete(key);
    
    console.log(`Secret deactivated: ${key} at ${new Date().toISOString()}`);
  }
  
  /**
   * Get all secrets (metadata only, no values)
   * @returns Array of secret metadata
   */
  public getAllSecretMetadata(): SecretMetadataInfo[] {
    return Array.from(this.secrets.entries()).map(([key, info]) => ({
      key,
      description: info.description,
      created: info.created,
      lastRotated: info.lastRotated,
      rotationPeriodDays: info.rotationPeriodDays,
      isActive: info.isActive,
      nextRotation: this.keyRotationSchedule.get(key)
    }));
  }
  
  /**
   * Check if any secrets need rotation
   * @returns Array of keys that need rotation
   */
  public checkForRotationNeeded(): string[] {
    const now = new Date();
    const needsRotation: string[] = [];
    
    for (const [key, rotationDate] of this.keyRotationSchedule.entries()) {
      if (rotationDate <= now) {
        needsRotation.push(key);
      }
    }
    
    return needsRotation;
  }
  
  /**
   * Schedule key rotation checks
   */
  private scheduleKeyRotationChecks(): void {
    // In a browser environment, we can't use setInterval for long periods
    // This is just for demonstration purposes
    if (typeof window !== 'undefined') {
      // Check once a day in browser
      const checkInterval = 24 * 60 * 60 * 1000; // 24 hours
      
      setInterval(() => {
        const needsRotation = this.checkForRotationNeeded();
        
        if (needsRotation.length > 0) {
          console.warn(`The following secrets need rotation: ${needsRotation.join(', ')}`);
          // In a real application, this would trigger a notification
        }
      }, checkInterval);
    }
  }
  
  /**
   * Get API credentials for a specific provider
   * @param provider Provider name
   * @returns API credentials
   */
  public getApiCredentials(provider: 'alpaca' | 'iex' | 'polygon'): Record<string, string> {
    switch (provider) {
      case 'alpaca':
        return {
          apiKey: this.getSecret('ALPACA_API_KEY'),
          apiSecret: this.getSecret('ALPACA_API_SECRET')
        };
        
      case 'iex':
        return {
          apiKey: this.getSecret('IEX_API_KEY')
        };
        
      case 'polygon':
        return {
          apiKey: this.getSecret('POLYGON_API_KEY')
        };
        
      default:
        throw new Error(`Unknown API provider: ${provider}`);
    }
  }
}

/**
 * Secret information interface
 */
interface SecretInfo {
  value: string;
  description: string;
  created: Date;
  lastRotated: Date;
  rotationPeriodDays: number;
  isActive: boolean;
}

/**
 * Secret metadata interface
 */
interface SecretMetadata {
  description?: string;
  created?: Date;
  lastRotated?: Date;
  rotationPeriodDays?: number;
}

/**
 * Secret metadata information interface (for display)
 */
interface SecretMetadataInfo {
  key: string;
  description: string;
  created: Date;
  lastRotated: Date;
  rotationPeriodDays: number;
  isActive: boolean;
  nextRotation?: Date;
}

// Export a singleton instance
export const secretManager = SecretManager.getInstance();