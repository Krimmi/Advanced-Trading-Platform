import { EventEmitter } from 'events';
import {
  Portfolio,
  Position,
  RiskMetricType
} from './models/RiskModels';
import { HistoricalVaRService } from './HistoricalVaRService';
import { StopLossManagementService, StopLossType } from './StopLossManagementService';
import { DynamicHedgingService, HedgingStrategy } from './DynamicHedgingService';
import { PortfolioRebalancingService, RebalancingStrategy } from './PortfolioRebalancingService';
import { MarketDataService } from '../api/marketData/MarketDataService';
import { MarketDataServiceFactory } from '../api/marketData/MarketDataServiceFactory';
import { positionTrackingService } from '../api/trading/PositionTrackingService';

/**
 * Execution algorithm types
 */
export enum ExecutionAlgorithm {
  MARKET = 'market',
  LIMIT = 'limit',
  STOP = 'stop',
  STOP_LIMIT = 'stop_limit',
  TWAP = 'twap',
  VWAP = 'vwap',
  PERCENTAGE_OF_VOLUME = 'percentage_of_volume',
  IMPLEMENTATION_SHORTFALL = 'implementation_shortfall',
  ADAPTIVE = 'adaptive',
  ICEBERG = 'iceberg',
  SNIPER = 'sniper',
  DARK_POOL = 'dark_pool'
}

/**
 * Market condition types
 */
export enum MarketCondition {
  NORMAL = 'normal',
  VOLATILE = 'volatile',
  TRENDING_UP = 'trending_up',
  TRENDING_DOWN = 'trending_down',
  ILLIQUID = 'illiquid',
  AFTER_HOURS = 'after_hours',
  PRE_MARKET = 'pre_market',
  HIGH_VOLUME = 'high_volume',
  LOW_VOLUME = 'low_volume'
}

/**
 * Execution configuration
 */
export interface ExecutionConfig {
  algorithm: ExecutionAlgorithm;
  maxSlippage: number;
  urgency: number;
  minTradeSize: number;
  maxTradeSize: number;
  participationRate?: number;
  darkPoolEnabled?: boolean;
  adaptiveParameters?: Record<string, any>;
  limitPriceOffset?: number;
  stopPriceOffset?: number;
  timeInForce?: string;
  riskLimits?: {
    maxPositionSize: number;
    maxOrderValue: number;
    maxLeverage: number;
    maxConcentration: number;
    maxDrawdown: number;
  };
}

/**
 * Trade order
 */
export interface TradeOrder {
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  algorithm: ExecutionAlgorithm;
  limitPrice?: number;
  stopPrice?: number;
  timeInForce?: string;
  participationRate?: number;
  urgency?: number;
  darkPoolEnabled?: boolean;
  adaptiveParameters?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Trade execution result
 */
export interface TradeExecutionResult {
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  executedQuantity: number;
  averagePrice: number;
  totalCost: number;
  status: 'filled' | 'partially_filled' | 'pending' | 'cancelled' | 'rejected';
  algorithm: ExecutionAlgorithm;
  slippage: number;
  marketImpact: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Risk-based execution service
 */
export class RiskBasedExecutionService extends EventEmitter {
  private varService: HistoricalVaRService;
  private stopLossService: StopLossManagementService;
  private hedgingService: DynamicHedgingService;
  private rebalancingService: PortfolioRebalancingService;
  private marketDataService: MarketDataService;
  private executionConfigs: Map<ExecutionAlgorithm, ExecutionConfig> = new Map();
  private marketConditions: Map<string, MarketCondition> = new Map();
  private lastExecutionResults: Map<string, TradeExecutionResult[]> = new Map();
  
  /**
   * Creates a new RiskBasedExecutionService
   * @param varService VaR service
   * @param stopLossService Stop loss management service
   * @param hedgingService Dynamic hedging service
   * @param rebalancingService Portfolio rebalancing service
   * @param marketDataService Market data service
   */
  constructor(
    varService?: HistoricalVaRService,
    stopLossService?: StopLossManagementService,
    hedgingService?: DynamicHedgingService,
    rebalancingService?: PortfolioRebalancingService,
    marketDataService?: MarketDataService
  ) {
    super();
    this.varService = varService || new HistoricalVaRService();
    this.stopLossService = stopLossService || new StopLossManagementService();
    this.hedgingService = hedgingService || new DynamicHedgingService();
    this.rebalancingService = rebalancingService || new PortfolioRebalancingService();
    this.marketDataService = marketDataService || MarketDataServiceFactory.getService();
    
    // Initialize default execution configurations
    this.initializeDefaultConfigs();
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  /**
   * Sets execution configuration for an algorithm
   * @param algorithm Execution algorithm
   * @param config Execution configuration
   */
  public setExecutionConfig(algorithm: ExecutionAlgorithm, config: ExecutionConfig): void {
    this.executionConfigs.set(algorithm, config);
  }
  
  /**
   * Gets execution configuration for an algorithm
   * @param algorithm Execution algorithm
   * @returns Execution configuration
   */
  public getExecutionConfig(algorithm: ExecutionAlgorithm): ExecutionConfig | undefined {
    return this.executionConfigs.get(algorithm);
  }
  
  /**
   * Gets market condition for a symbol
   * @param symbol Symbol
   * @returns Market condition
   */
  public getMarketCondition(symbol: string): MarketCondition {
    return this.marketConditions.get(symbol) || MarketCondition.NORMAL;
  }
  
  /**
   * Sets market condition for a symbol
   * @param symbol Symbol
   * @param condition Market condition
   */
  public setMarketCondition(symbol: string, condition: MarketCondition): void {
    this.marketConditions.set(symbol, condition);
  }
  
  /**
   * Gets last execution results for a portfolio
   * @param portfolioId Portfolio ID
   * @returns Array of trade execution results
   */
  public getLastExecutionResults(portfolioId: string): TradeExecutionResult[] {
    return this.lastExecutionResults.get(portfolioId) || [];
  }
  
  /**
   * Executes stop loss orders
   * @param portfolio Portfolio
   * @returns Array of trade execution results
   */
  public async executeStopLossOrders(portfolio: Portfolio): Promise<TradeExecutionResult[]> {
    const results: TradeExecutionResult[] = [];
    
    // Get triggered stop losses
    const triggeredStopLosses = this.stopLossService.getTriggeredStopLosses();
    
    for (const stopLoss of triggeredStopLosses) {
      // Skip if not active
      if (!stopLoss.isActive) {
        continue;
      }
      
      // Create sell order
      const order: TradeOrder = {
        symbol: stopLoss.symbol,
        side: 'sell',
        quantity: stopLoss.quantity,
        algorithm: ExecutionAlgorithm.STOP,
        stopPrice: stopLoss.stopLossPrice,
        timeInForce: 'GTC', // Good Till Cancelled
        urgency: 0.8, // High urgency for stop losses
        metadata: {
          reason: 'stop_loss',
          stopLossType: stopLoss.stopLossType
        }
      };
      
      // Execute order
      const result = await this.executeOrder(order, portfolio);
      results.push(result);
      
      // Deactivate stop loss if filled
      if (result.status === 'filled') {
        this.stopLossService.deactivateStopLoss(stopLoss.symbol);
      }
    }
    
    // Store results
    this.lastExecutionResults.set(portfolio.id, results);
    
    return results;
  }
  
  /**
   * Executes hedging orders
   * @param portfolio Portfolio
   * @param strategy Hedging strategy
   * @returns Array of trade execution results
   */
  public async executeHedgingOrders(
    portfolio: Portfolio,
    strategy: HedgingStrategy
  ): Promise<TradeExecutionResult[]> {
    const results: TradeExecutionResult[] = [];
    
    // Calculate optimal hedge
    const hedgeResult = await this.hedgingService.calculateOptimalHedge(
      portfolio,
      {
        strategy,
        hedgeRatio: 1.0,
        maxHedgeCost: portfolio.totalValue * 0.05, // 5% of portfolio value
        lookbackPeriod: 252,
        rebalanceThreshold: 0.1,
        instruments: []
      }
    );
    
    // Execute hedge recommendations
    for (const rec of hedgeResult.recommendations) {
      // Create order
      const order: TradeOrder = {
        symbol: rec.symbol,
        side: rec.quantity > 0 ? 'buy' : 'sell',
        quantity: Math.abs(rec.quantity),
        algorithm: ExecutionAlgorithm.ADAPTIVE,
        urgency: 0.5, // Medium urgency for hedges
        participationRate: 0.1, // 10% of volume
        metadata: {
          reason: 'hedge',
          hedgeStrategy: strategy,
          hedgeEffectiveness: rec.hedgeEffectiveness
        }
      };
      
      // Execute order
      const result = await this.executeOrder(order, portfolio);
      results.push(result);
    }
    
    // Store results
    this.lastExecutionResults.set(portfolio.id, results);
    
    return results;
  }
  
  /**
   * Executes rebalancing orders
   * @param portfolio Portfolio
   * @returns Array of trade execution results
   */
  public async executeRebalancingOrders(portfolio: Portfolio): Promise<TradeExecutionResult[]> {
    const results: TradeExecutionResult[] = [];
    
    // Check if rebalancing is needed
    const rebalancingNeeded = await this.rebalancingService.checkRebalancingNeeded(portfolio);
    
    if (!rebalancingNeeded) {
      return results;
    }
    
    // Calculate rebalancing trades
    const rebalancingResult = await this.rebalancingService.calculateRebalancingTrades(portfolio);
    
    // Optimize for tax efficiency if enabled
    const optimizedResult = this.rebalancingService.optimizeForTaxEfficiency(rebalancingResult);
    
    // Execute trades
    for (const trade of optimizedResult.trades) {
      // Create order
      const order: TradeOrder = {
        symbol: trade.symbol,
        side: trade.action === 'buy' ? 'buy' : 'sell',
        quantity: trade.quantity,
        algorithm: this.selectExecutionAlgorithm(trade.symbol, trade.quantity),
        urgency: 0.3, // Low urgency for rebalancing
        participationRate: 0.05, // 5% of volume
        metadata: {
          reason: 'rebalance',
          targetAllocation: optimizedResult.targetAllocations[trade.symbol],
          currentAllocation: optimizedResult.currentAllocations[trade.symbol],
          drift: optimizedResult.drifts[trade.symbol]
        }
      };
      
      // Execute order
      const result = await this.executeOrder(order, portfolio);
      results.push(result);
    }
    
    // Store results
    this.lastExecutionResults.set(portfolio.id, results);
    
    return results;
  }
  
  /**
   * Executes a trade order
   * @param order Trade order
   * @param portfolio Portfolio
   * @returns Trade execution result
   */
  public async executeOrder(order: TradeOrder, portfolio: Portfolio): Promise<TradeExecutionResult> {
    try {
      // Get execution config
      const config = this.executionConfigs.get(order.algorithm) || this.getDefaultConfig(order.algorithm);
      
      // Check risk limits
      const riskCheckResult = this.checkRiskLimits(order, portfolio, config);
      
      if (!riskCheckResult.passed) {
        return {
          orderId: this.generateOrderId(),
          symbol: order.symbol,
          side: order.side,
          quantity: order.quantity,
          executedQuantity: 0,
          averagePrice: 0,
          totalCost: 0,
          status: 'rejected',
          algorithm: order.algorithm,
          slippage: 0,
          marketImpact: 0,
          timestamp: Date.now(),
          metadata: {
            reason: 'risk_limit_violation',
            violations: riskCheckResult.violations
          }
        };
      }
      
      // Get current price
      const quote = await this.marketDataService.getQuote(order.symbol);
      const currentPrice = quote.price;
      
      // Get market condition
      const marketCondition = this.getMarketCondition(order.symbol);
      
      // Adjust execution parameters based on market condition
      const adjustedOrder = this.adjustOrderForMarketCondition(order, marketCondition, currentPrice);
      
      // Calculate execution price with slippage
      const slippageMultiplier = this.calculateSlippageMultiplier(
        adjustedOrder.symbol,
        adjustedOrder.quantity,
        adjustedOrder.side,
        marketCondition
      );
      
      const executionPrice = adjustedOrder.side === 'buy'
        ? currentPrice * (1 + slippageMultiplier)
        : currentPrice * (1 - slippageMultiplier);
      
      // Calculate market impact
      const marketImpact = this.calculateMarketImpact(
        adjustedOrder.symbol,
        adjustedOrder.quantity,
        currentPrice,
        marketCondition
      );
      
      // Calculate slippage
      const slippage = Math.abs(executionPrice - currentPrice) / currentPrice;
      
      // Check if slippage exceeds max allowed
      if (slippage > config.maxSlippage) {
        return {
          orderId: this.generateOrderId(),
          symbol: adjustedOrder.symbol,
          side: adjustedOrder.side,
          quantity: adjustedOrder.quantity,
          executedQuantity: 0,
          averagePrice: 0,
          totalCost: 0,
          status: 'rejected',
          algorithm: adjustedOrder.algorithm,
          slippage,
          marketImpact,
          timestamp: Date.now(),
          metadata: {
            reason: 'excessive_slippage',
            maxAllowed: config.maxSlippage,
            actual: slippage
          }
        };
      }
      
      // In a real implementation, this would call a trading API
      // For now, simulate a successful execution
      
      // Calculate total cost
      const totalCost = adjustedOrder.quantity * executionPrice;
      
      // Create execution result
      const result: TradeExecutionResult = {
        orderId: this.generateOrderId(),
        symbol: adjustedOrder.symbol,
        side: adjustedOrder.side,
        quantity: adjustedOrder.quantity,
        executedQuantity: adjustedOrder.quantity,
        averagePrice: executionPrice,
        totalCost,
        status: 'filled',
        algorithm: adjustedOrder.algorithm,
        slippage,
        marketImpact,
        timestamp: Date.now(),
        metadata: {
          marketCondition,
          originalPrice: currentPrice,
          ...adjustedOrder.metadata
        }
      };
      
      // Emit execution event
      this.emit('orderExecuted', result);
      
      return result;
    } catch (error) {
      console.error(`Error executing order for ${order.symbol}:`, error);
      
      // Return failed execution
      return {
        orderId: this.generateOrderId(),
        symbol: order.symbol,
        side: order.side,
        quantity: order.quantity,
        executedQuantity: 0,
        averagePrice: 0,
        totalCost: 0,
        status: 'rejected',
        algorithm: order.algorithm,
        slippage: 0,
        marketImpact: 0,
        timestamp: Date.now(),
        metadata: {
          reason: 'execution_error',
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
  
  /**
   * Selects execution algorithm based on symbol and quantity
   * @param symbol Symbol
   * @param quantity Quantity
   * @returns Execution algorithm
   */
  public selectExecutionAlgorithm(symbol: string, quantity: number): ExecutionAlgorithm {
    try {
      // Get market condition
      const marketCondition = this.getMarketCondition(symbol);
      
      // Get average daily volume (simplified)
      const adv = 1000000; // Default to 1M shares
      
      // Calculate order size relative to ADV
      const orderSizeRatio = quantity / adv;
      
      // Select algorithm based on order size and market condition
      if (orderSizeRatio < 0.001) {
        // Small order (< 0.1% of ADV)
        return ExecutionAlgorithm.MARKET;
      } else if (orderSizeRatio < 0.01) {
        // Medium order (0.1% - 1% of ADV)
        switch (marketCondition) {
          case MarketCondition.VOLATILE:
            return ExecutionAlgorithm.TWAP;
          case MarketCondition.ILLIQUID:
            return ExecutionAlgorithm.DARK_POOL;
          default:
            return ExecutionAlgorithm.LIMIT;
        }
      } else if (orderSizeRatio < 0.05) {
        // Large order (1% - 5% of ADV)
        switch (marketCondition) {
          case MarketCondition.VOLATILE:
            return ExecutionAlgorithm.VWAP;
          case MarketCondition.ILLIQUID:
            return ExecutionAlgorithm.ICEBERG;
          default:
            return ExecutionAlgorithm.PERCENTAGE_OF_VOLUME;
        }
      } else {
        // Very large order (> 5% of ADV)
        switch (marketCondition) {
          case MarketCondition.VOLATILE:
            return ExecutionAlgorithm.IMPLEMENTATION_SHORTFALL;
          case MarketCondition.ILLIQUID:
            return ExecutionAlgorithm.DARK_POOL;
          default:
            return ExecutionAlgorithm.ADAPTIVE;
        }
      }
    } catch (error) {
      console.error(`Error selecting execution algorithm for ${symbol}:`, error);
      return ExecutionAlgorithm.MARKET; // Default to market order
    }
  }
  
  /**
   * Adjusts order for market condition
   * @param order Trade order
   * @param marketCondition Market condition
   * @param currentPrice Current price
   * @returns Adjusted trade order
   */
  private adjustOrderForMarketCondition(
    order: TradeOrder,
    marketCondition: MarketCondition,
    currentPrice: number
  ): TradeOrder {
    // Clone order
    const adjustedOrder: TradeOrder = { ...order };
    
    // Get execution config
    const config = this.executionConfigs.get(order.algorithm) || this.getDefaultConfig(order.algorithm);
    
    // Adjust based on market condition
    switch (marketCondition) {
      case MarketCondition.VOLATILE:
        // Reduce participation rate in volatile markets
        adjustedOrder.participationRate = (order.participationRate || config.participationRate || 0.1) * 0.5;
        
        // Set limit price with wider spread
        if (order.algorithm === ExecutionAlgorithm.LIMIT) {
          const limitOffset = (config.limitPriceOffset || 0.01) * 2;
          adjustedOrder.limitPrice = order.side === 'buy'
            ? currentPrice * (1 + limitOffset)
            : currentPrice * (1 - limitOffset);
        }
        break;
        
      case MarketCondition.ILLIQUID:
        // Use dark pools for illiquid markets
        adjustedOrder.darkPoolEnabled = true;
        
        // Reduce order size if needed
        if (order.quantity > config.maxTradeSize) {
          adjustedOrder.quantity = config.maxTradeSize;
        }
        break;
        
      case MarketCondition.TRENDING_UP:
        // Adjust limit price for uptrend
        if (order.algorithm === ExecutionAlgorithm.LIMIT && order.side === 'buy') {
          const limitOffset = config.limitPriceOffset || 0.01;
          adjustedOrder.limitPrice = currentPrice * (1 + limitOffset * 1.5);
        }
        break;
        
      case MarketCondition.TRENDING_DOWN:
        // Adjust limit price for downtrend
        if (order.algorithm === ExecutionAlgorithm.LIMIT && order.side === 'sell') {
          const limitOffset = config.limitPriceOffset || 0.01;
          adjustedOrder.limitPrice = currentPrice * (1 - limitOffset * 1.5);
        }
        break;
        
      case MarketCondition.AFTER_HOURS:
      case MarketCondition.PRE_MARKET:
        // Use limit orders with wider spreads for extended hours
        adjustedOrder.algorithm = ExecutionAlgorithm.LIMIT;
        const limitOffset = (config.limitPriceOffset || 0.01) * 3;
        adjustedOrder.limitPrice = order.side === 'buy'
          ? currentPrice * (1 + limitOffset)
          : currentPrice * (1 - limitOffset);
        break;
        
      case MarketCondition.LOW_VOLUME:
        // Reduce participation rate in low volume
        adjustedOrder.participationRate = (order.participationRate || config.participationRate || 0.1) * 0.3;
        break;
        
      case MarketCondition.HIGH_VOLUME:
        // Increase participation rate in high volume
        adjustedOrder.participationRate = Math.min(
          (order.participationRate || config.participationRate || 0.1) * 2,
          0.3 // Cap at 30%
        );
        break;
    }
    
    return adjustedOrder;
  }
  
  /**
   * Calculates slippage multiplier
   * @param symbol Symbol
   * @param quantity Quantity
   * @param side Order side
   * @param marketCondition Market condition
   * @returns Slippage multiplier
   */
  private calculateSlippageMultiplier(
    symbol: string,
    quantity: number,
    side: 'buy' | 'sell',
    marketCondition: MarketCondition
  ): number {
    // Base slippage (0.1%)
    let slippage = 0.001;
    
    // Adjust for market condition
    switch (marketCondition) {
      case MarketCondition.VOLATILE:
        slippage *= 3; // 3x slippage in volatile markets
        break;
      case MarketCondition.ILLIQUID:
        slippage *= 5; // 5x slippage in illiquid markets
        break;
      case MarketCondition.AFTER_HOURS:
      case MarketCondition.PRE_MARKET:
        slippage *= 2; // 2x slippage in extended hours
        break;
      case MarketCondition.LOW_VOLUME:
        slippage *= 2.5; // 2.5x slippage in low volume
        break;
      case MarketCondition.HIGH_VOLUME:
        slippage *= 0.7; // 30% less slippage in high volume
        break;
    }
    
    // Adjust for order size (simplified)
    // In a real implementation, would use market microstructure models
    const adv = 1000000; // Default to 1M shares
    const orderSizeRatio = quantity / adv;
    
    // Square root model for market impact
    slippage *= Math.sqrt(orderSizeRatio * 100);
    
    return slippage;
  }
  
  /**
   * Calculates market impact
   * @param symbol Symbol
   * @param quantity Quantity
   * @param price Price
   * @param marketCondition Market condition
   * @returns Market impact percentage
   */
  private calculateMarketImpact(
    symbol: string,
    quantity: number,
    price: number,
    marketCondition: MarketCondition
  ): number {
    // Base impact (0.05%)
    let impact = 0.0005;
    
    // Adjust for market condition
    switch (marketCondition) {
      case MarketCondition.VOLATILE:
        impact *= 2.5; // 2.5x impact in volatile markets
        break;
      case MarketCondition.ILLIQUID:
        impact *= 4; // 4x impact in illiquid markets
        break;
      case MarketCondition.LOW_VOLUME:
        impact *= 3; // 3x impact in low volume
        break;
    }
    
    // Adjust for order size (simplified)
    const adv = 1000000; // Default to 1M shares
    const orderSizeRatio = quantity / adv;
    
    // Square root model for market impact
    impact *= Math.sqrt(orderSizeRatio * 100);
    
    return impact;
  }
  
  /**
   * Checks risk limits for an order
   * @param order Trade order
   * @param portfolio Portfolio
   * @param config Execution configuration
   * @returns Risk check result
   */
  private checkRiskLimits(
    order: TradeOrder,
    portfolio: Portfolio,
    config: ExecutionConfig
  ): { passed: boolean, violations: string[] } {
    const violations: string[] = [];
    
    // Skip if no risk limits
    if (!config.riskLimits) {
      return { passed: true, violations: [] };
    }
    
    // Get current price
    const price = order.limitPrice || 0; // In a real implementation, would get current price
    
    // Calculate order value
    const orderValue = order.quantity * price;
    
    // Check max order value
    if (config.riskLimits.maxOrderValue && orderValue > config.riskLimits.maxOrderValue) {
      violations.push(`Order value ${orderValue} exceeds max ${config.riskLimits.maxOrderValue}`);
    }
    
    // Check position size
    if (order.side === 'buy') {
      // Find existing position
      const position = portfolio.positions.find(p => p.symbol === order.symbol);
      const currentQuantity = position ? position.quantity : 0;
      const newQuantity = currentQuantity + order.quantity;
      
      // Check max position size
      if (config.riskLimits.maxPositionSize && newQuantity > config.riskLimits.maxPositionSize) {
        violations.push(`Position size ${newQuantity} exceeds max ${config.riskLimits.maxPositionSize}`);
      }
      
      // Check concentration
      const newPositionValue = newQuantity * price;
      const concentration = newPositionValue / portfolio.totalValue;
      
      if (config.riskLimits.maxConcentration && concentration > config.riskLimits.maxConcentration) {
        violations.push(`Concentration ${concentration} exceeds max ${config.riskLimits.maxConcentration}`);
      }
    }
    
    return {
      passed: violations.length === 0,
      violations
    };
  }
  
  /**
   * Gets default execution configuration
   * @param algorithm Execution algorithm
   * @returns Execution configuration
   */
  private getDefaultConfig(algorithm: ExecutionAlgorithm): ExecutionConfig {
    // Default configuration
    return {
      algorithm,
      maxSlippage: 0.01, // 1%
      urgency: 0.5, // Medium
      minTradeSize: 100, // $100
      maxTradeSize: 1000000, // $1M
      participationRate: 0.1, // 10%
      darkPoolEnabled: false,
      limitPriceOffset: 0.01, // 1%
      stopPriceOffset: 0.02, // 2%
      timeInForce: 'DAY',
      riskLimits: {
        maxPositionSize: 100000,
        maxOrderValue: 1000000,
        maxLeverage: 1.5,
        maxConcentration: 0.1,
        maxDrawdown: 0.1
      }
    };
  }
  
  /**
   * Initializes default execution configurations
   */
  private initializeDefaultConfigs(): void {
    // Market order
    this.executionConfigs.set(ExecutionAlgorithm.MARKET, {
      algorithm: ExecutionAlgorithm.MARKET,
      maxSlippage: 0.01, // 1%
      urgency: 1.0, // High
      minTradeSize: 100,
      maxTradeSize: 100000,
      timeInForce: 'DAY',
      riskLimits: {
        maxPositionSize: 100000,
        maxOrderValue: 100000,
        maxLeverage: 1.0,
        maxConcentration: 0.05,
        maxDrawdown: 0.05
      }
    });
    
    // Limit order
    this.executionConfigs.set(ExecutionAlgorithm.LIMIT, {
      algorithm: ExecutionAlgorithm.LIMIT,
      maxSlippage: 0.005, // 0.5%
      urgency: 0.5, // Medium
      minTradeSize: 100,
      maxTradeSize: 500000,
      limitPriceOffset: 0.01, // 1%
      timeInForce: 'DAY',
      riskLimits: {
        maxPositionSize: 100000,
        maxOrderValue: 500000,
        maxLeverage: 1.0,
        maxConcentration: 0.05,
        maxDrawdown: 0.05
      }
    });
    
    // TWAP
    this.executionConfigs.set(ExecutionAlgorithm.TWAP, {
      algorithm: ExecutionAlgorithm.TWAP,
      maxSlippage: 0.01, // 1%
      urgency: 0.3, // Low
      minTradeSize: 1000,
      maxTradeSize: 1000000,
      participationRate: 0.1, // 10%
      timeInForce: 'DAY',
      riskLimits: {
        maxPositionSize: 500000,
        maxOrderValue: 1000000,
        maxLeverage: 1.0,
        maxConcentration: 0.1,
        maxDrawdown: 0.1
      }
    });
    
    // VWAP
    this.executionConfigs.set(ExecutionAlgorithm.VWAP, {
      algorithm: ExecutionAlgorithm.VWAP,
      maxSlippage: 0.01, // 1%
      urgency: 0.3, // Low
      minTradeSize: 1000,
      maxTradeSize: 1000000,
      participationRate: 0.15, // 15%
      timeInForce: 'DAY',
      riskLimits: {
        maxPositionSize: 500000,
        maxOrderValue: 1000000,
        maxLeverage: 1.0,
        maxConcentration: 0.1,
        maxDrawdown: 0.1
      }
    });
    
    // Percentage of Volume
    this.executionConfigs.set(ExecutionAlgorithm.PERCENTAGE_OF_VOLUME, {
      algorithm: ExecutionAlgorithm.PERCENTAGE_OF_VOLUME,
      maxSlippage: 0.01, // 1%
      urgency: 0.5, // Medium
      minTradeSize: 1000,
      maxTradeSize: 2000000,
      participationRate: 0.1, // 10%
      timeInForce: 'DAY',
      riskLimits: {
        maxPositionSize: 1000000,
        maxOrderValue: 2000000,
        maxLeverage: 1.0,
        maxConcentration: 0.15,
        maxDrawdown: 0.1
      }
    });
    
    // Implementation Shortfall
    this.executionConfigs.set(ExecutionAlgorithm.IMPLEMENTATION_SHORTFALL, {
      algorithm: ExecutionAlgorithm.IMPLEMENTATION_SHORTFALL,
      maxSlippage: 0.015, // 1.5%
      urgency: 0.7, // Medium-high
      minTradeSize: 10000,
      maxTradeSize: 5000000,
      participationRate: 0.2, // 20%
      timeInForce: 'DAY',
      riskLimits: {
        maxPositionSize: 2000000,
        maxOrderValue: 5000000,
        maxLeverage: 1.5,
        maxConcentration: 0.2,
        maxDrawdown: 0.15
      }
    });
    
    // Adaptive
    this.executionConfigs.set(ExecutionAlgorithm.ADAPTIVE, {
      algorithm: ExecutionAlgorithm.ADAPTIVE,
      maxSlippage: 0.02, // 2%
      urgency: 0.5, // Medium
      minTradeSize: 1000,
      maxTradeSize: 10000000,
      participationRate: 0.15, // 15%
      darkPoolEnabled: true,
      adaptiveParameters: {
        minParticipationRate: 0.05,
        maxParticipationRate: 0.3,
        volatilityScaling: true,
        opportunisticExecution: true
      },
      timeInForce: 'DAY',
      riskLimits: {
        maxPositionSize: 5000000,
        maxOrderValue: 10000000,
        maxLeverage: 2.0,
        maxConcentration: 0.25,
        maxDrawdown: 0.2
      }
    });
  }
  
  /**
   * Sets up event listeners
   */
  private setupEventListeners(): void {
    // Listen for stop loss alerts
    this.stopLossService.on('stopLossAlert', (alert) => {
      this.emit('riskAlert', {
        type: 'stop_loss',
        level: alert.alertLevel,
        message: alert.message,
        symbol: alert.symbol,
        data: alert
      });
    });
    
    // Listen for stop loss triggers
    this.stopLossService.on('stopLossTriggered', (stopLoss) => {
      this.emit('riskAlert', {
        type: 'stop_loss_triggered',
        level: 'critical',
        message: `Stop loss triggered for ${stopLoss.symbol} at ${stopLoss.currentPrice}`,
        symbol: stopLoss.symbol,
        data: stopLoss
      });
    });
  }
  
  /**
   * Generates a unique order ID
   * @returns Order ID
   */
  private generateOrderId(): string {
    return `order-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  }
}

// Export singleton instance
export const riskBasedExecutionService = new RiskBasedExecutionService();