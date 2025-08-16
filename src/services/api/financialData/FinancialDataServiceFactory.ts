import { API_KEYS, DATA_SOURCE_CONFIG } from '../../../config/apiConfig';
import { 
  IFinancialDataService, 
  IncomeStatement, 
  BalanceSheet, 
  CashFlowStatement, 
  CompanyProfile, 
  FinancialRatios, 
  Earnings,
  FinancialPeriod
} from './FinancialDataService';
import { FinancialModelingPrepService, financialModelingPrepService } from './FinancialModelingPrepService';
import { QuandlService, quandlService } from './QuandlService';
import { mockFinancialDataProvider } from './MockFinancialDataProvider';
import { ApiError } from '../BaseApiService';

/**
 * Financial data provider type
 */
export type FinancialDataProvider = 'financialModelingPrep' | 'quandl' | 'auto';

/**
 * Factory for creating and managing financial data services
 */
export class FinancialDataServiceFactory {
  private static instance: FinancialDataServiceFactory;

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): FinancialDataServiceFactory {
    if (!FinancialDataServiceFactory.instance) {
      FinancialDataServiceFactory.instance = new FinancialDataServiceFactory();
    }
    return FinancialDataServiceFactory.instance;
  }

  /**
   * Get the best available financial data service
   * @param preferredProvider - Preferred provider (optional)
   * @returns The best available service
   */
  public getBestAvailableService(preferredProvider: FinancialDataProvider = 'auto'): 
    FinancialModelingPrepService | QuandlService | IFinancialDataService {
    
    // If we're forcing mock data, return the mock provider
    if (DATA_SOURCE_CONFIG.forceMockData) {
      return mockFinancialDataProvider;
    }

    // If a specific provider is requested and available, use it
    if (preferredProvider !== 'auto') {
      switch (preferredProvider) {
        case 'financialModelingPrep':
          if (API_KEYS.financialModelingPrep) return financialModelingPrepService;
          break;
        case 'quandl':
          if (API_KEYS.quandl) return quandlService;
          break;
      }
    }

    // Otherwise, find the first available service in order of preference
    // Financial Modeling Prep is preferred for comprehensive financial data
    if (API_KEYS.financialModelingPrep) return financialModelingPrepService;
    
    // Quandl is second choice
    if (API_KEYS.quandl) return quandlService;

    // If no service is available, return the mock provider
    return mockFinancialDataProvider;
  }

  /**
   * Get income statements for a company
   * @param symbol - Stock symbol
   * @param period - Financial period (annual or quarterly)
   * @param limit - Maximum number of statements to return
   * @param provider - Preferred provider
   * @returns Promise with income statements
   */
  public async getIncomeStatements(
    symbol: string, 
    period: FinancialPeriod = 'annual', 
    limit: number = 5,
    provider: FinancialDataProvider = 'auto'
  ): Promise<IncomeStatement[]> {
    const service = this.getBestAvailableService(provider);
    
    try {
      return await service.getIncomeStatements(symbol, period, limit);
    } catch (error) {
      console.error(`Error getting income statements for ${symbol}:`, error);
      
      // If the preferred provider failed and wasn't 'auto', try with 'auto'
      if (provider !== 'auto') {
        console.log(`Retrying with best available provider...`);
        return this.getIncomeStatements(symbol, period, limit, 'auto');
      }
      
      throw new ApiError(`Failed to get income statements for ${symbol}`, 
        error instanceof ApiError ? error.status : undefined);
    }
  }

  /**
   * Get balance sheets for a company
   * @param symbol - Stock symbol
   * @param period - Financial period (annual or quarterly)
   * @param limit - Maximum number of statements to return
   * @param provider - Preferred provider
   * @returns Promise with balance sheets
   */
  public async getBalanceSheets(
    symbol: string, 
    period: FinancialPeriod = 'annual', 
    limit: number = 5,
    provider: FinancialDataProvider = 'auto'
  ): Promise<BalanceSheet[]> {
    const service = this.getBestAvailableService(provider);
    
    try {
      return await service.getBalanceSheets(symbol, period, limit);
    } catch (error) {
      console.error(`Error getting balance sheets for ${symbol}:`, error);
      
      // If the preferred provider failed and wasn't 'auto', try with 'auto'
      if (provider !== 'auto') {
        console.log(`Retrying with best available provider...`);
        return this.getBalanceSheets(symbol, period, limit, 'auto');
      }
      
      throw new ApiError(`Failed to get balance sheets for ${symbol}`, 
        error instanceof ApiError ? error.status : undefined);
    }
  }

  /**
   * Get cash flow statements for a company
   * @param symbol - Stock symbol
   * @param period - Financial period (annual or quarterly)
   * @param limit - Maximum number of statements to return
   * @param provider - Preferred provider
   * @returns Promise with cash flow statements
   */
  public async getCashFlowStatements(
    symbol: string, 
    period: FinancialPeriod = 'annual', 
    limit: number = 5,
    provider: FinancialDataProvider = 'auto'
  ): Promise<CashFlowStatement[]> {
    const service = this.getBestAvailableService(provider);
    
    try {
      return await service.getCashFlowStatements(symbol, period, limit);
    } catch (error) {
      console.error(`Error getting cash flow statements for ${symbol}:`, error);
      
      // If the preferred provider failed and wasn't 'auto', try with 'auto'
      if (provider !== 'auto') {
        console.log(`Retrying with best available provider...`);
        return this.getCashFlowStatements(symbol, period, limit, 'auto');
      }
      
      throw new ApiError(`Failed to get cash flow statements for ${symbol}`, 
        error instanceof ApiError ? error.status : undefined);
    }
  }

  /**
   * Get company profile
   * @param symbol - Stock symbol
   * @param provider - Preferred provider
   * @returns Promise with company profile
   */
  public async getCompanyProfile(
    symbol: string,
    provider: FinancialDataProvider = 'auto'
  ): Promise<CompanyProfile> {
    const service = this.getBestAvailableService(provider);
    
    try {
      return await service.getCompanyProfile(symbol);
    } catch (error) {
      console.error(`Error getting company profile for ${symbol}:`, error);
      
      // If the preferred provider failed and wasn't 'auto', try with 'auto'
      if (provider !== 'auto') {
        console.log(`Retrying with best available provider...`);
        return this.getCompanyProfile(symbol, 'auto');
      }
      
      throw new ApiError(`Failed to get company profile for ${symbol}`, 
        error instanceof ApiError ? error.status : undefined);
    }
  }

  /**
   * Get financial ratios for a company
   * @param symbol - Stock symbol
   * @param period - Financial period (annual or quarterly)
   * @param provider - Preferred provider
   * @returns Promise with financial ratios
   */
  public async getFinancialRatios(
    symbol: string, 
    period: FinancialPeriod = 'annual',
    provider: FinancialDataProvider = 'auto'
  ): Promise<FinancialRatios> {
    const service = this.getBestAvailableService(provider);
    
    try {
      return await service.getFinancialRatios(symbol, period);
    } catch (error) {
      console.error(`Error getting financial ratios for ${symbol}:`, error);
      
      // If the preferred provider failed and wasn't 'auto', try with 'auto'
      if (provider !== 'auto') {
        console.log(`Retrying with best available provider...`);
        return this.getFinancialRatios(symbol, period, 'auto');
      }
      
      throw new ApiError(`Failed to get financial ratios for ${symbol}`, 
        error instanceof ApiError ? error.status : undefined);
    }
  }

  /**
   * Get earnings data for a company
   * @param symbol - Stock symbol
   * @param limit - Maximum number of earnings reports to return
   * @param provider - Preferred provider
   * @returns Promise with earnings data
   */
  public async getEarnings(
    symbol: string, 
    limit: number = 4,
    provider: FinancialDataProvider = 'auto'
  ): Promise<Earnings[]> {
    const service = this.getBestAvailableService(provider);
    
    try {
      return await service.getEarnings(symbol, limit);
    } catch (error) {
      console.error(`Error getting earnings for ${symbol}:`, error);
      
      // If the preferred provider failed and wasn't 'auto', try with 'auto'
      if (provider !== 'auto') {
        console.log(`Retrying with best available provider...`);
        return this.getEarnings(symbol, limit, 'auto');
      }
      
      throw new ApiError(`Failed to get earnings for ${symbol}`, 
        error instanceof ApiError ? error.status : undefined);
    }
  }

  /**
   * Get economic data from Quandl (Quandl-specific method)
   * @param code - Quandl dataset code (e.g., 'FRED/GDP')
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @returns Promise with economic data
   */
  public async getEconomicData(
    code: string,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    // This method is specific to Quandl
    if (API_KEYS.quandl && !DATA_SOURCE_CONFIG.forceMockData) {
      try {
        return await quandlService.getEconomicData(code, startDate, endDate);
      } catch (error) {
        console.error(`Error getting economic data for ${code}:`, error);
        throw error;
      }
    } else {
      // Return mock economic data
      return {
        name: `${code} Dataset`,
        description: `Economic data for ${code}`,
        columns: ['Date', 'Value'],
        data: this.generateMockEconomicData(startDate, endDate),
        startDate: startDate || '2020-01-01',
        endDate: endDate || new Date().toISOString().split('T')[0],
        frequency: 'quarterly'
      };
    }
  }

  /**
   * Generate mock economic data
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Array of [date, value] pairs
   */
  private generateMockEconomicData(startDate?: string, endDate?: string): [string, number][] {
    const start = startDate ? new Date(startDate) : new Date('2020-01-01');
    const end = endDate ? new Date(endDate) : new Date();
    const data: [string, number][] = [];
    
    let current = new Date(start);
    let baseValue = 100;
    
    while (current <= end) {
      // Add some randomness to the value
      const randomFactor = 0.95 + Math.random() * 0.1; // 0.95-1.05
      const value = baseValue * randomFactor;
      
      data.push([current.toISOString().split('T')[0], value]);
      
      // Increase the base value slightly for an upward trend
      baseValue *= 1.01;
      
      // Move to the next quarter
      current.setMonth(current.getMonth() + 3);
    }
    
    return data;
  }
}

// Export singleton instance
export const financialDataService = FinancialDataServiceFactory.getInstance();