import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

// Types
interface PriceAlert {
  id: string;
  symbol: string;
  condition: 'above' | 'below';
  price: number;
  createdAt: string;
  expiration?: string;
  status: 'active' | 'triggered' | 'expired';
}

interface TechnicalAlert {
  id: string;
  symbol: string;
  indicator: string;
  condition: string;
  value?: number;
  parameters?: Record<string, any>;
  createdAt: string;
  expiration?: string;
  status: 'active' | 'triggered' | 'expired';
}

interface NewsAlert {
  id: string;
  keywords: string[];
  symbols?: string[];
  createdAt: string;
  expiration?: string;
  status: 'active' | 'triggered' | 'expired';
}

interface EarningsAlert {
  id: string;
  symbol: string;
  daysBefore: number;
  createdAt: string;
  status: 'active' | 'triggered' | 'expired';
}

interface PatternAlert {
  id: string;
  symbol: string;
  pattern: string;
  timeframe: string;
  createdAt: string;
  status: 'active' | 'triggered' | 'expired';
}

interface VolumeAlert {
  id: string;
  symbol: string;
  condition: 'above' | 'below';
  volumeMultiplier: number;
  createdAt: string;
  expiration?: string;
  status: 'active' | 'triggered' | 'expired';
}

interface AIAlert {
  id: string;
  symbol: string;
  alertType: string;
  threshold: number;
  createdAt: string;
  expiration?: string;
  status: 'active' | 'triggered' | 'expired';
}

interface Notification {
  id: string;
  alertId?: string;
  alertType?: string;
  symbol?: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface AIInsight {
  id: string;
  symbol: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  createdAt: string;
  metadata?: Record<string, any>;
}

interface AlertsState {
  priceAlerts: PriceAlert[];
  technicalAlerts: TechnicalAlert[];
  newsAlerts: NewsAlert[];
  earningsAlerts: EarningsAlert[];
  patternAlerts: PatternAlert[];
  volumeAlerts: VolumeAlert[];
  aiAlerts: AIAlert[];
  notifications: Notification[];
  aiInsights: AIInsight[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: AlertsState = {
  priceAlerts: [],
  technicalAlerts: [],
  newsAlerts: [],
  earningsAlerts: [],
  patternAlerts: [],
  volumeAlerts: [],
  aiAlerts: [],
  notifications: [],
  aiInsights: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchAllAlerts = createAsyncThunk(
  'alerts/fetchAllAlerts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/alerts/alerts');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch alerts');
    }
  }
);

export const createPriceAlert = createAsyncThunk(
  'alerts/createPriceAlert',
  async (alert: { symbol: string; condition: 'above' | 'below'; price: number; expiration?: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/alerts/alerts/price', alert);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to create price alert');
    }
  }
);

export const createTechnicalAlert = createAsyncThunk(
  'alerts/createTechnicalAlert',
  async (alert: { 
    symbol: string; 
    indicator: string; 
    condition: string; 
    value?: number; 
    parameters?: Record<string, any>; 
    expiration?: string 
  }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/alerts/alerts/technical', alert);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to create technical alert');
    }
  }
);

export const createNewsAlert = createAsyncThunk(
  'alerts/createNewsAlert',
  async (alert: { keywords: string[]; symbols?: string[]; expiration?: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/alerts/alerts/news', alert);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to create news alert');
    }
  }
);

export const createEarningsAlert = createAsyncThunk(
  'alerts/createEarningsAlert',
  async (alert: { symbol: string; daysBefore: number }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/alerts/alerts/earnings', alert);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to create earnings alert');
    }
  }
);

export const createPatternAlert = createAsyncThunk(
  'alerts/createPatternAlert',
  async (alert: { symbol: string; pattern: string; timeframe: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/alerts/alerts/pattern', alert);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to create pattern alert');
    }
  }
);

export const createVolumeAlert = createAsyncThunk(
  'alerts/createVolumeAlert',
  async (alert: { 
    symbol: string; 
    condition: 'above' | 'below'; 
    volumeMultiplier: number; 
    expiration?: string 
  }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/alerts/alerts/volume', alert);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to create volume alert');
    }
  }
);

export const createAIAlert = createAsyncThunk(
  'alerts/createAIAlert',
  async (alert: { 
    symbol: string; 
    alertType: string; 
    threshold: number; 
    expiration?: string 
  }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/alerts/alerts/ai', alert);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to create AI alert');
    }
  }
);

export const deleteAlert = createAsyncThunk(
  'alerts/deleteAlert',
  async ({ alertType, alertId }: { alertType: string; alertId: string }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`/api/alerts/alerts/${alertType}/${alertId}`);
      return { alertType, alertId, response: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to delete alert');
    }
  }
);

export const fetchNotifications = createAsyncThunk(
  'alerts/fetchNotifications',
  async ({ limit = 10, offset = 0, unreadOnly = false }: { limit?: number; offset?: number; unreadOnly?: boolean } = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/alerts/notifications', {
        params: { limit, offset, unread_only: unreadOnly },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch notifications');
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  'alerts/markNotificationRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/alerts/notifications/${notificationId}/read`);
      return { notificationId, response: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to mark notification as read');
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  'alerts/markAllNotificationsRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/alerts/notifications/read-all');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to mark all notifications as read');
    }
  }
);

export const fetchAIInsights = createAsyncThunk(
  'alerts/fetchAIInsights',
  async ({ limit = 10, insightType }: { limit?: number; insightType?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/alerts/ai-insights', {
        params: { limit, insight_type: insightType },
      });
      return response.data.insights;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch AI insights');
    }
  }
);

// Create slice
const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    clearAlertsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all alerts
      .addCase(fetchAllAlerts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllAlerts.fulfilled, (state, action: PayloadAction<{
        price_alerts: PriceAlert[];
        technical_alerts: TechnicalAlert[];
        news_alerts: NewsAlert[];
        earnings_alerts: EarningsAlert[];
        pattern_alerts: PatternAlert[];
        volume_alerts: VolumeAlert[];
        ai_alerts: AIAlert[];
      }>) => {
        state.priceAlerts = action.payload.price_alerts;
        state.technicalAlerts = action.payload.technical_alerts;
        state.newsAlerts = action.payload.news_alerts;
        state.earningsAlerts = action.payload.earnings_alerts;
        state.patternAlerts = action.payload.pattern_alerts;
        state.volumeAlerts = action.payload.volume_alerts;
        state.aiAlerts = action.payload.ai_alerts;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchAllAlerts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create price alert
      .addCase(createPriceAlert.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPriceAlert.fulfilled, (state, action: PayloadAction<PriceAlert>) => {
        state.priceAlerts.push(action.payload);
        state.loading = false;
        state.error = null;
      })
      .addCase(createPriceAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create technical alert
      .addCase(createTechnicalAlert.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTechnicalAlert.fulfilled, (state, action: PayloadAction<TechnicalAlert>) => {
        state.technicalAlerts.push(action.payload);
        state.loading = false;
        state.error = null;
      })
      .addCase(createTechnicalAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create news alert
      .addCase(createNewsAlert.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNewsAlert.fulfilled, (state, action: PayloadAction<NewsAlert>) => {
        state.newsAlerts.push(action.payload);
        state.loading = false;
        state.error = null;
      })
      .addCase(createNewsAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create earnings alert
      .addCase(createEarningsAlert.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEarningsAlert.fulfilled, (state, action: PayloadAction<EarningsAlert>) => {
        state.earningsAlerts.push(action.payload);
        state.loading = false;
        state.error = null;
      })
      .addCase(createEarningsAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create pattern alert
      .addCase(createPatternAlert.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPatternAlert.fulfilled, (state, action: PayloadAction<PatternAlert>) => {
        state.patternAlerts.push(action.payload);
        state.loading = false;
        state.error = null;
      })
      .addCase(createPatternAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create volume alert
      .addCase(createVolumeAlert.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createVolumeAlert.fulfilled, (state, action: PayloadAction<VolumeAlert>) => {
        state.volumeAlerts.push(action.payload);
        state.loading = false;
        state.error = null;
      })
      .addCase(createVolumeAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create AI alert
      .addCase(createAIAlert.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAIAlert.fulfilled, (state, action: PayloadAction<AIAlert>) => {
        state.aiAlerts.push(action.payload);
        state.loading = false;
        state.error = null;
      })
      .addCase(createAIAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete alert
      .addCase(deleteAlert.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAlert.fulfilled, (state, action: PayloadAction<{ alertType: string; alertId: string; response: any }>) => {
        const { alertType, alertId } = action.payload;
        
        switch (alertType) {
          case 'price':
            state.priceAlerts = state.priceAlerts.filter(alert => alert.id !== alertId);
            break;
          case 'technical':
            state.technicalAlerts = state.technicalAlerts.filter(alert => alert.id !== alertId);
            break;
          case 'news':
            state.newsAlerts = state.newsAlerts.filter(alert => alert.id !== alertId);
            break;
          case 'earnings':
            state.earningsAlerts = state.earningsAlerts.filter(alert => alert.id !== alertId);
            break;
          case 'pattern':
            state.patternAlerts = state.patternAlerts.filter(alert => alert.id !== alertId);
            break;
          case 'volume':
            state.volumeAlerts = state.volumeAlerts.filter(alert => alert.id !== alertId);
            break;
          case 'ai':
            state.aiAlerts = state.aiAlerts.filter(alert => alert.id !== alertId);
            break;
        }
        
        state.loading = false;
        state.error = null;
      })
      .addCase(deleteAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action: PayloadAction<{ notifications: Notification[]; total: number; unread_count: number }>) => {
        state.notifications = action.payload.notifications;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Mark notification read
      .addCase(markNotificationRead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markNotificationRead.fulfilled, (state, action: PayloadAction<{ notificationId: string; response: { notification: Notification } }>) => {
        const index = state.notifications.findIndex(n => n.id === action.payload.notificationId);
        if (index !== -1) {
          state.notifications[index].read = true;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(markNotificationRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Mark all notifications read
      .addCase(markAllNotificationsRead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map(notification => ({
          ...notification,
          read: true,
        }));
        state.loading = false;
        state.error = null;
      })
      .addCase(markAllNotificationsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch AI insights
      .addCase(fetchAIInsights.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAIInsights.fulfilled, (state, action: PayloadAction<AIInsight[]>) => {
        state.aiInsights = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchAIInsights.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearAlertsError } = alertsSlice.actions;

export default alertsSlice.reducer;