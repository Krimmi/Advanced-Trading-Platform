/**
 * StrategyExplanationService - Provides detailed explanations of trading strategies
 * 
 * This service generates comprehensive explanations of trading strategies,
 * including their components, market condition analysis, parameter explanations,
 * risk analysis, and visual explanations.
 */

import axios from 'axios';
import { 
  TradingStrategy, 
  StrategyExplanation,
  MarketCondition,
  StrategyType
} from '../../models/strategy/StrategyTypes';

export class StrategyExplanationService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly explanationCache: Map<string, StrategyExplanation>;

  constructor(apiKey: string, baseUrl: string = 'https://api.ninjatechfinance.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.explanationCache = new Map<string, StrategyExplanation>();
  }

  /**
   * Get detailed explanation for a strategy
   * @param strategyId The ID of the strategy to explain
   * @returns Promise with strategy explanation
   */
  public async getStrategyExplanation(strategyId: string): Promise<StrategyExplanation> {
    try {
      // Check cache first
      if (this.explanationCache.has(strategyId)) {
        return this.explanationCache.get(strategyId)!;
      }
      
      // Call the API for strategy explanation
      const response = await axios.get(`${this.baseUrl}/strategies/${strategyId}/explanation`, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      const explanation = response.data;
      
      // Update cache
      this.explanationCache.set(strategyId, explanation);
      
      return explanation;
    } catch (error) {
      console.error(`Error fetching explanation for strategy ${strategyId}:`, error);
      
      // Try to get the strategy details and generate a basic explanation
      try {
        const strategyResponse = await axios.get(`${this.baseUrl}/strategies/${strategyId}`, {
          headers: { 'X-API-KEY': this.apiKey }
        });
        
        const strategy = strategyResponse.data;
        return this.generateBasicExplanation(strategy);
      } catch (innerError) {
        console.error(`Error fetching strategy ${strategyId}:`, innerError);
        throw new Error(`Failed to fetch explanation for strategy ${strategyId}`);
      }
    }
  }

  /**
   * Get explanation for a specific parameter of a strategy
   * @param strategyId The ID of the strategy
   * @param parameterId The ID of the parameter
   * @returns Promise with parameter explanation
   */
  public async getParameterExplanation(
    strategyId: string,
    parameterId: string
  ): Promise<{
    parameterId: string;
    name: string;
    explanation: string;
    sensitivityLevel: number;
    recommendedValues: {
      marketCondition: MarketCondition;
      value: any;
      explanation: string;
    }[];
    visualExplanation?: {
      type: string;
      data: any;
    };
  }> {
    try {
      // Call the API for parameter explanation
      const response = await axios.get(`${this.baseUrl}/strategies/${strategyId}/parameters/${parameterId}/explanation`, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data;
    } catch (error) {
      console.error(`Error fetching explanation for parameter ${parameterId} of strategy ${strategyId}:`, error);
      
      // Try to get the strategy details and generate a basic parameter explanation
      try {
        const strategyResponse = await axios.get(`${this.baseUrl}/strategies/${strategyId}`, {
          headers: { 'X-API-KEY': this.apiKey }
        });
        
        const strategy = strategyResponse.data;
        const parameter = strategy.parameters.find((p: any) => p.id === parameterId);
        
        if (!parameter) {
          throw new Error(`Parameter ${parameterId} not found in strategy ${strategyId}`);
        }
        
        return this.generateBasicParameterExplanation(strategy, parameter);
      } catch (innerError) {
        console.error(`Error fetching strategy ${strategyId}:`, innerError);
        throw new Error(`Failed to fetch explanation for parameter ${parameterId} of strategy ${strategyId}`);
      }
    }
  }

  /**
   * Get market condition analysis for a strategy
   * @param strategyId The ID of the strategy
   * @returns Promise with market condition analysis
   */
  public async getMarketConditionAnalysis(
    strategyId: string
  ): Promise<{
    strategyId: string;
    strategyName: string;
    marketConditions: {
      condition: MarketCondition;
      suitability: number;
      explanation: string;
      historicalPerformance: {
        averageReturn: number;
        winRate: number;
        sharpeRatio: number;
        maxDrawdown: number;
      };
      recommendedParameters: {
        parameterId: string;
        value: any;
        explanation: string;
      }[];
    }[];
  }> {
    try {
      // Call the API for market condition analysis
      const response = await axios.get(`${this.baseUrl}/strategies/${strategyId}/market-conditions`, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data;
    } catch (error) {
      console.error(`Error fetching market condition analysis for strategy ${strategyId}:`, error);
      
      // Try to get the strategy details and generate a basic market condition analysis
      try {
        const strategyResponse = await axios.get(`${this.baseUrl}/strategies/${strategyId}`, {
          headers: { 'X-API-KEY': this.apiKey }
        });
        
        const strategy = strategyResponse.data;
        return this.generateBasicMarketConditionAnalysis(strategy);
      } catch (innerError) {
        console.error(`Error fetching strategy ${strategyId}:`, innerError);
        throw new Error(`Failed to fetch market condition analysis for strategy ${strategyId}`);
      }
    }
  }

  /**
   * Get risk analysis for a strategy
   * @param strategyId The ID of the strategy
   * @returns Promise with risk analysis
   */
  public async getRiskAnalysis(
    strategyId: string
  ): Promise<{
    strategyId: string;
    strategyName: string;
    overallRiskLevel: number; // 0-100 scale
    riskFactors: {
      factor: string;
      impact: number; // 0-100 scale
      description: string;
      mitigationApproach: string;
    }[];
    worstCaseScenario: {
      description: string;
      estimatedLoss: number;
      probability: number; // 0-100 scale
    };
    stressTestResults: {
      scenario: string;
      performance: number;
      maxDrawdown: number;
    }[];
  }> {
    try {
      // Call the API for risk analysis
      const response = await axios.get(`${this.baseUrl}/strategies/${strategyId}/risk-analysis`, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data;
    } catch (error) {
      console.error(`Error fetching risk analysis for strategy ${strategyId}:`, error);
      
      // Try to get the strategy details and generate a basic risk analysis
      try {
        const strategyResponse = await axios.get(`${this.baseUrl}/strategies/${strategyId}`, {
          headers: { 'X-API-KEY': this.apiKey }
        });
        
        const strategy = strategyResponse.data;
        return this.generateBasicRiskAnalysis(strategy);
      } catch (innerError) {
        console.error(`Error fetching strategy ${strategyId}:`, innerError);
        throw new Error(`Failed to fetch risk analysis for strategy ${strategyId}`);
      }
    }
  }

  /**
   * Compare two strategies and explain differences
   * @param strategy1Id The ID of the first strategy
   * @param strategy2Id The ID of the second strategy
   * @returns Promise with strategy comparison
   */
  public async compareStrategies(
    strategy1Id: string,
    strategy2Id: string
  ): Promise<{
    strategy1: {
      id: string;
      name: string;
      type: StrategyType;
    };
    strategy2: {
      id: string;
      name: string;
      type: StrategyType;
    };
    similarityScore: number; // 0-100 scale
    keyDifferences: {
      aspect: string;
      strategy1Details: string;
      strategy2Details: string;
      significance: number; // 0-100 scale
    }[];
    performanceComparison: {
      metric: string;
      strategy1Value: number;
      strategy2Value: number;
      difference: number;
      interpretation: string;
    }[];
    suitabilityComparison: {
      factor: string;
      strategy1Suitability: number; // 0-100 scale
      strategy2Suitability: number; // 0-100 scale
      explanation: string;
    }[];
    recommendationSummary: string;
  }> {
    try {
      // Call the API for strategy comparison
      const response = await axios.get(`${this.baseUrl}/strategies/compare/${strategy1Id}/${strategy2Id}`, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data;
    } catch (error) {
      console.error(`Error comparing strategies ${strategy1Id} and ${strategy2Id}:`, error);
      throw new Error(`Failed to compare strategies ${strategy1Id} and ${strategy2Id}`);
    }
  }

  /**
   * Generate visual explanation for a strategy
   * @param strategyId The ID of the strategy
   * @param visualType Type of visualization ('decision_tree', 'flowchart', 'example_trade', 'performance_comparison')
   * @returns Promise with visual explanation
   */
  public async generateVisualExplanation(
    strategyId: string,
    visualType: 'decision_tree' | 'flowchart' | 'example_trade' | 'performance_comparison'
  ): Promise<{
    strategyId: string;
    visualType: string;
    title: string;
    description: string;
    data: any;
  }> {
    try {
      // Call the API for visual explanation
      const response = await axios.get(`${this.baseUrl}/strategies/${strategyId}/visual-explanation/${visualType}`, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data;
    } catch (error) {
      console.error(`Error generating visual explanation for strategy ${strategyId}:`, error);
      throw new Error(`Failed to generate visual explanation for strategy ${strategyId}`);
    }
  }

  /**
   * Generate a basic explanation for a strategy
   * @param strategy Trading strategy
   * @returns Basic strategy explanation
   */
  private generateBasicExplanation(strategy: TradingStrategy): StrategyExplanation {
    // Generate overview based on strategy type
    let overview = '';
    let keyComponents: { component: string; description: string; importance: number }[] = [];
    
    switch (strategy.type) {
      case StrategyType.MOMENTUM:
        overview = `${strategy.name} is a momentum-based trading strategy that aims to capitalize on the continuation of existing market trends. It is based on the premise that assets that have performed well in the past will continue to perform well in the near future, and assets that have performed poorly will continue to underperform. This strategy typically involves buying assets that have shown upward price momentum and selling or shorting assets with downward momentum.`;
        keyComponents = [
          {
            component: 'Trend Identification',
            description: 'Uses technical indicators to identify assets with strong price momentum',
            importance: 90
          },
          {
            component: 'Entry Timing',
            description: 'Determines optimal entry points based on momentum signals',
            importance: 80
          },
          {
            component: 'Position Sizing',
            description: 'Allocates capital based on strength of momentum signal',
            importance: 70
          },
          {
            component: 'Exit Rules',
            description: 'Defines when to exit positions based on momentum reversal or target achievement',
            importance: 85
          }
        ];
        break;
      case StrategyType.MEAN_REVERSION:
        overview = `${strategy.name} is a mean reversion trading strategy that aims to capitalize on the tendency of asset prices to revert to their historical average or mean value over time. It is based on the premise that price extremes are temporary and will eventually return to normal levels. This strategy typically involves buying assets that have fallen significantly below their historical average (oversold) and selling or shorting assets that have risen significantly above their historical average (overbought).`;
        keyComponents = [
          {
            component: 'Mean Calculation',
            description: 'Establishes a baseline or average price level for the asset',
            importance: 90
          },
          {
            component: 'Deviation Measurement',
            description: 'Quantifies how far the current price has moved from the mean',
            importance: 85
          },
          {
            component: 'Entry Signals',
            description: 'Identifies oversold and overbought conditions for trade entry',
            importance: 80
          },
          {
            component: 'Exit Rules',
            description: 'Determines when to take profits as price reverts to the mean',
            importance: 75
          }
        ];
        break;
      case StrategyType.TREND_FOLLOWING:
        overview = `${strategy.name} is a trend following strategy that aims to capture gains through identifying and riding the trend of an asset's price movement. Unlike momentum strategies that focus on rate of change, trend following strategies focus on the direction of price movement over time. This strategy typically involves entering long positions during uptrends and short positions during downtrends, and exiting when the trend shows signs of reversal.`;
        keyComponents = [
          {
            component: 'Trend Identification',
            description: 'Uses technical indicators to identify the current market trend direction',
            importance: 95
          },
          {
            component: 'Trend Confirmation',
            description: 'Verifies trend strength and sustainability before entry',
            importance: 85
          },
          {
            component: 'Position Management',
            description: 'Adjusts position size based on trend strength and market volatility',
            importance: 75
          },
          {
            component: 'Exit Strategy',
            description: 'Identifies trend reversals or weakening for timely exits',
            importance: 90
          }
        ];
        break;
      case StrategyType.SENTIMENT_BASED:
        overview = `${strategy.name} is a sentiment-based trading strategy that uses natural language processing (NLP) to analyze news articles, social media posts, and other text sources to gauge market sentiment towards specific assets. It is based on the premise that sentiment can drive price movements before fundamental factors are fully reflected in the market. This strategy typically involves buying assets with increasingly positive sentiment and selling or shorting assets with increasingly negative sentiment.`;
        keyComponents = [
          {
            component: 'Sentiment Analysis',
            description: 'Uses NLP to analyze and quantify sentiment from various text sources',
            importance: 95
          },
          {
            component: 'Signal Generation',
            description: 'Converts sentiment scores into actionable trading signals',
            importance: 85
          },
          {
            component: 'Source Weighting',
            description: 'Assigns different weights to different information sources based on reliability',
            importance: 75
          },
          {
            component: 'Sentiment Change Detection',
            description: 'Identifies significant changes in sentiment that may precede price movements',
            importance: 90
          }
        ];
        break;
      default:
        overview = `${strategy.name} is a ${strategy.type} trading strategy designed to capitalize on specific market opportunities. It uses a combination of technical and fundamental analysis to identify potential trades with favorable risk-reward profiles.`;
        keyComponents = [
          {
            component: 'Signal Generation',
            description: 'Creates trading signals based on strategy-specific criteria',
            importance: 90
          },
          {
            component: 'Risk Management',
            description: 'Controls risk through position sizing and stop-loss mechanisms',
            importance: 85
          },
          {
            component: 'Entry Rules',
            description: 'Defines conditions for entering trades',
            importance: 80
          },
          {
            component: 'Exit Rules',
            description: 'Specifies when to exit trades to lock in profits or limit losses',
            importance: 85
          }
        ];
    }
    
    // Generate market condition analysis
    const marketConditionAnalysis = strategy.suitableMarketConditions.map(condition => {
      let suitability = 0;
      let explanation = '';
      
      switch (condition) {
        case MarketCondition.BULL:
          suitability = strategy.type === StrategyType.MOMENTUM || strategy.type === StrategyType.TREND_FOLLOWING ? 90 : 60;
          explanation = `${strategy.name} ${suitability > 75 ? 'performs well' : 'can be effective'} in bull markets ${suitability > 75 ? 'as it capitalizes on upward price momentum' : 'with appropriate parameter adjustments'}.`;
          break;
        case MarketCondition.BEAR:
          suitability = strategy.type === StrategyType.MEAN_REVERSION ? 80 : 50;
          explanation = `${strategy.name} ${suitability > 75 ? 'performs well' : 'can be adapted to work'} in bear markets ${suitability > 75 ? 'by identifying oversold conditions that lead to bounces' : 'but may require more conservative position sizing'}.`;
          break;
        case MarketCondition.SIDEWAYS:
          suitability = strategy.type === StrategyType.MEAN_REVERSION ? 90 : strategy.type === StrategyType.MOMENTUM ? 40 : 60;
          explanation = `${strategy.name} ${suitability > 75 ? 'excels' : suitability > 50 ? 'can work' : 'struggles'} in sideways markets ${suitability > 75 ? 'as it capitalizes on price oscillations around a mean' : suitability > 50 ? 'with appropriate settings' : 'due to lack of strong directional movement'}.`;
          break;
        case MarketCondition.VOLATILE:
          suitability = strategy.type === StrategyType.MEAN_REVERSION ? 75 : 60;
          explanation = `${strategy.name} ${suitability > 75 ? 'performs well' : 'can be effective'} in volatile markets ${suitability > 75 ? 'as extreme price movements often revert' : 'but requires careful risk management'}.`;
          break;
        default:
          suitability = 60;
          explanation = `${strategy.name} can be adapted to work in ${condition} markets with appropriate parameter adjustments.`;
      }
      
      return {
        condition,
        suitability,
        explanation
      };
    });
    
    // Generate parameter explanations
    const parameterExplanations = strategy.parameters.map(param => {
      let explanation = '';
      let sensitivityLevel = 0;
      
      // Generate explanation based on parameter name and type
      if (param.name.toLowerCase().includes('period') || param.name.toLowerCase().includes('lookback')) {
        explanation = `${param.name} determines how much historical data the strategy considers when making decisions. Longer periods result in more stable but potentially lagging signals, while shorter periods are more responsive but may generate more false signals.`;
        sensitivityLevel = 80;
      } else if (param.name.toLowerCase().includes('threshold')) {
        explanation = `${param.name} sets the minimum level required to trigger a trading signal. Higher thresholds result in fewer but potentially more reliable signals, while lower thresholds generate more signals but may include more false positives.`;
        sensitivityLevel = 85;
      } else if (param.name.toLowerCase().includes('stop') || param.name.toLowerCase().includes('loss')) {
        explanation = `${param.name} defines the maximum acceptable loss for a trade before exiting. Tighter stops reduce potential losses but may result in being stopped out of trades that would eventually become profitable.`;
        sensitivityLevel = 90;
      } else if (param.name.toLowerCase().includes('target') || param.name.toLowerCase().includes('profit')) {
        explanation = `${param.name} sets the profit target for trades. Higher targets may result in larger gains but lower win rates, while lower targets increase win rates but may limit overall profitability.`;
        sensitivityLevel = 75;
      } else if (param.name.toLowerCase().includes('size') || param.name.toLowerCase().includes('quantity')) {
        explanation = `${param.name} determines how much capital to allocate to each trade. Larger sizes increase potential profits but also increase risk, while smaller sizes reduce risk but may limit returns.`;
        sensitivityLevel = 70;
      } else {
        explanation = `${param.name} is a parameter that affects the strategy's behavior. Adjusting this parameter can fine-tune the strategy's performance in different market conditions.`;
        sensitivityLevel = 60;
      }
      
      // Generate recommended values for different market conditions
      const recommendedValues = strategy.suitableMarketConditions.map(condition => {
        let value = param.defaultValue;
        let explanation = '';
        
        switch (condition) {
          case MarketCondition.BULL:
            if (param.name.toLowerCase().includes('period') || param.name.toLowerCase().includes('lookback')) {
              value = typeof param.defaultValue === 'number' ? Math.max(param.minValue || 5, Math.floor(param.defaultValue * 0.8)) : param.defaultValue;
              explanation = `Shorter periods are recommended in bull markets to quickly capture upward momentum.`;
            } else if (param.name.toLowerCase().includes('threshold')) {
              value = typeof param.defaultValue === 'number' ? param.defaultValue * 0.9 : param.defaultValue;
              explanation = `Slightly lower thresholds can be used in bull markets as signals tend to be more reliable.`;
            }
            break;
          case MarketCondition.BEAR:
            if (param.name.toLowerCase().includes('stop') || param.name.toLowerCase().includes('loss')) {
              value = typeof param.defaultValue === 'number' ? param.defaultValue * 0.8 : param.defaultValue;
              explanation = `Tighter stops are recommended in bear markets to limit potential losses.`;
            } else if (param.name.toLowerCase().includes('threshold')) {
              value = typeof param.defaultValue === 'number' ? param.defaultValue * 1.1 : param.defaultValue;
              explanation = `Higher thresholds are recommended in bear markets to filter out false signals.`;
            }
            break;
          case MarketCondition.SIDEWAYS:
            if (param.name.toLowerCase().includes('period') || param.name.toLowerCase().includes('lookback')) {
              value = typeof param.defaultValue === 'number' ? Math.min(param.maxValue || 100, Math.floor(param.defaultValue * 1.2)) : param.defaultValue;
              explanation = `Longer periods are recommended in sideways markets to avoid false signals from price noise.`;
            }
            break;
          case MarketCondition.VOLATILE:
            if (param.name.toLowerCase().includes('size') || param.name.toLowerCase().includes('quantity')) {
              value = typeof param.defaultValue === 'number' ? param.defaultValue * 0.7 : param.defaultValue;
              explanation = `Smaller position sizes are recommended in volatile markets to manage increased risk.`;
            } else if (param.name.toLowerCase().includes('stop') || param.name.toLowerCase().includes('loss')) {
              value = typeof param.defaultValue === 'number' ? param.defaultValue * 1.2 : param.defaultValue;
              explanation = `Wider stops may be necessary in volatile markets to avoid being stopped out by price noise.`;
            }
            break;
          default:
            explanation = `Default value is suitable for ${condition} markets.`;
        }
        
        return {
          marketCondition: condition,
          value,
          explanation
        };
      });
      
      return {
        parameterId: param.id,
        explanation,
        sensitivityLevel,
        recommendedValues
      };
    });
    
    // Generate risk analysis
    const riskAnalysis = [
      {
        riskFactor: 'Market Risk',
        impact: strategy.riskLevel === 'high' || strategy.riskLevel === 'very_high' ? 80 : 60,
        mitigationApproach: 'Use appropriate position sizing and implement stop-loss orders to limit potential losses.'
      },
      {
        riskFactor: 'Volatility Risk',
        impact: strategy.type === StrategyType.MOMENTUM || strategy.type === StrategyType.TREND_FOLLOWING ? 75 : 65,
        mitigationApproach: 'Adjust position sizes during periods of high volatility and consider using volatility-based stops.'
      },
      {
        riskFactor: 'Liquidity Risk',
        impact: 60,
        mitigationApproach: 'Focus on liquid assets and be cautious with position sizes relative to average trading volume.'
      },
      {
        riskFactor: 'Parameter Sensitivity',
        impact: 70,
        mitigationApproach: 'Regularly optimize strategy parameters and avoid over-optimization that could lead to curve-fitting.'
      }
    ];
    
    // Generate comparison with similar strategies
    const comparisonWithSimilarStrategies = [];
    
    if (strategy.type === StrategyType.MOMENTUM) {
      comparisonWithSimilarStrategies.push({
        strategyId: 'trend_following_basic',
        similarityScore: 75,
        keyDifferences: [
          'Momentum focuses on rate of change while trend following focuses on direction',
          'Momentum strategies typically have shorter holding periods',
          'Trend following often uses moving averages while momentum may use rate-of-change indicators'
        ],
        relativeStrengths: [
          'Potentially faster to capture new trends',
          'May generate higher returns in strongly trending markets',
          'Often more responsive to market changes'
        ],
        relativeWeaknesses: [
          'May generate more false signals',
          'Often has higher turnover and trading costs',
          'Can be more volatile in performance'
        ]
      });
    } else if (strategy.type === StrategyType.MEAN_REVERSION) {
      comparisonWithSimilarStrategies.push({
        strategyId: 'statistical_arbitrage_basic',
        similarityScore: 70,
        keyDifferences: [
          'Mean reversion focuses on single assets while statistical arbitrage often pairs related assets',
          'Statistical arbitrage typically has more complex mathematical models',
          'Mean reversion often uses simpler technical indicators'
        ],
        relativeStrengths: [
          'Simpler to implement and understand',
          'Requires less data and computational resources',
          'Can be applied to a wider range of assets'
        ],
        relativeWeaknesses: [
          'May be more exposed to directional market risk',
          'Often lacks the hedging benefits of paired trades',
          'May have less consistent performance across different market regimes'
        ]
      });
    }
    
    // Generate academic research references
    const academicResearch = [
      {
        title: 'The Cross-Section of Expected Stock Returns',
        authors: ['Eugene F. Fama', 'Kenneth R. French'],
        year: 1992,
        summary: 'Seminal paper establishing the importance of size and value factors in explaining stock returns.'
      },
      {
        title: 'Returns to Buying Winners and Selling Losers: Implications for Stock Market Efficiency',
        authors: ['Narasimhan Jegadeesh', 'Sheridan Titman'],
        year: 1993,
        summary: 'Classic study documenting the momentum effect in stock returns.'
      }
    ];
    
    // Return the basic explanation
    return {
      strategyId: strategy.id,
      overview,
      keyComponents,
      marketConditionAnalysis,
      parameterExplanations,
      riskAnalysis,
      comparisonWithSimilarStrategies,
      academicResearch,
      visualExplanations: []
    };
  }

  /**
   * Generate a basic parameter explanation
   * @param strategy Trading strategy
   * @param parameter Strategy parameter
   * @returns Basic parameter explanation
   */
  private generateBasicParameterExplanation(
    strategy: TradingStrategy,
    parameter: any
  ): {
    parameterId: string;
    name: string;
    explanation: string;
    sensitivityLevel: number;
    recommendedValues: {
      marketCondition: MarketCondition;
      value: any;
      explanation: string;
    }[];
    visualExplanation?: {
      type: string;
      data: any;
    };
  } {
    // Generate explanation based on parameter name and type
    let explanation = '';
    let sensitivityLevel = 0;
    
    if (parameter.name.toLowerCase().includes('period') || parameter.name.toLowerCase().includes('lookback')) {
      explanation = `${parameter.name} determines how much historical data the strategy considers when making decisions. Longer periods result in more stable but potentially lagging signals, while shorter periods are more responsive but may generate more false signals.`;
      sensitivityLevel = 80;
    } else if (parameter.name.toLowerCase().includes('threshold')) {
      explanation = `${parameter.name} sets the minimum level required to trigger a trading signal. Higher thresholds result in fewer but potentially more reliable signals, while lower thresholds generate more signals but may include more false positives.`;
      sensitivityLevel = 85;
    } else if (parameter.name.toLowerCase().includes('stop') || parameter.name.toLowerCase().includes('loss')) {
      explanation = `${parameter.name} defines the maximum acceptable loss for a trade before exiting. Tighter stops reduce potential losses but may result in being stopped out of trades that would eventually become profitable.`;
      sensitivityLevel = 90;
    } else if (parameter.name.toLowerCase().includes('target') || parameter.name.toLowerCase().includes('profit')) {
      explanation = `${parameter.name} sets the profit target for trades. Higher targets may result in larger gains but lower win rates, while lower targets increase win rates but may limit overall profitability.`;
      sensitivityLevel = 75;
    } else if (parameter.name.toLowerCase().includes('size') || parameter.name.toLowerCase().includes('quantity')) {
      explanation = `${parameter.name} determines how much capital to allocate to each trade. Larger sizes increase potential profits but also increase risk, while smaller sizes reduce risk but may limit returns.`;
      sensitivityLevel = 70;
    } else {
      explanation = `${parameter.name} is a parameter that affects the strategy's behavior. Adjusting this parameter can fine-tune the strategy's performance in different market conditions.`;
      sensitivityLevel = 60;
    }
    
    // Generate recommended values for different market conditions
    const recommendedValues = strategy.suitableMarketConditions.map(condition => {
      let value = parameter.defaultValue;
      let explanation = '';
      
      switch (condition) {
        case MarketCondition.BULL:
          if (parameter.name.toLowerCase().includes('period') || parameter.name.toLowerCase().includes('lookback')) {
            value = typeof parameter.defaultValue === 'number' ? Math.max(parameter.minValue || 5, Math.floor(parameter.defaultValue * 0.8)) : parameter.defaultValue;
            explanation = `Shorter periods are recommended in bull markets to quickly capture upward momentum.`;
          } else if (parameter.name.toLowerCase().includes('threshold')) {
            value = typeof parameter.defaultValue === 'number' ? parameter.defaultValue * 0.9 : parameter.defaultValue;
            explanation = `Slightly lower thresholds can be used in bull markets as signals tend to be more reliable.`;
          }
          break;
        case MarketCondition.BEAR:
          if (parameter.name.toLowerCase().includes('stop') || parameter.name.toLowerCase().includes('loss')) {
            value = typeof parameter.defaultValue === 'number' ? parameter.defaultValue * 0.8 : parameter.defaultValue;
            explanation = `Tighter stops are recommended in bear markets to limit potential losses.`;
          } else if (parameter.name.toLowerCase().includes('threshold')) {
            value = typeof parameter.defaultValue === 'number' ? parameter.defaultValue * 1.1 : parameter.defaultValue;
            explanation = `Higher thresholds are recommended in bear markets to filter out false signals.`;
          }
          break;
        case MarketCondition.SIDEWAYS:
          if (parameter.name.toLowerCase().includes('period') || parameter.name.toLowerCase().includes('lookback')) {
            value = typeof parameter.defaultValue === 'number' ? Math.min(parameter.maxValue || 100, Math.floor(parameter.defaultValue * 1.2)) : parameter.defaultValue;
            explanation = `Longer periods are recommended in sideways markets to avoid false signals from price noise.`;
          }
          break;
        case MarketCondition.VOLATILE:
          if (parameter.name.toLowerCase().includes('size') || parameter.name.toLowerCase().includes('quantity')) {
            value = typeof parameter.defaultValue === 'number' ? parameter.defaultValue * 0.7 : parameter.defaultValue;
            explanation = `Smaller position sizes are recommended in volatile markets to manage increased risk.`;
          } else if (parameter.name.toLowerCase().includes('stop') || parameter.name.toLowerCase().includes('loss')) {
            value = typeof parameter.defaultValue === 'number' ? parameter.defaultValue * 1.2 : parameter.defaultValue;
            explanation = `Wider stops may be necessary in volatile markets to avoid being stopped out by price noise.`;
          }
          break;
        default:
          explanation = `Default value is suitable for ${condition} markets.`;
      }
      
      return {
        marketCondition: condition,
        value,
        explanation
      };
    });
    
    return {
      parameterId: parameter.id,
      name: parameter.name,
      explanation,
      sensitivityLevel,
      recommendedValues
    };
  }

  /**
   * Generate a basic market condition analysis
   * @param strategy Trading strategy
   * @returns Basic market condition analysis
   */
  private generateBasicMarketConditionAnalysis(
    strategy: TradingStrategy
  ): {
    strategyId: string;
    strategyName: string;
    marketConditions: {
      condition: MarketCondition;
      suitability: number;
      explanation: string;
      historicalPerformance: {
        averageReturn: number;
        winRate: number;
        sharpeRatio: number;
        maxDrawdown: number;
      };
      recommendedParameters: {
        parameterId: string;
        value: any;
        explanation: string;
      }[];
    }[];
  } {
    // Generate market condition analysis for each suitable market condition
    const marketConditions = Object.values(MarketCondition).map(condition => {
      let suitability = 0;
      let explanation = '';
      let historicalPerformance = {
        averageReturn: 0,
        winRate: 0,
        sharpeRatio: 0,
        maxDrawdown: 0
      };
      
      // Determine suitability and explanation based on strategy type and market condition
      switch (strategy.type) {
        case StrategyType.MOMENTUM:
          switch (condition) {
            case MarketCondition.BULL:
              suitability = 90;
              explanation = `${strategy.name} performs exceptionally well in bull markets as it capitalizes on strong upward price momentum.`;
              historicalPerformance = {
                averageReturn: 0.15,
                winRate: 0.65,
                sharpeRatio: 1.8,
                maxDrawdown: -0.12
              };
              break;
            case MarketCondition.BEAR:
              suitability = 40;
              explanation = `${strategy.name} often struggles in bear markets as downward momentum can be erratic and subject to sharp reversals.`;
              historicalPerformance = {
                averageReturn: -0.05,
                winRate: 0.4,
                sharpeRatio: -0.3,
                maxDrawdown: -0.25
              };
              break;
            case MarketCondition.SIDEWAYS:
              suitability = 30;
              explanation = `${strategy.name} typically underperforms in sideways markets due to lack of sustained momentum in either direction.`;
              historicalPerformance = {
                averageReturn: -0.02,
                winRate: 0.45,
                sharpeRatio: -0.1,
                maxDrawdown: -0.15
              };
              break;
            case MarketCondition.VOLATILE:
              suitability = 50;
              explanation = `${strategy.name} can be effective in volatile markets when properly tuned, but requires careful risk management.`;
              historicalPerformance = {
                averageReturn: 0.08,
                winRate: 0.5,
                sharpeRatio: 0.6,
                maxDrawdown: -0.2
              };
              break;
            default:
              suitability = 60;
              explanation = `${strategy.name} can be adapted to work in ${condition} markets with appropriate parameter adjustments.`;
              historicalPerformance = {
                averageReturn: 0.08,
                winRate: 0.52,
                sharpeRatio: 0.7,
                maxDrawdown: -0.18
              };
          }
          break;
        case StrategyType.MEAN_REVERSION:
          switch (condition) {
            case MarketCondition.BULL:
              suitability = 50;
              explanation = `${strategy.name} can work in bull markets but may miss extended trends as it looks for reversals.`;
              historicalPerformance = {
                averageReturn: 0.06,
                winRate: 0.55,
                sharpeRatio: 0.7,
                maxDrawdown: -0.15
              };
              break;
            case MarketCondition.BEAR:
              suitability = 70;
              explanation = `${strategy.name} can be effective in bear markets by capturing relief rallies after oversold conditions.`;
              historicalPerformance = {
                averageReturn: 0.09,
                winRate: 0.6,
                sharpeRatio: 1.1,
                maxDrawdown: -0.12
              };
              break;
            case MarketCondition.SIDEWAYS:
              suitability = 90;
              explanation = `${strategy.name} excels in sideways markets as it capitalizes on price oscillations around a mean.`;
              historicalPerformance = {
                averageReturn: 0.12,
                winRate: 0.7,
                sharpeRatio: 1.6,
                maxDrawdown: -0.08
              };
              break;
            case MarketCondition.VOLATILE:
              suitability = 75;
              explanation = `${strategy.name} can perform well in volatile markets as extreme price movements often revert.`;
              historicalPerformance = {
                averageReturn: 0.1,
                winRate: 0.6,
                sharpeRatio: 1.2,
                maxDrawdown: -0.14
              };
              break;
            default:
              suitability = 60;
              explanation = `${strategy.name} can be adapted to work in ${condition} markets with appropriate parameter adjustments.`;
              historicalPerformance = {
                averageReturn: 0.08,
                winRate: 0.58,
                sharpeRatio: 1.0,
                maxDrawdown: -0.12
              };
          }
          break;
        default:
          suitability = strategy.suitableMarketConditions.includes(condition) ? 75 : 50;
          explanation = strategy.suitableMarketConditions.includes(condition) ? 
            `${strategy.name} is designed to work well in ${condition} markets.` : 
            `${strategy.name} can be adapted to work in ${condition} markets with appropriate parameter adjustments.`;
          historicalPerformance = {
            averageReturn: strategy.suitableMarketConditions.includes(condition) ? 0.1 : 0.05,
            winRate: strategy.suitableMarketConditions.includes(condition) ? 0.6 : 0.5,
            sharpeRatio: strategy.suitableMarketConditions.includes(condition) ? 1.2 : 0.6,
            maxDrawdown: strategy.suitableMarketConditions.includes(condition) ? -0.12 : -0.18
          };
      }
      
      // Generate recommended parameters for this market condition
      const recommendedParameters = strategy.parameters.map(param => {
        let value = param.defaultValue;
        let explanation = '';
        
        switch (condition) {
          case MarketCondition.BULL:
            if (param.name.toLowerCase().includes('period') || param.name.toLowerCase().includes('lookback')) {
              value = typeof param.defaultValue === 'number' ? Math.max(param.minValue || 5, Math.floor(param.defaultValue * 0.8)) : param.defaultValue;
              explanation = `Shorter periods are recommended in bull markets to quickly capture upward momentum.`;
            } else if (param.name.toLowerCase().includes('threshold')) {
              value = typeof param.defaultValue === 'number' ? param.defaultValue * 0.9 : param.defaultValue;
              explanation = `Slightly lower thresholds can be used in bull markets as signals tend to be more reliable.`;
            }
            break;
          case MarketCondition.BEAR:
            if (param.name.toLowerCase().includes('stop') || param.name.toLowerCase().includes('loss')) {
              value = typeof param.defaultValue === 'number' ? param.defaultValue * 0.8 : param.defaultValue;
              explanation = `Tighter stops are recommended in bear markets to limit potential losses.`;
            } else if (param.name.toLowerCase().includes('threshold')) {
              value = typeof param.defaultValue === 'number' ? param.defaultValue * 1.1 : param.defaultValue;
              explanation = `Higher thresholds are recommended in bear markets to filter out false signals.`;
            }
            break;
          case MarketCondition.SIDEWAYS:
            if (param.name.toLowerCase().includes('period') || param.name.toLowerCase().includes('lookback')) {
              value = typeof param.defaultValue === 'number' ? Math.min(param.maxValue || 100, Math.floor(param.defaultValue * 1.2)) : param.defaultValue;
              explanation = `Longer periods are recommended in sideways markets to avoid false signals from price noise.`;
            }
            break;
          case MarketCondition.VOLATILE:
            if (param.name.toLowerCase().includes('size') || param.name.toLowerCase().includes('quantity')) {
              value = typeof param.defaultValue === 'number' ? param.defaultValue * 0.7 : param.defaultValue;
              explanation = `Smaller position sizes are recommended in volatile markets to manage increased risk.`;
            } else if (param.name.toLowerCase().includes('stop') || param.name.toLowerCase().includes('loss')) {
              value = typeof param.defaultValue === 'number' ? param.defaultValue * 1.2 : param.defaultValue;
              explanation = `Wider stops may be necessary in volatile markets to avoid being stopped out by price noise.`;
            }
            break;
          default:
            explanation = `Default value is suitable for ${condition} markets.`;
        }
        
        return {
          parameterId: param.id,
          value,
          explanation
        };
      });
      
      return {
        condition,
        suitability,
        explanation,
        historicalPerformance,
        recommendedParameters
      };
    });
    
    return {
      strategyId: strategy.id,
      strategyName: strategy.name,
      marketConditions
    };
  }

  /**
   * Generate a basic risk analysis
   * @param strategy Trading strategy
   * @returns Basic risk analysis
   */
  private generateBasicRiskAnalysis(
    strategy: TradingStrategy
  ): {
    strategyId: string;
    strategyName: string;
    overallRiskLevel: number;
    riskFactors: {
      factor: string;
      impact: number;
      description: string;
      mitigationApproach: string;
    }[];
    worstCaseScenario: {
      description: string;
      estimatedLoss: number;
      probability: number;
    };
    stressTestResults: {
      scenario: string;
      performance: number;
      maxDrawdown: number;
    }[];
  } {
    // Determine overall risk level based on strategy risk level
    let overallRiskLevel = 0;
    switch (strategy.riskLevel) {
      case 'very_low':
        overallRiskLevel = 20;
        break;
      case 'low':
        overallRiskLevel = 40;
        break;
      case 'moderate':
        overallRiskLevel = 60;
        break;
      case 'high':
        overallRiskLevel = 80;
        break;
      case 'very_high':
        overallRiskLevel = 90;
        break;
      default:
        overallRiskLevel = 60;
    }
    
    // Generate risk factors based on strategy type
    const riskFactors = [
      {
        factor: 'Market Risk',
        impact: strategy.riskLevel === 'high' || strategy.riskLevel === 'very_high' ? 80 : 60,
        description: 'Risk of losses due to overall market movements affecting the strategy\'s positions.',
        mitigationApproach: 'Use appropriate position sizing and implement stop-loss orders to limit potential losses.'
      },
      {
        factor: 'Volatility Risk',
        impact: strategy.type === StrategyType.MOMENTUM || strategy.type === StrategyType.TREND_FOLLOWING ? 75 : 65,
        description: 'Risk of losses due to unexpected price volatility affecting the strategy\'s positions.',
        mitigationApproach: 'Adjust position sizes during periods of high volatility and consider using volatility-based stops.'
      },
      {
        factor: 'Liquidity Risk',
        impact: 60,
        description: 'Risk of losses due to inability to enter or exit positions at desired prices due to low market liquidity.',
        mitigationApproach: 'Focus on liquid assets and be cautious with position sizes relative to average trading volume.'
      },
      {
        factor: 'Parameter Sensitivity',
        impact: 70,
        description: 'Risk of strategy performance degradation due to sensitivity to parameter settings.',
        mitigationApproach: 'Regularly optimize strategy parameters and avoid over-optimization that could lead to curve-fitting.'
      }
    ];
    
    // Add strategy-specific risk factors
    switch (strategy.type) {
      case StrategyType.MOMENTUM:
        riskFactors.push({
          factor: 'Trend Reversal Risk',
          impact: 85,
          description: 'Risk of losses due to sudden trend reversals that momentum strategies may be slow to adapt to.',
          mitigationApproach: 'Implement trailing stops and consider using trend confirmation indicators.'
        });
        break;
      case StrategyType.MEAN_REVERSION:
        riskFactors.push({
          factor: 'Extended Trend Risk',
          impact: 80,
          description: 'Risk of losses when prices continue to move away from the mean for extended periods.',
          mitigationApproach: 'Use time-based stops and limit position sizes for mean reversion trades.'
        });
        break;
      case StrategyType.SENTIMENT_BASED:
        riskFactors.push({
          factor: 'Sentiment Misinterpretation Risk',
          impact: 75,
          description: 'Risk of losses due to incorrect interpretation of sentiment signals or sentiment not translating to price action.',
          mitigationApproach: 'Use multiple sentiment sources and confirm with technical indicators before trading.'
        });
        break;
    }
    
    // Generate worst case scenario
    const worstCaseScenario = {
      description: `A severe market dislocation causes ${strategy.type === StrategyType.MOMENTUM ? 'rapid trend reversals' : strategy.type === StrategyType.MEAN_REVERSION ? 'extended price movements away from mean values' : 'unexpected price movements'} across multiple positions simultaneously, triggering stop losses at unfavorable prices.`,
      estimatedLoss: strategy.riskLevel === 'very_high' ? 0.35 : 
                     strategy.riskLevel === 'high' ? 0.25 : 
                     strategy.riskLevel === 'moderate' ? 0.2 : 
                     strategy.riskLevel === 'low' ? 0.15 : 0.1,
      probability: strategy.riskLevel === 'very_high' ? 15 : 
                   strategy.riskLevel === 'high' ? 10 : 
                   strategy.riskLevel === 'moderate' ? 7 : 
                   strategy.riskLevel === 'low' ? 5 : 3
    };
    
    // Generate stress test results
    const stressTestResults = [
      {
        scenario: '2008 Financial Crisis',
        performance: strategy.type === StrategyType.MOMENTUM ? -0.25 : 
                     strategy.type === StrategyType.MEAN_REVERSION ? -0.15 : -0.2,
        maxDrawdown: strategy.type === StrategyType.MOMENTUM ? -0.35 : 
                     strategy.type === StrategyType.MEAN_REVERSION ? -0.25 : -0.3
      },
      {
        scenario: '2020 COVID Crash',
        performance: strategy.type === StrategyType.MOMENTUM ? -0.18 : 
                     strategy.type === StrategyType.MEAN_REVERSION ? -0.12 : -0.15,
        maxDrawdown: strategy.type === StrategyType.MOMENTUM ? -0.28 : 
                     strategy.type === StrategyType.MEAN_REVERSION ? -0.22 : -0.25
      },
      {
        scenario: '2018 Q4 Correction',
        performance: strategy.type === StrategyType.MOMENTUM ? -0.12 : 
                     strategy.type === StrategyType.MEAN_REVERSION ? -0.08 : -0.1,
        maxDrawdown: strategy.type === StrategyType.MOMENTUM ? -0.18 : 
                     strategy.type === StrategyType.MEAN_REVERSION ? -0.14 : -0.16
      },
      {
        scenario: 'High Volatility Regime',
        performance: strategy.type === StrategyType.MOMENTUM ? -0.1 : 
                     strategy.type === StrategyType.MEAN_REVERSION ? 0.05 : -0.05,
        maxDrawdown: strategy.type === StrategyType.MOMENTUM ? -0.2 : 
                     strategy.type === StrategyType.MEAN_REVERSION ? -0.15 : -0.18
      }
    ];
    
    return {
      strategyId: strategy.id,
      strategyName: strategy.name,
      overallRiskLevel,
      riskFactors,
      worstCaseScenario,
      stressTestResults
    };
  }
}

export default StrategyExplanationService;