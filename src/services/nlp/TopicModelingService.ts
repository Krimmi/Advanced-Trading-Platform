/**
 * TopicModelingService - Topic modeling for financial documents
 * 
 * This service provides advanced topic modeling capabilities for financial text,
 * identifying key themes, trends, and relationships in large document collections.
 */

import axios from 'axios';
import { 
  Topic, 
  DocumentType, 
  TopicModelingResult,
  TopicTrend,
  DocumentCluster
} from '../../models/nlp/NLPTypes';

export class TopicModelingService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly modelCache: Map<string, TopicModelingResult>;

  constructor(apiKey: string, baseUrl: string = 'https://api.ninjatechfinance.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.modelCache = new Map<string, TopicModelingResult>();
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
      // Generate a cache key
      const cacheKey = `${documentType}_${numTopics}_${this.hashTexts(texts)}`;
      
      // Check cache first
      if (this.modelCache.has(cacheKey)) {
        return this.modelCache.get(cacheKey)!;
      }
      
      // Call the NLP API for topic modeling
      const response = await axios.post(`${this.baseUrl}/nlp/topic-modeling`, {
        texts,
        numTopics,
        documentType
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
      
      const topicModelingResult: TopicModelingResult = {
        documentType,
        topics,
        topicDistribution,
        documentTopicAssignments: result.documentTopicAssignments,
        coherenceScore: result.coherenceScore,
        perplexity: result.perplexity,
        modelVersion: result.modelVersion
      };
      
      // Cache the results
      this.modelCache.set(cacheKey, topicModelingResult);
      
      return topicModelingResult;
    } catch (error) {
      console.error('Error performing topic modeling:', error);
      throw new Error('Failed to perform topic modeling');
    }
  }

  /**
   * Analyze topic trends over time
   * @param ticker Stock ticker symbol
   * @param documentType The type of documents to analyze
   * @param startDate Start date for analysis
   * @param endDate End date for analysis
   * @returns Promise with topic trend analysis
   */
  public async analyzeTopicTrends(
    ticker: string,
    documentType: DocumentType,
    startDate: Date,
    endDate: Date
  ): Promise<TopicTrend[]> {
    try {
      // Call the NLP API for topic trend analysis
      const response = await axios.post(`${this.baseUrl}/nlp/topic-trends`, {
        ticker,
        documentType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data.trends.map((trend: any) => ({
        topicId: trend.topicId,
        topicName: trend.topicName,
        dataPoints: trend.dataPoints.map((point: any) => ({
          date: new Date(point.date),
          prevalence: point.prevalence,
          sentiment: point.sentiment
        })),
        trendDirection: trend.trendDirection,
        trendMagnitude: trend.trendMagnitude
      }));
    } catch (error) {
      console.error('Error analyzing topic trends:', error);
      throw new Error('Failed to analyze topic trends');
    }
  }

  /**
   * Cluster documents based on topic similarity
   * @param texts Array of texts to cluster
   * @param numClusters Number of clusters to create (default: 3)
   * @param documentType The type of documents being clustered
   * @returns Promise with document clustering results
   */
  public async clusterDocuments(
    texts: string[],
    numClusters: number = 3,
    documentType: DocumentType = DocumentType.GENERAL
  ): Promise<DocumentCluster[]> {
    try {
      // Call the NLP API for document clustering
      const response = await axios.post(`${this.baseUrl}/nlp/document-clustering`, {
        texts,
        numClusters,
        documentType
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data.clusters.map((cluster: any) => ({
        clusterId: cluster.id,
        clusterName: cluster.name,
        documentIndices: cluster.documentIndices,
        centroidTopics: this.processTopics(cluster.centroidTopics, documentType),
        coherence: cluster.coherence
      }));
    } catch (error) {
      console.error('Error clustering documents:', error);
      throw new Error('Failed to cluster documents');
    }
  }

  /**
   * Find similar documents based on topic similarity
   * @param queryText The text to find similar documents for
   * @param candidateTexts Array of texts to compare against
   * @param documentType The type of documents being compared
   * @param topN Number of similar documents to return (default: 5)
   * @returns Promise with similar document indices and similarity scores
   */
  public async findSimilarDocuments(
    queryText: string,
    candidateTexts: string[],
    documentType: DocumentType = DocumentType.GENERAL,
    topN: number = 5
  ): Promise<{
    queryText: string;
    similarDocuments: {
      index: number;
      similarity: number;
      sharedTopics: {
        topicId: string;
        topicName: string;
        weight: number;
      }[];
    }[];
  }> {
    try {
      // Call the NLP API for document similarity
      const response = await axios.post(`${this.baseUrl}/nlp/document-similarity`, {
        queryText,
        candidateTexts,
        documentType,
        topN
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      const result = response.data;
      
      return {
        queryText: result.queryText,
        similarDocuments: result.similarDocuments.map((doc: any) => ({
          index: doc.index,
          similarity: doc.similarity,
          sharedTopics: doc.sharedTopics.map((topic: any) => ({
            topicId: topic.id,
            topicName: topic.name,
            weight: topic.weight
          }))
        }))
      };
    } catch (error) {
      console.error('Error finding similar documents:', error);
      throw new Error('Failed to find similar documents');
    }
  }

  /**
   * Generate topic-based trading signals
   * @param ticker Stock ticker symbol
   * @returns Promise with topic-based trading signals
   */
  public async generateTopicTradingSignals(
    ticker: string
  ): Promise<{
    ticker: string;
    signals: {
      topic: string;
      direction: 'bullish' | 'bearish' | 'neutral';
      strength: number;
      confidence: number;
      explanation: string;
      relatedTopics: string[];
      timestamp: Date;
    }[];
  }> {
    try {
      // Call the NLP API for topic-based trading signals
      const response = await axios.post(`${this.baseUrl}/nlp/topic-signals`, {
        ticker
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      const result = response.data;
      
      return {
        ticker,
        signals: result.signals.map((signal: any) => ({
          topic: signal.topic,
          direction: signal.direction,
          strength: signal.strength,
          confidence: signal.confidence,
          explanation: signal.explanation,
          relatedTopics: signal.relatedTopics,
          timestamp: new Date(signal.timestamp)
        }))
      };
    } catch (error) {
      console.error('Error generating topic trading signals:', error);
      throw new Error('Failed to generate topic trading signals');
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
   * Simple hash function for an array of texts (for caching purposes)
   * @param texts Array of texts to hash
   * @returns A hash string
   */
  private hashTexts(texts: string[]): string {
    // Concatenate the first 100 characters of each text
    const combinedText = texts.map(text => text.substring(0, 100)).join('');
    
    let hash = 0;
    if (combinedText.length === 0) return hash.toString();
    
    for (let i = 0; i < combinedText.length; i++) {
      const char = combinedText.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return hash.toString();
  }
}

export default TopicModelingService;