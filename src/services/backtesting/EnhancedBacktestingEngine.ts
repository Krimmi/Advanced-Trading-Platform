import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { HistoricalDataReplayService, DataReplayConfig } from './HistoricalDataReplayService';
import { TransactionCostModelingService, TransactionCostModelConfig, createDefaultTransactionCostModelConfig } from './TransactionCostModelingService';
import { PerformanceAnalyticsFramework } from './PerformanceAnalyticsFramework';
import { IStrategy } from '../algorithmic-trading/strategies/IStrategy';
import { Bar } from '../market-data/IMarketDataProvider';
import { Signal, SignalType } from '../../models/algorithmic-trading/StrategyTypes';
import { OrderParams, OrderSide, OrderType, OrderStatus, TimeInForce } from '../../models/algorithmic-trading/OrderTypes';
import {
  BacktestConfig,
  BacktestResult,
  BacktestPosition,
  BacktestTrade,
  BacktestOrder,
  EquityCurvePoint,
  DrawdownPoint,
  MonthlyReturn,
  PerformanceMetrics
} from '../../types/backtesting';

/**
 * Enhanced backtesting engine configuration
 */
export interface EnhancedBacktestConfig {
  id?: string;
  name: string;
  description?: string;
  strategyId: string;
  symbols: string[];
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  timeframe: string;
  includeAfterHours?: boolean;
  dataSource?: 'alpaca' | 'polygon' | 'iex' | 'csv';
  transactionCostModel?: TransactionCostModelConfig;
  enableShortSelling?: boolean;
  maxOpenPositions?: number;
  maxPositionSize?: number; // in percentage of capital
  maxDrawdown?: number; // in percentage
  stopLoss?: number; // in percentage
  takeProfit?: number; // in percentage
  rebalancingFrequency?: 'daily' | 'weekly' | 'monthly' | 'none';
  benchmarkSymbol?: string;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  userId?: string;
}

/**
 * Enhanced backtesting engine
 * 
 * This engine provides comprehensive backtesting capabilities with
 * realistic transaction cost modeling, performance analytics, and
 * detailed reporting.
 */
export class EnhancedBacktestingEngine extends EventEmitter {
  private config: EnhancedBacktestConfig;
  private strategy?: IStrategy;
  private dataReplayService: HistoricalDataReplayService;
  private transactionCostService: TransactionCostModelingService;
  private performanceAnalytics: PerformanceAnalyticsFramework;
  
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private isCancelled: boolean = false;
  
  private cash: number;
  private positions: Map<string, BacktestPosition> = new Map();
  private trades: BacktestTrade[] = [];
  private orders: BacktestOrder[] = [];
  private equityCurve: EquityCurvePoint[] = [];
  private drawdownCurve: DrawdownPoint[] = [];
  private highWaterMark: number;
  private benchmarkData: { date: Date; value: number }[] = [];
  
  private result?: BacktestResult;
  
  /**
   * Constructor
   * @param config Backtesting configuration
   */
  constructor(config: EnhancedBacktestConfig) {
    super();
    
    // Set default values for optional parameters
    this.config = {
      includeAfterHours: false,
      dataSource: 'alpaca',
      enableShortSelling: true,
      maxOpenPositions: 10,
      maxPositionSize: 20, // 20% of capital
      maxDrawdown: 25, // 25% max drawdown
      rebalancingFrequency: 'none',
      ...config
    };
    
    // Initialize services
    this.dataReplayService = new HistoricalDataReplayService({
      symbols: this.config.symbols,
      startDate: this.config.startDate,
      endDate: this.config.endDate,
      timeframe: this.config.timeframe,
      includeAfterHours: this.config.includeAfterHours,
      dataSource: this.config.dataSource
    });
    
    this.transactionCostService = new TransactionCostModelingService(
      this.config.transactionCostModel || createDefaultTransactionCostModelConfig()
    );
    
    this.performanceAnalytics = new PerformanceAnalyticsFramework();
    
    // Initialize state
    this.cash = this.config.initialCapital;
    this.highWaterMark = this.config.initialCapital;
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  /**
   * Set up event listeners for data replay service
   */
  private setupEventListeners(): void {
    this.dataReplayService.on('bar', (bar: Bar) => {
      this.processBar(bar);
    });
    
    this.dataReplayService.on('progress', (progress: number) => {
      this.emit('progress', progress);
    });
    
    this.dataReplayService.on('stop', () => {
      this.finishBacktest();
    });
  }
  
  /**
   * Initialize the backtesting engine
   */
  public async initialize(): Promise<void> {
    // Initialize the data replay service
    await this.dataReplayService.initialize();
    
    // Load benchmark data if specified
    if (this.config.benchmarkSymbol) {
      await this.loadBenchmarkData();
    }
    
    console.log('Enhanced Backtesting Engine initialized');
  }
  
  /**
   * Load benchmark data
   */
  private async loadBenchmarkData(): Promise<void> {
    if (!this.config.benchmarkSymbol) {
      return;
    }
    
    try {
      // Create a separate data replay service for the benchmark
      const benchmarkDataService = new HistoricalDataReplayService({
        symbols: [this.config.benchmarkSymbol],
        startDate: this.config.startDate,
        endDate: this.config.endDate,
        timeframe: this.config.timeframe,
        dataSource: this.config.dataSource
      });
      
      await benchmarkDataService.initialize();
      
      // Extract the benchmark data
      const benchmarkSymbol = this.config.benchmarkSymbol;
      const historicalData = (benchmarkDataService as any).historicalData;
      
      if (historicalData && historicalData.has(benchmarkSymbol)) {
        const bars = historicalData.get(benchmarkSymbol);
        
        this.benchmarkData = bars.map((bar: Bar) => ({
          date: bar.timestamp,
          value: bar.close
        }));
        
        console.log(`Loaded benchmark data for ${benchmarkSymbol}: ${this.benchmarkData.length} data points`);
      }
    } catch (error) {
      console.error(`Error loading benchmark data for ${this.config.benchmarkSymbol}:`, error);
    }
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
    this.isPaused = false;
    this.isCancelled = false;
    
    try {
      // Initialize the strategy
      await this.strategy.initialize({});
      
      // Start the strategy
      await this.strategy.start();
      
      // Start the data replay
      this.dataReplayService.start();
      
      // Wait for the backtest to finish
      return new Promise<BacktestResult>((resolve, reject) => {
        this.once('backtest_completed', () => {
          if (this.result) {
            resolve(this.result);
          } else {
            reject(new Error('Backtest completed but no result was generated'));
          }
        });
        
        this.once('backtest_error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      this.isRunning = false;
      console.error('Error running backtest:', error);
      this.emit('backtest_error', error);
      throw error;
    }
  }
  
  /**
   * Process a bar
   * @param bar Bar to process
   */
  private processBar(bar: Bar): void {
    try {
      // Update positions with current prices
      this.updatePositions(bar);
      
      // Process pending orders
      this.processOrders(bar);
      
      // Process the bar with the strategy
      if (this.strategy) {
        // Call the strategy's onBar method
        this.strategy.onBar(bar.symbol, bar);
        
        // Generate signals
        this.strategy.generateSignals().then(signals => {
          // Process signals
          for (const signal of signals) {
            this.processSignal(signal, bar);
          }
        }).catch(error => {
          console.error('Error generating signals:', error);
        });
      }
      
      // Update equity curve
      this.updateEquityCurve(bar.timestamp);
      
      // Check for rebalancing
      this.checkRebalancing(bar.timestamp);
      
      // Check for stop loss and take profit
      this.checkStopLossAndTakeProfit(bar);
      
      // Check for max drawdown
      this.checkMaxDrawdown();
    } catch (error) {
      console.error('Error processing bar:', error);
      this.emit('error', error);
    }
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
        this.fillOrder(order, fillPrice, bar.timestamp, bar.volume);
      }
    }
  }
  
  /**
   * Fill an order
   * @param order Order to fill
   * @param fillPrice Fill price
   * @param fillDate Fill date
   * @param volume Trading volume
   */
  private fillOrder(order: BacktestOrder, fillPrice: number, fillDate: Date, volume: number): void {
    // Calculate transaction costs
    const isBuy = order.side === OrderSide.BUY;
    
    // Get adjusted execution price including slippage and market impact
    const adjustedPrice = this.transactionCostService.getAdjustedExecutionPrice(
      fillPrice,
      order.quantity,
      volume,
      isBuy,
      { timestamp: fillDate }
    );
    
    // Calculate transaction costs
    const costs = this.transactionCostService.calculateTotalTransactionCost(
      fillPrice,
      order.quantity,
      volume,
      { timestamp: fillDate }
    );
    
    // Update the order
    order.status = OrderStatus.FILLED;
    order.filledQuantity = order.quantity;
    order.filledPrice = adjustedPrice;
    order.filledDate = fillDate;
    order.updatedDate = fillDate;
    
    // Create a trade
    const trade: BacktestTrade = {
      id: uuidv4(),
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price: adjustedPrice,
      date: fillDate,
      commission: costs.commission,
      slippage: costs.slippage,
      status: 'OPEN',
      signalType: order.metadata?.signalType,
      signalConfidence: order.metadata?.signalConfidence,
      metadata: order.metadata
    };
    
    // Add the trade
    this.trades.push(trade);
    
    // Update cash
    if (order.side === OrderSide.BUY) {
      this.cash -= (adjustedPrice * order.quantity) + costs.commission;
    } else {
      this.cash += (adjustedPrice * order.quantity) - costs.commission;
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
    
    // Calculate cash and positions value
    const positionsValue = Array.from(this.positions.values()).reduce(
      (sum, position) => sum + position.marketValue,
      0
    );
    
    // Add to equity curve
    this.equityCurve.push({
      date: new Date(date),
      equity,
      drawdown,
      cash: this.cash,
      positions: positionsValue
    });
    
    // Add to drawdown curve
    this.drawdownCurve.push({
      date: new Date(date),
      drawdown,
      drawdownPercentage: drawdownPercent
    });
  }
  
  /**
   * Check for rebalancing
   * @param date Current date
   */
  private checkRebalancing(date: Date): void {
    if (this.config.rebalancingFrequency === 'none') {
      return;
    }
    
    // Check if we need to rebalance
    const shouldRebalance = this.shouldRebalance(date);
    
    if (shouldRebalance) {
      this.rebalancePortfolio(date);
    }
  }
  
  /**
   * Check if we should rebalance the portfolio
   * @param date Current date
   * @returns True if we should rebalance
   */
  private shouldRebalance(date: Date): boolean {
    if (this.config.rebalancingFrequency === 'none') {
      return false;
    }
    
    // Get the last rebalancing date
    const lastRebalancingDate = this.getLastRebalancingDate();
    
    if (!lastRebalancingDate) {
      return true; // First rebalancing
    }
    
    // Check if enough time has passed since the last rebalancing
    switch (this.config.rebalancingFrequency) {
      case 'daily':
        // Rebalance if it's a new day
        return date.toDateString() !== lastRebalancingDate.toDateString();
        
      case 'weekly':
        // Rebalance if it's a new week (Monday)
        return date.getDay() === 1 && date.toDateString() !== lastRebalancingDate.toDateString();
        
      case 'monthly':
        // Rebalance if it's a new month
        return date.getMonth() !== lastRebalancingDate.getMonth() || date.getFullYear() !== lastRebalancingDate.getFullYear();
        
      default:
        return false;
    }
  }
  
  /**
   * Get the last rebalancing date
   * @returns Last rebalancing date or null if no rebalancing has been done
   */
  private getLastRebalancingDate(): Date | null {
    // Check if we have any rebalancing metadata in trades
    const rebalancingTrades = this.trades.filter(trade => trade.metadata?.isRebalancing);
    
    if (rebalancingTrades.length === 0) {
      return null;
    }
    
    // Get the most recent rebalancing trade
    const lastRebalancingTrade = rebalancingTrades.reduce((latest, trade) => {
      if (!latest.date) return trade;
      return trade.date > latest.date ? trade : latest;
    });
    
    return lastRebalancingTrade.date;
  }
  
  /**
   * Rebalance the portfolio
   * @param date Current date
   */
  private rebalancePortfolio(date: Date): void {
    // Implement your rebalancing logic here
    // This is a placeholder for portfolio rebalancing
    
    // Emit rebalancing event
    this.emit('rebalancing', { date });
  }
  
  /**
   * Check for stop loss and take profit
   * @param bar Current bar
   */
  private checkStopLossAndTakeProfit(bar: Bar): void {
    // Get position for this symbol
    const position = this.positions.get(bar.symbol);
    
    if (!position) {
      return;
    }
    
    // Check stop loss
    if (this.config.stopLoss && this.config.stopLoss > 0) {
      const stopLossPercent = this.config.stopLoss;
      
      if (position.side === 'LONG') {
        const currentLoss = (position.entryPrice - bar.close) / position.entryPrice * 100;
        
        if (currentLoss >= stopLossPercent) {
          // Trigger stop loss
          this.createStopLossOrder(position, bar);
        }
      } else {
        const currentLoss = (bar.close - position.entryPrice) / position.entryPrice * 100;
        
        if (currentLoss >= stopLossPercent) {
          // Trigger stop loss
          this.createStopLossOrder(position, bar);
        }
      }
    }
    
    // Check take profit
    if (this.config.takeProfit && this.config.takeProfit > 0) {
      const takeProfitPercent = this.config.takeProfit;
      
      if (position.side === 'LONG') {
        const currentProfit = (bar.close - position.entryPrice) / position.entryPrice * 100;
        
        if (currentProfit >= takeProfitPercent) {
          // Trigger take profit
          this.createTakeProfitOrder(position, bar);
        }
      } else {
        const currentProfit = (position.entryPrice - bar.close) / position.entryPrice * 100;
        
        if (currentProfit >= takeProfitPercent) {
          // Trigger take profit
          this.createTakeProfitOrder(position, bar);
        }
      }
    }
  }
  
  /**
   * Create a stop loss order
   * @param position Position to create stop loss order for
   * @param bar Current bar
   */
  private createStopLossOrder(position: BacktestPosition, bar: Bar): void {
    // Create a market order to close the position
    const order: BacktestOrder = {
      id: uuidv4(),
      symbol: position.symbol,
      side: position.side === 'LONG' ? OrderSide.SELL : OrderSide.BUY,
      type: OrderType.MARKET,
      quantity: position.quantity,
      price: bar.close,
      timeInForce: TimeInForce.DAY,
      status: OrderStatus.PENDING,
      filledQuantity: 0,
      createdDate: bar.timestamp,
      updatedDate: bar.timestamp,
      metadata: {
        isStopLoss: true,
        originalEntryPrice: position.entryPrice,
        originalEntryDate: position.entryDate
      }
    };
    
    // Add the order
    this.orders.push(order);
    
    // Emit stop loss event
    this.emit('stop_loss', { position, order });
  }
  
  /**
   * Create a take profit order
   * @param position Position to create take profit order for
   * @param bar Current bar
   */
  private createTakeProfitOrder(position: BacktestPosition, bar: Bar): void {
    // Create a market order to close the position
    const order: BacktestOrder = {
      id: uuidv4(),
      symbol: position.symbol,
      side: position.side === 'LONG' ? OrderSide.SELL : OrderSide.BUY,
      type: OrderType.MARKET,
      quantity: position.quantity,
      price: bar.close,
      timeInForce: TimeInForce.DAY,
      status: OrderStatus.PENDING,
      filledQuantity: 0,
      createdDate: bar.timestamp,
      updatedDate: bar.timestamp,
      metadata: {
        isTakeProfit: true,
        originalEntryPrice: position.entryPrice,
        originalEntryDate: position.entryDate
      }
    };
    
    // Add the order
    this.orders.push(order);
    
    // Emit take profit event
    this.emit('take_profit', { position, order });
  }
  
  /**
   * Check for max drawdown
   */
  private checkMaxDrawdown(): void {
    if (!this.config.maxDrawdown || this.config.maxDrawdown <= 0) {
      return;
    }
    
    // Calculate current equity
    const currentEquity = this.calculateCurrentEquity();
    
    // Calculate drawdown
    const drawdownPercent = ((this.highWaterMark - currentEquity) / this.highWaterMark) * 100;
    
    if (drawdownPercent >= this.config.maxDrawdown) {
      // Close all positions
      this.closeAllPositions();
      
      // Emit max drawdown event
      this.emit('max_drawdown', { drawdownPercent, maxDrawdown: this.config.maxDrawdown });
    }
  }
  
  /**
   * Close all positions
   */
  private closeAllPositions(): void {
    // Create market orders to close all positions
    for (const position of this.positions.values()) {
      const order: BacktestOrder = {
        id: uuidv4(),
        symbol: position.symbol,
        side: position.side === 'LONG' ? OrderSide.SELL : OrderSide.BUY,
        type: OrderType.MARKET,
        quantity: position.quantity,
        price: position.currentPrice,
        timeInForce: TimeInForce.DAY,
        status: OrderStatus.PENDING,
        filledQuantity: 0,
        createdDate: position.lastUpdateDate,
        updatedDate: position.lastUpdateDate,
        metadata: {
          isMaxDrawdown: true,
          originalEntryPrice: position.entryPrice,
          originalEntryDate: position.entryDate
        }
      };
      
      // Add the order
      this.orders.push(order);
    }
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
   * Finish the backtest
   */
  private finishBacktest(): void {
    if (!this.isRunning) {
      return;
    }
    
    try {
      // Stop the strategy
      if (this.strategy) {
        this.strategy.stop().catch(error => {
          console.error('Error stopping strategy:', error);
        });
      }
      
      // Calculate final results
      this.result = this.calculateResults();
      
      // Reset state
      this.isRunning = false;
      this.isPaused = false;
      this.isCancelled = false;
      
      // Emit completion event
      this.emit('backtest_completed', this.result);
    } catch (error) {
      console.error('Error finishing backtest:', error);
      this.emit('backtest_error', error);
    }
  }
  
  /**
   * Calculate final results
   * @returns Backtest result
   */
  private calculateResults(): BacktestResult {
    // Calculate performance metrics
    const performanceMetrics = this.performanceAnalytics.calculatePerformanceMetrics(
      this.equityCurve,
      this.trades,
      this.config.initialCapital,
      this.benchmarkData
    );
    
    // Calculate monthly returns
    const monthlyReturns = this.performanceAnalytics.calculateMonthlyReturns(this.equityCurve);
    
    // Create the result
    return {
      id: uuidv4(),
      configId: this.config.id || '',
      strategyId: this.strategy?.id || '',
      status: 'COMPLETED',
      startDate: this.config.startDate.toISOString(),
      endDate: this.config.endDate.toISOString(),
      initialCapital: this.config.initialCapital,
      finalCapital: this.calculateCurrentEquity(),
      totalReturn: performanceMetrics.totalReturn,
      annualizedReturn: performanceMetrics.annualizedReturn,
      maxDrawdown: performanceMetrics.maxDrawdown,
      sharpeRatio: performanceMetrics.sharpeRatio,
      sortinoRatio: performanceMetrics.sortinoRatio,
      calmarRatio: performanceMetrics.calmarRatio,
      trades: this.trades,
      equityCurve: this.equityCurve,
      drawdownCurve: this.drawdownCurve,
      monthlyReturns,
      performanceMetrics,
      executionTime: 0, // Will be set by the caller
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };
  }
  
  /**
   * Pause the backtest
   */
  public pause(): void {
    if (!this.isRunning || this.isPaused) {
      return;
    }
    
    this.isPaused = true;
    this.dataReplayService.pause();
    
    // Emit pause event
    this.emit('pause');
  }
  
  /**
   * Resume the backtest
   */
  public resume(): void {
    if (!this.isRunning || !this.isPaused) {
      return;
    }
    
    this.isPaused = false;
    this.dataReplayService.resume();
    
    // Emit resume event
    this.emit('resume');
  }
  
  /**
   * Cancel the backtest
   */
  public cancel(): void {
    if (!this.isRunning) {
      return;
    }
    
    this.isCancelled = true;
    this.dataReplayService.stop();
    
    // Emit cancel event
    this.emit('cancel');
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
    try {
      return this.calculateResults();
    } catch (error) {
      console.error('Error calculating current results:', error);
      return undefined;
    }
  }
  
  /**
   * Get the current progress
   * @returns Progress percentage (0-100)
   */
  public getProgress(): number {
    return this.dataReplayService.getProgress();
  }
  
  /**
   * Check if the backtest is running
   * @returns True if the backtest is running
   */
  public isBacktestRunning(): boolean {
    return this.isRunning;
  }
  
  /**
   * Check if the backtest is paused
   * @returns True if the backtest is paused
   */
  public isBacktestPaused(): boolean {
    return this.isPaused;
  }
  
  /**
   * Check if the backtest is cancelled
   * @returns True if the backtest is cancelled
   */
  public isBacktestCancelled(): boolean {
    return this.isCancelled;
  }
}

// Export the enhanced backtesting engine
export default EnhancedBacktestingEngine;