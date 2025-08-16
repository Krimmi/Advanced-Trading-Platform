import { BaseApiService, ApiError } from '../BaseApiService';
import { API_KEYS, DATA_SOURCE_CONFIG } from '../../../config/apiConfig';
import { AxiosRequestConfig } from 'axios';
import { 
  INewsService, 
  NewsArticle, 
  NewsSearchParams, 
  NewsSearchResponse,
  SentimentAnalysis,
  SentimentTrendResponse,
  SentimentTrendPoint
} from './NewsService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Finnhub service for news and sentiment data
 */
export class FinnhubService extends BaseApiService implements INewsService {
  private readonly apiKey: string;

  /**
   * Constructor
   */
  constructor() {
    super('https://finnhub.io/api/v1');
    this.apiKey = API_KEYS.finnhub || '';
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
    
    // Add API key to query parameters
    config.params = {
      ...config.params,
      token: this.apiKey
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
      const apiParams: Record<string, any> = {};
      
      // Finnhub doesn't have a direct search endpoint, so we'll use the company news endpoint
      // if symbols are provided, otherwise use the general news endpoint
      let endpoint = '/news';
      
      if (params.symbols && params.symbols.length > 0) {
        endpoint = '/company-news';
        apiParams.symbol = params.symbols[0]; // Finnhub only supports one symbol at a time
      }
      
      // Add date range if provided
      if (params.from) apiParams.from = params.from;
      if (params.to) apiParams.to = params.to || new Date().toISOString().split('T')[0];
      
      // Add category if provided
      if (params.categories && params.categories.length > 0) {
        apiParams.category = params.categories[0]; // Finnhub only supports one category
      }
      
      const cacheOptions = {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.newsData,
        key: `finnhub-news-${JSON.stringify(apiParams)}`
      };
      
      const response = await this.get<any[]>(endpoint, { params: apiParams }, cacheOptions);
      
      // Filter by query if provided
      let filteredArticles = response;
      if (params.query) {
        const query = params.query.toLowerCase();
        filteredArticles = response.filter(article => 
          article.headline?.toLowerCase().includes(query) || 
          article.summary?.toLowerCase().includes(query)
        );
      }
      
      // Apply pagination
      const page = params.page || 1;
      const pageSize = params.pageSize || 20;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedArticles = filteredArticles.slice(startIndex, endIndex);
      
      return {
        articles: paginatedArticles.map(this.mapArticle),
        totalResults: filteredArticles.length,
        page,
        pageSize
      };
    } catch (error) {
      console.error('Error searching news from Finnhub:', error);
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
      // Set default date range if not provided
      const toDate = to || new Date().toISOString().split('T')[0];
      let fromDate = from;
      
      if (!fromDate) {
        // Default to 30 days ago if not provided
        const date = new Date();
        date.setDate(date.getDate() - 30);
        fromDate = date.toISOString().split('T')[0];
      }
      
      const cacheOptions = {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.newsData,
        key: `finnhub-symbol-news-${symbol}-${fromDate}-${toDate}`
      };
      
      const response = await this.get<any[]>('/company-news', {
        params: {
          symbol,
          from: fromDate,
          to: toDate
        }
      }, cacheOptions);
      
      // Limit the number of articles
      const limitedArticles = response.slice(0, limit);
      
      return limitedArticles.map(this.mapArticle);
    } catch (error) {
      console.error(`Error getting news for symbol ${symbol} from Finnhub:`, error);
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
      const params: Record<string, any> = {};
      
      if (category) {
        params.category = category;
      }
      
      const cacheOptions = {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.newsData,
        key: `finnhub-top-news-${category || 'general'}`
      };
      
      const response = await this.get<any[]>('/news', { params }, cacheOptions);
      
      // Limit the number of articles
      const limitedArticles = response.slice(0, limit);
      
      return limitedArticles.map(this.mapArticle);
    } catch (error) {
      console.error('Error getting top news from Finnhub:', error);
      throw error;
    }
  }

  /**
   * Get sentiment analysis for a symbol
   * @param symbol - Stock symbol
   * @returns Promise with sentiment analysis
   */
  public async getSentiment(symbol: string): Promise<SentimentAnalysis> {
    try {
      const cacheOptions = {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.newsData,
        key: `finnhub-sentiment-${symbol}`
      };
      
      const response = await this.get<any>('/news-sentiment', {
        params: { symbol }
      }, cacheOptions);
      
      // Map Finnhub sentiment to our format
      // Finnhub scores are 0-1 where 1 is positive, so we need to transform to -1 to 1
      const newsScore = (response.companyNewsScore - 0.5) * 2;
      const socialScore = (response.sectorAverageBullishPercent - 0.5) * 2;
      
      // Calculate overall score as weighted average
      const overallScore = (newsScore * response.buzz.articlesInLastWeek + 
                           socialScore * response.buzz.weeklyAverage) / 
                          (response.buzz.articlesInLastWeek + response.buzz.weeklyAverage);
      
      // Determine label based on score
      let overallLabel: 'negative' | 'neutral' | 'positive';
      if (overallScore < -0.2) overallLabel = 'negative';
      else if (overallScore > 0.2) overallLabel = 'positive';
      else overallLabel = 'neutral';
      
      return {
        symbol,
        overallScore,
        overallLabel,
        newsCount: response.buzz.articlesInLastWeek,
        socialCount: response.buzz.weeklyAverage,
        newsScore,
        socialScore,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error getting sentiment for ${symbol} from Finnhub:`, error);
      throw error;
    }
  }

  /**
   * Get sentiment trend for a symbol
   * @param symbol - Stock symbol
   * @param days - Number of days to look back
   * @returns Promise with sentiment trend data
   */
  public async getSentimentTrend(symbol: string, days: number = 30): Promise<SentimentTrendResponse> {
    try {
      // Finnhub doesn't have a direct sentiment trend endpoint
      // We'll use the insider sentiment endpoint as a proxy
      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);
      
      const fromStr = fromDate.toISOString().split('T')[0];
      const toStr = toDate.toISOString().split('T')[0];
      
      const cacheOptions = {
        ttl: DATA_SOURCE_CONFIG.cacheTTL.newsData,
        key: `finnhub-sentiment-trend-${symbol}-${fromStr}-${toStr}`
      };
      
      const response = await this.get<any>('/stock/insider-sentiment', {
        params: {
          symbol,
          from: fromStr,
          to: toStr
        }
      }, cacheOptions);
      
      // Map Finnhub insider sentiment to our format
      const data: SentimentTrendPoint[] = response.data.map((item: any) => {
        // Convert mspr (Monthly Share Purchase Ratio) to a score between -1 and 1
        // mspr is typically between -1 and 1 already, but we'll ensure it's in range
        const score = Math.max(-1, Math.min(1, item.mspr));
        
        return {
          timestamp: `${item.year}-${item.month.toString().padStart(2, '0')}-15`, // Middle of the month
          score,
          volume: item.change
        };
      });
      
      return {
        symbol,
        data,
        startDate: fromStr,
        endDate: toStr
      };
    } catch (error) {
      console.error(`Error getting sentiment trend for ${symbol} from Finnhub:`, error);
      throw error;
    }
  }

  /**
   * Map Finnhub article to common format
   * @param article - Finnhub article
   * @returns Normalized news article
   */
  private mapArticle(article: any): NewsArticle {
    // Extract symbols from related field if available
    const symbols = article.related ? 
      article.related.split(',').map((s: string) => s.trim()) : 
      undefined;
    
    return {
      id: article.id || uuidv4(),
      title: article.headline || '',
      summary: article.summary || '',
      content: article.summary || '', // Finnhub doesn't provide full content
      url: article.url || '',
      source: article.source || 'Unknown',
      publishedAt: article.datetime ? 
        new Date(article.datetime * 1000).toISOString() : 
        new Date().toISOString(),
      author: undefined, // Finnhub doesn't provide author
      imageUrl: article.image || undefined,
      categories: article.category ? [article.category] : undefined,
      symbols,
      sentiment: article.sentiment ? {
        score: (article.sentiment - 0.5) * 2, // Convert 0-1 to -1 to 1
        label: article.sentiment < 0.4 ? 'negative' : 
               article.sentiment > 0.6 ? 'positive' : 'neutral'
      } : undefined
    };
  }
}

// Export singleton instance
export const finnhubService = new FinnhubService();