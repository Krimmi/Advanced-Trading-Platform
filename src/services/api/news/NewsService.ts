import { BaseApiService } from '../BaseApiService';

/**
 * News article interface
 */
export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content?: string;
  url: string;
  source: string;
  publishedAt: string;
  author?: string;
  imageUrl?: string;
  categories?: string[];
  symbols?: string[];
  sentiment?: {
    score: number; // -1 to 1 range, where -1 is very negative, 0 is neutral, 1 is very positive
    label: 'negative' | 'neutral' | 'positive';
  };
}

/**
 * News search parameters
 */
export interface NewsSearchParams {
  query?: string;
  symbols?: string[];
  categories?: string[];
  sources?: string[];
  from?: string; // ISO date string
  to?: string; // ISO date string
  language?: string;
  sortBy?: 'relevancy' | 'popularity' | 'publishedAt';
  page?: number;
  pageSize?: number;
}

/**
 * News search response
 */
export interface NewsSearchResponse {
  articles: NewsArticle[];
  totalResults: number;
  page: number;
  pageSize: number;
}

/**
 * Sentiment analysis result
 */
export interface SentimentAnalysis {
  symbol: string;
  overallScore: number; // -1 to 1 range
  overallLabel: 'negative' | 'neutral' | 'positive';
  newsCount: number;
  socialCount: number;
  newsScore: number; // -1 to 1 range
  socialScore: number; // -1 to 1 range
  timestamp: string;
}

/**
 * Sentiment trend data point
 */
export interface SentimentTrendPoint {
  timestamp: string;
  score: number;
  volume: number;
}

/**
 * Sentiment trend response
 */
export interface SentimentTrendResponse {
  symbol: string;
  data: SentimentTrendPoint[];
  startDate: string;
  endDate: string;
}

/**
 * Base interface for news services
 */
export interface INewsService {
  /**
   * Search for news articles
   * @param params - Search parameters
   * @returns Promise with news search response
   */
  searchNews(params: NewsSearchParams): Promise<NewsSearchResponse>;

  /**
   * Get news for a specific symbol
   * @param symbol - Stock symbol
   * @param limit - Maximum number of articles to return
   * @param from - Start date (ISO string)
   * @param to - End date (ISO string)
   * @returns Promise with news articles
   */
  getSymbolNews(symbol: string, limit?: number, from?: string, to?: string): Promise<NewsArticle[]>;

  /**
   * Get top news articles
   * @param category - News category
   * @param limit - Maximum number of articles to return
   * @returns Promise with news articles
   */
  getTopNews(category?: string, limit?: number): Promise<NewsArticle[]>;

  /**
   * Get sentiment analysis for a symbol
   * @param symbol - Stock symbol
   * @returns Promise with sentiment analysis
   */
  getSentiment(symbol: string): Promise<SentimentAnalysis>;

  /**
   * Get sentiment trend for a symbol
   * @param symbol - Stock symbol
   * @param days - Number of days to look back
   * @returns Promise with sentiment trend data
   */
  getSentimentTrend(symbol: string, days?: number): Promise<SentimentTrendResponse>;
}