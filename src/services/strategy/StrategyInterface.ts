/**
 * Strategy Interface for Trading Strategies
 * 
 * This interface defines the contract that all trading strategies must implement.
 * It provides methods for strategy initialization, execution, and performance tracking.
 */

import { MarketData } from '../../types/MarketData';
import { Position } from '../../types/Position';
import { Order } from '../../types/Order';
import { StrategyParams } from '../../types/StrategyParams';
import { StrategyPerformance } from '../../types/StrategyPerformance';

export interface StrategyInterface {
  /**
   * Unique identifier for the strategy
   */
  id: string;
  
  /**
   * Human-readable name of the strategy
   */
  name: string;
  
  /**
   * Description of the strategy's approach and methodology
   */
  description: string;
  
  /**
   * Strategy parameters that can be configured
   */
  params: StrategyParams;
  
  /**
   * Initialize the strategy with configuration parameters
   * @param params Strategy configuration parameters
   */
  initialize(params: StrategyParams): void;
  
  /**
   * Process new market data and generate trading signals
   * @param marketData Latest market data
   * @param positions Current portfolio positions
   * @returns Trading orders to be executed, if any
   */
  processData(marketData: MarketData, positions: Position[]): Order[] | null;
  
  /**
   * Evaluate the strategy's performance
   * @param startDate Beginning of evaluation period
   * @param endDate End of evaluation period
   * @returns Performance metrics
   */
  evaluatePerformance(startDate: Date, endDate: Date): Promise<StrategyPerformance>;
  
  /**
   * Run strategy backtest on historical data
   * @param startDate Beginning of backtest period
   * @param endDate End of backtest period
   * @param initialCapital Starting capital for backtest
   * @returns Backtest results including performance metrics
   */
  runBacktest(startDate: Date, endDate: Date, initialCapital: number): Promise<StrategyPerformance>;
  
  /**
   * Get strategy status information
   * @returns Current status of the strategy
   */
  getStatus(): {
    isActive: boolean;
    lastUpdated: Date;
    currentPositions: number;
    currentSignals: string[];
  };
}