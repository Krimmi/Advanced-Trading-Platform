/**
 * Fundamental Analysis Service
 * Provides financial statement analysis, valuation models, and screening tools
 */

import { injectable, inject } from 'inversify';
import { MarketDataService } from '../market/MarketDataService';
import { LoggerService } from '../common/LoggerService';

export interface FinancialStatement {
  symbol: string;
  period: 'annual' | 'quarterly';
  fiscalYear: number;
  fiscalQuarter?: number;
  reportDate: Date;
  filingDate: Date;
  
  // Income Statement
  revenue: number;
  costOfRevenue?: number;
  grossProfit?: number;
  operatingExpenses?: number;
  operatingIncome?: number;
  netIncome: number;
  eps: number;
  dilutedEps?: number;
  
  // Balance Sheet
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  cashAndEquivalents: number;
  shortTermInvestments?: number;
  accountsReceivable?: number;
  inventory?: number;
  currentAssets?: number;
  currentLiabilities?: number;
  longTermDebt?: number;
  
  // Cash Flow Statement
  operatingCashFlow: number;
  capitalExpenditures?: number;
  freeCashFlow?: number;
  dividendsPaid?: number;
  shareRepurchase?: number;
}

export interface CompanyProfile {
  symbol: string;
  name: string;
  exchange: string;
  industry: string;
  sector: string;
  description: string;
  website: string;
  employees?: number;
  ceo?: string;
  address?: string;
  phone?: string;
  marketCap?: number;
  sharesOutstanding?: number;
}

export interface FinancialRatio {
  symbol: string;
  period: 'annual' | 'quarterly' | 'ttm';
  fiscalYear?: number;
  fiscalQuarter?: number;
  
  // Profitability Ratios
  grossMargin?: number;
  operatingMargin?: number;
  netMargin?: number;
  returnOnAssets?: number;
  returnOnEquity?: number;
  returnOnInvestedCapital?: number;
  
  // Liquidity Ratios
  currentRatio?: number;
  quickRatio?: number;
  cashRatio?: number;
  
  // Solvency Ratios
  debtToEquity?: number;
  debtToAssets?: number;
  interestCoverage?: number;
  
  // Efficiency Ratios
  assetTurnover?: number;
  inventoryTurnover?: number;
  receivablesTurnover?: number;
  
  // Valuation Ratios
  peRatio?: number;
  pbRatio?: number;
  psRatio?: number;
  pfcfRatio?: number;
  evToEbitda?: number;
  evToSales?: number;
  dividendYield?: number;
  payoutRatio?: number;
}

export interface ValuationModel {
  symbol: string;
  modelType: 'DCF' | 'DDM' | 'Comparable' | 'SOTP' | 'AssetBased';
  intrinsicValue: number;
  currentPrice: number;
  upside: number;
  assumptions: Record<string, any>;
  scenarios: {
    bearish: number;
    base: number;
    bullish: number;
  };
}

export interface ScreeningCriteria {
  marketCap?: { min?: number; max?: number };
  sector?: string[];
  industry?: string[];
  peRatio?: { min?: number; max?: number };
  pbRatio?: { min?: number; max?: number };
  dividendYield?: { min?: number; max?: number };
  returnOnEquity?: { min?: number; max?: number };
  debtToEquity?: { min?: number; max?: number };
  priceChange?: { period: 'day' | 'week' | 'month' | 'quarter' | 'year'; min?: number; max?: number };
  analystRating?: { min?: number; max?: number }; // 1-5 scale
  growthRate?: { metric: 'revenue' | 'earnings' | 'fcf'; period: 'quarterly' | 'annual'; min?: number; max?: number };
}

export interface ScreeningResult {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  marketCap: number;
  price: number;
  peRatio?: number;
  pbRatio?: number;
  dividendYield?: number;
  returnOnEquity?: number;
  debtToEquity?: number;
  priceChange?: number;
  analystRating?: number;
  growthRate?: number;
  score?: number; // Composite score based on criteria
}

@injectable()
export class FundamentalAnalysisService {
  constructor(
    @inject(MarketDataService) private marketDataService: MarketDataService,
    @inject(LoggerService) private logger: LoggerService
  ) {}

  /**
   * Gets financial statements for a company
   * @param symbol The company symbol
   * @param period The reporting period (annual or quarterly)
   * @param years The number of years to retrieve
   * @returns The financial statements
   */
  public async getFinancialStatements(
    symbol: string,
    period: 'annual' | 'quarterly' = 'annual',
    years: number = 5
  ): Promise<FinancialStatement[]> {
    this.logger.info('Getting financial statements', { symbol, period, years });
    
    try {
      // In a real implementation, this would call the market data service
      // For now, we'll generate mock data
      
      const statements: FinancialStatement[] = [];
      const currentYear = new Date().getFullYear();
      
      for (let i = 0; i < years; i++) {
        const year = currentYear - i;
        
        if (period === 'annual') {
          statements.push(this.generateMockFinancialStatement(symbol, 'annual', year));
        } else {
          // Generate quarterly statements
          for (let quarter = 4; quarter >= 1; quarter--) {
            statements.push(this.generateMockFinancialStatement(symbol, 'quarterly', year, quarter));
          }
        }
      }
      
      return statements;
    } catch (error) {
      this.logger.error('Error getting financial statements', { 
        symbol, 
        period, 
        years, 
        error: error.message 
      });
      
      throw error;
    }
  }

  /**
   * Gets company profile information
   * @param symbol The company symbol
   * @returns The company profile
   */
  public async getCompanyProfile(symbol: string): Promise<CompanyProfile> {
    this.logger.info('Getting company profile', { symbol });
    
    try {
      // In a real implementation, this would call the market data service
      // For now, we'll generate mock data
      
      return this.generateMockCompanyProfile(symbol);
    } catch (error) {
      this.logger.error('Error getting company profile', { 
        symbol, 
        error: error.message 
      });
      
      throw error;
    }
  }

  /**
   * Calculates financial ratios for a company
   * @param symbol The company symbol
   * @param period The reporting period (annual, quarterly, or ttm)
   * @returns The financial ratios
   */
  public async calculateFinancialRatios(
    symbol: string,
    period: 'annual' | 'quarterly' | 'ttm' = 'ttm'
  ): Promise<FinancialRatio> {
    this.logger.info('Calculating financial ratios', { symbol, period });
    
    try {
      // Get financial statements
      const statements = await this.getFinancialStatements(
        symbol, 
        period === 'ttm' ? 'quarterly' : period,
        period === 'ttm' ? 1 : 1
      );
      
      if (statements.length === 0) {
        throw new Error('No financial statements available');
      }
      
      // Calculate ratios
      let statement: FinancialStatement;
      
      if (period === 'ttm') {
        // Use the last 4 quarters
        // In a real implementation, we would sum up the last 4 quarters
        statement = statements[0];
      } else {
        statement = statements[0];
      }
      
      return this.calculateRatios(statement);
    } catch (error) {
      this.logger.error('Error calculating financial ratios', { 
        symbol, 
        period, 
        error: error.message 
      });
      
      throw error;
    }
  }

  /**
   * Performs a discounted cash flow (DCF) valuation
   * @param symbol The company symbol
   * @param growthRate The projected growth rate
   * @param discountRate The discount rate
   * @param years The number of years to project
   * @returns The valuation model
   */
  public async performDCFValuation(
    symbol: string,
    growthRate: number = 0.1,
    discountRate: number = 0.1,
    years: number = 5
  ): Promise<ValuationModel> {
    this.logger.info('Performing DCF valuation', { symbol, growthRate, discountRate, years });
    
    try {
      // Get financial statements
      const statements = await this.getFinancialStatements(symbol, 'annual', 3);
      
      if (statements.length === 0) {
        throw new Error('No financial statements available');
      }
      
      // Get current price
      const currentPrice = await this.getCurrentPrice(symbol);
      
      // Calculate free cash flow
      const latestStatement = statements[0];
      let freeCashFlow = latestStatement.freeCashFlow || 
        (latestStatement.operatingCashFlow - (latestStatement.capitalExpenditures || 0));
      
      // Project future cash flows
      const cashFlows: number[] = [];
      for (let i = 1; i <= years; i++) {
        freeCashFlow *= (1 + growthRate);
        cashFlows.push(freeCashFlow);
      }
      
      // Calculate terminal value
      const terminalGrowthRate = 0.03; // Long-term growth rate
      const terminalValue = freeCashFlow * (1 + terminalGrowthRate) / (discountRate - terminalGrowthRate);
      
      // Discount cash flows
      let presentValue = 0;
      for (let i = 0; i < cashFlows.length; i++) {
        presentValue += cashFlows[i] / Math.pow(1 + discountRate, i + 1);
      }
      
      // Discount terminal value
      presentValue += terminalValue / Math.pow(1 + discountRate, years);
      
      // Calculate per share value
      const sharesOutstanding = latestStatement.dilutedEps ? 
        latestStatement.netIncome / latestStatement.dilutedEps : 
        1000000000; // Default to 1 billion shares if not available
      
      const intrinsicValue = presentValue / sharesOutstanding;
      
      // Calculate scenarios
      const bearishGrowth = growthRate * 0.5;
      const bullishGrowth = growthRate * 1.5;
      
      const bearishValue = this.calculateScenarioValue(
        freeCashFlow, bearishGrowth, discountRate, terminalGrowthRate, years, sharesOutstanding
      );
      
      const bullishValue = this.calculateScenarioValue(
        freeCashFlow, bullishGrowth, discountRate, terminalGrowthRate, years, sharesOutstanding
      );
      
      return {
        symbol,
        modelType: 'DCF',
        intrinsicValue,
        currentPrice,
        upside: (intrinsicValue / currentPrice) - 1,
        assumptions: {
          growthRate,
          discountRate,
          terminalGrowthRate,
          years,
          initialFreeCashFlow: freeCashFlow,
          sharesOutstanding
        },
        scenarios: {
          bearish: bearishValue,
          base: intrinsicValue,
          bullish: bullishValue
        }
      };
    } catch (error) {
      this.logger.error('Error performing DCF valuation', { 
        symbol, 
        growthRate, 
        discountRate, 
        years, 
        error: error.message 
      });
      
      throw error;
    }
  }

  /**
   * Performs a dividend discount model (DDM) valuation
   * @param symbol The company symbol
   * @param growthRate The projected dividend growth rate
   * @param discountRate The discount rate
   * @returns The valuation model
   */
  public async performDDMValuation(
    symbol: string,
    growthRate: number = 0.05,
    discountRate: number = 0.1
  ): Promise<ValuationModel> {
    this.logger.info('Performing DDM valuation', { symbol, growthRate, discountRate });
    
    try {
      // Get financial statements
      const statements = await this.getFinancialStatements(symbol, 'annual', 3);
      
      if (statements.length === 0) {
        throw new Error('No financial statements available');
      }
      
      // Get current price
      const currentPrice = await this.getCurrentPrice(symbol);
      
      // Calculate current dividend
      const latestStatement = statements[0];
      const dividend = latestStatement.dividendsPaid ? 
        Math.abs(latestStatement.dividendsPaid) / (latestStatement.dilutedEps ? 
          latestStatement.netIncome / latestStatement.dilutedEps : 
          1000000000) : 
        currentPrice * 0.02; // Default to 2% yield if not available
      
      // Calculate intrinsic value using Gordon Growth Model
      const intrinsicValue = dividend * (1 + growthRate) / (discountRate - growthRate);
      
      // Calculate scenarios
      const bearishGrowth = Math.max(growthRate * 0.5, 0.01);
      const bullishGrowth = growthRate * 1.5;
      
      const bearishValue = dividend * (1 + bearishGrowth) / (discountRate - bearishGrowth);
      const bullishValue = dividend * (1 + bullishGrowth) / (discountRate - bullishGrowth);
      
      return {
        symbol,
        modelType: 'DDM',
        intrinsicValue,
        currentPrice,
        upside: (intrinsicValue / currentPrice) - 1,
        assumptions: {
          growthRate,
          discountRate,
          currentDividend: dividend
        },
        scenarios: {
          bearish: bearishValue,
          base: intrinsicValue,
          bullish: bullishValue
        }
      };
    } catch (error) {
      this.logger.error('Error performing DDM valuation', { 
        symbol, 
        growthRate, 
        discountRate, 
        error: error.message 
      });
      
      throw error;
    }
  }

  /**
   * Performs a comparable company analysis
   * @param symbol The company symbol
   * @param comparables The comparable company symbols
   * @param metrics The metrics to compare
   * @returns The valuation model
   */
  public async performComparableAnalysis(
    symbol: string,
    comparables: string[] = [],
    metrics: ('peRatio' | 'pbRatio' | 'psRatio' | 'evToEbitda' | 'evToSales')[] = ['peRatio', 'pbRatio', 'evToEbitda']
  ): Promise<ValuationModel> {
    this.logger.info('Performing comparable analysis', { symbol, comparables, metrics });
    
    try {
      // If no comparables provided, get from same industry
      if (comparables.length === 0) {
        const profile = await this.getCompanyProfile(symbol);
        comparables = await this.getPeersInIndustry(profile.industry, 5, symbol);
      }
      
      // Get ratios for target company
      const targetRatios = await this.calculateFinancialRatios(symbol);
      
      // Get ratios for comparable companies
      const comparableRatios: FinancialRatio[] = [];
      for (const comp of comparables) {
        const ratios = await this.calculateFinancialRatios(comp);
        comparableRatios.push(ratios);
      }
      
      // Get current price
      const currentPrice = await this.getCurrentPrice(symbol);
      
      // Get financial statements for target company
      const statements = await this.getFinancialStatements(symbol, 'annual', 1);
      
      if (statements.length === 0) {
        throw new Error('No financial statements available');
      }
      
      const latestStatement = statements[0];
      
      // Calculate implied values based on each metric
      const impliedValues: Record<string, number> = {};
      
      for (const metric of metrics) {
        // Calculate average ratio for comparables
        const validRatios = comparableRatios
          .filter(ratio => ratio[metric] !== undefined && ratio[metric] !== null && ratio[metric] > 0)
          .map(ratio => ratio[metric] as number);
        
        if (validRatios.length === 0) {
          continue;
        }
        
        const avgRatio = validRatios.reduce((sum, ratio) => sum + ratio, 0) / validRatios.length;
        
        // Calculate implied value
        let impliedValue = 0;
        
        switch (metric) {
          case 'peRatio':
            impliedValue = avgRatio * latestStatement.eps;
            break;
          
          case 'pbRatio':
            impliedValue = avgRatio * (latestStatement.totalEquity / (latestStatement.dilutedEps ? 
              latestStatement.netIncome / latestStatement.dilutedEps : 
              1000000000));
            break;
          
          case 'psRatio':
            impliedValue = avgRatio * (latestStatement.revenue / (latestStatement.dilutedEps ? 
              latestStatement.netIncome / latestStatement.dilutedEps : 
              1000000000));
            break;
          
          case 'evToEbitda':
            const ebitda = latestStatement.operatingIncome || latestStatement.netIncome * 1.2;
            impliedValue = (avgRatio * ebitda - (latestStatement.longTermDebt || 0) + latestStatement.cashAndEquivalents) / 
              (latestStatement.dilutedEps ? 
                latestStatement.netIncome / latestStatement.dilutedEps : 
                1000000000);
            break;
          
          case 'evToSales':
            impliedValue = (avgRatio * latestStatement.revenue - (latestStatement.longTermDebt || 0) + latestStatement.cashAndEquivalents) / 
              (latestStatement.dilutedEps ? 
                latestStatement.netIncome / latestStatement.dilutedEps : 
                1000000000);
            break;
        }
        
        impliedValues[metric] = impliedValue;
      }
      
      // Calculate average implied value
      const validImpliedValues = Object.values(impliedValues).filter(value => value > 0);
      const intrinsicValue = validImpliedValues.reduce((sum, value) => sum + value, 0) / validImpliedValues.length;
      
      // Calculate scenarios
      const values = Object.values(impliedValues).filter(value => value > 0).sort((a, b) => a - b);
      const bearishValue = values[0] || intrinsicValue * 0.8;
      const bullishValue = values[values.length - 1] || intrinsicValue * 1.2;
      
      return {
        symbol,
        modelType: 'Comparable',
        intrinsicValue,
        currentPrice,
        upside: (intrinsicValue / currentPrice) - 1,
        assumptions: {
          comparables,
          metrics,
          impliedValues
        },
        scenarios: {
          bearish: bearishValue,
          base: intrinsicValue,
          bullish: bullishValue
        }
      };
    } catch (error) {
      this.logger.error('Error performing comparable analysis', { 
        symbol, 
        comparables, 
        metrics, 
        error: error.message 
      });
      
      throw error;
    }
  }

  /**
   * Screens stocks based on criteria
   * @param criteria The screening criteria
   * @param limit The maximum number of results
   * @returns The screening results
   */
  public async screenStocks(
    criteria: ScreeningCriteria,
    limit: number = 20
  ): Promise<ScreeningResult[]> {
    this.logger.info('Screening stocks', { criteria, limit });
    
    try {
      // In a real implementation, this would query a database or API
      // For now, we'll generate mock data
      
      // Generate a list of stocks
      const allStocks = this.generateMockStockList(100);
      
      // Filter based on criteria
      let filteredStocks = allStocks;
      
      // Filter by market cap
      if (criteria.marketCap) {
        if (criteria.marketCap.min !== undefined) {
          filteredStocks = filteredStocks.filter(stock => stock.marketCap >= criteria.marketCap!.min!);
        }
        
        if (criteria.marketCap.max !== undefined) {
          filteredStocks = filteredStocks.filter(stock => stock.marketCap <= criteria.marketCap!.max!);
        }
      }
      
      // Filter by sector
      if (criteria.sector && criteria.sector.length > 0) {
        filteredStocks = filteredStocks.filter(stock => criteria.sector!.includes(stock.sector));
      }
      
      // Filter by industry
      if (criteria.industry && criteria.industry.length > 0) {
        filteredStocks = filteredStocks.filter(stock => criteria.industry!.includes(stock.industry));
      }
      
      // Filter by PE ratio
      if (criteria.peRatio) {
        if (criteria.peRatio.min !== undefined) {
          filteredStocks = filteredStocks.filter(stock => 
            stock.peRatio !== undefined && stock.peRatio >= criteria.peRatio!.min!
          );
        }
        
        if (criteria.peRatio.max !== undefined) {
          filteredStocks = filteredStocks.filter(stock => 
            stock.peRatio !== undefined && stock.peRatio <= criteria.peRatio!.max!
          );
        }
      }
      
      // Filter by PB ratio
      if (criteria.pbRatio) {
        if (criteria.pbRatio.min !== undefined) {
          filteredStocks = filteredStocks.filter(stock => 
            stock.pbRatio !== undefined && stock.pbRatio >= criteria.pbRatio!.min!
          );
        }
        
        if (criteria.pbRatio.max !== undefined) {
          filteredStocks = filteredStocks.filter(stock => 
            stock.pbRatio !== undefined && stock.pbRatio <= criteria.pbRatio!.max!
          );
        }
      }
      
      // Filter by dividend yield
      if (criteria.dividendYield) {
        if (criteria.dividendYield.min !== undefined) {
          filteredStocks = filteredStocks.filter(stock => 
            stock.dividendYield !== undefined && stock.dividendYield >= criteria.dividendYield!.min!
          );
        }
        
        if (criteria.dividendYield.max !== undefined) {
          filteredStocks = filteredStocks.filter(stock => 
            stock.dividendYield !== undefined && stock.dividendYield <= criteria.dividendYield!.max!
          );
        }
      }
      
      // Filter by ROE
      if (criteria.returnOnEquity) {
        if (criteria.returnOnEquity.min !== undefined) {
          filteredStocks = filteredStocks.filter(stock => 
            stock.returnOnEquity !== undefined && stock.returnOnEquity >= criteria.returnOnEquity!.min!
          );
        }
        
        if (criteria.returnOnEquity.max !== undefined) {
          filteredStocks = filteredStocks.filter(stock => 
            stock.returnOnEquity !== undefined && stock.returnOnEquity <= criteria.returnOnEquity!.max!
          );
        }
      }
      
      // Filter by debt to equity
      if (criteria.debtToEquity) {
        if (criteria.debtToEquity.min !== undefined) {
          filteredStocks = filteredStocks.filter(stock => 
            stock.debtToEquity !== undefined && stock.debtToEquity >= criteria.debtToEquity!.min!
          );
        }
        
        if (criteria.debtToEquity.max !== undefined) {
          filteredStocks = filteredStocks.filter(stock => 
            stock.debtToEquity !== undefined && stock.debtToEquity <= criteria.debtToEquity!.max!
          );
        }
      }
      
      // Calculate score for each stock
      filteredStocks = filteredStocks.map(stock => {
        let score = 0;
        
        // Score based on PE ratio (lower is better)
        if (stock.peRatio !== undefined) {
          score += (20 - Math.min(stock.peRatio, 40)) / 20;
        }
        
        // Score based on PB ratio (lower is better)
        if (stock.pbRatio !== undefined) {
          score += (5 - Math.min(stock.pbRatio, 10)) / 5;
        }
        
        // Score based on dividend yield (higher is better)
        if (stock.dividendYield !== undefined) {
          score += stock.dividendYield / 0.05;
        }
        
        // Score based on ROE (higher is better)
        if (stock.returnOnEquity !== undefined) {
          score += stock.returnOnEquity / 0.2;
        }
        
        // Score based on debt to equity (lower is better)
        if (stock.debtToEquity !== undefined) {
          score += (2 - Math.min(stock.debtToEquity, 4)) / 2;
        }
        
        return {
          ...stock,
          score
        };
      });
      
      // Sort by score
      filteredStocks.sort((a, b) => (b.score || 0) - (a.score || 0));
      
      // Limit results
      return filteredStocks.slice(0, limit);
    } catch (error) {
      this.logger.error('Error screening stocks', { 
        criteria, 
        limit, 
        error: error.message 
      });
      
      throw error;
    }
  }

  /**
   * Generates a fundamental analysis report for a company
   * @param symbol The company symbol
   * @returns The fundamental analysis report
   */
  public async generateFundamentalAnalysisReport(
    symbol: string
  ): Promise<{
    profile: CompanyProfile;
    financialStatements: FinancialStatement[];
    ratios: FinancialRatio;
    valuations: {
      dcf: ValuationModel;
      comparable: ValuationModel;
      ddm?: ValuationModel;
    };
    peers: ScreeningResult[];
    recommendation: {
      rating: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
      targetPrice: number;
      upside: number;
      strengths: string[];
      weaknesses: string[];
      opportunities: string[];
      threats: string[];
    };
  }> {
    this.logger.info('Generating fundamental analysis report', { symbol });
    
    try {
      // Get company profile
      const profile = await this.getCompanyProfile(symbol);
      
      // Get financial statements
      const financialStatements = await this.getFinancialStatements(symbol, 'annual', 3);
      
      // Calculate ratios
      const ratios = await this.calculateFinancialRatios(symbol);
      
      // Perform valuations
      const dcf = await this.performDCFValuation(symbol);
      const comparable = await this.performComparableAnalysis(symbol);
      
      let ddm: ValuationModel | undefined;
      if (financialStatements[0].dividendsPaid && financialStatements[0].dividendsPaid < 0) {
        // Company pays dividends
        ddm = await this.performDDMValuation(symbol);
      }
      
      // Get peers
      const peers = await this.screenStocks({
        industry: [profile.industry],
        marketCap: {
          min: profile.marketCap ? profile.marketCap * 0.2 : undefined,
          max: profile.marketCap ? profile.marketCap * 5 : undefined
        }
      }, 5);
      
      // Generate recommendation
      const targetPrice = (dcf.intrinsicValue + comparable.intrinsicValue + (ddm?.intrinsicValue || 0)) / 
        (ddm ? 3 : 2);
      
      const upside = (targetPrice / dcf.currentPrice) - 1;
      
      let rating: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
      
      if (upside > 0.3) {
        rating = 'strong_buy';
      } else if (upside > 0.1) {
        rating = 'buy';
      } else if (upside > -0.1) {
        rating = 'hold';
      } else if (upside > -0.3) {
        rating = 'sell';
      } else {
        rating = 'strong_sell';
      }
      
      // Generate SWOT analysis
      const strengths: string[] = [];
      const weaknesses: string[] = [];
      const opportunities: string[] = [];
      const threats: string[] = [];
      
      // Analyze profitability
      if (ratios.returnOnEquity && ratios.returnOnEquity > 0.15) {
        strengths.push('Strong return on equity');
      } else if (ratios.returnOnEquity && ratios.returnOnEquity < 0.05) {
        weaknesses.push('Poor return on equity');
      }
      
      if (ratios.operatingMargin && ratios.operatingMargin > 0.2) {
        strengths.push('High operating margins');
      } else if (ratios.operatingMargin && ratios.operatingMargin < 0.05) {
        weaknesses.push('Low operating margins');
      }
      
      // Analyze financial health
      if (ratios.currentRatio && ratios.currentRatio > 2) {
        strengths.push('Strong liquidity position');
      } else if (ratios.currentRatio && ratios.currentRatio < 1) {
        weaknesses.push('Weak liquidity position');
      }
      
      if (ratios.debtToEquity && ratios.debtToEquity < 0.5) {
        strengths.push('Low leverage');
      } else if (ratios.debtToEquity && ratios.debtToEquity > 2) {
        weaknesses.push('High leverage');
      }
      
      // Analyze valuation
      if (ratios.peRatio && ratios.peRatio < 15) {
        opportunities.push('Attractive valuation');
      } else if (ratios.peRatio && ratios.peRatio > 30) {
        threats.push('Expensive valuation');
      }
      
      // Analyze growth
      const revenueGrowth = financialStatements.length > 1 ? 
        (financialStatements[0].revenue / financialStatements[1].revenue) - 1 : 
        0;
      
      if (revenueGrowth > 0.15) {
        strengths.push('Strong revenue growth');
        opportunities.push('Continued growth potential');
      } else if (revenueGrowth < 0) {
        weaknesses.push('Declining revenue');
        threats.push('Competitive pressures');
      }
      
      return {
        profile,
        financialStatements,
        ratios,
        valuations: {
          dcf,
          comparable,
          ddm
        },
        peers,
        recommendation: {
          rating,
          targetPrice,
          upside,
          strengths,
          weaknesses,
          opportunities,
          threats
        }
      };
    } catch (error) {
      this.logger.error('Error generating fundamental analysis report', { 
        symbol, 
        error: error.message 
      });
      
      throw error;
    }
  }

  /**
   * Gets the current price for a symbol
   * @param symbol The symbol
   * @returns The current price
   */
  private async getCurrentPrice(symbol: string): Promise<number> {
    // In a real implementation, this would call the market data service
    // For now, we'll generate a mock price
    
    // Generate a price based on the symbol
    const seed = symbol.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return 50 + (seed % 200);
  }

  /**
   * Gets peer companies in the same industry
   * @param industry The industry
   * @param limit The maximum number of peers
   * @param excludeSymbol Symbol to exclude
   * @returns The peer symbols
   */
  private async getPeersInIndustry(
    industry: string,
    limit: number = 5,
    excludeSymbol?: string
  ): Promise<string[]> {
    // In a real implementation, this would query a database or API
    // For now, we'll generate mock data
    
    const peers = [];
    
    for (let i = 0; i < limit + (excludeSymbol ? 1 : 0); i++) {
      peers.push(`PEER${i + 1}`);
    }
    
    // Exclude the symbol if provided
    if (excludeSymbol) {
      return peers.filter(peer => peer !== excludeSymbol).slice(0, limit);
    }
    
    return peers.slice(0, limit);
  }

  /**
   * Calculates financial ratios from a financial statement
   * @param statement The financial statement
   * @returns The financial ratios
   */
  private calculateRatios(statement: FinancialStatement): FinancialRatio {
    const ratios: FinancialRatio = {
      symbol: statement.symbol,
      period: statement.period
    };
    
    if (statement.fiscalYear) {
      ratios.fiscalYear = statement.fiscalYear;
    }
    
    if (statement.fiscalQuarter) {
      ratios.fiscalQuarter = statement.fiscalQuarter;
    }
    
    // Profitability Ratios
    if (statement.revenue && statement.grossProfit) {
      ratios.grossMargin = statement.grossProfit / statement.revenue;
    }
    
    if (statement.revenue && statement.operatingIncome) {
      ratios.operatingMargin = statement.operatingIncome / statement.revenue;
    }
    
    if (statement.revenue && statement.netIncome) {
      ratios.netMargin = statement.netIncome / statement.revenue;
    }
    
    if (statement.totalAssets && statement.netIncome) {
      ratios.returnOnAssets = statement.netIncome / statement.totalAssets;
    }
    
    if (statement.totalEquity && statement.netIncome) {
      ratios.returnOnEquity = statement.netIncome / statement.totalEquity;
    }
    
    // Liquidity Ratios
    if (statement.currentAssets && statement.currentLiabilities) {
      ratios.currentRatio = statement.currentAssets / statement.currentLiabilities;
      
      if (statement.inventory) {
        ratios.quickRatio = (statement.currentAssets - statement.inventory) / statement.currentLiabilities;
      }
      
      if (statement.cashAndEquivalents && statement.shortTermInvestments) {
        ratios.cashRatio = (statement.cashAndEquivalents + statement.shortTermInvestments) / statement.currentLiabilities;
      }
    }
    
    // Solvency Ratios
    if (statement.totalEquity && statement.totalLiabilities) {
      ratios.debtToEquity = statement.totalLiabilities / statement.totalEquity;
    }
    
    if (statement.totalAssets && statement.totalLiabilities) {
      ratios.debtToAssets = statement.totalLiabilities / statement.totalAssets;
    }
    
    // Valuation Ratios
    if (statement.eps) {
      // Assume current price is 20 times EPS for mock data
      const price = statement.eps * 20;
      
      ratios.peRatio = price / statement.eps;
      
      if (statement.totalEquity) {
        const bookValuePerShare = statement.totalEquity / (statement.dilutedEps ? 
          statement.netIncome / statement.dilutedEps : 
          1000000000);
        
        ratios.pbRatio = price / bookValuePerShare;
      }
      
      if (statement.revenue) {
        const revenuePerShare = statement.revenue / (statement.dilutedEps ? 
          statement.netIncome / statement.dilutedEps : 
          1000000000);
        
        ratios.psRatio = price / revenuePerShare;
      }
      
      if (statement.operatingCashFlow && statement.capitalExpenditures) {
        const fcfPerShare = (statement.operatingCashFlow - statement.capitalExpenditures) / 
          (statement.dilutedEps ? 
            statement.netIncome / statement.dilutedEps : 
            1000000000);
        
        ratios.pfcfRatio = price / fcfPerShare;
      }
      
      if (statement.dividendsPaid) {
        const dividendPerShare = Math.abs(statement.dividendsPaid) / 
          (statement.dilutedEps ? 
            statement.netIncome / statement.dilutedEps : 
            1000000000);
        
        ratios.dividendYield = dividendPerShare / price;
        
        if (statement.eps) {
          ratios.payoutRatio = dividendPerShare / statement.eps;
        }
      }
    }
    
    return ratios;
  }

  /**
   * Calculates scenario value for DCF
   * @param freeCashFlow The initial free cash flow
   * @param growthRate The growth rate
   * @param discountRate The discount rate
   * @param terminalGrowthRate The terminal growth rate
   * @param years The number of years
   * @param sharesOutstanding The number of shares outstanding
   * @returns The scenario value
   */
  private calculateScenarioValue(
    freeCashFlow: number,
    growthRate: number,
    discountRate: number,
    terminalGrowthRate: number,
    years: number,
    sharesOutstanding: number
  ): number {
    // Project future cash flows
    const cashFlows: number[] = [];
    let projectedCashFlow = freeCashFlow;
    
    for (let i = 1; i <= years; i++) {
      projectedCashFlow *= (1 + growthRate);
      cashFlows.push(projectedCashFlow);
    }
    
    // Calculate terminal value
    const terminalValue = projectedCashFlow * (1 + terminalGrowthRate) / (discountRate - terminalGrowthRate);
    
    // Discount cash flows
    let presentValue = 0;
    for (let i = 0; i < cashFlows.length; i++) {
      presentValue += cashFlows[i] / Math.pow(1 + discountRate, i + 1);
    }
    
    // Discount terminal value
    presentValue += terminalValue / Math.pow(1 + discountRate, years);
    
    // Calculate per share value
    return presentValue / sharesOutstanding;
  }

  /**
   * Generates mock financial statement data
   * @param symbol The company symbol
   * @param period The reporting period
   * @param fiscalYear The fiscal year
   * @param fiscalQuarter The fiscal quarter
   * @returns The financial statement
   */
  private generateMockFinancialStatement(
    symbol: string,
    period: 'annual' | 'quarterly',
    fiscalYear: number,
    fiscalQuarter?: number
  ): FinancialStatement {
    // Generate a seed based on the symbol and year
    const seed = symbol.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) + fiscalYear;
    
    // Generate base revenue
    const baseRevenue = 1000000000 + (seed % 10000000000);
    
    // Apply growth or decline based on year
    const yearFactor = 1 + ((fiscalYear % 5) - 2) * 0.1;
    
    // Apply seasonality for quarterly data
    const quarterFactor = fiscalQuarter ? 
      [1, 0.8, 0.9, 1.2][fiscalQuarter - 1] : 
      1;
    
    // Calculate revenue
    const revenue = baseRevenue * yearFactor * quarterFactor;
    
    // Calculate other financial metrics
    const grossProfit = revenue * (0.3 + (seed % 40) / 100);
    const operatingExpenses = grossProfit * (0.5 + (seed % 30) / 100);
    const operatingIncome = grossProfit - operatingExpenses;
    const netIncome = operatingIncome * (0.7 + (seed % 20) / 100);
    
    // Calculate balance sheet items
    const totalAssets = revenue * (0.8 + (seed % 40) / 100);
    const totalLiabilities = totalAssets * (0.4 + (seed % 40) / 100);
    const totalEquity = totalAssets - totalLiabilities;
    const cashAndEquivalents = totalAssets * (0.1 + (seed % 20) / 100);
    const shortTermInvestments = totalAssets * (0.05 + (seed % 10) / 100);
    const accountsReceivable = revenue * (0.1 + (seed % 10) / 100);
    const inventory = revenue * (0.15 + (seed % 15) / 100);
    const currentAssets = cashAndEquivalents + shortTermInvestments + accountsReceivable + inventory;
    const currentLiabilities = totalLiabilities * (0.3 + (seed % 30) / 100);
    const longTermDebt = totalLiabilities * (0.6 + (seed % 30) / 100);
    
    // Calculate cash flow items
    const operatingCashFlow = netIncome * (1.1 + (seed % 40) / 100);
    const capitalExpenditures = -revenue * (0.05 + (seed % 10) / 100);
    const freeCashFlow = operatingCashFlow + capitalExpenditures;
    
    // Calculate per share metrics
    const sharesOutstanding = 100000000 + (seed % 900000000);
    const eps = netIncome / sharesOutstanding;
    const dilutedEps = eps * 0.95;
    
    // Calculate dividends
    const dividendsPaid = (seed % 2 === 0) ? -netIncome * (0.2 + (seed % 40) / 100) : 0;
    const shareRepurchase = (seed % 3 === 0) ? -netIncome * (0.3 + (seed % 30) / 100) : 0;
    
    // Create report date
    const reportDate = new Date(fiscalYear, fiscalQuarter ? fiscalQuarter * 3 : 11, 15);
    const filingDate = new Date(reportDate);
    filingDate.setDate(reportDate.getDate() + 45);
    
    return {
      symbol,
      period,
      fiscalYear,
      fiscalQuarter,
      reportDate,
      filingDate,
      
      // Income Statement
      revenue,
      costOfRevenue: revenue - grossProfit,
      grossProfit,
      operatingExpenses,
      operatingIncome,
      netIncome,
      eps,
      dilutedEps,
      
      // Balance Sheet
      totalAssets,
      totalLiabilities,
      totalEquity,
      cashAndEquivalents,
      shortTermInvestments,
      accountsReceivable,
      inventory,
      currentAssets,
      currentLiabilities,
      longTermDebt,
      
      // Cash Flow Statement
      operatingCashFlow,
      capitalExpenditures,
      freeCashFlow,
      dividendsPaid,
      shareRepurchase
    };
  }

  /**
   * Generates a mock company profile
   * @param symbol The company symbol
   * @returns The company profile
   */
  private generateMockCompanyProfile(symbol: string): CompanyProfile {
    // Generate a seed based on the symbol
    const seed = symbol.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    
    // Define sectors and industries
    const sectors = [
      'Technology',
      'Healthcare',
      'Consumer Cyclical',
      'Consumer Defensive',
      'Financial Services',
      'Industrials',
      'Energy',
      'Basic Materials',
      'Communication Services',
      'Utilities',
      'Real Estate'
    ];
    
    const industries: Record<string, string[]> = {
      'Technology': ['Software', 'Hardware', 'Semiconductors', 'IT Services', 'Electronic Components'],
      'Healthcare': ['Biotechnology', 'Pharmaceuticals', 'Medical Devices', 'Healthcare Services', 'Health Insurance'],
      'Consumer Cyclical': ['Retail', 'Automotive', 'Entertainment', 'Restaurants', 'Apparel'],
      'Consumer Defensive': ['Food', 'Beverages', 'Household Products', 'Personal Products', 'Tobacco'],
      'Financial Services': ['Banks', 'Insurance', 'Asset Management', 'Credit Services', 'Capital Markets'],
      'Industrials': ['Aerospace & Defense', 'Construction', 'Machinery', 'Transportation', 'Business Services'],
      'Energy': ['Oil & Gas', 'Renewable Energy', 'Coal', 'Energy Services', 'Pipelines'],
      'Basic Materials': ['Chemicals', 'Metals & Mining', 'Forest Products', 'Agriculture', 'Building Materials'],
      'Communication Services': ['Telecom', 'Media', 'Entertainment', 'Social Media', 'Advertising'],
      'Utilities': ['Electric Utilities', 'Gas Utilities', 'Water Utilities', 'Renewable Utilities', 'Multi-Utilities'],
      'Real Estate': ['REITs', 'Real Estate Services', 'Development', 'Property Management', 'Real Estate Holdings']
    };
    
    // Select sector and industry
    const sector = sectors[seed % sectors.length];
    const industry = industries[sector][seed % industries[sector].length];
    
    // Generate market cap
    const marketCap = 1000000000 + (seed % 500000000000);
    
    // Generate shares outstanding
    const sharesOutstanding = marketCap / (50 + (seed % 200));
    
    return {
      symbol,
      name: `${symbol} Corporation`,
      exchange: seed % 2 === 0 ? 'NYSE' : 'NASDAQ',
      industry,
      sector,
      description: `${symbol} Corporation is a leading company in the ${industry} industry, providing innovative solutions to customers worldwide.`,
      website: `https://www.${symbol.toLowerCase()}.com`,
      employees: 1000 + (seed % 100000),
      ceo: `John Smith`,
      address: `123 Main Street, New York, NY 10001`,
      phone: `+1-555-123-4567`,
      marketCap,
      sharesOutstanding
    };
  }

  /**
   * Generates a mock list of stocks
   * @param count The number of stocks to generate
   * @returns The list of stocks
   */
  private generateMockStockList(count: number): ScreeningResult[] {
    const stocks: ScreeningResult[] = [];
    
    // Define sectors and industries
    const sectors = [
      'Technology',
      'Healthcare',
      'Consumer Cyclical',
      'Consumer Defensive',
      'Financial Services',
      'Industrials',
      'Energy',
      'Basic Materials',
      'Communication Services',
      'Utilities',
      'Real Estate'
    ];
    
    const industries: Record<string, string[]> = {
      'Technology': ['Software', 'Hardware', 'Semiconductors', 'IT Services', 'Electronic Components'],
      'Healthcare': ['Biotechnology', 'Pharmaceuticals', 'Medical Devices', 'Healthcare Services', 'Health Insurance'],
      'Consumer Cyclical': ['Retail', 'Automotive', 'Entertainment', 'Restaurants', 'Apparel'],
      'Consumer Defensive': ['Food', 'Beverages', 'Household Products', 'Personal Products', 'Tobacco'],
      'Financial Services': ['Banks', 'Insurance', 'Asset Management', 'Credit Services', 'Capital Markets'],
      'Industrials': ['Aerospace & Defense', 'Construction', 'Machinery', 'Transportation', 'Business Services'],
      'Energy': ['Oil & Gas', 'Renewable Energy', 'Coal', 'Energy Services', 'Pipelines'],
      'Basic Materials': ['Chemicals', 'Metals & Mining', 'Forest Products', 'Agriculture', 'Building Materials'],
      'Communication Services': ['Telecom', 'Media', 'Entertainment', 'Social Media', 'Advertising'],
      'Utilities': ['Electric Utilities', 'Gas Utilities', 'Water Utilities', 'Renewable Utilities', 'Multi-Utilities'],
      'Real Estate': ['REITs', 'Real Estate Services', 'Development', 'Property Management', 'Real Estate Holdings']
    };
    
    for (let i = 0; i < count; i++) {
      // Generate a seed
      const seed = i * 12345;
      
      // Generate symbol
      const symbol = `STOCK${i + 1}`;
      
      // Select sector and industry
      const sector = sectors[seed % sectors.length];
      const industry = industries[sector][seed % industries[sector].length];
      
      // Generate market cap
      const marketCap = 1000000000 + (seed % 500000000000);
      
      // Generate price
      const price = 10 + (seed % 990);
      
      // Generate ratios
      const peRatio = 5 + (seed % 45);
      const pbRatio = 0.5 + (seed % 10) / 2;
      const dividendYield = (seed % 100) / 1000;
      const returnOnEquity = (5 + (seed % 35)) / 100;
      const debtToEquity = (seed % 300) / 100;
      
      // Generate price change
      const priceChange = ((seed % 40) - 20) / 100;
      
      // Generate analyst rating
      const analystRating = 1 + (seed % 5);
      
      stocks.push({
        symbol,
        name: `${symbol} Corporation`,
        sector,
        industry,
        marketCap,
        price,
        peRatio,
        pbRatio,
        dividendYield,
        returnOnEquity,
        debtToEquity,
        priceChange,
        analystRating
      });
    }
    
    return stocks;
  }
}