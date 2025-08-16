/**
 * Data quality score interface
 */
export interface DataQualityScore {
  completeness: number;  // 0-100% of required fields present
  freshness: number;     // 0-100% based on data age
  accuracy: number;      // 0-100% estimated accuracy
  overall: number;       // Weighted average of all scores
}

/**
 * Data source information
 */
export interface DataSourceInfo {
  provider: string;      // Provider name
  timestamp: number;     // When the data was retrieved
  qualityScore: DataQualityScore; // Quality score
}

/**
 * Normalized data interface
 */
export interface NormalizedData<T> {
  data: T;               // The normalized data
  sources: DataSourceInfo[]; // Sources used for this data
  lastUpdated: number;   // When the data was last updated
}

/**
 * Data normalization service for consistent data across providers
 */
export class DataNormalizer {
  /**
   * Normalize market quote data from different providers
   * @param quotes - Array of quotes from different providers
   * @returns Normalized quote
   */
  public static normalizeMarketQuote(quotes: any[]): NormalizedData<any> {
    if (!quotes || quotes.length === 0) {
      throw new Error('No quotes provided for normalization');
    }
    
    // Calculate quality scores for each quote
    const quotesWithScores = quotes.map(quote => ({
      quote,
      score: this.calculateQuoteQualityScore(quote)
    }));
    
    // Sort by quality score (highest first)
    quotesWithScores.sort((a, b) => b.score.overall - a.score.overall);
    
    // Use the highest quality quote as the base
    const baseQuote = quotesWithScores[0].quote;
    
    // Merge in missing data from other quotes
    const normalizedQuote = { ...baseQuote };
    
    // Fields to normalize
    const fields = [
      'symbol', 'price', 'change', 'changePercent', 'high', 'low', 
      'open', 'previousClose', 'volume', 'marketCap', 'peRatio'
    ];
    
    // Fill in missing fields from other quotes
    for (const field of fields) {
      if (normalizedQuote[field] === undefined || normalizedQuote[field] === null) {
        // Find the first quote with this field
        const quoteWithField = quotesWithScores.find(q => 
          q.quote[field] !== undefined && q.quote[field] !== null
        );
        
        if (quoteWithField) {
          normalizedQuote[field] = quoteWithField.quote[field];
        }
      }
    }
    
    // Create source information
    const sources = quotesWithScores.map(q => ({
      provider: q.quote.provider,
      timestamp: q.quote.timestamp || Date.now(),
      qualityScore: q.score
    }));
    
    return {
      data: normalizedQuote,
      sources,
      lastUpdated: Date.now()
    };
  }
  
  /**
   * Normalize financial statement data from different providers
   * @param statements - Array of financial statements from different providers
   * @returns Normalized financial statement
   */
  public static normalizeFinancialStatement(statements: any[]): NormalizedData<any> {
    if (!statements || statements.length === 0) {
      throw new Error('No statements provided for normalization');
    }
    
    // Calculate quality scores for each statement
    const statementsWithScores = statements.map(statement => ({
      statement,
      score: this.calculateStatementQualityScore(statement)
    }));
    
    // Sort by quality score (highest first)
    statementsWithScores.sort((a, b) => b.score.overall - a.score.overall);
    
    // Use the highest quality statement as the base
    const baseStatement = statementsWithScores[0].statement;
    
    // Create a deep copy to avoid modifying the original
    const normalizedStatement = JSON.parse(JSON.stringify(baseStatement));
    
    // Create source information
    const sources = statementsWithScores.map(s => ({
      provider: s.statement.provider,
      timestamp: s.statement.timestamp || Date.now(),
      qualityScore: s.score
    }));
    
    return {
      data: normalizedStatement,
      sources,
      lastUpdated: Date.now()
    };
  }
  
  /**
   * Normalize company profile data from different providers
   * @param profiles - Array of company profiles from different providers
   * @returns Normalized company profile
   */
  public static normalizeCompanyProfile(profiles: any[]): NormalizedData<any> {
    if (!profiles || profiles.length === 0) {
      throw new Error('No profiles provided for normalization');
    }
    
    // Calculate quality scores for each profile
    const profilesWithScores = profiles.map(profile => ({
      profile,
      score: this.calculateProfileQualityScore(profile)
    }));
    
    // Sort by quality score (highest first)
    profilesWithScores.sort((a, b) => b.score.overall - a.score.overall);
    
    // Use the highest quality profile as the base
    const baseProfile = profilesWithScores[0].profile;
    
    // Create a deep copy to avoid modifying the original
    const normalizedProfile = JSON.parse(JSON.stringify(baseProfile));
    
    // Fields to normalize
    const fields = [
      'symbol', 'name', 'exchange', 'industry', 'sector', 'description',
      'website', 'employees', 'ceo', 'address', 'city', 'state', 'zip', 'country', 'phone'
    ];
    
    // Fill in missing fields from other profiles
    for (const field of fields) {
      if (!normalizedProfile[field]) {
        // Find the first profile with this field
        const profileWithField = profilesWithScores.find(p => p.profile[field]);
        
        if (profileWithField) {
          normalizedProfile[field] = profileWithField.profile[field];
        }
      }
    }
    
    // Create source information
    const sources = profilesWithScores.map(p => ({
      provider: p.profile.provider,
      timestamp: p.profile.timestamp || Date.now(),
      qualityScore: p.score
    }));
    
    return {
      data: normalizedProfile,
      sources,
      lastUpdated: Date.now()
    };
  }
  
  /**
   * Normalize news articles from different providers
   * @param articles - Array of news articles from different providers
   * @returns Normalized news articles
   */
  public static normalizeNewsArticles(articles: any[]): NormalizedData<any[]> {
    if (!articles || articles.length === 0) {
      return {
        data: [],
        sources: [],
        lastUpdated: Date.now()
      };
    }
    
    // Group articles by URL to avoid duplicates
    const articlesByUrl = new Map<string, any[]>();
    
    for (const article of articles) {
      const url = article.url || '';
      if (!articlesByUrl.has(url)) {
        articlesByUrl.set(url, []);
      }
      articlesByUrl.get(url)!.push(article);
    }
    
    // Normalize each group of articles
    const normalizedArticles: any[] = [];
    const sources: DataSourceInfo[] = [];
    
    for (const [url, articleGroup] of articlesByUrl.entries()) {
      // Skip empty URLs
      if (!url) continue;
      
      // Calculate quality scores for each article
      const articlesWithScores = articleGroup.map(article => ({
        article,
        score: this.calculateArticleQualityScore(article)
      }));
      
      // Sort by quality score (highest first)
      articlesWithScores.sort((a, b) => b.score.overall - a.score.overall);
      
      // Use the highest quality article as the base
      const baseArticle = articlesWithScores[0].article;
      
      // Create a normalized article
      const normalizedArticle = {
        url,
        title: baseArticle.title,
        description: baseArticle.description || articlesWithScores.find(a => a.article.description)?.article.description,
        source: baseArticle.source,
        publishedAt: baseArticle.publishedAt || baseArticle.published || baseArticle.date,
        author: baseArticle.author,
        content: baseArticle.content || articlesWithScores.find(a => a.article.content)?.article.content,
        imageUrl: baseArticle.imageUrl || baseArticle.image || articlesWithScores.find(a => a.article.imageUrl || a.article.image)?.article.imageUrl || articlesWithScores.find(a => a.article.imageUrl || a.article.image)?.article.image,
        sentiment: baseArticle.sentiment || articlesWithScores.find(a => a.article.sentiment)?.article.sentiment,
        symbols: baseArticle.symbols || baseArticle.tickers || articlesWithScores.find(a => a.article.symbols || a.article.tickers)?.article.symbols || articlesWithScores.find(a => a.article.symbols || a.article.tickers)?.article.tickers || [],
        provider: baseArticle.provider
      };
      
      normalizedArticles.push(normalizedArticle);
      
      // Add source information
      articlesWithScores.forEach(a => {
        sources.push({
          provider: a.article.provider,
          timestamp: a.article.timestamp || Date.now(),
          qualityScore: a.score
        });
      });
    }
    
    // Sort articles by published date (newest first)
    normalizedArticles.sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return dateB - dateA;
    });
    
    return {
      data: normalizedArticles,
      sources,
      lastUpdated: Date.now()
    };
  }
  
  /**
   * Reconcile conflicting data from different providers
   * @param values - Array of values from different providers
   * @param weights - Optional weights for each provider
   * @returns Reconciled value
   */
  public static reconcileValues(values: number[], weights?: number[]): number {
    if (!values || values.length === 0) {
      return 0;
    }
    
    if (values.length === 1) {
      return values[0];
    }
    
    // Filter out null and undefined values
    const validValues = values.filter(v => v !== null && v !== undefined);
    if (validValues.length === 0) {
      return 0;
    }
    
    // If weights are provided, use weighted average
    if (weights && weights.length === validValues.length) {
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      const weightedSum = validValues.reduce((sum, v, i) => sum + v * weights[i], 0);
      return weightedSum / totalWeight;
    }
    
    // Otherwise, use median to avoid outliers
    const sortedValues = [...validValues].sort((a, b) => a - b);
    const middle = Math.floor(sortedValues.length / 2);
    
    if (sortedValues.length % 2 === 0) {
      return (sortedValues[middle - 1] + sortedValues[middle]) / 2;
    } else {
      return sortedValues[middle];
    }
  }
  
  /**
   * Calculate quality score for a market quote
   * @param quote - Market quote
   * @returns Quality score
   */
  private static calculateQuoteQualityScore(quote: any): DataQualityScore {
    // Required fields for a complete quote
    const requiredFields = [
      'symbol', 'price', 'change', 'changePercent', 'high', 'low', 
      'open', 'previousClose', 'volume'
    ];
    
    // Calculate completeness
    const presentFields = requiredFields.filter(field => 
      quote[field] !== undefined && quote[field] !== null
    ).length;
    const completeness = (presentFields / requiredFields.length) * 100;
    
    // Calculate freshness
    const now = Date.now();
    const timestamp = quote.timestamp || now;
    const ageInMinutes = (now - timestamp) / (1000 * 60);
    const freshness = Math.max(0, 100 - (ageInMinutes / 15) * 100); // 15 minutes = 0% fresh
    
    // Calculate accuracy (placeholder - in a real system, this would be more sophisticated)
    const accuracy = 80; // Default accuracy score
    
    // Calculate overall score (weighted average)
    const overall = (completeness * 0.4) + (freshness * 0.4) + (accuracy * 0.2);
    
    return {
      completeness,
      freshness,
      accuracy,
      overall
    };
  }
  
  /**
   * Calculate quality score for a financial statement
   * @param statement - Financial statement
   * @returns Quality score
   */
  private static calculateStatementQualityScore(statement: any): DataQualityScore {
    // Required fields for a complete statement
    const requiredFields = [
      'fiscalDate', 'reportDate', 'period', 'revenue', 'costOfRevenue',
      'grossProfit', 'operatingExpense', 'operatingIncome', 'netIncome'
    ];
    
    // Calculate completeness
    const presentFields = requiredFields.filter(field => 
      statement[field] !== undefined && statement[field] !== null
    ).length;
    const completeness = (presentFields / requiredFields.length) * 100;
    
    // Calculate freshness based on reportDate
    const now = Date.now();
    const reportDate = statement.reportDate ? new Date(statement.reportDate).getTime() : now;
    const ageInDays = (now - reportDate) / (1000 * 60 * 60 * 24);
    const freshness = Math.max(0, 100 - (ageInDays / 90) * 100); // 90 days = 0% fresh
    
    // Calculate accuracy (placeholder)
    const accuracy = 90; // Financial statements are generally accurate
    
    // Calculate overall score (weighted average)
    const overall = (completeness * 0.5) + (freshness * 0.3) + (accuracy * 0.2);
    
    return {
      completeness,
      freshness,
      accuracy,
      overall
    };
  }
  
  /**
   * Calculate quality score for a company profile
   * @param profile - Company profile
   * @returns Quality score
   */
  private static calculateProfileQualityScore(profile: any): DataQualityScore {
    // Required fields for a complete profile
    const requiredFields = [
      'symbol', 'name', 'exchange', 'industry', 'sector', 'description',
      'website', 'employees', 'ceo'
    ];
    
    // Calculate completeness
    const presentFields = requiredFields.filter(field => 
      profile[field] !== undefined && profile[field] !== null && profile[field] !== ''
    ).length;
    const completeness = (presentFields / requiredFields.length) * 100;
    
    // Calculate freshness (profiles don't change often)
    const freshness = 90; // Default freshness for profiles
    
    // Calculate accuracy (placeholder)
    const accuracy = 85; // Default accuracy score
    
    // Calculate overall score (weighted average)
    const overall = (completeness * 0.6) + (freshness * 0.2) + (accuracy * 0.2);
    
    return {
      completeness,
      freshness,
      accuracy,
      overall
    };
  }
  
  /**
   * Calculate quality score for a news article
   * @param article - News article
   * @returns Quality score
   */
  private static calculateArticleQualityScore(article: any): DataQualityScore {
    // Required fields for a complete article
    const requiredFields = [
      'title', 'description', 'url', 'source', 'publishedAt'
    ];
    
    // Calculate completeness
    const presentFields = requiredFields.filter(field => {
      const value = article[field] || article.published || article.date;
      return value !== undefined && value !== null && value !== '';
    }).length;
    const completeness = (presentFields / requiredFields.length) * 100;
    
    // Calculate freshness based on publishedAt
    const now = Date.now();
    const publishedAt = article.publishedAt || article.published || article.date;
    const publishedTime = publishedAt ? new Date(publishedAt).getTime() : now;
    const ageInHours = (now - publishedTime) / (1000 * 60 * 60);
    const freshness = Math.max(0, 100 - (ageInHours / 24) * 100); // 24 hours = 0% fresh
    
    // Calculate accuracy based on source reputation (placeholder)
    const accuracy = 75; // Default accuracy score
    
    // Calculate overall score (weighted average)
    const overall = (completeness * 0.4) + (freshness * 0.4) + (accuracy * 0.2);
    
    return {
      completeness,
      freshness,
      accuracy,
      overall
    };
  }
}