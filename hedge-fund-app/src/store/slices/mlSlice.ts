import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

// Types
export interface MLModel {
  id: string;
  name: string;
  type: 'regression' | 'classification' | 'time-series' | 'reinforcement';
  status: 'active' | 'inactive' | 'training' | 'error';
  accuracy: number;
  lastTrained: string;
  version: string;
  description: string;
  features: string[];
  target: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModelPerformance {
  id: string;
  modelId: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  mse?: number;
  mae?: number;
  rmse?: number;
  r2?: number;
  confusionMatrix?: number[][];
  timestamp: string;
}

export interface Prediction {
  id: string;
  modelId: string;
  symbol: string;
  targetValue: number;
  confidence: number;
  timestamp: string;
  actualValue?: number;
  error?: number;
}

export interface MLState {
  models: MLModel[];
  selectedModelId: string | null;
  modelPerformance: Record<string, ModelPerformance>;
  predictions: Record<string, Prediction[]>;
  loading: boolean;
  error: string | null;
}

// Mock service functions
const mockMLService = {
  getModels: async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock data
    return [
      {
        id: 'model-1',
        name: 'Stock Price Predictor',
        type: 'time-series',
        status: 'active',
        accuracy: 0.87,
        lastTrained: '2023-08-01T10:30:00Z',
        version: '1.2.0',
        description: 'LSTM model for predicting stock prices based on historical data and market indicators',
        features: ['open', 'high', 'low', 'close', 'volume', 'ma_50', 'ma_200', 'rsi', 'macd'],
        target: 'next_day_close',
        createdBy: 'AI System',
        createdAt: '2023-01-15T08:20:00Z',
        updatedAt: '2023-08-01T10:30:00Z',
      },
      {
        id: 'model-2',
        name: 'Sentiment Analyzer',
        type: 'classification',
        status: 'active',
        accuracy: 0.92,
        lastTrained: '2023-07-28T14:45:00Z',
        version: '2.1.0',
        description: 'BERT-based model for analyzing sentiment in financial news and social media',
        features: ['text', 'source', 'author_credibility', 'publication_date'],
        target: 'sentiment_score',
        createdBy: 'AI System',
        createdAt: '2023-02-10T11:15:00Z',
        updatedAt: '2023-07-28T14:45:00Z',
      },
      {
        id: 'model-3',
        name: 'Portfolio Optimizer',
        type: 'reinforcement',
        status: 'training',
        accuracy: 0.78,
        lastTrained: '2023-08-09T09:15:00Z',
        version: '0.9.5',
        description: 'Reinforcement learning model for optimizing portfolio allocation based on risk and return',
        features: ['asset_returns', 'asset_volatility', 'correlations', 'market_indicators', 'economic_indicators'],
        target: 'portfolio_sharpe_ratio',
        createdBy: 'AI System',
        createdAt: '2023-05-20T16:30:00Z',
        updatedAt: '2023-08-09T09:15:00Z',
      },
      {
        id: 'model-4',
        name: 'Anomaly Detector',
        type: 'classification',
        status: 'inactive',
        accuracy: 0.83,
        lastTrained: '2023-06-15T11:20:00Z',
        version: '1.0.2',
        description: 'Isolation Forest model for detecting anomalies in market data and trading patterns',
        features: ['price_change', 'volume_change', 'bid_ask_spread', 'order_book_imbalance', 'trade_size'],
        target: 'is_anomaly',
        createdBy: 'AI System',
        createdAt: '2023-04-05T13:45:00Z',
        updatedAt: '2023-06-15T11:20:00Z',
      },
      {
        id: 'model-5',
        name: 'Volatility Predictor',
        type: 'regression',
        status: 'error',
        accuracy: 0.71,
        lastTrained: '2023-07-10T08:30:00Z',
        version: '0.8.1',
        description: 'GARCH model for predicting market volatility based on historical price movements',
        features: ['historical_volatility', 'trading_range', 'volume', 'vix', 'market_returns'],
        target: 'future_volatility',
        createdBy: 'AI System',
        createdAt: '2023-03-12T09:10:00Z',
        updatedAt: '2023-07-10T08:30:00Z',
      },
    ];
  },
  
  getModelPerformance: async (modelId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Return mock data based on model ID
    const performances: Record<string, ModelPerformance> = {
      'model-1': {
        id: 'perf-1',
        modelId: 'model-1',
        accuracy: 0.87,
        precision: 0.85,
        recall: 0.83,
        f1Score: 0.84,
        mse: 0.0023,
        mae: 0.0156,
        rmse: 0.048,
        r2: 0.86,
        timestamp: '2023-08-01T10:30:00Z',
      },
      'model-2': {
        id: 'perf-2',
        modelId: 'model-2',
        accuracy: 0.92,
        precision: 0.94,
        recall: 0.91,
        f1Score: 0.925,
        confusionMatrix: [
          [450, 25],
          [35, 490],
        ],
        timestamp: '2023-07-28T14:45:00Z',
      },
      'model-3': {
        id: 'perf-3',
        modelId: 'model-3',
        accuracy: 0.78,
        precision: 0.76,
        recall: 0.79,
        f1Score: 0.775,
        mse: 0.0045,
        mae: 0.0210,
        rmse: 0.067,
        r2: 0.77,
        timestamp: '2023-08-09T09:15:00Z',
      },
      'model-4': {
        id: 'perf-4',
        modelId: 'model-4',
        accuracy: 0.83,
        precision: 0.87,
        recall: 0.76,
        f1Score: 0.81,
        confusionMatrix: [
          [420, 60],
          [25, 495],
        ],
        timestamp: '2023-06-15T11:20:00Z',
      },
      'model-5': {
        id: 'perf-5',
        modelId: 'model-5',
        accuracy: 0.71,
        precision: 0.68,
        recall: 0.73,
        f1Score: 0.70,
        mse: 0.0078,
        mae: 0.0320,
        rmse: 0.088,
        r2: 0.69,
        timestamp: '2023-07-10T08:30:00Z',
      },
    };
    
    return performances[modelId] || null;
  },
  
  getPredictions: async (modelId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Generate mock predictions based on model ID
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
    
    return symbols.map((symbol, index) => {
      const targetValue = Math.random() * 10 - 5; // -5 to +5
      const confidence = 0.6 + Math.random() * 0.3; // 0.6 to 0.9
      
      return {
        id: `pred-${modelId}-${symbol}`,
        modelId,
        symbol,
        targetValue,
        confidence,
        timestamp: new Date().toISOString(),
      };
    });
  },
  
  createModel: async (model: Omit<MLModel, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock data with generated ID
    return {
      ...model,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
  
  updateModel: async (model: Partial<MLModel> & { id: string }) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock data
    return {
      ...model,
      updatedAt: new Date().toISOString(),
    };
  },
  
  deleteModel: async (id: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return success
    return { success: true };
  },
  
  trainModel: async (id: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock data
    return {
      id,
      status: 'training',
      updatedAt: new Date().toISOString(),
    };
  },
};

// Async thunks
export const fetchModels = createAsyncThunk(
  'ml/fetchModels',
  async (_, { rejectWithValue }) => {
    try {
      const models = await mockMLService.getModels();
      return models;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch ML models');
    }
  }
);

export const fetchModelPerformance = createAsyncThunk(
  'ml/fetchModelPerformance',
  async (modelId: string, { rejectWithValue }) => {
    try {
      const performance = await mockMLService.getModelPerformance(modelId);
      return performance;
    } catch (error: any) {
      return rejectWithValue(error.message || `Failed to fetch performance for model ${modelId}`);
    }
  }
);

export const fetchPredictions = createAsyncThunk(
  'ml/fetchPredictions',
  async (modelId: string, { rejectWithValue }) => {
    try {
      const predictions = await mockMLService.getPredictions(modelId);
      return { modelId, predictions };
    } catch (error: any) {
      return rejectWithValue(error.message || `Failed to fetch predictions for model ${modelId}`);
    }
  }
);

export const createModel = createAsyncThunk(
  'ml/createModel',
  async (model: Omit<MLModel, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const newModel = await mockMLService.createModel(model);
      return newModel;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create ML model');
    }
  }
);

export const updateModel = createAsyncThunk(
  'ml/updateModel',
  async (model: Partial<MLModel> & { id: string }, { rejectWithValue }) => {
    try {
      const updatedModel = await mockMLService.updateModel(model);
      return updatedModel;
    } catch (error: any) {
      return rejectWithValue(error.message || `Failed to update model ${model.id}`);
    }
  }
);

export const deleteModel = createAsyncThunk(
  'ml/deleteModel',
  async (id: string, { rejectWithValue }) => {
    try {
      await mockMLService.deleteModel(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || `Failed to delete model ${id}`);
    }
  }
);

export const trainModel = createAsyncThunk(
  'ml/trainModel',
  async (id: string, { rejectWithValue }) => {
    try {
      const result = await mockMLService.trainModel(id);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || `Failed to train model ${id}`);
    }
  }
);

// Initial state
const initialState: MLState = {
  models: [],
  selectedModelId: null,
  modelPerformance: {},
  predictions: {},
  loading: false,
  error: null,
};

// Slice
const mlSlice = createSlice({
  name: 'ml',
  initialState,
  reducers: {
    setSelectedModel: (state, action: PayloadAction<string | null>) => {
      state.selectedModelId = action.payload;
    },
    updateModelStatus: (state, action: PayloadAction<{ id: string; status: MLModel['status'] }>) => {
      const { id, status } = action.payload;
      const model = state.models.find(m => m.id === id);
      if (model) {
        model.status = status;
        model.updatedAt = new Date().toISOString();
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch models
      .addCase(fetchModels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchModels.fulfilled, (state, action) => {
        state.loading = false;
        state.models = action.payload;
        if (action.payload.length > 0 && !state.selectedModelId) {
          state.selectedModelId = action.payload[0].id;
        }
      })
      .addCase(fetchModels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch model performance
      .addCase(fetchModelPerformance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchModelPerformance.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.modelPerformance[action.payload.modelId] = action.payload;
        }
      })
      .addCase(fetchModelPerformance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch predictions
      .addCase(fetchPredictions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPredictions.fulfilled, (state, action) => {
        state.loading = false;
        state.predictions[action.payload.modelId] = action.payload.predictions;
      })
      .addCase(fetchPredictions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create model
      .addCase(createModel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createModel.fulfilled, (state, action) => {
        state.loading = false;
        state.models.push(action.payload);
        state.selectedModelId = action.payload.id;
      })
      .addCase(createModel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update model
      .addCase(updateModel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateModel.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.models.findIndex(m => m.id === action.payload.id);
        if (index !== -1) {
          state.models[index] = {
            ...state.models[index],
            ...action.payload,
          };
        }
      })
      .addCase(updateModel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete model
      .addCase(deleteModel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteModel.fulfilled, (state, action) => {
        state.loading = false;
        state.models = state.models.filter(m => m.id !== action.payload);
        if (state.selectedModelId === action.payload) {
          state.selectedModelId = state.models.length > 0 ? state.models[0].id : null;
        }
        // Clean up related data
        delete state.modelPerformance[action.payload];
        delete state.predictions[action.payload];
      })
      .addCase(deleteModel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Train model
      .addCase(trainModel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(trainModel.fulfilled, (state, action) => {
        state.loading = false;
        const model = state.models.find(m => m.id === action.payload.id);
        if (model) {
          model.status = action.payload.status;
          model.updatedAt = action.payload.updatedAt;
        }
      })
      .addCase(trainModel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setSelectedModel,
  updateModelStatus,
  clearError,
} = mlSlice.actions;

export default mlSlice.reducer;