/**
 * Widget Metadata Model
 * 
 * This model defines the metadata for widgets available in the marketplace.
 */

export interface WidgetAuthor {
  id: string;
  name: string;
  email?: string;
  website?: string;
  organization?: string;
}

export interface WidgetScreenshot {
  url: string;
  caption: string;
  thumbnailUrl?: string;
}

export interface WidgetRating {
  averageScore: number;
  totalRatings: number;
  distribution: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
}

export interface WidgetReview {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
  reply?: {
    authorId: string;
    authorName: string;
    comment: string;
    date: string;
  };
}

export interface WidgetVersion {
  version: string;
  releaseDate: string;
  changelog: string;
  minAppVersion?: string;
  downloadUrl?: string;
}

export interface WidgetDependency {
  name: string;
  version: string;
  optional: boolean;
}

export interface WidgetMetadata {
  id: string;
  type: string;
  name: string;
  description: string;
  longDescription?: string;
  icon: string;
  category: string;
  tags: string[];
  author: WidgetAuthor;
  version: string;
  versions: WidgetVersion[];
  created: string;
  updated: string;
  screenshots: WidgetScreenshot[];
  rating?: WidgetRating;
  reviews?: WidgetReview[];
  installCount: number;
  dependencies?: WidgetDependency[];
  permissions?: string[];
  pricing: {
    type: 'free' | 'paid' | 'subscription';
    price?: number;
    currency?: string;
    trial?: boolean;
    trialDays?: number;
  };
  featured: boolean;
  verified: boolean;
  official: boolean;
  status: 'active' | 'beta' | 'deprecated' | 'removed';
  compatibility: {
    desktop: boolean;
    mobile: boolean;
    tablet: boolean;
  };
  settings?: {
    hasGlobalSettings: boolean;
    hasInstanceSettings: boolean;
    globalSettingsUrl?: string;
  };
  documentation?: {
    setup?: string;
    usage?: string;
    api?: string;
    faq?: string;
  };
  links?: {
    website?: string;
    support?: string;
    github?: string;
    twitter?: string;
  };
}

export interface UserWidgetData {
  widgetId: string;
  installed: boolean;
  installDate?: string;
  version: string;
  globalSettings?: Record<string, any>;
  instances: {
    dashboardId: string;
    instanceId: string;
    settings: Record<string, any>;
  }[];
  userRating?: number;
  userReview?: string;
  usageStats?: {
    lastUsed: string;
    totalUses: number;
    totalTimeSpent: number; // in seconds
  };
}

export interface WidgetCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
  featured: boolean;
  order: number;
}