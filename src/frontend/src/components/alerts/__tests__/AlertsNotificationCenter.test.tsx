import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AlertsNotificationCenter from '../AlertsNotificationCenter';
import { alertsService } from '../../../services';

// Mock the alertsService
jest.mock('../../../services', () => ({
  alertsService: {
    getNotifications: jest.fn(),
    markNotificationAsRead: jest.fn(),
    markAllNotificationsAsRead: jest.fn(),
    deleteNotification: jest.fn(),
  },
}));

describe('AlertsNotificationCenter', () => {
  const mockNotifications = {
    notifications: [
      {
        id: '1',
        userId: 'user1',
        type: 'price_alert',
        title: 'AAPL Price Alert',
        message: 'AAPL price exceeded $150',
        read: false,
        createdAt: new Date().toISOString(),
        data: {
          symbol: 'AAPL',
          price: 152.50,
          condition: 'greater_than',
          threshold: 150,
        },
      },
      {
        id: '2',
        userId: 'user1',
        type: 'technical_alert',
        title: 'MSFT Technical Alert',
        message: 'MSFT RSI crossed above 70',
        read: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        data: {
          symbol: 'MSFT',
          indicator: 'RSI',
          value: 72.5,
          condition: 'crosses_above',
          threshold: 70,
        },
      },
      {
        id: '3',
        userId: 'user1',
        type: 'news_alert',
        title: 'TSLA News Alert',
        message: 'Tesla announces new product line',
        read: false,
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        data: {
          symbol: 'TSLA',
          headline: 'Tesla announces new product line',
          source: 'Market News',
        },
      },
    ],
    total: 3,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (alertsService.getNotifications as jest.Mock).mockResolvedValue(mockNotifications);
    (alertsService.markNotificationAsRead as jest.Mock).mockImplementation(
      (id) => Promise.resolve({ ...mockNotifications.notifications.find(n => n.id === id), read: true })
    );
    (alertsService.markAllNotificationsAsRead as jest.Mock).mockResolvedValue(undefined);
    (alertsService.deleteNotification as jest.Mock).mockResolvedValue(undefined);
  });

  test('renders the component with loading state', () => {
    render(<AlertsNotificationCenter />);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays notifications after loading', async () => {
    render(<AlertsNotificationCenter />);
    
    await waitFor(() => {
      expect(alertsService.getNotifications).toHaveBeenCalled();
    });
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check if notifications are displayed
    expect(screen.getByText('AAPL Price Alert')).toBeInTheDocument();
    expect(screen.getByText('MSFT Technical Alert')).toBeInTheDocument();
    expect(screen.getByText('TSLA News Alert')).toBeInTheDocument();
    
    // Check if unread count is displayed
    expect(screen.getByText('2')).toBeInTheDocument(); // 2 unread notifications
  });

  test('switches between tabs', async () => {
    render(<AlertsNotificationCenter />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Initially, All tab should be active
    expect(screen.getByText('AAPL Price Alert')).toBeInTheDocument();
    expect(screen.getByText('MSFT Technical Alert')).toBeInTheDocument();
    expect(screen.getByText('TSLA News Alert')).toBeInTheDocument();
    
    // Click on Unread tab
    fireEvent.click(screen.getByText('Unread'));
    
    // Only unread notifications should be visible
    expect(screen.getByText('AAPL Price Alert')).toBeInTheDocument();
    expect(screen.queryByText('MSFT Technical Alert')).not.toBeInTheDocument();
    expect(screen.getByText('TSLA News Alert')).toBeInTheDocument();
    
    // Click on Price tab
    fireEvent.click(screen.getByText('Price'));
    
    // Only price notifications should be visible
    expect(screen.getByText('AAPL Price Alert')).toBeInTheDocument();
    expect(screen.queryByText('MSFT Technical Alert')).not.toBeInTheDocument();
    expect(screen.queryByText('TSLA News Alert')).not.toBeInTheDocument();
    
    // Click on Technical tab
    fireEvent.click(screen.getByText('Technical'));
    
    // Only technical notifications should be visible
    expect(screen.queryByText('AAPL Price Alert')).not.toBeInTheDocument();
    expect(screen.getByText('MSFT Technical Alert')).toBeInTheDocument();
    expect(screen.queryByText('TSLA News Alert')).not.toBeInTheDocument();
  });

  test('marks a notification as read', async () => {
    render(<AlertsNotificationCenter />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Open the menu for the first notification
    const menuButtons = screen.getAllByRole('button', { name: '' }).filter(
      button => button.querySelector('svg[data-testid="MoreVertIcon"]')
    );
    fireEvent.click(menuButtons[0]);
    
    // Click on "Mark as read" option
    fireEvent.click(screen.getByText('Mark as read'));
    
    // Check if markNotificationAsRead was called
    await waitFor(() => {
      expect(alertsService.markNotificationAsRead).toHaveBeenCalledWith('1');
    });
  });

  test('marks all notifications as read', async () => {
    render(<AlertsNotificationCenter />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Click on "Mark all as read" button
    fireEvent.click(screen.getByText('Mark all as read'));
    
    // Check if markAllNotificationsAsRead was called
    await waitFor(() => {
      expect(alertsService.markAllNotificationsAsRead).toHaveBeenCalled();
    });
  });

  test('deletes a notification', async () => {
    render(<AlertsNotificationCenter />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Open the menu for the first notification
    const menuButtons = screen.getAllByRole('button', { name: '' }).filter(
      button => button.querySelector('svg[data-testid="MoreVertIcon"]')
    );
    fireEvent.click(menuButtons[0]);
    
    // Click on "Delete" option
    fireEvent.click(screen.getByText('Delete'));
    
    // Check if deleteNotification was called
    await waitFor(() => {
      expect(alertsService.deleteNotification).toHaveBeenCalledWith('1');
    });
  });

  test('refreshes notifications', async () => {
    render(<AlertsNotificationCenter />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Click on refresh button
    const refreshButton = screen.getByLabelText('Refresh');
    fireEvent.click(refreshButton);
    
    // Check if getNotifications was called again
    await waitFor(() => {
      expect(alertsService.getNotifications).toHaveBeenCalledTimes(2);
    });
  });

  test('filters notifications by type', async () => {
    render(<AlertsNotificationCenter />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Open the filter menu
    const filterButton = screen.getByLabelText('Filter');
    fireEvent.click(filterButton);
    
    // Select "Price Alerts" filter
    fireEvent.click(screen.getByText('Price Alerts'));
    
    // Check if getNotifications was called again
    await waitFor(() => {
      expect(alertsService.getNotifications).toHaveBeenCalledTimes(2);
    });
  });
});