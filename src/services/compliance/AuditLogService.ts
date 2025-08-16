/**
 * Audit Log Service
 * 
 * This service provides comprehensive audit logging functionality for regulatory compliance,
 * tracking user actions, system events, and security-related activities.
 */

import { User } from '../auth/RBACService';

// Audit log event types
export enum AuditEventType {
  // Authentication events
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  LOGIN_FAILED = 'login_failed',
  PASSWORD_CHANGED = 'password_changed',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
  MFA_VERIFIED = 'mfa_verified',
  MFA_FAILED = 'mfa_failed',
  
  // User management events
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_ROLE_ASSIGNED = 'user_role_assigned',
  USER_ROLE_REVOKED = 'user_role_revoked',
  USER_PERMISSION_GRANTED = 'user_permission_granted',
  USER_PERMISSION_REVOKED = 'user_permission_revoked',
  
  // Strategy events
  STRATEGY_CREATED = 'strategy_created',
  STRATEGY_UPDATED = 'strategy_updated',
  STRATEGY_DELETED = 'strategy_deleted',
  STRATEGY_DEPLOYED = 'strategy_deployed',
  STRATEGY_STOPPED = 'strategy_stopped',
  
  // Trading events
  ORDER_CREATED = 'order_created',
  ORDER_UPDATED = 'order_updated',
  ORDER_CANCELLED = 'order_cancelled',
  ORDER_EXECUTED = 'order_executed',
  POSITION_OPENED = 'position_opened',
  POSITION_CLOSED = 'position_closed',
  POSITION_UPDATED = 'position_updated',
  
  // Risk management events
  RISK_LIMIT_CREATED = 'risk_limit_created',
  RISK_LIMIT_UPDATED = 'risk_limit_updated',
  RISK_LIMIT_DELETED = 'risk_limit_deleted',
  RISK_LIMIT_BREACHED = 'risk_limit_breached',
  RISK_LIMIT_OVERRIDE = 'risk_limit_override',
  
  // System events
  SYSTEM_STARTUP = 'system_startup',
  SYSTEM_SHUTDOWN = 'system_shutdown',
  SYSTEM_ERROR = 'system_error',
  SYSTEM_CONFIG_CHANGED = 'system_config_changed',
  API_KEY_CREATED = 'api_key_created',
  API_KEY_UPDATED = 'api_key_updated',
  API_KEY_DELETED = 'api_key_deleted',
  
  // Data access events
  DATA_ACCESSED = 'data_accessed',
  DATA_EXPORTED = 'data_exported',
  DATA_IMPORTED = 'data_imported',
  DATA_DELETED = 'data_deleted',
  
  // Compliance events
  COMPLIANCE_ALERT_TRIGGERED = 'compliance_alert_triggered',
  COMPLIANCE_REPORT_GENERATED = 'compliance_report_generated',
  COMPLIANCE_RULE_CREATED = 'compliance_rule_created',
  COMPLIANCE_RULE_UPDATED = 'compliance_rule_updated',
  COMPLIANCE_RULE_DELETED = 'compliance_rule_deleted'
}

// Audit log severity levels
export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Audit log entry interface
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  username?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  resourceType?: string;
  resourceId?: string;
  action: string;
  details: any;
  status: 'success' | 'failure';
  errorMessage?: string;
  metadata?: Record<string, any>;
}

// Audit log options interface
export interface AuditLogOptions {
  eventType: AuditEventType;
  severity?: AuditSeverity;
  user?: User | null;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  resourceType?: string;
  resourceId?: string;
  action: string;
  details: any;
  status?: 'success' | 'failure';
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Audit Log Service
 */
export class AuditLogService {
  private static instance: AuditLogService;
  private auditLogs: AuditLogEntry[] = [];
  private readonly MAX_MEMORY_LOGS = 10000; // Maximum number of logs to keep in memory
  private readonly LOG_RETENTION_DAYS = 365; // Default retention period in days
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}
  
  /**
   * Log an audit event
   * @param options Audit log options
   * @returns Created audit log entry
   */
  public log(options: AuditLogOptions): AuditLogEntry {
    const {
      eventType,
      severity = AuditSeverity.INFO,
      user,
      ipAddress,
      userAgent,
      sessionId,
      resourceType,
      resourceId,
      action,
      details,
      status = 'success',
      errorMessage,
      metadata
    } = options;
    
    // Generate a unique ID for the log entry
    const id = this.generateId();
    
    // Create the log entry
    const logEntry: AuditLogEntry = {
      id,
      timestamp: new Date(),
      eventType,
      severity,
      userId: user?.id,
      username: user?.username,
      ipAddress,
      userAgent,
      sessionId,
      resourceType,
      resourceId,
      action,
      details,
      status,
      errorMessage,
      metadata
    };
    
    // Add to in-memory logs
    this.auditLogs.push(logEntry);
    
    // Trim logs if needed
    if (this.auditLogs.length > this.MAX_MEMORY_LOGS) {
      this.auditLogs = this.auditLogs.slice(-this.MAX_MEMORY_LOGS);
    }
    
    // In a real implementation, we would also persist the log to a database
    this.persistLog(logEntry);
    
    return logEntry;
  }
  
  /**
   * Get audit logs with filtering
   * @param filters Filters to apply
   * @returns Filtered audit logs
   */
  public getLogs(filters: {
    startDate?: Date;
    endDate?: Date;
    eventTypes?: AuditEventType[];
    severities?: AuditSeverity[];
    userId?: string;
    resourceType?: string;
    resourceId?: string;
    status?: 'success' | 'failure';
    limit?: number;
    offset?: number;
  } = {}): AuditLogEntry[] {
    const {
      startDate,
      endDate,
      eventTypes,
      severities,
      userId,
      resourceType,
      resourceId,
      status,
      limit = 100,
      offset = 0
    } = filters;
    
    // Apply filters
    let filteredLogs = this.auditLogs;
    
    if (startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= startDate);
    }
    
    if (endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= endDate);
    }
    
    if (eventTypes && eventTypes.length > 0) {
      filteredLogs = filteredLogs.filter(log => eventTypes.includes(log.eventType));
    }
    
    if (severities && severities.length > 0) {
      filteredLogs = filteredLogs.filter(log => severities.includes(log.severity));
    }
    
    if (userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === userId);
    }
    
    if (resourceType) {
      filteredLogs = filteredLogs.filter(log => log.resourceType === resourceType);
    }
    
    if (resourceId) {
      filteredLogs = filteredLogs.filter(log => log.resourceId === resourceId);
    }
    
    if (status) {
      filteredLogs = filteredLogs.filter(log => log.status === status);
    }
    
    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Apply pagination
    return filteredLogs.slice(offset, offset + limit);
  }
  
  /**
   * Get a single audit log entry by ID
   * @param id Audit log entry ID
   * @returns Audit log entry or null if not found
   */
  public getLogById(id: string): AuditLogEntry | null {
    return this.auditLogs.find(log => log.id === id) || null;
  }
  
  /**
   * Get audit logs for a specific user
   * @param userId User ID
   * @param limit Maximum number of logs to return
   * @returns User's audit logs
   */
  public getUserLogs(userId: string, limit: number = 100): AuditLogEntry[] {
    return this.getLogs({ userId, limit });
  }
  
  /**
   * Get audit logs for a specific resource
   * @param resourceType Resource type
   * @param resourceId Resource ID
   * @param limit Maximum number of logs to return
   * @returns Resource's audit logs
   */
  public getResourceLogs(resourceType: string, resourceId: string, limit: number = 100): AuditLogEntry[] {
    return this.getLogs({ resourceType, resourceId, limit });
  }
  
  /**
   * Generate a report of audit logs
   * @param filters Filters to apply
   * @param groupBy Field to group by
   * @returns Grouped audit log report
   */
  public generateReport(
    filters: any = {},
    groupBy: 'eventType' | 'severity' | 'userId' | 'resourceType' | 'status' = 'eventType'
  ): Record<string, number> {
    const logs = this.getLogs({ ...filters, limit: Number.MAX_SAFE_INTEGER });
    const report: Record<string, number> = {};
    
    for (const log of logs) {
      const key = log[groupBy]?.toString() || 'unknown';
      report[key] = (report[key] || 0) + 1;
    }
    
    return report;
  }
  
  /**
   * Clear all audit logs (for testing)
   */
  public clearLogs(): void {
    this.auditLogs = [];
  }
  
  /**
   * Generate a unique ID for a log entry
   * @returns Unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }
  
  /**
   * Persist a log entry to storage
   * @param logEntry Log entry to persist
   */
  private persistLog(logEntry: AuditLogEntry): void {
    // In a real implementation, this would save to a database
    // For now, we'll just log to console
    console.log(`[AUDIT] ${logEntry.timestamp.toISOString()} [${logEntry.severity}] ${logEntry.eventType}: ${logEntry.action} (${logEntry.status})`);
    
    // In a production environment, we would use a database or log aggregation service
    // Example with a hypothetical database service:
    /*
    try {
      await db.collection('audit_logs').insertOne(logEntry);
    } catch (error) {
      console.error('Failed to persist audit log:', error);
    }
    */
  }
}

// Export singleton instance
export const auditLogService = AuditLogService.getInstance();