/**
 * Type definitions for social media analysis
 */

export enum SocialMediaSource {
  TWITTER = 'twitter',
  REDDIT = 'reddit',
  STOCKTWITS = 'stocktwits',
  LINKEDIN = 'linkedin',
  YOUTUBE = 'youtube'
}

export interface SocialMediaPost {
  id: string;
  platform: SocialMediaSource;
  author: string;
  authorFollowers: number;
  content: string;
  timestamp: Date;
  likes: number;
  comments: number;
  shares: number;
  sentimentScore: number;
  sentimentClassification: string;
  url: string;
  hashtags: string[];
  mentions: string[];
  isVerified: boolean;
}

export interface SocialMediaMetrics {
  postCount: number;
  uniqueAuthors: number;
  totalEngagement: number;
  averageSentiment: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  platformDistribution: {
    [key: string]: number;
  };
  postFrequency: {
    hourly: {
      hour: number;
      count: number;
    }[];
    daily: {
      date: string;
      count: number;
    }[];
  };
}

export interface TopicDistribution {
  topic: string;
  frequency: number;
  percentage: number;
  keywords: string[];
  sentimentByTopic: number;
}

export interface SocialMediaTrend {
  name: string;
  value: number;
  changePercent: number;
  direction: 'increasing' | 'decreasing' | 'stable' | 'improving' | 'deteriorating';
  description: string;
}

export interface SocialMediaAnalysisResult {
  ticker: string;
  posts: SocialMediaPost[];
  metrics: SocialMediaMetrics;
  topics: TopicDistribution[];
  trends: SocialMediaTrend[];
  influencers: {
    author: string;
    platform: SocialMediaSource;
    followers: number;
    posts: number;
    averageEngagement: number;
    averageSentiment: number;
    isVerified: boolean;
  }[];
  timestamp: Date;
}

export interface TrendingTicker {
  ticker: string;
  mentionCount: number;
  sentiment: number;
  changePercent: number;
}

export interface SocialSentimentCorrelation {
  correlation: number;
  leadLag: number; // Positive if social sentiment leads price, negative if price leads sentiment
  dailyData: {
    date: string;
    sentiment: number;
    price: number;
    priceChange: number;
    postCount: number;
  }[];
}

export interface SocialMediaAlert {
  id: string;
  ticker: string;
  platform: SocialMediaSource | 'all';
  triggerType: 'volume' | 'sentiment' | 'engagement' | 'trending';
  triggerValue: number;
  triggerCondition: 'above' | 'below' | 'increase' | 'decrease';
  triggered: boolean;
  triggeredAt?: Date;
  message: string;
  severity: 'low' | 'medium' | 'high';
}