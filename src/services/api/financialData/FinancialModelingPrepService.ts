import { BaseApiService, ApiError } from '../BaseApiService';
import { API_KEYS, DATA_SOURCE_CONFIG } from '../../../config/apiConfig';
import { AxiosRequestConfig } from 'axios';
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

/**
 * Financial Modeling Prep API service for financial data
 */
export class FinancialModelingPrepService extends BaseApiService implements IFinancialDataService {
  private readonly apiKey: string;

  /**
   * Constructor
   */
  constructor() {
    super('https://financialmodelingprep.com/api/v3');
    this.apiKey = API_KEYS.financialModelingPrep || '';
  }

  /**
   * Check if the service is available
   * @returns True if the API key is configured and not using mock data
   */
  public isAvailable(): boolean {
    return Boolean(this.apiKey) && !DATA_SOURCE_CONFIG.forceMockData;
  }

  /**
   * Request interceptor to add API key
   * @param config - Axios request config
   * @returns Modified config with API key
   */
  protected requestInterceptor(config: AxiosRequestConfig): AxiosRequestConfig {
    // Call parent interceptor
    config = super.requestInterceptor(config);
    
    // Add API key to query parameters
    config.params = {
      ...config.params,
      apikey: this.apiKey
    };
    
    return config;
  }

  /**
   * Get income statements for a company
   * @param symbol - Stock symbol
   * @param period - Financial period (annual or quarterly)
   * @param limit - Maximum number of statements to return
   * @returns Promise with income statements
   */
  public async getIncomeStatements(
    symbol: string, 
    period: FinancialPeriod = 'annual', 
    limit: number = 5
  ): Promise<IncomeStatement[]> {
    try {
      const endpoint = period === 'annual' ? 
        `/income-statement/${symbol}` : 
        `/income-statement/${symbol}?period=quarter`;
      
      const cacheOptions = {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.fundamentalData,
        key: `fmp-income-${symbol}-${period}`
      };
      
      const response = await this.get<any[]>(endpoint, { params: { limit } }, cacheOptions);
      
      return response.map(item => ({
        fiscalDate: item.date,
        reportDate: item.fillingDate || item.date,
        period: period,
        revenue: item.revenue,
        costOfRevenue: item.costOfRevenue,
        grossProfit: item.grossProfit,
        operatingExpense: item.operatingExpenses,
        operatingIncome: item.operatingIncome,
        netIncome: item.netIncome,
        eps: item.eps,
        ebitda: item.ebitda
      }));
    } catch (error) {
      console.error(`Error fetching income statements for ${symbol} from Financial Modeling Prep:`, error);
      throw error;
    }
  }

  /**
   * Get balance sheets for a company
   * @param symbol - Stock symbol
   * @param period - Financial period (annual or quarterly)
   * @param limit - Maximum number of statements to return
   * @returns Promise with balance sheets
   */
  public async getBalanceSheets(
    symbol: string, 
    period: FinancialPeriod = 'annual', 
    limit: number = 5
  ): Promise<BalanceSheet[]> {
    try {
      const endpoint = period === 'annual' ? 
        `/balance-sheet-statement/${symbol}` : 
        `/balance-sheet-statement/${symbol}?period=quarter`;
      
      const cacheOptions = {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.fundamentalData,
        key: `fmp-balance-${symbol}-${period}`
      };
      
      const response = await this.get<any[]>(endpoint, { params: { limit } }, cacheOptions);
      
      return response.map(item => ({
        fiscalDate: item.date,
        reportDate: item.fillingDate || item.date,
        period: period,
        totalAssets: item.totalAssets,
        currentAssets: item.totalCurrentAssets,
        cash: item.cashAndCashEquivalents,
        totalLiabilities: item.totalLiabilities,
        currentLiabilities: item.totalCurrentLiabilities,
        totalEquity: item.totalStockholdersEquity,
        longTermDebt: item.longTermDebt,
        shortTermDebt: item.shortTermDebt
      }));
    } catch (error) {
      console.error(`Error fetching balance sheets for ${symbol} from Financial Modeling Prep:`, error);
      throw error;
    }
  }

  /**
   * Get cash flow statements for a company
   * @param symbol - Stock symbol
   * @param period - Financial period (annual or quarterly)
   * @param limit - Maximum number of statements to return
   * @returns Promise with cash flow statements
   */
  public async getCashFlowStatements(
    symbol: string, 
    period: FinancialPeriod = 'annual', 
    limit: number = 5
  ): Promise<CashFlowStatement[]> {
    try {
      const endpoint = period === 'annual' ? 
        `/cash-flow-statement/${symbol}` : 
        `/cash-flow-statement/${symbol}?period=quarter`;
      
      const cacheOptions = {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.fundamentalData,
        key: `fmp-cashflow-${symbol}-${period}`
      };
      
      const response = await this.get<any[]>(endpoint, { params: { limit } }, cacheOptions);
      
      return response.map(item => ({
        fiscalDate: item.date,
        reportDate: item.fillingDate || item.date,
        period: period,
        operatingCashFlow: item.operatingCashFlow,
        capitalExpenditures: item.capitalExpenditure,
        freeCashFlow: item.freeCashFlow,
        cashFromInvesting: item.netCashUsedForInvestingActivites,
        cashFromFinancing: item.netCashUsedProvidedByFinancingActivities,
        netChangeInCash: item.netChangeInCash
      }));
    } catch (error) {
      console.error(`Error fetching cash flow statements for ${symbol} from Financial Modeling Prep:`, error);
      throw error;
    }
  }

  /**
   * Get company profile
   * @param symbol - Stock symbol
   * @returns Promise with company profile
   */
  public async getCompanyProfile(symbol: string): Promise<CompanyProfile> {
    try {
      const cacheOptions = {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.fundamentalData,
        key: `fmp-profile-${symbol}`
      };
      
      const response = await this.get<any[]>(`/profile/${symbol}`, {}, cacheOptions);
      
      if (!response || response.length === 0) {
        throw new ApiError(`No profile data found for ${symbol}`, 404);
      }
      
      const profile = response[0];
      
      return {
        symbol: profile.symbol,
        name: profile.companyName,
        exchange: profile.exchange,
        industry: profile.industry,
        sector: profile.sector,
        description: profile.description,
        website: profile.website,
        employees: profile.fullTimeEmployees || 0,
        ceo: profile.ceo,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        zip: profile.zip,
        country: profile.country,
        phone: profile.phone
      };
    } catch (error) {
      console.error(`Error fetching company profile for ${symbol} from Financial Modeling Prep:`, error);
      throw error;
    }
  }

  /**
   * Get financial ratios for a company
   * @param symbol - Stock symbol
   * @param period - Financial period (annual or quarterly)
   * @returns Promise with financial ratios
   */
  public async getFinancialRatios(
    symbol: string, 
    period: FinancialPeriod = 'annual'
  ): Promise<FinancialRatios> {
    try {
      const endpoint = period === 'annual' ? 
        `/ratios/${symbol}` : 
        `/ratios/${symbol}?period=quarter`;
      
      const cacheOptions = {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.fundamentalData,
        key: `fmp-ratios-${symbol}-${period}`
      };
      
      const response = await this.get<any[]>(endpoint, {}, cacheOptions);
      
      if (!response || response.length === 0) {
        throw new ApiError(`No financial ratios found for ${symbol}`, 404);
      }
      
      const ratios = response[0];
      
      return {
        symbol: symbol,
        date: ratios.date,
        period: period,
        peRatio: ratios.peRatio || 0,
        pbRatio: ratios.priceToBookRatio || 0,
        psRatio: ratios.priceToSalesRatio || 0,
        evToEbitda: ratios.enterpriseValueMultiple || 0,
        evToRevenue: ratios.evToSales || 0,
        debtToEquity: ratios.debtToEquity || 0,
        currentRatio: ratios.currentRatio || 0,
        quickRatio: ratios.quickRatio || 0,
        returnOnAssets: ratios.returnOnAssets || 0,
        returnOnEquity: ratios.returnOnEquity || 0,
        profitMargin: ratios.netProfitMargin || 0,
        dividendYield: ratios.dividendYield || 0,
        payoutRatio: ratios.payoutRatio || 0
      };
    } catch (error) {
      console.error(`Error fetching financial ratios for ${symbol} from Financial Modeling Prep:`, error);
      throw error;
    }
  }

  /**
   * Get earnings data for a company
   * @param symbol - Stock symbol
   * @param limit - Maximum number of earnings reports to return
   * @returns Promise with earnings data
   */
  public async getEarnings(symbol: string, limit: number = 4): Promise<Earnings[]> {
    try {
      const cacheOptions = {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.fundamentalData,
        key: `fmp-earnings-${symbol}`
      };
      
      const response = await this.get<any[]>(`/earnings/${symbol}`, { params: { limit } }, cacheOptions);
      
      return response.map(item => ({
        symbol: symbol,
        fiscalPeriod: item.period,
        fiscalYear: parseInt(item.year),
        reportDate: item.date,
        actualEPS: item.eps,
        estimatedEPS: item.epsEstimated,
        surprise: item.eps - item.epsEstimated,
        surprisePercent: ((item.eps - item.epsEstimated) / item.epsEstimated) * 100
      }));
    } catch (error) {
      console.error(`Error fetching earnings for ${symbol} from Financial Modeling Prep:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const financialModelingPrepService = new FinancialModelingPrepService();