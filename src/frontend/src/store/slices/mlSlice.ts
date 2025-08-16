import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

// Types
interface PricePrediction {
  date: string;
  predictedPrice: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

interface PricePredictionResponse {
  symbol: string;
  generatedAt: string;
  modelVersion: string;
  predictions: PricePrediction[];
}

interface SentimentScore {
  date: string;
  sentimentScore: number;
  sourceCount: number;
}

interface SentimentAnalysisResponse {
  symbol: string;
  generatedAt: string;
  overallSentiment: number;
  sentimentLabel: 'Bullish' | 'Bearish' | 'Neutral';
  dailySentiment: SentimentScore[];
}

interface FactorExposure {
  [factor: string]: number;
}

interface FactorModelResponse {
  symbol: string;
  model: string;
  generatedAt: string;
  factorExposures: FactorExposure;
  riskFreeRate: number;
  expectedAnnualReturn: number;
  expectedMonthlyReturn: number;
  rSquared: number;
  analysisPeriod: string;
}

interface Anomaly {
  date: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  zScore: number;
}

interface AnomalyDetectionResponse {
  symbol: string;
  generatedAt: string;
  analysisPeriod: string;
  anomaliesDetected: number;
  anomalies: Anomaly[];
}

interface FactorScore {
  [factor: string]: number;
}

interface SmartBetaResponse {
  symbol: string;
  generatedAt: string;
  overallSmartBetaScore: number;
  factorScores: FactorScore;
  percentileRank: number;
  recommendation: string;
}

interface ModelStatus {
  name: string;
  version: string;
  lastTrained: string;
  accuracy: number;
  status: string;
}

interface ModelStatusResponse {
  generatedAt: string;
  models: ModelStatus[];
  nextScheduledTraining: string;
  systemStatus: string;
}

interface MLState {
  pricePredictions: {
    [symbol: string]: PricePredictionResponse;
  };
  sentimentAnalysis: {
    [symbol: string]: SentimentAnalysisResponse;
  };
  factorModels: {
    [key: string]: FactorModelResponse; // key is symbol-model (e.g., "AAPL-fama-french-3")
  };
  anomalyDetection: {
    [symbol: string]: AnomalyDetectionResponse;
  };
  smartBeta: {
    [symbol: string]: SmartBetaResponse;
  };
  modelStatus: ModelStatusResponse | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: MLState = {
  pricePredictions: {},
  sentimentAnalysis: {},
  factorModels: {},
  anomalyDetection: {},
  smartBeta: {},
  modelStatus: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchPricePrediction = createAsyncThunk(
  'ml/fetchPricePrediction',
  async ({ symbol, days = 5 }: { symbol: string; days?: number }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/predictions/price/${symbol}`, {
        params: { days },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch price prediction');
    }
  }
);

export const fetchSentimentAnalysis = createAsyncThunk(
  'ml/fetchSentimentAnalysis',
  async ({ symbol, days = 30 }: { symbol: string; days?: number }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/predictions/sentiment/${symbol}`, {
        params: { days },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch sentiment analysis');
    }
  }
);

export const fetchFactorModel = createAsyncThunk(
  'ml/fetchFactorModel',
  async ({ symbol, model = 'fama-french-3' }: { symbol: string; model?: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/predictions/factor-model/${symbol}`, {
        params: { model },
      });
      return { ...response.data, key: `${symbol}-${model}` };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch factor model analysis');
    }
  }
);

export const fetchAnomalyDetection = createAsyncThunk(
  'ml/fetchAnomalyDetection',
  async ({ symbol, days = 30 }: { symbol: string; days?: number }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/predictions/anomaly-detection/${symbol}`, {
        params: { days },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch anomaly detection');
    }
  }
);

export const fetchSmartBeta = createAsyncThunk(
  'ml/fetchSmartBeta',
  async ({ symbol, factors = ['momentum', 'quality', 'low_volatility'] }: 
    { symbol: string; factors?: string[] }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/predictions/smart-beta/${symbol}`, {
        params: { factors: factors.join(',') },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch smart beta analysis');
    }
  }
);

export const fetchModelStatus = createAsyncThunk(
  'ml/fetchModelStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/predictions/model-status');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch model status');
    }
  }
);

// Create slice
const mlSlice = createSlice({
  name: 'ml',
  initialState,
  reducers: {
    clearMLError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch price prediction
      .addCase(fetchPricePrediction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPricePrediction.fulfilled, (state, action: PayloadAction<PricePredictionResponse>) => {
        state.pricePredictions[action.payload.symbol] = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchPricePrediction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch sentiment analysis
      .addCase(fetchSentimentAnalysis.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSentimentAnalysis.fulfilled, (state, action: PayloadAction<SentimentAnalysisResponse>) => {
        state.sentimentAnalysis[action.payload.symbol] = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchSentimentAnalysis.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch factor model
      .addCase(fetchFactorModel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFactorModel.fulfilled, (state, action: PayloadAction<FactorModelResponse & { key: string }>) => {
        const { key, ...data } = action.payload;
        state.factorModels[key] = data;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchFactorModel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch anomaly detection
      .addCase(fetchAnomalyDetection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnomalyDetection.fulfilled, (state, action: PayloadAction<AnomalyDetectionResponse>) => {
        state.anomalyDetection[action.payload.symbol] = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchAnomalyDetection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch smart beta
      .addCase(fetchSmartBeta.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSmartBeta.fulfilled, (state, action: PayloadAction<SmartBetaResponse>) => {
        state.smartBeta[action.payload.symbol] = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchSmartBeta.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch model status
      .addCase(fetchModelStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchModelStatus.fulfilled, (state, action: PayloadAction<ModelStatusResponse>) => {
        state.modelStatus = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchModelStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearMLError } = mlSlice.actions;

export default mlSlice.reducer;