import { Order } from './TradingServiceFactory';
import { tradingService } from './TradingServiceFactory';
import { ApiError } from '../BaseApiService';

/**
 * Trade execution interface
 */
export interface TradeExecution {
  id: string;
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: string;
  commission: number;
  fee: number;
}

/**
 * Trade performance interface
 */
export interface TradePerformance {
  symbol: string;
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  holdingPeriodDays: number;
}

/**
 * Trading history filter interface
 */
export interface TradingHistoryFilter {
  symbol?: string;
  startDate?: string;
  endDate?: string;
  side?: 'buy' | 'sell';
  minPnl?: number;
  maxPnl?: number;
}

/**
 * Trading statistics interface
 */
export interface TradingStatistics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  totalPnl: number;
  largestWin: number;
  largestLoss: number;
  averageHoldingPeriodDays: number;
}

/**
 * Trading history service for analyzing past trades
 */
export class TradingHistoryService {
  private static instance: TradingHistoryService;

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): TradingHistoryService {
    if (!TradingHistoryService.instance) {
      TradingHistoryService.instance = new TradingHistoryService();
    }
    return TradingHistoryService.instance;
  }

  /**
   * Get trade executions
   * @param filter - Trading history filter
   * @returns Promise with trade executions
   */
  public async getTradeExecutions(filter?: TradingHistoryFilter): Promise<TradeExecution[]> {
    try {
      // In a real implementation, this would fetch from a database or API
      // For now, we'll generate mock data based on completed orders
      
      // Get filled orders
      const orders = await tradingService.getOrders();
      const filledOrders = orders.filter(order => order.status === 'filled');
      
      // Generate executions from orders
      const executions: TradeExecution[] = filledOrders.map(order => {
        // Generate a unique ID for the execution
        const id = `exec-${order.id}`;
        
        // Calculate a realistic price (slightly different from limit price)
        const priceOffset = Math.random() * 0.01 * order.limitPrice! || 0;
        const price = order.limitPrice 
          ? (order.side === 'buy' ? order.limitPrice - priceOffset : order.limitPrice + priceOffset)
          : order.price || 0;
        
        // Calculate commission and fees
        const commission = Math.min(order.quantity * 0.005, 9.95); // $0.005 per share, max $9.95
        const fee = order.quantity * price * 0.0000231; // SEC fee
        
        return {
          id,
          orderId: order.id,
          symbol: order.symbol,
          side: order.side,
          quantity: order.quantity,
          price,
          timestamp: order.updatedAt,
          commission,
          fee
        };
      });
      
      // Apply filters if provided
      let filteredExecutions = executions;
      
      if (filter) {
        if (filter.symbol) {
          filteredExecutions = filteredExecutions.filter(exec => 
            exec.symbol.toUpperCase() === filter.symbol!.toUpperCase()
          );
        }
        
        if (filter.startDate) {
          const startDate = new Date(filter.startDate);
          filteredExecutions = filteredExecutions.filter(exec => 
            new Date(exec.timestamp) >= startDate
          );
        }
        
        if (filter.endDate) {
          const endDate = new Date(filter.endDate);
          filteredExecutions = filteredExecutions.filter(exec => 
            new Date(exec.timestamp) <= endDate
          );
        }
        
        if (filter.side) {
          filteredExecutions = filteredExecutions.filter(exec => 
            exec.side === filter.side
          );
        }
      }
      
      // Sort by timestamp (newest first)
      filteredExecutions.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      return filteredExecutions;
    } catch (error) {
      console.error('Error getting trade executions:', error);
      throw error;
    }
  }

  /**
   * Get trade performance metrics
   * @param filter - Trading history filter
   * @returns Promise with trade performance metrics
   */
  public async getTradePerformance(filter?: TradingHistoryFilter): Promise<TradePerformance[]> {
    try {
      // Get all executions
      const executions = await this.getTradeExecutions(filter);
      
      // Group executions by symbol
      const executionsBySymbol: Record<string, TradeExecution[]> = {};
      
      executions.forEach(exec => {
        if (!executionsBySymbol[exec.symbol]) {
          executionsBySymbol[exec.symbol] = [];
        }
        executionsBySymbol[exec.symbol].push(exec);
      });
      
      // Calculate trade performance for each symbol
      const performances: TradePerformance[] = [];
      
      for (const symbol in executionsBySymbol) {
        const symbolExecutions = executionsBySymbol[symbol];
        
        // Sort by timestamp (oldest first)
        symbolExecutions.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        // Track position for FIFO calculation
        let position = 0;
        let costBasis = 0;
        let entryDate = '';
        
        // Process each execution
        for (let i = 0; i < symbolExecutions.length; i++) {
          const exec = symbolExecutions[i];
          
          if (exec.side === 'buy') {
            // Add to position
            const oldPosition = position;
            const oldCostBasis = costBasis;
            
            position += exec.quantity;
            costBasis = ((oldPosition * oldCostBasis) + (exec.quantity * exec.price)) / position;
            
            if (oldPosition === 0) {
              entryDate = exec.timestamp;
            }
          } else {
            // Close position (partially or fully)
            if (position > 0) {
              const exitQuantity = Math.min(position, exec.quantity);
              const exitDate = exec.timestamp;
              const exitPrice = exec.price;
              
              // Calculate P&L
              const pnl = exitQuantity * (exitPrice - costBasis);
              const pnlPercent = ((exitPrice - costBasis) / costBasis) * 100;
              
              // Calculate holding period
              const entryTime = new Date(entryDate).getTime();
              const exitTime = new Date(exitDate).getTime();
              const holdingPeriodDays = (exitTime - entryTime) / (1000 * 60 * 60 * 24);
              
              // Add performance record
              performances.push({
                symbol,
                entryDate,
                exitDate,
                entryPrice: costBasis,
                exitPrice,
                quantity: exitQuantity,
                pnl,
                pnlPercent,
                holdingPeriodDays
              });
              
              // Update position
              position -= exitQuantity;
              
              // Reset entry date if position is fully closed
              if (position === 0) {
                entryDate = '';
              }
            }
          }
        }
      }
      
      // Apply additional filters if needed
      let filteredPerformances = performances;
      
      if (filter) {
        if (filter.minPnl !== undefined) {
          filteredPerformances = filteredPerformances.filter(perf => 
            perf.pnl >= filter.minPnl!
          );
        }
        
        if (filter.maxPnl !== undefined) {
          filteredPerformances = filteredPerformances.filter(perf => 
            perf.pnl <= filter.maxPnl!
          );
        }
      }
      
      // Sort by exit date (newest first)
      filteredPerformances.sort((a, b) => 
        new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime()
      );
      
      return filteredPerformances;
    } catch (error) {
      console.error('Error getting trade performance:', error);
      throw error;
    }
  }

  /**
   * Get trading statistics
   * @param filter - Trading history filter
   * @returns Promise with trading statistics
   */
  public async getTradingStatistics(filter?: TradingHistoryFilter): Promise<TradingStatistics> {
    try {
      // Get trade performance data
      const performances = await this.getTradePerformance(filter);
      
      // Calculate statistics
      const totalTrades = performances.length;
      const winningTrades = performances.filter(p => p.pnl > 0).length;
      const losingTrades = performances.filter(p => p.pnl < 0).length;
      
      // Calculate win rate
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
      
      // Calculate average win/loss
      const wins = performances.filter(p => p.pnl > 0);
      const losses = performances.filter(p => p.pnl < 0);
      
      const totalWins = wins.reduce((sum, p) => sum + p.pnl, 0);
      const totalLosses = Math.abs(losses.reduce((sum, p) => sum + p.pnl, 0));
      
      const averageWin = wins.length > 0 ? totalWins / wins.length : 0;
      const averageLoss = losses.length > 0 ? totalLosses / losses.length : 0;
      
      // Calculate profit factor
      const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;
      
      // Calculate total P&L
      const totalPnl = performances.reduce((sum, p) => sum + p.pnl, 0);
      
      // Find largest win/loss
      const largestWin = wins.length > 0 ? Math.max(...wins.map(p => p.pnl)) : 0;
      const largestLoss = losses.length > 0 ? Math.min(...losses.map(p => p.pnl)) : 0;
      
      // Calculate average holding period
      const totalHoldingDays = performances.reduce((sum, p) => sum + p.holdingPeriodDays, 0);
      const averageHoldingPeriodDays = totalTrades > 0 ? totalHoldingDays / totalTrades : 0;
      
      return {
        totalTrades,
        winningTrades,
        losingTrades,
        winRate,
        averageWin,
        averageLoss,
        profitFactor,
        totalPnl,
        largestWin,
        largestLoss,
        averageHoldingPeriodDays
      };
    } catch (error) {
      console.error('Error getting trading statistics:', error);
      throw error;
    }
  }

  /**
   * Get trading history by symbol
   * @param symbol - Stock symbol
   * @param limit - Maximum number of trades to return
   * @returns Promise with trade performance for the symbol
   */
  public async getSymbolTradingHistory(symbol: string, limit: number = 10): Promise<TradePerformance[]> {
    try {
      const filter: TradingHistoryFilter = { symbol };
      const performances = await this.getTradePerformance(filter);
      
      // Apply limit
      return performances.slice(0, limit);
    } catch (error) {
      console.error(`Error getting trading history for ${symbol}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const tradingHistoryService = TradingHistoryService.getInstance();