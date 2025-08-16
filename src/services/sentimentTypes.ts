/**
 * Core type definitions for the sentiment analysis system
 */

/**
 * Represents a sentiment data point for a specific entity
 */
export interface SentimentData {
  id: string;
  entityId: string;  // Symbol or other entity identifier
  entityType: EntityType;
  source: string;    // Source of the sentiment data
  sourceType: SourceType;
  timestamp: string;
  score: number;     // Normalized sentiment score (-1 to 1)
  magnitude: number; // Intensity of the sentiment (0 to 1)
  volume: number;    // Number of mentions/documents
  keywords: string[];
  rawText?: string;  // Original text if available
  url?: string;      // Source URL if applicable
  metadata: Record<string, any>;
}

/**
 * Types of entities that can have sentiment data
 */
export type EntityType = 'stock' | 'sector' | 'industry' | 'market' | 'crypto' | 'forex';

/**
 * Types of sources for sentiment data
 */
export type SourceType = 'news' | 'social_media' | 'financial_report' | 'analyst_rating';

/**
 * Represents a data point in a sentiment time series
 */
export interface SentimentDataPoint {
  timestamp: string;
  score: number;
  volume: number;
  magnitude: number;
}

/**
 * Represents a sentiment trend for an entity over a period
 */
export interface SentimentTrend {
  entityId: string;
  period: TimePeriod;
  startTime: string;
  endTime: string;
  averageScore: number;
  scoreChange: number;
  volumeChange: number;
  volatility: number;
  dataPoints: SentimentDataPoint[];
}

/**
 * Time periods for sentiment analysis
 */
export type TimePeriod = 'hour' | 'day' | 'week' | 'month';

/**
 * Represents a sentiment alert configuration
 */
export interface SentimentAlert {
  id: string;
  userId: string;
  entityId: string;
  entityType: EntityType;
  condition: SentimentAlertCondition;
  threshold: number;
  timeWindow: number; // In minutes
  sources: string[];
  enabled: boolean;
  createdAt: string;
  lastTriggered?: string;
}

/**
 * Types of conditions for sentiment alerts
 */
export type SentimentAlertCondition = 'above' | 'below' | 'change_above' | 'change_below' | 'volatility_above';

/**
 * Options for sentiment analysis
 */
export interface SentimentAnalysisOptions {
  includeEntities?: boolean;
  includeKeywords?: boolean;
  includeRawText?: boolean;
  algorithm?: 'basic' | 'financial' | 'advanced';
  language?: string;
}

/**
 * Result of entity extraction from text
 */
export interface ExtractedEntity {
  id: string;
  type: EntityType;
  name: string;
  ticker?: string;
  confidence: number;
  mentions: {
    offset: number;
    length: number;
    text: string;
  }[];
}

/**
 * Result of keyword extraction from text
 */
export interface ExtractedKeyword {
  text: string;
  relevance: number;
  count: number;
}

/**
 * Represents a news article with sentiment analysis
 */
export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  summary?: string;
  source: string;
  author?: string;
  url: string;
  publishedAt: string;
  sentiment: {
    score: number;
    magnitude: number;
  };
  entities: ExtractedEntity[];
  keywords: ExtractedKeyword[];
  categories?: string[];
  imageUrl?: string;
}

/**
 * Represents a social media post with sentiment analysis
 */
export interface SocialMediaPost {
  id: string;
  platform: 'twitter' | 'reddit' | 'stocktwits' | 'other';
  content: string;
  author: {
    id: string;
    username: string;
    followersCount?: number;
    influenceScore?: number;
  };
  publishedAt: string;
  sentiment: {
    score: number;
    magnitude: number;
  };
  entities: ExtractedEntity[];
  keywords: ExtractedKeyword[];
  engagement: {
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
  };
  url?: string;
}

/**
 * Represents sentiment metrics for an entity
 */
export interface SentimentMetrics {
  entityId: string;
  entityType: EntityType;
  timestamp: string;
  period: TimePeriod;
  metrics: {
    averageScore: number;
    volumeWeightedScore: number;
    scoreVolatility: number;
    volumeTotal: number;
    volumeChange: number;
    bullishPercentage: number;
    bearishPercentage: number;
    neutralPercentage: number;
    topSources: Array<{
      source: string;
      score: number;
      volume: number;
    }>;
    topKeywords: Array<{
      keyword: string;
      count: number;
      score: number;
    }>;
  };
}

/**
 * Represents a correlation between sentiment and price
 */
export interface SentimentPriceCorrelation {
  entityId: string;
  period: TimePeriod;
  startTime: string;
  endTime: string;
  correlationCoefficient: number;
  leadLagRelationship: number; // Positive means sentiment leads price, negative means price leads sentiment
  dataPoints: Array<{
    timestamp: string;
    sentimentScore: number;
    priceChange: number;
  }>;
}

/**
 * Represents market-wide sentiment
 */
export interface MarketSentiment {
  timestamp: string;
  overallScore: number;
  sectorSentiment: Array<{
    sector: string;
    score: number;
    change: number;
  }>;
  topPositive: Array<{
    entityId: string;
    entityName: string;
    score: number;
  }>;
  topNegative: Array<{
    entityId: string;
    entityName: string;
    score: number;
  }>;
  topTrending: Array<{
    entityId: string;
    entityName: string;
    volumeChange: number;
  }>;
}