import { 
  UnifiedBacktestingService, 
  unifiedBacktestingService,
  BacktestConfig
} from '../services/backtesting';
import { MovingAverageCrossoverStrategy } from '../services/algorithmic-trading/strategies/MovingAverageCrossoverStrategy';
import { StrategyRegistry } from '../services/algorithmic-trading/registry/StrategyRegistry';

/**
 * Backtesting Demo
 * 
 * This script demonstrates how to use the backtesting framework to backtest
 * a simple moving average crossover strategy.
 */
async function runBacktestDemo() {
  try {
    console.log('Initializing backtesting service...');
    await unifiedBacktestingService.initialize();
    
    // Register the moving average crossover strategy
    const strategyRegistry = new StrategyRegistry();
    const strategyId = 'moving-average-crossover';
    
    strategyRegistry.registerStrategy({
      id: strategyId,
      name: 'Moving Average Crossover',
      description: 'A simple moving average crossover strategy',
      parameters: {
        shortPeriod: 10,
        longPeriod: 50
      }
    });
    
    // Create a backtest configuration
    const config: BacktestConfig = {
      name: 'MA Crossover Backtest',
      description: 'Backtest of Moving Average Crossover strategy on SPY',
      strategyId,
      symbols: ['SPY'],
      startDate: '2020-01-01',
      endDate: '2020-12-31',
      initialCapital: 100000,
      timeFrame: 'day',
      commissionType: 'PERCENTAGE',
      commissionValue: 0.1,
      slippageModel: 'PERCENTAGE',
      slippageValue: 0.05,
      dataSource: 'YAHOO_FINANCE',
      includeDividends: true,
      includeCorporateActions: true,
      executionDelay: 0,
      tags: ['demo', 'moving-average', 'SPY']
    };
    
    // Create the backtest configuration
    console.log('Creating backtest configuration...');
    const createdConfig = await unifiedBacktestingService.createBacktestConfig(config);
    
    // Execute the backtest
    console.log('Executing backtest...');
    const result = await unifiedBacktestingService.executeBacktest(createdConfig);
    
    // Print the results
    console.log('\nBacktest Results:');
    console.log('=================');
    console.log(`Strategy: ${result.strategyId}`);
    console.log(`Period: ${new Date(result.startDate).toLocaleDateString()} to ${new Date(result.endDate).toLocaleDateString()}`);
    console.log(`Initial Capital: $${result.initialCapital.toLocaleString()}`);
    console.log(`Final Capital: $${result.finalCapital.toLocaleString()}`);
    console.log(`Total Return: $${result.totalReturn.toLocaleString()} (${(result.totalReturn / result.initialCapital * 100).toFixed(2)}%)`);
    console.log(`Annualized Return: ${(result.annualizedReturn * 100).toFixed(2)}%`);
    console.log(`Max Drawdown: ${result.maxDrawdown.toFixed(2)}%`);
    console.log(`Sharpe Ratio: ${result.sharpeRatio.toFixed(2)}`);
    console.log(`Sortino Ratio: ${result.sortinoRatio.toFixed(2)}`);
    console.log(`Calmar Ratio: ${result.calmarRatio.toFixed(2)}`);
    console.log(`Total Trades: ${result.trades.length}`);
    
    // Get winning and losing trades
    const closedTrades = result.trades.filter(trade => trade.status === 'CLOSED');
    const winningTrades = closedTrades.filter(trade => (trade.pnl || 0) > 0);
    const losingTrades = closedTrades.filter(trade => (trade.pnl || 0) < 0);
    
    console.log(`Win Rate: ${(winningTrades.length / closedTrades.length * 100).toFixed(2)}%`);
    console.log(`Profit Factor: ${result.performanceMetrics.profitFactor.toFixed(2)}`);
    
    // Compare with a benchmark (SPY buy and hold)
    console.log('\nComparing with SPY buy and hold...');
    
    // In a real implementation, we would create another backtest for the benchmark
    // and compare the results using the compareBacktestResults method
    
    console.log('Backtesting demo completed successfully!');
  } catch (error) {
    console.error('Error running backtest demo:', error);
  }
}

// Run the demo
runBacktestDemo().catch(console.error);