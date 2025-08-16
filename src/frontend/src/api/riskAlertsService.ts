/**
 * Risk Alerts API Service
 * This service provides methods to interact with the risk alerts API endpoints.
 */
import axios from 'axios';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/risk-alerts`;

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical"
}

/**
 * Alert status
 */
export enum AlertStatus {
  ACTIVE = "active",
  TRIGGERED = "triggered",
  RESOLVED = "resolved",
  DISMISSED = "dismissed"
}

/**
 * Notification methods
 */
export enum NotificationMethod {
  EMAIL = "email",
  PUSH = "push",
  SMS = "sms",
  ALL = "all"
}

/**
 * Alert operators
 */
export enum AlertOperator {
  GREATER_THAN = ">",
  LESS_THAN = "<",
  GREATER_THAN_OR_EQUAL = ">=",
  LESS_THAN_OR_EQUAL = "<=",
  EQUAL = "="
}

/**
 * Alert types
 */
export enum AlertType {
  VAR = "var",
  VOLATILITY = "volatility",
  DRAWDOWN = "drawdown",
  RETURN = "return",
  EXPOSURE = "exposure",
  CORRELATION = "correlation",
  PRICE = "price",
  VOLUME = "volume"
}

/**
 * Interface for risk alert
 */
export interface RiskAlert {
  id: string;
  user_id: string;
  portfolio_id?: string;
  type: AlertType;
  symbol?: string;
  operator: AlertOperator;
  value: number;
  enabled: boolean;
  notification_method: NotificationMethod;
  severity: AlertSeverity;
  status: AlertStatus;
  created_at: string;
  updated_at: string;
  last_triggered?: string;
  trigger_count: number;
  metadata: Record<string, any>;
}

/**
 * Interface for creating a risk alert
 */
export interface RiskAlertCreate {
  portfolio_id?: string;
  type: AlertType;
  symbol?: string;
  operator: AlertOperator;
  value: number;
  enabled: boolean;
  notification_method: NotificationMethod;
  severity: AlertSeverity;
  metadata?: Record<string, any>;
}

/**
 * Interface for updating a risk alert
 */
export interface RiskAlertUpdate {
  portfolio_id?: string;
  type?: AlertType;
  symbol?: string;
  operator?: AlertOperator;
  value?: number;
  enabled?: boolean;
  notification_method?: NotificationMethod;
  severity?: AlertSeverity;
  status?: AlertStatus;
  metadata?: Record<string, any>;
}

/**
 * Interface for notification
 */
export interface Notification {
  id: string;
  alert_id: string;
  user_id: string;
  message: string;
  severity: AlertSeverity;
  timestamp: string;
  data: Record<string, any>;
  read: boolean;
}

/**
 * Risk Alerts API Service
 */
const riskAlertsService = {
  /**
   * Create a new risk alert
   */
  async createAlert(
    userId: string,
    alertData: RiskAlertCreate
  ): Promise<RiskAlert> {
    try {
      const response = await axios.post(`${API_URL}/alerts?user_id=${userId}`, alertData);
      return response.data;
    } catch (error) {
      console.error('Error creating risk alert:', error);
      throw error;
    }
  },

  /**
   * Get all alerts for a user
   */
  async getUserAlerts(
    userId: string
  ): Promise<RiskAlert[]> {
    try {
      const response = await axios.get(`${API_URL}/alerts?user_id=${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user alerts:', error);
      throw error;
    }
  },

  /**
   * Get an alert by ID
   */
  async getAlert(
    alertId: string
  ): Promise<RiskAlert> {
    try {
      const response = await axios.get(`${API_URL}/alerts/${alertId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching alert ${alertId}:`, error);
      throw error;
    }
  },

  /**
   * Update an alert
   */
  async updateAlert(
    alertId: string,
    updateData: RiskAlertUpdate
  ): Promise<RiskAlert> {
    try {
      const response = await axios.put(`${API_URL}/alerts/${alertId}`, updateData);
      return response.data;
    } catch (error) {
      console.error(`Error updating alert ${alertId}:`, error);
      throw error;
    }
  },

  /**
   * Delete an alert
   */
  async deleteAlert(
    alertId: string
  ): Promise<boolean> {
    try {
      const response = await axios.delete(`${API_URL}/alerts/${alertId}`);
      return response.data.success;
    } catch (error) {
      console.error(`Error deleting alert ${alertId}:`, error);
      throw error;
    }
  },

  /**
   * Get all alerts for a portfolio
   */
  async getPortfolioAlerts(
    portfolioId: string
  ): Promise<RiskAlert[]> {
    try {
      const response = await axios.get(`${API_URL}/portfolio/${portfolioId}/alerts`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching portfolio alerts for ${portfolioId}:`, error);
      throw error;
    }
  },

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    limit: number = 50,
    unreadOnly: boolean = false
  ): Promise<Notification[]> {
    try {
      const response = await axios.get(
        `${API_URL}/notifications?user_id=${userId}&limit=${limit}&unread_only=${unreadOnly}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  },

  /**
   * Mark a notification as read
   */
  async markNotificationAsRead(
    notificationId: string
  ): Promise<boolean> {
    try {
      const response = await axios.post(`${API_URL}/notifications/${notificationId}/read`);
      return response.data.success;
    } catch (error) {
      console.error(`Error marking notification ${notificationId} as read:`, error);
      throw error;
    }
  },

  /**
   * Mark all notifications for a user as read
   */
  async markAllNotificationsAsRead(
    userId: string
  ): Promise<number> {
    try {
      const response = await axios.post(`${API_URL}/notifications/read-all?user_id=${userId}`);
      return response.data.count;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  /**
   * Start the alert evaluation loop
   */
  async startAlertEvaluation(): Promise<boolean> {
    try {
      const response = await axios.post(`${API_URL}/start-evaluation`);
      return response.data.success;
    } catch (error) {
      console.error('Error starting alert evaluation:', error);
      throw error;
    }
  },

  /**
   * Stop the alert evaluation loop
   */
  async stopAlertEvaluation(): Promise<boolean> {
    try {
      const response = await axios.post(`${API_URL}/stop-evaluation`);
      return response.data.success;
    } catch (error) {
      console.error('Error stopping alert evaluation:', error);
      throw error;
    }
  }
};

export default riskAlertsService;