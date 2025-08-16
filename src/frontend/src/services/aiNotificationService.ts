import { api } from './api';

export interface AINotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'alert' | 'insight' | 'news' | 'earnings' | 'price' | 'volume' | 'pattern' | 'custom';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived' | 'dismissed';
  source: 'system' | 'user' | 'market' | 'news' | 'social' | 'analysis';
  relatedSymbols?: string[];
  createdAt: string;
  expiresAt?: string;
  actions?: AINotificationAction[];
  metadata?: Record<string, any>;
}

export interface AINotificationAction {
  id: string;
  label: string;
  type: 'link' | 'button' | 'trade' | 'dismiss' | 'snooze' | 'custom';
  payload?: any;
}

export interface AINotificationPreference {
  id: string;
  userId: string;
  type: string;
  enabled: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deliveryChannels: ('app' | 'email' | 'sms' | 'push')[];
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  quietHours?: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
    timezone: string;
  };
  filters?: Record<string, any>;
}

export interface SmartAlertConfig {
  id: string;
  userId: string;
  name: string;
  description?: string;
  enabled: boolean;
  conditions: SmartAlertCondition[];
  actions: SmartAlertAction[];
  schedule?: {
    type: 'once' | 'recurring';
    startDate?: string;
    endDate?: string;
    time?: string;
    days?: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
    frequency?: 'daily' | 'weekly' | 'monthly';
  };
  createdAt: string;
  updatedAt: string;
}

export interface SmartAlertCondition {
  id: string;
  type: 'price' | 'volume' | 'technical' | 'fundamental' | 'news' | 'social' | 'custom';
  parameters: Record<string, any>;
  operator?: 'and' | 'or';
}

export interface SmartAlertAction {
  id: string;
  type: 'notification' | 'email' | 'sms' | 'webhook' | 'trade' | 'custom';
  parameters: Record<string, any>;
}

export interface NotificationInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  data: any;
  period: {
    start: string;
    end: string;
  };
  createdAt: string;
}

class AINotificationService {
  /**
   * Get all notifications for the current user
   */
  async getNotifications(
    status?: 'unread' | 'read' | 'archived' | 'dismissed',
    limit: number = 50,
    offset: number = 0
  ): Promise<{ notifications: AINotification[]; total: number }> {
    try {
      const params: Record<string, any> = { limit, offset };
      if (status) {
        params.status = status;
      }

      const response = await api.get('/api/notifications', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Get a specific notification by ID
   */
  async getNotificationById(id: string): Promise<AINotification> {
    try {
      const response = await api.get(`/api/notifications/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching notification ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update notification status
   */
  async updateNotificationStatus(
    id: string,
    status: 'read' | 'unread' | 'archived' | 'dismissed'
  ): Promise<AINotification> {
    try {
      const response = await api.patch(`/api/notifications/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error updating notification ${id} status:`, error);
      throw error;
    }
  }

  /**
   * Batch update notification status
   */
  async batchUpdateNotificationStatus(
    ids: string[],
    status: 'read' | 'unread' | 'archived' | 'dismissed'
  ): Promise<{ success: boolean; count: number }> {
    try {
      const response = await api.patch('/api/notifications/batch/status', { ids, status });
      return response.data;
    } catch (error) {
      console.error('Error batch updating notification status:', error);
      throw error;
    }
  }

  /**
   * Get notification preferences
   */
  async getNotificationPreferences(): Promise<AINotificationPreference[]> {
    try {
      const response = await api.get('/api/notifications/preferences');
      return response.data;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreference(
    id: string,
    updates: Partial<AINotificationPreference>
  ): Promise<AINotificationPreference> {
    try {
      const response = await api.patch(`/api/notifications/preferences/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error(`Error updating notification preference ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get smart alert configurations
   */
  async getSmartAlertConfigs(): Promise<SmartAlertConfig[]> {
    try {
      const response = await api.get('/api/notifications/smart-alerts');
      return response.data;
    } catch (error) {
      console.error('Error fetching smart alert configs:', error);
      throw error;
    }
  }

  /**
   * Get a specific smart alert configuration
   */
  async getSmartAlertConfigById(id: string): Promise<SmartAlertConfig> {
    try {
      const response = await api.get(`/api/notifications/smart-alerts/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching smart alert config ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new smart alert configuration
   */
  async createSmartAlertConfig(config: Omit<SmartAlertConfig, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<SmartAlertConfig> {
    try {
      const response = await api.post('/api/notifications/smart-alerts', config);
      return response.data;
    } catch (error) {
      console.error('Error creating smart alert config:', error);
      throw error;
    }
  }

  /**
   * Update a smart alert configuration
   */
  async updateSmartAlertConfig(id: string, updates: Partial<SmartAlertConfig>): Promise<SmartAlertConfig> {
    try {
      const response = await api.patch(`/api/notifications/smart-alerts/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error(`Error updating smart alert config ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a smart alert configuration
   */
  async deleteSmartAlertConfig(id: string): Promise<{ success: boolean }> {
    try {
      const response = await api.delete(`/api/notifications/smart-alerts/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting smart alert config ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get notification insights
   */
  async getNotificationInsights(
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<NotificationInsight[]> {
    try {
      const response = await api.get('/api/notifications/insights', {
        params: { period },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching notification insights:', error);
      throw error;
    }
  }

  /**
   * Get notification count by status
   */
  async getNotificationCounts(): Promise<Record<string, number>> {
    try {
      const response = await api.get('/api/notifications/counts');
      return response.data;
    } catch (error) {
      console.error('Error fetching notification counts:', error);
      throw error;
    }
  }

  /**
   * Execute an action on a notification
   */
  async executeNotificationAction(notificationId: string, actionId: string): Promise<any> {
    try {
      const response = await api.post(`/api/notifications/${notificationId}/actions/${actionId}`);
      return response.data;
    } catch (error) {
      console.error(`Error executing action ${actionId} on notification ${notificationId}:`, error);
      throw error;
    }
  }

  /**
   * Test a smart alert configuration
   */
  async testSmartAlertConfig(config: Partial<SmartAlertConfig>): Promise<{ valid: boolean; message?: string; sampleNotification?: AINotification }> {
    try {
      const response = await api.post('/api/notifications/smart-alerts/test', config);
      return response.data;
    } catch (error) {
      console.error('Error testing smart alert config:', error);
      throw error;
    }
  }

  /**
   * Get available condition types and their parameters
   */
  async getAvailableConditionTypes(): Promise<{ type: string; name: string; description: string; parameters: any[] }[]> {
    try {
      const response = await api.get('/api/notifications/smart-alerts/condition-types');
      return response.data;
    } catch (error) {
      console.error('Error fetching available condition types:', error);
      throw error;
    }
  }

  /**
   * Get available action types and their parameters
   */
  async getAvailableActionTypes(): Promise<{ type: string; name: string; description: string; parameters: any[] }[]> {
    try {
      const response = await api.get('/api/notifications/smart-alerts/action-types');
      return response.data;
    } catch (error) {
      console.error('Error fetching available action types:', error);
      throw error;
    }
  }
}

export const aiNotificationService = new AINotificationService();
export default aiNotificationService;