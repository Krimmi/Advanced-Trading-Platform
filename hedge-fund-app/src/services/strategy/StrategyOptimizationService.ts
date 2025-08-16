import { MarketDataService } from '../market/MarketDataService';
import { StrategyBacktestService, BacktestConfig, BacktestMetrics } from './StrategyBacktestService';
import { StrategyType } from './StrategyRecommendationService';

/**
 * Optimization algorithm types
 */
export enum OptimizationAlgorithm {
  GRID_SEARCH = 'grid_search',
  RANDOM_SEARCH = 'random_search',
  BAYESIAN_OPTIMIZATION = 'bayesian_optimization',
  GENETIC_ALGORITHM = 'genetic_algorithm',
  PARTICLE_SWARM = 'particle_swarm',
}

/**
 * Parameter definition for optimization
 */
export interface ParameterDefinition {
  name: string;
  type: 'integer' | 'float' | 'categorical';
  min?: number;
  max?: number;
  step?: number;
  values?: any[];
  default: any;
  description: string;
}

/**
 * Optimization configuration
 */
export interface OptimizationConfig {
  strategyType: StrategyType;
  baseConfig: Omit<BacktestConfig, 'strategyParameters'>;
  parameters: ParameterDefinition[];
  algorithm: OptimizationAlgorithm;
  optimizationMetric: keyof BacktestMetrics;
  maximizeMetric: boolean;
  populationSize?: number; // For genetic algorithm
  generations?: number; // For genetic algorithm
  iterations?: number; // For random search, Bayesian optimization
  crossValidation?: {
    enabled: boolean;
    folds: number;
  };
  constraints?: Array<{
    expression: string;
    description: string;
  }>;
}

/**
 * Optimization result
 */
export interface OptimizationResult {
  bestParameters: Record<string, any>;
  bestMetricValue: number;
  allResults: Array<{
    parameters: Record<string, any>;
    metrics: BacktestMetrics;
    rank: number;
  }>;
  convergenceHistory?: Array<{
    iteration: number;
    bestMetricValue: number;
  }>;
  parameterImportance?: Record<string, number>;
  crossValidationResults?: Array<{
    fold: number;
    parameters: Record<string, any>;
    metrics: BacktestMetrics;
  }>;
  executionTime: number;
  optimizationConfig: OptimizationConfig;
}

/**
 * Parameter sensitivity analysis result
 */
export interface ParameterSensitivityResult {
  parameter: string;
  values: any[];
  metricValues: number[];
  sensitivity: number; // 0-1 scale, higher means more sensitive
  optimalValue: any;
  description: string;
}

/**
 * Service for optimizing trading strategy parameters
 */
export class StrategyOptimizationService {
  private backtestService: StrategyBacktestService;
  private marketDataService: MarketDataService;
  private optimizationCache: Map<string, OptimizationResult>;
  private readonly CACHE_TTL_MS = 86400000; // 24 hour cache TTL

  constructor(
    backtestService: StrategyBacktestService,
    marketDataService: MarketDataService
  ) {
    this.backtestService = backtestService;
    this.marketDataService = marketDataService;
    this.optimizationCache = new Map();
  }

  /**
   * Optimize strategy parameters using the specified algorithm
   * @param config Optimization configuration
   * @returns Optimization result
   */
  public async optimizeParameters(config: OptimizationConfig): Promise<OptimizationResult> {
    const cacheKey = this.generateCacheKey(config);
    const cachedResult = this.optimizationCache.get(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }

    // Run the appropriate optimization algorithm
    let result: OptimizationResult;
    
    const startTime = Date.now();
    
    switch (config.algorithm) {
      case OptimizationAlgorithm.GRID_SEARCH:
        result = await this.runGridSearch(config);
        break;
      case OptimizationAlgorithm.RANDOM_SEARCH:
        result = await this.runRandomSearch(config);
        break;
      case OptimizationAlgorithm.BAYESIAN_OPTIMIZATION:
        result = await this.runBayesianOptimization(config);
        break;
      case OptimizationAlgorithm.GENETIC_ALGORITHM:
        result = await this.runGeneticAlgorithm(config);
        break;
      case OptimizationAlgorithm.PARTICLE_SWARM:
        result = await this.runParticleSwarmOptimization(config);
        break;
      default:
        throw new Error(`Unsupported optimization algorithm: ${config.algorithm}`);
    }
    
    // Add execution time
    result.executionTime = Date.now() - startTime;
    
    // Add parameter importance if not already calculated
    if (!result.parameterImportance) {
      result.parameterImportance = await this.calculateParameterImportance(config, result.allResults);
    }
    
    // Run cross-validation if enabled
    if (config.crossValidation?.enabled) {
      result.crossValidationResults = await this.runCrossValidation(
        config,
        result.bestParameters
      );
    }
    
    // Cache the result
    this.optimizationCache.set(cacheKey, result);
    
    return result;
  }

  /**
   * Analyze parameter sensitivity for a strategy
   * @param config Optimization configuration
   * @param baseParameters Base parameters to use (vary one at a time)
   * @returns Parameter sensitivity analysis results
   */
  public async analyzeParameterSensitivity(
    config: OptimizationConfig,
    baseParameters: Record<string, any>
  ): Promise<ParameterSensitivityResult[]> {
    const results: ParameterSensitivityResult[] = [];
    
    // For each parameter, vary it while keeping others constant
    for (const paramDef of config.parameters) {
      const values: any[] = [];
      const metricValues: number[] = [];
      
      // Generate test values for this parameter
      if (paramDef.type === 'categorical' && paramDef.values) {
        values.push(...paramDef.values);
      } else if ((paramDef.type === 'integer' || paramDef.type === 'float') && 
                paramDef.min !== undefined && paramDef.max !== undefined) {
        const steps = 10; // Number of test points
        const range = paramDef.max - paramDef.min;
        const stepSize = range / steps;
        
        for (let i = 0; i <= steps; i++) {
          let value = paramDef.min + (i * stepSize);
          
          if (paramDef.type === 'integer') {
            value = Math.round(value);
          }
          
          values.push(value);
        }
      }
      
      // Test each value
      for (const value of values) {
        // Create test parameters with this value
        const testParameters = { ...baseParameters };
        testParameters[paramDef.name] = value;
        
        // Run backtest with these parameters
        const backtestConfig: BacktestConfig = {
          ...config.baseConfig,
          strategyParameters: testParameters,
          strategyType: config.strategyType
        };
        
        const backtestResult = await this.backtestService.runBacktest(backtestConfig);
        
        // Get the metric value
        const metricValue = backtestResult.metrics[config.optimizationMetric];
        metricValues.push(metricValue);
      }
      
      // Calculate sensitivity (normalized standard deviation of metric values)
      const mean = metricValues.reduce((sum, val) => sum + val, 0) / metricValues.length;
      const variance = metricValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / metricValues.length;
      const stdDev = Math.sqrt(variance);
      const sensitivity = stdDev / (Math.abs(mean) > 0.0001 ? Math.abs(mean) : 1);
      
      // Find optimal value
      let optimalIndex = 0;
      let optimalMetric = config.maximizeMetric ? -Infinity : Infinity;
      
      for (let i = 0; i < metricValues.length; i++) {
        if ((config.maximizeMetric && metricValues[i] > optimalMetric) ||
            (!config.maximizeMetric && metricValues[i] < optimalMetric)) {
          optimalMetric = metricValues[i];
          optimalIndex = i;
        }
      }
      
      // Add result
      results.push({
        parameter: paramDef.name,
        values,
        metricValues,
        sensitivity: Math.min(1, sensitivity * 5), // Scale to 0-1 range
        optimalValue: values[optimalIndex],
        description: `${paramDef.name} has a ${
          sensitivity < 0.2 ? 'low' : sensitivity < 0.5 ? 'moderate' : 'high'
        } impact on ${config.optimizationMetric}. Optimal value is ${values[optimalIndex]}.`
      });
    }
    
    // Sort by sensitivity (most sensitive first)
    results.sort((a, b) => b.sensitivity - a.sensitivity);
    
    return results;
  }

  /**
   * Generate a cache key based on optimization configuration
   */
  private generateCacheKey(config: OptimizationConfig): string {
    return JSON.stringify({
      strategyType: config.strategyType,
      baseConfig: {
        startDate: config.baseConfig.startDate.toISOString(),
        endDate: config.baseConfig.endDate.toISOString(),
        initialCapital: config.baseConfig.initialCapital,
        symbols: config.baseConfig.symbols.sort()
      },
      parameters: config.parameters.map(p => p.name),
      algorithm: config.algorithm,
      optimizationMetric: config.optimizationMetric,
      maximizeMetric: config.maximizeMetric
    });
  }

  /**
   * Run grid search optimization
   */
  private async runGridSearch(config: OptimizationConfig): Promise<OptimizationResult> {
    // Generate parameter combinations
    const parameterCombinations = this.generateParameterGrid(config.parameters);
    
    // Evaluate each combination
    const results = await this.evaluateParameterCombinations(config, parameterCombinations);
    
    // Sort results by metric value
    results.sort((a, b) => {
      if (config.maximizeMetric) {
        return b.metrics[config.optimizationMetric] - a.metrics[config.optimizationMetric];
      } else {
        return a.metrics[config.optimizationMetric] - b.metrics[config.optimizationMetric];
      }
    });
    
    // Add ranks
    results.forEach((result, index) => {
      result.rank = index + 1;
    });
    
    // Return optimization result
    return {
      bestParameters: results[0].parameters,
      bestMetricValue: results[0].metrics[config.optimizationMetric],
      allResults: results,
      executionTime: 0, // Will be set by caller
      optimizationConfig: config
    };
  }

  /**
   * Run random search optimization
   */
  private async runRandomSearch(config: OptimizationConfig): Promise<OptimizationResult> {
    const iterations = config.iterations || 100;
    const parameterCombinations: Record<string, any>[] = [];
    
    // Generate random parameter combinations
    for (let i = 0; i < iterations; i++) {
      parameterCombinations.push(this.generateRandomParameters(config.parameters));
    }
    
    // Evaluate each combination
    const results = await this.evaluateParameterCombinations(config, parameterCombinations);
    
    // Sort results by metric value
    results.sort((a, b) => {
      if (config.maximizeMetric) {
        return b.metrics[config.optimizationMetric] - a.metrics[config.optimizationMetric];
      } else {
        return a.metrics[config.optimizationMetric] - b.metrics[config.optimizationMetric];
      }
    });
    
    // Add ranks
    results.forEach((result, index) => {
      result.rank = index + 1;
    });
    
    // Track convergence history
    const convergenceHistory = [];
    let bestMetricValue = config.maximizeMetric ? -Infinity : Infinity;
    
    for (let i = 0; i < results.length; i++) {
      const metricValue = results[i].metrics[config.optimizationMetric];
      
      if ((config.maximizeMetric && metricValue > bestMetricValue) ||
          (!config.maximizeMetric && metricValue < bestMetricValue)) {
        bestMetricValue = metricValue;
      }
      
      if ((i + 1) % 10 === 0 || i === results.length - 1) {
        convergenceHistory.push({
          iteration: i + 1,
          bestMetricValue
        });
      }
    }
    
    // Return optimization result
    return {
      bestParameters: results[0].parameters,
      bestMetricValue: results[0].metrics[config.optimizationMetric],
      allResults: results,
      convergenceHistory,
      executionTime: 0, // Will be set by caller
      optimizationConfig: config
    };
  }

  /**
   * Run Bayesian optimization
   * Note: This is a simplified implementation. A real implementation would use
   * a Gaussian Process model and acquisition functions.
   */
  private async runBayesianOptimization(config: OptimizationConfig): Promise<OptimizationResult> {
    // For this simplified implementation, we'll use a combination of
    // random search and local refinement
    
    const iterations = config.iterations || 50;
    const initialPoints = Math.min(10, Math.floor(iterations / 3));
    const parameterCombinations: Record<string, any>[] = [];
    const results: Array<{
      parameters: Record<string, any>;
      metrics: BacktestMetrics;
      rank: number;
    }> = [];
    
    // Generate initial random points
    for (let i = 0; i < initialPoints; i++) {
      parameterCombinations.push(this.generateRandomParameters(config.parameters));
    }
    
    // Evaluate initial points
    const initialResults = await this.evaluateParameterCombinations(config, parameterCombinations);
    results.push(...initialResults);
    
    // Sort results by metric value
    results.sort((a, b) => {
      if (config.maximizeMetric) {
        return b.metrics[config.optimizationMetric] - a.metrics[config.optimizationMetric];
      } else {
        return a.metrics[config.optimizationMetric] - b.metrics[config.optimizationMetric];
      }
    });
    
    // Track convergence history
    const convergenceHistory = [{
      iteration: initialPoints,
      bestMetricValue: results[0].metrics[config.optimizationMetric]
    }];
    
    // Iteratively refine
    for (let i = initialPoints; i < iterations; i++) {
      // In a real implementation, we would use a Gaussian Process model
      // to predict promising regions. Here we'll use a simple approach:
      // 1. With 70% probability, explore around the best point
      // 2. With 30% probability, try a new random point
      
      let newParams: Record<string, any>;
      
      if (Math.random() < 0.7) {
        // Explore around best point
        const bestParams = results[0].parameters;
        newParams = this.perturbParameters(bestParams, config.parameters, 0.2);
      } else {
        // Try a new random point
        newParams = this.generateRandomParameters(config.parameters);
      }
      
      // Evaluate new point
      const backtestConfig: BacktestConfig = {
        ...config.baseConfig,
        strategyParameters: newParams,
        strategyType: config.strategyType
      };
      
      const backtestResult = await this.backtestService.runBacktest(backtestConfig);
      
      // Add to results
      results.push({
        parameters: newParams,
        metrics: backtestResult.metrics,
        rank: 0 // Will be updated later
      });
      
      // Re-sort results
      results.sort((a, b) => {
        if (config.maximizeMetric) {
          return b.metrics[config.optimizationMetric] - a.metrics[config.optimizationMetric];
        } else {
          return a.metrics[config.optimizationMetric] - b.metrics[config.optimizationMetric];
        }
      });
      
      // Update convergence history
      convergenceHistory.push({
        iteration: i + 1,
        bestMetricValue: results[0].metrics[config.optimizationMetric]
      });
    }
    
    // Update ranks
    results.forEach((result, index) => {
      result.rank = index + 1;
    });
    
    // Return optimization result
    return {
      bestParameters: results[0].parameters,
      bestMetricValue: results[0].metrics[config.optimizationMetric],
      allResults: results,
      convergenceHistory,
      executionTime: 0, // Will be set by caller
      optimizationConfig: config
    };
  }

  /**
   * Run genetic algorithm optimization
   */
  private async runGeneticAlgorithm(config: OptimizationConfig): Promise<OptimizationResult> {
    const populationSize = config.populationSize || 20;
    const generations = config.generations || 10;
    const mutationRate = 0.1;
    const eliteCount = Math.max(1, Math.floor(populationSize * 0.2));
    
    // Generate initial population
    let population: Record<string, any>[] = [];
    for (let i = 0; i < populationSize; i++) {
      population.push(this.generateRandomParameters(config.parameters));
    }
    
    // Track all evaluated individuals
    const allResults: Array<{
      parameters: Record<string, any>;
      metrics: BacktestMetrics;
      rank: number;
    }> = [];
    
    // Track convergence history
    const convergenceHistory: Array<{
      iteration: number;
      bestMetricValue: number;
    }> = [];
    
    // Run generations
    for (let gen = 0; gen < generations; gen++) {
      // Evaluate current population
      const evaluationResults = await this.evaluateParameterCombinations(config, population);
      
      // Add to all results
      allResults.push(...evaluationResults);
      
      // Sort by fitness
      evaluationResults.sort((a, b) => {
        if (config.maximizeMetric) {
          return b.metrics[config.optimizationMetric] - a.metrics[config.optimizationMetric];
        } else {
          return a.metrics[config.optimizationMetric] - b.metrics[config.optimizationMetric];
        }
      });
      
      // Update convergence history
      convergenceHistory.push({
        iteration: gen + 1,
        bestMetricValue: evaluationResults[0].metrics[config.optimizationMetric]
      });
      
      // Create next generation
      const nextGeneration: Record<string, any>[] = [];
      
      // Keep elite individuals
      for (let i = 0; i < eliteCount; i++) {
        nextGeneration.push(evaluationResults[i].parameters);
      }
      
      // Create offspring through crossover and mutation
      while (nextGeneration.length < populationSize) {
        // Select parents using tournament selection
        const parent1 = this.tournamentSelect(evaluationResults, config);
        const parent2 = this.tournamentSelect(evaluationResults, config);
        
        // Crossover
        const child = this.crossover(parent1, parent2);
        
        // Mutation
        this.mutate(child, config.parameters, mutationRate);
        
        // Add to next generation
        nextGeneration.push(child);
      }
      
      // Update population
      population = nextGeneration;
    }
    
    // Final evaluation of last generation
    const finalEvaluation = await this.evaluateParameterCombinations(config, population);
    allResults.push(...finalEvaluation);
    
    // Sort all results
    allResults.sort((a, b) => {
      if (config.maximizeMetric) {
        return b.metrics[config.optimizationMetric] - a.metrics[config.optimizationMetric];
      } else {
        return a.metrics[config.optimizationMetric] - b.metrics[config.optimizationMetric];
      }
    });
    
    // Update ranks
    allResults.forEach((result, index) => {
      result.rank = index + 1;
    });
    
    // Return optimization result
    return {
      bestParameters: allResults[0].parameters,
      bestMetricValue: allResults[0].metrics[config.optimizationMetric],
      allResults,
      convergenceHistory,
      executionTime: 0, // Will be set by caller
      optimizationConfig: config
    };
  }

  /**
   * Run particle swarm optimization
   */
  private async runParticleSwarmOptimization(config: OptimizationConfig): Promise<OptimizationResult> {
    // This is a simplified implementation of PSO
    const numParticles = 20;
    const iterations = config.iterations || 10;
    const inertiaWeight = 0.7;
    const cognitiveWeight = 1.5;
    const socialWeight = 1.5;
    
    // Initialize particles
    const particles: Array<{
      position: Record<string, any>;
      velocity: Record<string, number>;
      bestPosition: Record<string, any>;
      bestFitness: number;
    }> = [];
    
    for (let i = 0; i < numParticles; i++) {
      const position = this.generateRandomParameters(config.parameters);
      
      particles.push({
        position,
        velocity: this.initializeVelocity(config.parameters),
        bestPosition: { ...position },
        bestFitness: config.maximizeMetric ? -Infinity : Infinity
      });
    }
    
    // Track all evaluated positions
    const allResults: Array<{
      parameters: Record<string, any>;
      metrics: BacktestMetrics;
      rank: number;
    }> = [];
    
    // Track global best
    let globalBestPosition: Record<string, any> = {};
    let globalBestFitness = config.maximizeMetric ? -Infinity : Infinity;
    
    // Track convergence history
    const convergenceHistory: Array<{
      iteration: number;
      bestMetricValue: number;
    }> = [];
    
    // Run iterations
    for (let iter = 0; iter < iterations; iter++) {
      // Evaluate all particles
      const positions = particles.map(p => p.position);
      const evaluationResults = await this.evaluateParameterCombinations(config, positions);
      
      // Add to all results
      allResults.push(...evaluationResults);
      
      // Update particle best and global best
      for (let i = 0; i < numParticles; i++) {
        const fitness = evaluationResults[i].metrics[config.optimizationMetric];
        
        // Update particle best
        if ((config.maximizeMetric && fitness > particles[i].bestFitness) ||
            (!config.maximizeMetric && fitness < particles[i].bestFitness)) {
          particles[i].bestFitness = fitness;
          particles[i].bestPosition = { ...particles[i].position };
        }
        
        // Update global best
        if ((config.maximizeMetric && fitness > globalBestFitness) ||
            (!config.maximizeMetric && fitness < globalBestFitness)) {
          globalBestFitness = fitness;
          globalBestPosition = { ...particles[i].position };
        }
      }
      
      // Update convergence history
      convergenceHistory.push({
        iteration: iter + 1,
        bestMetricValue: globalBestFitness
      });
      
      // Update velocities and positions
      for (const particle of particles) {
        for (const param of config.parameters) {
          const name = param.name;
          
          // Skip categorical parameters
          if (param.type === 'categorical') continue;
          
          // Calculate new velocity
          const cognitive = cognitiveWeight * Math.random() * 
            (particle.bestPosition[name] - particle.position[name]);
          
          const social = socialWeight * Math.random() * 
            (globalBestPosition[name] - particle.position[name]);
          
          particle.velocity[name] = inertiaWeight * particle.velocity[name] + cognitive + social;
          
          // Update position
          let newValue = particle.position[name] + particle.velocity[name];
          
          // Bound within parameter limits
          if (param.min !== undefined && newValue < param.min) {
            newValue = param.min;
            particle.velocity[name] *= -0.5; // Bounce off boundary
          }
          
          if (param.max !== undefined && newValue > param.max) {
            newValue = param.max;
            particle.velocity[name] *= -0.5; // Bounce off boundary
          }
          
          // Round for integer parameters
          if (param.type === 'integer') {
            newValue = Math.round(newValue);
          }
          
          particle.position[name] = newValue;
        }
        
        // Handle categorical parameters randomly
        for (const param of config.parameters) {
          if (param.type === 'categorical' && param.values) {
            // Small chance to change categorical parameters
            if (Math.random() < 0.2) {
              const randomIndex = Math.floor(Math.random() * param.values.length);
              particle.position[param.name] = param.values[randomIndex];
            }
          }
        }
      }
    }
    
    // Sort all results
    allResults.sort((a, b) => {
      if (config.maximizeMetric) {
        return b.metrics[config.optimizationMetric] - a.metrics[config.optimizationMetric];
      } else {
        return a.metrics[config.optimizationMetric] - b.metrics[config.optimizationMetric];
      }
    });
    
    // Update ranks
    allResults.forEach((result, index) => {
      result.rank = index + 1;
    });
    
    // Return optimization result
    return {
      bestParameters: allResults[0].parameters,
      bestMetricValue: allResults[0].metrics[config.optimizationMetric],
      allResults,
      convergenceHistory,
      executionTime: 0, // Will be set by caller
      optimizationConfig: config
    };
  }

  /**
   * Generate a grid of parameter combinations
   */
  private generateParameterGrid(parameters: ParameterDefinition[]): Record<string, any>[] {
    // For each parameter, generate a list of values to test
    const paramValues: Record<string, any[]> = {};
    
    for (const param of parameters) {
      if (param.type === 'categorical' && param.values) {
        paramValues[param.name] = [...param.values];
      } else if ((param.type === 'integer' || param.type === 'float') && 
                param.min !== undefined && param.max !== undefined) {
        const values: any[] = [];
        const steps = param.type === 'integer' ? 
          Math.min(10, Math.floor(param.max - param.min) + 1) : 5;
        
        for (let i = 0; i < steps; i++) {
          let value = param.min + ((param.max - param.min) * i / (steps - 1));
          
          if (param.type === 'integer') {
            value = Math.round(value);
          }
          
          values.push(value);
        }
        
        paramValues[param.name] = values;
      } else {
        paramValues[param.name] = [param.default];
      }
    }
    
    // Generate all combinations
    return this.generateCombinations(paramValues);
  }

  /**
   * Generate all combinations of parameter values
   */
  private generateCombinations(paramValues: Record<string, any[]>): Record<string, any>[] {
    const paramNames = Object.keys(paramValues);
    const combinations: Record<string, any>[] = [{}];
    
    for (const paramName of paramNames) {
      const values = paramValues[paramName];
      const newCombinations: Record<string, any>[] = [];
      
      for (const combination of combinations) {
        for (const value of values) {
          newCombinations.push({
            ...combination,
            [paramName]: value
          });
        }
      }
      
      combinations.length = 0;
      combinations.push(...newCombinations);
    }
    
    return combinations;
  }

  /**
   * Generate random parameter values
   */
  private generateRandomParameters(parameters: ParameterDefinition[]): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const param of parameters) {
      if (param.type === 'categorical' && param.values) {
        const randomIndex = Math.floor(Math.random() * param.values.length);
        result[param.name] = param.values[randomIndex];
      } else if ((param.type === 'integer' || param.type === 'float') && 
                param.min !== undefined && param.max !== undefined) {
        let value = param.min + Math.random() * (param.max - param.min);
        
        if (param.type === 'integer') {
          value = Math.round(value);
        }
        
        result[param.name] = value;
      } else {
        result[param.name] = param.default;
      }
    }
    
    return result;
  }

  /**
   * Perturb parameters for local search
   */
  private perturbParameters(
    baseParams: Record<string, any>,
    parameters: ParameterDefinition[],
    scale: number
  ): Record<string, any> {
    const result: Record<string, any> = { ...baseParams };
    
    for (const param of parameters) {
      if (param.type === 'categorical' && param.values) {
        // Small chance to change categorical parameters
        if (Math.random() < 0.3) {
          const currentIndex = param.values.indexOf(baseParams[param.name]);
          let newIndex = currentIndex;
          
          // Try to select a different value
          if (param.values.length > 1) {
            while (newIndex === currentIndex) {
              newIndex = Math.floor(Math.random() * param.values.length);
            }
          }
          
          result[param.name] = param.values[newIndex];
        }
      } else if ((param.type === 'integer' || param.type === 'float') && 
                param.min !== undefined && param.max !== undefined) {
        const range = param.max - param.min;
        const perturbation = (Math.random() * 2 - 1) * range * scale;
        let newValue = baseParams[param.name] + perturbation;
        
        // Ensure within bounds
        newValue = Math.max(param.min, Math.min(param.max, newValue));
        
        if (param.type === 'integer') {
          newValue = Math.round(newValue);
        }
        
        result[param.name] = newValue;
      }
    }
    
    return result;
  }

  /**
   * Initialize velocity for particle swarm optimization
   */
  private initializeVelocity(parameters: ParameterDefinition[]): Record<string, number> {
    const velocity: Record<string, number> = {};
    
    for (const param of parameters) {
      if (param.type !== 'categorical' && param.min !== undefined && param.max !== undefined) {
        const range = param.max - param.min;
        velocity[param.name] = (Math.random() * 2 - 1) * range * 0.1;
      }
    }
    
    return velocity;
  }

  /**
   * Tournament selection for genetic algorithm
   */
  private tournamentSelect(
    population: Array<{
      parameters: Record<string, any>;
      metrics: BacktestMetrics;
      rank: number;
    }>,
    config: OptimizationConfig
  ): Record<string, any> {
    const tournamentSize = 3;
    let best: {
      parameters: Record<string, any>;
      metrics: BacktestMetrics;
      rank: number;
    } | null = null;
    
    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * population.length);
      const individual = population[randomIndex];
      
      if (!best || (config.maximizeMetric ? 
          individual.metrics[config.optimizationMetric] > best.metrics[config.optimizationMetric] :
          individual.metrics[config.optimizationMetric] < best.metrics[config.optimizationMetric])) {
        best = individual;
      }
    }
    
    return { ...best!.parameters };
  }

  /**
   * Crossover for genetic algorithm
   */
  private crossover(
    parent1: Record<string, any>,
    parent2: Record<string, any>
  ): Record<string, any> {
    const child: Record<string, any> = {};
    
    for (const key of Object.keys(parent1)) {
      // 50% chance to inherit from each parent
      child[key] = Math.random() < 0.5 ? parent1[key] : parent2[key];
    }
    
    return child;
  }

  /**
   * Mutation for genetic algorithm
   */
  private mutate(
    individual: Record<string, any>,
    parameters: ParameterDefinition[],
    mutationRate: number
  ): void {
    for (const param of parameters) {
      if (Math.random() < mutationRate) {
        if (param.type === 'categorical' && param.values) {
          const randomIndex = Math.floor(Math.random() * param.values.length);
          individual[param.name] = param.values[randomIndex];
        } else if ((param.type === 'integer' || param.type === 'float') && 
                  param.min !== undefined && param.max !== undefined) {
          let value = param.min + Math.random() * (param.max - param.min);
          
          if (param.type === 'integer') {
            value = Math.round(value);
          }
          
          individual[param.name] = value;
        }
      }
    }
  }

  /**
   * Evaluate multiple parameter combinations
   */
  private async evaluateParameterCombinations(
    config: OptimizationConfig,
    parameterCombinations: Record<string, any>[]
  ): Promise<Array<{
    parameters: Record<string, any>;
    metrics: BacktestMetrics;
    rank: number;
  }>> {
    const results: Array<{
      parameters: Record<string, any>;
      metrics: BacktestMetrics;
      rank: number;
    }> = [];
    
    // Evaluate each combination
    for (const params of parameterCombinations) {
      // Check if parameters satisfy constraints
      if (config.constraints && !this.checkConstraints(params, config.constraints)) {
        continue;
      }
      
      // Create backtest config
      const backtestConfig: BacktestConfig = {
        ...config.baseConfig,
        strategyParameters: params,
        strategyType: config.strategyType
      };
      
      // Run backtest
      const backtestResult = await this.backtestService.runBacktest(backtestConfig);
      
      // Add to results
      results.push({
        parameters: params,
        metrics: backtestResult.metrics,
        rank: 0 // Will be set later
      });
    }
    
    return results;
  }

  /**
   * Check if parameters satisfy constraints
   */
  private checkConstraints(
    parameters: Record<string, any>,
    constraints: Array<{
      expression: string;
      description: string;
    }>
  ): boolean {
    for (const constraint of constraints) {
      try {
        // Create a function that evaluates the constraint expression
        // This is a simplified approach and has security implications in a real system
        const constraintFunction = new Function(
          ...Object.keys(parameters),
          `return ${constraint.expression};`
        );
        
        const result = constraintFunction(...Object.values(parameters));
        
        if (!result) {
          return false;
        }
      } catch (error) {
        console.error(`Error evaluating constraint: ${constraint.expression}`, error);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Run cross-validation
   */
  private async runCrossValidation(
    config: OptimizationConfig,
    bestParameters: Record<string, any>
  ): Promise<Array<{
    fold: number;
    parameters: Record<string, any>;
    metrics: BacktestMetrics;
  }>> {
    const results: Array<{
      fold: number;
      parameters: Record<string, any>;
      metrics: BacktestMetrics;
    }> = [];
    
    if (!config.crossValidation?.enabled || !config.crossValidation.folds) {
      return results;
    }
    
    const folds = config.crossValidation.folds;
    const startDate = config.baseConfig.startDate;
    const endDate = config.baseConfig.endDate;
    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const foldSize = Math.floor(totalDays / folds);
    
    for (let fold = 0; fold < folds; fold++) {
      // Calculate fold dates
      const foldStartDate = new Date(startDate);
      foldStartDate.setDate(foldStartDate.getDate() + (fold * foldSize));
      
      const foldEndDate = new Date(foldStartDate);
      foldEndDate.setDate(foldEndDate.getDate() + foldSize);
      
      if (fold === folds - 1) {
        // Make sure the last fold goes to the end date
        foldEndDate.setTime(endDate.getTime());
      }
      
      // Create backtest config for this fold
      const backtestConfig: BacktestConfig = {
        ...config.baseConfig,
        startDate: foldStartDate,
        endDate: foldEndDate,
        strategyParameters: bestParameters,
        strategyType: config.strategyType
      };
      
      // Run backtest
      const backtestResult = await this.backtestService.runBacktest(backtestConfig);
      
      // Add to results
      results.push({
        fold: fold + 1,
        parameters: bestParameters,
        metrics: backtestResult.metrics
      });
    }
    
    return results;
  }

  /**
   * Calculate parameter importance
   */
  private async calculateParameterImportance(
    config: OptimizationConfig,
    results: Array<{
      parameters: Record<string, any>;
      metrics: BacktestMetrics;
      rank: number;
    }>
  ): Promise<Record<string, number>> {
    const importance: Record<string, number> = {};
    
    // Initialize importance to 0
    for (const param of config.parameters) {
      importance[param.name] = 0;
    }
    
    // Calculate correlation between parameter values and metric
    for (const param of config.parameters) {
      // Skip categorical parameters for this simple implementation
      if (param.type === 'categorical') {
        importance[param.name] = 0.5; // Default medium importance
        continue;
      }
      
      // Extract parameter values and corresponding metric values
      const paramValues: number[] = [];
      const metricValues: number[] = [];
      
      for (const result of results) {
        paramValues.push(result.parameters[param.name]);
        metricValues.push(result.metrics[config.optimizationMetric]);
      }
      
      // Calculate correlation coefficient
      const correlation = this.calculateCorrelation(paramValues, metricValues);
      
      // Convert correlation to importance (0-1 scale)
      importance[param.name] = Math.min(1, Math.abs(correlation));
    }
    
    return importance;
  }

  /**
   * Calculate correlation coefficient between two arrays
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    
    // Calculate means
    const xMean = x.reduce((sum, val) => sum + val, 0) / n;
    const yMean = y.reduce((sum, val) => sum + val, 0) / n;
    
    // Calculate covariance and variances
    let covariance = 0;
    let xVariance = 0;
    let yVariance = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - xMean;
      const yDiff = y[i] - yMean;
      
      covariance += xDiff * yDiff;
      xVariance += xDiff * xDiff;
      yVariance += yDiff * yDiff;
    }
    
    // Calculate correlation coefficient
    if (xVariance === 0 || yVariance === 0) {
      return 0;
    }
    
    return covariance / Math.sqrt(xVariance * yVariance);
  }
}