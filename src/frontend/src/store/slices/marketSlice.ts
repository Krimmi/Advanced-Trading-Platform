import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

// Types
interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface SectorPerformance {
  sector: string;
  performance: number;
}

interface MarketMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

interface MarketState {
  indexes: MarketIndex[];
  sectors: SectorPerformance[];
  gainers: MarketMover[];
  losers: MarketMover[];
  active: MarketMover[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

// Initial state
const initialState: MarketState = {
  indexes: [],
  sectors: [],
  gainers: [],
  losers: [],
  active: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

// Async thunks
export const fetchMarketData = createAsyncThunk(
  'market/fetchMarketData',
  async (_, { rejectWithValue }) => {
    try {
      // Fetch market indexes
      const indexesResponse = await axios.get('/api/market/market-indexes');
      
      // Fetch sector performance
      const sectorsResponse = await axios.get('/api/market/sector-performance');
      
      // Fetch market movers - gainers
      const gainersResponse = await axios.get('/api/market/market-movers/gainers');
      
      // Fetch market movers - losers
      const losersResponse = await axios.get('/api/market/market-movers/losers');
      
      // Fetch market movers - most active
      const activeResponse = await axios.get('/api/market/market-movers/actives');
      
      return {
        indexes: indexesResponse.data,
        sectors: sectorsResponse.data,
        gainers: gainersResponse.data,
        losers: losersResponse.data,
        active: activeResponse.data,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch market data');
    }
  }
);

// Create slice
const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    clearMarketError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMarketData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMarketData.fulfilled, (state, action: PayloadAction<{
        indexes: MarketIndex[];
        sectors: SectorPerformance[];
        gainers: MarketMover[];
        losers: MarketMover[];
        active: MarketMover[];
        lastUpdated: string;
      }>) => {
        state.indexes = action.payload.indexes;
        state.sectors = action.payload.sectors;
        state.gainers = action.payload.gainers;
        state.losers = action.payload.losers;
        state.active = action.payload.active;
        state.lastUpdated = action.payload.lastUpdated;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchMarketData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearMarketError } = marketSlice.actions;

export default marketSlice.reducer;