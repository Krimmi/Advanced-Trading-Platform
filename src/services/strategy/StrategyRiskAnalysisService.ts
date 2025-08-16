/**
 * StrategyRiskAnalysisService - Service for analyzing risks of trading strategies
 * 
 * This service provides functionality for analyzing various risks associated with
 * trading strategies, including market risk, volatility risk, drawdown risk,
 * and correlation risk.
 */

import axios from 'axios';
import { 
  TradingStrategy, 
  StrategyPerformanceMetrics,
  MarketCondition,
  Timeframe
} from '../../models/strategy/StrategyTypes';

export class StrategyRiskAnalysisService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly riskAnalysisCache: Map<string, any>;

  constructor(apiKey: string, baseUrl: string = 'https://api.ninjatechfinance.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.riskAnalysisCache = new Map<string, any>();
  }

  /**
   * Get comprehensive risk analysis for a strategy
   * @param strategyId The ID of the strategy to analyze
   * @param ticker Optional ticker symbol to analyze risk for a specific asset
   * @returns Promise with risk analysis results
   */
  public async getRiskAnalysis(
    strategyId: string,
    ticker?: string
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
      // Generate cache key
      const cacheKey = `risk_analysis_${strategyId}_${ticker || 'all'}`;
      
      // Check cache first
      if (this.riskAnalysisCache.has(cacheKey)) {
        return this.riskAnalysisCache.get(cacheKey);
      }
      
      // Call the API for risk analysis
      const response = await axios.get(`${this.baseUrl}/strategies/${strategyId}/risk-analysis`, {
        headers: { 'X-API-KEY': this.apiKey },
        params: { ticker }
      });

      const result = response.data;
      
      // Update cache
      this.riskAnalysisCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error(`Error getting risk analysis for strategy ${strategyId}:`, error);
      throw new Error(`Failed to get risk analysis for strategy ${strategyId}`);
    }
  }

  /**
   * Run stress tests on a strategy
   * @param strategyId The ID of the strategy to test
   * @param ticker The ticker symbol to test on
   * @param scenarios Array of stress test scenarios
   * @param parameters Strategy parameters for the tests
   * @returns Promise with stress test results
   */
  public async runStressTests(
    strategyId: string,
    ticker: string,
    scenarios: {
      name: string;
      description: string;
      marketCondition: MarketCondition;
      volatilityMultiplier: number;
      durationDays: number;
    }[],
    parameters: Record<string, any>
  ): Promise<{
    strategyId: string;
    ticker: string;
    results: {
      scenario: string;
      description: string;
      performance: number;
      maxDrawdown: number;
      sharpeRatio: number;
      winRate: number;
      recoveryPeriod: number | null; // days, null if no recovery
    }[];
    worstScenario: string;
    bestScenario: string;
    averagePerformance: number;
    averageMaxDrawdown: number;
    riskScore: number; // 0-100 scale
  }> {
    try {
      // Call the API for stress tests
      const response = await axios.post(`${this.baseUrl}/strategies/${strategyId}/stress-tests`, {
        ticker,
        scenarios,
        parameters
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data;
    } catch (error) {
      console.error(`Error running stress tests for strategy ${strategyId}:`, error);
      throw new Error(`Failed to run stress tests for strategy ${strategyId}`);
    }
  }

  /**
   * Analyze drawdown risk
   * @param strategyId The ID of the strategy to analyze
   * @param ticker The ticker symbol to analyze on
   * @param parameters Strategy parameters for the analysis
   * @param startDate Start date for analysis
   * @param endDate End date for analysis
   * @returns Promise with drawdown analysis results
   */
  public async analyzeDrawdownRisk(
    strategyId: string,
    ticker: string,
    parameters: Record<string, any>,
    startDate: Date,
    endDate: Date
  ): Promise<{
    strategyId: string;
    ticker: string;
    maxDrawdown: number;
    averageDrawdown: number;
    drawdownFrequency: number; // average number of drawdowns per year
    recoveryStats: {
      averageRecoveryTime: number; // days
      maxRecoveryTime: number; // days
      recoveryTimeDistribution: {
        range: string; // e.g., "0-10 days"
        frequency: number;
      }[];
    };
    drawdowns: {
      startDate: Date;
      endDate: Date;
      depth: number;
      duration: number; // days
      recoveryDate: Date | null;
      recoveryDuration: number | null; // days
    }[];
    riskAssessment: {
      drawdownRisk: number; // 0-100 scale
      recoveryRisk: number; // 0-100 scale
      overallRisk: number; // 0-100 scale
    };
  }> {
    try {
      // Call the API for drawdown analysis
      const response = await axios.post(`${this.baseUrl}/strategies/${strategyId}/drawdown-analysis`, {
        ticker,
        parameters,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data;
    } catch (error) {
      console.error(`Error analyzing drawdown risk for strategy ${strategyId}:`, error);
      throw new Error(`Failed to analyze drawdown risk for strategy ${strategyId}`);
    }
  }

  /**
   * Analyze volatility risk
   * @param strategyId The ID of the strategy to analyze
   * @param ticker The ticker symbol to analyze on
   * @param parameters Strategy parameters for the analysis
   * @param startDate Start date for analysis
   * @param endDate End date for analysis
   * @returns Promise with volatility analysis results
   */
  public async analyzeVolatilityRisk(
    strategyId: string,
    ticker: string,
    parameters: Record<string, any>,
    startDate: Date,
    endDate: Date
  ): Promise<{
    strategyId: string;
    ticker: string;
    overallVolatility: number;
    annualizedVolatility: number;
    volatilityTrend: 'increasing' | 'decreasing' | 'stable';
    volatilityByMarketCondition: {
      condition: MarketCondition;
      volatility: number;
      relativeDifference: number; // compared to overall volatility
    }[];
    volatilityRegimes: {
      startDate: Date;
      endDate: Date;
      volatility: number;
      regime: 'low' | 'medium' | 'high' | 'extreme';
      performance: number;
    }[];
    riskAssessment: {
      volatilityRisk: number; // 0-100 scale
      regimeChangeRisk: number; // 0-100 scale
      overallRisk: number; // 0-100 scale
    };
  }> {
    try {
      // Call the API for volatility analysis
      const response = await axios.post(`${this.baseUrl}/strategies/${strategyId}/volatility-analysis`, {
        ticker,
        parameters,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data;
    } catch (error) {
      console.error(`Error analyzing volatility risk for strategy ${strategyId}:`, error);
      throw new Error(`Failed to analyze volatility risk for strategy ${strategyId}`);
    }
  }

  /**
   * Analyze correlation risk
   * @param strategyId The ID of the strategy to analyze
   * @param tickers Array of ticker symbols to analyze correlation with
   * @param parameters Strategy parameters for the analysis
   * @param startDate Start date for analysis
   * @param endDate End date for analysis
   * @returns Promise with correlation analysis results
   */
  public async analyzeCorrelationRisk(
    strategyId: string,
    tickers: string[],
    parameters: Record<string, any>,
    startDate: Date,
    endDate: Date
  ): Promise<{
    strategyId: string;
    correlations: {
      ticker: string;
      correlation: number; // -1 to 1
      significance: number; // 0-100 scale
      description: string;
    }[];
    marketCorrelation: number; // correlation with market index
    sectorCorrelations: {
      sector: string;
      correlation: number;
    }[];
    correlationStability: {
      ticker: string;
      stabilityScore: number; // 0-100 scale, higher means more stable
      regimes: {
        condition: MarketCondition;
        correlation: number;
      }[];
    }[];
    riskAssessment: {
      correlationRisk: number; // 0-100 scale
      diversificationBenefit: number; // 0-100 scale
      overallRisk: number; // 0-100 scale
    };
  }> {
    try {
      // Call the API for correlation analysis
      const response = await axios.post(`${this.baseUrl}/strategies/${strategyId}/correlation-analysis`, {
        tickers,
        parameters,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data;
    } catch (error) {
      console.error(`Error analyzing correlation risk for strategy ${strategyId}:`, error);
      throw new Error(`Failed to analyze correlation risk for strategy ${strategyId}`);
    }
  }

  /**
   * Analyze tail risk
   * @param strategyId The ID of the strategy to analyze
   * @param ticker The ticker symbol to analyze on
   * @param parameters Strategy parameters for the analysis
   * @param startDate Start date for analysis
   * @param endDate End date for analysis
   * @param confidenceLevel Confidence level for VaR and CVaR (0-1)
   * @returns Promise with tail risk analysis results
   */
  public async analyzeTailRisk(
    strategyId: string,
    ticker: string,
    parameters: Record<string, any>,
    startDate: Date,
    endDate: Date,
    confidenceLevel: number = 0.95
  ): Promise<{
    strategyId: string;
    ticker: string;
    valueAtRisk: number; // VaR at specified confidence level
    conditionalVaR: number; // CVaR/Expected Shortfall
    maxLoss: number;
    tailEvents: {
      date: Date;
      loss: number;
      cause: string;
      recoveryDuration: number | null; // days
    }[];
    tailRiskByMarketCondition: {
      condition: MarketCondition;
      valueAtRisk: number;
      conditionalVaR: number;
    }[];
    riskAssessment: {
      tailRisk: number; // 0-100 scale
      extremeEventRisk: number; // 0-100 scale
      overallRisk: number; // 0-100 scale
    };
  }> {
    try {
      // Call the API for tail risk analysis
      const response = await axios.post(`${this.baseUrl}/strategies/${strategyId}/tail-risk-analysis`, {
        ticker,
        parameters,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        confidenceLevel
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data;
    } catch (error) {
      console.error(`Error analyzing tail risk for strategy ${strategyId}:`, error);
      throw new Error(`Failed to analyze tail risk for strategy ${strategyId}`);
    }
  }

  /**
   * Get risk-adjusted strategy parameters
   * @param strategyId The ID of the strategy to adjust
   * @param ticker The ticker symbol to adjust for
   * @param parameters Current strategy parameters
   * @param riskTolerance Risk tolerance level (0-100)
   * @returns Promise with risk-adjusted parameters
   */
  public async getRiskAdjustedParameters(
    strategyId: string,
    ticker: string,
    parameters: Record<string, any>,
    riskTolerance: number
  ): Promise<{
    originalParameters: Record<string, any>;
    adjustedParameters: Record<string, any>;
    adjustments: {
      parameter: string;
      originalValue: any;
      adjustedValue: any;
      reason: string;
    }[];
    expectedRiskReduction: number;
    expectedReturnImpact: number;
    overallAssessment: string;
  }> {
    try {
      // Call the API for risk-adjusted parameters
      const response = await axios.post(`${this.baseUrl}/strategies/${strategyId}/risk-adjusted-parameters`, {
        ticker,
        parameters,
        riskTolerance
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data;
    } catch (error) {
      console.error(`Error getting risk-adjusted parameters for strategy ${strategyId}:`, error);
      throw new Error(`Failed to get risk-adjusted parameters for strategy ${strategyId}`);
    }
  }

  /**
   * Get risk decomposition
   * @param strategyId The ID of the strategy to analyze
   * @param ticker The ticker symbol to analyze on
   * @param parameters Strategy parameters for the analysis
   * @returns Promise with risk decomposition results
   */
  public async getRiskDecomposition(
    strategyId: string,
    ticker: string,
    parameters: Record<string, any>
  ): Promise<{
    strategyId: string;
    ticker: string;
    totalRisk: number;
    riskComponents: {
      component: string;
      contribution: number; // percentage of total risk
      description: string;
    }[];
    systematicRisk: number; // percentage of total risk
    idiosyncraticRisk: number; // percentage of total risk
    riskByTimeframe: {
      timeframe: Timeframe;
      risk: number;
    }[];
    riskByMarketCondition: {
      condition: MarketCondition;
      risk: number;
    }[];
  }> {
    try {
      // Call the API for risk decomposition
      const response = await axios.post(`${this.baseUrl}/strategies/${strategyId}/risk-decomposition`, {
        ticker,
        parameters
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data;
    } catch (error) {
      console.error(`Error getting risk decomposition for strategy ${strategyId}:`, error);
      throw new Error(`Failed to get risk decomposition for strategy ${strategyId}`);
    }
  }

  /**
   * Get risk-return profile
   * @param strategyId The ID of the strategy to analyze
   * @param ticker The ticker symbol to analyze on
   * @param parameters Strategy parameters for the analysis
   * @param timeframes Array of timeframes to analyze
   * @returns Promise with risk-return profile results
   */
  public async getRiskReturnProfile(
    strategyId: string,
    ticker: string,
    parameters: Record<string, any>,
    timeframes: Timeframe[]
  ): Promise<{
    strategyId: string;
    ticker: string;
    profiles: {
      timeframe: Timeframe;
      annualizedReturn: number;
      annualizedRisk: number;
      sharpeRatio: number;
      sortinoRatio: number;
      calmarRatio: number;
      maxDrawdown: number;
      winRate: number;
      profitFactor: number;
    }[];
    comparisonWithBenchmarks: {
      benchmark: string;
      excessReturn: number;
      relativeRisk: number; // strategy risk / benchmark risk
      informationRatio: number;
      trackingError: number;
      beta: number;
      alpha: number;
    }[];
    riskEfficiency: number; // 0-100 scale
    returnConsistency: number; // 0-100 scale
    overallRating: number; // 0-100 scale
  }> {
    try {
      // Call the API for risk-return profile
      const response = await axios.post(`${this.baseUrl}/strategies/${strategyId}/risk-return-profile`, {
        ticker,
        parameters,
        timeframes
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data;
    } catch (error) {
      console.error(`Error getting risk-return profile for strategy ${strategyId}:`, error);
      throw new Error(`Failed to get risk-return profile for strategy ${strategyId}`);
    }
  }
}

export default StrategyRiskAnalysisService;