import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import SimulationControlPanel from '../SimulationControlPanel';
import { BacktestingService, MarketSimulationService } from '../../../services';
import { BacktestResult } from '../../../types/backtesting';
import { SimulationScenario } from '../../../types/backtesting/simulationTypes';

// Mock the services
jest.mock('../../../services', () => ({
  BacktestingService: jest.fn().mockImplementation(() => ({
    // Mock methods as needed
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
          },
          {
            name: 'recoverySpeed',
            label: 'Recovery Speed',
            type: 'number',
            defaultValue: 0.2,
            min: 0.1,
            max: 0.5,
            step: 0.1
          }
        ]
      },
      {
        type: 'highVolatility',
        name: 'High Volatility',
        description: 'Simulates a high volatility market environment',
        parameters: [
          {
            name: 'volatilityMultiplier',
            label: 'Volatility Multiplier',
            type: 'number',
            defaultValue: 2.0,
            min: 1.5,
            max: 5.0,
            step: 0.5
          },
          {
            name: 'trendStrength',
            label: 'Trend Strength',
            type: 'number',
            defaultValue: 0.5,
            min: 0,
            max: 1.0,
            step: 0.1
          }
        ]
      }
    ]),
    getMarketConditions: jest.fn().mockResolvedValue([
      {
        type: 'bullMarket',
        name: 'Bull Market',
        description: 'Strong upward trend with low volatility',
        volatility: 0.15,
        trend: 0.8,
        liquidity: 0.9,
        correlations: { 'SPY-QQQ': 0.85, 'SPY-IWM': 0.75 }
      },
      {
        type: 'bearMarket',
        name: 'Bear Market',
        description: 'Strong downward trend with high volatility',
        volatility: 0.35,
        trend: -0.7,
        liquidity: 0.6,
        correlations: { 'SPY-QQQ': 0.9, 'SPY-IWM': 0.85 }
      }
    ]),
    createSimulation: jest.fn().mockResolvedValue('simulation-1'),
    getSimulationProgress: jest.fn().mockResolvedValue(100),
    getSimulationResult: jest.fn().mockResolvedValue({
      id: 'simulation-1',
      backtestId: 'backtest-1',
      scenarioType: 'marketCrash',
      parameters: {
        crashSeverity: 0.3,
        recoverySpeed: 0.2
      },
      duration: 30,
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-01-31T00:00:00Z',
      initialCapital: 100000,
      finalCapital: 85000,
      totalReturn: -15,
      maxDrawdown: 22,
      trades: [],
      equityCurve: [],
      createdAt: '2024-01-01T00:00:00Z'
    }),
    cancelSimulation: jest.fn().mockResolvedValue(true)
  }))
}));

// Sample backtest result for testing
const mockBacktestResult: BacktestResult = {
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

// Create a theme for testing
const theme = createTheme();

describe('SimulationControlPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly with backtest result', async () => {
    render(
      <ThemeProvider theme={theme}>
        <SimulationControlPanel 
          backtestResult={mockBacktestResult}
          backtestResults={[mockBacktestResult]}
          onBacktestSelected={jest.fn()}
        />
      </ThemeProvider>
    );

    // Check that the component renders and fetches simulation scenarios
    await waitFor(() => {
      expect(MarketSimulationService.prototype.getSimulationScenarios).toHaveBeenCalled();
      expect(screen.getByText(/Market Simulation/i)).toBeInTheDocument();
      expect(screen.getByText(/Market Crash/i)).toBeInTheDocument();
      expect(screen.getByText(/High Volatility/i)).toBeInTheDocument();
    });
  });

  test('renders empty state when no backtest result is provided', () => {
    render(
      <ThemeProvider theme={theme}>
        <SimulationControlPanel 
          backtestResult={null}
          backtestResults={[mockBacktestResult]}
          onBacktestSelected={jest.fn()}
        />
      </ThemeProvider>
    );

    expect(screen.getByText(/No backtest selected/i)).toBeInTheDocument();
  });

  test('updates simulation parameters when changed', async () => {
    render(
      <ThemeProvider theme={theme}>
        <SimulationControlPanel 
          backtestResult={mockBacktestResult}
          backtestResults={[mockBacktestResult]}
          onBacktestSelected={jest.fn()}
        />
      </ThemeProvider>
    );

    // Wait for simulation scenarios to load
    await waitFor(() => {
      expect(screen.getByText(/Market Crash/i)).toBeInTheDocument();
    });

    // Select a scenario
    fireEvent.mouseDown(screen.getByLabelText(/Scenario Type/i));
    fireEvent.click(screen.getByText(/Market Crash/i));

    // Change a parameter
    const crashSeverityInput = screen.getByLabelText(/Crash Severity/i);
    fireEvent.change(crashSeverityInput, { target: { value: '0.5' } });

    // Check that the parameter was updated
    expect(crashSeverityInput).toHaveValue(0.5);
  });

  test('runs simulation when button is clicked', async () => {
    render(
      <ThemeProvider theme={theme}>
        <SimulationControlPanel 
          backtestResult={mockBacktestResult}
          backtestResults={[mockBacktestResult]}
          onBacktestSelected={jest.fn()}
        />
      </ThemeProvider>
    );

    // Wait for simulation scenarios to load
    await waitFor(() => {
      expect(screen.getByText(/Market Crash/i)).toBeInTheDocument();
    });

    // Select a scenario
    fireEvent.mouseDown(screen.getByLabelText(/Scenario Type/i));
    fireEvent.click(screen.getByText(/Market Crash/i));

    // Click the run simulation button
    fireEvent.click(screen.getByText(/Run Simulation/i));

    // Check that the simulation was created
    await waitFor(() => {
      expect(MarketSimulationService.prototype.createSimulation).toHaveBeenCalledWith(
        expect.objectContaining({
          backtestId: 'backtest-1',
          scenarioType: 'marketCrash'
        })
      );
      expect(MarketSimulationService.prototype.getSimulationProgress).toHaveBeenCalledWith('simulation-1');
      expect(MarketSimulationService.prototype.getSimulationResult).toHaveBeenCalledWith('simulation-1');
    });

    // Check that the simulation results are displayed
    await waitFor(() => {
      expect(screen.getByText(/-15%/i)).toBeInTheDocument(); // Total return
      expect(screen.getByText(/22%/i)).toBeInTheDocument(); // Max drawdown
    });
  });

  test('cancels simulation when stop button is clicked', async () => {
    // Mock the simulation to be running
    (MarketSimulationService.prototype.getSimulationProgress as jest.Mock).mockResolvedValueOnce(50);
    
    render(
      <ThemeProvider theme={theme}>
        <SimulationControlPanel 
          backtestResult={mockBacktestResult}
          backtestResults={[mockBacktestResult]}
          onBacktestSelected={jest.fn()}
        />
      </ThemeProvider>
    );

    // Wait for simulation scenarios to load
    await waitFor(() => {
      expect(screen.getByText(/Market Crash/i)).toBeInTheDocument();
    });

    // Select a scenario
    fireEvent.mouseDown(screen.getByLabelText(/Scenario Type/i));
    fireEvent.click(screen.getByText(/Market Crash/i));

    // Click the run simulation button
    fireEvent.click(screen.getByText(/Run Simulation/i));

    // Wait for the simulation to start running
    await waitFor(() => {
      expect(screen.getByText(/Simulation in Progress/i)).toBeInTheDocument();
    });

    // Click the stop button
    fireEvent.click(screen.getByText(/Stop Simulation/i));

    // Check that the simulation was canceled
    await waitFor(() => {
      expect(MarketSimulationService.prototype.cancelSimulation).toHaveBeenCalledWith('simulation-1');
    });
  });

  test('allows selecting different market conditions', async () => {
    render(
      <ThemeProvider theme={theme}>
        <SimulationControlPanel 
          backtestResult={mockBacktestResult}
          backtestResults={[mockBacktestResult]}
          onBacktestSelected={jest.fn()}
        />
      </ThemeProvider>
    );

    // Wait for simulation scenarios and market conditions to load
    await waitFor(() => {
      expect(MarketSimulationService.prototype.getMarketConditions).toHaveBeenCalled();
      expect(screen.getByText(/Bull Market/i)).toBeInTheDocument();
      expect(screen.getByText(/Bear Market/i)).toBeInTheDocument();
    });

    // Select a market condition
    fireEvent.mouseDown(screen.getByLabelText(/Market Condition/i));
    fireEvent.click(screen.getByText(/Bear Market/i));

    // Check that the market condition was selected
    expect(screen.getByText(/Strong downward trend with high volatility/i)).toBeInTheDocument();
  });
});