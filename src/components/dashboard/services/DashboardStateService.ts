/**
 * Dashboard State Service
 * 
 * This service manages the runtime state of dashboards, including
 * widget data loading, refresh cycles, and real-time updates.
 */

import { useEffect, useState } from 'react';
import DashboardPreferenceService, { DashboardLayout, WidgetLayoutItem } from './DashboardPreferenceService';

// Widget data state
export interface WidgetState {
  id: string;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  data: any;
}

// Dashboard runtime state
export interface DashboardState {
  dashboardId: string;
  widgets: Record<string, WidgetState>;
  isRefreshing: boolean;
  lastRefreshed: number | null;
}

class DashboardStateService {
  private static instance: DashboardStateService;
  private states: Record<string, DashboardState> = {};
  private refreshTimers: Record<string, NodeJS.Timeout> = {};
  private dataProviders: Record<string, (widgetConfig: WidgetLayoutItem) => Promise<any>> = {};
  private listeners: Record<string, Array<(state: DashboardState) => void>> = {};
  private preferenceService: DashboardPreferenceService;

  private constructor() {
    this.preferenceService = DashboardPreferenceService.getInstance();
    
    // Initialize states for all dashboards
    const prefs = this.preferenceService.getPreferences();
    prefs.dashboards.forEach(dashboard => {
      this.initializeDashboardState(dashboard);
    });
    
    // Subscribe to preference changes
    this.preferenceService.subscribe(this.handlePreferenceChange);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DashboardStateService {
    if (!DashboardStateService.instance) {
      DashboardStateService.instance = new DashboardStateService();
    }
    return DashboardStateService.instance;
  }

  /**
   * Initialize state for a dashboard
   */
  private initializeDashboardState(dashboard: DashboardLayout): void {
    const widgetStates: Record<string, WidgetState> = {};
    
    dashboard.widgets.forEach(widget => {
      widgetStates[widget.id] = {
        id: widget.id,
        loading: false,
        error: null,
        lastUpdated: null,
        data: null
      };
    });
    
    this.states[dashboard.id] = {
      dashboardId: dashboard.id,
      widgets: widgetStates,
      isRefreshing: false,
      lastRefreshed: null
    };
  }

  /**
   * Handle preference changes
   */
  private handlePreferenceChange = (prefs: any): void => {
    // Update states based on new preferences
    prefs.dashboards.forEach((dashboard: DashboardLayout) => {
      if (!this.states[dashboard.id]) {
        // New dashboard added
        this.initializeDashboardState(dashboard);
      } else {
        // Update existing dashboard
        const currentWidgets = Object.keys(this.states[dashboard.id].widgets);
        const newWidgets = dashboard.widgets.map(w => w.id);
        
        // Remove widgets that no longer exist
        const widgetsToRemove = currentWidgets.filter(id => !newWidgets.includes(id));
        const updatedWidgetStates = { ...this.states[dashboard.id].widgets };
        
        widgetsToRemove.forEach(id => {
          delete updatedWidgetStates[id];
        });
        
        // Add new widgets
        dashboard.widgets.forEach(widget => {
          if (!updatedWidgetStates[widget.id]) {
            updatedWidgetStates[widget.id] = {
              id: widget.id,
              loading: false,
              error: null,
              lastUpdated: null,
              data: null
            };
          }
        });
        
        this.states[dashboard.id] = {
          ...this.states[dashboard.id],
          widgets: updatedWidgetStates
        };
      }
    });
    
    // Remove dashboards that no longer exist
    const dashboardIds = prefs.dashboards.map((d: DashboardLayout) => d.id);
    Object.keys(this.states).forEach(id => {
      if (!dashboardIds.includes(id)) {
        delete this.states[id];
        this.stopRefreshTimer(id);
      }
    });
    
    // Notify listeners of changes
    Object.keys(this.states).forEach(id => {
      this.notifyListeners(id);
    });
  };

  /**
   * Register a data provider for a widget type
   */
  public registerDataProvider(
    widgetType: string, 
    provider: (widgetConfig: WidgetLayoutItem) => Promise<any>
  ): void {
    this.dataProviders[widgetType] = provider;
  }

  /**
   * Get dashboard state
   */
  public getDashboardState(dashboardId: string): DashboardState | null {
    return this.states[dashboardId] || null;
  }

  /**
   * Get widget state
   */
  public getWidgetState(dashboardId: string, widgetId: string): WidgetState | null {
    const dashboard = this.states[dashboardId];
    if (!dashboard) return null;
    
    return dashboard.widgets[widgetId] || null;
  }

  /**
   * Refresh a specific widget
   */
  public async refreshWidget(dashboardId: string, widgetId: string): Promise<boolean> {
    const dashboard = this.states[dashboardId];
    if (!dashboard) return false;
    
    const widgetState = dashboard.widgets[widgetId];
    if (!widgetState) return false;
    
    const dashboardConfig = this.preferenceService.getDashboard(dashboardId);
    if (!dashboardConfig) return false;
    
    const widgetConfig = dashboardConfig.widgets.find(w => w.id === widgetId);
    if (!widgetConfig) return false;
    
    const dataProvider = this.dataProviders[widgetConfig.widgetType];
    if (!dataProvider) return false;
    
    // Update widget state to loading
    this.updateWidgetState(dashboardId, widgetId, {
      loading: true,
      error: null
    });
    
    try {
      // Fetch data from provider
      const data = await dataProvider(widgetConfig);
      
      // Update widget state with data
      this.updateWidgetState(dashboardId, widgetId, {
        loading: false,
        error: null,
        lastUpdated: Date.now(),
        data
      });
      
      return true;
    } catch (error) {
      // Update widget state with error
      this.updateWidgetState(dashboardId, widgetId, {
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastUpdated: Date.now()
      });
      
      return false;
    }
  }

  /**
   * Refresh all widgets in a dashboard
   */
  public async refreshDashboard(dashboardId: string): Promise<boolean> {
    const dashboard = this.states[dashboardId];
    if (!dashboard) return false;
    
    const dashboardConfig = this.preferenceService.getDashboard(dashboardId);
    if (!dashboardConfig) return false;
    
    // Update dashboard state to refreshing
    this.states[dashboardId] = {
      ...dashboard,
      isRefreshing: true
    };
    
    this.notifyListeners(dashboardId);
    
    // Refresh all widgets
    const refreshPromises = dashboardConfig.widgets.map(widget => 
      this.refreshWidget(dashboardId, widget.id)
    );
    
    await Promise.all(refreshPromises);
    
    // Update dashboard state after refresh
    this.states[dashboardId] = {
      ...this.states[dashboardId],
      isRefreshing: false,
      lastRefreshed: Date.now()
    };
    
    this.notifyListeners(dashboardId);
    
    return true;
  }

  /**
   * Start auto-refresh for a dashboard
   */
  public startAutoRefresh(dashboardId: string): boolean {
    const dashboard = this.states[dashboardId];
    if (!dashboard) return false;
    
    // Stop existing timer if any
    this.stopRefreshTimer(dashboardId);
    
    // Get refresh interval from preferences
    const prefs = this.preferenceService.getPreferences();
    const refreshInterval = prefs.refreshInterval * 1000; // Convert to milliseconds
    
    // Start new timer
    this.refreshTimers[dashboardId] = setInterval(() => {
      this.refreshDashboard(dashboardId);
    }, refreshInterval);
    
    return true;
  }

  /**
   * Stop auto-refresh for a dashboard
   */
  public stopAutoRefresh(dashboardId: string): boolean {
    return this.stopRefreshTimer(dashboardId);
  }

  /**
   * Stop refresh timer for a dashboard
   */
  private stopRefreshTimer(dashboardId: string): boolean {
    const timer = this.refreshTimers[dashboardId];
    if (timer) {
      clearInterval(timer);
      delete this.refreshTimers[dashboardId];
      return true;
    }
    return false;
  }

  /**
   * Update widget state
   */
  private updateWidgetState(dashboardId: string, widgetId: string, updates: Partial<WidgetState>): void {
    const dashboard = this.states[dashboardId];
    if (!dashboard) return;
    
    const widgetState = dashboard.widgets[widgetId];
    if (!widgetState) return;
    
    dashboard.widgets[widgetId] = {
      ...widgetState,
      ...updates
    };
    
    this.notifyListeners(dashboardId);
  }

  /**
   * Subscribe to dashboard state changes
   */
  public subscribe(dashboardId: string, callback: (state: DashboardState) => void): () => void {
    if (!this.listeners[dashboardId]) {
      this.listeners[dashboardId] = [];
    }
    
    this.listeners[dashboardId].push(callback);
    
    // Return unsubscribe function
    return () => {
      if (!this.listeners[dashboardId]) return;
      this.listeners[dashboardId] = this.listeners[dashboardId].filter(listener => listener !== callback);
    };
  }

  /**
   * Notify listeners of state changes
   */
  private notifyListeners(dashboardId: string): void {
    const listeners = this.listeners[dashboardId];
    if (!listeners || listeners.length === 0) return;
    
    const state = this.states[dashboardId];
    if (!state) return;
    
    listeners.forEach(listener => {
      try {
        listener({ ...state });
      } catch (error) {
        console.error('Error in dashboard state listener:', error);
      }
    });
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    // Stop all refresh timers
    Object.keys(this.refreshTimers).forEach(id => {
      this.stopRefreshTimer(id);
    });
  }
}

/**
 * React hook for using dashboard state
 */
export function useDashboardState(dashboardId: string): DashboardState | null {
  const [state, setState] = useState<DashboardState | null>(null);
  const stateService = DashboardStateService.getInstance();
  
  useEffect(() => {
    // Get initial state
    setState(stateService.getDashboardState(dashboardId));
    
    // Subscribe to state changes
    const unsubscribe = stateService.subscribe(dashboardId, newState => {
      setState({ ...newState });
    });
    
    // Start auto-refresh
    stateService.startAutoRefresh(dashboardId);
    
    // Clean up on unmount
    return () => {
      unsubscribe();
      stateService.stopAutoRefresh(dashboardId);
    };
  }, [dashboardId]);
  
  return state;
}

export default DashboardStateService;