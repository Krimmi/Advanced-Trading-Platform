/**
 * Widget Registry
 * 
 * This module manages the registration and retrieval of widget components
 * for the personalized dashboard system.
 */

import React from 'react';
import { WidgetLayoutItem } from '../services/DashboardPreferenceService';

// Widget configuration
export interface WidgetConfig {
  type: string;
  name: string;
  description: string;
  icon: string;
  component: React.ComponentType<WidgetProps>;
  defaultSettings: Record<string, any>;
  defaultSize: {
    width: number;
    height: number;
  };
  minSize?: {
    width: number;
    height: number;
  };
  maxSize?: {
    width: number;
    height: number;
  };
  category: string;
  tags: string[];
  permissions?: string[];
}

// Widget props passed to each widget component
export interface WidgetProps {
  id: string;
  settings: Record<string, any>;
  width: number;
  height: number;
  isEditing: boolean;
  onSettingsChange: (newSettings: Record<string, any>) => void;
  onResize?: (width: number, height: number) => void;
  loading?: boolean;
  error?: string | null;
  data?: any;
}

class WidgetRegistry {
  private static instance: WidgetRegistry;
  private widgets: Record<string, WidgetConfig> = {};
  private categories: Record<string, string> = {};

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): WidgetRegistry {
    if (!WidgetRegistry.instance) {
      WidgetRegistry.instance = new WidgetRegistry();
    }
    return WidgetRegistry.instance;
  }

  /**
   * Register a widget
   */
  public registerWidget(config: WidgetConfig): void {
    if (this.widgets[config.type]) {
      console.warn(`Widget type '${config.type}' is already registered. It will be overwritten.`);
    }
    
    this.widgets[config.type] = { ...config };
    
    // Ensure the category exists
    if (config.category && !this.categories[config.category]) {
      this.registerCategory(config.category, config.category);
    }
  }

  /**
   * Register multiple widgets
   */
  public registerWidgets(configs: WidgetConfig[]): void {
    configs.forEach(config => this.registerWidget(config));
  }

  /**
   * Register a category
   */
  public registerCategory(id: string, name: string): void {
    this.categories[id] = name;
  }

  /**
   * Get a widget configuration by type
   */
  public getWidget(type: string): WidgetConfig | undefined {
    return this.widgets[type];
  }

  /**
   * Get all registered widgets
   */
  public getAllWidgets(): WidgetConfig[] {
    return Object.values(this.widgets);
  }

  /**
   * Get widgets by category
   */
  public getWidgetsByCategory(category: string): WidgetConfig[] {
    return Object.values(this.widgets).filter(widget => widget.category === category);
  }

  /**
   * Get widgets by tag
   */
  public getWidgetsByTag(tag: string): WidgetConfig[] {
    return Object.values(this.widgets).filter(widget => widget.tags.includes(tag));
  }

  /**
   * Get all categories
   */
  public getCategories(): { id: string; name: string }[] {
    return Object.entries(this.categories).map(([id, name]) => ({ id, name }));
  }

  /**
   * Check if a widget type is registered
   */
  public hasWidget(type: string): boolean {
    return !!this.widgets[type];
  }

  /**
   * Create a widget component from layout item
   */
  public createWidgetComponent(layoutItem: WidgetLayoutItem, props: Omit<WidgetProps, 'settings' | 'width' | 'height'>): React.ReactNode {
    const widgetConfig = this.getWidget(layoutItem.widgetType);
    if (!widgetConfig) {
      return (
        <div className="widget-error">
          Widget type '{layoutItem.widgetType}' not found
        </div>
      );
    }
    
    const Component = widgetConfig.component;
    return (
      <Component
        {...props}
        settings={layoutItem.settings}
        width={layoutItem.width}
        height={layoutItem.height}
      />
    );
  }

  /**
   * Get default settings for a widget type
   */
  public getDefaultSettings(type: string): Record<string, any> {
    const widget = this.getWidget(type);
    return widget ? { ...widget.defaultSettings } : {};
  }

  /**
   * Get default size for a widget type
   */
  public getDefaultSize(type: string): { width: number; height: number } {
    const widget = this.getWidget(type);
    return widget ? { ...widget.defaultSize } : { width: 6, height: 2 };
  }

  /**
   * Check if user has permission to use a widget
   */
  public hasPermission(type: string, userPermissions: string[]): boolean {
    const widget = this.getWidget(type);
    if (!widget || !widget.permissions || widget.permissions.length === 0) {
      return true; // No permissions required
    }
    
    return widget.permissions.some(permission => userPermissions.includes(permission));
  }

  /**
   * Get available widgets for a user based on permissions
   */
  public getAvailableWidgets(userPermissions: string[]): WidgetConfig[] {
    return Object.values(this.widgets).filter(widget => 
      !widget.permissions || 
      widget.permissions.length === 0 || 
      widget.permissions.some(permission => userPermissions.includes(permission))
    );
  }
}

export default WidgetRegistry;