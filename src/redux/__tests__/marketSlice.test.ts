import { configureStore } from '@reduxjs/toolkit';
import marketReducer, {
  fetchMarketData,
  fetchQuote,
  fetchHistoricalData,
  searchSymbols,
  MarketState
} from '../slices/marketSlice';

describe('Market Slice', () => {
  let store;
  
  beforeEach(() => {
    store = configureStore({
      reducer: {
        market: marketReducer
      }
    });
  });
  
  it('should handle initial state', () => {
    const state = store.getState().market;
    expect(state.quotes).toEqual({});
    expect(state.historicalData).toEqual({});
    expect(state.marketData).toEqual({});
    expect(state.searchResults).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
  
  it('should handle fetchQuote.pending', () => {
    store.dispatch({ type: fetchQuote.pending.type, meta: { arg: 'AAPL' } });
    const state = store.getState().market;
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });
  
  it('should handle fetchQuote.fulfilled', () => {
    const mockQuote = {
      symbol: 'AAPL',
      price: 150.25,
      change: 2.5,
      changePercent: 1.69,
      volume: 75000000
    };
    
    store.dispatch({
      type: fetchQuote.fulfilled.type,
      payload: mockQuote,
      meta: { arg: 'AAPL' }
    });
    
    const state = store.getState().market;
    expect(state.quotes['AAPL']).toEqual(mockQuote);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
  
  it('should handle fetchQuote.rejected', () => {
    const errorMessage = 'Failed to fetch quote';
    
    store.dispatch({
      type: fetchQuote.rejected.type,
      payload: errorMessage,
      meta: { arg: 'AAPL' }
    });
    
    const state = store.getState().market;
    expect(state.loading).toBe(false);
    expect(state.error).toBe(errorMessage);
  });
  
  it('should handle fetchHistoricalData.fulfilled', () => {
    const mockHistoricalData = [
      { date: '2023-01-01', open: 150, high: 155, low: 149, close: 153, volume: 75000000 },
      { date: '2023-01-02', open: 153, high: 158, low: 152, close: 157, volume: 80000000 }
    ];
    
    store.dispatch({
      type: fetchHistoricalData.fulfilled.type,
      payload: mockHistoricalData,
      meta: { arg: { symbol: 'AAPL', timeframe: '1D' } }
    });
    
    const state = store.getState().market;
    expect(state.historicalData['AAPL_1D']).toEqual(mockHistoricalData);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
  
  it('should handle searchSymbols.fulfilled', () => {
    const mockSearchResults = [
      { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ' }
    ];
    
    store.dispatch({
      type: searchSymbols.fulfilled.type,
      payload: mockSearchResults,
      meta: { arg: 'A' }
    });
    
    const state = store.getState().market;
    expect(state.searchResults).toEqual(mockSearchResults);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
  
  it('should handle fetchMarketData.fulfilled', () => {
    const mockMarketData = {
      indices: [
        { symbol: '^GSPC', name: 'S&P 500', price: 4500, change: 15, changePercent: 0.33 },
        { symbol: '^DJI', name: 'Dow Jones', price: 35000, change: 100, changePercent: 0.29 }
      ],
      sectors: [
        { name: 'Technology', performance: 1.2 },
        { name: 'Healthcare', performance: -0.5 }
      ],
      topGainers: [
        { symbol: 'XYZ', name: 'XYZ Corp', price: 25, change: 5, changePercent: 25 }
      ],
      topLosers: [
        { symbol: 'ABC', name: 'ABC Inc', price: 15, change: -5, changePercent: -25 }
      ]
    };
    
    store.dispatch({
      type: fetchMarketData.fulfilled.type,
      payload: mockMarketData
    });
    
    const state = store.getState().market;
    expect(state.marketData).toEqual(mockMarketData);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
});