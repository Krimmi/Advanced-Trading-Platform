/**
 * Sentiment Analytics Service
 * 
 * This service provides a frontend interface to the sentiment analytics backend services,
 * including sentiment analysis, social media analysis, news analysis, and behavioral metrics.
 */

import axios from 'axios';
import { 
  SentimentOverview, 
  SentimentAnalysisResult, 
  SentimentTimeSeriesPoint,
  SentimentCorrelation,
  SentimentAlert
} from '../types/sentimentTypes';

import {
  SocialMediaAnalysisResult,
  TrendingTicker,
  SocialSentimentCorrelation
} from '../types/socialMediaTypes';

import {
  NewsAnalysisResult,
  BreakingNews,
  NewsSentimentCorrelation
} from '../types/newsTypes';

import {
  BehavioralMetricsResult,
  FearGreedIndex,
  VolatilityRegime,
  MarketBreadth,
  OptionsSentiment
} from '../types/behavioralTypes';

export class SentimentAnalyticsService {
  private readonly apiClient: any;
  
  constructor(baseUrl: string = '/api') {
    this.apiClient = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Add request interceptor for authentication
    this.apiClient.interceptors.request.use((config: any) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }
  
  /**
   * Get sentiment overview for a ticker
   * @param ticker Stock ticker symbol
   * @returns Promise with sentiment overview data
   */
  public async getSentimentOverview(ticker: string): Promise<SentimentOverview> {
    try {
      const response = await this.apiClient.get(`/sentiment/overview/${ticker}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sentiment overview:', error);
      throw new Error('Failed to fetch sentiment overview data');
    }
  }
  
  /**
   * Get sentiment analysis from a specific source
   * @param ticker Stock ticker symbol
   * @param source Source of sentiment data
   * @param startDate Optional start date for analysis
   * @param endDate Optional end date for analysis
   * @returns Promise with sentiment analysis result
   */
  public async getSentimentAnalysis(
    ticker: string,
    source: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<SentimentAnalysisResult> {
    try {
      const response = await this.apiClient.get(`/sentiment/${source}/${ticker}`, {
        params: {
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString()
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${source} sentiment:`, error);
      throw new Error(`Failed to fetch ${source} sentiment data`);
    }
  }
  
  /**
   * Get sentiment time series data
   * @param ticker Stock ticker symbol
   * @param sources Array of sentiment sources to include
   * @param timeframe Timeframe for analysis in days
   * @returns Promise with sentiment time series data
   */
  public async getSentimentTimeSeries(
    ticker: string,
    sources: string[] = ['news', 'social_media', 'earnings_call', 'sec_filing'],
    timeframe: number = 30
  ): Promise<SentimentTimeSeriesPoint[]> {
    try {
      const response = await this.apiClient.get(`/sentiment/timeseries/${ticker}`, {
        params: {
          sources: sources.join(','),
          timeframe
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching sentiment time series:', error);
      throw new Error('Failed to fetch sentiment time series data');
    }
  }
  
  /**
   * Get sentiment-price correlation
   * @param ticker Stock ticker symbol
   * @param source Source of sentiment data
   * @param timeframe Timeframe for analysis in days
   * @returns Promise with sentiment-price correlation data
   */
  public async getSentimentPriceCorrelation(
    ticker: string,
    source: string = 'all',
    timeframe: number = 30
  ): Promise<SentimentCorrelation> {
    try {
      const response = await this.apiClient.get(`/sentiment/correlation/${ticker}`, {
        params: {
          source,
          timeframe
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching sentiment-price correlation:', error);
      throw new Error('Failed to fetch sentiment-price correlation data');
    }
  }
  
  /**
   * Get social media analysis
   * @param ticker Stock ticker symbol
   * @param platforms Array of social media platforms to include
   * @param startDate Optional start date for analysis
   * @param endDate Optional end date for analysis
   * @returns Promise with social media analysis result
   */
  public async getSocialMediaAnalysis(
    ticker: string,
    platforms: string[] = ['twitter', 'reddit', 'stocktwits'],
    startDate?: Date,
    endDate?: Date
  ): Promise<SocialMediaAnalysisResult> {
    try {
      const response = await this.apiClient.get(`/social/analysis/${ticker}`, {
        params: {
          platforms: platforms.join(','),
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString()
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching social media analysis:', error);
      throw new Error('Failed to fetch social media analysis data');
    }
  }
  
  /**
   * Get trending tickers on social media
   * @param platform Social media platform to analyze
   * @param count Number of trending tickers to return
   * @returns Promise with trending tickers data
   */
  public async getTrendingTickers(
    platform: string = 'all',
    count: number = 10
  ): Promise<TrendingTicker[]> {
    try {
      const response = await this.apiClient.get('/social/trending', {
        params: {
          platform,
          count
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching trending tickers:', error);
      throw new Error('Failed to fetch trending tickers data');
    }
  }
  
  /**
   * Get social media sentiment correlation with price
   * @param ticker Stock ticker symbol
   * @param platform Social media platform to analyze
   * @param timeframe Timeframe for analysis in days
   * @returns Promise with social sentiment-price correlation data
   */
  public async getSocialSentimentCorrelation(
    ticker: string,
    platform: string = 'all',
    timeframe: number = 30
  ): Promise<SocialSentimentCorrelation> {
    try {
      const response = await this.apiClient.get(`/social/correlation/${ticker}`, {
        params: {
          platform,
          timeframe
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching social sentiment-price correlation:', error);
      throw new Error('Failed to fetch social sentiment-price correlation data');
    }
  }
  
  /**
   * Get news analysis
   * @param ticker Stock ticker symbol
   * @param startDate Optional start date for news articles
   * @param endDate Optional end date for news articles
   * @param sources Optional array of news sources to include
   * @returns Promise with news analysis result
   */
  public async getNewsAnalysis(
    ticker: string,
    startDate?: Date,
    endDate?: Date,
    sources?: string[]
  ): Promise<NewsAnalysisResult> {
    try {
      const response = await this.apiClient.get(`/news/analysis/${ticker}`, {
        params: {
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
          sources: sources?.join(',')
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching news analysis:', error);
      throw new Error('Failed to fetch news analysis data');
    }
  }
  
  /**
   * Get breaking news
   * @param ticker Optional stock ticker symbol (if null, returns market-wide breaking news)
   * @param count Number of breaking news items to return
   * @returns Promise with breaking news items
   */
  public async getBreakingNews(
    ticker?: string,
    count: number = 5
  ): Promise<BreakingNews[]> {
    try {
      const response = await this.apiClient.get('/news/breaking', {
        params: {
          ticker,
          count
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching breaking news:', error);
      throw new Error('Failed to fetch breaking news data');
    }
  }
  
  /**
   * Get news sentiment correlation with price
   * @param ticker Stock ticker symbol
   * @param timeframe Timeframe for analysis in days
   * @returns Promise with news sentiment-price correlation data
   */
  public async getNewsPriceCorrelation(
    ticker: string,
    timeframe: number = 30
  ): Promise<NewsSentimentCorrelation> {
    try {
      const response = await this.apiClient.get(`/news/correlation/${ticker}`, {
        params: {
          timeframe
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching news-price correlation:', error);
      throw new Error('Failed to fetch news-price correlation data');
    }
  }
  
  /**
   * Get behavioral metrics
   * @param ticker Stock ticker symbol
   * @param startDate Optional start date for analysis
   * @param endDate Optional end date for analysis
   * @returns Promise with behavioral metrics result
   */
  public async getBehavioralMetrics(
    ticker: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<BehavioralMetricsResult> {
    try {
      const response = await this.apiClient.get(`/behavioral/metrics/${ticker}`, {
        params: {
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString()
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching behavioral metrics:', error);
      throw new Error('Failed to fetch behavioral metrics data');
    }
  }
  
  /**
   * Get Fear & Greed Index
   * @returns Promise with Fear & Greed Index data
   */
  public async getFearGreedIndex(): Promise<FearGreedIndex> {
    try {
      const response = await this.apiClient.get('/behavioral/fear-greed');
      return response.data;
    } catch (error) {
      console.error('Error fetching Fear & Greed Index:', error);
      throw new Error('Failed to fetch Fear & Greed Index data');
    }
  }
  
  /**
   * Get volatility regime
   * @param ticker Optional stock ticker symbol (if null, returns market-wide volatility regime)
   * @returns Promise with volatility regime data
   */
  public async getVolatilityRegime(ticker?: string): Promise<VolatilityRegime> {
    try {
      const response = await this.apiClient.get('/behavioral/volatility-regime', {
        params: { ticker }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching volatility regime:', error);
      throw new Error('Failed to fetch volatility regime data');
    }
  }
  
  /**
   * Get market breadth indicators
   * @returns Promise with market breadth data
   */
  public async getMarketBreadth(): Promise<MarketBreadth> {
    try {
      const response = await this.apiClient.get('/behavioral/market-breadth');
      return response.data;
    } catch (error) {
      console.error('Error fetching market breadth:', error);
      throw new Error('Failed to fetch market breadth data');
    }
  }
  
  /**
   * Get options sentiment indicators
   * @param ticker Stock ticker symbol
   * @returns Promise with options sentiment data
   */
  public async getOptionsSentiment(ticker: string): Promise<OptionsSentiment> {
    try {
      const response = await this.apiClient.get(`/behavioral/options-sentiment/${ticker}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching options sentiment:', error);
      throw new Error('Failed to fetch options sentiment data');
    }
  }
  
  /**
   * Create sentiment alert
   * @param alert Sentiment alert configuration
   * @returns Promise with created alert
   */
  public async createSentimentAlert(alert: Omit<SentimentAlert, 'id' | 'triggered' | 'triggeredAt'>): Promise<SentimentAlert> {
    try {
      const response = await this.apiClient.post('/alerts/sentiment', alert);
      return response.data;
    } catch (error) {
      console.error('Error creating sentiment alert:', error);
      throw new Error('Failed to create sentiment alert');
    }
  }
  
  /**
   * Get sentiment alerts for a user
   * @returns Promise with user's sentiment alerts
   */
  public async getSentimentAlerts(): Promise<SentimentAlert[]> {
    try {
      const response = await this.apiClient.get('/alerts/sentiment');
      return response.data;
    } catch (error) {
      console.error('Error fetching sentiment alerts:', error);
      throw new Error('Failed to fetch sentiment alerts');
    }
  }
  
  /**
   * Delete sentiment alert
   * @param alertId ID of the alert to delete
   * @returns Promise with deletion result
   */
  public async deleteSentimentAlert(alertId: string): Promise<{ success: boolean }> {
    try {
      const response = await this.apiClient.delete(`/alerts/sentiment/${alertId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting sentiment alert:', error);
      throw new Error('Failed to delete sentiment alert');
    }
  }
}

export default SentimentAnalyticsService;