import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

// Types
interface ScreenerFilter {
  field: string;
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'between' | 'in';
  value: any;
  value2?: any; // For 'between' operator
}

interface ScreenerRequest {
  filters: ScreenerFilter[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit: number;
  offset: number;
}

interface Stock {
  symbol: string;
  name: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
  price?: number;
  peRatio?: number;
  forwardPe?: number;
  pegRatio?: number;
  psRatio?: number;
  pbRatio?: number;
  dividendYield?: number;
  beta?: number;
  week52High?: number;
  week52Low?: number;
  avgVolume?: number;
  debtToEquity?: number;
  currentRatio?: number;
  quickRatio?: number;
  roe?: number;
  roa?: number;
  netMargin?: number;
  operatingMargin?: number;
  revenueGrowth?: number;
  epsGrowth?: number;
  evToEbitda?: number;
  priceChange1d?: number;
  priceChange1m?: number;
  priceChange3m?: number;
  priceChange1y?: number;
  rsi14?: number;
  macd?: number;
  analystRating?: string;
  priceTarget?: number;
  insiderBuying?: boolean;
  [key: string]: any; // Allow any other properties
}

interface ScreenerResults {
  totalResults: number;
  offset: number;
  limit: number;
  results: Stock[];
}

interface FilterOption {
  id: string;
  name: string;
  type: 'number' | 'string' | 'boolean';
  unit?: string;
  operators: string[];
  description: string;
  options?: any[];
}

interface FilterOptions {
  [category: string]: FilterOption[];
}

interface SortOption {
  id: string;
  name: string;
}

interface PresetScreen {
  id: string;
  name: string;
  description: string;
  filters: ScreenerFilter[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface TopStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

interface SectorPerformance {
  sector: string;
  stockCount: number;
  totalMarketCap: number;
  priceChange1d: number;
  priceChange1m: number;
  priceChange3m: number;
  priceChange1y: number;
  averagePe?: number;
  averageDividendYield: number;
}

interface ScreenerState {
  results: ScreenerResults | null;
  filterOptions: {
    filters: FilterOptions;
    sortOptions: SortOption[];
  } | null;
  presetScreens: PresetScreen[];
  topStocks: {
    gainers: TopStock[];
    losers: TopStock[];
    active: TopStock[];
    dividend: TopStock[];
    growth: TopStock[];
    value: TopStock[];
  };
  sectorPerformance: SectorPerformance[];
  currentRequest: ScreenerRequest | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: ScreenerState = {
  results: null,
  filterOptions: null,
  presetScreens: [],
  topStocks: {
    gainers: [],
    losers: [],
    active: [],
    dividend: [],
    growth: [],
    value: [],
  },
  sectorPerformance: [],
  currentRequest: null,
  loading: false,
  error: null,
};

// Async thunks
export const screenStocks = createAsyncThunk(
  'screener/screenStocks',
  async (request: ScreenerRequest, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/screener/screen', request);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to screen stocks');
    }
  }
);

export const fetchFilterOptions = createAsyncThunk(
  'screener/fetchFilterOptions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/screener/filter-options');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch filter options');
    }
  }
);

export const fetchPresetScreens = createAsyncThunk(
  'screener/fetchPresetScreens',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/screener/preset-screens');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch preset screens');
    }
  }
);

export const fetchTopStocks = createAsyncThunk(
  'screener/fetchTopStocks',
  async (category: 'gainers' | 'losers' | 'active' | 'dividend' | 'growth' | 'value', { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/screener/top-stocks/${category}`);
      return { category, stocks: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || `Failed to fetch top ${category} stocks`);
    }
  }
);

export const fetchSectorPerformance = createAsyncThunk(
  'screener/fetchSectorPerformance',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/screener/sector-performance');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch sector performance');
    }
  }
);

// Create slice
const screenerSlice = createSlice({
  name: 'screener',
  initialState,
  reducers: {
    setCurrentRequest: (state, action: PayloadAction<ScreenerRequest>) => {
      state.currentRequest = action.payload;
    },
    clearScreenerError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Screen stocks
      .addCase(screenStocks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(screenStocks.fulfilled, (state, action: PayloadAction<ScreenerResults>) => {
        state.results = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(screenStocks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch filter options
      .addCase(fetchFilterOptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFilterOptions.fulfilled, (state, action: PayloadAction<{
        filters: FilterOptions;
        sort_options: SortOption[];
      }>) => {
        state.filterOptions = {
          filters: action.payload.filters,
          sortOptions: action.payload.sort_options,
        };
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchFilterOptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch preset screens
      .addCase(fetchPresetScreens.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPresetScreens.fulfilled, (state, action: PayloadAction<PresetScreen[]>) => {
        state.presetScreens = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchPresetScreens.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch top stocks
      .addCase(fetchTopStocks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTopStocks.fulfilled, (state, action: PayloadAction<{
        category: 'gainers' | 'losers' | 'active' | 'dividend' | 'growth' | 'value';
        stocks: TopStock[];
      }>) => {
        state.topStocks[action.payload.category] = action.payload.stocks;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchTopStocks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch sector performance
      .addCase(fetchSectorPerformance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSectorPerformance.fulfilled, (state, action: PayloadAction<SectorPerformance[]>) => {
        state.sectorPerformance = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchSectorPerformance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentRequest, clearScreenerError } = screenerSlice.actions;

export default screenerSlice.reducer;