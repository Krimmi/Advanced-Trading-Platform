import { EventEmitter } from 'events';
import { OrderManagementSystem, Order } from '../execution/OrderManagementSystem';
import { PositionTrackingService, Position, Portfolio } from '../portfolio/PositionTrackingService';
import { OrderParams, OrderSide, OrderType, TimeInForce } from '../../../models/algorithmic-trading/OrderTypes';

/**
 * Risk limit interface
 */
export interface RiskLimit {
  id: string;
  name: string;
  description: string;
  type: RiskLimitType;
  value: number;
  action: RiskAction;
  isEnabled: boolean;
  appliesTo: RiskLimitScope;
  symbols?: string[];
  strategyIds?: string[];
}

/**
 * Risk limit type enum
 */
export enum RiskLimitType {
  MAX_POSITION_SIZE = 'MAX_POSITION_SIZE',
  MAX_POSITION_VALUE = 'MAX_POSITION_VALUE',
  MAX_POSITION_PERCENT = 'MAX_POSITION_PERCENT',
  MAX_DRAWDOWN = 'MAX_DRAWDOWN',
  MAX_DAILY_LOSS = 'MAX_DAILY_LOSS',
  MAX_DAILY_LOSS_PERCENT = 'MAX_DAILY_LOSS_PERCENT',
  MAX_OPEN_POSITIONS = 'MAX_OPEN_POSITIONS',
  MAX_DAILY_ORDERS = 'MAX_DAILY_ORDERS',
  MAX_ORDER_VALUE = 'MAX_ORDER_VALUE',
  MAX_ORDER_QUANTITY = 'MAX_ORDER_QUANTITY',
  MIN_ACCOUNT_BALANCE = 'MIN_ACCOUNT_BALANCE',
  MAX_CONCENTRATION = 'MAX_CONCENTRATION'
}

/**
 * Risk action enum
 */
export enum RiskAction {
  BLOCK_ORDER = 'BLOCK_ORDER',
  REDUCE_SIZE = 'REDUCE_SIZE',
  NOTIFY = 'NOTIFY',
  CLOSE_POSITION = 'CLOSE_POSITION',
  CLOSE_ALL_POSITIONS = 'CLOSE_ALL_POSITIONS',
  PAUSE_STRATEGY = 'PAUSE_STRATEGY',
  PAUSE_ALL_STRATEGIES = 'PAUSE_ALL_STRATEGIES'
}

/**
 * Risk limit scope enum
 */
export enum RiskLimitScope {
  GLOBAL = 'GLOBAL',
  SYMBOL = 'SYMBOL',
  STRATEGY = 'STRATEGY'
}

/**
 * Risk check result interface
 */
export interface RiskCheckResult {
  passed: boolean;
  limitId?: string;
  limitName?: string;
  limitType?: RiskLimitType;
  limitValue?: number;
  actualValue?: number;
  action?: RiskAction;
  message?: string;
}

/**
 * Risk management service
 * 
 * This service implements risk controls for live trading
 */
export class RiskManagementService extends EventEmitter {
  private static instance: RiskManagementService;
  
  private orderManagementSystem: OrderManagementSystem;
  private positionTrackingService: PositionTrackingService;
  private riskLimits: Map<string, RiskLimit> = new Map();
  private isInitialized: boolean = false;
  private dailyStats: {
    startTime: Date;
    orders: Map<string, number>; // strategyId -> count
    pnl: number;
    startingBalance: number;
  } = {
    startTime: new Date(),
    orders: new Map(),
    pnl: 0,
    startingBalance: 0
  };
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    super();
    this.orderManagementSystem = OrderManagementSystem.getInstance();
    this.positionTrackingService = PositionTrackingService.getInstance();
  }
  
  /**
   * Get the singleton instance
   * @returns The singleton instance
   */
  public static getInstance(): RiskManagementService {
    if (!RiskManagementService.instance) {
      RiskManagementService.instance = new RiskManagementService();
    }
    return RiskManagementService.instance;
  }
  
  /**
   * Initialize the risk management service
   * @param config Configuration for the service
   */
  public async initialize(config: Record<string, any> = {}): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    // Set up default risk limits
    this.setupDefaultRiskLimits();
    
    // Apply custom risk limits from config
    if (config.riskLimits) {
      for (const limit of config.riskLimits) {
        this.addRiskLimit(limit);
      }
    }
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize daily stats
    await this.initializeDailyStats();
    
    this.isInitialized = true;
    console.log('Risk Management Service initialized');
  }
  
  /**
   * Set up default risk limits
   */
  private setupDefaultRiskLimits(): void {
    // Global risk limits
    this.addRiskLimit({
      id: 'global-max-position-percent',
      name: 'Global Maximum Position Size',
      description: 'Maximum position size as a percentage of portfolio value',
      type: RiskLimitType.MAX_POSITION_PERCENT,
      value: 20, // 20% of portfolio
      action: RiskAction.BLOCK_ORDER,
      isEnabled: true,
      appliesTo: RiskLimitScope.GLOBAL
    });
    
    this.addRiskLimit({
      id: 'global-max-open-positions',
      name: 'Global Maximum Open Positions',
      description: 'Maximum number of open positions',
      type: RiskLimitType.MAX_OPEN_POSITIONS,
      value: 10,
      action: RiskAction.BLOCK_ORDER,
      isEnabled: true,
      appliesTo: RiskLimitScope.GLOBAL
    });
    
    this.addRiskLimit({
      id: 'global-max-daily-loss',
      name: 'Global Maximum Daily Loss',
      description: 'Maximum daily loss as a percentage of portfolio value',
      type: RiskLimitType.MAX_DAILY_LOSS_PERCENT,
      value: 3, // 3% of portfolio
      action: RiskAction.CLOSE_ALL_POSITIONS,
      isEnabled: true,
      appliesTo: RiskLimitScope.GLOBAL
    });
    
    this.addRiskLimit({
      id: 'global-min-account-balance',
      name: 'Global Minimum Account Balance',
      description: 'Minimum account balance required for trading',
      type: RiskLimitType.MIN_ACCOUNT_BALANCE,
      value: 10000, // $10,000
      action: RiskAction.BLOCK_ORDER,
      isEnabled: true,
      appliesTo: RiskLimitScope.GLOBAL
    });
    
    this.addRiskLimit({
      id: 'global-max-concentration',
      name: 'Global Maximum Concentration',
      description: 'Maximum concentration in a single symbol as a percentage of portfolio value',
      type: RiskLimitType.MAX_CONCENTRATION,
      value: 30, // 30% of portfolio
      action: RiskAction.BLOCK_ORDER,
      isEnabled: true,
      appliesTo: RiskLimitScope.GLOBAL
    });
    
    // Per-symbol risk limits
    this.addRiskLimit({
      id: 'symbol-max-position-size',
      name: 'Symbol Maximum Position Size',
      description: 'Maximum position size for a symbol',
      type: RiskLimitType.MAX_POSITION_SIZE,
      value: 1000, // 1000 shares
      action: RiskAction.REDUCE_SIZE,
      isEnabled: true,
      appliesTo: RiskLimitScope.SYMBOL
    });
    
    // Per-strategy risk limits
    this.addRiskLimit({
      id: 'strategy-max-daily-orders',
      name: 'Strategy Maximum Daily Orders',
      description: 'Maximum number of orders a strategy can place per day',
      type: RiskLimitType.MAX_DAILY_ORDERS,
      value: 20,
      action: RiskAction.PAUSE_STRATEGY,
      isEnabled: true,
      appliesTo: RiskLimitScope.STRATEGY
    });
    
    this.addRiskLimit({
      id: 'strategy-max-drawdown',
      name: 'Strategy Maximum Drawdown',
      description: 'Maximum drawdown for a strategy as a percentage',
      type: RiskLimitType.MAX_DRAWDOWN,
      value: 10, // 10% drawdown
      action: RiskAction.PAUSE_STRATEGY,
      isEnabled: true,
      appliesTo: RiskLimitScope.STRATEGY
    });
  }
  
  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Listen for order events
    this.orderManagementSystem.on('order_added', this.handleOrderAdded.bind(this));
    this.orderManagementSystem.on('order_filled', this.handleOrderFilled.bind(this));
    
    // Listen for position updates
    this.positionTrackingService.on('positions_updated', this.handlePositionsUpdated.bind(this));
    this.positionTrackingService.on('portfolio_updated', this.handlePortfolioUpdated.bind(this));
  }
  
  /**
   * Initialize daily stats
   */
  private async initializeDailyStats(): Promise<void> {
    // Reset daily stats
    const now = new Date();
    this.dailyStats = {
      startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate()), // Start of day
      orders: new Map(),
      pnl: 0,
      startingBalance: 0
    };
    
    // Get portfolio value
    const portfolio = this.positionTrackingService.getPortfolio();
    this.dailyStats.startingBalance = portfolio.totalValue;
    
    // Check if we need to reset daily stats (if it's a new day)
    this.checkAndResetDailyStats();
  }
  
  /**
   * Check if we need to reset daily stats
   */
  private checkAndResetDailyStats(): void {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // If the start time is from a previous day, reset the stats
    if (this.dailyStats.startTime < startOfDay) {
      console.log('Resetting daily stats for new day');
      
      // Get current portfolio value
      const portfolio = this.positionTrackingService.getPortfolio();
      
      this.dailyStats = {
        startTime: startOfDay,
        orders: new Map(),
        pnl: 0,
        startingBalance: portfolio.totalValue
      };
    }
  }
  
  /**
   * Handle order added event
   * @param order Order that was added
   */
  private handleOrderAdded(order: Order): void {
    // Check and reset daily stats if needed
    this.checkAndResetDailyStats();
    
    // Update daily order count for the strategy
    if (order.strategyId) {
      const currentCount = this.dailyStats.orders.get(order.strategyId) || 0;
      this.dailyStats.orders.set(order.strategyId, currentCount + 1);
    }
  }
  
  /**
   * Handle order filled event
   * @param order Order that was filled
   */
  private handleOrderFilled(order: Order): void {
    // No specific handling needed here yet
  }
  
  /**
   * Handle positions updated event
   * @param positions Updated positions
   */
  private handlePositionsUpdated(positions: Position[]): void {
    // Check risk limits for each position
    for (const position of positions) {
      this.checkPositionRiskLimits(position);
    }
  }
  
  /**
   * Handle portfolio updated event
   * @param portfolio Updated portfolio
   */
  private handlePortfolioUpdated(portfolio: Portfolio): void {
    // Update daily P&L
    this.dailyStats.pnl = portfolio.totalValue - this.dailyStats.startingBalance;
    
    // Check global risk limits
    this.checkGlobalRiskLimits(portfolio);
  }
  
  /**
   * Check risk limits for a new order
   * @param orderParams Order parameters
   * @returns Risk check result
   */
  public checkOrderRiskLimits(orderParams: OrderParams): RiskCheckResult {
    // Check and reset daily stats if needed
    this.checkAndResetDailyStats();
    
    // Get portfolio and positions
    const portfolio = this.positionTrackingService.getPortfolio();
    const positions = this.positionTrackingService.getPositions();
    
    // Check global risk limits first
    
    // 1. Check minimum account balance
    const minBalanceLimit = this.getRiskLimitByType(RiskLimitType.MIN_ACCOUNT_BALANCE);
    if (minBalanceLimit && minBalanceLimit.isEnabled) {
      if (portfolio.totalValue < minBalanceLimit.value) {
        return {
          passed: false,
          limitId: minBalanceLimit.id,
          limitName: minBalanceLimit.name,
          limitType: minBalanceLimit.type,
          limitValue: minBalanceLimit.value,
          actualValue: portfolio.totalValue,
          action: minBalanceLimit.action,
          message: `Account balance (${portfolio.totalValue}) is below minimum (${minBalanceLimit.value})`
        };
      }
    }
    
    // 2. Check maximum open positions
    const maxPositionsLimit = this.getRiskLimitByType(RiskLimitType.MAX_OPEN_POSITIONS);
    if (maxPositionsLimit && maxPositionsLimit.isEnabled) {
      // Only check for new positions (BUY orders for symbols we don't already have)
      if (
        orderParams.side === OrderSide.BUY &&
        !positions.some(p => p.symbol === orderParams.symbol && p.quantity > 0)
      ) {
        if (positions.length >= maxPositionsLimit.value) {
          return {
            passed: false,
            limitId: maxPositionsLimit.id,
            limitName: maxPositionsLimit.name,
            limitType: maxPositionsLimit.type,
            limitValue: maxPositionsLimit.value,
            actualValue: positions.length,
            action: maxPositionsLimit.action,
            message: `Maximum number of open positions (${maxPositionsLimit.value}) would be exceeded`
          };
        }
      }
    }
    
    // 3. Check maximum daily loss
    const maxDailyLossPercentLimit = this.getRiskLimitByType(RiskLimitType.MAX_DAILY_LOSS_PERCENT);
    if (maxDailyLossPercentLimit && maxDailyLossPercentLimit.isEnabled) {
      const dailyLossPercent = (this.dailyStats.pnl / this.dailyStats.startingBalance) * 100;
      if (dailyLossPercent < -maxDailyLossPercentLimit.value) {
        return {
          passed: false,
          limitId: maxDailyLossPercentLimit.id,
          limitName: maxDailyLossPercentLimit.name,
          limitType: maxDailyLossPercentLimit.type,
          limitValue: maxDailyLossPercentLimit.value,
          actualValue: Math.abs(dailyLossPercent),
          action: maxDailyLossPercentLimit.action,
          message: `Daily loss (${dailyLossPercent.toFixed(2)}%) exceeds maximum (${maxDailyLossPercentLimit.value}%)`
        };
      }
    }
    
    // 4. Check maximum order value
    const maxOrderValueLimit = this.getRiskLimitByType(RiskLimitType.MAX_ORDER_VALUE);
    if (maxOrderValueLimit && maxOrderValueLimit.isEnabled) {
      // Calculate order value
      const price = orderParams.limitPrice || orderParams.stopPrice || 0; // This would need to be replaced with actual price
      const orderValue = price * orderParams.quantity;
      
      if (orderValue > maxOrderValueLimit.value) {
        return {
          passed: false,
          limitId: maxOrderValueLimit.id,
          limitName: maxOrderValueLimit.name,
          limitType: maxOrderValueLimit.type,
          limitValue: maxOrderValueLimit.value,
          actualValue: orderValue,
          action: maxOrderValueLimit.action,
          message: `Order value (${orderValue}) exceeds maximum (${maxOrderValueLimit.value})`
        };
      }
    }
    
    // 5. Check maximum order quantity
    const maxOrderQuantityLimit = this.getRiskLimitByType(RiskLimitType.MAX_ORDER_QUANTITY);
    if (maxOrderQuantityLimit && maxOrderQuantityLimit.isEnabled) {
      if (orderParams.quantity > maxOrderQuantityLimit.value) {
        return {
          passed: false,
          limitId: maxOrderQuantityLimit.id,
          limitName: maxOrderQuantityLimit.name,
          limitType: maxOrderQuantityLimit.type,
          limitValue: maxOrderQuantityLimit.value,
          actualValue: orderParams.quantity,
          action: maxOrderQuantityLimit.action,
          message: `Order quantity (${orderParams.quantity}) exceeds maximum (${maxOrderQuantityLimit.value})`
        };
      }
    }
    
    // 6. Check maximum position percentage
    const maxPositionPercentLimit = this.getRiskLimitByType(RiskLimitType.MAX_POSITION_PERCENT);
    if (maxPositionPercentLimit && maxPositionPercentLimit.isEnabled) {
      // Calculate position value after this order
      const existingPosition = positions.find(p => p.symbol === orderParams.symbol);
      const price = orderParams.limitPrice || orderParams.stopPrice || 0; // This would need to be replaced with actual price
      
      let newPositionValue = price * orderParams.quantity;
      if (existingPosition) {
        if (orderParams.side === OrderSide.BUY) {
          newPositionValue += existingPosition.marketValue;
        } else {
          newPositionValue = existingPosition.marketValue - newPositionValue;
        }
      }
      
      const positionPercent = (newPositionValue / portfolio.totalValue) * 100;
      
      if (positionPercent > maxPositionPercentLimit.value) {
        return {
          passed: false,
          limitId: maxPositionPercentLimit.id,
          limitName: maxPositionPercentLimit.name,
          limitType: maxPositionPercentLimit.type,
          limitValue: maxPositionPercentLimit.value,
          actualValue: positionPercent,
          action: maxPositionPercentLimit.action,
          message: `Position size (${positionPercent.toFixed(2)}% of portfolio) exceeds maximum (${maxPositionPercentLimit.value}%)`
        };
      }
    }
    
    // 7. Check symbol-specific limits
    const symbolMaxPositionSizeLimit = this.getRiskLimitByTypeAndSymbol(
      RiskLimitType.MAX_POSITION_SIZE,
      orderParams.symbol
    );
    
    if (symbolMaxPositionSizeLimit && symbolMaxPositionSizeLimit.isEnabled) {
      // Calculate new position size after this order
      const existingPosition = positions.find(p => p.symbol === orderParams.symbol);
      let newPositionSize = orderParams.quantity;
      
      if (existingPosition) {
        if (orderParams.side === OrderSide.BUY) {
          newPositionSize += existingPosition.quantity;
        } else {
          newPositionSize = existingPosition.quantity - newPositionSize;
        }
      }
      
      if (newPositionSize > symbolMaxPositionSizeLimit.value) {
        return {
          passed: false,
          limitId: symbolMaxPositionSizeLimit.id,
          limitName: symbolMaxPositionSizeLimit.name,
          limitType: symbolMaxPositionSizeLimit.type,
          limitValue: symbolMaxPositionSizeLimit.value,
          actualValue: newPositionSize,
          action: symbolMaxPositionSizeLimit.action,
          message: `Position size (${newPositionSize} shares) for ${orderParams.symbol} exceeds maximum (${symbolMaxPositionSizeLimit.value})`
        };
      }
    }
    
    // 8. Check strategy-specific limits
    if (orderParams.strategyId) {
      const strategyMaxDailyOrdersLimit = this.getRiskLimitByTypeAndStrategy(
        RiskLimitType.MAX_DAILY_ORDERS,
        orderParams.strategyId
      );
      
      if (strategyMaxDailyOrdersLimit && strategyMaxDailyOrdersLimit.isEnabled) {
        const currentOrderCount = this.dailyStats.orders.get(orderParams.strategyId) || 0;
        
        if (currentOrderCount >= strategyMaxDailyOrdersLimit.value) {
          return {
            passed: false,
            limitId: strategyMaxDailyOrdersLimit.id,
            limitName: strategyMaxDailyOrdersLimit.name,
            limitType: strategyMaxDailyOrdersLimit.type,
            limitValue: strategyMaxDailyOrdersLimit.value,
            actualValue: currentOrderCount,
            action: strategyMaxDailyOrdersLimit.action,
            message: `Strategy ${orderParams.strategyId} has reached maximum daily orders (${strategyMaxDailyOrdersLimit.value})`
          };
        }
      }
    }
    
    // All checks passed
    return {
      passed: true
    };
  }
  
  /**
   * Check risk limits for a position
   * @param position Position to check
   * @returns Risk check result
   */
  private checkPositionRiskLimits(position: Position): RiskCheckResult {
    // Get portfolio
    const portfolio = this.positionTrackingService.getPortfolio();
    
    // 1. Check maximum position percentage
    const maxPositionPercentLimit = this.getRiskLimitByType(RiskLimitType.MAX_POSITION_PERCENT);
    if (maxPositionPercentLimit && maxPositionPercentLimit.isEnabled) {
      const positionPercent = (position.marketValue / portfolio.totalValue) * 100;
      
      if (positionPercent > maxPositionPercentLimit.value) {
        const result = {
          passed: false,
          limitId: maxPositionPercentLimit.id,
          limitName: maxPositionPercentLimit.name,
          limitType: maxPositionPercentLimit.type,
          limitValue: maxPositionPercentLimit.value,
          actualValue: positionPercent,
          action: maxPositionPercentLimit.action,
          message: `Position size (${positionPercent.toFixed(2)}% of portfolio) exceeds maximum (${maxPositionPercentLimit.value}%)`
        };
        
        // Take action based on the risk limit
        this.takeRiskAction(result, position);
        
        return result;
      }
    }
    
    // 2. Check symbol-specific limits
    const symbolMaxPositionSizeLimit = this.getRiskLimitByTypeAndSymbol(
      RiskLimitType.MAX_POSITION_SIZE,
      position.symbol
    );
    
    if (symbolMaxPositionSizeLimit && symbolMaxPositionSizeLimit.isEnabled) {
      if (position.quantity > symbolMaxPositionSizeLimit.value) {
        const result = {
          passed: false,
          limitId: symbolMaxPositionSizeLimit.id,
          limitName: symbolMaxPositionSizeLimit.name,
          limitType: symbolMaxPositionSizeLimit.type,
          limitValue: symbolMaxPositionSizeLimit.value,
          actualValue: position.quantity,
          action: symbolMaxPositionSizeLimit.action,
          message: `Position size (${position.quantity} shares) for ${position.symbol} exceeds maximum (${symbolMaxPositionSizeLimit.value})`
        };
        
        // Take action based on the risk limit
        this.takeRiskAction(result, position);
        
        return result;
      }
    }
    
    // All checks passed
    return {
      passed: true
    };
  }
  
  /**
   * Check global risk limits
   * @param portfolio Portfolio to check
   * @returns Risk check result
   */
  private checkGlobalRiskLimits(portfolio: Portfolio): RiskCheckResult {
    // 1. Check minimum account balance
    const minBalanceLimit = this.getRiskLimitByType(RiskLimitType.MIN_ACCOUNT_BALANCE);
    if (minBalanceLimit && minBalanceLimit.isEnabled) {
      if (portfolio.totalValue < minBalanceLimit.value) {
        const result = {
          passed: false,
          limitId: minBalanceLimit.id,
          limitName: minBalanceLimit.name,
          limitType: minBalanceLimit.type,
          limitValue: minBalanceLimit.value,
          actualValue: portfolio.totalValue,
          action: minBalanceLimit.action,
          message: `Account balance (${portfolio.totalValue}) is below minimum (${minBalanceLimit.value})`
        };
        
        // Take action based on the risk limit
        this.takeRiskAction(result);
        
        return result;
      }
    }
    
    // 2. Check maximum daily loss
    const maxDailyLossPercentLimit = this.getRiskLimitByType(RiskLimitType.MAX_DAILY_LOSS_PERCENT);
    if (maxDailyLossPercentLimit && maxDailyLossPercentLimit.isEnabled) {
      const dailyLossPercent = (this.dailyStats.pnl / this.dailyStats.startingBalance) * 100;
      
      if (dailyLossPercent < -maxDailyLossPercentLimit.value) {
        const result = {
          passed: false,
          limitId: maxDailyLossPercentLimit.id,
          limitName: maxDailyLossPercentLimit.name,
          limitType: maxDailyLossPercentLimit.type,
          limitValue: maxDailyLossPercentLimit.value,
          actualValue: Math.abs(dailyLossPercent),
          action: maxDailyLossPercentLimit.action,
          message: `Daily loss (${dailyLossPercent.toFixed(2)}%) exceeds maximum (${maxDailyLossPercentLimit.value}%)`
        };
        
        // Take action based on the risk limit
        this.takeRiskAction(result);
        
        return result;
      }
    }
    
    // All checks passed
    return {
      passed: true
    };
  }
  
  /**
   * Take action based on a risk limit violation
   * @param result Risk check result
   * @param position Optional position that violated the limit
   */
  private takeRiskAction(result: RiskCheckResult, position?: Position): void {
    if (!result.action) {
      return;
    }
    
    console.log(`Taking risk action: ${result.action} due to: ${result.message}`);
    
    // Emit risk limit violation event
    this.emit('risk_limit_violated', result);
    
    // Take action based on the risk limit
    switch (result.action) {
      case RiskAction.NOTIFY:
        // Just emit the event, no further action
        break;
        
      case RiskAction.CLOSE_POSITION:
        if (position) {
          // Close the position
          this.positionTrackingService.closePosition(position.symbol)
            .then(() => {
              console.log(`Closed position for ${position.symbol} due to risk limit violation`);
            })
            .catch(error => {
              console.error(`Error closing position for ${position.symbol}:`, error);
            });
        }
        break;
        
      case RiskAction.CLOSE_ALL_POSITIONS:
        // Close all positions
        this.positionTrackingService.closeAllPositions()
          .then(() => {
            console.log('Closed all positions due to risk limit violation');
          })
          .catch(error => {
            console.error('Error closing all positions:', error);
          });
        break;
        
      case RiskAction.PAUSE_STRATEGY:
        if (result.limitType === RiskLimitType.MAX_DAILY_ORDERS && result.limitId) {
          // Extract strategy ID from the limit ID
          const strategyId = result.limitId.split('-').pop();
          if (strategyId) {
            // Emit event to pause the strategy
            this.emit('pause_strategy', strategyId);
          }
        }
        break;
        
      case RiskAction.PAUSE_ALL_STRATEGIES:
        // Emit event to pause all strategies
        this.emit('pause_all_strategies');
        break;
        
      // Other actions would be handled by the caller (e.g., BLOCK_ORDER, REDUCE_SIZE)
    }
  }
  
  /**
   * Add a risk limit
   * @param limit Risk limit to add
   */
  public addRiskLimit(limit: RiskLimit): void {
    this.riskLimits.set(limit.id, limit);
  }
  
  /**
   * Update a risk limit
   * @param limitId Risk limit ID
   * @param updates Updates to apply
   * @returns Updated risk limit
   */
  public updateRiskLimit(limitId: string, updates: Partial<RiskLimit>): RiskLimit {
    const limit = this.riskLimits.get(limitId);
    
    if (!limit) {
      throw new Error(`Risk limit ${limitId} not found`);
    }
    
    const updatedLimit = {
      ...limit,
      ...updates
    };
    
    this.riskLimits.set(limitId, updatedLimit);
    
    return updatedLimit;
  }
  
  /**
   * Remove a risk limit
   * @param limitId Risk limit ID
   * @returns True if the limit was removed
   */
  public removeRiskLimit(limitId: string): boolean {
    return this.riskLimits.delete(limitId);
  }
  
  /**
   * Get a risk limit by ID
   * @param limitId Risk limit ID
   * @returns Risk limit or undefined if not found
   */
  public getRiskLimit(limitId: string): RiskLimit | undefined {
    return this.riskLimits.get(limitId);
  }
  
  /**
   * Get all risk limits
   * @returns Array of risk limits
   */
  public getAllRiskLimits(): RiskLimit[] {
    return Array.from(this.riskLimits.values());
  }
  
  /**
   * Get risk limits by type
   * @param type Risk limit type
   * @returns Array of risk limits
   */
  public getRiskLimitsByType(type: RiskLimitType): RiskLimit[] {
    return Array.from(this.riskLimits.values()).filter(limit => limit.type === type);
  }
  
  /**
   * Get a risk limit by type (returns the first one found)
   * @param type Risk limit type
   * @returns Risk limit or undefined if not found
   */
  public getRiskLimitByType(type: RiskLimitType): RiskLimit | undefined {
    return Array.from(this.riskLimits.values()).find(limit => 
      limit.type === type && 
      limit.appliesTo === RiskLimitScope.GLOBAL
    );
  }
  
  /**
   * Get a risk limit by type and symbol
   * @param type Risk limit type
   * @param symbol Symbol
   * @returns Risk limit or undefined if not found
   */
  public getRiskLimitByTypeAndSymbol(type: RiskLimitType, symbol: string): RiskLimit | undefined {
    return Array.from(this.riskLimits.values()).find(limit => 
      limit.type === type && 
      limit.appliesTo === RiskLimitScope.SYMBOL &&
      (!limit.symbols || limit.symbols.includes(symbol))
    );
  }
  
  /**
   * Get a risk limit by type and strategy
   * @param type Risk limit type
   * @param strategyId Strategy ID
   * @returns Risk limit or undefined if not found
   */
  public getRiskLimitByTypeAndStrategy(type: RiskLimitType, strategyId: string): RiskLimit | undefined {
    return Array.from(this.riskLimits.values()).find(limit => 
      limit.type === type && 
      limit.appliesTo === RiskLimitScope.STRATEGY &&
      (!limit.strategyIds || limit.strategyIds.includes(strategyId))
    );
  }
  
  /**
   * Enable a risk limit
   * @param limitId Risk limit ID
   * @returns Updated risk limit
   */
  public enableRiskLimit(limitId: string): RiskLimit {
    return this.updateRiskLimit(limitId, { isEnabled: true });
  }
  
  /**
   * Disable a risk limit
   * @param limitId Risk limit ID
   * @returns Updated risk limit
   */
  public disableRiskLimit(limitId: string): RiskLimit {
    return this.updateRiskLimit(limitId, { isEnabled: false });
  }
  
  /**
   * Get daily statistics
   * @returns Daily statistics
   */
  public getDailyStats(): any {
    return {
      startTime: this.dailyStats.startTime,
      orders: Object.fromEntries(this.dailyStats.orders),
      pnl: this.dailyStats.pnl,
      startingBalance: this.dailyStats.startingBalance,
      currentBalance: this.positionTrackingService.getPortfolio().totalValue,
      pnlPercent: (this.dailyStats.pnl / this.dailyStats.startingBalance) * 100
    };
  }
  
  /**
   * Reset daily statistics
   */
  public resetDailyStats(): void {
    const portfolio = this.positionTrackingService.getPortfolio();
    
    this.dailyStats = {
      startTime: new Date(),
      orders: new Map(),
      pnl: 0,
      startingBalance: portfolio.totalValue
    };
    
    console.log('Daily statistics reset');
  }
  
  /**
   * Shutdown the service
   */
  public shutdown(): void {
    this.removeAllListeners();
    console.log('Risk Management Service shut down');
  }
}

// Export singleton instance
export const riskManagementService = RiskManagementService.getInstance();