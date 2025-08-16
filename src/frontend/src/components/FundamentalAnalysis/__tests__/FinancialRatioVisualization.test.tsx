import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import FinancialRatioVisualization from '../FinancialRatioVisualization';

// Mock recharts components
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
    BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
    Bar: ({ name }) => <div data-testid="bar">{name}</div>,
    LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
    Line: ({ name }) => <div data-testid="line">{name}</div>,
    XAxis: () => <div data-testid="x-axis"></div>,
    YAxis: () => <div data-testid="y-axis"></div>,
    CartesianGrid: () => <div data-testid="cartesian-grid"></div>,
    Tooltip: () => <div data-testid="tooltip"></div>,
    Legend: () => <div data-testid="legend"></div>,
    RadarChart: ({ children }) => <div data-testid="radar-chart">{children}</div>,
    Radar: ({ name }) => <div data-testid="radar">{name}</div>,
    PolarGrid: () => <div data-testid="polar-grid"></div>,
    PolarAngleAxis: () => <div data-testid="polar-angle-axis"></div>,
    PolarRadiusAxis: () => <div data-testid="polar-radius-axis"></div>,
  };
});

// Sample data for tests
const mockFinancialRatios = {
  symbol: 'AAPL',
  date: '2023-06-30',
  previous_date: '2022-06-30',
  ratios: {
    liquidity: {
      current_ratio: 0.94,
      quick_ratio: 0.88,
      cash_ratio: 0.21
    },
    profitability: {
      gross_margin: 0.44,
      operating_margin: 0.30,
      net_margin: 0.25,
      return_on_assets: 0.28,
      return_on_equity: 1.56
    },
    solvency: {
      debt_to_equity: 1.76,
      debt_ratio: 0.29,
      interest_coverage: 42.5
    },
    efficiency: {
      asset_turnover: 0.88,
      inventory_turnover: 40.2,
      receivables_turnover: 14.5
    },
    valuation: {
      pe_ratio: 30.2,
      pb_ratio: 47.1,
      ps_ratio: 7.5,
      ev_ebitda: 22.3
    },
    growth: {
      revenue_growth: 0.08,
      earnings_growth: 0.05,
      dividend_growth: 0.04
    }
  }
};

describe('FinancialRatioVisualization Component', () => {
  test('renders component with financial ratios data', () => {
    render(<FinancialRatioVisualization symbol="AAPL" financialRatios={mockFinancialRatios} />);
    
    // Check that the component title is rendered
    expect(screen.getByText('Financial Ratios Analysis')).toBeInTheDocument();
    
    // Check that the ratio categories are rendered
    expect(screen.getByText('Liquidity Ratios')).toBeInTheDocument();
    expect(screen.getByText('Profitability Ratios')).toBeInTheDocument();
    expect(screen.getByText('Solvency Ratios')).toBeInTheDocument();
    expect(screen.getByText('Efficiency Ratios')).toBeInTheDocument();
    expect(screen.getByText('Valuation Ratios')).toBeInTheDocument();
    expect(screen.getByText('Growth Metrics')).toBeInTheDocument();
    
    // Check that charts are rendered
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0);
    
    // Check that specific ratio values are displayed
    expect(screen.getByText('Current Ratio')).toBeInTheDocument();
    expect(screen.getByText('0.94')).toBeInTheDocument();
    
    expect(screen.getByText('Gross Margin')).toBeInTheDocument();
    expect(screen.getByText('44.0%')).toBeInTheDocument();
    
    expect(screen.getByText('Debt to Equity')).toBeInTheDocument();
    expect(screen.getByText('1.76')).toBeInTheDocument();
    
    expect(screen.getByText('P/E Ratio')).toBeInTheDocument();
    expect(screen.getByText('30.2')).toBeInTheDocument();
  });

  test('renders industry comparison section', () => {
    render(<FinancialRatioVisualization symbol="AAPL" financialRatios={mockFinancialRatios} />);
    
    // Check that the industry comparison section is rendered
    expect(screen.getByText('Industry Comparison')).toBeInTheDocument();
    
    // Check that the radar chart is rendered
    expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
  });

  test('renders historical trend section', () => {
    render(<FinancialRatioVisualization symbol="AAPL" financialRatios={mockFinancialRatios} />);
    
    // Check that the historical trend section is rendered
    expect(screen.getByText('Historical Trends')).toBeInTheDocument();
    
    // Check that the line chart is rendered
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  test('renders ratio explanations', () => {
    render(<FinancialRatioVisualization symbol="AAPL" financialRatios={mockFinancialRatios} />);
    
    // Check that the ratio explanations section is rendered
    expect(screen.getByText('Ratio Explanations')).toBeInTheDocument();
    
    // Check that specific explanations are rendered
    expect(screen.getByText(/Current Ratio: Measures the company's ability to pay short-term obligations/)).toBeInTheDocument();
    expect(screen.getByText(/Gross Margin: The percentage of revenue that exceeds the cost of goods sold/)).toBeInTheDocument();
    expect(screen.getByText(/Debt to Equity: Indicates the relative proportion of shareholders' equity and debt/)).toBeInTheDocument();
    expect(screen.getByText(/P\/E Ratio: Price to Earnings ratio, indicates how much investors are willing to pay/)).toBeInTheDocument();
  });

  test('handles missing ratio data gracefully', () => {
    // Create a copy of the mock data with some missing ratios
    const incompleteRatios = {
      ...mockFinancialRatios,
      ratios: {
        ...mockFinancialRatios.ratios,
        liquidity: {
          current_ratio: null,
          quick_ratio: 0.88,
          cash_ratio: null
        }
      }
    };
    
    render(<FinancialRatioVisualization symbol="AAPL" financialRatios={incompleteRatios} />);
    
    // Check that the component still renders
    expect(screen.getByText('Financial Ratios Analysis')).toBeInTheDocument();
    
    // Check that it handles null values appropriately
    expect(screen.getByText('Current Ratio')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
    
    expect(screen.getByText('Quick Ratio')).toBeInTheDocument();
    expect(screen.getByText('0.88')).toBeInTheDocument();
  });

  test('renders without previous date data', () => {
    // Create a copy of the mock data without previous_date
    const noHistoricalData = {
      ...mockFinancialRatios,
      previous_date: undefined
    };
    
    render(<FinancialRatioVisualization symbol="AAPL" financialRatios={noHistoricalData} />);
    
    // Check that the component still renders
    expect(screen.getByText('Financial Ratios Analysis')).toBeInTheDocument();
    
    // Check that it handles missing historical data appropriately
    expect(screen.getByText('Historical data not available')).toBeInTheDocument();
  });
});