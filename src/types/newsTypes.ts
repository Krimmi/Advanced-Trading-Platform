/**
 * Type definitions for news analysis
 */

export enum NewsSource {
  BLOOMBERG = 'bloomberg',
  REUTERS = 'reuters',
  CNBC = 'cnbc',
  WALL_STREET_JOURNAL = 'wsj',
  FINANCIAL_TIMES = 'ft',
  MARKET_WATCH = 'marketwatch',
  SEEKING_ALPHA = 'seekingalpha',
  YAHOO_FINANCE = 'yahoo',
  BARRONS = 'barrons',
  BUSINESS_INSIDER = 'businessinsider',
  OTHER = 'other'
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  url: string;
  source: NewsSource;
  author: string;
  publishedAt: Date;
  sentiment: {
    score: number;
    classification: string;
    titleScore: number;
    contentScore: number;
  };
  relevance: number;
  categories: string[];
  entities: {
    name: string;
    type: string;
    sentiment: number;
  }[];
  imageUrl: string | null;
}

export interface NewsEntity {
  name: string;
  type: string;
  mentions: number;
  sentiment: {
    score: number;
    classification: string;
  };
  articleCount: number;
}

export interface NewsImpact {
  overall: {
    score: number;
    classification: string;
    confidence: number;
  };
  shortTerm: {
    score: number;
    classification: string;
    confidence: number;
  };
  longTerm: {
    score: number;
    classification: string;
    confidence: number;
  };
  significantArticles: {
    id: string;
    title: string;
    url: string;
    publishedAt: Date;
    sentiment: {
      score: number;
      classification: string;
    };
    relevance: number;
  }[];
}

export interface NewsTrend {
  name: string;
  value: number;
  changePercent: number;
  direction: 'increasing' | 'decreasing' | 'stable' | 'improving' | 'deteriorating';
  description: string;
}

export interface NewsAnalysisResult {
  ticker: string;
  newsItems: NewsItem[];
  entities: NewsEntity[];
  impact: NewsImpact;
  trends: NewsTrend[];
  categories: {
    category: string;
    count: number;
    items: NewsItem[];
  }[];
  timestamp: Date;
}

export interface BreakingNews {
  id: string;
  ticker: string | null;
  title: string;
  summary: string;
  url: string;
  source: NewsSource;
  publishedAt: Date;
  sentiment: {
    score: number;
    classification: string;
  };
  relevance: number;
  impactEstimate: {
    score: number;
    classification: string;
  };
}

export interface NewsSentimentCorrelation {
  correlation: number;
  leadLag: number; // Positive if news sentiment leads price, negative if price leads sentiment
  dailyData: {
    date: string;
    sentiment: number;
    price: number;
    priceChange: number;
    newsCount: number;
  }[];
}

export interface NewsAlert {
  id: string;
  ticker: string;
  triggerType: 'breaking' | 'sentiment' | 'volume' | 'entity';
  triggerValue: number | string;
  triggerCondition: 'above' | 'below' | 'increase' | 'decrease' | 'contains';
  triggered: boolean;
  triggeredAt?: Date;
  message: string;
  severity: 'low' | 'medium' | 'high';
}