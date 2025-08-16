import { marketDataService } from '../MarketDataServiceFactory';
import { alphaVantageService } from '../AlphaVantageService';
import { polygonService } from '../PolygonService';
import { iexCloudService } from '../IEXCloudService';
import { API_KEYS, DATA_SOURCE_CONFIG, updateApiKeys } from '../../../../config/apiConfig';

// Mock the API services
jest.mock('../AlphaVantageService', () => ({
  alphaVantageService: {
    isAvailable: jest.fn(),
    getQuote: jest.fn(),
    getTimeSeries: jest.fn(),
    searchStocks: jest.fn()
  }
}));

jest.mock('../PolygonService', () => ({
  polygonService: {
    isAvailable: jest.fn(),
    getLatestQuote: jest.fn(),
    getPreviousClose: jest.fn(),
    getAggregatedBars: jest.fn(),
    searchTickers: jest.fn()
  }
}));

jest.mock('../IEXCloudService', () => ({
  iexCloudService: {
    isAvailable: jest.fn(),
    getQuote: jest.fn(),
    getHistoricalPrices: jest.fn(),
    searchSymbols: jest.fn(),
    getMarketGainers: jest.fn(),
    getMarketLosers: jest.fn(),
    getMostActive: jest.fn()
  }
}));

// Mock the config
jest.mock('../../../../config/apiConfig', () => ({
  API_KEYS: {
    alphaVantage: '',
    polygon: '',
    iexCloud: ''
  },
  DATA_SOURCE_CONFIG: {
    forceMockData: false,
    cacheTTL: {
      marketData: 60000
    }
  },
  updateApiKeys: jest.fn()
}));

describe('MarketDataServiceFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default to no services available
    (alphaVantageService.isAvailable as jest.Mock).mockReturnValue(false);
    (polygonService.isAvailable as jest.Mock).mockReturnValue(false);
    (iexCloudService.isAvailable as jest.Mock).mockReturnValue(false);
  });

  describe('getService', () => {
    it('should return the requested service if available', () => {
      (alphaVantageService.isAvailable as jest.Mock).mockReturnValue(true);
      
      const service = marketDataService.getService('alphaVantage');
      expect(service).toBe(alphaVantageService);
    });

    it('should return the best available service if requested service is not available', () => {
      (polygonService.isAvailable as jest.Mock).mockReturnValue(true);
      
      const service = marketDataService.getService('alphaVantage');
      expect(service).toBe(polygonService);
    });

    it('should return services in order of preference when auto is selected', () => {
      // Only IEX Cloud is available
      (iexCloudService.isAvailable as jest.Mock).mockReturnValue(true);
      
      let service = marketDataService.getService('auto');
      expect(service).toBe(iexCloudService);
      
      // Polygon and IEX Cloud are available
      (polygonService.isAvailable as jest.Mock).mockReturnValue(true);
      
      service = marketDataService.getService('auto');
      expect(service).toBe(polygonService);
      
      // All services are available
      (alphaVantageService.isAvailable as jest.Mock).mockReturnValue(true);
      
      service = marketDataService.getService('auto');
      expect(service).toBe(polygonService);
    });

    it('should return Alpha Vantage as fallback if no services are available', () => {
      const service = marketDataService.getService('auto');
      expect(service).toBe(alphaVantageService);
    });
  });

  describe('getQuote', () => {
    it('should get quote from Alpha Vantage and normalize the data', async () => {
      (alphaVantageService.isAvailable as jest.Mock).mockReturnValue(true);
      (alphaVantageService.getQuote as jest.Mock).mockResolvedValue({
        symbol: 'AAPL',
        price: 150.0,
        change: 2.5,
        changePercent: 1.7,
        volume: 1000000,
        previousClose: 147.5,
        open: 148.0,
        high: 151.0,
        low: 147.0,
        latestTradingDay: '2023-01-01'
      });

      const quote = await marketDataService.getQuote('AAPL', 'alphaVantage');
      
      expect(alphaVantageService.getQuote).toHaveBeenCalledWith('AAPL');
      expect(quote).toEqual({
        symbol: 'AAPL',
        price: 150.0,
        change: 2.5,
        changePercent: 1.7,
        volume: 1000000,
        previousClose: 147.5,
        open: 148.0,
        high: 151.0,
        low: 147.0,
        timestamp: '2023-01-01'
      });
    });

    it('should get quote from Polygon and normalize the data', async () => {
      (polygonService.isAvailable as jest.Mock).mockReturnValue(true);
      (polygonService.getLatestQuote as jest.Mock).mockResolvedValue({
        symbol: 'AAPL',
        price: 150.0,
        size: 100,
        timestamp: 1672531200000
      });
      (polygonService.getPreviousClose as jest.Mock).mockResolvedValue({
        open: 148.0,
        high: 151.0,
        low: 147.0,
        close: 147.5,
        volume: 1000000,
        timestamp: 1672444800000
      });

      const quote = await marketDataService.getQuote('AAPL', 'polygon');
      
      expect(polygonService.getLatestQuote).toHaveBeenCalledWith('AAPL');
      expect(polygonService.getPreviousClose).toHaveBeenCalledWith('AAPL');
      expect(quote).toEqual({
        symbol: 'AAPL',
        price: 150.0,
        change: 2.5,
        changePercent: 1.6949152542372878,
        volume: 100,
        previousClose: 147.5,
        open: 148.0,
        high: 151.0,
        low: 147.0,
        timestamp: 1672531200000
      });
    });

    it('should get quote from IEX Cloud and normalize the data', async () => {
      (iexCloudService.isAvailable as jest.Mock).mockReturnValue(true);
      (iexCloudService.getQuote as jest.Mock).mockResolvedValue({
        symbol: 'AAPL',
        latestPrice: 150.0,
        change: 2.5,
        changePercent: 0.017,
        volume: 1000000,
        previousClose: 147.5,
        open: 148.0,
        high: 151.0,
        low: 147.0,
        latestUpdate: 1672531200000
      });

      const quote = await marketDataService.getQuote('AAPL', 'iexCloud');
      
      expect(iexCloudService.getQuote).toHaveBeenCalledWith('AAPL');
      expect(quote).toEqual({
        symbol: 'AAPL',
        price: 150.0,
        change: 2.5,
        changePercent: 1.7,
        volume: 1000000,
        previousClose: 147.5,
        open: 148.0,
        high: 151.0,
        low: 147.0,
        timestamp: 1672531200000
      });
    });
  });

  describe('getHistoricalBars', () => {
    it('should get historical bars from Alpha Vantage and normalize the data', async () => {
      (alphaVantageService.isAvailable as jest.Mock).mockReturnValue(true);
      (alphaVantageService.getTimeSeries as jest.Mock).mockResolvedValue({
        symbol: 'AAPL',
        interval: 'daily',
        data: [
          {
            timestamp: '2023-01-03',
            open: 148.0,
            high: 151.0,
            low: 147.0,
            close: 150.0,
            volume: 1000000
          },
          {
            timestamp: '2023-01-02',
            open: 147.0,
            high: 149.0,
            low: 146.0,
            close: 148.0,
            volume: 900000
          }
        ]
      });

      const bars = await marketDataService.getHistoricalBars('AAPL', '1d', 2, 'alphaVantage');
      
      expect(alphaVantageService.getTimeSeries).toHaveBeenCalledWith('AAPL', 'daily', 'compact');
      expect(bars).toEqual([
        {
          timestamp: '2023-01-03',
          open: 148.0,
          high: 151.0,
          low: 147.0,
          close: 150.0,
          volume: 1000000
        },
        {
          timestamp: '2023-01-02',
          open: 147.0,
          high: 149.0,
          low: 146.0,
          close: 148.0,
          volume: 900000
        }
      ]);
    });
  });

  describe('searchSymbols', () => {
    it('should search symbols from Alpha Vantage and normalize the data', async () => {
      (alphaVantageService.isAvailable as jest.Mock).mockReturnValue(true);
      (alphaVantageService.searchStocks as jest.Mock).mockResolvedValue([
        {
          symbol: 'AAPL',
          name: 'Apple Inc',
          type: 'Equity',
          region: 'United States'
        },
        {
          symbol: 'AAPL.LON',
          name: 'Apple Inc',
          type: 'Equity',
          region: 'United Kingdom'
        }
      ]);

      const symbols = await marketDataService.searchSymbols('Apple', 2, 'alphaVantage');
      
      expect(alphaVantageService.searchStocks).toHaveBeenCalledWith('Apple');
      expect(symbols).toEqual([
        {
          symbol: 'AAPL',
          name: 'Apple Inc',
          type: 'Equity',
          exchange: 'United States'
        },
        {
          symbol: 'AAPL.LON',
          name: 'Apple Inc',
          type: 'Equity',
          exchange: 'United Kingdom'
        }
      ]);
    });
  });

  describe('getMarketMovers', () => {
    it('should get market gainers from IEX Cloud and normalize the data', async () => {
      (iexCloudService.isAvailable as jest.Mock).mockReturnValue(true);
      (iexCloudService.getMarketGainers as jest.Mock).mockResolvedValue([
        {
          symbol: 'AAPL',
          latestPrice: 150.0,
          change: 5.0,
          changePercent: 0.035,
          volume: 1000000,
          previousClose: 145.0,
          open: 146.0,
          high: 151.0,
          low: 145.5,
          latestUpdate: 1672531200000
        },
        {
          symbol: 'MSFT',
          latestPrice: 250.0,
          change: 7.5,
          changePercent: 0.03,
          volume: 800000,
          previousClose: 242.5,
          open: 243.0,
          high: 251.0,
          low: 242.0,
          latestUpdate: 1672531200000
        }
      ]);

      const movers = await marketDataService.getMarketMovers('gainers', 2, 'iexCloud');
      
      expect(iexCloudService.getMarketGainers).toHaveBeenCalledWith(2);
      expect(movers).toEqual([
        {
          symbol: 'AAPL',
          price: 150.0,
          change: 5.0,
          changePercent: 3.5,
          volume: 1000000,
          previousClose: 145.0,
          open: 146.0,
          high: 151.0,
          low: 145.5,
          timestamp: 1672531200000
        },
        {
          symbol: 'MSFT',
          price: 250.0,
          change: 7.5,
          changePercent: 3.0,
          volume: 800000,
          previousClose: 242.5,
          open: 243.0,
          high: 251.0,
          low: 242.0,
          timestamp: 1672531200000
        }
      ]);
    });
  });
});