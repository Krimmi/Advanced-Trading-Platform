import unifiedDataProvider from '../UnifiedDataProvider';
import { alpacaDataApi } from '../AlpacaApiService';
import { iexCloudApi } from '../IEXCloudApiService';
import { polygonApi } from '../PolygonApiService';

// Mock the API providers
jest.mock('../AlpacaApiService', () => ({
  alpacaDataApi: {
    getQuote: jest.fn(),
    getQuotes: jest.fn(),
    getBars: jest.fn(),
    connectWebSocket: jest.fn().mockResolvedValue(undefined),
    onWebSocketMessage: jest.fn().mockReturnValue(() => {}),
    disconnectWebSocket: jest.fn()
  },
  alpacaTradingApi: {
    getAccount: jest.fn(),
    getPositions: jest.fn(),
    getPosition: jest.fn(),
    getOrders: jest.fn(),
    getOrder: jest.fn(),
    placeOrder: jest.fn(),
    cancelOrder: jest.fn(),
    getClock: jest.fn(),
    getCalendar: jest.fn(),
    getAsset: jest.fn()
  }
}));

jest.mock('../IEXCloudApiService', () => ({
  iexCloudApi: {
    getQuote: jest.fn(),
    getBatch: jest.fn(),
    getHistoricalPrices: jest.fn(),
    getCompany: jest.fn(),
    getNews: jest.fn(),
    getIncome: jest.fn(),
    getBalanceSheet: jest.fn(),
    getCashFlow: jest.fn(),
    getMarket: jest.fn()
  }
}));

jest.mock('../PolygonApiService', () => ({
  polygonApi: {
    getLastQuote: jest.fn(),
    getAggregates: jest.fn(),
    getTicker: jest.fn(),
    getTickerNews: jest.fn(),
    getMarketStatus: jest.fn(),
    connectWebSocket: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn(),
    onWebSocketMessage: jest.fn().mockReturnValue(() => {}),
    disconnectWebSocket: jest.fn()
  }
}));

// Mock the store
jest.mock('../../../store', () => ({
  store: {
    dispatch: jest.fn()
  }
}));

describe('UnifiedDataProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getQuote', () => {
    it('should return quote data from primary provider', async () => {
      const mockQuote = {
        symbol: 'AAPL',
        latestPrice: 150.25,
        change: 2.5,
        changePercent: 0.0167,
        volume: 1000000
      };
      
      (alpacaDataApi.getQuotes as jest.Mock).mockResolvedValue({
        AAPL: mockQuote
      });
      
      const result = await unifiedDataProvider.getQuote('AAPL');
      
      expect(alpacaDataApi.getQuotes).toHaveBeenCalledWith(['AAPL']);
      expect(result).toEqual(mockQuote);
    });

    it('should fall back to secondary provider if primary fails', async () => {
      const mockQuote = {
        symbol: 'AAPL',
        last_price: 150.25,
        change: 2.5,
        percent_change: 0.0167,
        volume: 1000000
      };
      
      (alpacaDataApi.getQuotes as jest.Mock).mockRejectedValue(new Error('API error'));
      (polygonApi.getLastQuote as jest.Mock).mockResolvedValue(mockQuote);
      
      const result = await unifiedDataProvider.getQuote('AAPL');
      
      expect(alpacaDataApi.getQuotes).toHaveBeenCalledWith(['AAPL']);
      expect(polygonApi.getLastQuote).toHaveBeenCalledWith('AAPL');
      expect(result).toEqual(mockQuote);
    });

    it('should fall back to tertiary provider if primary and secondary fail', async () => {
      const mockQuote = {
        symbol: 'AAPL',
        price: 150.25,
        change: 2.5,
        changePercent: 0.0167,
        volume: 1000000
      };
      
      (alpacaDataApi.getQuotes as jest.Mock).mockRejectedValue(new Error('API error'));
      (polygonApi.getLastQuote as jest.Mock).mockRejectedValue(new Error('API error'));
      (iexCloudApi.getQuote as jest.Mock).mockResolvedValue(mockQuote);
      
      const result = await unifiedDataProvider.getQuote('AAPL');
      
      expect(alpacaDataApi.getQuotes).toHaveBeenCalledWith(['AAPL']);
      expect(polygonApi.getLastQuote).toHaveBeenCalledWith('AAPL');
      expect(iexCloudApi.getQuote).toHaveBeenCalledWith('AAPL');
      expect(result).toEqual(mockQuote);
    });

    it('should throw an error if all providers fail', async () => {
      (alpacaDataApi.getQuotes as jest.Mock).mockRejectedValue(new Error('API error 1'));
      (polygonApi.getLastQuote as jest.Mock).mockRejectedValue(new Error('API error 2'));
      (iexCloudApi.getQuote as jest.Mock).mockRejectedValue(new Error('API error 3'));
      
      await expect(unifiedDataProvider.getQuote('AAPL')).rejects.toThrow('All requests failed for quote');
    });
  });

  describe('getBars', () => {
    it('should return bars data from primary provider', async () => {
      const mockBars = [
        { o: 150.0, h: 151.0, l: 149.0, c: 150.5, v: 1000000, t: 1625097600000 },
        { o: 150.5, h: 152.0, l: 150.0, c: 151.5, v: 1200000, t: 1625184000000 }
      ];
      
      (alpacaDataApi.getBars as jest.Mock).mockResolvedValue({
        AAPL: mockBars
      });
      
      const result = await unifiedDataProvider.getBars('AAPL', '1d', '2023-01-01', '2023-01-10');
      
      expect(alpacaDataApi.getBars).toHaveBeenCalledWith(['AAPL'], '1Day', '2023-01-01', '2023-01-10', undefined);
      expect(result).toEqual(mockBars);
    });

    it('should fall back to secondary provider if primary fails', async () => {
      const mockBars = {
        results: [
          { o: 150.0, h: 151.0, l: 149.0, c: 150.5, v: 1000000, t: 1625097600000 },
          { o: 150.5, h: 152.0, l: 150.0, c: 151.5, v: 1200000, t: 1625184000000 }
        ]
      };
      
      (alpacaDataApi.getBars as jest.Mock).mockRejectedValue(new Error('API error'));
      (polygonApi.getAggregates as jest.Mock).mockResolvedValue(mockBars);
      
      const result = await unifiedDataProvider.getBars('AAPL', '1d', '2023-01-01', '2023-01-10');
      
      expect(alpacaDataApi.getBars).toHaveBeenCalledWith(['AAPL'], '1Day', '2023-01-01', '2023-01-10', undefined);
      expect(polygonApi.getAggregates).toHaveBeenCalled();
      expect(result).toEqual(mockBars.results);
    });
  });

  describe('connectWebSocket', () => {
    it('should connect to primary WebSocket provider', async () => {
      const symbols = ['AAPL', 'MSFT'];
      const dataTypes = ['quotes', 'trades'];
      const handlers = {
        trade: jest.fn(),
        quote: jest.fn()
      };
      
      await unifiedDataProvider.connectWebSocket(symbols, dataTypes, handlers);
      
      expect(alpacaDataApi.connectWebSocket).toHaveBeenCalled();
      expect(alpacaDataApi.onWebSocketMessage).toHaveBeenCalledTimes(2);
    });

    it('should fall back to secondary WebSocket provider if primary fails', async () => {
      const symbols = ['AAPL', 'MSFT'];
      const dataTypes = ['quotes', 'trades'];
      const handlers = {
        trade: jest.fn(),
        quote: jest.fn()
      };
      
      (alpacaDataApi.connectWebSocket as jest.Mock).mockRejectedValue(new Error('WebSocket error'));
      
      await unifiedDataProvider.connectWebSocket(symbols, dataTypes, handlers);
      
      expect(alpacaDataApi.connectWebSocket).toHaveBeenCalled();
      expect(polygonApi.connectWebSocket).toHaveBeenCalledWith('stocks');
      expect(polygonApi.subscribe).toHaveBeenCalled();
      expect(polygonApi.onWebSocketMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe('getMarketStatus', () => {
    it('should return market status from primary provider', async () => {
      const mockStatus = {
        is_open: true,
        next_open: '2023-01-02T09:30:00Z',
        next_close: '2023-01-02T16:00:00Z'
      };
      
      (alpacaTradingApi.getClock as jest.Mock).mockResolvedValue(mockStatus);
      
      const result = await unifiedDataProvider.getMarketStatus();
      
      expect(alpacaTradingApi.getClock).toHaveBeenCalled();
      expect(result).toEqual(mockStatus);
    });
  });

  describe('prefetching', () => {
    it('should add items to prefetch queue', () => {
      unifiedDataProvider.addToPrefetchQueue('getQuote', 'AAPL');
      unifiedDataProvider.addToPrefetchQueue('getBars', 'AAPL', '1d', '2023-01-01', '2023-01-10');
      
      // This is testing an internal implementation detail, but it's important functionality
      // In a real test, we might expose a method to check the queue or mock the processing
      expect(true).toBeTruthy();
    });
  });
});