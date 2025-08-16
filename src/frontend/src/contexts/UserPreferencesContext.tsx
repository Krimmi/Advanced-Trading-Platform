import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import settingsService, { UserPreferences } from '../services/settingsService';

// Define the extended ML preferences
export interface MLUserPreferences {
  // ML specific preferences
  mlDarkMode: boolean;
  mlCompactView: boolean;
  mlAutoRefresh: boolean;
  mlRefreshInterval: number;
  mlDefaultTab: string;
  mlSidebarOpen: boolean;
  mlDataDisplayFormat: 'table' | 'card' | 'chart';
  mlChartTheme: 'default' | 'monochrome' | 'vibrant';
}

// Default ML preferences
export const defaultMLPreferences: MLUserPreferences = {
  mlDarkMode: false,
  mlCompactView: false,
  mlAutoRefresh: false,
  mlRefreshInterval: 60,
  mlDefaultTab: 'dashboard',
  mlSidebarOpen: true,
  mlDataDisplayFormat: 'table',
  mlChartTheme: 'default',
};

// Context interface
interface UserPreferencesContextType {
  preferences: UserPreferences;
  mlPreferences: MLUserPreferences;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => Promise<void>;
  updateMLPreference: <K extends keyof MLUserPreferences>(key: K, value: MLUserPreferences[K]) => Promise<void>;
  resetPreferences: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

// Create context
const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

// Provider props
interface UserPreferencesProviderProps {
  children: ReactNode;
}

// Provider component
export const UserPreferencesProvider: React.FC<UserPreferencesProviderProps> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'light',
    default_dashboard: 'overview',
    notification_settings: {
      email_alerts: true,
      price_alerts: true,
      news_alerts: true,
      earnings_alerts: true,
    },
    chart_preferences: {
      default_timeframe: '1d',
      default_indicators: ['sma', 'volume'],
    },
  });
  
  const [mlPreferences, setMLPreferences] = useState<MLUserPreferences>(defaultMLPreferences);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load general preferences
        const userPrefs = await settingsService.getUserPreferences();
        setPreferences(userPrefs);
        
        // Load ML specific preferences from localStorage
        const storedMLPrefs = localStorage.getItem('mlUserPreferences');
        if (storedMLPrefs) {
          setMLPreferences(JSON.parse(storedMLPrefs));
        } else {
          // If no stored ML preferences, set defaults and save them
          localStorage.setItem('mlUserPreferences', JSON.stringify(defaultMLPreferences));
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading preferences:', err);
        setError('Failed to load preferences. Using defaults.');
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  // Update a general preference
  const updatePreference = async <K extends keyof UserPreferences>(
    key: K, 
    value: UserPreferences[K]
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      // Update in state
      const updatedPreferences = {
        ...preferences,
        [key]: value
      };
      setPreferences(updatedPreferences);
      
      // Update via API
      await settingsService.updateUserPreferences({ [key]: value } as Partial<UserPreferences>);
      
      setLoading(false);
    } catch (err) {
      console.error(`Error updating preference ${String(key)}:`, err);
      setError(`Failed to update ${String(key)} preference.`);
      setLoading(false);
      
      // Revert to previous value on error
      const userPrefs = await settingsService.getUserPreferences();
      setPreferences(userPrefs);
    }
  };

  // Update an ML preference
  const updateMLPreference = async <K extends keyof MLUserPreferences>(
    key: K, 
    value: MLUserPreferences[K]
  ) => {
    try {
      // Update in state
      const updatedMLPreferences = {
        ...mlPreferences,
        [key]: value
      };
      setMLPreferences(updatedMLPreferences);
      
      // Save to localStorage
      localStorage.setItem('mlUserPreferences', JSON.stringify(updatedMLPreferences));
      
      return Promise.resolve();
    } catch (err) {
      console.error(`Error updating ML preference ${String(key)}:`, err);
      return Promise.reject(err);
    }
  };

  // Reset preferences
  const resetPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Reset general preferences
      const defaultPrefs = {
        theme: 'light',
        default_dashboard: 'overview',
        notification_settings: {
          email_alerts: true,
          price_alerts: true,
          news_alerts: true,
          earnings_alerts: true,
        },
        chart_preferences: {
          default_timeframe: '1d',
          default_indicators: ['sma', 'volume'],
        },
      };
      
      setPreferences(defaultPrefs);
      await settingsService.updateUserPreferences(defaultPrefs);
      
      // Reset ML preferences
      setMLPreferences(defaultMLPreferences);
      localStorage.setItem('mlUserPreferences', JSON.stringify(defaultMLPreferences));
      
      setLoading(false);
    } catch (err) {
      console.error('Error resetting preferences:', err);
      setError('Failed to reset preferences.');
      setLoading(false);
    }
  };

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        mlPreferences,
        updatePreference,
        updateMLPreference,
        resetPreferences,
        loading,
        error
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
};

// Custom hook to use the preferences context
export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
};