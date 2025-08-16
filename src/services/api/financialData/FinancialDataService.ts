import { BaseApiService } from '../BaseApiService';

/**
 * Income statement period
 */
export type FinancialPeriod = 'annual' | 'quarterly';

/**
 * Common interface for financial statement data
 */
export interface IncomeStatement {
  fiscalDate: string;
  reportDate: string;
  period: FinancialPeriod;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  operatingExpense: number;
  operatingIncome: number;
  netIncome: number;
  eps: number;
  ebitda: number;
}

/**
 * Common interface for balance sheet data
 */
export interface BalanceSheet {
  fiscalDate: string;
  reportDate: string;
  period: FinancialPeriod;
  totalAssets: number;
  currentAssets: number;
  cash: number;
  totalLiabilities: number;
  currentLiabilities: number;
  totalEquity: number;
  longTermDebt: number;
  shortTermDebt: number;
}

/**
 * Common interface for cash flow statement data
 */
export interface CashFlowStatement {
  fiscalDate: string;
  reportDate: string;
  period: FinancialPeriod;
  operatingCashFlow: number;
  capitalExpenditures: number;
  freeCashFlow: number;
  cashFromInvesting: number;
  cashFromFinancing: number;
  netChangeInCash: number;
}

/**
 * Common interface for company profile data
 */
export interface CompanyProfile {
  symbol: string;
  name: string;
  exchange: string;
  industry: string;
  sector: string;
  description: string;
  website: string;
  employees: number;
  ceo: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

/**
 * Common interface for key financial ratios
 */
export interface FinancialRatios {
  symbol: string;
  date: string;
  period: FinancialPeriod;
  peRatio: number;
  pbRatio: number;
  psRatio: number;
  evToEbitda: number;
  evToRevenue: number;
  debtToEquity: number;
  currentRatio: number;
  quickRatio: number;
  returnOnAssets: number;
  returnOnEquity: number;
  profitMargin: number;
  dividendYield: number;
  payoutRatio: number;
}

/**
 * Common interface for earnings data
 */
export interface Earnings {
  symbol: string;
  fiscalPeriod: string;
  fiscalYear: number;
  reportDate: string;
  actualEPS: number;
  estimatedEPS: number;
  surprise: number;
  surprisePercent: number;
}

/**
 * Base interface for financial data services
 */
export interface IFinancialDataService {
  /**
   * Get income statements for a company
   * @param symbol - Stock symbol
   * @param period - Financial period (annual or quarterly)
   * @param limit - Maximum number of statements to return
   * @returns Promise with income statements
   */
  getIncomeStatements(symbol: string, period?: FinancialPeriod, limit?: number): Promise<IncomeStatement[]>;

  /**
   * Get balance sheets for a company
   * @param symbol - Stock symbol
   * @param period - Financial period (annual or quarterly)
   * @param limit - Maximum number of statements to return
   * @returns Promise with balance sheets
   */
  getBalanceSheets(symbol: string, period?: FinancialPeriod, limit?: number): Promise<BalanceSheet[]>;

  /**
   * Get cash flow statements for a company
   * @param symbol - Stock symbol
   * @param period - Financial period (annual or quarterly)
   * @param limit - Maximum number of statements to return
   * @returns Promise with cash flow statements
   */
  getCashFlowStatements(symbol: string, period?: FinancialPeriod, limit?: number): Promise<CashFlowStatement[]>;

  /**
   * Get company profile
   * @param symbol - Stock symbol
   * @returns Promise with company profile
   */
  getCompanyProfile(symbol: string): Promise<CompanyProfile>;

  /**
   * Get financial ratios for a company
   * @param symbol - Stock symbol
   * @param period - Financial period (annual or quarterly)
   * @returns Promise with financial ratios
   */
  getFinancialRatios(symbol: string, period?: FinancialPeriod): Promise<FinancialRatios>;

  /**
   * Get earnings data for a company
   * @param symbol - Stock symbol
   * @param limit - Maximum number of earnings reports to return
   * @returns Promise with earnings data
   */
  getEarnings(symbol: string, limit?: number): Promise<Earnings[]>;
}