/**
 * Base service for Natural Language Processing capabilities
 */
export class NLPService {
  private static instance: NLPService;
  private apiKey: string;
  private baseUrl: string;
  private modelConfig: NLPModelConfig;

  /**
   * Private constructor for singleton pattern
   * @param config NLP service configuration
   */
  private constructor(config: NLPServiceConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.nlp-service.com/v1';
    this.modelConfig = {
      ...DEFAULT_MODEL_CONFIG,
      ...config.modelConfig
    };
  }

  /**
   * Get the singleton instance
   * @param config NLP service configuration
   * @returns NLPService instance
   */
  public static getInstance(config?: NLPServiceConfig): NLPService {
    if (!NLPService.instance) {
      if (!config) {
        throw new Error('NLPService must be initialized with a configuration');
      }
      NLPService.instance = new NLPService(config);
    }
    return NLPService.instance;
  }

  /**
   * Process text with the NLP service
   * @param text Text to process
   * @param options Processing options
   * @returns Processing result
   */
  public async processText(text: string, options?: ProcessTextOptions): Promise<ProcessTextResult> {
    try {
      // In a real implementation, this would make an API call to an NLP service
      // For now, we'll return mock data
      return this.getMockProcessingResult(text, options);
    } catch (error) {
      console.error('Error processing text:', error);
      throw error;
    }
  }

  /**
   * Process a document with the NLP service
   * @param documentUrl URL or path to the document
   * @param options Processing options
   * @returns Processing result
   */
  public async processDocument(documentUrl: string, options?: ProcessDocumentOptions): Promise<ProcessDocumentResult> {
    try {
      // In a real implementation, this would make an API call to an NLP service
      // For now, we'll return mock data
      return this.getMockDocumentResult(documentUrl, options);
    } catch (error) {
      console.error('Error processing document:', error);
      throw error;
    }
  }

  /**
   * Process a batch of texts with the NLP service
   * @param texts Array of texts to process
   * @param options Processing options
   * @returns Array of processing results
   */
  public async processBatch(texts: string[], options?: ProcessTextOptions): Promise<ProcessTextResult[]> {
    try {
      // In a real implementation, this would make a batch API call
      // For now, we'll process each text individually
      const results: ProcessTextResult[] = [];
      
      for (const text of texts) {
        const result = await this.processText(text, options);
        results.push(result);
      }
      
      return results;
    } catch (error) {
      console.error('Error processing batch:', error);
      throw error;
    }
  }

  /**
   * Get the API key
   * @returns API key
   */
  public getApiKey(): string {
    return this.apiKey;
  }

  /**
   * Get the base URL
   * @returns Base URL
   */
  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Get the model configuration
   * @returns Model configuration
   */
  public getModelConfig(): NLPModelConfig {
    return this.modelConfig;
  }

  /**
   * Generate a mock processing result
   * @param text Text to process
   * @param options Processing options
   * @returns Mock processing result
   */
  private getMockProcessingResult(text: string, options?: ProcessTextOptions): ProcessTextResult {
    // Generate sentiment score based on positive/negative keywords
    const positiveKeywords = ['increase', 'growth', 'profit', 'positive', 'up', 'gain', 'success', 'bullish', 'optimistic'];
    const negativeKeywords = ['decrease', 'loss', 'negative', 'down', 'decline', 'fail', 'bearish', 'pessimistic'];
    
    let sentimentScore = 0;
    const lowerText = text.toLowerCase();
    
    // Count positive and negative keywords
    for (const keyword of positiveKeywords) {
      if (lowerText.includes(keyword)) {
        sentimentScore += 0.1;
      }
    }
    
    for (const keyword of negativeKeywords) {
      if (lowerText.includes(keyword)) {
        sentimentScore -= 0.1;
      }
    }
    
    // Clamp sentiment score between -1 and 1
    sentimentScore = Math.max(-1, Math.min(1, sentimentScore));
    
    // Generate entities
    const entities: Entity[] = [];
    const companyRegex = /(Apple|Microsoft|Google|Amazon|Tesla|Meta|NVIDIA)/g;
    const companyMatches = text.match(companyRegex);
    
    if (companyMatches) {
      for (const match of companyMatches) {
        entities.push({
          text: match,
          type: 'ORGANIZATION',
          start: text.indexOf(match),
          end: text.indexOf(match) + match.length,
          confidence: 0.9
        });
      }
    }
    
    // Generate topics
    const topics: Topic[] = [];
    
    if (lowerText.includes('stock') || lowerText.includes('market')) {
      topics.push({
        name: 'Stock Market',
        score: 0.8,
        keywords: ['stock', 'market', 'trading']
      });
    }
    
    if (lowerText.includes('tech') || lowerText.includes('technology')) {
      topics.push({
        name: 'Technology',
        score: 0.7,
        keywords: ['tech', 'technology', 'innovation']
      });
    }
    
    if (lowerText.includes('finance') || lowerText.includes('banking')) {
      topics.push({
        name: 'Finance',
        score: 0.75,
        keywords: ['finance', 'banking', 'investment']
      });
    }
    
    // Generate summary
    const summary = text.length > 100 ? text.substring(0, 100) + '...' : text;
    
    return {
      text,
      sentiment: {
        score: sentimentScore,
        label: sentimentScore > 0 ? 'POSITIVE' : sentimentScore < 0 ? 'NEGATIVE' : 'NEUTRAL',
        confidence: Math.abs(sentimentScore) * 0.8 + 0.1
      },
      entities,
      topics,
      summary,
      language: 'en',
      wordCount: text.split(/\s+/).length,
      processingTime: Math.random() * 100 + 50 // Random processing time between 50-150ms
    };
  }

  /**
   * Generate a mock document processing result
   * @param documentUrl URL or path to the document
   * @param options Processing options
   * @returns Mock document processing result
   */
  private getMockDocumentResult(documentUrl: string, options?: ProcessDocumentOptions): ProcessDocumentResult {
    // Generate mock document content based on URL
    let documentContent = '';
    
    if (documentUrl.includes('earnings')) {
      documentContent = 'Quarterly Earnings Report: The company reported strong earnings this quarter, with revenue up 15% year-over-year. Net profit increased by 22%, exceeding analyst expectations. The board approved a dividend increase of 10%.';
    } else if (documentUrl.includes('research')) {
      documentContent = 'Market Research Report: Our analysis indicates a bullish trend in technology stocks for the next quarter. Key drivers include increased consumer spending on electronics and enterprise cloud adoption. However, supply chain constraints remain a concern.';
    } else if (documentUrl.includes('news')) {
      documentContent = 'Breaking News: Federal Reserve announces interest rate hike of 0.25%. Markets initially reacted negatively but recovered by end of trading session. Analysts expect minimal long-term impact on growth stocks.';
    } else {
      documentContent = 'Financial Document: This document contains important financial information about market trends, company performance, and future outlook. Please analyze carefully before making investment decisions.';
    }
    
    // Process the mock document content
    const textResult = this.getMockProcessingResult(documentContent, options);
    
    // Add document-specific information
    return {
      ...textResult,
      documentUrl,
      documentType: documentUrl.endsWith('.pdf') ? 'PDF' : 
                    documentUrl.endsWith('.docx') ? 'DOCX' : 
                    documentUrl.endsWith('.txt') ? 'TXT' : 'HTML',
      pageCount: Math.floor(Math.random() * 20) + 1,
      extractedText: documentContent
    };
  }
}

/**
 * Default model configuration
 */
export const DEFAULT_MODEL_CONFIG: NLPModelConfig = {
  sentimentModel: 'default',
  entityModel: 'default',
  topicModel: 'default',
  summarizationModel: 'default',
  language: 'en'
};

/**
 * Configuration interface for NLP service
 */
export interface NLPServiceConfig {
  apiKey: string;
  baseUrl?: string;
  modelConfig?: Partial<NLPModelConfig>;
}

/**
 * Configuration interface for NLP models
 */
export interface NLPModelConfig {
  sentimentModel: string;
  entityModel: string;
  topicModel: string;
  summarizationModel: string;
  language: string;
}

/**
 * Options for processing text
 */
export interface ProcessTextOptions {
  includeSentiment?: boolean;
  includeEntities?: boolean;
  includeTopics?: boolean;
  includeSummary?: boolean;
  language?: string;
}

/**
 * Options for processing documents
 */
export interface ProcessDocumentOptions extends ProcessTextOptions {
  extractText?: boolean;
  maxPages?: number;
}

/**
 * Result of text processing
 */
export interface ProcessTextResult {
  text: string;
  sentiment: Sentiment;
  entities: Entity[];
  topics: Topic[];
  summary: string;
  language: string;
  wordCount: number;
  processingTime: number;
}

/**
 * Result of document processing
 */
export interface ProcessDocumentResult extends ProcessTextResult {
  documentUrl: string;
  documentType: string;
  pageCount: number;
  extractedText: string;
}

/**
 * Sentiment analysis result
 */
export interface Sentiment {
  score: number;
  label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  confidence: number;
}

/**
 * Named entity
 */
export interface Entity {
  text: string;
  type: string;
  start: number;
  end: number;
  confidence: number;
}

/**
 * Topic
 */
export interface Topic {
  name: string;
  score: number;
  keywords: string[];
}