import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '../../services/api/apiClient';

// Types
export interface Order {
  id: string;
  portfolioId: string;
  symbol: string;
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  side: 'buy' | 'sell';
  quantity: number;
  price?: number;
  stopPrice?: number;
  status: 'pending' | 'open' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected' | 'expired';
  filledQuantity: number;
  averagePrice?: number;
  timeInForce: 'day' | 'gtc' | 'ioc' | 'fok';
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  notes?: string;
}

export interface Trade {
  id: string;
  orderId: string;
  portfolioId: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: string;
  commission: number;
  total: number;
}

export interface Position {
  portfolioId: string;
  symbol: string;
  quantity: number;
  averageCost: number;
  marketValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
}

export interface OrderBook {
  symbol: string;
  timestamp: number;
  bids: {
    price: number;
    quantity: number;
  }[];
  asks: {
    price: number;
    quantity: number;
  }[];
}

export interface TradingState {
  orders: Record<string, Order>;
  trades: Record<string, Trade>;
  orderBooks: Record<string, OrderBook>;
  watchedSymbols: string[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

// Initial state
const initialState: TradingState = {
  orders: {},
  trades: {},
  orderBooks: {},
  watchedSymbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'],
  loading: false,
  error: null,
  lastUpdated: null,
};

// Generate mock order data
const generateMockOrder = (
  id: string,
  portfolioId: string,
  symbol: string,
  type: Order['type'],
  side: Order['side'],
  quantity: number,
  price?: number,
  stopPrice?: number
): Order => {
  const now = new Date();
  const status: Order['status'] = Math.random() > 0.7 ? 'filled' : Math.random() > 0.5 ? 'open' : 'pending';
  const filledQuantity = status === 'filled' ? quantity : status === 'partially_filled' ? Math.floor(quantity * Math.random()) : 0;
  const averagePrice = status === 'filled' || status === 'partially_filled' ? price || (Math.random() * 100 + 50) : undefined;
  
  return {
    id,
    portfolioId,
    symbol,
    type,
    side,
    quantity,
    price,
    stopPrice,
    status,
    filledQuantity,
    averagePrice,
    timeInForce: 'day',
    createdAt: new Date(now.getTime() - Math.random() * 86400000 * 7).toISOString(), // Within last week
    updatedAt: new Date(now.getTime() - Math.random() * 3600000).toISOString(), // Within last hour
  };
};

// Generate mock trade data
const generateMockTrade = (
  id: string,
  orderId: string,
  portfolioId: string,
  symbol: string,
  side: Trade['side'],
  quantity: number,
  price: number
): Trade => {
  const now = new Date();
  const commission = price * quantity * 0.0005; // 0.05% commission
  const total = side === 'buy' ? price * quantity + commission : price * quantity - commission;
  
  return {
    id,
    orderId,
    portfolioId,
    symbol,
    side,
    quantity,
    price,
    timestamp: new Date(now.getTime() - Math.random() * 86400000 * 30).toISOString(), // Within last month
    commission,
    total,
  };
};

// Generate mock order book data
const generateMockOrderBook = (symbol: string): OrderBook => {
  const basePrice = Math.random() * 500 + 50;
  const bids = [];
  const asks = [];
  
  // Generate 10 bid levels
  for (let i = 0; i < 10; i++) {
    const price = basePrice - (i * 0.1) - (Math.random() * 0.05);
    const quantity = Math.floor(Math.random() * 1000) + 100;
    bids.push({ price, quantity });
  }
  
  // Generate 10 ask levels
  for (let i = 0; i < 10; i++) {
    const price = basePrice + (i * 0.1) + (Math.random() * 0.05);
    const quantity = Math.floor(Math.random() * 1000) + 100;
    asks.push({ price, quantity });
  }
  
  return {
    symbol,
    timestamp: Date.now(),
    bids,
    asks,
  };
};

// Async thunks
export const fetchOrders = createAsyncThunk(
  'trading/fetchOrders',
  async (portfolioId: string, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll generate mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const orders: Record<string, Order> = {};
      const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'];
      const types: Order['type'][] = ['market', 'limit', 'stop', 'stop_limit'];
      const sides: Order['side'][] = ['buy', 'sell'];
      
      // Generate 10 random orders
      for (let i = 0; i < 10; i++) {
        const id = `order-${Date.now()}-${i}`;
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        const type = types[Math.floor(Math.random() * types.length)];
        const side = sides[Math.floor(Math.random() * sides.length)];
        const quantity = Math.floor(Math.random() * 100) + 1;
        const price = type === 'market' ? undefined : Math.random() * 500 + 50;
        const stopPrice = (type === 'stop' || type === 'stop_limit') ? Math.random() * 500 + 50 : undefined;
        
        orders[id] = generateMockOrder(id, portfolioId, symbol, type, side, quantity, price, stopPrice);
      }
      
      return orders;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch orders');
    }
  }
);

export const fetchTrades = createAsyncThunk(
  'trading/fetchTrades',
  async (portfolioId: string, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll generate mock data
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const trades: Record<string, Trade> = {};
      const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'];
      const sides: Trade['side'][] = ['buy', 'sell'];
      
      // Generate 20 random trades
      for (let i = 0; i < 20; i++) {
        const id = `trade-${Date.now()}-${i}`;
        const orderId = `order-${Date.now()}-${Math.floor(Math.random() * 10)}`;
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        const side = sides[Math.floor(Math.random() * sides.length)];
        const quantity = Math.floor(Math.random() * 100) + 1;
        const price = Math.random() * 500 + 50;
        
        trades[id] = generateMockTrade(id, orderId, portfolioId, symbol, side, quantity, price);
      }
      
      return trades;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch trades');
    }
  }
);

export const fetchOrderBook = createAsyncThunk(
  'trading/fetchOrderBook',
  async (symbol: string, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll generate mock data
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const orderBook = generateMockOrderBook(symbol);
      
      return { symbol, orderBook };
    } catch (error: any) {
      return rejectWithValue(error.message || `Failed to fetch order book for ${symbol}`);
    }
  }
);

export const placeOrder = createAsyncThunk(
  'trading/placeOrder',
  async (orderData: {
    portfolioId: string;
    symbol: string;
    type: Order['type'];
    side: Order['side'];
    quantity: number;
    price?: number;
    stopPrice?: number;
    timeInForce: Order['timeInForce'];
    notes?: string;
  }, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll just return mock data
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const id = `order-${Date.now()}`;
      const now = new Date().toISOString();
      
      const order: Order = {
        id,
        portfolioId: orderData.portfolioId,
        symbol: orderData.symbol,
        type: orderData.type,
        side: orderData.side,
        quantity: orderData.quantity,
        price: orderData.price,
        stopPrice: orderData.stopPrice,
        status: 'pending',
        filledQuantity: 0,
        timeInForce: orderData.timeInForce,
        createdAt: now,
        updatedAt: now,
        notes: orderData.notes,
      };
      
      return order;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to place order');
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'trading/cancelOrder',
  async (orderId: string, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll just return the ID
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return orderId;
    } catch (error: any) {
      return rejectWithValue(error.message || `Failed to cancel order ${orderId}`);
    }
  }
);

export const addToWatchedSymbols = createAsyncThunk(
  'trading/addToWatchedSymbols',
  async (symbol: string, { getState, rejectWithValue }) => {
    try {
      // In a real app, this might be an API call to save user preferences
      // For demo purposes, we'll just return the symbol
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return symbol;
    } catch (error: any) {
      return rejectWithValue(error.message || `Failed to add ${symbol} to watched symbols`);
    }
  }
);

export const removeFromWatchedSymbols = createAsyncThunk(
  'trading/removeFromWatchedSymbols',
  async (symbol: string, { rejectWithValue }) => {
    try {
      // In a real app, this might be an API call to save user preferences
      // For demo purposes, we'll just return the symbol
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return symbol;
    } catch (error: any) {
      return rejectWithValue(error.message || `Failed to remove ${symbol} from watched symbols`);
    }
  }
);

// Slice
const tradingSlice = createSlice({
  name: 'trading',
  initialState,
  reducers: {
    updateTradingData: (state, action: PayloadAction<any>) => {
      // Handle real-time trading data updates from WebSocket
      const { type, data } = action.payload;
      
      switch (type) {
        case 'ORDER_UPDATE':
          if (data.id && state.orders[data.id]) {
            state.orders[data.id] = {
              ...state.orders[data.id],
              ...data,
              updatedAt: new Date().toISOString(),
            };
          }
          break;
          
        case 'NEW_TRADE':
          if (data.id) {
            state.trades[data.id] = data;
          }
          break;
          
        case 'ORDER_BOOK_UPDATE':
          if (data.symbol) {
            state.orderBooks[data.symbol] = {
              ...state.orderBooks[data.symbol],
              ...data,
              timestamp: Date.now(),
            };
          }
          break;
      }
      
      state.lastUpdated = Date.now();
    },
    
    clearTradingData: (state) => {
      state.orders = {};
      state.trades = {};
      state.orderBooks = {};
      state.lastUpdated = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch orders
    builder.addCase(fetchOrders.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchOrders.fulfilled, (state, action) => {
      state.loading = false;
      state.orders = action.payload;
      state.lastUpdated = Date.now();
    });
    builder.addCase(fetchOrders.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Fetch trades
    builder.addCase(fetchTrades.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchTrades.fulfilled, (state, action) => {
      state.loading = false;
      state.trades = action.payload;
      state.lastUpdated = Date.now();
    });
    builder.addCase(fetchTrades.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Fetch order book
    builder.addCase(fetchOrderBook.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchOrderBook.fulfilled, (state, action) => {
      state.loading = false;
      state.orderBooks[action.payload.symbol] = action.payload.orderBook;
      state.lastUpdated = Date.now();
    });
    builder.addCase(fetchOrderBook.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Place order
    builder.addCase(placeOrder.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(placeOrder.fulfilled, (state, action) => {
      state.loading = false;
      state.orders[action.payload.id] = action.payload;
      state.lastUpdated = Date.now();
    });
    builder.addCase(placeOrder.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Cancel order
    builder.addCase(cancelOrder.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(cancelOrder.fulfilled, (state, action) => {
      state.loading = false;
      
      const orderId = action.payload;
      
      if (state.orders[orderId]) {
        state.orders[orderId] = {
          ...state.orders[orderId],
          status: 'cancelled',
          updatedAt: new Date().toISOString(),
        };
      }
      
      state.lastUpdated = Date.now();
    });
    builder.addCase(cancelOrder.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Add to watched symbols
    builder.addCase(addToWatchedSymbols.fulfilled, (state, action) => {
      const symbol = action.payload;
      
      if (!state.watchedSymbols.includes(symbol)) {
        state.watchedSymbols.push(symbol);
      }
      
      state.lastUpdated = Date.now();
    });
    
    // Remove from watched symbols
    builder.addCase(removeFromWatchedSymbols.fulfilled, (state, action) => {
      const symbol = action.payload;
      
      state.watchedSymbols = state.watchedSymbols.filter(s => s !== symbol);
      state.lastUpdated = Date.now();
    });
  },
});

export const { updateTradingData, clearTradingData } = tradingSlice.actions;

export default tradingSlice.reducer;