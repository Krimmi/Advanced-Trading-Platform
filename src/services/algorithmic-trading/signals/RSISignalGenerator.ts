import { Signal, SignalType } from '../../../models/algorithmic-trading/StrategyTypes';
import { BaseSignalGenerator } from './BaseSignalGenerator';
import { MarketData, SignalGeneratorConfig } from './ISignalGenerator';

/**
 * RSI Signal Generator
 * 
 * Generates signals based on Relative Strength Index (RSI) values.
 * - Generates BUY signals when RSI crosses above oversold threshold
 * - Generates SELL signals when RSI crosses below overbought threshold
 */
export class RSISignalGenerator extends BaseSignalGenerator {
  // Historical price data per symbol
  private priceHistory: Map<string, MarketData[]> = new Map();
  
  // RSI values per symbol
  private rsiValues: Map<string, number[]> = new Map();
  
  // Last signal state per symbol
  private lastSignalType: Map<string, SignalType> = new Map();
  
  /**
   * Constructor
   */
  constructor() {
    super(
      'RSI Signal Generator',
      'Generates signals based on Relative Strength Index (RSI) values'
    );
  }
  
  /**
   * Implementation-specific initialization logic
   * @param config Configuration object
   */
  protected async onInitialize(config: SignalGeneratorConfig): Promise<void> {
    // Set default parameters if not provided
    if (!this._parameters.period) {
      this._parameters.period = 14;
    }
    
    if (!this._parameters.overboughtThreshold) {
      this._parameters.overboughtThreshold = 70;
    }
    
    if (!this._parameters.oversoldThreshold) {
      this._parameters.oversoldThreshold = 30;
    }
    
    if (!this._parameters.symbols || !Array.isArray(this._parameters.symbols)) {
      this._parameters.symbols = [];
    }
    
    // Initialize data structures for each symbol
    for (const symbol of this._parameters.symbols) {
      this.priceHistory.set(symbol, []);
      this.rsiValues.set(symbol, []);
      this.lastSignalType.set(symbol, SignalType.HOLD);
    }
    
    // Validate parameters
    this.validateParameters();
  }
  
  /**
   * Validate parameters
   */
  private validateParameters(): void {
    const period = this.getParameterValue<number>('period');
    const overboughtThreshold = this.getParameterValue<number>('overboughtThreshold');
    const oversoldThreshold = this.getParameterValue<number>('oversoldThreshold');
    
    if (period < 2) {
      throw new Error('Period must be at least 2');
    }
    
    if (overboughtThreshold <= oversoldThreshold) {
      throw new Error('Overbought threshold must be greater than oversold threshold');
    }
    
    if (overboughtThreshold > 100 || overboughtThreshold < 50) {
      throw new Error('Overbought threshold must be between 50 and 100');
    }
    
    if (oversoldThreshold < 0 || oversoldThreshold > 50) {
      throw new Error('Oversold threshold must be between 0 and 50');
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
    
    // Keep only necessary history based on period
    const period = this.getParameterValue<number>('period', 14);
    const historyNeeded = period * 3; // Keep 3x the period for safety
    
    if (history.length > historyNeeded) {
      history.splice(0, history.length - historyNeeded);
    }
    
    this.priceHistory.set(symbol, history);
    
    // Calculate RSI if we have enough data
    if (history.length >= period + 1) { // Need at least period+1 data points to calculate first RSI
      this.calculateRSI(symbol);
    }
  }
  
  /**
   * Calculate RSI for a symbol
   * @param symbol Symbol to calculate for
   */
  private calculateRSI(symbol: string): void {
    const history = this.priceHistory.get(symbol) || [];
    const period = this.getParameterValue<number>('period', 14);
    
    if (history.length <= period) {
      return;
    }
    
    // Get closing prices
    const closes = history.map(d => d.close);
    
    // Calculate price changes
    const changes = [];
    for (let i = 1; i < closes.length; i++) {
      changes.push(closes[i] - closes[i - 1]);
    }
    
    // Calculate average gains and losses
    let avgGain = 0;
    let avgLoss = 0;
    
    // First RSI calculation
    for (let i = 0; i < period; i++) {
      if (changes[i] > 0) {
        avgGain += changes[i];
      } else {
        avgLoss += Math.abs(changes[i]);
      }
    }
    
    avgGain /= period;
    avgLoss /= period;
    
    // Calculate RSI using Wilder's smoothing method
    for (let i = period; i < changes.length; i++) {
      const change = changes[i];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;
      
      avgGain = ((avgGain * (period - 1)) + gain) / period;
      avgLoss = ((avgLoss * (period - 1)) + loss) / period;
      
      // Calculate RS and RSI
      const rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss); // Avoid division by zero
      const rsi = 100 - (100 / (1 + rs));
      
      // Store RSI value
      if (i === changes.length - 1) {
        const rsiValues = this.rsiValues.get(symbol) || [];
        this.rsiValues.set(symbol, [...rsiValues, rsi]);
        
        // Keep only recent values
        const values = this.rsiValues.get(symbol) || [];
        if (values.length > 10) { // Keep only 10 recent values
          this.rsiValues.set(symbol, values.slice(-10));
        }
      }
    }
  }
  
  /**
   * Implementation-specific signal generation logic
   * @param context Additional context for signal generation
   * @returns Generated signals
   */
  protected async onGenerateSignals(context?: Record<string, any>): Promise<Signal[]> {
    const signals: Signal[] = [];
    const symbols = this.getParameterValue<string[]>('symbols', []);
    const overboughtThreshold = this.getParameterValue<number>('overboughtThreshold', 70);
    const oversoldThreshold = this.getParameterValue<number>('oversoldThreshold', 30);
    
    for (const symbol of symbols) {
      const rsiValues = this.rsiValues.get(symbol) || [];
      
      // Need at least 2 values to detect crossover
      if (rsiValues.length < 2) {
        continue;
      }
      
      const currentRSI = rsiValues[rsiValues.length - 1];
      const previousRSI = rsiValues[rsiValues.length - 2];
      
      // Detect crossovers
      const lastSignal = this.lastSignalType.get(symbol) || SignalType.HOLD;
      let signalType = SignalType.HOLD;
      let confidence = 0;
      
      // Bullish signal: RSI crosses above oversold threshold
      if (previousRSI <= oversoldThreshold && currentRSI > oversoldThreshold) {
        signalType = SignalType.BUY;
        confidence = Math.min(0.9, (currentRSI - oversoldThreshold) / 10);
      }
      // Bearish signal: RSI crosses below overbought threshold
      else if (previousRSI >= overboughtThreshold && currentRSI < overboughtThreshold) {
        signalType = SignalType.SELL;
        confidence = Math.min(0.9, (overboughtThreshold - currentRSI) / 10);
      }
      // Strong bullish signal: RSI is extremely oversold (below 20)
      else if (currentRSI < 20 && lastSignal !== SignalType.STRONG_BUY) {
        signalType = SignalType.STRONG_BUY;
        confidence = Math.min(0.95, (20 - currentRSI) / 20);
      }
      // Strong bearish signal: RSI is extremely overbought (above 80)
      else if (currentRSI > 80 && lastSignal !== SignalType.STRONG_SELL) {
        signalType = SignalType.STRONG_SELL;
        confidence = Math.min(0.95, (currentRSI - 80) / 20);
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
              rsi: currentRSI,
              period: this.getParameterValue<number>('period', 14),
              overboughtThreshold,
              oversoldThreshold
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
          this.rsiValues.set(symbol, []);
          this.lastSignalType.set(symbol, SignalType.HOLD);
        }
      }
      
      // Remove symbols that are no longer in the list
      for (const symbol of currentSymbols) {
        if (!newSymbols.includes(symbol)) {
          this.priceHistory.delete(symbol);
          this.rsiValues.delete(symbol);
          this.lastSignalType.delete(symbol);
        }
      }
    }
    
    // If period changed, we need to recalculate RSI for all symbols
    if (parameters.period !== undefined) {
      const symbols = this.getParameterValue<string[]>('symbols', []);
      for (const symbol of symbols) {
        this.rsiValues.set(symbol, []);
        if (this.priceHistory.has(symbol)) {
          this.calculateRSI(symbol);
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
      this.rsiValues.set(symbol, []);
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