import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AlertHistoryPanel from '../AlertHistoryPanel';
import { alertsService } from '../../../services';
import alertsServiceExtensions from '../../../services/alertsServiceExtensions';

// Mock the services
jest.mock('../../../services', () => ({
  alertsService: {
    getAlerts: jest.fn(),
  },
}));

jest.mock('../../../services/alertsServiceExtensions', () => ({
  getExecutionHistory: jest.fn(),
}));

describe('AlertHistoryPanel', () => {
  const mockAlerts = [
    {
      id: '1',
      userId: 'user1',
      type: 'price',
      symbol: 'AAPL',
      condition: 'greater_than',
      value: 150,
      triggered: true,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      triggeredAt: '2023-01-01T01:00:00Z',
      notificationMethod: 'email',
      message: 'AAPL price is above $150',
    },
    {
      id: '2',
      userId: 'user1',
      type: 'technical',
      symbol: 'MSFT',
      condition: 'crosses_above',
      value: 'RSI(14) > 70',
      triggered: true,
      createdAt: '2023-01-02T00:00:00Z',
      updatedAt: '2023-01-02T00:00:00Z',
      triggeredAt: '2023-01-02T01:00:00Z',
      notificationMethod: 'in-app',
      message: 'MSFT RSI crossed above 70',
    },
  ];

  const mockExecutions = {
    executions: [
      {
        id: '1',
        strategyId: 'strategy1',
        alertId: '1',
        status: 'executed',
        actions: [
          {
            type: 'market_order',
            status: 'executed',
            details: {
              symbol: 'AAPL',
              side: 'buy',
              quantity: 10,
              price: 155.50,
            },
          },
        ],
        triggeredAt: '2023-01-01T01:00:00Z',
        completedAt: '2023-01-01T01:00:05Z',
      },
      {
        id: '2',
        strategyId: 'strategy2',
        alertId: '2',
        status: 'failed',
        actions: [
          {
            type: 'market_order',
            status: 'failed',
            details: {
              symbol: 'MSFT',
              side: 'sell',
              quantity: 5,
            },
            error: 'Insufficient balance',
          },
        ],
        triggeredAt: '2023-01-02T01:00:00Z',
        completedAt: '2023-01-02T01:00:03Z',
        error: 'Execution failed: Insufficient balance',
      },
    ],
    total: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (alertsService.getAlerts as jest.Mock).mockResolvedValue(mockAlerts);
    (alertsServiceExtensions.getExecutionHistory as jest.Mock).mockResolvedValue(mockExecutions);
  });

  test('renders the component with loading state', () => {
    render(<AlertHistoryPanel />);
    expect(screen.getByText('Alert & Execution History')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays alert history after loading', async () => {
    render(<AlertHistoryPanel />);
    
    await waitFor(() => {
      expect(alertsService.getAlerts).toHaveBeenCalled();
      expect(alertsServiceExtensions.getExecutionHistory).toHaveBeenCalled();
    });
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check if alert history is displayed
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('MSFT')).toBeInTheDocument();
    expect(screen.getByText('price')).toBeInTheDocument();
    expect(screen.getByText('technical')).toBeInTheDocument();
  });

  test('switches between tabs', async () => {
    render(<AlertHistoryPanel />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check if we're on the Alert History tab by default
    expect(screen.getByText('Triggered Alerts')).toBeInTheDocument();
    
    // Switch to Execution History tab
    fireEvent.click(screen.getByText('Execution History'));
    
    // Check if execution history is displayed
    expect(screen.getByText('strategy1')).toBeInTheDocument();
    expect(screen.getByText('strategy2')).toBeInTheDocument();
    expect(screen.getByText('executed')).toBeInTheDocument();
    expect(screen.getByText('failed')).toBeInTheDocument();
  });

  test('filters by time range', async () => {
    render(<AlertHistoryPanel />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Change time range
    fireEvent.mouseDown(screen.getByLabelText('Time Range'));
    fireEvent.click(screen.getByText('Last 24 Hours'));
    
    // Check if the API was called again with new filters
    await waitFor(() => {
      expect(alertsService.getAlerts).toHaveBeenCalledTimes(2);
      expect(alertsServiceExtensions.getExecutionHistory).toHaveBeenCalledTimes(2);
    });
  });

  test('filters by alert type', async () => {
    render(<AlertHistoryPanel />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Change alert type filter
    fireEvent.mouseDown(screen.getByLabelText('Alert Type'));
    fireEvent.click(screen.getByText('Price'));
    
    // Check if the API was called again with new filters
    await waitFor(() => {
      expect(alertsService.getAlerts).toHaveBeenCalledTimes(2);
      expect(alertsServiceExtensions.getExecutionHistory).toHaveBeenCalledTimes(2);
    });
  });

  test('filters by status', async () => {
    render(<AlertHistoryPanel />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Change status filter
    fireEvent.mouseDown(screen.getByLabelText('Status'));
    fireEvent.click(screen.getByText('Executed'));
    
    // Check if the API was called again with new filters
    await waitFor(() => {
      expect(alertsService.getAlerts).toHaveBeenCalledTimes(2);
      expect(alertsServiceExtensions.getExecutionHistory).toHaveBeenCalledTimes(2);
    });
  });

  test('refreshes data', async () => {
    render(<AlertHistoryPanel />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Click refresh button
    fireEvent.click(screen.getByLabelText('Refresh'));
    
    // Check if the API was called again
    await waitFor(() => {
      expect(alertsService.getAlerts).toHaveBeenCalledTimes(2);
      expect(alertsServiceExtensions.getExecutionHistory).toHaveBeenCalledTimes(2);
    });
  });
});