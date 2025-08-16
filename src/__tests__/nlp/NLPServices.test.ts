/**
 * NLP Services Integration Tests
 * 
 * This file contains integration tests for the NLP services.
 * Note: These tests require a valid API key and internet connection.
 */

import { NLPService } from '../../services/nlp/NLPService';
import { EntityRecognitionService } from '../../services/nlp/EntityRecognitionService';
import { TopicModelingService } from '../../services/nlp/TopicModelingService';
import { TextSummarizationService } from '../../services/nlp/TextSummarizationService';
import { TradingSignalsService } from '../../services/nlp/TradingSignalsService';
import { DocumentType } from '../../models/nlp/NLPTypes';

// Mock API key for testing
const API_KEY = 'test_api_key';
const BASE_URL = 'https://api.ninjatechfinance.com/v1';

// Sample financial text for testing
const SAMPLE_TEXT = `
Apple Inc. reported strong quarterly earnings, with revenue reaching $89.5 billion, exceeding analyst expectations.
CEO Tim Cook highlighted the success of iPhone 15 sales and growth in services revenue.
The company announced a 5% increase in its quarterly dividend and authorized an additional $90 billion for share repurchases.
However, sales in China declined by 2.5% year-over-year, causing some concern among investors.
`;

// Mock axios to prevent actual API calls during tests
jest.mock('axios', () => ({
  post: jest.fn().mockImplementation((url, data, config) => {
    // Mock responses based on the URL
    if (url.includes('/entity-recognition')) {
      return Promise.resolve({
        data: {
          entities: [
            {
              text: 'Apple Inc.',
              type: 'company',
              startChar: 0,
              endChar: 10,
              confidence: 0.95,
              metadata: {
                ticker: 'AAPL',
                exchange: 'NASDAQ',
                sector: 'Technology'
              }
            },
            {
              text: 'Tim Cook',
              type: 'person',
              startChar: 97,
              endChar: 105,
              confidence: 0.92,
              metadata: {
                role: 'CEO',
                organization: 'Apple Inc.'
              }
            },
            {
              text: '$89.5 billion',
              type: 'money',
              startChar: 65,
              endChar: 78,
              confidence: 0.98,
              metadata: {}
            }
          ],
          confidence: 0.95,
          processingTime: 0.25,
          modelVersion: 'test-1.0.0'
        }
      });
    } else if (url.includes('/topic-modeling')) {
      return Promise.resolve({
        data: {
          topics: [
            {
              id: 'topic_1',
              keywords: ['earnings', 'revenue', 'billion', 'quarterly'],
              weight: 0.6,
              sentimentScore: 0.4,
              relatedEntities: []
            },
            {
              id: 'topic_2',
              keywords: ['iphone', 'sales', 'growth', 'services'],
              weight: 0.3,
              sentimentScore: 0.5,
              relatedEntities: []
            },
            {
              id: 'topic_3',
              keywords: ['dividend', 'increase', 'share', 'repurchases'],
              weight: 0.1,
              sentimentScore: 0.3,
              relatedEntities: []
            }
          ],
          documentTopicAssignments: [],
          coherenceScore: 0.75,
          perplexity: 1.25,
          modelVersion: 'test-1.0.0'
        }
      });
    } else if (url.includes('/summarization')) {
      return Promise.resolve({
        data: {
          summary: 'Apple Inc. reported strong quarterly earnings with revenue of $89.5 billion, exceeding expectations. CEO Tim Cook highlighted iPhone 15 sales and services growth. The company increased its dividend by 5% and authorized $90 billion for share repurchases. China sales declined by 2.5% year-over-year.',
          compressionRatio: 0.5,
          modelVersion: 'test-1.0.0'
        }
      });
    } else if (url.includes('/trading-signals')) {
      return Promise.resolve({
        data: {
          signals: [
            {
              source: 'news',
              signalType: 'sentiment',
              direction: 'bullish',
              strength: {
                value: 0.8,
                factors: [{ factor: 'sentiment_magnitude', contribution: 0.8 }]
              },
              confidence: {
                value: 0.7,
                factors: [{ factor: 'data_quality', contribution: 0.7 }]
              },
              timestamp: new Date().toISOString(),
              explanation: 'Strong positive sentiment detected in recent news articles',
              supportingEvidence: [
                {
                  text: 'Apple Inc. reported strong quarterly earnings',
                  source: 'news',
                  date: new Date().toISOString()
                }
              ],
              timeframe: 'short_term',
              relatedSignals: []
            }
          ]
        }
      });
    }
    
    // Default response
    return Promise.resolve({ data: {} });
  }),
  get: jest.fn().mockResolvedValue({ data: {} })
}));

describe('NLP Services Integration Tests', () => {
  // Test NLPService
  describe('NLPService', () => {
    let nlpService: NLPService;

    beforeEach(() => {
      nlpService = new NLPService(API_KEY, BASE_URL);
    });

    test('recognizeEntities should return entity recognition results', async () => {
      const result = await nlpService.recognizeEntities(SAMPLE_TEXT, DocumentType.NEWS);
      
      expect(result).toBeDefined();
      expect(result.entities).toHaveLength(3);
      expect(result.entities[0].text).toBe('Apple Inc.');
      expect(result.entities[0].type).toBe('company');
    });

    test('getModelVersion should return the correct version', () => {
      const version = nlpService.getModelVersion('entity_recognition' as any);
      expect(version).toBeDefined();
    });
  });

  // Test EntityRecognitionService
  describe('EntityRecognitionService', () => {
    let entityService: EntityRecognitionService;

    beforeEach(() => {
      entityService = new EntityRecognitionService(API_KEY, BASE_URL);
    });

    test('recognizeEntities should return entity recognition results', async () => {
      const result = await entityService.recognizeEntities(SAMPLE_TEXT, DocumentType.NEWS);
      
      expect(result).toBeDefined();
      expect(result.entities).toHaveLength(3);
      expect(result.entities[0].text).toBe('Apple Inc.');
      expect(result.entities[0].type).toBe('company');
    });
  });

  // Test TopicModelingService
  describe('TopicModelingService', () => {
    let topicService: TopicModelingService;

    beforeEach(() => {
      topicService = new TopicModelingService(API_KEY, BASE_URL);
    });

    test('extractTopics should return topic modeling results', async () => {
      const texts = [SAMPLE_TEXT, SAMPLE_TEXT]; // Need at least 2 texts
      const result = await topicService.extractTopics(texts, 3, DocumentType.NEWS);
      
      expect(result).toBeDefined();
      expect(result.topics).toHaveLength(3);
      expect(result.topics[0].keywords).toContain('earnings');
      expect(result.coherenceScore).toBe(0.75);
    });
  });

  // Test TextSummarizationService
  describe('TextSummarizationService', () => {
    let summarizationService: TextSummarizationService;

    beforeEach(() => {
      summarizationService = new TextSummarizationService(API_KEY, BASE_URL);
    });

    test('summarizeText should return text summary results', async () => {
      const result = await summarizationService.summarizeText(SAMPLE_TEXT, 200, DocumentType.NEWS);
      
      expect(result).toBeDefined();
      expect(result.summary).toContain('Apple Inc.');
      expect(result.compressionRatio).toBe(0.5);
    });
  });

  // Test TradingSignalsService
  describe('TradingSignalsService', () => {
    let signalsService: TradingSignalsService;

    beforeEach(() => {
      signalsService = new TradingSignalsService(API_KEY, BASE_URL);
    });

    test('generateTradingSignals should return trading signals', async () => {
      const result = await signalsService.generateTradingSignals('AAPL', ['news']);
      
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].direction).toBe('bullish');
      expect(result[0].signalType).toBe('sentiment');
    });
  });
});