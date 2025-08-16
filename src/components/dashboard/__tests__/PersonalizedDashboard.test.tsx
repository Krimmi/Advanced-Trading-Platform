import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PersonalizedDashboard from '../PersonalizedDashboard';
import DashboardPreferenceService from '../services/DashboardPreferenceService';
import DashboardStateService from '../services/DashboardStateService';
import WidgetRegistry from '../WidgetSystem/WidgetRegistry';
import { registerAllWidgets, registerWidgetDataProviders } from '../WidgetSystem/registerWidgets';

// Mock the services
jest.mock('../services/DashboardPreferenceService');
jest.mock('../services/DashboardStateService');
jest.mock('../WidgetSystem/WidgetRegistry');

describe('PersonalizedDashboard', () => {
  // Setup mocks before each test
  beforeEach(() => {
    // Mock DashboardPreferenceService
    const mockPreferenceService = {
      getDashboard: jest.fn().mockReturnValue({
        id: 'test-dashboard',
        name: 'Test Dashboard',
        columns: 3,
        widgets: [
          {
            id: 'widget-1',
            widgetType: 'market-overview',
            column: 0,
            order: 0,
            width: 6,
            height: 4,
            settings: {}
          },
          {
            id: 'widget-2',
            widgetType: 'portfolio-summary',
            column: 1,
            order: 0,
            width: 6,
            height: 4,
            settings: {}
          }
        ]
      }),
      updateDashboard: jest.fn(),
      updateWidget: jest.fn(),
      removeWidget: jest.fn(),
      addWidget: jest.fn(),
      subscribe: jest.fn().mockReturnValue(() => {}),
      getPreferences: jest.fn().mockReturnValue({
        defaultDashboardId: 'test-dashboard',
        dashboards: [
          {
            id: 'test-dashboard',
            name: 'Test Dashboard',
            columns: 3,
            widgets: []
          }
        ],
        theme: 'light',
        refreshInterval: 60,
        compactMode: false
      })
    };
    
    (DashboardPreferenceService.getInstance as jest.Mock).mockReturnValue(mockPreferenceService);
    
    // Mock DashboardStateService
    const mockStateService = {
      getDashboardState: jest.fn().mockReturnValue({
        dashboardId: 'test-dashboard',
        widgets: {
          'widget-1': {
            id: 'widget-1',
            loading: false,
            error: null,
            lastUpdated: Date.now(),
            data: {}
          },
          'widget-2': {
            id: 'widget-2',
            loading: false,
            error: null,
            lastUpdated: Date.now(),
            data: {}
          }
        },
        isRefreshing: false,
        lastRefreshed: Date.now()
      }),
      refreshDashboard: jest.fn(),
      refreshWidget: jest.fn(),
      startAutoRefresh: jest.fn(),
      stopAutoRefresh: jest.fn(),
      subscribe: jest.fn().mockReturnValue(() => {})
    };
    
    (DashboardStateService.getInstance as jest.Mock).mockReturnValue(mockStateService);
    
    // Mock WidgetRegistry
    const mockRegistry = {
      getWidget: jest.fn().mockReturnValue({
        type: 'test-widget',
        name: 'Test Widget',
        component: () => <div data-testid="mock-widget">Mock Widget</div>,
        defaultSettings: {}
      }),
      createWidgetComponent: jest.fn().mockReturnValue(<div data-testid="mock-widget">Mock Widget</div>)
    };
    
    (WidgetRegistry.getInstance as jest.Mock).mockReturnValue(mockRegistry);
    
    // Mock registerAllWidgets and registerWidgetDataProviders
    (registerAllWidgets as jest.Mock) = jest.fn();
    (registerWidgetDataProviders as jest.Mock) = jest.fn();
  });
  
  test('renders dashboard with widgets', async () => {
    render(<PersonalizedDashboard dashboardId="test-dashboard" />);
    
    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByText('Test Dashboard')).toBeInTheDocument();
    });
    
    // Check if widgets are rendered
    expect(screen.getAllByTestId('mock-widget').length).toBe(2);
  });
  
  test('handles edit mode toggle', async () => {
    render(<PersonalizedDashboard dashboardId="test-dashboard" />);
    
    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByText('Test Dashboard')).toBeInTheDocument();
    });
    
    // Find and click edit button
    const editButton = screen.getByLabelText('Edit Dashboard');
    fireEvent.click(editButton);
    
    // Check if in edit mode
    expect(screen.getByLabelText('Save Layout')).toBeInTheDocument();
    
    // Click save button
    const saveButton = screen.getByLabelText('Save Layout');
    fireEvent.click(saveButton);
    
    // Check if back to view mode
    expect(screen.getByLabelText('Edit Dashboard')).toBeInTheDocument();
  });
  
  test('handles dashboard refresh', async () => {
    render(<PersonalizedDashboard dashboardId="test-dashboard" />);
    
    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByText('Test Dashboard')).toBeInTheDocument();
    });
    
    // Find and click refresh button
    const refreshButton = screen.getByLabelText('Refresh Dashboard');
    fireEvent.click(refreshButton);
    
    // Check if refreshDashboard was called
    const stateService = DashboardStateService.getInstance();
    expect(stateService.refreshDashboard).toHaveBeenCalledWith('test-dashboard');
  });
  
  test('renders empty state when no widgets', async () => {
    // Override mock to return empty widgets array
    const mockPreferenceService = DashboardPreferenceService.getInstance();
    mockPreferenceService.getDashboard.mockReturnValue({
      id: 'test-dashboard',
      name: 'Test Dashboard',
      columns: 3,
      widgets: []
    });
    
    render(<PersonalizedDashboard dashboardId="test-dashboard" />);
    
    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByText('Test Dashboard')).toBeInTheDocument();
    });
    
    // Check if empty state is rendered
    expect(screen.getByText('No widgets added yet')).toBeInTheDocument();
    expect(screen.getByText('Add Widget')).toBeInTheDocument();
  });
  
  test('handles read-only mode', async () => {
    render(<PersonalizedDashboard dashboardId="test-dashboard" readOnly={true} />);
    
    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByText('Test Dashboard')).toBeInTheDocument();
    });
    
    // Check that edit button is not present
    expect(screen.queryByLabelText('Edit Dashboard')).not.toBeInTheDocument();
  });
});