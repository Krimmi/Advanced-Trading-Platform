import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import StrategyOptimizationPanel from '../StrategyOptimizationPanel';
import { BacktestingService, OptimizationService } from '../../../services';
import { Strategy, OptimizationResult, ObjectiveFunction, OptimizationMethod } from '../../../types/backtesting/strategyTypes';

// Mock the services
jest.mock('../../../services', () => ({
  BacktestingService: jest.fn().mockImplementation(() => ({
    getBacktestConfigs: jest.fn().mockResolvedValue([
      { id: 'backtest-config-1', strategyId: 'strategy-1' }
    ]),
    updateStrategy: jest.fn().mockResolvedValue({})
  })),
  OptimizationService: jest.fn().mockImplementation(() => ({
    startOptimization: jest.fn().mockResolvedValue('optimization-1'),
    getOptimizationProgress: jest.fn().mockResolvedValue(100),
    getOptimizationResult: jest.fn().mockResolvedValue({
      id: 'optimization-1',
      configId: 'config-1',
      status: 'completed',
      iterations: [
        {
          id: 'iteration-1',
          parameters: { period: 14, threshold: 0.5 },
          objectiveValue: 1.5,
          metrics: { sharpeRatio: 1.5, totalReturn: 0.25 },
          rank: 1
        },
        {
          id: 'iteration-2',
          parameters: { period: 10, threshold: 0.6 },
          objectiveValue: 1.2,
          metrics: { sharpeRatio: 1.2, totalReturn: 0.2 },
          rank: 2
        }
      ],
      bestParameters: { period: 14, threshold: 0.5 },
      bestObjectiveValue: 1.5,
      executionTime: 5000,
      createdAt: '2025-08-12T00:00:00Z'
    }),
    cancelOptimization: jest.fn().mockResolvedValue(true),
    saveOptimizationConfig: jest.fn().mockResolvedValue({})
  }))
}));

// Sample strategy for testing
const mockStrategy: Strategy = {
  id: 'strategy-1',
  name: 'Test Strategy',
  description: 'A test strategy',
  type: 'technical' as any,
  rules: [],
  parameters: {
    period: 14,
    threshold: 0.5
  },
  riskManagement: [],
  positionSizing: {
    type: 'fixed' as any,
    parameters: {}
  },
  isPublic: false,
  version: '1.0.0'
};

// Create a theme for testing
const theme = createTheme();

describe('StrategyOptimizationPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly with strategy', () => {
    render(
      <ThemeProvider theme={theme}>
        <StrategyOptimizationPanel strategy={mockStrategy} />
      </ThemeProvider>
    );

    // Check that the component renders with the strategy name
    expect(screen.getByText(/Test Strategy/i)).toBeInTheDocument();
    expect(screen.getByText(/Strategy Optimization/i)).toBeInTheDocument();
  });

  test('renders message when no strategy is selected', () => {
    render(
      <ThemeProvider theme={theme}>
        <StrategyOptimizationPanel strategy={null} />
      </ThemeProvider>
    );

    expect(screen.getByText(/No strategy selected/i)).toBeInTheDocument();
  });

  test('initializes optimization parameters from strategy', () => {
    render(
      <ThemeProvider theme={theme}>
        <StrategyOptimizationPanel strategy={mockStrategy} />
      </ThemeProvider>
    );

    // Check that parameters are initialized
    expect(screen.getAllByText(/Parameter/i)[0]).toBeInTheDocument();
    expect(screen.getByDisplayValue('period')).toBeInTheDocument();
    expect(screen.getByDisplayValue('threshold')).toBeInTheDocument();
  });

  test('runs optimization when button is clicked', async () => {
    const onOptimizationComplete = jest.fn();
    
    render(
      <ThemeProvider theme={theme}>
        <StrategyOptimizationPanel 
          strategy={mockStrategy} 
          onOptimizationComplete={onOptimizationComplete} 
        />
      </ThemeProvider>
    );

    // Click the run optimization button
    fireEvent.click(screen.getByText(/Run Optimization/i));

    // Wait for the optimization to complete
    await waitFor(() => {
      expect(BacktestingService.prototype.getBacktestConfigs).toHaveBeenCalled();
      expect(OptimizationService.prototype.startOptimization).toHaveBeenCalled();
      expect(OptimizationService.prototype.getOptimizationProgress).toHaveBeenCalled();
      expect(OptimizationService.prototype.getOptimizationResult).toHaveBeenCalled();
      expect(onOptimizationComplete).toHaveBeenCalled();
    });
  });

  test('applies optimized parameters when button is clicked', async () => {
    render(
      <ThemeProvider theme={theme}>
        <StrategyOptimizationPanel strategy={mockStrategy} />
      </ThemeProvider>
    );

    // Click the run optimization button to get results
    fireEvent.click(screen.getByText(/Run Optimization/i));

    // Wait for the optimization to complete and switch to results tab
    await waitFor(() => {
      expect(screen.getByText(/Best Parameters/i)).toBeInTheDocument();
    });

    // Click the apply button
    fireEvent.click(screen.getByText(/Apply to Strategy/i));

    // Verify the strategy update was called
    await waitFor(() => {
      expect(BacktestingService.prototype.updateStrategy).toHaveBeenCalled();
    });
  });

  test('saves optimization configuration when button is clicked', async () => {
    render(
      <ThemeProvider theme={theme}>
        <StrategyOptimizationPanel strategy={mockStrategy} />
      </ThemeProvider>
    );

    // Click the save configuration button
    fireEvent.click(screen.getByText(/Save Configuration/i));

    // Verify the save was called
    await waitFor(() => {
      expect(OptimizationService.prototype.saveOptimizationConfig).toHaveBeenCalled();
    });
  });

  test('cancels optimization when stop button is clicked', async () => {
    // Mock the optimization to be running
    (OptimizationService.prototype.getOptimizationProgress as jest.Mock).mockResolvedValueOnce(50);
    
    render(
      <ThemeProvider theme={theme}>
        <StrategyOptimizationPanel strategy={mockStrategy} />
      </ThemeProvider>
    );

    // Click the run optimization button
    fireEvent.click(screen.getByText(/Run Optimization/i));

    // Wait for the optimization to start running
    await waitFor(() => {
      expect(screen.getByText(/Optimization in Progress/i)).toBeInTheDocument();
    });

    // Click the stop button
    fireEvent.click(screen.getByText(/Stop Optimization/i));

    // Verify the cancel was called
    await waitFor(() => {
      expect(OptimizationService.prototype.cancelOptimization).toHaveBeenCalled();
    });
  });
});