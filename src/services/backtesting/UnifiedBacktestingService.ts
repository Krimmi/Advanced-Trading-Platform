import { v4 as uuidv4 } from 'uuid';
import EnhancedBacktestingEngine, { EnhancedBacktestConfig } from './EnhancedBacktestingEngine';
import { HistoricalDataService } from './HistoricalDataService';
import { TransactionCostModelingService, createDefaultTransactionCostModelConfig } from './TransactionCostModelingService';
import { PerformanceAnalyticsFramework } from './PerformanceAnalyticsFramework';
import { IStrategy } from '../algorithmic-trading/strategies/IStrategy';
import { StrategyFactory } from '../algorithmic-trading/registry/StrategyFactory';
import { StrategyRegistry } from '../algorithmic-trading/registry/StrategyRegistry';
import {
  BacktestConfig,
  BacktestResult,
  BacktestTrade,
  BacktestPosition,
  BacktestOrder,
  EquityCurvePoint,
  DrawdownPoint,
  MonthlyReturn,
  PerformanceMetrics,
  TradeStatistics,
  DataFrequency
} from '../../types/backtesting';

/**
 * Unified backtesting service
 * 
 * This service provides a unified interface for backtesting, integrating
 * all the backtesting components and providing a simple API for the frontend.
 */
export class UnifiedBacktestingService {
  private historicalDataService: HistoricalDataService;
  private transactionCostService: TransactionCostModelingService;
  private performanceAnalytics: PerformanceAnalyticsFramework;
  private strategyRegistry: StrategyRegistry;
  private strategyFactory: StrategyFactory;
  
  private activeBacktests: Map<string, EnhancedBacktestingEngine> = new Map();
  private backtestResults: Map<string, BacktestResult> = new Map();
  
  /**
   * Constructor
   */
  constructor() {
    this.historicalDataService = HistoricalDataService.getInstance();
    this.transactionCostService = new TransactionCostModelingService(createDefaultTransactionCostModelConfig());
    this.performanceAnalytics = new PerformanceAnalyticsFramework();
    this.strategyRegistry = new StrategyRegistry();
    this.strategyFactory = new StrategyFactory(this.strategyRegistry);
  }
  
  /**
   * Initialize the backtesting service
   */
  public async initialize(): Promise<void> {
    // Initialize the historical data service
    await this.historicalDataService.initialize();
    
    console.log('Unified Backtesting Service initialized');
  }
  
  /**
   * Create a new backtest configuration
   * @param config Backtest configuration
   * @returns Created backtest configuration with ID
   */
  public async createBacktestConfig(config: Omit<BacktestConfig, 'id' | 'createdAt'>): Promise<BacktestConfig> {
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    
    const backtestConfig: BacktestConfig = {
      ...config,
      id,
      createdAt
    };
    
    // In a real implementation, this would save to a database
    // For now, we'll just return the created config
    
    return backtestConfig;
  }
  
  /**
   * Execute a backtest with the given configuration
   * @param config Backtest configuration
   * @returns Backtest result
   */
  public async executeBacktest(config: BacktestConfig): Promise<BacktestResult> {
    try {
      // Convert BacktestConfig to EnhancedBacktestConfig
      const enhancedConfig: EnhancedBacktestConfig = {
        id: config.id,
        name: config.name,
        description: config.description,
        strategyId: config.strategyId,
        symbols: config.symbols,
        startDate: new Date(config.startDate),
        endDate: new Date(config.endDate),
        initialCapital: config.initialCapital,
        timeframe: this.mapTimeFrame(config.timeFrame),
        dataSource: this.mapDataSource(config.dataSource),
        transactionCostModel: {
          commission: {
            type: this.mapCommissionType(config.commissionType),
            value: config.commissionValue
          },
          slippage: {
            type: this.mapSlippageModel(config.slippageModel),
            value: config.slippageValue
          }
        },
        tags: config.tags,
        createdAt: config.createdAt ? new Date(config.createdAt) : undefined,
        updatedAt: config.updatedAt ? new Date(config.updatedAt) : undefined,
        userId: config.userId
      };
      
      // Create the backtesting engine
      const engine = new EnhancedBacktestingEngine(enhancedConfig);
      
      // Initialize the engine
      await engine.initialize();
      
      // Get the strategy
      const strategy = await this.getStrategy(config.strategyId);
      
      if (!strategy) {
        throw new Error(`Strategy with ID ${config.strategyId} not found`);
      }
      
      // Set the strategy
      engine.setStrategy(strategy);
      
      // Generate a unique ID for this backtest run
      const backtestId = uuidv4();
      
      // Store the engine in the active backtests map
      this.activeBacktests.set(backtestId, engine);
      
      // Start the backtest
      const startTime = Date.now();
      const result = await engine.run();
      const endTime = Date.now();
      
      // Update execution time
      result.executionTime = endTime - startTime;
      
      // Store the result
      this.backtestResults.set(backtestId, result);
      
      // Remove the engine from active backtests
      this.activeBacktests.delete(backtestId);
      
      return result;
    } catch (error) {
      console.error('Error executing backtest:', error);
      throw error;
    }
  }
  
  /**
   * Get a strategy by ID
   * @param strategyId Strategy ID
   * @returns Strategy instance or undefined if not found
   */
  private async getStrategy(strategyId: string): Promise<IStrategy | undefined> {
    try {
      // Get the strategy from the registry
      const strategyConfig = this.strategyRegistry.getStrategy(strategyId);
      
      if (!strategyConfig) {
        return undefined;
      }
      
      // Create the strategy instance
      return this.strategyFactory.createStrategy(strategyConfig);
    } catch (error) {
      console.error(`Error getting strategy with ID ${strategyId}:`, error);
      return undefined;
    }
  }
  
  /**
   * Get backtest result by ID
   * @param id Backtest result ID
   * @returns Backtest result
   */
  public getBacktestResult(id: string): BacktestResult | undefined {
    return this.backtestResults.get(id);
  }
  
  /**
   * Get all backtest results
   * @returns Array of backtest results
   */
  public getAllBacktestResults(): BacktestResult[] {
    return Array.from(this.backtestResults.values());
  }
  
  /**
   * Get detailed trades for a backtest result
   * @param resultId Backtest result ID
   * @returns Array of trades
   */
  public getBacktestTrades(resultId: string): BacktestTrade[] {
    const result = this.backtestResults.get(resultId);
    
    if (!result) {
      return [];
    }
    
    return result.trades;
  }
  
  /**
   * Get equity curve for a backtest result
   * @param resultId Backtest result ID
   * @returns Equity curve data
   */
  public getBacktestEquityCurve(resultId: string): EquityCurvePoint[] {
    const result = this.backtestResults.get(resultId);
    
    if (!result) {
      return [];
    }
    
    return result.equityCurve;
  }
  
  /**
   * Get drawdown curve for a backtest result
   * @param resultId Backtest result ID
   * @returns Drawdown curve data
   */
  public getBacktestDrawdownCurve(resultId: string): DrawdownPoint[] {
    const result = this.backtestResults.get(resultId);
    
    if (!result) {
      return [];
    }
    
    return result.drawdownCurve;
  }
  
  /**
   * Get monthly returns for a backtest result
   * @param resultId Backtest result ID
   * @returns Monthly returns data
   */
  public getBacktestMonthlyReturns(resultId: string): MonthlyReturn[] {
    const result = this.backtestResults.get(resultId);
    
    if (!result) {
      return [];
    }
    
    return result.monthlyReturns;
  }
  
  /**
   * Get performance metrics for a backtest result
   * @param resultId Backtest result ID
   * @returns Performance metrics
   */
  public getBacktestPerformanceMetrics(resultId: string): PerformanceMetrics | undefined {
    const result = this.backtestResults.get(resultId);
    
    if (!result) {
      return undefined;
    }
    
    return result.performanceMetrics;
  }
  
  /**
   * Compare multiple backtest results
   * @param resultIds Array of backtest result IDs to compare
   * @returns Comparison data
   */
  public compareBacktestResults(resultIds: string[]): {
    results: {
      id: string;
      name: string;
      metrics: PerformanceMetrics;
    }[];
    comparisonTable: {
      metric: string;
      values: { resultId: string; value: number }[];
    }[];
    bestPerformer: {
      resultId: string;
      name: string;
      metrics: Record<string, number>;
    };
  } {
    // Get the results
    const results = resultIds
      .map(id => this.backtestResults.get(id))
      .filter(result => result !== undefined) as BacktestResult[];
    
    if (results.length === 0) {
      throw new Error('No valid backtest results found for comparison');
    }
    
    // Create the comparison data
    const comparisonData = {
      results: results.map(result => ({
        id: result.id,
        name: `Backtest ${result.id.substring(0, 8)}`,
        metrics: result.performanceMetrics
      })),
      comparisonTable: [] as {
        metric: string;
        values: { resultId: string; value: number }[];
      }[],
      bestPerformer: {
        resultId: '',
        name: '',
        metrics: {} as Record<string, number>
      }
    };
    
    // Create the comparison table
    const metrics = [
      { key: 'totalReturn', name: 'Total Return', higherIsBetter: true },
      { key: 'annualizedReturn', name: 'Annualized Return', higherIsBetter: true },
      { key: 'sharpeRatio', name: 'Sharpe Ratio', higherIsBetter: true },
      { key: 'sortinoRatio', name: 'Sortino Ratio', higherIsBetter: true },
      { key: 'calmarRatio', name: 'Calmar Ratio', higherIsBetter: true },
      { key: 'maxDrawdown', name: 'Max Drawdown', higherIsBetter: false },
      { key: 'maxDrawdownPercentage', name: 'Max Drawdown %', higherIsBetter: false },
      { key: 'volatility', name: 'Volatility', higherIsBetter: false },
      { key: 'winRate', name: 'Win Rate', higherIsBetter: true },
      { key: 'profitFactor', name: 'Profit Factor', higherIsBetter: true },
      { key: 'expectancy', name: 'Expectancy', higherIsBetter: true },
      { key: 'recoveryFactor', name: 'Recovery Factor', higherIsBetter: true }
    ];
    
    for (const metric of metrics) {
      const values = results.map(result => ({
        resultId: result.id,
        value: (result.performanceMetrics as any)[metric.key] as number
      }));
      
      comparisonData.comparisonTable.push({
        metric: metric.name,
        values
      });
    }
    
    // Determine the best performer based on Sharpe ratio
    const bestPerformerIndex = results.reduce((bestIndex, result, currentIndex) => {
      if (currentIndex === 0) return 0;
      
      const currentSharpe = result.performanceMetrics.sharpeRatio;
      const bestSharpe = results[bestIndex].performanceMetrics.sharpeRatio;
      
      return currentSharpe > bestSharpe ? currentIndex : bestIndex;
    }, 0);
    
    const bestResult = results[bestPerformerIndex];
    
    comparisonData.bestPerformer = {
      resultId: bestResult.id,
      name: `Backtest ${bestResult.id.substring(0, 8)}`,
      metrics: {
        totalReturn: bestResult.performanceMetrics.totalReturn,
        annualizedReturn: bestResult.performanceMetrics.annualizedReturn,
        sharpeRatio: bestResult.performanceMetrics.sharpeRatio,
        sortinoRatio: bestResult.performanceMetrics.sortinoRatio,
        calmarRatio: bestResult.performanceMetrics.calmarRatio,
        maxDrawdown: bestResult.performanceMetrics.maxDrawdown,
        maxDrawdownPercentage: bestResult.performanceMetrics.maxDrawdownPercentage,
        winRate: bestResult.performanceMetrics.winRate,
        profitFactor: bestResult.performanceMetrics.profitFactor,
        expectancy: bestResult.performanceMetrics.expectancy
      }
    };
    
    return comparisonData;
  }
  
  /**
   * Cancel a running backtest
   * @param backtestId Backtest ID
   * @returns Success status
   */
  public cancelBacktest(backtestId: string): boolean {
    const engine = this.activeBacktests.get(backtestId);
    
    if (!engine) {
      return false;
    }
    
    engine.cancel();
    this.activeBacktests.delete(backtestId);
    
    return true;
  }
  
  /**
   * Get the progress of a running backtest
   * @param backtestId Backtest ID
   * @returns Progress percentage (0-100) or undefined if not found
   */
  public getBacktestProgress(backtestId: string): number | undefined {
    const engine = this.activeBacktests.get(backtestId);
    
    if (!engine) {
      return undefined;
    }
    
    return engine.getProgress();
  }
  
  /**
   * Check if historical data is available for the given tickers and time range
   * @param tickers Array of ticker symbols
   * @param startDate Start date
   * @param endDate End date
   * @param frequency Data frequency
   * @returns Availability status for each ticker
   */
  public async checkDataAvailability(
    tickers: string[],
    startDate: string,
    endDate: string,
    frequency: DataFrequency
  ): Promise<Record<string, boolean>> {
    try {
      const result: Record<string, boolean> = {};
      
      for (const ticker of tickers) {
        try {
          // Try to get a small sample of data to check availability
          const bars = await this.historicalDataService.getBars({
            symbol: ticker,
            timeframe: this.mapDataFrequency(frequency),
            start: new Date(startDate),
            end: new Date(endDate),
            limit: 1
          });
          
          result[ticker] = bars.length > 0;
        } catch (error) {
          console.error(`Error checking data availability for ${ticker}:`, error);
          result[ticker] = false;
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error checking data availability:', error);
      throw error;
    }
  }
  
  /**
   * Get available data frequencies for backtesting
   * @returns Array of available data frequencies
   */
  public getAvailableDataFrequencies(): { value: DataFrequency; label: string }[] {
    return [
      { value: 'minute', label: '1 Minute' },
      { value: '5minute', label: '5 Minutes' },
      { value: '15minute', label: '15 Minutes' },
      { value: '30minute', label: '30 Minutes' },
      { value: 'hour', label: '1 Hour' },
      { value: 'day', label: 'Daily' },
      { value: 'week', label: 'Weekly' }
    ];
  }
  
  /**
   * Map TimeFrame to string format for historical data service
   * @param timeFrame TimeFrame enum value
   * @returns String format for historical data service
   */
  private mapTimeFrame(timeFrame: string): string {
    switch (timeFrame) {
      case 'minute':
        return '1m';
      case '5minute':
        return '5m';
      case '15minute':
        return '15m';
      case '30minute':
        return '30m';
      case 'hour':
        return '1h';
      case 'day':
        return '1d';
      case 'week':
        return '1w';
      default:
        return '1d';
    }
  }
  
  /**
   * Map DataFrequency to string format for historical data service
   * @param frequency DataFrequency enum value
   * @returns String format for historical data service
   */
  private mapDataFrequency(frequency: DataFrequency): string {
    switch (frequency) {
      case 'minute':
        return '1m';
      case '5minute':
        return '5m';
      case '15minute':
        return '15m';
      case '30minute':
        return '30m';
      case 'hour':
        return '1h';
      case 'day':
        return '1d';
      case 'week':
        return '1w';
      default:
        return '1d';
    }
  }
  
  /**
   * Map DataSource to string format for historical data service
   * @param dataSource DataSource enum value
   * @returns String format for historical data service
   */
  private mapDataSource(dataSource: string): 'alpaca' | 'polygon' | 'iex' | 'csv' {
    switch (dataSource) {
      case 'FINANCIAL_MODELING_PREP':
        return 'alpaca'; // Fallback to Alpaca
      case 'ALPHA_VANTAGE':
        return 'alpaca'; // Fallback to Alpaca
      case 'YAHOO_FINANCE':
        return 'alpaca'; // Fallback to Alpaca
      case 'CUSTOM':
        return 'csv';
      default:
        return 'alpaca';
    }
  }
  
  /**
   * Map CommissionType to string format for transaction cost service
   * @param commissionType CommissionType enum value
   * @returns String format for transaction cost service
   */
  private mapCommissionType(commissionType: string): 'fixed' | 'percentage' | 'per_share' | 'tiered' | 'custom' {
    switch (commissionType) {
      case 'FIXED':
        return 'fixed';
      case 'PERCENTAGE':
        return 'percentage';
      case 'PER_SHARE':
        return 'per_share';
      case 'TIERED':
        return 'tiered';
      case 'CUSTOM':
        return 'custom';
      default:
        return 'percentage';
    }
  }
  
  /**
   * Map SlippageModel to string format for transaction cost service
   * @param slippageModel SlippageModel enum value
   * @returns String format for transaction cost service
   */
  private mapSlippageModel(slippageModel: string): 'none' | 'fixed' | 'percentage' | 'market_impact' | 'volume_based' | 'custom' {
    switch (slippageModel) {
      case 'NONE':
        return 'none';
      case 'FIXED':
        return 'fixed';
      case 'PERCENTAGE':
        return 'percentage';
      case 'MARKET_IMPACT':
        return 'market_impact';
      case 'CUSTOM':
        return 'custom';
      default:
        return 'percentage';
    }
  }
}

// Export singleton instance
export const unifiedBacktestingService = new UnifiedBacktestingService();