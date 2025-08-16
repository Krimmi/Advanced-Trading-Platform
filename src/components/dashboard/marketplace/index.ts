/**
 * Marketplace Module Exports
 * 
 * This file exports all components and services related to the widget marketplace.
 */

// Components
export { default as MarketplacePage } from './components/MarketplacePage';
export { default as WidgetDetailPanel } from './components/WidgetDetailPanel';
export { default as WidgetManagementPanel } from './components/WidgetManagementPanel';

// Services
export { default as MarketplaceService } from './services/MarketplaceService';

// Models
export type { 
  WidgetMetadata, 
  WidgetAuthor, 
  WidgetScreenshot, 
  WidgetRating, 
  WidgetReview,
  WidgetVersion,
  WidgetDependency,
  UserWidgetData,
  WidgetCategory
} from './models/WidgetMetadata';