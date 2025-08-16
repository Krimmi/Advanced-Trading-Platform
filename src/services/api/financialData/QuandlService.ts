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
 * Quandl API service for financial data
 * Note: Quandl specializes in alternative data, so some standard financial data
 * methods will be implemented with limited functionality or return placeholder data.
 */
export class QuandlService extends BaseApiService implements IFinancialDataService {
  private readonly apiKey: string;

  /**
   * Constructor
   */
  constructor() {
    super('https://www.quandl.com/api/v3');
    this.apiKey = API_KEYS.quandl || '';
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
      api_key: this.apiKey
    };
    
    return config;
  }

  /**
   * Get income statements for a company
   * @param symbol - Stock symbol
   * @param period - Financial period (annual or quarterly)
   * @param limit - Maximum number of statements to return
   * @returns Promise with income statements
   * 
   * Note: Quandl doesn't provide direct income statement data in the same format.
   * This method attempts to get data from the Core US Fundamentals dataset if available.
   */
  public async getIncomeStatements(
    symbol: string, 
    period: FinancialPeriod = 'annual', 
    limit: number = 5
  ): Promise<IncomeStatement[]> {
    try {
      // For Quandl, we'll use the Core US Fundamentals dataset (SF1)
      // This requires a premium subscription, so this is a simplified implementation
      const frequency = period === 'annual' ? 'ARY' : 'QTR';
      
      const cacheOptions = {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.fundamentalData,
        key: `quandl-income-${symbol}-${period}`
      };
      
      // Get revenue data
      const revenueResponse = await this.get<any>(
        `/datasets/SF1/${symbol}_REVENUE_${frequency}.json`, 
        { params: { limit } }, 
        cacheOptions
      );
      
      // Get net income data
      const netIncomeResponse = await this.get<any>(
        `/datasets/SF1/${symbol}_NETINC_${frequency}.json`, 
        { params: { limit } }, 
        cacheOptions
      );
      
      // Get EBITDA data
      const ebitdaResponse = await this.get<any>(
        `/datasets/SF1/${symbol}_EBITDA_${frequency}.json`, 
        { params: { limit } }, 
        cacheOptions
      );
      
      // Get EPS data
      const epsResponse = await this.get<any>(
        `/datasets/SF1/${symbol}_EPS_${frequency}.json`, 
        { params: { limit } }, 
        cacheOptions
      );
      
      // Combine the data
      const statements: IncomeStatement[] = [];
      
      for (let i = 0; i < Math.min(limit, revenueResponse.dataset.data.length); i++) {
        const revenueData = revenueResponse.dataset.data[i];
        const netIncomeData = netIncomeResponse.dataset.data[i];
        const ebitdaData = ebitdaResponse.dataset.data[i];
        const epsData = epsResponse.dataset.data[i];
        
        statements.push({
          fiscalDate: revenueData[0],
          reportDate: revenueData[0],
          period: period,
          revenue: revenueData[1],
          costOfRevenue: 0, // Not directly available
          grossProfit: 0, // Not directly available
          operatingExpense: 0, // Not directly available
          operatingIncome: 0, // Not directly available
          netIncome: netIncomeData[1],
          eps: epsData[1],
          ebitda: ebitdaData[1]
        });
      }
      
      return statements;
    } catch (error) {
      console.error(`Error fetching income statements for ${symbol} from Quandl:`, error);
      throw error;
    }
  }

  /**
   * Get balance sheets for a company
   * @param symbol - Stock symbol
   * @param period - Financial period (annual or quarterly)
   * @param limit - Maximum number of statements to return
   * @returns Promise with balance sheets
   * 
   * Note: Quandl doesn't provide direct balance sheet data in the same format.
   * This method attempts to get data from the Core US Fundamentals dataset if available.
   */
  public async getBalanceSheets(
    symbol: string, 
    period: FinancialPeriod = 'annual', 
    limit: number = 5
  ): Promise<BalanceSheet[]> {
    try {
      // For Quandl, we'll use the Core US Fundamentals dataset (SF1)
      // This requires a premium subscription, so this is a simplified implementation
      const frequency = period === 'annual' ? 'ARY' : 'QTR';
      
      const cacheOptions = {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.fundamentalData,
        key: `quandl-balance-${symbol}-${period}`
      };
      
      // Get assets data
      const assetsResponse = await this.get<any>(
        `/datasets/SF1/${symbol}_ASSETS_${frequency}.json`, 
        { params: { limit } }, 
        cacheOptions
      );
      
      // Get current assets data
      const currentAssetsResponse = await this.get<any>(
        `/datasets/SF1/${symbol}_ASSETSC_${frequency}.json`, 
        { params: { limit } }, 
        cacheOptions
      );
      
      // Get cash data
      const cashResponse = await this.get<any>(
        `/datasets/SF1/${symbol}_CASHNEQ_${frequency}.json`, 
        { params: { limit } }, 
        cacheOptions
      );
      
      // Get liabilities data
      const liabilitiesResponse = await this.get<any>(
        `/datasets/SF1/${symbol}_LIABILITIES_${frequency}.json`, 
        { params: { limit } }, 
        cacheOptions
      );
      
      // Get current liabilities data
      const currentLiabilitiesResponse = await this.get<any>(
        `/datasets/SF1/${symbol}_LIABILITIESC_${frequency}.json`, 
        { params: { limit } }, 
        cacheOptions
      );
      
      // Get equity data
      const equityResponse = await this.get<any>(
        `/datasets/SF1/${symbol}_EQUITY_${frequency}.json`, 
        { params: { limit } }, 
        cacheOptions
      );
      
      // Get debt data
      const debtResponse = await this.get<any>(
        `/datasets/SF1/${symbol}_DEBT_${frequency}.json`, 
        { params: { limit } }, 
        cacheOptions
      );
      
      // Combine the data
      const balanceSheets: BalanceSheet[] = [];
      
      for (let i = 0; i < Math.min(limit, assetsResponse.dataset.data.length); i++) {
        const assetsData = assetsResponse.dataset.data[i];
        const currentAssetsData = currentAssetsResponse.dataset.data[i];
        const cashData = cashResponse.dataset.data[i];
        const liabilitiesData = liabilitiesResponse.dataset.data[i];
        const currentLiabilitiesData = currentLiabilitiesResponse.dataset.data[i];
        const equityData = equityResponse.dataset.data[i];
        const debtData = debtResponse.dataset.data[i];
        
        balanceSheets.push({
          fiscalDate: assetsData[0],
          reportDate: assetsData[0],
          period: period,
          totalAssets: assetsData[1],
          currentAssets: currentAssetsData[1],
          cash: cashData[1],
          totalLiabilities: liabilitiesData[1],
          currentLiabilities: currentLiabilitiesData[1],
          totalEquity: equityData[1],
          longTermDebt: debtData[1] - (currentLiabilitiesData[1] - currentAssetsData[1]), // Approximation
          shortTermDebt: currentLiabilitiesData[1] - currentAssetsData[1] // Approximation
        });
      }
      
      return balanceSheets;
    } catch (error) {
      console.error(`Error fetching balance sheets for ${symbol} from Quandl:`, error);
      throw error;
    }
  }

  /**
   * Get cash flow statements for a company
   * @param symbol - Stock symbol
   * @param period - Financial period (annual or quarterly)
   * @param limit - Maximum number of statements to return
   * @returns Promise with cash flow statements
   * 
   * Note: Quandl doesn't provide direct cash flow statement data in the same format.
   * This method attempts to get data from the Core US Fundamentals dataset if available.
   */
  public async getCashFlowStatements(
    symbol: string, 
    period: FinancialPeriod = 'annual', 
    limit: number = 5
  ): Promise<CashFlowStatement[]> {
    try {
      // For Quandl, we'll use the Core US Fundamentals dataset (SF1)
      // This requires a premium subscription, so this is a simplified implementation
      const frequency = period === 'annual' ? 'ARY' : 'QTR';
      
      const cacheOptions = {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.fundamentalData,
        key: `quandl-cashflow-${symbol}-${period}`
      };
      
      // Get operating cash flow data
      const ocfResponse = await this.get<any>(
        `/datasets/SF1/${symbol}_NCFO_${frequency}.json`, 
        { params: { limit } }, 
        cacheOptions
      );
      
      // Get capital expenditures data
      const capexResponse = await this.get<any>(
        `/datasets/SF1/${symbol}_CAPEX_${frequency}.json`, 
        { params: { limit } }, 
        cacheOptions
      );
      
      // Get free cash flow data
      const fcfResponse = await this.get<any>(
        `/datasets/SF1/${symbol}_FCF_${frequency}.json`, 
        { params: { limit } }, 
        cacheOptions
      );
      
      // Get investing cash flow data
      const icfResponse = await this.get<any>(
        `/datasets/SF1/${symbol}_NCFI_${frequency}.json`, 
        { params: { limit } }, 
        cacheOptions
      );
      
      // Get financing cash flow data
      const fcffResponse = await this.get<any>(
        `/datasets/SF1/${symbol}_NCFF_${frequency}.json`, 
        { params: { limit } }, 
        cacheOptions
      );
      
      // Combine the data
      const cashFlowStatements: CashFlowStatement[] = [];
      
      for (let i = 0; i < Math.min(limit, ocfResponse.dataset.data.length); i++) {
        const ocfData = ocfResponse.dataset.data[i];
        const capexData = capexResponse.dataset.data[i];
        const fcfData = fcfResponse.dataset.data[i];
        const icfData = icfResponse.dataset.data[i];
        const fcffData = fcffResponse.dataset.data[i];
        
        cashFlowStatements.push({
          fiscalDate: ocfData[0],
          reportDate: ocfData[0],
          period: period,
          operatingCashFlow: ocfData[1],
          capitalExpenditures: capexData[1],
          freeCashFlow: fcfData[1],
          cashFromInvesting: icfData[1],
          cashFromFinancing: fcffData[1],
          netChangeInCash: ocfData[1] + icfData[1] + fcffData[1] // Sum of the three cash flows
        });
      }
      
      return cashFlowStatements;
    } catch (error) {
      console.error(`Error fetching cash flow statements for ${symbol} from Quandl:`, error);
      throw error;
    }
  }

  /**
   * Get company profile
   * @param symbol - Stock symbol
   * @returns Promise with company profile
   * 
   * Note: Quandl doesn't provide comprehensive company profile data.
   * This method returns limited information.
   */
  public async getCompanyProfile(symbol: string): Promise<CompanyProfile> {
    try {
      // Quandl doesn't have a direct company profile endpoint
      // We'll use the WIKI dataset to get basic information
      const cacheOptions = {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.fundamentalData,
        key: `quandl-profile-${symbol}`
      };
      
      const response = await this.get<any>(
        `/datasets/WIKI/${symbol}/metadata.json`, 
        {}, 
        cacheOptions
      );
      
      if (!response || !response.dataset) {
        throw new ApiError(`No profile data found for ${symbol}`, 404);
      }
      
      // Extract what information we can
      return {
        symbol: symbol,
        name: response.dataset.name.split('(')[0].trim(),
        exchange: 'Unknown', // Not provided by Quandl
        industry: 'Unknown', // Not provided by Quandl
        sector: 'Unknown', // Not provided by Quandl
        description: response.dataset.description || '',
        website: '', // Not provided by Quandl
        employees: 0, // Not provided by Quandl
        ceo: '', // Not provided by Quandl
        address: '', // Not provided by Quandl
        city: '', // Not provided by Quandl
        state: '', // Not provided by Quandl
        zip: '', // Not provided by Quandl
        country: '', // Not provided by Quandl
        phone: '' // Not provided by Quandl
      };
    } catch (error) {
      console.error(`Error fetching company profile for ${symbol} from Quandl:`, error);
      throw error;
    }
  }

  /**
   * Get financial ratios for a company
   * @param symbol - Stock symbol
   * @param period - Financial period (annual or quarterly)
   * @returns Promise with financial ratios
   * 
   * Note: Quandl doesn't provide direct financial ratios in the same format.
   * This method attempts to get data from the Core US Fundamentals dataset if available.
   */
  public async getFinancialRatios(
    symbol: string, 
    period: FinancialPeriod = 'annual'
  ): Promise<FinancialRatios> {
    try {
      // For Quandl, we'll use the Core US Fundamentals dataset (SF1)
      // This requires a premium subscription, so this is a simplified implementation
      const frequency = period === 'annual' ? 'ARY' : 'QTR';
      
      const cacheOptions = {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.fundamentalData,
        key: `quandl-ratios-${symbol}-${period}`
      };
      
      // Get PE ratio data
      const peResponse = await this.get<any>(
        `/datasets/SF1/${symbol}_PE_${frequency}.json`, 
        {}, 
        cacheOptions
      );
      
      // Get PB ratio data
      const pbResponse = await this.get<any>(
        `/datasets/SF1/${symbol}_PB_${frequency}.json`, 
        {}, 
        cacheOptions
      );
      
      // Get PS ratio data
      const psResponse = await this.get<any>(
        `/datasets/SF1/${symbol}_PS_${frequency}.json`, 
        {}, 
        cacheOptions
      );
      
      // Get ROA data
      const roaResponse = await this.get<any>(
        `/datasets/SF1/${symbol}_ROA_${frequency}.json`, 
        {}, 
        cacheOptions
      );
      
      // Get ROE data
      const roeResponse = await this.get<any>(
        `/datasets/SF1/${symbol}_ROE_${frequency}.json`, 
        {}, 
        cacheOptions
      );
      
      // Get profit margin data
      const pmResponse = await this.get<any>(
        `/datasets/SF1/${symbol}_NETMARGIN_${frequency}.json`, 
        {}, 
        cacheOptions
      );
      
      // Get dividend yield data
      const dyResponse = await this.get<any>(
        `/datasets/SF1/${symbol}_DIVYIELD_${frequency}.json`, 
        {}, 
        cacheOptions
      );
      
      // Extract the most recent data
      const peData = peResponse.dataset.data[0];
      const pbData = pbResponse.dataset.data[0];
      const psData = psResponse.dataset.data[0];
      const roaData = roaResponse.dataset.data[0];
      const roeData = roeResponse.dataset.data[0];
      const pmData = pmResponse.dataset.data[0];
      const dyData = dyResponse.dataset.data[0];
      
      return {
        symbol: symbol,
        date: peData[0],
        period: period,
        peRatio: peData[1],
        pbRatio: pbData[1],
        psRatio: psData[1],
        evToEbitda: 0, // Not directly available
        evToRevenue: 0, // Not directly available
        debtToEquity: 0, // Not directly available
        currentRatio: 0, // Not directly available
        quickRatio: 0, // Not directly available
        returnOnAssets: roaData[1],
        returnOnEquity: roeData[1],
        profitMargin: pmData[1],
        dividendYield: dyData[1],
        payoutRatio: 0 // Not directly available
      };
    } catch (error) {
      console.error(`Error fetching financial ratios for ${symbol} from Quandl:`, error);
      throw error;
    }
  }

  /**
   * Get earnings data for a company
   * @param symbol - Stock symbol
   * @param limit - Maximum number of earnings reports to return
   * @returns Promise with earnings data
   * 
   * Note: Quandl doesn't provide direct earnings data in the same format.
   * This method attempts to get data from the Core US Fundamentals dataset if available.
   */
  public async getEarnings(symbol: string, limit: number = 4): Promise<Earnings[]> {
    try {
      // For Quandl, we'll use the Core US Fundamentals dataset (SF1)
      // This requires a premium subscription, so this is a simplified implementation
      const cacheOptions = {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.fundamentalData,
        key: `quandl-earnings-${symbol}`
      };
      
      // Get EPS data for quarterly reports
      const epsResponse = await this.get<any>(
        `/datasets/SF1/${symbol}_EPS_QTR.json`, 
        { params: { limit } }, 
        cacheOptions
      );
      
      // Quandl doesn't provide estimated EPS, so we'll return actual EPS only
      const earnings: Earnings[] = [];
      
      for (let i = 0; i < Math.min(limit, epsResponse.dataset.data.length); i++) {
        const epsData = epsResponse.dataset.data[i];
        const date = new Date(epsData[0]);
        
        earnings.push({
          symbol: symbol,
          fiscalPeriod: `Q${Math.floor((date.getMonth() / 3) + 1)}`,
          fiscalYear: date.getFullYear(),
          reportDate: epsData[0],
          actualEPS: epsData[1],
          estimatedEPS: 0, // Not available from Quandl
          surprise: 0, // Not available from Quandl
          surprisePercent: 0 // Not available from Quandl
        });
      }
      
      return earnings;
    } catch (error) {
      console.error(`Error fetching earnings for ${symbol} from Quandl:`, error);
      throw error;
    }
  }

  /**
   * Get economic data from Quandl
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
    try {
      const params: Record<string, any> = {};
      
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const cacheOptions = {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.fundamentalData,
        key: `quandl-economic-${code}-${startDate}-${endDate}`
      };
      
      const response = await this.get<any>(`/datasets/${code}.json`, { params }, cacheOptions);
      
      return {
        name: response.dataset.name,
        description: response.dataset.description,
        columns: response.dataset.column_names,
        data: response.dataset.data,
        startDate: response.dataset.start_date,
        endDate: response.dataset.end_date,
        frequency: response.dataset.frequency
      };
    } catch (error) {
      console.error(`Error fetching economic data for ${code} from Quandl:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const quandlService = new QuandlService();