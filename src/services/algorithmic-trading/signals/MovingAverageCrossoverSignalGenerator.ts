import { Signal, SignalType } from '../../../models/algorithmic-trading/StrategyTypes';
import { BaseSignalGenerator } from './BaseSignalGenerator';
import { MarketData, SignalGeneratorConfig } from './ISignalGenerator';

/**
 * Moving Average Crossover Signal Generator
 * 
 * Generates signals based on crossovers between fast and slow moving averages.
 */
export class MovingAverageCrossoverSignalGenerator extends BaseSignalGenerator {
  // Historical price data per symbol
  private priceHistory: Map<string, MarketData[]> = new Map();
  
  // Moving average values per symbol
  private fastMA: Map<string, number[]> = new Map();
  private slowMA: Map<string, number[]> = new Map();
  
  // Last signal state per symbol
  private lastSignalType: Map<string, SignalType> = new Map();
  
  /**
   * Constructor
   */
  constructor() {
    super(
      'Moving Average Crossover Signal Generator',
      'Generates signals based on crossovers between fast and slow moving averages'
    );
  }
  
  /**
   * Implementation-specific initialization logic
   * @param config Configuration object
   */
  protected async onInitialize(config: SignalGeneratorConfig): Promise<void> {
    // Set default parameters if not provided
    if (!this._parameters.fastPeriod) {
      this._parameters.fastPeriod = 10;
    }
    
    if (!this._parameters.slowPeriod) {
      this._parameters.slowPeriod = 30;
    }
    
    if (!this._parameters.symbols || !Array.isArray(this._parameters.symbols)) {
      this._parameters.symbols = [];
    }
    
    // Initialize data structures for each symbol
    for (const symbol of this._parameters.symbols) {
      this.priceHistory.set(symbol, []);
      this.fastMA.set(symbol, []);
      this.slowMA.set(symbol, []);
      this.lastSignalType.set(symbol, SignalType.HOLD);
    }
    
    // Validate parameters
    this.validateParameters();
  }
  
  /**
   * Validate parameters
   */
  private validateParameters(): void {
    const fastPeriod = this.getParameterValue<number>('fastPeriod');
    const slowPeriod = this.getParameterValue<number>('slowPeriod');
    
    if (fastPeriod >= slowPeriod) {
      throw new Error('Fast period must be smaller than slow period');
    }
    
    if (fastPeriod < 2) {
      throw new Error('Fast period must be at least 2');
    }
    
    if (slowPeriod < 3) {
      throw new Error('Slow period must be at least 3');
    }
  }
  
  /**
   * Implementation-specific data processing logic
   * @param data Market data to process
   */
  protected async onProcessData(data: MarketData): Promise<void> {
    const { symbol } = data;
    const symbols = this.getParameterValue<string[]>('symbols', []);
    
    // Skip if symbol is not in our list
    if (!symbols.includes(symbol)) {
      return;
    }
    
    // Add data to price history
    const history = this.priceHistory.get(symbol) || [];
    history.push(data);
    
    // Keep only necessary history based on slow period
    const slowPeriod = this.getParameterValue<number>('slowPeriod', 30);
    const historyNeeded = slowPeriod * 2; // Keep twice the slow period for safety
    
    if (history.length > historyNeeded) {
      history.splice(0, history.length - historyNeeded);
    }
    
    this.priceHistory.set(symbol, history);
    
    // Calculate moving averages if we have enough data
    if (history.length >= slowPeriod) {
      this.calculateMovingAverages(symbol);
    }
  }
  
  /**
   * Calculate moving averages for a symbol
   * @param symbol Symbol to calculate for
   */
  private calculateMovingAverages(symbol: string): void {
    const history = this.priceHistory.get(symbol) || [];
    const fastPeriod = this.getParameterValue<number>('fastPeriod', 10);
    const slowPeriod = this.getParameterValue<number>('slowPeriod', 30);
    
    // Calculate fast MA
    if (history.length >= fastPeriod) {
      const fastMA = this.calculateSMA(
        history.slice(-fastPeriod).map(d => d.close),
        fastPeriod
      );
      this.fastMA.set(symbol, [...(this.fastMA.get(symbol) || []), fastMA]);
      
      // Keep only recent values
      const fastValues = this.fastMA.get(symbol) || [];
      if (fastValues.length > 10) { // Keep only 10 recent values
        this.fastMA.set(symbol, fastValues.slice(-10));
      }
    }
    
    // Calculate slow MA
    if (history.length >= slowPeriod) {
      const slowMA = this.calculateSMA(
        history.slice(-slowPeriod).map(d => d.close),
        slowPeriod
      );
      this.slowMA.set(symbol, [...(this.slowMA.get(symbol) || []), slowMA]);
      
      // Keep only recent values
      const slowValues = this.slowMA.get(symbol) || [];
      if (slowValues.length > 10) { // Keep only 10 recent values
        this.slowMA.set(symbol, slowValues.slice(-10));
      }
    }
  }
  
  /**
   * Calculate Simple Moving Average
   * @param prices Array of prices
   * @param period Period for the moving average
   * @returns The SMA value
   */
  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) {
      return 0;
    }
    
    const sum = prices.reduce((total, price) => total + price, 0);
    return sum / period;
  }
  
  /**
   * Implementation-specific signal generation logic
   * @param context Additional context for signal generation
   * @returns Generated signals
   */
  protected async onGenerateSignals(context?: Record<string, any>): Promise<Signal[]> {
    const signals: Signal[] = [];
    const symbols = this.getParameterValue<string[]>('symbols', []);
    
    for (const symbol of symbols) {
      const fastValues = this.fastMA.get(symbol) || [];
      const slowValues = this.slowMA.get(symbol) || [];
      
      // Need at least 2 values of each MA to detect crossover
      if (fastValues.length < 2 || slowValues.length < 2) {
        continue;
      }
      
      const currentFast = fastValues[fastValues.length - 1];
      const previousFast = fastValues[fastValues.length - 2];
      const currentSlow = slowValues[slowValues.length - 1];
      const previousSlow = slowValues[slowValues.length - 2];
      
      // Detect crossover
      const lastSignal = this.lastSignalType.get(symbol) || SignalType.HOLD;
      let signalType = SignalType.HOLD;
      let confidence = 0;
      
      // Bullish crossover (fast crosses above slow)
      if (previousFast <= previousSlow && currentFast > currentSlow) {
        signalType = SignalType.BUY;
        confidence = Math.min(0.9, (currentFast - currentSlow) / currentSlow);
      }
      // Bearish crossover (fast crosses below slow)
      else if (previousFast >= previousSlow && currentFast < currentSlow) {
        signalType = SignalType.SELL;
        confidence = Math.min(0.9, (currentSlow - currentFast) / currentSlow);
      }
      
      // Only generate a signal if it's different from the last one
      if (signalType !== SignalType.HOLD && signalType !== lastSignal) {
        const history = this.priceHistory.get(symbol) || [];
        const latestPrice = history.length > 0 ? history[history.length - 1] : null;
        
        if (latestPrice) {
          signals.push({
            type: signalType,
            symbol,
            timestamp: new Date(),
            confidence,
            metadata: {
              price: latestPrice.close,
              fastMA: currentFast,
              slowMA: currentSlow,
              fastPeriod: this.getParameterValue<number>('fastPeriod', 10),
              slowPeriod: this.getParameterValue<number>('slowPeriod', 30)
            }
          });
          
          // Update last signal type
          this.lastSignalType.set(symbol, signalType);
        }
      }
    }
    
    return signals;
  }
  
  /**
   * Implementation-specific parameter update logic
   * @param parameters Updated parameters
   */
  protected async onParametersUpdated(parameters: Record<string, any>): Promise<void> {
    // Handle symbols update
    if (parameters.symbols && Array.isArray(parameters.symbols)) {
      const newSymbols = parameters.symbols as string[];
      const currentSymbols = this.getParameterValue<string[]>('symbols', []);
      
      // Add new symbols
      for (const symbol of newSymbols) {
        if (!currentSymbols.includes(symbol)) {
          this.priceHistory.set(symbol, []);
          this.fastMA.set(symbol, []);
          this.slowMA.set(symbol, []);
          this.lastSignalType.set(symbol, SignalType.HOLD);
        }
      }
      
      // Remove symbols that are no longer in the list
      for (const symbol of currentSymbols) {
        if (!newSymbols.includes(symbol)) {
          this.priceHistory.delete(symbol);
          this.fastMA.delete(symbol);
          this.slowMA.delete(symbol);
          this.lastSignalType.delete(symbol);
        }
      }
    }
    
    // Validate parameters after update
    this.validateParameters();
  }
  
  /**
   * Implementation-specific reset logic
   */
  protected async onReset(): Promise<void> {
    const symbols = this.getParameterValue<string[]>('symbols', []);
    
    // Clear all data structures
    for (const symbol of symbols) {
      this.priceHistory.set(symbol, []);
      this.fastMA.set(symbol, []);
      this.slowMA.set(symbol, []);
      this.lastSignalType.set(symbol, SignalType.HOLD);
    }
  }
  
  /**
   * Implementation-specific configuration export
   * @returns Custom configuration
   */
  protected getCustomConfig(): Record<string, any> {
    return {
      // No additional custom configuration for this signal generator
    };
  }
}