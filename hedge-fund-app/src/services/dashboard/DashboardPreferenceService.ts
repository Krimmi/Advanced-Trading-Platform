import { User } from '../../backend/models/User';

export interface DashboardPreference {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  layout: WidgetLayout[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WidgetLayout {
  id: string;
  widgetType: string;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  settings: Record<string, any>;
}

/**
 * Service for managing user dashboard preferences
 */
class DashboardPreferenceService {
  private static instance: DashboardPreferenceService;
  private apiUrl = '/api/dashboard-preferences';

  private constructor() {}

  public static getInstance(): DashboardPreferenceService {
    if (!DashboardPreferenceService.instance) {
      DashboardPreferenceService.instance = new DashboardPreferenceService();
    }
    return DashboardPreferenceService.instance;
  }

  /**
   * Get all dashboard preferences for a user
   */
  public async getUserDashboards(userId: string): Promise<DashboardPreference[]> {
    try {
      // In a real implementation, this would make an API call
      // For now, we'll return mock data
      return this.getMockDashboards(userId);
    } catch (error) {
      console.error('Error fetching user dashboards:', error);
      throw error;
    }
  }

  /**
   * Get a specific dashboard by ID
   */
  public async getDashboard(dashboardId: string): Promise<DashboardPreference | null> {
    try {
      // In a real implementation, this would make an API call
      const mockDashboards = this.getMockDashboards('user-1');
      return mockDashboards.find(d => d.id === dashboardId) || null;
    } catch (error) {
      console.error(`Error fetching dashboard ${dashboardId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new dashboard
   */
  public async createDashboard(dashboard: Omit<DashboardPreference, 'id' | 'createdAt' | 'updatedAt'>): Promise<DashboardPreference> {
    try {
      // In a real implementation, this would make an API call
      const newDashboard: DashboardPreference = {
        ...dashboard,
        id: `dashboard-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return newDashboard;
    } catch (error) {
      console.error('Error creating dashboard:', error);
      throw error;
    }
  }

  /**
   * Update an existing dashboard
   */
  public async updateDashboard(dashboardId: string, updates: Partial<DashboardPreference>): Promise<DashboardPreference> {
    try {
      // In a real implementation, this would make an API call
      const mockDashboards = this.getMockDashboards('user-1');
      const dashboard = mockDashboards.find(d => d.id === dashboardId);
      
      if (!dashboard) {
        throw new Error(`Dashboard ${dashboardId} not found`);
      }
      
      const updatedDashboard: DashboardPreference = {
        ...dashboard,
        ...updates,
        updatedAt: new Date()
      };
      
      return updatedDashboard;
    } catch (error) {
      console.error(`Error updating dashboard ${dashboardId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a dashboard
   */
  public async deleteDashboard(dashboardId: string): Promise<boolean> {
    try {
      // In a real implementation, this would make an API call
      return true;
    } catch (error) {
      console.error(`Error deleting dashboard ${dashboardId}:`, error);
      throw error;
    }
  }

  /**
   * Set a dashboard as the default for a user
   */
  public async setDefaultDashboard(userId: string, dashboardId: string): Promise<boolean> {
    try {
      // In a real implementation, this would make an API call
      return true;
    } catch (error) {
      console.error(`Error setting default dashboard ${dashboardId}:`, error);
      throw error;
    }
  }

  /**
   * Get mock dashboard data for development
   */
  private getMockDashboards(userId: string): DashboardPreference[] {
    return [
      {
        id: 'dashboard-1',
        userId,
        name: 'Main Dashboard',
        isDefault: true,
        layout: [
          {
            id: 'widget-1',
            widgetType: 'MarketOverviewWidget',
            position: { x: 0, y: 0, w: 6, h: 4 },
            settings: { showIndices: true, showTopMovers: true }
          },
          {
            id: 'widget-2',
            widgetType: 'PortfolioSummaryWidget',
            position: { x: 6, y: 0, w: 6, h: 4 },
            settings: { showPerformance: true, showAllocation: true }
          },
          {
            id: 'widget-3',
            widgetType: 'WatchlistWidget',
            position: { x: 0, y: 4, w: 6, h: 6 },
            settings: { watchlistId: 'default', showCharts: true }
          },
          {
            id: 'widget-4',
            widgetType: 'NewsWidget',
            position: { x: 6, y: 4, w: 6, h: 6 },
            settings: { sources: ['bloomberg', 'reuters', 'wsj'], categories: ['markets', 'economy'] }
          }
        ],
        createdAt: new Date('2025-07-01'),
        updatedAt: new Date('2025-08-10')
      },
      {
        id: 'dashboard-2',
        userId,
        name: 'Trading Dashboard',
        isDefault: false,
        layout: [
          {
            id: 'widget-5',
            widgetType: 'OrderEntryWidget',
            position: { x: 0, y: 0, w: 4, h: 6 },
            settings: { defaultSymbol: 'AAPL', showAdvancedOptions: true }
          },
          {
            id: 'widget-6',
            widgetType: 'ChartWidget',
            position: { x: 4, y: 0, w: 8, h: 6 },
            settings: { symbol: 'AAPL', timeframe: '1D', indicators: ['SMA', 'MACD'] }
          },
          {
            id: 'widget-7',
            widgetType: 'OrderBookWidget',
            position: { x: 0, y: 6, w: 6, h: 4 },
            settings: { symbol: 'AAPL', depth: 10 }
          },
          {
            id: 'widget-8',
            widgetType: 'TradeHistoryWidget',
            position: { x: 6, y: 6, w: 6, h: 4 },
            settings: { limit: 20, showOnlyToday: true }
          }
        ],
        createdAt: new Date('2025-07-15'),
        updatedAt: new Date('2025-08-05')
      }
    ];
  }
}

export default DashboardPreferenceService;