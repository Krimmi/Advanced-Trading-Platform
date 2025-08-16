import { 
  TimeFrame, 
  StrategyState, 
  Signal, 
  StrategyParameter, 
  StrategyPerformance, 
  StrategyTrade 
} from '../../../models/algorithmic-trading/StrategyTypes';

/**
 * Interface defining the contract for all trading strategies
 */
export interface IStrategy {
  /**
   * Unique identifier for the strategy
   */
  readonly id: string;
  
  /**
   * Human-readable name of the strategy
   */
  readonly name: string;
  
  /**
   * Detailed description of the strategy
   */
  readonly description: string;
  
  /**
   * Version of the strategy implementation
   */
  readonly version: string;
  
  /**
   * Author of the strategy
   */
  readonly author: string;
  
  /**
   * Timeframes this strategy is designed to work with
   */
  readonly supportedTimeframes: TimeFrame[];
  
  /**
   * Current state of the strategy
   */
  readonly state: StrategyState;
  
  /**
   * List of assets/symbols this strategy can trade
   */
  readonly supportedAssets: string[];
  
  /**
   * Current parameters of the strategy
   */
  readonly parameters: StrategyParameter<any>[];
  
  /**
   * Performance metrics of the strategy
   */
  readonly performance: StrategyPerformance;
  
  /**
   * History of trades executed by this strategy
   */
  readonly tradeHistory: StrategyTrade[];
  
  /**
   * Initialize the strategy with configuration parameters
   * @param config Configuration object for the strategy
   */
  initialize(config: Record<string, any>): Promise<void>;
  
  /**
   * Start the strategy execution
   */
  start(): Promise<void>;
  
  /**
   * Pause the strategy execution
   */
  pause(): Promise<void>;
  
  /**
   * Stop the strategy execution
   */
  stop(): Promise<void>;
  
  /**
   * Process new market data and potentially generate signals
   * @param data Market data to process
   */
  onData(data: any): Promise<void>;
  
  /**
   * Handle real-time quote data
   * @param symbol Symbol the quote is for
   * @param quote Quote data
   */
  onQuote?(symbol: string, quote: any): void;
  
  /**
   * Handle real-time trade data
   * @param symbol Symbol the trade is for
   * @param trade Trade data
   */
  onTrade?(symbol: string, trade: any): void;
  
  /**
   * Handle real-time bar/candle data
   * @param symbol Symbol the bar is for
   * @param bar Bar data
   */
  onBar?(symbol: string, bar: any): void;
  
  /**
   * Handle any market data
   * @param symbol Symbol the data is for
   * @param dataType Type of data
   * @param data Market data
   */
  onMarketData?(symbol: string, dataType: string, data: any): void;
  
  /**
   * Handle order updates
   * @param orderId Order ID
   * @param status Order status
   * @param data Order data
   */
  onOrderUpdate?(orderId: string, status: string, data: any): void;
  
  /**
   * Handle position updates
   * @param symbol Symbol
   * @param position Position data
   */
  onPositionUpdate?(symbol: string, position: any): void;
  
  /**
   * Generate trading signals based on current state and market data
   * @returns Generated trading signals
   */
  generateSignals(): Promise<Signal[]>;
  
  /**
   * Update strategy parameters
   * @param parameters Parameters to update
   */
  updateParameters(parameters: Record<string, any>): Promise<void>;
  
  /**
   * Get the current state of the strategy
   * @returns Current state information
   */
  getState(): Record<string, any>;
  
  /**
   * Validate if the strategy is properly configured
   * @returns Validation result with potential errors
   */
  validate(): { isValid: boolean; errors: string[] };
  
  /**
   * Reset the strategy to its initial state
   */
  reset(): Promise<void>;
  
  /**
   * Export strategy configuration for persistence
   * @returns Serializable configuration
   */
  exportConfig(): Record<string, any>;
  
  /**
   * Import strategy configuration
   * @param config Configuration to import
   */
  importConfig(config: Record<string, any>): Promise<void>;
}