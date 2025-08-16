/**
 * Sentiment Analysis Service
 * Provides news sentiment analysis, social media sentiment tracking, and sentiment visualization
 */

import { injectable, inject } from 'inversify';
import { MarketDataService } from '../market/MarketDataService';
import { LoggerService } from '../common/LoggerService';

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: Date;
  symbols: string[];
  sentiment: {
    score: number; // -1 to 1 (negative to positive)
    magnitude: number; // 0 to 1 (neutral to strong)
    label: 'positive' | 'negative' | 'neutral';
  };
  topics: string[];
  entities: {
    name: string;
    type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'EVENT' | 'PRODUCT' | 'OTHER';
    sentiment: number; // -1 to 1
  }[];
}

export interface SocialMediaPost {
  id: string;
  platform: 'twitter' | 'reddit' | 'stocktwits' | 'other';
  author: string;
  content: string;
  publishedAt: Date;
  symbols: string[];
  sentiment: {
    score: number; // -1 to 1 (negative to positive)
    magnitude: number; // 0 to 1 (neutral to strong)
    label: 'positive' | 'negative' | 'neutral';
  };
  metrics: {
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
  };
}

export interface SentimentAnalysisResult {
  symbol: string;
  period: 'day' | 'week' | 'month' | 'quarter';
  startDate: Date;
  endDate: Date;
  overallSentiment: number; // -1 to 1
  sentimentTrend: number[]; // Array of daily sentiment scores
  volumeTrend: number[]; // Array of daily mention volumes
  sentimentBySource: {
    source: string;
    sentiment: number;
    volume: number;
  }[];
  topPositiveArticles: NewsArticle[];
  topNegativeArticles: NewsArticle[];
  topSocialMediaPosts: SocialMediaPost[];
  relatedTopics: {
    topic: string;
    frequency: number;
    sentiment: number;
  }[];
  wordCloud: {
    word: string;
    frequency: number;
    sentiment: number;
  }[];
}

export interface MarketSentimentResult {
  date: Date;
  overallSentiment: number; // -1 to 1
  sentimentByMarketCap: {
    segment: 'large' | 'mid' | 'small';
    sentiment: number;
  }[];
  sentimentBySector: {
    sector: string;
    sentiment: number;
    volume: number;
  }[];
  topPositiveSentimentStocks: {
    symbol: string;
    sentiment: number;
    volume: number;
  }[];
  topNegativeSentimentStocks: {
    symbol: string;
    sentiment: number;
    volume: number;
  }[];
  trendingTopics: {
    topic: string;
    frequency: number;
    sentiment: number;
    dayChange: number;
  }[];
  fearGreedIndex: number; // 0 to 100
}

@injectable()
export class SentimentAnalysisService {
  constructor(
    @inject(MarketDataService) private marketDataService: MarketDataService,
    @inject(LoggerService) private logger: LoggerService
  ) {}

  /**
   * Analyzes sentiment for a specific symbol
   * @param symbol The symbol to analyze
   * @param period The period to analyze
   * @returns The sentiment analysis result
   */
  public async analyzeSentiment(
    symbol: string,
    period: 'day' | 'week' | 'month' | 'quarter' = 'week'
  ): Promise<SentimentAnalysisResult> {
    this.logger.info('Analyzing sentiment', { symbol, period });
    
    try {
      // Get news articles
      const articles = await this.getNewsArticles(symbol, period);
      
      // Get social media posts
      const posts = await this.getSocialMediaPosts(symbol, period);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'day':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
      }
      
      // Calculate overall sentiment
      const allSentiments = [
        ...articles.map(a => ({ score: a.sentiment.score, magnitude: a.sentiment.magnitude })),
        ...posts.map(p => ({ score: p.sentiment.score, magnitude: p.sentiment.magnitude }))
      ];
      
      const overallSentiment = this.calculateWeightedSentiment(allSentiments);
      
      // Calculate sentiment trend
      const sentimentTrend = this.calculateSentimentTrend(articles, posts, startDate, endDate);
      
      // Calculate volume trend
      const volumeTrend = this.calculateVolumeTrend(articles, posts, startDate, endDate);
      
      // Calculate sentiment by source
      const sentimentBySource = this.calculateSentimentBySource(articles, posts);
      
      // Get top articles and posts
      const topPositiveArticles = articles
        .filter(a => a.sentiment.score > 0)
        .sort((a, b) => b.sentiment.score - a.sentiment.score)
        .slice(0, 5);
      
      const topNegativeArticles = articles
        .filter(a => a.sentiment.score < 0)
        .sort((a, b) => a.sentiment.score - b.sentiment.score)
        .slice(0, 5);
      
      const topSocialMediaPosts = posts
        .sort((a, b) => {
          // Sort by engagement and sentiment
          const aEngagement = (a.metrics.likes || 0) + (a.metrics.comments || 0) * 2 + (a.metrics.shares || 0) * 3;
          const bEngagement = (b.metrics.likes || 0) + (b.metrics.comments || 0) * 2 + (b.metrics.shares || 0) * 3;
          return bEngagement - aEngagement;
        })
        .slice(0, 10);
      
      // Extract topics
      const relatedTopics = this.extractTopics(articles, posts);
      
      // Generate word cloud
      const wordCloud = this.generateWordCloud(articles, posts);
      
      return {
        symbol,
        period,
        startDate,
        endDate,
        overallSentiment,
        sentimentTrend,
        volumeTrend,
        sentimentBySource,
        topPositiveArticles,
        topNegativeArticles,
        topSocialMediaPosts,
        relatedTopics,
        wordCloud
      };
    } catch (error) {
      this.logger.error('Error analyzing sentiment', { 
        symbol, 
        period, 
        error: error.message 
      });
      
      throw error;
    }
  }

  /**
   * Analyzes market-wide sentiment
   * @returns The market sentiment result
   */
  public async analyzeMarketSentiment(): Promise<MarketSentimentResult> {
    this.logger.info('Analyzing market sentiment');
    
    try {
      // Get market-wide news articles
      const articles = await this.getMarketNewsArticles();
      
      // Get market-wide social media posts
      const posts = await this.getMarketSocialMediaPosts();
      
      // Calculate overall sentiment
      const allSentiments = [
        ...articles.map(a => ({ score: a.sentiment.score, magnitude: a.sentiment.magnitude })),
        ...posts.map(p => ({ score: p.sentiment.score, magnitude: p.sentiment.magnitude }))
      ];
      
      const overallSentiment = this.calculateWeightedSentiment(allSentiments);
      
      // Calculate sentiment by market cap
      const sentimentByMarketCap = [
        { segment: 'large', sentiment: this.generateRandomSentiment() },
        { segment: 'mid', sentiment: this.generateRandomSentiment() },
        { segment: 'small', sentiment: this.generateRandomSentiment() }
      ] as { segment: 'large' | 'mid' | 'small', sentiment: number }[];
      
      // Calculate sentiment by sector
      const sectors = [
        'Technology',
        'Healthcare',
        'Financial Services',
        'Consumer Cyclical',
        'Industrials',
        'Communication Services',
        'Consumer Defensive',
        'Energy',
        'Basic Materials',
        'Real Estate',
        'Utilities'
      ];
      
      const sentimentBySector = sectors.map(sector => ({
        sector,
        sentiment: this.generateRandomSentiment(),
        volume: Math.floor(Math.random() * 1000) + 100
      }));
      
      // Get top sentiment stocks
      const topPositiveSentimentStocks = Array.from({ length: 10 }, (_, i) => ({
        symbol: `STOCK${i + 1}`,
        sentiment: 0.3 + Math.random() * 0.7,
        volume: Math.floor(Math.random() * 1000) + 100
      }));
      
      const topNegativeSentimentStocks = Array.from({ length: 10 }, (_, i) => ({
        symbol: `STOCK${i + 11}`,
        sentiment: -0.3 - Math.random() * 0.7,
        volume: Math.floor(Math.random() * 1000) + 100
      }));
      
      // Get trending topics
      const trendingTopics = [
        { topic: 'Inflation', frequency: 342, sentiment: -0.4, dayChange: 0.05 },
        { topic: 'Interest Rates', frequency: 287, sentiment: -0.3, dayChange: -0.02 },
        { topic: 'Earnings', frequency: 256, sentiment: 0.2, dayChange: 0.03 },
        { topic: 'AI', frequency: 198, sentiment: 0.6, dayChange: 0.1 },
        { topic: 'Recession', frequency: 176, sentiment: -0.5, dayChange: -0.08 },
        { topic: 'Fed', frequency: 165, sentiment: -0.2, dayChange: 0.04 },
        { topic: 'Growth', frequency: 142, sentiment: 0.4, dayChange: 0.02 },
        { topic: 'Layoffs', frequency: 128, sentiment: -0.6, dayChange: -0.05 },
        { topic: 'IPO', frequency: 112, sentiment: 0.5, dayChange: 0.07 },
        { topic: 'Crypto', frequency: 98, sentiment: 0.1, dayChange: -0.03 }
      ];
      
      // Calculate fear & greed index
      const fearGreedIndex = 30 + Math.floor(Math.random() * 40);
      
      return {
        date: new Date(),
        overallSentiment,
        sentimentByMarketCap,
        sentimentBySector,
        topPositiveSentimentStocks,
        topNegativeSentimentStocks,
        trendingTopics,
        fearGreedIndex
      };
    } catch (error) {
      this.logger.error('Error analyzing market sentiment', { 
        error: error.message 
      });
      
      throw error;
    }
  }

  /**
   * Analyzes sentiment for a specific sector
   * @param sector The sector to analyze
   * @returns The sentiment analysis result
   */
  public async analyzeSectorSentiment(sector: string): Promise<{
    sector: string;
    overallSentiment: number;
    sentimentTrend: number[];
    volumeTrend: number[];
    topStocks: {
      symbol: string;
      name: string;
      sentiment: number;
      volume: number;
    }[];
    topTopics: {
      topic: string;
      frequency: number;
      sentiment: number;
    }[];
  }> {
    this.logger.info('Analyzing sector sentiment', { sector });
    
    try {
      // Generate mock data
      const overallSentiment = this.generateRandomSentiment();
      
      // Generate sentiment trend (last 30 days)
      const sentimentTrend = Array.from({ length: 30 }, () => this.generateRandomSentiment());
      
      // Generate volume trend (last 30 days)
      const volumeTrend = Array.from({ length: 30 }, () => Math.floor(Math.random() * 1000) + 100);
      
      // Generate top stocks in sector
      const topStocks = Array.from({ length: 10 }, (_, i) => ({
        symbol: `${sector.substring(0, 3).toUpperCase()}${i + 1}`,
        name: `${sector} Company ${i + 1}`,
        sentiment: this.generateRandomSentiment(),
        volume: Math.floor(Math.random() * 1000) + 100
      }));
      
      // Generate top topics
      const topTopics = [
        { topic: `${sector} Growth`, frequency: 342, sentiment: 0.4 },
        { topic: `${sector} Innovation`, frequency: 287, sentiment: 0.5 },
        { topic: `${sector} Challenges`, frequency: 256, sentiment: -0.3 },
        { topic: `${sector} Regulation`, frequency: 198, sentiment: -0.2 },
        { topic: `${sector} Outlook`, frequency: 176, sentiment: 0.1 }
      ];
      
      return {
        sector,
        overallSentiment,
        sentimentTrend,
        volumeTrend,
        topStocks,
        topTopics
      };
    } catch (error) {
      this.logger.error('Error analyzing sector sentiment', { 
        sector, 
        error: error.message 
      });
      
      throw error;
    }
  }

  /**
   * Compares sentiment between multiple symbols
   * @param symbols The symbols to compare
   * @param period The period to analyze
   * @returns The sentiment comparison result
   */
  public async compareSentiment(
    symbols: string[],
    period: 'day' | 'week' | 'month' | 'quarter' = 'week'
  ): Promise<{
    period: 'day' | 'week' | 'month' | 'quarter';
    startDate: Date;
    endDate: Date;
    results: {
      symbol: string;
      overallSentiment: number;
      sentimentTrend: number[];
      volume: number;
      topTopics: {
        topic: string;
        frequency: number;
        sentiment: number;
      }[];
    }[];
  }> {
    this.logger.info('Comparing sentiment', { symbols, period });
    
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'day':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
      }
      
      // Generate results for each symbol
      const results = [];
      
      for (const symbol of symbols) {
        // Generate sentiment trend
        const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const sentimentTrend = Array.from({ length: days }, () => this.generateRandomSentiment());
        
        // Generate overall sentiment (average of trend)
        const overallSentiment = sentimentTrend.reduce((sum, val) => sum + val, 0) / sentimentTrend.length;
        
        // Generate volume
        const volume = Math.floor(Math.random() * 1000) + 100;
        
        // Generate top topics
        const topTopics = [
          { topic: 'Earnings', frequency: Math.floor(Math.random() * 100) + 50, sentiment: this.generateRandomSentiment() },
          { topic: 'Growth', frequency: Math.floor(Math.random() * 100) + 50, sentiment: this.generateRandomSentiment() },
          { topic: 'Innovation', frequency: Math.floor(Math.random() * 100) + 50, sentiment: this.generateRandomSentiment() }
        ];
        
        results.push({
          symbol,
          overallSentiment,
          sentimentTrend,
          volume,
          topTopics
        });
      }
      
      return {
        period,
        startDate,
        endDate,
        results
      };
    } catch (error) {
      this.logger.error('Error comparing sentiment', { 
        symbols, 
        period, 
        error: error.message 
      });
      
      throw error;
    }
  }

  /**
   * Gets news articles for a symbol
   * @param symbol The symbol
   * @param period The period
   * @returns The news articles
   */
  private async getNewsArticles(
    symbol: string,
    period: 'day' | 'week' | 'month' | 'quarter'
  ): Promise<NewsArticle[]> {
    // In a real implementation, this would call a news API
    // For now, we'll generate mock data
    
    const articles: NewsArticle[] = [];
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
    }
    
    // Generate random number of articles
    const numArticles = 10 + Math.floor(Math.random() * 40);
    
    for (let i = 0; i < numArticles; i++) {
      // Generate random date within period
      const date = new Date(
        startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
      );
      
      // Generate random sentiment
      const sentimentScore = this.generateRandomSentiment();
      const sentimentMagnitude = 0.3 + Math.random() * 0.7;
      
      let sentimentLabel: 'positive' | 'negative' | 'neutral';
      if (sentimentScore > 0.1) {
        sentimentLabel = 'positive';
      } else if (sentimentScore < -0.1) {
        sentimentLabel = 'negative';
      } else {
        sentimentLabel = 'neutral';
      }
      
      // Generate random topics
      const allTopics = [
        'Earnings', 'Revenue', 'Growth', 'Profit', 'Loss', 'Guidance',
        'Product Launch', 'Innovation', 'Competition', 'Market Share',
        'Expansion', 'Layoffs', 'Executive Change', 'Acquisition',
        'Partnership', 'Investment', 'Dividend', 'Stock Buyback',
        'Regulation', 'Legal', 'Sustainability', 'Technology'
      ];
      
      const numTopics = 1 + Math.floor(Math.random() * 3);
      const topics = [];
      
      for (let j = 0; j < numTopics; j++) {
        const topic = allTopics[Math.floor(Math.random() * allTopics.length)];
        if (!topics.includes(topic)) {
          topics.push(topic);
        }
      }
      
      // Generate random entities
      const entities = [];
      
      if (Math.random() > 0.5) {
        entities.push({
          name: `${symbol} CEO`,
          type: 'PERSON' as const,
          sentiment: sentimentScore * (0.8 + Math.random() * 0.4)
        });
      }
      
      entities.push({
        name: symbol,
        type: 'ORGANIZATION' as const,
        sentiment: sentimentScore
      });
      
      if (Math.random() > 0.7) {
        entities.push({
          name: topics[0],
          type: 'OTHER' as const,
          sentiment: this.generateRandomSentiment()
        });
      }
      
      // Generate article
      articles.push({
        id: `article-${i}`,
        title: this.generateArticleTitle(symbol, sentimentScore, topics),
        summary: this.generateArticleSummary(symbol, sentimentScore, topics),
        url: `https://example.com/news/${symbol.toLowerCase()}-${i}`,
        source: this.getRandomNewsSource(),
        publishedAt: date,
        symbols: [symbol],
        sentiment: {
          score: sentimentScore,
          magnitude: sentimentMagnitude,
          label: sentimentLabel
        },
        topics,
        entities
      });
    }
    
    return articles;
  }

  /**
   * Gets social media posts for a symbol
   * @param symbol The symbol
   * @param period The period
   * @returns The social media posts
   */
  private async getSocialMediaPosts(
    symbol: string,
    period: 'day' | 'week' | 'month' | 'quarter'
  ): Promise<SocialMediaPost[]> {
    // In a real implementation, this would call social media APIs
    // For now, we'll generate mock data
    
    const posts: SocialMediaPost[] = [];
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
    }
    
    // Generate random number of posts
    const numPosts = 20 + Math.floor(Math.random() * 80);
    
    const platforms = ['twitter', 'reddit', 'stocktwits', 'other'];
    
    for (let i = 0; i < numPosts; i++) {
      // Generate random date within period
      const date = new Date(
        startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
      );
      
      // Generate random sentiment
      const sentimentScore = this.generateRandomSentiment();
      const sentimentMagnitude = 0.3 + Math.random() * 0.7;
      
      let sentimentLabel: 'positive' | 'negative' | 'neutral';
      if (sentimentScore > 0.1) {
        sentimentLabel = 'positive';
      } else if (sentimentScore < -0.1) {
        sentimentLabel = 'negative';
      } else {
        sentimentLabel = 'neutral';
      }
      
      // Generate random platform
      const platform = platforms[Math.floor(Math.random() * platforms.length)] as 'twitter' | 'reddit' | 'stocktwits' | 'other';
      
      // Generate random metrics
      const likes = Math.floor(Math.random() * 100);
      const comments = Math.floor(Math.random() * 20);
      const shares = Math.floor(Math.random() * 10);
      const views = likes * 10 + Math.floor(Math.random() * 1000);
      
      // Generate post
      posts.push({
        id: `post-${i}`,
        platform,
        author: `user${Math.floor(Math.random() * 1000)}`,
        content: this.generateSocialMediaPost(symbol, sentimentScore),
        publishedAt: date,
        symbols: [symbol],
        sentiment: {
          score: sentimentScore,
          magnitude: sentimentMagnitude,
          label: sentimentLabel
        },
        metrics: {
          likes,
          comments,
          shares,
          views
        }
      });
    }
    
    return posts;
  }

  /**
   * Gets market-wide news articles
   * @returns The news articles
   */
  private async getMarketNewsArticles(): Promise<NewsArticle[]> {
    // In a real implementation, this would call a news API
    // For now, we'll generate mock data
    
    const articles: NewsArticle[] = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 1); // Last 24 hours
    
    // Generate random number of articles
    const numArticles = 20 + Math.floor(Math.random() * 30);
    
    for (let i = 0; i < numArticles; i++) {
      // Generate random date within period
      const date = new Date(
        startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
      );
      
      // Generate random sentiment
      const sentimentScore = this.generateRandomSentiment();
      const sentimentMagnitude = 0.3 + Math.random() * 0.7;
      
      let sentimentLabel: 'positive' | 'negative' | 'neutral';
      if (sentimentScore > 0.1) {
        sentimentLabel = 'positive';
      } else if (sentimentScore < -0.1) {
        sentimentLabel = 'negative';
      } else {
        sentimentLabel = 'neutral';
      }
      
      // Generate random topics
      const allTopics = [
        'Market', 'Economy', 'Fed', 'Interest Rates', 'Inflation',
        'GDP', 'Jobs', 'Unemployment', 'Consumer Confidence',
        'Housing', 'Manufacturing', 'Retail', 'Trade', 'Oil',
        'Gold', 'Crypto', 'Tech', 'Banking', 'Healthcare'
      ];
      
      const numTopics = 1 + Math.floor(Math.random() * 3);
      const topics = [];
      
      for (let j = 0; j < numTopics; j++) {
        const topic = allTopics[Math.floor(Math.random() * allTopics.length)];
        if (!topics.includes(topic)) {
          topics.push(topic);
        }
      }
      
      // Generate random symbols
      const allSymbols = ['SPY', 'QQQ', 'DIA', 'IWM', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'];
      const numSymbols = Math.floor(Math.random() * 3);
      const symbols = [];
      
      for (let j = 0; j < numSymbols; j++) {
        const symbol = allSymbols[Math.floor(Math.random() * allSymbols.length)];
        if (!symbols.includes(symbol)) {
          symbols.push(symbol);
        }
      }
      
      // Generate random entities
      const entities = [];
      
      if (Math.random() > 0.5) {
        entities.push({
          name: 'Jerome Powell',
          type: 'PERSON' as const,
          sentiment: sentimentScore * (0.8 + Math.random() * 0.4)
        });
      }
      
      if (symbols.length > 0) {
        entities.push({
          name: symbols[0],
          type: 'ORGANIZATION' as const,
          sentiment: sentimentScore
        });
      }
      
      if (Math.random() > 0.7) {
        entities.push({
          name: topics[0],
          type: 'OTHER' as const,
          sentiment: this.generateRandomSentiment()
        });
      }
      
      // Generate article
      articles.push({
        id: `market-article-${i}`,
        title: this.generateMarketArticleTitle(sentimentScore, topics),
        summary: this.generateMarketArticleSummary(sentimentScore, topics),
        url: `https://example.com/market-news/${i}`,
        source: this.getRandomNewsSource(),
        publishedAt: date,
        symbols,
        sentiment: {
          score: sentimentScore,
          magnitude: sentimentMagnitude,
          label: sentimentLabel
        },
        topics,
        entities
      });
    }
    
    return articles;
  }

  /**
   * Gets market-wide social media posts
   * @returns The social media posts
   */
  private async getMarketSocialMediaPosts(): Promise<SocialMediaPost[]> {
    // In a real implementation, this would call social media APIs
    // For now, we'll generate mock data
    
    const posts: SocialMediaPost[] = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 1); // Last 24 hours
    
    // Generate random number of posts
    const numPosts = 50 + Math.floor(Math.random() * 100);
    
    const platforms = ['twitter', 'reddit', 'stocktwits', 'other'];
    
    for (let i = 0; i < numPosts; i++) {
      // Generate random date within period
      const date = new Date(
        startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
      );
      
      // Generate random sentiment
      const sentimentScore = this.generateRandomSentiment();
      const sentimentMagnitude = 0.3 + Math.random() * 0.7;
      
      let sentimentLabel: 'positive' | 'negative' | 'neutral';
      if (sentimentScore > 0.1) {
        sentimentLabel = 'positive';
      } else if (sentimentScore < -0.1) {
        sentimentLabel = 'negative';
      } else {
        sentimentLabel = 'neutral';
      }
      
      // Generate random platform
      const platform = platforms[Math.floor(Math.random() * platforms.length)] as 'twitter' | 'reddit' | 'stocktwits' | 'other';
      
      // Generate random metrics
      const likes = Math.floor(Math.random() * 100);
      const comments = Math.floor(Math.random() * 20);
      const shares = Math.floor(Math.random() * 10);
      const views = likes * 10 + Math.floor(Math.random() * 1000);
      
      // Generate random symbols
      const allSymbols = ['SPY', 'QQQ', 'DIA', 'IWM', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'];
      const numSymbols = Math.floor(Math.random() * 3);
      const symbols = [];
      
      for (let j = 0; j < numSymbols; j++) {
        const symbol = allSymbols[Math.floor(Math.random() * allSymbols.length)];
        if (!symbols.includes(symbol)) {
          symbols.push(symbol);
        }
      }
      
      // Generate post
      posts.push({
        id: `market-post-${i}`,
        platform,
        author: `user${Math.floor(Math.random() * 1000)}`,
        content: this.generateMarketSocialMediaPost(sentimentScore, symbols),
        publishedAt: date,
        symbols,
        sentiment: {
          score: sentimentScore,
          magnitude: sentimentMagnitude,
          label: sentimentLabel
        },
        metrics: {
          likes,
          comments,
          shares,
          views
        }
      });
    }
    
    return posts;
  }

  /**
   * Calculates weighted sentiment from a list of sentiments
   * @param sentiments The sentiments
   * @returns The weighted sentiment
   */
  private calculateWeightedSentiment(sentiments: { score: number; magnitude: number }[]): number {
    if (sentiments.length === 0) {
      return 0;
    }
    
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (const sentiment of sentiments) {
      const weight = sentiment.magnitude;
      weightedSum += sentiment.score * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Calculates sentiment trend from articles and posts
   * @param articles The news articles
   * @param posts The social media posts
   * @param startDate The start date
   * @param endDate The end date
   * @returns The sentiment trend
   */
  private calculateSentimentTrend(
    articles: NewsArticle[],
    posts: SocialMediaPost[],
    startDate: Date,
    endDate: Date
  ): number[] {
    // Calculate number of days
    const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Initialize trend array
    const trend: number[] = Array(days).fill(0);
    const counts: number[] = Array(days).fill(0);
    
    // Process articles
    for (const article of articles) {
      const dayIndex = Math.floor((article.publishedAt.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayIndex >= 0 && dayIndex < days) {
        trend[dayIndex] += article.sentiment.score * article.sentiment.magnitude;
        counts[dayIndex] += article.sentiment.magnitude;
      }
    }
    
    // Process posts
    for (const post of posts) {
      const dayIndex = Math.floor((post.publishedAt.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayIndex >= 0 && dayIndex < days) {
        trend[dayIndex] += post.sentiment.score * post.sentiment.magnitude;
        counts[dayIndex] += post.sentiment.magnitude;
      }
    }
    
    // Calculate average for each day
    for (let i = 0; i < days; i++) {
      if (counts[i] > 0) {
        trend[i] /= counts[i];
      } else {
        // No data for this day, use adjacent days or default to 0
        if (i > 0 && i < days - 1) {
          trend[i] = (trend[i - 1] + trend[i + 1]) / 2;
        } else if (i > 0) {
          trend[i] = trend[i - 1];
        } else if (i < days - 1) {
          trend[i] = trend[i + 1];
        }
      }
    }
    
    return trend;
  }

  /**
   * Calculates volume trend from articles and posts
   * @param articles The news articles
   * @param posts The social media posts
   * @param startDate The start date
   * @param endDate The end date
   * @returns The volume trend
   */
  private calculateVolumeTrend(
    articles: NewsArticle[],
    posts: SocialMediaPost[],
    startDate: Date,
    endDate: Date
  ): number[] {
    // Calculate number of days
    const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Initialize trend array
    const trend: number[] = Array(days).fill(0);
    
    // Process articles
    for (const article of articles) {
      const dayIndex = Math.floor((article.publishedAt.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayIndex >= 0 && dayIndex < days) {
        trend[dayIndex]++;
      }
    }
    
    // Process posts
    for (const post of posts) {
      const dayIndex = Math.floor((post.publishedAt.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayIndex >= 0 && dayIndex < days) {
        trend[dayIndex]++;
      }
    }
    
    return trend;
  }

  /**
   * Calculates sentiment by source from articles and posts
   * @param articles The news articles
   * @param posts The social media posts
   * @returns The sentiment by source
   */
  private calculateSentimentBySource(
    articles: NewsArticle[],
    posts: SocialMediaPost[]
  ): { source: string; sentiment: number; volume: number }[] {
    // Group articles by source
    const articlesBySource: Record<string, { sentiments: { score: number; magnitude: number }[]; count: number }> = {};
    
    for (const article of articles) {
      if (!articlesBySource[article.source]) {
        articlesBySource[article.source] = {
          sentiments: [],
          count: 0
        };
      }
      
      articlesBySource[article.source].sentiments.push({
        score: article.sentiment.score,
        magnitude: article.sentiment.magnitude
      });
      
      articlesBySource[article.source].count++;
    }
    
    // Group posts by platform
    const postsByPlatform: Record<string, { sentiments: { score: number; magnitude: number }[]; count: number }> = {};
    
    for (const post of posts) {
      if (!postsByPlatform[post.platform]) {
        postsByPlatform[post.platform] = {
          sentiments: [],
          count: 0
        };
      }
      
      postsByPlatform[post.platform].sentiments.push({
        score: post.sentiment.score,
        magnitude: post.sentiment.magnitude
      });
      
      postsByPlatform[post.platform].count++;
    }
    
    // Calculate sentiment by source
    const result: { source: string; sentiment: number; volume: number }[] = [];
    
    // Process articles
    for (const [source, data] of Object.entries(articlesBySource)) {
      result.push({
        source,
        sentiment: this.calculateWeightedSentiment(data.sentiments),
        volume: data.count
      });
    }
    
    // Process posts
    for (const [platform, data] of Object.entries(postsByPlatform)) {
      result.push({
        source: platform,
        sentiment: this.calculateWeightedSentiment(data.sentiments),
        volume: data.count
      });
    }
    
    // Sort by volume
    result.sort((a, b) => b.volume - a.volume);
    
    return result;
  }

  /**
   * Extracts topics from articles and posts
   * @param articles The news articles
   * @param posts The social media posts
   * @returns The related topics
   */
  private extractTopics(
    articles: NewsArticle[],
    posts: SocialMediaPost[]
  ): { topic: string; frequency: number; sentiment: number }[] {
    // Count topics and their sentiments
    const topicData: Record<string, { count: number; sentimentSum: number }> = {};
    
    // Process articles
    for (const article of articles) {
      for (const topic of article.topics) {
        if (!topicData[topic]) {
          topicData[topic] = {
            count: 0,
            sentimentSum: 0
          };
        }
        
        topicData[topic].count++;
        topicData[topic].sentimentSum += article.sentiment.score;
      }
    }
    
    // Extract topics from posts (simplified)
    for (const post of posts) {
      // In a real implementation, we would use NLP to extract topics
      // For now, we'll just use some keywords
      
      const content = post.content.toLowerCase();
      const keywords = [
        'earnings', 'revenue', 'growth', 'profit', 'loss', 'guidance',
        'product', 'launch', 'innovation', 'competition', 'market',
        'expansion', 'layoffs', 'executive', 'acquisition',
        'partnership', 'investment', 'dividend', 'buyback',
        'regulation', 'legal', 'sustainability', 'technology'
      ];
      
      for (const keyword of keywords) {
        if (content.includes(keyword)) {
          if (!topicData[keyword]) {
            topicData[keyword] = {
              count: 0,
              sentimentSum: 0
            };
          }
          
          topicData[keyword].count++;
          topicData[keyword].sentimentSum += post.sentiment.score;
        }
      }
    }
    
    // Convert to array and calculate average sentiment
    const topics = Object.entries(topicData).map(([topic, data]) => ({
      topic,
      frequency: data.count,
      sentiment: data.count > 0 ? data.sentimentSum / data.count : 0
    }));
    
    // Sort by frequency
    topics.sort((a, b) => b.frequency - a.frequency);
    
    return topics.slice(0, 20); // Return top 20 topics
  }

  /**
   * Generates a word cloud from articles and posts
   * @param articles The news articles
   * @param posts The social media posts
   * @returns The word cloud
   */
  private generateWordCloud(
    articles: NewsArticle[],
    posts: SocialMediaPost[]
  ): { word: string; frequency: number; sentiment: number }[] {
    // Count words and their sentiments
    const wordData: Record<string, { count: number; sentimentSum: number }> = {};
    
    // Process articles
    for (const article of articles) {
      const words = this.extractWords(article.title + ' ' + article.summary);
      
      for (const word of words) {
        if (!wordData[word]) {
          wordData[word] = {
            count: 0,
            sentimentSum: 0
          };
        }
        
        wordData[word].count++;
        wordData[word].sentimentSum += article.sentiment.score;
      }
    }
    
    // Process posts
    for (const post of posts) {
      const words = this.extractWords(post.content);
      
      for (const word of words) {
        if (!wordData[word]) {
          wordData[word] = {
            count: 0,
            sentimentSum: 0
          };
        }
        
        wordData[word].count++;
        wordData[word].sentimentSum += post.sentiment.score;
      }
    }
    
    // Convert to array and calculate average sentiment
    const words = Object.entries(wordData)
      .filter(([word, data]) => word.length > 3 && data.count > 1) // Filter out short words and rare words
      .map(([word, data]) => ({
        word,
        frequency: data.count,
        sentiment: data.count > 0 ? data.sentimentSum / data.count : 0
      }));
    
    // Sort by frequency
    words.sort((a, b) => b.frequency - a.frequency);
    
    return words.slice(0, 100); // Return top 100 words
  }

  /**
   * Extracts words from text
   * @param text The text
   * @returns The words
   */
  private extractWords(text: string): string[] {
    // Remove punctuation and convert to lowercase
    const cleanText = text.toLowerCase().replace(/[^\w\s]/g, '');
    
    // Split into words
    const words = cleanText.split(/\s+/);
    
    // Filter out stop words
    const stopWords = [
      'the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall',
      'should', 'may', 'might', 'must', 'can', 'could', 'this', 'that',
      'these', 'those', 'it', 'its', 'they', 'them', 'their', 'he', 'him',
      'his', 'she', 'her', 'hers', 'we', 'us', 'our', 'you', 'your'
    ];
    
    return words.filter(word => !stopWords.includes(word));
  }

  /**
   * Generates a random sentiment score
   * @returns The sentiment score
   */
  private generateRandomSentiment(): number {
    // Generate a random sentiment between -1 and 1
    // with a slight bias towards positive sentiment
    return (Math.random() * 2 - 0.9);
  }

  /**
   * Gets a random news source
   * @returns The news source
   */
  private getRandomNewsSource(): string {
    const sources = [
      'Bloomberg', 'CNBC', 'Reuters', 'Wall Street Journal', 'Financial Times',
      'MarketWatch', 'Barron\'s', 'Seeking Alpha', 'The Motley Fool', 'Yahoo Finance',
      'Business Insider', 'Forbes', 'Investor\'s Business Daily', 'TheStreet'
    ];
    
    return sources[Math.floor(Math.random() * sources.length)];
  }

  /**
   * Generates an article title
   * @param symbol The symbol
   * @param sentiment The sentiment score
   * @param topics The topics
   * @returns The article title
   */
  private generateArticleTitle(symbol: string, sentiment: number, topics: string[]): string {
    if (sentiment > 0.3) {
      // Very positive
      const templates = [
        `${symbol} Soars After ${topics[0] || 'Earnings'} Beat Expectations`,
        `${symbol} Reports Record ${topics[0] || 'Revenue'}, Shares Rally`,
        `${symbol} Surges on Strong ${topics[0] || 'Growth'} Outlook`,
        `${symbol} Announces Game-Changing ${topics[0] || 'Innovation'}`,
        `${symbol} Crushes Analyst Expectations, Stock Up`
      ];
      
      return templates[Math.floor(Math.random() * templates.length)];
    } else if (sentiment > 0) {
      // Moderately positive
      const templates = [
        `${symbol} Edges Higher After Solid ${topics[0] || 'Earnings'} Report`,
        `${symbol} Shows Promising ${topics[0] || 'Growth'} in Latest Quarter`,
        `${symbol} Outperforms Peers in ${topics[0] || 'Market'} Share`,
        `${symbol} Announces New ${topics[0] || 'Product'} to Positive Reception`,
        `Analysts Upgrade ${symbol} on Improving ${topics[0] || 'Outlook'}`
      ];
      
      return templates[Math.floor(Math.random() * templates.length)];
    } else if (sentiment > -0.3) {
      // Neutral to slightly negative
      const templates = [
        `${symbol} Reports Mixed ${topics[0] || 'Results'} in Latest Quarter`,
        `${symbol} Meets Expectations but Guidance Disappoints`,
        `${symbol} Faces Challenges in ${topics[0] || 'Market'} Conditions`,
        `Analysts Remain Cautious on ${symbol} Despite ${topics[0] || 'Progress'}`,
        `${symbol} Announces Restructuring Amid ${topics[0] || 'Industry'} Pressure`
      ];
      
      return templates[Math.floor(Math.random() * templates.length)];
    } else {
      // Very negative
      const templates = [
        `${symbol} Plunges After Disappointing ${topics[0] || 'Earnings'}`,
        `${symbol} Cuts ${topics[0] || 'Guidance'}, Shares Tumble`,
        `${symbol} Faces Significant Headwinds in ${topics[0] || 'Market'}`,
        `Investors Flee ${symbol} Following Weak ${topics[0] || 'Performance'}`,
        `${symbol} Announces Layoffs Amid ${topics[0] || 'Industry'} Downturn`
      ];
      
      return templates[Math.floor(Math.random() * templates.length)];
    }
  }

  /**
   * Generates an article summary
   * @param symbol The symbol
   * @param sentiment The sentiment score
   * @param topics The topics
   * @returns The article summary
   */
  private generateArticleSummary(symbol: string, sentiment: number, topics: string[]): string {
    if (sentiment > 0.3) {
      // Very positive
      return `${symbol} reported exceptional ${topics[0] || 'results'} that exceeded analyst expectations, driven by strong ${topics[1] || 'performance'} across all business segments. The company also raised its full-year guidance, citing continued momentum and favorable market conditions. Analysts have responded positively, with several raising their price targets.`;
    } else if (sentiment > 0) {
      // Moderately positive
      return `${symbol} delivered solid ${topics[0] || 'results'} in the latest quarter, showing improvement in key metrics. The company highlighted progress in its ${topics[1] || 'strategic initiatives'} and expressed confidence in its growth trajectory. Management maintained its outlook for the year, which was received positively by investors.`;
    } else if (sentiment > -0.3) {
      // Neutral to slightly negative
      return `${symbol} reported ${topics[0] || 'results'} that were in line with expectations, but noted challenges in the ${topics[1] || 'market environment'}. The company is implementing cost-cutting measures to address margin pressure. Management provided cautious guidance for the upcoming quarters, citing uncertainty in demand and competitive pressures.`;
    } else {
      // Very negative
      return `${symbol} announced disappointing ${topics[0] || 'results'}, falling short of analyst expectations due to weakening demand and ${topics[1] || 'operational challenges'}. The company lowered its full-year outlook and announced restructuring efforts to address profitability concerns. Several analysts downgraded the stock following the announcement.`;
    }
  }

  /**
   * Generates a social media post
   * @param symbol The symbol
   * @param sentiment The sentiment score
   * @returns The social media post
   */
  private generateSocialMediaPost(symbol: string, sentiment: number): string {
    if (sentiment > 0.3) {
      // Very positive
      const templates = [
        `Just bought more $${symbol}! This company is crushing it! 🚀🚀🚀`,
        `$${symbol} earnings were incredible. Long term hold for sure! 💎🙌`,
        `$${symbol} is the future. So bullish on this company! 📈`,
        `Analysts don't understand how good $${symbol} really is. Easy 2x from here.`,
        `$${symbol} management team is executing perfectly. Best in class! 👏`
      ];
      
      return templates[Math.floor(Math.random() * templates.length)];
    } else if (sentiment > 0) {
      // Moderately positive
      const templates = [
        `$${symbol} looking good after earnings. Holding my position.`,
        `Decent quarter from $${symbol}. Guidance was solid too.`,
        `$${symbol} is making the right moves. Cautiously optimistic here.`,
        `Added to my $${symbol} position today. Like the risk/reward at this level.`,
        `$${symbol} showing strength in a tough market. Good sign.`
      ];
      
      return templates[Math.floor(Math.random() * templates.length)];
    } else if (sentiment > -0.3) {
      // Neutral to slightly negative
      const templates = [
        `$${symbol} results were mixed. Watching closely for next quarter.`,
        `Not sure about $${symbol} right now. Might trim my position.`,
        `$${symbol} facing some headwinds but could recover. On the fence.`,
        `Anyone else concerned about $${symbol}'s guidance? Seems weak.`,
        `$${symbol} needs to improve execution. Getting impatient.`
      ];
      
      return templates[Math.floor(Math.random() * templates.length)];
    } else {
      // Very negative
      const templates = [
        `Dumping all my $${symbol} shares. This company is in trouble! 📉`,
        `$${symbol} management has no clue. Terrible earnings call. 🤦‍♂️`,
        `$${symbol} is a disaster. Stay away at all costs!`,
        `Shorted $${symbol} today. This is going much lower.`,
        `$${symbol} just lost a long-time customer and investor. Disappointed!`
      ];
      
      return templates[Math.floor(Math.random() * templates.length)];
    }
  }

  /**
   * Generates a market article title
   * @param sentiment The sentiment score
   * @param topics The topics
   * @returns The article title
   */
  private generateMarketArticleTitle(sentiment: number, topics: string[]): string {
    if (sentiment > 0.3) {
      // Very positive
      const templates = [
        `Markets Rally as ${topics[0] || 'Economic'} Data Exceeds Expectations`,
        `Stocks Soar on Strong ${topics[0] || 'Corporate'} Earnings`,
        `Bull Market Continues as ${topics[0] || 'Investor'} Confidence Grows`,
        `${topics[0] || 'Global'} Markets Surge on Positive Economic Outlook`,
        `Wall Street Hits Record Highs Amid ${topics[0] || 'Economic'} Optimism`
      ];
      
      return templates[Math.floor(Math.random() * templates.length)];
    } else if (sentiment > 0) {
      // Moderately positive
      const templates = [
        `Markets Edge Higher as ${topics[0] || 'Investors'} Digest Economic Data`,
        `Stocks Post Modest Gains on ${topics[0] || 'Fed'} Comments`,
        `${topics[0] || 'Investor'} Sentiment Improves as Risks Recede`,
        `Markets Recover as ${topics[0] || 'Trade'} Tensions Ease`,
        `Wall Street Advances on Positive ${topics[0] || 'Economic'} Signals`
      ];
      
      return templates[Math.floor(Math.random() * templates.length)];
    } else if (sentiment > -0.3) {
      // Neutral to slightly negative
      const templates = [
        `Markets Mixed as ${topics[0] || 'Investors'} Weigh Economic Data`,
        `Stocks Flat as ${topics[0] || 'Uncertainty'} Persists`,
        `Wall Street Pauses as ${topics[0] || 'Earnings'} Season Begins`,
        `Markets Cautious Ahead of ${topics[0] || 'Fed'} Decision`,
        `Investors Reassess Risk Amid ${topics[0] || 'Global'} Concerns`
      ];
      
      return templates[Math.floor(Math.random() * templates.length)];
    } else {
      // Very negative
      const templates = [
        `Markets Plunge as ${topics[0] || 'Economic'} Fears Intensify`,
        `Stocks Tumble on Disappointing ${topics[0] || 'Data'}`,
        `Wall Street Sells Off Amid ${topics[0] || 'Recession'} Concerns`,
        `Global Markets Sink as ${topics[0] || 'Investors'} Flee Risk`,
        `Market Rout Continues as ${topics[0] || 'Uncertainty'} Grows`
      ];
      
      return templates[Math.floor(Math.random() * templates.length)];
    }
  }

  /**
   * Generates a market article summary
   * @param sentiment The sentiment score
   * @param topics The topics
   * @returns The article summary
   */
  private generateMarketArticleSummary(sentiment: number, topics: string[]): string {
    if (sentiment > 0.3) {
      // Very positive
      return `Markets experienced a strong rally today, with major indices posting significant gains driven by positive ${topics[0] || 'economic'} data and robust ${topics[1] || 'corporate earnings'}. Investors showed renewed confidence in the economic outlook, pushing stocks to new highs. Analysts point to decreasing ${topics[2] || 'inflation concerns'} and strong consumer spending as key factors supporting the bullish sentiment.`;
    } else if (sentiment > 0) {
      // Moderately positive
      return `Stocks edged higher today as investors responded favorably to the latest ${topics[0] || 'economic'} reports and ${topics[1] || 'Fed'} commentary. While gains were modest, market participants appeared to take comfort in signs of economic resilience. Analysts note that while challenges remain, the overall trajectory appears positive, with several sectors showing improvement.`;
    } else if (sentiment > -0.3) {
      // Neutral to slightly negative
      return `Markets traded mixed today as investors weighed conflicting signals from ${topics[0] || 'economic'} data and ${topics[1] || 'corporate'} announcements. Concerns about ${topics[2] || 'inflation'} and potential policy changes kept sentiment cautious. Analysts suggest that markets may remain range-bound until there is greater clarity on the economic outlook and monetary policy direction.`;
    } else {
      // Very negative
      return `Stocks plummeted today amid growing concerns about ${topics[0] || 'economic'} conditions and disappointing ${topics[1] || 'corporate'} results. Investors rushed to safe-haven assets as market sentiment deteriorated sharply. Analysts warn that continued ${topics[2] || 'uncertainty'} could lead to further volatility, with several key indicators suggesting potential challenges ahead for the broader economy.`;
    }
  }

  /**
   * Generates a market social media post
   * @param sentiment The sentiment score
   * @param symbols The symbols
   * @returns The social media post
   */
  private generateMarketSocialMediaPost(sentiment: number, symbols: string[]): string {
    const symbolText = symbols.length > 0 ? symbols.map(s => `$${s}`).join(' ') + ' ' : '';
    
    if (sentiment > 0.3) {
      // Very positive
      const templates = [
        `${symbolText}Market is on fire today! 🔥 Bulls in complete control.`,
        `${symbolText}This rally has legs. Economic data looking strong! 📈`,
        `${symbolText}Fed pivot coming soon. Markets pricing in good news! 🚀`,
        `${symbolText}Buying this dip was the right call. Markets roaring back!`,
        `${symbolText}All systems go for this bull market. New ATHs incoming! 💪`
      ];
      
      return templates[Math.floor(Math.random() * templates.length)];
    } else if (sentiment > 0) {
      // Moderately positive
      const templates = [
        `${symbolText}Markets holding up well despite headwinds. Resilient.`,
        `${symbolText}Cautiously optimistic on this market. Staying long but vigilant.`,
        `${symbolText}Fed comments were market-friendly today. Good sign.`,
        `${symbolText}Rotation happening but overall market trend still positive.`,
        `${symbolText}Economy stronger than bears think. Markets know this.`
      ];
      
      return templates[Math.floor(Math.random() * templates.length)];
    } else if (sentiment > -0.3) {
      // Neutral to slightly negative
      const templates = [
        `${symbolText}Markets at a crossroads here. Watching carefully.`,
        `${symbolText}Mixed signals in today's data. Reducing risk a bit.`,
        `${symbolText}Not convinced this rally is sustainable. Proceed with caution.`,
        `${symbolText}Fed talk creating uncertainty. Markets hate that.`,
        `${symbolText}Some concerning technicals developing. Stay alert.`
      ];
      
      return templates[Math.floor(Math.random() * templates.length)];
    } else {
      // Very negative
      const templates = [
        `${symbolText}This market is in trouble. Getting defensive now! 📉`,
        `${symbolText}Recession signals flashing red. Cash is king right now.`,
        `${symbolText}Bull trap confirmed. This market is heading much lower.`,
        `${symbolText}Fed has lost control. Inflation AND recession coming. 🤦‍♂️`,
        `${symbolText}Selling rallies in this bear market. Don't catch falling knives!`
      ];
      
      return templates[Math.floor(Math.random() * templates.length)];
    }
  }
}