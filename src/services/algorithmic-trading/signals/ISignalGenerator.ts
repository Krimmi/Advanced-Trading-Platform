import { Signal } from '../../../models/algorithmic-trading/StrategyTypes';

/**
 * Interface for market data expected by signal generators
 */
export interface MarketData {
  symbol: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  [key: string]: any; // Allow for additional fields
}

/**
 * Interface for signal generator configuration
 */
export interface SignalGeneratorConfig {
  id: string;
  name: string;
  parameters: Record<string, any>;
  [key: string]: any; // Allow for additional fields
}

/**
 * Interface for signal generators
 */
export interface ISignalGenerator {
  /**
   * Unique identifier for the signal generator
   */
  readonly id: string;
  
  /**
   * Human-readable name of the signal generator
   */
  readonly name: string;
  
  /**
   * Description of the signal generator
   */
  readonly description: string;
  
  /**
   * Initialize the signal generator with configuration
   * @param config Configuration for the signal generator
   */
  initialize(config: SignalGeneratorConfig): Promise<void>;
  
  /**
   * Process new market data and update internal state
   * @param data Market data to process
   */
  processData(data: MarketData): Promise<void>;
  
  /**
   * Generate signals based on current state
   * @param context Additional context for signal generation
   * @returns Generated signals
   */
  generateSignals(context?: Record<string, any>): Promise<Signal[]>;
  
  /**
   * Update signal generator parameters
   * @param parameters Parameters to update
   */
  updateParameters(parameters: Record<string, any>): Promise<void>;
  
  /**
   * Reset the signal generator to its initial state
   */
  reset(): Promise<void>;
  
  /**
   * Get the current state of the signal generator
   * @returns Current state
   */
  getState(): Record<string, any>;
  
  /**
   * Export configuration for persistence
   * @returns Serializable configuration
   */
  exportConfig(): SignalGeneratorConfig;
}