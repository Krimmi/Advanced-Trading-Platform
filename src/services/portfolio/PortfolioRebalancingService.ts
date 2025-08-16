/**
 * Portfolio Rebalancing Service
 * Provides functionality for portfolio rebalancing based on various strategies
 */

import { injectable, inject } from 'inversify';
import { 
  Portfolio, 
  AssetAllocation,
  OptimizationConstraint
} from './models/OptimizationModels';
import { PortfolioOptimizationService } from './PortfolioOptimizationService';
import { MarketDataService } from '../market/MarketDataService';
import { LoggerService } from '../common/LoggerService';
import { TransactionCostModelingService } from '../backtesting/TransactionCostModelingService';

export enum RebalancingStrategy {
  THRESHOLD = 'THRESHOLD',
  CALENDAR = 'CALENDAR',
  DRIFT = 'DRIFT',
  OPPORTUNITY = 'OPPORTUNITY',
  HYBRID = 'HYBRID'
}

export interface RebalancingParameters {
  strategy: RebalancingStrategy;
  thresholds?: {
    absolute?: number;
    relative?: number;
    assetSpecific?: Record<string, number>;
    assetClassSpecific?: Record<string, number>;
  };
  schedule?: {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
    dayOfWeek?: number;
    dayOfMonth?: number;
    monthOfYear?: number;
  };
  drift?: {
    portfolioThreshold: number;
    assetThreshold?: number;
  };
  opportunity?: {
    volatilityThreshold?: number;
    correlationThreshold?: number;
    fundamentalChangeThreshold?: number;
  };
  constraints?: OptimizationConstraint[];
  maxTurnover?: number;
  minTradeSize?: number;
}

export interface RebalancingResult {
  portfolioId: string;
  timestamp: Date;
  currentAllocations: AssetAllocation[];
  targetAllocations: AssetAllocation[];
  trades: PortfolioTrade[];
  metrics: RebalancingMetrics;
  status: RebalancingStatus;
  message?: string;
}

export interface PortfolioTrade {
  assetId: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  estimatedPrice: number;
  estimatedValue: number;
  estimatedCost: number;
}

export interface RebalancingMetrics {
  turnover: number;
  estimatedCost: number;
  trackingErrorImpact?: number;
  riskChange?: number;
  expectedReturnChange?: number;
}

export enum RebalancingStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  EXECUTED = 'EXECUTED',
  REJECTED = 'REJECTED',
  FAILED = 'FAILED'
}

@injectable()
export class PortfolioRebalancingService {
  constructor(
    @inject(PortfolioOptimizationService) private optimizationService: PortfolioOptimizationService,
    @inject(MarketDataService) private marketDataService: MarketDataService,
    @inject(TransactionCostModelingService) private costModelingService: TransactionCostModelingService,
    @inject(LoggerService) private logger: LoggerService
  ) {}

  /**
   * Evaluates whether a portfolio needs rebalancing based on the specified strategy
   * @param portfolioId The portfolio ID
   * @param parameters Rebalancing parameters
   * @returns True if rebalancing is needed, false otherwise
   */
  public async needsRebalancing(
    portfolioId: string,
    parameters: RebalancingParameters
  ): Promise<boolean> {
    this.logger.info('Evaluating rebalancing need', { portfolioId, strategy: parameters.strategy });
    
    try {
      // Get portfolio data
      const portfolio = await this.getPortfolio(portfolioId);
      
      // Get current market prices
      const currentPrices = await this.getCurrentPrices(portfolio);
      
      // Calculate current allocations based on market prices
      const currentAllocations = this.calculateCurrentAllocations(portfolio, currentPrices);
      
      // Check if rebalancing is needed based on the strategy
      switch (parameters.strategy) {
        case RebalancingStrategy.THRESHOLD:
          return this.checkThresholdRebalancing(portfolio, currentAllocations, parameters);
        
        case RebalancingStrategy.CALENDAR:
          return this.checkCalendarRebalancing(portfolio, parameters);
        
        case RebalancingStrategy.DRIFT:
          return this.checkDriftRebalancing(portfolio, currentAllocations, parameters);
        
        case RebalancingStrategy.OPPORTUNITY:
          return this.checkOpportunityRebalancing(portfolio, currentAllocations, parameters);
        
        case RebalancingStrategy.HYBRID:
          // Combine multiple strategies
          const thresholdNeeded = this.checkThresholdRebalancing(portfolio, currentAllocations, parameters);
          const calendarNeeded = this.checkCalendarRebalancing(portfolio, parameters);
          const opportunityNeeded = this.checkOpportunityRebalancing(portfolio, currentAllocations, parameters);
          
          return thresholdNeeded || calendarNeeded || opportunityNeeded;
        
        default:
          throw new Error(`Unsupported rebalancing strategy: ${parameters.strategy}`);
      }
    } catch (error) {
      this.logger.error('Error evaluating rebalancing need', { 
        portfolioId, 
        error: error.message 
      });
      
      // Default to false in case of error
      return false;
    }
  }

  /**
   * Generates a rebalancing plan for a portfolio
   * @param portfolioId The portfolio ID
   * @param parameters Rebalancing parameters
   * @returns The rebalancing result
   */
  public async generateRebalancingPlan(
    portfolioId: string,
    parameters: RebalancingParameters
  ): Promise<RebalancingResult> {
    this.logger.info('Generating rebalancing plan', { portfolioId, strategy: parameters.strategy });
    
    try {
      // Get portfolio data
      const portfolio = await this.getPortfolio(portfolioId);
      
      // Get current market prices
      const currentPrices = await this.getCurrentPrices(portfolio);
      
      // Calculate current allocations based on market prices
      const currentAllocations = this.calculateCurrentAllocations(portfolio, currentPrices);
      
      // Get target allocations
      const targetAllocations = await this.getTargetAllocations(portfolio, parameters);
      
      // Calculate trades needed to reach target allocations
      const trades = this.calculateTrades(
        portfolio,
        currentAllocations,
        targetAllocations,
        currentPrices,
        parameters
      );
      
      // Calculate rebalancing metrics
      const metrics = this.calculateRebalancingMetrics(
        portfolio,
        currentAllocations,
        targetAllocations,
        trades
      );
      
      // Create and return the rebalancing result
      const result: RebalancingResult = {
        portfolioId,
        timestamp: new Date(),
        currentAllocations,
        targetAllocations,
        trades,
        metrics,
        status: RebalancingStatus.PENDING
      };
      
      this.logger.info('Rebalancing plan generated successfully', { 
        portfolioId,
        turnover: metrics.turnover,
        estimatedCost: metrics.estimatedCost,
        tradeCount: trades.length
      });
      
      return result;
    } catch (error) {
      this.logger.error('Error generating rebalancing plan', { 
        portfolioId, 
        error: error.message 
      });
      
      return {
        portfolioId,
        timestamp: new Date(),
        currentAllocations: [],
        targetAllocations: [],
        trades: [],
        metrics: {
          turnover: 0,
          estimatedCost: 0
        },
        status: RebalancingStatus.FAILED,
        message: error.message
      };
    }
  }

  /**
   * Approves a rebalancing plan
   * @param rebalancingResult The rebalancing result to approve
   * @returns The updated rebalancing result
   */
  public async approveRebalancingPlan(
    rebalancingResult: RebalancingResult
  ): Promise<RebalancingResult> {
    this.logger.info('Approving rebalancing plan', { 
      portfolioId: rebalancingResult.portfolioId 
    });
    
    // Update status to approved
    return {
      ...rebalancingResult,
      status: RebalancingStatus.APPROVED
    };
  }

  /**
   * Executes an approved rebalancing plan
   * @param rebalancingResult The approved rebalancing plan
   * @returns The updated rebalancing result
   */
  public async executeRebalancingPlan(
    rebalancingResult: RebalancingResult
  ): Promise<RebalancingResult> {
    this.logger.info('Executing rebalancing plan', { 
      portfolioId: rebalancingResult.portfolioId 
    });
    
    try {
      // Check if the plan is approved
      if (rebalancingResult.status !== RebalancingStatus.APPROVED) {
        throw new Error('Cannot execute rebalancing plan that is not approved');
      }
      
      // In a real implementation, this would execute trades through a trading service
      // For now, we'll just update the status
      
      // Update status to executed
      const executedResult: RebalancingResult = {
        ...rebalancingResult,
        status: RebalancingStatus.EXECUTED,
        timestamp: new Date()
      };
      
      this.logger.info('Rebalancing plan executed successfully', { 
        portfolioId: rebalancingResult.portfolioId,
        tradeCount: rebalancingResult.trades.length
      });
      
      return executedResult;
    } catch (error) {
      this.logger.error('Error executing rebalancing plan', { 
        portfolioId: rebalancingResult.portfolioId, 
        error: error.message 
      });
      
      return {
        ...rebalancingResult,
        status: RebalancingStatus.FAILED,
        message: error.message
      };
    }
  }

  /**
   * Checks if threshold-based rebalancing is needed
   */
  private checkThresholdRebalancing(
    portfolio: Portfolio,
    currentAllocations: AssetAllocation[],
    parameters: RebalancingParameters
  ): boolean {
    if (!parameters.thresholds) {
      return false;
    }
    
    const { absolute, relative, assetSpecific, assetClassSpecific } = parameters.thresholds;
    
    // Check absolute threshold
    if (absolute !== undefined) {
      for (const currentAlloc of currentAllocations) {
        const targetAlloc = portfolio.allocations.find(a => a.assetId === currentAlloc.assetId);
        
        if (targetAlloc && Math.abs(currentAlloc.weight - targetAlloc.weight) > absolute) {
          return true;
        }
      }
    }
    
    // Check relative threshold
    if (relative !== undefined) {
      for (const currentAlloc of currentAllocations) {
        const targetAlloc = portfolio.allocations.find(a => a.assetId === currentAlloc.assetId);
        
        if (targetAlloc && targetAlloc.weight > 0) {
          const relativeDeviation = Math.abs(currentAlloc.weight - targetAlloc.weight) / targetAlloc.weight;
          
          if (relativeDeviation > relative) {
            return true;
          }
        }
      }
    }
    
    // Check asset-specific thresholds
    if (assetSpecific) {
      for (const currentAlloc of currentAllocations) {
        const targetAlloc = portfolio.allocations.find(a => a.assetId === currentAlloc.assetId);
        const assetThreshold = assetSpecific[currentAlloc.assetId];
        
        if (targetAlloc && assetThreshold !== undefined) {
          if (Math.abs(currentAlloc.weight - targetAlloc.weight) > assetThreshold) {
            return true;
          }
        }
      }
    }
    
    // Check asset class-specific thresholds
    if (assetClassSpecific) {
      // Group assets by asset class
      const assetsByClass: Record<string, string[]> = {};
      
      for (const asset of portfolio.assets) {
        if (!assetsByClass[asset.assetClass]) {
          assetsByClass[asset.assetClass] = [];
        }
        
        assetsByClass[asset.assetClass].push(asset.id);
      }
      
      // Check each asset class
      for (const [assetClass, assetIds] of Object.entries(assetsByClass)) {
        const classThreshold = assetClassSpecific[assetClass];
        
        if (classThreshold !== undefined) {
          // Calculate current and target weights for the asset class
          let currentClassWeight = 0;
          let targetClassWeight = 0;
          
          for (const assetId of assetIds) {
            const currentAlloc = currentAllocations.find(a => a.assetId === assetId);
            const targetAlloc = portfolio.allocations.find(a => a.assetId === assetId);
            
            if (currentAlloc) {
              currentClassWeight += currentAlloc.weight;
            }
            
            if (targetAlloc) {
              targetClassWeight += targetAlloc.weight;
            }
          }
          
          if (Math.abs(currentClassWeight - targetClassWeight) > classThreshold) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  /**
   * Checks if calendar-based rebalancing is needed
   */
  private checkCalendarRebalancing(
    portfolio: Portfolio,
    parameters: RebalancingParameters
  ): boolean {
    if (!parameters.schedule) {
      return false;
    }
    
    const { frequency, dayOfWeek, dayOfMonth, monthOfYear } = parameters.schedule;
    const today = new Date();
    
    // Check based on frequency
    switch (frequency) {
      case 'DAILY':
        // Rebalance every day
        return true;
      
      case 'WEEKLY':
        // Rebalance on the specified day of the week (0 = Sunday, 1 = Monday, etc.)
        return dayOfWeek === undefined || today.getDay() === dayOfWeek;
      
      case 'MONTHLY':
        // Rebalance on the specified day of the month
        return dayOfMonth === undefined || today.getDate() === dayOfMonth;
      
      case 'QUARTERLY':
        // Rebalance on the specified day of the month in Jan, Apr, Jul, Oct
        const month = today.getMonth();
        const isQuarterMonth = month === 0 || month === 3 || month === 6 || month === 9;
        
        return isQuarterMonth && (dayOfMonth === undefined || today.getDate() === dayOfMonth);
      
      case 'ANNUALLY':
        // Rebalance on the specified day of the specified month
        const isSpecifiedMonth = monthOfYear === undefined || today.getMonth() === monthOfYear;
        
        return isSpecifiedMonth && (dayOfMonth === undefined || today.getDate() === dayOfMonth);
      
      default:
        return false;
    }
  }

  /**
   * Checks if drift-based rebalancing is needed
   */
  private checkDriftRebalancing(
    portfolio: Portfolio,
    currentAllocations: AssetAllocation[],
    parameters: RebalancingParameters
  ): boolean {
    if (!parameters.drift || !parameters.drift.portfolioThreshold) {
      return false;
    }
    
    const { portfolioThreshold, assetThreshold } = parameters.drift;
    
    // Calculate total portfolio drift
    let totalDrift = 0;
    
    for (const currentAlloc of currentAllocations) {
      const targetAlloc = portfolio.allocations.find(a => a.assetId === currentAlloc.assetId);
      
      if (targetAlloc) {
        const drift = Math.abs(currentAlloc.weight - targetAlloc.weight);
        totalDrift += drift;
        
        // Check individual asset drift if threshold is specified
        if (assetThreshold !== undefined && drift > assetThreshold) {
          return true;
        }
      }
    }
    
    // Check total portfolio drift
    return totalDrift > portfolioThreshold;
  }

  /**
   * Checks if opportunity-based rebalancing is needed
   */
  private checkOpportunityRebalancing(
    portfolio: Portfolio,
    currentAllocations: AssetAllocation[],
    parameters: RebalancingParameters
  ): boolean {
    if (!parameters.opportunity) {
      return false;
    }
    
    // In a real implementation, this would check for significant market changes
    // that create rebalancing opportunities
    
    // For now, we'll return false as this requires more complex market data analysis
    return false;
  }

  /**
   * Gets target allocations for a portfolio
   */
  private async getTargetAllocations(
    portfolio: Portfolio,
    parameters: RebalancingParameters
  ): Promise<AssetAllocation[]> {
    // In a real implementation, this might run an optimization
    // For now, we'll use the portfolio's target allocations
    
    return portfolio.allocations.map(alloc => ({
      ...alloc,
      targetWeight: alloc.weight
    }));
  }

  /**
   * Calculates trades needed to reach target allocations
   */
  private calculateTrades(
    portfolio: Portfolio,
    currentAllocations: AssetAllocation[],
    targetAllocations: AssetAllocation[],
    currentPrices: Record<string, number>,
    parameters: RebalancingParameters
  ): PortfolioTrade[] {
    const trades: PortfolioTrade[] = [];
    
    // Calculate portfolio value
    const portfolioValue = currentAllocations.reduce((total, alloc) => {
      const asset = portfolio.assets.find(a => a.id === alloc.assetId);
      const price = asset ? currentPrices[asset.symbol] : 0;
      
      return total + (alloc.weight * portfolioValue);
    }, 0);
    
    // Calculate trades for each asset
    for (const targetAlloc of targetAllocations) {
      const currentAlloc = currentAllocations.find(a => a.assetId === targetAlloc.assetId);
      const asset = portfolio.assets.find(a => a.id === targetAlloc.assetId);
      
      if (currentAlloc && asset && currentPrices[asset.symbol]) {
        const currentValue = currentAlloc.weight * portfolioValue;
        const targetValue = targetAlloc.weight * portfolioValue;
        const priceDifference = targetValue - currentValue;
        
        // Skip small trades if minimum trade size is specified
        if (parameters.minTradeSize && Math.abs(priceDifference) < parameters.minTradeSize) {
          continue;
        }
        
        const price = currentPrices[asset.symbol];
        const quantity = Math.abs(priceDifference / price);
        
        // Round quantity to appropriate precision
        const roundedQuantity = this.roundQuantity(quantity, asset.assetClass);
        
        if (roundedQuantity > 0) {
          trades.push({
            assetId: asset.id,
            symbol: asset.symbol,
            action: priceDifference > 0 ? 'BUY' : 'SELL',
            quantity: roundedQuantity,
            estimatedPrice: price,
            estimatedValue: roundedQuantity * price,
            estimatedCost: this.estimateTransactionCost(asset, roundedQuantity, price)
          });
        }
      }
    }
    
    // Apply turnover constraint if specified
    if (parameters.maxTurnover !== undefined) {
      const totalTurnover = trades.reduce((sum, trade) => sum + trade.estimatedValue, 0) / portfolioValue;
      
      if (totalTurnover > parameters.maxTurnover) {
        // Scale down trades to meet turnover constraint
        const scaleFactor = parameters.maxTurnover / totalTurnover;
        
        for (const trade of trades) {
          trade.quantity *= scaleFactor;
          trade.estimatedValue = trade.quantity * trade.estimatedPrice;
          trade.estimatedCost = this.estimateTransactionCost(
            portfolio.assets.find(a => a.id === trade.assetId)!,
            trade.quantity,
            trade.estimatedPrice
          );
        }
      }
    }
    
    return trades;
  }

  /**
   * Calculates rebalancing metrics
   */
  private calculateRebalancingMetrics(
    portfolio: Portfolio,
    currentAllocations: AssetAllocation[],
    targetAllocations: AssetAllocation[],
    trades: PortfolioTrade[]
  ): RebalancingMetrics {
    // Calculate portfolio value (simplified)
    const portfolioValue = 1000000; // Placeholder
    
    // Calculate turnover
    const turnover = trades.reduce((sum, trade) => sum + trade.estimatedValue, 0) / portfolioValue;
    
    // Calculate estimated cost
    const estimatedCost = trades.reduce((sum, trade) => sum + trade.estimatedCost, 0);
    
    // Calculate other metrics (simplified)
    const riskChange = 0.01; // Placeholder
    const expectedReturnChange = 0.005; // Placeholder
    
    return {
      turnover,
      estimatedCost,
      riskChange,
      expectedReturnChange
    };
  }

  /**
   * Retrieves a portfolio by ID
   */
  private async getPortfolio(portfolioId: string): Promise<Portfolio> {
    // In a real implementation, this would fetch from a database or API
    // For now, we'll return a mock portfolio
    
    return {
      id: portfolioId,
      name: 'Sample Portfolio',
      createdAt: new Date(),
      updatedAt: new Date(),
      assets: [
        {
          id: 'asset1',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          assetClass: 'EQUITY',
          sector: 'Technology',
          country: 'US',
          currency: 'USD'
        },
        {
          id: 'asset2',
          symbol: 'MSFT',
          name: 'Microsoft Corporation',
          assetClass: 'EQUITY',
          sector: 'Technology',
          country: 'US',
          currency: 'USD'
        },
        {
          id: 'asset3',
          symbol: 'AMZN',
          name: 'Amazon.com Inc.',
          assetClass: 'EQUITY',
          sector: 'Consumer Cyclical',
          country: 'US',
          currency: 'USD'
        },
        {
          id: 'asset4',
          symbol: 'BND',
          name: 'Vanguard Total Bond Market ETF',
          assetClass: 'FIXED_INCOME',
          country: 'US',
          currency: 'USD'
        },
        {
          id: 'asset5',
          symbol: 'GLD',
          name: 'SPDR Gold Shares',
          assetClass: 'COMMODITY',
          country: 'US',
          currency: 'USD'
        }
      ],
      allocations: [
        { assetId: 'asset1', weight: 0.2 },
        { assetId: 'asset2', weight: 0.2 },
        { assetId: 'asset3', weight: 0.2 },
        { assetId: 'asset4', weight: 0.3 },
        { assetId: 'asset5', weight: 0.1 }
      ],
      benchmarkId: 'SPY'
    };
  }

  /**
   * Gets current market prices for assets
   */
  private async getCurrentPrices(portfolio: Portfolio): Promise<Record<string, number>> {
    // In a real implementation, this would fetch from a market data service
    // For now, we'll return mock prices
    
    const prices: Record<string, number> = {};
    
    for (const asset of portfolio.assets) {
      // Generate a random price
      prices[asset.symbol] = this.generateRandomPrice(asset.symbol);
    }
    
    return prices;
  }

  /**
   * Generates a random price for testing
   */
  private generateRandomPrice(symbol: string): number {
    // Generate a deterministic but "random" price based on the symbol
    const basePrice = symbol.charCodeAt(0) + symbol.charCodeAt(symbol.length - 1);
    return basePrice * (1 + (Math.random() * 0.1 - 0.05));
  }

  /**
   * Calculates current allocations based on market prices
   */
  private calculateCurrentAllocations(
    portfolio: Portfolio,
    currentPrices: Record<string, number>
  ): AssetAllocation[] {
    // Calculate total portfolio value
    let totalValue = 0;
    const assetValues: Record<string, number> = {};
    
    for (const alloc of portfolio.allocations) {
      const asset = portfolio.assets.find(a => a.id === alloc.assetId);
      
      if (asset && currentPrices[asset.symbol]) {
        // In a real implementation, we would use actual quantities
        // For now, we'll use the target weight and add some random drift
        const drift = (Math.random() * 0.1) - 0.05; // -5% to +5% drift
        const driftedWeight = alloc.weight * (1 + drift);
        const value = driftedWeight * 1000000; // Assuming $1M portfolio
        
        assetValues[alloc.assetId] = value;
        totalValue += value;
      }
    }
    
    // Calculate current allocations
    return portfolio.allocations.map(alloc => ({
      assetId: alloc.assetId,
      weight: assetValues[alloc.assetId] / totalValue || 0
    }));
  }

  /**
   * Rounds quantity based on asset class
   */
  private roundQuantity(quantity: number, assetClass: string): number {
    switch (assetClass) {
      case 'EQUITY':
        // Round to whole shares
        return Math.floor(quantity);
      
      case 'FIXED_INCOME':
        // Round to nearest 0.01
        return Math.round(quantity * 100) / 100;
      
      case 'COMMODITY':
        // Round to nearest 0.1
        return Math.round(quantity * 10) / 10;
      
      default:
        // Default rounding
        return Math.round(quantity * 100) / 100;
    }
  }

  /**
   * Estimates transaction cost
   */
  private estimateTransactionCost(
    asset: any,
    quantity: number,
    price: number
  ): number {
    // In a real implementation, this would use the transaction cost modeling service
    // For now, we'll use a simple model
    
    const value = quantity * price;
    
    // Base commission
    let cost = Math.min(Math.max(value * 0.0005, 1), 20);
    
    // Add spread cost
    cost += value * 0.0001;
    
    // Add market impact (simplified)
    cost += value * 0.0002;
    
    return cost;
  }
}