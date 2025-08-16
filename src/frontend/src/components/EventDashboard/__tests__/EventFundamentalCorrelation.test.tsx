import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import EventFundamentalCorrelation from '../EventFundamentalCorrelation';
import correlationAnalysisService from '../../../services/correlationAnalysisService';
import eventService from '../../../services/eventService';
import financialAnalysisService from '../../../services/financialAnalysisService';

// Mock the services
jest.mock('../../../services/correlationAnalysisService');
jest.mock('../../../services/eventService');
jest.mock('../../../services/financialAnalysisService');

// Mock recharts components
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
    ComposedChart: ({ children }) => <div data-testid="composed-chart">{children}</div>,
    ScatterChart: ({ children }) => <div data-testid="scatter-chart">{children}</div>,
    Scatter: ({ name }) => <div data-testid="scatter">{name}</div>,
    Line: ({ name }) => <div data-testid="line">{name}</div>,
    Bar: ({ name }) => <div data-testid="bar">{name}</div>,
    XAxis: ({ children }) => <div data-testid="x-axis">{children}</div>,
    YAxis: ({ children }) => <div data-testid="y-axis">{children}</div>,
    CartesianGrid: () => <div data-testid="cartesian-grid"></div>,
    Tooltip: () => <div data-testid="tooltip"></div>,
    Legend: () => <div data-testid="legend"></div>,
    Label: ({ value }) => <div data-testid="axis-label">{value}</div>,
    Cell: () => <div data-testid="cell"></div>,
  };
});

// Sample data for tests
const mockTopCorrelations = [
  {
    eventType: 'earnings',
    fundamentalMetric: 'revenue_growth',
    correlationCoefficient: 0.78,
    pValue: 0.001,
    significant: true,
    sampleSize: 24
  },
  {
    eventType: 'dividend',
    fundamentalMetric: 'eps_growth',
    correlationCoefficient: -0.65,
    pValue: 0.008,
    significant: true,
    sampleSize: 18
  },
  {
    eventType: 'product_launch',
    fundamentalMetric: 'gross_profit_margin',
    correlationCoefficient: 0.42,
    pValue: 0.04,
    significant: true,
    sampleSize: 12
  }
];

const mockCorrelationData = {
  eventType: 'earnings',
  fundamentalMetric: 'revenue_growth',
  correlationCoefficient: 0.78,
  pValue: 0.001,
  dataPoints: [
    {
      eventDate: '2022-01-15',
      eventId: 'event1',
      eventValue: 1.2,
      metricValue: 0.15,
      metricDate: '2022-01-31'
    },
    {
      eventDate: '2022-04-15',
      eventId: 'event2',
      eventValue: 1.5,
      metricValue: 0.18,
      metricDate: '2022-04-30'
    },
    {
      eventDate: '2022-07-15',
      eventId: 'event3',
      eventValue: 1.8,
      metricValue: 0.22,
      metricDate: '2022-07-31'
    },
    {
      eventDate: '2022-10-15',
      eventId: 'event4',
      eventValue: 1.7,
      metricValue: 0.20,
      metricDate: '2022-10-31'
    }
  ],
  regressionLine: [
    { x: 1.2, y: 0.14 },
    { x: 1.8, y: 0.23 }
  ]
};

describe('EventFundamentalCorrelation Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock implementations
    (correlationAnalysisService.getTopEventFundamentalCorrelations as jest.Mock).mockResolvedValue(mockTopCorrelations);
    (correlationAnalysisService.getEventFundamentalCorrelation as jest.Mock).mockResolvedValue(mockCorrelationData);
  });

  test('renders component and fetches top correlations', async () => {
    render(<EventFundamentalCorrelation symbol="AAPL" />);
    
    // Check that the component title is rendered
    expect(screen.getByText('Event-Fundamental Correlation Analysis')).toBeInTheDocument();
    
    // Check that the top correlations title is rendered
    expect(screen.getByText('Top Correlations for AAPL')).toBeInTheDocument();
    
    // Verify service was called
    expect(correlationAnalysisService.getTopEventFundamentalCorrelations).toHaveBeenCalledWith('AAPL');
    
    // Wait for top correlations to load
    await waitFor(() => {
      expect(screen.getByText('Event Type')).toBeInTheDocument();
    });
    
    // Check that the top correlations table is rendered with data
    expect(screen.getByText('Earnings Announcements')).toBeInTheDocument();
    expect(screen.getByText('Revenue Growth')).toBeInTheDocument();
    expect(screen.getByText('0.780')).toBeInTheDocument();
    expect(screen.getByText('Strong')).toBeInTheDocument();
  });

  test('fetches correlation data when component mounts', async () => {
    render(<EventFundamentalCorrelation symbol="AAPL" />);
    
    // Verify service was called for initial correlation data
    await waitFor(() => {
      expect(correlationAnalysisService.getEventFundamentalCorrelation).toHaveBeenCalledWith(
        'AAPL',
        'earnings',
        'revenue_growth',
        '1y'
      );
    });
    
    // Wait for correlation data to load
    await waitFor(() => {
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
    
    // Check that the correlation statistics are displayed
    expect(screen.getByText('Correlation Coefficient: 0.780')).toBeInTheDocument();
    expect(screen.getByText('Strength: Strong')).toBeInTheDocument();
    expect(screen.getByText('Statistical Significance: p = 0.001 (Very Significant)')).toBeInTheDocument();
    expect(screen.getByText('Data Points: 4')).toBeInTheDocument();
  });

  test('updates correlation data when event type is changed', async () => {
    render(<EventFundamentalCorrelation symbol="AAPL" />);
    
    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
    
    // Mock new correlation data for dividend events
    const newCorrelationData = {
      ...mockCorrelationData,
      eventType: 'dividend',
      fundamentalMetric: 'revenue_growth',
      correlationCoefficient: 0.45
    };
    (correlationAnalysisService.getEventFundamentalCorrelation as jest.Mock).mockResolvedValue(newCorrelationData);
    
    // Change event type to dividend
    fireEvent.mouseDown(screen.getByLabelText('Event Type'));
    fireEvent.click(screen.getByText('Dividend Announcements'));
    
    // Verify service was called with new parameters
    await waitFor(() => {
      expect(correlationAnalysisService.getEventFundamentalCorrelation).toHaveBeenCalledWith(
        'AAPL',
        'dividend',
        'revenue_growth',
        '1y'
      );
    });
    
    // Check that the correlation statistics are updated
    await waitFor(() => {
      expect(screen.getByText('Correlation Coefficient: 0.450')).toBeInTheDocument();
    });
  });

  test('updates correlation data when fundamental metric is changed', async () => {
    render(<EventFundamentalCorrelation symbol="AAPL" />);
    
    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
    
    // Mock new correlation data for EPS Growth
    const newCorrelationData = {
      ...mockCorrelationData,
      eventType: 'earnings',
      fundamentalMetric: 'eps_growth',
      correlationCoefficient: 0.62
    };
    (correlationAnalysisService.getEventFundamentalCorrelation as jest.Mock).mockResolvedValue(newCorrelationData);
    
    // Change fundamental metric to EPS Growth
    fireEvent.mouseDown(screen.getByLabelText('Fundamental Metric'));
    fireEvent.click(screen.getByText('EPS Growth'));
    
    // Verify service was called with new parameters
    await waitFor(() => {
      expect(correlationAnalysisService.getEventFundamentalCorrelation).toHaveBeenCalledWith(
        'AAPL',
        'earnings',
        'eps_growth',
        '1y'
      );
    });
    
    // Check that the correlation statistics are updated
    await waitFor(() => {
      expect(screen.getByText('Correlation Coefficient: 0.620')).toBeInTheDocument();
    });
  });

  test('updates correlation data when timeframe is changed', async () => {
    render(<EventFundamentalCorrelation symbol="AAPL" />);
    
    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
    
    // Mock new correlation data for 3-year timeframe
    const newCorrelationData = {
      ...mockCorrelationData,
      correlationCoefficient: 0.71
    };
    (correlationAnalysisService.getEventFundamentalCorrelation as jest.Mock).mockResolvedValue(newCorrelationData);
    
    // Change timeframe to 3 Years
    fireEvent.mouseDown(screen.getByLabelText('Timeframe'));
    fireEvent.click(screen.getByText('3 Years'));
    
    // Verify service was called with new parameters
    await waitFor(() => {
      expect(correlationAnalysisService.getEventFundamentalCorrelation).toHaveBeenCalledWith(
        'AAPL',
        'earnings',
        'revenue_growth',
        '3y'
      );
    });
    
    // Check that the correlation statistics are updated
    await waitFor(() => {
      expect(screen.getByText('Correlation Coefficient: 0.710')).toBeInTheDocument();
    });
  });

  test('selects correlation from top correlations table', async () => {
    render(<EventFundamentalCorrelation symbol="AAPL" />);
    
    // Wait for top correlations to load
    await waitFor(() => {
      expect(screen.getByText('Event Type')).toBeInTheDocument();
    });
    
    // Mock new correlation data for product_launch and gross_profit_margin
    const newCorrelationData = {
      ...mockCorrelationData,
      eventType: 'product_launch',
      fundamentalMetric: 'gross_profit_margin',
      correlationCoefficient: 0.42
    };
    (correlationAnalysisService.getEventFundamentalCorrelation as jest.Mock).mockResolvedValue(newCorrelationData);
    
    // Click on the third row in the top correlations table
    const tableRows = screen.getAllByRole('row');
    fireEvent.click(tableRows[3]); // First row is header, so we want the third data row
    
    // Verify service was called with new parameters
    await waitFor(() => {
      expect(correlationAnalysisService.getEventFundamentalCorrelation).toHaveBeenCalledWith(
        'AAPL',
        'product_launch',
        'gross_profit_margin',
        '1y'
      );
    });
    
    // Check that the correlation statistics are updated
    await waitFor(() => {
      expect(screen.getByText('Correlation Coefficient: 0.420')).toBeInTheDocument();
    });
  });

  test('handles error when fetching correlation data', async () => {
    // Mock the service to reject
    (correlationAnalysisService.getEventFundamentalCorrelation as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch correlation data')
    );
    
    render(<EventFundamentalCorrelation symbol="AAPL" />);
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch correlation data. Please try again later.')).toBeInTheDocument();
    });
  });
});