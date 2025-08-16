/**
 * AdvancedSentimentService - Enhanced sentiment analysis for financial text
 * 
 * This service extends the basic sentiment analysis with advanced features like:
 * - Fine-grained sentiment analysis
 * - Aspect-based sentiment analysis
 * - Contextual sentiment understanding
 * - Comparative sentiment analysis
 * - Temporal sentiment tracking
 */

import axios from 'axios';
import { SentimentAnalysisService } from '../sentimentAnalysisService';
import { 
  SentimentSource, 
  SentimentAnalysisResult, 
  EntitySentiment 
} from '../../types/sentimentTypes';
import { 
  Entity, 
  EntityType, 
  DocumentType,
  NLPModelType
} from '../../models/nlp/NLPTypes';

export interface AspectSentiment {
  aspect: string;
  aspectCategory: string;
  sentiment: number;
  classification: string;
  mentions: number;
  relevantText: string[];
}

export interface ComparativeSentiment {
  primaryEntity: string;
  comparedEntity: string;
  aspectsCompared: {
    aspect: string;
    primarySentiment: number;
    comparedSentiment: number;
    difference: number;
  }[];
  overallComparison: number; // Positive means primary is viewed more favorably
}

export interface SentimentTrend {
  ticker: string;
  source: SentimentSource;
  timePoints: {
    date: Date;
    sentiment: number;
    volume: number;
  }[];
  trendDirection: 'improving' | 'deteriorating' | 'stable';
  volatility: number;
  anomalies: {
    date: Date;
    sentiment: number;
    expectedSentiment: number;
    deviation: number;
  }[];
}

export class AdvancedSentimentService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly basicSentimentService: SentimentAnalysisService;

  constructor(apiKey: string, baseUrl: string = 'https://api.ninjatechfinance.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.basicSentimentService = new SentimentAnalysisService(apiKey, baseUrl);
  }

  /**
   * Perform aspect-based sentiment analysis on financial text
   * @param text The text to analyze
   * @param documentType The type of document being analyzed
   * @returns Promise with aspect-based sentiment results
   */
  public async analyzeAspectSentiment(
    text: string,
    documentType: DocumentType = DocumentType.GENERAL
  ): Promise<AspectSentiment[]> {
    try {
      // Call the NLP API for aspect-based sentiment analysis
      const response = await axios.post(`${this.baseUrl}/nlp/aspect-sentiment`, {
        text,
        documentType
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data.aspects.map((aspect: any) => ({
        aspect: aspect.name,
        aspectCategory: aspect.category,
        sentiment: aspect.sentimentScore,
        classification: this.classifySentiment(aspect.sentimentScore),
        mentions: aspect.mentions,
        relevantText: aspect.relevantText || []
      }));
    } catch (error) {
      console.error('Error performing aspect-based sentiment analysis:', error);
      throw new Error('Failed to perform aspect-based sentiment analysis');
    }
  }

  /**
   * Perform comparative sentiment analysis between two entities
   * @param primaryEntity The main entity to analyze
   * @param comparedEntity The entity to compare against
   * @param documentType The type of documents to analyze
   * @param timeframe Optional timeframe for analysis (in days)
   * @returns Promise with comparative sentiment results
   */
  public async analyzeComparativeSentiment(
    primaryEntity: string,
    comparedEntity: string,
    documentType: DocumentType = DocumentType.NEWS,
    timeframe?: number
  ): Promise<ComparativeSentiment> {
    try {
      // Call the NLP API for comparative sentiment analysis
      const response = await axios.post(`${this.baseUrl}/nlp/comparative-sentiment`, {
        primaryEntity,
        comparedEntity,
        documentType,
        timeframe
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      const result = response.data;
      
      return {
        primaryEntity: result.primaryEntity,
        comparedEntity: result.comparedEntity,
        aspectsCompared: result.aspectsCompared.map((aspect: any) => ({
          aspect: aspect.name,
          primarySentiment: aspect.primarySentiment,
          comparedSentiment: aspect.comparedSentiment,
          difference: aspect.primarySentiment - aspect.comparedSentiment
        })),
        overallComparison: result.overallComparison
      };
    } catch (error) {
      console.error('Error performing comparative sentiment analysis:', error);
      throw new Error('Failed to perform comparative sentiment analysis');
    }
  }

  /**
   * Analyze sentiment trends over time
   * @param ticker Stock ticker symbol
   * @param source Sentiment source to analyze
   * @param startDate Start date for analysis
   * @param endDate End date for analysis
   * @returns Promise with sentiment trend analysis
   */
  public async analyzeSentimentTrend(
    ticker: string,
    source: SentimentSource,
    startDate: Date,
    endDate: Date
  ): Promise<SentimentTrend> {
    try {
      // Call the NLP API for sentiment trend analysis
      const response = await axios.post(`${this.baseUrl}/nlp/sentiment-trend`, {
        ticker,
        source,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      const result = response.data;
      
      return {
        ticker,
        source,
        timePoints: result.timePoints.map((point: any) => ({
          date: new Date(point.date),
          sentiment: point.sentiment,
          volume: point.volume
        })),
        trendDirection: result.trendDirection,
        volatility: result.volatility,
        anomalies: result.anomalies.map((anomaly: any) => ({
          date: new Date(anomaly.date),
          sentiment: anomaly.sentiment,
          expectedSentiment: anomaly.expectedSentiment,
          deviation: anomaly.deviation
        }))
      };
    } catch (error) {
      console.error('Error analyzing sentiment trend:', error);
      throw new Error('Failed to analyze sentiment trend');
    }
  }

  /**
   * Detect sentiment anomalies in recent data
   * @param ticker Stock ticker symbol
   * @param lookbackDays Number of days to look back for anomaly detection
   * @returns Promise with detected sentiment anomalies
   */
  public async detectSentimentAnomalies(
    ticker: string,
    lookbackDays: number = 30
  ): Promise<{
    ticker: string;
    anomalies: {
      date: Date;
      source: SentimentSource;
      sentiment: number;
      expectedSentiment: number;
      deviation: number;
      significance: number;
    }[];
  }> {
    try {
      // Call the NLP API for sentiment anomaly detection
      const response = await axios.post(`${this.baseUrl}/nlp/sentiment-anomalies`, {
        ticker,
        lookbackDays
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      const result = response.data;
      
      return {
        ticker,
        anomalies: result.anomalies.map((anomaly: any) => ({
          date: new Date(anomaly.date),
          source: anomaly.source,
          sentiment: anomaly.sentiment,
          expectedSentiment: anomaly.expectedSentiment,
          deviation: anomaly.deviation,
          significance: anomaly.significance
        }))
      };
    } catch (error) {
      console.error('Error detecting sentiment anomalies:', error);
      throw new Error('Failed to detect sentiment anomalies');
    }
  }

  /**
   * Generate trading signals based on sentiment analysis
   * @param ticker Stock ticker symbol
   * @returns Promise with sentiment-based trading signals
   */
  public async generateSentimentTradingSignals(
    ticker: string
  ): Promise<{
    ticker: string;
    signals: {
      source: SentimentSource;
      direction: 'bullish' | 'bearish' | 'neutral';
      strength: number;
      confidence: number;
      explanation: string;
      timestamp: Date;
    }[];
  }> {
    try {
      // Call the NLP API for sentiment-based trading signals
      const response = await axios.post(`${this.baseUrl}/nlp/sentiment-signals`, {
        ticker
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      const result = response.data;
      
      return {
        ticker,
        signals: result.signals.map((signal: any) => ({
          source: signal.source,
          direction: signal.direction,
          strength: signal.strength,
          confidence: signal.confidence,
          explanation: signal.explanation,
          timestamp: new Date(signal.timestamp)
        }))
      };
    } catch (error) {
      console.error('Error generating sentiment trading signals:', error);
      throw new Error('Failed to generate sentiment trading signals');
    }
  }

  /**
   * Classify sentiment score into a category
   * @param score Sentiment score
   * @returns Sentiment classification
   */
  private classifySentiment(score: number): string {
    if (score > 0.6) return 'very positive';
    if (score > 0.2) return 'positive';
    if (score < -0.6) return 'very negative';
    if (score < -0.2) return 'negative';
    return 'neutral';
  }

  /**
   * Get basic sentiment analysis using the existing service
   * This method provides a bridge to the existing sentiment functionality
   */
  public async getBasicSentiment(ticker: string) {
    return this.basicSentimentService.getAggregateSentiment(ticker);
  }
}

export default AdvancedSentimentService;