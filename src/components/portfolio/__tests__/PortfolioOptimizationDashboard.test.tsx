import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PortfolioOptimizationDashboard from '../PortfolioOptimizationDashboard';
import portfolioOptimizationService from '../../../frontend/src/services/portfolioOptimizationService';

// Mock the portfolio optimization service
jest.mock('../../../frontend/src/services/portfolioOptimizationService', () => ({
  optimizePortfolio: jest.fn(),
  generateEfficientFrontier: jest.fn(),
  getAssetData: jest.fn(),
  runBlackLittermanOptimization: jest.fn(),
  runRiskParityOptimization: jest.fn(),
  runHierarchicalRiskParity: jest.fn(),
  saveOptimizedPortfolio: jest.fn(),
  getConstraintTemplates: jest.fn(),
  getObjectiveTemplates: jest.fn(),
}));

describe('PortfolioOptimizationDashboard', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock responses
    (portfolioOptimizationService.getAssetData as jest.Mock).mockResolvedValue({
      'AAPL': {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        expected_return: 0.12,
        expected_risk: 0.18,
        asset_class: 'Equity',
        sector: 'Technology'
      },
      'MSFT': {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        expected_return: 0.10,
        expected_risk: 0.16,
        asset_class: 'Equity',
        sector: 'Technology'
      }
    });
    
    (portfolioOptimizationService.optimizePortfolio as jest.Mock).mockResolvedValue({
      weights: {
        'AAPL': 0.6,
        'MSFT': 0.4
      },
      expected_return: 0.11,
      expected_risk: 0.15,
      sharpe_ratio: 0.6,
      factor_exposures: {
        'market': 1.05,
        'size': -0.2,
        'value': 0.3
      },
      optimization_metrics: {
        objective_value: 0.6,
        iterations: 100,
        convergence: true,
        computation_time: 0.5
      }
    });
    
    (portfolioOptimizationService.generateEfficientFrontier as jest.Mock).mockResolvedValue([
      { return: 0.08, risk: 0.12, sharpe: 0.5, weights: { 'AAPL': 0.3, 'MSFT': 0.7 } },
      { return: 0.10, risk: 0.14, sharpe: 0.57, weights: { 'AAPL': 0.5, 'MSFT': 0.5 } },
      { return: 0.12, risk: 0.18, sharpe: 0.55, weights: { 'AAPL': 0.7, 'MSFT': 0.3 } }
    ]);
  });

  test('renders the dashboard title', () => {
    render(<PortfolioOptimizationDashboard />);
    expect(screen.getByText('Advanced Portfolio Optimization')).toBeInTheDocument();
  });

  test('displays initial symbols', () => {
    render(<PortfolioOptimizationDashboard />);
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('MSFT')).toBeInTheDocument();
    expect(screen.getByText('GOOGL')).toBeInTheDocument();
  });

  test('allows adding a new symbol', () => {
    render(<PortfolioOptimizationDashboard />);
    
    // Type a new symbol
    const symbolInput = screen.getByLabelText('Add Symbol');
    fireEvent.change(symbolInput, { target: { value: 'NFLX' } });
    
    // Click the Add button
    const addButton = screen.getByText('Add');
    fireEvent.click(addButton);
    
    // Check if the new symbol is added
    expect(screen.getByText('NFLX')).toBeInTheDocument();
  });

  test('allows removing a symbol', () => {
    render(<PortfolioOptimizationDashboard />);
    
    // Find AAPL chip and click its delete button
    const appleChip = screen.getByText('AAPL').closest('.MuiChip-root');
    if (appleChip) {
      const deleteButton = appleChip.querySelector('.MuiChip-deleteIcon');
      if (deleteButton) {
        fireEvent.click(deleteButton);
      }
    }
    
    // Check if AAPL is removed
    expect(screen.queryByText('AAPL')).not.toBeInTheDocument();
  });

  test('runs optimization when button is clicked', async () => {
    render(<PortfolioOptimizationDashboard />);
    
    // Click the Run Optimization button
    const optimizeButton = screen.getByText('Run Optimization');
    fireEvent.click(optimizeButton);
    
    // Check if the service was called
    await waitFor(() => {
      expect(portfolioOptimizationService.optimizePortfolio).toHaveBeenCalled();
    });
  });

  test('generates efficient frontier when button is clicked', async () => {
    render(<PortfolioOptimizationDashboard />);
    
    // Click the Generate Efficient Frontier button
    const efficientFrontierButton = screen.getByText('Generate Efficient Frontier');
    fireEvent.click(efficientFrontierButton);
    
    // Check if the service was called
    await waitFor(() => {
      expect(portfolioOptimizationService.generateEfficientFrontier).toHaveBeenCalled();
    });
  });

  test('changes optimization objective when selected', () => {
    render(<PortfolioOptimizationDashboard />);
    
    // Open the objective dropdown
    const objectiveSelect = screen.getByLabelText('Optimization Objective');
    fireEvent.mouseDown(objectiveSelect);
    
    // Select a different objective
    const minRiskOption = screen.getByText('Minimum Risk');
    fireEvent.click(minRiskOption);
    
    // Check if the objective was changed
    expect(objectiveSelect).toHaveValue('min_risk');
  });

  test('displays optimization results after successful optimization', async () => {
    render(<PortfolioOptimizationDashboard />);
    
    // Click the Run Optimization button
    const optimizeButton = screen.getByText('Run Optimization');
    fireEvent.click(optimizeButton);
    
    // Wait for results to be displayed
    await waitFor(() => {
      expect(screen.getByText('Expected Return')).toBeInTheDocument();
      expect(screen.getByText('11.00%')).toBeInTheDocument(); // 0.11 * 100
      expect(screen.getByText('Expected Risk')).toBeInTheDocument();
      expect(screen.getByText('15.00%')).toBeInTheDocument(); // 0.15 * 100
      expect(screen.getByText('Sharpe Ratio')).toBeInTheDocument();
      expect(screen.getByText('0.60')).toBeInTheDocument();
    });
  });

  test('displays error message when optimization fails', async () => {
    // Mock the service to reject
    (portfolioOptimizationService.optimizePortfolio as jest.Mock).mockRejectedValue(new Error('Optimization failed'));
    
    render(<PortfolioOptimizationDashboard />);
    
    // Click the Run Optimization button
    const optimizeButton = screen.getByText('Run Optimization');
    fireEvent.click(optimizeButton);
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Error running optimization')).toBeInTheDocument();
    });
  });

  test('switches between tabs correctly', () => {
    render(<PortfolioOptimizationDashboard />);
    
    // Click on the Efficient Frontier tab
    const efficientFrontierTab = screen.getByText('Efficient Frontier');
    fireEvent.click(efficientFrontierTab);
    
    // Check if the tab content is displayed
    expect(screen.getByText('No efficient frontier generated yet.')).toBeInTheDocument();
    
    // Click on the Risk Analysis tab
    const riskAnalysisTab = screen.getByText('Risk Analysis');
    fireEvent.click(riskAnalysisTab);
    
    // Check if the tab content is displayed
    expect(screen.getByText('No optimization results available yet.')).toBeInTheDocument();
  });
});