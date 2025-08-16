import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import useMarketData from '../useMarketData';
import marketDataService from '../../services/market/MarketDataService';
import marketReducer from '../../store/slices/marketSlice';
import tradingReducer, { addToWatchedSymbols, removeFromWatchedSymbols } from '../../store/slices/tradingSlice';

// Mock the market data service
jest.mock('../../services/market/MarketDataService', () => ({
  __esModule: true,
  default: {
    getQuote: jest.fn(),
    getQuotes: jest.fn(),
    getBars: jest.fn(),
    getCompanyInfo: jest.fn(),
    getNews: jest.fn(),
    getFinancials: jest.fn(),
    getMarketStatus: jest.fn(),
    addSymbolToWatchList: jest.fn(),
    removeSymbolFromWatchList: jest.fn()
  }
}));

// Mock the Redux actions
jest.mock('../../store/slices/tradingSlice', () => ({
  addToWatchedSymbols: jest.fn().mockReturnValue({ type: 'trading/addToWatchedSymbols' }),
  removeFromWatchedSymbols: jest.fn().mockReturnValue({ type: 'trading/removeFromWatchedSymbols' })
}));

// Create a test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      market: marketReducer,
      trading: tradingReducer
    },
    preloadedState: initialState
  });
};

// Create a wrapper component with Redux provider
const createWrapper = (store: any) => {
  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
};

describe('useMarketData', () => {
  let store: any;
  let wrapper: any;

  beforeEach(() => {
    // Create a fresh store for each test
    store = createTestStore({
      trading: {
        watchedSymbols: ['AAPL', 'MSFT', 'GOOGL'],
        orders: {},
        trades: {},
        orderBooks: {},
        loading: false,
        error: null,
        lastUpdated: null
      },
      market: {
        marketSummary: null,
        quotes: {},
        trades: {},
        bars: {},
        watchlists: {
          default: {
            id: 'default',
            name: 'Default Watchlist',
            symbols: ['AAPL', 'MSFT', 'GOOGL']
          }
        },
        marketStatus: null,
        loading: false,
        error: null,
        lastUpdated: null
      }
    });
    wrapper = createWrapper(store);
    jest.clearAllMocks();
  });

  it('should return the initial state', () => {
    const { result } = renderHook(() => useMarketData(), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.watchedSymbols).toEqual(['AAPL', 'MSFT', 'GOOGL']);
    expect(result.current.marketData).toBeDefined();
  });

  describe('addSymbolToWatchList', () => {
    it('should add a symbol to the watch list', async () => {
      (marketDataService.addSymbolToWatchList as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useMarketData(), { wrapper });

      let success;
      await act(async () => {
        success = await result.current.addSymbolToWatchList('NFLX');
      });

      expect(marketDataService.addSymbolToWatchList).toHaveBeenCalledWith('NFLX');
      expect(addToWatchedSymbols).toHaveBeenCalledWith('NFLX');
      expect(success).toBe(true);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle errors when adding a symbol', async () => {
      const error = new Error('Failed to add symbol');
      (marketDataService.addSymbolToWatchList as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useMarketData(), { wrapper });

      let success;
      await act(async () => {
        success = await result.current.addSymbolToWatchList('NFLX');
      });

      expect(marketDataService.addSymbolToWatchList).toHaveBeenCalledWith('NFLX');
      expect(success).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(error.message);
    });
  });

  describe('removeSymbolFromWatchList', () => {
    it('should remove a symbol from the watch list', () => {
      const { result } = renderHook(() => useMarketData(), { wrapper });

      let success;
      act(() => {
        success = result.current.removeSymbolFromWatchList('AAPL');
      });

      expect(marketDataService.removeSymbolFromWatchList).toHaveBeenCalledWith('AAPL');
      expect(removeFromWatchedSymbols).toHaveBeenCalledWith('AAPL');
      expect(success).toBe(true);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle errors when removing a symbol', () => {
      (marketDataService.removeSymbolFromWatchList as jest.Mock).mockImplementation(() => {
        throw new Error('Failed to remove symbol');
      });

      const { result } = renderHook(() => useMarketData(), { wrapper });

      let success;
      act(() => {
        success = result.current.removeSymbolFromWatchList('AAPL');
      });

      expect(marketDataService.removeSymbolFromWatchList).toHaveBeenCalledWith('AAPL');
      expect(success).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to remove symbol');
    });
  });

  describe('getQuote', () => {
    it('should get a quote for a symbol', async () => {
      const mockQuote = {
        symbol: 'AAPL',
        price: 150.25,
        change: 2.5,
        changePercent: 0.0167,
        volume: 1000000
      };
      (marketDataService.getQuote as jest.Mock).mockResolvedValue(mockQuote);

      const { result } = renderHook(() => useMarketData(), { wrapper });

      let quote;
      await act(async () => {
        quote = await result.current.getQuote('AAPL');
      });

      expect(marketDataService.getQuote).toHaveBeenCalledWith('AAPL');
      expect(quote).toEqual(mockQuote);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle errors when getting a quote', async () => {
      const error = new Error('Failed to get quote');
      (marketDataService.getQuote as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useMarketData(), { wrapper });

      await act(async () => {
        try {
          await result.current.getQuote('AAPL');
          fail('Should have thrown an error');
        } catch (e) {
          expect(e).toBe(error);
        }
      });

      expect(marketDataService.getQuote).toHaveBeenCalledWith('AAPL');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(error.message);
    });
  });

  describe('getBars', () => {
    it('should get bars for a symbol', async () => {
      const mockBars = [
        { open: 150.0, high: 151.0, low: 149.0, close: 150.5, volume: 1000000, timestamp: Date.now() },
        { open: 150.5, high: 152.0, low: 150.0, close: 151.5, volume: 1200000, timestamp: Date.now() }
      ];
      (marketDataService.getBars as jest.Mock).mockResolvedValue(mockBars);

      const { result } = renderHook(() => useMarketData(), { wrapper });

      let bars;
      await act(async () => {
        bars = await result.current.getBars('AAPL', '1d', 30);
      });

      expect(marketDataService.getBars).toHaveBeenCalledWith('AAPL', '1d', 30);
      expect(bars).toEqual(mockBars);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('getCompanyInfo', () => {
    it('should get company info for a symbol', async () => {
      const mockCompanyInfo = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
        exchange: 'NASDAQ',
        industry: 'Technology',
        website: 'https://www.apple.com'
      };
      (marketDataService.getCompanyInfo as jest.Mock).mockResolvedValue(mockCompanyInfo);

      const { result } = renderHook(() => useMarketData(), { wrapper });

      let companyInfo;
      await act(async () => {
        companyInfo = await result.current.getCompanyInfo('AAPL');
      });

      expect(marketDataService.getCompanyInfo).toHaveBeenCalledWith('AAPL');
      expect(companyInfo).toEqual(mockCompanyInfo);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('getNews', () => {
    it('should get news for a symbol', async () => {
      const mockNews = [
        {
          headline: 'Apple Announces New iPhone',
          summary: 'Apple Inc. announced the latest iPhone model today.',
          url: 'https://example.com/news/1',
          source: 'Example News',
          datetime: Date.now()
        },
        {
          headline: 'Apple Reports Strong Earnings',
          summary: 'Apple Inc. reported better-than-expected earnings for Q2.',
          url: 'https://example.com/news/2',
          source: 'Example News',
          datetime: Date.now()
        }
      ];
      (marketDataService.getNews as jest.Mock).mockResolvedValue(mockNews);

      const { result } = renderHook(() => useMarketData(), { wrapper });

      let news;
      await act(async () => {
        news = await result.current.getNews('AAPL', 5);
      });

      expect(marketDataService.getNews).toHaveBeenCalledWith('AAPL', 5);
      expect(news).toEqual(mockNews);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('getFinancials', () => {
    it('should get financials for a symbol', async () => {
      const mockFinancials = {
        symbol: 'AAPL',
        income: [
          {
            reportDate: '2023-03-31',
            totalRevenue: 94800000000,
            costOfRevenue: 52000000000,
            grossProfit: 42800000000,
            operatingIncome: 28000000000,
            netIncome: 24000000000
          }
        ]
      };
      (marketDataService.getFinancials as jest.Mock).mockResolvedValue(mockFinancials);

      const { result } = renderHook(() => useMarketData(), { wrapper });

      let financials;
      await act(async () => {
        financials = await result.current.getFinancials('AAPL', 'income', 'quarter', 4);
      });

      expect(marketDataService.getFinancials).toHaveBeenCalledWith('AAPL', 'income', 'quarter', 4);
      expect(financials).toEqual(mockFinancials);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('getMarketStatus', () => {
    it('should get market status', async () => {
      const mockMarketStatus = {
        isOpen: true,
        nextOpen: '2023-01-02T09:30:00Z',
        nextClose: '2023-01-02T16:00:00Z'
      };
      (marketDataService.getMarketStatus as jest.Mock).mockResolvedValue(mockMarketStatus);

      const { result } = renderHook(() => useMarketData(), { wrapper });

      let status;
      await act(async () => {
        status = await result.current.getMarketStatus();
      });

      expect(marketDataService.getMarketStatus).toHaveBeenCalled();
      expect(status).toEqual(mockMarketStatus);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });
});