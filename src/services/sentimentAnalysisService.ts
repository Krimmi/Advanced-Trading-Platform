/**
 * Sentiment Analysis Service
 * 
 * This service provides functionality for analyzing sentiment in financial text data
 * including news articles, social media posts, earnings call transcripts, and SEC filings.
 */

import axios from 'axios';
import * as nlp from 'natural';
import { SentimentAnalysisResult, SentimentSource, SentimentTrend, EntitySentiment } from '../types/sentimentTypes';

export class SentimentAnalysisService {
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
      'margin compression': -3
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
   * Get sentiment analysis for news articles related to a ticker
   * @param ticker Stock ticker symbol
   * @param startDate Optional start date for news articles
   * @param endDate Optional end date for news articles
   * @returns Promise with sentiment analysis results
   */
  public async getNewsSentiment(
    ticker: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<SentimentAnalysisResult> {
    try {
      // Fetch news articles from API
      const response = await axios.get(`${this.baseUrl}/news/${ticker}`, {
        headers: { 'X-API-KEY': this.apiKey },
        params: {
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString()
        }
      });
      
      const articles = response.data;
      
      // Process each article for sentiment
      const sentiments = articles.map((article: any) => {
        const { score, classification } = this.analyzeSentiment(article.title + ' ' + article.summary);
        return {
          id: article.id,
          date: new Date(article.publishedDate),
          source: article.source,
          title: article.title,
          url: article.url,
          score,
          classification
        };
      });
      
      // Calculate aggregate sentiment
      const aggregateScore = sentiments.reduce((sum: number, item: any) => sum + item.score, 0) / sentiments.length;
      let aggregateClassification = 'neutral';
      if (aggregateScore > 0.2) aggregateClassification = 'positive';
      else if (aggregateScore < -0.2) aggregateClassification = 'negative';
      
      // Calculate sentiment trend
      const trend = this.calculateSentimentTrend(sentiments);
      
      return {
        ticker,
        source: SentimentSource.NEWS,
        sentimentItems: sentiments,
        aggregateScore,
        aggregateClassification,
        trend,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error fetching news sentiment:', error);
      throw new Error('Failed to fetch news sentiment data');
    }
  }

  /**
   * Get sentiment analysis for social media posts related to a ticker
   * @param ticker Stock ticker symbol
   * @param platform Social media platform (twitter, reddit, stocktwits)
   * @param startDate Optional start date for posts
   * @param endDate Optional end date for posts
   * @returns Promise with sentiment analysis results
   */
  public async getSocialMediaSentiment(
    ticker: string,
    platform: 'twitter' | 'reddit' | 'stocktwits' | 'all' = 'all',
    startDate?: Date,
    endDate?: Date
  ): Promise<SentimentAnalysisResult> {
    try {
      // Fetch social media posts from API
      const response = await axios.get(`${this.baseUrl}/social/${ticker}`, {
        headers: { 'X-API-KEY': this.apiKey },
        params: {
          platform,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString()
        }
      });
      
      const posts = response.data;
      
      // Process each post for sentiment
      const sentiments = posts.map((post: any) => {
        const { score, classification } = this.analyzeSentiment(post.content);
        return {
          id: post.id,
          date: new Date(post.createdAt),
          platform: post.platform,
          author: post.author,
          content: post.content,
          url: post.url,
          score,
          classification
        };
      });
      
      // Calculate aggregate sentiment
      const aggregateScore = sentiments.reduce((sum: number, item: any) => sum + item.score, 0) / sentiments.length;
      let aggregateClassification = 'neutral';
      if (aggregateScore > 0.2) aggregateClassification = 'positive';
      else if (aggregateScore < -0.2) aggregateClassification = 'negative';
      
      // Calculate sentiment trend
      const trend = this.calculateSentimentTrend(sentiments);
      
      return {
        ticker,
        source: SentimentSource.SOCIAL_MEDIA,
        sentimentItems: sentiments,
        aggregateScore,
        aggregateClassification,
        trend,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error fetching social media sentiment:', error);
      throw new Error('Failed to fetch social media sentiment data');
    }
  }

  /**
   * Get sentiment analysis for earnings call transcripts
   * @param ticker Stock ticker symbol
   * @param quarters Number of past quarters to analyze
   * @returns Promise with sentiment analysis results
   */
  public async getEarningsCallSentiment(
    ticker: string,
    quarters: number = 4
  ): Promise<SentimentAnalysisResult> {
    try {
      // Fetch earnings call transcripts from API
      const response = await axios.get(`${this.baseUrl}/earnings/transcripts/${ticker}`, {
        headers: { 'X-API-KEY': this.apiKey },
        params: { quarters }
      });
      
      const transcripts = response.data;
      
      // Process each transcript for sentiment
      const sentiments = transcripts.map((transcript: any) => {
        // Analyze different sections of the call separately
        const preparedRemarks = this.analyzeSentiment(transcript.preparedRemarks);
        const qa = this.analyzeSentiment(transcript.qa);
        
        // Calculate overall sentiment with more weight on Q&A section
        const overallScore = (preparedRemarks.score * 0.4) + (qa.score * 0.6);
        let overallClassification = 'neutral';
        if (overallScore > 0.2) overallClassification = 'positive';
        else if (overallScore < -0.2) overallClassification = 'negative';
        
        return {
          id: transcript.id,
          date: new Date(transcript.date),
          quarter: transcript.quarter,
          year: transcript.year,
          preparedRemarksScore: preparedRemarks.score,
          preparedRemarksClassification: preparedRemarks.classification,
          qaScore: qa.score,
          qaClassification: qa.classification,
          score: overallScore,
          classification: overallClassification
        };
      });
      
      // Calculate aggregate sentiment
      const aggregateScore = sentiments.reduce((sum: number, item: any) => sum + item.score, 0) / sentiments.length;
      let aggregateClassification = 'neutral';
      if (aggregateScore > 0.2) aggregateClassification = 'positive';
      else if (aggregateScore < -0.2) aggregateClassification = 'negative';
      
      // Calculate sentiment trend
      const trend = this.calculateSentimentTrend(sentiments);
      
      return {
        ticker,
        source: SentimentSource.EARNINGS_CALL,
        sentimentItems: sentiments,
        aggregateScore,
        aggregateClassification,
        trend,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error fetching earnings call sentiment:', error);
      throw new Error('Failed to fetch earnings call sentiment data');
    }
  }

  /**
   * Get sentiment analysis for SEC filings
   * @param ticker Stock ticker symbol
   * @param filingTypes Array of filing types to analyze (10-K, 10-Q, 8-K, etc.)
   * @param count Number of most recent filings to analyze
   * @returns Promise with sentiment analysis results
   */
  public async getSECFilingsSentiment(
    ticker: string,
    filingTypes: string[] = ['10-K', '10-Q', '8-K'],
    count: number = 10
  ): Promise<SentimentAnalysisResult> {
    try {
      // Fetch SEC filings from API
      const response = await axios.get(`${this.baseUrl}/sec/filings/${ticker}`, {
        headers: { 'X-API-KEY': this.apiKey },
        params: { 
          filingTypes: filingTypes.join(','),
          count
        }
      });
      
      const filings = response.data;
      
      // Process each filing for sentiment
      const sentiments = filings.map((filing: any) => {
        // For 10-K and 10-Q, analyze MD&A section separately
        let mdaScore = 0;
        let mdaClassification = 'neutral';
        let riskFactorsScore = 0;
        let riskFactorsClassification = 'neutral';
        
        if (filing.type === '10-K' || filing.type === '10-Q') {
          if (filing.sections?.mda) {
            const mdaAnalysis = this.analyzeSentiment(filing.sections.mda);
            mdaScore = mdaAnalysis.score;
            mdaClassification = mdaAnalysis.classification;
          }
          
          if (filing.sections?.riskFactors) {
            const riskAnalysis = this.analyzeSentiment(filing.sections.riskFactors);
            riskFactorsScore = riskAnalysis.score;
            riskFactorsClassification = riskAnalysis.classification;
          }
        }
        
        // Analyze full text
        const fullTextAnalysis = this.analyzeSentiment(filing.fullText || '');
        
        // Calculate overall sentiment with section weights
        let overallScore = fullTextAnalysis.score;
        if (filing.type === '10-K' || filing.type === '10-Q') {
          overallScore = (mdaScore * 0.5) + (riskFactorsScore * 0.3) + (fullTextAnalysis.score * 0.2);
        }
        
        let overallClassification = 'neutral';
        if (overallScore > 0.2) overallClassification = 'positive';
        else if (overallScore < -0.2) overallClassification = 'negative';
        
        return {
          id: filing.id,
          date: new Date(filing.filingDate),
          type: filing.type,
          url: filing.url,
          mdaScore,
          mdaClassification,
          riskFactorsScore,
          riskFactorsClassification,
          fullTextScore: fullTextAnalysis.score,
          fullTextClassification: fullTextAnalysis.classification,
          score: overallScore,
          classification: overallClassification
        };
      });
      
      // Calculate aggregate sentiment
      const aggregateScore = sentiments.reduce((sum: number, item: any) => sum + item.score, 0) / sentiments.length;
      let aggregateClassification = 'neutral';
      if (aggregateScore > 0.2) aggregateClassification = 'positive';
      else if (aggregateScore < -0.2) aggregateClassification = 'negative';
      
      // Calculate sentiment trend
      const trend = this.calculateSentimentTrend(sentiments);
      
      return {
        ticker,
        source: SentimentSource.SEC_FILING,
        sentimentItems: sentiments,
        aggregateScore,
        aggregateClassification,
        trend,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error fetching SEC filings sentiment:', error);
      throw new Error('Failed to fetch SEC filings sentiment data');
    }
  }

  /**
   * Get aggregated sentiment from all sources
   * @param ticker Stock ticker symbol
   * @returns Promise with aggregated sentiment analysis results
   */
  public async getAggregateSentiment(ticker: string): Promise<{
    ticker: string;
    sources: SentimentAnalysisResult[];
    overallScore: number;
    overallClassification: string;
    entitySentiment: EntitySentiment[];
    timestamp: Date;
  }> {
    try {
      // Fetch sentiment from all sources
      const [newsSentiment, socialMediaSentiment, earningsCallSentiment, secFilingsSentiment] = await Promise.all([
        this.getNewsSentiment(ticker),
        this.getSocialMediaSentiment(ticker),
        this.getEarningsCallSentiment(ticker),
        this.getSECFilingsSentiment(ticker)
      ]);
      
      const sources = [newsSentiment, socialMediaSentiment, earningsCallSentiment, secFilingsSentiment];
      
      // Calculate overall sentiment with source weights
      const weights = {
        [SentimentSource.NEWS]: 0.3,
        [SentimentSource.SOCIAL_MEDIA]: 0.2,
        [SentimentSource.EARNINGS_CALL]: 0.3,
        [SentimentSource.SEC_FILING]: 0.2
      };
      
      let weightedSum = 0;
      let totalWeight = 0;
      
      sources.forEach(source => {
        const weight = weights[source.source];
        weightedSum += source.aggregateScore * weight;
        totalWeight += weight;
      });
      
      const overallScore = weightedSum / totalWeight;
      let overallClassification = 'neutral';
      if (overallScore > 0.2) overallClassification = 'positive';
      else if (overallScore < -0.2) overallClassification = 'negative';
      
      // Extract entity sentiment (people, products, competitors mentioned)
      const entitySentiment = this.extractEntitySentiment(sources);
      
      return {
        ticker,
        sources,
        overallScore,
        overallClassification,
        entitySentiment,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error fetching aggregate sentiment:', error);
      throw new Error('Failed to fetch aggregate sentiment data');
    }
  }

  /**
   * Calculate sentiment trend from a list of sentiment items
   * @param sentimentItems Array of sentiment items with dates and scores
   * @returns Sentiment trend analysis
   */
  private calculateSentimentTrend(sentimentItems: any[]): SentimentTrend {
    // Sort items by date
    const sortedItems = [...sentimentItems].sort((a, b) => a.date.getTime() - b.date.getTime());
    
    if (sortedItems.length < 2) {
      return {
        direction: 'stable',
        magnitude: 0,
        volatility: 0
      };
    }
    
    // Calculate daily averages
    const dailyScores: { [date: string]: number[] } = {};
    sortedItems.forEach(item => {
      const dateStr = item.date.toISOString().split('T')[0];
      if (!dailyScores[dateStr]) {
        dailyScores[dateStr] = [];
      }
      dailyScores[dateStr].push(item.score);
    });
    
    const dailyAverages = Object.entries(dailyScores).map(([date, scores]) => ({
      date: new Date(date),
      score: scores.reduce((sum, score) => sum + score, 0) / scores.length
    }));
    
    // Calculate trend direction and magnitude
    let direction: 'improving' | 'deteriorating' | 'stable' = 'stable';
    let magnitude = 0;
    
    if (dailyAverages.length >= 2) {
      const firstAvg = dailyAverages[0].score;
      const lastAvg = dailyAverages[dailyAverages.length - 1].score;
      const change = lastAvg - firstAvg;
      
      magnitude = Math.abs(change);
      
      if (change > 0.1) {
        direction = 'improving';
      } else if (change < -0.1) {
        direction = 'deteriorating';
      }
    }
    
    // Calculate volatility (standard deviation)
    const scores = dailyAverages.map(day => day.score);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const squaredDiffs = scores.map(score => Math.pow(score - mean, 2));
    const volatility = Math.sqrt(squaredDiffs.reduce((sum, diff) => sum + diff, 0) / scores.length);
    
    return {
      direction,
      magnitude,
      volatility
    };
  }

  /**
   * Extract sentiment for specific entities mentioned in the text
   * @param sources Array of sentiment analysis results from different sources
   * @returns Array of entity sentiment analysis
   */
  private extractEntitySentiment(sources: SentimentAnalysisResult[]): EntitySentiment[] {
    // This would typically use named entity recognition (NER)
    // For now, we'll return a simplified implementation
    const entityMap = new Map<string, { mentions: number; scoreSum: number }>();
    
    // Process all text from all sources to find entities and their sentiment
    sources.forEach(source => {
      source.sentimentItems.forEach((item: any) => {
        // In a real implementation, we would use NER to extract entities
        // For this example, we'll use a simple approach with predefined entities
        const entities = this.extractEntitiesFromText(item.title || item.content || '');
        
        entities.forEach(entity => {
          if (!entityMap.has(entity)) {
            entityMap.set(entity, { mentions: 0, scoreSum: 0 });
          }
          
          const entityData = entityMap.get(entity)!;
          entityData.mentions += 1;
          entityData.scoreSum += item.score;
        });
      });
    });
    
    // Convert map to array and calculate average sentiment
    return Array.from(entityMap.entries()).map(([entity, data]) => {
      const averageScore = data.scoreSum / data.mentions;
      let classification = 'neutral';
      if (averageScore > 0.2) classification = 'positive';
      else if (averageScore < -0.2) classification = 'negative';
      
      return {
        entity,
        mentions: data.mentions,
        score: averageScore,
        classification
      };
    }).sort((a, b) => b.mentions - a.mentions); // Sort by mention count
  }

  /**
   * Extract entities from text (simplified implementation)
   * @param text Text to extract entities from
   * @returns Array of entity names
   */
  private extractEntitiesFromText(text: string): string[] {
    // In a real implementation, this would use a proper NER model
    // For this example, we'll use a simple approach
    const entities: string[] = [];
    
    // Common company names that might be mentioned
    const potentialEntities = [
      'Apple', 'Google', 'Microsoft', 'Amazon', 'Facebook', 'Tesla', 'Netflix',
      'CEO', 'CFO', 'CTO', 'Board', 'iPhone', 'Android', 'AWS', 'Azure',
      'revenue', 'profit', 'earnings', 'guidance', 'forecast', 'outlook'
    ];
    
    potentialEntities.forEach(entity => {
      if (text.toLowerCase().includes(entity.toLowerCase())) {
        entities.push(entity);
      }
    });
    
    return entities;
  }
}

export default SentimentAnalysisService;