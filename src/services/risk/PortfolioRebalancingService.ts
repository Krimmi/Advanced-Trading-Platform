import { EventEmitter } from 'events';
import {
  Portfolio,
  Position,
  AssetClass
} from './models/RiskModels';
import { CorrelationAnalysisService, CorrelationMethod } from './CorrelationAnalysisService';
import { MarketDataService } from '../api/marketData/MarketDataService';
import { MarketDataServiceFactory } from '../api/marketData/MarketDataServiceFactory';
import { positionTrackingService } from '../api/trading/PositionTrackingService';

/**
 * Rebalancing strategy types
 */
export enum RebalancingStrategy {
  CALENDAR = 'calendar',
  THRESHOLD = 'threshold',
  VOLATILITY_BASED = 'volatility_based',
  CORRELATION_BASED = 'correlation_based',
  DRIFT_BASED = 'drift_based',
  OPPORTUNITY_BASED = 'opportunity_based',
  TAX_EFFICIENT = 'tax_efficient',
  COMBINED = 'combined'
}

/**
 * Rebalancing frequency
 */
export enum RebalancingFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMI_ANNUALLY = 'semi_annually',
  ANNUALLY = 'annually'
}

/**
 * Rebalancing configuration
 */
export interface RebalancingConfig {
  strategy: RebalancingStrategy;
  frequency?: RebalancingFrequency;
  threshold?: number;
  volatilityThreshold?: number;
  correlationThreshold?: number;
  driftThreshold?: number;
  opportunityThreshold?: number;
  taxEfficiencyEnabled?: boolean;
  minTradeSize?: number;
  maxTradeSize?: number;
  excludedSymbols?: string[];
  targetAllocations?: Record<string, number>;
  sectorTargets?: Record<string, number>;
  assetClassTargets?: Record<string, number>;
  lastRebalanceDate?: Date;
}

/**
 * Rebalancing trade
 */
export interface RebalancingTrade {
  symbol: string;
  action: 'buy' | 'sell';
  quantity: number;
  currentPrice: number;
  currentValue: number;
  targetValue: number;
  valueChange: number;
  percentChange: number;
  estimatedCost: number;
  estimatedImpact: number;
  priority: number;
  reason: string;
}

/**
 * Rebalancing result
 */
export interface RebalancingResult {
  portfolio: Portfolio;
  currentAllocations: Record<string, number>;
  targetAllocations: Record<string, number>;
  drifts: Record<string, number>;
  trades: RebalancingTrade[];
  totalBuys: number;
  totalSells: number;
  netCashChange: number;
  turnoverPercent: number;
  rebalancingDate: Date;
  strategy: RebalancingStrategy;
}

/**
 * Service for portfolio rebalancing
 */
export class PortfolioRebalancingService extends EventEmitter {
  private correlationService: CorrelationAnalysisService;
  private marketDataService: MarketDataService;
  private rebalancingConfigs: Map<string, RebalancingConfig> = new Map();
  private lastRebalancingResults: Map<string, RebalancingResult> = new Map();
  
  /**
   * Creates a new PortfolioRebalancingService
   * @param correlationService Correlation analysis service
   * @param marketDataService Market data service
   */
  constructor(
    correlationService?: CorrelationAnalysisService,
    marketDataService?: MarketDataService
  ) {
    super();
    this.correlationService = correlationService || new CorrelationAnalysisService();
    this.marketDataService = marketDataService || MarketDataServiceFactory.getService();
  }
  
  /**
   * Sets rebalancing configuration for a portfolio
   * @param portfolioId Portfolio ID
   * @param config Rebalancing configuration
   */
  public setRebalancingConfig(portfolioId: string, config: RebalancingConfig): void {
    this.rebalancingConfigs.set(portfolioId, config);
  }
  
  /**
   * Gets rebalancing configuration for a portfolio
   * @param portfolioId Portfolio ID
   * @returns Rebalancing configuration
   */
  public getRebalancingConfig(portfolioId: string): RebalancingConfig | undefined {
    return this.rebalancingConfigs.get(portfolioId);
  }
  
  /**
   * Gets last rebalancing result for a portfolio
   * @param portfolioId Portfolio ID
   * @returns Rebalancing result
   */
  public getLastRebalancingResult(portfolioId: string): RebalancingResult | undefined {
    return this.lastRebalancingResults.get(portfolioId);
  }
  
  /**
   * Checks if portfolio needs rebalancing
   * @param portfolio Portfolio
   * @returns True if rebalancing is needed
   */
  public async checkRebalancingNeeded(portfolio: Portfolio): Promise<boolean> {
    const config = this.rebalancingConfigs.get(portfolio.id);
    
    if (!config) {
      return false;
    }
    
    switch (config.strategy) {
      case RebalancingStrategy.CALENDAR:
        return this.checkCalendarRebalancing(portfolio, config);
        
      case RebalancingStrategy.THRESHOLD:
        return await this.checkThresholdRebalancing(portfolio, config);
        
      case RebalancingStrategy.VOLATILITY_BASED:
        return await this.checkVolatilityBasedRebalancing(portfolio, config);
        
      case RebalancingStrategy.CORRELATION_BASED:
        return await this.checkCorrelationBasedRebalancing(portfolio, config);
        
      case RebalancingStrategy.DRIFT_BASED:
        return await this.checkDriftBasedRebalancing(portfolio, config);
        
      case RebalancingStrategy.OPPORTUNITY_BASED:
        return await this.checkOpportunityBasedRebalancing(portfolio, config);
        
      case RebalancingStrategy.COMBINED:
        return await this.checkCombinedRebalancing(portfolio, config);
        
      default:
        return false;
    }
  }
  
  /**
   * Calculates rebalancing trades for a portfolio
   * @param portfolio Portfolio
   * @returns Rebalancing result
   */
  public async calculateRebalancingTrades(portfolio: Portfolio): Promise<RebalancingResult> {
    const config = this.rebalancingConfigs.get(portfolio.id);
    
    if (!config) {
      throw new Error(`No rebalancing configuration found for portfolio ${portfolio.id}`);
    }
    
    // Get target allocations
    const targetAllocations = this.getTargetAllocations(portfolio, config);
    
    // Calculate current allocations
    const currentAllocations = this.calculateCurrentAllocations(portfolio);
    
    // Calculate drifts
    const drifts: Record<string, number> = {};
    
    for (const symbol in targetAllocations) {
      const target = targetAllocations[symbol];
      const current = currentAllocations[symbol] || 0;
      drifts[symbol] = current - target;
    }
    
    // Calculate trades
    const trades: RebalancingTrade[] = [];
    
    for (const symbol in targetAllocations) {
      const target = targetAllocations[symbol];
      const current = currentAllocations[symbol] || 0;
      const drift = drifts[symbol];
      
      // Skip excluded symbols
      if (config.excludedSymbols && config.excludedSymbols.includes(symbol)) {
        continue;
      }
      
      // Skip small drifts
      const driftThreshold = config.driftThreshold || 0.02; // Default 2%
      if (Math.abs(drift) < driftThreshold) {
        continue;
      }
      
      // Find position
      const position = portfolio.positions.find(p => p.symbol === symbol);
      
      if (!position && drift <= 0) {
        // Symbol not in portfolio and no need to buy
        continue;
      }
      
      // Get current price
      const quote = await this.marketDataService.getQuote(symbol);
      const currentPrice = quote.price;
      
      // Calculate target value
      const targetValue = portfolio.totalValue * target;
      
      // Calculate current value
      const currentValue = position ? position.value : 0;
      
      // Calculate value change
      const valueChange = targetValue - currentValue;
      
      // Calculate percent change
      const percentChange = currentValue > 0 ? (valueChange / currentValue) * 100 : 100;
      
      // Calculate quantity
      const quantity = Math.floor(Math.abs(valueChange) / currentPrice);
      
      // Skip small trades
      const minTradeSize = config.minTradeSize || 100; // Default $100
      if (Math.abs(valueChange) < minTradeSize) {
        continue;
      }
      
      // Limit large trades
      const maxTradeSize = config.maxTradeSize || Infinity;
      const limitedValueChange = Math.min(Math.abs(valueChange), maxTradeSize);
      const limitedQuantity = Math.floor(limitedValueChange / currentPrice);
      
      // Calculate priority (higher absolute drift = higher priority)
      const priority = Math.abs(drift);
      
      // Determine action
      const action = valueChange > 0 ? 'buy' : 'sell';
      
      // Create trade
      trades.push({
        symbol,
        action,
        quantity: limitedQuantity,
        currentPrice,
        currentValue,
        targetValue,
        valueChange,
        percentChange,
        estimatedCost: limitedQuantity * currentPrice,
        estimatedImpact: (limitedQuantity * currentPrice) / portfolio.totalValue * 100,
        priority,
        reason: `Rebalancing to target allocation of ${(target * 100).toFixed(2)}%`
      });
    }
    
    // Sort trades by priority (descending)
    trades.sort((a, b) => b.priority - a.priority);
    
    // Calculate totals
    const totalBuys = trades.filter(t => t.action === 'buy')
      .reduce((sum, t) => sum + t.estimatedCost, 0);
      
    const totalSells = trades.filter(t => t.action === 'sell')
      .reduce((sum, t) => sum + t.estimatedCost, 0);
      
    const netCashChange = totalSells - totalBuys;
    
    // Calculate turnover
    const turnoverPercent = (totalBuys + totalSells) / (2 * portfolio.totalValue) * 100;
    
    // Create result
    const result: RebalancingResult = {
      portfolio,
      currentAllocations,
      targetAllocations,
      drifts,
      trades,
      totalBuys,
      totalSells,
      netCashChange,
      turnoverPercent,
      rebalancingDate: new Date(),
      strategy: config.strategy
    };
    
    // Store result
    this.lastRebalancingResults.set(portfolio.id, result);
    
    // Update last rebalance date
    config.lastRebalanceDate = result.rebalancingDate;
    this.rebalancingConfigs.set(portfolio.id, config);
    
    return result;
  }
  
  /**
   * Optimizes rebalancing trades for tax efficiency
   * @param result Rebalancing result
   * @returns Optimized rebalancing result
   */
  public optimizeForTaxEfficiency(result: RebalancingResult): RebalancingResult {
    const config = this.rebalancingConfigs.get(result.portfolio.id);
    
    if (!config || !config.taxEfficiencyEnabled) {
      return result;
    }
    
    // Clone trades
    const optimizedTrades = [...result.trades];
    
    // Prioritize selling positions with losses (tax-loss harvesting)
    optimizedTrades.sort((a, b) => {
      if (a.action === 'sell' && b.action === 'sell') {
        const positionA = result.portfolio.positions.find(p => p.symbol === a.symbol);
        const positionB = result.portfolio.positions.find(p => p.symbol === b.symbol);
        
        if (positionA && positionB) {
          const pnlA = a.currentPrice - positionA.price;
          const pnlB = b.currentPrice - positionB.price;
          
          // Prioritize losses (negative PnL)
          return pnlA - pnlB;
        }
      }
      
      return 0;
    });
    
    // Create optimized result
    const optimizedResult: RebalancingResult = {
      ...result,
      trades: optimizedTrades
    };
    
    return optimizedResult;
  }
  
  /**
   * Checks calendar-based rebalancing
   * @param portfolio Portfolio
   * @param config Rebalancing configuration
   * @returns True if rebalancing is needed
   */
  private checkCalendarRebalancing(
    portfolio: Portfolio,
    config: RebalancingConfig
  ): boolean {
    if (!config.lastRebalanceDate) {
      return true;
    }
    
    const now = new Date();
    const lastRebalance = new Date(config.lastRebalanceDate);
    const daysSinceLastRebalance = Math.floor(
      (now.getTime() - lastRebalance.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    switch (config.frequency) {
      case RebalancingFrequency.DAILY:
        return daysSinceLastRebalance >= 1;
        
      case RebalancingFrequency.WEEKLY:
        return daysSinceLastRebalance >= 7;
        
      case RebalancingFrequency.MONTHLY:
        return daysSinceLastRebalance >= 30;
        
      case RebalancingFrequency.QUARTERLY:
        return daysSinceLastRebalance >= 90;
        
      case RebalancingFrequency.SEMI_ANNUALLY:
        return daysSinceLastRebalance >= 180;
        
      case RebalancingFrequency.ANNUALLY:
        return daysSinceLastRebalance >= 365;
        
      default:
        return daysSinceLastRebalance >= 30; // Default to monthly
    }
  }
  
  /**
   * Checks threshold-based rebalancing
   * @param portfolio Portfolio
   * @param config Rebalancing configuration
   * @returns True if rebalancing is needed
   */
  private async checkThresholdRebalancing(
    portfolio: Portfolio,
    config: RebalancingConfig
  ): Promise<boolean> {
    // Get target allocations
    const targetAllocations = this.getTargetAllocations(portfolio, config);
    
    // Calculate current allocations
    const currentAllocations = this.calculateCurrentAllocations(portfolio);
    
    // Check if any allocation exceeds threshold
    const threshold = config.threshold || 0.05; // Default 5%
    
    for (const symbol in targetAllocations) {
      const target = targetAllocations[symbol];
      const current = currentAllocations[symbol] || 0;
      const drift = Math.abs(current - target);
      
      if (drift > threshold) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Checks volatility-based rebalancing
   * @param portfolio Portfolio
   * @param config Rebalancing configuration
   * @returns True if rebalancing is needed
   */
  private async checkVolatilityBasedRebalancing(
    portfolio: Portfolio,
    config: RebalancingConfig
  ): Promise<boolean> {
    // Calculate portfolio volatility
    const volatility = await this.calculatePortfolioVolatility(portfolio);
    
    // Check if volatility exceeds threshold
    const threshold = config.volatilityThreshold || 0.2; // Default 20%
    
    return volatility > threshold;
  }
  
  /**
   * Checks correlation-based rebalancing
   * @param portfolio Portfolio
   * @param config Rebalancing configuration
   * @returns True if rebalancing is needed
   */
  private async checkCorrelationBasedRebalancing(
    portfolio: Portfolio,
    config: RebalancingConfig
  ): Promise<boolean> {
    // Get symbols
    const symbols = portfolio.positions.map(p => p.symbol);
    
    if (symbols.length < 2) {
      return false;
    }
    
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
    
    // Calculate average correlation
    let totalCorrelation = 0;
    let count = 0;
    
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        totalCorrelation += Math.abs(correlationMatrix[symbols[i]][symbols[j]]);
        count++;
      }
    }
    
    const avgCorrelation = count > 0 ? totalCorrelation / count : 0;
    
    // Check if correlation exceeds threshold
    const threshold = config.correlationThreshold || 0.7; // Default 70%
    
    return avgCorrelation > threshold;
  }
  
  /**
   * Checks drift-based rebalancing
   * @param portfolio Portfolio
   * @param config Rebalancing configuration
   * @returns True if rebalancing is needed
   */
  private async checkDriftBasedRebalancing(
    portfolio: Portfolio,
    config: RebalancingConfig
  ): Promise<boolean> {
    // Get target allocations
    const targetAllocations = this.getTargetAllocations(portfolio, config);
    
    // Calculate current allocations
    const currentAllocations = this.calculateCurrentAllocations(portfolio);
    
    // Calculate total drift
    let totalDrift = 0;
    
    for (const symbol in targetAllocations) {
      const target = targetAllocations[symbol];
      const current = currentAllocations[symbol] || 0;
      totalDrift += Math.abs(current - target);
    }
    
    // Check if total drift exceeds threshold
    const threshold = config.driftThreshold || 0.1; // Default 10%
    
    return totalDrift > threshold;
  }
  
  /**
   * Checks opportunity-based rebalancing
   * @param portfolio Portfolio
   * @param config Rebalancing configuration
   * @returns True if rebalancing is needed
   */
  private async checkOpportunityBasedRebalancing(
    portfolio: Portfolio,
    config: RebalancingConfig
  ): Promise<boolean> {
    // This would typically involve checking for significant market movements
    // or other opportunities that warrant rebalancing
    
    // For simplicity, we'll check if any position has moved significantly
    const threshold = config.opportunityThreshold || 0.1; // Default 10%
    
    for (const position of portfolio.positions) {
      try {
        // Get current price
        const quote = await this.marketDataService.getQuote(position.symbol);
        const currentPrice = quote.price;
        
        // Calculate price change
        const priceChange = Math.abs((currentPrice - position.price) / position.price);
        
        if (priceChange > threshold) {
          return true;
        }
      } catch (error) {
        console.error(`Error getting quote for ${position.symbol}:`, error);
      }
    }
    
    return false;
  }
  
  /**
   * Checks combined rebalancing criteria
   * @param portfolio Portfolio
   * @param config Rebalancing configuration
   * @returns True if rebalancing is needed
   */
  private async checkCombinedRebalancing(
    portfolio: Portfolio,
    config: RebalancingConfig
  ): Promise<boolean> {
    // Check calendar-based rebalancing
    const calendarCheck = this.checkCalendarRebalancing(portfolio, config);
    
    // If calendar check passes, check threshold-based rebalancing
    if (calendarCheck) {
      const thresholdCheck = await this.checkThresholdRebalancing(portfolio, config);
      
      // Only rebalance if both calendar and threshold checks pass
      return thresholdCheck;
    }
    
    // Check for opportunity-based rebalancing
    const opportunityCheck = await this.checkOpportunityBasedRebalancing(portfolio, config);
    
    // Rebalance if opportunity check passes
    return opportunityCheck;
  }
  
  /**
   * Gets target allocations for a portfolio
   * @param portfolio Portfolio
   * @param config Rebalancing configuration
   * @returns Target allocations
   */
  private getTargetAllocations(
    portfolio: Portfolio,
    config: RebalancingConfig
  ): Record<string, number> {
    // If target allocations are specified, use them
    if (config.targetAllocations) {
      return { ...config.targetAllocations };
    }
    
    // If sector targets are specified, calculate allocations based on sectors
    if (config.sectorTargets) {
      return this.calculateSectorBasedAllocations(portfolio, config.sectorTargets);
    }
    
    // If asset class targets are specified, calculate allocations based on asset classes
    if (config.assetClassTargets) {
      return this.calculateAssetClassBasedAllocations(portfolio, config.assetClassTargets);
    }
    
    // Default to equal weight
    return this.calculateEqualWeightAllocations(portfolio);
  }
  
  /**
   * Calculates current allocations for a portfolio
   * @param portfolio Portfolio
   * @returns Current allocations
   */
  private calculateCurrentAllocations(portfolio: Portfolio): Record<string, number> {
    const allocations: Record<string, number> = {};
    
    for (const position of portfolio.positions) {
      allocations[position.symbol] = position.value / portfolio.totalValue;
    }
    
    return allocations;
  }
  
  /**
   * Calculates equal weight allocations
   * @param portfolio Portfolio
   * @returns Equal weight allocations
   */
  private calculateEqualWeightAllocations(portfolio: Portfolio): Record<string, number> {
    const allocations: Record<string, number> = {};
    const equalWeight = 1 / portfolio.positions.length;
    
    for (const position of portfolio.positions) {
      allocations[position.symbol] = equalWeight;
    }
    
    return allocations;
  }
  
  /**
   * Calculates sector-based allocations
   * @param portfolio Portfolio
   * @param sectorTargets Sector targets
   * @returns Sector-based allocations
   */
  private calculateSectorBasedAllocations(
    portfolio: Portfolio,
    sectorTargets: Record<string, number>
  ): Record<string, number> {
    const allocations: Record<string, number> = {};
    
    // Group positions by sector
    const positionsBySector = new Map<string, Position[]>();
    
    for (const position of portfolio.positions) {
      const sector = position.sector || 'Unknown';
      
      if (!positionsBySector.has(sector)) {
        positionsBySector.set(sector, []);
      }
      
      positionsBySector.get(sector)!.push(position);
    }
    
    // Calculate allocations within each sector
    for (const [sector, positions] of positionsBySector.entries()) {
      const sectorTarget = sectorTargets[sector] || 0;
      const equalWeight = sectorTarget / positions.length;
      
      for (const position of positions) {
        allocations[position.symbol] = equalWeight;
      }
    }
    
    return allocations;
  }
  
  /**
   * Calculates asset class-based allocations
   * @param portfolio Portfolio
   * @param assetClassTargets Asset class targets
   * @returns Asset class-based allocations
   */
  private calculateAssetClassBasedAllocations(
    portfolio: Portfolio,
    assetClassTargets: Record<string, number>
  ): Record<string, number> {
    const allocations: Record<string, number> = {};
    
    // Group positions by asset class
    const positionsByAssetClass = new Map<string, Position[]>();
    
    for (const position of portfolio.positions) {
      const assetClass = position.assetClass || AssetClass.EQUITY;
      
      if (!positionsByAssetClass.has(assetClass)) {
        positionsByAssetClass.set(assetClass, []);
      }
      
      positionsByAssetClass.get(assetClass)!.push(position);
    }
    
    // Calculate allocations within each asset class
    for (const [assetClass, positions] of positionsByAssetClass.entries()) {
      const assetClassTarget = assetClassTargets[assetClass] || 0;
      const equalWeight = assetClassTarget / positions.length;
      
      for (const position of positions) {
        allocations[position.symbol] = equalWeight;
      }
    }
    
    return allocations;
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
      
      // Get individual volatilities (simplified)
      const volatilities = symbols.map(() => 0.2); // Default 20% annualized volatility
      
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
}

// Export singleton instance
export const portfolioRebalancingService = new PortfolioRebalancingService();