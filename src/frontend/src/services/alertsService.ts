import { apiRequest } from './api';

// Types
export interface Alert {
  id: string;
  userId: string;
  type: 'price' | 'technical' | 'news' | 'earnings' | 'volume' | 'pattern' | 'prediction';
  symbol: string;
  condition: string;
  value: number | string;
  triggered: boolean;
  createdAt: string;
  updatedAt: string;
  triggeredAt?: string;
  expiresAt?: string;
  notificationMethod: 'email' | 'push' | 'sms' | 'in-app';
  message?: string;
}

export interface CreateAlertRequest {
  type: 'price' | 'technical' | 'news' | 'earnings' | 'volume' | 'pattern' | 'prediction';
  symbol: string;
  condition: string;
  value: number | string;
  notificationMethod: 'email' | 'push' | 'sms' | 'in-app';
  expiresAt?: string;
  message?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: any;
}

// Alerts service
const alertsService = {
  // Get all alerts for the current user
  getAlerts: () => {
    return apiRequest<Alert[]>({
      method: 'GET',
      url: '/api/alerts',
    });
  },

  // Get alerts by symbol
  getAlertsBySymbol: (symbol: string) => {
    return apiRequest<Alert[]>({
      method: 'GET',
      url: `/api/alerts/symbol/${symbol}`,
    });
  },

  // Create a new alert
  createAlert: (data: CreateAlertRequest) => {
    return apiRequest<Alert>({
      method: 'POST',
      url: '/api/alerts',
      data,
    });
  },

  // Update an existing alert
  updateAlert: (alertId: string, data: Partial<CreateAlertRequest>) => {
    return apiRequest<Alert>({
      method: 'PUT',
      url: `/api/alerts/${alertId}`,
      data,
    });
  },

  // Delete an alert
  deleteAlert: (alertId: string) => {
    return apiRequest<void>({
      method: 'DELETE',
      url: `/api/alerts/${alertId}`,
    });
  },

  // Get all notifications for the current user
  getNotifications: (limit: number = 50, offset: number = 0) => {
    return apiRequest<{ notifications: Notification[]; total: number }>({
      method: 'GET',
      url: '/api/alerts/notifications',
      params: {
        limit,
        offset,
      },
    });
  },

  // Mark notification as read
  markNotificationAsRead: (notificationId: string) => {
    return apiRequest<Notification>({
      method: 'PUT',
      url: `/api/alerts/notifications/${notificationId}/read`,
    });
  },

  // Mark all notifications as read
  markAllNotificationsAsRead: () => {
    return apiRequest<void>({
      method: 'PUT',
      url: '/api/alerts/notifications/read-all',
    });
  },

  // Delete a notification
  deleteNotification: (notificationId: string) => {
    return apiRequest<void>({
      method: 'DELETE',
      url: `/api/alerts/notifications/${notificationId}`,
    });
  },

  // Get alert types and available conditions
  getAlertTypes: () => {
    return apiRequest<{
      type: string;
      name: string;
      description: string;
      conditions: { id: string; name: string; description: string }[];
    }[]>({
      method: 'GET',
      url: '/api/alerts/types',
    });
  },

  // Test an alert condition (without creating it)
  testAlertCondition: (data: CreateAlertRequest) => {
    return apiRequest<{ valid: boolean; message: string; currentValue?: number | string }>({
      method: 'POST',
      url: '/api/alerts/test',
      data,
    });
  },
};

export default alertsService;