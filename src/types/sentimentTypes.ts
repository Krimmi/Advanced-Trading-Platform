/**
 * Type definitions for sentiment analysis
 */

export enum SentimentSource {
  NEWS = 'news',
  SOCIAL_MEDIA = 'social_media',
  EARNINGS_CALL = 'earnings_call',
  SEC_FILING = 'sec_filing'
}

export interface SentimentTrend {
  direction: 'improving' | 'deteriorating' | 'stable';
  magnitude: number;
  volatility: number;
}

export interface EntitySentiment {
  entity: string;
  mentions: number;
  score: number;
  classification: string;
}

export interface SentimentAnalysisResult {
  ticker: string;
  source: SentimentSource;
  sentimentItems: any[]; // This will vary based on the source
  aggregateScore: number;
  aggregateClassification: string;
  trend: SentimentTrend;
  timestamp: Date;
}

export interface SentimentOverview {
  ticker: string;
  overallScore: number;
  overallClassification: string;
  sourceSentiments: {
    source: SentimentSource;
    score: number;
    classification: string;
  }[];
  entitySentiment: EntitySentiment[];
  timestamp: Date;
}

export interface SentimentTimeSeriesPoint {
  date: Date;
  source: SentimentSource;
  score: number;
  classification: string;
  itemCount: number;
}

export interface SentimentCorrelation {
  correlation: number;
  leadLag: number; // Positive if sentiment leads price, negative if price leads sentiment
  dailyData: {
    date: string;
    sentiment: number;
    price: number;
    priceChange: number;
  }[];
}

export interface SentimentAlert {
  id: string;
  ticker: string;
  source: SentimentSource;
  triggerType: 'threshold' | 'change' | 'anomaly';
  triggerValue: number;
  triggerCondition: 'above' | 'below' | 'increase' | 'decrease';
  triggered: boolean;
  triggeredAt?: Date;
  message: string;
  severity: 'low' | 'medium' | 'high';
}