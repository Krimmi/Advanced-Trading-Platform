import { API_KEYS, DATA_SOURCE_CONFIG } from '../../../config/apiConfig';
import { 
  INewsService, 
  NewsArticle, 
  NewsSearchParams, 
  NewsSearchResponse,
  SentimentAnalysis,
  SentimentTrendResponse
} from './NewsService';
import { NewsApiService, newsApiService } from './NewsApiService';
import { FinnhubService, finnhubService } from './FinnhubService';
import { mockNewsProvider } from './MockNewsProvider';
import { ApiError } from '../BaseApiService';

/**
 * News provider type
 */
export type NewsProvider = 'newsApi' | 'finnhub' | 'auto';

/**
 * Factory for creating and managing news services
 */
export class NewsServiceFactory {
  private static instance: NewsServiceFactory;

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): NewsServiceFactory {
    if (!NewsServiceFactory.instance) {
      NewsServiceFactory.instance = new NewsServiceFactory();
    }
    return NewsServiceFactory.instance;
  }

  /**
   * Get the best available news service
   * @param preferredProvider - Preferred provider (optional)
   * @returns The best available service
   */
  public getBestAvailableService(preferredProvider: NewsProvider = 'auto'): 
    NewsApiService | FinnhubService | INewsService {
    
    // If we're forcing mock data, return the mock provider
    if (DATA_SOURCE_CONFIG.forceMockData) {
      return mockNewsProvider;
    }

    // If a specific provider is requested and available, use it
    if (preferredProvider !== 'auto') {
      switch (preferredProvider) {
        case 'newsApi':
          if (API_KEYS.newsApi) return newsApiService;
          break;
        case 'finnhub':
          if (API_KEYS.finnhub) return finnhubService;
          break;
      }
    }

    // Otherwise, find the first available service in order of preference
    // NewsAPI is preferred for general news
    if (API_KEYS.newsApi) return newsApiService;
    
    // Finnhub is preferred for sentiment analysis
    if (API_KEYS.finnhub) return finnhubService;

    // If no service is available, return the mock provider
    return mockNewsProvider;
  }

  /**
   * Get the best available service for sentiment analysis
   * @returns The best available service for sentiment analysis
   */
  private getBestSentimentService(): FinnhubService | INewsService {
    // Finnhub is preferred for sentiment analysis
    if (API_KEYS.finnhub && !DATA_SOURCE_CONFIG.forceMockData) {
      return finnhubService;
    }
    
    // If Finnhub is not available, use the mock provider
    return mockNewsProvider;
  }

  /**
   * Search for news articles
   * @param params - Search parameters
   * @param provider - Preferred provider
   * @returns Promise with news search response
   */
  public async searchNews(
    params: NewsSearchParams,
    provider: NewsProvider = 'auto'
  ): Promise<NewsSearchResponse> {
    const service = this.getBestAvailableService(provider);
    
    try {
      return await service.searchNews(params);
    } catch (error) {
      console.error(`Error searching news:`, error);
      
      // If the preferred provider failed and wasn't 'auto', try with 'auto'
      if (provider !== 'auto') {
        console.log(`Retrying with best available provider...`);
        return this.searchNews(params, 'auto');
      }
      
      throw new ApiError(`Failed to search news`, 
        error instanceof ApiError ? error.status : undefined);
    }
  }

  /**
   * Get news for a specific symbol
   * @param symbol - Stock symbol
   * @param limit - Maximum number of articles to return
   * @param from - Start date (ISO string)
   * @param to - End date (ISO string)
   * @param provider - Preferred provider
   * @returns Promise with news articles
   */
  public async getSymbolNews(
    symbol: string, 
    limit: number = 10, 
    from?: string, 
    to?: string,
    provider: NewsProvider = 'auto'
  ): Promise<NewsArticle[]> {
    const service = this.getBestAvailableService(provider);
    
    try {
      return await service.getSymbolNews(symbol, limit, from, to);
    } catch (error) {
      console.error(`Error getting news for symbol ${symbol}:`, error);
      
      // If the preferred provider failed and wasn't 'auto', try with 'auto'
      if (provider !== 'auto') {
        console.log(`Retrying with best available provider...`);
        return this.getSymbolNews(symbol, limit, from, to, 'auto');
      }
      
      throw new ApiError(`Failed to get news for symbol ${symbol}`, 
        error instanceof ApiError ? error.status : undefined);
    }
  }

  /**
   * Get top news articles
   * @param category - News category
   * @param limit - Maximum number of articles to return
   * @param provider - Preferred provider
   * @returns Promise with news articles
   */
  public async getTopNews(
    category?: string, 
    limit: number = 10,
    provider: NewsProvider = 'auto'
  ): Promise<NewsArticle[]> {
    const service = this.getBestAvailableService(provider);
    
    try {
      return await service.getTopNews(category, limit);
    } catch (error) {
      console.error(`Error getting top news:`, error);
      
      // If the preferred provider failed and wasn't 'auto', try with 'auto'
      if (provider !== 'auto') {
        console.log(`Retrying with best available provider...`);
        return this.getTopNews(category, limit, 'auto');
      }
      
      throw new ApiError(`Failed to get top news`, 
        error instanceof ApiError ? error.status : undefined);
    }
  }

  /**
   * Get sentiment analysis for a symbol
   * @param symbol - Stock symbol
   * @returns Promise with sentiment analysis
   */
  public async getSentiment(symbol: string): Promise<SentimentAnalysis> {
    // Always use the best sentiment service
    const service = this.getBestSentimentService();
    
    try {
      return await service.getSentiment(symbol);
    } catch (error) {
      console.error(`Error getting sentiment for ${symbol}:`, error);
      throw new ApiError(`Failed to get sentiment for ${symbol}`, 
        error instanceof ApiError ? error.status : undefined);
    }
  }

  /**
   * Get sentiment trend for a symbol
   * @param symbol - Stock symbol
   * @param days - Number of days to look back
   * @returns Promise with sentiment trend data
   */
  public async getSentimentTrend(symbol: string, days: number = 30): Promise<SentimentTrendResponse> {
    // Always use the best sentiment service
    const service = this.getBestSentimentService();
    
    try {
      return await service.getSentimentTrend(symbol, days);
    } catch (error) {
      console.error(`Error getting sentiment trend for ${symbol}:`, error);
      throw new ApiError(`Failed to get sentiment trend for ${symbol}`, 
        error instanceof ApiError ? error.status : undefined);
    }
  }
}

// Export singleton instance
export const newsService = NewsServiceFactory.getInstance();