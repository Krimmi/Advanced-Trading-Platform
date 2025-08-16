import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RealTimeAnalyticsDashboard from '../RealTimeAnalyticsDashboard';
import { MarketDataService } from '../../../services';

// Mock the services
jest.mock('../../../services', () => ({
  MarketDataService: jest.fn().mockImplementation(() => ({
    getMarketBreadth: jest.fn().mockResolvedValue({
      asOf: '2025-08-12T07:34:24Z',
      advanceDecline: {
        advancing: 2500,
        declining: 1200,
        unchanged: 300,
        advancingPercent: 0.625,
        decliningPercent: 0.3,
        advanceDeclineRatio: 2.08,
        advanceDeclineSpread: 1300
      },
      advanceDeclineHistory: [],
      breadthIndicators: [],
      highsLows: [],
      marketStats: [
        {
          index: 'SPX',
          value: 5200,
          change: 25,
          percentChange: 0.005,
          volume: 2500000000
        }
      ],
      sectorPerformance: []
    }),
    getAnomalyDetection: jest.fn().mockResolvedValue({
      asOf: '2025-08-12T07:34:24Z',
      anomalies: [
        {
          id: 'anomaly_1',
          title: 'Unusual price movement detected in AAPL',
          description: 'Apple has experienced a significant price movement...',
          symbol: 'AAPL',
          timestamp: '2025-08-12T07:00:00Z',
          severity: 'high',
          category: 'Price Action',
          status: 'Active',
          confidence: 0.85,
          metrics: [],
          recommendations: [],
          historicalData: [],
          thresholds: [],
          relatedIndicators: []
        }
      ],
      categories: ['Price Action', 'Volume', 'Volatility'],
      summary: {
        totalAnomalies: 15,
        newAnomalies: 5,
        criticalAnomalies: 2,
        highAnomalies: 5,
        mediumAnomalies: 5,
        lowAnomalies: 2,
        infoAnomalies: 1,
        marketVolatility: 22,
        volatilityDirection: 'up',
        riskScore: 65,
        riskLevel: 'Medium'
      }
    }),
    getCorrelationMatrix: jest.fn().mockResolvedValue({
      asOf: '2025-08-12T07:34:24Z',
      assets: ['SPY', 'QQQ', 'TLT', 'GLD'],
      assetClasses: ['Equities', 'Fixed Income', 'Commodities'],
      assetInfo: [
        { symbol: 'SPY', name: 'S&P 500 ETF', assetClass: 'Equities' },
        { symbol: 'QQQ', name: 'Nasdaq 100 ETF', assetClass: 'Equities' },
        { symbol: 'TLT', name: '20+ Year Treasury Bond ETF', assetClass: 'Fixed Income' },
        { symbol: 'GLD', name: 'Gold ETF', assetClass: 'Commodities' }
      ],
      correlationMatrix: [
        [1, 0.8, -0.4, 0.2],
        [0.8, 1, -0.5, 0.1],
        [-0.4, -0.5, 1, 0.3],
        [0.2, 0.1, 0.3, 1]
      ],
      correlationTimeSeries: []
    }),
    getOrderFlow: jest.fn().mockResolvedValue({
      asOf: '2025-08-12T07:34:24Z',
      symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN'],
      recentOrders: [
        {
          id: 'order_1',
          symbol: 'AAPL',
          side: 'buy',
          price: 185.75,
          quantity: 500,
          timestamp: '2025-08-12T07:30:00Z',
          type: 'market',
          status: 'Filled'
        }
      ],
      marketDepth: [
        {
          symbol: 'AAPL',
          timestamp: '2025-08-12T07:34:24Z',
          bidPrice: 185.70,
          askPrice: 185.80,
          bidVolume: 25000,
          askVolume: 22000,
          bidLevels: [],
          askLevels: []
        }
      ],
      priceImpact: []
    })
  }))
}));

describe('RealTimeAnalyticsDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<RealTimeAnalyticsDashboard />);
    expect(screen.getByText('Real-Time Market Analytics')).toBeInTheDocument();
  });

  test('displays loading state initially', () => {
    render(<RealTimeAnalyticsDashboard />);
    expect(screen.getByText('Loading market data...')).toBeInTheDocument();
  });

  test('fetches and displays data on initial load', async () => {
    render(<RealTimeAnalyticsDashboard />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(MarketDataService.prototype.getMarketBreadth).toHaveBeenCalled();
      expect(MarketDataService.prototype.getAnomalyDetection).toHaveBeenCalled();
      expect(MarketDataService.prototype.getCorrelationMatrix).toHaveBeenCalled();
      expect(MarketDataService.prototype.getOrderFlow).toHaveBeenCalled();
    });
  });

  test('toggles between grid and tabs view', async () => {
    render(<RealTimeAnalyticsDashboard />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(MarketDataService.prototype.getMarketBreadth).toHaveBeenCalled();
    });
    
    // Find and click the view toggle button
    const viewToggleButton = screen.getByRole('button', { name: /switch to tabs view/i });
    fireEvent.click(viewToggleButton);
    
    // Check if tabs are now visible
    expect(screen.getByRole('tab', { name: /market breadth/i })).toBeInTheDocument();
    
    // Switch back to grid view
    const gridViewButton = screen.getByRole('button', { name: /switch to grid view/i });
    fireEvent.click(gridViewButton);
    
    // Check if grid view is restored
    expect(screen.getAllByRole('heading', { name: /market breadth|anomaly detection|correlation analysis|order flow analysis/i }).length).toBeGreaterThan(1);
  });

  test('refreshes data when refresh button is clicked', async () => {
    render(<RealTimeAnalyticsDashboard />);
    
    // Wait for initial data load
    await waitFor(() => {
      expect(MarketDataService.prototype.getMarketBreadth).toHaveBeenCalledTimes(1);
    });
    
    // Reset mock calls
    jest.clearAllMocks();
    
    // Find and click the refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh data/i });
    fireEvent.click(refreshButton);
    
    // Check if data fetching methods were called again
    await waitFor(() => {
      expect(MarketDataService.prototype.getMarketBreadth).toHaveBeenCalledTimes(1);
      expect(MarketDataService.prototype.getAnomalyDetection).toHaveBeenCalledTimes(1);
      expect(MarketDataService.prototype.getCorrelationMatrix).toHaveBeenCalledTimes(1);
      expect(MarketDataService.prototype.getOrderFlow).toHaveBeenCalledTimes(1);
    });
  });

  test('calls onSettingsClick when settings button is clicked', () => {
    const onSettingsClick = jest.fn();
    render(<RealTimeAnalyticsDashboard onSettingsClick={onSettingsClick} />);
    
    // Find and click the settings button
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    fireEvent.click(settingsButton);
    
    // Check if the callback was called
    expect(onSettingsClick).toHaveBeenCalledTimes(1);
  });
});