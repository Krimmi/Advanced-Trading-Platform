/**
 * Dashboard Module Exports
 * 
 * This file exports all components and services related to the personalized dashboard feature.
 */

// Main Components
export { default as PersonalizedDashboard } from './PersonalizedDashboard';
export { default as DashboardDemo } from './DashboardDemo';

// Services
export { default as DashboardPreferenceService } from './services/DashboardPreferenceService';
export { default as DashboardStateService, useDashboardState } from './services/DashboardStateService';

// Widget System
export { default as WidgetRegistry } from './WidgetSystem/WidgetRegistry';
export { default as WidgetContainer } from './WidgetSystem/WidgetContainer';
export { registerAllWidgets, registerWidgetDataProviders } from './WidgetSystem/registerWidgets';

// Widgets
export { default as MarketOverviewWidget } from './WidgetSystem/widgets/MarketOverviewWidget';
export { default as PortfolioSummaryWidget } from './WidgetSystem/widgets/PortfolioSummaryWidget';
export { default as WatchlistWidget } from './WidgetSystem/widgets/WatchlistWidget';
export { default as NewsWidget } from './WidgetSystem/widgets/NewsWidget';

// Types
export type { DashboardLayout, WidgetLayoutItem } from './services/DashboardPreferenceService';
export type { WidgetProps, WidgetConfig } from './WidgetSystem/WidgetRegistry';