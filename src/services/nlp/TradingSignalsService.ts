/**
 * TradingSignalsService - Generate trading signals from NLP analysis
 * 
 * This service generates trading signals based on NLP analysis of financial text,
 * including sentiment analysis, entity recognition, topic modeling, and anomaly detection.
 */

import axios from 'axios';
import { NLPSignal } from '../../models/nlp/NLPTypes';
import { NLPService } from './NLPService';
import { AdvancedSentimentService } from './AdvancedSentimentService';
import { EntityRecognitionService } from './EntityRecognitionService';
import { TopicModelingService } from './TopicModelingService';

export interface SignalStrength {
  value: number; // 0-1 scale
  factors: {
    factor: string;
    contribution: number;
  }[];
}

export interface SignalConfidence {
  value: number; // 0-1 scale
  factors: {
    factor: string;
    contribution: number;
  }[];
}

export interface TradingSignal extends NLPSignal {
  strength: SignalStrength;
  confidence: SignalConfidence;
  timeframe: 'short_term' | 'medium_term' | 'long_term';
  relatedSignals: string[];
}

export class TradingSignalsService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly nlpService: NLPService;
  private readonly sentimentService: AdvancedSentimentService;
  private readonly entityService: EntityRecognitionService;
  private readonly topicService: TopicModelingService;

  constructor(apiKey: string, baseUrl: string = 'https://api.ninjatechfinance.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.nlpService = new NLPService(apiKey, baseUrl);
    this.sentimentService = new AdvancedSentimentService(apiKey, baseUrl);
    this.entityService = new EntityRecognitionService(apiKey, baseUrl);
    this.topicService = new TopicModelingService(apiKey, baseUrl);
  }

  /**
   * Generate trading signals based on NLP analysis
   * @param ticker Stock ticker symbol
   * @param sources Array of document sources to analyze
   * @returns Promise with NLP-based trading signals
   */
  public async generateTradingSignals(
    ticker: string,
    sources: Array<'news' | 'social_media' | 'earnings_call' | 'sec_filing'> = ['news', 'social_media', 'earnings_call', 'sec_filing']
  ): Promise<TradingSignal[]> {
    try {
      // Call the NLP API for trading signals
      const response = await axios.post(`${this.baseUrl}/nlp/trading-signals`, {
        ticker,
        sources
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data.signals.map((signal: any) => ({
        ticker,
        source: signal.source,
        signalType: signal.signalType,
        direction: signal.direction,
        strength: {
          value: signal.strength.value,
          factors: signal.strength.factors
        },
        confidence: {
          value: signal.confidence.value,
          factors: signal.confidence.factors
        },
        timestamp: new Date(signal.timestamp),
        explanation: signal.explanation,
        supportingEvidence: signal.supportingEvidence.map((evidence: any) => ({
          text: evidence.text,
          source: evidence.source,
          url: evidence.url,
          date: new Date(evidence.date)
        })),
        timeframe: signal.timeframe,
        relatedSignals: signal.relatedSignals || []
      }));
    } catch (error) {
      console.error('Error generating trading signals:', error);
      
      // Fallback to generating signals from individual NLP components
      return this.generateSignalsFromComponents(ticker, sources);
    }
  }

  /**
   * Generate sentiment-based trading signals
   * @param ticker Stock ticker symbol
   * @returns Promise with sentiment-based trading signals
   */
  public async generateSentimentSignals(
    ticker: string
  ): Promise<TradingSignal[]> {
    try {
      // Get sentiment analysis from the sentiment service
      const sentimentResult = await this.sentimentService.getBasicSentiment(ticker);
      
      // Generate signals based on sentiment
      const signals: TradingSignal[] = [];
      
      // Overall sentiment signal
      if (sentimentResult.overallScore > 0.3 || sentimentResult.overallScore < -0.3) {
        signals.push({
          ticker,
          source: 'aggregate_sentiment',
          signalType: 'sentiment',
          direction: sentimentResult.overallScore > 0 ? 'bullish' : 'bearish',
          strength: {
            value: Math.abs(sentimentResult.overallScore),
            factors: [
              { factor: 'sentiment_magnitude', contribution: Math.abs(sentimentResult.overallScore) }
            ]
          },
          confidence: {
            value: 0.7,
            factors: [
              { factor: 'source_diversity', contribution: 0.3 },
              { factor: 'data_volume', contribution: 0.4 }
            ]
          },
          timestamp: new Date(),
          explanation: `Overall ${sentimentResult.overallScore > 0 ? 'positive' : 'negative'} sentiment detected across multiple sources with score of ${sentimentResult.overallScore.toFixed(2)}`,
          supportingEvidence: sentimentResult.sources.map(source => ({
            text: `${source.source} sentiment: ${source.aggregateClassification} (${source.aggregateScore.toFixed(2)})`,
            source: source.source,
            date: source.timestamp
          })),
          timeframe: 'short_term',
          relatedSignals: []
        });
      }
      
      // Source-specific signals for strong sentiment
      sentimentResult.sources.forEach(source => {
        if (Math.abs(source.aggregateScore) > 0.4) {
          signals.push({
            ticker,
            source: source.source,
            signalType: 'sentiment',
            direction: source.aggregateScore > 0 ? 'bullish' : 'bearish',
            strength: {
              value: Math.abs(source.aggregateScore) * 0.8,
              factors: [
                { factor: 'sentiment_magnitude', contribution: Math.abs(source.aggregateScore) }
              ]
            },
            confidence: {
              value: 0.6,
              factors: [
                { factor: 'source_reliability', contribution: 0.6 }
              ]
            },
            timestamp: source.timestamp,
            explanation: `Strong ${source.aggregateScore > 0 ? 'positive' : 'negative'} sentiment detected in ${source.source} with score of ${source.aggregateScore.toFixed(2)}`,
            supportingEvidence: source.sentimentItems.slice(0, 3).map((item: any) => ({
              text: item.title || item.content || '',
              source: source.source,
              url: item.url,
              date: item.date
            })),
            timeframe: 'short_term',
            relatedSignals: []
          });
        }
      });
      
      // Entity sentiment signals
      if (sentimentResult.entitySentiment && sentimentResult.entitySentiment.length > 0) {
        const strongEntities = sentimentResult.entitySentiment.filter(entity => 
          Math.abs(entity.score) > 0.5 && entity.mentions > 3
        );
        
        if (strongEntities.length > 0) {
          signals.push({
            ticker,
            source: 'entity_sentiment',
            signalType: 'entity',
            direction: strongEntities[0].score > 0 ? 'bullish' : 'bearish',
            strength: {
              value: Math.abs(strongEntities[0].score) * 0.7,
              factors: [
                { factor: 'entity_sentiment', contribution: Math.abs(strongEntities[0].score) },
                { factor: 'mention_count', contribution: Math.min(strongEntities[0].mentions / 10, 1) }
              ]
            },
            confidence: {
              value: 0.5,
              factors: [
                { factor: 'entity_relevance', contribution: 0.5 }
              ]
            },
            timestamp: new Date(),
            explanation: `Strong ${strongEntities[0].score > 0 ? 'positive' : 'negative'} sentiment detected for entity "${strongEntities[0].entity}" with ${strongEntities[0].mentions} mentions`,
            supportingEvidence: [{
              text: `Entity "${strongEntities[0].entity}" sentiment: ${strongEntities[0].classification} (${strongEntities[0].score.toFixed(2)})`,
              source: 'entity_analysis',
              date: new Date()
            }],
            timeframe: 'medium_term',
            relatedSignals: []
          });
        }
      }
      
      return signals;
    } catch (error) {
      console.error('Error generating sentiment signals:', error);
      return [];
    }
  }

  /**
   * Generate topic-based trading signals
   * @param ticker Stock ticker symbol
   * @returns Promise with topic-based trading signals
   */
  public async generateTopicSignals(
    ticker: string
  ): Promise<TradingSignal[]> {
    try {
      // Call the topic service to generate topic-based signals
      const topicSignalsResult = await this.topicService.generateTopicTradingSignals(ticker);
      
      return topicSignalsResult.signals.map(signal => ({
        ticker,
        source: 'topic_analysis',
        signalType: 'topic',
        direction: signal.direction,
        strength: {
          value: signal.strength,
          factors: [
            { factor: 'topic_relevance', contribution: signal.strength * 0.7 },
            { factor: 'topic_sentiment', contribution: signal.strength * 0.3 }
          ]
        },
        confidence: {
          value: signal.confidence,
          factors: [
            { factor: 'data_quality', contribution: signal.confidence * 0.5 },
            { factor: 'topic_consistency', contribution: signal.confidence * 0.5 }
          ]
        },
        timestamp: signal.timestamp,
        explanation: signal.explanation,
        supportingEvidence: [{
          text: `Topic: ${signal.topic}`,
          source: 'topic_analysis',
          date: signal.timestamp
        }],
        timeframe: 'medium_term',
        relatedSignals: signal.relatedTopics
      }));
    } catch (error) {
      console.error('Error generating topic signals:', error);
      return [];
    }
  }

  /**
   * Generate anomaly-based trading signals
   * @param ticker Stock ticker symbol
   * @returns Promise with anomaly-based trading signals
   */
  public async generateAnomalySignals(
    ticker: string
  ): Promise<TradingSignal[]> {
    try {
      // Detect sentiment anomalies
      const anomalyResult = await this.sentimentService.detectSentimentAnomalies(ticker);
      
      // Filter for significant anomalies
      const significantAnomalies = anomalyResult.anomalies.filter(anomaly => 
        Math.abs(anomaly.deviation) > 0.3 && anomaly.significance > 0.7
      );
      
      if (significantAnomalies.length === 0) {
        return [];
      }
      
      return significantAnomalies.map(anomaly => ({
        ticker,
        source: anomaly.source,
        signalType: 'anomaly',
        direction: anomaly.sentiment > anomaly.expectedSentiment ? 'bullish' : 'bearish',
        strength: {
          value: Math.min(Math.abs(anomaly.deviation), 1),
          factors: [
            { factor: 'sentiment_deviation', contribution: Math.abs(anomaly.deviation) }
          ]
        },
        confidence: {
          value: anomaly.significance,
          factors: [
            { factor: 'statistical_significance', contribution: anomaly.significance }
          ]
        },
        timestamp: anomaly.date,
        explanation: `Significant ${anomaly.sentiment > anomaly.expectedSentiment ? 'positive' : 'negative'} sentiment anomaly detected in ${anomaly.source} (deviation: ${anomaly.deviation.toFixed(2)})`,
        supportingEvidence: [{
          text: `Sentiment anomaly: actual ${anomaly.sentiment.toFixed(2)} vs expected ${anomaly.expectedSentiment.toFixed(2)}`,
          source: anomaly.source,
          date: anomaly.date
        }],
        timeframe: 'short_term',
        relatedSignals: []
      }));
    } catch (error) {
      console.error('Error generating anomaly signals:', error);
      return [];
    }
  }

  /**
   * Generate event-based trading signals
   * @param ticker Stock ticker symbol
   * @returns Promise with event-based trading signals
   */
  public async generateEventSignals(
    ticker: string
  ): Promise<TradingSignal[]> {
    try {
      // Call the NLP API for event detection
      const response = await axios.post(`${this.baseUrl}/nlp/event-detection`, {
        ticker
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data.events.map((event: any) => ({
        ticker,
        source: event.source,
        signalType: 'event',
        direction: event.sentiment > 0 ? 'bullish' : event.sentiment < 0 ? 'bearish' : 'neutral',
        strength: {
          value: Math.abs(event.impact),
          factors: [
            { factor: 'event_impact', contribution: Math.abs(event.impact) },
            { factor: 'event_relevance', contribution: event.relevance }
          ]
        },
        confidence: {
          value: event.confidence,
          factors: [
            { factor: 'event_confirmation', contribution: event.confidence }
          ]
        },
        timestamp: new Date(event.timestamp),
        explanation: event.description,
        supportingEvidence: event.evidence.map((item: any) => ({
          text: item.text,
          source: item.source,
          url: item.url,
          date: new Date(item.date)
        })),
        timeframe: event.timeframe,
        relatedSignals: event.relatedEvents || []
      }));
    } catch (error) {
      console.error('Error generating event signals:', error);
      return [];
    }
  }

  /**
   * Generate trading signals from individual NLP components
   * @param ticker Stock ticker symbol
   * @param sources Array of document sources to analyze
   * @returns Array of trading signals
   */
  private async generateSignalsFromComponents(
    ticker: string,
    sources: Array<'news' | 'social_media' | 'earnings_call' | 'sec_filing'>
  ): Promise<TradingSignal[]> {
    try {
      // Generate signals from different components in parallel
      const [sentimentSignals, topicSignals, anomalySignals, eventSignals] = await Promise.all([
        this.generateSentimentSignals(ticker),
        this.generateTopicSignals(ticker),
        this.generateAnomalySignals(ticker),
        this.generateEventSignals(ticker)
      ]);
      
      // Combine all signals
      const allSignals = [
        ...sentimentSignals,
        ...topicSignals,
        ...anomalySignals,
        ...eventSignals
      ];
      
      // Filter signals based on requested sources
      return allSignals.filter(signal => 
        sources.includes(signal.source as any) || 
        signal.source === 'aggregate_sentiment' ||
        signal.source === 'entity_sentiment' ||
        signal.source === 'topic_analysis'
      );
    } catch (error) {
      console.error('Error generating signals from components:', error);
      return [];
    }
  }
}

export default TradingSignalsService;