import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { HistoricalDataService, HistoricalBarParams } from './HistoricalDataService';
import { IStrategy } from '../algorithmic-trading/strategies/IStrategy';
import { Signal, SignalType } from '../../models/algorithmic-trading/StrategyTypes';
import { OrderParams, OrderSide, OrderType, OrderStatus, TimeInForce } from '../../models/algorithmic-trading/OrderTypes';
import { Bar } from '../market-data/IMarketDataProvider';

/**
 * Backtesting configuration
 */
export interface BacktestConfig {
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  symbols: string[];
  timeframe: string;
  slippage?: number; // in percentage
  commission?: number; // in percentage
  dataSource?: 'alpaca' | 'polygon' | 'iex' | 'csv';
  includeAfterHours?: boolean;
  enableShortSelling?: boolean;
  maxOpenPositions?: number;
  maxPositionSize?: number; // in percentage of capital
  maxDrawdown?: number; // in percentage
  stopLoss?: number; // in percentage
  takeProfit?: number; // in percentage
}

/**
 * Backtesting position
 */
export interface BacktestPosition {
  symbol: string;
  quantity: number;
  entryPrice: number;
  entryDate: Date;
  currentPrice: number;
  lastUpdateDate: Date;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  marketValue: number;
  side: 'LONG' | 'SHORT';
  trades: BacktestTrade[];
}

/**
 * Backtesting trade
 */
export interface BacktestTrade {
  id: string;
  symbol: string;
  side: OrderSide;
  quantity: number;
  price: number;
  date: Date;
  commission: number;
  slippage: number;
  pnl?: number;
  pnlPercent?: number;
  exitPrice?: number;
  exitDate?: Date;
  holdingPeriod?: number; // in days
  status: 'OPEN' | 'CLOSED';
  signalType?: SignalType;
  signalConfidence?: number;
  metadata?: Record<string, any>;
}

/**
 * Backtesting order
 */
export interface BacktestOrder {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price?: number;
  stopPrice?: number;
  limitPrice?: number;
  timeInForce: TimeInForce;
  status: OrderStatus;
  filledQuantity: number;
  filledPrice?: number;
  filledDate?: Date;
  createdDate: Date;
  updatedDate: Date;
  expirationDate?: Date;
  signalId?: string;
  metadata?: Record<string, any>;
}

/**
 * Backtesting result
 */
export interface BacktestResult {
  id: string;
  strategyId: string;
  strategyName: string;
  startDate: Date;
  endDate: Date;
  duration: number; // in days
  initialCapital: number;
  finalCapital: number;
  totalReturn: number;
  totalReturnPercent: number;
  annualizedReturn: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  trades: BacktestTrade[];
  winRate: number;
  lossRate: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
  expectancy: number;
  averageHoldingPeriod: number;
  equityCurve: { date: Date; equity: number }[];
  drawdownCurve: { date: Date; drawdown: number; drawdownPercent: number }[];
  monthlyReturns: { year: number; month: number; return: number }[];
  symbols: string[];
  timeframe: string;
  config: BacktestConfig;
  metadata?: Record<string, any>;
}

/**
 * Backtesting engine
 * 
 * This engine simulates trading with historical data
 */
export class BacktestingEngine extends EventEmitter {
  private historicalDataService: HistoricalDataService;
  private strategy?: IStrategy;
  private config: BacktestConfig;
  private isRunning: boolean = false;
  private isCancelled: boolean = false;
  private historicalData: Map<string, Bar[]> = new Map();
  private currentDate: Date;
  private currentIndex: number = 0;
  private cash: number;
  private positions: Map<string, BacktestPosition> = new Map();
  private trades: BacktestTrade[] = [];
  private orders: BacktestOrder[] = [];
  private equityCurve: { date: Date; equity: number }[] = [];
  private drawdownCurve: { date: Date; drawdown: number; drawdownPercent: number }[] = [];
  private highWaterMark: number;
  private result?: BacktestResult;
  
  /**
   * Constructor
   * @param config Backtesting configuration
   */
  constructor(config: BacktestConfig) {
    super();
    this.historicalDataService = HistoricalDataService.getInstance();
    this.config = {
      slippage: 0.05, // 0.05% slippage by default
      commission: 0.001, // 0.1% commission by default
      dataSource: 'alpaca',
      includeAfterHours: false,
      enableShortSelling: true,
      maxOpenPositions: 10,
      maxPositionSize: 20, // 20% of capital
      maxDrawdown: 25, // 25% max drawdown
      ...config
    };
    this.currentDate = new Date(config.startDate);
    this.cash = config.initialCapital;
    this.highWaterMark = config.initialCapital;
  }
  
  /**
   * Initialize the backtesting engine
   */
  public async initialize(): Promise<void> {
    // Initialize the historical data service
    await this.historicalDataService.initialize({
      dataSource: this.config.dataSource
    });
    
    // Load historical data for all symbols
    await this.loadHistoricalData();
    
    console.log('Backtesting engine initialized');
  }
  
  /**
   * Load historical data for all symbols
   */
  private async loadHistoricalData(): Promise<void> {
    const loadPromises: Promise<void>[] = [];
    
    for (const symbol of this.config.symbols) {
      loadPromises.push(this.loadHistoricalDataForSymbol(symbol));
    }
    
    await Promise.all(loadPromises);
    
    console.log(`Loaded historical data for ${this.config.symbols.length} symbols`);
  }
  
  /**
   * Load historical data for a symbol
   * @param symbol Symbol to load data for
   */
  private async loadHistoricalDataForSymbol(symbol: string): Promise<void> {
    try {
      const params: HistoricalBarParams = {
        symbol,
        timeframe: this.config.timeframe,
        start: this.config.startDate,
        end: this.config.endDate,
        adjustment: 'all' // Apply all adjustments
      };
      
      const bars = await this.historicalDataService.getBars(params);
      
      if (bars.length === 0) {
        console.warn(`No historical data found for ${symbol}`);
        return;
      }
      
      // Filter out after-hours data if not included
      const filteredBars = this.config.includeAfterHours
        ? bars
        : bars.filter(bar => this.isMarketHours(bar.timestamp));
      
      this.historicalData.set(symbol, filteredBars);
      
      console.log(`Loaded ${filteredBars.length} bars for ${symbol}`);
    } catch (error) {
      console.error(`Error loading historical data for ${symbol}:`, error);
      throw error;
    }
  }
  
  /**
   * Check if a timestamp is during market hours
   * @param timestamp Timestamp to check
   * @returns True if during market hours
   */
  private isMarketHours(timestamp: Date): boolean {
    const hours = timestamp.getUTCHours();
    const minutes = timestamp.getUTCMinutes();
    const dayOfWeek = timestamp.getUTCDay();
    
    // Check if it's a weekday
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }
    
    // Check if it's during market hours (9:30 AM - 4:00 PM ET)
    // Convert to UTC (ET+4 or ET+5 depending on daylight saving)
    // This is a simplification - in reality, you'd need to account for DST
    const marketOpen = 13 * 60 + 30; // 9:30 AM ET in minutes (UTC+4)
    const marketClose = 20 * 60; // 4:00 PM ET in minutes (UTC+4)
    const currentMinutes = hours * 60 + minutes;
    
    return currentMinutes >= marketOpen && currentMinutes <= marketClose;
  }
  
  /**
   * Set the strategy to backtest
   * @param strategy Strategy to backtest
   */
  public setStrategy(strategy: IStrategy): void {
    this.strategy = strategy;
  }
  
  /**
   * Run the backtest
   * @returns Backtest result
   */
  public async run(): Promise<BacktestResult> {
    if (!this.strategy) {
      throw new Error('Strategy not set');
    }
    
    if (this.isRunning) {
      throw new Error('Backtest is already running');
    }
    
    this.isRunning = true;
    this.isCancelled = false;
    
    try {
      // Initialize the strategy
      await this.strategy.initialize({});
      
      // Start the strategy
      await this.strategy.start();
      
      // Process each day in the date range
      while (this.currentDate <= this.config.endDate && !this.isCancelled) {
        await this.processDay();
        
        // Move to the next day
        this.currentDate.setDate(this.currentDate.getDate() + 1);
        
        // Emit progress event
        const progress = this.calculateProgress();
        this.emit('progress', progress);
      }
      
      // Calculate final results
      this.result = this.calculateResults();
      
      // Stop the strategy
      await this.strategy.stop();
      
      this.isRunning = false;
      
      return this.result;
    } catch (error) {
      this.isRunning = false;
      console.error('Error running backtest:', error);
      throw error;
    }
  }
  
  /**
   * Process a single day
   */
  private async processDay(): Promise<void> {
    // Skip weekends
    const dayOfWeek = this.currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return;
    }
    
    // Get bars for this day for all symbols
    const dayBars = this.getDayBars();
    
    if (dayBars.length === 0) {
      return; // No data for this day
    }
    
    // Sort bars by timestamp
    dayBars.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Process each bar
    for (const bar of dayBars) {
      // Update current price for positions
      this.updatePositions(bar);
      
      // Process pending orders
      this.processOrders(bar);
      
      // Process the bar with the strategy
      if (this.strategy) {
        // Call the strategy's onBar method
        this.strategy.onBar(bar.symbol, bar);
        
        // Generate signals
        const signals = await this.strategy.generateSignals();
        
        // Process signals
        for (const signal of signals) {
          this.processSignal(signal, bar);
        }
      }
      
      // Update equity curve
      this.updateEquityCurve(bar.timestamp);
    }
  }
  
  /**
   * Get all bars for the current day
   * @returns Array of bars for the current day
   */
  private getDayBars(): Bar[] {
    const dayBars: Bar[] = [];
    
    for (const [symbol, bars] of this.historicalData.entries()) {
      // Filter bars for the current day
      const symbolDayBars = bars.filter(bar => {
        const barDate = new Date(bar.timestamp);
        return (
          barDate.getFullYear() === this.currentDate.getFullYear() &&
          barDate.getMonth() === this.currentDate.getMonth() &&
          barDate.getDate() === this.currentDate.getDate()
        );
      });
      
      dayBars.push(...symbolDayBars);
    }
    
    return dayBars;
  }
  
  /**
   * Update positions with the latest price
   * @param bar Current bar
   */
  private updatePositions(bar: Bar): void {
    const position = this.positions.get(bar.symbol);
    
    if (position) {
      // Update position with current price
      position.currentPrice = bar.close;
      position.lastUpdateDate = bar.timestamp;
      
      // Calculate unrealized P&L
      if (position.side === 'LONG') {
        position.unrealizedPnl = (position.currentPrice - position.entryPrice) * position.quantity;
      } else {
        position.unrealizedPnl = (position.entryPrice - position.currentPrice) * position.quantity;
      }
      
      position.unrealizedPnlPercent = (position.unrealizedPnl / (position.entryPrice * position.quantity)) * 100;
      position.marketValue = position.currentPrice * position.quantity;
      
      // Update the position
      this.positions.set(bar.symbol, position);
    }
  }
  
  /**
   * Process pending orders
   * @param bar Current bar
   */
  private processOrders(bar: Bar): void {
    // Get pending orders for this symbol
    const pendingOrders = this.orders.filter(
      order => order.symbol === bar.symbol && order.status === OrderStatus.PENDING
    );
    
    for (const order of pendingOrders) {
      // Check if the order can be filled
      let canFill = false;
      let fillPrice = bar.close;
      
      switch (order.type) {
        case OrderType.MARKET:
          // Market orders are filled immediately at the current price
          canFill = true;
          fillPrice = bar.close;
          break;
          
        case OrderType.LIMIT:
          // Limit orders are filled if the price is better than the limit price
          if (order.side === OrderSide.BUY) {
            canFill = bar.low <= (order.limitPrice || 0);
            fillPrice = Math.min(bar.open, order.limitPrice || 0);
          } else {
            canFill = bar.high >= (order.limitPrice || 0);
            fillPrice = Math.max(bar.open, order.limitPrice || 0);
          }
          break;
          
        case OrderType.STOP:
          // Stop orders are filled if the price crosses the stop price
          if (order.side === OrderSide.BUY) {
            canFill = bar.high >= (order.stopPrice || 0);
            fillPrice = Math.max(bar.open, order.stopPrice || 0);
          } else {
            canFill = bar.low <= (order.stopPrice || 0);
            fillPrice = Math.min(bar.open, order.stopPrice || 0);
          }
          break;
          
        case OrderType.STOP_LIMIT:
          // Stop-limit orders are filled if the price crosses the stop price and is better than the limit price
          if (order.side === OrderSide.BUY) {
            canFill = bar.high >= (order.stopPrice || 0) && bar.low <= (order.limitPrice || 0);
            fillPrice = Math.max(bar.open, order.stopPrice || 0);
            fillPrice = Math.min(fillPrice, order.limitPrice || Infinity);
          } else {
            canFill = bar.low <= (order.stopPrice || 0) && bar.high >= (order.limitPrice || 0);
            fillPrice = Math.min(bar.open, order.stopPrice || 0);
            fillPrice = Math.max(fillPrice, order.limitPrice || 0);
          }
          break;
      }
      
      if (canFill) {
        // Fill the order
        this.fillOrder(order, fillPrice, bar.timestamp);
      }
    }
  }
  
  /**
   * Fill an order
   * @param order Order to fill
   * @param fillPrice Fill price
   * @param fillDate Fill date
   */
  private fillOrder(order: BacktestOrder, fillPrice: number, fillDate: Date): void {
    // Apply slippage
    if (order.side === OrderSide.BUY) {
      fillPrice *= (1 + this.config.slippage! / 100);
    } else {
      fillPrice *= (1 - this.config.slippage! / 100);
    }
    
    // Update the order
    order.status = OrderStatus.FILLED;
    order.filledQuantity = order.quantity;
    order.filledPrice = fillPrice;
    order.filledDate = fillDate;
    order.updatedDate = fillDate;
    
    // Calculate commission
    const commission = fillPrice * order.quantity * (this.config.commission! / 100);
    
    // Create a trade
    const trade: BacktestTrade = {
      id: uuidv4(),
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price: fillPrice,
      date: fillDate,
      commission,
      slippage: Math.abs(fillPrice - (order.price || fillPrice)),
      status: 'OPEN',
      signalType: order.metadata?.signalType,
      signalConfidence: order.metadata?.signalConfidence,
      metadata: order.metadata
    };
    
    // Add the trade
    this.trades.push(trade);
    
    // Update cash
    if (order.side === OrderSide.BUY) {
      this.cash -= (fillPrice * order.quantity) + commission;
    } else {
      this.cash += (fillPrice * order.quantity) - commission;
    }
    
    // Update position
    this.updatePositionWithTrade(trade);
    
    // Emit order filled event
    this.emit('order_filled', { order, trade });
  }
  
  /**
   * Update position with a trade
   * @param trade Trade to update position with
   */
  private updatePositionWithTrade(trade: BacktestTrade): void {
    const position = this.positions.get(trade.symbol);
    
    if (!position) {
      // Create a new position
      if (trade.side === OrderSide.BUY) {
        this.positions.set(trade.symbol, {
          symbol: trade.symbol,
          quantity: trade.quantity,
          entryPrice: trade.price,
          entryDate: trade.date,
          currentPrice: trade.price,
          lastUpdateDate: trade.date,
          unrealizedPnl: 0,
          unrealizedPnlPercent: 0,
          marketValue: trade.price * trade.quantity,
          side: 'LONG',
          trades: [trade]
        });
      } else if (this.config.enableShortSelling) {
        // Short selling
        this.positions.set(trade.symbol, {
          symbol: trade.symbol,
          quantity: trade.quantity,
          entryPrice: trade.price,
          entryDate: trade.date,
          currentPrice: trade.price,
          lastUpdateDate: trade.date,
          unrealizedPnl: 0,
          unrealizedPnlPercent: 0,
          marketValue: trade.price * trade.quantity,
          side: 'SHORT',
          trades: [trade]
        });
      }
    } else {
      // Update existing position
      if (trade.side === OrderSide.BUY) {
        if (position.side === 'LONG') {
          // Add to long position
          const newQuantity = position.quantity + trade.quantity;
          const newEntryPrice = ((position.entryPrice * position.quantity) + (trade.price * trade.quantity)) / newQuantity;
          
          position.quantity = newQuantity;
          position.entryPrice = newEntryPrice;
          position.trades.push(trade);
        } else {
          // Cover short position
          if (trade.quantity < position.quantity) {
            // Partial cover
            const coveredQuantity = trade.quantity;
            const remainingQuantity = position.quantity - coveredQuantity;
            
            // Calculate P&L for the covered portion
            const pnl = (position.entryPrice - trade.price) * coveredQuantity - trade.commission;
            const pnlPercent = (pnl / (position.entryPrice * coveredQuantity)) * 100;
            
            // Update the trade
            trade.status = 'CLOSED';
            trade.pnl = pnl;
            trade.pnlPercent = pnlPercent;
            trade.exitPrice = position.entryPrice;
            trade.exitDate = trade.date;
            trade.holdingPeriod = (trade.exitDate.getTime() - position.entryDate.getTime()) / (1000 * 60 * 60 * 24);
            
            // Update the position
            position.quantity = remainingQuantity;
            position.trades.push(trade);
          } else if (trade.quantity === position.quantity) {
            // Full cover
            const pnl = (position.entryPrice - trade.price) * position.quantity - trade.commission;
            const pnlPercent = (pnl / (position.entryPrice * position.quantity)) * 100;
            
            // Update the trade
            trade.status = 'CLOSED';
            trade.pnl = pnl;
            trade.pnlPercent = pnlPercent;
            trade.exitPrice = position.entryPrice;
            trade.exitDate = trade.date;
            trade.holdingPeriod = (trade.exitDate.getTime() - position.entryDate.getTime()) / (1000 * 60 * 60 * 24);
            
            // Close the position
            this.positions.delete(trade.symbol);
          } else {
            // Flip from short to long
            const coveredQuantity = position.quantity;
            const newQuantity = trade.quantity - coveredQuantity;
            
            // Calculate P&L for the covered portion
            const pnl = (position.entryPrice - trade.price) * coveredQuantity - trade.commission;
            const pnlPercent = (pnl / (position.entryPrice * coveredQuantity)) * 100;
            
            // Create a new trade for the covered portion
            const coverTrade: BacktestTrade = {
              id: uuidv4(),
              symbol: trade.symbol,
              side: OrderSide.BUY,
              quantity: coveredQuantity,
              price: trade.price,
              date: trade.date,
              commission: trade.commission * (coveredQuantity / trade.quantity),
              slippage: trade.slippage,
              status: 'CLOSED',
              pnl,
              pnlPercent,
              exitPrice: position.entryPrice,
              exitDate: trade.date,
              holdingPeriod: (trade.date.getTime() - position.entryDate.getTime()) / (1000 * 60 * 60 * 24),
              signalType: trade.signalType,
              signalConfidence: trade.signalConfidence,
              metadata: trade.metadata
            };
            
            // Add the cover trade
            this.trades.push(coverTrade);
            
            // Create a new long position
            this.positions.set(trade.symbol, {
              symbol: trade.symbol,
              quantity: newQuantity,
              entryPrice: trade.price,
              entryDate: trade.date,
              currentPrice: trade.price,
              lastUpdateDate: trade.date,
              unrealizedPnl: 0,
              unrealizedPnlPercent: 0,
              marketValue: trade.price * newQuantity,
              side: 'LONG',
              trades: [trade]
            });
          }
        }
      } else {
        // Sell order
        if (position.side === 'SHORT') {
          // Add to short position
          const newQuantity = position.quantity + trade.quantity;
          const newEntryPrice = ((position.entryPrice * position.quantity) + (trade.price * trade.quantity)) / newQuantity;
          
          position.quantity = newQuantity;
          position.entryPrice = newEntryPrice;
          position.trades.push(trade);
        } else {
          // Close long position
          if (trade.quantity < position.quantity) {
            // Partial close
            const soldQuantity = trade.quantity;
            const remainingQuantity = position.quantity - soldQuantity;
            
            // Calculate P&L for the sold portion
            const pnl = (trade.price - position.entryPrice) * soldQuantity - trade.commission;
            const pnlPercent = (pnl / (position.entryPrice * soldQuantity)) * 100;
            
            // Update the trade
            trade.status = 'CLOSED';
            trade.pnl = pnl;
            trade.pnlPercent = pnlPercent;
            trade.exitPrice = position.entryPrice;
            trade.exitDate = trade.date;
            trade.holdingPeriod = (trade.exitDate.getTime() - position.entryDate.getTime()) / (1000 * 60 * 60 * 24);
            
            // Update the position
            position.quantity = remainingQuantity;
            position.trades.push(trade);
          } else if (trade.quantity === position.quantity) {
            // Full close
            const pnl = (trade.price - position.entryPrice) * position.quantity - trade.commission;
            const pnlPercent = (pnl / (position.entryPrice * position.quantity)) * 100;
            
            // Update the trade
            trade.status = 'CLOSED';
            trade.pnl = pnl;
            trade.pnlPercent = pnlPercent;
            trade.exitPrice = position.entryPrice;
            trade.exitDate = trade.date;
            trade.holdingPeriod = (trade.exitDate.getTime() - position.entryDate.getTime()) / (1000 * 60 * 60 * 24);
            
            // Close the position
            this.positions.delete(trade.symbol);
          } else if (this.config.enableShortSelling) {
            // Flip from long to short
            const soldQuantity = position.quantity;
            const newQuantity = trade.quantity - soldQuantity;
            
            // Calculate P&L for the sold portion
            const pnl = (trade.price - position.entryPrice) * soldQuantity - trade.commission;
            const pnlPercent = (pnl / (position.entryPrice * soldQuantity)) * 100;
            
            // Create a new trade for the sold portion
            const sellTrade: BacktestTrade = {
              id: uuidv4(),
              symbol: trade.symbol,
              side: OrderSide.SELL,
              quantity: soldQuantity,
              price: trade.price,
              date: trade.date,
              commission: trade.commission * (soldQuantity / trade.quantity),
              slippage: trade.slippage,
              status: 'CLOSED',
              pnl,
              pnlPercent,
              exitPrice: position.entryPrice,
              exitDate: trade.date,
              holdingPeriod: (trade.date.getTime() - position.entryDate.getTime()) / (1000 * 60 * 60 * 24),
              signalType: trade.signalType,
              signalConfidence: trade.signalConfidence,
              metadata: trade.metadata
            };
            
            // Add the sell trade
            this.trades.push(sellTrade);
            
            // Create a new short position
            this.positions.set(trade.symbol, {
              symbol: trade.symbol,
              quantity: newQuantity,
              entryPrice: trade.price,
              entryDate: trade.date,
              currentPrice: trade.price,
              lastUpdateDate: trade.date,
              unrealizedPnl: 0,
              unrealizedPnlPercent: 0,
              marketValue: trade.price * newQuantity,
              side: 'SHORT',
              trades: [trade]
            });
          }
        }
      }
    }
  }
  
  /**
   * Process a signal
   * @param signal Signal to process
   * @param bar Current bar
   */
  private processSignal(signal: Signal, bar: Bar): void {
    // Check if we should process this signal
    if (!this.shouldProcessSignal(signal)) {
      return;
    }
    
    // Create an order from the signal
    const order = this.createOrderFromSignal(signal, bar);
    
    // Add the order
    this.orders.push(order);
    
    // Emit signal processed event
    this.emit('signal_processed', { signal, order });
  }
  
  /**
   * Check if we should process a signal
   * @param signal Signal to check
   * @returns True if we should process the signal
   */
  private shouldProcessSignal(signal: Signal): boolean {
    // Check if we have reached the maximum number of open positions
    if (this.positions.size >= this.config.maxOpenPositions!) {
      // Only allow closing signals
      return signal.type === SignalType.SELL || signal.type === SignalType.STRONG_SELL;
    }
    
    // Check if we have reached the maximum drawdown
    const currentEquity = this.calculateCurrentEquity();
    const drawdownPercent = ((this.highWaterMark - currentEquity) / this.highWaterMark) * 100;
    
    if (drawdownPercent >= this.config.maxDrawdown!) {
      // Only allow closing signals
      return signal.type === SignalType.SELL || signal.type === SignalType.STRONG_SELL;
    }
    
    return true;
  }
  
  /**
   * Create an order from a signal
   * @param signal Signal to create order from
   * @param bar Current bar
   * @returns Created order
   */
  private createOrderFromSignal(signal: Signal, bar: Bar): BacktestOrder {
    // Determine order side
    const side = signal.type.includes('BUY') ? OrderSide.BUY : OrderSide.SELL;
    
    // Determine order type
    const type = OrderType.MARKET;
    
    // Determine order quantity
    let quantity = 0;
    
    if (side === OrderSide.BUY) {
      // Calculate position size based on available cash and max position size
      const maxPositionValue = this.cash * (this.config.maxPositionSize! / 100);
      quantity = Math.floor(maxPositionValue / bar.close);
    } else {
      // For sell orders, use the current position quantity
      const position = this.positions.get(signal.symbol);
      if (position) {
        quantity = position.quantity;
      }
    }
    
    // Create the order
    const order: BacktestOrder = {
      id: uuidv4(),
      symbol: signal.symbol,
      side,
      type,
      quantity,
      price: bar.close,
      timeInForce: TimeInForce.DAY,
      status: OrderStatus.PENDING,
      filledQuantity: 0,
      createdDate: bar.timestamp,
      updatedDate: bar.timestamp,
      signalId: signal.id,
      metadata: {
        signalType: signal.type,
        signalConfidence: signal.confidence,
        signalTimestamp: signal.timestamp,
        signalMetadata: signal.metadata
      }
    };
    
    return order;
  }
  
  /**
   * Update the equity curve
   * @param date Current date
   */
  private updateEquityCurve(date: Date): void {
    // Calculate current equity
    const equity = this.calculateCurrentEquity();
    
    // Update high water mark
    if (equity > this.highWaterMark) {
      this.highWaterMark = equity;
    }
    
    // Calculate drawdown
    const drawdown = this.highWaterMark - equity;
    const drawdownPercent = (drawdown / this.highWaterMark) * 100;
    
    // Add to equity curve
    this.equityCurve.push({
      date: new Date(date),
      equity
    });
    
    // Add to drawdown curve
    this.drawdownCurve.push({
      date: new Date(date),
      drawdown,
      drawdownPercent
    });
  }
  
  /**
   * Calculate current equity
   * @returns Current equity
   */
  private calculateCurrentEquity(): number {
    // Start with cash
    let equity = this.cash;
    
    // Add position values
    for (const position of this.positions.values()) {
      equity += position.marketValue;
    }
    
    return equity;
  }
  
  /**
   * Calculate progress of the backtest
   * @returns Progress percentage (0-100)
   */
  private calculateProgress(): number {
    const totalDays = (this.config.endDate.getTime() - this.config.startDate.getTime()) / (1000 * 60 * 60 * 24);
    const daysPassed = (this.currentDate.getTime() - this.config.startDate.getTime()) / (1000 * 60 * 60 * 24);
    
    return Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));
  }
  
  /**
   * Calculate final results
   * @returns Backtest result
   */
  private calculateResults(): BacktestResult {
    // Calculate final equity
    const finalEquity = this.calculateCurrentEquity();
    
    // Calculate total return
    const totalReturn = finalEquity - this.config.initialCapital;
    const totalReturnPercent = (totalReturn / this.config.initialCapital) * 100;
    
    // Calculate duration in days
    const duration = (this.config.endDate.getTime() - this.config.startDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Calculate annualized return
    const annualizedReturn = Math.pow(1 + (totalReturnPercent / 100), 365 / duration) - 1;
    
    // Calculate max drawdown
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;
    
    for (const point of this.drawdownCurve) {
      if (point.drawdown > maxDrawdown) {
        maxDrawdown = point.drawdown;
        maxDrawdownPercent = point.drawdownPercent;
      }
    }
    
    // Calculate trade statistics
    const closedTrades = this.trades.filter(trade => trade.status === 'CLOSED');
    const winningTrades = closedTrades.filter(trade => (trade.pnl || 0) > 0);
    const losingTrades = closedTrades.filter(trade => (trade.pnl || 0) <= 0);
    
    const winRate = winningTrades.length / closedTrades.length;
    const lossRate = losingTrades.length / closedTrades.length;
    
    const totalProfit = winningTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0));
    
    const averageWin = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;
    
    const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(trade => trade.pnl || 0)) : 0;
    const largestLoss = losingTrades.length > 0 ? Math.abs(Math.min(...losingTrades.map(trade => trade.pnl || 0))) : 0;
    
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
    
    const expectancy = (winRate * averageWin) - (lossRate * averageLoss);
    
    const averageHoldingPeriod = closedTrades.length > 0
      ? closedTrades.reduce((sum, trade) => sum + (trade.holdingPeriod || 0), 0) / closedTrades.length
      : 0;
    
    // Calculate monthly returns
    const monthlyReturns: { year: number; month: number; return: number }[] = [];
    
    if (this.equityCurve.length > 0) {
      let currentYear = this.equityCurve[0].date.getFullYear();
      let currentMonth = this.equityCurve[0].date.getMonth();
      let monthStartEquity = this.config.initialCapital;
      
      for (const point of this.equityCurve) {
        const year = point.date.getFullYear();
        const month = point.date.getMonth();
        
        if (year !== currentYear || month !== currentMonth) {
          // Calculate return for the previous month
          const monthEndEquity = this.equityCurve[this.equityCurve.indexOf(point) - 1].equity;
          const monthReturn = (monthEndEquity - monthStartEquity) / monthStartEquity * 100;
          
          monthlyReturns.push({
            year: currentYear,
            month: currentMonth,
            return: monthReturn
          });
          
          // Update for the new month
          currentYear = year;
          currentMonth = month;
          monthStartEquity = monthEndEquity;
        }
      }
      
      // Add the last month
      const lastPoint = this.equityCurve[this.equityCurve.length - 1];
      const lastMonthReturn = (lastPoint.equity - monthStartEquity) / monthStartEquity * 100;
      
      monthlyReturns.push({
        year: currentYear,
        month: currentMonth,
        return: lastMonthReturn
      });
    }
    
    // Calculate Sharpe ratio
    const dailyReturns: number[] = [];
    let previousEquity = this.config.initialCapital;
    
    for (const point of this.equityCurve) {
      const dailyReturn = (point.equity - previousEquity) / previousEquity;
      dailyReturns.push(dailyReturn);
      previousEquity = point.equity;
    }
    
    const averageDailyReturn = dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length;
    const stdDevDailyReturn = Math.sqrt(
      dailyReturns.reduce((sum, ret) => sum + Math.pow(ret - averageDailyReturn, 2), 0) / dailyReturns.length
    );
    
    const sharpeRatio = stdDevDailyReturn > 0 ? (averageDailyReturn / stdDevDailyReturn) * Math.sqrt(252) : 0;
    
    // Calculate Sortino ratio (using only negative returns)
    const negativeReturns = dailyReturns.filter(ret => ret < 0);
    const stdDevNegativeReturn = Math.sqrt(
      negativeReturns.reduce((sum, ret) => sum + Math.pow(ret - 0, 2), 0) / (negativeReturns.length || 1)
    );
    
    const sortinoRatio = stdDevNegativeReturn > 0 ? (averageDailyReturn / stdDevNegativeReturn) * Math.sqrt(252) : 0;
    
    // Calculate Calmar ratio
    const calmarRatio = maxDrawdownPercent > 0 ? annualizedReturn / (maxDrawdownPercent / 100) : 0;
    
    // Create the result
    return {
      id: uuidv4(),
      strategyId: this.strategy?.id || '',
      strategyName: this.strategy?.name || '',
      startDate: this.config.startDate,
      endDate: this.config.endDate,
      duration,
      initialCapital: this.config.initialCapital,
      finalCapital: finalEquity,
      totalReturn,
      totalReturnPercent,
      annualizedReturn,
      maxDrawdown,
      maxDrawdownPercent,
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
      trades: this.trades,
      winRate,
      lossRate,
      averageWin,
      averageLoss,
      largestWin,
      largestLoss,
      profitFactor,
      expectancy,
      averageHoldingPeriod,
      equityCurve: this.equityCurve,
      drawdownCurve: this.drawdownCurve,
      monthlyReturns,
      symbols: this.config.symbols,
      timeframe: this.config.timeframe,
      config: this.config
    };
  }
  
  /**
   * Cancel the backtest
   */
  public cancel(): void {
    this.isCancelled = true;
    console.log('Backtest cancelled');
  }
  
  /**
   * Get the current result (even if the backtest is not finished)
   * @returns Current backtest result
   */
  public getCurrentResult(): BacktestResult | undefined {
    if (this.result) {
      return this.result;
    }
    
    // Calculate current results
    return this.calculateResults();
  }
}