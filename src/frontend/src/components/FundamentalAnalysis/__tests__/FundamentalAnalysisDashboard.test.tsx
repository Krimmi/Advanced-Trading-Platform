import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import FundamentalAnalysisDashboard from '../FundamentalAnalysisDashboard';
import financialAnalysisService from '../../../services/financialAnalysisService';
import valuationService from '../../../services/valuationService';

// Mock the services
jest.mock('../../../services/financialAnalysisService');
jest.mock('../../../services/valuationService');

// Mock the child components
jest.mock('../FinancialRatioVisualization', () => ({ symbol, financialRatios }) => 
  <div data-testid="financial-ratio-visualization">FinancialRatioVisualization</div>
);
jest.mock('../ValuationModelVisualization', () => ({ symbol, valuationData }) => 
  <div data-testid="valuation-model-visualization">ValuationModelVisualization</div>
);
jest.mock('../FinancialStatementAnalysis', () => ({ symbol }) => 
  <div data-testid="financial-statement-analysis">FinancialStatementAnalysis</div>
);
jest.mock('../CompanyComparison', () => ({ mainSymbol, peerSymbols }) => 
  <div data-testid="company-comparison">CompanyComparison</div>
);
jest.mock('../GrowthAnalysis', () => ({ symbol }) => 
  <div data-testid="growth-analysis">GrowthAnalysis</div>
);

// Sample data for tests
const mockCompanyProfile = {
  symbol: 'AAPL',
  name: 'Apple Inc.',
  sector: 'Technology',
  industry: 'Consumer Electronics',
  description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
  marketCap: 2800000000000,
  employees: 154000,
  website: 'https://www.apple.com',
  ceo: 'Tim Cook',
  exchange: 'NASDAQ'
};

const mockFinancialRatios = {
  symbol: 'AAPL',
  date: '2023-06-30',
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
    valuation: {
      pe_ratio: 30.2,
      pb_ratio: 47.1,
      ps_ratio: 7.5,
      ev_ebitda: 22.3
    }
  }
};

const mockValuationData = {
  dcf: {
    share_price: 195.23,
    equity_value: 3050000000000,
    enterprise_value: 3200000000000
  },
  comparable: {
    avg_share_price: 187.45,
    median_share_price: 190.12
  },
  consensus: {
    share_price: 192.35,
    upside_potential: 0.08
  }
};

const mockPeerSymbols = ['MSFT', 'GOOGL', 'AMZN', 'META'];

describe('FundamentalAnalysisDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock implementations
    (financialAnalysisService.getCompanyProfile as jest.Mock).mockResolvedValue(mockCompanyProfile);
    (financialAnalysisService.getFinancialRatios as jest.Mock).mockResolvedValue(mockFinancialRatios);
    (valuationService.getValuationSummary as jest.Mock).mockResolvedValue(mockValuationData);
    (financialAnalysisService.getPeerCompanies as jest.Mock).mockResolvedValue(mockPeerSymbols);
  });

  test('renders loading state initially', () => {
    render(
      <MemoryRouter initialEntries={['/fundamentals/AAPL']}>
        <Routes>
          <Route path="/fundamentals/:symbol" element={<FundamentalAnalysisDashboard />} />
        </Routes>
      </MemoryRouter>
    );
    
    expect(screen.getByText('Fundamental Analysis: AAPL')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('fetches company data on mount and displays company profile', async () => {
    render(
      <MemoryRouter initialEntries={['/fundamentals/AAPL']}>
        <Routes>
          <Route path="/fundamentals/:symbol" element={<FundamentalAnalysisDashboard />} />
        </Routes>
      </MemoryRouter>
    );
    
    // Verify services were called
    expect(financialAnalysisService.getCompanyProfile).toHaveBeenCalledWith('AAPL');
    expect(financialAnalysisService.getFinancialRatios).toHaveBeenCalledWith('AAPL');
    expect(valuationService.getValuationSummary).toHaveBeenCalledWith('AAPL');
    expect(financialAnalysisService.getPeerCompanies).toHaveBeenCalledWith('AAPL');
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check that company profile is displayed
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('Consumer Electronics')).toBeInTheDocument();
    expect(screen.getByText('Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.')).toBeInTheDocument();
    
    // Check that company information is displayed
    expect(screen.getByText('$2.80T')).toBeInTheDocument(); // Formatted market cap
    expect(screen.getByText('Tim Cook')).toBeInTheDocument();
    expect(screen.getByText('154,000')).toBeInTheDocument(); // Formatted employees
  });

  test('switches tabs correctly', async () => {
    render(
      <MemoryRouter initialEntries={['/fundamentals/AAPL']}>
        <Routes>
          <Route path="/fundamentals/:symbol" element={<FundamentalAnalysisDashboard />} />
        </Routes>
      </MemoryRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check that Financial Ratios tab is active by default
    expect(screen.getByTestId('financial-ratio-visualization')).toBeInTheDocument();
    
    // Click on Valuation Models tab
    fireEvent.click(screen.getByText('Valuation Models'));
    
    // Verify the Valuation Models tab is shown
    expect(screen.getByTestId('valuation-model-visualization')).toBeInTheDocument();
    
    // Click on Financial Statements tab
    fireEvent.click(screen.getByText('Financial Statements'));
    
    // Verify the Financial Statements tab is shown
    expect(screen.getByTestId('financial-statement-analysis')).toBeInTheDocument();
    
    // Click on Peer Comparison tab
    fireEvent.click(screen.getByText('Peer Comparison'));
    
    // Verify the Peer Comparison tab is shown
    expect(screen.getByTestId('company-comparison')).toBeInTheDocument();
    
    // Click on Growth Analysis tab
    fireEvent.click(screen.getByText('Growth Analysis'));
    
    // Verify the Growth Analysis tab is shown
    expect(screen.getByTestId('growth-analysis')).toBeInTheDocument();
  });

  test('handles error when company data cannot be loaded', async () => {
    // Mock the service to reject
    (financialAnalysisService.getCompanyProfile as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));
    
    render(
      <MemoryRouter initialEntries={['/fundamentals/AAPL']}>
        <Routes>
          <Route path="/fundamentals/:symbol" element={<FundamentalAnalysisDashboard />} />
        </Routes>
      </MemoryRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check that error message is displayed
    expect(screen.getByText('Could not load company data for AAPL')).toBeInTheDocument();
    expect(screen.getByText('Please check if the symbol is correct and try again.')).toBeInTheDocument();
  });
});