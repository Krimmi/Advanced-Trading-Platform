import { BaseApiService, ApiError } from '../BaseApiService';
import { API_KEYS, DATA_SOURCE_CONFIG } from '../../../config/apiConfig';
import { AxiosRequestConfig } from 'axios';
import { 
  INewsService, 
  NewsArticle, 
  NewsSearchParams, 
  NewsSearchResponse,
  SentimentAnalysis,
  SentimentTrendResponse
} from './NewsService';
import { v4 as uuidv4 } from 'uuid';

/**
 * NewsAPI service for news data
 * Note: NewsAPI doesn't provide sentiment analysis, so those methods will return mock data
 */
export class NewsApiService extends BaseApiService implements INewsService {
  private readonly apiKey: string;

  /**
   * Constructor
   */
  constructor() {
    super('https://newsapi.org/v2');
    this.apiKey = API_KEYS.newsApi || '';
  }

  /**
   * Check if the service is available
   * @returns True if the API key is configured and not using mock data
   */
  public isAvailable(): boolean {
    return Boolean(this.apiKey) && !DATA_SOURCE_CONFIG.forceMockData;
  }

  /**
   * Request interceptor to add API key
   * @param config - Axios request config
   * @returns Modified config with API key
   */
  protected requestInterceptor(config: AxiosRequestConfig): AxiosRequestConfig {
    // Call parent interceptor
    config = super.requestInterceptor(config);
    
    // Add API key to headers
    config.headers = {
      ...config.headers,
      'X-Api-Key': this.apiKey
    };
    
    return config;
  }

  /**
   * Search for news articles
   * @param params - Search parameters
   * @returns Promise with news search response
   */
  public async searchNews(params: NewsSearchParams): Promise<NewsSearchResponse> {
    try {
      const apiParams: Record<string, any> = {
        q: params.query || '',
        page: params.page || 1,
        pageSize: params.pageSize || 20,
        language: params.language || 'en',
        sortBy: params.sortBy || 'publishedAt'
      };
      
      // Add date range if provided
      if (params.from) apiParams.from = params.from;
      if (params.to) apiParams.to = params.to;
      
      // Add sources if provided
      if (params.sources && params.sources.length > 0) {
        apiParams.sources = params.sources.join(',');
      }
      
      // Add symbol as query if provided
      if (params.symbols && params.symbols.length > 0) {
        apiParams.q = `${apiParams.q} ${params.symbols.join(' OR ')}`.trim();
      }
      
      // Add categories as query if provided
      if (params.categories && params.categories.length > 0) {
        apiParams.category = params.categories[0]; // NewsAPI only supports one category
      }
      
      const cacheOptions = {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.newsData,
        key: `newsapi-search-${JSON.stringify(apiParams)}`
      };
      
      const response = await this.get<any>('/everything', { params: apiParams }, cacheOptions);
      
      return {
        articles: response.articles.map(this.mapArticle),
        totalResults: response.totalResults,
        page: params.page || 1,
        pageSize: params.pageSize || 20
      };
    } catch (error) {
      console.error('Error searching news from NewsAPI:', error);
      throw error;
    }
  }

  /**
   * Get news for a specific symbol
   * @param symbol - Stock symbol
   * @param limit - Maximum number of articles to return
   * @param from - Start date (ISO string)
   * @param to - End date (ISO string)
   * @returns Promise with news articles
   */
  public async getSymbolNews(
    symbol: string, 
    limit: number = 10, 
    from?: string, 
    to?: string
  ): Promise<NewsArticle[]> {
    try {
      const params: NewsSearchParams = {
        symbols: [symbol],
        pageSize: limit,
        sortBy: 'publishedAt',
        from,
        to
      };
      
      const response = await this.searchNews(params);
      return response.articles;
    } catch (error) {
      console.error(`Error getting news for symbol ${symbol} from NewsAPI:`, error);
      throw error;
    }
  }

  /**
   * Get top news articles
   * @param category - News category
   * @param limit - Maximum number of articles to return
   * @returns Promise with news articles
   */
  public async getTopNews(category?: string, limit: number = 10): Promise<NewsArticle[]> {
    try {
      const apiParams: Record<string, any> = {
        pageSize: limit,
        country: 'us' // Default to US news
      };
      
      if (category) {
        apiParams.category = category;
      }
      
      const cacheOptions = {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.newsData,
        key: `newsapi-top-${JSON.stringify(apiParams)}`
      };
      
      const response = await this.get<any>('/top-headlines', { params: apiParams }, cacheOptions);
      
      return response.articles.map(this.mapArticle);
    } catch (error) {
      console.error('Error getting top news from NewsAPI:', error);
      throw error;
    }
  }

  /**
   * Get sentiment analysis for a symbol
   * @param symbol - Stock symbol
   * @returns Promise with sentiment analysis
   * 
   * Note: NewsAPI doesn't provide sentiment analysis, so this returns mock data
   */
  public async getSentiment(symbol: string): Promise<SentimentAnalysis> {
    // Since NewsAPI doesn't provide sentiment analysis, we'll return mock data
    try {
      // First get some real news to make it more realistic
      const news = await this.getSymbolNews(symbol, 5);
      
      // Generate a sentiment score based on the symbol
      // This ensures consistent results for the same symbol
      const symbolHash = this.hashCode(symbol);
      const baseScore = ((symbolHash % 100) / 100) * 2 - 1; // -1 to 1 range
      
      // Add some randomness
      const randomFactor = (Math.random() * 0.4) - 0.2; // -0.2 to 0.2
      const finalScore = Math.max(-1, Math.min(1, baseScore + randomFactor));
      
      // Determine label based on score
      let label: 'negative' | 'neutral' | 'positive';
      if (finalScore < -0.2) label = 'negative';
      else if (finalScore > 0.2) label = 'positive';
      else label = 'neutral';
      
      return {
        symbol,
        overallScore: finalScore,
        overallLabel: label,
        newsCount: news.length,
        socialCount: Math.floor(Math.random() * 100) + 10,
        newsScore: finalScore * 0.9, // Slightly different from overall
        socialScore: finalScore * 1.1, // Slightly different from overall
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error generating sentiment for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get sentiment trend for a symbol
   * @param symbol - Stock symbol
   * @param days - Number of days to look back
   * @returns Promise with sentiment trend data
   * 
   * Note: NewsAPI doesn't provide sentiment analysis, so this returns mock data
   */
  public async getSentimentTrend(symbol: string, days: number = 30): Promise<SentimentTrendResponse> {
    // Since NewsAPI doesn't provide sentiment trend data, we'll return mock data
    try {
      const data: { timestamp: string; score: number; volume: number }[] = [];
      const endDate = new Date();
      const symbolHash = this.hashCode(symbol);
      
      // Base values that will be consistent for the same symbol
      const baseScore = ((symbolHash % 100) / 100) * 2 - 1; // -1 to 1 range
      const baseVolume = (symbolHash % 100) + 50; // 50-150 range
      
      // Generate data points
      for (let i = 0; i < days; i++) {
        const date = new Date(endDate);
        date.setDate(date.getDate() - (days - i - 1));
        
        // Add some randomness to the score
        const randomScoreFactor = (Math.random() * 0.4) - 0.2; // -0.2 to 0.2
        const score = Math.max(-1, Math.min(1, baseScore + randomScoreFactor));
        
        // Add some randomness to the volume
        const randomVolumeFactor = Math.random() * 0.5 + 0.75; // 0.75-1.25
        const volume = Math.floor(baseVolume * randomVolumeFactor);
        
        data.push({
          timestamp: date.toISOString().split('T')[0],
          score,
          volume
        });
      }
      
      return {
        symbol,
        data,
        startDate: data[0].timestamp,
        endDate: data[data.length - 1].timestamp
      };
    } catch (error) {
      console.error(`Error generating sentiment trend for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Map NewsAPI article to common format
   * @param article - NewsAPI article
   * @returns Normalized news article
   */
  private mapArticle(article: any): NewsArticle {
    return {
      id: article.url || uuidv4(),
      title: article.title || '',
      summary: article.description || '',
      content: article.content || '',
      url: article.url || '',
      source: article.source?.name || 'Unknown',
      publishedAt: article.publishedAt || new Date().toISOString(),
      author: article.author || undefined,
      imageUrl: article.urlToImage || undefined,
      // NewsAPI doesn't provide categories or symbols, so we leave them undefined
    };
  }

  /**
   * Generate a hash code from a string
   * @param str - Input string
   * @returns Hash code
   */
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

// Export singleton instance
export const newsApiService = new NewsApiService();