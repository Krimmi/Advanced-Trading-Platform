/**
 * Social Media Analysis Service
 * 
 * This service provides functionality for analyzing social media data related to financial markets,
 * including Twitter, Reddit, StockTwits, and other platforms.
 */

import axios from 'axios';
import * as nlp from 'natural';
import { 
  SocialMediaAnalysisResult, 
  SocialMediaSource, 
  SocialMediaPost, 
  SocialMediaMetrics,
  SocialMediaTrend,
  TopicDistribution
} from '../types/socialMediaTypes';

export class SocialMediaAnalysisService {
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
      'moon': 4,
      'mooning': 4,
      'rocket': 3,
      'dump': -3,
      'dumping': -3,
      'hodl': 2,
      'diamond hands': 3,
      'paper hands': -2,
      'short squeeze': 3,
      'bagholder': -3,
      'tendies': 3,
      'yolo': 1,
      'fud': -3,
      'btfd': 3,
      'buy the dip': 2,
      'sell the news': -1,
      'to the moon': 4,
      'rekt': -4,
      'lambo': 3,
      'pump': 2,
      'dump': -3,
      'pump and dump': -4,
      'short': -2,
      'long': 2,
      'calls': 2,
      'puts': -2,
      'otm': 1,
      'itm': 2,
      'dd': 1,
      'technical analysis': 1,
      'fundamentals': 1,
      'catalyst': 2,
      'breakout': 3,
      'breakdown': -3,
      'resistance': 0,
      'support': 0,
      'oversold': 2,
      'overbought': -2,
      'undervalued': 3,
      'overvalued': -3
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
   * Get social media analysis for a specific ticker
   * @param ticker Stock ticker symbol
   * @param platforms Array of social media platforms to analyze
   * @param startDate Optional start date for analysis
   * @param endDate Optional end date for analysis
   * @returns Promise with social media analysis results
   */
  public async getSocialMediaAnalysis(
    ticker: string,
    platforms: string[] = ['twitter', 'reddit', 'stocktwits'],
    startDate?: Date,
    endDate?: Date
  ): Promise<SocialMediaAnalysisResult> {
    try {
      // Fetch social media data from API
      const response = await axios.get(`${this.baseUrl}/social/data/${ticker}`, {
        headers: { 'X-API-KEY': this.apiKey },
        params: {
          platforms: platforms.join(','),
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString()
        }
      });
      
      const socialData = response.data;
      
      // Process posts for sentiment
      const posts = this.processSocialMediaPosts(socialData.posts);
      
      // Calculate metrics
      const metrics = this.calculateSocialMediaMetrics(posts);
      
      // Extract topics
      const topics = this.extractTopics(posts);
      
      // Calculate trends
      const trends = this.calculateSocialMediaTrends(posts);
      
      // Calculate influence scores
      const influencers = this.identifyKeyInfluencers(posts);
      
      return {
        ticker,
        posts,
        metrics,
        topics,
        trends,
        influencers,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error fetching social media analysis:', error);
      throw new Error('Failed to fetch social media analysis data');
    }
  }

  /**
   * Process social media posts for sentiment and metrics
   * @param rawPosts Raw social media posts from API
   * @returns Processed social media posts with sentiment
   */
  private processSocialMediaPosts(rawPosts: any[]): SocialMediaPost[] {
    return rawPosts.map(post => {
      const { score, classification } = this.analyzeSentiment(post.content);
      
      return {
        id: post.id,
        platform: post.platform as SocialMediaSource,
        author: post.author,
        authorFollowers: post.authorFollowers || 0,
        content: post.content,
        timestamp: new Date(post.timestamp),
        likes: post.likes || 0,
        comments: post.comments || 0,
        shares: post.shares || 0,
        sentimentScore: score,
        sentimentClassification: classification,
        url: post.url || '',
        hashtags: post.hashtags || [],
        mentions: post.mentions || [],
        isVerified: post.isVerified || false
      };
    });
  }

  /**
   * Calculate social media metrics from processed posts
   * @param posts Processed social media posts
   * @returns Social media metrics
   */
  private calculateSocialMediaMetrics(posts: SocialMediaPost[]): SocialMediaMetrics {
    if (posts.length === 0) {
      return {
        postCount: 0,
        uniqueAuthors: 0,
        totalEngagement: 0,
        averageSentiment: 0,
        sentimentDistribution: {
          positive: 0,
          neutral: 0,
          negative: 0
        },
        platformDistribution: {},
        postFrequency: {
          hourly: [],
          daily: []
        }
      };
    }
    
    // Calculate basic metrics
    const uniqueAuthors = new Set(posts.map(post => post.author)).size;
    
    const totalEngagement = posts.reduce((sum, post) => {
      return sum + post.likes + post.comments + post.shares;
    }, 0);
    
    const averageSentiment = posts.reduce((sum, post) => {
      return sum + post.sentimentScore;
    }, 0) / posts.length;
    
    // Calculate sentiment distribution
    const sentimentCounts = {
      positive: 0,
      neutral: 0,
      negative: 0
    };
    
    posts.forEach(post => {
      if (post.sentimentClassification === 'positive') sentimentCounts.positive++;
      else if (post.sentimentClassification === 'negative') sentimentCounts.negative++;
      else sentimentCounts.neutral++;
    });
    
    const sentimentDistribution = {
      positive: sentimentCounts.positive / posts.length,
      neutral: sentimentCounts.neutral / posts.length,
      negative: sentimentCounts.negative / posts.length
    };
    
    // Calculate platform distribution
    const platformCounts: { [key: string]: number } = {};
    posts.forEach(post => {
      if (!platformCounts[post.platform]) {
        platformCounts[post.platform] = 0;
      }
      platformCounts[post.platform]++;
    });
    
    const platformDistribution: { [key: string]: number } = {};
    Object.entries(platformCounts).forEach(([platform, count]) => {
      platformDistribution[platform] = count / posts.length;
    });
    
    // Calculate post frequency
    const hourlyFrequency: { hour: number; count: number }[] = [];
    const dailyFrequency: { date: string; count: number }[] = [];
    
    // Group posts by hour
    const hourCounts: { [hour: number]: number } = {};
    posts.forEach(post => {
      const hour = post.timestamp.getUTCHours();
      if (!hourCounts[hour]) hourCounts[hour] = 0;
      hourCounts[hour]++;
    });
    
    for (let i = 0; i < 24; i++) {
      hourlyFrequency.push({
        hour: i,
        count: hourCounts[i] || 0
      });
    }
    
    // Group posts by day
    const dayCounts: { [day: string]: number } = {};
    posts.forEach(post => {
      const date = post.timestamp.toISOString().split('T')[0];
      if (!dayCounts[date]) dayCounts[date] = 0;
      dayCounts[date]++;
    });
    
    Object.entries(dayCounts).forEach(([date, count]) => {
      dailyFrequency.push({ date, count });
    });
    
    // Sort daily frequency by date
    dailyFrequency.sort((a, b) => a.date.localeCompare(b.date));
    
    return {
      postCount: posts.length,
      uniqueAuthors,
      totalEngagement,
      averageSentiment,
      sentimentDistribution,
      platformDistribution,
      postFrequency: {
        hourly: hourlyFrequency,
        daily: dailyFrequency
      }
    };
  }

  /**
   * Extract topics from social media posts
   * @param posts Processed social media posts
   * @returns Topic distribution
   */
  private extractTopics(posts: SocialMediaPost[]): TopicDistribution[] {
    // In a real implementation, this would use topic modeling like LDA
    // For this example, we'll use a simplified approach with keyword counting
    
    if (posts.length === 0) {
      return [];
    }
    
    // Define topic keywords
    const topicKeywords: { [topic: string]: string[] } = {
      'Price Movement': ['price', 'up', 'down', 'increase', 'decrease', 'gain', 'loss', 'rally', 'crash', 'dip', 'moon'],
      'Earnings': ['earnings', 'eps', 'revenue', 'profit', 'loss', 'quarter', 'beat', 'miss', 'guidance'],
      'Technical Analysis': ['chart', 'pattern', 'support', 'resistance', 'trend', 'breakout', 'breakdown', 'indicator', 'oversold', 'overbought'],
      'Fundamentals': ['valuation', 'pe', 'ratio', 'undervalued', 'overvalued', 'fundamental', 'balance', 'sheet', 'cash', 'debt'],
      'News & Events': ['news', 'announcement', 'release', 'launch', 'event', 'conference', 'presentation', 'report'],
      'Management': ['ceo', 'cfo', 'executive', 'management', 'board', 'director', 'leadership'],
      'Competition': ['competitor', 'competition', 'market', 'share', 'industry', 'rival', 'alternative'],
      'Regulation': ['regulation', 'regulatory', 'compliance', 'legal', 'lawsuit', 'sec', 'government', 'approval'],
      'Sentiment': ['bullish', 'bearish', 'optimistic', 'pessimistic', 'confidence', 'fear', 'greed', 'hype', 'fud']
    };
    
    // Count keyword occurrences for each topic
    const topicCounts: { [topic: string]: number } = {};
    Object.keys(topicKeywords).forEach(topic => {
      topicCounts[topic] = 0;
    });
    
    posts.forEach(post => {
      const content = post.content.toLowerCase();
      
      Object.entries(topicKeywords).forEach(([topic, keywords]) => {
        keywords.forEach(keyword => {
          if (content.includes(keyword.toLowerCase())) {
            topicCounts[topic]++;
          }
        });
      });
    });
    
    // Calculate topic distribution
    const totalMentions = Object.values(topicCounts).reduce((sum, count) => sum + count, 0);
    
    const topicDistribution: TopicDistribution[] = Object.entries(topicCounts)
      .map(([topic, count]) => ({
        topic,
        frequency: count,
        percentage: totalMentions > 0 ? count / totalMentions : 0,
        keywords: topicKeywords[topic],
        sentimentByTopic: this.calculateSentimentByTopic(posts, topicKeywords[topic])
      }))
      .sort((a, b) => b.frequency - a.frequency);
    
    return topicDistribution;
  }

  /**
   * Calculate sentiment for a specific topic
   * @param posts Processed social media posts
   * @param keywords Keywords related to the topic
   * @returns Sentiment score for the topic
   */
  private calculateSentimentByTopic(posts: SocialMediaPost[], keywords: string[]): number {
    const topicPosts = posts.filter(post => {
      const content = post.content.toLowerCase();
      return keywords.some(keyword => content.includes(keyword.toLowerCase()));
    });
    
    if (topicPosts.length === 0) {
      return 0;
    }
    
    const totalSentiment = topicPosts.reduce((sum, post) => sum + post.sentimentScore, 0);
    return totalSentiment / topicPosts.length;
  }

  /**
   * Calculate social media trends from posts
   * @param posts Processed social media posts
   * @returns Social media trends
   */
  private calculateSocialMediaTrends(posts: SocialMediaPost[]): SocialMediaTrend[] {
    if (posts.length === 0) {
      return [];
    }
    
    // Sort posts by timestamp
    const sortedPosts = [...posts].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Group posts by day
    const postsByDay: { [day: string]: SocialMediaPost[] } = {};
    sortedPosts.forEach(post => {
      const date = post.timestamp.toISOString().split('T')[0];
      if (!postsByDay[date]) {
        postsByDay[date] = [];
      }
      postsByDay[date].push(post);
    });
    
    // Calculate daily metrics
    const dailyMetrics = Object.entries(postsByDay).map(([date, dayPosts]) => {
      const postCount = dayPosts.length;
      const averageSentiment = dayPosts.reduce((sum, post) => sum + post.sentimentScore, 0) / postCount;
      const engagement = dayPosts.reduce((sum, post) => sum + post.likes + post.comments + post.shares, 0);
      
      return {
        date,
        postCount,
        averageSentiment,
        engagement
      };
    });
    
    // Calculate trends
    const trends: SocialMediaTrend[] = [];
    
    // Post volume trend
    if (dailyMetrics.length >= 3) {
      const recentDays = dailyMetrics.slice(-3);
      const olderDays = dailyMetrics.slice(-6, -3);
      
      const recentAvgPosts = recentDays.reduce((sum, day) => sum + day.postCount, 0) / recentDays.length;
      const olderAvgPosts = olderDays.length > 0 
        ? olderDays.reduce((sum, day) => sum + day.postCount, 0) / olderDays.length 
        : recentAvgPosts;
      
      const postVolumeChange = ((recentAvgPosts - olderAvgPosts) / olderAvgPosts) * 100;
      
      trends.push({
        name: 'Post Volume',
        value: recentAvgPosts,
        changePercent: postVolumeChange,
        direction: postVolumeChange > 10 ? 'increasing' : (postVolumeChange < -10 ? 'decreasing' : 'stable'),
        description: `Post volume is ${Math.abs(postVolumeChange).toFixed(1)}% ${postVolumeChange > 0 ? 'higher' : 'lower'} than previous period`
      });
    }
    
    // Sentiment trend
    if (dailyMetrics.length >= 3) {
      const recentDays = dailyMetrics.slice(-3);
      const olderDays = dailyMetrics.slice(-6, -3);
      
      const recentAvgSentiment = recentDays.reduce((sum, day) => sum + day.averageSentiment, 0) / recentDays.length;
      const olderAvgSentiment = olderDays.length > 0 
        ? olderDays.reduce((sum, day) => sum + day.averageSentiment, 0) / olderDays.length 
        : 0;
      
      const sentimentChange = recentAvgSentiment - olderAvgSentiment;
      
      trends.push({
        name: 'Sentiment',
        value: recentAvgSentiment,
        changePercent: sentimentChange * 100, // Convert to percentage points
        direction: sentimentChange > 0.1 ? 'improving' : (sentimentChange < -0.1 ? 'deteriorating' : 'stable'),
        description: `Sentiment is ${Math.abs(sentimentChange).toFixed(2)} points ${sentimentChange > 0 ? 'higher' : 'lower'} than previous period`
      });
    }
    
    // Engagement trend
    if (dailyMetrics.length >= 3) {
      const recentDays = dailyMetrics.slice(-3);
      const olderDays = dailyMetrics.slice(-6, -3);
      
      const recentAvgEngagement = recentDays.reduce((sum, day) => sum + day.engagement, 0) / recentDays.length;
      const olderAvgEngagement = olderDays.length > 0 
        ? olderDays.reduce((sum, day) => sum + day.engagement, 0) / olderDays.length 
        : recentAvgEngagement;
      
      const engagementChange = ((recentAvgEngagement - olderAvgEngagement) / olderAvgEngagement) * 100;
      
      trends.push({
        name: 'Engagement',
        value: recentAvgEngagement,
        changePercent: engagementChange,
        direction: engagementChange > 15 ? 'increasing' : (engagementChange < -15 ? 'decreasing' : 'stable'),
        description: `Engagement is ${Math.abs(engagementChange).toFixed(1)}% ${engagementChange > 0 ? 'higher' : 'lower'} than previous period`
      });
    }
    
    return trends;
  }

  /**
   * Identify key influencers from social media posts
   * @param posts Processed social media posts
   * @returns Array of key influencers
   */
  private identifyKeyInfluencers(posts: SocialMediaPost[]): {
    author: string;
    platform: SocialMediaSource;
    followers: number;
    posts: number;
    averageEngagement: number;
    averageSentiment: number;
    isVerified: boolean;
  }[] {
    if (posts.length === 0) {
      return [];
    }
    
    // Group posts by author
    const postsByAuthor: { [author: string]: SocialMediaPost[] } = {};
    posts.forEach(post => {
      if (!postsByAuthor[post.author]) {
        postsByAuthor[post.author] = [];
      }
      postsByAuthor[post.author].push(post);
    });
    
    // Calculate metrics for each author
    const authorMetrics = Object.entries(postsByAuthor).map(([author, authorPosts]) => {
      const platform = authorPosts[0].platform;
      const followers = authorPosts[0].authorFollowers;
      const postCount = authorPosts.length;
      
      const totalEngagement = authorPosts.reduce((sum, post) => {
        return sum + post.likes + post.comments + post.shares;
      }, 0);
      
      const averageEngagement = totalEngagement / postCount;
      
      const totalSentiment = authorPosts.reduce((sum, post) => {
        return sum + post.sentimentScore;
      }, 0);
      
      const averageSentiment = totalSentiment / postCount;
      
      const isVerified = authorPosts[0].isVerified;
      
      return {
        author,
        platform,
        followers,
        posts: postCount,
        averageEngagement,
        averageSentiment,
        isVerified
      };
    });
    
    // Calculate influence score and sort by it
    const influencers = authorMetrics
      .map(metrics => {
        // Calculate influence score based on followers, engagement, and post count
        const followerScore = Math.min(metrics.followers / 10000, 1); // Cap at 10k followers
        const engagementScore = Math.min(metrics.averageEngagement / 100, 1); // Cap at 100 avg engagement
        const postCountScore = Math.min(metrics.posts / 5, 1); // Cap at 5 posts
        const verifiedBonus = metrics.isVerified ? 0.2 : 0;
        
        const influenceScore = (followerScore * 0.4) + (engagementScore * 0.4) + (postCountScore * 0.1) + verifiedBonus;
        
        return {
          ...metrics,
          influenceScore
        };
      })
      .filter(influencer => influencer.influenceScore > 0.2) // Filter out low-influence authors
      .sort((a, b) => b.influenceScore - a.influenceScore)
      .slice(0, 10) // Get top 10 influencers
      .map(({ influenceScore, ...rest }) => rest); // Remove influence score from result
    
    return influencers;
  }

  /**
   * Get trending cashtags/tickers from social media
   * @param platform Social media platform to analyze
   * @param count Number of trending tickers to return
   * @returns Promise with trending tickers
   */
  public async getTrendingTickers(
    platform: SocialMediaSource | 'all' = 'all',
    count: number = 10
  ): Promise<{
    ticker: string;
    mentionCount: number;
    sentiment: number;
    changePercent: number;
  }[]> {
    try {
      // Fetch trending tickers from API
      const response = await axios.get(`${this.baseUrl}/social/trending`, {
        headers: { 'X-API-KEY': this.apiKey },
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
   * @returns Promise with sentiment-price correlation data
   */
  public async getSentimentPriceCorrelation(
    ticker: string,
    platform: SocialMediaSource | 'all' = 'all',
    timeframe: number = 30
  ): Promise<{
    correlation: number;
    leadLag: number;
    dailyData: {
      date: string;
      sentiment: number;
      price: number;
      priceChange: number;
    }[];
  }> {
    try {
      // Fetch correlation data from API
      const response = await axios.get(`${this.baseUrl}/social/correlation/${ticker}`, {
        headers: { 'X-API-KEY': this.apiKey },
        params: {
          platform,
          timeframe
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching sentiment-price correlation:', error);
      throw new Error('Failed to fetch sentiment-price correlation data');
    }
  }
}

export default SocialMediaAnalysisService;