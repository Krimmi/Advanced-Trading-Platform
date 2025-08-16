import { v4 as uuidv4 } from 'uuid';
import { Signal } from '../../../models/algorithmic-trading/StrategyTypes';
import { ISignalGenerator, MarketData, SignalGeneratorConfig } from './ISignalGenerator';

/**
 * Base class for signal generators providing common functionality
 */
export abstract class BaseSignalGenerator implements ISignalGenerator {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  
  protected _parameters: Record<string, any> = {};
  protected _isInitialized: boolean = false;
  protected _lastUpdate: Date = new Date();
  
  /**
   * Constructor for BaseSignalGenerator
   * @param name Signal generator name
   * @param description Signal generator description
   */
  constructor(name: string, description: string) {
    this.id = uuidv4();
    this.name = name;
    this.description = description;
  }
  
  /**
   * Initialize the signal generator with configuration
   * @param config Configuration for the signal generator
   */
  async initialize(config: SignalGeneratorConfig): Promise<void> {
    if (this._isInitialized) {
      throw new Error('Signal generator is already initialized');
    }
    
    try {
      // Set parameters from config
      if (config.parameters) {
        this._parameters = { ...config.parameters };
      }
      
      // Call implementation-specific initialization
      await this.onInitialize(config);
      
      this._isInitialized = true;
      this._lastUpdate = new Date();
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Process new market data and update internal state
   * @param data Market data to process
   */
  async processData(data: MarketData): Promise<void> {
    if (!this._isInitialized) {
      throw new Error('Signal generator must be initialized before processing data');
    }
    
    try {
      // Call implementation-specific data processing
      await this.onProcessData(data);
      this._lastUpdate = new Date();
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Generate signals based on current state
   * @param context Additional context for signal generation
   * @returns Generated signals
   */
  async generateSignals(context?: Record<string, any>): Promise<Signal[]> {
    if (!this._isInitialized) {
      throw new Error('Signal generator must be initialized before generating signals');
    }
    
    try {
      // Call implementation-specific signal generation
      const signals = await this.onGenerateSignals(context);
      this._lastUpdate = new Date();
      return signals;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Update signal generator parameters
   * @param parameters Parameters to update
   */
  async updateParameters(parameters: Record<string, any>): Promise<void> {
    try {
      // Update parameters
      this._parameters = { ...this._parameters, ...parameters };
      
      // Call implementation-specific parameter update logic
      await this.onParametersUpdated(parameters);
      
      this._lastUpdate = new Date();
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Reset the signal generator to its initial state
   */
  async reset(): Promise<void> {
    try {
      // Call implementation-specific reset logic
      await this.onReset();
      
      this._lastUpdate = new Date();
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get the current state of the signal generator
   * @returns Current state
   */
  getState(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      isInitialized: this._isInitialized,
      lastUpdate: this._lastUpdate,
      parameters: { ...this._parameters }
    };
  }
  
  /**
   * Export configuration for persistence
   * @returns Serializable configuration
   */
  exportConfig(): SignalGeneratorConfig {
    const config: SignalGeneratorConfig = {
      id: this.id,
      name: this.name,
      parameters: { ...this._parameters }
    };
    
    // Add implementation-specific configuration
    const customConfig = this.getCustomConfig();
    return { ...config, ...customConfig };
  }
  
  /**
   * Get parameter value with type safety
   * @param name Parameter name
   * @param defaultValue Default value if parameter is not found
   * @returns Parameter value with correct type
   */
  protected getParameterValue<T>(name: string, defaultValue?: T): T {
    return (this._parameters[name] !== undefined) ? this._parameters[name] as T : defaultValue as T;
  }
  
  // Abstract methods to be implemented by concrete signal generators
  
  /**
   * Implementation-specific initialization logic
   * @param config Configuration object
   */
  protected abstract onInitialize(config: SignalGeneratorConfig): Promise<void>;
  
  /**
   * Implementation-specific data processing logic
   * @param data Market data to process
   */
  protected abstract onProcessData(data: MarketData): Promise<void>;
  
  /**
   * Implementation-specific signal generation logic
   * @param context Additional context for signal generation
   * @returns Generated signals
   */
  protected abstract onGenerateSignals(context?: Record<string, any>): Promise<Signal[]>;
  
  /**
   * Implementation-specific parameter update logic
   * @param parameters Updated parameters
   */
  protected abstract onParametersUpdated(parameters: Record<string, any>): Promise<void>;
  
  /**
   * Implementation-specific reset logic
   */
  protected abstract onReset(): Promise<void>;
  
  /**
   * Implementation-specific configuration export
   * @returns Custom configuration
   */
  protected abstract getCustomConfig(): Record<string, any>;
}