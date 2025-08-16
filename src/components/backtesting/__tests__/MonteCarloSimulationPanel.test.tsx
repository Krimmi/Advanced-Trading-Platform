import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MonteCarloSimulationPanel from '../MonteCarloSimulationPanel';
import { BacktestResult } from '../../../types/backtesting';
import { MonteCarloResult } from '../../../types/backtesting/monteCarloTypes';
import { MarketSimulationService } from '../../../services';

// Mock the services
jest.mock('../../../services', () => ({
  BacktestingService: jest.fn().mockImplementation(() => ({
    // Mock methods as needed
  })),
  MarketSimulationService: jest.fn().mockImplementation(() => ({
    runMonteCarloSimulation: jest.fn().mockResolvedValue({
      iterations: [
        {
          id: 'iter-1',
          equity: [
            { timestamp: '2025-01-01T00:00:00Z', value: 10000 },
            { timestamp: '2025-01-02T00:00:00Z', value: 10100 }
          ]
        }
      ],
      probabilityOfProfit: 0.65,
      expectedReturn: 0.12,
      expectedDrawdown: 0.08,
      confidenceIntervals: [
        { level: 0.95, lowerBound: 0.05, upperBound: 0.18 }
      ]
    }),
    createSimulationConfig: jest.fn().mockResolvedValue({
      id: 'config-1',
      name: 'Test Monte Carlo',
      description: 'Test description',
      backtestConfigId: 'backtest-1',
      scenarioType: 'monte_carlo',
      parameters: {}
    })
  }))
}));

// Sample backtest result for testing
const mockBacktestResult: BacktestResult = {
  id: 'backtest-1',
  configId: 'config-1',
  strategyId: 'strategy-1',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  initialCapital: 10000,
  finalCapital: 12000,
  totalReturn: 0.2,
  annualizedReturn: 0.18,
  maxDrawdown: 0.1,
  sharpeRatio: 1.5,
  sortinoRatio: 2.0,
  trades: [],
  equityCurve: [],
  symbols: ['AAPL', 'MSFT', 'GOOGL'],
  status: 'completed',
  createdAt: '2025-01-01T00:00:00Z',
  completedAt: '2025-01-01T00:05:00Z'
};

describe('MonteCarloSimulationPanel Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<MonteCarloSimulationPanel backtestResult={mockBacktestResult} />);
    expect(screen.getByText('Monte Carlo Simulation')).toBeInTheDocument();
  });

  test('displays message when no backtest result is provided', () => {
    render(<MonteCarloSimulationPanel backtestResult={null} />);
    expect(screen.getByText('No backtest result selected')).toBeInTheDocument();
  });

  test('initializes with default values from backtest result', () => {
    render(<MonteCarloSimulationPanel backtestResult={mockBacktestResult} />);
    
    // Check if the simulation name is initialized correctly
    const nameInput = screen.getByLabelText('Simulation Name');
    expect(nameInput).toHaveValue('config-1 - Monte Carlo');
    
    // Check if the description is initialized correctly
    const descriptionInput = screen.getByLabelText('Description');
    expect(descriptionInput).toHaveValue('Monte Carlo simulation based on backtest config-1');
  });

  test('allows changing simulation parameters', () => {
    render(<MonteCarloSimulationPanel backtestResult={mockBacktestResult} />);
    
    // Change iterations
    const iterationsInput = screen.getByLabelText('Number of Iterations');
    fireEvent.change(iterationsInput, { target: { value: '5000' } });
    expect(iterationsInput).toHaveValue(5000);
    
    // Change return distribution
    const distributionSelect = screen.getByLabelText('Return Distribution');
    fireEvent.mouseDown(distributionSelect);
    const lognormalOption = screen.getByText('Log-Normal');
    fireEvent.click(lognormalOption);
    expect(distributionSelect).toHaveTextContent('Log-Normal');
  });

  test('shows loading state when running simulation', async () => {
    render(<MonteCarloSimulationPanel backtestResult={mockBacktestResult} />);
    
    // Click run simulation button
    const runButton = screen.getByText('Run Monte Carlo Simulation');
    fireEvent.click(runButton);
    
    // Check if loading indicator appears
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    // Wait for simulation to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  test('calls onSimulationRun callback when simulation completes', async () => {
    const onSimulationRun = jest.fn();
    render(
      <MonteCarloSimulationPanel 
        backtestResult={mockBacktestResult} 
        onSimulationRun={onSimulationRun} 
      />
    );
    
    // Click run simulation button
    const runButton = screen.getByText('Run Monte Carlo Simulation');
    fireEvent.click(runButton);
    
    // Wait for simulation to complete and callback to be called
    await waitFor(() => {
      expect(onSimulationRun).toHaveBeenCalled();
    });
    
    // Verify the callback was called with a MonteCarloResult object
    expect(onSimulationRun.mock.calls[0][0]).toHaveProperty('simulationId');
    expect(onSimulationRun.mock.calls[0][0]).toHaveProperty('statistics');
    expect(onSimulationRun.mock.calls[0][0]).toHaveProperty('confidenceIntervals');
  });

  test('switches to Results tab after simulation completes', async () => {
    render(<MonteCarloSimulationPanel backtestResult={mockBacktestResult} />);
    
    // Initially, the Configuration tab should be active
    expect(screen.getByText('Configuration')).toHaveAttribute('aria-selected', 'true');
    
    // Click run simulation button
    const runButton = screen.getByText('Run Monte Carlo Simulation');
    fireEvent.click(runButton);
    
    // Wait for simulation to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check if Results tab is now active
    expect(screen.getByText('Results')).toHaveAttribute('aria-selected', 'true');
  });

  test('saves configuration when Save Configuration button is clicked', async () => {
    const onConfigSaved = jest.fn();
    render(
      <MonteCarloSimulationPanel 
        backtestResult={mockBacktestResult} 
        onConfigSaved={onConfigSaved} 
      />
    );
    
    // Click save configuration button
    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);
    
    // Wait for save to complete
    await waitFor(() => {
      expect(MarketSimulationService.prototype.createSimulationConfig).toHaveBeenCalled();
    });
  });

  test('shows error message when simulation fails', async () => {
    // Mock the service to reject
    (MarketSimulationService.prototype.runMonteCarloSimulation as jest.Mock).mockRejectedValueOnce(
      new Error('Simulation failed')
    );
    
    render(<MonteCarloSimulationPanel backtestResult={mockBacktestResult} />);
    
    // Click run simulation button
    const runButton = screen.getByText('Run Monte Carlo Simulation');
    fireEvent.click(runButton);
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText('Failed to run simulation. Please try again later.')).toBeInTheDocument();
    });
  });
});