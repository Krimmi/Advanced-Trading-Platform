/**
 * Settings service for the Ultimate Hedge Fund & Trading Application.
 * Handles user preferences, profile settings, and application configuration.
 */
import { apiRequest } from './api';

// Types
export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  last_login: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  default_dashboard: string;
  notification_settings: {
    email_alerts: boolean;
    price_alerts: boolean;
    news_alerts: boolean;
    earnings_alerts: boolean;
  };
  chart_preferences: {
    default_timeframe: string;
    default_indicators: string[];
  };
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

// Settings service
const settingsService = {
  // Get user profile
  getUserProfile: () => {
    return apiRequest<UserProfile>({
      method: 'GET',
      url: '/api/user/me',
    });
  },

  // Update user profile
  updateUserProfile: (data: Partial<UserProfile>) => {
    return apiRequest<UserProfile>({
      method: 'PUT',
      url: '/api/user/me',
      data,
    });
  },

  // Get user preferences
  getUserPreferences: () => {
    return apiRequest<UserPreferences>({
      method: 'GET',
      url: '/api/user/preferences',
    });
  },

  // Update user preferences
  updateUserPreferences: (data: Partial<UserPreferences>) => {
    return apiRequest<UserPreferences>({
      method: 'PUT',
      url: '/api/user/preferences',
      data,
    });
  },

  // Update theme preference
  updateTheme: (theme: 'light' | 'dark') => {
    return apiRequest<UserPreferences>({
      method: 'PUT',
      url: '/api/user/preferences',
      data: {
        theme,
      },
    });
  },

  // Update default dashboard
  updateDefaultDashboard: (default_dashboard: string) => {
    return apiRequest<UserPreferences>({
      method: 'PUT',
      url: '/api/user/preferences',
      data: {
        default_dashboard,
      },
    });
  },

  // Update notification settings
  updateNotificationSettings: (notification_settings: Partial<UserPreferences['notification_settings']>) => {
    return apiRequest<UserPreferences>({
      method: 'PUT',
      url: '/api/user/preferences',
      data: {
        notification_settings,
      },
    });
  },

  // Update chart preferences
  updateChartPreferences: (chart_preferences: Partial<UserPreferences['chart_preferences']>) => {
    return apiRequest<UserPreferences>({
      method: 'PUT',
      url: '/api/user/preferences',
      data: {
        chart_preferences,
      },
    });
  },

  // Change password
  changePassword: (data: PasswordChangeRequest) => {
    return apiRequest<{ message: string }>({
      method: 'POST',
      url: '/api/user/change-password',
      data,
    });
  },
};

export default settingsService;