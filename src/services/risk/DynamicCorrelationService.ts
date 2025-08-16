import { EventEmitter } from 'events';
import {
  Portfolio,
  Position,
  CorrelationMatrixResult,
  RiskMetricType
} from './models/RiskModels';
import { CorrelationAnalysisService, CorrelationMethod, CorrelationAnalysisOptions } from './CorrelationAnalysisService';
import { FinancialDataService } from '../api/financialData/FinancialDataService';
import { FinancialDataServiceFactory } from '../api/financialData/FinancialDataServiceFactory';

/**
 * Regime types for correlation modeling
 */
export enum MarketRegime {
  NORMAL = 'normal',
  CRISIS = 'crisis',
  RECOVERY = 'recovery',
  BULL = 'bull',
  BEAR = 'bear',
  HIGH_VOLATILITY = 'high_volatility',
  LOW_VOLATILITY = 'low_volatility'
}

/**
 * Dynamic correlation options
 */
export interface DynamicCorrelationOptions extends CorrelationAnalysisOptions {
  windowSize: number;
  stepSize: number;
  decayFactor?: number;
  useExponentialWeighting?: boolean;
  detectRegimeChanges?: boolean;
  volatilityThreshold?: number;
}

/**
 * Dynamic correlation result
 */
export interface DynamicCorrelationResult {
  timePoints: number[];
  correlationMatrices: Record<string, Record<string, number>>[];
  regimes?: MarketRegime[];
  volatilities?: Record<string, number[]>;
  currentRegime?: MarketRegime;
  regimeChangePoints?: number[];
}

/**
 * Service for analyzing dynamic correlations between assets
 */
export class DynamicCorrelationService extends EventEmitter {
  private correlationService: CorrelationAnalysisService;
  private financialDataService: FinancialDataService;
  private historicalPrices: Map<string, { timestamps: number[], prices: number[] }> = new Map();
  private historicalReturns: Map<string, { timestamps: number[], returns: number[] }> = new Map();
  private volatilityCache: Map<string, { timestamp: number, value: number }[]> = new Map();
  
  /**
   * Creates a new DynamicCorrelationService
   * @param correlationService Base correlation analysis service
   * @param financialDataService Financial data service
   */
  constructor(
    correlationService?: CorrelationAnalysisService,
    financialDataService?: FinancialDataService
  ) {
    super();
    this.correlationService = correlationService || new CorrelationAnalysisService();
    this.financialDataService = financialDataService || FinancialDataServiceFactory.getService();
  }
  
  /**
   * Calculates dynamic correlation matrix for a portfolio
   * @param portfolio Portfolio to analyze
   * @param options Dynamic correlation analysis options
   * @returns Dynamic correlation result
   */
  public async calculateDynamicPortfolioCorrelation(
    portfolio: Portfolio,
    options: DynamicCorrelationOptions
  ): Promise<DynamicCorrelationResult> {
    // Get symbols from portfolio
    const symbols = portfolio.positions.map(p => p.symbol);
    
    // Calculate dynamic correlation matrix
    return this.calculateDynamicCorrelationMatrix(symbols, options);
  }
  
  /**
   * Calculates dynamic correlation matrix for a set of symbols
   * @param symbols Array of symbols
   * @param options Dynamic correlation analysis options
   * @returns Dynamic correlation result
   */
  public async calculateDynamicCorrelationMatrix(
    symbols: string[],
    options: DynamicCorrelationOptions
  ): Promise<DynamicCorrelationResult> {
    // Load historical returns for all symbols
    await this.loadHistoricalReturns(symbols, options);
    
    // Get time range for analysis
    const timePoints: number[] = [];
    const correlationMatrices: Record<string, Record<string, number>>[] = [];
    const volatilities: Record<string, number[]> = {};
    
    // Initialize volatilities object
    symbols.forEach(symbol => {
      volatilities[symbol] = [];
    });
    
    // Get the common time range across all symbols
    const commonTimestamps = this.findCommonTimestamps(symbols);
    
    // Calculate rolling correlations
    for (let i = 0; i < commonTimestamps.length - options.windowSize; i += options.stepSize) {
      const windowStart = i;
      const windowEnd = i + options.windowSize;
      const windowTimestamps = commonTimestamps.slice(windowStart, windowEnd);
      const midpointTimestamp = commonTimestamps[Math.floor((windowStart + windowEnd) / 2)];
      
      // Calculate correlation matrix for this window
      const correlationMatrix = await this.calculateWindowCorrelation(
        symbols,
        windowTimestamps,
        options
      );
      
      // Calculate volatilities for this window
      symbols.forEach(symbol => {
        const returns = this.getReturnsForTimestamps(symbol, windowTimestamps);
        const volatility = this.calculateVolatility(returns);
        volatilities[symbol].push(volatility);
      });
      
      // Store results
      timePoints.push(midpointTimestamp);
      correlationMatrices.push(correlationMatrix);
    }
    
    // Detect regimes if requested
    let regimes: MarketRegime[] | undefined;
    let regimeChangePoints: number[] | undefined;
    
    if (options.detectRegimeChanges) {
      const regimeResult = this.detectRegimes(
        timePoints,
        correlationMatrices,
        volatilities,
        options
      );
      regimes = regimeResult.regimes;
      regimeChangePoints = regimeResult.changePoints;
    }
    
    return {
      timePoints,
      correlationMatrices,
      regimes,
      volatilities,
      currentRegime: regimes ? regimes[regimes.length - 1] : undefined,
      regimeChangePoints
    };
  }
  
  /**
   * Calculates correlation matrix for a specific time window
   * @param symbols Array of symbols
   * @param timestamps Timestamps to include in window
   * @param options Correlation options
   * @returns Correlation matrix
   */
  private async calculateWindowCorrelation(
    symbols: string[],
    timestamps: number[],
    options: DynamicCorrelationOptions
  ): Promise<Record<string, Record<string, number>>> {
    const correlationMatrix: Record<string, Record<string, number>> = {};
    
    // Initialize correlation matrix
    for (const symbol1 of symbols) {
      correlationMatrix[symbol1] = {};
      
      for (const symbol2 of symbols) {
        correlationMatrix[symbol1][symbol2] = 0;
      }
    }
    
    // Calculate correlations between each pair of symbols
    for (let i = 0; i < symbols.length; i++) {
      const symbol1 = symbols[i];
      
      // Get returns for symbol1 in this window
      const returns1 = this.getReturnsForTimestamps(symbol1, timestamps);
      
      for (let j = i; j < symbols.length; j++) {
        const symbol2 = symbols[j];
        
        // Get returns for symbol2 in this window
        const returns2 = this.getReturnsForTimestamps(symbol2, timestamps);
        
        // Calculate correlation with optional exponential weighting
        let correlation: number;
        
        if (options.useExponentialWeighting && options.decayFactor) {
          correlation = this.calculateExponentiallyWeightedCorrelation(
            returns1,
            returns2,
            options.decayFactor,
            options.method
          );
        } else {
          // Use standard correlation method
          correlation = this.calculateCorrelation(returns1, returns2, options.method);
        }
        
        // Store correlation in matrix (symmetric)
        correlationMatrix[symbol1][symbol2] = correlation;
        correlationMatrix[symbol2][symbol1] = correlation;
      }
    }
    
    return correlationMatrix;
  }
  
  /**
   * Calculates correlation using specified method
   * @param returns1 First array of returns
   * @param returns2 Second array of returns
   * @param method Correlation method
   * @returns Correlation coefficient
   */
  private calculateCorrelation(
    returns1: number[],
    returns2: number[],
    method: CorrelationMethod
  ): number {
    // Delegate to correlation service based on method
    switch (method) {
      case CorrelationMethod.PEARSON:
        return this.calculatePearsonCorrelation(returns1, returns2);
      case CorrelationMethod.SPEARMAN:
        return this.calculateSpearmanCorrelation(returns1, returns2);
      case CorrelationMethod.KENDALL:
        return this.calculateKendallCorrelation(returns1, returns2);
      default:
        return this.calculatePearsonCorrelation(returns1, returns2);
    }
  }
  
  /**
   * Calculates exponentially weighted correlation
   * @param returns1 First array of returns
   * @param returns2 Second array of returns
   * @param decayFactor Decay factor for exponential weighting
   * @param method Correlation method
   * @returns Weighted correlation coefficient
   */
  private calculateExponentiallyWeightedCorrelation(
    returns1: number[],
    returns2: number[],
    decayFactor: number,
    method: CorrelationMethod
  ): number {
    if (returns1.length === 0 || returns2.length === 0) {
      return 0;
    }
    
    const n = Math.min(returns1.length, returns2.length);
    
    // Calculate weights
    const weights: number[] = [];
    let sumWeights = 0;
    
    for (let i = 0; i < n; i++) {
      // More recent observations get higher weights
      const weight = Math.exp(decayFactor * (i - n + 1));
      weights.push(weight);
      sumWeights += weight;
    }
    
    // Normalize weights
    for (let i = 0; i < n; i++) {
      weights[i] /= sumWeights;
    }
    
    // Calculate weighted means
    let meanX = 0;
    let meanY = 0;
    
    for (let i = 0; i < n; i++) {
      meanX += weights[i] * returns1[i];
      meanY += weights[i] * returns2[i];
    }
    
    // Calculate weighted covariance and variances
    let covariance = 0;
    let varianceX = 0;
    let varianceY = 0;
    
    for (let i = 0; i < n; i++) {
      const diffX = returns1[i] - meanX;
      const diffY = returns2[i] - meanY;
      
      covariance += weights[i] * diffX * diffY;
      varianceX += weights[i] * diffX * diffX;
      varianceY += weights[i] * diffY * diffY;
    }
    
    // Calculate correlation
    if (varianceX === 0 || varianceY === 0) {
      return 0;
    }
    
    return covariance / (Math.sqrt(varianceX) * Math.sqrt(varianceY));
  }
  
  /**
   * Detects market regimes based on correlation and volatility patterns
   * @param timePoints Array of time points
   * @param correlationMatrices Array of correlation matrices
   * @param volatilities Volatilities for each symbol
   * @param options Dynamic correlation options
   * @returns Detected regimes and change points
   */
  private detectRegimes(
    timePoints: number[],
    correlationMatrices: Record<string, Record<string, number>>[],
    volatilities: Record<string, number[]>,
    options: DynamicCorrelationOptions
  ): { regimes: MarketRegime[], changePoints: number[] } {
    const regimes: MarketRegime[] = [];
    const changePoints: number[] = [];
    
    // Calculate average correlation at each time point
    const avgCorrelations: number[] = correlationMatrices.map(matrix => {
      const symbols = Object.keys(matrix);
      let sum = 0;
      let count = 0;
      
      for (let i = 0; i < symbols.length; i++) {
        for (let j = i + 1; j < symbols.length; j++) {
          sum += Math.abs(matrix[symbols[i]][symbols[j]]);
          count++;
        }
      }
      
      return count > 0 ? sum / count : 0;
    });
    
    // Calculate average volatility at each time point
    const avgVolatilities: number[] = [];
    const symbols = Object.keys(volatilities);
    
    for (let i = 0; i < timePoints.length; i++) {
      let sum = 0;
      
      for (const symbol of symbols) {
        sum += volatilities[symbol][i];
      }
      
      avgVolatilities.push(sum / symbols.length);
    }
    
    // Detect regime changes
    const volatilityThreshold = options.volatilityThreshold || 0.02;
    let currentRegime: MarketRegime = MarketRegime.NORMAL;
    
    for (let i = 0; i < timePoints.length; i++) {
      // Determine regime based on correlation and volatility
      let newRegime: MarketRegime;
      
      if (avgVolatilities[i] > volatilityThreshold * 2) {
        // High volatility
        if (avgCorrelations[i] > 0.7) {
          newRegime = MarketRegime.CRISIS;
        } else {
          newRegime = MarketRegime.HIGH_VOLATILITY;
        }
      } else if (avgVolatilities[i] < volatilityThreshold / 2) {
        // Low volatility
        if (avgCorrelations[i] < 0.3) {
          newRegime = MarketRegime.LOW_VOLATILITY;
        } else {
          newRegime = MarketRegime.NORMAL;
        }
      } else {
        // Medium volatility
        if (avgCorrelations[i] > 0.6) {
          newRegime = MarketRegime.BEAR;
        } else if (avgCorrelations[i] < 0.3) {
          newRegime = MarketRegime.BULL;
        } else {
          newRegime = MarketRegime.NORMAL;
        }
      }
      
      // Check for regime change
      if (i === 0 || newRegime !== currentRegime) {
        if (i > 0) {
          changePoints.push(timePoints[i]);
        }
        currentRegime = newRegime;
      }
      
      regimes.push(currentRegime);
    }
    
    return { regimes, changePoints };
  }
  
  /**
   * Loads historical returns for symbols
   * @param symbols Array of symbols
   * @param options Correlation analysis options
   */
  private async loadHistoricalReturns(
    symbols: string[],
    options: DynamicCorrelationOptions
  ): Promise<void> {
    // Load historical prices for all symbols
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - options.lookbackPeriod - 1); // Extra day for calculating returns
    
    for (const symbol of symbols) {
      try {
        // Get historical prices
        const historicalData = await this.financialDataService.getHistoricalPrices(
          symbol,
          startDate,
          endDate,
          'daily'
        );
        
        // Extract prices and timestamps
        const timestamps = historicalData.map(d => d.timestamp);
        const prices = historicalData.map(d => d.close);
        
        // Store prices
        this.historicalPrices.set(symbol, { timestamps, prices });
        
        // Calculate returns
        const returns: number[] = [];
        const returnTimestamps: number[] = [];
        
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
          returnTimestamps.push(timestamps[i]);
        }
        
        // Store returns
        this.historicalReturns.set(symbol, { timestamps: returnTimestamps, returns });
      } catch (error) {
        console.error(`Error loading historical data for ${symbol}:`, error);
        // Use empty arrays for missing data
        this.historicalReturns.set(symbol, { timestamps: [], returns: [] });
      }
    }
  }
  
  /**
   * Finds common timestamps across all symbols
   * @param symbols Array of symbols
   * @returns Array of common timestamps
   */
  private findCommonTimestamps(symbols: string[]): number[] {
    if (symbols.length === 0) {
      return [];
    }
    
    // Start with timestamps from first symbol
    const firstSymbol = symbols[0];
    const firstSymbolData = this.historicalReturns.get(firstSymbol);
    
    if (!firstSymbolData || firstSymbolData.timestamps.length === 0) {
      return [];
    }
    
    let commonTimestamps = new Set(firstSymbolData.timestamps);
    
    // Intersect with timestamps from other symbols
    for (let i = 1; i < symbols.length; i++) {
      const symbol = symbols[i];
      const symbolData = this.historicalReturns.get(symbol);
      
      if (!symbolData || symbolData.timestamps.length === 0) {
        continue;
      }
      
      const timestampSet = new Set(symbolData.timestamps);
      commonTimestamps = new Set([...commonTimestamps].filter(x => timestampSet.has(x)));
    }
    
    // Convert to array and sort
    return Array.from(commonTimestamps).sort((a, b) => a - b);
  }
  
  /**
   * Gets returns for specific timestamps
   * @param symbol Symbol
   * @param timestamps Array of timestamps
   * @returns Array of returns
   */
  private getReturnsForTimestamps(symbol: string, timestamps: number[]): number[] {
    const symbolData = this.historicalReturns.get(symbol);
    
    if (!symbolData) {
      return [];
    }
    
    const { timestamps: allTimestamps, returns: allReturns } = symbolData;
    const result: number[] = [];
    
    // Create timestamp to return index map for efficient lookup
    const timestampToIndex = new Map<number, number>();
    for (let i = 0; i < allTimestamps.length; i++) {
      timestampToIndex.set(allTimestamps[i], i);
    }
    
    // Get returns for requested timestamps
    for (const timestamp of timestamps) {
      const index = timestampToIndex.get(timestamp);
      
      if (index !== undefined) {
        result.push(allReturns[index]);
      }
    }
    
    return result;
  }
  
  /**
   * Calculates volatility of returns
   * @param returns Array of returns
   * @returns Volatility (standard deviation)
   */
  private calculateVolatility(returns: number[]): number {
    if (returns.length === 0) {
      return 0;
    }
    
    // Calculate mean
    const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length;
    
    // Calculate sum of squared differences
    const sumSquaredDiff = returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
    
    // Calculate standard deviation
    return Math.sqrt(sumSquaredDiff / returns.length);
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
}