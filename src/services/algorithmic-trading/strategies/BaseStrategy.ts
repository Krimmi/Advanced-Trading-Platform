import { v4 as uuidv4 } from 'uuid';
import { 
  TimeFrame, 
  StrategyState, 
  Signal, 
  StrategyParameter, 
  StrategyPerformance, 
  StrategyTrade 
} from '../../../models/algorithmic-trading/StrategyTypes';
import { IStrategy } from './IStrategy';

/**
 * Abstract base class for trading strategies providing common functionality
 */
export abstract class BaseStrategy implements IStrategy {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly author: string;
  readonly supportedTimeframes: TimeFrame[];
  readonly supportedAssets: string[];
  
  protected _state: StrategyState = StrategyState.INITIALIZED;
  protected _parameters: StrategyParameter<any>[] = [];
  protected _performance: StrategyPerformance = {
    totalReturn: 0,
    annualizedReturn: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    winRate: 0,
    profitFactor: 0,
    averageWin: 0,
    averageLoss: 0,
    expectancy: 0,
    tradesPerDay: 0,
    metadata: {}
  };
  protected _tradeHistory: StrategyTrade[] = [];
  protected _lastUpdate: Date = new Date();
  protected _logger: any; // Will be replaced with proper logger interface
  protected _isInitialized: boolean = false;
  
  /**
   * Constructor for BaseStrategy
   * @param name Strategy name
   * @param description Strategy description
   * @param version Strategy version
   * @param author Strategy author
   * @param supportedTimeframes Timeframes supported by this strategy
   * @param supportedAssets Assets supported by this strategy
   */
  constructor(
    name: string,
    description: string,
    version: string,
    author: string,
    supportedTimeframes: TimeFrame[],
    supportedAssets: string[]
  ) {
    this.id = uuidv4();
    this.name = name;
    this.description = description;
    this.version = version;
    this.author = author;
    this.supportedTimeframes = supportedTimeframes;
    this.supportedAssets = supportedAssets;
  }
  
  /**
   * Get the current state of the strategy
   */
  get state(): StrategyState {
    return this._state;
  }
  
  /**
   * Get the current parameters of the strategy
   */
  get parameters(): StrategyParameter<any>[] {
    return [...this._parameters];
  }
  
  /**
   * Get the performance metrics of the strategy
   */
  get performance(): StrategyPerformance {
    return { ...this._performance };
  }
  
  /**
   * Get the trade history of the strategy
   */
  get tradeHistory(): StrategyTrade[] {
    return [...this._tradeHistory];
  }
  
  /**
   * Initialize the strategy with configuration parameters
   * @param config Configuration object for the strategy
   */
  async initialize(config: Record<string, any>): Promise<void> {
    if (this._isInitialized) {
      throw new Error('Strategy is already initialized');
    }
    
    try {
      // Validate required parameters
      const validationResult = this.validate();
      if (!validationResult.isValid) {
        throw new Error(`Strategy validation failed: ${validationResult.errors.join(', ')}`);
      }
      
      // Apply configuration
      await this.applyConfiguration(config);
      
      this._isInitialized = true;
      this._state = StrategyState.INITIALIZED;
      this._lastUpdate = new Date();
      
      // Call implementation-specific initialization
      await this.onInitialize(config);
    } catch (error) {
      this._state = StrategyState.ERROR;
      throw error;
    }
  }
  
  /**
   * Start the strategy execution
   */
  async start(): Promise<void> {
    if (!this._isInitialized) {
      throw new Error('Strategy must be initialized before starting');
    }
    
    if (this._state === StrategyState.RUNNING) {
      return; // Already running
    }
    
    try {
      this._state = StrategyState.RUNNING;
      this._lastUpdate = new Date();
      
      // Call implementation-specific start logic
      await this.onStart();
    } catch (error) {
      this._state = StrategyState.ERROR;
      throw error;
    }
  }
  
  /**
   * Pause the strategy execution
   */
  async pause(): Promise<void> {
    if (this._state !== StrategyState.RUNNING) {
      return; // Not running
    }
    
    try {
      this._state = StrategyState.PAUSED;
      this._lastUpdate = new Date();
      
      // Call implementation-specific pause logic
      await this.onPause();
    } catch (error) {
      this._state = StrategyState.ERROR;
      throw error;
    }
  }
  
  /**
   * Stop the strategy execution
   */
  async stop(): Promise<void> {
    if (this._state === StrategyState.STOPPED) {
      return; // Already stopped
    }
    
    try {
      this._state = StrategyState.STOPPED;
      this._lastUpdate = new Date();
      
      // Call implementation-specific stop logic
      await this.onStop();
    } catch (error) {
      this._state = StrategyState.ERROR;
      throw error;
    }
  }
  
  /**
   * Process new market data and potentially generate signals
   * @param data Market data to process
   */
  async onData(data: any): Promise<void> {
    if (this._state !== StrategyState.RUNNING) {
      return; // Not running, ignore data
    }
    
    try {
      // Call implementation-specific data processing
      await this.processData(data);
      this._lastUpdate = new Date();
    } catch (error) {
      this._state = StrategyState.ERROR;
      throw error;
    }
  }
  
  /**
   * Handle real-time quote data
   * @param symbol Symbol the quote is for
   * @param quote Quote data
   */
  onQuote(symbol: string, quote: any): void {
    if (this._state !== StrategyState.RUNNING) {
      return; // Not running, ignore data
    }
    
    try {
      // Call implementation-specific quote handling
      this.processQuote(symbol, quote);
      this._lastUpdate = new Date();
    } catch (error) {
      console.error(`Error processing quote for ${symbol}:`, error);
      // Don't change state to ERROR for individual quote processing errors
    }
  }
  
  /**
   * Handle real-time trade data
   * @param symbol Symbol the trade is for
   * @param trade Trade data
   */
  onTrade(symbol: string, trade: any): void {
    if (this._state !== StrategyState.RUNNING) {
      return; // Not running, ignore data
    }
    
    try {
      // Call implementation-specific trade handling
      this.processTrade(symbol, trade);
      this._lastUpdate = new Date();
    } catch (error) {
      console.error(`Error processing trade for ${symbol}:`, error);
      // Don't change state to ERROR for individual trade processing errors
    }
  }
  
  /**
   * Handle real-time bar/candle data
   * @param symbol Symbol the bar is for
   * @param bar Bar data
   */
  onBar(symbol: string, bar: any): void {
    if (this._state !== StrategyState.RUNNING) {
      return; // Not running, ignore data
    }
    
    try {
      // Call implementation-specific bar handling
      this.processBar(symbol, bar);
      this._lastUpdate = new Date();
    } catch (error) {
      console.error(`Error processing bar for ${symbol}:`, error);
      // Don't change state to ERROR for individual bar processing errors
    }
  }
  
  /**
   * Handle any market data
   * @param symbol Symbol the data is for
   * @param dataType Type of data
   * @param data Market data
   */
  onMarketData(symbol: string, dataType: string, data: any): void {
    if (this._state !== StrategyState.RUNNING) {
      return; // Not running, ignore data
    }
    
    try {
      // Call implementation-specific market data handling
      this.processMarketData(symbol, dataType, data);
      this._lastUpdate = new Date();
    } catch (error) {
      console.error(`Error processing ${dataType} data for ${symbol}:`, error);
      // Don't change state to ERROR for individual market data processing errors
    }
  }
  
  /**
   * Handle order updates
   * @param orderId Order ID
   * @param status Order status
   * @param data Order data
   */
  onOrderUpdate(orderId: string, status: string, data: any): void {
    try {
      // Call implementation-specific order update handling
      this.processOrderUpdate(orderId, status, data);
      this._lastUpdate = new Date();
    } catch (error) {
      console.error(`Error processing order update for ${orderId}:`, error);
      // Don't change state to ERROR for individual order update errors
    }
  }
  
  /**
   * Handle position updates
   * @param symbol Symbol
   * @param position Position data
   */
  onPositionUpdate(symbol: string, position: any): void {
    try {
      // Call implementation-specific position update handling
      this.processPositionUpdate(symbol, position);
      this._lastUpdate = new Date();
    } catch (error) {
      console.error(`Error processing position update for ${symbol}:`, error);
      // Don't change state to ERROR for individual position update errors
    }
  }
  
  /**
   * Generate trading signals based on current state and market data
   * @returns Generated trading signals
   */
  async generateSignals(): Promise<Signal[]> {
    if (this._state !== StrategyState.RUNNING) {
      return []; // Not running, no signals
    }
    
    try {
      // Call implementation-specific signal generation
      const signals = await this.calculateSignals();
      this._lastUpdate = new Date();
      return signals;
    } catch (error) {
      this._state = StrategyState.ERROR;
      throw error;
    }
  }
  
  /**
   * Update strategy parameters
   * @param parameters Parameters to update
   */
  async updateParameters(parameters: Record<string, any>): Promise<void> {
    try {
      // Update parameters
      for (const [key, value] of Object.entries(parameters)) {
        const paramIndex = this._parameters.findIndex(p => p.name === key);
        if (paramIndex >= 0) {
          this._parameters[paramIndex] = {
            ...this._parameters[paramIndex],
            value
          };
        }
      }
      
      this._lastUpdate = new Date();
      
      // Call implementation-specific parameter update logic
      await this.onParametersUpdated(parameters);
    } catch (error) {
      this._state = StrategyState.ERROR;
      throw error;
    }
  }
  
  /**
   * Get the current state of the strategy
   * @returns Current state information
   */
  getState(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      state: this._state,
      lastUpdate: this._lastUpdate,
      isInitialized: this._isInitialized,
      performance: this._performance,
      parameters: this._parameters,
      tradeCount: this._tradeHistory.length,
      openTrades: this._tradeHistory.filter(t => t.status === 'OPEN').length
    };
  }
  
  /**
   * Validate if the strategy is properly configured
   * @returns Validation result with potential errors
   */
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check required parameters
    const requiredParams = this._parameters.filter(p => p.isRequired);
    for (const param of requiredParams) {
      if (param.value === undefined || param.value === null) {
        errors.push(`Required parameter '${param.name}' is not set`);
      }
    }
    
    // Call implementation-specific validation
    const customErrors = this.validateStrategy();
    errors.push(...customErrors);
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Reset the strategy to its initial state
   */
  async reset(): Promise<void> {
    try {
      // Reset state
      this._state = StrategyState.INITIALIZED;
      this._tradeHistory = [];
      this._performance = {
        totalReturn: 0,
        annualizedReturn: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        winRate: 0,
        profitFactor: 0,
        averageWin: 0,
        averageLoss: 0,
        expectancy: 0,
        tradesPerDay: 0,
        metadata: {}
      };
      this._lastUpdate = new Date();
      
      // Call implementation-specific reset logic
      await this.onReset();
    } catch (error) {
      this._state = StrategyState.ERROR;
      throw error;
    }
  }
  
  /**
   * Export strategy configuration for persistence
   * @returns Serializable configuration
   */
  exportConfig(): Record<string, any> {
    const config: Record<string, any> = {
      id: this.id,
      name: this.name,
      description: this.description,
      version: this.version,
      author: this.author,
      supportedTimeframes: this.supportedTimeframes,
      supportedAssets: this.supportedAssets,
      parameters: this._parameters.map(p => ({
        name: p.name,
        value: p.value,
        type: p.type
      }))
    };
    
    // Add implementation-specific configuration
    const customConfig = this.getCustomConfig();
    return { ...config, ...customConfig };
  }
  
  /**
   * Import strategy configuration
   * @param config Configuration to import
   */
  async importConfig(config: Record<string, any>): Promise<void> {
    try {
      // Update parameters
      if (config.parameters) {
        for (const param of config.parameters) {
          const paramIndex = this._parameters.findIndex(p => p.name === param.name);
          if (paramIndex >= 0) {
            this._parameters[paramIndex] = {
              ...this._parameters[paramIndex],
              value: param.value
            };
          }
        }
      }
      
      // Call implementation-specific import logic
      await this.onConfigImported(config);
      
      this._lastUpdate = new Date();
    } catch (error) {
      this._state = StrategyState.ERROR;
      throw error;
    }
  }
  
  /**
   * Record a new trade in the strategy's trade history
   * @param trade Trade to record
   */
  protected recordTrade(trade: StrategyTrade): void {
    this._tradeHistory.push(trade);
    this.updatePerformanceMetrics();
  }
  
  /**
   * Update a trade in the strategy's trade history
   * @param tradeId ID of the trade to update
   * @param updates Updates to apply to the trade
   */
  protected updateTrade(tradeId: string, updates: Partial<StrategyTrade>): void {
    const tradeIndex = this._tradeHistory.findIndex(t => t.id === tradeId);
    if (tradeIndex >= 0) {
      this._tradeHistory[tradeIndex] = {
        ...this._tradeHistory[tradeIndex],
        ...updates
      };
      this.updatePerformanceMetrics();
    }
  }
  
  /**
   * Update performance metrics based on trade history
   */
  protected updatePerformanceMetrics(): void {
    const closedTrades = this._tradeHistory.filter(t => t.status === 'CLOSED');
    if (closedTrades.length === 0) {
      return;
    }
    
    // Calculate basic metrics
    const profitableTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
    const lossTrades = closedTrades.filter(t => (t.pnl || 0) <= 0);
    
    const totalPnl = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const totalProfit = profitableTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const totalLoss = Math.abs(lossTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0));
    
    const winRate = profitableTrades.length / closedTrades.length;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
    
    const averageWin = profitableTrades.length > 0 
      ? totalProfit / profitableTrades.length 
      : 0;
      
    const averageLoss = lossTrades.length > 0 
      ? totalLoss / lossTrades.length 
      : 0;
      
    const expectancy = (winRate * averageWin) - ((1 - winRate) * averageLoss);
    
    // Calculate drawdown
    let maxDrawdown = 0;
    let peak = 0;
    let runningPnl = 0;
    
    for (const trade of closedTrades) {
      runningPnl += (trade.pnl || 0);
      if (runningPnl > peak) {
        peak = runningPnl;
      }
      const drawdown = peak - runningPnl;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    // Calculate trades per day
    const firstTradeDate = new Date(Math.min(...closedTrades.map(t => t.entryTime.getTime())));
    const lastTradeDate = new Date(Math.max(...closedTrades.map(t => t.exitTime?.getTime() || t.entryTime.getTime())));
    const tradingDays = Math.max(1, (lastTradeDate.getTime() - firstTradeDate.getTime()) / (1000 * 60 * 60 * 24));
    const tradesPerDay = closedTrades.length / tradingDays;
    
    // Update performance object
    this._performance = {
      totalReturn: totalPnl,
      annualizedReturn: 0, // Requires more complex calculation
      sharpeRatio: 0, // Requires more complex calculation
      maxDrawdown,
      winRate,
      profitFactor,
      averageWin,
      averageLoss,
      expectancy,
      tradesPerDay,
      metadata: {
        totalTrades: closedTrades.length,
        profitableTrades: profitableTrades.length,
        lossTrades: lossTrades.length
      }
    };
  }
  
  /**
   * Apply configuration to the strategy
   * @param config Configuration to apply
   */
  protected async applyConfiguration(config: Record<string, any>): Promise<void> {
    // Update parameters from config
    if (config.parameters) {
      for (const [key, value] of Object.entries(config.parameters)) {
        const paramIndex = this._parameters.findIndex(p => p.name === key);
        if (paramIndex >= 0) {
          this._parameters[paramIndex] = {
            ...this._parameters[paramIndex],
            value
          };
        }
      }
    }
  }
  
  // Abstract methods to be implemented by concrete strategies
  
  /**
   * Implementation-specific initialization logic
   * @param config Configuration object
   */
  protected abstract onInitialize(config: Record<string, any>): Promise<void>;
  
  /**
   * Implementation-specific start logic
   */
  protected abstract onStart(): Promise<void>;
  
  /**
   * Implementation-specific pause logic
   */
  protected abstract onPause(): Promise<void>;
  
  /**
   * Implementation-specific stop logic
   */
  protected abstract onStop(): Promise<void>;
  
  /**
   * Implementation-specific data processing logic
   * @param data Market data to process
   */
  protected abstract processData(data: any): Promise<void>;
  
  /**
   * Implementation-specific quote processing logic
   * @param symbol Symbol the quote is for
   * @param quote Quote data
   */
  protected processQuote(symbol: string, quote: any): void {
    // Default implementation - can be overridden by concrete strategies
    this.processMarketData(symbol, 'quote', quote);
  }
  
  /**
   * Implementation-specific trade processing logic
   * @param symbol Symbol the trade is for
   * @param trade Trade data
   */
  protected processTrade(symbol: string, trade: any): void {
    // Default implementation - can be overridden by concrete strategies
    this.processMarketData(symbol, 'trade', trade);
  }
  
  /**
   * Implementation-specific bar processing logic
   * @param symbol Symbol the bar is for
   * @param bar Bar data
   */
  protected processBar(symbol: string, bar: any): void {
    // Default implementation - can be overridden by concrete strategies
    this.processMarketData(symbol, 'bar', bar);
  }
  
  /**
   * Implementation-specific market data processing logic
   * @param symbol Symbol the data is for
   * @param dataType Type of data
   * @param data Market data
   */
  protected processMarketData(symbol: string, dataType: string, data: any): void {
    // Default implementation - should be overridden by concrete strategies
    // This is a no-op by default
  }
  
  /**
   * Implementation-specific order update processing logic
   * @param orderId Order ID
   * @param status Order status
   * @param data Order data
   */
  protected processOrderUpdate(orderId: string, status: string, data: any): void {
    // Default implementation - should be overridden by concrete strategies
    // This is a no-op by default
  }
  
  /**
   * Implementation-specific position update processing logic
   * @param symbol Symbol
   * @param position Position data
   */
  protected processPositionUpdate(symbol: string, position: any): void {
    // Default implementation - should be overridden by concrete strategies
    // This is a no-op by default
  }
  
  /**
   * Implementation-specific signal generation logic
   * @returns Generated trading signals
   */
  protected abstract calculateSignals(): Promise<Signal[]>;
  
  /**
   * Implementation-specific parameter update logic
   * @param parameters Updated parameters
   */
  protected abstract onParametersUpdated(parameters: Record<string, any>): Promise<void>;
  
  /**
   * Implementation-specific validation logic
   * @returns Array of validation errors
   */
  protected abstract validateStrategy(): string[];
  
  /**
   * Implementation-specific reset logic
   */
  protected abstract onReset(): Promise<void>;
  
  /**
   * Implementation-specific configuration export
   * @returns Custom configuration
   */
  protected abstract getCustomConfig(): Record<string, any>;
  
  /**
   * Implementation-specific configuration import logic
   * @param config Configuration to import
   */
  protected abstract onConfigImported(config: Record<string, any>): Promise<void>;
}