import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '../../services/api/apiClient';
import unifiedDataProvider from '../../services/api/providers/UnifiedDataProvider';

// Types
export interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  timestamp: number;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  pe: number;
  dividend: number;
  yield: number;
  eps: number;
  high52: number;
  low52: number;
  open: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  timestamp: number;
}

export interface StockTrade {
  symbol: string;
  price: number;
  size: number;
  exchange: string;
  timestamp: number;
  conditions: string[];
  id: string;
}

export interface StockBar {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
  vwap?: number;
  tradeCount?: number;
}

export interface MarketMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

export interface MarketSector {
  id: string;
  name: string;
  performance: number;
  marketCap: number;
  stocks: string[];
}

export interface MarketSummary {
  indices: MarketIndex[];
  topGainers: MarketMover[];
  topLosers: MarketMover[];
  mostActive: MarketMover[];
  sectors: MarketSector[];
  timestamp: number;
}

export interface MarketState {
  marketSummary: MarketSummary | null;
  quotes: Record<string, StockQuote>;
  trades: Record<string, StockTrade[]>;
  bars: Record<string, Record<string, StockBar[]>>;
  watchlists: {
    [id: string]: {
      id: string;
      name: string;
      symbols: string[];
    }
  };
  marketStatus: {
    isOpen: boolean;
    nextOpen: string | null;
    nextClose: string | null;
    timestamp: number;
  } | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

// Initial state
const initialState: MarketState = {
  marketSummary: null,
  quotes: {},
  trades: {},
  bars: {},
  watchlists: {
    'default': {
      id: 'default',
      name: 'Default Watchlist',
      symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'],
    },
  },
  marketStatus: null,
  loading: false,
  error: null,
  lastUpdated: null,
};

// Mock data for development
const mockMarketSummary: MarketSummary = {
  indices: [
    {
      symbol: 'SPX',
      name: 'S&P 500',
      price: 5123.45,
      change: 60.23,
      changePercent: 1.2,
      volume: 2500000000,
      previousClose: 5063.22,
      open: 5070.15,
      high: 5130.45,
      low: 5060.78,
      timestamp: Date.now(),
    },
    {
      symbol: 'NDX',
      name: 'Nasdaq',
      price: 16789.01,
      change: 248.67,
      changePercent: 1.5,
      volume: 3200000000,
      previousClose: 16540.34,
      open: 16550.22,
      high: 16800.45,
      low: 16520.78,
      timestamp: Date.now(),
    },
    {
      symbol: 'DJI',
      name: 'Dow Jones',
      price: 38456.78,
      change: -115.34,
      changePercent: -0.3,
      volume: 1800000000,
      previousClose: 38572.12,
      open: 38580.45,
      high: 38650.23,
      low: 38400.12,
      timestamp: Date.now(),
    },
    {
      symbol: 'RUT',
      name: 'Russell 2000',
      price: 2345.67,
      change: 18.56,
      changePercent: 0.8,
      volume: 950000000,
      previousClose: 2327.11,
      open: 2330.45,
      high: 2350.78,
      low: 2325.34,
      timestamp: Date.now(),
    },
  ],
  topGainers: [
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      price: 950.45,
      change: 45.67,
      changePercent: 5.05,
      volume: 35000000,
    },
    {
      symbol: 'AMD',
      name: 'Advanced Micro Devices, Inc.',
      price: 178.34,
      change: 7.89,
      changePercent: 4.63,
      volume: 28000000,
    },
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 243.58,
      change: 5.67,
      changePercent: 2.38,
      volume: 42000000,
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      price: 387.92,
      change: 7.45,
      changePercent: 1.96,
      volume: 25000000,
    },
    {
      symbol: 'AMZN',
      name: 'Amazon.com Inc.',
      price: 192.36,
      change: 3.21,
      changePercent: 1.70,
      volume: 30000000,
    },
  ],
  topLosers: [
    {
      symbol: 'TSLA',
      name: 'Tesla, Inc.',
      price: 267.89,
      change: -12.45,
      changePercent: -4.44,
      volume: 38000000,
    },
    {
      symbol: 'META',
      name: 'Meta Platforms, Inc.',
      price: 456.78,
      change: -15.67,
      changePercent: -3.32,
      volume: 22000000,
    },
    {
      symbol: 'NFLX',
      name: 'Netflix, Inc.',
      price: 678.45,
      change: -18.90,
      changePercent: -2.71,
      volume: 15000000,
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      price: 178.45,
      change: -4.32,
      changePercent: -2.36,
      volume: 20000000,
    },
    {
      symbol: 'PYPL',
      name: 'PayPal Holdings, Inc.',
      price: 87.65,
      change: -1.98,
      changePercent: -2.21,
      volume: 12000000,
    },
  ],
  mostActive: [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 243.58,
      change: 5.67,
      changePercent: 2.38,
      volume: 42000000,
    },
    {
      symbol: 'TSLA',
      name: 'Tesla, Inc.',
      price: 267.89,
      change: -12.45,
      changePercent: -4.44,
      volume: 38000000,
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      price: 950.45,
      change: 45.67,
      changePercent: 5.05,
      volume: 35000000,
    },
    {
      symbol: 'AMZN',
      name: 'Amazon.com Inc.',
      price: 192.36,
      change: 3.21,
      changePercent: 1.70,
      volume: 30000000,
    },
    {
      symbol: 'AMD',
      name: 'Advanced Micro Devices, Inc.',
      price: 178.34,
      change: 7.89,
      changePercent: 4.63,
      volume: 28000000,
    },
  ],
  sectors: [
    {
      id: 'tech',
      name: 'Technology',
      performance: 2.3,
      marketCap: 12500000000000,
      stocks: ['AAPL', 'MSFT', 'NVDA', 'AMD', 'INTC'],
    },
    {
      id: 'healthcare',
      name: 'Healthcare',
      performance: 1.2,
      marketCap: 5800000000000,
      stocks: ['JNJ', 'PFE', 'UNH', 'ABBV', 'MRK'],
    },
    {
      id: 'finance',
      name: 'Financials',
      performance: -0.5,
      marketCap: 4900000000000,
      stocks: ['JPM', 'BAC', 'WFC', 'C', 'GS'],
    },
    {
      id: 'consumer',
      name: 'Consumer Discretionary',
      performance: 0.8,
      marketCap: 4200000000000,
      stocks: ['AMZN', 'HD', 'MCD', 'NKE', 'SBUX'],
    },
    {
      id: 'energy',
      name: 'Energy',
      performance: -1.2,
      marketCap: 2800000000000,
      stocks: ['XOM', 'CVX', 'COP', 'SLB', 'EOG'],
    },
  ],
  timestamp: Date.now(),
};

// Async thunks
export const fetchMarketSummary = createAsyncThunk(
  'market/fetchMarketSummary',
  async (_, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll use mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return mockMarketSummary;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch market summary');
    }
  }
);

export const fetchMarketStatus = createAsyncThunk(
  'market/fetchMarketStatus',
  async (_, { rejectWithValue }) => {
    try {
      const status = await unifiedDataProvider.getMarketStatus();
      
      return {
        isOpen: status.is_open || false,
        nextOpen: status.next_open || null,
        nextClose: status.next_close || null,
        timestamp: Date.now()
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch market status');
    }
  }
);

export const fetchStockQuote = createAsyncThunk(
  'market/fetchStockQuote',
  async (symbol: string, { rejectWithValue }) => {
    try {
      // Try to get real data from our unified data provider
      try {
        const quote = await unifiedDataProvider.getQuote(symbol);
        
        // Map the response to our StockQuote interface
        const stockQuote: StockQuote = {
          symbol,
          name: quote.name || `${symbol}`,
          price: quote.latestPrice || quote.last_price || quote.price || 0,
          change: quote.change || 0,
          changePercent: quote.changePercent || quote.percent_change || 0,
          volume: quote.volume || 0,
          avgVolume: quote.avgTotalVolume || quote.average_volume || 0,
          marketCap: quote.marketCap || 0,
          pe: quote.peRatio || 0,
          dividend: quote.dividendYield || 0,
          yield: quote.yield || 0,
          eps: quote.eps || 0,
          high52: quote.week52High || quote.high_52 || 0,
          low52: quote.week52Low || quote.low_52 || 0,
          open: quote.open || 0,
          previousClose: quote.previousClose || quote.prev_close || 0,
          dayHigh: quote.high || quote.day_high || 0,
          dayLow: quote.low || quote.day_low || 0,
          timestamp: Date.now(),
        };
        
        return { symbol, quote: stockQuote };
      } catch (apiError) {
        console.error(`Failed to get real quote data for ${symbol}:`, apiError);
        
        // Fall back to mock data
        // Generate mock quote data
        const quote: StockQuote = {
          symbol,
          name: `${symbol} Inc.`,
          price: Math.random() * 1000,
          change: (Math.random() * 20) - 10,
          changePercent: (Math.random() * 5) - 2.5,
          volume: Math.floor(Math.random() * 50000000),
          avgVolume: Math.floor(Math.random() * 40000000),
          marketCap: Math.floor(Math.random() * 2000000000000),
          pe: Math.random() * 50,
          dividend: Math.random() * 5,
          yield: Math.random() * 5,
          eps: Math.random() * 20,
          high52: Math.random() * 1200,
          low52: Math.random() * 800,
          open: Math.random() * 1000,
          previousClose: Math.random() * 1000,
          dayHigh: Math.random() * 1000,
          dayLow: Math.random() * 900,
          timestamp: Date.now(),
        };
        
        return { symbol, quote };
      }
    } catch (error: any) {
      return rejectWithValue(error.message || `Failed to fetch quote for ${symbol}`);
    }
  }
);

export const fetchHistoricalBars = createAsyncThunk(
  'market/fetchHistoricalBars',
  async ({ 
    symbol, 
    timeframe, 
    days 
  }: { 
    symbol: string; 
    timeframe: string; 
    days: number;
  }, { rejectWithValue }) => {
    try {
      // Calculate start date (days ago from today)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const start = startDate.toISOString().split('T')[0];
      
      // End date is today
      const endDate = new Date();
      const end = endDate.toISOString().split('T')[0];
      
      // Get bars from unified data provider
      const bars = await unifiedDataProvider.getBars(symbol, timeframe, start, end);
      
      // Process and normalize the bars
      const processedBars = bars.map(bar => ({
        symbol,
        open: bar.o || bar.open || 0,
        high: bar.h || bar.high || 0,
        low: bar.l || bar.low || 0,
        close: bar.c || bar.close || 0,
        volume: bar.v || bar.volume || 0,
        timestamp: bar.t || bar.timestamp || Date.now(),
        vwap: bar.vw || bar.vwap,
        tradeCount: bar.n || bar.trade_count
      }));
      
      return { symbol, timeframe, bars: processedBars };
    } catch (error: any) {
      return rejectWithValue(error.message || `Failed to fetch historical bars for ${symbol}`);
    }
  }
);

export const addToWatchlist = createAsyncThunk(
  'market/addToWatchlist',
  async ({ watchlistId, symbol }: { watchlistId: string, symbol: string }, { getState, rejectWithValue }) => {
    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll just return the data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { watchlistId, symbol };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add to watchlist');
    }
  }
);

export const removeFromWatchlist = createAsyncThunk(
  'market/removeFromWatchlist',
  async ({ watchlistId, symbol }: { watchlistId: string, symbol: string }, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll just return the data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { watchlistId, symbol };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to remove from watchlist');
    }
  }
);

// Slice
const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    updateMarketData: (state, action: PayloadAction<any>) => {
      // Handle real-time market data updates from WebSocket
      const { type, data } = action.payload;
      
      switch (type) {
        case 'INDEX_UPDATE':
          if (state.marketSummary) {
            const index = state.marketSummary.indices.findIndex(i => i.symbol === data.symbol);
            if (index !== -1) {
              state.marketSummary.indices[index] = {
                ...state.marketSummary.indices[index],
                ...data,
                timestamp: Date.now(),
              };
            }
          }
          break;
          
        case 'QUOTE_UPDATE':
          if (data.symbol) {
            // Create quote if it doesn't exist
            if (!state.quotes[data.symbol]) {
              state.quotes[data.symbol] = {
                symbol: data.symbol,
                name: data.symbol,
                price: data.price || 0,
                change: 0,
                changePercent: 0,
                volume: 0,
                avgVolume: 0,
                marketCap: 0,
                pe: 0,
                dividend: 0,
                yield: 0,
                eps: 0,
                high52: 0,
                low52: 0,
                open: 0,
                previousClose: 0,
                dayHigh: 0,
                dayLow: 0,
                timestamp: Date.now(),
              };
            }
            
            // Update quote with new data
            state.quotes[data.symbol] = {
              ...state.quotes[data.symbol],
              price: data.price || data.last_price || state.quotes[data.symbol].price,
              change: data.change || state.quotes[data.symbol].change,
              changePercent: data.changePercent || data.percent_change || state.quotes[data.symbol].changePercent,
              volume: data.volume || state.quotes[data.symbol].volume,
              timestamp: Date.now(),
            };
            
            // Update dayHigh and dayLow if needed
            if (state.quotes[data.symbol].price > state.quotes[data.symbol].dayHigh) {
              state.quotes[data.symbol].dayHigh = state.quotes[data.symbol].price;
            }
            if (state.quotes[data.symbol].price < state.quotes[data.symbol].dayLow || state.quotes[data.symbol].dayLow === 0) {
              state.quotes[data.symbol].dayLow = state.quotes[data.symbol].price;
            }
          }
          break;
          
        case 'TRADE_UPDATE':
          if (data.symbol) {
            // Initialize trades array if it doesn't exist
            if (!state.trades[data.symbol]) {
              state.trades[data.symbol] = [];
            }
            
            // Create trade object
            const trade: StockTrade = {
              symbol: data.symbol,
              price: data.price || 0,
              size: data.size || data.volume || 0,
              exchange: data.exchange || '',
              timestamp: data.timestamp || Date.now(),
              conditions: data.conditions || [],
              id: data.id || `trade-${Date.now()}-${Math.random()}`
            };
            
            // Add trade to beginning of array and limit to 100 trades
            state.trades[data.symbol].unshift(trade);
            if (state.trades[data.symbol].length > 100) {
              state.trades[data.symbol] = state.trades[data.symbol].slice(0, 100);
            }
          }
          break;
          
        case 'BAR_UPDATE':
          if (data.symbol) {
            const timeframe = data.timeframe || '1m';
            
            // Initialize bars structure if it doesn't exist
            if (!state.bars[data.symbol]) {
              state.bars[data.symbol] = {};
            }
            if (!state.bars[data.symbol][timeframe]) {
              state.bars[data.symbol][timeframe] = [];
            }
            
            // Create bar object
            const bar: StockBar = {
              symbol: data.symbol,
              open: data.open || data.o || 0,
              high: data.high || data.h || 0,
              low: data.low || data.l || 0,
              close: data.close || data.c || 0,
              volume: data.volume || data.v || 0,
              timestamp: data.timestamp || data.t || Date.now(),
              vwap: data.vwap || data.vw,
              tradeCount: data.tradeCount || data.n
            };
            
            // Check if we need to update an existing bar or add a new one
            const existingBarIndex = state.bars[data.symbol][timeframe].findIndex(
              b => new Date(b.timestamp).getTime() === new Date(bar.timestamp).getTime()
            );
            
            if (existingBarIndex !== -1) {
              // Update existing bar
              state.bars[data.symbol][timeframe][existingBarIndex] = bar;
            } else {
              // Add new bar to beginning of array and limit to 1000 bars
              state.bars[data.symbol][timeframe].unshift(bar);
              if (state.bars[data.symbol][timeframe].length > 1000) {
                state.bars[data.symbol][timeframe] = state.bars[data.symbol][timeframe].slice(0, 1000);
              }
            }
          }
          break;
          
        case 'MARKET_STATUS_UPDATE':
          state.marketStatus = {
            isOpen: data.isOpen || false,
            nextOpen: data.nextOpen || null,
            nextClose: data.nextClose || null,
            timestamp: Date.now()
          };
          break;
          
        case 'MARKET_SUMMARY_UPDATE':
          if (state.marketSummary) {
            state.marketSummary = {
              ...state.marketSummary,
              ...data,
              timestamp: Date.now(),
            };
          }
          break;
      }
      
      state.lastUpdated = Date.now();
    },
    
    clearMarketData: (state) => {
      state.marketSummary = null;
      state.quotes = {};
      state.trades = {};
      state.bars = {};
      state.lastUpdated = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch market summary
    builder.addCase(fetchMarketSummary.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchMarketSummary.fulfilled, (state, action) => {
      state.loading = false;
      state.marketSummary = action.payload;
      state.lastUpdated = Date.now();
    });
    builder.addCase(fetchMarketSummary.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Fetch market status
    builder.addCase(fetchMarketStatus.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchMarketStatus.fulfilled, (state, action) => {
      state.loading = false;
      state.marketStatus = action.payload;
      state.lastUpdated = Date.now();
    });
    builder.addCase(fetchMarketStatus.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Fetch stock quote
    builder.addCase(fetchStockQuote.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchStockQuote.fulfilled, (state, action) => {
      state.loading = false;
      state.quotes[action.payload.symbol] = action.payload.quote;
      state.lastUpdated = Date.now();
    });
    builder.addCase(fetchStockQuote.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Fetch historical bars
    builder.addCase(fetchHistoricalBars.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchHistoricalBars.fulfilled, (state, action) => {
      state.loading = false;
      
      const { symbol, timeframe, bars } = action.payload;
      
      // Initialize bars structure if it doesn't exist
      if (!state.bars[symbol]) {
        state.bars[symbol] = {};
      }
      
      // Store bars
      state.bars[symbol][timeframe] = bars;
      state.lastUpdated = Date.now();
    });
    builder.addCase(fetchHistoricalBars.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Add to watchlist
    builder.addCase(addToWatchlist.fulfilled, (state, action) => {
      const { watchlistId, symbol } = action.payload;
      
      if (state.watchlists[watchlistId]) {
        if (!state.watchlists[watchlistId].symbols.includes(symbol)) {
          state.watchlists[watchlistId].symbols.push(symbol);
        }
      }
    });
    
    // Remove from watchlist
    builder.addCase(removeFromWatchlist.fulfilled, (state, action) => {
      const { watchlistId, symbol } = action.payload;
      
      if (state.watchlists[watchlistId]) {
        state.watchlists[watchlistId].symbols = state.watchlists[watchlistId].symbols.filter(
          s => s !== symbol
        );
      }
    });
  },
});

export const { updateMarketData, clearMarketData } = marketSlice.actions;

export default marketSlice.reducer;