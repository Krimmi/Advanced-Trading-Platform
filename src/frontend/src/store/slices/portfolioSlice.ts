import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

// Types
interface Position {
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice?: number;
  marketValue?: number;
  unrealizedGainLoss?: number;
  unrealizedGainLossPercent?: number;
  weight?: number;
}

interface Portfolio {
  id: string;
  name: string;
  positions: Position[];
  cash: number;
  totalValue?: number;
  totalCost?: number;
  totalGainLoss?: number;
  totalGainLossPercent?: number;
  lastUpdated?: string;
}

interface OptimizationRequest {
  symbols: string[];
  riskTolerance: number;
  optimizationGoal: string;
}

interface OptimizationResult {
  optimizedWeights: Record<string, number>;
  expectedAnnualReturn: number;
  expectedAnnualVolatility: number;
  sharpeRatio: number;
  efficientFrontier: Array<{ return: number; risk: number }>;
}

interface PortfolioState {
  portfolios: Portfolio[];
  currentPortfolio: Portfolio | null;
  optimizationResult: OptimizationResult | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: PortfolioState = {
  portfolios: [],
  currentPortfolio: null,
  optimizationResult: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchPortfolios = createAsyncThunk(
  'portfolio/fetchPortfolios',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/portfolio/portfolios');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch portfolios');
    }
  }
);

export const fetchPortfolioById = createAsyncThunk(
  'portfolio/fetchPortfolioById',
  async (portfolioId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/portfolio/portfolios/${portfolioId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch portfolio');
    }
  }
);

export const createPortfolio = createAsyncThunk(
  'portfolio/createPortfolio',
  async ({ name, initialCash }: { name: string; initialCash: number }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/portfolio/portfolios', { name, initial_cash: initialCash });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to create portfolio');
    }
  }
);

export const addPosition = createAsyncThunk(
  'portfolio/addPosition',
  async ({ portfolioId, symbol, quantity, entryPrice }: 
    { portfolioId: string; symbol: string; quantity: number; entryPrice: number }, 
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(`/api/portfolio/portfolios/${portfolioId}/positions`, {
        symbol,
        quantity,
        entry_price: entryPrice,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to add position');
    }
  }
);

export const removePosition = createAsyncThunk(
  'portfolio/removePosition',
  async ({ portfolioId, symbol, quantity }: 
    { portfolioId: string; symbol: string; quantity?: number }, 
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.delete(
        `/api/portfolio/portfolios/${portfolioId}/positions/${symbol}${quantity ? `?quantity=${quantity}` : ''}`
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to remove position');
    }
  }
);

export const optimizePortfolio = createAsyncThunk(
  'portfolio/optimizePortfolio',
  async (request: OptimizationRequest, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/portfolio/optimize', request);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to optimize portfolio');
    }
  }
);

// Create slice
const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    clearPortfolioError: (state) => {
      state.error = null;
    },
    clearOptimizationResult: (state) => {
      state.optimizationResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch portfolios
      .addCase(fetchPortfolios.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPortfolios.fulfilled, (state, action: PayloadAction<Portfolio[]>) => {
        state.portfolios = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchPortfolios.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch portfolio by ID
      .addCase(fetchPortfolioById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPortfolioById.fulfilled, (state, action: PayloadAction<Portfolio>) => {
        state.currentPortfolio = action.payload;
        state.loading = false;
        state.error = null;
        
        // Update portfolio in portfolios array
        const index = state.portfolios.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.portfolios[index] = action.payload;
        }
      })
      .addCase(fetchPortfolioById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create portfolio
      .addCase(createPortfolio.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPortfolio.fulfilled, (state, action: PayloadAction<Portfolio>) => {
        state.portfolios.push(action.payload);
        state.currentPortfolio = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(createPortfolio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Add position
      .addCase(addPosition.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addPosition.fulfilled, (state, action: PayloadAction<Portfolio>) => {
        state.currentPortfolio = action.payload;
        
        // Update portfolio in portfolios array
        const index = state.portfolios.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.portfolios[index] = action.payload;
        }
        
        state.loading = false;
        state.error = null;
      })
      .addCase(addPosition.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Remove position
      .addCase(removePosition.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removePosition.fulfilled, (state, action: PayloadAction<Portfolio>) => {
        state.currentPortfolio = action.payload;
        
        // Update portfolio in portfolios array
        const index = state.portfolios.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.portfolios[index] = action.payload;
        }
        
        state.loading = false;
        state.error = null;
      })
      .addCase(removePosition.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Optimize portfolio
      .addCase(optimizePortfolio.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(optimizePortfolio.fulfilled, (state, action: PayloadAction<OptimizationResult>) => {
        state.optimizationResult = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(optimizePortfolio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearPortfolioError, clearOptimizationResult } = portfolioSlice.actions;

export default portfolioSlice.reducer;