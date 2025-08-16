import { EventEmitter } from 'events';
import {
  Portfolio,
  Position,
  CorrelationMatrixResult,
  RiskMetricType
} from './models/RiskModels';
import { FinancialDataService } from '../api/FinancialDataService';
import { FinancialDataServiceFactory } from '../api/FinancialDataServiceFactory';

/**
 * Correlation method types
 */
export enum CorrelationMethod {
  PEARSON = 'pearson',
  SPEARMAN = 'spearman',
  KENDALL = 'kendall'
}

/**
 * Correlation analysis options
 */
export interface CorrelationAnalysisOptions {
  lookbackPeriod: number;
  method: CorrelationMethod;
  useLogReturns?: boolean;
  minDataPoints?: number;
  excludeCash?: boolean;
  groupByAssetClass?: boolean;
  groupBySector?: boolean;
}

/**
 * Service for analyzing correlations between assets
 */
export class CorrelationAnalysisService extends EventEmitter {
  private financialDataService: FinancialDataService;
  private historicalPrices: Map<string, number[]> = new Map();
  private historicalReturns: Map<string, number[]> = new Map();
  private correlationCache: Map<string, CorrelationMatrixResult> = new Map();
  
  /**
   * Creates a new CorrelationAnalysisService
   * @param financialDataService Financial data service
   */
  constructor(financialDataService?: FinancialDataService) {
    super();
    this.financialDataService = financialDataService || FinancialDataServiceFactory.getService();
  }
  
  /**
   * Calculates correlation matrix for a portfolio
   * @param portfolio Portfolio to analyze
   * @param options Correlation analysis options
   * @returns Correlation matrix result
   */
  public async calculatePortfolioCorrelation(
    portfolio: Portfolio,
    options: CorrelationAnalysisOptions
  ): Promise<CorrelationMatrixResult> {
    // Get symbols from portfolio
    const symbols = portfolio.positions.map(p => p.symbol);
    
    // Calculate correlation matrix
    return this.calculateCorrelationMatrix(symbols, options);
  }
  
  /**
   * Calculates correlation matrix for a set of symbols
   * @param symbols Array of symbols
   * @param options Correlation analysis options
   * @returns Correlation matrix result
   */
  public async calculateCorrelationMatrix(
    symbols: string[],
    options: CorrelationAnalysisOptions
  ): Promise<CorrelationMatrixResult> {
    // Check cache
    const cacheKey = this.getCacheKey(symbols, options);
    const cachedResult = this.correlationCache.get(cacheKey);
    
    if (cachedResult && this.isCacheValid(cachedResult)) {
      return cachedResult;
    }
    
    // Load historical returns for all symbols
    await this.loadHistoricalReturns(symbols, options);
    
    // Calculate correlation matrix
    const correlationMatrix: Record<string, Record<string, number>> = {};
    
    for (const symbol1 of symbols) {
      correlationMatrix[symbol1] = {};
      
      const returns1 = this.historicalReturns.get(symbol1) || [];
      
      for (const symbol2 of symbols) {
        const returns2 = this.historicalReturns.get(symbol2) || [];
        
        // Calculate correlation coefficient based on method
        let correlation: number;
        
        switch (options.method) {
          case CorrelationMethod.PEARSON:
            correlation = this.calculatePearsonCorrelation(returns1, returns2);
            break;
          case CorrelationMethod.SPEARMAN:
            correlation = this.calculateSpearmanCorrelation(returns1, returns2);
            break;
          case CorrelationMethod.KENDALL:
            correlation = this.calculateKendallCorrelation(returns1, returns2);
            break;
          default:
            correlation = this.calculatePearsonCorrelation(returns1, returns2);
        }
        
        correlationMatrix[symbol1][symbol2] = correlation;
      }
    }
    
    // Create result
    const result: CorrelationMatrixResult = {
      type: RiskMetricType.CORRELATION,
      value: correlationMatrix,
      portfolioId: '',
      timestamp: Date.now(),
      symbols,
      lookbackPeriod: options.lookbackPeriod,
      metadata: {
        method: options.method,
        useLogReturns: options.useLogReturns || false,
        dataPoints: Math.min(...symbols.map(s => this.historicalReturns.get(s)?.length || 0))
      }
    };
    
    // Cache result
    this.correlationCache.set(cacheKey, result);
    
    return result;
  }
  
  /**
   * Calculates eigenportfolio decomposition
   * @param correlationMatrix Correlation matrix
   * @returns Eigenportfolios with eigenvalues and weights
   */
  public calculateEigenportfolios(
    correlationMatrix: Record<string, Record<string, number>>
  ): { eigenvalues: number[], eigenportfolios: Record<string, number>[] } {
    // This is a simplified implementation
    // A full implementation would use a proper linear algebra library
    
    // Convert correlation matrix to array form
    const symbols = Object.keys(correlationMatrix);
    const n = symbols.length;
    const matrix: number[][] = [];
    
    for (let i = 0; i < n; i++) {
      matrix[i] = [];
      for (let j = 0; j < n; j++) {
        matrix[i][j] = correlationMatrix[symbols[i]][symbols[j]];
      }
    }
    
    // Use power iteration method to find dominant eigenvalue and eigenvector
    // This is a simplified approach - in reality, we would use a proper eigendecomposition
    const eigenvalues: number[] = [];
    const eigenvectors: number[][] = [];
    
    // Find top 3 eigenportfolios (or fewer if matrix is smaller)
    const numEigenportfolios = Math.min(3, n);
    
    for (let k = 0; k < numEigenportfolios; k++) {
      // Start with a random vector
      let vector = Array(n).fill(0).map(() => Math.random());
      
      // Normalize
      const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
      vector = vector.map(val => val / norm);
      
      // Power iteration
      for (let iter = 0; iter < 100; iter++) {
        // Multiply matrix by vector
        const newVector = Array(n).fill(0);
        
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            newVector[i] += matrix[i][j] * vector[j];
          }
        }
        
        // Normalize
        const newNorm = Math.sqrt(newVector.reduce((sum, val) => sum + val * val, 0));
        const normalizedVector = newVector.map(val => val / newNorm);
        
        // Check convergence
        const diff = normalizedVector.reduce((sum, val, i) => sum + Math.abs(val - vector[i]), 0);
        
        if (diff < 1e-10) {
          break;
        }
        
        vector = normalizedVector;
      }
      
      // Calculate eigenvalue (Rayleigh quotient)
      let eigenvalue = 0;
      
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          eigenvalue += vector[i] * matrix[i][j] * vector[j];
        }
      }
      
      // Store eigenvalue and eigenvector
      eigenvalues.push(eigenvalue);
      eigenvectors.push(vector);
      
      // Deflate matrix to find next eigenvalue/eigenvector
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          matrix[i][j] -= eigenvalue * vector[i] * vector[j];
        }
      }
    }
    
    // Convert eigenvectors to eigenportfolios
    const eigenportfolios: Record<string, number>[] = [];
    
    for (let k = 0; k < eigenvectors.length; k++) {
      const portfolio: Record<string, number> = {};
      
      for (let i = 0; i < n; i++) {
        portfolio[symbols[i]] = eigenvectors[k][i];
      }
      
      eigenportfolios.push(portfolio);
    }
    
    return { eigenvalues, eigenportfolios };
  }
  
  /**
   * Calculates risk-based portfolio optimization
   * @param correlationMatrix Correlation matrix
   * @param expectedReturns Expected returns for each symbol
   * @returns Optimized portfolio weights
   */
  public calculateRiskBasedOptimization(
    correlationMatrix: Record<string, Record<string, number>>,
    expectedReturns: Record<string, number>
  ): Record<string, number> {
    // This is a simplified implementation of risk parity / equal risk contribution
    // A full implementation would use a proper optimization library
    
    const symbols = Object.keys(correlationMatrix);
    const n = symbols.length;
    
    // Start with equal weights
    const weights: Record<string, number> = {};
    for (const symbol of symbols) {
      weights[symbol] = 1 / n;
    }
    
    // Simple iterative approach to risk parity
    for (let iter = 0; iter < 100; iter++) {
      // Calculate marginal risk contributions
      const riskContributions: Record<string, number> = {};
      let totalRisk = 0;
      
      for (const symbol1 of symbols) {
        riskContributions[symbol1] = 0;
        
        for (const symbol2 of symbols) {
          riskContributions[symbol1] += weights[symbol1] * weights[symbol2] * correlationMatrix[symbol1][symbol2];
        }
        
        totalRisk += riskContributions[symbol1];
      }
      
      // Adjust weights to equalize risk contributions
      for (const symbol of symbols) {
        weights[symbol] *= Math.sqrt(1 / (n * riskContributions[symbol]));
      }
      
      // Normalize weights
      const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
      for (const symbol of symbols) {
        weights[symbol] /= totalWeight;
      }
    }
    
    return weights;
  }
  
  /**
   * Loads historical returns for symbols
   * @param symbols Array of symbols
   * @param options Correlation analysis options
   */
  private async loadHistoricalReturns(
    symbols: string[],
    options: CorrelationAnalysisOptions
  ): Promise<void> {
    // Load historical prices for all symbols
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - options.lookbackPeriod - 1); // Extra day for calculating returns
    
    for (const symbol of symbols) {
      // Skip if already loaded with sufficient data
      if (
        this.historicalReturns.has(symbol) && 
        this.historicalReturns.get(symbol)!.length >= options.lookbackPeriod
      ) {
        continue;
      }
      
      try {
        // Get historical prices
        const historicalData = await this.financialDataService.getHistoricalPrices(
          symbol,
          startDate,
          endDate,
          'daily'
        );
        
        // Extract prices
        const prices = historicalData.map(d => d.close);
        this.historicalPrices.set(symbol, prices);
        
        // Calculate returns
        const returns = [];
        
        for (let i = 1; i < prices.length; i++) {
          let returnValue: number;
          
          if (options.useLogReturns) {
            // Log returns
            returnValue = Math.log(prices[i] / prices[i - 1]);
          } else {
            // Simple returns
            returnValue = (prices[i] - prices[i - 1]) / prices[i - 1];
          }
          
          returns.push(returnValue);
        }
        
        // Store returns
        this.historicalReturns.set(symbol, returns);
      } catch (error) {
        console.error(`Error loading historical data for ${symbol}:`, error);
        // Use empty array for missing data
        this.historicalReturns.set(symbol, []);
      }
    }
  }
  
  /**
   * Calculates Pearson correlation coefficient
   * @param x First array
   * @param y Second array
   * @returns Correlation coefficient
   */
  private calculatePearsonCorrelation(x: number[], y: number[]): number {
    if (x.length === 0 || y.length === 0) {
      return 0;
    }
    
    const n = Math.min(x.length, y.length);
    
    // Calculate means
    const meanX = x.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
    const meanY = y.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
    
    // Calculate covariance and variances
    let covariance = 0;
    let varianceX = 0;
    let varianceY = 0;
    
    for (let i = 0; i < n; i++) {
      const diffX = x[i] - meanX;
      const diffY = y[i] - meanY;
      
      covariance += diffX * diffY;
      varianceX += diffX * diffX;
      varianceY += diffY * diffY;
    }
    
    covariance /= n;
    varianceX /= n;
    varianceY /= n;
    
    // Calculate correlation
    if (varianceX === 0 || varianceY === 0) {
      return 0;
    }
    
    return covariance / (Math.sqrt(varianceX) * Math.sqrt(varianceY));
  }
  
  /**
   * Calculates Spearman rank correlation coefficient
   * @param x First array
   * @param y Second array
   * @returns Correlation coefficient
   */
  private calculateSpearmanCorrelation(x: number[], y: number[]): number {
    if (x.length === 0 || y.length === 0) {
      return 0;
    }
    
    const n = Math.min(x.length, y.length);
    
    // Convert to ranks
    const xWithIndices = x.slice(0, n).map((val, i) => ({ val, i }));
    const yWithIndices = y.slice(0, n).map((val, i) => ({ val, i }));
    
    xWithIndices.sort((a, b) => a.val - b.val);
    yWithIndices.sort((a, b) => a.val - b.val);
    
    const xRanks = Array(n).fill(0);
    const yRanks = Array(n).fill(0);
    
    for (let i = 0; i < n; i++) {
      xRanks[xWithIndices[i].i] = i + 1;
      yRanks[yWithIndices[i].i] = i + 1;
    }
    
    // Handle ties in ranks
    const handleTies = (ranks: number[]) => {
      const valueToIndices = new Map<number, number[]>();
      
      for (let i = 0; i < ranks.length; i++) {
        const value = ranks[i];
        if (!valueToIndices.has(value)) {
          valueToIndices.set(value, []);
        }
        valueToIndices.get(value)!.push(i);
      }
      
      for (const [value, indices] of valueToIndices.entries()) {
        if (indices.length > 1) {
          const avgRank = indices.reduce((sum, i) => sum + ranks[i], 0) / indices.length;
          for (const i of indices) {
            ranks[i] = avgRank;
          }
        }
      }
    };
    
    handleTies(xRanks);
    handleTies(yRanks);
    
    // Calculate Pearson correlation of ranks
    return this.calculatePearsonCorrelation(xRanks, yRanks);
  }
  
  /**
   * Calculates Kendall tau rank correlation coefficient
   * @param x First array
   * @param y Second array
   * @returns Correlation coefficient
   */
  private calculateKendallCorrelation(x: number[], y: number[]): number {
    if (x.length === 0 || y.length === 0) {
      return 0;
    }
    
    const n = Math.min(x.length, y.length);
    
    // Count concordant and discordant pairs
    let concordant = 0;
    let discordant = 0;
    
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const xDiff = x[i] - x[j];
        const yDiff = y[i] - y[j];
        
        if (xDiff * yDiff > 0) {
          concordant++;
        } else if (xDiff * yDiff < 0) {
          discordant++;
        }
        // Tied pairs are ignored
      }
    }
    
    // Calculate Kendall's tau
    const totalPairs = (n * (n - 1)) / 2;
    
    if (totalPairs === 0) {
      return 0;
    }
    
    return (concordant - discordant) / totalPairs;
  }
  
  /**
   * Gets cache key for correlation matrix
   * @param symbols Array of symbols
   * @param options Correlation analysis options
   * @returns Cache key
   */
  private getCacheKey(symbols: string[], options: CorrelationAnalysisOptions): string {
    const sortedSymbols = [...symbols].sort();
    return `${sortedSymbols.join(',')}-${options.lookbackPeriod}-${options.method}-${options.useLogReturns}`;
  }
  
  /**
   * Checks if cached result is still valid
   * @param result Cached result
   * @returns True if cache is valid
   */
  private isCacheValid(result: CorrelationMatrixResult): boolean {
    // Cache is valid for 1 hour
    const cacheValidityMs = 60 * 60 * 1000;
    return Date.now() - result.timestamp < cacheValidityMs;
  }
}