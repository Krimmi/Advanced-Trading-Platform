import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

// Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  autoHideDuration?: number;
  showProgress?: boolean;
  action?: React.ReactNode;
  data?: any;
}

export interface ThemeSettings {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  density: 'comfortable' | 'compact' | 'standard';
  borderRadius: number;
}

interface UiState {
  sidebarOpen: boolean;
  notifications: Notification[];
  theme: ThemeSettings;
  loading: {
    global: boolean;
    [key: string]: boolean;
  };
  lastRefresh: string | null;
}

const initialState: UiState = {
  sidebarOpen: true,
  notifications: [],
  theme: {
    mode: 'system',
    primaryColor: '#1976d2',
    density: 'standard',
    borderRadius: 8,
  },
  loading: {
    global: false,
  },
  lastRefresh: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state, action: PayloadAction<boolean | undefined>) => {
      state.sidebarOpen = action.payload !== undefined ? action.payload : !state.sidebarOpen;
    },
    
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const notification = {
        ...action.payload,
        id: uuidv4(),
      };
      
      state.notifications.push(notification);
      
      // Limit the number of notifications to prevent memory issues
      if (state.notifications.length > 10) {
        state.notifications.shift();
      }
    },
    
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    setTheme: (state, action: PayloadAction<Partial<ThemeSettings>>) => {
      state.theme = {
        ...state.theme,
        ...action.payload,
      };
    },
    
    setLoading: (state, action: PayloadAction<{ key: string; isLoading: boolean }>) => {
      const { key, isLoading } = action.payload;
      state.loading[key] = isLoading;
      
      // Update global loading state based on any active loading
      const loadingKeys = Object.keys(state.loading).filter(k => k !== 'global');
      state.loading.global = loadingKeys.some(k => state.loading[k]);
    },
    
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.global = action.payload;
    },
    
    refreshData: (state) => {
      state.lastRefresh = new Date().toISOString();
    },
  },
});

export const {
  toggleSidebar,
  addNotification,
  removeNotification,
  clearNotifications,
  setTheme,
  setLoading,
  setGlobalLoading,
  refreshData,
} = uiSlice.actions;

export default uiSlice.reducer;