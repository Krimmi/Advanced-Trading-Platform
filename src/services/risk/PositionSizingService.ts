import { EventEmitter } from 'events';
import {
  Portfolio,
  Position,
  PositionSizingRecommendation,
  RiskMetricType
} from './models/RiskModels';
import { CorrelationAnalysisService, CorrelationMethod } from './CorrelationAnalysisService';
import { HistoricalVaRService } from './HistoricalVaRService';
import { FinancialDataService } from '../api/financialData/FinancialDataService';
import { FinancialDataServiceFactory } from '../api/financialData/FinancialDataServiceFactory';
import { MarketDataService } from '../api/marketData/MarketDataService';
import { MarketDataServiceFactory } from '../api/marketData/MarketDataServiceFactory';

/**
 * Position sizing method types
 */
export enum PositionSizingMethod {
  FIXED = 'fixed',
  PERCENT = 'percent',
  RISK = 'risk',
  VOLATILITY = 'volatility',
  KELLY = 'kelly',
  OPTIMAL_F = 'optimal_f',
  EQUAL_RISK = 'equal_risk',
  CORRELATION_ADJUSTED = 'correlation_adjusted',
  RISK_PARITY = 'risk_parity'
}

/**
 * Position sizing options
 */
export interface PositionSizingOptions {
  method: PositionSizingMethod;
  accountValue: number;
  maxPositionSizePercent: number;
  maxRiskPerTradePercent: number;
  lookbackPeriod: number;
  confidenceLevel?: number;
  kellyFraction?: number;
  optimalFMultiplier?: number;
  useCorrelationAdjustment?: boolean;
  correlationMethod?: CorrelationMethod;
  useVolatilityAdjustment?: boolean;
  usePositionSizingConstraints?: boolean;
  minPositionSize?: number;
  maxPositionSize?: number;
  incrementSize?: number;
  roundLotSize?: number;
}

/**
 * Trade setup for position sizing
 */
export interface TradeSetup {
  symbol: string;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice?: number;
  winRate?: number;
  expectedReturn?: number;
  expectedVolatility?: number;
  atrValue?: number;
  atrMultiplier?: number;
  assetClass?: string;
  sector?: string;
  metadata?: Record<string, any>;
}

/**
 * Position sizing calculation result
 */
export interface PositionSizingResult {
  symbol: string;
  entryPrice: number;
  shares: number;
  positionValue: number;
  riskAmount: number;
  riskPercent: number;
  potentialProfit?: number;
  potentialLoss?: number;
  riskRewardRatio?: number;
  maxPositionSize: number;
  method: PositionSizingMethod;
  adjustmentFactors?: {
    correlation?: number;
    volatility?: number;
    portfolioHeatmap?: Record<string, number>;
  };
}

/**
 * Service for calculating position sizes based on various methods
 */
export class PositionSizingService extends EventEmitter {
  private correlationService: CorrelationAnalysisService;
  private varService: HistoricalVaRService;
  private financialDataService: FinancialDataService;
  private marketDataService: MarketDataService;
  private historicalReturns: Map<string, number[]> = new Map();
  private historicalVolatility: Map<string, number> = new Map();
  
  /**
   * Creates a new PositionSizingService
   * @param correlationService Correlation analysis service
   * @param varService VaR service
   * @param financialDataService Financial data service
   * @param marketDataService Market data service
   */
  constructor(
    correlationService?: CorrelationAnalysisService,
    varService?: HistoricalVaRService,
    financialDataService?: FinancialDataService,
    marketDataService?: MarketDataService
  ) {
    super();
    this.correlationService = correlationService || new CorrelationAnalysisService();
    this.varService = varService || new HistoricalVaRService();
    this.financialDataService = financialDataService || FinancialDataServiceFactory.getService();
    this.marketDataService = marketDataService || MarketDataServiceFactory.getService();
  }
  
  /**
   * Calculates position size for a trade setup
   * @param setup Trade setup
   * @param options Position sizing options
   * @param portfolio Current portfolio (optional)
   * @returns Position sizing result
   */
  public async calculatePositionSize(
    setup: TradeSetup,
    options: PositionSizingOptions,
    portfolio?: Portfolio
  ): Promise<PositionSizingResult> {
    // Validate inputs
    this.validateInputs(setup, options);
    
    // Load historical data if needed
    if (
      options.method === PositionSizingMethod.KELLY ||
      options.method === PositionSizingMethod.OPTIMAL_F ||
      options.method === PositionSizingMethod.CORRELATION_ADJUSTED ||
      options.method === PositionSizingMethod.RISK_PARITY ||
      options.useVolatilityAdjustment
    ) {
      await this.loadHistoricalData(setup.symbol, options.lookbackPeriod);
      
      if (portfolio) {
        for (const position of portfolio.positions) {
          await this.loadHistoricalData(position.symbol, options.lookbackPeriod);
        }
      }
    }
    
    // Calculate position size based on method
    let result: PositionSizingResult;
    
    switch (options.method) {
      case PositionSizingMethod.FIXED:
        result = this.calculateFixedDollarAmount(setup, options);
        break;
        
      case PositionSizingMethod.PERCENT:
        result = this.calculatePercentOfAccount(setup, options);
        break;
        
      case PositionSizingMethod.RISK:
        result = this.calculateRiskBased(setup, options);
        break;
        
      case PositionSizingMethod.VOLATILITY:
        result = await this.calculateVolatilityBased(setup, options);
        break;
        
      case PositionSizingMethod.KELLY:
        result = await this.calculateKellyCriterion(setup, options);
        break;
        
      case PositionSizingMethod.OPTIMAL_F:
        result = await this.calculateOptimalF(setup, options);
        break;
        
      case PositionSizingMethod.EQUAL_RISK:
        result = this.calculateEqualRisk(setup, options, portfolio);
        break;
        
      case PositionSizingMethod.CORRELATION_ADJUSTED:
        result = await this.calculateCorrelationAdjusted(setup, options, portfolio);
        break;
        
      case PositionSizingMethod.RISK_PARITY:
        result = await this.calculateRiskParity(setup, options, portfolio);
        break;
        
      default:
        result = this.calculatePercentOfAccount(setup, options);
    }
    
    // Apply position sizing constraints if enabled
    if (options.usePositionSizingConstraints) {
      result = this.applyPositionSizingConstraints(result, options);
    }
    
    return result;
  }
  
  /**
   * Calculates position size recommendations for a portfolio
   * @param portfolio Current portfolio
   * @param options Position sizing options
   * @returns Array of position sizing recommendations
   */
  public async calculatePortfolioPositionSizing(
    portfolio: Portfolio,
    options: PositionSizingOptions
  ): Promise<PositionSizingRecommendation[]> {
    const recommendations: PositionSizingRecommendation[] = [];
    
    // Load historical data for all positions
    for (const position of portfolio.positions) {
      await this.loadHistoricalData(position.symbol, options.lookbackPeriod);
    }
    
    // Calculate correlation matrix if needed
    let correlationMatrix: Record<string, Record<string, number>> | undefined;
    
    if (
      options.method === PositionSizingMethod.CORRELATION_ADJUSTED ||
      options.method === PositionSizingMethod.RISK_PARITY ||
      options.useCorrelationAdjustment
    ) {
      const symbols = portfolio.positions.map(p => p.symbol);
      
      const correlationResult = await this.correlationService.calculateCorrelationMatrix(
        symbols,
        {
          lookbackPeriod: options.lookbackPeriod,
          method: options.correlationMethod || CorrelationMethod.PEARSON,
          useLogReturns: true
        }
      );
      
      correlationMatrix = correlationResult.value;
    }
    
    // Calculate volatilities if needed
    const volatilities: Record<string, number> = {};
    
    if (
      options.method === PositionSizingMethod.VOLATILITY ||
      options.method === PositionSizingMethod.RISK_PARITY ||
      options.useVolatilityAdjustment
    ) {
      for (const position of portfolio.positions) {
        const returns = this.historicalReturns.get(position.symbol) || [];
        volatilities[position.symbol] = this.calculateVolatility(returns);
      }
    }
    
    // Calculate optimal position sizes based on method
    switch (options.method) {
      case PositionSizingMethod.RISK_PARITY:
        return this.calculateRiskParityPortfolio(portfolio, options, correlationMatrix!, volatilities);
        
      case PositionSizingMethod.CORRELATION_ADJUSTED:
        return this.calculateCorrelationAdjustedPortfolio(portfolio, options, correlationMatrix!);
        
      case PositionSizingMethod.EQUAL_RISK:
        return this.calculateEqualRiskPortfolio(portfolio, options, volatilities);
        
      default:
        // Calculate individual position sizes
        for (const position of portfolio.positions) {
          const setup: TradeSetup = {
            symbol: position.symbol,
            entryPrice: position.price,
            stopLossPrice: position.price * 0.95, // Default 5% stop loss
            assetClass: position.assetClass,
            sector: position.sector
          };
          
          const result = await this.calculatePositionSize(setup, options, portfolio);
          
          recommendations.push({
            symbol: position.symbol,
            currentSize: position.quantity,
            recommendedSize: result.shares,
            sizeChange: result.shares - position.quantity,
            sizeChangePercentage: ((result.shares - position.quantity) / position.quantity) * 100,
            riskContribution: result.riskAmount,
            riskContributionPercentage: result.riskPercent,
            method: options.method,
            confidence: 0.95,
            metadata: {
              positionValue: result.positionValue,
              entryPrice: position.price,
              adjustmentFactors: result.adjustmentFactors
            }
          });
        }
    }
    
    return recommendations;
  }
  
  /**
   * Calculates fixed dollar amount position size
   * @param setup Trade setup
   * @param options Position sizing options
   * @returns Position sizing result
   */
  private calculateFixedDollarAmount(
    setup: TradeSetup,
    options: PositionSizingOptions
  ): PositionSizingResult {
    const { symbol, entryPrice, stopLossPrice, takeProfitPrice } = setup;
    const { accountValue, maxPositionSizePercent } = options;
    
    // Calculate max position value based on max position size
    const maxPositionValue = accountValue * (maxPositionSizePercent / 100);
    
    // Use 5% of account as default fixed amount
    const fixedAmount = accountValue * 0.05;
    const positionValue = Math.min(fixedAmount, maxPositionValue);
    const shares = Math.floor(positionValue / entryPrice);
    
    // Calculate risk metrics
    const riskPerShare = Math.abs(entryPrice - stopLossPrice);
    const riskAmount = shares * riskPerShare;
    const riskPercent = (riskAmount / accountValue) * 100;
    
    // Calculate profit potential if take profit is set
    let potentialProfit: number | undefined;
    let potentialLoss: number | undefined;
    let riskRewardRatio: number | undefined;
    
    if (takeProfitPrice !== undefined) {
      potentialProfit = shares * Math.abs(takeProfitPrice - entryPrice);
      potentialLoss = riskAmount;
      riskRewardRatio = potentialProfit / potentialLoss;
    }
    
    return {
      symbol,
      entryPrice,
      shares,
      positionValue,
      riskAmount,
      riskPercent,
      potentialProfit,
      potentialLoss,
      riskRewardRatio,
      maxPositionSize: maxPositionValue,
      method: PositionSizingMethod.FIXED
    };
  }
  
  /**
   * Calculates percent of account position size
   * @param setup Trade setup
   * @param options Position sizing options
   * @returns Position sizing result
   */
  private calculatePercentOfAccount(
    setup: TradeSetup,
    options: PositionSizingOptions
  ): PositionSizingResult {
    const { symbol, entryPrice, stopLossPrice, takeProfitPrice } = setup;
    const { accountValue, maxPositionSizePercent } = options;
    
    // Calculate position value based on account percentage
    const positionValue = accountValue * (maxPositionSizePercent / 100);
    const shares = Math.floor(positionValue / entryPrice);
    
    // Calculate risk metrics
    const riskPerShare = Math.abs(entryPrice - stopLossPrice);
    const riskAmount = shares * riskPerShare;
    const riskPercent = (riskAmount / accountValue) * 100;
    
    // Calculate profit potential if take profit is set
    let potentialProfit: number | undefined;
    let potentialLoss: number | undefined;
    let riskRewardRatio: number | undefined;
    
    if (takeProfitPrice !== undefined) {
      potentialProfit = shares * Math.abs(takeProfitPrice - entryPrice);
      potentialLoss = riskAmount;
      riskRewardRatio = potentialProfit / potentialLoss;
    }
    
    return {
      symbol,
      entryPrice,
      shares,
      positionValue,
      riskAmount,
      riskPercent,
      potentialProfit,
      potentialLoss,
      riskRewardRatio,
      maxPositionSize: positionValue,
      method: PositionSizingMethod.PERCENT
    };
  }
  
  /**
   * Calculates risk-based position size
   * @param setup Trade setup
   * @param options Position sizing options
   * @returns Position sizing result
   */
  private calculateRiskBased(
    setup: TradeSetup,
    options: PositionSizingOptions
  ): PositionSizingResult {
    const { symbol, entryPrice, stopLossPrice, takeProfitPrice } = setup;
    const { accountValue, maxPositionSizePercent, maxRiskPerTradePercent } = options;
    
    // Calculate max position value based on max position size
    const maxPositionValue = accountValue * (maxPositionSizePercent / 100);
    
    // Calculate risk per share
    const riskPerShare = Math.abs(entryPrice - stopLossPrice);
    
    // Calculate max risk amount
    const maxRiskAmount = accountValue * (maxRiskPerTradePercent / 100);
    
    // Calculate shares based on risk
    const shares = Math.floor(maxRiskAmount / riskPerShare);
    
    // Calculate position value
    let positionValue = shares * entryPrice;
    
    // Ensure we don't exceed max position size
    if (positionValue > maxPositionValue) {
      positionValue = maxPositionValue;
      const adjustedShares = Math.floor(positionValue / entryPrice);
      return this.calculateRiskMetrics(symbol, entryPrice, adjustedShares, stopLossPrice, takeProfitPrice, accountValue, maxPositionValue, PositionSizingMethod.RISK);
    }
    
    return this.calculateRiskMetrics(symbol, entryPrice, shares, stopLossPrice, takeProfitPrice, accountValue, maxPositionValue, PositionSizingMethod.RISK);
  }
  
  /**
   * Calculates volatility-based position size
   * @param setup Trade setup
   * @param options Position sizing options
   * @returns Position sizing result
   */
  private async calculateVolatilityBased(
    setup: TradeSetup,
    options: PositionSizingOptions
  ): Promise<PositionSizingResult> {
    const { symbol, entryPrice, stopLossPrice, takeProfitPrice, atrValue, atrMultiplier } = setup;
    const { accountValue, maxPositionSizePercent, maxRiskPerTradePercent } = options;
    
    // Calculate max position value based on max position size
    const maxPositionValue = accountValue * (maxPositionSizePercent / 100);
    
    // Get ATR value (either from input or calculate)
    let volatility = atrValue;
    
    if (!volatility) {
      // Calculate ATR from historical data
      await this.loadHistoricalData(symbol, options.lookbackPeriod);
      const returns = this.historicalReturns.get(symbol) || [];
      volatility = this.calculateVolatility(returns) * entryPrice;
    }
    
    // Use default multiplier if not provided
    const multiplier = atrMultiplier || 2;
    
    // Calculate risk per share based on ATR
    const riskPerShare = volatility * multiplier;
    
    // Calculate max risk amount
    const maxRiskAmount = accountValue * (maxRiskPerTradePercent / 100);
    
    // Calculate shares based on risk
    const shares = Math.floor(maxRiskAmount / riskPerShare);
    
    // Calculate position value
    let positionValue = shares * entryPrice;
    
    // Ensure we don't exceed max position size
    if (positionValue > maxPositionValue) {
      positionValue = maxPositionValue;
      const adjustedShares = Math.floor(positionValue / entryPrice);
      return this.calculateRiskMetrics(symbol, entryPrice, adjustedShares, stopLossPrice, takeProfitPrice, accountValue, maxPositionValue, PositionSizingMethod.VOLATILITY);
    }
    
    return this.calculateRiskMetrics(symbol, entryPrice, shares, stopLossPrice, takeProfitPrice, accountValue, maxPositionValue, PositionSizingMethod.VOLATILITY);
  }
  
  /**
   * Calculates Kelly Criterion position size
   * @param setup Trade setup
   * @param options Position sizing options
   * @returns Position sizing result
   */
  private async calculateKellyCriterion(
    setup: TradeSetup,
    options: PositionSizingOptions
  ): Promise<PositionSizingResult> {
    const { symbol, entryPrice, stopLossPrice, takeProfitPrice, winRate } = setup;
    const { accountValue, maxPositionSizePercent, kellyFraction } = options;
    
    // Calculate max position value based on max position size
    const maxPositionValue = accountValue * (maxPositionSizePercent / 100);
    
    // Get win rate (either from input or calculate from historical data)
    let winProbability = winRate ? winRate / 100 : 0.5; // Default to 50% if not provided
    
    if (!winRate) {
      // Calculate win rate from historical data
      await this.loadHistoricalData(symbol, options.lookbackPeriod);
      const returns = this.historicalReturns.get(symbol) || [];
      
      if (returns.length > 0) {
        const positiveReturns = returns.filter(r => r > 0).length;
        winProbability = positiveReturns / returns.length;
      }
    }
    
    // Calculate win/loss ratio
    let rewardRiskRatio = 1;
    
    if (takeProfitPrice !== undefined && stopLossPrice !== undefined) {
      const potentialGain = Math.abs(takeProfitPrice - entryPrice);
      const potentialLoss = Math.abs(entryPrice - stopLossPrice);
      rewardRiskRatio = potentialGain / potentialLoss;
    }
    
    // Calculate Kelly percentage
    const lossProbability = 1 - winProbability;
    const kellyPercentage = (winProbability * rewardRiskRatio - lossProbability) / rewardRiskRatio;
    
    // Apply Kelly fraction (usually 0.5 or half-Kelly)
    const fraction = kellyFraction !== undefined ? kellyFraction / 100 : 0.5;
    const adjustedKellyPercentage = Math.max(0, kellyPercentage * fraction);
    
    // Calculate position value
    const positionValue = Math.min(accountValue * adjustedKellyPercentage, maxPositionValue);
    const shares = Math.floor(positionValue / entryPrice);
    
    return this.calculateRiskMetrics(symbol, entryPrice, shares, stopLossPrice, takeProfitPrice, accountValue, maxPositionValue, PositionSizingMethod.KELLY);
  }
  
  /**
   * Calculates Optimal F position size
   * @param setup Trade setup
   * @param options Position sizing options
   * @returns Position sizing result
   */
  private async calculateOptimalF(
    setup: TradeSetup,
    options: PositionSizingOptions
  ): Promise<PositionSizingResult> {
    const { symbol, entryPrice, stopLossPrice, takeProfitPrice } = setup;
    const { accountValue, maxPositionSizePercent, optimalFMultiplier } = options;
    
    // Calculate max position value based on max position size
    const maxPositionValue = accountValue * (maxPositionSizePercent / 100);
    
    // Load historical data
    await this.loadHistoricalData(symbol, options.lookbackPeriod);
    const returns = this.historicalReturns.get(symbol) || [];
    
    // Calculate optimal f
    let optimalF = 0.02; // Default to 2% if not enough data
    
    if (returns.length > 30) {
      // Simple optimal f calculation based on historical returns
      const worstLoss = Math.min(...returns);
      
      if (worstLoss < 0) {
        // Optimal f = 1 / (worst loss ratio)
        optimalF = 1 / (Math.abs(worstLoss) / 1);
      }
    }
    
    // Apply multiplier (usually < 1 for safety)
    const multiplier = optimalFMultiplier !== undefined ? optimalFMultiplier / 100 : 0.5;
    const adjustedOptimalF = optimalF * multiplier;
    
    // Calculate position value
    const positionValue = Math.min(accountValue * adjustedOptimalF, maxPositionValue);
    const shares = Math.floor(positionValue / entryPrice);
    
    return this.calculateRiskMetrics(symbol, entryPrice, shares, stopLossPrice, takeProfitPrice, accountValue, maxPositionValue, PositionSizingMethod.OPTIMAL_F);
  }
  
  /**
   * Calculates equal risk position size
   * @param setup Trade setup
   * @param options Position sizing options
   * @param portfolio Current portfolio
   * @returns Position sizing result
   */
  private calculateEqualRisk(
    setup: TradeSetup,
    options: PositionSizingOptions,
    portfolio?: Portfolio
  ): PositionSizingResult {
    const { symbol, entryPrice, stopLossPrice, takeProfitPrice } = setup;
    const { accountValue, maxPositionSizePercent, maxRiskPerTradePercent } = options;
    
    // Calculate max position value based on max position size
    const maxPositionValue = accountValue * (maxPositionSizePercent / 100);
    
    // Calculate risk per share
    const riskPerShare = Math.abs(entryPrice - stopLossPrice);
    
    // Calculate max risk amount based on portfolio
    let maxRiskAmount = accountValue * (maxRiskPerTradePercent / 100);
    
    if (portfolio && portfolio.positions.length > 0) {
      // Divide risk equally among positions
      const totalPositions = portfolio.positions.length + 1; // Include new position
      maxRiskAmount = accountValue * (maxRiskPerTradePercent / 100) / totalPositions;
    }
    
    // Calculate shares based on risk
    const shares = Math.floor(maxRiskAmount / riskPerShare);
    
    // Calculate position value
    let positionValue = shares * entryPrice;
    
    // Ensure we don't exceed max position size
    if (positionValue > maxPositionValue) {
      positionValue = maxPositionValue;
      const adjustedShares = Math.floor(positionValue / entryPrice);
      return this.calculateRiskMetrics(symbol, entryPrice, adjustedShares, stopLossPrice, takeProfitPrice, accountValue, maxPositionValue, PositionSizingMethod.EQUAL_RISK);
    }
    
    return this.calculateRiskMetrics(symbol, entryPrice, shares, stopLossPrice, takeProfitPrice, accountValue, maxPositionValue, PositionSizingMethod.EQUAL_RISK);
  }
  
  /**
   * Calculates correlation-adjusted position size
   * @param setup Trade setup
   * @param options Position sizing options
   * @param portfolio Current portfolio
   * @returns Position sizing result
   */
  private async calculateCorrelationAdjusted(
    setup: TradeSetup,
    options: PositionSizingOptions,
    portfolio?: Portfolio
  ): Promise<PositionSizingResult> {
    const { symbol, entryPrice, stopLossPrice, takeProfitPrice } = setup;
    const { accountValue, maxPositionSizePercent, maxRiskPerTradePercent } = options;
    
    // Calculate max position value based on max position size
    const maxPositionValue = accountValue * (maxPositionSizePercent / 100);
    
    // Calculate base risk per share
    const riskPerShare = Math.abs(entryPrice - stopLossPrice);
    
    // Calculate max risk amount
    let maxRiskAmount = accountValue * (maxRiskPerTradePercent / 100);
    
    // Calculate correlation adjustment factor
    let correlationFactor = 1.0;
    let portfolioHeatmap: Record<string, number> | undefined;
    
    if (portfolio && portfolio.positions.length > 0) {
      // Calculate correlation with existing portfolio
      const symbols = portfolio.positions.map(p => p.symbol);
      symbols.push(symbol);
      
      const correlationResult = await this.correlationService.calculateCorrelationMatrix(
        symbols,
        {
          lookbackPeriod: options.lookbackPeriod,
          method: options.correlationMethod || CorrelationMethod.PEARSON,
          useLogReturns: true
        }
      );
      
      const correlationMatrix = correlationResult.value;
      
      // Calculate average correlation with portfolio
      let totalCorrelation = 0;
      let count = 0;
      
      portfolioHeatmap = {};
      
      for (const position of portfolio.positions) {
        const correlation = correlationMatrix[symbol][position.symbol];
        totalCorrelation += correlation;
        count++;
        
        // Store correlation with each position for heatmap
        portfolioHeatmap[position.symbol] = correlation;
      }
      
      const avgCorrelation = count > 0 ? totalCorrelation / count : 0;
      
      // Adjust risk based on correlation
      // Higher correlation = lower position size
      correlationFactor = 1 - Math.abs(avgCorrelation) * 0.5;
      
      // Ensure factor is within reasonable bounds
      correlationFactor = Math.max(0.5, Math.min(1.5, correlationFactor));
    }
    
    // Adjust risk amount by correlation factor
    maxRiskAmount *= correlationFactor;
    
    // Calculate shares based on adjusted risk
    const shares = Math.floor(maxRiskAmount / riskPerShare);
    
    // Calculate position value
    let positionValue = shares * entryPrice;
    
    // Ensure we don't exceed max position size
    if (positionValue > maxPositionValue) {
      positionValue = maxPositionValue;
      const adjustedShares = Math.floor(positionValue / entryPrice);
      const result = this.calculateRiskMetrics(symbol, entryPrice, adjustedShares, stopLossPrice, takeProfitPrice, accountValue, maxPositionValue, PositionSizingMethod.CORRELATION_ADJUSTED);
      
      // Add adjustment factors
      result.adjustmentFactors = {
        correlation: correlationFactor,
        portfolioHeatmap
      };
      
      return result;
    }
    
    const result = this.calculateRiskMetrics(symbol, entryPrice, shares, stopLossPrice, takeProfitPrice, accountValue, maxPositionValue, PositionSizingMethod.CORRELATION_ADJUSTED);
    
    // Add adjustment factors
    result.adjustmentFactors = {
      correlation: correlationFactor,
      portfolioHeatmap
    };
    
    return result;
  }
  
  /**
   * Calculates risk parity position size
   * @param setup Trade setup
   * @param options Position sizing options
   * @param portfolio Current portfolio
   * @returns Position sizing result
   */
  private async calculateRiskParity(
    setup: TradeSetup,
    options: PositionSizingOptions,
    portfolio?: Portfolio
  ): Promise<PositionSizingResult> {
    const { symbol, entryPrice, stopLossPrice, takeProfitPrice } = setup;
    const { accountValue, maxPositionSizePercent } = options;
    
    // Calculate max position value based on max position size
    const maxPositionValue = accountValue * (maxPositionSizePercent / 100);
    
    // If no portfolio, fall back to equal risk
    if (!portfolio || portfolio.positions.length === 0) {
      return this.calculateEqualRisk(setup, options);
    }
    
    // Calculate correlation matrix
    const symbols = portfolio.positions.map(p => p.symbol);
    symbols.push(symbol);
    
    const correlationResult = await this.correlationService.calculateCorrelationMatrix(
      symbols,
      {
        lookbackPeriod: options.lookbackPeriod,
        method: options.correlationMethod || CorrelationMethod.PEARSON,
        useLogReturns: true
      }
    );
    
    const correlationMatrix = correlationResult.value;
    
    // Calculate volatilities
    const volatilities: Record<string, number> = {};
    
    for (const sym of symbols) {
      const returns = this.historicalReturns.get(sym) || [];
      volatilities[sym] = this.calculateVolatility(returns);
    }
    
    // Calculate risk contribution for each position
    const riskContributions: Record<string, number> = {};
    let totalRisk = 0;
    
    // Start with equal weights
    const weights: Record<string, number> = {};
    const n = symbols.length;
    
    for (const sym of symbols) {
      weights[sym] = 1 / n;
    }
    
    // Simple iterative approach to risk parity
    for (let iter = 0; iter < 100; iter++) {
      // Calculate marginal risk contributions
      for (const sym1 of symbols) {
        riskContributions[sym1] = 0;
        
        for (const sym2 of symbols) {
          riskContributions[sym1] += weights[sym1] * weights[sym2] * 
            correlationMatrix[sym1][sym2] * volatilities[sym1] * volatilities[sym2];
        }
        
        totalRisk += riskContributions[sym1];
      }
      
      // Adjust weights to equalize risk contributions
      for (const sym of symbols) {
        weights[sym] *= Math.sqrt(1 / (n * riskContributions[sym]));
      }
      
      // Normalize weights
      const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
      for (const sym of symbols) {
        weights[sym] /= totalWeight;
      }
    }
    
    // Calculate position value based on weight
    const positionValue = Math.min(accountValue * weights[symbol], maxPositionValue);
    const shares = Math.floor(positionValue / entryPrice);
    
    const result = this.calculateRiskMetrics(symbol, entryPrice, shares, stopLossPrice, takeProfitPrice, accountValue, maxPositionValue, PositionSizingMethod.RISK_PARITY);
    
    // Add adjustment factors
    result.adjustmentFactors = {
      portfolioHeatmap: correlationMatrix[symbol]
    };
    
    return result;
  }
  
  /**
   * Calculates risk parity portfolio
   * @param portfolio Current portfolio
   * @param options Position sizing options
   * @param correlationMatrix Correlation matrix
   * @param volatilities Volatilities for each symbol
   * @returns Array of position sizing recommendations
   */
  private calculateRiskParityPortfolio(
    portfolio: Portfolio,
    options: PositionSizingOptions,
    correlationMatrix: Record<string, Record<string, number>>,
    volatilities: Record<string, number>
  ): PositionSizingRecommendation[] {
    const { accountValue } = options;
    const symbols = portfolio.positions.map(p => p.symbol);
    
    // Start with equal weights
    const weights: Record<string, number> = {};
    const n = symbols.length;
    
    for (const symbol of symbols) {
      weights[symbol] = 1 / n;
    }
    
    // Calculate risk contribution for each position
    const riskContributions: Record<string, number> = {};
    let totalRisk = 0;
    
    // Simple iterative approach to risk parity
    for (let iter = 0; iter < 100; iter++) {
      // Reset risk contributions
      for (const symbol of symbols) {
        riskContributions[symbol] = 0;
      }
      
      // Calculate marginal risk contributions
      for (const symbol1 of symbols) {
        for (const symbol2 of symbols) {
          riskContributions[symbol1] += weights[symbol1] * weights[symbol2] * 
            correlationMatrix[symbol1][symbol2] * volatilities[symbol1] * volatilities[symbol2];
        }
        
        totalRisk += riskContributions[symbol1];
      }
      
      // Adjust weights to equalize risk contributions
      for (const symbol of symbols) {
        weights[symbol] *= Math.sqrt(1 / (n * riskContributions[symbol]));
      }
      
      // Normalize weights
      const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
      for (const symbol of symbols) {
        weights[symbol] /= totalWeight;
      }
    }
    
    // Calculate position sizes based on weights
    const recommendations: PositionSizingRecommendation[] = [];
    
    for (const position of portfolio.positions) {
      const symbol = position.symbol;
      const weight = weights[symbol];
      const positionValue = accountValue * weight;
      const recommendedShares = Math.floor(positionValue / position.price);
      
      // Calculate risk metrics
      const riskContribution = riskContributions[symbol];
      const riskContributionPercentage = (riskContribution / totalRisk) * 100;
      
      recommendations.push({
        symbol,
        currentSize: position.quantity,
        recommendedSize: recommendedShares,
        sizeChange: recommendedShares - position.quantity,
        sizeChangePercentage: ((recommendedShares - position.quantity) / position.quantity) * 100,
        riskContribution,
        riskContributionPercentage,
        method: PositionSizingMethod.RISK_PARITY,
        confidence: 0.95,
        metadata: {
          weight,
          positionValue,
          volatility: volatilities[symbol],
          correlations: correlationMatrix[symbol]
        }
      });
    }
    
    return recommendations;
  }
  
  /**
   * Calculates correlation-adjusted portfolio
   * @param portfolio Current portfolio
   * @param options Position sizing options
   * @param correlationMatrix Correlation matrix
   * @returns Array of position sizing recommendations
   */
  private calculateCorrelationAdjustedPortfolio(
    portfolio: Portfolio,
    options: PositionSizingOptions,
    correlationMatrix: Record<string, Record<string, number>>
  ): PositionSizingRecommendation[] {
    const { accountValue, maxRiskPerTradePercent } = options;
    const symbols = portfolio.positions.map(p => p.symbol);
    
    // Calculate average correlation for each position
    const avgCorrelations: Record<string, number> = {};
    
    for (const symbol of symbols) {
      let totalCorrelation = 0;
      let count = 0;
      
      for (const otherSymbol of symbols) {
        if (symbol !== otherSymbol) {
          totalCorrelation += Math.abs(correlationMatrix[symbol][otherSymbol]);
          count++;
        }
      }
      
      avgCorrelations[symbol] = count > 0 ? totalCorrelation / count : 0;
    }
    
    // Calculate correlation adjustment factors
    const adjustmentFactors: Record<string, number> = {};
    
    for (const symbol of symbols) {
      // Higher correlation = lower position size
      adjustmentFactors[symbol] = 1 - avgCorrelations[symbol] * 0.5;
      
      // Ensure factor is within reasonable bounds
      adjustmentFactors[symbol] = Math.max(0.5, Math.min(1.5, adjustmentFactors[symbol]));
    }
    
    // Calculate position sizes based on adjustment factors
    const recommendations: PositionSizingRecommendation[] = [];
    
    for (const position of portfolio.positions) {
      const symbol = position.symbol;
      const adjustmentFactor = adjustmentFactors[symbol];
      
      // Calculate risk amount
      const maxRiskAmount = accountValue * (maxRiskPerTradePercent / 100) * adjustmentFactor;
      
      // Calculate risk per share (assuming 5% stop loss if not specified)
      const stopLossPrice = position.price * 0.95;
      const riskPerShare = Math.abs(position.price - stopLossPrice);
      
      // Calculate shares based on risk
      const recommendedShares = Math.floor(maxRiskAmount / riskPerShare);
      
      // Calculate risk metrics
      const riskAmount = recommendedShares * riskPerShare;
      const riskPercent = (riskAmount / accountValue) * 100;
      
      recommendations.push({
        symbol,
        currentSize: position.quantity,
        recommendedSize: recommendedShares,
        sizeChange: recommendedShares - position.quantity,
        sizeChangePercentage: ((recommendedShares - position.quantity) / position.quantity) * 100,
        riskContribution: riskAmount,
        riskContributionPercentage: riskPercent,
        method: PositionSizingMethod.CORRELATION_ADJUSTED,
        confidence: 0.95,
        metadata: {
          adjustmentFactor,
          averageCorrelation: avgCorrelations[symbol],
          correlations: correlationMatrix[symbol]
        }
      });
    }
    
    return recommendations;
  }
  
  /**
   * Calculates equal risk portfolio
   * @param portfolio Current portfolio
   * @param options Position sizing options
   * @param volatilities Volatilities for each symbol
   * @returns Array of position sizing recommendations
   */
  private calculateEqualRiskPortfolio(
    portfolio: Portfolio,
    options: PositionSizingOptions,
    volatilities: Record<string, number>
  ): PositionSizingRecommendation[] {
    const { accountValue, maxRiskPerTradePercent } = options;
    const symbols = portfolio.positions.map(p => p.symbol);
    
    // Calculate total risk budget
    const totalRiskBudget = accountValue * (maxRiskPerTradePercent / 100);
    
    // Equal risk per position
    const riskPerPosition = totalRiskBudget / symbols.length;
    
    // Calculate position sizes based on equal risk
    const recommendations: PositionSizingRecommendation[] = [];
    
    for (const position of portfolio.positions) {
      const symbol = position.symbol;
      
      // Use volatility or default to 5% of price
      const volatility = volatilities[symbol] || 0.05;
      const riskPerShare = position.price * volatility;
      
      // Calculate shares based on risk
      const recommendedShares = Math.floor(riskPerPosition / riskPerShare);
      
      // Calculate risk metrics
      const actualRiskAmount = recommendedShares * riskPerShare;
      const riskPercent = (actualRiskAmount / accountValue) * 100;
      
      recommendations.push({
        symbol,
        currentSize: position.quantity,
        recommendedSize: recommendedShares,
        sizeChange: recommendedShares - position.quantity,
        sizeChangePercentage: ((recommendedShares - position.quantity) / position.quantity) * 100,
        riskContribution: actualRiskAmount,
        riskContributionPercentage: riskPercent,
        method: PositionSizingMethod.EQUAL_RISK,
        confidence: 0.95,
        metadata: {
          volatility: volatility,
          riskBudget: riskPerPosition
        }
      });
    }
    
    return recommendations;
  }
  
  /**
   * Applies position sizing constraints
   * @param result Position sizing result
   * @param options Position sizing options
   * @returns Adjusted position sizing result
   */
  private applyPositionSizingConstraints(
    result: PositionSizingResult,
    options: PositionSizingOptions
  ): PositionSizingResult {
    const { minPositionSize, maxPositionSize, incrementSize, roundLotSize } = options;
    
    // Apply minimum position size
    if (minPositionSize !== undefined && result.shares < minPositionSize) {
      result.shares = minPositionSize;
    }
    
    // Apply maximum position size
    if (maxPositionSize !== undefined && result.shares > maxPositionSize) {
      result.shares = maxPositionSize;
    }
    
    // Apply increment size
    if (incrementSize !== undefined && incrementSize > 0) {
      result.shares = Math.floor(result.shares / incrementSize) * incrementSize;
    }
    
    // Apply round lot size
    if (roundLotSize !== undefined && roundLotSize > 0) {
      result.shares = Math.floor(result.shares / roundLotSize) * roundLotSize;
    }
    
    // Recalculate position value and risk metrics
    result.positionValue = result.shares * result.entryPrice;
    
    // Recalculate risk amount and percentage
    if (result.potentialLoss !== undefined) {
      result.riskAmount = result.potentialLoss;
      result.riskPercent = (result.riskAmount / options.accountValue) * 100;
    }
    
    return result;
  }
  
  /**
   * Calculates risk metrics for a position
   * @param symbol Symbol
   * @param entryPrice Entry price
   * @param shares Number of shares
   * @param stopLossPrice Stop loss price
   * @param takeProfitPrice Take profit price
   * @param accountValue Account value
   * @param maxPositionSize Maximum position size
   * @param method Position sizing method
   * @returns Position sizing result with risk metrics
   */
  private calculateRiskMetrics(
    symbol: string,
    entryPrice: number,
    shares: number,
    stopLossPrice: number,
    takeProfitPrice: number | undefined,
    accountValue: number,
    maxPositionSize: number,
    method: PositionSizingMethod
  ): PositionSizingResult {
    const positionValue = shares * entryPrice;
    
    // Calculate risk metrics
    const riskPerShare = Math.abs(entryPrice - stopLossPrice);
    const riskAmount = shares * riskPerShare;
    const riskPercent = (riskAmount / accountValue) * 100;
    
    // Calculate profit potential if take profit is set
    let potentialProfit: number | undefined;
    let potentialLoss: number | undefined;
    let riskRewardRatio: number | undefined;
    
    if (takeProfitPrice !== undefined) {
      potentialProfit = shares * Math.abs(takeProfitPrice - entryPrice);
      potentialLoss = riskAmount;
      riskRewardRatio = potentialProfit / potentialLoss;
    }
    
    return {
      symbol,
      entryPrice,
      shares,
      positionValue,
      riskAmount,
      riskPercent,
      potentialProfit,
      potentialLoss,
      riskRewardRatio,
      maxPositionSize,
      method
    };
  }
  
  /**
   * Loads historical data for a symbol
   * @param symbol Symbol
   * @param lookbackPeriod Lookback period in days
   */
  private async loadHistoricalData(symbol: string, lookbackPeriod: number): Promise<void> {
    // Skip if already loaded
    if (this.historicalReturns.has(symbol)) {
      return;
    }
    
    try {
      // Load historical prices
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - lookbackPeriod - 1); // Extra day for calculating returns
      
      const historicalData = await this.financialDataService.getHistoricalPrices(
        symbol,
        startDate,
        endDate,
        'daily'
      );
      
      // Calculate returns
      const prices = historicalData.map(d => d.close);
      const returns: number[] = [];
      
      for (let i = 1; i < prices.length; i++) {
        // Log returns
        const returnValue = Math.log(prices[i] / prices[i - 1]);
        returns.push(returnValue);
      }
      
      // Store returns
      this.historicalReturns.set(symbol, returns);
      
      // Calculate and store volatility
      const volatility = this.calculateVolatility(returns);
      this.historicalVolatility.set(symbol, volatility);
    } catch (error) {
      console.error(`Error loading historical data for ${symbol}:`, error);
      // Use empty array for missing data
      this.historicalReturns.set(symbol, []);
      this.historicalVolatility.set(symbol, 0);
    }
  }
  
  /**
   * Calculates volatility of returns
   * @param returns Array of returns
   * @returns Volatility (standard deviation)
   */
  private calculateVolatility(returns: number[]): number {
    if (returns.length === 0) {
      return 0;
    }
    
    // Calculate mean
    const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length;
    
    // Calculate sum of squared differences
    const sumSquaredDiff = returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
    
    // Calculate standard deviation
    return Math.sqrt(sumSquaredDiff / returns.length);
  }
  
  /**
   * Validates inputs for position sizing
   * @param setup Trade setup
   * @param options Position sizing options
   */
  private validateInputs(setup: TradeSetup, options: PositionSizingOptions): void {
    // Validate trade setup
    if (!setup.symbol) {
      throw new Error('Symbol is required');
    }
    
    if (!setup.entryPrice || setup.entryPrice <= 0) {
      throw new Error('Entry price must be positive');
    }
    
    if (!setup.stopLossPrice || setup.stopLossPrice <= 0) {
      throw new Error('Stop loss price must be positive');
    }
    
    // Validate options
    if (!options.accountValue || options.accountValue <= 0) {
      throw new Error('Account value must be positive');
    }
    
    if (!options.maxPositionSizePercent || options.maxPositionSizePercent <= 0 || options.maxPositionSizePercent > 100) {
      throw new Error('Max position size percent must be between 0 and 100');
    }
    
    if (!options.maxRiskPerTradePercent || options.maxRiskPerTradePercent <= 0 || options.maxRiskPerTradePercent > 100) {
      throw new Error('Max risk per trade percent must be between 0 and 100');
    }
    
    if (!options.lookbackPeriod || options.lookbackPeriod < 0) {
      throw new Error('Lookback period must be positive');
    }
  }
}

// Export singleton instance
export const positionSizingService = new PositionSizingService();