/**
 * StrategyRecommendationService - AI-driven trading strategy recommendations
 * 
 * This service provides AI-driven recommendations for trading strategies based on
 * market conditions, user preferences, and historical performance.
 */

import axios from 'axios';
import { 
  TradingStrategy, 
  StrategyRecommendation, 
  UserPreferences,
  StrategyType,
  Timeframe,
  RiskLevel,
  MarketCondition,
  StrategyExplanation,
  StrategyBacktestResult,
  StrategyOptimizationResult,
  MarketRegime,
  StrategyCombination
} from '../../models/strategy/StrategyTypes';
import { NLPService } from '../nlp/NLPService';

export class StrategyRecommendationService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly nlpService: NLPService;
  private readonly strategyCache: Map<string, TradingStrategy>;
  private readonly recommendationCache: Map<string, StrategyRecommendation[]>;

  constructor(apiKey: string, baseUrl: string = 'https://api.ninjatechfinance.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.nlpService = new NLPService(apiKey, baseUrl);
    this.strategyCache = new Map<string, TradingStrategy>();
    this.recommendationCache = new Map<string, StrategyRecommendation[]>();
  }

  /**
   * Get all available trading strategies
   * @param filter Optional filter criteria
   * @returns Promise with array of trading strategies
   */
  public async getStrategies(filter?: {
    types?: StrategyType[];
    timeframes?: Timeframe[];
    riskLevels?: RiskLevel[];
    marketConditions?: MarketCondition[];
    minSharpeRatio?: number;
    maxDrawdown?: number;
    tags?: string[];
  }): Promise<TradingStrategy[]> {
    try {
      // Generate cache key based on filter
      const cacheKey = filter ? JSON.stringify(filter) : 'all';
      
      // Check cache first
      if (this.strategyCache.has(cacheKey)) {
        return Array.from(this.strategyCache.values());
      }
      
      // Call the API for strategies
      const response = await axios.get(`${this.baseUrl}/strategies`, {
        headers: { 'X-API-KEY': this.apiKey },
        params: filter
      });

      const strategies = response.data.strategies;
      
      // Update cache
      strategies.forEach((strategy: TradingStrategy) => {
        this.strategyCache.set(strategy.id, strategy);
      });
      
      return strategies;
    } catch (error) {
      console.error('Error fetching strategies:', error);
      throw new Error('Failed to fetch trading strategies');
    }
  }

  /**
   * Get a specific trading strategy by ID
   * @param strategyId The ID of the strategy to retrieve
   * @returns Promise with the trading strategy
   */
  public async getStrategyById(strategyId: string): Promise<TradingStrategy> {
    try {
      // Check cache first
      if (this.strategyCache.has(strategyId)) {
        return this.strategyCache.get(strategyId)!;
      }
      
      // Call the API for the specific strategy
      const response = await axios.get(`${this.baseUrl}/strategies/${strategyId}`, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      const strategy = response.data;
      
      // Update cache
      this.strategyCache.set(strategy.id, strategy);
      
      return strategy;
    } catch (error) {
      console.error(`Error fetching strategy ${strategyId}:`, error);
      throw new Error(`Failed to fetch trading strategy ${strategyId}`);
    }
  }

  /**
   * Get personalized strategy recommendations based on user preferences
   * @param userPreferences User preferences for strategy recommendations
   * @param ticker Optional ticker symbol to get recommendations for a specific asset
   * @param count Number of recommendations to return (default: 5)
   * @returns Promise with array of strategy recommendations
   */
  public async getRecommendations(
    userPreferences: UserPreferences,
    ticker?: string,
    count: number = 5
  ): Promise<StrategyRecommendation[]> {
    try {
      // Generate cache key based on preferences and ticker
      const cacheKey = `${JSON.stringify(userPreferences)}_${ticker || 'all'}_${count}`;
      
      // Check cache first
      if (this.recommendationCache.has(cacheKey)) {
        return this.recommendationCache.get(cacheKey)!;
      }
      
      // Call the API for recommendations
      const response = await axios.post(`${this.baseUrl}/strategy-recommendations`, {
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
      console.error('Error fetching strategy recommendations:', error);
      
      // Fallback to local recommendation generation
      return this.generateFallbackRecommendations(userPreferences, ticker, count);
    }
  }

  /**
   * Get detailed explanation for a strategy
   * @param strategyId The ID of the strategy to explain
   * @returns Promise with strategy explanation
   */
  public async getStrategyExplanation(strategyId: string): Promise<StrategyExplanation> {
    try {
      // Call the API for strategy explanation
      const response = await axios.get(`${this.baseUrl}/strategies/${strategyId}/explanation`, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data;
    } catch (error) {
      console.error(`Error fetching explanation for strategy ${strategyId}:`, error);
      throw new Error(`Failed to fetch explanation for strategy ${strategyId}`);
    }
  }

  /**
   * Backtest a strategy with specific parameters
   * @param strategyId The ID of the strategy to backtest
   * @param ticker The ticker symbol to backtest on
   * @param parameters Strategy parameters for the backtest
   * @param startDate Start date for the backtest
   * @param endDate End date for the backtest
   * @param initialCapital Initial capital for the backtest (default: 100000)
   * @returns Promise with backtest results
   */
  public async backtestStrategy(
    strategyId: string,
    ticker: string,
    parameters: Record<string, any>,
    startDate: Date,
    endDate: Date,
    initialCapital: number = 100000
  ): Promise<StrategyBacktestResult> {
    try {
      // Call the API for strategy backtest
      const response = await axios.post(`${this.baseUrl}/strategies/${strategyId}/backtest`, {
        ticker,
        parameters,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        initialCapital
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data;
    } catch (error) {
      console.error(`Error backtesting strategy ${strategyId}:`, error);
      throw new Error(`Failed to backtest strategy ${strategyId}`);
    }
  }

  /**
   * Optimize strategy parameters for a specific ticker
   * @param strategyId The ID of the strategy to optimize
   * @param ticker The ticker symbol to optimize for
   * @param timeframe The timeframe to optimize for
   * @param optimizationTarget The target metric to optimize
   * @param parameterRanges Ranges for parameters to optimize
   * @param startDate Start date for optimization
   * @param endDate End date for optimization
   * @returns Promise with optimization results
   */
  public async optimizeStrategy(
    strategyId: string,
    ticker: string,
    timeframe: Timeframe,
    optimizationTarget: 'sharpe_ratio' | 'return' | 'drawdown' | 'win_rate' | 'profit_factor',
    parameterRanges: Record<string, { min: number; max: number; step: number }>,
    startDate: Date,
    endDate: Date
  ): Promise<StrategyOptimizationResult> {
    try {
      // Call the API for strategy optimization
      const response = await axios.post(`${this.baseUrl}/strategies/${strategyId}/optimize`, {
        ticker,
        timeframe,
        optimizationTarget,
        parameterRanges,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data;
    } catch (error) {
      console.error(`Error optimizing strategy ${strategyId}:`, error);
      throw new Error(`Failed to optimize strategy ${strategyId}`);
    }
  }

  /**
   * Detect current market regime
   * @param ticker The ticker symbol to analyze
   * @returns Promise with current market regime
   */
  public async detectMarketRegime(ticker: string): Promise<MarketRegime> {
    try {
      // Call the API for market regime detection
      const response = await axios.get(`${this.baseUrl}/market-regime/${ticker}`, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data;
    } catch (error) {
      console.error(`Error detecting market regime for ${ticker}:`, error);
      throw new Error(`Failed to detect market regime for ${ticker}`);
    }
  }

  /**
   * Create a combination of strategies
   * @param strategies Array of strategies with weights and parameters
   * @param name Name for the strategy combination
   * @param description Description for the strategy combination
   * @returns Promise with strategy combination
   */
  public async createStrategyCombination(
    strategies: {
      strategyId: string;
      weight: number;
      allocation: number;
      parameters: Record<string, any>;
    }[],
    name: string,
    description: string
  ): Promise<StrategyCombination> {
    try {
      // Call the API to create strategy combination
      const response = await axios.post(`${this.baseUrl}/strategy-combinations`, {
        strategies,
        name,
        description
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data;
    } catch (error) {
      console.error('Error creating strategy combination:', error);
      throw new Error('Failed to create strategy combination');
    }
  }

  /**
   * Get NLP-based strategy insights
   * @param ticker The ticker symbol to analyze
   * @returns Promise with NLP-based strategy insights
   */
  public async getNLPStrategyInsights(ticker: string): Promise<{
    sentimentSignals: any[];
    topicSignals: any[];
    eventSignals: any[];
    recommendedStrategyTypes: StrategyType[];
    explanation: string;
  }> {
    try {
      // Use NLP service to generate trading signals
      const signals = await this.nlpService.generateTradingSignals(ticker);
      
      // Analyze signals to determine suitable strategy types
      const recommendedStrategyTypes = this.analyzeSignalsForStrategyTypes(signals);
      
      // Group signals by type
      const sentimentSignals = signals.filter(signal => signal.signalType === 'sentiment');
      const topicSignals = signals.filter(signal => signal.signalType === 'topic');
      const eventSignals = signals.filter(signal => signal.signalType === 'event');
      
      // Generate explanation
      const explanation = this.generateNLPInsightExplanation(signals, recommendedStrategyTypes);
      
      return {
        sentimentSignals,
        topicSignals,
        eventSignals,
        recommendedStrategyTypes,
        explanation
      };
    } catch (error) {
      console.error(`Error generating NLP strategy insights for ${ticker}:`, error);
      throw new Error(`Failed to generate NLP strategy insights for ${ticker}`);
    }
  }

  /**
   * Analyze NLP signals to determine suitable strategy types
   * @param signals Array of NLP signals
   * @returns Array of recommended strategy types
   */
  private analyzeSignalsForStrategyTypes(signals: any[]): StrategyType[] {
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
   * Generate explanation for NLP insights
   * @param signals Array of NLP signals
   * @param recommendedTypes Array of recommended strategy types
   * @returns Explanation string
   */
  private generateNLPInsightExplanation(signals: any[], recommendedTypes: StrategyType[]): string {
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
   * Generate fallback recommendations when API is unavailable
   * @param userPreferences User preferences for strategy recommendations
   * @param ticker Optional ticker symbol
   * @param count Number of recommendations to return
   * @returns Array of basic strategy recommendations
   */
  private generateFallbackRecommendations(
    userPreferences: UserPreferences,
    ticker?: string,
    count: number = 5
  ): StrategyRecommendation[] {
    // Basic fallback strategies
    const fallbackStrategies: TradingStrategy[] = [
      {
        id: 'momentum_basic',
        name: 'Basic Momentum Strategy',
        description: 'A simple momentum strategy that buys assets showing upward price momentum and sells those showing downward momentum.',
        type: StrategyType.MOMENTUM,
        timeframes: [Timeframe.DAILY, Timeframe.WEEKLY],
        riskLevel: RiskLevel.MODERATE,
        suitableMarketConditions: [MarketCondition.BULL, MarketCondition.HIGH_LIQUIDITY],
        parameters: [
          {
            id: 'lookback_period',
            name: 'Lookback Period',
            description: 'Number of periods to look back for momentum calculation',
            type: 'number',
            defaultValue: 20,
            minValue: 5,
            maxValue: 100,
            step: 1,
            required: true,
            advanced: false
          },
          {
            id: 'threshold',
            name: 'Momentum Threshold',
            description: 'Threshold for momentum signal',
            type: 'number',
            defaultValue: 0.05,
            minValue: 0.01,
            maxValue: 0.2,
            step: 0.01,
            required: true,
            advanced: false
          }
        ],
        performanceMetrics: {
          sharpeRatio: 1.2,
          sortino: 1.5,
          maxDrawdown: -0.15,
          annualizedReturn: 0.12,
          winRate: 0.55,
          profitFactor: 1.3,
          volatility: 0.18,
          beta: 0.9,
          alpha: 0.03,
          informationRatio: 0.8,
          calmarRatio: 0.8,
          averageWin: 0.03,
          averageLoss: -0.02,
          averageHoldingPeriod: 15,
          tradesPerMonth: 4
        },
        tags: ['momentum', 'trend', 'technical'],
        author: 'NinjaTech AI',
        createdAt: new Date('2023-01-15'),
        updatedAt: new Date('2023-06-20'),
        version: '1.2.0',
        popularity: 85,
        complexity: 30
      },
      {
        id: 'mean_reversion_basic',
        name: 'Basic Mean Reversion Strategy',
        description: 'A simple mean reversion strategy that buys oversold assets and sells overbought assets.',
        type: StrategyType.MEAN_REVERSION,
        timeframes: [Timeframe.DAILY],
        riskLevel: RiskLevel.MODERATE,
        suitableMarketConditions: [MarketCondition.SIDEWAYS, MarketCondition.VOLATILE],
        parameters: [
          {
            id: 'lookback_period',
            name: 'Lookback Period',
            description: 'Number of periods to look back for mean calculation',
            type: 'number',
            defaultValue: 20,
            minValue: 5,
            maxValue: 100,
            step: 1,
            required: true,
            advanced: false
          },
          {
            id: 'std_dev_threshold',
            name: 'Standard Deviation Threshold',
            description: 'Number of standard deviations for overbought/oversold',
            type: 'number',
            defaultValue: 2,
            minValue: 1,
            maxValue: 3,
            step: 0.1,
            required: true,
            advanced: false
          }
        ],
        performanceMetrics: {
          sharpeRatio: 1.1,
          sortino: 1.3,
          maxDrawdown: -0.12,
          annualizedReturn: 0.09,
          winRate: 0.6,
          profitFactor: 1.4,
          volatility: 0.12,
          beta: 0.5,
          alpha: 0.04,
          informationRatio: 0.9,
          calmarRatio: 0.75,
          averageWin: 0.02,
          averageLoss: -0.015,
          averageHoldingPeriod: 5,
          tradesPerMonth: 8
        },
        tags: ['mean-reversion', 'overbought', 'oversold', 'technical'],
        author: 'NinjaTech AI',
        createdAt: new Date('2023-02-10'),
        updatedAt: new Date('2023-07-15'),
        version: '1.1.0',
        popularity: 80,
        complexity: 35
      },
      {
        id: 'sentiment_basic',
        name: 'Basic Sentiment Strategy',
        description: 'A strategy that trades based on sentiment analysis of news and social media.',
        type: StrategyType.SENTIMENT_BASED,
        timeframes: [Timeframe.DAILY, Timeframe.WEEKLY],
        riskLevel: RiskLevel.HIGH,
        suitableMarketConditions: [MarketCondition.BULL, MarketCondition.BEAR, MarketCondition.VOLATILE],
        parameters: [
          {
            id: 'sentiment_threshold',
            name: 'Sentiment Threshold',
            description: 'Threshold for sentiment signal',
            type: 'number',
            defaultValue: 0.6,
            minValue: 0.3,
            maxValue: 0.9,
            step: 0.05,
            required: true,
            advanced: false
          },
          {
            id: 'holding_period',
            name: 'Holding Period',
            description: 'Number of days to hold position',
            type: 'number',
            defaultValue: 5,
            minValue: 1,
            maxValue: 20,
            step: 1,
            required: true,
            advanced: false
          }
        ],
        performanceMetrics: {
          sharpeRatio: 1.3,
          sortino: 1.6,
          maxDrawdown: -0.18,
          annualizedReturn: 0.15,
          winRate: 0.52,
          profitFactor: 1.25,
          volatility: 0.22,
          beta: 0.8,
          alpha: 0.05,
          informationRatio: 0.85,
          calmarRatio: 0.83,
          averageWin: 0.04,
          averageLoss: -0.03,
          averageHoldingPeriod: 5,
          tradesPerMonth: 6
        },
        tags: ['sentiment', 'nlp', 'news', 'social-media'],
        author: 'NinjaTech AI',
        createdAt: new Date('2023-03-05'),
        updatedAt: new Date('2023-08-10'),
        version: '1.0.0',
        popularity: 75,
        complexity: 60
      }
    ];
    
    // Filter strategies based on user preferences
    const filteredStrategies = fallbackStrategies.filter(strategy => {
      // Check risk tolerance
      if (this.getRiskLevelValue(strategy.riskLevel) > this.getRiskLevelValue(userPreferences.riskTolerance)) {
        return false;
      }
      
      // Check preferred timeframes
      if (userPreferences.preferredTimeframes.length > 0 && 
          !strategy.timeframes.some(tf => userPreferences.preferredTimeframes.includes(tf))) {
        return false;
      }
      
      // Check preferred strategy types
      if (userPreferences.preferredStrategyTypes.length > 0 && 
          !userPreferences.preferredStrategyTypes.includes(strategy.type)) {
        return false;
      }
      
      // Check excluded strategy types
      if (userPreferences.excludedStrategyTypes.includes(strategy.type)) {
        return false;
      }
      
      // Check complexity
      if (strategy.complexity > userPreferences.maxComplexity) {
        return false;
      }
      
      // Check Sharpe ratio
      if (strategy.performanceMetrics.sharpeRatio < userPreferences.minSharpeRatio) {
        return false;
      }
      
      // Check max drawdown
      if (Math.abs(strategy.performanceMetrics.maxDrawdown) > Math.abs(userPreferences.maxDrawdown)) {
        return false;
      }
      
      // Check win rate
      if (strategy.performanceMetrics.winRate < userPreferences.minWinRate) {
        return false;
      }
      
      return true;
    });
    
    // Generate recommendations from filtered strategies
    return filteredStrategies.slice(0, count).map(strategy => ({
      strategy,
      score: this.calculateStrategyScore(strategy, userPreferences),
      matchReasons: this.generateMatchReasons(strategy, userPreferences),
      customizedParameters: strategy.parameters.reduce((params, param) => {
        params[param.id] = param.defaultValue;
        return params;
      }, {} as Record<string, any>),
      expectedPerformance: {
        estimatedReturn: strategy.performanceMetrics.annualizedReturn,
        estimatedRisk: strategy.performanceMetrics.volatility,
        confidenceLevel: 70 // Default confidence level
      },
      suitableTickers: ticker ? [
        {
          ticker,
          suitabilityScore: 80,
          reason: `${strategy.name} is generally suitable for ${ticker} based on historical performance.`
        }
      ] : []
    }));
  }

  /**
   * Calculate strategy score based on user preferences
   * @param strategy Trading strategy
   * @param preferences User preferences
   * @returns Score (0-100)
   */
  private calculateStrategyScore(strategy: TradingStrategy, preferences: UserPreferences): number {
    let score = 0;
    
    // Risk alignment (0-20 points)
    const riskDifference = Math.abs(
      this.getRiskLevelValue(strategy.riskLevel) - this.getRiskLevelValue(preferences.riskTolerance)
    );
    score += 20 - (riskDifference * 5);
    
    // Timeframe match (0-15 points)
    if (preferences.preferredTimeframes.length > 0) {
      const timeframeMatchCount = strategy.timeframes.filter(tf => 
        preferences.preferredTimeframes.includes(tf)
      ).length;
      score += (timeframeMatchCount / strategy.timeframes.length) * 15;
    } else {
      score += 10; // Neutral if no preferred timeframes
    }
    
    // Strategy type match (0-20 points)
    if (preferences.preferredStrategyTypes.includes(strategy.type)) {
      score += 20;
    }
    
    // Performance metrics (0-45 points)
    // Sharpe ratio (0-15 points)
    score += Math.min(strategy.performanceMetrics.sharpeRatio / preferences.minSharpeRatio, 1) * 15;
    
    // Win rate (0-10 points)
    score += Math.min(strategy.performanceMetrics.winRate / preferences.minWinRate, 1) * 10;
    
    // Drawdown (0-10 points)
    const drawdownRatio = preferences.maxDrawdown / strategy.performanceMetrics.maxDrawdown;
    score += Math.min(drawdownRatio, 1) * 10;
    
    // Return (0-10 points)
    score += Math.min(strategy.performanceMetrics.annualizedReturn * 100, 20) / 2;
    
    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Generate match reasons for a strategy recommendation
   * @param strategy Trading strategy
   * @param preferences User preferences
   * @returns Array of match reasons with impact scores
   */
  private generateMatchReasons(
    strategy: TradingStrategy, 
    preferences: UserPreferences
  ): { reason: string; impact: number }[] {
    const reasons: { reason: string; impact: number }[] = [];
    
    // Risk alignment
    const riskDifference = this.getRiskLevelValue(strategy.riskLevel) - this.getRiskLevelValue(preferences.riskTolerance);
    if (Math.abs(riskDifference) <= 1) {
      reasons.push({
        reason: `Risk level (${strategy.riskLevel}) aligns well with your risk tolerance.`,
        impact: 20 - (Math.abs(riskDifference) * 10)
      });
    } else {
      reasons.push({
        reason: `Risk level (${strategy.riskLevel}) differs from your risk tolerance (${preferences.riskTolerance}).`,
        impact: -10 * Math.abs(riskDifference)
      });
    }
    
    // Timeframe match
    if (preferences.preferredTimeframes.length > 0) {
      const matchingTimeframes = strategy.timeframes.filter(tf => preferences.preferredTimeframes.includes(tf));
      if (matchingTimeframes.length > 0) {
        reasons.push({
          reason: `Strategy supports your preferred timeframes (${matchingTimeframes.join(', ')}).`,
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
        reason: `Strategy type (${strategy.type}) matches your preferences.`,
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
    
    // Sort reasons by absolute impact
    return reasons.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
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
}

export default StrategyRecommendationService;