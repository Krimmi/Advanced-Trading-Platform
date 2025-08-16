import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AINotificationsDashboard from '../AINotificationsDashboard';
import aiNotificationService from '../../../services/aiNotificationService';

// Mock the aiNotificationService
jest.mock('../../../services/aiNotificationService', () => ({
  getNotifications: jest.fn(),
  getNotificationCounts: jest.fn(),
  batchUpdateNotificationStatus: jest.fn(),
  executeNotificationAction: jest.fn(),
}));

// Mock the child components
jest.mock('../NotificationPreferencesPanel', () => {
  return function MockNotificationPreferencesPanel() {
    return <div data-testid="notification-preferences-panel">Preferences Panel</div>;
  };
});

jest.mock('../SmartAlertConfigPanel', () => {
  return function MockSmartAlertConfigPanel() {
    return <div data-testid="smart-alert-config-panel">Smart Alert Panel</div>;
  };
});

jest.mock('../NotificationInsightsPanel', () => {
  return function MockNotificationInsightsPanel() {
    return <div data-testid="notification-insights-panel">Insights Panel</div>;
  };
});

describe('AINotificationsDashboard', () => {
  const mockNotifications = [
    {
      id: '1',
      userId: 'user1',
      title: 'Price Alert',
      message: 'AAPL has increased by 5%',
      type: 'price',
      priority: 'high',
      status: 'unread',
      source: 'market',
      relatedSymbols: ['AAPL'],
      createdAt: '2023-01-01T12:00:00Z',
      actions: [
        {
          id: 'action1',
          label: 'View Details',
          type: 'link',
        },
      ],
    },
    {
      id: '2',
      userId: 'user1',
      title: 'Earnings Report',
      message: 'MSFT earnings report is available',
      type: 'earnings',
      priority: 'medium',
      status: 'unread',
      source: 'system',
      relatedSymbols: ['MSFT'],
      createdAt: '2023-01-02T12:00:00Z',
    },
  ];

  const mockNotificationCounts = {
    unread: 5,
    read: 10,
    archived: 3,
    dismissed: 2,
    total: 20,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (aiNotificationService.getNotifications as jest.Mock).mockResolvedValue({
      notifications: mockNotifications,
      total: mockNotifications.length,
    });
    (aiNotificationService.getNotificationCounts as jest.Mock).mockResolvedValue(mockNotificationCounts);
  });

  test('renders the dashboard with tabs', async () => {
    render(<AINotificationsDashboard />);
    
    expect(screen.getByText('AI-Powered Notifications')).toBeInTheDocument();
    expect(screen.getByText('Intelligent alerts and insights for your investments')).toBeInTheDocument();
    
    // Check tabs
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Preferences')).toBeInTheDocument();
    expect(screen.getByText('Smart Alerts')).toBeInTheDocument();
    expect(screen.getByText('Insights')).toBeInTheDocument();
    
    // Should load notifications and counts on mount
    await waitFor(() => {
      expect(aiNotificationService.getNotifications).toHaveBeenCalled();
      expect(aiNotificationService.getNotificationCounts).toHaveBeenCalled();
    });
    
    // Should display notifications
    await waitFor(() => {
      expect(screen.getByText('Price Alert')).toBeInTheDocument();
      expect(screen.getByText('AAPL has increased by 5%')).toBeInTheDocument();
      expect(screen.getByText('Earnings Report')).toBeInTheDocument();
      expect(screen.getByText('MSFT earnings report is available')).toBeInTheDocument();
    });
  });

  test('switches between tabs', async () => {
    render(<AINotificationsDashboard />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(aiNotificationService.getNotifications).toHaveBeenCalled();
    });
    
    // Click on Preferences tab
    fireEvent.click(screen.getByText('Preferences'));
    expect(screen.getByTestId('notification-preferences-panel')).toBeInTheDocument();
    
    // Click on Smart Alerts tab
    fireEvent.click(screen.getByText('Smart Alerts'));
    expect(screen.getByTestId('smart-alert-config-panel')).toBeInTheDocument();
    
    // Click on Insights tab
    fireEvent.click(screen.getByText('Insights'));
    expect(screen.getByTestId('notification-insights-panel')).toBeInTheDocument();
    
    // Click back to Notifications tab
    fireEvent.click(screen.getByText('Notifications'));
    await waitFor(() => {
      expect(screen.getByText('Price Alert')).toBeInTheDocument();
    });
  });

  test('handles notification status changes', async () => {
    (aiNotificationService.batchUpdateNotificationStatus as jest.Mock).mockResolvedValue({
      success: true,
      count: 1,
    });
    
    render(<AINotificationsDashboard />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Price Alert')).toBeInTheDocument();
    });
    
    // Select a notification
    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);
    
    // Click mark as read button
    const markReadButton = screen.getByTestId('MarkEmailReadIcon').closest('button');
    if (markReadButton) {
      fireEvent.click(markReadButton);
    }
    
    await waitFor(() => {
      expect(aiNotificationService.batchUpdateNotificationStatus).toHaveBeenCalledWith(
        ['1'],
        'read'
      );
    });
    
    // Should reload notifications after status change
    expect(aiNotificationService.getNotifications).toHaveBeenCalledTimes(2);
  });

  test('handles notification action execution', async () => {
    render(<AINotificationsDashboard />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Price Alert')).toBeInTheDocument();
    });
    
    // Find and click the action button
    const actionButton = screen.getByText('View Details');
    fireEvent.click(actionButton);
    
    await waitFor(() => {
      expect(aiNotificationService.executeNotificationAction).toHaveBeenCalledWith(
        '1',
        'action1'
      );
    });
  });

  test('switches between notification status tabs', async () => {
    render(<AINotificationsDashboard />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Price Alert')).toBeInTheDocument();
    });
    
    // Click on Read tab
    fireEvent.click(screen.getByText('Read (10)'));
    
    await waitFor(() => {
      expect(aiNotificationService.getNotifications).toHaveBeenCalledWith(
        'read',
        expect.any(Number),
        expect.any(Number)
      );
    });
    
    // Click on Archived tab
    fireEvent.click(screen.getByText('Archived (3)'));
    
    await waitFor(() => {
      expect(aiNotificationService.getNotifications).toHaveBeenCalledWith(
        'archived',
        expect.any(Number),
        expect.any(Number)
      );
    });
    
    // Click back to Unread tab
    fireEvent.click(screen.getByText('Unread (5)'));
    
    await waitFor(() => {
      expect(aiNotificationService.getNotifications).toHaveBeenCalledWith(
        'unread',
        expect.any(Number),
        expect.any(Number)
      );
    });
  });

  test('handles refresh button click', async () => {
    render(<AINotificationsDashboard />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Price Alert')).toBeInTheDocument();
    });
    
    // Reset mock counts
    (aiNotificationService.getNotifications as jest.Mock).mockClear();
    (aiNotificationService.getNotificationCounts as jest.Mock).mockClear();
    
    // Click refresh button
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    await waitFor(() => {
      expect(aiNotificationService.getNotifications).toHaveBeenCalled();
      expect(aiNotificationService.getNotificationCounts).toHaveBeenCalled();
    });
  });
});