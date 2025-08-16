/**
 * PersonalizedRecommendationService - AI-driven personalized strategy recommendations
 * 
 * This service provides personalized trading strategy recommendations based on
 * user preferences, market conditions, and historical performance.
 */

import axios from 'axios';
import { 
  TradingStrategy, 
  StrategyRecommendation, 
  UserPreferences,
  StrategyType,
  Timeframe,
  RiskLevel,
  MarketCondition
} from '../../models/strategy/StrategyTypes';
import { StrategyRecommendationService } from './StrategyRecommendationService';
import { StrategyEvaluationService } from './StrategyEvaluationService';
import { NLPService } from '../nlp/NLPService';

export class PersonalizedRecommendationService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly recommendationService: StrategyRecommendationService;
  private readonly evaluationService: StrategyEvaluationService;
  private readonly nlpService: NLPService;
  private readonly recommendationCache: Map<string, StrategyRecommendation[]>;

  constructor(apiKey: string, baseUrl: string = 'https://api.ninjatechfinance.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.recommendationService = new StrategyRecommendationService(apiKey, baseUrl);
    this.evaluationService = new StrategyEvaluationService(apiKey, baseUrl);
    this.nlpService = new NLPService(apiKey, baseUrl);
    this.recommendationCache = new Map<string, StrategyRecommendation[]>();
  }

  /**
   * Get personalized strategy recommendations
   * @param userPreferences User preferences for strategy recommendations
   * @param ticker Ticker symbol to get recommendations for
   * @param count Number of recommendations to return
   * @returns Promise with array of strategy recommendations
   */
  public async getPersonalizedRecommendations(
    userPreferences: UserPreferences,
    ticker: string,
    count: number = 5
  ): Promise<StrategyRecommendation[]> {
    try {
      // Generate cache key based on preferences and ticker
      const cacheKey = `${JSON.stringify(userPreferences)}_${ticker}_${count}`;
      
      // Check cache first
      if (this.recommendationCache.has(cacheKey)) {
        return this.recommendationCache.get(cacheKey)!;
      }
      
      // Call the API for personalized recommendations
      const response = await axios.post(`${this.baseUrl}/personalized-recommendations`, {
        userPreferences,
        ticker,
        count
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      const recommendations = response.data.recommendations;
      
      // Update cache
      this.recommendationCache.set(cacheKey, recommendations);
      
      return recommendations;
    } catch (error) {
      console.error('Error fetching personalized recommendations:', error);
      
      // Fallback to local recommendation generation
      return this.generateLocalRecommendations(userPreferences, ticker, count);
    }
  }

  /**
   * Generate local recommendations when API is unavailable
   * @param userPreferences User preferences for strategy recommendations
   * @param ticker Ticker symbol to get recommendations for
   * @param count Number of recommendations to return
   * @returns Promise with array of strategy recommendations
   */
  private async generateLocalRecommendations(
    userPreferences: UserPreferences,
    ticker: string,
    count: number = 5
  ): Promise<StrategyRecommendation[]> {
    try {
      // Get available strategies from recommendation service
      const strategies = await this.recommendationService.getStrategies({
        types: userPreferences.preferredStrategyTypes.length > 0 ? 
          userPreferences.preferredStrategyTypes : undefined,
        timeframes: userPreferences.preferredTimeframes.length > 0 ? 
          userPreferences.preferredTimeframes : undefined,
        riskLevels: [userPreferences.riskTolerance],
        marketConditions: userPreferences.preferredMarketConditions.length > 0 ? 
          userPreferences.preferredMarketConditions : undefined,
        minSharpeRatio: userPreferences.minSharpeRatio,
        maxDrawdown: userPreferences.maxDrawdown,
        tags: userPreferences.customTags.length > 0 ? 
          userPreferences.customTags : undefined
      });
      
      // Filter out excluded strategy types
      const filteredStrategies = strategies.filter(strategy => 
        !userPreferences.excludedStrategyTypes.includes(strategy.type)
      );
      
      // Detect current market condition
      const marketRegime = await this.recommendationService.detectMarketRegime(ticker);
      const currentMarketCondition = marketRegime.regime;
      
      // Rank strategies using evaluation service
      const { rankedStrategies } = await this.evaluationService.rankStrategies(
        filteredStrategies,
        ticker,
        currentMarketCondition
      );
      
      // Get top strategies based on count
      const topStrategies = rankedStrategies.slice(0, count);
      
      // Generate recommendations from top strategies
      const recommendations: StrategyRecommendation[] = [];
      
      for (const rankedStrategy of topStrategies) {
        const strategy = rankedStrategy.strategy;
        
        // Generate match reasons
        const matchReasons = this.generateMatchReasons(
          strategy, 
          userPreferences,
          rankedStrategy.categoryScores
        );
        
        // Generate customized parameters
        const customizedParameters = this.generateCustomizedParameters(
          strategy,
          currentMarketCondition
        );
        
        // Generate expected performance
        const expectedPerformance = {
          estimatedReturn: strategy.performanceMetrics.annualizedReturn * 
            this.getMarketConditionReturnFactor(strategy.type, currentMarketCondition),
          estimatedRisk: strategy.performanceMetrics.volatility * 
            this.getMarketConditionRiskFactor(strategy.type, currentMarketCondition),
          confidenceLevel: rankedStrategy.overallScore * 0.8 // Scale to appropriate confidence level
        };
        
        // Generate suitable tickers
        const suitableTickers = [{
          ticker,
          suitabilityScore: rankedStrategy.overallScore,
          reason: `${strategy.name} is suitable for ${ticker} based on current market conditions and historical performance.`
        }];
        
        // Create recommendation
        recommendations.push({
          strategy,
          score: rankedStrategy.overallScore,
          matchReasons,
          customizedParameters,
          expectedPerformance,
          suitableTickers
        });
      }
      
      return recommendations;
    } catch (error) {
      console.error('Error generating local recommendations:', error);
      throw new Error('Failed to generate strategy recommendations');
    }
  }

  /**
   * Generate match reasons for a strategy recommendation
   * @param strategy Trading strategy
   * @param preferences User preferences
   * @param categoryScores Category scores from evaluation
   * @returns Array of match reasons with impact scores
   */
  private generateMatchReasons(
    strategy: TradingStrategy, 
    preferences: UserPreferences,
    categoryScores: Record<string, number>
  ): { reason: string; impact: number }[] {
    const reasons: { reason: string; impact: number }[] = [];
    
    // Risk alignment
    const riskDifference = this.getRiskLevelValue(strategy.riskLevel) - this.getRiskLevelValue(preferences.riskTolerance);
    if (Math.abs(riskDifference) <= 1) {
      reasons.push({
        reason: `Risk level (${this.getRiskLevelLabel(strategy.riskLevel)}) aligns well with your risk tolerance.`,
        impact: 20 - (Math.abs(riskDifference) * 10)
      });
    } else {
      reasons.push({
        reason: `Risk level (${this.getRiskLevelLabel(strategy.riskLevel)}) differs from your risk tolerance (${this.getRiskLevelLabel(preferences.riskTolerance)}).`,
        impact: -10 * Math.abs(riskDifference)
      });
    }
    
    // Timeframe match
    if (preferences.preferredTimeframes.length > 0) {
      const matchingTimeframes = strategy.timeframes.filter(tf => preferences.preferredTimeframes.includes(tf));
      if (matchingTimeframes.length > 0) {
        reasons.push({
          reason: `Strategy supports your preferred timeframes (${matchingTimeframes.map(tf => this.getTimeframeLabel(tf)).join(', ')}).`,
          impact: 15 * (matchingTimeframes.length / preferences.preferredTimeframes.length)
        });
      } else {
        reasons.push({
          reason: `Strategy doesn't support any of your preferred timeframes.`,
          impact: -10
        });
      }
    }
    
    // Strategy type match
    if (preferences.preferredStrategyTypes.includes(strategy.type)) {
      reasons.push({
        reason: `Strategy type (${this.getStrategyTypeLabel(strategy.type)}) matches your preferences.`,
        impact: 20
      });
    }
    
    // Performance metrics
    if (strategy.performanceMetrics.sharpeRatio >= preferences.minSharpeRatio) {
      reasons.push({
        reason: `Sharpe ratio (${strategy.performanceMetrics.sharpeRatio.toFixed(2)}) meets your minimum requirement.`,
        impact: 15 * (strategy.performanceMetrics.sharpeRatio / preferences.minSharpeRatio)
      });
    } else {
      reasons.push({
        reason: `Sharpe ratio (${strategy.performanceMetrics.sharpeRatio.toFixed(2)}) is below your minimum requirement.`,
        impact: -15
      });
    }
    
    if (strategy.performanceMetrics.winRate >= preferences.minWinRate) {
      reasons.push({
        reason: `Win rate (${(strategy.performanceMetrics.winRate * 100).toFixed(0)}%) meets your minimum requirement.`,
        impact: 10 * (strategy.performanceMetrics.winRate / preferences.minWinRate)
      });
    } else {
      reasons.push({
        reason: `Win rate (${(strategy.performanceMetrics.winRate * 100).toFixed(0)}%) is below your minimum requirement.`,
        impact: -10
      });
    }
    
    if (Math.abs(strategy.performanceMetrics.maxDrawdown) <= Math.abs(preferences.maxDrawdown)) {
      reasons.push({
        reason: `Maximum drawdown (${(strategy.performanceMetrics.maxDrawdown * 100).toFixed(0)}%) is within your tolerance.`,
        impact: 10 * (preferences.maxDrawdown / strategy.performanceMetrics.maxDrawdown)
      });
    } else {
      reasons.push({
        reason: `Maximum drawdown (${(strategy.performanceMetrics.maxDrawdown * 100).toFixed(0)}%) exceeds your tolerance.`,
        impact: -10
      });
    }
    
    // Add reasons based on category scores
    if (categoryScores) {
      if (categoryScores.performance >= 70) {
        reasons.push({
          reason: `Strong historical performance metrics (${categoryScores.performance.toFixed(0)}% score).`,
          impact: (categoryScores.performance - 50) * 0.5
        });
      }
      
      if (categoryScores.marketCondition >= 70) {
        reasons.push({
          reason: `Well-suited for current market conditions (${categoryScores.marketCondition.toFixed(0)}% score).`,
          impact: (categoryScores.marketCondition - 50) * 0.5
        });
      }
      
      if (categoryScores.robustness >= 70) {
        reasons.push({
          reason: `High robustness across different market regimes (${categoryScores.robustness.toFixed(0)}% score).`,
          impact: (categoryScores.robustness - 50) * 0.4
        });
      }
      
      if (categoryScores.nlp >= 70) {
        reasons.push({
          reason: `Positive alignment with current market sentiment and news (${categoryScores.nlp.toFixed(0)}% score).`,
          impact: (categoryScores.nlp - 50) * 0.4
        });
      }
    }
    
    // Sort reasons by absolute impact
    return reasons.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  }

  /**
   * Generate customized parameters for a strategy based on market conditions
   * @param strategy Trading strategy
   * @param marketCondition Current market condition
   * @returns Customized parameters
   */
  private generateCustomizedParameters(
    strategy: TradingStrategy,
    marketCondition: MarketCondition
  ): Record<string, any> {
    const customizedParameters: Record<string, any> = {};
    
    // Start with default parameters
    strategy.parameters.forEach(param => {
      customizedParameters[param.id] = param.defaultValue;
    });
    
    // Adjust parameters based on strategy type and market condition
    switch (strategy.type) {
      case StrategyType.MOMENTUM:
        if (marketCondition === MarketCondition.VOLATILE) {
          // For volatile markets, use shorter lookback periods and higher thresholds
          const lookbackParam = strategy.parameters.find(p => p.id.includes('lookback') || p.id.includes('period'));
          const thresholdParam = strategy.parameters.find(p => p.id.includes('threshold'));
          
          if (lookbackParam && typeof lookbackParam.defaultValue === 'number') {
            customizedParameters[lookbackParam.id] = Math.max(
              lookbackParam.minValue || 5,
              Math.floor(lookbackParam.defaultValue * 0.7)
            );
          }
          
          if (thresholdParam && typeof thresholdParam.defaultValue === 'number') {
            customizedParameters[thresholdParam.id] = Math.min(
              thresholdParam.maxValue || 0.2,
              thresholdParam.defaultValue * 1.3
            );
          }
        } else if (marketCondition === MarketCondition.SIDEWAYS) {
          // For sideways markets, use longer lookback periods
          const lookbackParam = strategy.parameters.find(p => p.id.includes('lookback') || p.id.includes('period'));
          
          if (lookbackParam && typeof lookbackParam.defaultValue === 'number') {
            customizedParameters[lookbackParam.id] = Math.min(
              lookbackParam.maxValue || 100,
              Math.floor(lookbackParam.defaultValue * 1.3)
            );
          }
        }
        break;
        
      case StrategyType.MEAN_REVERSION:
        if (marketCondition === MarketCondition.VOLATILE) {
          // For volatile markets, use wider bands/thresholds
          const deviationParam = strategy.parameters.find(p => 
            p.id.includes('deviation') || p.id.includes('band') || p.id.includes('threshold')
          );
          
          if (deviationParam && typeof deviationParam.defaultValue === 'number') {
            customizedParameters[deviationParam.id] = Math.min(
              deviationParam.maxValue || 3,
              deviationParam.defaultValue * 1.2
            );
          }
        } else if (marketCondition === MarketCondition.LOW_VOLATILITY) {
          // For low volatility markets, use tighter bands/thresholds
          const deviationParam = strategy.parameters.find(p => 
            p.id.includes('deviation') || p.id.includes('band') || p.id.includes('threshold')
          );
          
          if (deviationParam && typeof deviationParam.defaultValue === 'number') {
            customizedParameters[deviationParam.id] = Math.max(
              deviationParam.minValue || 1,
              deviationParam.defaultValue * 0.8
            );
          }
        }
        break;
        
      case StrategyType.TREND_FOLLOWING:
        if (marketCondition === MarketCondition.BULL || marketCondition === MarketCondition.BEAR) {
          // For strong trend markets, use longer lookback periods
          const lookbackParam = strategy.parameters.find(p => p.id.includes('lookback') || p.id.includes('period'));
          
          if (lookbackParam && typeof lookbackParam.defaultValue === 'number') {
            customizedParameters[lookbackParam.id] = Math.min(
              lookbackParam.maxValue || 100,
              Math.floor(lookbackParam.defaultValue * 1.2)
            );
          }
        }
        break;
        
      case StrategyType.VOLATILITY:
        if (marketCondition === MarketCondition.VOLATILE) {
          // For volatile markets, adjust volatility thresholds
          const thresholdParam = strategy.parameters.find(p => p.id.includes('threshold'));
          
          if (thresholdParam && typeof thresholdParam.defaultValue === 'number') {
            customizedParameters[thresholdParam.id] = Math.min(
              thresholdParam.maxValue || 0.2,
              thresholdParam.defaultValue * 1.2
            );
          }
        }
        break;
        
      default:
        // No parameter adjustments for other strategy types
        break;
    }
    
    return customizedParameters;
  }

  /**
   * Get market condition return factor for a strategy type
   * @param strategyType Strategy type
   * @param marketCondition Market condition
   * @returns Return factor multiplier
   */
  private getMarketConditionReturnFactor(
    strategyType: StrategyType,
    marketCondition: MarketCondition
  ): number {
    switch (strategyType) {
      case StrategyType.MOMENTUM:
        if (marketCondition === MarketCondition.BULL) return 1.2;
        if (marketCondition === MarketCondition.BEAR) return 0.8;
        if (marketCondition === MarketCondition.SIDEWAYS) return 0.7;
        return 1.0;
        
      case StrategyType.MEAN_REVERSION:
        if (marketCondition === MarketCondition.VOLATILE) return 1.2;
        if (marketCondition === MarketCondition.SIDEWAYS) return 1.1;
        if (marketCondition === MarketCondition.BULL || marketCondition === MarketCondition.BEAR) return 0.9;
        return 1.0;
        
      case StrategyType.TREND_FOLLOWING:
        if (marketCondition === MarketCondition.BULL || marketCondition === MarketCondition.BEAR) return 1.2;
        if (marketCondition === MarketCondition.SIDEWAYS) return 0.7;
        return 1.0;
        
      case StrategyType.VOLATILITY:
        if (marketCondition === MarketCondition.VOLATILE) return 1.3;
        if (marketCondition === MarketCondition.LOW_VOLATILITY) return 0.7;
        return 1.0;
        
      default:
        return 1.0;
    }
  }

  /**
   * Get market condition risk factor for a strategy type
   * @param strategyType Strategy type
   * @param marketCondition Market condition
   * @returns Risk factor multiplier
   */
  private getMarketConditionRiskFactor(
    strategyType: StrategyType,
    marketCondition: MarketCondition
  ): number {
    switch (strategyType) {
      case StrategyType.MOMENTUM:
        if (marketCondition === MarketCondition.BULL) return 0.9;
        if (marketCondition === MarketCondition.BEAR) return 1.2;
        if (marketCondition === MarketCondition.SIDEWAYS) return 1.3;
        return 1.0;
        
      case StrategyType.MEAN_REVERSION:
        if (marketCondition === MarketCondition.VOLATILE) return 1.1;
        if (marketCondition === MarketCondition.SIDEWAYS) return 0.9;
        if (marketCondition === MarketCondition.BULL || marketCondition === MarketCondition.BEAR) return 1.2;
        return 1.0;
        
      case StrategyType.TREND_FOLLOWING:
        if (marketCondition === MarketCondition.BULL || marketCondition === MarketCondition.BEAR) return 0.9;
        if (marketCondition === MarketCondition.SIDEWAYS) return 1.3;
        return 1.0;
        
      case StrategyType.VOLATILITY:
        if (marketCondition === MarketCondition.VOLATILE) return 1.0;
        if (marketCondition === MarketCondition.LOW_VOLATILITY) return 1.2;
        return 1.0;
        
      default:
        return 1.0;
    }
  }

  /**
   * Convert risk level enum to numeric value
   * @param riskLevel Risk level enum
   * @returns Numeric value (1-5)
   */
  private getRiskLevelValue(riskLevel: RiskLevel): number {
    switch (riskLevel) {
      case RiskLevel.VERY_LOW:
        return 1;
      case RiskLevel.LOW:
        return 2;
      case RiskLevel.MODERATE:
        return 3;
      case RiskLevel.HIGH:
        return 4;
      case RiskLevel.VERY_HIGH:
        return 5;
      default:
        return 3;
    }
  }

  /**
   * Get a human-readable label for a risk level
   * @param level Risk level enum value
   * @returns Human-readable label
   */
  private getRiskLevelLabel(level: RiskLevel): string {
    return level.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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
   * Get a human-readable label for a timeframe
   * @param timeframe Timeframe enum value
   * @returns Human-readable label
   */
  private getTimeframeLabel(timeframe: Timeframe): string {
    return timeframe.charAt(0).toUpperCase() + timeframe.slice(1);
  }
}

export default PersonalizedRecommendationService;