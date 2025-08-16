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
 * Mock news provider for development and testing
 */
export class MockNewsProvider implements INewsService {
  private static instance: MockNewsProvider;
  
  // Mock news articles
  private readonly mockArticles: NewsArticle[] = [];
  
  // Common stock symbols for realistic mock data
  private readonly commonStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
    { symbol: 'V', name: 'Visa Inc.' },
    { symbol: 'JNJ', name: 'Johnson & Johnson' }
  ];
  
  // News sources
  private readonly newsSources = [
    'Bloomberg', 'CNBC', 'Reuters', 'Wall Street Journal', 'Financial Times',
    'MarketWatch', 'Barron\'s', 'Investor\'s Business Daily', 'The Motley Fool', 'Seeking Alpha'
  ];
  
  // News categories
  private readonly newsCategories = [
    'business', 'technology', 'finance', 'markets', 'economy',
    'earnings', 'ipo', 'mergers', 'commodities', 'cryptocurrency'
  ];
  
  // Article titles and templates
  private readonly articleTemplates = [
    { title: '{COMPANY} Reports Strong Q{QUARTER} Earnings, Beats Expectations', sentiment: 'positive' },
    { title: '{COMPANY} Announces New {PRODUCT} Launch', sentiment: 'positive' },
    { title: '{COMPANY} Stock Surges After Analyst Upgrade', sentiment: 'positive' },
    { title: '{COMPANY} Expands into New Markets', sentiment: 'positive' },
    { title: '{COMPANY} CEO Optimistic About Future Growth', sentiment: 'positive' },
    { title: '{COMPANY} Increases Dividend by {NUMBER}%', sentiment: 'positive' },
    { title: '{COMPANY} Announces Share Buyback Program', sentiment: 'positive' },
    { title: '{COMPANY} Partners with {COMPANY2} for New Initiative', sentiment: 'positive' },
    { title: '{COMPANY} Misses Q{QUARTER} Earnings Expectations', sentiment: 'negative' },
    { title: '{COMPANY} Cuts Forecast Amid Market Uncertainty', sentiment: 'negative' },
    { title: '{COMPANY} Stock Falls After Analyst Downgrade', sentiment: 'negative' },
    { title: '{COMPANY} Faces Regulatory Scrutiny Over {ISSUE}', sentiment: 'negative' },
    { title: '{COMPANY} CEO Steps Down Amid Controversy', sentiment: 'negative' },
    { title: '{COMPANY} Announces Layoffs to Cut Costs', sentiment: 'negative' },
    { title: '{COMPANY} Delays Launch of New {PRODUCT}', sentiment: 'negative' },
    { title: '{COMPANY} Faces Increased Competition from {COMPANY2}', sentiment: 'negative' },
    { title: '{COMPANY} Reports Mixed Q{QUARTER} Results', sentiment: 'neutral' },
    { title: '{COMPANY} Maintains Guidance Despite Market Challenges', sentiment: 'neutral' },
    { title: '{COMPANY} Restructures Leadership Team', sentiment: 'neutral' },
    { title: '{COMPANY} to Present at Upcoming Investor Conference', sentiment: 'neutral' },
    { title: '{COMPANY} Announces New Board Member', sentiment: 'neutral' },
    { title: '{COMPANY} Opens New Headquarters in {CITY}', sentiment: 'neutral' },
    { title: '{COMPANY} Responds to Industry Trends', sentiment: 'neutral' },
    { title: 'Analysts Remain Divided on {COMPANY} Outlook', sentiment: 'neutral' }
  ];
  
  // Products for article templates
  private readonly products = [
    'Smartphone', 'Tablet', 'Laptop', 'Software', 'Service', 'Platform', 'App',
    'Cloud Solution', 'AI Tool', 'Device', 'Subscription Plan', 'Payment System'
  ];
  
  // Issues for article templates
  private readonly issues = [
    'Data Privacy', 'Antitrust', 'Labor Practices', 'Environmental Impact',
    'Product Safety', 'Tax Practices', 'Market Dominance', 'Consumer Protection'
  ];
  
  // Cities for article templates
  private readonly cities = [
    'New York', 'San Francisco', 'Seattle', 'Boston', 'Chicago', 'Austin',
    'Los Angeles', 'Denver', 'Atlanta', 'Dallas', 'Miami', 'London', 'Tokyo'
  ];

  /**
   * Constructor
   */
  private constructor() {
    // Generate mock articles
    this.generateMockArticles();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): MockNewsProvider {
    if (!MockNewsProvider.instance) {
      MockNewsProvider.instance = new MockNewsProvider();
    }
    return MockNewsProvider.instance;
  }

  /**
   * Generate mock articles
   */
  private generateMockArticles(): void {
    // Generate 200 mock articles
    for (let i = 0; i < 200; i++) {
      // Select a random stock
      const stockIndex = Math.floor(Math.random() * this.commonStocks.length);
      const stock = this.commonStocks[stockIndex];
      
      // Select a random template
      const templateIndex = Math.floor(Math.random() * this.articleTemplates.length);
      const template = this.articleTemplates[templateIndex];
      
      // Select a random second company for partner articles
      let stock2 = stock;
      while (stock2.symbol === stock.symbol) {
        const stock2Index = Math.floor(Math.random() * this.commonStocks.length);
        stock2 = this.commonStocks[stock2Index];
      }
      
      // Generate a random date within the last 30 days
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      // Generate a random quarter
      const quarter = Math.floor(Math.random() * 4) + 1;
      
      // Generate a random number for percentages
      const number = Math.floor(Math.random() * 20) + 5;
      
      // Select a random product
      const product = this.products[Math.floor(Math.random() * this.products.length)];
      
      // Select a random issue
      const issue = this.issues[Math.floor(Math.random() * this.issues.length)];
      
      // Select a random city
      const city = this.cities[Math.floor(Math.random() * this.cities.length)];
      
      // Generate the title
      let title = template.title
        .replace('{COMPANY}', stock.name)
        .replace('{COMPANY2}', stock2.name)
        .replace('{QUARTER}', quarter.toString())
        .replace('{NUMBER}', number.toString())
        .replace('{PRODUCT}', product)
        .replace('{ISSUE}', issue)
        .replace('{CITY}', city);
      
      // Generate a summary
      const summary = `${title}. This is a mock news article summary for ${stock.name}.`;
      
      // Generate content
      const content = `${summary} Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`;
      
      // Select a random source
      const source = this.newsSources[Math.floor(Math.random() * this.newsSources.length)];
      
      // Select random categories (1-3)
      const numCategories = Math.floor(Math.random() * 3) + 1;
      const categories: string[] = [];
      for (let j = 0; j < numCategories; j++) {
        const category = this.newsCategories[Math.floor(Math.random() * this.newsCategories.length)];
        if (!categories.includes(category)) {
          categories.push(category);
        }
      }
      
      // Generate sentiment score based on template sentiment
      let sentimentScore = 0;
      if (template.sentiment === 'positive') {
        sentimentScore = 0.3 + Math.random() * 0.7; // 0.3 to 1.0
      } else if (template.sentiment === 'negative') {
        sentimentScore = -1.0 + Math.random() * 0.7; // -1.0 to -0.3
      } else {
        sentimentScore = -0.3 + Math.random() * 0.6; // -0.3 to 0.3
      }
      
      // Create the article
      const article: NewsArticle = {
        id: uuidv4(),
        title,
        summary,
        content,
        url: `https://example.com/news/${uuidv4()}`,
        source,
        publishedAt: date.toISOString(),
        author: this.generateRandomName(),
        imageUrl: `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/800/400`,
        categories,
        symbols: [stock.symbol],
        sentiment: {
          score: sentimentScore,
          label: template.sentiment as 'negative' | 'neutral' | 'positive'
        }
      };
      
      this.mockArticles.push(article);
    }
    
    // Sort articles by date (newest first)
    this.mockArticles.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }

  /**
   * Search for news articles
   * @param params - Search parameters
   * @returns Promise with news search response
   */
  public async searchNews(params: NewsSearchParams): Promise<NewsSearchResponse> {
    // Filter articles based on search parameters
    let filteredArticles = [...this.mockArticles];
    
    // Filter by query
    if (params.query) {
      const query = params.query.toLowerCase();
      filteredArticles = filteredArticles.filter(article => 
        article.title.toLowerCase().includes(query) || 
        article.summary.toLowerCase().includes(query)
      );
    }
    
    // Filter by symbols
    if (params.symbols && params.symbols.length > 0) {
      filteredArticles = filteredArticles.filter(article => 
        article.symbols?.some(symbol => params.symbols!.includes(symbol))
      );
    }
    
    // Filter by categories
    if (params.categories && params.categories.length > 0) {
      filteredArticles = filteredArticles.filter(article => 
        article.categories?.some(category => params.categories!.includes(category))
      );
    }
    
    // Filter by sources
    if (params.sources && params.sources.length > 0) {
      filteredArticles = filteredArticles.filter(article => 
        params.sources!.includes(article.source)
      );
    }
    
    // Filter by date range
    if (params.from) {
      const fromDate = new Date(params.from);
      filteredArticles = filteredArticles.filter(article => 
        new Date(article.publishedAt) >= fromDate
      );
    }
    
    if (params.to) {
      const toDate = new Date(params.to);
      filteredArticles = filteredArticles.filter(article => 
        new Date(article.publishedAt) <= toDate
      );
    }
    
    // Sort articles
    if (params.sortBy) {
      switch (params.sortBy) {
        case 'relevancy':
          // For mock data, we'll just keep the default order
          break;
        case 'popularity':
          // For mock data, we'll sort by a random "popularity" factor
          filteredArticles.sort((a, b) => this.hashCode(b.id) - this.hashCode(a.id));
          break;
        case 'publishedAt':
          filteredArticles.sort((a, b) => 
            new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
          );
          break;
      }
    }
    
    // Apply pagination
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedArticles = filteredArticles.slice(startIndex, endIndex);
    
    return {
      articles: paginatedArticles,
      totalResults: filteredArticles.length,
      page,
      pageSize
    };
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
    const params: NewsSearchParams = {
      symbols: [symbol],
      pageSize: limit,
      sortBy: 'publishedAt',
      from,
      to
    };
    
    const response = await this.searchNews(params);
    return response.articles;
  }

  /**
   * Get top news articles
   * @param category - News category
   * @param limit - Maximum number of articles to return
   * @returns Promise with news articles
   */
  public async getTopNews(category?: string, limit: number = 10): Promise<NewsArticle[]> {
    const params: NewsSearchParams = {
      pageSize: limit,
      sortBy: 'publishedAt'
    };
    
    if (category) {
      params.categories = [category];
    }
    
    const response = await this.searchNews(params);
    return response.articles;
  }

  /**
   * Get sentiment analysis for a symbol
   * @param symbol - Stock symbol
   * @returns Promise with sentiment analysis
   */
  public async getSentiment(symbol: string): Promise<SentimentAnalysis> {
    // Get news for this symbol
    const news = await this.getSymbolNews(symbol, 20);
    
    // Calculate average sentiment score
    let totalScore = 0;
    let newsWithSentiment = 0;
    
    for (const article of news) {
      if (article.sentiment) {
        totalScore += article.sentiment.score;
        newsWithSentiment++;
      }
    }
    
    const newsScore = newsWithSentiment > 0 ? totalScore / newsWithSentiment : 0;
    
    // Generate a social score that's somewhat correlated with the news score
    const socialScore = newsScore * 0.7 + (Math.random() * 0.6 - 0.3);
    
    // Calculate overall score as weighted average
    const overallScore = (newsScore * news.length + socialScore * 50) / (news.length + 50);
    
    // Determine label based on score
    let overallLabel: 'negative' | 'neutral' | 'positive';
    if (overallScore < -0.2) overallLabel = 'negative';
    else if (overallScore > 0.2) overallLabel = 'positive';
    else overallLabel = 'neutral';
    
    return {
      symbol,
      overallScore,
      overallLabel,
      newsCount: news.length,
      socialCount: 50, // Mock value
      newsScore,
      socialScore,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get sentiment trend for a symbol
   * @param symbol - Stock symbol
   * @param days - Number of days to look back
   * @returns Promise with sentiment trend data
   */
  public async getSentimentTrend(symbol: string, days: number = 30): Promise<SentimentTrendResponse> {
    const data: SentimentTrendPoint[] = [];
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
  }

  /**
   * Generate a random name
   * @returns Random name
   */
  private generateRandomName(): string {
    const firstNames = ['John', 'Sarah', 'Michael', 'Emma', 'David', 'Lisa', 'Robert', 'Jennifer', 'William', 'Patricia'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return `${firstName} ${lastName}`;
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
export const mockNewsProvider = MockNewsProvider.getInstance();