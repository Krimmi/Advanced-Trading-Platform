import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Types
interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  notifications: {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    autoHide?: boolean;
  }[];
  loading: {
    [key: string]: boolean;
  };
  chartTimeframe: '1d' | '5d' | '1m' | '3m' | '6m' | '1y' | '5y' | 'max';
}

// Initial state
const initialState: UIState = {
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  sidebarOpen: true,
  notifications: [],
  loading: {},
  chartTimeframe: '1m',
};

// Create slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.theme);
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    addNotification: (state, action: PayloadAction<{
      message: string;
      type: 'success' | 'error' | 'info' | 'warning';
      autoHide?: boolean;
    }>) => {
      const id = Date.now().toString();
      state.notifications.push({
        id,
        message: action.payload.message,
        type: action.payload.type,
        autoHide: action.payload.autoHide !== false, // Default to true
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setLoading: (state, action: PayloadAction<{ key: string; isLoading: boolean }>) => {
      state.loading[action.payload.key] = action.payload.isLoading;
    },
    setChartTimeframe: (state, action: PayloadAction<UIState['chartTimeframe']>) => {
      state.chartTimeframe = action.payload;
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  addNotification,
  removeNotification,
  clearNotifications,
  setLoading,
  setChartTimeframe,
} = uiSlice.actions;

export default uiSlice.reducer;