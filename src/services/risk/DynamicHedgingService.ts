import { EventEmitter } from 'events';
import {
  Portfolio,
  Position,
  RiskMetricType,
  AssetClass
} from './models/RiskModels';
import { CorrelationAnalysisService, CorrelationMethod } from './CorrelationAnalysisService';
import { HistoricalVaRService } from './HistoricalVaRService';
import { FinancialDataService } from '../api/financialData/FinancialDataService';
import { FinancialDataServiceFactory } from '../api/financialData/FinancialDataServiceFactory';
import { MarketDataService } from '../api/marketData/MarketDataService';
import { MarketDataServiceFactory } from '../api/marketData/MarketDataServiceFactory';
import { positionTrackingService } from '../api/trading/PositionTrackingService';

/**
 * Hedging strategy types
 */
export enum HedgingStrategy {
  DIRECT_HEDGE = 'direct_hedge',
  BETA_HEDGE = 'beta_hedge',
  OPTIONS_HEDGE = 'options_hedge',
  CROSS_ASSET_HEDGE = 'cross_asset_hedge',
  VOLATILITY_HEDGE = 'volatility_hedge',
  CORRELATION_BASED_HEDGE = 'correlation_based_hedge',
  SECTOR_HEDGE = 'sector_hedge',
  MACRO_HEDGE = 'macro_hedge'
}

/**
 * Hedging instrument types
 */
export enum HedgingInstrument {
  ETF = 'etf',
  FUTURES = 'futures',
  OPTIONS = 'options',
  INVERSE_ETF = 'inverse_etf',
  INDEX_OPTIONS = 'index_options',
  VOLATILITY_PRODUCTS = 'volatility_products',
  SECTOR_ETF = 'sector_etf',
  INDIVIDUAL_STOCK = 'individual_stock'
}

/**
 * Hedging options
 */
export interface HedgingOptions {
  strategy: HedgingStrategy;
  instruments: HedgingInstrument[];
  hedgeRatio: number;
  maxHedgeCost: number;
  lookbackPeriod: number;
  rebalanceThreshold: number;
  useOptionsHedging?: boolean;
  optionsDelta?: number;
  useVolatilityHedging?: boolean;
  useSectorHedging?: boolean;
  useMacroHedging?: boolean;
  correlationThreshold?: number;
  betaThreshold?: number;
}

/**
 * Hedge position recommendation
 */
export interface HedgeRecommendation {
  symbol: string;
  instrumentType: HedgingInstrument;
  quantity: number;
  estimatedCost: number;
  hedgeRatio: number;
  hedgeEffectiveness: number;
  expectedRiskReduction: number;
  correlationWithPortfolio: number;
  betaToPortfolio?: number;
  impliedVolatility?: number;
  expirationDate?: Date;
  strikePrice?: number;
}

/**
 * Portfolio hedge result
 */
export interface PortfolioHedgeResult {
  originalRisk: number;
  hedgedRisk: number;
  riskReduction: number;
  riskReductionPercent: number;
  hedgeCost: number;
  hedgeCostPercent: number;
  hedgeEfficiency: number;
  recommendations: HedgeRecommendation[];
}

/**
 * Service for dynamic hedging strategies
 */
export class DynamicHedgingService extends EventEmitter {
  private correlationService: CorrelationAnalysisService;
  private varService: HistoricalVaRService;
  private financialDataService: FinancialDataService;
  private marketDataService: MarketDataService;
  private historicalBetas: Map<string, number> = new Map();
  private historicalVolatilities: Map<string, number> = new Map();
  private hedgingInstruments: Map<string, Map<HedgingInstrument, string[]>> = new Map();
  
  /**
   * Creates a new DynamicHedgingService
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
    
    // Initialize hedging instruments
    this.initializeHedgingInstruments();
  }
  
  /**
   * Calculates optimal hedging strategy for a portfolio
   * @param portfolio Portfolio to hedge
   * @param options Hedging options
   * @returns Portfolio hedge result
   */
  public async calculateOptimalHedge(
    portfolio: Portfolio,
    options: HedgingOptions
  ): Promise<PortfolioHedgeResult> {
    // Calculate original portfolio risk (VaR)
    const originalVaR = await this.calculatePortfolioVaR(portfolio);
    
    // Select hedging strategy based on options
    let recommendations: HedgeRecommendation[] = [];
    
    switch (options.strategy) {
      case HedgingStrategy.DIRECT_HEDGE:
        recommendations = await this.calculateDirectHedge(portfolio, options);
        break;
      case HedgingStrategy.BETA_HEDGE:
        recommendations = await this.calculateBetaHedge(portfolio, options);
        break;
      case HedgingStrategy.OPTIONS_HEDGE:
        recommendations = await this.calculateOptionsHedge(portfolio, options);
        break;
      case HedgingStrategy.CROSS_ASSET_HEDGE:
        recommendations = await this.calculateCrossAssetHedge(portfolio, options);
        break;
      case HedgingStrategy.VOLATILITY_HEDGE:
        recommendations = await this.calculateVolatilityHedge(portfolio, options);
        break;
      case HedgingStrategy.CORRELATION_BASED_HEDGE:
        recommendations = await this.calculateCorrelationBasedHedge(portfolio, options);
        break;
      case HedgingStrategy.SECTOR_HEDGE:
        recommendations = await this.calculateSectorHedge(portfolio, options);
        break;
      case HedgingStrategy.MACRO_HEDGE:
        recommendations = await this.calculateMacroHedge(portfolio, options);
        break;
      default:
        recommendations = await this.calculateDirectHedge(portfolio, options);
    }
    
    // Calculate hedged portfolio risk
    const hedgedPortfolio = this.createHedgedPortfolio(portfolio, recommendations);
    const hedgedVaR = await this.calculatePortfolioVaR(hedgedPortfolio);
    
    // Calculate hedge cost
    const hedgeCost = this.calculateHedgeCost(recommendations);
    
    // Calculate risk reduction
    const riskReduction = originalVaR - hedgedVaR;
    const riskReductionPercent = (riskReduction / originalVaR) * 100;
    
    // Calculate hedge efficiency (risk reduction per unit of cost)
    const hedgeCostPercent = (hedgeCost / portfolio.totalValue) * 100;
    const hedgeEfficiency = riskReductionPercent / hedgeCostPercent;
    
    return {
      originalRisk: originalVaR,
      hedgedRisk: hedgedVaR,
      riskReduction,
      riskReductionPercent,
      hedgeCost,
      hedgeCostPercent,
      hedgeEfficiency,
      recommendations
    };
  }
  
  /**
   * Calculates direct hedging strategy (using inverse positions)
   * @param portfolio Portfolio to hedge
   * @param options Hedging options
   * @returns Hedge recommendations
   */
  private async calculateDirectHedge(
    portfolio: Portfolio,
    options: HedgingOptions
  ): Promise<HedgeRecommendation[]> {
    const recommendations: HedgeRecommendation[] = [];
    
    // Group positions by sector
    const positionsBySector = this.groupPositionsBySector(portfolio.positions);
    
    // Calculate sector exposures
    const sectorExposures = new Map<string, number>();
    
    for (const [sector, positions] of positionsBySector.entries()) {
      const exposure = positions.reduce((sum, pos) => sum + pos.value, 0);
      sectorExposures.set(sector, exposure);
    }
    
    // Find hedging instruments for each sector
    for (const [sector, exposure] of sectorExposures.entries()) {
      if (exposure > 0) {
        // Find appropriate hedging instrument (inverse ETF or short ETF)
        const hedgingInstrument = await this.findSectorHedgingInstrument(sector);
        
        if (hedgingInstrument) {
          // Get current price of hedging instrument
          const quote = await this.marketDataService.getQuote(hedgingInstrument);
          
          // Calculate quantity based on hedge ratio
          const hedgeValue = exposure * options.hedgeRatio;
          const quantity = Math.floor(hedgeValue / quote.price);
          
          // Calculate hedge effectiveness based on historical correlation
          const effectiveness = await this.calculateHedgeEffectiveness(
            sector,
            hedgingInstrument,
            options.lookbackPeriod
          );
          
          // Calculate expected risk reduction
          const expectedRiskReduction = hedgeValue * effectiveness;
          
          recommendations.push({
            symbol: hedgingInstrument,
            instrumentType: HedgingInstrument.INVERSE_ETF,
            quantity,
            estimatedCost: quantity * quote.price,
            hedgeRatio: options.hedgeRatio,
            hedgeEffectiveness: effectiveness,
            expectedRiskReduction,
            correlationWithPortfolio: -effectiveness // Inverse correlation
          });
        }
      }
    }
    
    return recommendations;
  }
  
  /**
   * Calculates beta-based hedging strategy
   * @param portfolio Portfolio to hedge
   * @param options Hedging options
   * @returns Hedge recommendations
   */
  private async calculateBetaHedge(
    portfolio: Portfolio,
    options: HedgingOptions
  ): Promise<HedgeRecommendation[]> {
    const recommendations: HedgeRecommendation[] = [];
    
    // Calculate portfolio beta to market
    const portfolioBeta = await this.calculatePortfolioBeta(portfolio);
    
    // Only hedge if beta is above threshold
    if (Math.abs(portfolioBeta) > (options.betaThreshold || 0.5)) {
      // Find appropriate market index ETF (e.g., SPY for S&P 500)
      const marketETF = 'SPY';
      
      // Get current price of market ETF
      const quote = await this.marketDataService.getQuote(marketETF);
      
      // Calculate hedge value based on portfolio value, beta, and hedge ratio
      const hedgeValue = portfolio.totalValue * portfolioBeta * options.hedgeRatio;
      
      // Calculate quantity (negative for short position)
      const quantity = -Math.floor(hedgeValue / quote.price);
      
      // Calculate hedge effectiveness based on beta
      const effectiveness = Math.min(1, Math.abs(portfolioBeta));
      
      // Calculate expected risk reduction
      const expectedRiskReduction = Math.abs(hedgeValue) * effectiveness;
      
      recommendations.push({
        symbol: marketETF,
        instrumentType: HedgingInstrument.ETF,
        quantity,
        estimatedCost: Math.abs(quantity * quote.price),
        hedgeRatio: options.hedgeRatio,
        hedgeEffectiveness: effectiveness,
        expectedRiskReduction,
        correlationWithPortfolio: -Math.sign(portfolioBeta), // Inverse correlation
        betaToPortfolio: portfolioBeta
      });
    }
    
    return recommendations;
  }
  
  /**
   * Calculates options-based hedging strategy
   * @param portfolio Portfolio to hedge
   * @param options Hedging options
   * @returns Hedge recommendations
   */
  private async calculateOptionsHedge(
    portfolio: Portfolio,
    options: HedgingOptions
  ): Promise<HedgeRecommendation[]> {
    const recommendations: HedgeRecommendation[] = [];
    
    // Only proceed if options hedging is enabled
    if (!options.useOptionsHedging) {
      return recommendations;
    }
    
    // Calculate portfolio beta to market
    const portfolioBeta = await this.calculatePortfolioBeta(portfolio);
    
    // Find appropriate index options (e.g., SPX or SPY options)
    const indexOption = 'SPY';
    const optionType = 'PUT';
    
    // Get current price of underlying
    const quote = await this.marketDataService.getQuote(indexOption);
    
    // Calculate appropriate strike price (e.g., 5% below current price)
    const strikePrice = Math.round(quote.price * 0.95);
    
    // Find expiration date (e.g., 30-60 days out)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 45);
    
    // Get option price (simplified - in reality would call option pricing API)
    const optionPrice = quote.price * 0.03; // Simplified estimation
    
    // Calculate implied volatility (simplified)
    const impliedVolatility = 0.20; // 20% annualized volatility
    
    // Calculate option delta (simplified)
    const optionDelta = options.optionsDelta || 0.3; // Typical put delta
    
    // Calculate number of contracts needed based on portfolio value and delta
    const notionalValue = portfolio.totalValue * portfolioBeta * options.hedgeRatio;
    const contractSize = 100; // Standard option contract size
    const numContracts = Math.ceil(notionalValue / (quote.price * contractSize * optionDelta));
    
    // Calculate hedge effectiveness (options provide asymmetric protection)
    const effectiveness = 0.8; // Options typically provide good downside protection
    
    // Calculate expected risk reduction
    const expectedRiskReduction = notionalValue * effectiveness;
    
    // Calculate estimated cost
    const estimatedCost = numContracts * optionPrice * contractSize;
    
    // Only add recommendation if cost is below maximum
    if (estimatedCost <= options.maxHedgeCost) {
      recommendations.push({
        symbol: `${indexOption} ${optionType} ${strikePrice} ${expirationDate.toISOString().split('T')[0]}`,
        instrumentType: HedgingInstrument.OPTIONS,
        quantity: numContracts,
        estimatedCost,
        hedgeRatio: options.hedgeRatio,
        hedgeEffectiveness: effectiveness,
        expectedRiskReduction,
        correlationWithPortfolio: -1, // Put options have negative correlation to market
        impliedVolatility,
        expirationDate,
        strikePrice
      });
    }
    
    return recommendations;
  }
  
  /**
   * Calculates cross-asset hedging strategy
   * @param portfolio Portfolio to hedge
   * @param options Hedging options
   * @returns Hedge recommendations
   */
  private async calculateCrossAssetHedge(
    portfolio: Portfolio,
    options: HedgingOptions
  ): Promise<HedgeRecommendation[]> {
    const recommendations: HedgeRecommendation[] = [];
    
    // Determine dominant asset classes in portfolio
    const assetClassExposures = this.calculateAssetClassExposures(portfolio);
    
    // Find negatively correlated asset classes
    for (const [assetClass, exposure] of assetClassExposures.entries()) {
      if (exposure > 0) {
        // Find hedging instruments for this asset class
        const hedgingInstruments = await this.findCrossAssetHedgingInstruments(
          assetClass,
          options.lookbackPeriod
        );
        
        for (const instrument of hedgingInstruments) {
          // Get current price of hedging instrument
          const quote = await this.marketDataService.getQuote(instrument.symbol);
          
          // Calculate quantity based on hedge ratio and correlation
          const hedgeValue = exposure * options.hedgeRatio * Math.abs(instrument.correlation);
          const quantity = Math.floor(hedgeValue / quote.price);
          
          // Calculate expected risk reduction
          const expectedRiskReduction = hedgeValue * Math.abs(instrument.correlation);
          
          recommendations.push({
            symbol: instrument.symbol,
            instrumentType: instrument.type,
            quantity,
            estimatedCost: quantity * quote.price,
            hedgeRatio: options.hedgeRatio * Math.abs(instrument.correlation),
            hedgeEffectiveness: Math.abs(instrument.correlation),
            expectedRiskReduction,
            correlationWithPortfolio: instrument.correlation
          });
        }
      }
    }
    
    // Sort by hedge effectiveness and limit to top recommendations
    recommendations.sort((a, b) => b.hedgeEffectiveness - a.hedgeEffectiveness);
    
    return recommendations.slice(0, 3); // Limit to top 3 recommendations
  }
  
  /**
   * Calculates volatility-based hedging strategy
   * @param portfolio Portfolio to hedge
   * @param options Hedging options
   * @returns Hedge recommendations
   */
  private async calculateVolatilityHedge(
    portfolio: Portfolio,
    options: HedgingOptions
  ): Promise<HedgeRecommendation[]> {
    const recommendations: HedgeRecommendation[] = [];
    
    // Only proceed if volatility hedging is enabled
    if (!options.useVolatilityHedging) {
      return recommendations;
    }
    
    // Calculate portfolio volatility
    const portfolioVolatility = await this.calculatePortfolioVolatility(portfolio);
    
    // Only hedge if volatility is high
    if (portfolioVolatility > 0.15) { // 15% annualized volatility threshold
      // Use VIX-based products for volatility hedging
      const volatilityETF = 'VXX'; // iPath Series B S&P 500 VIX Short-Term Futures ETN
      
      // Get current price of volatility ETF
      const quote = await this.marketDataService.getQuote(volatilityETF);
      
      // Calculate hedge value based on portfolio value and hedge ratio
      // Higher portfolio volatility = higher hedge ratio
      const adjustedHedgeRatio = options.hedgeRatio * (portfolioVolatility / 0.15);
      const hedgeValue = portfolio.totalValue * adjustedHedgeRatio * 0.05; // Typically small allocation
      
      // Calculate quantity
      const quantity = Math.floor(hedgeValue / quote.price);
      
      // Calculate hedge effectiveness based on historical correlation
      const effectiveness = 0.6; // Volatility products are imperfect hedges
      
      // Calculate expected risk reduction
      const expectedRiskReduction = hedgeValue * effectiveness;
      
      recommendations.push({
        symbol: volatilityETF,
        instrumentType: HedgingInstrument.VOLATILITY_PRODUCTS,
        quantity,
        estimatedCost: quantity * quote.price,
        hedgeRatio: adjustedHedgeRatio,
        hedgeEffectiveness: effectiveness,
        expectedRiskReduction,
        correlationWithPortfolio: -0.7, // Typically negative correlation during stress
        impliedVolatility: portfolioVolatility
      });
    }
    
    return recommendations;
  }
  
  /**
   * Calculates correlation-based hedging strategy
   * @param portfolio Portfolio to hedge
   * @param options Hedging options
   * @returns Hedge recommendations
   */
  private async calculateCorrelationBasedHedge(
    portfolio: Portfolio,
    options: HedgingOptions
  ): Promise<HedgeRecommendation[]> {
    const recommendations: HedgeRecommendation[] = [];
    
    // Get portfolio symbols
    const symbols = portfolio.positions.map(p => p.symbol);
    
    // Calculate correlation matrix
    const correlationResult = await this.correlationService.calculateCorrelationMatrix(
      symbols,
      {
        lookbackPeriod: options.lookbackPeriod,
        method: CorrelationMethod.PEARSON,
        useLogReturns: true
      }
    );
    
    const correlationMatrix = correlationResult.value;
    
    // Find clusters of highly correlated assets
    const clusters = this.findCorrelationClusters(correlationMatrix, options.correlationThreshold || 0.7);
    
    // For each cluster, find an appropriate hedging instrument
    for (const cluster of clusters) {
      // Calculate cluster exposure
      const clusterExposure = cluster.symbols.reduce((sum, symbol) => {
        const position = portfolio.positions.find(p => p.symbol === symbol);
        return sum + (position ? position.value : 0);
      }, 0);
      
      // Find hedging instrument with negative correlation to this cluster
      const hedgingInstrument = await this.findNegativelyCorrelatedInstrument(
        cluster.symbols,
        options.lookbackPeriod
      );
      
      if (hedgingInstrument) {
        // Get current price of hedging instrument
        const quote = await this.marketDataService.getQuote(hedgingInstrument.symbol);
        
        // Calculate quantity based on hedge ratio and correlation
        const hedgeValue = clusterExposure * options.hedgeRatio * Math.abs(hedgingInstrument.correlation);
        const quantity = Math.floor(hedgeValue / quote.price);
        
        // Calculate expected risk reduction
        const expectedRiskReduction = hedgeValue * Math.abs(hedgingInstrument.correlation);
        
        recommendations.push({
          symbol: hedgingInstrument.symbol,
          instrumentType: hedgingInstrument.type,
          quantity,
          estimatedCost: quantity * quote.price,
          hedgeRatio: options.hedgeRatio * Math.abs(hedgingInstrument.correlation),
          hedgeEffectiveness: Math.abs(hedgingInstrument.correlation),
          expectedRiskReduction,
          correlationWithPortfolio: hedgingInstrument.correlation
        });
      }
    }
    
    return recommendations;
  }
  
  /**
   * Calculates sector-based hedging strategy
   * @param portfolio Portfolio to hedge
   * @param options Hedging options
   * @returns Hedge recommendations
   */
  private async calculateSectorHedge(
    portfolio: Portfolio,
    options: HedgingOptions
  ): Promise<HedgeRecommendation[]> {
    const recommendations: HedgeRecommendation[] = [];
    
    // Only proceed if sector hedging is enabled
    if (!options.useSectorHedging) {
      return recommendations;
    }
    
    // Group positions by sector
    const positionsBySector = this.groupPositionsBySector(portfolio.positions);
    
    // Calculate sector exposures
    const sectorExposures = new Map<string, number>();
    
    for (const [sector, positions] of positionsBySector.entries()) {
      const exposure = positions.reduce((sum, pos) => sum + pos.value, 0);
      sectorExposures.set(sector, exposure);
    }
    
    // Find sectors with high concentration
    const totalValue = portfolio.totalValue;
    const highConcentrationSectors = Array.from(sectorExposures.entries())
      .filter(([_, exposure]) => (exposure / totalValue) > 0.15) // 15% threshold
      .map(([sector, exposure]) => ({ sector, exposure }));
    
    // For each high concentration sector, find a sector ETF to hedge
    for (const { sector, exposure } of highConcentrationSectors) {
      const sectorETF = await this.findSectorETF(sector);
      
      if (sectorETF) {
        // Get current price of sector ETF
        const quote = await this.marketDataService.getQuote(sectorETF);
        
        // Calculate quantity based on hedge ratio
        const hedgeValue = exposure * options.hedgeRatio;
        const quantity = -Math.floor(hedgeValue / quote.price); // Negative for short position
        
        // Calculate hedge effectiveness
        const effectiveness = 0.8; // Sector ETFs typically provide good sector exposure
        
        // Calculate expected risk reduction
        const expectedRiskReduction = Math.abs(hedgeValue * effectiveness);
        
        recommendations.push({
          symbol: sectorETF,
          instrumentType: HedgingInstrument.SECTOR_ETF,
          quantity,
          estimatedCost: Math.abs(quantity * quote.price),
          hedgeRatio: options.hedgeRatio,
          hedgeEffectiveness: effectiveness,
          expectedRiskReduction,
          correlationWithPortfolio: -0.8 // Typically high negative correlation when short
        });
      }
    }
    
    return recommendations;
  }
  
  /**
   * Calculates macro hedging strategy
   * @param portfolio Portfolio to hedge
   * @param options Hedging options
   * @returns Hedge recommendations
   */
  private async calculateMacroHedge(
    portfolio: Portfolio,
    options: HedgingOptions
  ): Promise<HedgeRecommendation[]> {
    const recommendations: HedgeRecommendation[] = [];
    
    // Only proceed if macro hedging is enabled
    if (!options.useMacroHedging) {
      return recommendations;
    }
    
    // Define macro hedging instruments
    const macroHedges = [
      { symbol: 'TLT', type: HedgingInstrument.ETF, description: 'Long-Term Treasury Bond ETF' },
      { symbol: 'GLD', type: HedgingInstrument.ETF, description: 'Gold ETF' },
      { symbol: 'VXX', type: HedgingInstrument.VOLATILITY_PRODUCTS, description: 'Volatility ETN' }
    ];
    
    // Calculate portfolio characteristics
    const portfolioBeta = await this.calculatePortfolioBeta(portfolio);
    const portfolioVolatility = await this.calculatePortfolioVolatility(portfolio);
    
    // Determine macro hedge allocation based on portfolio characteristics
    let treasuryAllocation = 0;
    let goldAllocation = 0;
    let volatilityAllocation = 0;
    
    if (portfolioBeta > 1.2) {
      // High beta portfolio - increase hedging
      treasuryAllocation = 0.4;
      goldAllocation = 0.3;
      volatilityAllocation = 0.3;
    } else if (portfolioBeta > 0.8) {
      // Medium beta portfolio
      treasuryAllocation = 0.5;
      goldAllocation = 0.3;
      volatilityAllocation = 0.2;
    } else {
      // Low beta portfolio
      treasuryAllocation = 0.6;
      goldAllocation = 0.3;
      volatilityAllocation = 0.1;
    }
    
    // Adjust based on volatility
    if (portfolioVolatility > 0.2) {
      // High volatility - increase volatility products
      volatilityAllocation += 0.1;
      treasuryAllocation -= 0.05;
      goldAllocation -= 0.05;
    }
    
    // Calculate total hedge value
    const totalHedgeValue = portfolio.totalValue * options.hedgeRatio;
    
    // Create recommendations for each macro hedge
    for (const hedge of macroHedges) {
      let allocation = 0;
      
      switch (hedge.symbol) {
        case 'TLT':
          allocation = treasuryAllocation;
          break;
        case 'GLD':
          allocation = goldAllocation;
          break;
        case 'VXX':
          allocation = volatilityAllocation;
          break;
      }
      
      // Get current price of hedging instrument
      const quote = await this.marketDataService.getQuote(hedge.symbol);
      
      // Calculate quantity
      const hedgeValue = totalHedgeValue * allocation;
      const quantity = Math.floor(hedgeValue / quote.price);
      
      // Calculate hedge effectiveness (simplified)
      const effectiveness = 0.6; // Macro hedges are imperfect
      
      // Calculate expected risk reduction
      const expectedRiskReduction = hedgeValue * effectiveness;
      
      recommendations.push({
        symbol: hedge.symbol,
        instrumentType: hedge.type,
        quantity,
        estimatedCost: quantity * quote.price,
        hedgeRatio: options.hedgeRatio * allocation,
        hedgeEffectiveness: effectiveness,
        expectedRiskReduction,
        correlationWithPortfolio: -0.3 // Typically moderate negative correlation
      });
    }
    
    return recommendations;
  }
  
  /**
   * Calculates portfolio VaR
   * @param portfolio Portfolio
   * @returns Value at Risk
   */
  private async calculatePortfolioVaR(portfolio: Portfolio): Promise<number> {
    try {
      // Use VaR service to calculate portfolio VaR
      const varResult = await this.varService.calculateHistoricalVaR(
        portfolio,
        {
          confidenceLevel: 0.95,
          timeHorizon: 1,
          lookbackPeriod: 252
        }
      );
      
      return varResult.value;
    } catch (error) {
      console.error('Error calculating portfolio VaR:', error);
      
      // Fallback calculation (simplified)
      const portfolioVolatility = await this.calculatePortfolioVolatility(portfolio);
      const varEstimate = portfolio.totalValue * portfolioVolatility * 1.65; // 95% confidence
      
      return varEstimate;
    }
  }
  
  /**
   * Calculates portfolio beta to market
   * @param portfolio Portfolio
   * @returns Portfolio beta
   */
  private async calculatePortfolioBeta(portfolio: Portfolio): Promise<number> {
    // Calculate weighted average beta
    let weightedBetaSum = 0;
    let weightSum = 0;
    
    for (const position of portfolio.positions) {
      const beta = await this.getAssetBeta(position.symbol);
      weightedBetaSum += beta * position.value;
      weightSum += position.value;
    }
    
    return weightSum > 0 ? weightedBetaSum / weightSum : 1;
  }
  
  /**
   * Gets beta for an asset
   * @param symbol Asset symbol
   * @returns Beta value
   */
  private async getAssetBeta(symbol: string): Promise<number> {
    // Check cache first
    if (this.historicalBetas.has(symbol)) {
      return this.historicalBetas.get(symbol)!;
    }
    
    try {
      // In a real implementation, this would call a financial data API
      // For now, use a simplified approach
      
      // Get historical prices for symbol and market (SPY)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      
      const assetData = await this.financialDataService.getHistoricalPrices(
        symbol,
        startDate,
        endDate,
        'daily'
      );
      
      const marketData = await this.financialDataService.getHistoricalPrices(
        'SPY',
        startDate,
        endDate,
        'daily'
      );
      
      // Calculate returns
      const assetReturns: number[] = [];
      const marketReturns: number[] = [];
      
      for (let i = 1; i < assetData.length; i++) {
        assetReturns.push((assetData[i].close - assetData[i-1].close) / assetData[i-1].close);
      }
      
      for (let i = 1; i < marketData.length; i++) {
        marketReturns.push((marketData[i].close - marketData[i-1].close) / marketData[i-1].close);
      }
      
      // Calculate beta using covariance / variance
      const n = Math.min(assetReturns.length, marketReturns.length);
      
      // Calculate means
      const assetMean = assetReturns.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
      const marketMean = marketReturns.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
      
      // Calculate covariance and market variance
      let covariance = 0;
      let marketVariance = 0;
      
      for (let i = 0; i < n; i++) {
        covariance += (assetReturns[i] - assetMean) * (marketReturns[i] - marketMean);
        marketVariance += Math.pow(marketReturns[i] - marketMean, 2);
      }
      
      covariance /= n;
      marketVariance /= n;
      
      // Calculate beta
      const beta = marketVariance > 0 ? covariance / marketVariance : 1;
      
      // Cache result
      this.historicalBetas.set(symbol, beta);
      
      return beta;
    } catch (error) {
      console.error(`Error calculating beta for ${symbol}:`, error);
      return 1; // Default to market beta
    }
  }
  
  /**
   * Calculates portfolio volatility
   * @param portfolio Portfolio
   * @returns Annualized volatility
   */
  private async calculatePortfolioVolatility(portfolio: Portfolio): Promise<number> {
    try {
      // Get symbols and weights
      const symbols = portfolio.positions.map(p => p.symbol);
      const weights = portfolio.positions.map(p => p.value / portfolio.totalValue);
      
      // Calculate correlation matrix
      const correlationResult = await this.correlationService.calculateCorrelationMatrix(
        symbols,
        {
          lookbackPeriod: 252,
          method: CorrelationMethod.PEARSON,
          useLogReturns: true
        }
      );
      
      const correlationMatrix = correlationResult.value;
      
      // Get individual volatilities
      const volatilities: number[] = [];
      
      for (const symbol of symbols) {
        const vol = await this.getAssetVolatility(symbol);
        volatilities.push(vol);
      }
      
      // Calculate portfolio variance
      let portfolioVariance = 0;
      
      for (let i = 0; i < symbols.length; i++) {
        for (let j = 0; j < symbols.length; j++) {
          portfolioVariance += weights[i] * weights[j] * volatilities[i] * volatilities[j] * 
            correlationMatrix[symbols[i]][symbols[j]];
        }
      }
      
      // Return annualized volatility
      return Math.sqrt(portfolioVariance);
    } catch (error) {
      console.error('Error calculating portfolio volatility:', error);
      return 0.15; // Default to 15% annualized volatility
    }
  }
  
  /**
   * Gets volatility for an asset
   * @param symbol Asset symbol
   * @returns Annualized volatility
   */
  private async getAssetVolatility(symbol: string): Promise<number> {
    // Check cache first
    if (this.historicalVolatilities.has(symbol)) {
      return this.historicalVolatilities.get(symbol)!;
    }
    
    try {
      // Get historical prices
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      
      const historicalData = await this.financialDataService.getHistoricalPrices(
        symbol,
        startDate,
        endDate,
        'daily'
      );
      
      // Calculate log returns
      const returns: number[] = [];
      
      for (let i = 1; i < historicalData.length; i++) {
        returns.push(Math.log(historicalData[i].close / historicalData[i-1].close));
      }
      
      // Calculate standard deviation
      const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length;
      const variance = returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / returns.length;
      const dailyVolatility = Math.sqrt(variance);
      
      // Annualize (assuming 252 trading days)
      const annualizedVolatility = dailyVolatility * Math.sqrt(252);
      
      // Cache result
      this.historicalVolatilities.set(symbol, annualizedVolatility);
      
      return annualizedVolatility;
    } catch (error) {
      console.error(`Error calculating volatility for ${symbol}:`, error);
      return 0.3; // Default to 30% annualized volatility
    }
  }
  
  /**
   * Groups positions by sector
   * @param positions Array of positions
   * @returns Map of sector to positions
   */
  private groupPositionsBySector(positions: Position[]): Map<string, Position[]> {
    const positionsBySector = new Map<string, Position[]>();
    
    for (const position of positions) {
      const sector = position.sector || 'Unknown';
      
      if (!positionsBySector.has(sector)) {
        positionsBySector.set(sector, []);
      }
      
      positionsBySector.get(sector)!.push(position);
    }
    
    return positionsBySector;
  }
  
  /**
   * Calculates asset class exposures
   * @param portfolio Portfolio
   * @returns Map of asset class to exposure
   */
  private calculateAssetClassExposures(portfolio: Portfolio): Map<string, number> {
    const exposures = new Map<string, number>();
    
    for (const position of portfolio.positions) {
      const assetClass = position.assetClass || AssetClass.EQUITY;
      const exposure = exposures.get(assetClass) || 0;
      exposures.set(assetClass, exposure + position.value);
    }
    
    return exposures;
  }
  
  /**
   * Finds correlation clusters
   * @param correlationMatrix Correlation matrix
   * @param threshold Correlation threshold
   * @returns Array of correlation clusters
   */
  private findCorrelationClusters(
    correlationMatrix: Record<string, Record<string, number>>,
    threshold: number
  ): { symbols: string[], averageCorrelation: number }[] {
    const symbols = Object.keys(correlationMatrix);
    const clusters: { symbols: string[], averageCorrelation: number }[] = [];
    const assigned = new Set<string>();
    
    // For each symbol, find highly correlated symbols
    for (const symbol of symbols) {
      if (assigned.has(symbol)) {
        continue;
      }
      
      const cluster = [symbol];
      assigned.add(symbol);
      
      // Find highly correlated symbols
      for (const otherSymbol of symbols) {
        if (otherSymbol !== symbol && !assigned.has(otherSymbol) && 
            correlationMatrix[symbol][otherSymbol] >= threshold) {
          cluster.push(otherSymbol);
          assigned.add(otherSymbol);
        }
      }
      
      // Calculate average correlation within cluster
      let totalCorrelation = 0;
      let count = 0;
      
      for (let i = 0; i < cluster.length; i++) {
        for (let j = i + 1; j < cluster.length; j++) {
          totalCorrelation += correlationMatrix[cluster[i]][cluster[j]];
          count++;
        }
      }
      
      const averageCorrelation = count > 0 ? totalCorrelation / count : 0;
      
      // Only add clusters with multiple symbols
      if (cluster.length > 1) {
        clusters.push({
          symbols: cluster,
          averageCorrelation
        });
      }
    }
    
    return clusters;
  }
  
  /**
   * Finds sector hedging instrument
   * @param sector Sector name
   * @returns Symbol of hedging instrument
   */
  private async findSectorHedgingInstrument(sector: string): Promise<string | null> {
    // Map of sectors to inverse ETFs
    const sectorInverseETFs: Record<string, string> = {
      'Technology': 'SQQQ', // ProShares UltraPro Short QQQ
      'Financial': 'FAZ', // Direxion Daily Financial Bear 3X
      'Energy': 'ERY', // Direxion Daily Energy Bear 2X
      'Healthcare': 'RXD', // ProShares UltraShort Health Care
      'Consumer Cyclical': 'SZK', // ProShares UltraShort Consumer Goods
      'Consumer Defensive': 'SZK', // ProShares UltraShort Consumer Goods
      'Utilities': 'SDP', // ProShares UltraShort Utilities
      'Communication Services': 'SQQQ', // ProShares UltraPro Short QQQ (proxy)
      'Industrial': 'SIJ', // ProShares UltraShort Industrials
      'Basic Materials': 'SMN', // ProShares UltraShort Basic Materials
      'Real Estate': 'SRS' // ProShares UltraShort Real Estate
    };
    
    return sectorInverseETFs[sector] || null;
  }
  
  /**
   * Finds sector ETF
   * @param sector Sector name
   * @returns Symbol of sector ETF
   */
  private async findSectorETF(sector: string): Promise<string | null> {
    // Map of sectors to ETFs
    const sectorETFs: Record<string, string> = {
      'Technology': 'XLK', // Technology Select Sector SPDR Fund
      'Financial': 'XLF', // Financial Select Sector SPDR Fund
      'Energy': 'XLE', // Energy Select Sector SPDR Fund
      'Healthcare': 'XLV', // Health Care Select Sector SPDR Fund
      'Consumer Cyclical': 'XLY', // Consumer Discretionary Select Sector SPDR Fund
      'Consumer Defensive': 'XLP', // Consumer Staples Select Sector SPDR Fund
      'Utilities': 'XLU', // Utilities Select Sector SPDR Fund
      'Communication Services': 'XLC', // Communication Services Select Sector SPDR Fund
      'Industrial': 'XLI', // Industrial Select Sector SPDR Fund
      'Basic Materials': 'XLB', // Materials Select Sector SPDR Fund
      'Real Estate': 'XLRE' // Real Estate Select Sector SPDR Fund
    };
    
    return sectorETFs[sector] || null;
  }
  
  /**
   * Finds cross-asset hedging instruments
   * @param assetClass Asset class
   * @param lookbackPeriod Lookback period in days
   * @returns Array of hedging instruments with correlation
   */
  private async findCrossAssetHedgingInstruments(
    assetClass: string,
    lookbackPeriod: number
  ): Promise<{ symbol: string, type: HedgingInstrument, correlation: number }[]> {
    // Define potential hedging instruments for each asset class
    const potentialHedges: Record<string, { symbol: string, type: HedgingInstrument }[]> = {
      [AssetClass.EQUITY]: [
        { symbol: 'TLT', type: HedgingInstrument.ETF }, // Long-Term Treasury Bond ETF
        { symbol: 'GLD', type: HedgingInstrument.ETF }, // Gold ETF
        { symbol: 'VXX', type: HedgingInstrument.VOLATILITY_PRODUCTS } // Volatility ETN
      ],
      [AssetClass.FIXED_INCOME]: [
        { symbol: 'TBF', type: HedgingInstrument.ETF }, // ProShares Short 20+ Year Treasury
        { symbol: 'TBX', type: HedgingInstrument.ETF }, // ProShares Short 7-10 Year Treasury
        { symbol: 'IGOV', type: HedgingInstrument.ETF } // iShares International Treasury Bond ETF
      ],
      [AssetClass.COMMODITY]: [
        { symbol: 'DBC', type: HedgingInstrument.ETF }, // Invesco DB Commodity Index Tracking Fund
        { symbol: 'UUP', type: HedgingInstrument.ETF }, // Invesco DB US Dollar Index Bullish Fund
        { symbol: 'GLD', type: HedgingInstrument.ETF } // Gold ETF
      ],
      [AssetClass.CURRENCY]: [
        { symbol: 'UUP', type: HedgingInstrument.ETF }, // Invesco DB US Dollar Index Bullish Fund
        { symbol: 'UDN', type: HedgingInstrument.ETF }, // Invesco DB US Dollar Index Bearish Fund
        { symbol: 'FXE', type: HedgingInstrument.ETF } // Invesco CurrencyShares Euro Currency Trust
      ],
      [AssetClass.CRYPTO]: [
        { symbol: 'GBTC', type: HedgingInstrument.ETF }, // Grayscale Bitcoin Trust
        { symbol: 'ETHE', type: HedgingInstrument.ETF }, // Grayscale Ethereum Trust
        { symbol: 'BITQ', type: HedgingInstrument.ETF } // Bitwise Crypto Industry Innovators ETF
      ]
    };
    
    // Get potential hedges for this asset class
    const hedges = potentialHedges[assetClass] || potentialHedges[AssetClass.EQUITY];
    
    // Calculate correlation for each potential hedge
    const results: { symbol: string, type: HedgingInstrument, correlation: number }[] = [];
    
    for (const hedge of hedges) {
      try {
        const correlation = await this.calculateAssetClassCorrelation(
          assetClass,
          hedge.symbol,
          lookbackPeriod
        );
        
        // Only include instruments with negative correlation
        if (correlation < 0) {
          results.push({
            symbol: hedge.symbol,
            type: hedge.type,
            correlation
          });
        }
      } catch (error) {
        console.error(`Error calculating correlation for ${hedge.symbol}:`, error);
      }
    }
    
    // Sort by correlation (most negative first)
    results.sort((a, b) => a.correlation - b.correlation);
    
    return results;
  }
  
  /**
   * Finds negatively correlated instrument for a cluster
   * @param symbols Cluster symbols
   * @param lookbackPeriod Lookback period in days
   * @returns Hedging instrument with correlation
   */
  private async findNegativelyCorrelatedInstrument(
    symbols: string[],
    lookbackPeriod: number
  ): Promise<{ symbol: string, type: HedgingInstrument, correlation: number } | null> {
    // Potential hedging instruments
    const potentialHedges = [
      { symbol: 'SPY', type: HedgingInstrument.ETF }, // S&P 500 ETF
      { symbol: 'QQQ', type: HedgingInstrument.ETF }, // Nasdaq 100 ETF
      { symbol: 'IWM', type: HedgingInstrument.ETF }, // Russell 2000 ETF
      { symbol: 'TLT', type: HedgingInstrument.ETF }, // Long-Term Treasury Bond ETF
      { symbol: 'GLD', type: HedgingInstrument.ETF }, // Gold ETF
      { symbol: 'VXX', type: HedgingInstrument.VOLATILITY_PRODUCTS } // Volatility ETN
    ];
    
    // Calculate average correlation for each potential hedge
    const results: { symbol: string, type: HedgingInstrument, correlation: number }[] = [];
    
    for (const hedge of potentialHedges) {
      try {
        let totalCorrelation = 0;
        
        for (const symbol of symbols) {
          const correlation = await this.calculatePairwiseCorrelation(
            symbol,
            hedge.symbol,
            lookbackPeriod
          );
          
          totalCorrelation += correlation;
        }
        
        const avgCorrelation = totalCorrelation / symbols.length;
        
        // Only include instruments with negative correlation
        if (avgCorrelation < 0) {
          results.push({
            symbol: hedge.symbol,
            type: hedge.type,
            correlation: avgCorrelation
          });
        }
      } catch (error) {
        console.error(`Error calculating correlation for ${hedge.symbol}:`, error);
      }
    }
    
    // Sort by correlation (most negative first)
    results.sort((a, b) => a.correlation - b.correlation);
    
    return results.length > 0 ? results[0] : null;
  }
  
  /**
   * Calculates hedge effectiveness
   * @param sector Sector name
   * @param hedgeSymbol Hedge symbol
   * @param lookbackPeriod Lookback period in days
   * @returns Hedge effectiveness (0-1)
   */
  private async calculateHedgeEffectiveness(
    sector: string,
    hedgeSymbol: string,
    lookbackPeriod: number
  ): Promise<number> {
    try {
      // Find sector ETF
      const sectorETF = await this.findSectorETF(sector);
      
      if (!sectorETF) {
        return 0.5; // Default effectiveness
      }
      
      // Calculate correlation between sector ETF and hedge
      const correlation = await this.calculatePairwiseCorrelation(
        sectorETF,
        hedgeSymbol,
        lookbackPeriod
      );
      
      // Convert correlation to effectiveness (negative correlation is good for hedging)
      return Math.min(1, Math.abs(correlation));
    } catch (error) {
      console.error(`Error calculating hedge effectiveness for ${sector}:`, error);
      return 0.5; // Default effectiveness
    }
  }
  
  /**
   * Calculates pairwise correlation between two assets
   * @param symbol1 First symbol
   * @param symbol2 Second symbol
   * @param lookbackPeriod Lookback period in days
   * @returns Correlation coefficient
   */
  private async calculatePairwiseCorrelation(
    symbol1: string,
    symbol2: string,
    lookbackPeriod: number
  ): Promise<number> {
    try {
      // Calculate correlation using correlation service
      const correlationResult = await this.correlationService.calculateCorrelationMatrix(
        [symbol1, symbol2],
        {
          lookbackPeriod,
          method: CorrelationMethod.PEARSON,
          useLogReturns: true
        }
      );
      
      return correlationResult.value[symbol1][symbol2];
    } catch (error) {
      console.error(`Error calculating correlation between ${symbol1} and ${symbol2}:`, error);
      return 0; // Default to no correlation
    }
  }
  
  /**
   * Calculates correlation between asset class and instrument
   * @param assetClass Asset class
   * @param symbol Instrument symbol
   * @param lookbackPeriod Lookback period in days
   * @returns Correlation coefficient
   */
  private async calculateAssetClassCorrelation(
    assetClass: string,
    symbol: string,
    lookbackPeriod: number
  ): Promise<number> {
    // Map asset classes to representative ETFs
    const assetClassETFs: Record<string, string> = {
      [AssetClass.EQUITY]: 'SPY', // S&P 500 ETF
      [AssetClass.FIXED_INCOME]: 'AGG', // iShares Core U.S. Aggregate Bond ETF
      [AssetClass.COMMODITY]: 'DBC', // Invesco DB Commodity Index Tracking Fund
      [AssetClass.CURRENCY]: 'UUP', // Invesco DB US Dollar Index Bullish Fund
      [AssetClass.CRYPTO]: 'GBTC', // Grayscale Bitcoin Trust
      [AssetClass.ETF]: 'SPY', // S&P 500 ETF
      [AssetClass.MUTUAL_FUND]: 'SPY', // S&P 500 ETF
      [AssetClass.OPTION]: 'SPY', // S&P 500 ETF
      [AssetClass.FUTURE]: 'DBC', // Invesco DB Commodity Index Tracking Fund
      [AssetClass.OTHER]: 'SPY' // S&P 500 ETF
    };
    
    const assetClassETF = assetClassETFs[assetClass] || 'SPY';
    
    return this.calculatePairwiseCorrelation(assetClassETF, symbol, lookbackPeriod);
  }
  
  /**
   * Creates hedged portfolio by adding hedge positions
   * @param portfolio Original portfolio
   * @param recommendations Hedge recommendations
   * @returns Hedged portfolio
   */
  private createHedgedPortfolio(
    portfolio: Portfolio,
    recommendations: HedgeRecommendation[]
  ): Portfolio {
    // Clone portfolio
    const hedgedPortfolio: Portfolio = {
      ...portfolio,
      positions: [...portfolio.positions]
    };
    
    // Add hedge positions
    for (const rec of recommendations) {
      hedgedPortfolio.positions.push({
        symbol: rec.symbol,
        quantity: rec.quantity,
        price: rec.estimatedCost / Math.abs(rec.quantity),
        value: rec.estimatedCost,
        currency: 'USD',
        assetClass: this.getAssetClassForInstrument(rec.instrumentType)
      });
    }
    
    return hedgedPortfolio;
  }
  
  /**
   * Calculates total cost of hedge recommendations
   * @param recommendations Hedge recommendations
   * @returns Total cost
   */
  private calculateHedgeCost(recommendations: HedgeRecommendation[]): number {
    return recommendations.reduce((sum, rec) => sum + rec.estimatedCost, 0);
  }
  
  /**
   * Gets asset class for hedging instrument
   * @param instrumentType Hedging instrument type
   * @returns Asset class
   */
  private getAssetClassForInstrument(instrumentType: HedgingInstrument): AssetClass {
    switch (instrumentType) {
      case HedgingInstrument.ETF:
      case HedgingInstrument.INVERSE_ETF:
      case HedgingInstrument.SECTOR_ETF:
        return AssetClass.ETF;
      case HedgingInstrument.FUTURES:
        return AssetClass.FUTURE;
      case HedgingInstrument.OPTIONS:
      case HedgingInstrument.INDEX_OPTIONS:
        return AssetClass.OPTION;
      case HedgingInstrument.VOLATILITY_PRODUCTS:
        return AssetClass.ETF;
      case HedgingInstrument.INDIVIDUAL_STOCK:
        return AssetClass.EQUITY;
      default:
        return AssetClass.ETF;
    }
  }
  
  /**
   * Initializes hedging instruments
   */
  private initializeHedgingInstruments(): void {
    // Initialize sector ETFs
    const sectorETFs = new Map<HedgingInstrument, string[]>();
    sectorETFs.set(HedgingInstrument.SECTOR_ETF, [
      'XLK', // Technology
      'XLF', // Financial
      'XLE', // Energy
      'XLV', // Healthcare
      'XLY', // Consumer Discretionary
      'XLP', // Consumer Staples
      'XLU', // Utilities
      'XLC', // Communication Services
      'XLI', // Industrial
      'XLB', // Materials
      'XLRE' // Real Estate
    ]);
    
    this.hedgingInstruments.set('sector', sectorETFs);
    
    // Initialize inverse ETFs
    const inverseETFs = new Map<HedgingInstrument, string[]>();
    inverseETFs.set(HedgingInstrument.INVERSE_ETF, [
      'SH', // Short S&P 500
      'PSQ', // Short QQQ
      'DOG', // Short Dow 30
      'RWM', // Short Russell 2000
      'EUM', // Short MSCI Emerging Markets
      'EFZ' // Short MSCI EAFE
    ]);
    
    this.hedgingInstruments.set('inverse', inverseETFs);
    
    // Initialize volatility products
    const volatilityProducts = new Map<HedgingInstrument, string[]>();
    volatilityProducts.set(HedgingInstrument.VOLATILITY_PRODUCTS, [
      'VXX', // iPath Series B S&P 500 VIX Short-Term Futures ETN
      'UVXY', // ProShares Ultra VIX Short-Term Futures ETF
      'VIXY' // ProShares VIX Short-Term Futures ETF
    ]);
    
    this.hedgingInstruments.set('volatility', volatilityProducts);
  }
}

// Export singleton instance
export const dynamicHedgingService = new DynamicHedgingService();