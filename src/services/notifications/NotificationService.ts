import { EventEmitter } from 'events';
import { MarketDataStreamingService } from '../streaming/MarketDataStreamingService';
import { RealTimeAnalyticsService, AnalyticsType, AnalyticsResult } from '../analytics/RealTimeAnalyticsService';
import { MarketDataType, MarketDataMessage } from '../websocket/MarketDataWebSocketService';

/**
 * Notification priority levels
 */
export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Notification categories
 */
export enum NotificationCategory {
  PRICE_ALERT = 'price_alert',
  VOLUME_ALERT = 'volume_alert',
  TECHNICAL_INDICATOR = 'technical_indicator',
  NEWS = 'news',
  EARNINGS = 'earnings',
  MARKET_STATUS = 'market_status',
  SYSTEM = 'system',
  TRADE_EXECUTION = 'trade_execution',
  RISK_ALERT = 'risk_alert',
  ANALYTICS_INSIGHT = 'analytics_insight'
}

/**
 * Notification delivery channels
 */
export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WEBHOOK = 'webhook'
}

/**
 * Notification interface
 */
export interface Notification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  timestamp: number;
  source: string;
  metadata?: Record<string, any>;
  read?: boolean;
  dismissed?: boolean;
  deliveryChannels?: NotificationChannel[];
  expiresAt?: number;
  actionUrl?: string;
  actionLabel?: string;
}

/**
 * Alert rule configuration
 */
export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  condition: AlertCondition;
  actions: AlertAction[];
  throttleMs?: number;
  lastTriggered?: number;
}

/**
 * Alert condition types
 */
export enum AlertConditionType {
  PRICE_THRESHOLD = 'price_threshold',
  PRICE_CHANGE = 'price_change',
  VOLUME_THRESHOLD = 'volume_threshold',
  VOLUME_CHANGE = 'volume_change',
  TECHNICAL_INDICATOR = 'technical_indicator',
  NEWS_KEYWORD = 'news_keyword',
  ANALYTICS_THRESHOLD = 'analytics_threshold',
  COMPOSITE = 'composite'
}

/**
 * Alert condition interface
 */
export interface AlertCondition {
  type: AlertConditionType;
  parameters: Record<string, any>;
  symbols?: string[];
  dataTypes?: MarketDataType[];
  analyticsTypes?: AnalyticsType[];
}

/**
 * Alert action types
 */
export enum AlertActionType {
  SEND_NOTIFICATION = 'send_notification',
  EXECUTE_TRADE = 'execute_trade',
  WEBHOOK = 'webhook',
  EMAIL = 'email',
  SMS = 'sms'
}

/**
 * Alert action interface
 */
export interface AlertAction {
  type: AlertActionType;
  parameters: Record<string, any>;
}

/**
 * NotificationService manages real-time alerts and notifications based on
 * market data, analytics, and custom alert rules.
 */
export class NotificationService extends EventEmitter {
  private static instance: NotificationService;
  private streamingService: MarketDataStreamingService;
  private analyticsService: RealTimeAnalyticsService;
  private alertRules: Map<string, AlertRule> = new Map();
  private notifications: Notification[] = [];
  private dataSubscriptions: Map<string, string[]> = new Map();
  private analyticsSubscriptions: Map<string, string[]> = new Map();
  private isInitialized: boolean = false;
  private maxNotifications: number = 1000;
  private channelHandlers: Map<NotificationChannel, (notification: Notification) => Promise<boolean>> = new Map();

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    super();
    this.streamingService = MarketDataStreamingService.getInstance();
    this.analyticsService = RealTimeAnalyticsService.getInstance();
    this.registerDefaultChannelHandlers();
  }

  /**
   * Gets the singleton instance of NotificationService
   * @returns NotificationService instance
   */
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initializes the notification service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    // Initialize dependencies if needed
    if (!this.streamingService.getConnectionStatus().size) {
      await this.streamingService.initialize();
    }
    
    if (!this.analyticsService.getAvailableAnalyticsTypes().length) {
      await this.analyticsService.initialize();
    }
    
    this.isInitialized = true;
    this.emit('initialized');
  }

  /**
   * Adds an alert rule
   * @param rule Alert rule to add
   * @returns Rule ID
   */
  public addAlertRule(rule: AlertRule): string {
    if (!this.isInitialized) {
      throw new Error('NotificationService not initialized');
    }
    
    // Generate ID if not provided
    if (!rule.id) {
      rule.id = `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Store the rule
    this.alertRules.set(rule.id, rule);
    
    // Set up subscriptions for the rule
    this.setupRuleSubscriptions(rule);
    
    this.emit('ruleAdded', rule);
    
    return rule.id;
  }

  /**
   * Updates an existing alert rule
   * @param ruleId Rule ID
   * @param updates Updates to apply
   * @returns True if updated successfully
   */
  public updateAlertRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.alertRules.get(ruleId);
    
    if (!rule) {
      return false;
    }
    
    // Apply updates
    const updatedRule = { ...rule, ...updates };
    
    // Check if condition or symbols changed
    const conditionChanged = updates.condition !== undefined;
    const enabledChanged = updates.enabled !== undefined && updates.enabled !== rule.enabled;
    
    // Update the rule
    this.alertRules.set(ruleId, updatedRule);
    
    // Update subscriptions if needed
    if (conditionChanged || enabledChanged) {
      this.removeRuleSubscriptions(ruleId);
      
      if (updatedRule.enabled) {
        this.setupRuleSubscriptions(updatedRule);
      }
    }
    
    this.emit('ruleUpdated', updatedRule);
    
    return true;
  }

  /**
   * Removes an alert rule
   * @param ruleId Rule ID
   * @returns True if removed successfully
   */
  public removeAlertRule(ruleId: string): boolean {
    if (!this.alertRules.has(ruleId)) {
      return false;
    }
    
    // Remove subscriptions
    this.removeRuleSubscriptions(ruleId);
    
    // Remove the rule
    this.alertRules.delete(ruleId);
    
    this.emit('ruleRemoved', ruleId);
    
    return true;
  }

  /**
   * Gets all alert rules
   * @returns Map of rule IDs to rules
   */
  public getAlertRules(): Map<string, AlertRule> {
    return new Map(this.alertRules);
  }

  /**
   * Gets a specific alert rule
   * @param ruleId Rule ID
   * @returns Alert rule or undefined
   */
  public getAlertRule(ruleId: string): AlertRule | undefined {
    return this.alertRules.get(ruleId);
  }

  /**
   * Enables an alert rule
   * @param ruleId Rule ID
   * @returns True if enabled successfully
   */
  public enableAlertRule(ruleId: string): boolean {
    return this.updateAlertRule(ruleId, { enabled: true });
  }

  /**
   * Disables an alert rule
   * @param ruleId Rule ID
   * @returns True if disabled successfully
   */
  public disableAlertRule(ruleId: string): boolean {
    return this.updateAlertRule(ruleId, { enabled: false });
  }

  /**
   * Gets all notifications
   * @param limit Maximum number of notifications to return
   * @param offset Offset for pagination
   * @returns Array of notifications
   */
  public getNotifications(limit: number = 100, offset: number = 0): Notification[] {
    // Sort by timestamp descending
    const sorted = [...this.notifications].sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply pagination
    return sorted.slice(offset, offset + limit);
  }

  /**
   * Gets unread notifications
   * @param limit Maximum number of notifications to return
   * @returns Array of unread notifications
   */
  public getUnreadNotifications(limit: number = 100): Notification[] {
    // Filter unread and sort by timestamp descending
    const unread = this.notifications
      .filter(n => !n.read)
      .sort((a, b) => b.timestamp - a.timestamp);
    
    return unread.slice(0, limit);
  }

  /**
   * Marks a notification as read
   * @param notificationId Notification ID
   * @returns True if marked as read successfully
   */
  public markAsRead(notificationId: string): boolean {
    const notification = this.notifications.find(n => n.id === notificationId);
    
    if (!notification) {
      return false;
    }
    
    notification.read = true;
    this.emit('notificationRead', notification);
    
    return true;
  }

  /**
   * Marks all notifications as read
   */
  public markAllAsRead(): void {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
    
    this.emit('allNotificationsRead');
  }

  /**
   * Dismisses a notification
   * @param notificationId Notification ID
   * @returns True if dismissed successfully
   */
  public dismissNotification(notificationId: string): boolean {
    const notification = this.notifications.find(n => n.id === notificationId);
    
    if (!notification) {
      return false;
    }
    
    notification.dismissed = true;
    this.emit('notificationDismissed', notification);
    
    return true;
  }

  /**
   * Clears all notifications
   */
  public clearAllNotifications(): void {
    this.notifications = [];
    this.emit('notificationsCleared');
  }

  /**
   * Sends a notification
   * @param notification Notification to send
   * @returns Notification ID
   */
  public async sendNotification(notification: Partial<Notification>): Promise<string> {
    // Generate ID if not provided
    const id = notification.id || `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create full notification
    const fullNotification: Notification = {
      id,
      title: notification.title || 'Notification',
      message: notification.message || '',
      category: notification.category || NotificationCategory.SYSTEM,
      priority: notification.priority || NotificationPriority.MEDIUM,
      timestamp: notification.timestamp || Date.now(),
      source: notification.source || 'system',
      metadata: notification.metadata || {},
      read: notification.read || false,
      dismissed: notification.dismissed || false,
      deliveryChannels: notification.deliveryChannels || [NotificationChannel.IN_APP],
      expiresAt: notification.expiresAt,
      actionUrl: notification.actionUrl,
      actionLabel: notification.actionLabel
    };
    
    // Add to notifications list
    this.notifications.unshift(fullNotification);
    
    // Trim if exceeding max
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }
    
    // Emit event
    this.emit('notification', fullNotification);
    
    // Deliver to channels
    if (fullNotification.deliveryChannels) {
      for (const channel of fullNotification.deliveryChannels) {
        const handler = this.channelHandlers.get(channel);
        
        if (handler) {
          try {
            await handler(fullNotification);
          } catch (error) {
            console.error(`Error delivering notification to channel ${channel}:`, error);
          }
        }
      }
    }
    
    return id;
  }

  /**
   * Registers a channel handler
   * @param channel Notification channel
   * @param handler Handler function
   */
  public registerChannelHandler(
    channel: NotificationChannel,
    handler: (notification: Notification) => Promise<boolean>
  ): void {
    this.channelHandlers.set(channel, handler);
  }

  /**
   * Sets up subscriptions for an alert rule
   * @param rule Alert rule
   */
  private setupRuleSubscriptions(rule: AlertRule): void {
    if (!rule.enabled) {
      return;
    }
    
    const { condition } = rule;
    
    // Set up market data subscriptions
    if (condition.symbols && condition.dataTypes) {
      const dataSubscriptionId = this.streamingService.subscribe({
        dataTypes: condition.dataTypes,
        symbols: condition.symbols,
        throttleRate: 5, // Limit to 5 updates per second for alerts
        bufferSize: 100,
        priority: 10, // High priority
      });
      
      // Store subscription ID
      if (!this.dataSubscriptions.has(rule.id)) {
        this.dataSubscriptions.set(rule.id, []);
      }
      
      this.dataSubscriptions.get(rule.id)!.push(dataSubscriptionId);
      
      // Set up listeners for each data type
      for (const dataType of condition.dataTypes) {
        this.streamingService.addListener(
          dataSubscriptionId,
          dataType,
          (data: MarketDataMessage) => this.handleMarketData(rule, data)
        );
      }
    }
    
    // Set up analytics subscriptions
    if (condition.symbols && condition.analyticsTypes) {
      for (const analyticsType of condition.analyticsTypes) {
        const analyticsSubscriptionId = this.analyticsService.subscribe({
          type: analyticsType,
          symbols: condition.symbols,
          parameters: condition.parameters,
          windowSize: 60000, // 1 minute window
          updateInterval: 5000, // Update every 5 seconds
          requiredDataTypes: this.getRequiredDataTypes(analyticsType)
        });
        
        // Store subscription ID
        if (!this.analyticsSubscriptions.has(rule.id)) {
          this.analyticsSubscriptions.set(rule.id, []);
        }
        
        this.analyticsSubscriptions.get(rule.id)!.push(analyticsSubscriptionId);
        
        // Set up listener
        this.analyticsService.addListener(
          analyticsSubscriptionId,
          (result: AnalyticsResult) => this.handleAnalyticsResult(rule, result)
        );
      }
    }
  }

  /**
   * Removes subscriptions for an alert rule
   * @param ruleId Rule ID
   */
  private removeRuleSubscriptions(ruleId: string): void {
    // Remove market data subscriptions
    const dataSubscriptions = this.dataSubscriptions.get(ruleId);
    
    if (dataSubscriptions) {
      for (const subscriptionId of dataSubscriptions) {
        this.streamingService.unsubscribe(subscriptionId);
      }
      
      this.dataSubscriptions.delete(ruleId);
    }
    
    // Remove analytics subscriptions
    const analyticsSubscriptions = this.analyticsSubscriptions.get(ruleId);
    
    if (analyticsSubscriptions) {
      for (const subscriptionId of analyticsSubscriptions) {
        this.analyticsService.unsubscribe(subscriptionId);
      }
      
      this.analyticsSubscriptions.delete(ruleId);
    }
  }

  /**
   * Handles market data for alert rules
   * @param rule Alert rule
   * @param data Market data message
   */
  private handleMarketData(rule: AlertRule, data: MarketDataMessage): void {
    if (!rule.enabled) {
      return;
    }
    
    // Check throttling
    if (rule.throttleMs && rule.lastTriggered) {
      const elapsed = Date.now() - rule.lastTriggered;
      
      if (elapsed < rule.throttleMs) {
        return;
      }
    }
    
    // Evaluate condition
    const triggered = this.evaluateMarketDataCondition(rule.condition, data);
    
    if (triggered) {
      // Update last triggered time
      rule.lastTriggered = Date.now();
      
      // Execute actions
      this.executeActions(rule, data);
    }
  }

  /**
   * Handles analytics results for alert rules
   * @param rule Alert rule
   * @param result Analytics result
   */
  private handleAnalyticsResult(rule: AlertRule, result: AnalyticsResult): void {
    if (!rule.enabled) {
      return;
    }
    
    // Check throttling
    if (rule.throttleMs && rule.lastTriggered) {
      const elapsed = Date.now() - rule.lastTriggered;
      
      if (elapsed < rule.throttleMs) {
        return;
      }
    }
    
    // Evaluate condition
    const triggered = this.evaluateAnalyticsCondition(rule.condition, result);
    
    if (triggered) {
      // Update last triggered time
      rule.lastTriggered = Date.now();
      
      // Execute actions
      this.executeActions(rule, result);
    }
  }

  /**
   * Evaluates a market data condition
   * @param condition Alert condition
   * @param data Market data message
   * @returns True if condition is met
   */
  private evaluateMarketDataCondition(condition: AlertCondition, data: MarketDataMessage): boolean {
    const { type, parameters } = condition;
    
    switch (type) {
      case AlertConditionType.PRICE_THRESHOLD: {
        if (data.type !== MarketDataType.TRADES && data.type !== MarketDataType.QUOTES) {
          return false;
        }
        
        let price: number;
        
        if (data.type === MarketDataType.TRADES) {
          price = data.data.price;
        } else {
          // For quotes, use mid price
          price = (data.data.bid + data.data.ask) / 2;
        }
        
        const { operator, threshold } = parameters;
        
        switch (operator) {
          case 'above':
            return price > threshold;
          case 'below':
            return price < threshold;
          case 'equal':
            return Math.abs(price - threshold) < 0.0001;
          default:
            return false;
        }
      }
      
      case AlertConditionType.PRICE_CHANGE: {
        // Price change requires historical data, which is not available in a single message
        return false;
      }
      
      case AlertConditionType.VOLUME_THRESHOLD: {
        if (data.type !== MarketDataType.TRADES && data.type !== MarketDataType.BARS) {
          return false;
        }
        
        let volume: number;
        
        if (data.type === MarketDataType.TRADES) {
          volume = data.data.size;
        } else {
          volume = data.data.volume;
        }
        
        const { operator, threshold } = parameters;
        
        switch (operator) {
          case 'above':
            return volume > threshold;
          case 'below':
            return volume < threshold;
          case 'equal':
            return volume === threshold;
          default:
            return false;
        }
      }
      
      default:
        return false;
    }
  }

  /**
   * Evaluates an analytics condition
   * @param condition Alert condition
   * @param result Analytics result
   * @returns True if condition is met
   */
  private evaluateAnalyticsCondition(condition: AlertCondition, result: AnalyticsResult): boolean {
    const { type, parameters } = condition;
    
    if (type !== AlertConditionType.ANALYTICS_THRESHOLD) {
      return false;
    }
    
    const { analyticsType, operator, threshold } = parameters;
    
    // Check if analytics type matches
    if (analyticsType !== result.type) {
      return false;
    }
    
    // Get value to compare
    let value: number;
    
    if (typeof result.value === 'number') {
      value = result.value;
    } else if (typeof result.value === 'object' && parameters.field) {
      value = result.value[parameters.field];
    } else {
      return false;
    }
    
    // Compare with threshold
    switch (operator) {
      case 'above':
        return value > threshold;
      case 'below':
        return value < threshold;
      case 'equal':
        return Math.abs(value - threshold) < 0.0001;
      default:
        return false;
    }
  }

  /**
   * Executes actions for a triggered rule
   * @param rule Alert rule
   * @param data Trigger data
   */
  private async executeActions(rule: AlertRule, data: any): Promise<void> {
    for (const action of rule.actions) {
      try {
        await this.executeAction(action, rule, data);
      } catch (error) {
        console.error(`Error executing action for rule ${rule.id}:`, error);
      }
    }
  }

  /**
   * Executes a single action
   * @param action Alert action
   * @param rule Alert rule
   * @param data Trigger data
   */
  private async executeAction(action: AlertAction, rule: AlertRule, data: any): Promise<void> {
    const { type, parameters } = action;
    
    switch (type) {
      case AlertActionType.SEND_NOTIFICATION: {
        const symbol = data.symbol;
        const title = parameters.title || `Alert: ${rule.name}`;
        const message = this.formatMessage(parameters.message || '', rule, data);
        
        await this.sendNotification({
          title,
          message,
          category: parameters.category || NotificationCategory.PRICE_ALERT,
          priority: parameters.priority || NotificationPriority.MEDIUM,
          source: 'alert',
          metadata: {
            ruleId: rule.id,
            ruleName: rule.name,
            symbol,
            triggerData: data
          },
          deliveryChannels: parameters.channels || [NotificationChannel.IN_APP],
          actionUrl: parameters.actionUrl,
          actionLabel: parameters.actionLabel
        });
        
        break;
      }
      
      // Other action types would be implemented here
      
      default:
        console.warn(`Unsupported action type: ${type}`);
    }
  }

  /**
   * Formats a message template with data
   * @param template Message template
   * @param rule Alert rule
   * @param data Trigger data
   * @returns Formatted message
   */
  private formatMessage(template: string, rule: AlertRule, data: any): string {
    let message = template;
    
    // Replace placeholders
    message = message.replace(/\{symbol\}/g, data.symbol || '');
    message = message.replace(/\{ruleName\}/g, rule.name || '');
    message = message.replace(/\{timestamp\}/g, new Date().toLocaleString());
    
    // Replace data-specific placeholders
    if (data.type === MarketDataType.TRADES) {
      message = message.replace(/\{price\}/g, data.data.price?.toFixed(2) || '');
      message = message.replace(/\{size\}/g, data.data.size || '');
    } else if (data.type === MarketDataType.QUOTES) {
      message = message.replace(/\{bid\}/g, data.data.bid?.toFixed(2) || '');
      message = message.replace(/\{ask\}/g, data.data.ask?.toFixed(2) || '');
      message = message.replace(/\{spread\}/g, (data.data.ask - data.data.bid)?.toFixed(2) || '');
    } else if (data.type === MarketDataType.BARS) {
      message = message.replace(/\{open\}/g, data.data.open?.toFixed(2) || '');
      message = message.replace(/\{high\}/g, data.data.high?.toFixed(2) || '');
      message = message.replace(/\{low\}/g, data.data.low?.toFixed(2) || '');
      message = message.replace(/\{close\}/g, data.data.close?.toFixed(2) || '');
      message = message.replace(/\{volume\}/g, data.data.volume || '');
    }
    
    return message;
  }

  /**
   * Gets required data types for an analytics type
   * @param analyticsType Analytics type
   * @returns Array of required data types
   */
  private getRequiredDataTypes(analyticsType: AnalyticsType): MarketDataType[] {
    switch (analyticsType) {
      case AnalyticsType.PRICE_MOMENTUM:
        return [MarketDataType.TRADES, MarketDataType.BARS];
      case AnalyticsType.VOLUME_PROFILE:
        return [MarketDataType.TRADES];
      case AnalyticsType.PRICE_VOLATILITY:
        return [MarketDataType.TRADES, MarketDataType.BARS];
      case AnalyticsType.BID_ASK_SPREAD:
        return [MarketDataType.QUOTES];
      case AnalyticsType.VWAP:
        return [MarketDataType.TRADES];
      case AnalyticsType.ORDER_IMBALANCE:
        return [MarketDataType.QUOTES, MarketDataType.TRADES];
      case AnalyticsType.PRICE_LEVEL_ACTIVITY:
        return [MarketDataType.TRADES, MarketDataType.LEVEL2];
      case AnalyticsType.RELATIVE_STRENGTH:
        return [MarketDataType.TRADES, MarketDataType.BARS];
      case AnalyticsType.CORRELATION:
        return [MarketDataType.TRADES, MarketDataType.BARS];
      case AnalyticsType.MARKET_DEPTH:
        return [MarketDataType.LEVEL2];
      default:
        return [MarketDataType.TRADES];
    }
  }

  /**
   * Registers default channel handlers
   */
  private registerDefaultChannelHandlers(): void {
    // In-app notifications (default)
    this.registerChannelHandler(NotificationChannel.IN_APP, async (notification) => {
      // In-app notifications are handled by the notifications array
      return true;
    });
    
    // Console log for development
    this.registerChannelHandler(NotificationChannel.EMAIL, async (notification) => {
      console.log(`[EMAIL NOTIFICATION] ${notification.title}: ${notification.message}`);
      return true;
    });
    
    // Console log for development
    this.registerChannelHandler(NotificationChannel.SMS, async (notification) => {
      console.log(`[SMS NOTIFICATION] ${notification.title}: ${notification.message}`);
      return true;
    });
    
    // Console log for development
    this.registerChannelHandler(NotificationChannel.PUSH, async (notification) => {
      console.log(`[PUSH NOTIFICATION] ${notification.title}: ${notification.message}`);
      return true;
    });
    
    // Console log for development
    this.registerChannelHandler(NotificationChannel.WEBHOOK, async (notification) => {
      console.log(`[WEBHOOK NOTIFICATION] ${notification.title}: ${notification.message}`);
      return true;
    });
  }

  /**
   * Shuts down the service
   */
  public shutdown(): void {
    // Remove all alert rules
    for (const ruleId of this.alertRules.keys()) {
      this.removeAlertRule(ruleId);
    }
    
    this.isInitialized = false;
    this.emit('shutdown');
  }
}