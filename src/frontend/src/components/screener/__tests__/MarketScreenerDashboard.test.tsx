import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MarketScreenerDashboard from '../MarketScreenerDashboard';
import screenerService from '../../../services/screenerService';

// Mock the screenerService
jest.mock('../../../services/screenerService', () => ({
  getAvailableMetrics: jest.fn(),
  screenStocks: jest.fn(),
  saveCustomScreen: jest.fn(),
  getCustomScreens: jest.fn(),
  getPresetScreens: jest.fn(),
  exportToCsv: jest.fn(),
  getOperatorsForFieldType: jest.fn(),
  getOperatorDisplayText: jest.fn(),
  getPredefinedFilters: jest.fn(),
  getFieldCategories: jest.fn(),
}));

// Mock the child components
jest.mock('../ScreenerCriteriaBuilder', () => {
  return function MockScreenerCriteriaBuilder(props: any) {
    return (
      <div data-testid="screener-criteria-builder">
        <button 
          data-testid="run-screener-button" 
          onClick={() => props.onRunScreener()}
        >
          Run Screener
        </button>
        <button 
          data-testid="save-screen-button" 
          onClick={() => props.onSaveScreen()}
        >
          Save Screen
        </button>
      </div>
    );
  };
});

jest.mock('../ScreenerResultsPanel', () => {
  return function MockScreenerResultsPanel(props: any) {
    return <div data-testid="screener-results-panel">Results Panel</div>;
  };
});

jest.mock('../SavedScreenersPanel', () => {
  return function MockSavedScreenersPanel(props: any) {
    return (
      <div data-testid="saved-screeners-panel">
        <button 
          data-testid="load-screen-button" 
          onClick={() => props.onLoadScreen({ id: '1', name: 'Test Screen', filters: [] })}
        >
          Load Screen
        </button>
        <button 
          data-testid="run-saved-screen-button" 
          onClick={() => props.onRunScreen({ id: '1', name: 'Test Screen', filters: [] })}
        >
          Run Saved Screen
        </button>
      </div>
    );
  };
});

jest.mock('../ScreenerTemplatesPanel', () => {
  return function MockScreenerTemplatesPanel(props: any) {
    return (
      <div data-testid="screener-templates-panel">
        <button 
          data-testid="load-template-button" 
          onClick={() => props.onLoadTemplate({ id: '1', name: 'Test Template', filters: [] })}
        >
          Load Template
        </button>
        <button 
          data-testid="run-template-button" 
          onClick={() => props.onRunTemplate({ id: '1', name: 'Test Template', filters: [] })}
        >
          Run Template
        </button>
      </div>
    );
  };
});

describe('MarketScreenerDashboard', () => {
  const mockMetrics = [
    {
      category: 'Price & Volume',
      metrics: [
        { id: 'price', name: 'Price', description: 'Current stock price' },
        { id: 'volume', name: 'Volume', description: 'Trading volume' },
      ],
    },
    {
      category: 'Fundamentals',
      metrics: [
        { id: 'pe', name: 'P/E Ratio', description: 'Price to earnings ratio' },
        { id: 'eps', name: 'EPS', description: 'Earnings per share' },
      ],
    },
  ];

  const mockScreenResults = {
    results: [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 150.25,
        change: 2.5,
        changePercent: 1.69,
        marketCap: 2500000000000,
        sector: 'Technology',
        industry: 'Consumer Electronics',
        volume: 75000000,
      },
      {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        price: 290.75,
        change: 1.25,
        changePercent: 0.43,
        marketCap: 2200000000000,
        sector: 'Technology',
        industry: 'Software',
        volume: 25000000,
      },
    ],
    total: 2,
    page: 1,
    limit: 50,
    totalPages: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (screenerService.getAvailableMetrics as jest.Mock).mockResolvedValue(mockMetrics);
    (screenerService.screenStocks as jest.Mock).mockResolvedValue(mockScreenResults);
  });

  test('renders the dashboard with tabs', async () => {
    render(<MarketScreenerDashboard />);
    
    expect(screen.getByText('Stock Market Screener')).toBeInTheDocument();
    expect(screen.getByText('Find investment opportunities that match your criteria')).toBeInTheDocument();
    
    // Check tabs
    expect(screen.getByText('Criteria Builder')).toBeInTheDocument();
    expect(screen.getByText('Results')).toBeInTheDocument();
    expect(screen.getByText('Saved Screens')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
    
    // Should load metrics on mount
    await waitFor(() => {
      expect(screenerService.getAvailableMetrics).toHaveBeenCalled();
    });
    
    // Should render the criteria builder by default
    expect(screen.getByTestId('screener-criteria-builder')).toBeInTheDocument();
  });

  test('runs a screener and shows results', async () => {
    render(<MarketScreenerDashboard />);
    
    // Click the run button in the criteria builder
    fireEvent.click(screen.getByTestId('run-screener-button'));
    
    await waitFor(() => {
      expect(screenerService.screenStocks).toHaveBeenCalled();
    });
    
    // Should switch to results tab and show results panel
    expect(screen.getByTestId('screener-results-panel')).toBeInTheDocument();
  });

  test('saves a screen', async () => {
    (screenerService.saveCustomScreen as jest.Mock).mockResolvedValue({
      id: '1',
      name: 'Test Screen',
      filters: [],
    });
    
    render(<MarketScreenerDashboard />);
    
    // Click the save button in the criteria builder
    fireEvent.click(screen.getByTestId('save-screen-button'));
    
    await waitFor(() => {
      expect(screenerService.saveCustomScreen).toHaveBeenCalled();
    });
  });

  test('loads a saved screen', async () => {
    render(<MarketScreenerDashboard />);
    
    // Switch to saved screens tab
    fireEvent.click(screen.getByText('Saved Screens'));
    
    // Click the load button in the saved screens panel
    fireEvent.click(screen.getByTestId('load-screen-button'));
    
    // Should switch back to criteria builder tab
    expect(screen.getByTestId('screener-criteria-builder')).toBeInTheDocument();
  });

  test('runs a saved screen', async () => {
    render(<MarketScreenerDashboard />);
    
    // Switch to saved screens tab
    fireEvent.click(screen.getByText('Saved Screens'));
    
    // Click the run button in the saved screens panel
    fireEvent.click(screen.getByTestId('run-saved-screen-button'));
    
    await waitFor(() => {
      expect(screenerService.screenStocks).toHaveBeenCalled();
    });
    
    // Should switch to results tab
    expect(screen.getByTestId('screener-results-panel')).toBeInTheDocument();
  });

  test('loads a template', async () => {
    render(<MarketScreenerDashboard />);
    
    // Switch to templates tab
    fireEvent.click(screen.getByText('Templates'));
    
    // Click the load button in the templates panel
    fireEvent.click(screen.getByTestId('load-template-button'));
    
    // Should switch back to criteria builder tab
    expect(screen.getByTestId('screener-criteria-builder')).toBeInTheDocument();
  });

  test('runs a template', async () => {
    render(<MarketScreenerDashboard />);
    
    // Switch to templates tab
    fireEvent.click(screen.getByText('Templates'));
    
    // Click the run button in the templates panel
    fireEvent.click(screen.getByTestId('run-template-button'));
    
    await waitFor(() => {
      expect(screenerService.screenStocks).toHaveBeenCalled();
    });
    
    // Should switch to results tab
    expect(screen.getByTestId('screener-results-panel')).toBeInTheDocument();
  });
});