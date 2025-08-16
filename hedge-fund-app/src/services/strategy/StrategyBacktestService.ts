import { MarketDataService } from '../market/MarketDataService';
import { StrategyType } from './StrategyRecommendationService';

/**
 * Backtest result metrics
 */
export interface BacktestMetrics {
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  maxDrawdownDuration: number;
  winRate: number;
  profitFactor: number;
  calmarRatio: number;
  averageWin: number;
  averageLoss: number;
  bestTrade: number;
  worstTrade: number;
  tradeCount: number;
  profitableTradeCount: number;
  unprofitableTradeCount: number;
}

/**
 * Trade executed during backtest
 */
export interface BacktestTrade {
  entryDate: Date;
  entryPrice: number;
  exitDate: Date | null;
  exitPrice: number | null;
  quantity: number;
  side: 'long' | 'short';
  pnl: number;
  pnlPercentage: number;
  holdingPeriod: number;
  exitReason: string;
}

/**
 * Daily performance record during backtest
 */
export interface BacktestDailyPerformance {
  date: Date;
  equity: number;
  cash: number;
  holdings: number;
  dailyPnl: number;
  dailyReturn: number;
  drawdown: number;
  positions: Array<{
    symbol: string;
    quantity: number;
    marketValue: number;
    unrealizedPnl: number;
  }>;
}

/**
 * Backtest configuration options
 */
export interface BacktestConfig {
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  symbols: string[];
  strategyType: StrategyType;
  strategyParameters: Record<string, any>;
  commissionModel?: {
    percentage?: number;
    fixed?: number;
    minCommission?: number;
  };
  slippageModel?: {
    percentage?: number;
    fixed?: number;
  };
  rebalanceFrequency?: 'daily' | 'weekly' | 'monthly';
  includeDividends?: boolean;
  includeCorporateActions?: boolean;
  benchmark?: string;
  walkForward?: {
    enabled: boolean;
    trainPeriod: number; // days
    testPeriod: number; // days
    optimizationMetric: keyof BacktestMetrics;
  };
}

/**
 * Complete backtest results
 */
export interface BacktestResult {
  config: BacktestConfig;
  metrics: BacktestMetrics;
  trades: BacktestTrade[];
  dailyPerformance: BacktestDailyPerformance[];
  benchmarkPerformance?: {
    totalReturn: number;
    annualizedReturn: number;
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    dailyPerformance: Array<{
      date: Date;
      value: number;
      dailyReturn: number;
    }>;
  };
  walkForwardResults?: Array<{
    trainPeriod: {
      startDate: Date;
      endDate: Date;
    };
    testPeriod: {
      startDate: Date;
      endDate: Date;
    };
    optimizedParameters: Record<string, any>;
    testMetrics: BacktestMetrics;
  }>;
}

/**
 * Service for backtesting trading strategies with historical market data
 */
export class StrategyBacktestService {
  private marketDataService: MarketDataService;
  private backtestCache: Map<string, BacktestResult>;
  private readonly CACHE_TTL_MS = 3600000 * 24; // 24 hour cache TTL

  constructor(marketDataService: MarketDataService) {
    this.marketDataService = marketDataService;
    this.backtestCache = new Map();
  }

  /**
   * Run a backtest with the specified configuration
   * @param config Backtest configuration
   * @returns Backtest results
   */
  public async runBacktest(config: BacktestConfig): Promise<BacktestResult> {
    const cacheKey = this.generateCacheKey(config);
    const cachedResult = this.backtestCache.get(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }

    // Fetch historical data for the specified symbols and date range
    const historicalData = await this.fetchHistoricalData(config);
    
    // Run the appropriate strategy backtest based on strategy type
    let result: BacktestResult;
    
    if (config.walkForward?.enabled) {
      result = await this.runWalkForwardBacktest(config, historicalData);
    } else {
      result = await this.runStandardBacktest(config, historicalData);
    }
    
    // Add benchmark comparison if requested
    if (config.benchmark) {
      result.benchmarkPerformance = await this.calculateBenchmarkPerformance(
        config.benchmark,
        config.startDate,
        config.endDate,
        result.dailyPerformance.map(day => day.date)
      );
    }
    
    // Cache the result
    this.backtestCache.set(cacheKey, result);
    
    return result;
  }

  /**
   * Compare multiple strategy configurations
   * @param configs Array of backtest configurations to compare
   * @returns Array of backtest results
   */
  public async compareStrategies(configs: BacktestConfig[]): Promise<BacktestResult[]> {
    const results: BacktestResult[] = [];
    
    for (const config of configs) {
      const result = await this.runBacktest(config);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Generate a cache key based on backtest configuration
   */
  private generateCacheKey(config: BacktestConfig): string {
    return JSON.stringify({
      startDate: config.startDate.toISOString(),
      endDate: config.endDate.toISOString(),
      initialCapital: config.initialCapital,
      symbols: config.symbols.sort(),
      strategyType: config.strategyType,
      strategyParameters: config.strategyParameters,
      commissionModel: config.commissionModel,
      slippageModel: config.slippageModel,
      rebalanceFrequency: config.rebalanceFrequency,
      includeDividends: config.includeDividends,
      includeCorporateActions: config.includeCorporateActions,
      walkForward: config.walkForward
    });
  }

  /**
   * Fetch historical data for the specified symbols and date range
   */
  private async fetchHistoricalData(config: BacktestConfig): Promise<any> {
    const { symbols, startDate, endDate, includeDividends, includeCorporateActions } = config;
    
    // Add some buffer days before start date for indicators that need lookback
    const bufferDays = 100; // Enough for most indicators
    const bufferStartDate = new Date(startDate);
    bufferStartDate.setDate(bufferStartDate.getDate() - bufferDays);
    
    // Fetch OHLCV data for each symbol
    const symbolData: Record<string, any[]> = {};
    
    for (const symbol of symbols) {
      const data = await this.marketDataService.getHistoricalData(
        symbol,
        bufferStartDate,
        endDate,
        'daily',
        includeDividends,
        includeCorporateActions
      );
      
      symbolData[symbol] = data;
    }
    
    return symbolData;
  }

  /**
   * Run a standard backtest (no walk-forward optimization)
   */
  private async runStandardBacktest(config: BacktestConfig, historicalData: any): Promise<BacktestResult> {
    // Implement the backtest logic based on strategy type
    switch (config.strategyType) {
      case StrategyType.MOMENTUM:
        return this.runMomentumBacktest(config, historicalData);
      case StrategyType.MEAN_REVERSION:
        return this.runMeanReversionBacktest(config, historicalData);
      case StrategyType.TREND_FOLLOWING:
        return this.runTrendFollowingBacktest(config, historicalData);
      case StrategyType.SENTIMENT_BASED:
        return this.runSentimentBacktest(config, historicalData);
      // Add cases for other strategy types
      default:
        throw new Error(`Backtest not implemented for strategy type: ${config.strategyType}`);
    }
  }

  /**
   * Run a walk-forward optimization backtest
   */
  private async runWalkForwardBacktest(config: BacktestConfig, historicalData: any): Promise<BacktestResult> {
    if (!config.walkForward) {
      throw new Error("Walk-forward configuration is required");
    }
    
    const { trainPeriod, testPeriod, optimizationMetric } = config.walkForward;
    const { startDate, endDate } = config;
    
    // Calculate the number of walk-forward windows
    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const windowSize = trainPeriod + testPeriod;
    const numWindows = Math.floor(totalDays / testPeriod);
    
    const walkForwardResults: BacktestResult['walkForwardResults'] = [];
    const allTrades: BacktestTrade[] = [];
    const allDailyPerformance: BacktestDailyPerformance[] = [];
    
    // Run each walk-forward window
    for (let i = 0; i < numWindows; i++) {
      // Calculate train period dates
      const trainStartDate = new Date(startDate);
      trainStartDate.setDate(trainStartDate.getDate() + (i * testPeriod));
      
      const trainEndDate = new Date(trainStartDate);
      trainEndDate.setDate(trainEndDate.getDate() + trainPeriod);
      
      // Calculate test period dates
      const testStartDate = new Date(trainEndDate);
      
      const testEndDate = new Date(testStartDate);
      testEndDate.setDate(testEndDate.getDate() + testPeriod);
      
      // Ensure we don't go beyond the overall end date
      if (testEndDate > endDate) {
        testEndDate.setTime(endDate.getTime());
      }
      
      // Skip if test period is too short
      if (testEndDate <= testStartDate) {
        continue;
      }
      
      // Create train config
      const trainConfig: BacktestConfig = {
        ...config,
        startDate: trainStartDate,
        endDate: trainEndDate,
        walkForward: undefined // Disable nested walk-forward
      };
      
      // Optimize parameters using train data
      const optimizedParams = await this.optimizeParameters(
        trainConfig,
        historicalData,
        optimizationMetric
      );
      
      // Create test config with optimized parameters
      const testConfig: BacktestConfig = {
        ...config,
        startDate: testStartDate,
        endDate: testEndDate,
        strategyParameters: optimizedParams,
        walkForward: undefined // Disable nested walk-forward
      };
      
      // Run backtest on test period with optimized parameters
      const testResult = await this.runStandardBacktest(testConfig, historicalData);
      
      // Store walk-forward window results
      walkForwardResults.push({
        trainPeriod: {
          startDate: trainStartDate,
          endDate: trainEndDate
        },
        testPeriod: {
          startDate: testStartDate,
          endDate: testEndDate
        },
        optimizedParameters: optimizedParams,
        testMetrics: testResult.metrics
      });
      
      // Collect trades and daily performance
      allTrades.push(...testResult.trades);
      allDailyPerformance.push(...testResult.dailyPerformance);
    }
    
    // Sort daily performance by date
    allDailyPerformance.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Calculate overall metrics
    const metrics = this.calculateMetrics(allTrades, allDailyPerformance, config.initialCapital);
    
    return {
      config,
      metrics,
      trades: allTrades,
      dailyPerformance: allDailyPerformance,
      walkForwardResults
    };
  }

  /**
   * Optimize strategy parameters using grid search or other methods
   */
  private async optimizeParameters(
    config: BacktestConfig,
    historicalData: any,
    optimizationMetric: keyof BacktestMetrics
  ): Promise<Record<string, any>> {
    // This would implement parameter optimization using grid search or other methods
    // For now, return the original parameters
    return { ...config.strategyParameters };
  }

  /**
   * Run a momentum strategy backtest
   */
  private async runMomentumBacktest(config: BacktestConfig, historicalData: any): Promise<BacktestResult> {
    // This would implement a momentum strategy backtest
    // For now, return a placeholder result
    return this.generatePlaceholderBacktestResult(config);
  }

  /**
   * Run a mean reversion strategy backtest
   */
  private async runMeanReversionBacktest(config: BacktestConfig, historicalData: any): Promise<BacktestResult> {
    // This would implement a mean reversion strategy backtest
    // For now, return a placeholder result
    return this.generatePlaceholderBacktestResult(config);
  }

  /**
   * Run a trend following strategy backtest
   */
  private async runTrendFollowingBacktest(config: BacktestConfig, historicalData: any): Promise<BacktestResult> {
    // This would implement a trend following strategy backtest
    // For now, return a placeholder result
    return this.generatePlaceholderBacktestResult(config);
  }

  /**
   * Run a sentiment-based strategy backtest
   */
  private async runSentimentBacktest(config: BacktestConfig, historicalData: any): Promise<BacktestResult> {
    // This would implement a sentiment-based strategy backtest
    // For now, return a placeholder result
    return this.generatePlaceholderBacktestResult(config);
  }

  /**
   * Calculate benchmark performance for comparison
   */
  private async calculateBenchmarkPerformance(
    benchmarkSymbol: string,
    startDate: Date,
    endDate: Date,
    dates: Date[]
  ): Promise<BacktestResult['benchmarkPerformance']> {
    // Fetch benchmark data
    const benchmarkData = await this.marketDataService.getHistoricalData(
      benchmarkSymbol,
      startDate,
      endDate,
      'daily'
    );
    
    // Calculate benchmark performance metrics
    const dailyPerformance = benchmarkData.map((day: any) => ({
      date: new Date(day.date),
      value: day.adjustedClose,
      dailyReturn: day.dailyReturn || 0
    }));
    
    // Calculate benchmark metrics
    const totalReturn = (dailyPerformance[dailyPerformance.length - 1].value / dailyPerformance[0].value) - 1;
    const annualizedReturn = Math.pow(1 + totalReturn, 365 / dailyPerformance.length) - 1;
    const returns = dailyPerformance.map(day => day.dailyReturn);
    const volatility = this.calculateVolatility(returns);
    const sharpeRatio = annualizedReturn / volatility;
    const maxDrawdown = this.calculateMaxDrawdown(dailyPerformance.map(day => day.value));
    
    return {
      totalReturn,
      annualizedReturn,
      volatility,
      sharpeRatio,
      maxDrawdown,
      dailyPerformance
    };
  }

  /**
   * Calculate volatility from an array of returns
   */
  private calculateVolatility(returns: number[]): number {
    const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length;
    const squaredDiffs = returns.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / returns.length;
    return Math.sqrt(variance * 252); // Annualized
  }

  /**
   * Calculate maximum drawdown from an array of values
   */
  private calculateMaxDrawdown(values: number[]): number {
    let maxDrawdown = 0;
    let peak = values[0];
    
    for (const value of values) {
      if (value > peak) {
        peak = value;
      }
      
      const drawdown = (peak - value) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    return maxDrawdown;
  }

  /**
   * Calculate performance metrics from trades and daily performance
   */
  private calculateMetrics(
    trades: BacktestTrade[],
    dailyPerformance: BacktestDailyPerformance[],
    initialCapital: number
  ): BacktestMetrics {
    // Filter completed trades
    const completedTrades = trades.filter(trade => trade.exitDate !== null);
    
    // Calculate trade metrics
    const profitableTrades = completedTrades.filter(trade => trade.pnl > 0);
    const unprofitableTrades = completedTrades.filter(trade => trade.pnl <= 0);
    
    const tradeCount = completedTrades.length;
    const profitableTradeCount = profitableTrades.length;
    const unprofitableTradeCount = unprofitableTrades.length;
    
    const winRate = tradeCount > 0 ? profitableTradeCount / tradeCount : 0;
    
    const totalProfit = profitableTrades.reduce((sum, trade) => sum + trade.pnl, 0);
    const totalLoss = unprofitableTrades.reduce((sum, trade) => sum + Math.abs(trade.pnl), 0);
    
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
    
    const averageWin = profitableTrades.length > 0
      ? profitableTrades.reduce((sum, trade) => sum + trade.pnl, 0) / profitableTrades.length
      : 0;
    
    const averageLoss = unprofitableTrades.length > 0
      ? unprofitableTrades.reduce((sum, trade) => sum + trade.pnl, 0) / unprofitableTrades.length
      : 0;
    
    const bestTrade = completedTrades.length > 0
      ? Math.max(...completedTrades.map(trade => trade.pnl))
      : 0;
    
    const worstTrade = completedTrades.length > 0
      ? Math.min(...completedTrades.map(trade => trade.pnl))
      : 0;
    
    // Calculate portfolio metrics
    const firstDay = dailyPerformance[0];
    const lastDay = dailyPerformance[dailyPerformance.length - 1];
    
    const totalReturn = (lastDay.equity / initialCapital) - 1;
    
    const numDays = dailyPerformance.length;
    const annualizedReturn = Math.pow(1 + totalReturn, 365 / numDays) - 1;
    
    const dailyReturns = dailyPerformance.map(day => day.dailyReturn);
    const volatility = this.calculateVolatility(dailyReturns);
    
    const sharpeRatio = volatility > 0 ? annualizedReturn / volatility : 0;
    
    // Calculate Sortino ratio (downside deviation)
    const negativeReturns = dailyReturns.filter(ret => ret < 0);
    const downsideDeviation = negativeReturns.length > 0
      ? Math.sqrt(negativeReturns.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) / negativeReturns.length * 252)
      : 0;
    
    const sortinoRatio = downsideDeviation > 0 ? annualizedReturn / downsideDeviation : 0;
    
    // Calculate drawdown metrics
    const equityValues = dailyPerformance.map(day => day.equity);
    const maxDrawdown = this.calculateMaxDrawdown(equityValues);
    
    // Calculate drawdown duration
    let maxDrawdownDuration = 0;
    let currentDrawdownDuration = 0;
    let highWaterMark = initialCapital;
    
    for (const day of dailyPerformance) {
      if (day.equity >= highWaterMark) {
        highWaterMark = day.equity;
        currentDrawdownDuration = 0;
      } else {
        currentDrawdownDuration++;
        maxDrawdownDuration = Math.max(maxDrawdownDuration, currentDrawdownDuration);
      }
    }
    
    // Calculate Calmar ratio
    const calmarRatio = maxDrawdown > 0 ? annualizedReturn / maxDrawdown : 0;
    
    return {
      totalReturn,
      annualizedReturn,
      volatility,
      sharpeRatio,
      sortinoRatio,
      maxDrawdown,
      maxDrawdownDuration,
      winRate,
      profitFactor,
      calmarRatio,
      averageWin,
      averageLoss,
      bestTrade,
      worstTrade,
      tradeCount,
      profitableTradeCount,
      unprofitableTradeCount
    };
  }

  /**
   * Generate a placeholder backtest result for demonstration
   */
  private generatePlaceholderBacktestResult(config: BacktestConfig): BacktestResult {
    const startDate = config.startDate;
    const endDate = config.endDate;
    const daysBetween = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Generate daily performance data
    const dailyPerformance: BacktestDailyPerformance[] = [];
    let currentEquity = config.initialCapital;
    let currentCash = config.initialCapital;
    let currentHoldings = 0;
    let highWaterMark = config.initialCapital;
    
    for (let i = 0; i <= daysBetween; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      
      // Skip weekends
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        continue;
      }
      
      // Simulate daily return (random walk with slight upward bias)
      const dailyReturn = (Math.random() * 0.02) - 0.005;
      
      // Update equity
      currentEquity = currentEquity * (1 + dailyReturn);
      
      // Update holdings and cash based on simulated trades
      if (i % 5 === 0) { // Simulate rebalancing every 5 days
        currentHoldings = currentEquity * 0.8;
        currentCash = currentEquity * 0.2;
      }
      
      // Calculate drawdown
      highWaterMark = Math.max(highWaterMark, currentEquity);
      const drawdown = (highWaterMark - currentEquity) / highWaterMark;
      
      dailyPerformance.push({
        date: new Date(currentDate),
        equity: currentEquity,
        cash: currentCash,
        holdings: currentHoldings,
        dailyPnl: currentEquity * dailyReturn,
        dailyReturn,
        drawdown,
        positions: [
          {
            symbol: config.symbols[0],
            quantity: 100,
            marketValue: currentHoldings,
            unrealizedPnl: currentHoldings * dailyReturn
          }
        ]
      });
    }
    
    // Generate trade data
    const trades: BacktestTrade[] = [];
    let tradeDate = new Date(startDate);
    
    while (tradeDate < endDate) {
      // Skip weekends
      if (tradeDate.getDay() !== 0 && tradeDate.getDay() !== 6) {
        const entryPrice = 100 + Math.random() * 10;
        
        // Calculate exit date (1-10 days later)
        const holdingPeriod = Math.floor(Math.random() * 10) + 1;
        const exitDate = new Date(tradeDate);
        exitDate.setDate(exitDate.getDate() + holdingPeriod);
        
        if (exitDate <= endDate) {
          const exitPrice = entryPrice * (1 + ((Math.random() * 0.1) - 0.03));
          const quantity = Math.floor(10000 / entryPrice);
          const pnl = (exitPrice - entryPrice) * quantity;
          const pnlPercentage = (exitPrice / entryPrice) - 1;
          
          trades.push({
            entryDate: new Date(tradeDate),
            entryPrice,
            exitDate,
            exitPrice,
            quantity,
            side: Math.random() > 0.3 ? 'long' : 'short',
            pnl,
            pnlPercentage,
            holdingPeriod,
            exitReason: Math.random() > 0.7 ? 'target_reached' : 'signal_exit'
          });
        }
      }
      
      // Move to next day
      tradeDate.setDate(tradeDate.getDate() + 1);
    }
    
    // Calculate metrics
    const metrics = this.calculateMetrics(trades, dailyPerformance, config.initialCapital);
    
    return {
      config,
      metrics,
      trades,
      dailyPerformance
    };
  }
}