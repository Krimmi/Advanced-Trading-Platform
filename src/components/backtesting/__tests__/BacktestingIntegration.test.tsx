import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import BacktestingDashboard from '../BacktestingDashboard';
import { 
  BacktestingService, 
  StrategyExecutionService, 
  OptimizationService,
  MarketSimulationService
} from '../../../services';
import { 
  Strategy, 
  BacktestResult, 
  BacktestConfig,
  BacktestStatus
} from '../../../types/backtesting';

// Mock the services
jest.mock('../../../services', () => {
  // Sample strategy for testing
  const mockStrategy = {
    id: 'strategy-1',
    name: 'Moving Average Crossover',
    description: 'Simple moving average crossover strategy',
    type: 'technical',
    rules: [
      {
        id: 'rule-1',
        name: 'Entry Rule',
        description: 'Enter when short MA crosses above long MA',
        conditions: [
          {
            id: 'condition-1',
            type: 'indicator',
            indicator: 'sma',
            parameters: { period: 20 },
            operator: 'crosses_above',
            valueType: 'indicator',
            value: 'sma',
            valueParameter: 'period',
            lookback: 1
          }
        ],
        actions: [
          {
            id: 'action-1',
            type: 'enter_long',
            parameters: {}
          }
        ],
        logicOperator: 'and',
        enabled: true,
        priority: 1
      }
    ],
    parameters: {
      shortPeriod: 20,
      longPeriod: 50
    },
    riskManagement: [
      {
        id: 'risk-1',
        type: 'stop_loss',
        parameters: { percentage: 2 },
        enabled: true
      }
    ],
    positionSizing: {
      type: 'percentage_of_equity',
      parameters: { percentage: 10 }
    },
    isPublic: false,
    version: '1.0.0'
  };

  // Sample backtest result for testing
  const mockBacktestResult = {
    id: 'backtest-1',
    configId: 'config-1',
    strategyId: 'strategy-1',
    startDate: '2023-01-01T00:00:00Z',
    endDate: '2023-12-31T00:00:00Z',
    initialCapital: 100000,
    finalCapital: 120000,
    totalReturn: 20,
    annualizedReturn: 20,
    maxDrawdown: 8,
    sharpeRatio: 1.8,
    winRate: 62,
    profitFactor: 2.1,
    totalTrades: 120,
    performanceMetrics: {
      totalReturn: 20,
      annualizedReturn: 20,
      maxDrawdown: 8,
      sharpeRatio: 1.8,
      sortinoRatio: 2.5,
      calmarRatio: 2.5,
      winRate: 62,
      profitFactor: 2.1,
      expectancy: 166.67,
      averageWin: 500,
      averageLoss: -300,
      largestWin: 3000,
      largestLoss: -1500,
      recoveryFactor: 2.5,
      payoffRatio: 1.67,
      maxConsecutiveWins: 8,
      maxConsecutiveLosses: 3
    },
    createdAt: '2023-01-01T00:00:00Z',
    status: 'completed'
  };

  return {
    BacktestingService: jest.fn().mockImplementation(() => ({
      getBacktestResults: jest.fn().mockResolvedValue([mockBacktestResult]),
      getBacktestResult: jest.fn().mockResolvedValue(mockBacktestResult),
      createBacktestConfig: jest.fn().mockImplementation((config) => ({
        ...config,
        id: 'config-1',
        createdAt: '2023-01-01T00:00:00Z'
      })),
      executeBacktest: jest.fn().mockResolvedValue(mockBacktestResult),
      getBacktestEquityCurve: jest.fn().mockResolvedValue([
        { date: '2023-01-01', equity: 100000, return: 0, drawdown: 0 },
        { date: '2023-06-30', equity: 110000, return: 10, drawdown: 2 },
        { date: '2023-12-31', equity: 120000, return: 20, drawdown: 5 }
      ]),
      getBacktestDrawdownCurve: jest.fn().mockResolvedValue([
        { date: '2023-01-01', equity: 100000, drawdown: 0, drawdownPercentage: 0 },
        { date: '2023-06-30', equity: 110000, drawdown: 2000, drawdownPercentage: 2 },
        { date: '2023-12-31', equity: 120000, drawdown: 6000, drawdownPercentage: 5 }
      ]),
      getBacktestMonthlyReturns: jest.fn().mockResolvedValue([
        { year: 2023, month: 1, return: 0.02 },
        { year: 2023, month: 2, return: 0.03 },
        { year: 2023, month: 3, return: -0.01 }
      ]),
      getBacktestTrades: jest.fn().mockResolvedValue([
        {
          id: 'trade-1',
          backtestId: 'backtest-1',
          symbol: 'AAPL',
          direction: 'long',
          entryDate: '2023-01-15T10:00:00Z',
          entryPrice: 150.25,
          exitDate: '2023-01-20T14:30:00Z',
          exitPrice: 155.75,
          quantity: 100,
          profit: 550,
          profitPercentage: 3.66,
          holdingPeriod: 5
        }
      ]),
      getBacktestConfigs: jest.fn().mockResolvedValue([
        {
          id: 'config-1',
          strategyId: 'strategy-1',
          startDate: '2023-01-01T00:00:00Z',
          endDate: '2023-12-31T00:00:00Z',
          initialCapital: 100000,
          commission: 0.001,
          slippage: 0.001,
          createdAt: '2023-01-01T00:00:00Z'
        }
      ]),
      deleteBacktestResult: jest.fn().mockResolvedValue({ success: true }),
      duplicateBacktest: jest.fn().mockResolvedValue({
        ...mockBacktestResult,
        id: 'backtest-2',
        configId: 'config-2'
      })
    })),
    StrategyExecutionService: jest.fn().mockImplementation(() => ({
      getStrategies: jest.fn().mockResolvedValue([mockStrategy]),
      getStrategy: jest.fn().mockResolvedValue(mockStrategy),
      createStrategy: jest.fn().mockImplementation((strategy) => ({
        ...strategy,
        id: 'strategy-2',
        createdAt: '2023-01-01T00:00:00Z'
      })),
      updateStrategy: jest.fn().mockImplementation((strategy) => ({
        ...strategy,
        updatedAt: '2023-01-02T00:00:00Z'
      })),
      deleteStrategy: jest.fn().mockResolvedValue({ success: true })
    })),
    OptimizationService: jest.fn().mockImplementation(() => ({
      createOptimizationConfig: jest.fn().mockImplementation((config) => ({
        ...config,
        id: 'optimization-config-1',
        createdAt: '2023-01-01T00:00:00Z'
      })),
      executeOptimization: jest.fn().mockResolvedValue({
        id: 'optimization-1',
        configId: 'optimization-config-1',
        status: 'completed',
        iterations: [
          {
            id: 'iteration-1',
            parameters: { shortPeriod: 15, longPeriod: 50 },
            objectiveValue: 2.1,
            metrics: { sharpeRatio: 2.1, totalReturn: 25 },
            rank: 1
          },
          {
            id: 'iteration-2',
            parameters: { shortPeriod: 20, longPeriod: 50 },
            objectiveValue: 1.8,
            metrics: { sharpeRatio: 1.8, totalReturn: 20 },
            rank: 2
          }
        ],
        bestParameters: { shortPeriod: 15, longPeriod: 50 },
        bestObjectiveValue: 2.1,
        executionTime: 5000,
        createdAt: '2023-01-01T00:00:00Z',
        completedAt: '2023-01-01T00:01:00Z'
      }),
      getOptimizationProgress: jest.fn().mockResolvedValue(100),
      getOptimizationResult: jest.fn().mockResolvedValue({
        id: 'optimization-1',
        configId: 'optimization-config-1',
        status: 'completed',
        iterations: [
          {
            id: 'iteration-1',
            parameters: { shortPeriod: 15, longPeriod: 50 },
            objectiveValue: 2.1,
            metrics: { sharpeRatio: 2.1, totalReturn: 25 },
            rank: 1
          },
          {
            id: 'iteration-2',
            parameters: { shortPeriod: 20, longPeriod: 50 },
            objectiveValue: 1.8,
            metrics: { sharpeRatio: 1.8, totalReturn: 20 },
            rank: 2
          }
        ],
        bestParameters: { shortPeriod: 15, longPeriod: 50 },
        bestObjectiveValue: 2.1,
        executionTime: 5000,
        createdAt: '2023-01-01T00:00:00Z',
        completedAt: '2023-01-01T00:01:00Z'
      }),
      applyOptimizedParameters: jest.fn().mockImplementation((strategyId, optimizationResultId) => ({
        ...mockStrategy,
        id: strategyId,
        parameters: { shortPeriod: 15, longPeriod: 50 },
        updatedAt: '2023-01-02T00:00:00Z'
      }))
    })),
    MarketSimulationService: jest.fn().mockImplementation(() => ({
      getSimulationScenarios: jest.fn().mockResolvedValue([
        {
          type: 'marketCrash',
          name: 'Market Crash',
          description: 'Simulates a severe market crash scenario',
          parameters: [
            {
              name: 'crashSeverity',
              label: 'Crash Severity',
              type: 'number',
              defaultValue: 0.3,
              min: 0.1,
              max: 0.7,
              step: 0.1
            }
          ]
        }
      ]),
      createSimulation: jest.fn().mockResolvedValue('simulation-1'),
      getSimulationProgress: jest.fn().mockResolvedValue(100),
      getSimulationResult: jest.fn().mockResolvedValue({
        id: 'simulation-1',
        backtestId: 'backtest-1',
        scenarioType: 'marketCrash',
        parameters: { crashSeverity: 0.3 },
        duration: 30,
        startDate: '2023-01-01T00:00:00Z',
        endDate: '2023-01-31T00:00:00Z',
        initialCapital: 100000,
        finalCapital: 85000,
        totalReturn: -15,
        maxDrawdown: 22,
        trades: [],
        equityCurve: [],
        createdAt: '2023-01-01T00:00:00Z'
      })
    }))
  };
});

// Create a theme for testing
const theme = createTheme();

describe('Backtesting Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('complete backtesting workflow', async () => {
    render(
      <ThemeProvider theme={theme}>
        <BacktestingDashboard />
      </ThemeProvider>
    );

    // Wait for initial data to load
    await waitFor(() => {
      expect(StrategyExecutionService.prototype.getStrategies).toHaveBeenCalled();
      expect(BacktestingService.prototype.getBacktestResults).toHaveBeenCalled();
    });

    // 1. Strategy Builder Tab
    // Check that the strategy builder tab is active
    expect(screen.getByText(/Strategy Builder/i)).toBeInTheDocument();
    
    // Select an existing strategy
    const strategySelect = screen.getByLabelText(/Select Strategy/i);
    fireEvent.mouseDown(strategySelect);
    fireEvent.click(screen.getByText(/Moving Average Crossover/i));
    
    // Wait for strategy to load
    await waitFor(() => {
      expect(screen.getByDisplayValue(/Moving Average Crossover/i)).toBeInTheDocument();
    });
    
    // 2. Create Backtest Tab
    // Navigate to create backtest tab
    fireEvent.click(screen.getByText(/Create Backtest/i));
    
    // Wait for backtest config panel to load
    await waitFor(() => {
      expect(screen.getByText(/Backtest Configuration/i)).toBeInTheDocument();
    });
    
    // Configure backtest
    const startDateInput = screen.getByLabelText(/Start Date/i);
    fireEvent.change(startDateInput, { target: { value: '2023-01-01' } });
    
    const endDateInput = screen.getByLabelText(/End Date/i);
    fireEvent.change(endDateInput, { target: { value: '2023-12-31' } });
    
    const initialCapitalInput = screen.getByLabelText(/Initial Capital/i);
    fireEvent.change(initialCapitalInput, { target: { value: '100000' } });
    
    // Run backtest
    fireEvent.click(screen.getByText(/Run Backtest/i));
    
    // Wait for backtest to complete
    await waitFor(() => {
      expect(BacktestingService.prototype.executeBacktest).toHaveBeenCalled();
    });
    
    // 3. Results Tab
    // Navigate to results tab
    fireEvent.click(screen.getByText(/Results/i));
    
    // Wait for results to load
    await waitFor(() => {
      expect(screen.getByText(/Performance Results/i)).toBeInTheDocument();
      expect(screen.getByText(/20%/i)).toBeInTheDocument(); // Total return
    });
    
    // 4. Optimization Tab
    // Navigate to strategy builder tab
    fireEvent.click(screen.getByText(/Strategy Builder/i));
    
    // Click optimize button
    fireEvent.click(screen.getByText(/Optimize/i));
    
    // Wait for optimization panel to load
    await waitFor(() => {
      expect(screen.getByText(/Strategy Optimization/i)).toBeInTheDocument();
    });
    
    // Run optimization
    fireEvent.click(screen.getByText(/Run Optimization/i));
    
    // Wait for optimization to complete
    await waitFor(() => {
      expect(OptimizationService.prototype.executeOptimization).toHaveBeenCalled();
      expect(screen.getByText(/Optimization Results/i)).toBeInTheDocument();
    });
    
    // Apply optimized parameters
    fireEvent.click(screen.getByText(/Apply to Strategy/i));
    
    // Wait for parameters to be applied
    await waitFor(() => {
      expect(OptimizationService.prototype.applyOptimizedParameters).toHaveBeenCalled();
    });
    
    // 5. Simulation Tab
    // Navigate to results tab
    fireEvent.click(screen.getByText(/Results/i));
    
    // Click simulate button
    fireEvent.click(screen.getByText(/Simulate/i));
    
    // Wait for simulation panel to load
    await waitFor(() => {
      expect(screen.getByText(/Market Simulation/i)).toBeInTheDocument();
    });
    
    // Configure simulation
    const scenarioSelect = screen.getByLabelText(/Scenario Type/i);
    fireEvent.mouseDown(scenarioSelect);
    fireEvent.click(screen.getByText(/Market Crash/i));
    
    // Run simulation
    fireEvent.click(screen.getByText(/Run Simulation/i));
    
    // Wait for simulation to complete
    await waitFor(() => {
      expect(MarketSimulationService.prototype.createSimulation).toHaveBeenCalled();
      expect(screen.getByText(/Simulation Results/i)).toBeInTheDocument();
      expect(screen.getByText(/-15%/i)).toBeInTheDocument(); // Simulation return
    });
    
    // 6. History Tab
    // Navigate to history tab
    fireEvent.click(screen.getByText(/History/i));
    
    // Wait for history to load
    await waitFor(() => {
      expect(screen.getByText(/Backtest History/i)).toBeInTheDocument();
      expect(screen.getByText(/config-1/i)).toBeInTheDocument();
    });
    
    // 7. Compare Tab
    // Select backtest for comparison
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    // Navigate to compare tab
    fireEvent.click(screen.getByText(/Compare/i));
    
    // Wait for comparison panel to load
    await waitFor(() => {
      expect(screen.getByText(/Backtest Comparison/i)).toBeInTheDocument();
      expect(screen.getByText(/Select at least two backtests to compare/i)).toBeInTheDocument();
    });
  });
});