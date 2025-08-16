import { NLPService } from '../nlp/NLPService';
import { MarketDataService } from '../market/MarketDataService';
import { MarketPredictionService } from '../ml/MarketPredictionService';

/**
 * Strategy types supported by the recommendation engine
 */
export enum StrategyType {
  MOMENTUM = 'momentum',
  MEAN_REVERSION = 'mean_reversion',
  TREND_FOLLOWING = 'trend_following',
  BREAKOUT = 'breakout',
  STATISTICAL_ARBITRAGE = 'statistical_arbitrage',
  PAIRS_TRADING = 'pairs_trading',
  SENTIMENT_BASED = 'sentiment_based',
  MACHINE_LEARNING = 'machine_learning',
  MULTI_FACTOR = 'multi_factor',
}

/**
 * Risk tolerance levels for strategy recommendations
 */
export enum RiskTolerance {
  CONSERVATIVE = 'conservative',
  MODERATE = 'moderate',
  AGGRESSIVE = 'aggressive',
}

/**
 * Time horizon options for strategy recommendations
 */
export enum TimeHorizon {
  SHORT_TERM = 'short_term', // Days to weeks
  MEDIUM_TERM = 'medium_term', // Weeks to months
  LONG_TERM = 'long_term', // Months to years
}

/**
 * User preferences for strategy recommendations
 */
export interface StrategyPreferences {
  riskTolerance: RiskTolerance;
  timeHorizon: TimeHorizon;
  preferredAssetClasses: string[];
  preferredStrategyTypes?: StrategyType[];
  excludedStrategyTypes?: StrategyType[];
  capitalAllocation?: number;
  performanceMetricPriority?: string[]; // e.g., ['sharpe_ratio', 'max_drawdown', 'total_return']
}

/**
 * Strategy recommendation with score and explanation
 */
export interface StrategyRecommendation {
  id: string;
  name: string;
  description: string;
  type: StrategyType;
  score: number; // 0-100 recommendation score
  matchReasons: string[];
  parameters: Record<string, any>;
  expectedPerformance: {
    expectedReturn: number;
    expectedRisk: number;
    sharpeRatio: number;
    successProbability: number;
  };
  suitableMarketConditions: string[];
  timeHorizon: TimeHorizon;
  riskLevel: RiskTolerance;
}

/**
 * Service for generating AI-driven trading strategy recommendations
 * based on user preferences, market conditions, and historical performance.
 */
export class StrategyRecommendationService {
  private nlpService: NLPService;
  private marketDataService: MarketDataService;
  private predictionService: MarketPredictionService;
  private recommendationCache: Map<string, { timestamp: number, recommendations: StrategyRecommendation[] }>;
  private readonly CACHE_TTL_MS = 3600000; // 1 hour cache TTL

  constructor(
    nlpService: NLPService,
    marketDataService: MarketDataService,
    predictionService: MarketPredictionService
  ) {
    this.nlpService = nlpService;
    this.marketDataService = marketDataService;
    this.predictionService = predictionService;
    this.recommendationCache = new Map();
  }

  /**
   * Get strategy recommendations based on user preferences
   * @param preferences User's strategy preferences
   * @param count Number of recommendations to return
   * @returns Array of strategy recommendations
   */
  public async getRecommendations(
    preferences: StrategyPreferences,
    count: number = 5
  ): Promise<StrategyRecommendation[]> {
    const cacheKey = this.generateCacheKey(preferences, count);
    const cachedResult = this.recommendationCache.get(cacheKey);
    
    if (cachedResult && Date.now() - cachedResult.timestamp < this.CACHE_TTL_MS) {
      return cachedResult.recommendations;
    }

    // Get current market conditions
    const marketConditions = await this.analyzeMarketConditions();
    
    // Get sentiment data if needed
    const sentimentData = preferences.preferredStrategyTypes?.includes(StrategyType.SENTIMENT_BASED)
      ? await this.nlpService.getMarketSentiment()
      : null;
    
    // Generate candidate strategies
    const candidateStrategies = await this.generateCandidateStrategies(preferences, marketConditions);
    
    // Score and rank strategies
    const scoredStrategies = this.scoreStrategies(candidateStrategies, preferences, marketConditions, sentimentData);
    
    // Select top N strategies
    const recommendations = scoredStrategies
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
    
    // Cache results
    this.recommendationCache.set(cacheKey, {
      timestamp: Date.now(),
      recommendations
    });
    
    return recommendations;
  }

  /**
   * Generate a cache key based on user preferences and count
   */
  private generateCacheKey(preferences: StrategyPreferences, count: number): string {
    return JSON.stringify({
      preferences,
      count
    });
  }

  /**
   * Analyze current market conditions to inform strategy recommendations
   */
  private async analyzeMarketConditions(): Promise<any> {
    // Get market data
    const marketData = await this.marketDataService.getMarketOverview();
    
    // Get market predictions
    const marketPredictions = await this.predictionService.getMarketPredictions();
    
    // Analyze volatility
    const volatility = await this.marketDataService.getMarketVolatility();
    
    // Analyze trend strength
    const trendStrength = await this.calculateTrendStrength();
    
    // Analyze correlation between assets
    const correlations = await this.marketDataService.getAssetCorrelations();
    
    return {
      marketData,
      marketPredictions,
      volatility,
      trendStrength,
      correlations,
      timestamp: Date.now()
    };
  }

  /**
   * Calculate market trend strength
   */
  private async calculateTrendStrength(): Promise<number> {
    // Implementation would analyze market data to determine trend strength
    // For now, return a placeholder value
    return 0.65; // 0-1 scale where 1 is very strong trend
  }

  /**
   * Generate candidate strategies based on user preferences and market conditions
   */
  private async generateCandidateStrategies(
    preferences: StrategyPreferences,
    marketConditions: any
  ): Promise<StrategyRecommendation[]> {
    const candidates: StrategyRecommendation[] = [];
    
    // Filter strategy types based on user preferences
    const strategyTypes = this.filterStrategyTypes(preferences);
    
    // Generate strategies for each type
    for (const type of strategyTypes) {
      const strategies = await this.generateStrategiesForType(type, preferences, marketConditions);
      candidates.push(...strategies);
    }
    
    return candidates;
  }

  /**
   * Filter strategy types based on user preferences
   */
  private filterStrategyTypes(preferences: StrategyPreferences): StrategyType[] {
    const allTypes = Object.values(StrategyType);
    
    // If user has preferred types, use those
    if (preferences.preferredStrategyTypes && preferences.preferredStrategyTypes.length > 0) {
      return preferences.preferredStrategyTypes;
    }
    
    // Otherwise, filter out excluded types
    return allTypes.filter(type => 
      !preferences.excludedStrategyTypes?.includes(type)
    );
  }

  /**
   * Generate strategies for a specific strategy type
   */
  private async generateStrategiesForType(
    type: StrategyType,
    preferences: StrategyPreferences,
    marketConditions: any
  ): Promise<StrategyRecommendation[]> {
    // This would be implemented with specific logic for each strategy type
    // For now, return placeholder strategies
    
    switch (type) {
      case StrategyType.MOMENTUM:
        return this.generateMomentumStrategies(preferences, marketConditions);
      case StrategyType.MEAN_REVERSION:
        return this.generateMeanReversionStrategies(preferences, marketConditions);
      case StrategyType.TREND_FOLLOWING:
        return this.generateTrendFollowingStrategies(preferences, marketConditions);
      case StrategyType.SENTIMENT_BASED:
        return this.generateSentimentStrategies(preferences, marketConditions);
      // Add cases for other strategy types
      default:
        return [];
    }
  }

  /**
   * Generate momentum strategies
   */
  private generateMomentumStrategies(
    preferences: StrategyPreferences,
    marketConditions: any
  ): StrategyRecommendation[] {
    return [
      {
        id: `momentum-${Date.now()}`,
        name: "Relative Strength Momentum",
        description: "This strategy ranks assets based on their relative strength over multiple timeframes and invests in the top performers.",
        type: StrategyType.MOMENTUM,
        score: 0, // Will be calculated later
        matchReasons: [
          "Strong momentum signals in current market",
          "Aligns with preferred time horizon"
        ],
        parameters: {
          lookbackPeriods: [4, 12, 26],
          rebalanceFrequency: "weekly",
          momentumCalculation: "relative_strength"
        },
        expectedPerformance: {
          expectedReturn: 0.15,
          expectedRisk: 0.12,
          sharpeRatio: 1.25,
          successProbability: 0.65
        },
        suitableMarketConditions: [
          "Strong trending markets",
          "Low to moderate volatility",
          "Clear sector rotation"
        ],
        timeHorizon: preferences.timeHorizon,
        riskLevel: preferences.riskTolerance
      }
    ];
  }

  /**
   * Generate mean reversion strategies
   */
  private generateMeanReversionStrategies(
    preferences: StrategyPreferences,
    marketConditions: any
  ): StrategyRecommendation[] {
    return [
      {
        id: `mean-reversion-${Date.now()}`,
        name: "Statistical Mean Reversion",
        description: "This strategy identifies assets that have deviated significantly from their historical mean and takes positions expecting a reversion to the mean.",
        type: StrategyType.MEAN_REVERSION,
        score: 0, // Will be calculated later
        matchReasons: [
          "High volatility market conditions favor mean reversion",
          "Matches risk tolerance profile"
        ],
        parameters: {
          zScoreThreshold: 2.0,
          lookbackPeriod: 20,
          holdingPeriod: 5
        },
        expectedPerformance: {
          expectedReturn: 0.12,
          expectedRisk: 0.09,
          sharpeRatio: 1.33,
          successProbability: 0.7
        },
        suitableMarketConditions: [
          "Range-bound markets",
          "High volatility",
          "Overreaction to news events"
        ],
        timeHorizon: preferences.timeHorizon,
        riskLevel: preferences.riskTolerance
      }
    ];
  }

  /**
   * Generate trend following strategies
   */
  private generateTrendFollowingStrategies(
    preferences: StrategyPreferences,
    marketConditions: any
  ): StrategyRecommendation[] {
    return [
      {
        id: `trend-following-${Date.now()}`,
        name: "Multi-Timeframe Trend Following",
        description: "This strategy uses multiple timeframe analysis to identify and follow established trends, with dynamic position sizing based on trend strength.",
        type: StrategyType.TREND_FOLLOWING,
        score: 0, // Will be calculated later
        matchReasons: [
          "Strong trends identified in target markets",
          "Aligns with preferred time horizon"
        ],
        parameters: {
          fastEMA: 12,
          slowEMA: 26,
          signalLine: 9,
          trendConfirmationPeriod: 50
        },
        expectedPerformance: {
          expectedReturn: 0.18,
          expectedRisk: 0.15,
          sharpeRatio: 1.2,
          successProbability: 0.6
        },
        suitableMarketConditions: [
          "Strong trending markets",
          "Low to moderate volatility",
          "Clear directional bias"
        ],
        timeHorizon: preferences.timeHorizon,
        riskLevel: preferences.riskTolerance
      }
    ];
  }

  /**
   * Generate sentiment-based strategies
   */
  private generateSentimentStrategies(
    preferences: StrategyPreferences,
    marketConditions: any
  ): StrategyRecommendation[] {
    return [
      {
        id: `sentiment-${Date.now()}`,
        name: "NLP-Driven News Sentiment",
        description: "This strategy analyzes news sentiment using NLP techniques and takes positions based on sentiment shifts and anomalies.",
        type: StrategyType.SENTIMENT_BASED,
        score: 0, // Will be calculated later
        matchReasons: [
          "Leverages advanced NLP capabilities",
          "Captures alpha from market sentiment shifts"
        ],
        parameters: {
          sentimentThreshold: 0.65,
          newsSourceWeights: {
            financial_times: 0.8,
            bloomberg: 0.9,
            reuters: 0.85,
            twitter: 0.5
          },
          sentimentWindowSize: 24 // hours
        },
        expectedPerformance: {
          expectedReturn: 0.14,
          expectedRisk: 0.11,
          sharpeRatio: 1.27,
          successProbability: 0.62
        },
        suitableMarketConditions: [
          "News-driven markets",
          "High information flow periods",
          "Sentiment-sensitive assets"
        ],
        timeHorizon: preferences.timeHorizon,
        riskLevel: preferences.riskTolerance
      }
    ];
  }

  /**
   * Score and rank strategies based on user preferences and market conditions
   */
  private scoreStrategies(
    strategies: StrategyRecommendation[],
    preferences: StrategyPreferences,
    marketConditions: any,
    sentimentData: any | null
  ): StrategyRecommendation[] {
    return strategies.map(strategy => {
      // Calculate base score based on expected performance
      let score = this.calculateBaseScore(strategy);
      
      // Adjust score based on market condition match
      score = this.adjustScoreForMarketConditions(score, strategy, marketConditions);
      
      // Adjust score based on user preferences
      score = this.adjustScoreForUserPreferences(score, strategy, preferences);
      
      // Adjust score based on sentiment data if applicable
      if (sentimentData && strategy.type === StrategyType.SENTIMENT_BASED) {
        score = this.adjustScoreForSentiment(score, strategy, sentimentData);
      }
      
      // Return updated strategy with score
      return {
        ...strategy,
        score: Math.min(100, Math.max(0, score)) // Ensure score is between 0-100
      };
    });
  }

  /**
   * Calculate base score based on expected performance
   */
  private calculateBaseScore(strategy: StrategyRecommendation): number {
    const { expectedReturn, expectedRisk, sharpeRatio, successProbability } = strategy.expectedPerformance;
    
    // Weight factors based on importance
    const returnWeight = 0.3;
    const riskWeight = 0.2;
    const sharpeWeight = 0.3;
    const successWeight = 0.2;
    
    // Normalize metrics to 0-100 scale
    const normalizedReturn = expectedReturn * 100 * 3; // Assuming 33% is excellent
    const normalizedRisk = (1 - expectedRisk) * 100; // Lower risk is better
    const normalizedSharpe = sharpeRatio * 25; // Assuming 4.0 is excellent
    const normalizedSuccess = successProbability * 100;
    
    // Calculate weighted score
    return (
      normalizedReturn * returnWeight +
      normalizedRisk * riskWeight +
      normalizedSharpe * sharpeWeight +
      normalizedSuccess * successWeight
    );
  }

  /**
   * Adjust score based on market conditions
   */
  private adjustScoreForMarketConditions(
    score: number,
    strategy: StrategyRecommendation,
    marketConditions: any
  ): number {
    let adjustment = 0;
    
    // Check if current market conditions match suitable conditions for the strategy
    const marketVolatility = marketConditions.volatility;
    const trendStrength = marketConditions.trendStrength;
    
    switch (strategy.type) {
      case StrategyType.MOMENTUM:
        // Momentum strategies perform better in trending markets with moderate volatility
        adjustment += trendStrength > 0.6 ? 10 : -10;
        adjustment += (marketVolatility > 0.1 && marketVolatility < 0.3) ? 5 : -5;
        break;
        
      case StrategyType.MEAN_REVERSION:
        // Mean reversion strategies perform better in range-bound markets with higher volatility
        adjustment += trendStrength < 0.4 ? 10 : -10;
        adjustment += marketVolatility > 0.25 ? 10 : -5;
        break;
        
      case StrategyType.TREND_FOLLOWING:
        // Trend following strategies perform better in strong trending markets
        adjustment += trendStrength > 0.7 ? 15 : -10;
        break;
        
      // Add cases for other strategy types
    }
    
    return score + adjustment;
  }

  /**
   * Adjust score based on user preferences
   */
  private adjustScoreForUserPreferences(
    score: number,
    strategy: StrategyRecommendation,
    preferences: StrategyPreferences
  ): number {
    let adjustment = 0;
    
    // Adjust for risk tolerance match
    if (strategy.riskLevel === preferences.riskTolerance) {
      adjustment += 10;
    } else if (
      (strategy.riskLevel === RiskTolerance.MODERATE && preferences.riskTolerance === RiskTolerance.AGGRESSIVE) ||
      (strategy.riskLevel === RiskTolerance.MODERATE && preferences.riskTolerance === RiskTolerance.CONSERVATIVE)
    ) {
      adjustment += 5; // Moderate strategies are somewhat compatible with both conservative and aggressive
    } else {
      adjustment -= 10; // Significant mismatch
    }
    
    // Adjust for time horizon match
    if (strategy.timeHorizon === preferences.timeHorizon) {
      adjustment += 10;
    } else if (
      (strategy.timeHorizon === TimeHorizon.MEDIUM_TERM && preferences.timeHorizon === TimeHorizon.SHORT_TERM) ||
      (strategy.timeHorizon === TimeHorizon.MEDIUM_TERM && preferences.timeHorizon === TimeHorizon.LONG_TERM)
    ) {
      adjustment += 0; // Neutral for medium-term vs short/long
    } else {
      adjustment -= 15; // Significant mismatch (e.g., short-term vs long-term)
    }
    
    // Adjust for preferred strategy types
    if (preferences.preferredStrategyTypes?.includes(strategy.type)) {
      adjustment += 15;
    }
    
    return score + adjustment;
  }

  /**
   * Adjust score based on sentiment data
   */
  private adjustScoreForSentiment(
    score: number,
    strategy: StrategyRecommendation,
    sentimentData: any
  ): number {
    // For sentiment-based strategies, boost score if sentiment data is strong
    const sentimentStrength = Math.abs(sentimentData.overallSentiment);
    const sentimentConsistency = sentimentData.consistencyScore;
    
    // Boost score if sentiment is strong and consistent
    if (sentimentStrength > 0.7 && sentimentConsistency > 0.6) {
      return score + 15;
    } else if (sentimentStrength > 0.5 && sentimentConsistency > 0.4) {
      return score + 7;
    } else {
      return score - 5; // Weak sentiment data reduces effectiveness
    }
  }
}