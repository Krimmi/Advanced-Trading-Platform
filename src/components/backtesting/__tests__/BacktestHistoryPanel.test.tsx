import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import BacktestHistoryPanel from '../BacktestHistoryPanel';
import { BacktestingService } from '../../../services';
import { BacktestResult, BacktestStatus } from '../../../types/backtesting';

// Mock the services
jest.mock('../../../services', () => ({
  BacktestingService: jest.fn().mockImplementation(() => ({
    deleteBacktestResult: jest.fn().mockResolvedValue({ success: true }),
    duplicateBacktest: jest.fn().mockResolvedValue({ id: 'backtest-duplicate-1' })
  }))
}));

// Sample backtest results for testing
const mockBacktestResults: BacktestResult[] = [
  {
    id: 'backtest-1',
    configId: 'config-1',
    strategyId: 'strategy-1',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-12-31T00:00:00Z',
    initialCapital: 100000,
    finalCapital: 125000,
    totalReturn: 25,
    annualizedReturn: 25,
    maxDrawdown: 10,
    sharpeRatio: 1.5,
    winRate: 60,
    profitFactor: 2.0,
    totalTrades: 100,
    performanceMetrics: {
      totalReturn: 25,
      annualizedReturn: 25,
      maxDrawdown: 10,
      sharpeRatio: 1.5,
      sortinoRatio: 2.0,
      calmarRatio: 2.5,
      winRate: 60,
      profitFactor: 2.0,
      expectancy: 250,
      averageWin: 1000,
      averageLoss: -500,
      largestWin: 5000,
      largestLoss: -2000,
      recoveryFactor: 2.5,
      payoffRatio: 2.0,
      maxConsecutiveWins: 5,
      maxConsecutiveLosses: 3
    },
    createdAt: '2024-01-01T00:00:00Z',
    status: BacktestStatus.COMPLETED
  },
  {
    id: 'backtest-2',
    configId: 'config-2',
    strategyId: 'strategy-2',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-06-30T00:00:00Z',
    initialCapital: 100000,
    finalCapital: 90000,
    totalReturn: -10,
    annualizedReturn: -20,
    maxDrawdown: 15,
    sharpeRatio: -0.5,
    winRate: 40,
    profitFactor: 0.8,
    totalTrades: 50,
    performanceMetrics: {
      totalReturn: -10,
      annualizedReturn: -20,
      maxDrawdown: 15,
      sharpeRatio: -0.5,
      sortinoRatio: -0.8,
      calmarRatio: -1.3,
      winRate: 40,
      profitFactor: 0.8,
      expectancy: -200,
      averageWin: 800,
      averageLoss: -1000,
      largestWin: 3000,
      largestLoss: -4000,
      recoveryFactor: 0,
      payoffRatio: 0.8,
      maxConsecutiveWins: 3,
      maxConsecutiveLosses: 5
    },
    createdAt: '2024-01-01T00:00:00Z',
    status: BacktestStatus.COMPLETED
  },
  {
    id: 'backtest-3',
    configId: 'config-3',
    strategyId: 'strategy-3',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-03-31T00:00:00Z',
    initialCapital: 100000,
    finalCapital: 100000,
    totalReturn: 0,
    annualizedReturn: 0,
    maxDrawdown: 5,
    sharpeRatio: 0,
    winRate: 50,
    profitFactor: 1.0,
    totalTrades: 20,
    performanceMetrics: {
      totalReturn: 0,
      annualizedReturn: 0,
      maxDrawdown: 5,
      sharpeRatio: 0,
      sortinoRatio: 0,
      calmarRatio: 0,
      winRate: 50,
      profitFactor: 1.0,
      expectancy: 0,
      averageWin: 500,
      averageLoss: -500,
      largestWin: 1000,
      largestLoss: -1000,
      recoveryFactor: 0,
      payoffRatio: 1.0,
      maxConsecutiveWins: 2,
      maxConsecutiveLosses: 2
    },
    createdAt: '2024-01-01T00:00:00Z',
    status: BacktestStatus.RUNNING
  }
];

// Create a theme for testing
const theme = createTheme();

describe('BacktestHistoryPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly with backtest results', () => {
    render(
      <ThemeProvider theme={theme}>
        <BacktestHistoryPanel 
          backtestResults={mockBacktestResults}
          onBacktestSelected={jest.fn()}
          onRefresh={jest.fn()}
        />
      </ThemeProvider>
    );

    // Check that the component renders with the backtest results
    expect(screen.getByText(/Backtest History/i)).toBeInTheDocument();
    expect(screen.getByText(/3 backtest results/i)).toBeInTheDocument();
    expect(screen.getByText('config-1')).toBeInTheDocument();
    expect(screen.getByText('config-2')).toBeInTheDocument();
    expect(screen.getByText('config-3')).toBeInTheDocument();
  });

  test('filters backtest results by search term', () => {
    render(
      <ThemeProvider theme={theme}>
        <BacktestHistoryPanel 
          backtestResults={mockBacktestResults}
          onBacktestSelected={jest.fn()}
          onRefresh={jest.fn()}
        />
      </ThemeProvider>
    );

    // Enter search term
    fireEvent.change(screen.getByPlaceholderText(/Search backtests.../i), { target: { value: 'config-1' } });

    // Check that only the matching backtest is displayed
    expect(screen.getByText('config-1')).toBeInTheDocument();
    expect(screen.queryByText('config-2')).not.toBeInTheDocument();
    expect(screen.queryByText('config-3')).not.toBeInTheDocument();
  });

  test('filters backtest results by status', () => {
    render(
      <ThemeProvider theme={theme}>
        <BacktestHistoryPanel 
          backtestResults={mockBacktestResults}
          onBacktestSelected={jest.fn()}
          onRefresh={jest.fn()}
        />
      </ThemeProvider>
    );

    // Select status filter
    fireEvent.mouseDown(screen.getByLabelText(/Status/i));
    fireEvent.click(screen.getByText(/Running/i));

    // Check that only the running backtest is displayed
    expect(screen.queryByText('config-1')).not.toBeInTheDocument();
    expect(screen.queryByText('config-2')).not.toBeInTheDocument();
    expect(screen.getByText('config-3')).toBeInTheDocument();
  });

  test('calls onBacktestSelected when a backtest is clicked', () => {
    const onBacktestSelected = jest.fn();
    
    render(
      <ThemeProvider theme={theme}>
        <BacktestHistoryPanel 
          backtestResults={mockBacktestResults}
          onBacktestSelected={onBacktestSelected}
          onRefresh={jest.fn()}
        />
      </ThemeProvider>
    );

    // Click on a backtest
    fireEvent.click(screen.getByText('config-1'));

    // Check that onBacktestSelected was called with the correct backtest
    expect(onBacktestSelected).toHaveBeenCalledWith(mockBacktestResults[0]);
  });

  test('selects backtests for comparison', () => {
    const onCompare = jest.fn();
    
    render(
      <ThemeProvider theme={theme}>
        <BacktestHistoryPanel 
          backtestResults={mockBacktestResults}
          onBacktestSelected={jest.fn()}
          onRefresh={jest.fn()}
          onCompare={onCompare}
        />
      </ThemeProvider>
    );

    // Select two backtests
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    // Click compare button
    fireEvent.click(screen.getByText(/Compare Selected/i));

    // Check that onCompare was called with the selected backtests
    expect(onCompare).toHaveBeenCalledWith([mockBacktestResults[0], mockBacktestResults[1]]);
  });

  test('deletes a backtest when delete is confirmed', async () => {
    const onRefresh = jest.fn();
    
    render(
      <ThemeProvider theme={theme}>
        <BacktestHistoryPanel 
          backtestResults={mockBacktestResults}
          onBacktestSelected={jest.fn()}
          onRefresh={onRefresh}
        />
      </ThemeProvider>
    );

    // Open the menu for a backtest
    const menuButtons = screen.getAllByRole('button', { name: /more/i });
    fireEvent.click(menuButtons[0]);

    // Click delete option
    fireEvent.click(screen.getByText(/Delete/i));

    // Confirm deletion
    fireEvent.click(screen.getByRole('button', { name: /Delete$/i }));

    // Check that deleteBacktestResult was called and onRefresh was triggered
    await waitFor(() => {
      expect(BacktestingService.prototype.deleteBacktestResult).toHaveBeenCalledWith('backtest-1');
      expect(onRefresh).toHaveBeenCalled();
    });
  });

  test('duplicates a backtest when duplicate is clicked', async () => {
    const onRefresh = jest.fn();
    
    render(
      <ThemeProvider theme={theme}>
        <BacktestHistoryPanel 
          backtestResults={mockBacktestResults}
          onBacktestSelected={jest.fn()}
          onRefresh={onRefresh}
        />
      </ThemeProvider>
    );

    // Open the menu for a backtest
    const menuButtons = screen.getAllByRole('button', { name: /more/i });
    fireEvent.click(menuButtons[0]);

    // Click duplicate option
    fireEvent.click(screen.getByText(/Duplicate/i));

    // Check that duplicateBacktest was called and onRefresh was triggered
    await waitFor(() => {
      expect(BacktestingService.prototype.duplicateBacktest).toHaveBeenCalledWith('backtest-1');
      expect(onRefresh).toHaveBeenCalled();
    });
  });

  test('renders empty state when no backtest results', () => {
    render(
      <ThemeProvider theme={theme}>
        <BacktestHistoryPanel 
          backtestResults={[]}
          onBacktestSelected={jest.fn()}
          onRefresh={jest.fn()}
        />
      </ThemeProvider>
    );

    expect(screen.getByText(/No backtest results found/i)).toBeInTheDocument();
  });
});