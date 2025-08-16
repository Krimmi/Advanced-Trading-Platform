/**
 * Dashboard Preference Service
 * 
 * This service manages user preferences for dashboard customization,
 * including widget selection, layout, and appearance settings.
 */

import { WidgetConfig } from '../WidgetSystem/WidgetRegistry';

// Dashboard layout configuration
export interface DashboardLayout {
  id: string;
  name: string;
  columns: number;
  widgets: WidgetLayoutItem[];
}

// Widget layout configuration within a dashboard
export interface WidgetLayoutItem {
  id: string;
  widgetType: string;
  column: number;
  order: number;
  width: number; // 1-12 grid system
  height: number; // In grid units
  settings: Record<string, any>;
}

// User dashboard preferences
export interface DashboardPreferences {
  defaultDashboardId: string;
  dashboards: DashboardLayout[];
  theme: 'light' | 'dark' | 'system';
  refreshInterval: number; // in seconds
  compactMode: boolean;
}

// Default dashboard preferences
const DEFAULT_PREFERENCES: DashboardPreferences = {
  defaultDashboardId: 'default',
  dashboards: [
    {
      id: 'default',
      name: 'Default Dashboard',
      columns: 3,
      widgets: [
        {
          id: 'market-overview',
          widgetType: 'market-overview',
          column: 0,
          order: 0,
          width: 12,
          height: 2,
          settings: {}
        },
        {
          id: 'portfolio-summary',
          widgetType: 'portfolio-summary',
          column: 0,
          order: 1,
          width: 6,
          height: 3,
          settings: {}
        },
        {
          id: 'watchlist',
          widgetType: 'watchlist',
          column: 1,
          order: 0,
          width: 6,
          height: 3,
          settings: {
            symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN']
          }
        },
        {
          id: 'news',
          widgetType: 'news',
          column: 2,
          order: 0,
          width: 12,
          height: 4,
          settings: {
            sources: ['bloomberg', 'reuters', 'wsj']
          }
        }
      ]
    }
  ],
  theme: 'system',
  refreshInterval: 60,
  compactMode: false
};

class DashboardPreferenceService {
  private static instance: DashboardPreferenceService;
  private preferences: DashboardPreferences;
  private readonly STORAGE_KEY = 'hftp_dashboard_preferences';
  private listeners: Array<(prefs: DashboardPreferences) => void> = [];

  private constructor() {
    this.preferences = this.loadPreferences();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DashboardPreferenceService {
    if (!DashboardPreferenceService.instance) {
      DashboardPreferenceService.instance = new DashboardPreferenceService();
    }
    return DashboardPreferenceService.instance;
  }

  /**
   * Load preferences from storage or use defaults
   */
  private loadPreferences(): DashboardPreferences {
    try {
      const storedPrefs = localStorage.getItem(this.STORAGE_KEY);
      if (storedPrefs) {
        return JSON.parse(storedPrefs);
      }
    } catch (error) {
      console.error('Error loading dashboard preferences:', error);
    }
    return { ...DEFAULT_PREFERENCES };
  }

  /**
   * Save preferences to storage
   */
  private savePreferences(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.preferences));
      this.notifyListeners();
    } catch (error) {
      console.error('Error saving dashboard preferences:', error);
    }
  }

  /**
   * Get all dashboard preferences
   */
  public getPreferences(): DashboardPreferences {
    return { ...this.preferences };
  }

  /**
   * Get a specific dashboard layout by ID
   */
  public getDashboard(dashboardId: string): DashboardLayout | undefined {
    return this.preferences.dashboards.find(d => d.id === dashboardId);
  }

  /**
   * Get the default dashboard
   */
  public getDefaultDashboard(): DashboardLayout | undefined {
    return this.getDashboard(this.preferences.defaultDashboardId);
  }

  /**
   * Create a new dashboard
   */
  public createDashboard(name: string, columns: number = 3): DashboardLayout {
    const id = `dashboard-${Date.now()}`;
    const newDashboard: DashboardLayout = {
      id,
      name,
      columns,
      widgets: []
    };
    
    this.preferences.dashboards.push(newDashboard);
    this.savePreferences();
    return newDashboard;
  }

  /**
   * Update a dashboard's properties
   */
  public updateDashboard(dashboardId: string, updates: Partial<DashboardLayout>): boolean {
    const index = this.preferences.dashboards.findIndex(d => d.id === dashboardId);
    if (index === -1) return false;

    this.preferences.dashboards[index] = {
      ...this.preferences.dashboards[index],
      ...updates,
      id: dashboardId // Ensure ID doesn't change
    };
    
    this.savePreferences();
    return true;
  }

  /**
   * Delete a dashboard
   */
  public deleteDashboard(dashboardId: string): boolean {
    // Don't allow deleting the default dashboard
    if (dashboardId === this.preferences.defaultDashboardId) {
      return false;
    }

    const initialLength = this.preferences.dashboards.length;
    this.preferences.dashboards = this.preferences.dashboards.filter(d => d.id !== dashboardId);
    
    if (this.preferences.dashboards.length !== initialLength) {
      this.savePreferences();
      return true;
    }
    
    return false;
  }

  /**
   * Set the default dashboard
   */
  public setDefaultDashboard(dashboardId: string): boolean {
    if (this.preferences.dashboards.some(d => d.id === dashboardId)) {
      this.preferences.defaultDashboardId = dashboardId;
      this.savePreferences();
      return true;
    }
    return false;
  }

  /**
   * Add a widget to a dashboard
   */
  public addWidget(dashboardId: string, widget: Omit<WidgetLayoutItem, 'id'>): string | null {
    const dashboard = this.getDashboard(dashboardId);
    if (!dashboard) return null;

    const widgetId = `widget-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newWidget: WidgetLayoutItem = {
      ...widget,
      id: widgetId
    };

    dashboard.widgets.push(newWidget);
    this.savePreferences();
    return widgetId;
  }

  /**
   * Update a widget's configuration
   */
  public updateWidget(dashboardId: string, widgetId: string, updates: Partial<WidgetLayoutItem>): boolean {
    const dashboard = this.getDashboard(dashboardId);
    if (!dashboard) return false;

    const widgetIndex = dashboard.widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1) return false;

    dashboard.widgets[widgetIndex] = {
      ...dashboard.widgets[widgetIndex],
      ...updates,
      id: widgetId // Ensure ID doesn't change
    };

    this.savePreferences();
    return true;
  }

  /**
   * Remove a widget from a dashboard
   */
  public removeWidget(dashboardId: string, widgetId: string): boolean {
    const dashboard = this.getDashboard(dashboardId);
    if (!dashboard) return false;

    const initialLength = dashboard.widgets.length;
    dashboard.widgets = dashboard.widgets.filter(w => w.id !== widgetId);
    
    if (dashboard.widgets.length !== initialLength) {
      this.savePreferences();
      return true;
    }
    
    return false;
  }

  /**
   * Update the layout of widgets in a dashboard
   */
  public updateLayout(dashboardId: string, layout: Partial<WidgetLayoutItem>[]): boolean {
    const dashboard = this.getDashboard(dashboardId);
    if (!dashboard) return false;

    // Update only position-related properties
    layout.forEach(item => {
      if (!item.id) return;
      
      const widget = dashboard.widgets.find(w => w.id === item.id);
      if (widget) {
        if (item.column !== undefined) widget.column = item.column;
        if (item.order !== undefined) widget.order = item.order;
        if (item.width !== undefined) widget.width = item.width;
        if (item.height !== undefined) widget.height = item.height;
      }
    });

    this.savePreferences();
    return true;
  }

  /**
   * Update general dashboard preferences
   */
  public updateGeneralPreferences(updates: Partial<Pick<DashboardPreferences, 'theme' | 'refreshInterval' | 'compactMode'>>): void {
    this.preferences = {
      ...this.preferences,
      ...updates
    };
    this.savePreferences();
  }

  /**
   * Reset all preferences to default
   */
  public resetToDefaults(): void {
    this.preferences = { ...DEFAULT_PREFERENCES };
    this.savePreferences();
  }

  /**
   * Subscribe to preference changes
   */
  public subscribe(callback: (prefs: DashboardPreferences) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Notify all listeners of preference changes
   */
  private notifyListeners(): void {
    const prefs = this.getPreferences();
    this.listeners.forEach(listener => {
      try {
        listener(prefs);
      } catch (error) {
        console.error('Error in dashboard preference listener:', error);
      }
    });
  }

  /**
   * Export preferences to JSON
   */
  public exportPreferences(): string {
    return JSON.stringify(this.preferences);
  }

  /**
   * Import preferences from JSON
   */
  public importPreferences(json: string): boolean {
    try {
      const imported = JSON.parse(json) as DashboardPreferences;
      
      // Validate the imported data has the required structure
      if (!imported.dashboards || !Array.isArray(imported.dashboards)) {
        throw new Error('Invalid dashboard preferences format');
      }
      
      this.preferences = imported;
      this.savePreferences();
      return true;
    } catch (error) {
      console.error('Error importing dashboard preferences:', error);
      return false;
    }
  }
}

export default DashboardPreferenceService;