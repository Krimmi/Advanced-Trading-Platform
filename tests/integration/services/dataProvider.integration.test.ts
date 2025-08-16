import { UnifiedDataProvider } from '../../../src/services/data/UnifiedDataProvider';
import { AlpacaApiService } from '../../../src/services/api/AlpacaApiService';
import { IEXCloudApiService } from '../../../src/services/api/IEXCloudApiService';
import { PolygonApiService } from '../../../src/services/api/PolygonApiService';
import { FMPApiService } from '../../../src/services/api/FMPApiService';
import { MarketDataService } from '../../../src/services/data/MarketDataService';

// Mock the API services
jest.mock('../../../src/services/api/AlpacaApiService');
jest.mock('../../../src/services/api/IEXCloudApiService');
jest.mock('../../../src/services/api/PolygonApiService');
jest.mock('../../../src/services/api/FMPApiService');

describe('UnifiedDataProvider Integration Tests', () => {
  let unifiedDataProvider: UnifiedDataProvider;
  let alpacaApiService: jest.Mocked<AlpacaApiService>;
  let iexCloudApiService: jest.Mocked<IEXCloudApiService>;
  let polygonApiService: jest.Mocked<PolygonApiService>;
  let fmpApiService: jest.Mocked<FMPApiService>;
  
  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks();
    
    // Create mock instances
    alpacaApiService = new AlpacaApiService() as jest.Mocked<AlpacaApiService>;
    iexCloudApiService = new IEXCloudApiService() as jest.Mocked<IEXCloudApiService>;
    polygonApiService = new PolygonApiService() as jest.Mocked<PolygonApiService>;
    fmpApiService = new FMPApiService() as jest.Mocked<FMPApiService>;
    
    // Initialize the UnifiedDataProvider with mocked services
    unifiedDataProvider = new UnifiedDataProvider({
      alpacaApiService,
      iexCloudApiService,
      polygonApiService,
      fmpApiService
    });
  });
  
  describe('Market Data Flow', () => {
    test('should fetch quote data from primary provider', async () => {
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
      
      alpacaApiService.getQuote.mockResolvedValue(mockQuote);
      
      // Act
      const result = await unifiedDataProvider.getQuote(symbol);
      
      // Assert
      expect(alpacaApiService.getQuote).toHaveBeenCalledWith(symbol);
      expect(result).toEqual(mockQuote);
    });
    
    test('should fall back to secondary provider when primary fails', async () => {
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
      
      // Primary provider fails
      alpacaApiService.getQuote.mockRejectedValue(new Error('API Error'));
      // Secondary provider succeeds
      polygonApiService.getQuote.mockResolvedValue(mockQuote);
      
      // Act
      const result = await unifiedDataProvider.getQuote(symbol);
      
      // Assert
      expect(alpacaApiService.getQuote).toHaveBeenCalledWith(symbol);
      expect(polygonApiService.getQuote).toHaveBeenCalledWith(symbol);
      expect(result).toEqual(mockQuote);
    });
    
    test('should try all providers in sequence until one succeeds', async () => {
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
      
      // First two providers fail
      alpacaApiService.getQuote.mockRejectedValue(new Error('API Error 1'));
      polygonApiService.getQuote.mockRejectedValue(new Error('API Error 2'));
      // Third provider succeeds
      iexCloudApiService.getQuote.mockResolvedValue(mockQuote);
      
      // Act
      const result = await unifiedDataProvider.getQuote(symbol);
      
      // Assert
      expect(alpacaApiService.getQuote).toHaveBeenCalledWith(symbol);
      expect(polygonApiService.getQuote).toHaveBeenCalledWith(symbol);
      expect(iexCloudApiService.getQuote).toHaveBeenCalledWith(symbol);
      expect(result).toEqual(mockQuote);
    });
    
    test('should throw error when all providers fail', async () => {
      // Arrange
      const symbol = 'AAPL';
      const errorMessage = 'All data providers failed to fetch quote data';
      
      // All providers fail
      alpacaApiService.getQuote.mockRejectedValue(new Error('API Error 1'));
      polygonApiService.getQuote.mockRejectedValue(new Error('API Error 2'));
      iexCloudApiService.getQuote.mockRejectedValue(new Error('API Error 3'));
      fmpApiService.getQuote.mockRejectedValue(new Error('API Error 4'));
      
      // Act & Assert
      await expect(unifiedDataProvider.getQuote(symbol)).rejects.toThrow(errorMessage);
      expect(alpacaApiService.getQuote).toHaveBeenCalledWith(symbol);
      expect(polygonApiService.getQuote).toHaveBeenCalledWith(symbol);
      expect(iexCloudApiService.getQuote).toHaveBeenCalledWith(symbol);
      expect(fmpApiService.getQuote).toHaveBeenCalledWith(symbol);
    });
  });
  
  describe('Historical Data Integration', () => {
    test('should fetch historical bars with proper parameters', async () => {
      // Arrange
      const symbol = 'AAPL';
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      const timeframe = '1day';
      
      const mockBars = [
        {
          symbol,
          open: 150.0,
          high: 155.0,
          low: 149.0,
          close: 153.0,
          volume: 1000000,
          timestamp: new Date('2023-01-01'),
          interval: '1day'
        },
        {
          symbol,
          open: 153.0,
          high: 158.0,
          low: 152.0,
          close: 157.0,
          volume: 1200000,
          timestamp: new Date('2023-01-02'),
          interval: '1day'
        }
      ];
      
      alpacaApiService.getHistoricalBars.mockResolvedValue(mockBars);
      
      // Act
      const result = await unifiedDataProvider.getHistoricalBars(symbol, startDate, endDate, timeframe);
      
      // Assert
      expect(alpacaApiService.getHistoricalBars).toHaveBeenCalledWith(symbol, startDate, endDate, timeframe);
      expect(result).toEqual(mockBars);
    });
  });
  
  describe('Fundamental Data Integration', () => {
    test('should fetch company profile data', async () => {
      // Arrange
      const symbol = 'AAPL';
      const mockProfile = {
        symbol,
        companyName: 'Apple Inc.',
        industry: 'Technology',
        sector: 'Consumer Electronics',
        employees: 150000,
        website: 'https://www.apple.com',
        description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.'
      };
      
      fmpApiService.getCompanyProfile.mockResolvedValue(mockProfile);
      
      // Act
      const result = await unifiedDataProvider.getCompanyProfile(symbol);
      
      // Assert
      expect(fmpApiService.getCompanyProfile).toHaveBeenCalledWith(symbol);
      expect(result).toEqual(mockProfile);
    });
    
    test('should fetch financial statements', async () => {
      // Arrange
      const symbol = 'AAPL';
      const mockFinancials = {
        symbol,
        income: [/* income statement data */],
        balance: [/* balance sheet data */],
        cash: [/* cash flow data */]
      };
      
      fmpApiService.getFinancialStatements.mockResolvedValue(mockFinancials);
      
      // Act
      const result = await unifiedDataProvider.getFinancialStatements(symbol);
      
      // Assert
      expect(fmpApiService.getFinancialStatements).toHaveBeenCalledWith(symbol);
      expect(result).toEqual(mockFinancials);
    });
  });
});