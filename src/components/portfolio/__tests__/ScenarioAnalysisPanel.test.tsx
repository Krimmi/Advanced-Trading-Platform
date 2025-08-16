import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ScenarioAnalysisPanel from '../ScenarioAnalysisPanel';
import portfolioOptimizationService from '../../../frontend/src/services/portfolioOptimizationService';

// Mock the portfolio optimization service
jest.mock('../../../frontend/src/services/portfolioOptimizationService', () => ({
  runStressTest: jest.fn(),
}));

describe('ScenarioAnalysisPanel', () => {
  const mockPortfolioWeights = {
    'AAPL': 0.25,
    'MSFT': 0.20,
    'GOOGL': 0.15,
    'AMZN': 0.15,
    'META': 0.10,
    'TSLA': 0.15
  };
  const mockOnScenarioResultsGenerated = jest.fn();
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  test('renders the component title', () => {
    render(<ScenarioAnalysisPanel portfolioWeights={mockPortfolioWeights} />);
    expect(screen.getByText('Portfolio Scenario Analysis & Stress Testing')).toBeInTheDocument();
  });

  test('displays tabs for different scenario types', () => {
    render(<ScenarioAnalysisPanel portfolioWeights={mockPortfolioWeights} />);
    expect(screen.getByText('Historical Scenarios')).toBeInTheDocument();
    expect(screen.getByText('Custom Scenarios')).toBeInTheDocument();
    expect(screen.getByText('Monte Carlo Simulation')).toBeInTheDocument();
    expect(screen.getByText('Results')).toBeInTheDocument();
  });

  test('displays historical scenarios', () => {
    render(<ScenarioAnalysisPanel portfolioWeights={mockPortfolioWeights} />);
    
    // Check if historical scenarios are displayed
    expect(screen.getByText('2008 Financial Crisis')).toBeInTheDocument();
    expect(screen.getByText('COVID-19 Market Crash')).toBeInTheDocument();
    expect(screen.getByText('Dot-com Bubble Burst')).toBeInTheDocument();
  });

  test('allows selecting and deselecting scenarios', () => {
    render(<ScenarioAnalysisPanel portfolioWeights={mockPortfolioWeights} />);
    
    // Find the COVID-19 scenario card
    const covidScenario = screen.getByText('COVID-19 Market Crash').closest('.MuiCard-root');
    
    // It should be selected by default
    expect(covidScenario).toHaveStyle('border: 2px solid');
    
    // Click to deselect
    fireEvent.click(covidScenario!);
    
    // It should now be deselected
    expect(covidScenario).toHaveStyle('border: 1px solid');
    
    // Click to select again
    fireEvent.click(covidScenario!);
    
    // It should be selected again
    expect(covidScenario).toHaveStyle('border: 2px solid');
  });

  test('switches to custom scenarios tab', () => {
    render(<ScenarioAnalysisPanel portfolioWeights={mockPortfolioWeights} />);
    
    // Click on the Custom Scenarios tab
    const customScenariosTab = screen.getByText('Custom Scenarios');
    fireEvent.click(customScenariosTab);
    
    // Check if custom scenarios form is displayed
    expect(screen.getByText('Create Custom Scenario')).toBeInTheDocument();
    expect(screen.getByText('Custom Scenarios')).toBeInTheDocument();
    expect(screen.getByLabelText('Scenario Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByText('Asset Price Shocks (%)')).toBeInTheDocument();
  });

  test('allows creating a custom scenario', () => {
    render(<ScenarioAnalysisPanel portfolioWeights={mockPortfolioWeights} />);
    
    // Switch to custom scenarios tab
    const customScenariosTab = screen.getByText('Custom Scenarios');
    fireEvent.click(customScenariosTab);
    
    // Fill in scenario name and description
    const nameInput = screen.getByLabelText('Scenario Name');
    fireEvent.change(nameInput, { target: { value: 'My Custom Scenario' } });
    
    const descriptionInput = screen.getByLabelText('Description');
    fireEvent.change(descriptionInput, { target: { value: 'This is my custom scenario' } });
    
    // Set shock values for assets
    const shockInputs = screen.getAllByRole('spinbutton');
    fireEvent.change(shockInputs[0], { target: { value: '-15' } }); // AAPL: -15%
    fireEvent.change(shockInputs[1], { target: { value: '-10' } }); // MSFT: -10%
    
    // Click Add Custom Scenario button
    const addButton = screen.getByText('Add Custom Scenario');
    fireEvent.click(addButton);
    
    // Check if scenario was added
    expect(screen.getByText('My Custom Scenario')).toBeInTheDocument();
    expect(screen.getByText('This is my custom scenario')).toBeInTheDocument();
  });

  test('switches to Monte Carlo simulation tab', () => {
    render(<ScenarioAnalysisPanel portfolioWeights={mockPortfolioWeights} />);
    
    // Click on the Monte Carlo Simulation tab
    const monteCarloTab = screen.getByText('Monte Carlo Simulation');
    fireEvent.click(monteCarloTab);
    
    // Check if Monte Carlo settings are displayed
    expect(screen.getByText('Monte Carlo Simulation Settings')).toBeInTheDocument();
    expect(screen.getByText('Include Monte Carlo Simulation')).toBeInTheDocument();
    expect(screen.getByLabelText('Number of Simulations')).toBeInTheDocument();
    expect(screen.getByLabelText('Time Horizon (Trading Days)')).toBeInTheDocument();
    expect(screen.getByText(/Confidence Level:/)).toBeInTheDocument();
  });

  test('allows configuring Monte Carlo simulation', () => {
    render(<ScenarioAnalysisPanel portfolioWeights={mockPortfolioWeights} />);
    
    // Switch to Monte Carlo tab
    const monteCarloTab = screen.getByText('Monte Carlo Simulation');
    fireEvent.click(monteCarloTab);
    
    // Toggle Monte Carlo simulation
    const includeMonteCarloSwitch = screen.getByRole('checkbox');
    fireEvent.click(includeMonteCarloSwitch);
    
    // Change simulation parameters
    const simulationsInput = screen.getByLabelText('Number of Simulations');
    fireEvent.change(simulationsInput, { target: { value: '2000' } });
    
    const timeHorizonInput = screen.getByLabelText('Time Horizon (Trading Days)');
    fireEvent.change(timeHorizonInput, { target: { value: '126' } });
    
    // Show advanced settings
    const advancedSettingsSwitch = screen.getAllByRole('checkbox')[1];
    fireEvent.click(advancedSettingsSwitch);
    
    // Check if advanced settings are displayed
    expect(screen.getByLabelText('Return Shock (%)')).toBeInTheDocument();
    expect(screen.getByLabelText('Volatility Multiplier')).toBeInTheDocument();
    
    // Change advanced settings
    const returnShockInput = screen.getByLabelText('Return Shock (%)');
    fireEvent.change(returnShockInput, { target: { value: '-5' } });
    
    const volatilityInput = screen.getByLabelText('Volatility Multiplier');
    fireEvent.change(volatilityInput, { target: { value: '2' } });
  });

  test('runs scenario analysis when button is clicked', async () => {
    render(
      <ScenarioAnalysisPanel 
        portfolioWeights={mockPortfolioWeights} 
        onScenarioResultsGenerated={mockOnScenarioResultsGenerated} 
      />
    );
    
    // Click Run Scenario Analysis button
    const runButton = screen.getByText('Run Scenario Analysis');
    fireEvent.click(runButton);
    
    // Check if loading state is triggered
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Switch to Results tab
    const resultsTab = screen.getByText('Results');
    fireEvent.click(resultsTab);
    
    // Check if results are displayed
    expect(screen.getByText('Scenario Analysis Results')).toBeInTheDocument();
    
    // Check if callback was called
    expect(mockOnScenarioResultsGenerated).toHaveBeenCalled();
  });

  test('displays scenario analysis results', async () => {
    render(<ScenarioAnalysisPanel portfolioWeights={mockPortfolioWeights} />);
    
    // Run scenario analysis
    const runButton = screen.getByText('Run Scenario Analysis');
    fireEvent.click(runButton);
    
    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Switch to Results tab
    const resultsTab = screen.getByText('Results');
    fireEvent.click(resultsTab);
    
    // Check if results table is displayed
    expect(screen.getByText('Scenario Analysis Results')).toBeInTheDocument();
    
    // Check if table headers are displayed
    expect(screen.getByText('Scenario')).toBeInTheDocument();
    expect(screen.getByText('Portfolio Value')).toBeInTheDocument();
    expect(screen.getByText('Change (%)')).toBeInTheDocument();
    expect(screen.getByText('Volatility (%)')).toBeInTheDocument();
    expect(screen.getByText('Max Drawdown (%)')).toBeInTheDocument();
    expect(screen.getByText('VaR (95%)')).toBeInTheDocument();
    expect(screen.getByText('CVaR (95%)')).toBeInTheDocument();
    
    // Check if results for selected scenarios are displayed
    expect(screen.getByText('2008 Financial Crisis')).toBeInTheDocument();
    expect(screen.getByText('COVID-19 Market Crash')).toBeInTheDocument();
  });

  test('displays asset impact analysis', async () => {
    render(<ScenarioAnalysisPanel portfolioWeights={mockPortfolioWeights} />);
    
    // Run scenario analysis
    const runButton = screen.getByText('Run Scenario Analysis');
    fireEvent.click(runButton);
    
    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Switch to Results tab
    const resultsTab = screen.getByText('Results');
    fireEvent.click(resultsTab);
    
    // Check if asset impact analysis is displayed
    expect(screen.getByText('Asset Impact Analysis')).toBeInTheDocument();
    
    // Check if table headers are displayed
    const tableHeaders = screen.getAllByRole('columnheader');
    expect(tableHeaders[4]).toHaveTextContent('Symbol');
    expect(tableHeaders[5]).toHaveTextContent('Weight (%)');
    expect(tableHeaders[6]).toHaveTextContent('Impact (%)');
    expect(tableHeaders[7]).toHaveTextContent('Contribution (%)');
    
    // Check if assets are displayed in the table
    expect(screen.getAllByText('AAPL')[1]).toBeInTheDocument();
    expect(screen.getAllByText('MSFT')[1]).toBeInTheDocument();
  });

  test('displays Monte Carlo simulation results when available', async () => {
    render(<ScenarioAnalysisPanel portfolioWeights={mockPortfolioWeights} />);
    
    // Switch to Monte Carlo tab
    const monteCarloTab = screen.getByText('Monte Carlo Simulation');
    fireEvent.click(monteCarloTab);
    
    // Toggle Monte Carlo simulation
    const includeMonteCarloSwitch = screen.getByRole('checkbox');
    fireEvent.click(includeMonteCarloSwitch);
    
    // Run scenario analysis
    const runButton = screen.getByText('Run Scenario Analysis');
    fireEvent.click(runButton);
    
    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Switch to Results tab
    const resultsTab = screen.getByText('Results');
    fireEvent.click(resultsTab);
    
    // Check if Monte Carlo results are displayed
    expect(screen.getByText('Monte Carlo Simulation Results')).toBeInTheDocument();
    
    // Check if Monte Carlo metrics are displayed
    expect(screen.getByText('Mean Final Value')).toBeInTheDocument();
    expect(screen.getByText('Median Final Value')).toBeInTheDocument();
    expect(screen.getByText('Minimum Final Value')).toBeInTheDocument();
    expect(screen.getByText('Maximum Final Value')).toBeInTheDocument();
    expect(screen.getByText('Value at Risk (95%)')).toBeInTheDocument();
    expect(screen.getByText('Conditional VaR (95%)')).toBeInTheDocument();
    expect(screen.getByText('Probability of Loss')).toBeInTheDocument();
  });
});