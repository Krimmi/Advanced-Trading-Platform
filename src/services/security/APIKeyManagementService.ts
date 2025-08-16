/**
 * API Key Management Service
 * 
 * This service provides secure management of API keys for external services,
 * including key rotation, access control, and usage tracking.
 */

import * as crypto from 'crypto';
import { AuditLogService, AuditEventType, AuditSeverity } from '../compliance/AuditLogService';
import { User } from '../auth/RBACService';

// API key status
export enum APIKeyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  REVOKED = 'revoked'
}

// API key type
export enum APIKeyType {
  ALPACA = 'alpaca',
  POLYGON = 'polygon',
  IEX = 'iex',
  FINANCIAL_MODELING_PREP = 'financial_modeling_prep',
  ALPHA_VANTAGE = 'alpha_vantage',
  QUANDL = 'quandl',
  FINNHUB = 'finnhub',
  NEWS_API = 'news_api',
  CUSTOM = 'custom'
}

// API key interface
export interface APIKey {
  id: string;
  name: string;
  type: APIKeyType;
  key: string;
  secret?: string;
  status: APIKeyStatus;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdBy: string;
  updatedBy: string;
  usageCount: number;
  usageLimit?: number;
  rateLimit?: number;
  environment: 'development' | 'staging' | 'production';
  metadata?: Record<string, any>;
}

// API key creation options
export interface APIKeyOptions {
  name: string;
  type: APIKeyType;
  key: string;
  secret?: string;
  expiresAt?: Date;
  usageLimit?: number;
  rateLimit?: number;
  environment: 'development' | 'staging' | 'production';
  metadata?: Record<string, any>;
}

/**
 * API Key Management Service
 */
export class APIKeyManagementService {
  private static instance: APIKeyManagementService;
  private apiKeys: Map<string, APIKey> = new Map();
  private auditLogService: AuditLogService;
  private readonly ENCRYPTION_KEY: string;
  private readonly ENCRYPTION_IV: string;
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): APIKeyManagementService {
    if (!APIKeyManagementService.instance) {
      APIKeyManagementService.instance = new APIKeyManagementService();
    }
    return APIKeyManagementService.instance;
  }
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.auditLogService = AuditLogService.getInstance();
    
    // In a real implementation, these would be loaded from environment variables or a secure vault
    // NEVER hardcode encryption keys in production code
    this.ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_KEY || 'a-very-secure-32-char-encryption-key';
    this.ENCRYPTION_IV = process.env.API_KEY_ENCRYPTION_IV || 'a-16-char-iv-val';
  }
  
  /**
   * Create a new API key
   * @param options API key options
   * @param user User creating the key
   * @returns Created API key
   */
  public createAPIKey(options: APIKeyOptions, user?: User): APIKey {
    const id = this.generateId();
    const now = new Date();
    
    // Encrypt sensitive data
    const encryptedKey = this.encrypt(options.key);
    const encryptedSecret = options.secret ? this.encrypt(options.secret) : undefined;
    
    const apiKey: APIKey = {
      id,
      name: options.name,
      type: options.type,
      key: encryptedKey,
      secret: encryptedSecret,
      status: APIKeyStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
      expiresAt: options.expiresAt,
      createdBy: user?.id || 'system',
      updatedBy: user?.id || 'system',
      usageCount: 0,
      usageLimit: options.usageLimit,
      rateLimit: options.rateLimit,
      environment: options.environment,
      metadata: options.metadata
    };
    
    this.apiKeys.set(id, apiKey);
    
    // Log the API key creation
    this.auditLogService.log({
      eventType: AuditEventType.API_KEY_CREATED,
      severity: AuditSeverity.INFO,
      user,
      resourceType: 'api_key',
      resourceId: id,
      action: 'create_api_key',
      details: {
        keyName: apiKey.name,
        keyType: apiKey.type,
        environment: apiKey.environment
      },
      status: 'success'
    });
    
    return {
      ...apiKey,
      key: options.key, // Return the unencrypted key to the caller
      secret: options.secret // Return the unencrypted secret to the caller
    };
  }
  
  /**
   * Get an API key by ID
   * @param id API key ID
   * @param includeSecrets Whether to include decrypted secrets
   * @returns API key or null if not found
   */
  public getAPIKey(id: string, includeSecrets: boolean = false): APIKey | null {
    const apiKey = this.apiKeys.get(id);
    
    if (!apiKey) {
      return null;
    }
    
    // Return a copy of the API key
    const result = { ...apiKey };
    
    if (includeSecrets) {
      // Decrypt sensitive data
      result.key = this.decrypt(result.key);
      if (result.secret) {
        result.secret = this.decrypt(result.secret);
      }
    } else {
      // Mask sensitive data
      result.key = this.maskString(this.decrypt(result.key));
      delete result.secret;
    }
    
    return result;
  }
  
  /**
   * Get all API keys
   * @param type Optional filter by key type
   * @param status Optional filter by key status
   * @param environment Optional filter by environment
   * @returns Array of API keys (with masked sensitive data)
   */
  public getAllAPIKeys(
    type?: APIKeyType,
    status?: APIKeyStatus,
    environment?: 'development' | 'staging' | 'production'
  ): APIKey[] {
    const keys = Array.from(this.apiKeys.values());
    
    // Apply filters
    let filteredKeys = keys;
    
    if (type) {
      filteredKeys = filteredKeys.filter(key => key.type === type);
    }
    
    if (status) {
      filteredKeys = filteredKeys.filter(key => key.status === status);
    }
    
    if (environment) {
      filteredKeys = filteredKeys.filter(key => key.environment === environment);
    }
    
    // Mask sensitive data
    return filteredKeys.map(key => ({
      ...key,
      key: this.maskString(this.decrypt(key.key)),
      secret: undefined
    }));
  }
  
  /**
   * Update an API key
   * @param id API key ID
   * @param updates Updates to apply
   * @param user User updating the key
   * @returns Updated API key or null if not found
   */
  public updateAPIKey(
    id: string,
    updates: Partial<Omit<APIKey, 'id' | 'createdAt' | 'createdBy'>>,
    user?: User
  ): APIKey | null {
    const apiKey = this.apiKeys.get(id);
    
    if (!apiKey) {
      return null;
    }
    
    // Create a copy of the updates
    const updatesToApply = { ...updates };
    
    // Encrypt sensitive data if provided
    if (updatesToApply.key) {
      updatesToApply.key = this.encrypt(updatesToApply.key);
    }
    
    if (updatesToApply.secret) {
      updatesToApply.secret = this.encrypt(updatesToApply.secret);
    }
    
    // Apply updates
    const updatedKey: APIKey = {
      ...apiKey,
      ...updatesToApply,
      updatedAt: new Date(),
      updatedBy: user?.id || updatesToApply.updatedBy || apiKey.updatedBy
    };
    
    this.apiKeys.set(id, updatedKey);
    
    // Log the API key update
    this.auditLogService.log({
      eventType: AuditEventType.API_KEY_UPDATED,
      severity: AuditSeverity.INFO,
      user,
      resourceType: 'api_key',
      resourceId: id,
      action: 'update_api_key',
      details: {
        keyName: updatedKey.name,
        keyType: updatedKey.type,
        updates: Object.keys(updates)
      },
      status: 'success'
    });
    
    // Return a copy with decrypted key (but not secret)
    return {
      ...updatedKey,
      key: this.decrypt(updatedKey.key),
      secret: undefined
    };
  }
  
  /**
   * Rotate an API key
   * @param id API key ID
   * @param newKey New API key
   * @param newSecret New API secret
   * @param user User rotating the key
   * @returns Updated API key or null if not found
   */
  public rotateAPIKey(
    id: string,
    newKey: string,
    newSecret?: string,
    user?: User
  ): APIKey | null {
    const updates: Partial<APIKey> = {
      key: newKey,
      secret: newSecret,
      updatedAt: new Date(),
      updatedBy: user?.id || 'system',
      status: APIKeyStatus.ACTIVE
    };
    
    const updatedKey = this.updateAPIKey(id, updates, user);
    
    if (updatedKey) {
      // Log the API key rotation
      this.auditLogService.log({
        eventType: AuditEventType.API_KEY_UPDATED,
        severity: AuditSeverity.INFO,
        user,
        resourceType: 'api_key',
        resourceId: id,
        action: 'rotate_api_key',
        details: {
          keyName: updatedKey.name,
          keyType: updatedKey.type
        },
        status: 'success'
      });
    }
    
    return updatedKey;
  }
  
  /**
   * Change the status of an API key
   * @param id API key ID
   * @param status New status
   * @param user User changing the status
   * @returns Updated API key or null if not found
   */
  public changeAPIKeyStatus(
    id: string,
    status: APIKeyStatus,
    user?: User
  ): APIKey | null {
    return this.updateAPIKey(id, { status }, user);
  }
  
  /**
   * Revoke an API key
   * @param id API key ID
   * @param user User revoking the key
   * @returns True if the key was revoked
   */
  public revokeAPIKey(id: string, user?: User): boolean {
    const result = this.changeAPIKeyStatus(id, APIKeyStatus.REVOKED, user);
    
    if (result) {
      // Log the API key revocation
      this.auditLogService.log({
        eventType: AuditEventType.API_KEY_DELETED,
        severity: AuditSeverity.WARNING,
        user,
        resourceType: 'api_key',
        resourceId: id,
        action: 'revoke_api_key',
        details: {
          keyName: result.name,
          keyType: result.type
        },
        status: 'success'
      });
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Delete an API key
   * @param id API key ID
   * @param user User deleting the key
   * @returns True if the key was deleted
   */
  public deleteAPIKey(id: string, user?: User): boolean {
    const apiKey = this.apiKeys.get(id);
    
    if (!apiKey) {
      return false;
    }
    
    this.apiKeys.delete(id);
    
    // Log the API key deletion
    this.auditLogService.log({
      eventType: AuditEventType.API_KEY_DELETED,
      severity: AuditSeverity.WARNING,
      user,
      resourceType: 'api_key',
      resourceId: id,
      action: 'delete_api_key',
      details: {
        keyName: apiKey.name,
        keyType: apiKey.type
      },
      status: 'success'
    });
    
    return true;
  }
  
  /**
   * Get API key by type and environment
   * @param type API key type
   * @param environment Environment
   * @param includeSecrets Whether to include decrypted secrets
   * @returns API key or null if not found
   */
  public getAPIKeyByType(
    type: APIKeyType,
    environment: 'development' | 'staging' | 'production',
    includeSecrets: boolean = false
  ): APIKey | null {
    // Find an active API key of the specified type and environment
    for (const apiKey of this.apiKeys.values()) {
      if (apiKey.type === type && apiKey.environment === environment && apiKey.status === APIKeyStatus.ACTIVE) {
        // Return a copy of the API key
        const result = { ...apiKey };
        
        if (includeSecrets) {
          // Decrypt sensitive data
          result.key = this.decrypt(result.key);
          if (result.secret) {
            result.secret = this.decrypt(result.secret);
          }
        } else {
          // Mask sensitive data
          result.key = this.maskString(this.decrypt(result.key));
          delete result.secret;
        }
        
        return result;
      }
    }
    
    return null;
  }
  
  /**
   * Record API key usage
   * @param id API key ID
   * @returns Updated usage count or -1 if the key was not found
   */
  public recordAPIKeyUsage(id: string): number {
    const apiKey = this.apiKeys.get(id);
    
    if (!apiKey) {
      return -1;
    }
    
    // Update usage count and last used timestamp
    apiKey.usageCount++;
    apiKey.lastUsedAt = new Date();
    
    // Check if the key has reached its usage limit
    if (apiKey.usageLimit && apiKey.usageCount >= apiKey.usageLimit) {
      apiKey.status = APIKeyStatus.EXPIRED;
      
      // Log the API key expiration
      this.auditLogService.log({
        eventType: AuditEventType.API_KEY_UPDATED,
        severity: AuditSeverity.WARNING,
        resourceType: 'api_key',
        resourceId: id,
        action: 'api_key_expired',
        details: {
          keyName: apiKey.name,
          keyType: apiKey.type,
          reason: 'Usage limit reached'
        },
        status: 'success'
      });
    }
    
    this.apiKeys.set(id, apiKey);
    
    return apiKey.usageCount;
  }
  
  /**
   * Check if an API key is valid
   * @param id API key ID
   * @returns True if the key is valid
   */
  public isAPIKeyValid(id: string): boolean {
    const apiKey = this.apiKeys.get(id);
    
    if (!apiKey) {
      return false;
    }
    
    // Check if the key is active
    if (apiKey.status !== APIKeyStatus.ACTIVE) {
      return false;
    }
    
    // Check if the key has expired
    if (apiKey.expiresAt && apiKey.expiresAt <= new Date()) {
      // Update the key status
      apiKey.status = APIKeyStatus.EXPIRED;
      this.apiKeys.set(id, apiKey);
      
      // Log the API key expiration
      this.auditLogService.log({
        eventType: AuditEventType.API_KEY_UPDATED,
        severity: AuditSeverity.WARNING,
        resourceType: 'api_key',
        resourceId: id,
        action: 'api_key_expired',
        details: {
          keyName: apiKey.name,
          keyType: apiKey.type,
          reason: 'Expiration date reached'
        },
        status: 'success'
      });
      
      return false;
    }
    
    // Check if the key has reached its usage limit
    if (apiKey.usageLimit && apiKey.usageCount >= apiKey.usageLimit) {
      // Update the key status
      apiKey.status = APIKeyStatus.EXPIRED;
      this.apiKeys.set(id, apiKey);
      
      // Log the API key expiration
      this.auditLogService.log({
        eventType: AuditEventType.API_KEY_UPDATED,
        severity: AuditSeverity.WARNING,
        resourceType: 'api_key',
        resourceId: id,
        action: 'api_key_expired',
        details: {
          keyName: apiKey.name,
          keyType: apiKey.type,
          reason: 'Usage limit reached'
        },
        status: 'success'
      });
      
      return false;
    }
    
    return true;
  }
  
  /**
   * Encrypt a string
   * @param text Text to encrypt
   * @returns Encrypted text
   */
  private encrypt(text: string): string {
    try {
      const cipher = crypto.createCipheriv(
        'aes-256-cbc',
        Buffer.from(this.ENCRYPTION_KEY),
        Buffer.from(this.ENCRYPTION_IV)
      );
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return encrypted;
    } catch (error) {
      console.error('Error encrypting data:', error);
      throw new Error('Failed to encrypt data');
    }
  }
  
  /**
   * Decrypt a string
   * @param encryptedText Encrypted text
   * @returns Decrypted text
   */
  private decrypt(encryptedText: string): string {
    try {
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(this.ENCRYPTION_KEY),
        Buffer.from(this.ENCRYPTION_IV)
      );
      
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Error decrypting data:', error);
      throw new Error('Failed to decrypt data');
    }
  }
  
  /**
   * Mask a string (e.g., for display)
   * @param text Text to mask
   * @returns Masked text
   */
  private maskString(text: string): string {
    if (!text || text.length <= 8) {
      return '********';
    }
    
    // Show first 4 and last 4 characters
    return text.substring(0, 4) + '********' + text.substring(text.length - 4);
  }
  
  /**
   * Generate a unique ID
   * @returns Unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }
}

// Export singleton instance
export const apiKeyManagementService = APIKeyManagementService.getInstance();