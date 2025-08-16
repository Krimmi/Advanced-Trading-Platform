/**
 * Compliance Reporting Service
 * 
 * This service generates compliance reports for regulatory requirements,
 * internal audits, and management oversight.
 */

import { AuditLogService, AuditEventType, AuditSeverity, AuditLogEntry } from './AuditLogService';
import { TradeSurveillanceService, SurveillanceAlert, AlertStatus } from './TradeSurveillanceService';
import { User } from '../auth/RBACService';

// Report types
export enum ReportType {
  // Regulatory reports
  FINRA_TRACE = 'finra_trace',
  SEC_FORM_13F = 'sec_form_13f',
  SEC_FORM_13H = 'sec_form_13h',
  FORM_PF = 'form_pf',
  FORM_CPO_PQR = 'form_cpo_pqr',
  
  // Internal reports
  TRADE_SURVEILLANCE = 'trade_surveillance',
  POSITION_LIMITS = 'position_limits',
  RISK_EXPOSURE = 'risk_exposure',
  BEST_EXECUTION = 'best_execution',
  EMPLOYEE_TRADING = 'employee_trading',
  RESTRICTED_LIST = 'restricted_list',
  
  // Audit reports
  USER_ACTIVITY = 'user_activity',
  SYSTEM_ACCESS = 'system_access',
  CONFIGURATION_CHANGES = 'configuration_changes',
  
  // Custom reports
  CUSTOM = 'custom'
}

// Report format
export enum ReportFormat {
  PDF = 'pdf',
  CSV = 'csv',
  EXCEL = 'excel',
  JSON = 'json',
  XML = 'xml',
  HTML = 'html'
}

// Report status
export enum ReportStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Report interface
export interface ComplianceReport {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  format: ReportFormat;
  parameters: Record<string, any>;
  status: ReportStatus;
  createdAt: Date;
  createdBy: string;
  completedAt?: Date;
  fileUrl?: string;
  fileSize?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

// Report template interface
export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  defaultFormat: ReportFormat;
  parameters: {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
    required: boolean;
    defaultValue?: any;
    options?: any[];
    description?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

/**
 * Compliance Reporting Service
 */
export class ComplianceReportingService {
  private static instance: ComplianceReportingService;
  private reports: Map<string, ComplianceReport> = new Map();
  private templates: Map<string, ReportTemplate> = new Map();
  private auditLogService: AuditLogService;
  private tradeSurveillanceService: TradeSurveillanceService;
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): ComplianceReportingService {
    if (!ComplianceReportingService.instance) {
      ComplianceReportingService.instance = new ComplianceReportingService();
    }
    return ComplianceReportingService.instance;
  }
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.auditLogService = AuditLogService.getInstance();
    this.tradeSurveillanceService = TradeSurveillanceService.getInstance();
    this.initializeDefaultTemplates();
  }
  
  /**
   * Initialize default report templates
   */
  private initializeDefaultTemplates(): void {
    // Trade surveillance report template
    this.createTemplate({
      name: 'Trade Surveillance Report',
      description: 'Report of all surveillance alerts within a specified date range',
      type: ReportType.TRADE_SURVEILLANCE,
      defaultFormat: ReportFormat.PDF,
      parameters: [
        {
          name: 'startDate',
          type: 'date',
          required: true,
          description: 'Start date for the report'
        },
        {
          name: 'endDate',
          type: 'date',
          required: true,
          description: 'End date for the report'
        },
        {
          name: 'status',
          type: 'array',
          required: false,
          options: Object.values(AlertStatus),
          description: 'Filter by alert status'
        },
        {
          name: 'includeDetails',
          type: 'boolean',
          required: false,
          defaultValue: true,
          description: 'Include detailed information for each alert'
        }
      ],
      createdBy: 'system',
      updatedBy: 'system'
    });
    
    // User activity report template
    this.createTemplate({
      name: 'User Activity Report',
      description: 'Report of user activity within a specified date range',
      type: ReportType.USER_ACTIVITY,
      defaultFormat: ReportFormat.PDF,
      parameters: [
        {
          name: 'startDate',
          type: 'date',
          required: true,
          description: 'Start date for the report'
        },
        {
          name: 'endDate',
          type: 'date',
          required: true,
          description: 'End date for the report'
        },
        {
          name: 'userId',
          type: 'string',
          required: false,
          description: 'Filter by user ID'
        },
        {
          name: 'eventTypes',
          type: 'array',
          required: false,
          options: Object.values(AuditEventType),
          description: 'Filter by event types'
        }
      ],
      createdBy: 'system',
      updatedBy: 'system'
    });
    
    // Position limits report template
    this.createTemplate({
      name: 'Position Limits Report',
      description: 'Report of current positions relative to defined limits',
      type: ReportType.POSITION_LIMITS,
      defaultFormat: ReportFormat.PDF,
      parameters: [
        {
          name: 'asOfDate',
          type: 'date',
          required: true,
          defaultValue: new Date(),
          description: 'Date for which to generate the report'
        },
        {
          name: 'thresholdPercent',
          type: 'number',
          required: false,
          defaultValue: 80,
          description: 'Show positions exceeding this percentage of their limit'
        },
        {
          name: 'includeAll',
          type: 'boolean',
          required: false,
          defaultValue: false,
          description: 'Include all positions, not just those exceeding the threshold'
        }
      ],
      createdBy: 'system',
      updatedBy: 'system'
    });
    
    // Best execution report template
    this.createTemplate({
      name: 'Best Execution Report',
      description: 'Report analyzing order execution quality',
      type: ReportType.BEST_EXECUTION,
      defaultFormat: ReportFormat.PDF,
      parameters: [
        {
          name: 'startDate',
          type: 'date',
          required: true,
          description: 'Start date for the report'
        },
        {
          name: 'endDate',
          type: 'date',
          required: true,
          description: 'End date for the report'
        },
        {
          name: 'symbols',
          type: 'array',
          required: false,
          description: 'Filter by symbols'
        },
        {
          name: 'benchmarkType',
          type: 'string',
          required: false,
          options: ['VWAP', 'TWAP', 'Arrival Price', 'Midpoint'],
          defaultValue: 'VWAP',
          description: 'Benchmark type for execution quality analysis'
        }
      ],
      createdBy: 'system',
      updatedBy: 'system'
    });
  }
  
  /**
   * Create a report template
   * @param templateData Template data
   * @param user User creating the template
   * @returns Created template
   */
  public createTemplate(
    templateData: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>,
    user?: User
  ): ReportTemplate {
    const id = this.generateId();
    const now = new Date();
    
    const template: ReportTemplate = {
      id,
      ...templateData,
      createdAt: now,
      updatedAt: now,
      createdBy: user?.id || templateData.createdBy || 'system',
      updatedBy: user?.id || templateData.updatedBy || 'system'
    };
    
    this.templates.set(id, template);
    
    // Log the template creation
    this.auditLogService.log({
      eventType: AuditEventType.COMPLIANCE_REPORT_GENERATED,
      user,
      resourceType: 'report_template',
      resourceId: id,
      action: 'create_report_template',
      details: { templateName: template.name, templateType: template.type },
      status: 'success'
    });
    
    return template;
  }
  
  /**
   * Get a report template by ID
   * @param id Template ID
   * @returns Template or null if not found
   */
  public getTemplate(id: string): ReportTemplate | null {
    return this.templates.get(id) || null;
  }
  
  /**
   * Get all report templates
   * @param type Optional filter by report type
   * @returns Array of templates
   */
  public getAllTemplates(type?: ReportType): ReportTemplate[] {
    const templates = Array.from(this.templates.values());
    
    if (type) {
      return templates.filter(template => template.type === type);
    }
    
    return templates;
  }
  
  /**
   * Update a report template
   * @param id Template ID
   * @param updates Updates to apply
   * @param user User updating the template
   * @returns Updated template or null if not found
   */
  public updateTemplate(
    id: string,
    updates: Partial<Omit<ReportTemplate, 'id' | 'createdAt' | 'createdBy'>>,
    user?: User
  ): ReportTemplate | null {
    const template = this.templates.get(id);
    
    if (!template) {
      return null;
    }
    
    // Apply updates
    const updatedTemplate: ReportTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date(),
      updatedBy: user?.id || updates.updatedBy || template.updatedBy
    };
    
    this.templates.set(id, updatedTemplate);
    
    // Log the template update
    this.auditLogService.log({
      eventType: AuditEventType.COMPLIANCE_REPORT_GENERATED,
      user,
      resourceType: 'report_template',
      resourceId: id,
      action: 'update_report_template',
      details: { templateName: updatedTemplate.name, updates },
      status: 'success'
    });
    
    return updatedTemplate;
  }
  
  /**
   * Delete a report template
   * @param id Template ID
   * @param user User deleting the template
   * @returns True if the template was deleted
   */
  public deleteTemplate(id: string, user?: User): boolean {
    const template = this.templates.get(id);
    
    if (!template) {
      return false;
    }
    
    this.templates.delete(id);
    
    // Log the template deletion
    this.auditLogService.log({
      eventType: AuditEventType.COMPLIANCE_REPORT_GENERATED,
      user,
      resourceType: 'report_template',
      resourceId: id,
      action: 'delete_report_template',
      details: { templateName: template.name, templateType: template.type },
      status: 'success'
    });
    
    return true;
  }
  
  /**
   * Generate a report
   * @param reportData Report data
   * @param user User generating the report
   * @returns Created report
   */
  public async generateReport(
    reportData: {
      name: string;
      description?: string;
      type: ReportType;
      format: ReportFormat;
      parameters: Record<string, any>;
      templateId?: string;
    },
    user?: User
  ): Promise<ComplianceReport> {
    const id = this.generateId();
    const now = new Date();
    
    // Create the report
    const report: ComplianceReport = {
      id,
      name: reportData.name,
      description: reportData.description || '',
      type: reportData.type,
      format: reportData.format,
      parameters: reportData.parameters,
      status: ReportStatus.PENDING,
      createdAt: now,
      createdBy: user?.id || 'system'
    };
    
    this.reports.set(id, report);
    
    // Log the report creation
    this.auditLogService.log({
      eventType: AuditEventType.COMPLIANCE_REPORT_GENERATED,
      user,
      resourceType: 'compliance_report',
      resourceId: id,
      action: 'generate_compliance_report',
      details: { reportName: report.name, reportType: report.type },
      status: 'success'
    });
    
    // Start generating the report asynchronously
    this.processReport(id).catch(error => {
      console.error(`Error generating report ${id}:`, error);
      
      // Update the report status
      const failedReport = this.reports.get(id);
      if (failedReport) {
        failedReport.status = ReportStatus.FAILED;
        failedReport.errorMessage = error.message;
        this.reports.set(id, failedReport);
      }
    });
    
    return report;
  }
  
  /**
   * Process a report
   * @param reportId Report ID
   */
  private async processReport(reportId: string): Promise<void> {
    const report = this.reports.get(reportId);
    
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }
    
    // Update status to generating
    report.status = ReportStatus.GENERATING;
    this.reports.set(reportId, report);
    
    try {
      // Generate the report based on its type
      let reportData: any;
      
      switch (report.type) {
        case ReportType.TRADE_SURVEILLANCE:
          reportData = await this.generateTradeSurveillanceReport(report);
          break;
          
        case ReportType.USER_ACTIVITY:
          reportData = await this.generateUserActivityReport(report);
          break;
          
        case ReportType.POSITION_LIMITS:
          reportData = await this.generatePositionLimitsReport(report);
          break;
          
        case ReportType.BEST_EXECUTION:
          reportData = await this.generateBestExecutionReport(report);
          break;
          
        default:
          throw new Error(`Unsupported report type: ${report.type}`);
      }
      
      // Convert the report data to the requested format
      const formattedReport = await this.formatReport(reportData, report.format);
      
      // Save the report
      const fileUrl = await this.saveReport(reportId, formattedReport, report.format);
      
      // Update the report
      const updatedReport = this.reports.get(reportId);
      if (updatedReport) {
        updatedReport.status = ReportStatus.COMPLETED;
        updatedReport.completedAt = new Date();
        updatedReport.fileUrl = fileUrl;
        updatedReport.fileSize = formattedReport.length;
        this.reports.set(reportId, updatedReport);
      }
    } catch (error) {
      // Update the report status
      const failedReport = this.reports.get(reportId);
      if (failedReport) {
        failedReport.status = ReportStatus.FAILED;
        failedReport.errorMessage = error.message;
        this.reports.set(reportId, failedReport);
      }
      
      throw error;
    }
  }
  
  /**
   * Generate a trade surveillance report
   * @param report Report configuration
   * @returns Report data
   */
  private async generateTradeSurveillanceReport(report: ComplianceReport): Promise<any> {
    const { startDate, endDate, status, includeDetails } = report.parameters;
    
    // Get surveillance alerts
    const alerts = this.tradeSurveillanceService.getAlerts({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status,
      limit: Number.MAX_SAFE_INTEGER
    });
    
    // Generate report data
    const reportData = {
      title: report.name,
      description: report.description,
      generatedAt: new Date(),
      parameters: report.parameters,
      summary: {
        totalAlerts: alerts.length,
        bySeverity: this.countAlertsBySeverity(alerts),
        byStatus: this.countAlertsByStatus(alerts),
        byRuleType: this.countAlertsByRuleType(alerts)
      },
      alerts: includeDetails ? alerts : alerts.map(alert => ({
        id: alert.id,
        ruleName: alert.ruleName,
        ruleType: alert.ruleType,
        severity: alert.severity,
        status: alert.status,
        timestamp: alert.timestamp,
        symbol: alert.symbol,
        description: alert.description
      }))
    };
    
    return reportData;
  }
  
  /**
   * Generate a user activity report
   * @param report Report configuration
   * @returns Report data
   */
  private async generateUserActivityReport(report: ComplianceReport): Promise<any> {
    const { startDate, endDate, userId, eventTypes } = report.parameters;
    
    // Get audit logs
    const logs = this.auditLogService.getLogs({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      userId,
      eventTypes,
      limit: Number.MAX_SAFE_INTEGER
    });
    
    // Generate report data
    const reportData = {
      title: report.name,
      description: report.description,
      generatedAt: new Date(),
      parameters: report.parameters,
      summary: {
        totalEvents: logs.length,
        byEventType: this.countLogsByEventType(logs),
        bySeverity: this.countLogsBySeverity(logs),
        byStatus: this.countLogsByStatus(logs),
        byUser: this.countLogsByUser(logs)
      },
      events: logs
    };
    
    return reportData;
  }
  
  /**
   * Generate a position limits report
   * @param report Report configuration
   * @returns Report data
   */
  private async generatePositionLimitsReport(report: ComplianceReport): Promise<any> {
    const { asOfDate, thresholdPercent, includeAll } = report.parameters;
    
    // In a real implementation, this would retrieve position data from a database
    // For now, we'll just generate some sample data
    const positions = this.getSamplePositionData();
    
    // Filter positions based on threshold
    const filteredPositions = includeAll
      ? positions
      : positions.filter(position => (position.currentValue / position.limit) * 100 >= thresholdPercent);
    
    // Generate report data
    const reportData = {
      title: report.name,
      description: report.description,
      generatedAt: new Date(),
      asOfDate: new Date(asOfDate),
      parameters: report.parameters,
      summary: {
        totalPositions: positions.length,
        positionsOverThreshold: positions.filter(position => (position.currentValue / position.limit) * 100 >= thresholdPercent).length,
        highestUtilization: Math.max(...positions.map(position => (position.currentValue / position.limit) * 100)),
        averageUtilization: positions.reduce((sum, position) => sum + (position.currentValue / position.limit) * 100, 0) / positions.length
      },
      positions: filteredPositions.map(position => ({
        ...position,
        utilizationPercent: (position.currentValue / position.limit) * 100
      }))
    };
    
    return reportData;
  }
  
  /**
   * Generate a best execution report
   * @param report Report configuration
   * @returns Report data
   */
  private async generateBestExecutionReport(report: ComplianceReport): Promise<any> {
    const { startDate, endDate, symbols, benchmarkType } = report.parameters;
    
    // In a real implementation, this would retrieve order execution data from a database
    // For now, we'll just generate some sample data
    const executions = this.getSampleExecutionData(symbols);
    
    // Filter executions by date
    const filteredExecutions = executions.filter(execution => {
      const executionDate = new Date(execution.timestamp);
      return executionDate >= new Date(startDate) && executionDate <= new Date(endDate);
    });
    
    // Calculate execution quality metrics
    const executionMetrics = this.calculateExecutionMetrics(filteredExecutions, benchmarkType);
    
    // Generate report data
    const reportData = {
      title: report.name,
      description: report.description,
      generatedAt: new Date(),
      parameters: report.parameters,
      summary: {
        totalExecutions: filteredExecutions.length,
        totalVolume: filteredExecutions.reduce((sum, execution) => sum + execution.quantity, 0),
        totalValue: filteredExecutions.reduce((sum, execution) => sum + execution.quantity * execution.price, 0),
        averageSlippage: executionMetrics.averageSlippage,
        averageSavings: executionMetrics.averageSavings,
        bestExecutionRate: executionMetrics.bestExecutionRate
      },
      executionsBySymbol: executionMetrics.executionsBySymbol,
      executionsByVenue: executionMetrics.executionsByVenue,
      executionsByOrderType: executionMetrics.executionsByOrderType,
      executions: filteredExecutions
    };
    
    return reportData;
  }
  
  /**
   * Format a report
   * @param reportData Report data
   * @param format Report format
   * @returns Formatted report
   */
  private async formatReport(reportData: any, format: ReportFormat): Promise<string> {
    // In a real implementation, this would convert the report data to the requested format
    // For now, we'll just return a JSON string
    return JSON.stringify(reportData, null, 2);
  }
  
  /**
   * Save a report
   * @param reportId Report ID
   * @param formattedReport Formatted report
   * @param format Report format
   * @returns File URL
   */
  private async saveReport(reportId: string, formattedReport: string, format: ReportFormat): Promise<string> {
    // In a real implementation, this would save the report to a file or database
    // For now, we'll just return a mock URL
    return `https://example.com/reports/${reportId}.${format.toLowerCase()}`;
  }
  
  /**
   * Get a report by ID
   * @param id Report ID
   * @returns Report or null if not found
   */
  public getReport(id: string): ComplianceReport | null {
    return this.reports.get(id) || null;
  }
  
  /**
   * Get all reports with filtering
   * @param filters Filters to apply
   * @returns Filtered reports
   */
  public getReports(filters: {
    type?: ReportType | ReportType[];
    status?: ReportStatus | ReportStatus[];
    createdBy?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}): ComplianceReport[] {
    const {
      type,
      status,
      createdBy,
      startDate,
      endDate,
      limit = 100,
      offset = 0
    } = filters;
    
    // Apply filters
    let filteredReports = Array.from(this.reports.values());
    
    if (type) {
      const types = Array.isArray(type) ? type : [type];
      filteredReports = filteredReports.filter(report => types.includes(report.type));
    }
    
    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      filteredReports = filteredReports.filter(report => statuses.includes(report.status));
    }
    
    if (createdBy) {
      filteredReports = filteredReports.filter(report => report.createdBy === createdBy);
    }
    
    if (startDate) {
      filteredReports = filteredReports.filter(report => report.createdAt >= startDate);
    }
    
    if (endDate) {
      filteredReports = filteredReports.filter(report => report.createdAt <= endDate);
    }
    
    // Sort by creation date (newest first)
    filteredReports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Apply pagination
    return filteredReports.slice(offset, offset + limit);
  }
  
  /**
   * Delete a report
   * @param id Report ID
   * @param user User deleting the report
   * @returns True if the report was deleted
   */
  public deleteReport(id: string, user?: User): boolean {
    const report = this.reports.get(id);
    
    if (!report) {
      return false;
    }
    
    this.reports.delete(id);
    
    // Log the report deletion
    this.auditLogService.log({
      eventType: AuditEventType.COMPLIANCE_REPORT_GENERATED,
      user,
      resourceType: 'compliance_report',
      resourceId: id,
      action: 'delete_compliance_report',
      details: { reportName: report.name, reportType: report.type },
      status: 'success'
    });
    
    return true;
  }
  
  /**
   * Count alerts by severity
   * @param alerts Alerts to count
   * @returns Count by severity
   */
  private countAlertsBySeverity(alerts: SurveillanceAlert[]): Record<string, number> {
    const counts: Record<string, number> = {};
    
    for (const alert of alerts) {
      counts[alert.severity] = (counts[alert.severity] || 0) + 1;
    }
    
    return counts;
  }
  
  /**
   * Count alerts by status
   * @param alerts Alerts to count
   * @returns Count by status
   */
  private countAlertsByStatus(alerts: SurveillanceAlert[]): Record<string, number> {
    const counts: Record<string, number> = {};
    
    for (const alert of alerts) {
      counts[alert.status] = (counts[alert.status] || 0) + 1;
    }
    
    return counts;
  }
  
  /**
   * Count alerts by rule type
   * @param alerts Alerts to count
   * @returns Count by rule type
   */
  private countAlertsByRuleType(alerts: SurveillanceAlert[]): Record<string, number> {
    const counts: Record<string, number> = {};
    
    for (const alert of alerts) {
      counts[alert.ruleType] = (counts[alert.ruleType] || 0) + 1;
    }
    
    return counts;
  }
  
  /**
   * Count logs by event type
   * @param logs Logs to count
   * @returns Count by event type
   */
  private countLogsByEventType(logs: AuditLogEntry[]): Record<string, number> {
    const counts: Record<string, number> = {};
    
    for (const log of logs) {
      counts[log.eventType] = (counts[log.eventType] || 0) + 1;
    }
    
    return counts;
  }
  
  /**
   * Count logs by severity
   * @param logs Logs to count
   * @returns Count by severity
   */
  private countLogsBySeverity(logs: AuditLogEntry[]): Record<string, number> {
    const counts: Record<string, number> = {};
    
    for (const log of logs) {
      counts[log.severity] = (counts[log.severity] || 0) + 1;
    }
    
    return counts;
  }
  
  /**
   * Count logs by status
   * @param logs Logs to count
   * @returns Count by status
   */
  private countLogsByStatus(logs: AuditLogEntry[]): Record<string, number> {
    const counts: Record<string, number> = {};
    
    for (const log of logs) {
      counts[log.status] = (counts[log.status] || 0) + 1;
    }
    
    return counts;
  }
  
  /**
   * Count logs by user
   * @param logs Logs to count
   * @returns Count by user
   */
  private countLogsByUser(logs: AuditLogEntry[]): Record<string, number> {
    const counts: Record<string, number> = {};
    
    for (const log of logs) {
      if (log.userId) {
        counts[log.userId] = (counts[log.userId] || 0) + 1;
      }
    }
    
    return counts;
  }
  
  /**
   * Get sample position data
   * @returns Sample position data
   */
  private getSamplePositionData(): any[] {
    return [
      {
        accountId: 'acc123',
        symbol: 'AAPL',
        currentValue: 500000,
        limit: 1000000,
        limitType: 'Notional',
        limitSource: 'Internal Policy'
      },
      {
        accountId: 'acc123',
        symbol: 'MSFT',
        currentValue: 750000,
        limit: 1000000,
        limitType: 'Notional',
        limitSource: 'Internal Policy'
      },
      {
        accountId: 'acc123',
        symbol: 'GOOGL',
        currentValue: 900000,
        limit: 1000000,
        limitType: 'Notional',
        limitSource: 'Internal Policy'
      },
      {
        accountId: 'acc456',
        symbol: 'AAPL',
        currentValue: 300000,
        limit: 500000,
        limitType: 'Notional',
        limitSource: 'Client Mandate'
      },
      {
        accountId: 'acc456',
        symbol: 'TSLA',
        currentValue: 450000,
        limit: 500000,
        limitType: 'Notional',
        limitSource: 'Client Mandate'
      }
    ];
  }
  
  /**
   * Get sample execution data
   * @param symbols Symbols to filter by
   * @returns Sample execution data
   */
  private getSampleExecutionData(symbols?: string[]): any[] {
    const allExecutions = [
      {
        id: 'exec1',
        orderId: 'order1',
        symbol: 'AAPL',
        quantity: 100,
        price: 150.25,
        timestamp: '2023-01-15T10:30:00Z',
        venue: 'NYSE',
        orderType: 'MARKET',
        benchmarkPrice: 150.10,
        slippage: 0.15
      },
      {
        id: 'exec2',
        orderId: 'order2',
        symbol: 'MSFT',
        quantity: 50,
        price: 250.75,
        timestamp: '2023-01-15T11:15:00Z',
        venue: 'NASDAQ',
        orderType: 'LIMIT',
        benchmarkPrice: 251.00,
        slippage: -0.25
      },
      {
        id: 'exec3',
        orderId: 'order3',
        symbol: 'GOOGL',
        quantity: 25,
        price: 2100.50,
        timestamp: '2023-01-16T09:45:00Z',
        venue: 'NASDAQ',
        orderType: 'MARKET',
        benchmarkPrice: 2105.00,
        slippage: -4.50
      },
      {
        id: 'exec4',
        orderId: 'order4',
        symbol: 'AAPL',
        quantity: 200,
        price: 151.00,
        timestamp: '2023-01-16T14:20:00Z',
        venue: 'ARCA',
        orderType: 'LIMIT',
        benchmarkPrice: 151.25,
        slippage: -0.25
      },
      {
        id: 'exec5',
        orderId: 'order5',
        symbol: 'TSLA',
        quantity: 30,
        price: 800.75,
        timestamp: '2023-01-17T10:05:00Z',
        venue: 'NASDAQ',
        orderType: 'MARKET',
        benchmarkPrice: 798.50,
        slippage: 2.25
      }
    ];
    
    // Filter by symbols if provided
    if (symbols && symbols.length > 0) {
      return allExecutions.filter(execution => symbols.includes(execution.symbol));
    }
    
    return allExecutions;
  }
  
  /**
   * Calculate execution metrics
   * @param executions Executions to analyze
   * @param benchmarkType Benchmark type
   * @returns Execution metrics
   */
  private calculateExecutionMetrics(executions: any[], benchmarkType: string): any {
    // Group executions by symbol
    const executionsBySymbol: Record<string, any> = {};
    
    for (const execution of executions) {
      if (!executionsBySymbol[execution.symbol]) {
        executionsBySymbol[execution.symbol] = {
          totalExecutions: 0,
          totalQuantity: 0,
          totalValue: 0,
          totalSlippage: 0,
          averageSlippage: 0,
          bestExecutions: 0
        };
      }
      
      const symbolMetrics = executionsBySymbol[execution.symbol];
      symbolMetrics.totalExecutions++;
      symbolMetrics.totalQuantity += execution.quantity;
      symbolMetrics.totalValue += execution.quantity * execution.price;
      symbolMetrics.totalSlippage += execution.slippage * execution.quantity;
      
      if (execution.slippage <= 0) {
        symbolMetrics.bestExecutions++;
      }
    }
    
    // Calculate averages for each symbol
    for (const symbol in executionsBySymbol) {
      const metrics = executionsBySymbol[symbol];
      metrics.averageSlippage = metrics.totalSlippage / metrics.totalQuantity;
      metrics.bestExecutionRate = metrics.bestExecutions / metrics.totalExecutions;
    }
    
    // Group executions by venue
    const executionsByVenue: Record<string, number> = {};
    
    for (const execution of executions) {
      executionsByVenue[execution.venue] = (executionsByVenue[execution.venue] || 0) + execution.quantity;
    }
    
    // Group executions by order type
    const executionsByOrderType: Record<string, number> = {};
    
    for (const execution of executions) {
      executionsByOrderType[execution.orderType] = (executionsByOrderType[execution.orderType] || 0) + execution.quantity;
    }
    
    // Calculate overall metrics
    const totalQuantity = executions.reduce((sum, execution) => sum + execution.quantity, 0);
    const totalSlippage = executions.reduce((sum, execution) => sum + execution.slippage * execution.quantity, 0);
    const bestExecutions = executions.filter(execution => execution.slippage <= 0).length;
    
    return {
      averageSlippage: totalQuantity > 0 ? totalSlippage / totalQuantity : 0,
      averageSavings: totalSlippage <= 0 ? Math.abs(totalSlippage) : 0,
      bestExecutionRate: executions.length > 0 ? bestExecutions / executions.length : 0,
      executionsBySymbol,
      executionsByVenue,
      executionsByOrderType
    };
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
export const complianceReportingService = ComplianceReportingService.getInstance();