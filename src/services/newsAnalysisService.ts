/**
 * News Analysis Service
 * 
 * This service provides functionality for analyzing financial news data,
 * including sentiment analysis, entity extraction, and impact assessment.
 */

import axios from 'axios';
import * as nlp from 'natural';
import { 
  NewsAnalysisResult, 
  NewsItem, 
  NewsSource,
  NewsImpact,
  NewsEntity,
  NewsTrend
} from '../types/newsTypes';

export class NewsAnalysisService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly tokenizer: any;
  private readonly analyzer: any;

  constructor(apiKey: string, baseUrl: string = 'https://api.ninjatechfinance.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.tokenizer = new nlp.WordTokenizer();
    this.analyzer = new nlp.SentimentAnalyzer('English', nlp.PorterStemmer, 'afinn');
    
    // Extend the sentiment analyzer with financial domain-specific vocabulary
    this.extendLexicon();
  }

  /**
   * Extend the sentiment lexicon with financial domain-specific terms
   */
  private extendLexicon(): void {
    const financialLexicon = {
      'bullish': 3,
      'bearish': -3,
      'outperform': 2,
      'underperform': -2,
      'upgrade': 2,
      'downgrade': -2,
      'buy': 2,
      'sell': -2,
      'hold': 0,
      'overweight': 2,
      'underweight': -2,
      'beat': 3,
      'miss': -3,
      'exceeded': 3,
      'fell short': -3,
      'guidance': 0,
      'raised guidance': 3,
      'lowered guidance': -3,
      'bankruptcy': -5,
      'acquisition': 2,
      'merger': 1,
      'lawsuit': -2,
      'settlement': 1,
      'investigation': -2,
      'fine': -2,
      'dividend': 2,
      'dividend cut': -4,
      'dividend increase': 3,
      'layoffs': -3,
      'restructuring': -1,
      'growth': 2,
      'decline': -2,
      'profit': 2,
      'loss': -2,
      'revenue': 1,
      'eps': 1,
      'margin': 1,
      'margin expansion': 3,
      'margin compression': -3,
      'recall': -3,
      'fda approval': 4,
      'patent': 2,
      'contract': 2,
      'partnership': 2,
      'collaboration': 2,
      'launch': 2,
      'delay': -2,
      'postpone': -2,
      'suspend': -3,
      'resume': 2,
      'halt': -3,
      'scandal': -4,
      'fraud': -5,
      'corruption': -4,
      'insider trading': -4,
      'sec investigation': -3,
      'class action': -3,
      'antitrust': -2,
      'monopoly': -1,
      'regulation': -1,
      'deregulation': 1,
      'tariff': -2,
      'trade war': -3,
      'sanctions': -2
    };

    // Add financial terms to the lexicon
    Object.entries(financialLexicon).forEach(([term, score]) => {
      this.analyzer.addWord(term, score);
    });
  }

  /**
   * Analyze sentiment of a text
   * @param text The text to analyze
   * @returns Sentiment score (-5 to 5) and classification (positive, negative, neutral)
   */
  public analyzeSentiment(text: string): { score: number; classification: string } {
    const tokens = this.tokenizer.tokenize(text);
    const score = this.analyzer.getSentiment(tokens);
    
    let classification = 'neutral';
    if (score > 0.2) classification = 'positive';
    else if (score < -0.2) classification = 'negative';
    
    return { score, classification };
  }

  /**
   * Get news analysis for a specific ticker
   * @param ticker Stock ticker symbol
   * @param startDate Optional start date for news articles
   * @param endDate Optional end date for news articles
   * @param sources Optional array of news sources to include
   * @returns Promise with news analysis results
   */
  public async getNewsAnalysis(
    ticker: string,
    startDate?: Date,
    endDate?: Date,
    sources?: NewsSource[]
  ): Promise<NewsAnalysisResult> {
    try {
      // Fetch news articles from API
      const response = await axios.get(`${this.baseUrl}/news/${ticker}`, {
        headers: { 'X-API-KEY': this.apiKey },
        params: {
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
          sources: sources?.join(',')
        }
      });
      
      const newsData = response.data;
      
      // Process news articles
      const newsItems = this.processNewsItems(newsData.articles);
      
      // Extract entities
      const entities = this.extractEntities(newsItems);
      
      // Calculate impact
      const impact = this.calculateNewsImpact(newsItems);
      
      // Calculate trends
      const trends = this.calculateNewsTrends(newsItems);
      
      // Group by categories
      const categories = this.categorizeNews(newsItems);
      
      return {
        ticker,
        newsItems,
        entities,
        impact,
        trends,
        categories,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error fetching news analysis:', error);
      throw new Error('Failed to fetch news analysis data');
    }
  }

  /**
   * Process news items for sentiment and metrics
   * @param rawArticles Raw news articles from API
   * @returns Processed news items with sentiment
   */
  private processNewsItems(rawArticles: any[]): NewsItem[] {
    return rawArticles.map(article => {
      // Analyze title and content separately
      const titleSentiment = this.analyzeSentiment(article.title);
      const contentSentiment = article.content ? this.analyzeSentiment(article.content) : { score: 0, classification: 'neutral' };
      
      // Combined sentiment with more weight on title
      const combinedScore = (titleSentiment.score * 0.6) + (contentSentiment.score * 0.4);
      let combinedClassification = 'neutral';
      if (combinedScore > 0.2) combinedClassification = 'positive';
      else if (combinedScore < -0.2) combinedClassification = 'negative';
      
      // Determine relevance score (0-1)
      const relevanceScore = this.calculateRelevance(article);
      
      return {
        id: article.id,
        title: article.title,
        summary: article.summary || '',
        content: article.content || '',
        url: article.url,
        source: article.source as NewsSource,
        author: article.author || '',
        publishedAt: new Date(article.publishedAt),
        sentiment: {
          score: combinedScore,
          classification: combinedClassification,
          titleScore: titleSentiment.score,
          contentScore: contentSentiment.score
        },
        relevance: relevanceScore,
        categories: article.categories || [],
        entities: article.entities || [],
        imageUrl: article.imageUrl || null
      };
    }).sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()); // Sort by date, newest first
  }

  /**
   * Calculate relevance score for a news article
   * @param article Raw news article
   * @returns Relevance score between 0 and 1
   */
  private calculateRelevance(article: any): number {
    // Factors that increase relevance:
    // 1. Ticker symbol in title
    // 2. Company name in title
    // 3. Article from reputable financial source
    // 4. Recent publication date
    // 5. Article length/depth
    
    let relevanceScore = 0.5; // Start with neutral relevance
    
    // Check if ticker is in title (strong indicator of relevance)
    if (article.ticker && article.title.includes(article.ticker)) {
      relevanceScore += 0.3;
    }
    
    // Check if company name is in title
    if (article.companyName && article.title.includes(article.companyName)) {
      relevanceScore += 0.2;
    }
    
    // Adjust based on source reputation
    const reputableSources = ['Bloomberg', 'Reuters', 'CNBC', 'Wall Street Journal', 'Financial Times', 'MarketWatch', 'Barron\'s', 'Seeking Alpha'];
    if (reputableSources.includes(article.source)) {
      relevanceScore += 0.1;
    }
    
    // Adjust based on recency
    const now = new Date();
    const publishedDate = new Date(article.publishedAt);
    const hoursSincePublished = (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursSincePublished < 24) {
      relevanceScore += 0.1;
    } else if (hoursSincePublished > 72) {
      relevanceScore -= 0.1;
    }
    
    // Adjust based on content length/depth
    if (article.content) {
      const contentLength = article.content.length;
      if (contentLength > 3000) {
        relevanceScore += 0.1;
      } else if (contentLength < 500) {
        relevanceScore -= 0.1;
      }
    }
    
    // Cap relevance between 0 and 1
    return Math.min(Math.max(relevanceScore, 0), 1);
  }

  /**
   * Extract entities from news items
   * @param newsItems Processed news items
   * @returns Array of extracted entities
   */
  private extractEntities(newsItems: NewsItem[]): NewsEntity[] {
    // In a real implementation, this would use named entity recognition (NER)
    // For this example, we'll use a simplified approach
    
    const entityMap = new Map<string, {
      type: string;
      mentions: number;
      sentimentSum: number;
      articles: string[];
    }>();
    
    // Define entity types to look for
    const entityTypes = {
      person: ['CEO', 'CFO', 'CTO', 'Chairman', 'Director', 'President', 'Executive'],
      organization: ['Inc', 'Corp', 'LLC', 'Ltd', 'Company', 'Group', 'Partners'],
      product: ['iPhone', 'iPad', 'Galaxy', 'Surface', 'Windows', 'Android', 'iOS'],
      event: ['Conference', 'Earnings', 'Announcement', 'Release', 'Launch', 'Meeting', 'IPO'],
      location: ['US', 'China', 'Europe', 'Asia', 'America', 'Germany', 'Japan']
    };
    
    newsItems.forEach(item => {
      // Combine title and content for entity extraction
      const text = `${item.title} ${item.summary} ${item.content}`;
      
      // Extract entities from pre-defined lists (simplified approach)
      Object.entries(entityTypes).forEach(([type, keywords]) => {
        keywords.forEach(keyword => {
          if (text.includes(keyword)) {
            const entityKey = `${keyword}:${type}`;
            
            if (!entityMap.has(entityKey)) {
              entityMap.set(entityKey, {
                type,
                mentions: 0,
                sentimentSum: 0,
                articles: []
              });
            }
            
            const entityData = entityMap.get(entityKey)!;
            entityData.mentions += 1;
            entityData.sentimentSum += item.sentiment.score;
            
            if (!entityData.articles.includes(item.id)) {
              entityData.articles.push(item.id);
            }
          }
        });
      });
      
      // Extract entities from the article's entity list if available
      if (item.entities && item.entities.length > 0) {
        item.entities.forEach(entity => {
          const entityKey = `${entity.name}:${entity.type}`;
          
          if (!entityMap.has(entityKey)) {
            entityMap.set(entityKey, {
              type: entity.type,
              mentions: 0,
              sentimentSum: 0,
              articles: []
            });
          }
          
          const entityData = entityMap.get(entityKey)!;
          entityData.mentions += 1;
          entityData.sentimentSum += item.sentiment.score;
          
          if (!entityData.articles.includes(item.id)) {
            entityData.articles.push(item.id);
          }
        });
      }
    });
    
    // Convert map to array and calculate average sentiment
    return Array.from(entityMap.entries()).map(([key, data]) => {
      const [name, type] = key.split(':');
      const averageSentiment = data.sentimentSum / data.mentions;
      
      let sentimentClassification = 'neutral';
      if (averageSentiment > 0.2) sentimentClassification = 'positive';
      else if (averageSentiment < -0.2) sentimentClassification = 'negative';
      
      return {
        name,
        type,
        mentions: data.mentions,
        sentiment: {
          score: averageSentiment,
          classification: sentimentClassification
        },
        articleCount: data.articles.length
      };
    }).sort((a, b) => b.mentions - a.mentions); // Sort by mention count
  }

  /**
   * Calculate news impact based on news items
   * @param newsItems Processed news items
   * @returns News impact analysis
   */
  private calculateNewsImpact(newsItems: NewsItem[]): NewsImpact {
    if (newsItems.length === 0) {
      return {
        overall: {
          score: 0,
          classification: 'neutral',
          confidence: 0
        },
        shortTerm: {
          score: 0,
          classification: 'neutral',
          confidence: 0
        },
        longTerm: {
          score: 0,
          classification: 'neutral',
          confidence: 0
        },
        significantArticles: []
      };
    }
    
    // Calculate overall impact
    const weightedSentiments = newsItems.map(item => {
      // Weight by relevance and recency
      const recencyWeight = this.calculateRecencyWeight(item.publishedAt);
      return item.sentiment.score * item.relevance * recencyWeight;
    });
    
    const overallScore = weightedSentiments.reduce((sum, score) => sum + score, 0) / weightedSentiments.length;
    
    let overallClassification = 'neutral';
    if (overallScore > 0.2) overallClassification = 'positive';
    else if (overallScore < -0.2) overallClassification = 'negative';
    
    // Calculate confidence based on article count and consistency
    const sentimentVariance = this.calculateVariance(weightedSentiments);
    const articleCountFactor = Math.min(newsItems.length / 20, 1); // Max out at 20 articles
    const consistencyFactor = Math.max(1 - sentimentVariance, 0);
    
    const overallConfidence = (articleCountFactor * 0.6) + (consistencyFactor * 0.4);
    
    // Calculate short-term impact (more weight on very recent news)
    const shortTermItems = newsItems.filter(item => {
      const hoursSincePublished = (new Date().getTime() - item.publishedAt.getTime()) / (1000 * 60 * 60);
      return hoursSincePublished <= 48; // Last 48 hours
    });
    
    let shortTermScore = 0;
    let shortTermClassification = 'neutral';
    let shortTermConfidence = 0;
    
    if (shortTermItems.length > 0) {
      const shortTermSentiments = shortTermItems.map(item => item.sentiment.score * item.relevance);
      shortTermScore = shortTermSentiments.reduce((sum, score) => sum + score, 0) / shortTermSentiments.length;
      
      if (shortTermScore > 0.2) shortTermClassification = 'positive';
      else if (shortTermScore < -0.2) shortTermClassification = 'negative';
      
      const shortTermVariance = this.calculateVariance(shortTermSentiments);
      const shortTermCountFactor = Math.min(shortTermItems.length / 10, 1); // Max out at 10 articles
      const shortTermConsistencyFactor = Math.max(1 - shortTermVariance, 0);
      
      shortTermConfidence = (shortTermCountFactor * 0.6) + (shortTermConsistencyFactor * 0.4);
    }
    
    // Calculate long-term impact (more weight on significant news)
    const longTermItems = newsItems.filter(item => {
      // Consider articles with high relevance or strong sentiment
      return item.relevance > 0.7 || Math.abs(item.sentiment.score) > 0.5;
    });
    
    let longTermScore = 0;
    let longTermClassification = 'neutral';
    let longTermConfidence = 0;
    
    if (longTermItems.length > 0) {
      const longTermSentiments = longTermItems.map(item => item.sentiment.score * item.relevance);
      longTermScore = longTermSentiments.reduce((sum, score) => sum + score, 0) / longTermSentiments.length;
      
      if (longTermScore > 0.2) longTermClassification = 'positive';
      else if (longTermScore < -0.2) longTermClassification = 'negative';
      
      const longTermVariance = this.calculateVariance(longTermSentiments);
      const longTermCountFactor = Math.min(longTermItems.length / 5, 1); // Max out at 5 significant articles
      const longTermConsistencyFactor = Math.max(1 - longTermVariance, 0);
      
      longTermConfidence = (longTermCountFactor * 0.5) + (longTermConsistencyFactor * 0.5);
    }
    
    // Identify significant articles
    const significantArticles = newsItems
      .filter(item => item.relevance > 0.7 || Math.abs(item.sentiment.score) > 0.5)
      .map(item => ({
        id: item.id,
        title: item.title,
        url: item.url,
        publishedAt: item.publishedAt,
        sentiment: item.sentiment,
        relevance: item.relevance
      }))
      .slice(0, 5); // Top 5 significant articles
    
    return {
      overall: {
        score: overallScore,
        classification: overallClassification,
        confidence: overallConfidence
      },
      shortTerm: {
        score: shortTermScore,
        classification: shortTermClassification,
        confidence: shortTermConfidence
      },
      longTerm: {
        score: longTermScore,
        classification: longTermClassification,
        confidence: longTermConfidence
      },
      significantArticles
    };
  }

  /**
   * Calculate recency weight for a published date
   * @param publishedAt Publication date
   * @returns Weight between 0 and 1
   */
  private calculateRecencyWeight(publishedAt: Date): number {
    const now = new Date();
    const hoursSincePublished = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60);
    
    if (hoursSincePublished < 24) {
      return 1; // Last 24 hours gets full weight
    } else if (hoursSincePublished < 72) {
      return 0.8; // 1-3 days ago
    } else if (hoursSincePublished < 168) {
      return 0.6; // 3-7 days ago
    } else if (hoursSincePublished < 336) {
      return 0.4; // 7-14 days ago
    } else {
      return 0.2; // Older than 14 days
    }
  }

  /**
   * Calculate variance of an array of numbers
   * @param values Array of numbers
   * @returns Variance
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate news trends from news items
   * @param newsItems Processed news items
   * @returns Array of news trends
   */
  private calculateNewsTrends(newsItems: NewsItem[]): NewsTrend[] {
    if (newsItems.length === 0) {
      return [];
    }
    
    // Sort news items by date
    const sortedItems = [...newsItems].sort((a, b) => a.publishedAt.getTime() - b.publishedAt.getTime());
    
    // Group news items by day
    const itemsByDay: { [day: string]: NewsItem[] } = {};
    sortedItems.forEach(item => {
      const date = item.publishedAt.toISOString().split('T')[0];
      if (!itemsByDay[date]) {
        itemsByDay[date] = [];
      }
      itemsByDay[date].push(item);
    });
    
    // Calculate daily metrics
    const dailyMetrics = Object.entries(itemsByDay).map(([date, items]) => {
      const articleCount = items.length;
      
      const sentiments = items.map(item => item.sentiment.score);
      const avgSentiment = sentiments.reduce((sum, score) => sum + score, 0) / sentiments.length;
      
      const relevances = items.map(item => item.relevance);
      const avgRelevance = relevances.reduce((sum, score) => sum + score, 0) / relevances.length;
      
      return {
        date,
        articleCount,
        avgSentiment,
        avgRelevance
      };
    });
    
    // Calculate trends
    const trends: NewsTrend[] = [];
    
    // Volume trend
    if (dailyMetrics.length >= 3) {
      const recentDays = dailyMetrics.slice(-3);
      const olderDays = dailyMetrics.slice(-6, -3);
      
      const recentAvgCount = recentDays.reduce((sum, day) => sum + day.articleCount, 0) / recentDays.length;
      const olderAvgCount = olderDays.length > 0 
        ? olderDays.reduce((sum, day) => sum + day.articleCount, 0) / olderDays.length 
        : recentAvgCount;
      
      const volumeChange = ((recentAvgCount - olderAvgCount) / olderAvgCount) * 100;
      
      trends.push({
        name: 'News Volume',
        value: recentAvgCount,
        changePercent: volumeChange,
        direction: volumeChange > 20 ? 'increasing' : (volumeChange < -20 ? 'decreasing' : 'stable'),
        description: `News volume is ${Math.abs(volumeChange).toFixed(1)}% ${volumeChange > 0 ? 'higher' : 'lower'} than previous period`
      });
    }
    
    // Sentiment trend
    if (dailyMetrics.length >= 3) {
      const recentDays = dailyMetrics.slice(-3);
      const olderDays = dailyMetrics.slice(-6, -3);
      
      const recentAvgSentiment = recentDays.reduce((sum, day) => sum + day.avgSentiment, 0) / recentDays.length;
      const olderAvgSentiment = olderDays.length > 0 
        ? olderDays.reduce((sum, day) => sum + day.avgSentiment, 0) / olderDays.length 
        : 0;
      
      const sentimentChange = recentAvgSentiment - olderAvgSentiment;
      
      trends.push({
        name: 'News Sentiment',
        value: recentAvgSentiment,
        changePercent: sentimentChange * 100, // Convert to percentage points
        direction: sentimentChange > 0.1 ? 'improving' : (sentimentChange < -0.1 ? 'deteriorating' : 'stable'),
        description: `News sentiment is ${Math.abs(sentimentChange).toFixed(2)} points ${sentimentChange > 0 ? 'higher' : 'lower'} than previous period`
      });
    }
    
    // Relevance trend
    if (dailyMetrics.length >= 3) {
      const recentDays = dailyMetrics.slice(-3);
      const olderDays = dailyMetrics.slice(-6, -3);
      
      const recentAvgRelevance = recentDays.reduce((sum, day) => sum + day.avgRelevance, 0) / recentDays.length;
      const olderAvgRelevance = olderDays.length > 0 
        ? olderDays.reduce((sum, day) => sum + day.avgRelevance, 0) / olderDays.length 
        : recentAvgRelevance;
      
      const relevanceChange = ((recentAvgRelevance - olderAvgRelevance) / olderAvgRelevance) * 100;
      
      trends.push({
        name: 'News Relevance',
        value: recentAvgRelevance,
        changePercent: relevanceChange,
        direction: relevanceChange > 10 ? 'increasing' : (relevanceChange < -10 ? 'decreasing' : 'stable'),
        description: `News relevance is ${Math.abs(relevanceChange).toFixed(1)}% ${relevanceChange > 0 ? 'higher' : 'lower'} than previous period`
      });
    }
    
    return trends;
  }

  /**
   * Categorize news items into categories
   * @param newsItems Processed news items
   * @returns Categorized news items
   */
  private categorizeNews(newsItems: NewsItem[]): {
    category: string;
    count: number;
    items: NewsItem[];
  }[] {
    if (newsItems.length === 0) {
      return [];
    }
    
    // Define categories and their keywords
    const categories: { [category: string]: string[] } = {
      'Earnings': ['earnings', 'revenue', 'profit', 'loss', 'eps', 'quarter', 'financial results', 'guidance'],
      'Management Changes': ['ceo', 'cfo', 'executive', 'appoint', 'resign', 'management', 'leadership'],
      'Mergers & Acquisitions': ['acquisition', 'merger', 'takeover', 'buyout', 'acquire', 'bid', 'offer'],
      'Product News': ['product', 'launch', 'release', 'announce', 'unveil', 'new', 'update'],
      'Legal & Regulatory': ['lawsuit', 'legal', 'court', 'regulation', 'compliance', 'settlement', 'fine', 'sec'],
      'Market Performance': ['stock', 'share', 'price', 'market', 'trading', 'investor', 'rally', 'decline'],
      'Analyst Coverage': ['analyst', 'rating', 'upgrade', 'downgrade', 'target', 'recommendation', 'coverage'],
      'Partnerships': ['partnership', 'collaboration', 'agreement', 'deal', 'contract', 'alliance'],
      'Industry News': ['industry', 'sector', 'market', 'trend', 'competitor', 'competition'],
      'Other': [] // Catch-all category
    };
    
    // Categorize each news item
    const categorizedItems: { [category: string]: NewsItem[] } = {};
    Object.keys(categories).forEach(category => {
      categorizedItems[category] = [];
    });
    
    newsItems.forEach(item => {
      // Check if the item already has categories
      if (item.categories && item.categories.length > 0) {
        item.categories.forEach(category => {
          if (!categorizedItems[category]) {
            categorizedItems[category] = [];
          }
          categorizedItems[category].push(item);
        });
      } else {
        // Categorize based on keywords
        const text = `${item.title} ${item.summary} ${item.content}`.toLowerCase();
        let categorized = false;
        
        for (const [category, keywords] of Object.entries(categories)) {
          if (category === 'Other') continue; // Skip the catch-all category
          
          if (keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
            categorizedItems[category].push(item);
            categorized = true;
            break; // Assign to first matching category
          }
        }
        
        // If no category matched, put in "Other"
        if (!categorized) {
          categorizedItems['Other'].push(item);
        }
      }
    });
    
    // Convert to array format and sort by count
    return Object.entries(categorizedItems)
      .map(([category, items]) => ({
        category,
        count: items.length,
        items
      }))
      .filter(cat => cat.count > 0) // Remove empty categories
      .sort((a, b) => b.count - a.count); // Sort by count
  }

  /**
   * Get breaking news for a specific ticker or market
   * @param ticker Optional stock ticker symbol (if null, returns market-wide breaking news)
   * @param count Number of breaking news items to return
   * @returns Promise with breaking news items
   */
  public async getBreakingNews(
    ticker?: string,
    count: number = 5
  ): Promise<NewsItem[]> {
    try {
      // Fetch breaking news from API
      const response = await axios.get(`${this.baseUrl}/news/breaking`, {
        headers: { 'X-API-KEY': this.apiKey },
        params: {
          ticker,
          count
        }
      });
      
      // Process news items
      return this.processNewsItems(response.data);
    } catch (error) {
      console.error('Error fetching breaking news:', error);
      throw new Error('Failed to fetch breaking news data');
    }
  }

  /**
   * Get news sentiment correlation with price
   * @param ticker Stock ticker symbol
   * @param timeframe Timeframe for analysis in days
   * @returns Promise with sentiment-price correlation data
   */
  public async getNewsPriceCorrelation(
    ticker: string,
    timeframe: number = 30
  ): Promise<{
    correlation: number;
    leadLag: number;
    dailyData: {
      date: string;
      sentiment: number;
      price: number;
      priceChange: number;
      newsCount: number;
    }[];
  }> {
    try {
      // Fetch correlation data from API
      const response = await axios.get(`${this.baseUrl}/news/correlation/${ticker}`, {
        headers: { 'X-API-KEY': this.apiKey },
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
}

export default NewsAnalysisService;