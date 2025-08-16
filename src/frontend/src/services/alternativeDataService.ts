/**
 * Alternative Data Service
 * This service provides methods to interact with alternative data sources.
 */
import axios from 'axios';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/alternative-data`;

/**
 * Interface for sentiment analysis result
 */
export interface SentimentResult {
  symbol: string;
  score: number;
  magnitude: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  source: string;
  timestamp: string;
}

/**
 * Interface for news item
 */
export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment?: {
    score: number;
    magnitude: number;
    sentiment: 'positive' | 'negative' | 'neutral';
  };
  symbols: string[];
  categories: string[];
  relevance: number;
}

/**
 * Interface for social media mention
 */
export interface SocialMediaMention {
  id: string;
  platform: 'twitter' | 'reddit' | 'stocktwits' | 'other';
  content: string;
  author: string;
  url?: string;
  publishedAt: string;
  sentiment?: {
    score: number;
    magnitude: number;
    sentiment: 'positive' | 'negative' | 'neutral';
  };
  symbols: string[];
  likes: number;
  comments: number;
  shares: number;
  engagement: number;
}

/**
 * Interface for alternative data source
 */
export interface AlternativeDataSource {
  id: string;
  name: string;
  type: 'news' | 'social_media' | 'satellite' | 'macro' | 'other';
  description: string;
  enabled: boolean;
  lastUpdated: string;
  status: 'active' | 'inactive' | 'error';
  config?: any;
}

/**
 * Interface for sentiment analysis request
 */
export interface SentimentAnalysisRequest {
  symbols?: string[];
  sources?: string[];
  startDate?: string;
  endDate?: string;
  limit?: number;
}

/**
 * Interface for news request
 */
export interface NewsRequest {
  symbols?: string[];
  categories?: string[];
  sources?: string[];
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  minRelevance?: number;
}

/**
 * Interface for social media request
 */
export interface SocialMediaRequest {
  symbols?: string[];
  platforms?: ('twitter' | 'reddit' | 'stocktwits' | 'other')[];
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  minEngagement?: number;
}

/**
 * Interface for sentiment trend
 */
export interface SentimentTrend {
  symbol: string;
  data: {
    date: string;
    sentiment: number;
    volume: number;
  }[];
}

/**
 * Alternative Data Service
 */
const alternativeDataService = {
  /**
   * Get available alternative data sources
   */
  async getDataSources(): Promise<AlternativeDataSource[]> {
    try {
      const response = await axios.get(`${API_URL}/sources`);
      return response.data.sources;
    } catch (error) {
      console.error('Error fetching alternative data sources:', error);
      throw error;
    }
  },

  /**
   * Update data source configuration
   */
  async updateDataSource(sourceId: string, config: any): Promise<AlternativeDataSource> {
    try {
      const response = await axios.put(`${API_URL}/sources/${sourceId}`, { config });
      return response.data.source;
    } catch (error) {
      console.error('Error updating data source:', error);
      throw error;
    }
  },

  /**
   * Get sentiment analysis for symbols
   */
  async getSentimentAnalysis(request: SentimentAnalysisRequest): Promise<SentimentResult[]> {
    try {
      const response = await axios.post(`${API_URL}/sentiment`, request);
      return response.data.results;
    } catch (error) {
      console.error('Error fetching sentiment analysis:', error);
      throw error;
    }
  },

  /**
   * Get sentiment trends for symbols
   */
  async getSentimentTrends(symbols: string[], days: number = 30): Promise<SentimentTrend[]> {
    try {
      const response = await axios.get(`${API_URL}/sentiment/trends`, {
        params: { symbols: symbols.join(','), days }
      });
      return response.data.trends;
    } catch (error) {
      console.error('Error fetching sentiment trends:', error);
      throw error;
    }
  },

  /**
   * Get news for symbols
   */
  async getNews(request: NewsRequest): Promise<NewsItem[]> {
    try {
      const response = await axios.post(`${API_URL}/news`, request);
      return response.data.news;
    } catch (error) {
      console.error('Error fetching news:', error);
      throw error;
    }
  },

  /**
   * Get social media mentions for symbols
   */
  async getSocialMediaMentions(request: SocialMediaRequest): Promise<SocialMediaMention[]> {
    try {
      const response = await axios.post(`${API_URL}/social-media`, request);
      return response.data.mentions;
    } catch (error) {
      console.error('Error fetching social media mentions:', error);
      throw error;
    }
  },

  /**
   * Get alternative data summary for a symbol
   */
  async getAlternativeDataSummary(symbol: string): Promise<any> {
    try {
      const response = await axios.get(`${API_URL}/summary/${symbol}`);
      return response.data.summary;
    } catch (error) {
      console.error('Error fetching alternative data summary:', error);
      throw error;
    }
  },

  /**
   * Run sentiment analysis on custom text
   */
  async analyzeText(text: string): Promise<any> {
    try {
      const response = await axios.post(`${API_URL}/analyze-text`, { text });
      return response.data.analysis;
    } catch (error) {
      console.error('Error analyzing text:', error);
      throw error;
    }
  },

  /**
   * Get satellite imagery data
   */
  async getSatelliteData(location: string, startDate: string, endDate: string): Promise<any> {
    try {
      const response = await axios.get(`${API_URL}/satellite`, {
        params: { location, startDate, endDate }
      });
      return response.data.imagery;
    } catch (error) {
      console.error('Error fetching satellite data:', error);
      throw error;
    }
  },

  /**
   * Get macroeconomic indicators
   */
  async getMacroIndicators(indicators: string[], startDate: string, endDate: string): Promise<any> {
    try {
      const response = await axios.get(`${API_URL}/macro`, {
        params: { 
          indicators: indicators.join(','), 
          startDate, 
          endDate 
        }
      });
      return response.data.indicators;
    } catch (error) {
      console.error('Error fetching macroeconomic indicators:', error);
      throw error;
    }
  },

  /**
   * Get correlation between alternative data and price movements
   */
  async getAlternativeDataCorrelation(symbol: string, dataType: string, lookbackDays: number = 90): Promise<any> {
    try {
      const response = await axios.get(`${API_URL}/correlation`, {
        params: { symbol, dataType, lookbackDays }
      });
      return response.data.correlation;
    } catch (error) {
      console.error('Error fetching alternative data correlation:', error);
      throw error;
    }
  }
};

export default alternativeDataService;