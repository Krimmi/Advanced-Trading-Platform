import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '../../services/api/apiClient';

// Types
export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  previousValue?: number;
  changePercent?: number;
  target?: number;
  threshold?: {
    warning: number;
    critical: number;
  };
  metadata?: Record<string, any>;
}

export interface ComponentPerformance {
  id: string;
  name: string;
  renderTime: number; // in milliseconds
  renderCount: number;
  lastRenderTimestamp: string;
  averageRenderTime: number;
  minRenderTime: number;
  maxRenderTime: number;
  memoryUsage?: number; // in bytes
  metadata?: Record<string, any>;
}

export interface ApiPerformance {
  endpoint: string;
  method: string;
  averageResponseTime: number; // in milliseconds
  minResponseTime: number;
  maxResponseTime: number;
  successRate: number; // percentage
  errorRate: number; // percentage
  callCount: number;
  lastCallTimestamp: string;
  metadata?: Record<string, any>;
}

export interface PerformanceState {
  metrics: Record<string, PerformanceMetric>;
  components: Record<string, ComponentPerformance>;
  apis: Record<string, ApiPerformance>;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  monitoringEnabled: boolean;
}

// Initial state
const initialState: PerformanceState = {
  metrics: {},
  components: {},
  apis: {},
  loading: false,
  error: null,
  lastUpdated: null,
  monitoringEnabled: true,
};

// Mock data for performance metrics
const mockPerformanceMetrics: PerformanceMetric[] = [
  {
    id: 'metric-1',
    name: 'Average Page Load Time',
    value: 1.2,
    unit: 'seconds',
    timestamp: new Date().toISOString(),
    previousValue: 1.5,
    changePercent: -20,
    target: 1.0,
    threshold: {
      warning: 2.0,
      critical: 3.0,
    },
  },
  {
    id: 'metric-2',
    name: 'Memory Usage',
    value: 256,
    unit: 'MB',
    timestamp: new Date().toISOString(),
    previousValue: 240,
    changePercent: 6.67,
    target: 200,
    threshold: {
      warning: 300,
      critical: 400,
    },
  },
  {
    id: 'metric-3',
    name: 'API Response Time',
    value: 320,
    unit: 'ms',
    timestamp: new Date().toISOString(),
    previousValue: 350,
    changePercent: -8.57,
    target: 300,
    threshold: {
      warning: 500,
      critical: 1000,
    },
  },
  {
    id: 'metric-4',
    name: 'Error Rate',
    value: 0.5,
    unit: '%',
    timestamp: new Date().toISOString(),
    previousValue: 1.2,
    changePercent: -58.33,
    target: 0.1,
    threshold: {
      warning: 2.0,
      critical: 5.0,
    },
  },
  {
    id: 'metric-5',
    name: 'WebSocket Message Rate',
    value: 120,
    unit: 'msg/s',
    timestamp: new Date().toISOString(),
    previousValue: 100,
    changePercent: 20,
    target: 150,
    threshold: {
      warning: 200,
      critical: 250,
    },
  },
];

// Mock data for component performance
const mockComponentPerformance: ComponentPerformance[] = [
  {
    id: 'component-1',
    name: 'DashboardPage',
    renderTime: 120,
    renderCount: 15,
    lastRenderTimestamp: new Date().toISOString(),
    averageRenderTime: 150,
    minRenderTime: 100,
    maxRenderTime: 250,
    memoryUsage: 5242880, // 5MB
  },
  {
    id: 'component-2',
    name: 'MarketOverviewPage',
    renderTime: 180,
    renderCount: 12,
    lastRenderTimestamp: new Date().toISOString(),
    averageRenderTime: 200,
    minRenderTime: 150,
    maxRenderTime: 350,
    memoryUsage: 7340032, // 7MB
  },
  {
    id: 'component-3',
    name: 'PortfolioPage',
    renderTime: 150,
    renderCount: 8,
    lastRenderTimestamp: new Date().toISOString(),
    averageRenderTime: 170,
    minRenderTime: 120,
    maxRenderTime: 280,
    memoryUsage: 6291456, // 6MB
  },
  {
    id: 'component-4',
    name: 'StockDetailPage',
    renderTime: 200,
    renderCount: 10,
    lastRenderTimestamp: new Date().toISOString(),
    averageRenderTime: 220,
    minRenderTime: 180,
    maxRenderTime: 400,
    memoryUsage: 8388608, // 8MB
  },
  {
    id: 'component-5',
    name: 'DataTable',
    renderTime: 80,
    renderCount: 45,
    lastRenderTimestamp: new Date().toISOString(),
    averageRenderTime: 90,
    minRenderTime: 50,
    maxRenderTime: 150,
    memoryUsage: 3145728, // 3MB
  },
];

// Mock data for API performance
const mockApiPerformance: ApiPerformance[] = [
  {
    endpoint: '/api/market/summary',
    method: 'GET',
    averageResponseTime: 250,
    minResponseTime: 180,
    maxResponseTime: 500,
    successRate: 99.8,
    errorRate: 0.2,
    callCount: 1250,
    lastCallTimestamp: new Date().toISOString(),
  },
  {
    endpoint: '/api/portfolio/:id',
    method: 'GET',
    averageResponseTime: 320,
    minResponseTime: 200,
    maxResponseTime: 600,
    successRate: 99.5,
    errorRate: 0.5,
    callCount: 850,
    lastCallTimestamp: new Date().toISOString(),
  },
  {
    endpoint: '/api/stock/:symbol',
    method: 'GET',
    averageResponseTime: 280,
    minResponseTime: 150,
    maxResponseTime: 550,
    successRate: 99.7,
    errorRate: 0.3,
    callCount: 2100,
    lastCallTimestamp: new Date().toISOString(),
  },
  {
    endpoint: '/api/orders',
    method: 'POST',
    averageResponseTime: 450,
    minResponseTime: 300,
    maxResponseTime: 800,
    successRate: 98.5,
    errorRate: 1.5,
    callCount: 420,
    lastCallTimestamp: new Date().toISOString(),
  },
  {
    endpoint: '/api/ml/predictions',
    method: 'GET',
    averageResponseTime: 650,
    minResponseTime: 400,
    maxResponseTime: 1200,
    successRate: 99.0,
    errorRate: 1.0,
    callCount: 380,
    lastCallTimestamp: new Date().toISOString(),
  },
];

// Async thunks
export const fetchPerformanceMetrics = createAsyncThunk(
  'performance/fetchPerformanceMetrics',
  async (_, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll use mock data
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const metricsMap: Record<string, PerformanceMetric> = {};
      mockPerformanceMetrics.forEach(metric => {
        metricsMap[metric.id] = metric;
      });
      
      return metricsMap;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch performance metrics');
    }
  }
);

export const fetchComponentPerformance = createAsyncThunk(
  'performance/fetchComponentPerformance',
  async (_, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call or from local storage
      // For demo purposes, we'll use mock data
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const componentsMap: Record<string, ComponentPerformance> = {};
      mockComponentPerformance.forEach(component => {
        componentsMap[component.id] = component;
      });
      
      return componentsMap;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch component performance data');
    }
  }
);

export const fetchApiPerformance = createAsyncThunk(
  'performance/fetchApiPerformance',
  async (_, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call or from local storage
      // For demo purposes, we'll use mock data
      await new Promise(resolve => setTimeout(resolve, 700));
      
      const apisMap: Record<string, ApiPerformance> = {};
      mockApiPerformance.forEach(api => {
        apisMap[`${api.method}-${api.endpoint}`] = api;
      });
      
      return apisMap;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch API performance data');
    }
  }
);

export const recordComponentRender = createAsyncThunk(
  'performance/recordComponentRender',
  async (data: {
    componentId: string;
    componentName: string;
    renderTime: number;
    memoryUsage?: number;
  }, { getState, rejectWithValue }) => {
    try {
      // In a real app, this might be stored in local storage or sent to an API
      // For demo purposes, we'll just return the data
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to record component render');
    }
  }
);

export const recordApiCall = createAsyncThunk(
  'performance/recordApiCall',
  async (data: {
    endpoint: string;
    method: string;
    responseTime: number;
    success: boolean;
  }, { getState, rejectWithValue }) => {
    try {
      // In a real app, this might be stored in local storage or sent to an API
      // For demo purposes, we'll just return the data
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to record API call');
    }
  }
);

// Slice
const performanceSlice = createSlice({
  name: 'performance',
  initialState,
  reducers: {
    toggleMonitoring: (state, action: PayloadAction<boolean | undefined>) => {
      state.monitoringEnabled = action.payload !== undefined ? action.payload : !state.monitoringEnabled;
    },
    
    clearPerformanceData: (state) => {
      state.metrics = {};
      state.components = {};
      state.apis = {};
      state.lastUpdated = null;
    },
    
    updateMetric: (state, action: PayloadAction<PerformanceMetric>) => {
      const metric = action.payload;
      state.metrics[metric.id] = metric;
      state.lastUpdated = Date.now();
    },
  },
  extraReducers: (builder) => {
    // Fetch performance metrics
    builder.addCase(fetchPerformanceMetrics.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPerformanceMetrics.fulfilled, (state, action) => {
      state.loading = false;
      state.metrics = action.payload;
      state.lastUpdated = Date.now();
    });
    builder.addCase(fetchPerformanceMetrics.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Fetch component performance
    builder.addCase(fetchComponentPerformance.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchComponentPerformance.fulfilled, (state, action) => {
      state.loading = false;
      state.components = action.payload;
      state.lastUpdated = Date.now();
    });
    builder.addCase(fetchComponentPerformance.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Fetch API performance
    builder.addCase(fetchApiPerformance.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchApiPerformance.fulfilled, (state, action) => {
      state.loading = false;
      state.apis = action.payload;
      state.lastUpdated = Date.now();
    });
    builder.addCase(fetchApiPerformance.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Record component render
    builder.addCase(recordComponentRender.fulfilled, (state, action) => {
      if (!state.monitoringEnabled) return;
      
      const { componentId, componentName, renderTime, memoryUsage } = action.payload;
      const now = new Date().toISOString();
      
      if (state.components[componentId]) {
        // Update existing component
        const component = state.components[componentId];
        const newRenderCount = component.renderCount + 1;
        const newAverageRenderTime = ((component.averageRenderTime * component.renderCount) + renderTime) / newRenderCount;
        
        state.components[componentId] = {
          ...component,
          renderTime,
          renderCount: newRenderCount,
          lastRenderTimestamp: now,
          averageRenderTime: newAverageRenderTime,
          minRenderTime: Math.min(component.minRenderTime, renderTime),
          maxRenderTime: Math.max(component.maxRenderTime, renderTime),
          memoryUsage: memoryUsage || component.memoryUsage,
        };
      } else {
        // Create new component entry
        state.components[componentId] = {
          id: componentId,
          name: componentName,
          renderTime,
          renderCount: 1,
          lastRenderTimestamp: now,
          averageRenderTime: renderTime,
          minRenderTime: renderTime,
          maxRenderTime: renderTime,
          memoryUsage,
        };
      }
      
      state.lastUpdated = Date.now();
    });
    
    // Record API call
    builder.addCase(recordApiCall.fulfilled, (state, action) => {
      if (!state.monitoringEnabled) return;
      
      const { endpoint, method, responseTime, success } = action.payload;
      const apiKey = `${method}-${endpoint}`;
      const now = new Date().toISOString();
      
      if (state.apis[apiKey]) {
        // Update existing API
        const api = state.apis[apiKey];
        const newCallCount = api.callCount + 1;
        const newAverageResponseTime = ((api.averageResponseTime * api.callCount) + responseTime) / newCallCount;
        const newSuccessCount = api.successRate * api.callCount / 100 + (success ? 1 : 0);
        const newSuccessRate = (newSuccessCount / newCallCount) * 100;
        const newErrorRate = 100 - newSuccessRate;
        
        state.apis[apiKey] = {
          ...api,
          averageResponseTime: newAverageResponseTime,
          minResponseTime: Math.min(api.minResponseTime, responseTime),
          maxResponseTime: Math.max(api.maxResponseTime, responseTime),
          successRate: newSuccessRate,
          errorRate: newErrorRate,
          callCount: newCallCount,
          lastCallTimestamp: now,
        };
      } else {
        // Create new API entry
        state.apis[apiKey] = {
          endpoint,
          method,
          averageResponseTime: responseTime,
          minResponseTime: responseTime,
          maxResponseTime: responseTime,
          successRate: success ? 100 : 0,
          errorRate: success ? 0 : 100,
          callCount: 1,
          lastCallTimestamp: now,
        };
      }
      
      state.lastUpdated = Date.now();
    });
  },
});

export const { toggleMonitoring, clearPerformanceData, updateMetric } = performanceSlice.actions;

export default performanceSlice.reducer;