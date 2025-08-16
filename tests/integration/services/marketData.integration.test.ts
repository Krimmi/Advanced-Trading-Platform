import { MarketDataService } from '../../../src/services/data/MarketDataService';
import { UnifiedDataProvider } from '../../../src/services/data/UnifiedDataProvider';
import { WebSocketService } from '../../../src/services/network/WebSocketService';
import { CacheService } from '../../../src/services/cache/CacheService';
import { EventEmitter } from 'events';

// Mock dependencies
jest.mock('../../../src/services/data/UnifiedDataProvider');
jest.mock('../../../src/services/network/WebSocketService');
jest.mock('../../../src/services/cache/CacheService');

describe('MarketDataService Integration Tests', () => {
  let marketDataService: MarketDataService;
  let unifiedDataProvider: jest.Mocked<UnifiedDataProvider>;
  let webSocketService: jest.Mocked<WebSocketService>;
  let cacheService: jest.Mocked<CacheService>;
  let eventEmitter: EventEmitter;
  
  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks();
    
    // Create mock instances
    unifiedDataProvider = new UnifiedDataProvider({}) as jest.Mocked<UnifiedDataProvider>;
    webSocketService = new WebSocketService() as jest.Mocked<WebSocketService>;
    cacheService = new CacheService() as jest.Mocked<CacheService>;
    eventEmitter = new EventEmitter();
    
    // Setup WebSocketService mock to use EventEmitter
    webSocketService.subscribe = jest.fn((channel, callback) => {
      eventEmitter.on(channel, callback);
      return Promise.resolve();
    });
    
    webSocketService.unsubscribe = jest.fn((channel, callback) => {
      eventEmitter.off(channel, callback);
      return Promise.resolve();
    });
    
    // Initialize the MarketDataService with mocked dependencies
    marketDataService = new MarketDataService({
      dataProvider: unifiedDataProvider,
      webSocketService,
      cacheService
    });
  });
  
  describe('Real-time Data Flow', () => {
    test('should subscribe to real-time quotes and emit updates', async () => {
      // Arrange
      const symbol = 'AAPL';
      const mockQuote = {
        symbol,
        bidPrice: 150.5,
        bidSize: 100,
        askPrice: 150.7,
        askSize: 200,
        timestamp: new Date()
      };
      
      const quoteUpdateCallback = jest.fn();
      
      // Act
      await marketDataService.subscribeToQuotes(symbol, quoteUpdateCallback);
      
      // Simulate a quote update from WebSocket
      eventEmitter.emit(`quotes:${symbol}`, mockQuote);
      
      // Assert
      expect(webSocketService.subscribe).toHaveBeenCalledWith(`quotes:${symbol}`, expect.any(Function));
      expect(quoteUpdateCallback).toHaveBeenCalledWith(mockQuote);
    });
    
    test('should subscribe to multiple symbols and handle updates correctly', async () => {
      // Arrange
      const symbols = ['AAPL', 'MSFT', 'GOOGL'];
      const mockQuotes = {
        AAPL: {
          symbol: 'AAPL',
          bidPrice: 150.5,
          bidSize: 100,
          askPrice: 150.7,
          askSize: 200,
          timestamp: new Date()
        },
        MSFT: {
          symbol: 'MSFT',
          bidPrice: 250.5,
          bidSize: 150,
          askPrice: 250.8,
          askSize: 300,
          timestamp: new Date()
        }
      };
      
      const quoteUpdateCallback = jest.fn();
      
      // Act
      for (const symbol of symbols) {
        await marketDataService.subscribeToQuotes(symbol, quoteUpdateCallback);
      }
      
      // Simulate quote updates from WebSocket for different symbols
      eventEmitter.emit(`quotes:AAPL`, mockQuotes.AAPL);
      eventEmitter.emit(`quotes:MSFT`, mockQuotes.MSFT);
      
      // Assert
      expect(webSocketService.subscribe).toHaveBeenCalledTimes(3);
      expect(quoteUpdateCallback).toHaveBeenCalledTimes(2);
      expect(quoteUpdateCallback).toHaveBeenCalledWith(mockQuotes.AAPL);
      expect(quoteUpdateCallback).toHaveBeenCalledWith(mockQuotes.MSFT);
    });
    
    test('should unsubscribe from real-time quotes correctly', async () => {
      // Arrange
      const symbol = 'AAPL';
      const quoteUpdateCallback = jest.fn();
      
      // Act - Subscribe then unsubscribe
      await marketDataService.subscribeToQuotes(symbol, quoteUpdateCallback);
      await marketDataService.unsubscribeFromQuotes(symbol, quoteUpdateCallback);
      
      // Simulate a quote update from WebSocket after unsubscribe
      eventEmitter.emit(`quotes:${symbol}`, { symbol, bidPrice: 150.5, askPrice: 150.7 });
      
      // Assert
      expect(webSocketService.subscribe).toHaveBeenCalledWith(`quotes:${symbol}`, expect.any(Function));
      expect(webSocketService.unsubscribe).toHaveBeenCalledWith(`quotes:${symbol}`, expect.any(Function));
      expect(quoteUpdateCallback).not.toHaveBeenCalled();
    });
  });
  
  describe('Data Caching Integration', () => {
    test('should cache market data and retrieve from cache when available', async () => {
      // Arrange
      const symbol = 'AAPL';
      const mockQuote = {
        symbol,
        bidPrice: 150.5,
        bidSize: 100,
        askPrice: 150.7,
        askSize: 200,
        timestamp: new Date()
      };
      
      // Setup cache miss then hit scenario
      cacheService.get.mockImplementationOnce(() => null); // First call - cache miss
      cacheService.get.mockImplementationOnce(() => mockQuote); // Second call - cache hit
      
      unifiedDataProvider.getQuote.mockResolvedValue(mockQuote);
      
      // Act - First call should fetch from provider and cache
      const result1 = await marketDataService.getQuote(symbol);
      
      // Act - Second call should retrieve from cache
      const result2 = await marketDataService.getQuote(symbol);
      
      // Assert
      expect(cacheService.get).toHaveBeenCalledTimes(2);
      expect(unifiedDataProvider.getQuote).toHaveBeenCalledTimes(1);
      expect(cacheService.set).toHaveBeenCalledWith(`quote:${symbol}`, mockQuote, expect.any(Number));
      expect(result1).toEqual(mockQuote);
      expect(result2).toEqual(mockQuote);
    });
    
    test('should respect cache TTL for different data types', async () => {
      // Arrange
      const symbol = 'AAPL';
      
      // Mock implementation to track cache keys and TTLs
      const cacheCalls: { key: string, value: any, ttl: number }[] = [];
      cacheService.set.mockImplementation((key, value, ttl) => {
        cacheCalls.push({ key, value, ttl });
        return Promise.resolve();
      });
      
      // Mock data
      const mockQuote = { symbol, bidPrice: 150.5, askPrice: 150.7 };
      const mockBars = [{ symbol, open: 150, close: 151, timestamp: new Date() }];
      const mockProfile = { symbol, companyName: 'Apple Inc.' };
      
      // Setup provider responses
      unifiedDataProvider.getQuote.mockResolvedValue(mockQuote);
      unifiedDataProvider.getHistoricalBars.mockResolvedValue(mockBars);
      unifiedDataProvider.getCompanyProfile.mockResolvedValue(mockProfile);
      
      // Act - Fetch different types of data
      await marketDataService.getQuote(symbol);
      await marketDataService.getHistoricalBars(symbol, new Date(), new Date(), '1day');
      await marketDataService.getCompanyProfile(symbol);
      
      // Assert - Different data types should have different TTLs
      expect(cacheCalls.length).toBe(3);
      
      // Quote data should have short TTL (real-time data)
      expect(cacheCalls[0].key).toContain('quote');
      expect(cacheCalls[0].ttl).toBeLessThan(60); // Less than 60 seconds
      
      // Historical bars should have medium TTL
      expect(cacheCalls[1].key).toContain('bars');
      expect(cacheCalls[1].ttl).toBeGreaterThan(60); // More than 60 seconds
      
      // Company profile should have long TTL (changes infrequently)
      expect(cacheCalls[2].key).toContain('profile');
      expect(cacheCalls[2].ttl).toBeGreaterThan(3600); // More than 1 hour
    });
  });
  
  describe('Error Handling and Fallbacks', () => {
    test('should handle WebSocket connection failures gracefully', async () => {
      // Arrange
      const symbol = 'AAPL';
      const mockQuote = {
        symbol,
        bidPrice: 150.5,
        bidSize: 100,
        askPrice: 150.7,
        askSize: 200,
        timestamp: new Date()
      };
      
      // Mock WebSocket failure then recovery
      webSocketService.subscribe.mockRejectedValueOnce(new Error('WebSocket connection failed'));
      webSocketService.subscribe.mockImplementationOnce((channel, callback) => {
        eventEmitter.on(channel, callback);
        return Promise.resolve();
      });
      
      // Mock data provider for fallback
      unifiedDataProvider.getQuote.mockResolvedValue(mockQuote);
      
      const quoteUpdateCallback = jest.fn();
      
      // Act - Try to subscribe (will fail)
      await expect(marketDataService.subscribeToQuotes(symbol, quoteUpdateCallback))
        .rejects.toThrow('WebSocket connection failed');
      
      // Act - Get quote should still work via REST API fallback
      const result = await marketDataService.getQuote(symbol);
      
      // Assert
      expect(unifiedDataProvider.getQuote).toHaveBeenCalledWith(symbol);
      expect(result).toEqual(mockQuote);
      
      // Act - Try to subscribe again (should succeed after recovery)
      await marketDataService.subscribeToQuotes(symbol, quoteUpdateCallback);
      
      // Simulate a quote update
      eventEmitter.emit(`quotes:${symbol}`, mockQuote);
      
      // Assert
      expect(quoteUpdateCallback).toHaveBeenCalledWith(mockQuote);
    });
    
    test('should retry failed requests with exponential backoff', async () => {
      // Arrange
      const symbol = 'AAPL';
      const mockQuote = {
        symbol,
        bidPrice: 150.5,
        bidSize: 100,
        askPrice: 150.7,
        askSize: 200,
        timestamp: new Date()
      };
      
      // Mock provider to fail twice then succeed
      unifiedDataProvider.getQuote
        .mockRejectedValueOnce(new Error('API Error 1'))
        .mockRejectedValueOnce(new Error('API Error 2'))
        .mockResolvedValueOnce(mockQuote);
      
      // Act
      const result = await marketDataService.getQuote(symbol, { retries: 3, backoffFactor: 2 });
      
      // Assert
      expect(unifiedDataProvider.getQuote).toHaveBeenCalledTimes(3);
      expect(result).toEqual(mockQuote);
    });
  });
});