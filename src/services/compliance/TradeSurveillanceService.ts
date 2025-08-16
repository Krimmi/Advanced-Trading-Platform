/**
 * Trade Surveillance Service
 * 
 * This service monitors trading activity for potential compliance violations,
 * suspicious patterns, and regulatory issues.
 */

import { AuditLogService, AuditEventType, AuditSeverity } from './AuditLogService';
import { User } from '../auth/RBACService';

// Trade surveillance rule types
export enum SurveillanceRuleType {
  // Market manipulation
  SPOOFING = 'spoofing',
  LAYERING = 'layering',
  WASH_TRADING = 'wash_trading',
  MARKING_THE_CLOSE = 'marking_the_close',
  FRONT_RUNNING = 'front_running',
  
  // Insider trading
  UNUSUAL_TIMING = 'unusual_timing',
  UNUSUAL_PROFIT = 'unusual_profit',
  UNUSUAL_VOLUME = 'unusual_volume',
  
  // Position limits
  POSITION_LIMIT_BREACH = 'position_limit_breach',
  CONCENTRATION_RISK = 'concentration_risk',
  
  // Trading restrictions
  RESTRICTED_SECURITY = 'restricted_security',
  BLACKOUT_PERIOD = 'blackout_period',
  EMPLOYEE_TRADING = 'employee_trading',
  
  // Order execution
  BEST_EXECUTION = 'best_execution',
  EXCESSIVE_MARKUP = 'excessive_markup',
  
  // Anti-money laundering
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  STRUCTURED_TRADING = 'structured_trading',
  
  // Custom rules
  CUSTOM = 'custom'
}

// Alert severity levels
export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Alert status
export enum AlertStatus {
  OPEN = 'open',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  FALSE_POSITIVE = 'false_positive',
  ESCALATED = 'escalated'
}

// Surveillance rule interface
export interface SurveillanceRule {
  id: string;
  name: string;
  description: string;
  type: SurveillanceRuleType;
  enabled: boolean;
  parameters: Record<string, any>;
  severity: AlertSeverity;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// Surveillance alert interface
export interface SurveillanceAlert {
  id: string;
  ruleId: string;
  ruleName: string;
  ruleType: SurveillanceRuleType;
  severity: AlertSeverity;
  status: AlertStatus;
  timestamp: Date;
  userId?: string;
  username?: string;
  accountId?: string;
  symbol?: string;
  orderId?: string;
  tradeId?: string;
  description: string;
  details: any;
  metadata?: Record<string, any>;
  assignedTo?: string;
  resolution?: string;
  resolutionTimestamp?: Date;
  resolvedBy?: string;
}

/**
 * Trade Surveillance Service
 */
export class TradeSurveillanceService {
  private static instance: TradeSurveillanceService;
  private rules: Map<string, SurveillanceRule> = new Map();
  private alerts: SurveillanceAlert[] = [];
  private auditLogService: AuditLogService;
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): TradeSurveillanceService {
    if (!TradeSurveillanceService.instance) {
      TradeSurveillanceService.instance = new TradeSurveillanceService();
    }
    return TradeSurveillanceService.instance;
  }
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.auditLogService = AuditLogService.getInstance();
    this.initializeDefaultRules();
  }
  
  /**
   * Initialize default surveillance rules
   */
  private initializeDefaultRules(): void {
    // Spoofing detection rule
    this.createRule({
      name: 'Spoofing Detection',
      description: 'Detects rapid order placement and cancellation patterns designed to create false market impressions',
      type: SurveillanceRuleType.SPOOFING,
      parameters: {
        timeWindowSeconds: 60,
        minOrderCount: 5,
        cancellationThresholdPercent: 80
      },
      severity: AlertSeverity.HIGH,
      createdBy: 'system',
      updatedBy: 'system'
    });
    
    // Wash trading detection rule
    this.createRule({
      name: 'Wash Trading Detection',
      description: 'Detects trading activity between related accounts with no change in beneficial ownership',
      type: SurveillanceRuleType.WASH_TRADING,
      parameters: {
        lookbackDays: 30,
        volumeThresholdPercent: 5,
        relatedAccountCheck: true
      },
      severity: AlertSeverity.HIGH,
      createdBy: 'system',
      updatedBy: 'system'
    });
    
    // Position limit breach rule
    this.createRule({
      name: 'Position Limit Breach',
      description: 'Monitors for breaches of position limits set by regulations or internal policies',
      type: SurveillanceRuleType.POSITION_LIMIT_BREACH,
      parameters: {
        checkFrequencyMinutes: 60,
        notificationThresholdPercent: 90
      },
      severity: AlertSeverity.MEDIUM,
      createdBy: 'system',
      updatedBy: 'system'
    });
    
    // Restricted security trading rule
    this.createRule({
      name: 'Restricted Security Trading',
      description: 'Monitors for trading activity in securities on the restricted list',
      type: SurveillanceRuleType.RESTRICTED_SECURITY,
      parameters: {
        checkPreTrade: true,
        checkPostTrade: true,
        includeRelatedSecurities: true
      },
      severity: AlertSeverity.CRITICAL,
      createdBy: 'system',
      updatedBy: 'system'
    });
    
    // Unusual trading volume rule
    this.createRule({
      name: 'Unusual Trading Volume',
      description: 'Detects unusually high trading volume that may indicate insider trading',
      type: SurveillanceRuleType.UNUSUAL_VOLUME,
      parameters: {
        lookbackDays: 30,
        standardDeviationThreshold: 3,
        minimumVolumeMultiple: 5
      },
      severity: AlertSeverity.MEDIUM,
      createdBy: 'system',
      updatedBy: 'system'
    });
  }
  
  /**
   * Create a new surveillance rule
   * @param ruleData Rule data
   * @param user User creating the rule
   * @returns Created rule
   */
  public createRule(
    ruleData: Omit<SurveillanceRule, 'id' | 'enabled' | 'createdAt' | 'updatedAt'>,
    user?: User
  ): SurveillanceRule {
    const id = this.generateId();
    const now = new Date();
    
    const rule: SurveillanceRule = {
      id,
      ...ruleData,
      enabled: true,
      createdAt: now,
      updatedAt: now,
      createdBy: user?.id || ruleData.createdBy || 'system',
      updatedBy: user?.id || ruleData.updatedBy || 'system'
    };
    
    this.rules.set(id, rule);
    
    // Log the rule creation
    this.auditLogService.log({
      eventType: AuditEventType.COMPLIANCE_RULE_CREATED,
      user,
      resourceType: 'surveillance_rule',
      resourceId: id,
      action: 'create_surveillance_rule',
      details: { ruleName: rule.name, ruleType: rule.type },
      status: 'success'
    });
    
    return rule;
  }
  
  /**
   * Get a surveillance rule by ID
   * @param id Rule ID
   * @returns Rule or null if not found
   */
  public getRule(id: string): SurveillanceRule | null {
    return this.rules.get(id) || null;
  }
  
  /**
   * Get all surveillance rules
   * @returns Array of rules
   */
  public getAllRules(): SurveillanceRule[] {
    return Array.from(this.rules.values());
  }
  
  /**
   * Update a surveillance rule
   * @param id Rule ID
   * @param updates Updates to apply
   * @param user User updating the rule
   * @returns Updated rule or null if not found
   */
  public updateRule(
    id: string,
    updates: Partial<Omit<SurveillanceRule, 'id' | 'createdAt' | 'createdBy'>>,
    user?: User
  ): SurveillanceRule | null {
    const rule = this.rules.get(id);
    
    if (!rule) {
      return null;
    }
    
    // Apply updates
    const updatedRule: SurveillanceRule = {
      ...rule,
      ...updates,
      updatedAt: new Date(),
      updatedBy: user?.id || updates.updatedBy || rule.updatedBy
    };
    
    this.rules.set(id, updatedRule);
    
    // Log the rule update
    this.auditLogService.log({
      eventType: AuditEventType.COMPLIANCE_RULE_UPDATED,
      user,
      resourceType: 'surveillance_rule',
      resourceId: id,
      action: 'update_surveillance_rule',
      details: { ruleName: updatedRule.name, updates },
      status: 'success'
    });
    
    return updatedRule;
  }
  
  /**
   * Enable or disable a surveillance rule
   * @param id Rule ID
   * @param enabled Whether the rule should be enabled
   * @param user User updating the rule
   * @returns Updated rule or null if not found
   */
  public setRuleEnabled(id: string, enabled: boolean, user?: User): SurveillanceRule | null {
    return this.updateRule(id, { enabled }, user);
  }
  
  /**
   * Delete a surveillance rule
   * @param id Rule ID
   * @param user User deleting the rule
   * @returns True if the rule was deleted
   */
  public deleteRule(id: string, user?: User): boolean {
    const rule = this.rules.get(id);
    
    if (!rule) {
      return false;
    }
    
    this.rules.delete(id);
    
    // Log the rule deletion
    this.auditLogService.log({
      eventType: AuditEventType.COMPLIANCE_RULE_DELETED,
      user,
      resourceType: 'surveillance_rule',
      resourceId: id,
      action: 'delete_surveillance_rule',
      details: { ruleName: rule.name, ruleType: rule.type },
      status: 'success'
    });
    
    return true;
  }
  
  /**
   * Create a surveillance alert
   * @param alertData Alert data
   * @returns Created alert
   */
  public createAlert(
    alertData: Omit<SurveillanceAlert, 'id' | 'status' | 'timestamp'>
  ): SurveillanceAlert {
    const id = this.generateId();
    const now = new Date();
    
    const alert: SurveillanceAlert = {
      id,
      ...alertData,
      status: AlertStatus.OPEN,
      timestamp: now
    };
    
    this.alerts.push(alert);
    
    // Log the alert creation
    this.auditLogService.log({
      eventType: AuditEventType.COMPLIANCE_ALERT_TRIGGERED,
      severity: this.mapAlertSeverityToAuditSeverity(alert.severity),
      userId: alert.userId,
      username: alert.username,
      resourceType: 'surveillance_alert',
      resourceId: id,
      action: 'create_surveillance_alert',
      details: {
        ruleName: alert.ruleName,
        ruleType: alert.ruleType,
        description: alert.description
      },
      status: 'success'
    });
    
    return alert;
  }
  
  /**
   * Get a surveillance alert by ID
   * @param id Alert ID
   * @returns Alert or null if not found
   */
  public getAlert(id: string): SurveillanceAlert | null {
    return this.alerts.find(alert => alert.id === id) || null;
  }
  
  /**
   * Get all surveillance alerts with filtering
   * @param filters Filters to apply
   * @returns Filtered alerts
   */
  public getAlerts(filters: {
    status?: AlertStatus | AlertStatus[];
    severity?: AlertSeverity | AlertSeverity[];
    ruleType?: SurveillanceRuleType | SurveillanceRuleType[];
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}): SurveillanceAlert[] {
    const {
      status,
      severity,
      ruleType,
      userId,
      startDate,
      endDate,
      limit = 100,
      offset = 0
    } = filters;
    
    // Apply filters
    let filteredAlerts = this.alerts;
    
    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      filteredAlerts = filteredAlerts.filter(alert => statuses.includes(alert.status));
    }
    
    if (severity) {
      const severities = Array.isArray(severity) ? severity : [severity];
      filteredAlerts = filteredAlerts.filter(alert => severities.includes(alert.severity));
    }
    
    if (ruleType) {
      const ruleTypes = Array.isArray(ruleType) ? ruleType : [ruleType];
      filteredAlerts = filteredAlerts.filter(alert => ruleTypes.includes(alert.ruleType));
    }
    
    if (userId) {
      filteredAlerts = filteredAlerts.filter(alert => alert.userId === userId);
    }
    
    if (startDate) {
      filteredAlerts = filteredAlerts.filter(alert => alert.timestamp >= startDate);
    }
    
    if (endDate) {
      filteredAlerts = filteredAlerts.filter(alert => alert.timestamp <= endDate);
    }
    
    // Sort by timestamp (newest first)
    filteredAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Apply pagination
    return filteredAlerts.slice(offset, offset + limit);
  }
  
  /**
   * Update a surveillance alert
   * @param id Alert ID
   * @param updates Updates to apply
   * @param user User updating the alert
   * @returns Updated alert or null if not found
   */
  public updateAlert(
    id: string,
    updates: Partial<SurveillanceAlert>,
    user?: User
  ): SurveillanceAlert | null {
    const alertIndex = this.alerts.findIndex(alert => alert.id === id);
    
    if (alertIndex === -1) {
      return null;
    }
    
    const alert = this.alerts[alertIndex];
    
    // Apply updates
    const updatedAlert: SurveillanceAlert = {
      ...alert,
      ...updates
    };
    
    this.alerts[alertIndex] = updatedAlert;
    
    // Log the alert update
    this.auditLogService.log({
      eventType: AuditEventType.COMPLIANCE_ALERT_TRIGGERED,
      user,
      resourceType: 'surveillance_alert',
      resourceId: id,
      action: 'update_surveillance_alert',
      details: { updates },
      status: 'success'
    });
    
    return updatedAlert;
  }
  
  /**
   * Update the status of a surveillance alert
   * @param id Alert ID
   * @param status New status
   * @param resolution Resolution details (required for resolved or false positive status)
   * @param user User updating the alert
   * @returns Updated alert or null if not found
   */
  public updateAlertStatus(
    id: string,
    status: AlertStatus,
    resolution?: string,
    user?: User
  ): SurveillanceAlert | null {
    // Check if resolution is provided for resolved or false positive status
    if ((status === AlertStatus.RESOLVED || status === AlertStatus.FALSE_POSITIVE) && !resolution) {
      throw new Error('Resolution is required for resolved or false positive status');
    }
    
    const updates: Partial<SurveillanceAlert> = { status };
    
    if (resolution) {
      updates.resolution = resolution;
      updates.resolutionTimestamp = new Date();
      updates.resolvedBy = user?.id;
    }
    
    if (status === AlertStatus.INVESTIGATING) {
      updates.assignedTo = user?.id;
    }
    
    return this.updateAlert(id, updates, user);
  }
  
  /**
   * Assign a surveillance alert to a user
   * @param id Alert ID
   * @param userId User ID to assign to
   * @param user User making the assignment
   * @returns Updated alert or null if not found
   */
  public assignAlert(id: string, userId: string, user?: User): SurveillanceAlert | null {
    return this.updateAlert(id, { assignedTo: userId }, user);
  }
  
  /**
   * Process a trade for surveillance
   * @param trade Trade data
   * @returns Array of triggered alerts
   */
  public processTrade(trade: any): SurveillanceAlert[] {
    const triggeredAlerts: SurveillanceAlert[] = [];
    
    // Process the trade against all enabled rules
    for (const rule of this.rules.values()) {
      if (!rule.enabled) {
        continue;
      }
      
      // Check if the trade triggers the rule
      const alertData = this.evaluateRule(rule, trade);
      
      if (alertData) {
        // Create an alert
        const alert = this.createAlert(alertData);
        triggeredAlerts.push(alert);
      }
    }
    
    return triggeredAlerts;
  }
  
  /**
   * Evaluate a rule against a trade
   * @param rule Rule to evaluate
   * @param trade Trade data
   * @returns Alert data if the rule is triggered, null otherwise
   */
  private evaluateRule(
    rule: SurveillanceRule,
    trade: any
  ): Omit<SurveillanceAlert, 'id' | 'status' | 'timestamp'> | null {
    // In a real implementation, this would contain complex logic for each rule type
    // For now, we'll just implement a simple example for each rule type
    
    switch (rule.type) {
      case SurveillanceRuleType.RESTRICTED_SECURITY:
        // Check if the security is on a restricted list
        if (this.isSecurityRestricted(trade.symbol)) {
          return {
            ruleId: rule.id,
            ruleName: rule.name,
            ruleType: rule.type,
            severity: rule.severity,
            userId: trade.userId,
            username: trade.username,
            accountId: trade.accountId,
            symbol: trade.symbol,
            orderId: trade.orderId,
            tradeId: trade.id,
            description: `Trading in restricted security: ${trade.symbol}`,
            details: {
              trade,
              restrictionReason: this.getSecurityRestrictionReason(trade.symbol)
            }
          };
        }
        break;
        
      case SurveillanceRuleType.POSITION_LIMIT_BREACH:
        // Check if the trade would breach position limits
        const positionLimit = this.getPositionLimit(trade.symbol, trade.accountId);
        const newPosition = this.calculateNewPosition(trade);
        
        if (newPosition > positionLimit) {
          return {
            ruleId: rule.id,
            ruleName: rule.name,
            ruleType: rule.type,
            severity: rule.severity,
            userId: trade.userId,
            username: trade.username,
            accountId: trade.accountId,
            symbol: trade.symbol,
            orderId: trade.orderId,
            tradeId: trade.id,
            description: `Position limit breach for ${trade.symbol}`,
            details: {
              trade,
              positionLimit,
              newPosition,
              exceedAmount: newPosition - positionLimit
            }
          };
        }
        break;
        
      case SurveillanceRuleType.UNUSUAL_VOLUME:
        // Check if the trade volume is unusually high
        const averageVolume = this.getAverageVolume(trade.symbol);
        const volumeThreshold = averageVolume * rule.parameters.minimumVolumeMultiple;
        
        if (trade.quantity > volumeThreshold) {
          return {
            ruleId: rule.id,
            ruleName: rule.name,
            ruleType: rule.type,
            severity: rule.severity,
            userId: trade.userId,
            username: trade.username,
            accountId: trade.accountId,
            symbol: trade.symbol,
            orderId: trade.orderId,
            tradeId: trade.id,
            description: `Unusual trading volume for ${trade.symbol}`,
            details: {
              trade,
              averageVolume,
              volumeThreshold,
              actualVolume: trade.quantity,
              volumeMultiple: trade.quantity / averageVolume
            }
          };
        }
        break;
        
      // Add more rule evaluations as needed
    }
    
    return null;
  }
  
  /**
   * Check if a security is on the restricted list
   * @param symbol Security symbol
   * @returns True if the security is restricted
   */
  private isSecurityRestricted(symbol: string): boolean {
    // In a real implementation, this would check against a database of restricted securities
    const restrictedSecurities = ['AAPL', 'MSFT', 'GOOGL']; // Example restricted list
    return restrictedSecurities.includes(symbol);
  }
  
  /**
   * Get the reason a security is restricted
   * @param symbol Security symbol
   * @returns Restriction reason
   */
  private getSecurityRestrictionReason(symbol: string): string {
    // In a real implementation, this would retrieve the reason from a database
    return 'Company blackout period';
  }
  
  /**
   * Get the position limit for a security and account
   * @param symbol Security symbol
   * @param accountId Account ID
   * @returns Position limit
   */
  private getPositionLimit(symbol: string, accountId: string): number {
    // In a real implementation, this would retrieve the limit from a database
    return 10000; // Example limit
  }
  
  /**
   * Calculate the new position after a trade
   * @param trade Trade data
   * @returns New position
   */
  private calculateNewPosition(trade: any): number {
    // In a real implementation, this would calculate the new position based on existing positions
    return trade.quantity; // Example calculation
  }
  
  /**
   * Get the average trading volume for a security
   * @param symbol Security symbol
   * @returns Average volume
   */
  private getAverageVolume(symbol: string): number {
    // In a real implementation, this would retrieve historical volume data
    return 5000; // Example average volume
  }
  
  /**
   * Generate a unique ID
   * @returns Unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }
  
  /**
   * Map alert severity to audit severity
   * @param alertSeverity Alert severity
   * @returns Audit severity
   */
  private mapAlertSeverityToAuditSeverity(alertSeverity: AlertSeverity): AuditSeverity {
    switch (alertSeverity) {
      case AlertSeverity.LOW:
        return AuditSeverity.INFO;
      case AlertSeverity.MEDIUM:
        return AuditSeverity.WARNING;
      case AlertSeverity.HIGH:
        return AuditSeverity.ERROR;
      case AlertSeverity.CRITICAL:
        return AuditSeverity.CRITICAL;
      default:
        return AuditSeverity.INFO;
    }
  }
}

// Export singleton instance
export const tradeSurveillanceService = TradeSurveillanceService.getInstance();