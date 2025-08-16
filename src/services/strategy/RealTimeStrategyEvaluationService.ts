/**
 * RealTimeStrategyEvaluationService - Service for real-time strategy evaluation
 * 
 * This service continuously evaluates trading strategies based on real-time market data,
 * providing up-to-date rankings, scores, and performance metrics.
 */

import { EventEmitter } from 'events';
import { 
  TradingStrategy, 
  StrategyType,
  MarketCondition,
  StrategyRecommendation
} from '../../models/strategy/StrategyTypes';
import { StrategyEvaluationService } from './StrategyEvaluationService';
import { RealTimeMarketDataService, MarketDataUpdate, MarketNewsUpdate } from '../market-data/RealTimeMarketDataService';
import { NLPService } from '../nlp/NLPService';

export interface StrategyEvaluationUpdate {
  timestamp: Date;
  ticker: string;
  strategy: TradingStrategy;
  overallScore: number;
  performanceScore: number;
  riskScore: number;
  marketConditionScore: number;
  robustnessScore: number;
  nlpScore: number;
  recentPriceChange: number;
  recentVolatility: number;
  currentMarketCondition: MarketCondition;
  latestNews?: MarketNewsUpdate;
}

export interface StrategyRankingUpdate {
  timestamp: Date;
  ticker: string;
  rankings: {
    strategy: TradingStrategy;
    overallScore: number;
    changeFromLastUpdate: number;
  }[];
  marketCondition: MarketCondition;
}

export interface StrategyAlertConfig {
  scoreThreshold?: number;
  scoreChangeThreshold?: number;
  rankChangeThreshold?: number;
  newsImpactThreshold?: number;
}

export class RealTimeStrategyEvaluationService extends EventEmitter {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly evaluationService: StrategyEvaluationService;
  private readonly marketDataService: RealTimeMarketDataService;
  private readonly nlpService: NLPService;
  private readonly evaluationCache: Map<string, Map<string, StrategyEvaluationUpdate>>;
  private readonly rankingCache: Map<string, StrategyRankingUpdate>;
  private readonly priceHistory: Map<string, MarketDataUpdate[]>;
  private readonly newsHistory: Map<string, MarketNewsUpdate[]>;
  private readonly alertConfigs: Map<string, StrategyAlertConfig>;
  private readonly updateIntervals: Map<string, NodeJS.Timeout>;
  private readonly maxHistorySize: number;
  private readonly evaluationInterval: number;
  private isInitialized: boolean;

  constructor(
    apiKey: string, 
    baseUrl: string = 'https://api.ninjatechfinance.com/v1',
    marketDataService?: RealTimeMarketDataService
  ) {
    super();
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.evaluationService = new StrategyEvaluationService(apiKey, baseUrl);
    this.marketDataService = marketDataService || new RealTimeMarketDataService(apiKey, baseUrl);
    this.nlpService = new NLPService(apiKey, baseUrl);
    this.evaluationCache = new Map<string, Map<string, StrategyEvaluationUpdate>>();
    this.rankingCache = new Map<string, StrategyRankingUpdate>();
    this.priceHistory = new Map<string, MarketDataUpdate[]>();
    this.newsHistory = new Map<string, MarketNewsUpdate[]>();
    this.alertConfigs = new Map<string, StrategyAlertConfig>();
    this.updateIntervals = new Map<string, NodeJS.Timeout>();
    this.maxHistorySize = 100; // Keep last 100 price updates
    this.evaluationInterval = 60000; // Re-evaluate every minute by default
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
      console.log('RealTimeStrategyEvaluationService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RealTimeStrategyEvaluationService:', error);
      throw new Error('Failed to initialize RealTimeStrategyEvaluationService');
    }
  }

  /**
   * Start real-time evaluation for a ticker and set of strategies
   * @param ticker The ticker symbol to evaluate
   * @param strategies Array of strategies to evaluate
   * @param interval Evaluation interval in milliseconds (default: 60000)
   */
  public startEvaluation(
    ticker: string, 
    strategies: TradingStrategy[],
    interval: number = this.evaluationInterval
  ): void {
    if (!this.isInitialized) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    // Stop any existing evaluation for this ticker
    this.stopEvaluation(ticker);
    
    // Initialize caches for this ticker
    if (!this.evaluationCache.has(ticker)) {
      this.evaluationCache.set(ticker, new Map<string, StrategyEvaluationUpdate>());
    }
    
    if (!this.priceHistory.has(ticker)) {
      this.priceHistory.set(ticker, []);
    }
    
    if (!this.newsHistory.has(ticker)) {
      this.newsHistory.set(ticker, []);
    }
    
    // Subscribe to price updates
    const priceUnsubscribe = this.marketDataService.subscribeToPriceUpdates(
      ticker,
      this.handlePriceUpdate.bind(this)
    );
    
    // Subscribe to news updates
    const newsUnsubscribe = this.marketDataService.subscribeToNewsUpdates(
      ticker,
      this.handleNewsUpdate.bind(this)
    );
    
    // Perform initial evaluation
    this.evaluateStrategies(ticker, strategies);
    
    // Set up interval for periodic re-evaluation
    const updateInterval = setInterval(() => {
      this.evaluateStrategies(ticker, strategies);
    }, interval);
    
    // Store interval and unsubscribe functions
    this.updateIntervals.set(ticker, updateInterval);
    this.updateIntervals.set(`${ticker}_price_unsubscribe`, priceUnsubscribe as any);
    this.updateIntervals.set(`${ticker}_news_unsubscribe`, newsUnsubscribe as any);
    
    console.log(`Started real-time evaluation for ${ticker} with ${strategies.length} strategies`);
  }

  /**
   * Stop real-time evaluation for a ticker
   * @param ticker The ticker symbol to stop evaluating
   */
  public stopEvaluation(ticker: string): void {
    // Clear update interval
    if (this.updateIntervals.has(ticker)) {
      clearInterval(this.updateIntervals.get(ticker) as NodeJS.Timeout);
      this.updateIntervals.delete(ticker);
    }
    
    // Unsubscribe from price updates
    if (this.updateIntervals.has(`${ticker}_price_unsubscribe`)) {
      const unsubscribe = this.updateIntervals.get(`${ticker}_price_unsubscribe`) as () => void;
      unsubscribe();
      this.updateIntervals.delete(`${ticker}_price_unsubscribe`);
    }
    
    // Unsubscribe from news updates
    if (this.updateIntervals.has(`${ticker}_news_unsubscribe`)) {
      const unsubscribe = this.updateIntervals.get(`${ticker}_news_unsubscribe`) as () => void;
      unsubscribe();
      this.updateIntervals.delete(`${ticker}_news_unsubscribe`);
    }
    
    console.log(`Stopped real-time evaluation for ${ticker}`);
  }

  /**
   * Handle price updates from the market data service
   * @param update Price update data
   */
  private handlePriceUpdate(update: MarketDataUpdate): void {
    const ticker = update.ticker;
    
    // Add to price history
    const history = this.priceHistory.get(ticker) || [];
    history.push(update);
    
    // Limit history size
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
    
    this.priceHistory.set(ticker, history);
    
    // Emit price update event
    this.emit('price-update', update);
    this.emit(`price-update:${ticker}`, update);
    
    // Check for significant price changes that might trigger immediate re-evaluation
    if (history.length >= 2) {
      const previousPrice = history[history.length - 2].price;
      const currentPrice = update.price;
      const priceChange = (currentPrice - previousPrice) / previousPrice;
      
      // If price change is significant (more than 1%), trigger immediate re-evaluation
      if (Math.abs(priceChange) > 0.01) {
        this.emit('significant-price-change', {
          ticker,
          previousPrice,
          currentPrice,
          priceChange,
          timestamp: update.timestamp
        });
        
        // Re-evaluate strategies if we have them cached
        const evaluationMap = this.evaluationCache.get(ticker);
        if (evaluationMap && evaluationMap.size > 0) {
          const strategies = Array.from(evaluationMap.values()).map(update => update.strategy);
          this.evaluateStrategies(ticker, strategies);
        }
      }
    }
  }

  /**
   * Handle news updates from the market data service
   * @param update News update data
   */
  private handleNewsUpdate(update: MarketNewsUpdate): void {
    const ticker = update.ticker;
    
    // Add to news history
    const history = this.newsHistory.get(ticker) || [];
    history.push(update);
    
    // Limit history size
    if (history.length > 50) {
      history.shift();
    }
    
    this.newsHistory.set(ticker, history);
    
    // Emit news update event
    this.emit('news-update', update);
    this.emit(`news-update:${ticker}`, update);
    
    // Check if this is high-impact news based on sentiment
    if (update.sentiment && Math.abs(update.sentiment.score - 0.5) > 0.3 && update.sentiment.confidence > 0.7) {
      this.emit('high-impact-news', {
        ticker,
        headline: update.headline,
        sentiment: update.sentiment,
        timestamp: update.timestamp
      });
      
      // Re-evaluate strategies if we have them cached
      const evaluationMap = this.evaluationCache.get(ticker);
      if (evaluationMap && evaluationMap.size > 0) {
        const strategies = Array.from(evaluationMap.values()).map(update => update.strategy);
        this.evaluateStrategies(ticker, strategies);
      }
    }
  }

  /**
   * Evaluate strategies for a ticker
   * @param ticker The ticker symbol
   * @param strategies Array of strategies to evaluate
   */
  private async evaluateStrategies(ticker: string, strategies: TradingStrategy[]): Promise<void> {
    try {
      // Get current market condition
      const currentMarketCondition = await this.detectMarketCondition(ticker);
      
      // Get latest price data
      const latestPrice = this.marketDataService.getLatestPrice(ticker);
      if (!latestPrice) {
        console.warn(`No price data available for ${ticker}`);
        return;
      }
      
      // Get latest news
      const newsHistory = this.newsHistory.get(ticker) || [];
      const latestNews = newsHistory.length > 0 ? newsHistory[newsHistory.length - 1] : undefined;
      
      // Calculate recent price change and volatility
      const priceHistory = this.priceHistory.get(ticker) || [];
      const recentPriceChange = this.calculateRecentPriceChange(priceHistory);
      const recentVolatility = this.calculateRecentVolatility(priceHistory);
      
      // Evaluate each strategy
      const evaluationPromises = strategies.map(async (strategy) => {
        try {
          // Get previous evaluation if available
          const evaluationMap = this.evaluationCache.get(ticker) || new Map<string, StrategyEvaluationUpdate>();
          const previousEvaluation = evaluationMap.get(strategy.id);
          
          // Evaluate strategy
          const evaluation = await this.evaluationService.evaluateStrategy(
            strategy,
            ticker,
            currentMarketCondition
          );
          
          // Create evaluation update
          const evaluationUpdate: StrategyEvaluationUpdate = {
            timestamp: new Date(),
            ticker,
            strategy,
            overallScore: evaluation.overallScore,
            performanceScore: evaluation.performanceScore,
            riskScore: evaluation.riskScore,
            marketConditionScore: evaluation.marketConditionScore,
            robustnessScore: evaluation.robustnessScore,
            nlpScore: evaluation.nlpScore,
            recentPriceChange,
            recentVolatility,
            currentMarketCondition,
            latestNews
          };
          
          // Update cache
          evaluationMap.set(strategy.id, evaluationUpdate);
          this.evaluationCache.set(ticker, evaluationMap);
          
          // Check for significant changes
          if (previousEvaluation) {
            const scoreChange = evaluationUpdate.overallScore - previousEvaluation.overallScore;
            
            // Check if change exceeds alert threshold
            const alertConfig = this.alertConfigs.get(strategy.id) || {};
            if (alertConfig.scoreChangeThreshold && Math.abs(scoreChange) >= alertConfig.scoreChangeThreshold) {
              this.emit('strategy-score-change', {
                ticker,
                strategy,
                previousScore: previousEvaluation.overallScore,
                currentScore: evaluationUpdate.overallScore,
                scoreChange,
                timestamp: evaluationUpdate.timestamp
              });
            }
          }
          
          // Emit evaluation update event
          this.emit('strategy-evaluation-update', evaluationUpdate);
          this.emit(`strategy-evaluation-update:${ticker}`, evaluationUpdate);
          this.emit(`strategy-evaluation-update:${ticker}:${strategy.id}`, evaluationUpdate);
          
          return evaluationUpdate;
        } catch (error) {
          console.error(`Error evaluating strategy ${strategy.id} for ${ticker}:`, error);
          return null;
        }
      });
      
      // Wait for all evaluations to complete
      const evaluationResults = await Promise.all(evaluationPromises);
      const validResults = evaluationResults.filter(Boolean) as StrategyEvaluationUpdate[];
      
      // Update rankings
      if (validResults.length > 0) {
        this.updateRankings(ticker, validResults);
      }
    } catch (error) {
      console.error(`Error evaluating strategies for ${ticker}:`, error);
    }
  }

  /**
   * Update strategy rankings for a ticker
   * @param ticker The ticker symbol
   * @param evaluations Array of strategy evaluations
   */
  private updateRankings(ticker: string, evaluations: StrategyEvaluationUpdate[]): void {
    // Get previous ranking if available
    const previousRanking = this.rankingCache.get(ticker);
    
    // Sort evaluations by overall score (descending)
    const sortedEvaluations = [...evaluations].sort((a, b) => b.overallScore - a.overallScore);
    
    // Create ranking update
    const rankingUpdate: StrategyRankingUpdate = {
      timestamp: new Date(),
      ticker,
      rankings: sortedEvaluations.map(evaluation => {
        // Find previous rank
        const previousRank = previousRanking?.rankings.findIndex(
          r => r.strategy.id === evaluation.strategy.id
        ) ?? -1;
        
        // Find previous score
        const previousScore = previousRank >= 0 ? 
          previousRanking?.rankings[previousRank].overallScore : 
          evaluation.overallScore;
        
        return {
          strategy: evaluation.strategy,
          overallScore: evaluation.overallScore,
          changeFromLastUpdate: evaluation.overallScore - previousScore
        };
      }),
      marketCondition: sortedEvaluations[0].currentMarketCondition
    };
    
    // Update cache
    this.rankingCache.set(ticker, rankingUpdate);
    
    // Check for significant rank changes
    if (previousRanking) {
      rankingUpdate.rankings.forEach((ranking, index) => {
        const previousRank = previousRanking.rankings.findIndex(
          r => r.strategy.id === ranking.strategy.id
        );
        
        if (previousRank >= 0) {
          const rankChange = previousRank - index;
          
          // Check if rank change exceeds alert threshold
          const alertConfig = this.alertConfigs.get(ranking.strategy.id) || {};
          if (alertConfig.rankChangeThreshold && Math.abs(rankChange) >= alertConfig.rankChangeThreshold) {
            this.emit('strategy-rank-change', {
              ticker,
              strategy: ranking.strategy,
              previousRank,
              currentRank: index,
              rankChange,
              timestamp: rankingUpdate.timestamp
            });
          }
        }
      });
    }
    
    // Emit ranking update event
    this.emit('strategy-ranking-update', rankingUpdate);
    this.emit(`strategy-ranking-update:${ticker}`, rankingUpdate);
  }

  /**
   * Detect current market condition for a ticker
   * @param ticker The ticker symbol
   * @returns Current market condition
   */
  private async detectMarketCondition(ticker: string): Promise<MarketCondition> {
    try {
      // In a real implementation, this would use more sophisticated analysis
      // For now, use a simple approach based on recent price history
      
      const priceHistory = this.priceHistory.get(ticker) || [];
      
      if (priceHistory.length < 10) {
        return MarketCondition.SIDEWAYS; // Default when not enough data
      }
      
      // Calculate recent returns
      const returns: number[] = [];
      for (let i = 1; i < priceHistory.length; i++) {
        const previousPrice = priceHistory[i - 1].price;
        const currentPrice = priceHistory[i].price;
        returns.push((currentPrice - previousPrice) / previousPrice);
      }
      
      // Calculate average return and volatility
      const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const volatility = Math.sqrt(
        returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
      );
      
      // Determine market condition based on return and volatility
      if (volatility > 0.005) { // High volatility threshold
        return MarketCondition.VOLATILE;
      } else if (volatility < 0.001) { // Low volatility threshold
        return MarketCondition.LOW_VOLATILITY;
      } else if (avgReturn > 0.001) { // Positive trend threshold
        return MarketCondition.BULL;
      } else if (avgReturn < -0.001) { // Negative trend threshold
        return MarketCondition.BEAR;
      } else {
        return MarketCondition.SIDEWAYS;
      }
    } catch (error) {
      console.error(`Error detecting market condition for ${ticker}:`, error);
      return MarketCondition.SIDEWAYS; // Default to sideways on error
    }
  }

  /**
   * Calculate recent price change from price history
   * @param priceHistory Array of price updates
   * @returns Recent price change as a percentage
   */
  private calculateRecentPriceChange(priceHistory: MarketDataUpdate[]): number {
    if (priceHistory.length < 2) {
      return 0;
    }
    
    const oldestPrice = priceHistory[0].price;
    const latestPrice = priceHistory[priceHistory.length - 1].price;
    
    return (latestPrice - oldestPrice) / oldestPrice;
  }

  /**
   * Calculate recent volatility from price history
   * @param priceHistory Array of price updates
   * @returns Recent volatility
   */
  private calculateRecentVolatility(priceHistory: MarketDataUpdate[]): number {
    if (priceHistory.length < 3) {
      return 0;
    }
    
    // Calculate returns
    const returns: number[] = [];
    for (let i = 1; i < priceHistory.length; i++) {
      const previousPrice = priceHistory[i - 1].price;
      const currentPrice = priceHistory[i].price;
      returns.push((currentPrice - previousPrice) / previousPrice);
    }
    
    // Calculate standard deviation of returns
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Set alert configuration for a strategy
   * @param strategyId Strategy ID
   * @param config Alert configuration
   */
  public setAlertConfig(strategyId: string, config: StrategyAlertConfig): void {
    this.alertConfigs.set(strategyId, config);
  }

  /**
   * Get latest evaluation for a strategy
   * @param ticker The ticker symbol
   * @param strategyId Strategy ID
   * @returns Latest evaluation update or null if not available
   */
  public getLatestEvaluation(ticker: string, strategyId: string): StrategyEvaluationUpdate | null {
    const evaluationMap = this.evaluationCache.get(ticker);
    if (!evaluationMap) {
      return null;
    }
    
    return evaluationMap.get(strategyId) || null;
  }

  /**
   * Get latest rankings for a ticker
   * @param ticker The ticker symbol
   * @returns Latest ranking update or null if not available
   */
  public getLatestRankings(ticker: string): StrategyRankingUpdate | null {
    return this.rankingCache.get(ticker) || null;
  }

  /**
   * Subscribe to strategy evaluation updates for a ticker and strategy
   * @param ticker The ticker symbol
   * @param strategyId Strategy ID
   * @param callback Callback function
   * @returns Unsubscribe function
   */
  public subscribeToEvaluationUpdates(
    ticker: string,
    strategyId: string,
    callback: (update: StrategyEvaluationUpdate) => void
  ): () => void {
    const eventName = `strategy-evaluation-update:${ticker}:${strategyId}`;
    this.on(eventName, callback);
    
    // Return unsubscribe function
    return () => {
      this.off(eventName, callback);
    };
  }

  /**
   * Subscribe to strategy ranking updates for a ticker
   * @param ticker The ticker symbol
   * @param callback Callback function
   * @returns Unsubscribe function
   */
  public subscribeToRankingUpdates(
    ticker: string,
    callback: (update: StrategyRankingUpdate) => void
  ): () => void {
    const eventName = `strategy-ranking-update:${ticker}`;
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
    // Stop all evaluations
    const tickers = new Set<string>();
    this.updateIntervals.forEach((_, key) => {
      if (!key.includes('_')) {
        tickers.add(key);
      }
    });
    
    tickers.forEach(ticker => {
      this.stopEvaluation(ticker);
    });
    
    // Clear all event listeners
    this.removeAllListeners();
    
    console.log('RealTimeStrategyEvaluationService disposed');
  }
}

export default RealTimeStrategyEvaluationService;