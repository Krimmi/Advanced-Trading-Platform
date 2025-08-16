import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

// Types
interface WatchlistItem {
  symbol: string;
  name?: string;
  price?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
}

interface Watchlist {
  id: string;
  name: string;
  symbols: string[];
  items?: WatchlistItem[];
  lastUpdated?: string;
}

interface WatchlistState {
  watchlists: Watchlist[];
  currentWatchlist: Watchlist | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: WatchlistState = {
  watchlists: [],
  currentWatchlist: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchWatchlists = createAsyncThunk(
  'watchlist/fetchWatchlists',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/user/watchlists');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch watchlists');
    }
  }
);

export const createWatchlist = createAsyncThunk(
  'watchlist/createWatchlist',
  async ({ name, symbols = [] }: { name: string; symbols?: string[] }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/user/watchlists', { name, symbols });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to create watchlist');
    }
  }
);

export const updateWatchlist = createAsyncThunk(
  'watchlist/updateWatchlist',
  async ({ id, name, symbols }: { id: string; name?: string; symbols?: string[] }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/user/watchlists/${id}`, { name, symbols });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to update watchlist');
    }
  }
);

export const deleteWatchlist = createAsyncThunk(
  'watchlist/deleteWatchlist',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`/api/user/watchlists/${id}`);
      return { id, response: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to delete watchlist');
    }
  }
);

export const addSymbolToWatchlist = createAsyncThunk(
  'watchlist/addSymbolToWatchlist',
  async ({ watchlistId, symbol }: { watchlistId: string; symbol: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/user/watchlists/${watchlistId}/symbols`, { symbol });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to add symbol to watchlist');
    }
  }
);

export const removeSymbolFromWatchlist = createAsyncThunk(
  'watchlist/removeSymbolFromWatchlist',
  async ({ watchlistId, symbol }: { watchlistId: string; symbol: string }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`/api/user/watchlists/${watchlistId}/symbols/${symbol}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to remove symbol from watchlist');
    }
  }
);

export const fetchWatchlistData = createAsyncThunk(
  'watchlist/fetchWatchlistData',
  async (watchlistId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { watchlist: WatchlistState };
      const watchlist = state.watchlist.watchlists.find(w => w.id === watchlistId);
      
      if (!watchlist) {
        throw new Error('Watchlist not found');
      }
      
      // Fetch data for each symbol in the watchlist
      const symbols = watchlist.symbols.join(',');
      if (!symbols) {
        return { ...watchlist, items: [] };
      }
      
      const response = await axios.get(`/api/market/quote/${symbols}`);
      
      // Map response data to watchlist items
      const items: WatchlistItem[] = response.data.map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.name,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        volume: quote.volume,
      }));
      
      return {
        ...watchlist,
        items,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to fetch watchlist data');
    }
  }
);

// Create slice
const watchlistSlice = createSlice({
  name: 'watchlist',
  initialState,
  reducers: {
    setCurrentWatchlist: (state, action: PayloadAction<string>) => {
      state.currentWatchlist = state.watchlists.find(w => w.id === action.payload) || null;
    },
    clearWatchlistError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch watchlists
      .addCase(fetchWatchlists.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWatchlists.fulfilled, (state, action: PayloadAction<Watchlist[]>) => {
        state.watchlists = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchWatchlists.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create watchlist
      .addCase(createWatchlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createWatchlist.fulfilled, (state, action: PayloadAction<Watchlist>) => {
        state.watchlists.push(action.payload);
        state.currentWatchlist = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(createWatchlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update watchlist
      .addCase(updateWatchlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateWatchlist.fulfilled, (state, action: PayloadAction<Watchlist>) => {
        const index = state.watchlists.findIndex(w => w.id === action.payload.id);
        if (index !== -1) {
          state.watchlists[index] = action.payload;
        }
        if (state.currentWatchlist && state.currentWatchlist.id === action.payload.id) {
          state.currentWatchlist = action.payload;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(updateWatchlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete watchlist
      .addCase(deleteWatchlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteWatchlist.fulfilled, (state, action: PayloadAction<{ id: string; response: any }>) => {
        state.watchlists = state.watchlists.filter(w => w.id !== action.payload.id);
        if (state.currentWatchlist && state.currentWatchlist.id === action.payload.id) {
          state.currentWatchlist = null;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(deleteWatchlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Add symbol to watchlist
      .addCase(addSymbolToWatchlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addSymbolToWatchlist.fulfilled, (state, action: PayloadAction<Watchlist>) => {
        const index = state.watchlists.findIndex(w => w.id === action.payload.id);
        if (index !== -1) {
          state.watchlists[index] = action.payload;
        }
        if (state.currentWatchlist && state.currentWatchlist.id === action.payload.id) {
          state.currentWatchlist = action.payload;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(addSymbolToWatchlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Remove symbol from watchlist
      .addCase(removeSymbolFromWatchlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeSymbolFromWatchlist.fulfilled, (state, action: PayloadAction<Watchlist>) => {
        const index = state.watchlists.findIndex(w => w.id === action.payload.id);
        if (index !== -1) {
          state.watchlists[index] = action.payload;
        }
        if (state.currentWatchlist && state.currentWatchlist.id === action.payload.id) {
          state.currentWatchlist = action.payload;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(removeSymbolFromWatchlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch watchlist data
      .addCase(fetchWatchlistData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWatchlistData.fulfilled, (state, action: PayloadAction<Watchlist>) => {
        const index = state.watchlists.findIndex(w => w.id === action.payload.id);
        if (index !== -1) {
          state.watchlists[index] = action.payload;
        }
        if (state.currentWatchlist && state.currentWatchlist.id === action.payload.id) {
          state.currentWatchlist = action.payload;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchWatchlistData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentWatchlist, clearWatchlistError } = watchlistSlice.actions;

export default watchlistSlice.reducer;