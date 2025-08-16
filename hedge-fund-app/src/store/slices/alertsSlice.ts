import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import apiClient from '../../services/api/apiClient';

// Types
export interface Alert {
  id: string;
  type: 'price' | 'technical' | 'news' | 'portfolio' | 'market' | 'system' | 'ml';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  symbol?: string;
  portfolioId?: string;
  timestamp: string;
  read: boolean;
  dismissed: boolean;
  actions?: {
    label: string;
    action: string;
    data?: any;
  }[];
  metadata?: Record<string, any>;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  type: 'above' | 'below' | 'percent_change' | 'volume';
  value: number;
  active: boolean;
  triggered: boolean;
  lastTriggered?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AlertsState {
  alerts: Record<string, Alert>;
  priceAlerts: Record<string, PriceAlert>;
  unreadCount: number;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

// Initial state
const initialState: AlertsState = {
  alerts: {},
  priceAlerts: {},
  unreadCount: 0,
  loading: false,
  error: null,
  lastUpdated: null,
};

// Mock data for alerts
const mockAlerts: Alert[] = [
  {
    id: 'alert-1',
    type: 'price',
    severity: 'info',
    title: 'Price Alert',
    message: 'AAPL has exceeded your target price of $240',
    symbol: 'AAPL',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    read: false,
    dismissed: false,
  },
  {
    id: 'alert-2',
    type: 'portfolio',
    severity: 'warning',
    title: 'Portfolio Rebalance',
    message: 'Your portfolio is overweight in Technology sector. Consider rebalancing.',
    portfolioId: 'portfolio-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    read: false,
    dismissed: false,
    actions: [
      {
        label: 'View Portfolio',
        action: 'navigate',
        data: { path: '/portfolio/portfolio-1' }
      },
      {
        label: 'Rebalance',
        action: 'navigate',
        data: { path: '/portfolio/portfolio-1/rebalance' }
      }
    ]
  },
  {
    id: 'alert-3',
    type: 'market',
    severity: 'critical',
    title: 'Market Volatility',
    message: 'S&P 500 down 1.5% in early trading. Unusual volatility detected.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
    read: true,
    dismissed: false,
  },
  {
    id: 'alert-4',
    type: 'ml',
    severity: 'info',
    title: 'ML Prediction',
    message: 'ML model predicts bullish signal for MSFT with 87% confidence.',
    symbol: 'MSFT',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    read: true,
    dismissed: false,
    actions: [
      {
        label: 'View Analysis',
        action: 'navigate',
        data: { path: '/ml/predictions/MSFT' }
      }
    ]
  },
  {
    id: 'alert-5',
    type: 'technical',
    severity: 'warning',
    title: 'Technical Pattern',
    message: 'TSLA has formed a bearish head and shoulders pattern.',
    symbol: 'TSLA',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 1.5 days ago
    read: false,
    dismissed: false,
  },
];

// Mock data for price alerts
const mockPriceAlerts: PriceAlert[] = [
  {
    id: 'price-alert-1',
    symbol: 'AAPL',
    type: 'above',
    value: 240,
    active: true,
    triggered: true,
    lastTriggered: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
  },
  {
    id: 'price-alert-2',
    symbol: 'MSFT',
    type: 'below',
    value: 350,
    active: true,
    triggered: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
  },
  {
    id: 'price-alert-3',
    symbol: 'TSLA',
    type: 'percent_change',
    value: 5,
    active: true,
    triggered: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
  },
  {
    id: 'price-alert-4',
    symbol: 'AMZN',
    type: 'volume',
    value: 20000000,
    active: true,
    triggered: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
  },
];

// Async thunks
export const fetchAlerts = createAsyncThunk(
  'alerts/fetchAlerts',
  async (_, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll use mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const alertsMap: Record<string, Alert> = {};
      mockAlerts.forEach(alert => {
        alertsMap[alert.id] = alert;
      });
      
      return alertsMap;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch alerts');
    }
  }
);

export const fetchPriceAlerts = createAsyncThunk(
  'alerts/fetchPriceAlerts',
  async (_, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll use mock data
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const priceAlertsMap: Record<string, PriceAlert> = {};
      mockPriceAlerts.forEach(alert => {
        priceAlertsMap[alert.id] = alert;
      });
      
      return priceAlertsMap;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch price alerts');
    }
  }
);

export const createAlert = createAsyncThunk(
  'alerts/createAlert',
  async (alertData: Omit<Alert, 'id' | 'timestamp' | 'read' | 'dismissed'>, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll just return the data with an ID
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const alert: Alert = {
        ...alertData,
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        read: false,
        dismissed: false,
      };
      
      return alert;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create alert');
    }
  }
);

export const createPriceAlert = createAsyncThunk(
  'alerts/createPriceAlert',
  async (alertData: {
    symbol: string;
    type: PriceAlert['type'];
    value: number;
  }, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll just return the data with an ID
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const now = new Date().toISOString();
      
      const priceAlert: PriceAlert = {
        id: uuidv4(),
        symbol: alertData.symbol,
        type: alertData.type,
        value: alertData.value,
        active: true,
        triggered: false,
        createdAt: now,
        updatedAt: now,
      };
      
      return priceAlert;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create price alert');
    }
  }
);

export const markAlertAsRead = createAsyncThunk(
  'alerts/markAlertAsRead',
  async (alertId: string, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll just return the ID
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return alertId;
    } catch (error: any) {
      return rejectWithValue(error.message || `Failed to mark alert ${alertId} as read`);
    }
  }
);

export const dismissAlert = createAsyncThunk(
  'alerts/dismissAlert',
  async (alertId: string, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll just return the ID
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return alertId;
    } catch (error: any) {
      return rejectWithValue(error.message || `Failed to dismiss alert ${alertId}`);
    }
  }
);

export const deletePriceAlert = createAsyncThunk(
  'alerts/deletePriceAlert',
  async (alertId: string, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll just return the ID
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return alertId;
    } catch (error: any) {
      return rejectWithValue(error.message || `Failed to delete price alert ${alertId}`);
    }
  }
);

export const togglePriceAlert = createAsyncThunk(
  'alerts/togglePriceAlert',
  async ({ alertId, active }: { alertId: string; active: boolean }, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll just return the data
      await new Promise(resolve => setTimeout(resolve, 600));
      
      return { alertId, active };
    } catch (error: any) {
      return rejectWithValue(error.message || `Failed to toggle price alert ${alertId}`);
    }
  }
);

// Slice
const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    addAlert: (state, action: PayloadAction<Alert>) => {
      const alert = action.payload;
      state.alerts[alert.id] = alert;
      
      if (!alert.read) {
        state.unreadCount += 1;
      }
      
      state.lastUpdated = Date.now();
    },
    
    updateAlert: (state, action: PayloadAction<Partial<Alert> & { id: string }>) => {
      const { id, ...changes } = action.payload;
      
      if (state.alerts[id]) {
        // If marking as read and it was previously unread, decrement unread count
        if (changes.read === true && !state.alerts[id].read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        
        state.alerts[id] = {
          ...state.alerts[id],
          ...changes,
        };
        
        state.lastUpdated = Date.now();
      }
    },
    
    clearAlerts: (state) => {
      state.alerts = {};
      state.unreadCount = 0;
      state.lastUpdated = Date.now();
    },
    
    markAllAlertsAsRead: (state) => {
      Object.keys(state.alerts).forEach(id => {
        state.alerts[id].read = true;
      });
      
      state.unreadCount = 0;
      state.lastUpdated = Date.now();
    },
  },
  extraReducers: (builder) => {
    // Fetch alerts
    builder.addCase(fetchAlerts.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAlerts.fulfilled, (state, action) => {
      state.loading = false;
      state.alerts = action.payload;
      
      // Calculate unread count
      state.unreadCount = Object.values(action.payload).filter(alert => !alert.read).length;
      
      state.lastUpdated = Date.now();
    });
    builder.addCase(fetchAlerts.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Fetch price alerts
    builder.addCase(fetchPriceAlerts.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPriceAlerts.fulfilled, (state, action) => {
      state.loading = false;
      state.priceAlerts = action.payload;
      state.lastUpdated = Date.now();
    });
    builder.addCase(fetchPriceAlerts.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Create alert
    builder.addCase(createAlert.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createAlert.fulfilled, (state, action) => {
      state.loading = false;
      
      const alert = action.payload;
      state.alerts[alert.id] = alert;
      
      // Increment unread count
      state.unreadCount += 1;
      
      state.lastUpdated = Date.now();
    });
    builder.addCase(createAlert.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Create price alert
    builder.addCase(createPriceAlert.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createPriceAlert.fulfilled, (state, action) => {
      state.loading = false;
      
      const priceAlert = action.payload;
      state.priceAlerts[priceAlert.id] = priceAlert;
      
      state.lastUpdated = Date.now();
    });
    builder.addCase(createPriceAlert.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Mark alert as read
    builder.addCase(markAlertAsRead.fulfilled, (state, action) => {
      const alertId = action.payload;
      
      if (state.alerts[alertId] && !state.alerts[alertId].read) {
        state.alerts[alertId].read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
        state.lastUpdated = Date.now();
      }
    });
    
    // Dismiss alert
    builder.addCase(dismissAlert.fulfilled, (state, action) => {
      const alertId = action.payload;
      
      if (state.alerts[alertId]) {
        state.alerts[alertId].dismissed = true;
        
        // If it was unread, decrement unread count
        if (!state.alerts[alertId].read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        
        state.lastUpdated = Date.now();
      }
    });
    
    // Delete price alert
    builder.addCase(deletePriceAlert.fulfilled, (state, action) => {
      const alertId = action.payload;
      
      if (state.priceAlerts[alertId]) {
        delete state.priceAlerts[alertId];
        state.lastUpdated = Date.now();
      }
    });
    
    // Toggle price alert
    builder.addCase(togglePriceAlert.fulfilled, (state, action) => {
      const { alertId, active } = action.payload;
      
      if (state.priceAlerts[alertId]) {
        state.priceAlerts[alertId].active = active;
        state.priceAlerts[alertId].updatedAt = new Date().toISOString();
        state.lastUpdated = Date.now();
      }
    });
  },
});

export const { addAlert, updateAlert, clearAlerts, markAllAlertsAsRead } = alertsSlice.actions;

export default alertsSlice.reducer;