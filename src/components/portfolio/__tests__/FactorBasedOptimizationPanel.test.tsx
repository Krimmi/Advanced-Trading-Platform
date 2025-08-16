import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FactorBasedOptimizationPanel from '../FactorBasedOptimizationPanel';
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

describe('FactorBasedOptimizationPanel', () => {
  const mockSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'];
  const mockOnOptimizationComplete = jest.fn();
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  test('renders the component title', () => {
    render(<FactorBasedOptimizationPanel symbols={mockSymbols} />);
    expect(screen.getByText('Factor-Based Portfolio Optimization')).toBeInTheDocument();
  });

  test('displays the list of factors', () => {
    render(<FactorBasedOptimizationPanel symbols={mockSymbols} />);
    expect(screen.getByText('Market')).toBeInTheDocument();
    expect(screen.getByText('Size')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
    expect(screen.getByText('Momentum')).toBeInTheDocument();
    expect(screen.getByText('Quality')).toBeInTheDocument();
  });

  test('allows selecting and deselecting factors', () => {
    render(<FactorBasedOptimizationPanel symbols={mockSymbols} />);
    
    // Quality factor should not be selected initially
    const qualityFactor = screen.getByText('Quality');
    expect(qualityFactor.closest('.MuiChip-root')).not.toHaveClass('MuiChip-colorPrimary');
    
    // Click to select Quality factor
    fireEvent.click(qualityFactor);
    expect(qualityFactor.closest('.MuiChip-root')).toHaveClass('MuiChip-colorPrimary');
    
    // Click to deselect Market factor
    const marketFactor = screen.getByText('Market');
    fireEvent.click(marketFactor);
    expect(marketFactor.closest('.MuiChip-root')).not.toHaveClass('MuiChip-colorPrimary');
  });

  test('displays asset factor exposures table', async () => {
    render(<FactorBasedOptimizationPanel symbols={mockSymbols} />);
    
    // Wait for the asset factor exposures table to be populated
    await waitFor(() => {
      expect(screen.getByText('Symbol')).toBeInTheDocument();
      expect(screen.getByText('Market')).toBeInTheDocument();
      expect(screen.getByText('Size')).toBeInTheDocument();
      expect(screen.getByText('Value')).toBeInTheDocument();
      expect(screen.getByText('Momentum')).toBeInTheDocument();
      
      // Check if symbols are displayed in the table
      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('MSFT')).toBeInTheDocument();
      expect(screen.getByText('GOOGL')).toBeInTheDocument();
    });
  });

  test('allows updating factor return expectations', () => {
    render(<FactorBasedOptimizationPanel symbols={mockSymbols} />);
    
    // Find the Market factor return input
    const marketReturnInputs = screen.getAllByRole('spinbutton');
    const marketReturnInput = marketReturnInputs[0]; // First input should be for Market factor
    
    // Change the value
    fireEvent.change(marketReturnInput, { target: { value: '7.5' } });
    
    // Check if the value was updated
    expect(marketReturnInput).toHaveValue(7.5);
  });

  test('allows changing optimization objective', () => {
    render(<FactorBasedOptimizationPanel symbols={mockSymbols} />);
    
    // Open the objective dropdown
    const objectiveSelect = screen.getByLabelText('Optimization Objective');
    fireEvent.mouseDown(objectiveSelect);
    
    // Select a different objective
    const minRiskOption = screen.getByText('Minimum Risk');
    fireEvent.click(minRiskOption);
    
    // Check if the objective was changed
    expect(objectiveSelect).toHaveValue('min_risk');
  });

  test('runs factor optimization when button is clicked', async () => {
    render(<FactorBasedOptimizationPanel 
      symbols={mockSymbols} 
      onOptimizationComplete={mockOnOptimizationComplete} 
    />);
    
    // Wait for the component to finish loading asset exposures
    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });
    
    // Click the Run Factor Optimization button
    const optimizeButton = screen.getByText('Run Factor Optimization');
    fireEvent.click(optimizeButton);
    
    // Wait for optimization to complete
    await waitFor(() => {
      // Check if the callback was called
      expect(mockOnOptimizationComplete).toHaveBeenCalled();
      
      // Check if optimization results are displayed
      expect(screen.getByText('Optimization Results')).toBeInTheDocument();
      expect(screen.getByText('Portfolio Metrics')).toBeInTheDocument();
      expect(screen.getByText('Portfolio Factor Exposures')).toBeInTheDocument();
      expect(screen.getByText('Portfolio Weights')).toBeInTheDocument();
    });
  });

  test('displays risk aversion slider', () => {
    render(<FactorBasedOptimizationPanel symbols={mockSymbols} />);
    
    // Check if the risk aversion slider is displayed
    expect(screen.getByText('Risk Aversion: 1')).toBeInTheDocument();
    
    // Find the slider
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    
    // Change the slider value
    fireEvent.change(slider, { target: { value: 3 } });
    
    // Check if the value was updated
    expect(screen.getByText('Risk Aversion: 3')).toBeInTheDocument();
  });

  test('displays factor constraints table', () => {
    render(<FactorBasedOptimizationPanel symbols={mockSymbols} />);
    
    // Check if the factor constraints table is displayed
    expect(screen.getByText('Factor Exposure Constraints')).toBeInTheDocument();
    
    // Check if the table headers are displayed
    const tableHeaders = screen.getAllByRole('columnheader');
    expect(tableHeaders[0]).toHaveTextContent('Factor');
    expect(tableHeaders[1]).toHaveTextContent('Min Exposure');
    expect(tableHeaders[2]).toHaveTextContent('Max Exposure');
    
    // Check if the selected factors are displayed in the table
    const tableRows = screen.getAllByRole('row');
    expect(tableRows.length).toBeGreaterThan(1); // Header row + at least one factor row
  });

  test('refreshes asset exposures when refresh button is clicked', async () => {
    render(<FactorBasedOptimizationPanel symbols={mockSymbols} />);
    
    // Wait for the initial asset exposures to load
    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });
    
    // Click the Refresh Exposures button
    const refreshButton = screen.getByText('Refresh Exposures');
    fireEvent.click(refreshButton);
    
    // Check if the loading state is triggered
    expect(screen.queryByRole('progressbar')).toBeInTheDocument();
    
    // Wait for the refresh to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });
});