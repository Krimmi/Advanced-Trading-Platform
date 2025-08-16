import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import TradeListComponent from '../TradeListComponent';
import { BacktestingService } from '../../../services';
import { BacktestResult, BacktestTrade } from '../../../types/backtesting';

// Mock the services
jest.mock('../../../services', () => ({
  BacktestingService: jest.fn().mockImplementation(() => ({
    getBacktestTrades: jest.fn().mockResolvedValue([
      {
        id: 'trade-1',
        backtestId: 'backtest-1',
        symbol: 'AAPL',
        direction: 'long',
        entryDate: '2024-01-01T10:00:00Z',
        entryPrice: 180.5,
        exitDate: '2024-01-05T14:30:00Z',
        exitPrice: 190.25,
        quantity: 100,
        profit: 975,
        profitPercentage: 5.4,
        holdingPeriod: 4
      },
      {
        id: 'trade-2',
        backtestId: 'backtest-1',
        symbol: 'MSFT',
        direction: 'long',
        entryDate: '2024-01-02T09:45:00Z',
        entryPrice: 370.2,
        exitDate: '2024-01-06T15:15:00Z',
        exitPrice: 380.5,
        quantity: 50,
        profit: 515,
        profitPercentage: 2.8,
        holdingPeriod: 4
      },
      {
        id: 'trade-3',
        backtestId: 'backtest-1',
        symbol: 'GOOGL',
        direction: 'short',
        entryDate: '2024-01-03T11:30:00Z',
        entryPrice: 140.75,
        exitDate: '2024-01-04T10:00:00Z',
        exitPrice: 135.5,
        quantity: 200,
        profit: 1050,
        profitPercentage: 3.7,
        holdingPeriod: 1
      }
    ]),
    getTradeDetails: jest.fn().mockResolvedValue({
      id: 'trade-1',
      backtestId: 'backtest-1',
      symbol: 'AAPL',
      direction: 'long',
      entryDate: '2024-01-01T10:00:00Z',
      entryPrice: 180.5,
      exitDate: '2024-01-05T14:30:00Z',
      exitPrice: 190.25,
      quantity: 100,
      profit: 975,
      profitPercentage: 5.4,
      holdingPeriod: 4,
      entryReason: 'Moving average crossover',
      exitReason: 'Take profit',
      entrySignal: 'SMA(50) crossed above SMA(200)',
      exitSignal: 'Price reached target',
      riskRewardRatio: 3.2,
      initialStopLoss: 175.25,
      maxAdverseExcursion: 2.1,
      maxFavorableExcursion: 6.2,
      orders: [
        {
          id: 'order-1',
          tradeId: 'trade-1',
          type: 'market',
          side: 'buy',
          quantity: 100,
          price: 180.5,
          status: 'filled',
          date: '2024-01-01T10:00:00Z'
        },
        {
          id: 'order-2',
          tradeId: 'trade-1',
          type: 'market',
          side: 'sell',
          quantity: 100,
          price: 190.25,
          status: 'filled',
          date: '2024-01-05T14:30:00Z'
        }
      ]
    })
  }))
}));

// Sample backtest result for testing
const mockBacktestResult: BacktestResult = {
  id: 'backtest-1',
  configId: 'config-1',
  strategyId: 'strategy-1',
  startDate: '2024-01-01T00:00:00Z',
  endDate: '2024-01-31T00:00:00Z',
  initialCapital: 100000,
  finalCapital: 105000,
  totalReturn: 5,
  annualizedReturn: 60,
  maxDrawdown: 2,
  sharpeRatio: 2.5,
  winRate: 65,
  profitFactor: 2.2,
  totalTrades: 50,
  performanceMetrics: {
    totalReturn: 5,
    annualizedReturn: 60,
    maxDrawdown: 2,
    sharpeRatio: 2.5,
    sortinoRatio: 3.5,
    calmarRatio: 30,
    winRate: 65,
    profitFactor: 2.2,
    expectancy: 100,
    averageWin: 500,
    averageLoss: -300,
    largestWin: 2000,
    largestLoss: -1000,
    recoveryFactor: 2.5,
    payoffRatio: 1.67,
    maxConsecutiveWins: 7,
    maxConsecutiveLosses: 2
  },
  createdAt: '2024-01-01T00:00:00Z',
  status: 'completed'
};

// Create a theme for testing
const theme = createTheme();

describe('TradeListComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly with backtest result', async () => {
    render(
      <ThemeProvider theme={theme}>
        <TradeListComponent backtestResult={mockBacktestResult} />
      </ThemeProvider>
    );

    // Check that the component renders and fetches trades
    await waitFor(() => {
      expect(BacktestingService.prototype.getBacktestTrades).toHaveBeenCalledWith('backtest-1', expect.anything());
    });

    // Check that trades are displayed
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('MSFT')).toBeInTheDocument();
    expect(screen.getByText('GOOGL')).toBeInTheDocument();
  });

  test('renders empty state when no backtest result is provided', () => {
    render(
      <ThemeProvider theme={theme}>
        <TradeListComponent backtestResult={null} />
      </ThemeProvider>
    );

    expect(screen.getByText(/No backtest selected/i)).toBeInTheDocument();
  });

  test('filters trades by symbol', async () => {
    render(
      <ThemeProvider theme={theme}>
        <TradeListComponent backtestResult={mockBacktestResult} />
      </ThemeProvider>
    );

    // Wait for trades to load
    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });

    // Filter by symbol
    const symbolFilter = screen.getByLabelText(/Symbol/i);
    fireEvent.change(symbolFilter, { target: { value: 'AAPL' } });

    // Check that the service was called with the correct filter
    await waitFor(() => {
      expect(BacktestingService.prototype.getBacktestTrades).toHaveBeenCalledWith(
        'backtest-1',
        expect.objectContaining({ symbol: 'AAPL' })
      );
    });
  });

  test('filters trades by direction', async () => {
    render(
      <ThemeProvider theme={theme}>
        <TradeListComponent backtestResult={mockBacktestResult} />
      </ThemeProvider>
    );

    // Wait for trades to load
    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });

    // Filter by direction
    const directionFilter = screen.getByLabelText(/Direction/i);
    fireEvent.mouseDown(directionFilter);
    fireEvent.click(screen.getByText(/Long/i));

    // Check that the service was called with the correct filter
    await waitFor(() => {
      expect(BacktestingService.prototype.getBacktestTrades).toHaveBeenCalledWith(
        'backtest-1',
        expect.objectContaining({ direction: 'long' })
      );
    });
  });

  test('filters trades by result', async () => {
    render(
      <ThemeProvider theme={theme}>
        <TradeListComponent backtestResult={mockBacktestResult} />
      </ThemeProvider>
    );

    // Wait for trades to load
    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });

    // Filter by result
    const resultFilter = screen.getByLabelText(/Result/i);
    fireEvent.mouseDown(resultFilter);
    fireEvent.click(screen.getByText(/Winning/i));

    // Check that the service was called with the correct filter
    await waitFor(() => {
      expect(BacktestingService.prototype.getBacktestTrades).toHaveBeenCalledWith(
        'backtest-1',
        expect.objectContaining({ result: 'win' })
      );
    });
  });

  test('sorts trades by column', async () => {
    render(
      <ThemeProvider theme={theme}>
        <TradeListComponent backtestResult={mockBacktestResult} />
      </ThemeProvider>
    );

    // Wait for trades to load
    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });

    // Sort by profit
    const profitHeader = screen.getByText(/Profit/i);
    fireEvent.click(profitHeader);

    // Check that the service was called with the correct sort parameters
    await waitFor(() => {
      expect(BacktestingService.prototype.getBacktestTrades).toHaveBeenCalledWith(
        'backtest-1',
        expect.objectContaining({ sortBy: 'profit', sortDirection: 'desc' })
      );
    });

    // Sort in the opposite direction
    fireEvent.click(profitHeader);

    // Check that the service was called with the correct sort parameters
    await waitFor(() => {
      expect(BacktestingService.prototype.getBacktestTrades).toHaveBeenCalledWith(
        'backtest-1',
        expect.objectContaining({ sortBy: 'profit', sortDirection: 'asc' })
      );
    });
  });

  test('shows trade details when a trade is selected', async () => {
    const onTradeSelected = jest.fn();
    
    render(
      <ThemeProvider theme={theme}>
        <TradeListComponent 
          backtestResult={mockBacktestResult} 
          onTradeSelected={onTradeSelected} 
        />
      </ThemeProvider>
    );

    // Wait for trades to load
    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });

    // Click on a trade
    fireEvent.click(screen.getByText('AAPL'));

    // Check that onTradeSelected was called with the trade details
    await waitFor(() => {
      expect(BacktestingService.prototype.getTradeDetails).toHaveBeenCalledWith('backtest-1', 'trade-1');
      expect(onTradeSelected).toHaveBeenCalled();
    });
  });
});