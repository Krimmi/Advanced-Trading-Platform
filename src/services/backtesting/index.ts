// Import original services
import BacktestingService from './backtestingService';
import StrategyExecutionService from './strategyExecutionService';
import MarketSimulationService from './marketSimulationService';
import PerformanceAnalyticsService from './performanceAnalyticsService';
import DataProviderService from './dataProviderService';
import OptimizationService from './optimizationService';
import MonteCarloService from './monteCarloService';

// Import new services
import { HistoricalDataService, historicalDataService } from './HistoricalDataService';
import { HistoricalDataReplayService, historicalDataReplayService } from './HistoricalDataReplayService';
import { TransactionCostModelingService, createDefaultTransactionCostModelConfig, transactionCostModelingService } from './TransactionCostModelingService';
import { PerformanceAnalyticsFramework, performanceAnalyticsFramework } from './PerformanceAnalyticsFramework';
import EnhancedBacktestingEngine from './EnhancedBacktestingEngine';
import { UnifiedBacktestingService, unifiedBacktestingService } from './UnifiedBacktestingService';
import BacktestingEngine from './BacktestingEngine';

// Import extensions
import './optimizationServiceExtensions';
import './backtestingServiceExtensions';
import './marketSimulationServiceExtensions';

// Export original services
export {
  BacktestingService,
  StrategyExecutionService,
  MarketSimulationService,
  PerformanceAnalyticsService,
  DataProviderService,
  OptimizationService,
  MonteCarloService
};

// Export new services
export {
  HistoricalDataService,
  historicalDataService,
  HistoricalDataReplayService,
  historicalDataReplayService,
  TransactionCostModelingService,
  createDefaultTransactionCostModelConfig,
  transactionCostModelingService,
  PerformanceAnalyticsFramework,
  performanceAnalyticsFramework,
  EnhancedBacktestingEngine,
  UnifiedBacktestingService,
  unifiedBacktestingService,
  BacktestingEngine
};

// Export types
export * from '../../types/backtesting';