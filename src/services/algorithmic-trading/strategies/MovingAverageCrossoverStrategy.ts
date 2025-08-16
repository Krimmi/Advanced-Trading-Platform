import { 
  TimeFrame, 
  StrategyState, 
  Signal, 
  SignalType, 
  StrategyParameter,
  StrategyTrade
} from '../../../models/algorithmic-trading/StrategyTypes';
import { BaseStrategy } from './BaseStrategy';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface for market data expected by the strategy
 */
interface MarketData {
  symbol: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Moving Average Crossover Strategy
 * 
 * This strategy generates buy signals when a fast moving average crosses above
 * a slow moving average, and sell signals when the fast moving average crosses
 * below the slow moving average.
 */
export class MovingAverageCrossoverStrategy extends BaseStrategy {
  // Historical price data
  private priceHistory: Map<string, MarketData[]> = new Map();
  
  // Moving average values
  private fastMA: Map<string, number[]> = new Map();
  private slowMA: Map<string, number[]> = new Map();
  
  // Last signal state
  private lastSignalType: Map<string, SignalType> = new Map();
  
  /**
   * Constructor
   */
  constructor() {
    super(
      'Moving Average Crossover',
      'A strategy that generates signals based on moving average crossovers',
      '1.0.0',
      'NinjaTech AI',
      [TimeFrame.ONE_MINUTE, TimeFrame.FIVE_MINUTES, TimeFrame.FIFTEEN_MINUTES, TimeFrame.ONE_HOUR, TimeFrame.ONE_DAY],
      [] // Will be populated during initialization
    );
    
    // Define strategy parameters
    this._parameters = [
      {
        name: 'fastPeriod',
        value: 10,
        type: 'number',
        min: 2,
        max: 200,
        description: 'Period for the fast moving average',
        isRequired: true
      },
      {
        name: 'slowPeriod',
        value: 30,
        type: 'number',
        min: 5,
        max: 500,
        description: 'Period for the slow moving average',
        isRequired: true
      },
      {
        name: 'symbols',
        value: ['AAPL', 'MSFT', 'GOOGL'],
        type: 'array',
        description: 'Symbols to trade',
        isRequired: true
      },
      {
        name: 'positionSize',
        value: 0.1,
        type: 'number',
        min: 0.01,
        max: 1.0,
        description: 'Position size as a fraction of available capital',
        isRequired: true
      },
      {
        name: 'stopLossPercent',
        value: 0.02,
        type: 'number',
        min: 0.001,
        max: 0.1,
        description: 'Stop loss percentage',
        isRequired: true
      },
      {
        name: 'takeProfitPercent',
        value: 0.04,
        type: 'number',
        min: 0.001,
        max: 0.2,
        description: 'Take profit percentage',
        isRequired: true
      }
    ];
  }
  
  /**
   * Implementation-specific initialization logic
   * @param config Configuration object
   */
  protected async onInitialize(config: Record<string, any>): Promise<void> {
    // Set supported assets from configuration
    const symbols = this.getParameterValue<string[]>('symbols');
    this.supportedAssets.push(...symbols);
    
    // Initialize data structures for each symbol
    for (const symbol of symbols) {
      this.priceHistory.set(symbol, []);
      this.fastMA.set(symbol, []);
      this.slowMA.set(symbol, []);
      this.lastSignalType.set(symbol, SignalType.HOLD);
    }
  }
  
  /**
   * Implementation-specific start logic
   */
  protected async onStart(): Promise<void> {
    // Nothing specific needed for start
  }
  
  /**
   * Implementation-specific pause logic
   */
  protected async onPause(): Promise<void> {
    // Nothing specific needed for pause
  }
  
  /**
   * Implementation-specific stop logic
   */
  protected async onStop(): Promise<void> {
    // Close any open trades when stopping
    const openTrades = this._tradeHistory.filter(t => t.status === 'OPEN');
    for (const trade of openTrades) {
      // In a real implementation, this would interact with an execution service
      // to actually close the positions
      this.updateTrade(trade.id, {
        status: 'CLOSED',
        exitTime: new Date(),
        exitPrice: 0, // Would be actual market price
        exitSignalType: SignalType.HOLD,
        pnl: 0, // Would calculate actual P&L
        pnlPercentage: 0
      });
    }
  }
  
  /**
   * Implementation-specific data processing logic
   * @param data Market data to process
   */
  protected async processData(data: MarketData): Promise<void> {
    const { symbol } = data;
    
    // Skip if symbol is not in our trading list
    if (!this.supportedAssets.includes(symbol)) {
      return;
    }
    
    // Add data to price history
    const history = this.priceHistory.get(symbol) || [];
    history.push(data);
    
    // Keep only necessary history based on slow period
    const slowPeriod = this.getParameterValue<number>('slowPeriod');
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
   * Implementation-specific bar processing logic
   * @param symbol Symbol the bar is for
   * @param bar Bar data
   */
  protected override processBar(symbol: string, bar: any): void {
    // Skip if symbol is not in our trading list
    if (!this.supportedAssets.includes(symbol)) {
      return;
    }
    
    // Convert bar data to our MarketData format
    const marketData: MarketData = {
      symbol,
      timestamp: new Date(bar.timestamp),
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
      volume: bar.volume
    };
    
    // Add data to price history
    const history = this.priceHistory.get(symbol) || [];
    history.push(marketData);
    
    // Keep only necessary history based on slow period
    const slowPeriod = this.getParameterValue<number>('slowPeriod');
    const historyNeeded = slowPeriod * 2; // Keep twice the slow period for safety
    
    if (history.length > historyNeeded) {
      history.splice(0, history.length - historyNeeded);
    }
    
    this.priceHistory.set(symbol, history);
    
    // Calculate moving averages if we have enough data
    if (history.length >= slowPeriod) {
      this.calculateMovingAverages(symbol);
      
      // Generate signals after new bar data
      this.calculateSignals().then(signals => {
        if (signals.length > 0) {
          console.log(`Generated ${signals.length} signals from real-time bar data`);
        }
      }).catch(error => {
        console.error('Error generating signals:', error);
      });
    }
  }
  
  /**
   * Implementation-specific quote processing logic
   * @param symbol Symbol the quote is for
   * @param quote Quote data
   */
  protected override processQuote(symbol: string, quote: any): void {
    // For this strategy, we don't use quotes for signal generation
    // But we could track them for execution purposes
    
    // Example: Track the latest quote for each symbol
    // This could be used for more accurate entry/exit prices
    if (this.supportedAssets.includes(symbol)) {
      // In a real implementation, we might store this in a quotes map
      // and use it for execution decisions
    }
  }
  
  /**
   * Implementation-specific trade processing logic
   * @param symbol Symbol the trade is for
   * @param trade Trade data
   */
  protected override processTrade(symbol: string, trade: any): void {
    // For this strategy, we don't use individual trades for signal generation
    // But we could use them for volume analysis or other purposes
  }
  
  /**
   * Implementation-specific order update processing logic
   * @param orderId Order ID
   * @param status Order status
   * @param data Order data
   */
  protected override processOrderUpdate(orderId: string, status: string, data: any): void {
    // Update our trade records based on order updates
    const tradeIndex = this._tradeHistory.findIndex(t => t.metadata?.orderId === orderId);
    
    if (tradeIndex >= 0) {
      const trade = this._tradeHistory[tradeIndex];
      
      switch (status) {
        case 'FILLED':
          // Update trade with fill information
          this.updateTrade(trade.id, {
            entryPrice: data.fillPrice || trade.entryPrice,
            quantity: data.fillQuantity || trade.quantity,
            metadata: {
              ...trade.metadata,
              fillTime: new Date(),
              commission: data.commission || 0
            }
          });
          break;
          
        case 'CANCELED':
          // Remove the trade if it was canceled before filling
          if (trade.status === 'OPEN' && !trade.entryPrice) {
            // This was a pending order that got canceled
            this.updateTrade(trade.id, {
              status: 'CANCELED',
              metadata: {
                ...trade.metadata,
                cancelReason: data.reason || 'Unknown'
              }
            });
          }
          break;
          
        case 'REJECTED':
          // Mark the trade as rejected
          this.updateTrade(trade.id, {
            status: 'REJECTED',
            metadata: {
              ...trade.metadata,
              rejectReason: data.reason || 'Unknown'
            }
          });
          break;
      }
    }
  }
  
  /**
   * Implementation-specific position update processing logic
   * @param symbol Symbol
   * @param position Position data
   */
  protected override processPositionUpdate(symbol: string, position: any): void {
    // Update our trade records based on position updates
    // This is useful for tracking P&L and risk metrics
    
    // Find open trades for this symbol
    const openTrades = this._tradeHistory.filter(
      t => t.symbol === symbol && t.status === 'OPEN'
    );
    
    for (const trade of openTrades) {
      // Update the trade with current position information
      this.updateTrade(trade.id, {
        metadata: {
          ...trade.metadata,
          currentPrice: position.marketPrice || trade.entryPrice,
          unrealizedPnl: position.unrealizedPnl || 0,
          unrealizedPnlPercent: position.unrealizedPnlPercent || 0
        }
      });
    }
  }
  
  /**
   * Calculate moving averages for a symbol
   * @param symbol Symbol to calculate for
   */
  private calculateMovingAverages(symbol: string): void {
    const history = this.priceHistory.get(symbol) || [];
    const fastPeriod = this.getParameterValue<number>('fastPeriod');
    const slowPeriod = this.getParameterValue<number>('slowPeriod');
    
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
   * @returns Generated trading signals
   */
  protected async calculateSignals(): Promise<Signal[]> {
    const signals: Signal[] = [];
    
    for (const symbol of this.supportedAssets) {
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
              slowMA: currentSlow
            }
          });
          
          // Update last signal type
          this.lastSignalType.set(symbol, signalType);
          
          // Process the signal (in a real implementation, this would be done by an execution service)
          this.processSignal(signalType, symbol, latestPrice);
        }
      }
    }
    
    return signals;
  }
  
  /**
   * Process a generated signal
   * @param signalType Type of signal
   * @param symbol Symbol
   * @param data Latest market data
   */
  private processSignal(signalType: SignalType, symbol: string, data: MarketData): void {
    // In a real implementation, this would interact with position sizing and execution services
    
    // For demonstration, we'll just record trades
    if (signalType === SignalType.BUY) {
      // Check if we already have an open position
      const openTrade = this._tradeHistory.find(
        t => t.symbol === symbol && t.status === 'OPEN'
      );
      
      if (!openTrade) {
        // Create a new trade
        const positionSize = this.getParameterValue<number>('positionSize');
        const stopLossPercent = this.getParameterValue<number>('stopLossPercent');
        const takeProfitPercent = this.getParameterValue<number>('takeProfitPercent');
        
        const quantity = 100; // In a real implementation, this would be calculated based on available capital
        
        const trade: StrategyTrade = {
          id: uuidv4(),
          symbol,
          direction: 'LONG',
          entryPrice: data.close,
          entryTime: new Date(),
          entrySignalType: signalType,
          quantity,
          status: 'OPEN',
          metadata: {
            stopLossPrice: data.close * (1 - stopLossPercent),
            takeProfitPrice: data.close * (1 + takeProfitPercent),
            positionSizePercent: positionSize
          }
        };
        
        this.recordTrade(trade);
      }
    } else if (signalType === SignalType.SELL) {
      // Find any open positions for this symbol
      const openTrade = this._tradeHistory.find(
        t => t.symbol === symbol && t.status === 'OPEN'
      );
      
      if (openTrade) {
        // Close the trade
        const pnl = (data.close - openTrade.entryPrice) * openTrade.quantity;
        const pnlPercentage = (data.close - openTrade.entryPrice) / openTrade.entryPrice;
        
        this.updateTrade(openTrade.id, {
          exitPrice: data.close,
          exitTime: new Date(),
          exitSignalType: signalType,
          pnl,
          pnlPercentage,
          status: 'CLOSED'
        });
      }
    }
  }
  
  /**
   * Implementation-specific parameter update logic
   * @param parameters Updated parameters
   */
  protected async onParametersUpdated(parameters: Record<string, any>): Promise<void> {
    // Handle symbols update
    if (parameters.symbols) {
      const newSymbols = parameters.symbols as string[];
      
      // Add new symbols
      for (const symbol of newSymbols) {
        if (!this.supportedAssets.includes(symbol)) {
          this.supportedAssets.push(symbol);
          this.priceHistory.set(symbol, []);
          this.fastMA.set(symbol, []);
          this.slowMA.set(symbol, []);
          this.lastSignalType.set(symbol, SignalType.HOLD);
        }
      }
      
      // Remove symbols that are no longer in the list
      for (const symbol of [...this.supportedAssets]) {
        if (!newSymbols.includes(symbol)) {
          const index = this.supportedAssets.indexOf(symbol);
          if (index >= 0) {
            this.supportedAssets.splice(index, 1);
          }
          
          this.priceHistory.delete(symbol);
          this.fastMA.delete(symbol);
          this.slowMA.delete(symbol);
          this.lastSignalType.delete(symbol);
        }
      }
    }
  }
  
  /**
   * Implementation-specific validation logic
   * @returns Array of validation errors
   */
  protected validateStrategy(): string[] {
    const errors: string[] = [];
    
    const fastPeriod = this.getParameterValue<number>('fastPeriod');
    const slowPeriod = this.getParameterValue<number>('slowPeriod');
    const symbols = this.getParameterValue<string[]>('symbols');
    
    if (fastPeriod >= slowPeriod) {
      errors.push('Fast period must be smaller than slow period');
    }
    
    if (!symbols || symbols.length === 0) {
      errors.push('At least one symbol must be specified');
    }
    
    return errors;
  }
  
  /**
   * Implementation-specific reset logic
   */
  protected async onReset(): Promise<void> {
    // Clear all data structures
    for (const symbol of this.supportedAssets) {
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
      // No additional custom configuration for this strategy
    };
  }
  
  /**
   * Implementation-specific configuration import logic
   * @param config Configuration to import
   */
  protected async onConfigImported(config: Record<string, any>): Promise<void> {
    // Nothing specific needed for this strategy
  }
  
  /**
   * Helper to get parameter value with type safety
   * @param name Parameter name
   * @returns Parameter value with correct type
   */
  private getParameterValue<T>(name: string): T {
    const param = this._parameters.find(p => p.name === name);
    return param?.value as T;
  }
}