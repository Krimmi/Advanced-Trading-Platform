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
 * Mock financial data provider for development and testing
 */
export class MockFinancialDataProvider implements IFinancialDataService {
  private static instance: MockFinancialDataProvider;
  
  // Common stock symbols for realistic mock data
  private readonly commonStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', industry: 'Consumer Electronics' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', industry: 'Software—Infrastructure' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Communication Services', industry: 'Internet Content & Information' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Cyclical', industry: 'Internet Retail' },
    { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Communication Services', industry: 'Internet Content & Information' },
    { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Cyclical', industry: 'Auto Manufacturers' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology', industry: 'Semiconductors' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financial Services', industry: 'Banks—Diversified' },
    { symbol: 'V', name: 'Visa Inc.', sector: 'Financial Services', industry: 'Credit Services' },
    { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', industry: 'Drug Manufacturers—General' }
  ];

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): MockFinancialDataProvider {
    if (!MockFinancialDataProvider.instance) {
      MockFinancialDataProvider.instance = new MockFinancialDataProvider();
    }
    return MockFinancialDataProvider.instance;
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
    // Find the stock or use a default
    const stock = this.commonStocks.find(s => s.symbol === symbol) || this.commonStocks[0];
    
    // Generate mock income statements
    const statements: IncomeStatement[] = [];
    const currentYear = new Date().getFullYear();
    const baseRevenue = this.getBaseRevenue(symbol);
    
    for (let i = 0; i < limit; i++) {
      const year = currentYear - i;
      const quarter = period === 'quarterly' ? Math.floor(Math.random() * 4) + 1 : 0;
      const quarterText = period === 'quarterly' ? `-Q${quarter}` : '';
      const growthFactor = 1 + (i * 0.1); // 10% growth per year (older years have higher factor)
      
      const revenue = baseRevenue / growthFactor;
      const costOfRevenue = revenue * (0.55 + Math.random() * 0.1); // 55-65% of revenue
      const grossProfit = revenue - costOfRevenue;
      const operatingExpense = revenue * (0.2 + Math.random() * 0.05); // 20-25% of revenue
      const operatingIncome = grossProfit - operatingExpense;
      const netIncome = operatingIncome * (0.7 + Math.random() * 0.1); // 70-80% of operating income (after tax)
      const eps = netIncome / this.getOutstandingShares(symbol);
      const ebitda = operatingIncome + (revenue * 0.05); // Adding back depreciation & amortization
      
      statements.push({
        fiscalDate: `${year}${quarterText}-12-31`,
        reportDate: `${year}${quarterText}-01-30`,
        period: period,
        revenue: revenue,
        costOfRevenue: costOfRevenue,
        grossProfit: grossProfit,
        operatingExpense: operatingExpense,
        operatingIncome: operatingIncome,
        netIncome: netIncome,
        eps: eps,
        ebitda: ebitda
      });
    }
    
    return statements;
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
    // Find the stock or use a default
    const stock = this.commonStocks.find(s => s.symbol === symbol) || this.commonStocks[0];
    
    // Generate mock balance sheets
    const balanceSheets: BalanceSheet[] = [];
    const currentYear = new Date().getFullYear();
    const baseAssets = this.getBaseRevenue(symbol) * 3; // Assets are typically 3x annual revenue
    
    for (let i = 0; i < limit; i++) {
      const year = currentYear - i;
      const quarter = period === 'quarterly' ? Math.floor(Math.random() * 4) + 1 : 0;
      const quarterText = period === 'quarterly' ? `-Q${quarter}` : '';
      const growthFactor = 1 + (i * 0.1); // 10% growth per year (older years have higher factor)
      
      const totalAssets = baseAssets / growthFactor;
      const currentAssets = totalAssets * (0.3 + Math.random() * 0.1); // 30-40% of total assets
      const cash = currentAssets * (0.2 + Math.random() * 0.2); // 20-40% of current assets
      const totalLiabilities = totalAssets * (0.4 + Math.random() * 0.2); // 40-60% of total assets
      const currentLiabilities = totalLiabilities * (0.3 + Math.random() * 0.1); // 30-40% of total liabilities
      const totalEquity = totalAssets - totalLiabilities;
      const longTermDebt = totalLiabilities - currentLiabilities;
      const shortTermDebt = currentLiabilities * 0.5; // 50% of current liabilities
      
      balanceSheets.push({
        fiscalDate: `${year}${quarterText}-12-31`,
        reportDate: `${year}${quarterText}-01-30`,
        period: period,
        totalAssets: totalAssets,
        currentAssets: currentAssets,
        cash: cash,
        totalLiabilities: totalLiabilities,
        currentLiabilities: currentLiabilities,
        totalEquity: totalEquity,
        longTermDebt: longTermDebt,
        shortTermDebt: shortTermDebt
      });
    }
    
    return balanceSheets;
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
    // Find the stock or use a default
    const stock = this.commonStocks.find(s => s.symbol === symbol) || this.commonStocks[0];
    
    // Generate mock cash flow statements
    const cashFlowStatements: CashFlowStatement[] = [];
    const currentYear = new Date().getFullYear();
    const baseNetIncome = this.getBaseRevenue(symbol) * 0.15; // Net income is typically 15% of revenue
    
    for (let i = 0; i < limit; i++) {
      const year = currentYear - i;
      const quarter = period === 'quarterly' ? Math.floor(Math.random() * 4) + 1 : 0;
      const quarterText = period === 'quarterly' ? `-Q${quarter}` : '';
      const growthFactor = 1 + (i * 0.1); // 10% growth per year (older years have higher factor)
      
      const netIncome = baseNetIncome / growthFactor;
      const operatingCashFlow = netIncome * (1.1 + Math.random() * 0.2); // 110-130% of net income
      const capitalExpenditures = -1 * (operatingCashFlow * (0.3 + Math.random() * 0.2)); // 30-50% of operating cash flow
      const freeCashFlow = operatingCashFlow + capitalExpenditures;
      const cashFromInvesting = capitalExpenditures * (1.2 + Math.random() * 0.3); // 120-150% of capex (includes other investing activities)
      const cashFromFinancing = -1 * (freeCashFlow * (0.5 + Math.random() * 0.5)); // 50-100% of FCF (dividends, buybacks, debt repayment)
      const netChangeInCash = operatingCashFlow + cashFromInvesting + cashFromFinancing;
      
      cashFlowStatements.push({
        fiscalDate: `${year}${quarterText}-12-31`,
        reportDate: `${year}${quarterText}-01-30`,
        period: period,
        operatingCashFlow: operatingCashFlow,
        capitalExpenditures: capitalExpenditures,
        freeCashFlow: freeCashFlow,
        cashFromInvesting: cashFromInvesting,
        cashFromFinancing: cashFromFinancing,
        netChangeInCash: netChangeInCash
      });
    }
    
    return cashFlowStatements;
  }

  /**
   * Get company profile
   * @param symbol - Stock symbol
   * @returns Promise with company profile
   */
  public async getCompanyProfile(symbol: string): Promise<CompanyProfile> {
    // Find the stock or use a default
    const stock = this.commonStocks.find(s => s.symbol === symbol) || this.commonStocks[0];
    
    // Generate a mock profile
    return {
      symbol: stock.symbol,
      name: stock.name,
      exchange: this.getExchange(stock.symbol),
      industry: stock.industry,
      sector: stock.sector,
      description: this.getCompanyDescription(stock.symbol, stock.name, stock.industry),
      website: `https://www.${stock.symbol.toLowerCase()}.com`,
      employees: this.getEmployeeCount(stock.symbol),
      ceo: this.getCEOName(stock.symbol),
      address: `${Math.floor(Math.random() * 1000) + 1} Corporate Drive`,
      city: this.getHeadquartersCity(stock.symbol),
      state: this.getHeadquartersState(stock.symbol),
      zip: `${Math.floor(Math.random() * 90000) + 10000}`,
      country: 'United States',
      phone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`
    };
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
    // Find the stock or use a default
    const stock = this.commonStocks.find(s => s.symbol === symbol) || this.commonStocks[0];
    
    // Generate mock financial ratios
    const currentYear = new Date().getFullYear();
    const quarter = period === 'quarterly' ? Math.floor(Math.random() * 4) + 1 : 0;
    const quarterText = period === 'quarterly' ? `-Q${quarter}` : '';
    
    return {
      symbol: stock.symbol,
      date: `${currentYear}${quarterText}-12-31`,
      period: period,
      peRatio: this.getPERatio(stock.symbol),
      pbRatio: this.getPBRatio(stock.symbol),
      psRatio: this.getPSRatio(stock.symbol),
      evToEbitda: this.getEVToEbitda(stock.symbol),
      evToRevenue: this.getEVToRevenue(stock.symbol),
      debtToEquity: this.getDebtToEquity(stock.symbol),
      currentRatio: this.getCurrentRatio(stock.symbol),
      quickRatio: this.getQuickRatio(stock.symbol),
      returnOnAssets: this.getROA(stock.symbol),
      returnOnEquity: this.getROE(stock.symbol),
      profitMargin: this.getProfitMargin(stock.symbol),
      dividendYield: this.getDividendYield(stock.symbol),
      payoutRatio: this.getPayoutRatio(stock.symbol)
    };
  }

  /**
   * Get earnings data for a company
   * @param symbol - Stock symbol
   * @param limit - Maximum number of earnings reports to return
   * @returns Promise with earnings data
   */
  public async getEarnings(symbol: string, limit: number = 4): Promise<Earnings[]> {
    // Find the stock or use a default
    const stock = this.commonStocks.find(s => s.symbol === symbol) || this.commonStocks[0];
    
    // Generate mock earnings data
    const earnings: Earnings[] = [];
    const currentYear = new Date().getFullYear();
    const currentQuarter = Math.floor((new Date().getMonth() / 3)) + 1;
    
    for (let i = 0; i < limit; i++) {
      // Calculate the fiscal quarter and year
      let fiscalQuarter = currentQuarter - i;
      let fiscalYear = currentYear;
      
      while (fiscalQuarter <= 0) {
        fiscalQuarter += 4;
        fiscalYear -= 1;
      }
      
      // Generate realistic EPS values
      const baseEPS = this.getBaseEPS(stock.symbol);
      const actualEPS = baseEPS * (0.9 + Math.random() * 0.2); // 90-110% of base EPS
      const estimatedEPS = actualEPS * (0.9 + Math.random() * 0.2); // 90-110% of actual EPS
      const surprise = actualEPS - estimatedEPS;
      const surprisePercent = (surprise / estimatedEPS) * 100;
      
      // Generate report date (typically 2-4 weeks after quarter end)
      const quarterEndMonth = fiscalQuarter * 3;
      const reportDate = new Date(fiscalYear, quarterEndMonth, Math.floor(Math.random() * 20) + 10);
      
      earnings.push({
        symbol: stock.symbol,
        fiscalPeriod: `Q${fiscalQuarter}`,
        fiscalYear: fiscalYear,
        reportDate: reportDate.toISOString().split('T')[0],
        actualEPS: actualEPS,
        estimatedEPS: estimatedEPS,
        surprise: surprise,
        surprisePercent: surprisePercent
      });
    }
    
    return earnings;
  }

  // Helper methods to generate realistic mock data

  private getBaseRevenue(symbol: string): number {
    // Generate a base revenue based on the symbol
    // This ensures consistent data for the same symbol
    const symbolHash = this.hashCode(symbol);
    const baseMultiplier = (symbolHash % 100) / 10 + 1; // 1-11 range
    
    // Tech companies typically have higher revenue
    if (['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA'].includes(symbol)) {
      return baseMultiplier * 10000000000; // $10-110B
    } else {
      return baseMultiplier * 5000000000; // $5-55B
    }
  }

  private getOutstandingShares(symbol: string): number {
    // Generate outstanding shares based on the symbol
    const symbolHash = this.hashCode(symbol);
    const baseMultiplier = (symbolHash % 100) / 10 + 1; // 1-11 range
    
    return baseMultiplier * 1000000000; // 1-11B shares
  }

  private getExchange(symbol: string): string {
    // Assign an exchange based on the symbol
    const symbolHash = this.hashCode(symbol);
    const exchanges = ['NASDAQ', 'NYSE', 'NASDAQ', 'NYSE', 'NASDAQ']; // More weight to NASDAQ for tech stocks
    
    return exchanges[symbolHash % exchanges.length];
  }

  private getCompanyDescription(symbol: string, name: string, industry: string): string {
    return `${name} is a leading company in the ${industry} industry. The company specializes in developing innovative solutions for its customers worldwide. With a strong focus on research and development, ${symbol} continues to expand its market presence and deliver value to shareholders.`;
  }

  private getEmployeeCount(symbol: string): number {
    // Generate employee count based on the symbol
    const symbolHash = this.hashCode(symbol);
    const baseMultiplier = (symbolHash % 100) / 10 + 1; // 1-11 range
    
    // Tech companies typically have more employees
    if (['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'].includes(symbol)) {
      return Math.floor(baseMultiplier * 50000); // 50K-550K employees
    } else {
      return Math.floor(baseMultiplier * 20000); // 20K-220K employees
    }
  }

  private getCEOName(symbol: string): string {
    // Generate a CEO name based on the symbol
    const firstNames = ['John', 'Sarah', 'Michael', 'Emma', 'David', 'Lisa', 'Robert', 'Jennifer', 'William', 'Patricia'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson'];
    
    const symbolHash = this.hashCode(symbol);
    const firstName = firstNames[symbolHash % firstNames.length];
    const lastName = lastNames[(symbolHash + 1) % lastNames.length];
    
    return `${firstName} ${lastName}`;
  }

  private getHeadquartersCity(symbol: string): string {
    // Assign a city based on the symbol
    const cities = ['New York', 'San Francisco', 'Seattle', 'Boston', 'Chicago', 'Austin', 'Los Angeles', 'Denver', 'Atlanta', 'Dallas'];
    const symbolHash = this.hashCode(symbol);
    
    return cities[symbolHash % cities.length];
  }

  private getHeadquartersState(symbol: string): string {
    // Assign a state based on the symbol
    const states = ['NY', 'CA', 'WA', 'MA', 'IL', 'TX', 'CA', 'CO', 'GA', 'TX'];
    const symbolHash = this.hashCode(symbol);
    
    return states[symbolHash % states.length];
  }

  private getPERatio(symbol: string): number {
    // Generate a P/E ratio based on the symbol
    const symbolHash = this.hashCode(symbol);
    const baseValue = (symbolHash % 100) / 10 + 10; // 10-20 range
    
    // Tech companies typically have higher P/E ratios
    if (['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA'].includes(symbol)) {
      return baseValue * 2; // 20-40 range
    } else {
      return baseValue; // 10-20 range
    }
  }

  private getPBRatio(symbol: string): number {
    // Generate a P/B ratio based on the symbol
    const symbolHash = this.hashCode(symbol);
    const baseValue = (symbolHash % 50) / 10 + 1; // 1-6 range
    
    // Tech companies typically have higher P/B ratios
    if (['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA'].includes(symbol)) {
      return baseValue * 2; // 2-12 range
    } else {
      return baseValue; // 1-6 range
    }
  }

  private getPSRatio(symbol: string): number {
    // Generate a P/S ratio based on the symbol
    const symbolHash = this.hashCode(symbol);
    const baseValue = (symbolHash % 40) / 10 + 1; // 1-5 range
    
    // Tech companies typically have higher P/S ratios
    if (['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA'].includes(symbol)) {
      return baseValue * 2; // 2-10 range
    } else {
      return baseValue; // 1-5 range
    }
  }

  private getEVToEbitda(symbol: string): number {
    // Generate an EV/EBITDA ratio based on the symbol
    const symbolHash = this.hashCode(symbol);
    return (symbolHash % 100) / 10 + 5; // 5-15 range
  }

  private getEVToRevenue(symbol: string): number {
    // Generate an EV/Revenue ratio based on the symbol
    const symbolHash = this.hashCode(symbol);
    return (symbolHash % 50) / 10 + 1; // 1-6 range
  }

  private getDebtToEquity(symbol: string): number {
    // Generate a Debt/Equity ratio based on the symbol
    const symbolHash = this.hashCode(symbol);
    return (symbolHash % 100) / 100 + 0.2; // 0.2-1.2 range
  }

  private getCurrentRatio(symbol: string): number {
    // Generate a Current Ratio based on the symbol
    const symbolHash = this.hashCode(symbol);
    return (symbolHash % 100) / 100 + 1; // 1.0-2.0 range
  }

  private getQuickRatio(symbol: string): number {
    // Generate a Quick Ratio based on the symbol
    const symbolHash = this.hashCode(symbol);
    return (symbolHash % 100) / 100 + 0.5; // 0.5-1.5 range
  }

  private getROA(symbol: string): number {
    // Generate a Return on Assets based on the symbol
    const symbolHash = this.hashCode(symbol);
    return (symbolHash % 100) / 1000 + 0.02; // 2-12% range
  }

  private getROE(symbol: string): number {
    // Generate a Return on Equity based on the symbol
    const symbolHash = this.hashCode(symbol);
    return (symbolHash % 100) / 500 + 0.05; // 5-25% range
  }

  private getProfitMargin(symbol: string): number {
    // Generate a Profit Margin based on the symbol
    const symbolHash = this.hashCode(symbol);
    
    // Tech companies typically have higher profit margins
    if (['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA'].includes(symbol)) {
      return (symbolHash % 100) / 500 + 0.15; // 15-35% range
    } else {
      return (symbolHash % 100) / 1000 + 0.05; // 5-15% range
    }
  }

  private getDividendYield(symbol: string): number {
    // Generate a Dividend Yield based on the symbol
    const symbolHash = this.hashCode(symbol);
    
    // Tech companies typically have lower dividend yields
    if (['AAPL', 'MSFT'].includes(symbol)) {
      return (symbolHash % 100) / 1000 + 0.005; // 0.5-1.5% range
    } else if (['GOOGL', 'AMZN', 'META', 'TSLA'].includes(symbol)) {
      return 0; // No dividend
    } else {
      return (symbolHash % 100) / 500 + 0.01; // 1-3% range
    }
  }

  private getPayoutRatio(symbol: string): number {
    // Generate a Payout Ratio based on the symbol
    const symbolHash = this.hashCode(symbol);
    
    // Tech companies typically have lower payout ratios
    if (['GOOGL', 'AMZN', 'META', 'TSLA'].includes(symbol)) {
      return 0; // No payout
    } else if (['AAPL', 'MSFT'].includes(symbol)) {
      return (symbolHash % 100) / 500 + 0.1; // 10-30% range
    } else {
      return (symbolHash % 100) / 250 + 0.2; // 20-60% range
    }
  }

  private getBaseEPS(symbol: string): number {
    // Generate a base EPS based on the symbol
    const symbolHash = this.hashCode(symbol);
    
    // Tech companies typically have higher EPS
    if (['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA'].includes(symbol)) {
      return (symbolHash % 100) / 10 + 2; // $2-12 range
    } else {
      return (symbolHash % 100) / 20 + 1; // $1-6 range
    }
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

// Export singleton instance
export const mockFinancialDataProvider = MockFinancialDataProvider.getInstance();