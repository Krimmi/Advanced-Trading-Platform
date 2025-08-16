/**
 * RealTimeNLPService - Service for real-time NLP analysis
 * 
 * This service continuously processes news, social media, and other text data
 * to provide real-time NLP insights for trading strategies.
 */

import { EventEmitter } from 'events';
import { NLPService } from './NLPService';
import { RealTimeMarketDataService, MarketNewsUpdate } from '../market-data/RealTimeMarketDataService';
import { 
  NLPSignal,
  DocumentType,
  EntityRecognitionResult,
  TopicModelingResult,
  TextSummaryResult
} from '../../models/nlp/NLPTypes';
import { StrategyType } from '../../models/strategy/StrategyTypes';

export interface NLPInsightUpdate {
  timestamp: Date;
  ticker: string;
  sentimentScore: number;
  sentimentLabel: 'positive' | 'negative' | 'neutral';
  confidence: number;
  source: string;
  text?: string;
  entities?: string[];
  topics?: string[];
  recommendedStrategyTypes?: StrategyType[];
  explanation?: string;
}

export interface EntityUpdate {
  timestamp: Date;
  ticker: string;
  entity: string;
  type: string;
  sentiment: number;
  frequency: number;
  source: string;
}

export interface TopicUpdate {
  timestamp: Date;
  ticker: string;
  topic: string;
  keywords: string[];
  sentiment: number;
  strength: number;
  source: string;
}

export interface NLPAlertConfig {
  sentimentThreshold?: number;
  sentimentChangeThreshold?: number;
  entityFrequencyThreshold?: number;
  topicStrengthThreshold?: number;
}

export class RealTimeNLPService extends EventEmitter {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly nlpService: NLPService;
  private readonly marketDataService: RealTimeMarketDataService;
  private readonly insightCache: Map<string, NLPInsightUpdate[]>;
  private readonly entityCache: Map<string, Map<string, EntityUpdate>>;
  private readonly topicCache: Map<string, Map<string, TopicUpdate>>;
  private readonly signalCache: Map<string, NLPSignal[]>;
  private readonly alertConfigs: Map<string, NLPAlertConfig>;
  private readonly updateIntervals: Map<string, NodeJS.Timeout>;
  private readonly processingQueue: Map<string, MarketNewsUpdate[]>;
  private readonly maxCacheSize: number;
  private readonly processingInterval: number;
  private isProcessing: Map<string, boolean>;
  private isInitialized: boolean;

  constructor(
    apiKey: string, 
    baseUrl: string = 'https://api.ninjatechfinance.com/v1',
    marketDataService?: RealTimeMarketDataService
  ) {
    super();
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.nlpService = new NLPService(apiKey, baseUrl);
    this.marketDataService = marketDataService || new RealTimeMarketDataService(apiKey, baseUrl);
    this.insightCache = new Map<string, NLPInsightUpdate[]>();
    this.entityCache = new Map<string, Map<string, EntityUpdate>>();
    this.topicCache = new Map<string, Map<string, TopicUpdate>>();
    this.signalCache = new Map<string, NLPSignal[]>();
    this.alertConfigs = new Map<string, NLPAlertConfig>();
    this.updateIntervals = new Map<string, NodeJS.Timeout>();
    this.processingQueue = new Map<string, MarketNewsUpdate[]>();
    this.maxCacheSize = 100; // Keep last 100 insights
    this.processingInterval = 10000; // Process queue every 10 seconds
    this.isProcessing = new Map<string, boolean>();
    this.isInitialized = false;
  }

  /**
   * Initialize the service and set up data subscriptions
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize market data service if not already initialized
      if (!this.marketDataService['isInitialized']) {
        await this.marketDataService.initialize();
      }
      
      this.isInitialized = true;
      this.emit('initialized');
      console.log('RealTimeNLPService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RealTimeNLPService:', error);
      throw new Error('Failed to initialize RealTimeNLPService');
    }
  }

  /**
   * Start real-time NLP processing for a ticker
   * @param ticker The ticker symbol to process
   * @param interval Processing interval in milliseconds (default: 10000)
   */
  public startProcessing(
    ticker: string,
    interval: number = this.processingInterval
  ): void {
    if (!this.isInitialized) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    // Stop any existing processing for this ticker
    this.stopProcessing(ticker);
    
    // Initialize caches for this ticker
    if (!this.insightCache.has(ticker)) {
      this.insightCache.set(ticker, []);
    }
    
    if (!this.entityCache.has(ticker)) {
      this.entityCache.set(ticker, new Map<string, EntityUpdate>());
    }
    
    if (!this.topicCache.has(ticker)) {
      this.topicCache.set(ticker, new Map<string, TopicUpdate>());
    }
    
    if (!this.signalCache.has(ticker)) {
      this.signalCache.set(ticker, []);
    }
    
    if (!this.processingQueue.has(ticker)) {
      this.processingQueue.set(ticker, []);
    }
    
    // Subscribe to news updates
    const newsUnsubscribe = this.marketDataService.subscribeToNewsUpdates(
      ticker,
      this.handleNewsUpdate.bind(this)
    );
    
    // Set up interval for periodic processing
    const updateInterval = setInterval(() => {
      this.processQueue(ticker);
    }, interval);
    
    // Store interval and unsubscribe functions
    this.updateIntervals.set(ticker, updateInterval);
    this.updateIntervals.set(`${ticker}_news_unsubscribe`, newsUnsubscribe as any);
    
    // Set processing flag
    this.isProcessing.set(ticker, false);
    
    console.log(`Started real-time NLP processing for ${ticker}`);
  }

  /**
   * Stop real-time NLP processing for a ticker
   * @param ticker The ticker symbol to stop processing
   */
  public stopProcessing(ticker: string): void {
    // Clear update interval
    if (this.updateIntervals.has(ticker)) {
      clearInterval(this.updateIntervals.get(ticker) as NodeJS.Timeout);
      this.updateIntervals.delete(ticker);
    }
    
    // Unsubscribe from news updates
    if (this.updateIntervals.has(`${ticker}_news_unsubscribe`)) {
      const unsubscribe = this.updateIntervals.get(`${ticker}_news_unsubscribe`) as () => void;
      unsubscribe();
      this.updateIntervals.delete(`${ticker}_news_unsubscribe`);
    }
    
    // Clear processing flag
    this.isProcessing.set(ticker, false);
    
    console.log(`Stopped real-time NLP processing for ${ticker}`);
  }

  /**
   * Handle news updates from the market data service
   * @param update News update data
   */
  private handleNewsUpdate(update: MarketNewsUpdate): void {
    const ticker = update.ticker;
    
    // Add to processing queue
    const queue = this.processingQueue.get(ticker) || [];
    queue.push(update);
    this.processingQueue.set(ticker, queue);
    
    // Emit news received event
    this.emit('news-received', update);
    this.emit(`news-received:${ticker}`, update);
    
    // Process immediately if high confidence sentiment
    if (update.sentiment && update.sentiment.confidence > 0.8) {
      this.processNewsItem(ticker, update);
    }
  }

  /**
   * Process the news queue for a ticker
   * @param ticker The ticker symbol
   */
  private async processQueue(ticker: string): Promise<void> {
    // Check if already processing
    if (this.isProcessing.get(ticker)) {
      return;
    }
    
    // Get queue
    const queue = this.processingQueue.get(ticker) || [];
    if (queue.length === 0) {
      return;
    }
    
    // Set processing flag
    this.isProcessing.set(ticker, true);
    
    try {
      // Process up to 5 items at a time
      const itemsToProcess = queue.splice(0, 5);
      this.processingQueue.set(ticker, queue);
      
      // Process each item
      const processingPromises = itemsToProcess.map(item => this.processNewsItem(ticker, item));
      await Promise.all(processingPromises);
      
      // If queue still has items, schedule another processing
      if (queue.length > 0) {
        setTimeout(() => {
          this.processQueue(ticker);
        }, 1000);
      }
    } catch (error) {
      console.error(`Error processing NLP queue for ${ticker}:`, error);
    } finally {
      // Clear processing flag
      this.isProcessing.set(ticker, false);
    }
  }

  /**
   * Process a single news item
   * @param ticker The ticker symbol
   * @param newsItem The news item to process
   */
  private async processNewsItem(ticker: string, newsItem: MarketNewsUpdate): Promise<void> {
    try {
      // Extract sentiment
      let sentimentScore = 0.5; // Neutral default
      let sentimentLabel: 'positive' | 'negative' | 'neutral' = 'neutral';
      let confidence = 0.5;
      
      if (newsItem.sentiment) {
        sentimentScore = newsItem.sentiment.score;
        sentimentLabel = newsItem.sentiment.label;
        confidence = newsItem.sentiment.confidence;
      } else {
        // Analyze sentiment if not provided
        const sentimentResult = await this.nlpService.getSentimentAnalysis(ticker);
        if (sentimentResult) {
          sentimentScore = sentimentResult.score;
          sentimentLabel = sentimentResult.score > 0.6 ? 'positive' : 
                          sentimentResult.score < 0.4 ? 'negative' : 'neutral';
          confidence = sentimentResult.confidence || 0.5;
        }
      }
      
      // Create insight update
      const insightUpdate: NLPInsightUpdate = {
        timestamp: new Date(),
        ticker,
        sentimentScore,
        sentimentLabel,
        confidence,
        source: newsItem.source,
        text: newsItem.summary || newsItem.headline
      };
      
      // Process entities
      try {
        const entityResult = await this.nlpService.recognizeEntities(
          newsItem.summary || newsItem.headline,
          DocumentType.NEWS
        );
        
        await this.processEntityResult(ticker, entityResult, sentimentScore);
        
        // Add entities to insight
        insightUpdate.entities = entityResult.entities.map(e => e.text);
      } catch (error) {
        console.error(`Error processing entities for ${ticker}:`, error);
      }
      
      // Process topics
      try {
        const topicResult = await this.nlpService.modelTopics(
          [newsItem.summary || newsItem.headline],
          3,
          DocumentType.NEWS
        );
        
        await this.processTopicResult(ticker, topicResult, sentimentScore);
        
        // Add topics to insight
        insightUpdate.topics = topicResult.topics.map(t => t.name);
      } catch (error) {
        console.error(`Error processing topics for ${ticker}:`, error);
      }
      
      // Generate trading signals
      try {
        const signals = await this.nlpService.generateTradingSignals(ticker);
        
        // Update signal cache
        this.signalCache.set(ticker, signals);
        
        // Analyze signals for strategy types
        const recommendedTypes = this.analyzeSignalsForStrategyTypes(signals);
        
        // Add to insight
        insightUpdate.recommendedStrategyTypes = recommendedTypes;
        insightUpdate.explanation = this.generateStrategyExplanation(signals, recommendedTypes);
      } catch (error) {
        console.error(`Error generating trading signals for ${ticker}:`, error);
      }
      
      // Update insight cache
      const insights = this.insightCache.get(ticker) || [];
      insights.push(insightUpdate);
      
      // Limit cache size
      if (insights.length > this.maxCacheSize) {
        insights.shift();
      }
      
      this.insightCache.set(ticker, insights);
      
      // Emit insight update event
      this.emit('nlp-insight-update', insightUpdate);
      this.emit(`nlp-insight-update:${ticker}`, insightUpdate);
      
      // Check for significant sentiment changes
      this.checkForSignificantChanges(ticker, insightUpdate);
    } catch (error) {
      console.error(`Error processing news item for ${ticker}:`, error);
    }
  }

  /**
   * Process entity recognition results
   * @param ticker The ticker symbol
   * @param result Entity recognition result
   * @param sentimentScore Overall sentiment score
   */
  private async processEntityResult(
    ticker: string,
    result: EntityRecognitionResult,
    sentimentScore: number
  ): Promise<void> {
    // Get entity cache for this ticker
    const entityMap = this.entityCache.get(ticker) || new Map<string, EntityUpdate>();
    
    // Process each entity
    for (const entity of result.entities) {
      const entityKey = `${entity.type}:${entity.text}`;
      const existingEntity = entityMap.get(entityKey);
      
      // Create or update entity
      const entityUpdate: EntityUpdate = {
        timestamp: new Date(),
        ticker,
        entity: entity.text,
        type: entity.type,
        sentiment: sentimentScore,
        frequency: existingEntity ? existingEntity.frequency + 1 : 1,
        source: result.rawText.substring(0, 50) + '...'
      };
      
      // Update cache
      entityMap.set(entityKey, entityUpdate);
      
      // Emit entity update event
      this.emit('entity-update', entityUpdate);
      this.emit(`entity-update:${ticker}`, entityUpdate);
      
      // Check for high-frequency entities
      const alertConfig = this.alertConfigs.get(ticker) || {};
      if (alertConfig.entityFrequencyThreshold && 
          entityUpdate.frequency >= alertConfig.entityFrequencyThreshold) {
        this.emit('high-frequency-entity', {
          ticker,
          entity: entityUpdate.entity,
          type: entityUpdate.type,
          frequency: entityUpdate.frequency,
          timestamp: entityUpdate.timestamp
        });
      }
    }
    
    // Update entity cache
    this.entityCache.set(ticker, entityMap);
  }

  /**
   * Process topic modeling results
   * @param ticker The ticker symbol
   * @param result Topic modeling result
   * @param sentimentScore Overall sentiment score
   */
  private async processTopicResult(
    ticker: string,
    result: TopicModelingResult,
    sentimentScore: number
  ): Promise<void> {
    // Get topic cache for this ticker
    const topicMap = this.topicCache.get(ticker) || new Map<string, TopicUpdate>();
    
    // Process each topic
    for (const topic of result.topics) {
      const existingTopic = topicMap.get(topic.id);
      
      // Create or update topic
      const topicUpdate: TopicUpdate = {
        timestamp: new Date(),
        ticker,
        topic: topic.name,
        keywords: topic.keywords,
        sentiment: topic.sentimentScore || sentimentScore,
        strength: existingTopic ? existingTopic.strength + topic.weight : topic.weight,
        source: 'Topic Modeling'
      };
      
      // Update cache
      topicMap.set(topic.id, topicUpdate);
      
      // Emit topic update event
      this.emit('topic-update', topicUpdate);
      this.emit(`topic-update:${ticker}`, topicUpdate);
      
      // Check for strong topics
      const alertConfig = this.alertConfigs.get(ticker) || {};
      if (alertConfig.topicStrengthThreshold && 
          topicUpdate.strength >= alertConfig.topicStrengthThreshold) {
        this.emit('strong-topic', {
          ticker,
          topic: topicUpdate.topic,
          keywords: topicUpdate.keywords,
          strength: topicUpdate.strength,
          timestamp: topicUpdate.timestamp
        });
      }
    }
    
    // Update topic cache
    this.topicCache.set(ticker, topicMap);
  }

  /**
   * Check for significant sentiment changes
   * @param ticker The ticker symbol
   * @param insight Latest NLP insight
   */
  private checkForSignificantChanges(ticker: string, insight: NLPInsightUpdate): void {
    const insights = this.insightCache.get(ticker) || [];
    
    // Need at least 2 insights to compare
    if (insights.length < 2) {
      return;
    }
    
    // Get previous insight
    const previousInsight = insights[insights.length - 2];
    
    // Calculate sentiment change
    const sentimentChange = insight.sentimentScore - previousInsight.sentimentScore;
    
    // Check if change exceeds alert threshold
    const alertConfig = this.alertConfigs.get(ticker) || {};
    if (alertConfig.sentimentChangeThreshold && 
        Math.abs(sentimentChange) >= alertConfig.sentimentChangeThreshold) {
      this.emit('significant-sentiment-change', {
        ticker,
        previousSentiment: previousInsight.sentimentScore,
        currentSentiment: insight.sentimentScore,
        sentimentChange,
        timestamp: insight.timestamp
      });
    }
    
    // Check absolute sentiment threshold
    if (alertConfig.sentimentThreshold) {
      if (insight.sentimentScore >= 0.5 + alertConfig.sentimentThreshold) {
        this.emit('high-positive-sentiment', {
          ticker,
          sentiment: insight.sentimentScore,
          text: insight.text,
          timestamp: insight.timestamp
        });
      } else if (insight.sentimentScore <= 0.5 - alertConfig.sentimentThreshold) {
        this.emit('high-negative-sentiment', {
          ticker,
          sentiment: insight.sentimentScore,
          text: insight.text,
          timestamp: insight.timestamp
        });
      }
    }
  }

  /**
   * Analyze NLP signals to determine suitable strategy types
   * @param signals Array of NLP signals
   * @returns Array of recommended strategy types
   */
  private analyzeSignalsForStrategyTypes(signals: NLPSignal[]): StrategyType[] {
    const recommendedTypes: StrategyType[] = [];
    
    // Count signal directions
    const bullishCount = signals.filter(signal => signal.direction === 'bullish').length;
    const bearishCount = signals.filter(signal => signal.direction === 'bearish').length;
    const neutralCount = signals.filter(signal => signal.direction === 'neutral').length;
    
    // Check for strong sentiment signals
    const sentimentSignals = signals.filter(signal => signal.signalType === 'sentiment');
    const strongSentimentSignal = sentimentSignals.some(signal => signal.strength > 0.7);
    
    // Check for event signals
    const eventSignals = signals.filter(signal => signal.signalType === 'event');
    const hasEventSignals = eventSignals.length > 0;
    
    // Determine strategy types based on signals
    if (bullishCount > bearishCount + neutralCount) {
      recommendedTypes.push(StrategyType.MOMENTUM);
      recommendedTypes.push(StrategyType.TREND_FOLLOWING);
    } else if (bearishCount > bullishCount + neutralCount) {
      recommendedTypes.push(StrategyType.MEAN_REVERSION);
    } else {
      recommendedTypes.push(StrategyType.STATISTICAL_ARBITRAGE);
      recommendedTypes.push(StrategyType.PAIRS_TRADING);
    }
    
    if (strongSentimentSignal) {
      recommendedTypes.push(StrategyType.SENTIMENT_BASED);
    }
    
    if (hasEventSignals) {
      recommendedTypes.push(StrategyType.EVENT_DRIVEN);
    }
    
    // Always include machine learning as an option
    recommendedTypes.push(StrategyType.MACHINE_LEARNING);
    
    return [...new Set(recommendedTypes)]; // Remove duplicates
  }

  /**
   * Generate explanation for strategy recommendations
   * @param signals Array of NLP signals
   * @param recommendedTypes Array of recommended strategy types
   * @returns Explanation string
   */
  private generateStrategyExplanation(signals: NLPSignal[], recommendedTypes: StrategyType[]): string {
    // Count signal directions
    const bullishCount = signals.filter(signal => signal.direction === 'bullish').length;
    const bearishCount = signals.filter(signal => signal.direction === 'bearish').length;
    const neutralCount = signals.filter(signal => signal.direction === 'neutral').length;
    
    // Generate explanation
    let explanation = `Based on the analysis of ${signals.length} NLP signals, `;
    
    if (bullishCount > bearishCount + neutralCount) {
      explanation += `the overall sentiment is bullish (${bullishCount} bullish signals vs ${bearishCount} bearish). `;
      explanation += `This suggests momentum and trend-following strategies may be effective. `;
    } else if (bearishCount > bullishCount + neutralCount) {
      explanation += `the overall sentiment is bearish (${bearishCount} bearish signals vs ${bullishCount} bullish). `;
      explanation += `This suggests mean-reversion strategies may be appropriate. `;
    } else {
      explanation += `the sentiment is mixed or neutral. `;
      explanation += `This suggests statistical arbitrage or pairs trading strategies may be suitable. `;
    }
    
    // Add explanation for each recommended strategy type
    explanation += `\n\nRecommended strategy types:\n`;
    recommendedTypes.forEach(type => {
      switch (type) {
        case StrategyType.MOMENTUM:
          explanation += `- Momentum: Capitalize on continuing price trends based on positive sentiment.\n`;
          break;
        case StrategyType.MEAN_REVERSION:
          explanation += `- Mean Reversion: Capitalize on price reversals after negative sentiment extremes.\n`;
          break;
        case StrategyType.TREND_FOLLOWING:
          explanation += `- Trend Following: Follow established trends identified through sentiment analysis.\n`;
          break;
        case StrategyType.SENTIMENT_BASED:
          explanation += `- Sentiment Based: Directly trade based on sentiment signals from news and social media.\n`;
          break;
        case StrategyType.EVENT_DRIVEN:
          explanation += `- Event Driven: Capitalize on specific events identified through NLP analysis.\n`;
          break;
        case StrategyType.MACHINE_LEARNING:
          explanation += `- Machine Learning: Use ML models that incorporate NLP features for prediction.\n`;
          break;
        case StrategyType.STATISTICAL_ARBITRAGE:
          explanation += `- Statistical Arbitrage: Exploit price inefficiencies during mixed sentiment periods.\n`;
          break;
        case StrategyType.PAIRS_TRADING:
          explanation += `- Pairs Trading: Trade correlated assets based on relative sentiment divergence.\n`;
          break;
        default:
          break;
      }
    });
    
    return explanation;
  }

  /**
   * Set alert configuration for a ticker
   * @param ticker The ticker symbol
   * @param config Alert configuration
   */
  public setAlertConfig(ticker: string, config: NLPAlertConfig): void {
    this.alertConfigs.set(ticker, config);
  }

  /**
   * Get latest NLP insights for a ticker
   * @param ticker The ticker symbol
   * @param limit Maximum number of insights to return
   * @returns Array of NLP insights
   */
  public getLatestInsights(ticker: string, limit: number = 10): NLPInsightUpdate[] {
    const insights = this.insightCache.get(ticker) || [];
    return insights.slice(-limit);
  }

  /**
   * Get latest trading signals for a ticker
   * @param ticker The ticker symbol
   * @returns Array of NLP signals
   */
  public getLatestSignals(ticker: string): NLPSignal[] {
    return this.signalCache.get(ticker) || [];
  }

  /**
   * Get top entities for a ticker
   * @param ticker The ticker symbol
   * @param limit Maximum number of entities to return
   * @returns Array of entity updates
   */
  public getTopEntities(ticker: string, limit: number = 10): EntityUpdate[] {
    const entityMap = this.entityCache.get(ticker);
    if (!entityMap) {
      return [];
    }
    
    return Array.from(entityMap.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);
  }

  /**
   * Get top topics for a ticker
   * @param ticker The ticker symbol
   * @param limit Maximum number of topics to return
   * @returns Array of topic updates
   */
  public getTopTopics(ticker: string, limit: number = 5): TopicUpdate[] {
    const topicMap = this.topicCache.get(ticker);
    if (!topicMap) {
      return [];
    }
    
    return Array.from(topicMap.values())
      .sort((a, b) => b.strength - a.strength)
      .slice(0, limit);
  }

  /**
   * Subscribe to NLP insight updates for a ticker
   * @param ticker The ticker symbol
   * @param callback Callback function
   * @returns Unsubscribe function
   */
  public subscribeToInsightUpdates(
    ticker: string,
    callback: (insight: NLPInsightUpdate) => void
  ): () => void {
    const eventName = `nlp-insight-update:${ticker}`;
    this.on(eventName, callback);
    
    // Return unsubscribe function
    return () => {
      this.off(eventName, callback);
    };
  }

  /**
   * Subscribe to entity updates for a ticker
   * @param ticker The ticker symbol
   * @param callback Callback function
   * @returns Unsubscribe function
   */
  public subscribeToEntityUpdates(
    ticker: string,
    callback: (entity: EntityUpdate) => void
  ): () => void {
    const eventName = `entity-update:${ticker}`;
    this.on(eventName, callback);
    
    // Return unsubscribe function
    return () => {
      this.off(eventName, callback);
    };
  }

  /**
   * Subscribe to topic updates for a ticker
   * @param ticker The ticker symbol
   * @param callback Callback function
   * @returns Unsubscribe function
   */
  public subscribeToTopicUpdates(
    ticker: string,
    callback: (topic: TopicUpdate) => void
  ): () => void {
    const eventName = `topic-update:${ticker}`;
    this.on(eventName, callback);
    
    // Return unsubscribe function
    return () => {
      this.off(eventName, callback);
    };
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    // Stop all processing
    const tickers = new Set<string>();
    this.updateIntervals.forEach((_, key) => {
      if (!key.includes('_')) {
        tickers.add(key);
      }
    });
    
    tickers.forEach(ticker => {
      this.stopProcessing(ticker);
    });
    
    // Clear all event listeners
    this.removeAllListeners();
    
    console.log('RealTimeNLPService disposed');
  }
}

export default RealTimeNLPService;