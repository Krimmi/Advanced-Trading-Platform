/**
 * NLPService - Advanced Natural Language Processing Service
 * 
 * This service provides comprehensive NLP capabilities for financial text analysis,
 * including sentiment analysis, entity recognition, topic modeling, and text summarization.
 * It serves as a unified interface for all NLP-related functionality in the application.
 */

import axios from 'axios';
import { SentimentAnalysisService } from '../../services/sentimentAnalysisService';
import { 
  EntityRecognitionResult, 
  TopicModelingResult, 
  TextSummaryResult,
  NLPSignal,
  DocumentType,
  Entity,
  EntityType,
  Topic,
  NLPModelType
} from '../../models/nlp/NLPTypes';

export class NLPService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly sentimentService: SentimentAnalysisService;
  private readonly modelCache: Map<string, any>;
  private readonly modelVersions: Map<NLPModelType, string>;

  constructor(apiKey: string, baseUrl: string = 'https://api.ninjatechfinance.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.sentimentService = new SentimentAnalysisService(apiKey, baseUrl);
    this.modelCache = new Map<string, any>();
    
    // Track model versions for each NLP capability
    this.modelVersions = new Map<NLPModelType, string>([
      [NLPModelType.SENTIMENT, 'v2.1.0'],
      [NLPModelType.ENTITY_RECOGNITION, 'v1.3.0'],
      [NLPModelType.TOPIC_MODELING, 'v1.2.0'],
      [NLPModelType.SUMMARIZATION, 'v1.1.0'],
      [NLPModelType.TRADING_SIGNALS, 'v1.0.0']
    ]);
  }

  /**
   * Get the current model version for a specific NLP capability
   * @param modelType The type of NLP model
   * @returns The current model version
   */
  public getModelVersion(modelType: NLPModelType): string {
    return this.modelVersions.get(modelType) || 'unknown';
  }

  /**
   * Perform named entity recognition on financial text
   * @param text The text to analyze
   * @param documentType The type of document being analyzed
   * @returns Promise with entity recognition results
   */
  public async recognizeEntities(
    text: string,
    documentType: DocumentType = DocumentType.GENERAL
  ): Promise<EntityRecognitionResult> {
    try {
      // Call the NLP API for entity recognition
      const response = await axios.post(`${this.baseUrl}/nlp/entity-recognition`, {
        text,
        documentType,
        modelVersion: this.getModelVersion(NLPModelType.ENTITY_RECOGNITION)
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      const result = response.data;
      
      // Process and categorize entities
      const entities = this.processEntities(result.entities, documentType);
      
      return {
        documentType,
        entities,
        rawText: text,
        confidence: result.confidence,
        processingTime: result.processingTime,
        modelVersion: result.modelVersion
      };
    } catch (error) {
      console.error('Error performing entity recognition:', error);
      throw new Error('Failed to perform entity recognition');
    }
  }

  /**
   * Process and categorize entities based on document type
   * @param rawEntities Raw entities from the API
   * @param documentType The type of document being analyzed
   * @returns Processed and categorized entities
   */
  private processEntities(rawEntities: any[], documentType: DocumentType): Entity[] {
    // Apply domain-specific rules based on document type
    return rawEntities.map(entity => {
      // Enhance entity with financial domain knowledge
      let enhancedEntity: Entity = {
        text: entity.text,
        type: entity.type as EntityType,
        startChar: entity.startChar,
        endChar: entity.endChar,
        confidence: entity.confidence,
        metadata: entity.metadata || {}
      };

      // Add financial domain-specific metadata
      if (entity.type === EntityType.COMPANY) {
        enhancedEntity.metadata.ticker = entity.metadata?.ticker || null;
        enhancedEntity.metadata.exchange = entity.metadata?.exchange || null;
        enhancedEntity.metadata.sector = entity.metadata?.sector || null;
        enhancedEntity.metadata.industry = entity.metadata?.industry || null;
      } else if (entity.type === EntityType.PERSON) {
        enhancedEntity.metadata.role = entity.metadata?.role || null;
        enhancedEntity.metadata.organization = entity.metadata?.organization || null;
      } else if (entity.type === EntityType.FINANCIAL_METRIC) {
        enhancedEntity.metadata.unit = entity.metadata?.unit || null;
        enhancedEntity.metadata.value = entity.metadata?.value || null;
        enhancedEntity.metadata.period = entity.metadata?.period || null;
      }

      return enhancedEntity;
    });
  }

  /**
   * Perform topic modeling on a collection of financial texts
   * @param texts Array of texts to analyze
   * @param numTopics Number of topics to extract (default: 5)
   * @param documentType The type of documents being analyzed
   * @returns Promise with topic modeling results
   */
  public async modelTopics(
    texts: string[],
    numTopics: number = 5,
    documentType: DocumentType = DocumentType.GENERAL
  ): Promise<TopicModelingResult> {
    try {
      // Call the NLP API for topic modeling
      const response = await axios.post(`${this.baseUrl}/nlp/topic-modeling`, {
        texts,
        numTopics,
        documentType,
        modelVersion: this.getModelVersion(NLPModelType.TOPIC_MODELING)
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      const result = response.data;
      
      // Process topics with financial domain knowledge
      const topics = this.processTopics(result.topics, documentType);
      
      // Calculate topic distribution
      const topicDistribution = topics.map(topic => ({
        topicId: topic.id,
        percentage: topic.weight * 100
      }));
      
      return {
        documentType,
        topics,
        topicDistribution,
        documentTopicAssignments: result.documentTopicAssignments,
        coherenceScore: result.coherenceScore,
        perplexity: result.perplexity,
        modelVersion: result.modelVersion
      };
    } catch (error) {
      console.error('Error performing topic modeling:', error);
      throw new Error('Failed to perform topic modeling');
    }
  }

  /**
   * Process topics with financial domain knowledge
   * @param rawTopics Raw topics from the API
   * @param documentType The type of documents being analyzed
   * @returns Processed topics with enhanced metadata
   */
  private processTopics(rawTopics: any[], documentType: DocumentType): Topic[] {
    return rawTopics.map((topic, index) => {
      // Generate a descriptive name based on keywords
      const topicName = this.generateTopicName(topic.keywords, documentType);
      
      // Calculate sentiment for the topic
      const sentimentScore = topic.sentimentScore || 0;
      let sentimentClassification = 'neutral';
      if (sentimentScore > 0.2) sentimentClassification = 'positive';
      else if (sentimentScore < -0.2) sentimentClassification = 'negative';
      
      // Generate color based on sentiment
      const sentimentColor = sentimentScore > 0.2 ? '#4CAF50' : 
                             sentimentScore < -0.2 ? '#F44336' : 
                             '#9E9E9E';
      
      return {
        id: topic.id || `topic_${index + 1}`,
        name: topicName,
        keywords: topic.keywords,
        weight: topic.weight,
        sentimentScore,
        sentimentClassification,
        sentimentColor,
        relatedEntities: topic.relatedEntities || []
      };
    });
  }

  /**
   * Generate a descriptive name for a topic based on its keywords
   * @param keywords Array of keywords representing the topic
   * @param documentType The type of documents being analyzed
   * @returns A descriptive name for the topic
   */
  private generateTopicName(keywords: string[], documentType: DocumentType): string {
    // Financial domain-specific topic naming logic
    if (documentType === DocumentType.EARNINGS_CALL) {
      // Check for earnings-related terms
      if (keywords.some(k => ['revenue', 'earnings', 'eps', 'profit', 'income'].includes(k.toLowerCase()))) {
        return 'Financial Performance';
      }
      if (keywords.some(k => ['guidance', 'outlook', 'forecast', 'projection'].includes(k.toLowerCase()))) {
        return 'Future Outlook';
      }
      if (keywords.some(k => ['strategy', 'growth', 'expansion', 'initiative'].includes(k.toLowerCase()))) {
        return 'Strategic Initiatives';
      }
    } else if (documentType === DocumentType.SEC_FILING) {
      // Check for SEC filing-related terms
      if (keywords.some(k => ['risk', 'uncertainty', 'challenge', 'litigation'].includes(k.toLowerCase()))) {
        return 'Risk Factors';
      }
      if (keywords.some(k => ['management', 'discussion', 'analysis', 'md&a'].includes(k.toLowerCase()))) {
        return 'Management Analysis';
      }
    } else if (documentType === DocumentType.NEWS) {
      // Check for news-related terms
      if (keywords.some(k => ['market', 'stock', 'index', 'trading'].includes(k.toLowerCase()))) {
        return 'Market Activity';
      }
      if (keywords.some(k => ['acquisition', 'merger', 'takeover', 'deal'].includes(k.toLowerCase()))) {
        return 'M&A Activity';
      }
    }
    
    // Default: use the top 2 keywords
    return keywords.slice(0, 2).join(' & ');
  }

  /**
   * Generate a summary of financial text
   * @param text The text to summarize
   * @param maxLength Maximum length of the summary in characters
   * @param documentType The type of document being summarized
   * @returns Promise with text summary results
   */
  public async summarizeText(
    text: string,
    maxLength: number = 500,
    documentType: DocumentType = DocumentType.GENERAL
  ): Promise<TextSummaryResult> {
    try {
      // Call the NLP API for text summarization
      const response = await axios.post(`${this.baseUrl}/nlp/summarization`, {
        text,
        maxLength,
        documentType,
        modelVersion: this.getModelVersion(NLPModelType.SUMMARIZATION)
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      const result = response.data;
      
      // Extract key points from the summary
      const keyPoints = this.extractKeyPoints(result.summary, documentType);
      
      return {
        documentType,
        originalText: text,
        summary: result.summary,
        keyPoints,
        compressionRatio: result.compressionRatio,
        modelVersion: result.modelVersion
      };
    } catch (error) {
      console.error('Error generating text summary:', error);
      throw new Error('Failed to generate text summary');
    }
  }

  /**
   * Extract key points from a summary
   * @param summary The summary text
   * @param documentType The type of document being summarized
   * @returns Array of key points extracted from the summary
   */
  private extractKeyPoints(summary: string, documentType: DocumentType): string[] {
    // Split the summary into sentences
    const sentences = summary.match(/[^.!?]+[.!?]+/g) || [];
    
    // Filter for sentences that contain important financial information
    const keyPointSentences = sentences.filter(sentence => {
      const lowerSentence = sentence.toLowerCase();
      
      // Financial metrics
      if (/revenue|profit|earnings|eps|ebitda|margin|growth|decline|increase|decrease/.test(lowerSentence)) {
        return true;
      }
      
      // Future outlook
      if (/guidance|outlook|forecast|expect|anticipate|project|future/.test(lowerSentence)) {
        return true;
      }
      
      // Strategic information
      if (/strategy|initiative|launch|expand|acquisition|merger|restructure/.test(lowerSentence)) {
        return true;
      }
      
      // Risk factors
      if (/risk|challenge|uncertainty|litigation|regulatory|compliance/.test(lowerSentence)) {
        return true;
      }
      
      return false;
    });
    
    // Limit to top 5 key points and clean them up
    return keyPointSentences
      .slice(0, 5)
      .map(sentence => sentence.trim());
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
  ): Promise<NLPSignal[]> {
    try {
      // Call the NLP API for trading signals
      const response = await axios.post(`${this.baseUrl}/nlp/trading-signals`, {
        ticker,
        sources,
        modelVersion: this.getModelVersion(NLPModelType.TRADING_SIGNALS)
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data.signals.map((signal: any) => ({
        ticker,
        source: signal.source,
        signalType: signal.signalType,
        direction: signal.direction,
        strength: signal.strength,
        confidence: signal.confidence,
        timestamp: new Date(signal.timestamp),
        explanation: signal.explanation,
        supportingEvidence: signal.supportingEvidence
      }));
    } catch (error) {
      console.error('Error generating trading signals:', error);
      throw new Error('Failed to generate trading signals');
    }
  }

  /**
   * Get sentiment analysis using the existing sentiment service
   * This method provides a bridge to the existing sentiment functionality
   */
  public async getSentimentAnalysis(ticker: string) {
    return this.sentimentService.getAggregateSentiment(ticker);
  }
}

export default NLPService;