import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ValuationModelVisualization from '../ValuationModelVisualization';

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
    PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
    Pie: ({ data }) => <div data-testid="pie">{data.length} segments</div>,
    Cell: () => <div data-testid="cell"></div>,
  };
});

// Sample data for tests
const mockValuationData = {
  symbol: 'AAPL',
  current_price: 175.84,
  dcf: {
    share_price: 195.23,
    equity_value: 3050000000000,
    enterprise_value: 3200000000000,
    terminal_value: 4500000000000,
    terminal_value_pv: 2800000000000,
    forecasted_cash_flows: [85000000000, 92000000000, 98000000000, 105000000000, 112000000000],
    present_values: [80000000000, 82000000000, 83000000000, 84000000000, 85000000000],
    discount_rate: 0.09,
    terminal_growth_rate: 0.03,
    forecast_period: 5
  },
  comparable: {
    comparable_symbols: ['MSFT', 'GOOGL', 'AMZN', 'META'],
    average_multiples: {
      pe_ratio: 28.5,
      ps_ratio: 6.8,
      pb_ratio: 12.3,
      ev_ebitda: 18.7
    },
    median_multiples: {
      pe_ratio: 27.2,
      ps_ratio: 6.5,
      pb_ratio: 11.8,
      ev_ebitda: 17.9
    },
    avg_share_price: 187.45,
    median_share_price: 190.12,
    implied_values_avg: {
      pe_ratio: 185.25,
      ps_ratio: 190.40,
      pb_ratio: 182.70,
      ev_ebitda: 191.45
    },
    implied_values_median: {
      pe_ratio: 176.80,
      ps_ratio: 182.00,
      pb_ratio: 175.42,
      ev_ebitda: 188.25
    }
  },
  analyst_consensus: {
    target_price: 192.50,
    high_target: 215.00,
    low_target: 170.00,
    num_buy_ratings: 28,
    num_hold_ratings: 8,
    num_sell_ratings: 2,
    consensus_rating: 'Buy',
    upside_potential: 0.095
  },
  consensus: {
    share_price: 192.35,
    upside_potential: 0.094,
    model_weights: {
      dcf: 0.4,
      comparable: 0.3,
      analyst: 0.3
    }
  }
};

describe('ValuationModelVisualization Component', () => {
  test('renders component with valuation data', () => {
    render(<ValuationModelVisualization symbol="AAPL" valuationData={mockValuationData} />);
    
    // Check that the component title is rendered
    expect(screen.getByText('Valuation Models')).toBeInTheDocument();
    
    // Check that the current price is displayed
    expect(screen.getByText('Current Price: $175.84')).toBeInTheDocument();
    
    // Check that the valuation summary is displayed
    expect(screen.getByText('Consensus Target: $192.35')).toBeInTheDocument();
    expect(screen.getByText('Potential Upside: 9.4%')).toBeInTheDocument();
  });

  test('renders DCF model section', () => {
    render(<ValuationModelVisualization symbol="AAPL" valuationData={mockValuationData} />);
    
    // Check that the DCF section is rendered
    expect(screen.getByText('Discounted Cash Flow (DCF) Model')).toBeInTheDocument();
    
    // Check that DCF details are displayed
    expect(screen.getByText('DCF Share Price: $195.23')).toBeInTheDocument();
    expect(screen.getByText('Discount Rate: 9.0%')).toBeInTheDocument();
    expect(screen.getByText('Terminal Growth Rate: 3.0%')).toBeInTheDocument();
    expect(screen.getByText('Forecast Period: 5 years')).toBeInTheDocument();
    
    // Check that charts are rendered
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0);
  });

  test('renders Comparable Company Analysis section', () => {
    render(<ValuationModelVisualization symbol="AAPL" valuationData={mockValuationData} />);
    
    // Check that the CCA section is rendered
    expect(screen.getByText('Comparable Company Analysis')).toBeInTheDocument();
    
    // Check that CCA details are displayed
    expect(screen.getByText('Average Share Price: $187.45')).toBeInTheDocument();
    expect(screen.getByText('Median Share Price: $190.12')).toBeInTheDocument();
    
    // Check that comparable companies are listed
    expect(screen.getByText('Comparable Companies: MSFT, GOOGL, AMZN, META')).toBeInTheDocument();
    
    // Check that multiple tables are rendered
    expect(screen.getByText('Multiple')).toBeInTheDocument();
    expect(screen.getByText('Average')).toBeInTheDocument();
    expect(screen.getByText('Median')).toBeInTheDocument();
    expect(screen.getByText('P/E Ratio')).toBeInTheDocument();
    expect(screen.getByText('28.5')).toBeInTheDocument();
    expect(screen.getByText('27.2')).toBeInTheDocument();
  });

  test('renders Analyst Consensus section', () => {
    render(<ValuationModelVisualization symbol="AAPL" valuationData={mockValuationData} />);
    
    // Check that the Analyst Consensus section is rendered
    expect(screen.getByText('Analyst Consensus')).toBeInTheDocument();
    
    // Check that analyst consensus details are displayed
    expect(screen.getByText('Consensus Target: $192.50')).toBeInTheDocument();
    expect(screen.getByText('Range: $170.00 - $215.00')).toBeInTheDocument();
    expect(screen.getByText('Consensus Rating: Buy')).toBeInTheDocument();
    
    // Check that rating distribution is displayed
    expect(screen.getByText('Buy: 28')).toBeInTheDocument();
    expect(screen.getByText('Hold: 8')).toBeInTheDocument();
    expect(screen.getByText('Sell: 2')).toBeInTheDocument();
  });

  test('renders Consensus Valuation section', () => {
    render(<ValuationModelVisualization symbol="AAPL" valuationData={mockValuationData} />);
    
    // Check that the Consensus Valuation section is rendered
    expect(screen.getByText('Consensus Valuation')).toBeInTheDocument();
    
    // Check that consensus details are displayed
    expect(screen.getByText('Weighted Average: $192.35')).toBeInTheDocument();
    expect(screen.getByText('Model Weights:')).toBeInTheDocument();
    expect(screen.getByText('DCF: 40%')).toBeInTheDocument();
    expect(screen.getByText('Comparable: 30%')).toBeInTheDocument();
    expect(screen.getByText('Analyst: 30%')).toBeInTheDocument();
  });

  test('renders price comparison chart', () => {
    render(<ValuationModelVisualization symbol="AAPL" valuationData={mockValuationData} />);
    
    // Check that the price comparison chart is rendered
    expect(screen.getByText('Price Comparison')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  test('handles missing valuation model data gracefully', () => {
    // Create a copy of the mock data with missing DCF model
    const incompleteValuationData = {
      ...mockValuationData,
      dcf: null
    };
    
    render(<ValuationModelVisualization symbol="AAPL" valuationData={incompleteValuationData} />);
    
    // Check that the component still renders
    expect(screen.getByText('Valuation Models')).toBeInTheDocument();
    
    // Check that it handles missing DCF data appropriately
    expect(screen.getByText('DCF model data not available')).toBeInTheDocument();
    
    // Check that other sections are still rendered
    expect(screen.getByText('Comparable Company Analysis')).toBeInTheDocument();
    expect(screen.getByText('Analyst Consensus')).toBeInTheDocument();
  });

  test('toggles between valuation model details', () => {
    render(<ValuationModelVisualization symbol="AAPL" valuationData={mockValuationData} />);
    
    // Check that DCF details are visible by default
    expect(screen.getByText('DCF Share Price: $195.23')).toBeInTheDocument();
    
    // Click on Comparable Companies tab
    fireEvent.click(screen.getByText('Comparable Companies'));
    
    // Check that CCA details are now visible
    expect(screen.getByText('Average Share Price: $187.45')).toBeInTheDocument();
    
    // Click on Analyst Consensus tab
    fireEvent.click(screen.getByText('Analyst Ratings'));
    
    // Check that Analyst Consensus details are now visible
    expect(screen.getByText('Consensus Target: $192.50')).toBeInTheDocument();
  });
});