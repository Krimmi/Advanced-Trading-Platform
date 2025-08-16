/**
 * StrategyOptimizationService - Service for optimizing trading strategy parameters
 * 
 * This service provides functionality for optimizing trading strategy parameters
 * using various optimization methods such as grid search, genetic algorithms,
 * and Bayesian optimization.
 */

import axios from 'axios';
import { 
  StrategyOptimizationResult,
  Timeframe,
  TradingStrategy,
  StrategyPerformanceMetrics
} from '../../models/strategy/StrategyTypes';

export class StrategyOptimizationService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly optimizationCache: Map<string, StrategyOptimizationResult>;

  constructor(apiKey: string, baseUrl: string = 'https://api.ninjatechfinance.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.optimizationCache = new Map<string, StrategyOptimizationResult>();
  }

  /**
   * Optimize strategy parameters
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
      // Generate cache key
      const cacheKey = `${strategyId}_${ticker}_${timeframe}_${optimizationTarget}_${JSON.stringify(parameterRanges)}_${startDate.toISOString()}_${endDate.toISOString()}`;
      
      // Check cache first
      if (this.optimizationCache.has(cacheKey)) {
        return this.optimizationCache.get(cacheKey)!;
      }
      
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

      const result = response.data;
      
      // Update cache
      this.optimizationCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error(`Error optimizing strategy ${strategyId}:`, error);
      throw new Error(`Failed to optimize strategy ${strategyId}`);
    }
  }

  /**
   * Run grid search optimization
   * @param strategyId The ID of the strategy to optimize
   * @param ticker The ticker symbol to optimize for
   * @param timeframe The timeframe to optimize for
   * @param optimizationTarget The target metric to optimize
   * @param parameterRanges Ranges for parameters to optimize
   * @param startDate Start date for optimization
   * @param endDate End date for optimization
   * @returns Promise with optimization results
   */
  public async runGridSearch(
    strategyId: string,
    ticker: string,
    timeframe: Timeframe,
    optimizationTarget: 'sharpe_ratio' | 'return' | 'drawdown' | 'win_rate' | 'profit_factor',
    parameterRanges: Record<string, { min: number; max: number; step: number }>,
    startDate: Date,
    endDate: Date
  ): Promise<StrategyOptimizationResult> {
    try {
      // Call the API for grid search optimization
      const response = await axios.post(`${this.baseUrl}/strategies/${strategyId}/optimize/grid-search`, {
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
      console.error(`Error running grid search for strategy ${strategyId}:`, error);
      throw new Error(`Failed to run grid search for strategy ${strategyId}`);
    }
  }

  /**
   * Run genetic algorithm optimization
   * @param strategyId The ID of the strategy to optimize
   * @param ticker The ticker symbol to optimize for
   * @param timeframe The timeframe to optimize for
   * @param optimizationTarget The target metric to optimize
   * @param parameterRanges Ranges for parameters to optimize
   * @param startDate Start date for optimization
   * @param endDate End date for optimization
   * @param populationSize Size of the genetic algorithm population
   * @param generations Number of generations to run
   * @param mutationRate Mutation rate for the genetic algorithm
   * @returns Promise with optimization results
   */
  public async runGeneticAlgorithm(
    strategyId: string,
    ticker: string,
    timeframe: Timeframe,
    optimizationTarget: 'sharpe_ratio' | 'return' | 'drawdown' | 'win_rate' | 'profit_factor',
    parameterRanges: Record<string, { min: number; max: number; step: number }>,
    startDate: Date,
    endDate: Date,
    populationSize: number = 50,
    generations: number = 20,
    mutationRate: number = 0.1
  ): Promise<StrategyOptimizationResult> {
    try {
      // Call the API for genetic algorithm optimization
      const response = await axios.post(`${this.baseUrl}/strategies/${strategyId}/optimize/genetic`, {
        ticker,
        timeframe,
        optimizationTarget,
        parameterRanges,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        populationSize,
        generations,
        mutationRate
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data;
    } catch (error) {
      console.error(`Error running genetic algorithm for strategy ${strategyId}:`, error);
      throw new Error(`Failed to run genetic algorithm for strategy ${strategyId}`);
    }
  }

  /**
   * Run Bayesian optimization
   * @param strategyId The ID of the strategy to optimize
   * @param ticker The ticker symbol to optimize for
   * @param timeframe The timeframe to optimize for
   * @param optimizationTarget The target metric to optimize
   * @param parameterRanges Ranges for parameters to optimize
   * @param startDate Start date for optimization
   * @param endDate End date for optimization
   * @param iterations Number of iterations for Bayesian optimization
   * @param explorationFactor Exploration factor for Bayesian optimization
   * @returns Promise with optimization results
   */
  public async runBayesianOptimization(
    strategyId: string,
    ticker: string,
    timeframe: Timeframe,
    optimizationTarget: 'sharpe_ratio' | 'return' | 'drawdown' | 'win_rate' | 'profit_factor',
    parameterRanges: Record<string, { min: number; max: number; step: number }>,
    startDate: Date,
    endDate: Date,
    iterations: number = 50,
    explorationFactor: number = 0.1
  ): Promise<StrategyOptimizationResult> {
    try {
      // Call the API for Bayesian optimization
      const response = await axios.post(`${this.baseUrl}/strategies/${strategyId}/optimize/bayesian`, {
        ticker,
        timeframe,
        optimizationTarget,
        parameterRanges,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        iterations,
        explorationFactor
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data;
    } catch (error) {
      console.error(`Error running Bayesian optimization for strategy ${strategyId}:`, error);
      throw new Error(`Failed to run Bayesian optimization for strategy ${strategyId}`);
    }
  }

  /**
   * Run walk-forward optimization
   * @param strategyId The ID of the strategy to optimize
   * @param ticker The ticker symbol to optimize for
   * @param timeframe The timeframe to optimize for
   * @param optimizationTarget The target metric to optimize
   * @param parameterRanges Ranges for parameters to optimize
   * @param startDate Start date for optimization
   * @param endDate End date for optimization
   * @param windowSize Size of each window in days
   * @param trainSize Percentage of window to use for training (0-1)
   * @returns Promise with walk-forward optimization results
   */
  public async runWalkForwardOptimization(
    strategyId: string,
    ticker: string,
    timeframe: Timeframe,
    optimizationTarget: 'sharpe_ratio' | 'return' | 'drawdown' | 'win_rate' | 'profit_factor',
    parameterRanges: Record<string, { min: number; max: number; step: number }>,
    startDate: Date,
    endDate: Date,
    windowSize: number = 180,
    trainSize: number = 0.7
  ): Promise<{
    strategyId: string;
    ticker: string;
    timeframe: Timeframe;
    optimizationTarget: string;
    windows: {
      trainStart: Date;
      trainEnd: Date;
      testStart: Date;
      testEnd: Date;
      optimalParameters: Record<string, any>;
      trainPerformance: StrategyPerformanceMetrics;
      testPerformance: StrategyPerformanceMetrics;
    }[];
    overallPerformance: StrategyPerformanceMetrics;
    robustness: number; // 0-100 scale
    optimalParameters: Record<string, any>;
  }> {
    try {
      // Call the API for walk-forward optimization
      const response = await axios.post(`${this.baseUrl}/strategies/${strategyId}/optimize/walk-forward`, {
        ticker,
        timeframe,
        optimizationTarget,
        parameterRanges,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        windowSize,
        trainSize
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data;
    } catch (error) {
      console.error(`Error running walk-forward optimization for strategy ${strategyId}:`, error);
      throw new Error(`Failed to run walk-forward optimization for strategy ${strategyId}`);
    }
  }

  /**
   * Get optimization progress
   * @param optimizationId The ID of the optimization job
   * @returns Promise with optimization progress (0-100)
   */
  public async getOptimizationProgress(optimizationId: string): Promise<number> {
    try {
      // Call the API for optimization progress
      const response = await axios.get(`${this.baseUrl}/optimizations/${optimizationId}/progress`, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data.progress;
    } catch (error) {
      console.error(`Error getting optimization progress for ${optimizationId}:`, error);
      throw new Error(`Failed to get optimization progress for ${optimizationId}`);
    }
  }

  /**
   * Cancel optimization job
   * @param optimizationId The ID of the optimization job
   * @returns Promise with cancellation result
   */
  public async cancelOptimization(optimizationId: string): Promise<boolean> {
    try {
      // Call the API to cancel optimization
      const response = await axios.post(`${this.baseUrl}/optimizations/${optimizationId}/cancel`, {}, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data.success;
    } catch (error) {
      console.error(`Error canceling optimization ${optimizationId}:`, error);
      throw new Error(`Failed to cancel optimization ${optimizationId}`);
    }
  }

  /**
   * Analyze parameter sensitivity
   * @param strategyId The ID of the strategy to analyze
   * @param ticker The ticker symbol to analyze for
   * @param parameters Base parameters for the strategy
   * @param parameterToAnalyze Parameter to analyze sensitivity for
   * @param range Range for the parameter to analyze
   * @param steps Number of steps to analyze
   * @param startDate Start date for analysis
   * @param endDate End date for analysis
   * @returns Promise with sensitivity analysis results
   */
  public async analyzeParameterSensitivity(
    strategyId: string,
    ticker: string,
    parameters: Record<string, any>,
    parameterToAnalyze: string,
    range: { min: number; max: number },
    steps: number = 10,
    startDate: Date,
    endDate: Date
  ): Promise<{
    parameter: string;
    values: number[];
    metrics: {
      value: number;
      sharpeRatio: number;
      sortino: number;
      maxDrawdown: number;
      annualizedReturn: number;
      winRate: number;
      profitFactor: number;
    }[];
    optimalValue: number;
    sensitivity: number; // 0-100 scale
  }> {
    try {
      // Call the API for parameter sensitivity analysis
      const response = await axios.post(`${this.baseUrl}/strategies/${strategyId}/sensitivity`, {
        ticker,
        parameters,
        parameterToAnalyze,
        range,
        steps,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data;
    } catch (error) {
      console.error(`Error analyzing parameter sensitivity for strategy ${strategyId}:`, error);
      throw new Error(`Failed to analyze parameter sensitivity for strategy ${strategyId}`);
    }
  }

  /**
   * Get optimization recommendations
   * @param strategyId The ID of the strategy to get recommendations for
   * @param ticker The ticker symbol to get recommendations for
   * @returns Promise with optimization recommendations
   */
  public async getOptimizationRecommendations(
    strategyId: string,
    ticker: string
  ): Promise<{
    strategyId: string;
    ticker: string;
    recommendations: {
      parameter: string;
      currentValue: any;
      recommendedValue: any;
      expectedImprovement: number;
      confidence: number; // 0-100 scale
      explanation: string;
    }[];
    overallImprovementEstimate: number;
  }> {
    try {
      // Call the API for optimization recommendations
      const response = await axios.get(`${this.baseUrl}/strategies/${strategyId}/optimization-recommendations`, {
        headers: { 'X-API-KEY': this.apiKey },
        params: { ticker }
      });

      return response.data;
    } catch (error) {
      console.error(`Error getting optimization recommendations for strategy ${strategyId}:`, error);
      throw new Error(`Failed to get optimization recommendations for strategy ${strategyId}`);
    }
  }
}

export default StrategyOptimizationService;