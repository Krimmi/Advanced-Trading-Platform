import { financialDataService } from '../FinancialDataServiceFactory';
import { financialModelingPrepService } from '../FinancialModelingPrepService';
import { quandlService } from '../QuandlService';
import { mockFinancialDataProvider } from '../MockFinancialDataProvider';
import { API_KEYS, DATA_SOURCE_CONFIG } from '../../../../config/apiConfig';

// Mock the API services
jest.mock('../FinancialModelingPrepService', () => ({
  financialModelingPrepService: {
    isAvailable: jest.fn(),
    getIncomeStatements: jest.fn(),
    getBalanceSheets: jest.fn(),
    getCashFlowStatements: jest.fn(),
    getCompanyProfile: jest.fn(),
    getFinancialRatios: jest.fn(),
    getEarnings: jest.fn()
  }
}));

jest.mock('../QuandlService', () => ({
  quandlService: {
    isAvailable: jest.fn(),
    getIncomeStatements: jest.fn(),
    getBalanceSheets: jest.fn(),
    getCashFlowStatements: jest.fn(),
    getCompanyProfile: jest.fn(),
    getFinancialRatios: jest.fn(),
    getEarnings: jest.fn(),
    getEconomicData: jest.fn()
  }
}));

jest.mock('../MockFinancialDataProvider', () => ({
  mockFinancialDataProvider: {
    getIncomeStatements: jest.fn(),
    getBalanceSheets: jest.fn(),
    getCashFlowStatements: jest.fn(),
    getCompanyProfile: jest.fn(),
    getFinancialRatios: jest.fn(),
    getEarnings: jest.fn()
  }
}));

// Mock the config
jest.mock('../../../../config/apiConfig', () => ({
  API_KEYS: {
    financialModelingPrep: '',
    quandl: ''
  },
  DATA_SOURCE_CONFIG: {
    forceMockData: false,
    cacheTTL: {
      fundamentalData: 86400000
    }
  }
}));

describe('FinancialDataServiceFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default to no services available
    (financialModelingPrepService.isAvailable as jest.Mock).mockReturnValue(false);
    (quandlService.isAvailable as jest.Mock).mockReturnValue(false);
  });

  describe('getBestAvailableService', () => {
    it('should return the requested service if available', () => {
      // Setup
      (API_KEYS as any).financialModelingPrep = 'test-key';
      (financialModelingPrepService.isAvailable as jest.Mock).mockReturnValue(true);
      
      // Execute
      const service = (financialDataService as any).getBestAvailableService('financialModelingPrep');
      
      // Verify
      expect(service).toBe(financialModelingPrepService);
    });

    it('should return the best available service if requested service is not available', () => {
      // Setup
      (API_KEYS as any).quandl = 'test-key';
      (quandlService.isAvailable as jest.Mock).mockReturnValue(true);
      
      // Execute
      const service = (financialDataService as any).getBestAvailableService('financialModelingPrep');
      
      // Verify
      expect(service).toBe(quandlService);
    });

    it('should prefer Financial Modeling Prep over Quandl when both are available', () => {
      // Setup
      (API_KEYS as any).financialModelingPrep = 'test-key';
      (API_KEYS as any).quandl = 'test-key';
      (financialModelingPrepService.isAvailable as jest.Mock).mockReturnValue(true);
      (quandlService.isAvailable as jest.Mock).mockReturnValue(true);
      
      // Execute
      const service = (financialDataService as any).getBestAvailableService('auto');
      
      // Verify
      expect(service).toBe(financialModelingPrepService);
    });

    it('should return mock provider if no service is available', () => {
      // Execute
      const service = (financialDataService as any).getBestAvailableService();
      
      // Verify
      expect(service).toBe(mockFinancialDataProvider);
    });

    it('should return mock provider if forceMockData is true', () => {
      // Setup
      (API_KEYS as any).financialModelingPrep = 'test-key';
      (financialModelingPrepService.isAvailable as jest.Mock).mockReturnValue(true);
      (DATA_SOURCE_CONFIG as any).forceMockData = true;
      
      // Execute
      const service = (financialDataService as any).getBestAvailableService();
      
      // Verify
      expect(service).toBe(mockFinancialDataProvider);
      
      // Cleanup
      (DATA_SOURCE_CONFIG as any).forceMockData = false;
    });
  });

  describe('getIncomeStatements', () => {
    it('should get income statements from Financial Modeling Prep', async () => {
      // Setup
      (API_KEYS as any).financialModelingPrep = 'test-key';
      (financialModelingPrepService.isAvailable as jest.Mock).mockReturnValue(true);
      (financialModelingPrepService.getIncomeStatements as jest.Mock).mockResolvedValue([
        {
          fiscalDate: '2022-12-31',
          reportDate: '2023-01-30',
          period: 'annual',
          revenue: 100000,
          costOfRevenue: 50000,
          grossProfit: 50000,
          operatingExpense: 20000,
          operatingIncome: 30000,
          netIncome: 25000,
          eps: 2.5,
          ebitda: 35000
        }
      ]);

      // Execute
      const statements = await financialDataService.getIncomeStatements('AAPL', 'annual', 1, 'financialModelingPrep');
      
      // Verify
      expect(financialModelingPrepService.getIncomeStatements).toHaveBeenCalledWith('AAPL', 'annual', 1);
      expect(statements).toHaveLength(1);
      expect(statements[0].revenue).toBe(100000);
    });

    it('should retry with auto provider if specified provider fails', async () => {
      // Setup
      (API_KEYS as any).financialModelingPrep = 'test-key';
      (API_KEYS as any).quandl = 'test-key';
      (financialModelingPrepService.isAvailable as jest.Mock).mockReturnValue(true);
      (quandlService.isAvailable as jest.Mock).mockReturnValue(true);
      
      // First call fails
      (financialModelingPrepService.getIncomeStatements as jest.Mock).mockRejectedValueOnce(new Error('API error'));
      
      // Second call succeeds
      (financialModelingPrepService.getIncomeStatements as jest.Mock).mockResolvedValueOnce([
        {
          fiscalDate: '2022-12-31',
          reportDate: '2023-01-30',
          period: 'annual',
          revenue: 100000,
          costOfRevenue: 50000,
          grossProfit: 50000,
          operatingExpense: 20000,
          operatingIncome: 30000,
          netIncome: 25000,
          eps: 2.5,
          ebitda: 35000
        }
      ]);

      // Execute
      const statements = await financialDataService.getIncomeStatements('AAPL', 'annual', 1, 'quandl');
      
      // Verify
      expect(quandlService.getIncomeStatements).toHaveBeenCalledWith('AAPL', 'annual', 1);
      expect(financialModelingPrepService.getIncomeStatements).toHaveBeenCalledWith('AAPL', 'annual', 1);
      expect(statements).toHaveLength(1);
      expect(statements[0].revenue).toBe(100000);
    });
  });

  describe('getCompanyProfile', () => {
    it('should get company profile from Financial Modeling Prep', async () => {
      // Setup
      (API_KEYS as any).financialModelingPrep = 'test-key';
      (financialModelingPrepService.isAvailable as jest.Mock).mockReturnValue(true);
      (financialModelingPrepService.getCompanyProfile as jest.Mock).mockResolvedValue({
        symbol: 'AAPL',
        name: 'Apple Inc.',
        exchange: 'NASDAQ',
        industry: 'Consumer Electronics',
        sector: 'Technology',
        description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
        website: 'https://www.apple.com',
        employees: 147000,
        ceo: 'Tim Cook',
        address: 'One Apple Park Way',
        city: 'Cupertino',
        state: 'CA',
        zip: '95014',
        country: 'United States',
        phone: '+1-408-996-1010'
      });

      // Execute
      const profile = await financialDataService.getCompanyProfile('AAPL', 'financialModelingPrep');
      
      // Verify
      expect(financialModelingPrepService.getCompanyProfile).toHaveBeenCalledWith('AAPL');
      expect(profile.symbol).toBe('AAPL');
      expect(profile.name).toBe('Apple Inc.');
    });
  });

  describe('getEconomicData', () => {
    it('should get economic data from Quandl', async () => {
      // Setup
      (API_KEYS as any).quandl = 'test-key';
      (quandlService.isAvailable as jest.Mock).mockReturnValue(true);
      (quandlService.getEconomicData as jest.Mock).mockResolvedValue({
        name: 'GDP',
        description: 'US Gross Domestic Product',
        columns: ['Date', 'Value'],
        data: [
          ['2022-12-31', 25000],
          ['2022-09-30', 24500]
        ],
        startDate: '2022-09-30',
        endDate: '2022-12-31',
        frequency: 'quarterly'
      });

      // Execute
      const data = await financialDataService.getEconomicData('FRED/GDP', '2022-09-30', '2022-12-31');
      
      // Verify
      expect(quandlService.getEconomicData).toHaveBeenCalledWith('FRED/GDP', '2022-09-30', '2022-12-31');
      expect(data.name).toBe('GDP');
      expect(data.data).toHaveLength(2);
    });

    it('should return mock economic data if Quandl is not available', async () => {
      // Execute
      const data = await financialDataService.getEconomicData('FRED/GDP');
      
      // Verify
      expect(quandlService.getEconomicData).not.toHaveBeenCalled();
      expect(data.name).toBe('FRED/GDP Dataset');
      expect(data.data).toBeDefined();
    });
  });
});