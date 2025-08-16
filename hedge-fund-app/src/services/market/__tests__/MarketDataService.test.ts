import marketDataService from '../MarketDataService';
import unifiedDataProvider from '../../api/providers/UnifiedDataProvider';
import { store } from '../../../store';
import { updateMarketData } from '../../../store/slices/marketSlice';

// Mock the unified data provider
jest.mock('../../api/providers/UnifiedDataProvider', () => ({
  __esModule: true,
  default: {
    getQuote: jest.fn(),
    getQuotes: jest.fn(),
    getBars: jest.fn(),
    getCompanyInfo: jest.fn(),
    getNews: jest.fn(),
    getFinancials: jest.fn(),
    getMarketStatus: jest.fn(),
    connectWebSocket: jest.fn().mockResolvedValue(undefined),
    disconnectWebSocket: jest.fn(),
    addSymbolToWatchList: jest.fn(),
    removeSymbolFromWatchList: jest.fn(),
    addToPrefetchQueue: jest.fn()
  }
}));

// Mock the store
jest.mock('../../../store', () => ({
  store: {
    dispatch: jest.fn(),
    getState: jest.fn().mockReturnValue({
      trading: {
        watchedSymbols: ['AAPL', 'MSFT', 'GOOGL']
      }
    })
  }
}));

// Mock the market slice actions
jest.mock('../../../store/slices/marketSlice', () => ({
  updateMarketData: jest.fn().mockReturnValue({ type: 'market/updateMarketData' })
}));

describe('MarketDataService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize the market data service', async () => {
      const mockMarketStatus = {
        isOpen: true,
        nextOpen: '2023-01-02T09:30:00Z',
        nextClose: '2023-01-02T16:00:00Z'
      };
      
      (unifiedDataProvider.getMarketStatus as jest.Mock).mockResolvedValue(mockMarketStatus);
      
      await marketDataService.initialize();
      
      expect(unifiedDataProvider.getMarketStatus).toHaveBeenCalled();
      expect(unifiedDataProvider.connectWebSocket).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      (unifiedDataProvider.getMarketStatus as jest.Mock).mockRejectedValue(new Error('API error'));
      
      await marketDataService.initialize();
      
      expect(unifiedDataProvider.getMarketStatus).toHaveBeenCalled();
      expect(store.dispatch).toHaveBeenCalled();
    });
  });

  describe('connectRealTimeData', () => {
    it('should connect to real-time data stream', async () => {
      await marketDataService.connectRealTimeData();
      
      expect(unifiedDataProvider.connectWebSocket).toHaveBeenCalled();
    });

    it('should handle connection errors', async () => {
      (unifiedDataProvider.connectWebSocket as jest.Mock).mockRejectedValue(new Error('WebSocket error'));
      
      await marketDataService.connectRealTimeData();
      
      expect(unifiedDataProvider.connectWebSocket).toHaveBeenCalled();
      // Should attempt to reconnect, but we can't easily test that without mocking timers
    });
  });

  describe('disconnectRealTimeData', () => {
    it('should disconnect from real-time data stream', () => {
      // Set the isWebSocketConnected flag to true
      (marketDataService as any).isWebSocketConnected = true;
      
      marketDataService.disconnectRealTimeData();
      
      expect(unifiedDataProvider.disconnectWebSocket).toHaveBeenCalled();
      expect((marketDataService as any).isWebSocketConnected).toBe(false);
    });

    it('should do nothing if not connected', () => {
      // Set the isWebSocketConnected flag to false
      (marketDataService as any).isWebSocketConnected = false;
      
      marketDataService.disconnectRealTimeData();
      
      expect(unifiedDataProvider.disconnectWebSocket).not.toHaveBeenCalled();
    });
  });

  describe('addSymbolToWatchList', () => {
    it('should add a symbol to the watch list', async () => {
      // Set the watchedSymbols set
      (marketDataService as any).watchedSymbols = new Set(['AAPL', 'MSFT']);
      (marketDataService as any).isWebSocketConnected = true;
      
      await marketDataService.addSymbolToWatchList('GOOGL');
      
      expect((marketDataService as any).watchedSymbols.has('GOOGL')).toBe(true);
      expect(unifiedDataProvider.connectWebSocket).toHaveBeenCalled();
      expect(unifiedDataProvider.addToPrefetchQueue).toHaveBeenCalled();
    });

    it('should not add a symbol that is already in the watch list', async () => {
      // Set the watchedSymbols set
      (marketDataService as any).watchedSymbols = new Set(['AAPL', 'MSFT']);
      (marketDataService as any).isWebSocketConnected = true;
      
      await marketDataService.addSymbolToWatchList('AAPL');
      
      expect(unifiedDataProvider.connectWebSocket).not.toHaveBeenCalled();
    });

    it('should connect to WebSocket if this is the first symbol', async () => {
      // Set the watchedSymbols set to empty
      (marketDataService as any).watchedSymbols = new Set();
      (marketDataService as any).isWebSocketConnected = false;
      
      await marketDataService.addSymbolToWatchList('AAPL');
      
      expect((marketDataService as any).watchedSymbols.has('AAPL')).toBe(true);
      expect(unifiedDataProvider.connectWebSocket).toHaveBeenCalled();
    });
  });

  describe('removeSymbolFromWatchList', () => {
    it('should remove a symbol from the watch list', () => {
      // Set the watchedSymbols set
      (marketDataService as any).watchedSymbols = new Set(['AAPL', 'MSFT', 'GOOGL']);
      (marketDataService as any).isWebSocketConnected = true;
      
      marketDataService.removeSymbolFromWatchList('AAPL');
      
      expect((marketDataService as any).watchedSymbols.has('AAPL')).toBe(false);
      expect(unifiedDataProvider.disconnectWebSocket).toHaveBeenCalled();
    });

    it('should do nothing if the symbol is not in the watch list', () => {
      // Set the watchedSymbols set
      (marketDataService as any).watchedSymbols = new Set(['MSFT', 'GOOGL']);
      (marketDataService as any).isWebSocketConnected = true;
      
      marketDataService.removeSymbolFromWatchList('AAPL');
      
      expect(unifiedDataProvider.disconnectWebSocket).not.toHaveBeenCalled();
    });
  });

  describe('WebSocket handlers', () => {
    it('should handle trade updates', () => {
      const mockTradeData = {
        symbol: 'AAPL',
        price: 150.25,
        size: 100,
        timestamp: Date.now()
      };
      
      // Call the private method directly
      (marketDataService as any).handleTradeUpdate(mockTradeData);
      
      expect(store.dispatch).toHaveBeenCalledWith(updateMarketData({
        type: 'TRADE_UPDATE',
        data: mockTradeData
      }));
    });

    it('should handle quote updates', () => {
      const mockQuoteData = {
        symbol: 'AAPL',
        price: 150.25,
        change: 2.5,
        changePercent: 0.0167,
        volume: 1000000
      };
      
      // Call the private method directly
      (marketDataService as any).handleQuoteUpdate(mockQuoteData);
      
      expect(store.dispatch).toHaveBeenCalledWith(updateMarketData({
        type: 'QUOTE_UPDATE',
        data: mockQuoteData
      }));
    });

    it('should handle bar updates', () => {
      const mockBarData = {
        symbol: 'AAPL',
        open: 150.0,
        high: 151.0,
        low: 149.0,
        close: 150.5,
        volume: 1000000,
        timestamp: Date.now()
      };
      
      // Call the private method directly
      (marketDataService as any).handleBarUpdate(mockBarData);
      
      expect(store.dispatch).toHaveBeenCalledWith(updateMarketData({
        type: 'BAR_UPDATE',
        data: mockBarData
      }));
    });
  });

  describe('Data retrieval methods', () => {
    it('should get quote data', async () => {
      const mockQuote = {
        symbol: 'AAPL',
        price: 150.25,
        change: 2.5,
        changePercent: 0.0167,
        volume: 1000000
      };
      
      (unifiedDataProvider.getQuote as jest.Mock).mockResolvedValue(mockQuote);
      
      const result = await marketDataService.getQuote('AAPL');
      
      expect(unifiedDataProvider.getQuote).toHaveBeenCalledWith('AAPL');
      expect(result).toEqual(mockQuote);
    });

    it('should get quotes data', async () => {
      const mockQuotes = {
        AAPL: {
          symbol: 'AAPL',
          price: 150.25,
          change: 2.5,
          changePercent: 0.0167,
          volume: 1000000
        },
        MSFT: {
          symbol: 'MSFT',
          price: 250.75,
          change: -1.25,
          changePercent: -0.005,
          volume: 800000
        }
      };
      
      (unifiedDataProvider.getQuotes as jest.Mock).mockResolvedValue(mockQuotes);
      
      const result = await marketDataService.getQuotes(['AAPL', 'MSFT']);
      
      expect(unifiedDataProvider.getQuotes).toHaveBeenCalledWith(['AAPL', 'MSFT']);
      expect(result).toEqual(mockQuotes);
    });

    it('should get bars data', async () => {
      const mockBars = [
        { open: 150.0, high: 151.0, low: 149.0, close: 150.5, volume: 1000000, timestamp: Date.now() },
        { open: 150.5, high: 152.0, low: 150.0, close: 151.5, volume: 1200000, timestamp: Date.now() }
      ];
      
      (unifiedDataProvider.getBars as jest.Mock).mockResolvedValue(mockBars);
      
      const result = await marketDataService.getBars('AAPL', '1d', 30);
      
      expect(unifiedDataProvider.getBars).toHaveBeenCalled();
      expect(result).toEqual(mockBars);
    });

    it('should get company info', async () => {
      const mockCompanyInfo = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
        exchange: 'NASDAQ',
        industry: 'Technology',
        website: 'https://www.apple.com'
      };
      
      (unifiedDataProvider.getCompanyInfo as jest.Mock).mockResolvedValue(mockCompanyInfo);
      
      const result = await marketDataService.getCompanyInfo('AAPL');
      
      expect(unifiedDataProvider.getCompanyInfo).toHaveBeenCalledWith('AAPL');
      expect(result).toEqual(mockCompanyInfo);
    });

    it('should get news', async () => {
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
      
      (unifiedDataProvider.getNews as jest.Mock).mockResolvedValue(mockNews);
      
      const result = await marketDataService.getNews('AAPL', 5);
      
      expect(unifiedDataProvider.getNews).toHaveBeenCalledWith('AAPL', 5);
      expect(result).toEqual(mockNews);
    });

    it('should get financials', async () => {
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
      
      (unifiedDataProvider.getFinancials as jest.Mock).mockResolvedValue(mockFinancials);
      
      const result = await marketDataService.getFinancials('AAPL', 'income', 'quarter', 4);
      
      expect(unifiedDataProvider.getFinancials).toHaveBeenCalledWith('AAPL', 'income', 'quarter', 4);
      expect(result).toEqual(mockFinancials);
    });

    it('should get market status', async () => {
      const mockMarketStatus = {
        isOpen: true,
        nextOpen: '2023-01-02T09:30:00Z',
        nextClose: '2023-01-02T16:00:00Z'
      };
      
      (unifiedDataProvider.getMarketStatus as jest.Mock).mockResolvedValue(mockMarketStatus);
      
      const result = await marketDataService.getMarketStatus();
      
      expect(unifiedDataProvider.getMarketStatus).toHaveBeenCalled();
      expect(result).toEqual(mockMarketStatus);
    });
  });
});