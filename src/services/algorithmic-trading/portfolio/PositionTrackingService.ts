import { EventEmitter } from 'events';
import { IExecutionService } from '../execution/IExecutionService';
import { OrderStatus, OrderSide } from '../../../models/algorithmic-trading/OrderTypes';

/**
 * Position interface
 */
export interface Position {
  symbol: string;
  quantity: number;
  side: 'LONG' | 'SHORT' | 'FLAT';
  averageEntryPrice: number;
  marketValue: number;
  costBasis: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  currentPrice: number;
  lastUpdateTime: Date;
  metadata?: Record<string, any>;
}

/**
 * Portfolio interface
 */
export interface Portfolio {
  totalValue: number;
  cashBalance: number;
  positions: Position[];
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  lastUpdateTime: Date;
  metadata?: Record<string, any>;
}

/**
 * Position tracking service
 * 
 * This service tracks positions and portfolio information
 */
export class PositionTrackingService extends EventEmitter {
  private static instance: PositionTrackingService;
  
  private executionService?: IExecutionService;
  private positions: Map<string, Position> = new Map();
  private portfolio: Portfolio = {
    totalValue: 0,
    cashBalance: 0,
    positions: [],
    unrealizedPnl: 0,
    unrealizedPnlPercent: 0,
    lastUpdateTime: new Date(),
    metadata: {}
  };
  private isInitialized: boolean = false;
  private updateInterval?: NodeJS.Timeout;
  private updateFrequencyMs: number = 60000; // 1 minute by default
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    super();
  }
  
  /**
   * Get the singleton instance
   * @returns The singleton instance
   */
  public static getInstance(): PositionTrackingService {
    if (!PositionTrackingService.instance) {
      PositionTrackingService.instance = new PositionTrackingService();
    }
    return PositionTrackingService.instance;
  }
  
  /**
   * Initialize the position tracking service
   * @param executionService Execution service to use
   * @param config Configuration for the service
   */
  public async initialize(executionService: IExecutionService, config: Record<string, any> = {}): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    this.executionService = executionService;
    
    // Set update frequency if provided
    if (config.updateFrequencyMs) {
      this.updateFrequencyMs = config.updateFrequencyMs;
    }
    
    // Initial update
    await this.updatePositionsAndPortfolio();
    
    // Set up event listeners for order updates
    this.setupOrderEventListeners();
    
    // Start periodic updates
    this.startPeriodicUpdates();
    
    this.isInitialized = true;
    console.log('Position Tracking Service initialized');
  }
  
  /**
   * Set up event listeners for order updates
   */
  private setupOrderEventListeners(): void {
    if (!this.executionService) {
      throw new Error('Execution service is not set');
    }
    
    // Listen for order updates
    this.executionService.on('order_updated', async (order: any) => {
      // If the order is filled or partially filled, update positions
      if (order.status === OrderStatus.FILLED || order.status === OrderStatus.PARTIALLY_FILLED) {
        await this.updatePositionsAndPortfolio();
      }
    });
    
    // Listen for order fills
    this.executionService.on('order_filled', async (order: any) => {
      await this.updatePositionsAndPortfolio();
    });
  }
  
  /**
   * Start periodic updates
   */
  private startPeriodicUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    this.updateInterval = setInterval(async () => {
      try {
        await this.updatePositionsAndPortfolio();
      } catch (error) {
        console.error('Error updating positions and portfolio:', error);
      }
    }, this.updateFrequencyMs);
  }
  
  /**
   * Stop periodic updates
   */
  private stopPeriodicUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
  }
  
  /**
   * Update positions and portfolio
   */
  public async updatePositionsAndPortfolio(): Promise<void> {
    if (!this.executionService) {
      throw new Error('Execution service is not set');
    }
    
    try {
      // Get account information
      const account = await this.executionService.getAccount();
      
      // Get positions from the execution service
      const positions = await this.executionService.getPositions();
      
      // Update our positions map
      this.positions.clear();
      for (const position of positions) {
        this.positions.set(position.symbol, {
          symbol: position.symbol,
          quantity: position.quantity,
          side: position.side,
          averageEntryPrice: position.averageEntryPrice,
          marketValue: position.marketValue,
          costBasis: position.costBasis,
          unrealizedPnl: position.unrealizedPnl,
          unrealizedPnlPercent: position.unrealizedPnlPercent,
          currentPrice: position.currentPrice,
          lastUpdateTime: new Date(),
          metadata: position.metadata
        });
      }
      
      // Update portfolio
      this.portfolio = {
        totalValue: parseFloat(account.portfolio_value || '0'),
        cashBalance: parseFloat(account.cash || '0'),
        positions: Array.from(this.positions.values()),
        unrealizedPnl: parseFloat(account.unrealized_pl || '0'),
        unrealizedPnlPercent: parseFloat(account.unrealized_plpc || '0'),
        lastUpdateTime: new Date(),
        metadata: {
          accountId: account.id,
          accountNumber: account.account_number,
          status: account.status,
          currency: account.currency,
          buyingPower: parseFloat(account.buying_power || '0'),
          daytradeCount: parseInt(account.daytrade_count || '0', 10),
          daytradeLimit: parseInt(account.daytrade_count_limit || '0', 10),
          patternDayTrader: account.pattern_day_trader,
          tradeSuspendedByUser: account.trade_suspended_by_user,
          tradingBlocked: account.trading_blocked,
          transfersBlocked: account.transfers_blocked,
          accountBlocked: account.account_blocked,
          equityValue: parseFloat(account.equity || '0'),
          initialMargin: parseFloat(account.initial_margin || '0'),
          maintenanceMargin: parseFloat(account.maintenance_margin || '0'),
          lastEquity: parseFloat(account.last_equity || '0'),
          lastMaintenanceMargin: parseFloat(account.last_maintenance_margin || '0'),
          multiplier: parseFloat(account.multiplier || '1'),
          shorting_enabled: account.shorting_enabled,
          longMarketValue: parseFloat(account.long_market_value || '0'),
          shortMarketValue: parseFloat(account.short_market_value || '0'),
          daytradeRatio: parseFloat(account.daytrade_ratio || '0'),
          regTMarginRequirement: parseFloat(account.regt_margin_requirement || '0'),
          daytradeMarginRequirement: parseFloat(account.daytrading_margin_requirement || '0'),
          sma: parseFloat(account.sma || '0')
        }
      };
      
      // Emit events
      this.emit('positions_updated', Array.from(this.positions.values()));
      this.emit('portfolio_updated', this.portfolio);
      
    } catch (error) {
      console.error('Error updating positions and portfolio:', error);
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Get a position by symbol
   * @param symbol Symbol to get position for
   * @returns Position or undefined if not found
   */
  public getPosition(symbol: string): Position | undefined {
    return this.positions.get(symbol);
  }
  
  /**
   * Get all positions
   * @returns Array of positions
   */
  public getPositions(): Position[] {
    return Array.from(this.positions.values());
  }
  
  /**
   * Get the portfolio
   * @returns Portfolio
   */
  public getPortfolio(): Portfolio {
    return { ...this.portfolio };
  }
  
  /**
   * Calculate the position size for a symbol based on risk parameters
   * @param symbol Symbol to calculate position size for
   * @param riskAmount Amount to risk (in dollars)
   * @param entryPrice Entry price
   * @param stopLossPrice Stop loss price
   * @returns Position size (quantity)
   */
  public calculatePositionSize(
    symbol: string,
    riskAmount: number,
    entryPrice: number,
    stopLossPrice: number
  ): number {
    // Calculate risk per share
    const riskPerShare = Math.abs(entryPrice - stopLossPrice);
    
    if (riskPerShare <= 0) {
      throw new Error('Risk per share must be greater than 0');
    }
    
    // Calculate position size
    const positionSize = riskAmount / riskPerShare;
    
    // Round down to nearest whole share
    return Math.floor(positionSize);
  }
  
  /**
   * Calculate the position size based on portfolio percentage
   * @param portfolioPercentage Percentage of portfolio to allocate (0-100)
   * @param entryPrice Entry price
   * @returns Position size (quantity)
   */
  public calculatePositionSizeByPortfolioPercentage(
    portfolioPercentage: number,
    entryPrice: number
  ): number {
    if (portfolioPercentage <= 0 || portfolioPercentage > 100) {
      throw new Error('Portfolio percentage must be between 0 and 100');
    }
    
    if (entryPrice <= 0) {
      throw new Error('Entry price must be greater than 0');
    }
    
    // Calculate dollar amount to allocate
    const dollarAmount = this.portfolio.totalValue * (portfolioPercentage / 100);
    
    // Calculate position size
    const positionSize = dollarAmount / entryPrice;
    
    // Round down to nearest whole share
    return Math.floor(positionSize);
  }
  
  /**
   * Calculate the position size based on Kelly criterion
   * @param winRate Win rate (0-1)
   * @param winLossRatio Average win / average loss
   * @param portfolioPercentage Maximum percentage of portfolio to allocate (0-100)
   * @param entryPrice Entry price
   * @returns Position size (quantity)
   */
  public calculateKellyPositionSize(
    winRate: number,
    winLossRatio: number,
    portfolioPercentage: number,
    entryPrice: number
  ): number {
    if (winRate <= 0 || winRate > 1) {
      throw new Error('Win rate must be between 0 and 1');
    }
    
    if (winLossRatio <= 0) {
      throw new Error('Win/loss ratio must be greater than 0');
    }
    
    if (portfolioPercentage <= 0 || portfolioPercentage > 100) {
      throw new Error('Portfolio percentage must be between 0 and 100');
    }
    
    if (entryPrice <= 0) {
      throw new Error('Entry price must be greater than 0');
    }
    
    // Calculate Kelly percentage
    const kellyPercentage = winRate - ((1 - winRate) / winLossRatio);
    
    // Apply a fraction of Kelly (half Kelly is common)
    const halfKelly = kellyPercentage * 0.5;
    
    // Limit to the maximum portfolio percentage
    const allocationPercentage = Math.min(halfKelly, portfolioPercentage / 100);
    
    // Calculate dollar amount to allocate
    const dollarAmount = this.portfolio.totalValue * allocationPercentage;
    
    // Calculate position size
    const positionSize = dollarAmount / entryPrice;
    
    // Round down to nearest whole share
    return Math.floor(positionSize);
  }
  
  /**
   * Close a position
   * @param symbol Symbol to close position for
   * @param percentage Percentage of position to close (default: 100%)
   * @returns Result of the close operation
   */
  public async closePosition(symbol: string, percentage: number = 100): Promise<any> {
    if (!this.executionService) {
      throw new Error('Execution service is not set');
    }
    
    const position = this.positions.get(symbol);
    
    if (!position) {
      throw new Error(`No position found for ${symbol}`);
    }
    
    // Close the position through the execution service
    const result = await this.executionService.closePosition(symbol, percentage);
    
    // Update positions and portfolio
    await this.updatePositionsAndPortfolio();
    
    return result;
  }
  
  /**
   * Close all positions
   * @returns Results of the close operations
   */
  public async closeAllPositions(): Promise<any[]> {
    if (!this.executionService) {
      throw new Error('Execution service is not set');
    }
    
    // Close all positions through the execution service
    const results = await this.executionService.closeAllPositions();
    
    // Update positions and portfolio
    await this.updatePositionsAndPortfolio();
    
    return results;
  }
  
  /**
   * Shutdown the service
   */
  public shutdown(): void {
    this.stopPeriodicUpdates();
    this.removeAllListeners();
    console.log('Position Tracking Service shut down');
  }
}

// Export singleton instance
export const positionTrackingService = PositionTrackingService.getInstance();