import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import BacktestComparisonPanel from '../BacktestComparisonPanel';
import { BacktestingService } from '../../../services';
import { BacktestResult } from '../../../types/backtesting/backtestingTypes';

// Mock the services
jest.mock('../../../services', () => ({
  BacktestingService: jest.fn().mockImplementation(() => ({
    getBacktestEquityCurve: jest.fn().mockResolvedValue([
      { date: '2024-01-01', equity: 100000, return: 0, drawdown: 0 },
      { date: '2024-01-02', equity: 101000, return: 0.01, drawdown: 0 },
      { date: '2024-01-03', equity: 102000, return: 0.01, drawdown: 0 }
    ]),
    getBacktestDrawdownCurve: jest.fn().mockResolvedValue([
      { date: '2024-01-01', equity: 100000, drawdown: 0, drawdownPercentage: 0 },
      { date: '2024-01-02', equity: 101000, drawdown: 0, drawdownPercentage: 0 },
      { date: '2024-01-03', equity: 102000, drawdown: 0, drawdownPercentage: 0 }
    ]),
    getBacktestMonthlyReturns: jest.fn().mockResolvedValue([
      { year: 2024, month: 1, return: 0.02 },
      { year: 2024, month: 2, return: 0.03 },
      { year: 2024, month: 3, return: -0.01 }
    ]),
    getBacktestTradeStatistics: jest.fn().mockResolvedValue({
      totalTrades: 100,
      winningTrades: 60,
      losingTrades: 40,
      breakEvenTrades: 0,
      winRate: 60,
      averageWin: 1000,
      averageLoss: -500,
      largestWin: 5000,
      largestLoss: -2000,
      averageHoldingPeriod: 5,
      maxConsecutiveWins: 5,
      maxConsecutiveLosses: 3
    })
  }))
}));

// Sample backtest results for testing
const mockBacktestResults: BacktestResult[] = [
  {
    id: 'backtest-1',
    configId: 'config-1',
    strategyId: 'strategy-1',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-03-31T00:00:00Z',
    initialCapital: 100000,
    finalCapital: 110000,
    totalReturn: 10,
    annualizedReturn: 40,
    maxDrawdown: 5,
    sharpeRatio: 2.0,
    winRate: 60,
    profitFactor: 2.0,
    totalTrades: 100,
    performanceMetrics: {
      totalReturn: 10,
      annualizedReturn: 40,
      maxDrawdown: 5,
      sharpeRatio: 2.0,
      sortinoRatio: 3.0,
      calmarRatio: 8.0,
      winRate: 60,
      profitFactor: 2.0,
      expectancy: 250,
      averageWin: 1000,
      averageLoss: -500,
      largestWin: 5000,
      largestLoss: -2000,
      recoveryFactor: 2.0,
      payoffRatio: 2.0,
      maxConsecutiveWins: 5,
      maxConsecutiveLosses: 3
    },
    createdAt: '2024-01-01T00:00:00Z',
    status: 'completed'
  },
  {
    id: 'backtest-2',
    configId: 'config-2',
    strategyId: 'strategy-2',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-03-31T00:00:00Z',
    initialCapital: 100000,
    finalCapital: 105000,
    totalReturn: 5,
    annualizedReturn: 20,
    maxDrawdown: 3,
    sharpeRatio: 1.5,
    winRate: 55,
    profitFactor: 1.8,
    totalTrades: 80,
    performanceMetrics: {
      totalReturn: 5,
      annualizedReturn: 20,
      maxDrawdown: 3,
      sharpeRatio: 1.5,
      sortinoRatio: 2.0,
      calmarRatio: 6.7,
      winRate: 55,
      profitFactor: 1.8,
      expectancy: 200,
      averageWin: 900,
      averageLoss: -500,
      largestWin: 4000,
      largestLoss: -1500,
      recoveryFactor: 1.7,
      payoffRatio: 1.8,
      maxConsecutiveWins: 4,
      maxConsecutiveLosses: 2
    },
    createdAt: '2024-01-01T00:00:00Z',
    status: 'completed'
  }
];

// Create a theme for testing
const theme = createTheme();

describe('BacktestComparisonPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly with selected results', () => {
    render(
      <ThemeProvider theme={theme}>
        <BacktestComparisonPanel 
          selectedResults={mockBacktestResults}
          backtestResults={mockBacktestResults}
          onResultsSelected={jest.fn()}
        />
      </ThemeProvider>
    );

    // Check that the component renders with the backtest results
    expect(screen.getByText(/Backtest Comparison/i)).toBeInTheDocument();
    expect(screen.getByText('config-1')).toBeInTheDocument();
    expect(screen.getByText('config-2')).toBeInTheDocument();
  });

  test('renders empty state when no results are selected', () => {
    render(
      <ThemeProvider theme={theme}>
        <BacktestComparisonPanel 
          selectedResults={[]}
          backtestResults={mockBacktestResults}
          onResultsSelected={jest.fn()}
        />
      </ThemeProvider>
    );

    expect(screen.getByText(/Select at least two backtests to compare/i)).toBeInTheDocument();
  });

  test('allows adding a backtest to comparison', () => {
    const onResultsSelected = jest.fn();
    
    render(
      <ThemeProvider theme={theme}>
        <BacktestComparisonPanel 
          selectedResults={[mockBacktestResults[0]]}
          backtestResults={mockBacktestResults}
          onResultsSelected={onResultsSelected}
        />
      </ThemeProvider>
    );

    // Open the select dropdown
    fireEvent.mouseDown(screen.getByLabelText(/Select Backtest/i));
    
    // Select the second backtest
    fireEvent.click(screen.getByText(/config-2/i));

    // Check that onResultsSelected was called with both backtests
    expect(onResultsSelected).toHaveBeenCalledWith([
      mockBacktestResults[0],
      mockBacktestResults[1]
    ]);
  });

  test('allows removing a backtest from comparison', () => {
    const onResultsSelected = jest.fn();
    
    render(
      <ThemeProvider theme={theme}>
        <BacktestComparisonPanel 
          selectedResults={mockBacktestResults}
          backtestResults={mockBacktestResults}
          onResultsSelected={onResultsSelected}
        />
      </ThemeProvider>
    );

    // Find and click the delete button for the first backtest
    const deleteButtons = screen.getAllByRole('button', { name: /remove/i });
    fireEvent.click(deleteButtons[0]);

    // Check that onResultsSelected was called with the remaining backtest
    expect(onResultsSelected).toHaveBeenCalledWith([mockBacktestResults[1]]);
  });

  test('fetches comparison data when metric is selected', async () => {
    render(
      <ThemeProvider theme={theme}>
        <BacktestComparisonPanel 
          selectedResults={mockBacktestResults}
          backtestResults={mockBacktestResults}
          onResultsSelected={jest.fn()}
        />
      </ThemeProvider>
    );

    // Select a comparison metric
    fireEvent.mouseDown(screen.getByLabelText(/Comparison Metric/i));
    fireEvent.click(screen.getByText(/Equity Curve/i));

    // Check that the service methods were called
    await waitFor(() => {
      expect(BacktestingService.prototype.getBacktestEquityCurve).toHaveBeenCalledTimes(2);
      expect(BacktestingService.prototype.getBacktestEquityCurve).toHaveBeenCalledWith('backtest-1');
      expect(BacktestingService.prototype.getBacktestEquityCurve).toHaveBeenCalledWith('backtest-2');
    });
  });

  test('changes comparison data when different metric is selected', async () => {
    render(
      <ThemeProvider theme={theme}>
        <BacktestComparisonPanel 
          selectedResults={mockBacktestResults}
          backtestResults={mockBacktestResults}
          onResultsSelected={jest.fn()}
        />
      </ThemeProvider>
    );

    // Select equity curve metric
    fireEvent.mouseDown(screen.getByLabelText(/Comparison Metric/i));
    fireEvent.click(screen.getByText(/Equity Curve/i));

    // Wait for equity curve data to be fetched
    await waitFor(() => {
      expect(BacktestingService.prototype.getBacktestEquityCurve).toHaveBeenCalledTimes(2);
    });

    // Change to drawdown metric
    fireEvent.mouseDown(screen.getByLabelText(/Comparison Metric/i));
    fireEvent.click(screen.getByText(/Drawdown/i));

    // Check that drawdown data was fetched
    await waitFor(() => {
      expect(BacktestingService.prototype.getBacktestDrawdownCurve).toHaveBeenCalledTimes(2);
    });
  });
});