import { newsService } from '../NewsServiceFactory';
import { newsApiService } from '../NewsApiService';
import { finnhubService } from '../FinnhubService';
import { mockNewsProvider } from '../MockNewsProvider';
import { API_KEYS, DATA_SOURCE_CONFIG } from '../../../../config/apiConfig';

// Mock the API services
jest.mock('../NewsApiService', () => ({
  newsApiService: {
    isAvailable: jest.fn(),
    searchNews: jest.fn(),
    getSymbolNews: jest.fn(),
    getTopNews: jest.fn(),
    getSentiment: jest.fn(),
    getSentimentTrend: jest.fn()
  }
}));

jest.mock('../FinnhubService', () => ({
  finnhubService: {
    isAvailable: jest.fn(),
    searchNews: jest.fn(),
    getSymbolNews: jest.fn(),
    getTopNews: jest.fn(),
    getSentiment: jest.fn(),
    getSentimentTrend: jest.fn()
  }
}));

jest.mock('../MockNewsProvider', () => ({
  mockNewsProvider: {
    searchNews: jest.fn(),
    getSymbolNews: jest.fn(),
    getTopNews: jest.fn(),
    getSentiment: jest.fn(),
    getSentimentTrend: jest.fn()
  }
}));

// Mock the config
jest.mock('../../../../config/apiConfig', () => ({
  API_KEYS: {
    newsApi: '',
    finnhub: ''
  },
  DATA_SOURCE_CONFIG: {
    forceMockData: false,
    cacheTTL: {
      newsData: 300000
    }
  }
}));

describe('NewsServiceFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default to no services available
    (newsApiService.isAvailable as jest.Mock).mockReturnValue(false);
    (finnhubService.isAvailable as jest.Mock).mockReturnValue(false);
  });

  describe('getBestAvailableService', () => {
    it('should return the requested service if available', () => {
      // Setup
      (API_KEYS as any).newsApi = 'test-key';
      (newsApiService.isAvailable as jest.Mock).mockReturnValue(true);
      
      // Execute
      const service = (newsService as any).getBestAvailableService('newsApi');
      
      // Verify
      expect(service).toBe(newsApiService);
    });

    it('should return the best available service if requested service is not available', () => {
      // Setup
      (API_KEYS as any).finnhub = 'test-key';
      (finnhubService.isAvailable as jest.Mock).mockReturnValue(true);
      
      // Execute
      const service = (newsService as any).getBestAvailableService('newsApi');
      
      // Verify
      expect(service).toBe(finnhubService);
    });

    it('should prefer NewsAPI over Finnhub when both are available', () => {
      // Setup
      (API_KEYS as any).newsApi = 'test-key';
      (API_KEYS as any).finnhub = 'test-key';
      (newsApiService.isAvailable as jest.Mock).mockReturnValue(true);
      (finnhubService.isAvailable as jest.Mock).mockReturnValue(true);
      
      // Execute
      const service = (newsService as any).getBestAvailableService('auto');
      
      // Verify
      expect(service).toBe(newsApiService);
    });

    it('should return mock provider if no service is available', () => {
      // Execute
      const service = (newsService as any).getBestAvailableService();
      
      // Verify
      expect(service).toBe(mockNewsProvider);
    });

    it('should return mock provider if forceMockData is true', () => {
      // Setup
      (API_KEYS as any).newsApi = 'test-key';
      (newsApiService.isAvailable as jest.Mock).mockReturnValue(true);
      (DATA_SOURCE_CONFIG as any).forceMockData = true;
      
      // Execute
      const service = (newsService as any).getBestAvailableService();
      
      // Verify
      expect(service).toBe(mockNewsProvider);
      
      // Cleanup
      (DATA_SOURCE_CONFIG as any).forceMockData = false;
    });
  });

  describe('searchNews', () => {
    it('should search news from NewsAPI', async () => {
      // Setup
      (API_KEYS as any).newsApi = 'test-key';
      (newsApiService.isAvailable as jest.Mock).mockReturnValue(true);
      (newsApiService.searchNews as jest.Mock).mockResolvedValue({
        articles: [
          {
            id: '1',
            title: 'Test Article',
            summary: 'Test Summary',
            url: 'https://example.com',
            source: 'Test Source',
            publishedAt: '2023-01-01T00:00:00Z'
          }
        ],
        totalResults: 1,
        page: 1,
        pageSize: 10
      });

      // Execute
      const result = await newsService.searchNews({ query: 'test' }, 'newsApi');
      
      // Verify
      expect(newsApiService.searchNews).toHaveBeenCalledWith({ query: 'test' });
      expect(result.articles).toHaveLength(1);
      expect(result.articles[0].title).toBe('Test Article');
    });

    it('should retry with auto provider if specified provider fails', async () => {
      // Setup
      (API_KEYS as any).newsApi = 'test-key';
      (API_KEYS as any).finnhub = 'test-key';
      (newsApiService.isAvailable as jest.Mock).mockReturnValue(true);
      (finnhubService.isAvailable as jest.Mock).mockReturnValue(true);
      
      // First call fails
      (finnhubService.searchNews as jest.Mock).mockRejectedValueOnce(new Error('API error'));
      
      // Second call succeeds
      (newsApiService.searchNews as jest.Mock).mockResolvedValueOnce({
        articles: [
          {
            id: '1',
            title: 'Test Article',
            summary: 'Test Summary',
            url: 'https://example.com',
            source: 'Test Source',
            publishedAt: '2023-01-01T00:00:00Z'
          }
        ],
        totalResults: 1,
        page: 1,
        pageSize: 10
      });

      // Execute
      const result = await newsService.searchNews({ query: 'test' }, 'finnhub');
      
      // Verify
      expect(finnhubService.searchNews).toHaveBeenCalledWith({ query: 'test' });
      expect(newsApiService.searchNews).toHaveBeenCalledWith({ query: 'test' });
      expect(result.articles).toHaveLength(1);
      expect(result.articles[0].title).toBe('Test Article');
    });
  });

  describe('getSymbolNews', () => {
    it('should get symbol news from NewsAPI', async () => {
      // Setup
      (API_KEYS as any).newsApi = 'test-key';
      (newsApiService.isAvailable as jest.Mock).mockReturnValue(true);
      (newsApiService.getSymbolNews as jest.Mock).mockResolvedValue([
        {
          id: '1',
          title: 'Apple Reports Strong Earnings',
          summary: 'Apple Inc. reported strong earnings for Q1 2023',
          url: 'https://example.com',
          source: 'Test Source',
          publishedAt: '2023-01-01T00:00:00Z',
          symbols: ['AAPL']
        }
      ]);

      // Execute
      const articles = await newsService.getSymbolNews('AAPL', 10, '2023-01-01', '2023-01-31', 'newsApi');
      
      // Verify
      expect(newsApiService.getSymbolNews).toHaveBeenCalledWith('AAPL', 10, '2023-01-01', '2023-01-31');
      expect(articles).toHaveLength(1);
      expect(articles[0].title).toBe('Apple Reports Strong Earnings');
    });
  });

  describe('getSentiment', () => {
    it('should get sentiment from Finnhub when available', async () => {
      // Setup
      (API_KEYS as any).finnhub = 'test-key';
      (finnhubService.isAvailable as jest.Mock).mockReturnValue(true);
      (finnhubService.getSentiment as jest.Mock).mockResolvedValue({
        symbol: 'AAPL',
        overallScore: 0.75,
        overallLabel: 'positive',
        newsCount: 10,
        socialCount: 50,
        newsScore: 0.8,
        socialScore: 0.7,
        timestamp: '2023-01-01T00:00:00Z'
      });

      // Execute
      const sentiment = await newsService.getSentiment('AAPL');
      
      // Verify
      expect(finnhubService.getSentiment).toHaveBeenCalledWith('AAPL');
      expect(sentiment.symbol).toBe('AAPL');
      expect(sentiment.overallLabel).toBe('positive');
    });

    it('should get sentiment from mock provider when Finnhub is not available', async () => {
      // Setup
      (mockNewsProvider.getSentiment as jest.Mock).mockResolvedValue({
        symbol: 'AAPL',
        overallScore: 0.5,
        overallLabel: 'positive',
        newsCount: 5,
        socialCount: 20,
        newsScore: 0.6,
        socialScore: 0.4,
        timestamp: '2023-01-01T00:00:00Z'
      });

      // Execute
      const sentiment = await newsService.getSentiment('AAPL');
      
      // Verify
      expect(finnhubService.getSentiment).not.toHaveBeenCalled();
      expect(mockNewsProvider.getSentiment).toHaveBeenCalledWith('AAPL');
      expect(sentiment.symbol).toBe('AAPL');
    });
  });

  describe('getSentimentTrend', () => {
    it('should get sentiment trend from Finnhub when available', async () => {
      // Setup
      (API_KEYS as any).finnhub = 'test-key';
      (finnhubService.isAvailable as jest.Mock).mockReturnValue(true);
      (finnhubService.getSentimentTrend as jest.Mock).mockResolvedValue({
        symbol: 'AAPL',
        data: [
          { timestamp: '2023-01-01', score: 0.5, volume: 100 },
          { timestamp: '2023-01-02', score: 0.6, volume: 120 }
        ],
        startDate: '2023-01-01',
        endDate: '2023-01-02'
      });

      // Execute
      const trend = await newsService.getSentimentTrend('AAPL', 2);
      
      // Verify
      expect(finnhubService.getSentimentTrend).toHaveBeenCalledWith('AAPL', 2);
      expect(trend.symbol).toBe('AAPL');
      expect(trend.data).toHaveLength(2);
    });
  });
});