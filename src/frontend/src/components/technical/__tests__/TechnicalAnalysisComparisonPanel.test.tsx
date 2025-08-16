import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TechnicalAnalysisComparisonPanel from '../TechnicalAnalysisComparisonPanel';
import { technicalService, technicalServiceExtensions } from '../../../services';

// Mock the services
jest.mock('../../../services', () => ({
  technicalService: {
    getAvailableIndicators: jest.fn(),
    getWatchlistSymbols: jest.fn(),
  },
  technicalServiceExtensions: {
    calculateIndicator: jest.fn(),
    getSavedComparisons: jest.fn(),
    saveComparison: jest.fn(),
    deleteComparison: jest.fn(),
    runComparison: jest.fn(),
  },
}));

// Mock recharts components
jest.mock('recharts', () => ({
  LineChart: () => <div data-testid="line-chart" />,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Area: () => <div />,
  ComposedChart: () => <div />,
  Bar: () => <div />,
}));

describe('TechnicalAnalysisComparisonPanel', () => {
  const mockIndicators = [
    {
      id: 'rsi',
      name: 'RSI',
      type: 'oscillator',
      parameters: [
        {
          name: 'period',
          type: 'number',
          defaultValue: 14,
          min: 2,
          max: 50,
        },
      ],
      defaultParameters: {
        period: 14,
      },
    },
    {
      id: 'macd',
      name: 'MACD',
      type: 'oscillator',
      parameters: [
        {
          name: 'fastPeriod',
          type: 'number',
          defaultValue: 12,
          min: 2,
          max: 50,
        },
        {
          name: 'slowPeriod',
          type: 'number',
          defaultValue: 26,
          min: 2,
          max: 50,
        },
        {
          name: 'signalPeriod',
          type: 'number',
          defaultValue: 9,
          min: 2,
          max: 50,
        },
      ],
      defaultParameters: {
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
      },
    },
  ];

  const mockSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];

  const mockComparisonData = [
    {
      date: '2023-01-01',
      AAPL_RSI: 65.42,
      MSFT_MACD: 2.35,
    },
    {
      date: '2023-01-02',
      AAPL_RSI: 68.17,
      MSFT_MACD: 2.87,
    },
    {
      date: '2023-01-03',
      AAPL_RSI: 70.23,
      MSFT_MACD: 3.12,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (technicalService.getAvailableIndicators as jest.Mock).mockResolvedValue(mockIndicators);
    (technicalService.getWatchlistSymbols as jest.Mock).mockResolvedValue(mockSymbols);
    (technicalServiceExtensions.calculateIndicator as jest.Mock).mockResolvedValue([
      { timestamp: '2023-01-01', value: 65.42 },
      { timestamp: '2023-01-02', value: 68.17 },
      { timestamp: '2023-01-03', value: 70.23 },
    ]);
  });

  test('renders the component with tabs', async () => {
    render(<TechnicalAnalysisComparisonPanel />);
    
    expect(screen.getByText('Configure Comparison')).toBeInTheDocument();
    expect(screen.getByText('Comparison Results')).toBeInTheDocument();
    
    // Should load indicators and symbols on mount
    await waitFor(() => {
      expect(technicalService.getAvailableIndicators).toHaveBeenCalled();
      expect(technicalService.getWatchlistSymbols).toHaveBeenCalled();
    });
  });

  test('allows adding comparison items', async () => {
    render(<TechnicalAnalysisComparisonPanel />);
    
    // Wait for initial data to load
    await waitFor(() => {
      expect(technicalService.getAvailableIndicators).toHaveBeenCalled();
    });
    
    // Click the Add Item button
    fireEvent.click(screen.getByText('Add Item'));
    
    // Check if item form appears
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    
    // Check if form fields are rendered
    expect(screen.getAllByLabelText('Symbol')[0]).toBeInTheDocument();
    expect(screen.getAllByLabelText('Indicator')[0]).toBeInTheDocument();
    expect(screen.getAllByLabelText('Timeframe')[0]).toBeInTheDocument();
    expect(screen.getAllByLabelText('Color')[0]).toBeInTheDocument();
  });

  test('handles running a comparison', async () => {
    render(<TechnicalAnalysisComparisonPanel />);
    
    // Wait for initial data to load
    await waitFor(() => {
      expect(technicalService.getAvailableIndicators).toHaveBeenCalled();
    });
    
    // Add a comparison item
    fireEvent.click(screen.getByText('Add Item'));
    
    // Set comparison name
    fireEvent.change(screen.getByLabelText('Comparison Name'), {
      target: { value: 'Test Comparison' },
    });
    
    // Run the comparison
    fireEvent.click(screen.getByText('Run Comparison'));
    
    await waitFor(() => {
      expect(technicalServiceExtensions.calculateIndicator).toHaveBeenCalled();
    });
    
    // Should switch to results tab
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  test('handles saving a comparison', async () => {
    (technicalServiceExtensions.calculateIndicator as jest.Mock).mockResolvedValueOnce([
      { timestamp: '2023-01-01', value: 65.42 },
      { timestamp: '2023-01-02', value: 68.17 },
      { timestamp: '2023-01-03', value: 70.23 },
    ]);
    
    const onSaveComparisonMock = jest.fn();
    
    render(<TechnicalAnalysisComparisonPanel onSaveComparison={onSaveComparisonMock} />);
    
    // Wait for initial data to load
    await waitFor(() => {
      expect(technicalService.getAvailableIndicators).toHaveBeenCalled();
    });
    
    // Add a comparison item
    fireEvent.click(screen.getByText('Add Item'));
    
    // Set comparison name
    fireEvent.change(screen.getByLabelText('Comparison Name'), {
      target: { value: 'Test Comparison' },
    });
    
    // Run the comparison
    fireEvent.click(screen.getByText('Run Comparison'));
    
    await waitFor(() => {
      expect(technicalServiceExtensions.calculateIndicator).toHaveBeenCalled();
    });
    
    // Save the comparison
    fireEvent.click(screen.getByText('Save Comparison'));
    
    expect(onSaveComparisonMock).toHaveBeenCalled();
    expect(onSaveComparisonMock.mock.calls[0][0]).toHaveProperty('name', 'Test Comparison');
  });

  test('displays error when trying to run comparison without items', async () => {
    render(<TechnicalAnalysisComparisonPanel />);
    
    // Wait for initial data to load
    await waitFor(() => {
      expect(technicalService.getAvailableIndicators).toHaveBeenCalled();
    });
    
    // Try to run comparison without adding items
    fireEvent.click(screen.getByText('Run Comparison'));
    
    // Should show error
    expect(screen.getByText('Please add at least one item to compare')).toBeInTheDocument();
  });

  test('allows changing symbol, indicator and timeframe', async () => {
    render(<TechnicalAnalysisComparisonPanel />);
    
    // Wait for initial data to load
    await waitFor(() => {
      expect(technicalService.getAvailableIndicators).toHaveBeenCalled();
    });
    
    // Add a comparison item
    fireEvent.click(screen.getByText('Add Item'));
    
    // Open symbol dropdown
    fireEvent.mouseDown(screen.getAllByLabelText('Symbol')[0]);
    
    // Select a different symbol
    const symbolOption = await screen.findByText('GOOGL');
    fireEvent.click(symbolOption);
    
    // Open indicator dropdown
    fireEvent.mouseDown(screen.getAllByLabelText('Indicator')[0]);
    
    // Select a different indicator
    const indicatorOption = await screen.findByText('MACD');
    fireEvent.click(indicatorOption);
    
    // Open timeframe dropdown
    fireEvent.mouseDown(screen.getAllByLabelText('Timeframe')[0]);
    
    // Select a different timeframe
    const timeframeOption = await screen.findByText('1h');
    fireEvent.click(timeframeOption);
    
    // Run the comparison
    fireEvent.click(screen.getByText('Run Comparison'));
    
    await waitFor(() => {
      expect(technicalServiceExtensions.calculateIndicator).toHaveBeenCalledWith(
        'GOOGL',
        'macd',
        expect.any(Object),
        '1h',
        expect.any(String),
        expect.any(String)
      );
    });
  });
});