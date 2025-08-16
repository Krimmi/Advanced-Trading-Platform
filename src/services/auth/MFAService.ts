/**
 * Multi-Factor Authentication (MFA) Service
 * 
 * This service provides multi-factor authentication functionality for the application,
 * supporting various authentication methods like TOTP, SMS, and email.
 */

import * as crypto from 'crypto';
import axios from 'axios';
import { User } from './RBACService';

// MFA method types
export enum MFAMethod {
  TOTP = 'totp',         // Time-based One-Time Password (e.g., Google Authenticator)
  SMS = 'sms',           // SMS verification code
  EMAIL = 'email',       // Email verification code
  PUSH = 'push',         // Push notification to mobile device
  RECOVERY_CODE = 'recovery_code' // Recovery codes for backup
}

// MFA configuration for a user
export interface MFAConfig {
  userId: string;
  isEnabled: boolean;
  primaryMethod: MFAMethod;
  backupMethods: MFAMethod[];
  totpSecret?: string;
  phoneNumber?: string;
  email?: string;
  deviceTokens?: string[];
  recoveryCodes?: string[];
  lastVerified?: Date;
}

// MFA verification request
export interface MFAVerificationRequest {
  userId: string;
  method: MFAMethod;
  code?: string;
  token?: string;
}

// MFA verification result
export interface MFAVerificationResult {
  success: boolean;
  message?: string;
  token?: string;
  expiresAt?: Date;
}

/**
 * Multi-Factor Authentication Service
 */
export class MFAService {
  private static instance: MFAService;
  private mfaConfigs: Map<string, MFAConfig> = new Map();
  private verificationCodes: Map<string, { code: string, expiresAt: Date }> = new Map();
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): MFAService {
    if (!MFAService.instance) {
      MFAService.instance = new MFAService();
    }
    return MFAService.instance;
  }
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}
  
  /**
   * Enable MFA for a user
   * @param userId User ID
   * @param method Primary MFA method
   * @param backupMethods Backup MFA methods
   * @returns MFA configuration
   */
  public async enableMFA(
    userId: string,
    method: MFAMethod,
    backupMethods: MFAMethod[] = []
  ): Promise<MFAConfig> {
    const config: MFAConfig = {
      userId,
      isEnabled: true,
      primaryMethod: method,
      backupMethods,
      recoveryCodes: this.generateRecoveryCodes()
    };
    
    // Generate TOTP secret if needed
    if (method === MFAMethod.TOTP || backupMethods.includes(MFAMethod.TOTP)) {
      config.totpSecret = this.generateTOTPSecret();
    }
    
    // Store the configuration
    this.mfaConfigs.set(userId, config);
    
    return config;
  }
  
  /**
   * Disable MFA for a user
   * @param userId User ID
   * @returns Success status
   */
  public disableMFA(userId: string): boolean {
    const config = this.mfaConfigs.get(userId);
    
    if (!config) {
      return false;
    }
    
    config.isEnabled = false;
    this.mfaConfigs.set(userId, config);
    
    return true;
  }
  
  /**
   * Update MFA configuration for a user
   * @param userId User ID
   * @param updates Updates to apply
   * @returns Updated MFA configuration
   */
  public updateMFAConfig(
    userId: string,
    updates: Partial<MFAConfig>
  ): MFAConfig | null {
    const config = this.mfaConfigs.get(userId);
    
    if (!config) {
      return null;
    }
    
    // Apply updates
    const updatedConfig = { ...config, ...updates };
    this.mfaConfigs.set(userId, updatedConfig);
    
    return updatedConfig;
  }
  
  /**
   * Get MFA configuration for a user
   * @param userId User ID
   * @returns MFA configuration
   */
  public getMFAConfig(userId: string): MFAConfig | null {
    return this.mfaConfigs.get(userId) || null;
  }
  
  /**
   * Check if MFA is enabled for a user
   * @param userId User ID
   * @returns True if MFA is enabled
   */
  public isMFAEnabled(userId: string): boolean {
    const config = this.mfaConfigs.get(userId);
    return config?.isEnabled || false;
  }
  
  /**
   * Generate a verification code for a user
   * @param userId User ID
   * @param method MFA method
   * @returns Generated code
   */
  public async generateVerificationCode(
    userId: string,
    method: MFAMethod
  ): Promise<string> {
    const config = this.mfaConfigs.get(userId);
    
    if (!config || !config.isEnabled) {
      throw new Error('MFA is not enabled for this user');
    }
    
    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration time (5 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);
    
    // Store the code
    const codeKey = `${userId}:${method}`;
    this.verificationCodes.set(codeKey, { code, expiresAt });
    
    // Send the code based on the method
    await this.sendVerificationCode(userId, method, code);
    
    return code;
  }
  
  /**
   * Send a verification code to the user
   * @param userId User ID
   * @param method MFA method
   * @param code Verification code
   */
  private async sendVerificationCode(
    userId: string,
    method: MFAMethod,
    code: string
  ): Promise<void> {
    const config = this.mfaConfigs.get(userId);
    
    if (!config) {
      throw new Error('MFA is not configured for this user');
    }
    
    switch (method) {
      case MFAMethod.SMS:
        if (!config.phoneNumber) {
          throw new Error('Phone number not configured for SMS verification');
        }
        await this.sendSMS(config.phoneNumber, code);
        break;
        
      case MFAMethod.EMAIL:
        if (!config.email) {
          throw new Error('Email not configured for email verification');
        }
        await this.sendEmail(config.email, code);
        break;
        
      case MFAMethod.PUSH:
        if (!config.deviceTokens || config.deviceTokens.length === 0) {
          throw new Error('No device tokens configured for push notification');
        }
        await this.sendPushNotification(config.deviceTokens, code);
        break;
        
      case MFAMethod.TOTP:
        // TOTP doesn't need to send a code
        break;
        
      default:
        throw new Error(`Unsupported MFA method: ${method}`);
    }
  }
  
  /**
   * Verify a code for a user
   * @param request Verification request
   * @returns Verification result
   */
  public async verifyCode(request: MFAVerificationRequest): Promise<MFAVerificationResult> {
    const { userId, method, code } = request;
    
    const config = this.mfaConfigs.get(userId);
    
    if (!config || !config.isEnabled) {
      return {
        success: false,
        message: 'MFA is not enabled for this user'
      };
    }
    
    switch (method) {
      case MFAMethod.TOTP:
        return this.verifyTOTP(userId, code || '');
        
      case MFAMethod.RECOVERY_CODE:
        return this.verifyRecoveryCode(userId, code || '');
        
      default:
        return this.verifyGeneratedCode(userId, method, code || '');
    }
  }
  
  /**
   * Verify a generated code
   * @param userId User ID
   * @param method MFA method
   * @param code Verification code
   * @returns Verification result
   */
  private verifyGeneratedCode(
    userId: string,
    method: MFAMethod,
    code: string
  ): MFAVerificationResult {
    const codeKey = `${userId}:${method}`;
    const storedCode = this.verificationCodes.get(codeKey);
    
    if (!storedCode) {
      return {
        success: false,
        message: 'No verification code found'
      };
    }
    
    if (new Date() > storedCode.expiresAt) {
      this.verificationCodes.delete(codeKey);
      return {
        success: false,
        message: 'Verification code has expired'
      };
    }
    
    if (storedCode.code !== code) {
      return {
        success: false,
        message: 'Invalid verification code'
      };
    }
    
    // Code is valid, delete it and update last verified
    this.verificationCodes.delete(codeKey);
    
    const config = this.mfaConfigs.get(userId);
    if (config) {
      config.lastVerified = new Date();
      this.mfaConfigs.set(userId, config);
    }
    
    // Generate a verification token
    const token = this.generateVerificationToken(userId);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token valid for 24 hours
    
    return {
      success: true,
      message: 'Verification successful',
      token,
      expiresAt
    };
  }
  
  /**
   * Verify a TOTP code
   * @param userId User ID
   * @param code TOTP code
   * @returns Verification result
   */
  private verifyTOTP(userId: string, code: string): MFAVerificationResult {
    const config = this.mfaConfigs.get(userId);
    
    if (!config || !config.totpSecret) {
      return {
        success: false,
        message: 'TOTP is not configured for this user'
      };
    }
    
    // Verify TOTP code
    const isValid = this.verifyTOTPCode(config.totpSecret, code);
    
    if (!isValid) {
      return {
        success: false,
        message: 'Invalid TOTP code'
      };
    }
    
    // Update last verified
    config.lastVerified = new Date();
    this.mfaConfigs.set(userId, config);
    
    // Generate a verification token
    const token = this.generateVerificationToken(userId);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token valid for 24 hours
    
    return {
      success: true,
      message: 'TOTP verification successful',
      token,
      expiresAt
    };
  }
  
  /**
   * Verify a recovery code
   * @param userId User ID
   * @param code Recovery code
   * @returns Verification result
   */
  private verifyRecoveryCode(userId: string, code: string): MFAVerificationResult {
    const config = this.mfaConfigs.get(userId);
    
    if (!config || !config.recoveryCodes || config.recoveryCodes.length === 0) {
      return {
        success: false,
        message: 'Recovery codes are not configured for this user'
      };
    }
    
    // Check if the code is in the list
    const index = config.recoveryCodes.indexOf(code);
    
    if (index === -1) {
      return {
        success: false,
        message: 'Invalid recovery code'
      };
    }
    
    // Remove the used code
    config.recoveryCodes.splice(index, 1);
    this.mfaConfigs.set(userId, config);
    
    // Update last verified
    config.lastVerified = new Date();
    
    // Generate a verification token
    const token = this.generateVerificationToken(userId);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token valid for 24 hours
    
    return {
      success: true,
      message: 'Recovery code verification successful',
      token,
      expiresAt
    };
  }
  
  /**
   * Generate a TOTP secret
   * @returns TOTP secret
   */
  private generateTOTPSecret(): string {
    return crypto.randomBytes(20).toString('hex');
  }
  
  /**
   * Generate recovery codes
   * @param count Number of codes to generate
   * @returns Array of recovery codes
   */
  private generateRecoveryCodes(count: number = 10): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // Generate a code like "ABCD-EFGH-IJKL"
      const code = `${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      codes.push(code);
    }
    
    return codes;
  }
  
  /**
   * Generate a verification token
   * @param userId User ID
   * @returns Verification token
   */
  private generateVerificationToken(userId: string): string {
    return crypto.randomBytes(32).toString('hex');
  }
  
  /**
   * Verify a TOTP code
   * @param secret TOTP secret
   * @param code TOTP code
   * @returns True if the code is valid
   */
  private verifyTOTPCode(secret: string, code: string): boolean {
    // In a real implementation, this would use a TOTP library
    // For now, we'll just simulate it
    
    // Get the current time step (30 seconds)
    const timeStep = Math.floor(Date.now() / 30000);
    
    // Generate codes for current time step and adjacent ones (for clock skew)
    const validTimeSteps = [timeStep - 1, timeStep, timeStep + 1];
    
    // Check if the code matches any of the valid time steps
    return validTimeSteps.some(step => {
      const expectedCode = this.generateTOTPCodeForTimeStep(secret, step);
      return expectedCode === code;
    });
  }
  
  /**
   * Generate a TOTP code for a specific time step
   * @param secret TOTP secret
   * @param timeStep Time step
   * @returns TOTP code
   */
  private generateTOTPCodeForTimeStep(secret: string, timeStep: number): string {
    // In a real implementation, this would use HMAC-SHA1
    // For now, we'll just simulate it with a simple hash
    const hash = crypto.createHash('sha1')
      .update(`${secret}:${timeStep}`)
      .digest('hex');
    
    // Convert the hash to a 6-digit code
    const offset = parseInt(hash.charAt(hash.length - 1), 16);
    const code = parseInt(hash.substring(offset, offset + 6), 16) % 1000000;
    
    // Pad with leading zeros if needed
    return code.toString().padStart(6, '0');
  }
  
  /**
   * Send an SMS verification code
   * @param phoneNumber Phone number
   * @param code Verification code
   */
  private async sendSMS(phoneNumber: string, code: string): Promise<void> {
    // In a real implementation, this would use an SMS service like Twilio
    console.log(`Sending SMS to ${phoneNumber}: Your verification code is ${code}`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  /**
   * Send an email verification code
   * @param email Email address
   * @param code Verification code
   */
  private async sendEmail(email: string, code: string): Promise<void> {
    // In a real implementation, this would use an email service like SendGrid
    console.log(`Sending email to ${email}: Your verification code is ${code}`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  /**
   * Send a push notification with a verification code
   * @param deviceTokens Device tokens
   * @param code Verification code
   */
  private async sendPushNotification(deviceTokens: string[], code: string): Promise<void> {
    // In a real implementation, this would use a push notification service like Firebase
    console.log(`Sending push notification to ${deviceTokens.length} devices: Your verification code is ${code}`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// Export singleton instance
export const mfaService = MFAService.getInstance();