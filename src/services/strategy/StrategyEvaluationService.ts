/**
 * StrategyEvaluationService - AI-driven strategy evaluation and ranking
 * 
 * This service provides advanced evaluation and ranking of trading strategies
 * based on multiple criteria, market conditions, and user preferences.
 */

import axios from 'axios';
import { 
  TradingStrategy, 
  StrategyType,
  Timeframe,
  RiskLevel,
  MarketCondition,
  StrategyPerformanceMetrics
} from '../../models/strategy/StrategyTypes';
import { NLPService } from '../nlp/NLPService';

export class StrategyEvaluationService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly nlpService: NLPService;

  constructor(apiKey: string, baseUrl: string = 'https://api.ninjatechfinance.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.nlpService = new NLPService(apiKey, baseUrl);
  }

  /**
   * Evaluate a strategy based on multiple criteria
   * @param strategy The strategy to evaluate
   * @param ticker The ticker symbol to evaluate for
   * @param currentMarketCondition Current market condition
   * @returns Promise with evaluation scores
   */
  public async evaluateStrategy(
    strategy: TradingStrategy,
    ticker: string,
    currentMarketCondition: MarketCondition
  ): Promise<{
    overallScore: number;
    performanceScore: number;
    riskScore: number;
    marketConditionScore: number;
    robustnessScore: number;
    nlpScore: number;
    detailedScores: Record<string, number>;
  }> {
    try {
      // Call the API for strategy evaluation
      const response = await axios.post(`${this.baseUrl}/strategies/evaluate`, {
        strategyId: strategy.id,
        ticker,
        currentMarketCondition
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data;
    } catch (error) {
      console.error(`Error evaluating strategy ${strategy.id}:`, error);
      
      // Fallback to local evaluation
      return this.performLocalEvaluation(strategy, ticker, currentMarketCondition);
    }
  }

  /**
   * Rank multiple strategies based on evaluation criteria
   * @param strategies Array of strategies to rank
   * @param ticker The ticker symbol to rank for
   * @param currentMarketCondition Current market condition
   * @returns Promise with ranked strategies and scores
   */
  public async rankStrategies(
    strategies: TradingStrategy[],
    ticker: string,
    currentMarketCondition: MarketCondition
  ): Promise<{
    rankedStrategies: {
      strategy: TradingStrategy;
      overallScore: number;
      categoryScores: Record<string, number>;
    }[];
  }> {
    try {
      // Call the API for strategy ranking
      const response = await axios.post(`${this.baseUrl}/strategies/rank`, {
        strategyIds: strategies.map(s => s.id),
        ticker,
        currentMarketCondition
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      // Map API response to local strategy objects
      const strategyMap = new Map(strategies.map(s => [s.id, s]));
      const rankedStrategies = response.data.rankedStrategies.map((item: any) => ({
        strategy: strategyMap.get(item.strategyId)!,
        overallScore: item.overallScore,
        categoryScores: item.categoryScores
      }));

      return { rankedStrategies };
    } catch (error) {
      console.error('Error ranking strategies:', error);
      
      // Fallback to local ranking
      return this.performLocalRanking(strategies, ticker, currentMarketCondition);
    }
  }

  /**
   * Evaluate strategy suitability for specific market conditions
   * @param strategy The strategy to evaluate
   * @param marketConditions Array of market conditions to evaluate for
   * @returns Promise with suitability scores for each market condition
   */
  public async evaluateMarketConditionSuitability(
    strategy: TradingStrategy,
    marketConditions: MarketCondition[] = Object.values(MarketCondition)
  ): Promise<{
    strategyId: string;
    suitabilityScores: {
      marketCondition: MarketCondition;
      score: number;
      explanation: string;
    }[];
  }> {
    try {
      // Call the API for market condition suitability
      const response = await axios.post(`${this.baseUrl}/strategies/${strategy.id}/market-suitability`, {
        marketConditions
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data;
    } catch (error) {
      console.error(`Error evaluating market suitability for strategy ${strategy.id}:`, error);
      
      // Fallback to local evaluation
      return this.evaluateLocalMarketSuitability(strategy, marketConditions);
    }
  }

  /**
   * Evaluate strategy robustness across different market regimes
   * @param strategy The strategy to evaluate
   * @param ticker The ticker symbol to evaluate for
   * @returns Promise with robustness evaluation
   */
  public async evaluateStrategyRobustness(
    strategy: TradingStrategy,
    ticker: string
  ): Promise<{
    strategyId: string;
    robustnessScore: number;
    regimePerformance: {
      regime: MarketCondition;
      performance: StrategyPerformanceMetrics;
    }[];
    consistencyScore: number;
    worstRegime: MarketCondition;
    bestRegime: MarketCondition;
    explanation: string;
  }> {
    try {
      // Call the API for strategy robustness
      const response = await axios.post(`${this.baseUrl}/strategies/${strategy.id}/robustness`, {
        ticker
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data;
    } catch (error) {
      console.error(`Error evaluating robustness for strategy ${strategy.id}:`, error);
      
      // Fallback to local evaluation
      return this.evaluateLocalRobustness(strategy, ticker);
    }
  }

  /**
   * Get NLP-based strategy evaluation
   * @param strategy The strategy to evaluate
   * @param ticker The ticker symbol to evaluate for
   * @returns Promise with NLP-based evaluation
   */
  public async getNLPStrategyEvaluation(
    strategy: TradingStrategy,
    ticker: string
  ): Promise<{
    strategyId: string;
    nlpScore: number;
    sentimentAlignment: number;
    topicRelevance: number;
    eventSensitivity: number;
    explanation: string;
    supportingEvidence: {
      type: string;
      text: string;
      impact: number;
    }[];
  }> {
    try {
      // Generate NLP signals for the ticker
      const signals = await this.nlpService.generateTradingSignals(ticker);
      
      // Calculate alignment between strategy type and NLP signals
      const alignmentScore = this.calculateStrategyNLPAlignment(strategy, signals);
      
      // Calculate relevance of current market topics to the strategy
      const topicRelevance = this.calculateTopicRelevance(strategy, signals);
      
      // Calculate sensitivity to market events
      const eventSensitivity = this.calculateEventSensitivity(strategy, signals);
      
      // Calculate overall NLP score
      const nlpScore = (alignmentScore * 0.4) + (topicRelevance * 0.3) + (eventSensitivity * 0.3);
      
      // Generate supporting evidence
      const supportingEvidence = this.generateNLPSupportingEvidence(strategy, signals);
      
      // Generate explanation
      const explanation = this.generateNLPExplanation(strategy, signals, nlpScore, alignmentScore, topicRelevance, eventSensitivity);
      
      return {
        strategyId: strategy.id,
        nlpScore,
        sentimentAlignment: alignmentScore,
        topicRelevance,
        eventSensitivity,
        explanation,
        supportingEvidence
      };
    } catch (error) {
      console.error(`Error getting NLP evaluation for strategy ${strategy.id}:`, error);
      throw new Error(`Failed to get NLP evaluation for strategy ${strategy.id}`);
    }
  }

  /**
   * Calculate alignment between strategy type and NLP signals
   * @param strategy The strategy to evaluate
   * @param signals Array of NLP signals
   * @returns Alignment score (0-1)
   */
  private calculateStrategyNLPAlignment(strategy: TradingStrategy, signals: any[]): number {
    // Count signal directions
    const bullishCount = signals.filter(signal => signal.direction === 'bullish').length;
    const bearishCount = signals.filter(signal => signal.direction === 'bearish').length;
    const neutralCount = signals.filter(signal => signal.direction === 'neutral').length;
    
    // Calculate sentiment ratio
    const totalSignals = signals.length || 1; // Avoid division by zero
    const bullishRatio = bullishCount / totalSignals;
    const bearishRatio = bearishCount / totalSignals;
    const neutralRatio = neutralCount / totalSignals;
    
    // Calculate alignment based on strategy type
    let alignmentScore = 0;
    
    switch (strategy.type) {
      case StrategyType.MOMENTUM:
      case StrategyType.TREND_FOLLOWING:
        // Momentum and trend-following strategies align with strong directional sentiment
        alignmentScore = Math.max(bullishRatio, bearishRatio) * 0.8 + (1 - neutralRatio) * 0.2;
        break;
        
      case StrategyType.MEAN_REVERSION:
        // Mean reversion strategies align with mixed or contrarian sentiment
        alignmentScore = (1 - Math.abs(bullishRatio - bearishRatio)) * 0.7 + neutralRatio * 0.3;
        break;
        
      case StrategyType.BREAKOUT:
        // Breakout strategies align with emerging strong sentiment
        const sentimentStrength = signals
          .filter(signal => signal.signalType === 'sentiment')
          .reduce((sum, signal) => sum + signal.strength, 0) / 
          (signals.filter(signal => signal.signalType === 'sentiment').length || 1);
        alignmentScore = sentimentStrength * 0.8 + (1 - neutralRatio) * 0.2;
        break;
        
      case StrategyType.SENTIMENT_BASED:
        // Sentiment-based strategies align with strong sentiment signals
        const sentimentSignals = signals.filter(signal => signal.signalType === 'sentiment');
        const avgSentimentStrength = sentimentSignals.reduce((sum, signal) => sum + signal.strength, 0) / 
                                    (sentimentSignals.length || 1);
        alignmentScore = avgSentimentStrength * 0.9 + (1 - neutralRatio) * 0.1;
        break;
        
      case StrategyType.EVENT_DRIVEN:
        // Event-driven strategies align with event signals
        const eventSignals = signals.filter(signal => signal.signalType === 'event');
        alignmentScore = (eventSignals.length / (totalSignals || 1)) * 0.8 + 
                         (eventSignals.reduce((sum, signal) => sum + signal.strength, 0) / 
                         (eventSignals.length || 1)) * 0.2;
        break;
        
      default:
        // Default alignment calculation
        alignmentScore = 0.5 + (Math.max(bullishRatio, bearishRatio) - 0.5) * 0.5;
        break;
    }
    
    return Math.min(Math.max(alignmentScore, 0), 1); // Ensure score is between 0 and 1
  }

  /**
   * Calculate relevance of current market topics to the strategy
   * @param strategy The strategy to evaluate
   * @param signals Array of NLP signals
   * @returns Topic relevance score (0-1)
   */
  private calculateTopicRelevance(strategy: TradingStrategy, signals: any[]): number {
    // Extract topics from signals
    const topicSignals = signals.filter(signal => signal.signalType === 'topic');
    
    if (topicSignals.length === 0) {
      return 0.5; // Neutral score if no topic signals
    }
    
    // Define topic relevance by strategy type
    const relevantTopicsByStrategy: Record<StrategyType, string[]> = {
      [StrategyType.MOMENTUM]: ['growth', 'earnings', 'upgrade', 'innovation', 'expansion'],
      [StrategyType.MEAN_REVERSION]: ['oversold', 'overreaction', 'correction', 'valuation'],
      [StrategyType.TREND_FOLLOWING]: ['trend', 'direction', 'continuation', 'persistence'],
      [StrategyType.BREAKOUT]: ['breakout', 'resistance', 'support', 'volume', 'volatility'],
      [StrategyType.STATISTICAL_ARBITRAGE]: ['correlation', 'spread', 'divergence', 'convergence'],
      [StrategyType.SENTIMENT_BASED]: ['sentiment', 'news', 'social media', 'opinion', 'reaction'],
      [StrategyType.MACHINE_LEARNING]: ['data', 'pattern', 'prediction', 'algorithm'],
      [StrategyType.MULTI_FACTOR]: ['factor', 'combination', 'diversification'],
      [StrategyType.EVENT_DRIVEN]: ['event', 'announcement', 'earnings', 'merger', 'acquisition'],
      [StrategyType.PAIRS_TRADING]: ['correlation', 'pair', 'spread', 'relationship'],
      [StrategyType.VOLATILITY]: ['volatility', 'vix', 'risk', 'uncertainty'],
      [StrategyType.CUSTOM]: ['custom', 'specific', 'proprietary']
    };
    
    // Get relevant topics for this strategy type
    const relevantTopics = relevantTopicsByStrategy[strategy.type] || [];
    
    // Calculate how many topic signals contain relevant keywords
    let relevanceCount = 0;
    for (const signal of topicSignals) {
      const explanation = signal.explanation.toLowerCase();
      if (relevantTopics.some(topic => explanation.includes(topic.toLowerCase()))) {
        relevanceCount += signal.strength;
      }
    }
    
    // Calculate relevance score
    const relevanceScore = relevanceCount / topicSignals.length;
    
    return Math.min(Math.max(relevanceScore, 0), 1); // Ensure score is between 0 and 1
  }

  /**
   * Calculate sensitivity to market events
   * @param strategy The strategy to evaluate
   * @param signals Array of NLP signals
   * @returns Event sensitivity score (0-1)
   */
  private calculateEventSensitivity(strategy: TradingStrategy, signals: any[]): number {
    // Extract event signals
    const eventSignals = signals.filter(signal => signal.signalType === 'event');
    
    if (eventSignals.length === 0) {
      return 0.5; // Neutral score if no event signals
    }
    
    // Define event sensitivity by strategy type
    const eventSensitivityByStrategy: Record<StrategyType, number> = {
      [StrategyType.MOMENTUM]: 0.6,
      [StrategyType.MEAN_REVERSION]: 0.7,
      [StrategyType.TREND_FOLLOWING]: 0.5,
      [StrategyType.BREAKOUT]: 0.8,
      [StrategyType.STATISTICAL_ARBITRAGE]: 0.4,
      [StrategyType.SENTIMENT_BASED]: 0.9,
      [StrategyType.MACHINE_LEARNING]: 0.6,
      [StrategyType.MULTI_FACTOR]: 0.5,
      [StrategyType.EVENT_DRIVEN]: 1.0,
      [StrategyType.PAIRS_TRADING]: 0.3,
      [StrategyType.VOLATILITY]: 0.8,
      [StrategyType.CUSTOM]: 0.5
    };
    
    // Get base sensitivity for this strategy type
    const baseSensitivity = eventSensitivityByStrategy[strategy.type] || 0.5;
    
    // Calculate average event strength
    const avgEventStrength = eventSignals.reduce((sum, signal) => sum + signal.strength, 0) / eventSignals.length;
    
    // Calculate event sensitivity score
    const sensitivityScore = baseSensitivity * 0.7 + avgEventStrength * 0.3;
    
    return Math.min(Math.max(sensitivityScore, 0), 1); // Ensure score is between 0 and 1
  }

  /**
   * Generate supporting evidence for NLP evaluation
   * @param strategy The strategy to evaluate
   * @param signals Array of NLP signals
   * @returns Array of supporting evidence
   */
  private generateNLPSupportingEvidence(strategy: TradingStrategy, signals: any[]): {
    type: string;
    text: string;
    impact: number;
  }[] {
    const evidence: {
      type: string;
      text: string;
      impact: number;
    }[] = [];
    
    // Add sentiment evidence
    const sentimentSignals = signals.filter(signal => signal.signalType === 'sentiment');
    if (sentimentSignals.length > 0) {
      // Get the strongest sentiment signal
      const strongestSentiment = sentimentSignals.reduce((prev, current) => 
        (current.strength > prev.strength) ? current : prev, sentimentSignals[0]);
      
      evidence.push({
        type: 'sentiment',
        text: strongestSentiment.explanation,
        impact: this.calculateSignalImpact(strategy, strongestSentiment)
      });
    }
    
    // Add topic evidence
    const topicSignals = signals.filter(signal => signal.signalType === 'topic');
    if (topicSignals.length > 0) {
      // Get the most relevant topic signal
      const mostRelevantTopic = topicSignals.reduce((prev, current) => 
        (current.confidence > prev.confidence) ? current : prev, topicSignals[0]);
      
      evidence.push({
        type: 'topic',
        text: mostRelevantTopic.explanation,
        impact: this.calculateSignalImpact(strategy, mostRelevantTopic)
      });
    }
    
    // Add event evidence
    const eventSignals = signals.filter(signal => signal.signalType === 'event');
    if (eventSignals.length > 0) {
      // Get the strongest event signal
      const strongestEvent = eventSignals.reduce((prev, current) => 
        (current.strength > prev.strength) ? current : prev, eventSignals[0]);
      
      evidence.push({
        type: 'event',
        text: strongestEvent.explanation,
        impact: this.calculateSignalImpact(strategy, strongestEvent)
      });
    }
    
    return evidence;
  }

  /**
   * Calculate impact of a signal on a strategy
   * @param strategy The strategy to evaluate
   * @param signal The NLP signal
   * @returns Impact score (-100 to 100)
   */
  private calculateSignalImpact(strategy: TradingStrategy, signal: any): number {
    // Base impact from signal strength and direction
    let impact = signal.strength * 100;
    
    // Adjust direction based on signal direction
    if (signal.direction === 'bearish') {
      impact = -impact;
    } else if (signal.direction === 'neutral') {
      impact = impact * 0.2; // Reduce impact of neutral signals
    }
    
    // Adjust based on strategy type
    switch (strategy.type) {
      case StrategyType.MOMENTUM:
        // Momentum strategies are more impacted by strong directional signals
        impact = impact * 1.2;
        break;
        
      case StrategyType.MEAN_REVERSION:
        // Mean reversion strategies are often contrarian
        impact = -impact * 0.8;
        break;
        
      case StrategyType.SENTIMENT_BASED:
        // Sentiment strategies are highly impacted by sentiment signals
        if (signal.signalType === 'sentiment') {
          impact = impact * 1.5;
        }
        break;
        
      case StrategyType.EVENT_DRIVEN:
        // Event-driven strategies are highly impacted by event signals
        if (signal.signalType === 'event') {
          impact = impact * 1.5;
        }
        break;
        
      default:
        // No adjustment for other strategy types
        break;
    }
    
    return Math.min(Math.max(impact, -100), 100); // Ensure impact is between -100 and 100
  }

  /**
   * Generate explanation for NLP evaluation
   * @param strategy The strategy to evaluate
   * @param signals Array of NLP signals
   * @param nlpScore Overall NLP score
   * @param alignmentScore Sentiment alignment score
   * @param topicRelevance Topic relevance score
   * @param eventSensitivity Event sensitivity score
   * @returns Explanation string
   */
  private generateNLPExplanation(
    strategy: TradingStrategy,
    signals: any[],
    nlpScore: number,
    alignmentScore: number,
    topicRelevance: number,
    eventSensitivity: number
  ): string {
    // Count signal directions
    const bullishCount = signals.filter(signal => signal.direction === 'bullish').length;
    const bearishCount = signals.filter(signal => signal.direction === 'bearish').length;
    const neutralCount = signals.filter(signal => signal.direction === 'neutral').length;
    
    // Generate explanation
    let explanation = `Based on the analysis of ${signals.length} NLP signals, `;
    
    // Overall sentiment explanation
    if (bullishCount > bearishCount + neutralCount) {
      explanation += `the overall sentiment is bullish (${bullishCount} bullish signals vs ${bearishCount} bearish). `;
    } else if (bearishCount > bullishCount + neutralCount) {
      explanation += `the overall sentiment is bearish (${bearishCount} bearish signals vs ${bullishCount} bullish). `;
    } else {
      explanation += `the sentiment is mixed or neutral. `;
    }
    
    // Strategy-specific explanation
    explanation += `\n\nFor a ${this.getStrategyTypeLabel(strategy.type)} strategy, `;
    
    // Alignment explanation
    if (alignmentScore > 0.7) {
      explanation += `the current market sentiment strongly aligns with this strategy type (${(alignmentScore * 100).toFixed(0)}% alignment). `;
    } else if (alignmentScore > 0.4) {
      explanation += `the current market sentiment moderately aligns with this strategy type (${(alignmentScore * 100).toFixed(0)}% alignment). `;
    } else {
      explanation += `the current market sentiment does not align well with this strategy type (${(alignmentScore * 100).toFixed(0)}% alignment). `;
    }
    
    // Topic relevance explanation
    if (topicRelevance > 0.7) {
      explanation += `\nCurrent market topics are highly relevant to this strategy (${(topicRelevance * 100).toFixed(0)}% relevance). `;
    } else if (topicRelevance > 0.4) {
      explanation += `\nCurrent market topics are moderately relevant to this strategy (${(topicRelevance * 100).toFixed(0)}% relevance). `;
    } else {
      explanation += `\nCurrent market topics have low relevance to this strategy (${(topicRelevance * 100).toFixed(0)}% relevance). `;
    }
    
    // Event sensitivity explanation
    if (eventSensitivity > 0.7) {
      explanation += `\nThis strategy is highly sensitive to current market events (${(eventSensitivity * 100).toFixed(0)}% sensitivity). `;
    } else if (eventSensitivity > 0.4) {
      explanation += `\nThis strategy is moderately sensitive to current market events (${(eventSensitivity * 100).toFixed(0)}% sensitivity). `;
    } else {
      explanation += `\nThis strategy has low sensitivity to current market events (${(eventSensitivity * 100).toFixed(0)}% sensitivity). `;
    }
    
    // Overall score explanation
    explanation += `\n\nOverall NLP evaluation score: ${(nlpScore * 100).toFixed(0)}%. `;
    
    if (nlpScore > 0.7) {
      explanation += `This indicates that current market narratives strongly support this strategy.`;
    } else if (nlpScore > 0.5) {
      explanation += `This indicates that current market narratives moderately support this strategy.`;
    } else if (nlpScore > 0.3) {
      explanation += `This indicates that current market narratives provide limited support for this strategy.`;
    } else {
      explanation += `This indicates that current market narratives do not support this strategy.`;
    }
    
    return explanation;
  }

  /**
   * Get a human-readable label for a strategy type
   * @param type Strategy type enum value
   * @returns Human-readable label
   */
  private getStrategyTypeLabel(type: StrategyType): string {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  /**
   * Perform local evaluation of a strategy when API is unavailable
   * @param strategy The strategy to evaluate
   * @param ticker The ticker symbol to evaluate for
   * @param currentMarketCondition Current market condition
   * @returns Evaluation scores
   */
  private performLocalEvaluation(
    strategy: TradingStrategy,
    ticker: string,
    currentMarketCondition: MarketCondition
  ): {
    overallScore: number;
    performanceScore: number;
    riskScore: number;
    marketConditionScore: number;
    robustnessScore: number;
    nlpScore: number;
    detailedScores: Record<string, number>;
  } {
    // Calculate performance score (0-100)
    const performanceScore = this.calculatePerformanceScore(strategy.performanceMetrics);
    
    // Calculate risk score (0-100)
    const riskScore = this.calculateRiskScore(strategy.performanceMetrics, strategy.riskLevel);
    
    // Calculate market condition score (0-100)
    const marketConditionScore = this.calculateMarketConditionScore(strategy, currentMarketCondition);
    
    // Calculate robustness score (0-100)
    const robustnessScore = this.calculateRobustnessScore(strategy);
    
    // Calculate NLP score (0-100)
    const nlpScore = 60; // Default score when NLP service is unavailable
    
    // Calculate overall score
    const overallScore = (
      performanceScore * 0.3 +
      riskScore * 0.2 +
      marketConditionScore * 0.25 +
      robustnessScore * 0.15 +
      nlpScore * 0.1
    );
    
    return {
      overallScore,
      performanceScore,
      riskScore,
      marketConditionScore,
      robustnessScore,
      nlpScore,
      detailedScores: {
        sharpeRatio: this.normalizeScore(strategy.performanceMetrics.sharpeRatio, 0, 3, 0, 100),
        sortino: this.normalizeScore(strategy.performanceMetrics.sortino, 0, 4, 0, 100),
        maxDrawdown: this.normalizeScore(Math.abs(strategy.performanceMetrics.maxDrawdown), 0.5, 0, 0, 100),
        annualizedReturn: this.normalizeScore(strategy.performanceMetrics.annualizedReturn, 0, 0.3, 0, 100),
        winRate: this.normalizeScore(strategy.performanceMetrics.winRate, 0.4, 0.7, 0, 100),
        volatility: this.normalizeScore(strategy.performanceMetrics.volatility, 0.3, 0.05, 0, 100),
        marketConditionAlignment: marketConditionScore
      }
    };
  }

  /**
   * Calculate performance score based on performance metrics
   * @param metrics Strategy performance metrics
   * @returns Performance score (0-100)
   */
  private calculatePerformanceScore(metrics: StrategyPerformanceMetrics): number {
    // Calculate individual metric scores
    const sharpeScore = this.normalizeScore(metrics.sharpeRatio, 0, 3, 0, 100);
    const sortinoScore = this.normalizeScore(metrics.sortino, 0, 4, 0, 100);
    const returnScore = this.normalizeScore(metrics.annualizedReturn, 0, 0.3, 0, 100);
    const winRateScore = this.normalizeScore(metrics.winRate, 0.4, 0.7, 0, 100);
    const profitFactorScore = this.normalizeScore(metrics.profitFactor, 1, 3, 0, 100);
    
    // Calculate weighted performance score
    return (
      sharpeScore * 0.25 +
      sortinoScore * 0.2 +
      returnScore * 0.25 +
      winRateScore * 0.15 +
      profitFactorScore * 0.15
    );
  }

  /**
   * Calculate risk score based on performance metrics and risk level
   * @param metrics Strategy performance metrics
   * @param riskLevel Strategy risk level
   * @returns Risk score (0-100)
   */
  private calculateRiskScore(metrics: StrategyPerformanceMetrics, riskLevel: RiskLevel): number {
    // Calculate individual risk metric scores
    const drawdownScore = this.normalizeScore(Math.abs(metrics.maxDrawdown), 0.5, 0, 0, 100);
    const volatilityScore = this.normalizeScore(metrics.volatility, 0.3, 0.05, 0, 100);
    const betaScore = this.normalizeScore(Math.abs(metrics.beta - 1), 1, 0, 0, 100);
    const avgLossScore = this.normalizeScore(Math.abs(metrics.averageLoss), 0.1, 0, 0, 100);
    
    // Risk level adjustment
    let riskLevelAdjustment = 0;
    switch (riskLevel) {
      case RiskLevel.VERY_LOW:
        riskLevelAdjustment = 20;
        break;
      case RiskLevel.LOW:
        riskLevelAdjustment = 10;
        break;
      case RiskLevel.MODERATE:
        riskLevelAdjustment = 0;
        break;
      case RiskLevel.HIGH:
        riskLevelAdjustment = -10;
        break;
      case RiskLevel.VERY_HIGH:
        riskLevelAdjustment = -20;
        break;
    }
    
    // Calculate weighted risk score
    const baseRiskScore = (
      drawdownScore * 0.3 +
      volatilityScore * 0.3 +
      betaScore * 0.2 +
      avgLossScore * 0.2
    );
    
    return Math.min(Math.max(baseRiskScore + riskLevelAdjustment, 0), 100);
  }

  /**
   * Calculate market condition score based on strategy and current market condition
   * @param strategy The strategy to evaluate
   * @param currentMarketCondition Current market condition
   * @returns Market condition score (0-100)
   */
  private calculateMarketConditionScore(
    strategy: TradingStrategy,
    currentMarketCondition: MarketCondition
  ): number {
    // Check if the strategy is suitable for the current market condition
    const isSuitable = strategy.suitableMarketConditions.includes(currentMarketCondition);
    
    // Base score based on suitability
    let baseScore = isSuitable ? 80 : 40;
    
    // Adjust score based on strategy type and market condition
    switch (strategy.type) {
      case StrategyType.MOMENTUM:
        if (currentMarketCondition === MarketCondition.BULL) {
          baseScore += 15;
        } else if (currentMarketCondition === MarketCondition.BEAR) {
          baseScore -= 15;
        }
        break;
        
      case StrategyType.MEAN_REVERSION:
        if (currentMarketCondition === MarketCondition.VOLATILE) {
          baseScore += 15;
        } else if (currentMarketCondition === MarketCondition.LOW_VOLATILITY) {
          baseScore -= 10;
        }
        break;
        
      case StrategyType.TREND_FOLLOWING:
        if (currentMarketCondition === MarketCondition.BULL || currentMarketCondition === MarketCondition.BEAR) {
          baseScore += 10;
        } else if (currentMarketCondition === MarketCondition.SIDEWAYS) {
          baseScore -= 20;
        }
        break;
        
      case StrategyType.VOLATILITY:
        if (currentMarketCondition === MarketCondition.VOLATILE) {
          baseScore += 20;
        } else if (currentMarketCondition === MarketCondition.LOW_VOLATILITY) {
          baseScore -= 20;
        }
        break;
        
      default:
        // No adjustment for other strategy types
        break;
    }
    
    return Math.min(Math.max(baseScore, 0), 100);
  }

  /**
   * Calculate robustness score based on strategy characteristics
   * @param strategy The strategy to evaluate
   * @returns Robustness score (0-100)
   */
  private calculateRobustnessScore(strategy: TradingStrategy): number {
    // Base score based on strategy complexity
    // More complex strategies tend to be less robust (more prone to overfitting)
    const complexityScore = 100 - strategy.complexity;
    
    // Adjust based on performance metrics that indicate robustness
    const sharpeScore = this.normalizeScore(strategy.performanceMetrics.sharpeRatio, 0, 3, 0, 100);
    const calmarScore = this.normalizeScore(strategy.performanceMetrics.calmarRatio, 0, 2, 0, 100);
    const informationRatioScore = this.normalizeScore(strategy.performanceMetrics.informationRatio, 0, 2, 0, 100);
    
    // Calculate weighted robustness score
    return (
      complexityScore * 0.3 +
      sharpeScore * 0.3 +
      calmarScore * 0.2 +
      informationRatioScore * 0.2
    );
  }

  /**
   * Perform local ranking of strategies when API is unavailable
   * @param strategies Array of strategies to rank
   * @param ticker The ticker symbol to rank for
   * @param currentMarketCondition Current market condition
   * @returns Ranked strategies with scores
   */
  private async performLocalRanking(
    strategies: TradingStrategy[],
    ticker: string,
    currentMarketCondition: MarketCondition
  ): Promise<{
    rankedStrategies: {
      strategy: TradingStrategy;
      overallScore: number;
      categoryScores: Record<string, number>;
    }[];
  }> {
    // Evaluate each strategy
    const evaluations = await Promise.all(
      strategies.map(strategy => this.performLocalEvaluation(strategy, ticker, currentMarketCondition))
    );
    
    // Create ranked strategies array
    const rankedStrategies = strategies.map((strategy, index) => ({
      strategy,
      overallScore: evaluations[index].overallScore,
      categoryScores: {
        performance: evaluations[index].performanceScore,
        risk: evaluations[index].riskScore,
        marketCondition: evaluations[index].marketConditionScore,
        robustness: evaluations[index].robustnessScore,
        nlp: evaluations[index].nlpScore
      }
    }));
    
    // Sort by overall score (descending)
    rankedStrategies.sort((a, b) => b.overallScore - a.overallScore);
    
    return { rankedStrategies };
  }

  /**
   * Evaluate local market suitability when API is unavailable
   * @param strategy The strategy to evaluate
   * @param marketConditions Array of market conditions to evaluate for
   * @returns Suitability scores for each market condition
   */
  private evaluateLocalMarketSuitability(
    strategy: TradingStrategy,
    marketConditions: MarketCondition[]
  ): {
    strategyId: string;
    suitabilityScores: {
      marketCondition: MarketCondition;
      score: number;
      explanation: string;
    }[];
  } {
    // Generate suitability scores for each market condition
    const suitabilityScores = marketConditions.map(condition => {
      // Check if the strategy is explicitly suitable for this condition
      const isExplicitlySuitable = strategy.suitableMarketConditions.includes(condition);
      
      // Base score based on explicit suitability
      let score = isExplicitlySuitable ? 80 : 40;
      
      // Adjust score based on strategy type and market condition
      score = this.adjustScoreByStrategyAndCondition(strategy.type, condition, score);
      
      // Generate explanation
      const explanation = this.generateMarketSuitabilityExplanation(strategy, condition, score);
      
      return {
        marketCondition: condition,
        score,
        explanation
      };
    });
    
    return {
      strategyId: strategy.id,
      suitabilityScores
    };
  }

  /**
   * Adjust score based on strategy type and market condition
   * @param strategyType Strategy type
   * @param marketCondition Market condition
   * @param baseScore Base score to adjust
   * @returns Adjusted score
   */
  private adjustScoreByStrategyAndCondition(
    strategyType: StrategyType,
    marketCondition: MarketCondition,
    baseScore: number
  ): number {
    switch (strategyType) {
      case StrategyType.MOMENTUM:
        if (marketCondition === MarketCondition.BULL) {
          baseScore += 15;
        } else if (marketCondition === MarketCondition.BEAR) {
          baseScore -= 10;
        } else if (marketCondition === MarketCondition.SIDEWAYS) {
          baseScore -= 20;
        }
        break;
        
      case StrategyType.MEAN_REVERSION:
        if (marketCondition === MarketCondition.VOLATILE) {
          baseScore += 15;
        } else if (marketCondition === MarketCondition.SIDEWAYS) {
          baseScore += 10;
        } else if (marketCondition === MarketCondition.BULL || marketCondition === MarketCondition.BEAR) {
          baseScore -= 5;
        }
        break;
        
      case StrategyType.TREND_FOLLOWING:
        if (marketCondition === MarketCondition.BULL || marketCondition === MarketCondition.BEAR) {
          baseScore += 15;
        } else if (marketCondition === MarketCondition.SIDEWAYS) {
          baseScore -= 20;
        }
        break;
        
      case StrategyType.BREAKOUT:
        if (marketCondition === MarketCondition.VOLATILE) {
          baseScore += 10;
        } else if (marketCondition === MarketCondition.LOW_VOLATILITY) {
          baseScore -= 15;
        }
        break;
        
      case StrategyType.STATISTICAL_ARBITRAGE:
        if (marketCondition === MarketCondition.SIDEWAYS || marketCondition === MarketCondition.LOW_VOLATILITY) {
          baseScore += 10;
        }
        break;
        
      case StrategyType.SENTIMENT_BASED:
        if (marketCondition === MarketCondition.VOLATILE) {
          baseScore += 5;
        }
        break;
        
      case StrategyType.VOLATILITY:
        if (marketCondition === MarketCondition.VOLATILE) {
          baseScore += 20;
        } else if (marketCondition === MarketCondition.LOW_VOLATILITY) {
          baseScore -= 20;
        }
        break;
        
      case StrategyType.PAIRS_TRADING:
        if (marketCondition === MarketCondition.SIDEWAYS) {
          baseScore += 15;
        } else if (marketCondition === MarketCondition.VOLATILE) {
          baseScore += 5;
        }
        break;
        
      default:
        // No adjustment for other strategy types
        break;
    }
    
    return Math.min(Math.max(baseScore, 0), 100);
  }

  /**
   * Generate explanation for market suitability
   * @param strategy The strategy to evaluate
   * @param marketCondition Market condition
   * @param score Suitability score
   * @returns Explanation string
   */
  private generateMarketSuitabilityExplanation(
    strategy: TradingStrategy,
    marketCondition: MarketCondition,
    score: number
  ): string {
    const strategyTypeLabel = this.getStrategyTypeLabel(strategy.type);
    const marketConditionLabel = this.getMarketConditionLabel(marketCondition);
    
    let explanation = `${strategyTypeLabel} strategies `;
    
    if (score >= 80) {
      explanation += `are highly suitable for ${marketConditionLabel} market conditions. `;
    } else if (score >= 60) {
      explanation += `perform reasonably well in ${marketConditionLabel} market conditions. `;
    } else if (score >= 40) {
      explanation += `may have limited effectiveness in ${marketConditionLabel} market conditions. `;
    } else {
      explanation += `typically underperform in ${marketConditionLabel} market conditions. `;
    }
    
    // Add strategy-specific explanation
    switch (strategy.type) {
      case StrategyType.MOMENTUM:
        if (marketCondition === MarketCondition.BULL) {
          explanation += `Momentum strategies thrive in bull markets where trends persist.`;
        } else if (marketCondition === MarketCondition.BEAR) {
          explanation += `Momentum strategies can work in bear markets but require careful implementation.`;
        } else if (marketCondition === MarketCondition.SIDEWAYS) {
          explanation += `Momentum strategies often struggle in sideways markets due to lack of clear trends.`;
        }
        break;
        
      case StrategyType.MEAN_REVERSION:
        if (marketCondition === MarketCondition.VOLATILE) {
          explanation += `Mean reversion strategies can capitalize on price swings in volatile markets.`;
        } else if (marketCondition === MarketCondition.SIDEWAYS) {
          explanation += `Mean reversion strategies work well in sideways markets with defined ranges.`;
        }
        break;
        
      case StrategyType.TREND_FOLLOWING:
        if (marketCondition === MarketCondition.BULL || marketCondition === MarketCondition.BEAR) {
          explanation += `Trend following strategies excel in strong directional markets.`;
        } else if (marketCondition === MarketCondition.SIDEWAYS) {
          explanation += `Trend following strategies often generate false signals in sideways markets.`;
        }
        break;
        
      case StrategyType.VOLATILITY:
        if (marketCondition === MarketCondition.VOLATILE) {
          explanation += `Volatility strategies are specifically designed to profit from market turbulence.`;
        } else if (marketCondition === MarketCondition.LOW_VOLATILITY) {
          explanation += `Volatility strategies typically struggle to generate returns in calm markets.`;
        }
        break;
        
      default:
        // No additional explanation for other strategy types
        break;
    }
    
    return explanation;
  }

  /**
   * Evaluate local robustness when API is unavailable
   * @param strategy The strategy to evaluate
   * @param ticker The ticker symbol to evaluate for
   * @returns Robustness evaluation
   */
  private evaluateLocalRobustness(
    strategy: TradingStrategy,
    ticker: string
  ): {
    strategyId: string;
    robustnessScore: number;
    regimePerformance: {
      regime: MarketCondition;
      performance: StrategyPerformanceMetrics;
    }[];
    consistencyScore: number;
    worstRegime: MarketCondition;
    bestRegime: MarketCondition;
    explanation: string;
  } {
    // Generate simulated regime performance
    const regimePerformance = Object.values(MarketCondition).map(regime => {
      // Generate simulated performance metrics based on strategy type and regime
      const performance = this.generateSimulatedPerformance(strategy, regime);
      
      return {
        regime,
        performance
      };
    });
    
    // Calculate consistency score based on performance variation across regimes
    const returns = regimePerformance.map(rp => rp.performance.annualizedReturn);
    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const consistencyScore = 100 - (stdDev / meanReturn * 100);
    
    // Find worst and best regimes
    const worstRegimeObj = regimePerformance.reduce((worst, current) => 
      (current.performance.annualizedReturn < worst.performance.annualizedReturn) ? current : worst, 
      regimePerformance[0]);
    
    const bestRegimeObj = regimePerformance.reduce((best, current) => 
      (current.performance.annualizedReturn > best.performance.annualizedReturn) ? current : best, 
      regimePerformance[0]);
    
    // Calculate overall robustness score
    const robustnessScore = (
      consistencyScore * 0.6 +
      this.calculateRobustnessScore(strategy) * 0.4
    );
    
    // Generate explanation
    const explanation = this.generateRobustnessExplanation(
      strategy,
      robustnessScore,
      consistencyScore,
      worstRegimeObj.regime,
      bestRegimeObj.regime
    );
    
    return {
      strategyId: strategy.id,
      robustnessScore,
      regimePerformance,
      consistencyScore,
      worstRegime: worstRegimeObj.regime,
      bestRegime: bestRegimeObj.regime,
      explanation
    };
  }

  /**
   * Generate simulated performance metrics based on strategy type and market regime
   * @param strategy The strategy
   * @param regime Market regime
   * @returns Simulated performance metrics
   */
  private generateSimulatedPerformance(
    strategy: TradingStrategy,
    regime: MarketCondition
  ): StrategyPerformanceMetrics {
    // Start with the strategy's baseline performance
    const baseMetrics = strategy.performanceMetrics;
    
    // Adjustment factors based on strategy type and regime
    let returnFactor = 1.0;
    let riskFactor = 1.0;
    
    // Adjust factors based on strategy type and regime
    switch (strategy.type) {
      case StrategyType.MOMENTUM:
        if (regime === MarketCondition.BULL) {
          returnFactor = 1.3;
          riskFactor = 0.9;
        } else if (regime === MarketCondition.BEAR) {
          returnFactor = 0.7;
          riskFactor = 1.2;
        } else if (regime === MarketCondition.SIDEWAYS) {
          returnFactor = 0.5;
          riskFactor = 1.3;
        }
        break;
        
      case StrategyType.MEAN_REVERSION:
        if (regime === MarketCondition.VOLATILE) {
          returnFactor = 1.2;
          riskFactor = 1.1;
        } else if (regime === MarketCondition.SIDEWAYS) {
          returnFactor = 1.3;
          riskFactor = 0.8;
        } else if (regime === MarketCondition.BULL || regime === MarketCondition.BEAR) {
          returnFactor = 0.8;
          riskFactor = 1.1;
        }
        break;
        
      case StrategyType.TREND_FOLLOWING:
        if (regime === MarketCondition.BULL || regime === MarketCondition.BEAR) {
          returnFactor = 1.2;
          riskFactor = 0.9;
        } else if (regime === MarketCondition.SIDEWAYS) {
          returnFactor = 0.6;
          riskFactor = 1.2;
        }
        break;
        
      case StrategyType.VOLATILITY:
        if (regime === MarketCondition.VOLATILE) {
          returnFactor = 1.4;
          riskFactor = 1.0;
        } else if (regime === MarketCondition.LOW_VOLATILITY) {
          returnFactor = 0.5;
          riskFactor = 1.1;
        }
        break;
        
      default:
        // Use default factors for other strategy types
        if (strategy.suitableMarketConditions.includes(regime)) {
          returnFactor = 1.1;
          riskFactor = 0.9;
        } else {
          returnFactor = 0.9;
          riskFactor = 1.1;
        }
        break;
    }
    
    // Apply adjustments to create simulated metrics
    return {
      sharpeRatio: baseMetrics.sharpeRatio * returnFactor / Math.sqrt(riskFactor),
      sortino: baseMetrics.sortino * returnFactor / Math.sqrt(riskFactor),
      maxDrawdown: baseMetrics.maxDrawdown * riskFactor,
      annualizedReturn: baseMetrics.annualizedReturn * returnFactor,
      winRate: baseMetrics.winRate * Math.sqrt(returnFactor),
      profitFactor: baseMetrics.profitFactor * returnFactor,
      volatility: baseMetrics.volatility * riskFactor,
      beta: baseMetrics.beta,
      alpha: baseMetrics.alpha * returnFactor,
      informationRatio: baseMetrics.informationRatio * returnFactor / Math.sqrt(riskFactor),
      calmarRatio: baseMetrics.calmarRatio * returnFactor / riskFactor,
      averageWin: baseMetrics.averageWin * returnFactor,
      averageLoss: baseMetrics.averageLoss * riskFactor,
      averageHoldingPeriod: baseMetrics.averageHoldingPeriod,
      tradesPerMonth: baseMetrics.tradesPerMonth
    };
  }

  /**
   * Generate explanation for robustness evaluation
   * @param strategy The strategy
   * @param robustnessScore Overall robustness score
   * @param consistencyScore Consistency score
   * @param worstRegime Worst performing regime
   * @param bestRegime Best performing regime
   * @returns Explanation string
   */
  private generateRobustnessExplanation(
    strategy: TradingStrategy,
    robustnessScore: number,
    consistencyScore: number,
    worstRegime: MarketCondition,
    bestRegime: MarketCondition
  ): string {
    const strategyTypeLabel = this.getStrategyTypeLabel(strategy.type);
    
    let explanation = `${strategyTypeLabel} strategy robustness analysis: `;
    
    if (robustnessScore >= 80) {
      explanation += `This strategy demonstrates excellent robustness (${robustnessScore.toFixed(0)}%) across different market regimes. `;
    } else if (robustnessScore >= 60) {
      explanation += `This strategy shows good robustness (${robustnessScore.toFixed(0)}%) across different market regimes. `;
    } else if (robustnessScore >= 40) {
      explanation += `This strategy has moderate robustness (${robustnessScore.toFixed(0)}%) across different market regimes. `;
    } else {
      explanation += `This strategy lacks robustness (${robustnessScore.toFixed(0)}%) across different market regimes. `;
    }
    
    explanation += `\n\nPerformance consistency: ${consistencyScore.toFixed(0)}%. `;
    
    if (consistencyScore >= 80) {
      explanation += `The strategy maintains very consistent performance across different market conditions.`;
    } else if (consistencyScore >= 60) {
      explanation += `The strategy shows reasonably consistent performance across different market conditions.`;
    } else if (consistencyScore >= 40) {
      explanation += `The strategy shows some performance variability across different market conditions.`;
    } else {
      explanation += `The strategy's performance varies significantly across different market conditions.`;
    }
    
    explanation += `\n\nBest performance in ${this.getMarketConditionLabel(bestRegime)} markets. `;
    explanation += `Worst performance in ${this.getMarketConditionLabel(worstRegime)} markets.`;
    
    // Add strategy-specific explanation
    explanation += `\n\n${this.getStrategyRobustnessExplanation(strategy.type)}`;
    
    return explanation;
  }

  /**
   * Get strategy-specific robustness explanation
   * @param strategyType Strategy type
   * @returns Explanation string
   */
  private getStrategyRobustnessExplanation(strategyType: StrategyType): string {
    switch (strategyType) {
      case StrategyType.MOMENTUM:
        return "Momentum strategies typically perform best in trending markets and may struggle during market reversals or sideways conditions. Consider combining with complementary strategies to improve robustness.";
        
      case StrategyType.MEAN_REVERSION:
        return "Mean reversion strategies often excel in range-bound markets but can face significant drawdowns during strong trends. Risk management is crucial for maintaining robustness.";
        
      case StrategyType.TREND_FOLLOWING:
        return "Trend following strategies perform well during sustained directional moves but may generate false signals in choppy or sideways markets. Consider using filters to improve robustness.";
        
      case StrategyType.BREAKOUT:
        return "Breakout strategies can capture large moves but are susceptible to false breakouts. Confirmation techniques and proper position sizing are essential for robustness.";
        
      case StrategyType.STATISTICAL_ARBITRAGE:
        return "Statistical arbitrage strategies typically offer good robustness due to their market-neutral nature, but can be affected by correlation breakdowns during market stress.";
        
      case StrategyType.SENTIMENT_BASED:
        return "Sentiment-based strategies may lack robustness due to the changing relationship between sentiment and price action. Consider combining with technical filters for improved performance.";
        
      case StrategyType.MACHINE_LEARNING:
        return "Machine learning strategies can adapt to different market conditions but may suffer from overfitting. Regular retraining and out-of-sample testing are crucial for robustness.";
        
      case StrategyType.VOLATILITY:
        return "Volatility strategies can be highly effective but often lack robustness across different volatility regimes. Consider implementing regime-switching mechanisms.";
        
      default:
        return "Strategy robustness can be improved through diversification, adaptive parameters, and proper risk management techniques.";
    }
  }

  /**
   * Get a human-readable label for a market condition
   * @param condition Market condition enum value
   * @returns Human-readable label
   */
  private getMarketConditionLabel(condition: MarketCondition): string {
    return condition.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  /**
   * Normalize a value to a score within a specified range
   * @param value The value to normalize
   * @param worstValue The value that should map to minScore
   * @param bestValue The value that should map to maxScore
   * @param minScore The minimum score in the output range
   * @param maxScore The maximum score in the output range
   * @returns Normalized score
   */
  private normalizeScore(
    value: number,
    worstValue: number,
    bestValue: number,
    minScore: number,
    maxScore: number
  ): number {
    // Handle the case where best and worst values are the same
    if (bestValue === worstValue) {
      return (minScore + maxScore) / 2;
    }
    
    // Handle the case where best value is less than worst value (e.g., for metrics where lower is better)
    const normalizedValue = bestValue < worstValue
      ? (worstValue - value) / (worstValue - bestValue)
      : (value - worstValue) / (bestValue - worstValue);
    
    // Map to the output range and clamp between min and max
    return Math.min(Math.max(minScore + normalizedValue * (maxScore - minScore), minScore), maxScore);
  }
}

export default StrategyEvaluationService;