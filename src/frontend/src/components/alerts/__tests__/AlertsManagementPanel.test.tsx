import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AlertsManagementPanel from '../AlertsManagementPanel';
import { alertsService } from '../../../services';
import alertsServiceExtensions from '../../../services/alertsServiceExtensions';

// Mock the services
jest.mock('../../../services', () => ({
  alertsService: {
    getAlerts: jest.fn(),
    deleteAlert: jest.fn(),
  },
}));

jest.mock('../../../services/alertsServiceExtensions', () => ({
  getExecutionStrategies: jest.fn(),
  activateExecutionStrategy: jest.fn(),
  deactivateExecutionStrategy: jest.fn(),
  deleteExecutionStrategy: jest.fn(),
}));

describe('AlertsManagementPanel', () => {
  const mockAlerts = [
    {
      id: '1',
      userId: 'user1',
      type: 'price',
      symbol: 'AAPL',
      condition: 'greater_than',
      value: 150,
      triggered: false,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      notificationMethod: 'email',
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
      triggeredAt: '2023-01-03T00:00:00Z',
      notificationMethod: 'in-app',
    },
  ];

  const mockStrategies = [
    {
      id: '1',
      name: 'Buy on RSI Oversold',
      description: 'Buy when RSI goes below 30',
      conditions: [
        {
          type: 'technical',
          symbol: 'AAPL',
          indicator: 'rsi',
          operator: 'less_than',
          value: 30,
        },
      ],
      actions: [
        {
          type: 'market_order',
          symbol: 'AAPL',
          side: 'buy',
          quantity: 10,
        },
      ],
      isActive: true,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Sell on Price Target',
      description: 'Sell when price reaches target',
      conditions: [
        {
          type: 'price',
          symbol: 'MSFT',
          operator: 'greater_than',
          value: 300,
        },
      ],
      actions: [
        {
          type: 'market_order',
          symbol: 'MSFT',
          side: 'sell',
          quantity: 5,
        },
      ],
      isActive: false,
      createdAt: '2023-01-02T00:00:00Z',
      updatedAt: '2023-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (alertsService.getAlerts as jest.Mock).mockResolvedValue(mockAlerts);
    (alertsServiceExtensions.getExecutionStrategies as jest.Mock).mockResolvedValue(mockStrategies);
  });

  test('renders the component with loading state', () => {
    render(<AlertsManagementPanel />);
    expect(screen.getByText('Alerts & Execution Management')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays alerts after loading', async () => {
    render(<AlertsManagementPanel />);
    
    await waitFor(() => {
      expect(alertsService.getAlerts).toHaveBeenCalled();
    });
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check if alerts tab is active by default
    expect(screen.getByRole('tab', { name: /alerts/i })).toHaveAttribute('aria-selected', 'true');
    
    // Check if the DataGrid is rendered with alerts
    expect(screen.getByText('Symbol')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Condition')).toBeInTheDocument();
  });

  test('switches between tabs', async () => {
    render(<AlertsManagementPanel />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Click on Execution Strategies tab
    fireEvent.click(screen.getByRole('tab', { name: /execution strategies/i }));
    
    // Check if the tab is now active
    expect(screen.getByRole('tab', { name: /execution strategies/i })).toHaveAttribute('aria-selected', 'true');
    
    // Check if the strategies content is displayed
    expect(screen.getByText('New Strategy')).toBeInTheDocument();
    
    // Click on Execution History tab
    fireEvent.click(screen.getByRole('tab', { name: /execution history/i }));
    
    // Check if the tab is now active
    expect(screen.getByRole('tab', { name: /execution history/i })).toHaveAttribute('aria-selected', 'true');
    
    // Check if the history content is displayed
    expect(screen.getByText('Execution history will be implemented here.')).toBeInTheDocument();
  });

  test('toggles strategy activation status', async () => {
    render(<AlertsManagementPanel />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Switch to Execution Strategies tab
    fireEvent.click(screen.getByRole('tab', { name: /execution strategies/i }));
    
    // Find and click the toggle button for the first strategy (which is active)
    const toggleButtons = screen.getAllByRole('button', { name: '' });
    const activeStrategyToggle = toggleButtons.find(button => 
      button.querySelector('svg[data-testid="StopIcon"]')
    );
    
    fireEvent.click(activeStrategyToggle!);
    
    // Check if the deactivate function was called
    expect(alertsServiceExtensions.deactivateExecutionStrategy).toHaveBeenCalledWith('1');
    
    // Find and click the toggle button for the second strategy (which is inactive)
    const inactiveStrategyToggle = toggleButtons.find(button => 
      button.querySelector('svg[data-testid="PlayArrowIcon"]')
    );
    
    fireEvent.click(inactiveStrategyToggle!);
    
    // Check if the activate function was called
    expect(alertsServiceExtensions.activateExecutionStrategy).toHaveBeenCalledWith('2');
  });
});