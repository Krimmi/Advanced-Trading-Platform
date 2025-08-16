/**
 * Data Encryption Service
 * 
 * This service provides encryption and decryption capabilities for sensitive data,
 * supporting field-level encryption, data masking, and secure storage.
 */

import * as crypto from 'crypto';
import { AuditLogService, AuditEventType, AuditSeverity } from '../compliance/AuditLogService';

// Encryption algorithm
export enum EncryptionAlgorithm {
  AES_256_CBC = 'aes-256-cbc',
  AES_256_GCM = 'aes-256-gcm',
  AES_256_CTR = 'aes-256-ctr'
}

// Encryption key type
export enum KeyType {
  MASTER = 'master',
  DATA = 'data',
  USER = 'user',
  TRANSACTION = 'transaction'
}

// Encryption key
export interface EncryptionKey {
  id: string;
  type: KeyType;
  algorithm: EncryptionAlgorithm;
  key: string;
  iv?: string;
  createdAt: Date;
  expiresAt?: Date;
  rotatedAt?: Date;
  version: number;
  isActive: boolean;
}

// Encrypted data
export interface EncryptedData {
  data: string;
  keyId: string;
  algorithm: EncryptionAlgorithm;
  iv: string;
  tag?: string;
  metadata?: Record<string, any>;
}

// Field encryption options
export interface FieldEncryptionOptions {
  keyType?: KeyType;
  algorithm?: EncryptionAlgorithm;
  metadata?: Record<string, any>;
}

// Data masking options
export interface DataMaskingOptions {
  showFirstChars?: number;
  showLastChars?: number;
  maskChar?: string;
  preserveFormat?: boolean;
}

/**
 * Data Encryption Service
 */
export class DataEncryptionService {
  private static instance: DataEncryptionService;
  private keys: Map<string, EncryptionKey> = new Map();
  private activeKeys: Map<KeyType, string> = new Map();
  private auditLogService: AuditLogService;
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): DataEncryptionService {
    if (!DataEncryptionService.instance) {
      DataEncryptionService.instance = new DataEncryptionService();
    }
    return DataEncryptionService.instance;
  }
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.auditLogService = AuditLogService.getInstance();
    this.initializeKeys();
  }
  
  /**
   * Initialize encryption keys
   */
  private initializeKeys(): void {
    // In a real implementation, keys would be loaded from a secure key vault
    // For now, we'll generate some initial keys
    
    // Create master key
    const masterKey = this.generateKey(KeyType.MASTER, EncryptionAlgorithm.AES_256_GCM);
    this.keys.set(masterKey.id, masterKey);
    this.activeKeys.set(KeyType.MASTER, masterKey.id);
    
    // Create data key
    const dataKey = this.generateKey(KeyType.DATA, EncryptionAlgorithm.AES_256_CBC);
    this.keys.set(dataKey.id, dataKey);
    this.activeKeys.set(KeyType.DATA, dataKey.id);
    
    // Create user key
    const userKey = this.generateKey(KeyType.USER, EncryptionAlgorithm.AES_256_CBC);
    this.keys.set(userKey.id, userKey);
    this.activeKeys.set(KeyType.USER, userKey.id);
    
    // Create transaction key
    const transactionKey = this.generateKey(KeyType.TRANSACTION, EncryptionAlgorithm.AES_256_GCM);
    this.keys.set(transactionKey.id, transactionKey);
    this.activeKeys.set(KeyType.TRANSACTION, transactionKey.id);
  }
  
  /**
   * Generate a new encryption key
   * @param type Key type
   * @param algorithm Encryption algorithm
   * @returns Generated key
   */
  private generateKey(
    type: KeyType,
    algorithm: EncryptionAlgorithm
  ): EncryptionKey {
    const id = this.generateId();
    const now = new Date();
    
    // Generate a random key
    const keyBuffer = crypto.randomBytes(32); // 256 bits
    const key = keyBuffer.toString('hex');
    
    // Generate a random IV if needed
    let iv: string | undefined;
    if (algorithm !== EncryptionAlgorithm.AES_256_GCM) {
      const ivBuffer = crypto.randomBytes(16); // 128 bits
      iv = ivBuffer.toString('hex');
    }
    
    // Create the key
    const encryptionKey: EncryptionKey = {
      id,
      type,
      algorithm,
      key,
      iv,
      createdAt: now,
      version: 1,
      isActive: true
    };
    
    return encryptionKey;
  }
  
  /**
   * Rotate a key
   * @param type Key type to rotate
   * @returns New active key
   */
  public rotateKey(type: KeyType): EncryptionKey {
    // Get the current active key
    const currentKeyId = this.activeKeys.get(type);
    const currentKey = currentKeyId ? this.keys.get(currentKeyId) : undefined;
    
    if (!currentKey) {
      throw new Error(`No active key found for type: ${type}`);
    }
    
    // Generate a new key with the same algorithm
    const newKey = this.generateKey(type, currentKey.algorithm);
    
    // Increment the version
    newKey.version = currentKey.version + 1;
    
    // Mark the current key as inactive
    currentKey.isActive = false;
    currentKey.rotatedAt = new Date();
    
    // Store the keys
    this.keys.set(currentKey.id, currentKey);
    this.keys.set(newKey.id, newKey);
    
    // Update the active key
    this.activeKeys.set(type, newKey.id);
    
    // Log the key rotation
    this.auditLogService.log({
      eventType: AuditEventType.SYSTEM_CONFIG_CHANGED,
      severity: AuditSeverity.INFO,
      resourceType: 'encryption_key',
      resourceId: newKey.id,
      action: 'rotate_encryption_key',
      details: {
        keyType: type,
        previousKeyId: currentKey.id,
        newKeyId: newKey.id,
        version: newKey.version
      },
      status: 'success'
    });
    
    return newKey;
  }
  
  /**
   * Get the active key for a type
   * @param type Key type
   * @returns Active key
   */
  public getActiveKey(type: KeyType): EncryptionKey {
    const keyId = this.activeKeys.get(type);
    
    if (!keyId) {
      throw new Error(`No active key found for type: ${type}`);
    }
    
    const key = this.keys.get(keyId);
    
    if (!key) {
      throw new Error(`Key not found: ${keyId}`);
    }
    
    return key;
  }
  
  /**
   * Get a key by ID
   * @param keyId Key ID
   * @returns Key or null if not found
   */
  public getKey(keyId: string): EncryptionKey | null {
    return this.keys.get(keyId) || null;
  }
  
  /**
   * Encrypt data
   * @param data Data to encrypt
   * @param options Encryption options
   * @returns Encrypted data
   */
  public encrypt(
    data: string,
    options: FieldEncryptionOptions = {}
  ): EncryptedData {
    const {
      keyType = KeyType.DATA,
      algorithm,
      metadata
    } = options;
    
    // Get the active key for the specified type
    const key = this.getActiveKey(keyType);
    
    // Use the key's algorithm if not specified
    const encryptionAlgorithm = algorithm || key.algorithm;
    
    // Generate a random IV for this encryption
    const ivBuffer = crypto.randomBytes(16); // 128 bits
    const iv = ivBuffer.toString('hex');
    
    let encryptedData: string;
    let tag: string | undefined;
    
    switch (encryptionAlgorithm) {
      case EncryptionAlgorithm.AES_256_GCM:
        // GCM mode provides authentication
        const cipher = crypto.createCipheriv(
          'aes-256-gcm',
          Buffer.from(key.key, 'hex'),
          ivBuffer
        );
        
        encryptedData = cipher.update(data, 'utf8', 'hex');
        encryptedData += cipher.final('hex');
        
        // Get the authentication tag
        const authTag = cipher.getAuthTag();
        tag = authTag.toString('hex');
        break;
        
      case EncryptionAlgorithm.AES_256_CBC:
      case EncryptionAlgorithm.AES_256_CTR:
      default:
        // CBC and CTR modes
        const cipherStandard = crypto.createCipheriv(
          encryptionAlgorithm,
          Buffer.from(key.key, 'hex'),
          ivBuffer
        );
        
        encryptedData = cipherStandard.update(data, 'utf8', 'hex');
        encryptedData += cipherStandard.final('hex');
        break;
    }
    
    return {
      data: encryptedData,
      keyId: key.id,
      algorithm: encryptionAlgorithm,
      iv,
      tag,
      metadata
    };
  }
  
  /**
   * Decrypt data
   * @param encryptedData Encrypted data
   * @returns Decrypted data
   */
  public decrypt(encryptedData: EncryptedData): string {
    const { data, keyId, algorithm, iv, tag } = encryptedData;
    
    // Get the key
    const key = this.getKey(keyId);
    
    if (!key) {
      throw new Error(`Key not found: ${keyId}`);
    }
    
    let decryptedData: string;
    
    switch (algorithm) {
      case EncryptionAlgorithm.AES_256_GCM:
        // GCM mode requires the authentication tag
        if (!tag) {
          throw new Error('Authentication tag is required for GCM mode');
        }
        
        const decipher = crypto.createDecipheriv(
          'aes-256-gcm',
          Buffer.from(key.key, 'hex'),
          Buffer.from(iv, 'hex')
        );
        
        // Set the authentication tag
        decipher.setAuthTag(Buffer.from(tag, 'hex'));
        
        decryptedData = decipher.update(data, 'hex', 'utf8');
        decryptedData += decipher.final('utf8');
        break;
        
      case EncryptionAlgorithm.AES_256_CBC:
      case EncryptionAlgorithm.AES_256_CTR:
      default:
        // CBC and CTR modes
        const decipherStandard = crypto.createDecipheriv(
          algorithm,
          Buffer.from(key.key, 'hex'),
          Buffer.from(iv, 'hex')
        );
        
        decryptedData = decipherStandard.update(data, 'hex', 'utf8');
        decryptedData += decipherStandard.final('utf8');
        break;
    }
    
    return decryptedData;
  }
  
  /**
   * Encrypt an object's fields
   * @param obj Object to encrypt
   * @param fields Fields to encrypt
   * @param options Encryption options
   * @returns Object with encrypted fields
   */
  public encryptFields<T extends Record<string, any>>(
    obj: T,
    fields: (keyof T)[],
    options: FieldEncryptionOptions = {}
  ): T {
    const result = { ...obj };
    
    for (const field of fields) {
      if (result[field] !== undefined && result[field] !== null) {
        const value = result[field];
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        
        // Encrypt the field
        const encrypted = this.encrypt(stringValue, options);
        
        // Store the encrypted data
        result[field] = encrypted;
      }
    }
    
    return result;
  }
  
  /**
   * Decrypt an object's fields
   * @param obj Object to decrypt
   * @param fields Fields to decrypt
   * @returns Object with decrypted fields
   */
  public decryptFields<T extends Record<string, any>>(
    obj: T,
    fields: (keyof T)[]
  ): T {
    const result = { ...obj };
    
    for (const field of fields) {
      if (result[field] !== undefined && result[field] !== null) {
        const encrypted = result[field] as unknown as EncryptedData;
        
        // Decrypt the field
        const decrypted = this.decrypt(encrypted);
        
        // Parse JSON if needed
        try {
          result[field] = JSON.parse(decrypted);
        } catch (e) {
          // Not JSON, use as string
          result[field] = decrypted as any;
        }
      }
    }
    
    return result;
  }
  
  /**
   * Mask sensitive data
   * @param data Data to mask
   * @param options Masking options
   * @returns Masked data
   */
  public maskData(
    data: string,
    options: DataMaskingOptions = {}
  ): string {
    const {
      showFirstChars = 0,
      showLastChars = 0,
      maskChar = '*',
      preserveFormat = false
    } = options;
    
    if (!data) {
      return '';
    }
    
    if (data.length <= showFirstChars + showLastChars) {
      // Data is too short to mask
      return maskChar.repeat(data.length);
    }
    
    const firstPart = data.substring(0, showFirstChars);
    const lastPart = data.substring(data.length - showLastChars);
    
    let maskedPart: string;
    
    if (preserveFormat) {
      // Preserve format (spaces, dashes, etc.)
      maskedPart = data
        .substring(showFirstChars, data.length - showLastChars)
        .replace(/[^\s\-\/]/g, maskChar);
    } else {
      // Replace with mask characters
      maskedPart = maskChar.repeat(data.length - showFirstChars - showLastChars);
    }
    
    return firstPart + maskedPart + lastPart;
  }
  
  /**
   * Mask a credit card number
   * @param cardNumber Credit card number
   * @returns Masked card number
   */
  public maskCreditCard(cardNumber: string): string {
    return this.maskData(cardNumber, {
      showFirstChars: 4,
      showLastChars: 4,
      preserveFormat: true
    });
  }
  
  /**
   * Mask an email address
   * @param email Email address
   * @returns Masked email
   */
  public maskEmail(email: string): string {
    if (!email || !email.includes('@')) {
      return email;
    }
    
    const [username, domain] = email.split('@');
    
    // Mask username
    const maskedUsername = this.maskData(username, {
      showFirstChars: 2,
      showLastChars: 0
    });
    
    return `${maskedUsername}@${domain}`;
  }
  
  /**
   * Mask a phone number
   * @param phoneNumber Phone number
   * @returns Masked phone number
   */
  public maskPhoneNumber(phoneNumber: string): string {
    return this.maskData(phoneNumber, {
      showFirstChars: 0,
      showLastChars: 4,
      preserveFormat: true
    });
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
export const dataEncryptionService = DataEncryptionService.getInstance();