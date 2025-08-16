/**
 * NLPTypes - Type definitions for NLP functionality
 * 
 * This file contains type definitions for all NLP-related functionality,
 * including entity recognition, topic modeling, text summarization, and trading signals.
 */

/**
 * Enum for different types of documents that can be analyzed
 */
export enum DocumentType {
  GENERAL = 'general',
  NEWS = 'news',
  SOCIAL_MEDIA = 'social_media',
  EARNINGS_CALL = 'earnings_call',
  SEC_FILING = 'sec_filing',
  RESEARCH_REPORT = 'research_report',
  ANALYST_NOTE = 'analyst_note'
}

/**
 * Enum for different types of entities that can be recognized
 */
export enum EntityType {
  COMPANY = 'company',
  PERSON = 'person',
  LOCATION = 'location',
  ORGANIZATION = 'organization',
  PRODUCT = 'product',
  EVENT = 'event',
  DATE = 'date',
  MONEY = 'money',
  PERCENTAGE = 'percentage',
  FINANCIAL_METRIC = 'financial_metric',
  REGULATION = 'regulation',
  INDUSTRY = 'industry',
  MARKET = 'market',
  CURRENCY = 'currency',
  OTHER = 'other'
}

/**
 * Enum for different types of NLP models
 */
export enum NLPModelType {
  SENTIMENT = 'sentiment',
  ENTITY_RECOGNITION = 'entity_recognition',
  TOPIC_MODELING = 'topic_modeling',
  SUMMARIZATION = 'summarization',
  TRADING_SIGNALS = 'trading_signals'
}

/**
 * Interface for an entity recognized in text
 */
export interface Entity {
  text: string;
  type: EntityType;
  startChar: number;
  endChar: number;
  confidence: number;
  metadata: {
    [key: string]: any;
  };
}

/**
 * Interface for entity recognition results
 */
export interface EntityRecognitionResult {
  documentType: DocumentType;
  entities: Entity[];
  rawText: string;
  confidence: number;
  processingTime: number;
  modelVersion: string;
}

/**
 * Interface for a topic identified in text
 */
export interface Topic {
  id: string;
  name: string;
  keywords: string[];
  weight: number;
  sentimentScore: number;
  sentimentClassification: string;
  sentimentColor: string;
  relatedEntities: Entity[];
}

/**
 * Interface for topic modeling results
 */
export interface TopicModelingResult {
  documentType: DocumentType;
  topics: Topic[];
  topicDistribution: {
    topicId: string;
    percentage: number;
  }[];
  documentTopicAssignments: {
    documentIndex: number;
    topicAssignments: {
      topicId: string;
      weight: number;
    }[];
  }[];
  coherenceScore: number;
  perplexity: number;
  modelVersion: string;
}

/**
 * Interface for text summarization results
 */
export interface TextSummaryResult {
  documentType: DocumentType;
  originalText: string;
  summary: string;
  keyPoints: string[];
  compressionRatio: number;
  modelVersion: string;
}

/**
 * Interface for NLP-based trading signals
 */
export interface NLPSignal {
  ticker: string;
  source: string;
  signalType: 'sentiment' | 'event' | 'topic' | 'entity' | 'anomaly';
  direction: 'bullish' | 'bearish' | 'neutral';
  strength: number; // 0-1 scale
  confidence: number; // 0-1 scale
  timestamp: Date;
  explanation: string;
  supportingEvidence: {
    text: string;
    source: string;
    url?: string;
    date: Date;
  }[];
}

/**
 * Interface for entity relationship
 */
export interface EntityRelationship {
  sourceEntity: Entity;
  targetEntity: Entity;
  relationshipType: string;
  confidence: number;
}

/**
 * Interface for sentiment-enhanced entity
 */
export interface SentimentEntity extends Entity {
  sentimentScore: number;
  sentimentClassification: string;
}

/**
 * Interface for topic trend analysis
 */
export interface TopicTrend {
  topicId: string;
  topicName: string;
  dataPoints: {
    date: Date;
    prevalence: number;
    sentiment: number;
  }[];
  trendDirection: 'increasing' | 'decreasing' | 'stable';
  trendMagnitude: number;
}

/**
 * Interface for document clustering results
 */
export interface DocumentCluster {
  clusterId: string;
  clusterName: string;
  documentIndices: number[];
  centroidTopics: Topic[];
  coherence: number;
}

/**
 * Interface for NLP model performance metrics
 */
export interface NLPModelMetrics {
  modelType: NLPModelType;
  modelVersion: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingDate: Date;
  datasetSize: number;
  lastEvaluationDate: Date;
}