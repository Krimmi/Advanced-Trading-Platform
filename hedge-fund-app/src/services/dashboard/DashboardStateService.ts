import { BehaviorSubject, Observable } from 'rxjs';
import DashboardPreferenceService, { DashboardPreference, WidgetLayout } from './DashboardPreferenceService';

export interface DashboardState {
  activeDashboardId: string | null;
  dashboards: DashboardPreference[];
  isLoading: boolean;
  error: string | null;
  editMode: boolean;
}

/**
 * Service for managing dashboard runtime state
 */
class DashboardStateService {
  private static instance: DashboardStateService;
  private dashboardPreferenceService = DashboardPreferenceService.getInstance();
  
  private state: DashboardState = {
    activeDashboardId: null,
    dashboards: [],
    isLoading: false,
    error: null,
    editMode: false
  };
  
  private stateSubject = new BehaviorSubject<DashboardState>(this.state);

  private constructor() {}

  public static getInstance(): DashboardStateService {
    if (!DashboardStateService.instance) {
      DashboardStateService.instance = new DashboardStateService();
    }
    return DashboardStateService.instance;
  }

  /**
   * Get the current dashboard state as an observable
   */
  public getState(): Observable<DashboardState> {
    return this.stateSubject.asObservable();
  }

  /**
   * Get the current dashboard state value
   */
  public getCurrentState(): DashboardState {
    return this.state;
  }

  /**
   * Load dashboards for a user
   */
  public async loadUserDashboards(userId: string): Promise<void> {
    try {
      this.updateState({ isLoading: true, error: null });
      
      const dashboards = await this.dashboardPreferenceService.getUserDashboards(userId);
      
      // Set the default dashboard as active if no active dashboard
      const defaultDashboard = dashboards.find(d => d.isDefault);
      const activeDashboardId = this.state.activeDashboardId || (defaultDashboard ? defaultDashboard.id : null);
      
      this.updateState({ 
        dashboards, 
        activeDashboardId, 
        isLoading: false 
      });
    } catch (error) {
      console.error('Error loading user dashboards:', error);
      this.updateState({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to load dashboards' 
      });
    }
  }

  /**
   * Set the active dashboard
   */
  public setActiveDashboard(dashboardId: string): void {
    if (this.state.dashboards.some(d => d.id === dashboardId)) {
      this.updateState({ activeDashboardId: dashboardId });
    } else {
      console.error(`Dashboard ${dashboardId} not found`);
    }
  }

  /**
   * Get the active dashboard
   */
  public getActiveDashboard(): DashboardPreference | null {
    if (!this.state.activeDashboardId) return null;
    return this.state.dashboards.find(d => d.id === this.state.activeDashboardId) || null;
  }

  /**
   * Toggle edit mode
   */
  public toggleEditMode(): void {
    this.updateState({ editMode: !this.state.editMode });
  }

  /**
   * Update widget layout
   */
  public async updateWidgetLayout(dashboardId: string, layout: WidgetLayout[]): Promise<void> {
    try {
      const dashboard = this.state.dashboards.find(d => d.id === dashboardId);
      
      if (!dashboard) {
        throw new Error(`Dashboard ${dashboardId} not found`);
      }
      
      const updatedDashboard = await this.dashboardPreferenceService.updateDashboard(dashboardId, { layout });
      
      // Update the dashboard in the state
      const updatedDashboards = this.state.dashboards.map(d => 
        d.id === dashboardId ? updatedDashboard : d
      );
      
      this.updateState({ dashboards: updatedDashboards });
    } catch (error) {
      console.error(`Error updating widget layout for dashboard ${dashboardId}:`, error);
      this.updateState({ 
        error: error instanceof Error ? error.message : 'Failed to update widget layout' 
      });
    }
  }

  /**
   * Create a new dashboard
   */
  public async createDashboard(name: string, userId: string, isDefault: boolean = false): Promise<string> {
    try {
      const newDashboard = await this.dashboardPreferenceService.createDashboard({
        userId,
        name,
        isDefault,
        layout: []
      });
      
      const updatedDashboards = [...this.state.dashboards, newDashboard];
      
      this.updateState({ dashboards: updatedDashboards });
      
      if (isDefault || this.state.dashboards.length === 1) {
        this.setActiveDashboard(newDashboard.id);
      }
      
      return newDashboard.id;
    } catch (error) {
      console.error('Error creating dashboard:', error);
      this.updateState({ 
        error: error instanceof Error ? error.message : 'Failed to create dashboard' 
      });
      throw error;
    }
  }

  /**
   * Delete a dashboard
   */
  public async deleteDashboard(dashboardId: string): Promise<void> {
    try {
      await this.dashboardPreferenceService.deleteDashboard(dashboardId);
      
      const updatedDashboards = this.state.dashboards.filter(d => d.id !== dashboardId);
      
      // If the active dashboard was deleted, set the first available dashboard as active
      let activeDashboardId = this.state.activeDashboardId;
      if (activeDashboardId === dashboardId) {
        const defaultDashboard = updatedDashboards.find(d => d.isDefault);
        activeDashboardId = defaultDashboard ? defaultDashboard.id : (updatedDashboards[0]?.id || null);
      }
      
      this.updateState({ 
        dashboards: updatedDashboards,
        activeDashboardId
      });
    } catch (error) {
      console.error(`Error deleting dashboard ${dashboardId}:`, error);
      this.updateState({ 
        error: error instanceof Error ? error.message : 'Failed to delete dashboard' 
      });
    }
  }

  /**
   * Add a widget to the active dashboard
   */
  public async addWidget(widgetType: string, settings: Record<string, any> = {}): Promise<void> {
    const activeDashboard = this.getActiveDashboard();
    
    if (!activeDashboard) {
      this.updateState({ error: 'No active dashboard' });
      return;
    }
    
    const newWidget: WidgetLayout = {
      id: `widget-${Date.now()}`,
      widgetType,
      position: this.calculateNextWidgetPosition(activeDashboard.layout),
      settings
    };
    
    const updatedLayout = [...activeDashboard.layout, newWidget];
    
    await this.updateWidgetLayout(activeDashboard.id, updatedLayout);
  }

  /**
   * Remove a widget from the active dashboard
   */
  public async removeWidget(widgetId: string): Promise<void> {
    const activeDashboard = this.getActiveDashboard();
    
    if (!activeDashboard) {
      this.updateState({ error: 'No active dashboard' });
      return;
    }
    
    const updatedLayout = activeDashboard.layout.filter(w => w.id !== widgetId);
    
    await this.updateWidgetLayout(activeDashboard.id, updatedLayout);
  }

  /**
   * Update widget settings
   */
  public async updateWidgetSettings(widgetId: string, settings: Record<string, any>): Promise<void> {
    const activeDashboard = this.getActiveDashboard();
    
    if (!activeDashboard) {
      this.updateState({ error: 'No active dashboard' });
      return;
    }
    
    const updatedLayout = activeDashboard.layout.map(widget => {
      if (widget.id === widgetId) {
        return {
          ...widget,
          settings: {
            ...widget.settings,
            ...settings
          }
        };
      }
      return widget;
    });
    
    await this.updateWidgetLayout(activeDashboard.id, updatedLayout);
  }

  /**
   * Calculate the next widget position based on existing layout
   */
  private calculateNextWidgetPosition(layout: WidgetLayout[]): { x: number; y: number; w: number; h: number } {
    // Default size for new widgets
    const defaultWidth = 6;
    const defaultHeight = 4;
    
    if (layout.length === 0) {
      // First widget starts at the top-left
      return { x: 0, y: 0, w: defaultWidth, h: defaultHeight };
    }
    
    // Find the maximum y + height to place the new widget below existing ones
    let maxY = 0;
    
    layout.forEach(widget => {
      const bottomY = widget.position.y + widget.position.h;
      if (bottomY > maxY) {
        maxY = bottomY;
      }
    });
    
    // Place the new widget at the top of the next row
    return { x: 0, y: maxY, w: defaultWidth, h: defaultHeight };
  }

  /**
   * Update the state and notify subscribers
   */
  private updateState(partialState: Partial<DashboardState>): void {
    this.state = {
      ...this.state,
      ...partialState
    };
    
    this.stateSubject.next(this.state);
  }
}

export default DashboardStateService;