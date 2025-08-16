import { configureStore } from '@reduxjs/toolkit';
import marketReducer, { 
  fetchQuote, 
  fetchHistoricalPrices, 
  searchSymbols,
  setSelectedSymbol,
  MarketState
} from '../marketSlice';

// Mock the market data service
jest.mock('../../../services/api/marketData/MarketDataServiceFactory', () => ({
  marketDataService: {
    getQuote: jest.fn(),
    getHistoricalPrices: jest.fn(),
    searchSymbols: jest.fn()
  }
}));

import { marketDataService } from '../../../services/api/marketData/MarketDataServiceFactory';

describe('Market Slice', () => {
  let store: any;
  
  beforeEach(() => {
    // Create a fresh store for each test
    store = configureStore({
      reducer: {
        market: marketReducer
      }
    });
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  describe('Initial State', () => {
    it('should have the correct initial state', () => {
      const state = store.getState().market;
      
      expect(state).toEqual({
        selectedSymbol: '',
        quote: null,
        historicalPrices: [],
        searchResults: [],
        watchlist: [],
        loading: {
          quote: false,
          historicalPrices: false,
          search: false
        },
        error: null
      });
    });
  });
  
  describe('Set Selected Symbol', () => {
    it('should update the selected symbol', () => {
      const symbol = 'AAPL';
      
      store.dispatch(setSelectedSymbol(symbol));
      
      const state = store.getState().market;
      
      expect(state.selectedSymbol).toBe(symbol);
    });
  });
  
  describe('Fetch Quote', () => {
    it('should handle fetchQuote.pending', () => {
      store.dispatch({ type: fetchQuote.pending.type });
      
      const state = store.getState().market;
      
      expect(state.loading.quote).toBe(true);
      expect(state.error).toBe(null);
    });
    
    it('should handle fetchQuote.fulfilled', () => {
      const quote = { 
        symbol: 'AAPL', 
        price: 150.0, 
        change: 2.5, 
        changePercent: 1.7,
        volume: 1000000,
        previousClose: 147.5,
        open: 148.0,
        high: 151.0,
        low: 147.0,
        timestamp: '2023-01-01T12:00:00Z'
      };
      
      store.dispatch({ 
        type: fetchQuote.fulfilled.type, 
        payload: quote 
      });
      
      const state = store.getState().market;
      
      expect(state.loading.quote).toBe(false);
      expect(state.quote).toEqual(quote);
      expect(state.error).toBe(null);
    });
    
    it('should handle fetchQuote.rejected', () => {
      const error = 'Failed to fetch quote';
      
      store.dispatch({ 
        type: fetchQuote.rejected.type, 
        error: { message: error } 
      });
      
      const state = store.getState().market;
      
      expect(state.loading.quote).toBe(false);
      expect(state.error).toBe(error);
    });
    
    it('should call marketDataService.getQuote with symbol', async () => {
      const symbol = 'AAPL';
      const quote = { 
        symbol: 'AAPL', 
        price: 150.0, 
        change: 2.5, 
        changePercent: 1.7,
        volume: 1000000,
        previousClose: 147.5,
        open: 148.0,
        high: 151.0,
        low: 147.0,
        timestamp: '2023-01-01T12:00:00Z'
      };
      
      (marketDataService.getQuote as jest.Mock).mockResolvedValue(quote);
      
      await store.dispatch(fetchQuote(symbol));
      
      expect(marketDataService.getQuote).toHaveBeenCalledWith(symbol);
      
      const state = store.getState().market;
      
      expect(state.quote).toEqual(quote);
    });
  });
  
  describe('Fetch Historical Prices', () => {
    it('should handle fetchHistoricalPrices.pending', () => {
      store.dispatch({ type: fetchHistoricalPrices.pending.type });
      
      const state = store.getState().market;
      
      expect(state.loading.historicalPrices).toBe(true);
      expect(state.error).toBe(null);
    });
    
    it('should handle fetchHistoricalPrices.fulfilled', () => {
      const prices = [
        { date: '2023-01-01', open: 148.0, high: 151.0, low: 147.0, close: 150.0, volume: 1000000 },
        { date: '2023-01-02', open: 150.0, high: 153.0, low: 149.0, close: 152.0, volume: 1100000 }
      ];
      
      store.dispatch({ 
        type: fetchHistoricalPrices.fulfilled.type, 
        payload: prices 
      });
      
      const state = store.getState().market;
      
      expect(state.loading.historicalPrices).toBe(false);
      expect(state.historicalPrices).toEqual(prices);
      expect(state.error).toBe(null);
    });
    
    it('should handle fetchHistoricalPrices.rejected', () => {
      const error = 'Failed to fetch historical prices';
      
      store.dispatch({ 
        type: fetchHistoricalPrices.rejected.type, 
        error: { message: error } 
      });
      
      const state = store.getState().market;
      
      expect(state.loading.historicalPrices).toBe(false);
      expect(state.error).toBe(error);
    });
    
    it('should call marketDataService.getHistoricalPrices with symbol and range', async () => {
      const symbol = 'AAPL';
      const range = '1m';
      const prices = [
        { date: '2023-01-01', open: 148.0, high: 151.0, low: 147.0, close: 150.0, volume: 1000000 },
        { date: '2023-01-02', open: 150.0, high: 153.0, low: 149.0, close: 152.0, volume: 1100000 }
      ];
      
      (marketDataService.getHistoricalPrices as jest.Mock).mockResolvedValue(prices);
      
      await store.dispatch(fetchHistoricalPrices({ symbol, range }));
      
      expect(marketDataService.getHistoricalPrices).toHaveBeenCalledWith(symbol, range);
      
      const state = store.getState().market;
      
      expect(state.historicalPrices).toEqual(prices);
    });
  });
  
  describe('Search Symbols', () => {
    it('should handle searchSymbols.pending', () => {
      store.dispatch({ type: searchSymbols.pending.type });
      
      const state = store.getState().market;
      
      expect(state.loading.search).toBe(true);
      expect(state.error).toBe(null);
    });
    
    it('should handle searchSymbols.fulfilled', () => {
      const results = [
        { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', exchange: 'NASDAQ' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock', exchange: 'NASDAQ' }
      ];
      
      store.dispatch({ 
        type: searchSymbols.fulfilled.type, 
        payload: results 
      });
      
      const state = store.getState().market;
      
      expect(state.loading.search).toBe(false);
      expect(state.searchResults).toEqual(results);
      expect(state.error).toBe(null);
    });
    
    it('should handle searchSymbols.rejected', () => {
      const error = 'Failed to search symbols';
      
      store.dispatch({ 
        type: searchSymbols.rejected.type, 
        error: { message: error } 
      });
      
      const state = store.getState().market;
      
      expect(state.loading.search).toBe(false);
      expect(state.error).toBe(error);
    });
    
    it('should call marketDataService.searchSymbols with query', async () => {
      const query = 'apple';
      const results = [
        { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', exchange: 'NASDAQ' }
      ];
      
      (marketDataService.searchSymbols as jest.Mock).mockResolvedValue(results);
      
      await store.dispatch(searchSymbols(query));
      
      expect(marketDataService.searchSymbols).toHaveBeenCalledWith(query);
      
      const state = store.getState().market;
      
      expect(state.searchResults).toEqual(results);
    });
  });
});