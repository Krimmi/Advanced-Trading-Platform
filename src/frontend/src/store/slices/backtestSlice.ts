import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import backtestService, { Strategy, BacktestConfig, BacktestResult } from '../../services/backtestService';

// Types
interface BacktestState {
  strategies: Strategy[];
  currentStrategy: Strategy | null;
  backtestResults: BacktestResult[];
  currentBacktest: BacktestResult | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: BacktestState = {
  strategies: [],
  currentStrategy: null,
  backtestResults: [],
  currentBacktest: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchStrategies = createAsyncThunk(
  'backtest/fetchStrategies',
  async (_, { rejectWithValue }) => {
    try {
      const response = await backtestService.getStrategies();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch strategies');
    }
  }
);

export const fetchStrategy = createAsyncThunk(
  'backtest/fetchStrategy',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await backtestService.getStrategy(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch strategy');
    }
  }
);

export const createStrategy = createAsyncThunk(
  'backtest/createStrategy',
  async (data: Omit<Strategy, 'id' | 'created_at' | 'updated_at'>, { rejectWithValue }) => {
    try {
      const response = await backtestService.createStrategy(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create strategy');
    }
  }
);

export const updateStrategy = createAsyncThunk(
  'backtest/updateStrategy',
  async ({ id, data }: { id: string; data: Partial<Omit<Strategy, 'id' | 'created_at' | 'updated_at'>> }, { rejectWithValue }) => {
    try {
      const response = await backtestService.updateStrategy(id, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update strategy');
    }
  }
);

export const deleteStrategy = createAsyncThunk(
  'backtest/deleteStrategy',
  async (id: string, { rejectWithValue }) => {
    try {
      await backtestService.deleteStrategy(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete strategy');
    }
  }
);

export const runBacktest = createAsyncThunk(
  'backtest/runBacktest',
  async (config: BacktestConfig, { rejectWithValue }) => {
    try {
      const response = await backtestService.runBacktest(config);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to run backtest');
    }
  }
);

export const fetchBacktestResults = createAsyncThunk(
  'backtest/fetchBacktestResults',
  async (_, { rejectWithValue }) => {
    try {
      const response = await backtestService.getBacktestResults();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch backtest results');
    }
  }
);

export const fetchBacktestResult = createAsyncThunk(
  'backtest/fetchBacktestResult',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await backtestService.getBacktestResult(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch backtest result');
    }
  }
);

export const deleteBacktestResult = createAsyncThunk(
  'backtest/deleteBacktestResult',
  async (id: string, { rejectWithValue }) => {
    try {
      await backtestService.deleteBacktestResult(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete backtest result');
    }
  }
);

export const fetchStrategyTemplates = createAsyncThunk(
  'backtest/fetchStrategyTemplates',
  async (_, { rejectWithValue }) => {
    try {
      const response = await backtestService.getStrategyTemplates();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch strategy templates');
    }
  }
);

// Create slice
const backtestSlice = createSlice({
  name: 'backtest',
  initialState,
  reducers: {
    resetBacktestState: (state) => {
      state.error = null;
      state.currentBacktest = null;
    },
    setCurrentStrategy: (state, action: PayloadAction<Strategy | null>) => {
      state.currentStrategy = action.payload;
    },
    setCurrentBacktest: (state, action: PayloadAction<BacktestResult | null>) => {
      state.currentBacktest = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch strategies
    builder.addCase(fetchStrategies.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchStrategies.fulfilled, (state, action: PayloadAction<Strategy[]>) => {
      state.loading = false;
      state.strategies = action.payload;
    });
    builder.addCase(fetchStrategies.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch strategy
    builder.addCase(fetchStrategy.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchStrategy.fulfilled, (state, action: PayloadAction<Strategy>) => {
      state.loading = false;
      state.currentStrategy = action.payload;
    });
    builder.addCase(fetchStrategy.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create strategy
    builder.addCase(createStrategy.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createStrategy.fulfilled, (state, action: PayloadAction<Strategy>) => {
      state.loading = false;
      state.strategies.push(action.payload);
      state.currentStrategy = action.payload;
    });
    builder.addCase(createStrategy.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update strategy
    builder.addCase(updateStrategy.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateStrategy.fulfilled, (state, action: PayloadAction<Strategy>) => {
      state.loading = false;
      const index = state.strategies.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.strategies[index] = action.payload;
      }
      state.currentStrategy = action.payload;
    });
    builder.addCase(updateStrategy.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Delete strategy
    builder.addCase(deleteStrategy.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteStrategy.fulfilled, (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.strategies = state.strategies.filter(s => s.id !== action.payload);
      if (state.currentStrategy && state.currentStrategy.id === action.payload) {
        state.currentStrategy = null;
      }
    });
    builder.addCase(deleteStrategy.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Run backtest
    builder.addCase(runBacktest.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(runBacktest.fulfilled, (state, action: PayloadAction<BacktestResult>) => {
      state.loading = false;
      state.currentBacktest = action.payload;
      state.backtestResults.push(action.payload);
    });
    builder.addCase(runBacktest.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch backtest results
    builder.addCase(fetchBacktestResults.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchBacktestResults.fulfilled, (state, action: PayloadAction<BacktestResult[]>) => {
      state.loading = false;
      state.backtestResults = action.payload;
    });
    builder.addCase(fetchBacktestResults.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch backtest result
    builder.addCase(fetchBacktestResult.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchBacktestResult.fulfilled, (state, action: PayloadAction<BacktestResult>) => {
      state.loading = false;
      state.currentBacktest = action.payload;
    });
    builder.addCase(fetchBacktestResult.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Delete backtest result
    builder.addCase(deleteBacktestResult.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteBacktestResult.fulfilled, (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.backtestResults = state.backtestResults.filter(r => r.id !== action.payload);
      if (state.currentBacktest && state.currentBacktest.id === action.payload) {
        state.currentBacktest = null;
      }
    });
    builder.addCase(deleteBacktestResult.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch strategy templates
    builder.addCase(fetchStrategyTemplates.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchStrategyTemplates.fulfilled, (state, action: PayloadAction<Strategy[]>) => {
      state.loading = false;
      state.strategies = action.payload;
    });
    builder.addCase(fetchStrategyTemplates.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { resetBacktestState, setCurrentStrategy, setCurrentBacktest } = backtestSlice.actions;

export default backtestSlice.reducer;