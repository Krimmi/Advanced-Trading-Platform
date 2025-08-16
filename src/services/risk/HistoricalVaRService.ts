import { BaseRiskCalculationService } from './RiskCalculationService';
import {
  Portfolio,
  Position,
  RiskMetricType,
  VaRResult,
  VaRConfig,
  StressTestResult,
  CorrelationMatrixResult,
  PositionSizingRecommendation,
  AssetClass
} from './models/RiskModels';
import { FinancialDataService } from '../api/FinancialDataService';
import { FinancialDataServiceFactory } from '../api/FinancialDataServiceFactory';
import { StressTestingService } from './StressTestingService';

/**
 * Service for calculating Historical Value at Risk (VaR)
 */
export class HistoricalVaRService extends BaseRiskCalculationService {
  private financialDataService: FinancialDataService;
  private stressTestingService: StressTestingService;
  private historicalReturns: Map<string, number[]> = new Map();
  
  /**
   * Creates a new HistoricalVaRService
   * @param financialDataService Financial data service
   */
  constructor(financialDataService?: FinancialDataService) {
    super();
    this.financialDataService = financialDataService || FinancialDataServiceFactory.getService();
    this.stressTestingService = new StressTestingService(this.financialDataService);
  }
  
  /**
   * Calculates Value at Risk (VaR) for a portfolio
   * @param portfolioId Portfolio ID
   * @param config VaR configuration
   * @returns Promise with VaR result
   */
  public async calculateVaR(portfolioId: string, config: VaRConfig): Promise<VaRResult> {
    const portfolio = await this.getPortfolio(portfolioId);
    
    // Validate portfolio
    if (!portfolio) {
      throw new Error(`Portfolio with ID ${portfolioId} not found`);
    }
    
    if (portfolio.positions.length === 0) {
      throw new Error(`Portfolio with ID ${portfolioId} has no positions`);
    }
    
    // Get historical returns for all symbols in the portfolio
    const symbols = portfolio.positions.map(p => p.symbol);
    await this.loadHistoricalReturns(symbols, config.lookbackPeriod || 252);
    
    // Calculate portfolio returns
    const portfolioReturns = this.calculatePortfolioReturns(portfolio);
    
    // Calculate VaR based on method
    let varValue: number;
    
    switch (config.method) {
      case 'historical':
        varValue = this.calculateHistoricalVaR(portfolioReturns, config.confidenceLevel);
        break;
      case 'parametric':
        varValue = this.calculateParametricVaR(portfolioReturns, config.confidenceLevel);
        break;
      case 'monte_carlo':
        varValue = this.calculateMonteCarloVaR(portfolio, config.confidenceLevel, config.iterations || 10000);
        break;
      default:
        throw new Error(`Unsupported VaR method: ${config.method}`);
    }
    
    // Scale VaR to time horizon
    varValue = this.scaleVaR(varValue, config.timeHorizon);
    
    // Calculate VaR in currency units
    const varCurrency = varValue * portfolio.totalValue;
    
    // Calculate contribution by position
    const contributionByPosition = this.calculateVaRContribution(portfolio, varValue);
    
    // Calculate contribution by asset class
    const contributionByAssetClass = this.calculateVaRContributionByAssetClass(portfolio, contributionByPosition);
    
    // Calculate contribution by sector if available
    const contributionBySector = this.calculateVaRContributionBySector(portfolio, contributionByPosition);
    
    // Create VaR result
    const result: VaRResult = {
      type: this.getVaRMetricType(config.method),
      value: varCurrency,
      portfolioId,
      timestamp: Date.now(),
      confidenceLevel: config.confidenceLevel,
      timeHorizon: config.timeHorizon,
      currency: portfolio.currency,
      percentOfPortfolio: varValue,
      contributionByPosition,
      contributionByAssetClass,
      contributionBySector,
      method: config.method,
      metadata: {
        lookbackPeriod: config.lookbackPeriod || 252,
        iterations: config.iterations,
        decayFactor: config.decayFactor,
        returnDistribution: config.returnDistribution,
        degreesOfFreedom: config.degreesOfFreedom
      }
    };
    
    // Check if VaR exceeds threshold and create alert if needed
    this.checkVaRThreshold(result);
    
    return result;
  }
  
  /**
   * Runs a stress test on a portfolio
   * @param portfolioId Portfolio ID
   * @param scenarioId Scenario ID
   * @returns Promise with stress test result
   */
  public async runStressTest(portfolioId: string, scenarioId: string): Promise<StressTestResult> {
    // Get portfolio
    const portfolio = await this.getPortfolio(portfolioId);
    
    if (!portfolio) {
      throw new Error(`Portfolio with ID ${portfolioId} not found`);
    }
    
    // Get scenario
    const scenario = this.scenarios.get(scenarioId);
    
    if (!scenario) {
      throw new Error(`Scenario with ID ${scenarioId} not found`);
    }
    
    // Run stress test
    const result = await this.stressTestingService.runStressTest(portfolio, scenario);
    
    // Check if stress test result exceeds threshold and create alert if needed
    this.checkStressTestThreshold(result);
    
    return result;
  }
  
  /**
   * Calculates correlation matrix for a set of symbols
   * @param symbols Array of symbols
   * @param lookbackPeriod Lookback period in days
   * @returns Promise with correlation matrix result
   */
  public async calculateCorrelationMatrix(symbols: string[], lookbackPeriod: number): Promise<CorrelationMatrixResult> {
    // Load historical returns for all symbols
    await this.loadHistoricalReturns(symbols, lookbackPeriod);
    
    // Calculate correlation matrix
    const correlationMatrix: Record<string, Record<string, number>> = {};
    
    for (const symbol1 of symbols) {
      correlationMatrix[symbol1] = {};
      
      const returns1 = this.historicalReturns.get(symbol1) || [];
      
      for (const symbol2 of symbols) {
        const returns2 = this.historicalReturns.get(symbol2) || [];
        
        // Calculate correlation coefficient
        const correlation = this.calculateCorrelation(returns1, returns2);
        
        correlationMatrix[symbol1][symbol2] = correlation;
      }
    }
    
    return {
      type: RiskMetricType.CORRELATION,
      value: correlationMatrix,
      portfolioId: '',
      timestamp: Date.now(),
      symbols,
      lookbackPeriod,
      metadata: {
        dataPoints: Math.min(...symbols.map(s => this.historicalReturns.get(s)?.length || 0))
      }
    };
  }
  
  /**
   * Gets position sizing recommendations for a portfolio
   * @param portfolioId Portfolio ID
   * @param method Position sizing method
   * @param params Additional parameters
   * @returns Promise with position sizing recommendations
   */
  public async getPositionSizingRecommendations(
    portfolioId: string,
    method: string,
    params?: Record<string, any>
  ): Promise<PositionSizingRecommendation[]> {
    // This is a placeholder implementation
    // A full implementation would calculate position sizes based on the specified method
    throw new Error('Method not implemented.');
  }
  
  /**
   * Loads historical returns for symbols
   * @param symbols Array of symbols
   * @param lookbackPeriod Lookback period in days
   */
  private async loadHistoricalReturns(symbols: string[], lookbackPeriod: number): Promise<void> {
    // Load historical prices for all symbols
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lookbackPeriod - 1); // Extra day for calculating returns
    
    for (const symbol of symbols) {
      // Skip if already loaded
      if (this.historicalReturns.has(symbol)) {
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
        
        // Calculate returns
        const prices = historicalData.map(d => d.close);
        const returns = [];
        
        for (let i = 1; i < prices.length; i++) {
          const returnValue = (prices[i] - prices[i - 1]) / prices[i - 1];
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
   * Calculates portfolio returns based on historical returns of individual positions
   * @param portfolio Portfolio
   * @returns Array of portfolio returns
   */
  private calculatePortfolioReturns(portfolio: Portfolio): number[] {
    // Get the minimum length of historical returns across all positions
    const minLength = Math.min(
      ...portfolio.positions.map(p => this.historicalReturns.get(p.symbol)?.length || 0)
    );
    
    if (minLength === 0) {
      throw new Error('Insufficient historical data for portfolio return calculation');
    }
    
    // Calculate portfolio weights
    const weights: Record<string, number> = {};
    
    for (const position of portfolio.positions) {
      weights[position.symbol] = position.value / portfolio.totalValue;
    }
    
    // Calculate portfolio returns
    const portfolioReturns: number[] = [];
    
    for (let i = 0; i < minLength; i++) {
      let returnValue = 0;
      
      for (const position of portfolio.positions) {
        const symbolReturns = this.historicalReturns.get(position.symbol) || [];
        
        if (i < symbolReturns.length) {
          returnValue += weights[position.symbol] * symbolReturns[i];
        }
      }
      
      portfolioReturns.push(returnValue);
    }
    
    return portfolioReturns;
  }
  
  /**
   * Calculates historical VaR
   * @param returns Array of returns
   * @param confidenceLevel Confidence level (e.g., 0.95)
   * @returns VaR value
   */
  private calculateHistoricalVaR(returns: number[], confidenceLevel: number): number {
    if (returns.length === 0) {
      throw new Error('No returns data available for VaR calculation');
    }
    
    // Sort returns in ascending order
    const sortedReturns = [...returns].sort((a, b) => a - b);
    
    // Calculate index for percentile
    const index = Math.floor((1 - confidenceLevel) * sortedReturns.length);
    
    // Get VaR value (negative of return at percentile)
    return -sortedReturns[index];
  }
  
  /**
   * Calculates parametric VaR
   * @param returns Array of returns
   * @param confidenceLevel Confidence level (e.g., 0.95)
   * @returns VaR value
   */
  private calculateParametricVaR(returns: number[], confidenceLevel: number): number {
    if (returns.length === 0) {
      throw new Error('No returns data available for VaR calculation');
    }
    
    // Calculate mean and standard deviation
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    // Calculate z-score for confidence level
    const zScore = this.calculateNormalInverse(confidenceLevel);
    
    // Calculate VaR
    return -(mean + zScore * stdDev);
  }
  
  /**
   * Calculates Monte Carlo VaR
   * @param portfolio Portfolio
   * @param confidenceLevel Confidence level (e.g., 0.95)
   * @param iterations Number of iterations
   * @returns VaR value
   */
  private calculateMonteCarloVaR(portfolio: Portfolio, confidenceLevel: number, iterations: number): number {
    // This is a simplified implementation
    // A full implementation would use a more sophisticated model
    
    // Calculate mean and covariance matrix
    const symbols = portfolio.positions.map(p => p.symbol);
    const meanReturns: Record<string, number> = {};
    
    for (const symbol of symbols) {
      const returns = this.historicalReturns.get(symbol) || [];
      meanReturns[symbol] = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    }
    
    // Generate simulated portfolio returns
    const simulatedReturns: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      let portfolioReturn = 0;
      
      for (const position of portfolio.positions) {
        const weight = position.value / portfolio.totalValue;
        const mean = meanReturns[position.symbol] || 0;
        const stdDev = this.calculateStdDev(this.historicalReturns.get(position.symbol) || []);
        
        // Generate random return from normal distribution
        const randomReturn = this.generateNormalRandom(mean, stdDev);
        
        portfolioReturn += weight * randomReturn;
      }
      
      simulatedReturns.push(portfolioReturn);
    }
    
    // Calculate VaR from simulated returns
    return this.calculateHistoricalVaR(simulatedReturns, confidenceLevel);
  }
  
  /**
   * Scales VaR to a specific time horizon
   * @param varValue VaR value
   * @param timeHorizon Time horizon in days
   * @returns Scaled VaR value
   */
  private scaleVaR(varValue: number, timeHorizon: number): number {
    // Scale VaR using square root of time rule
    return varValue * Math.sqrt(timeHorizon);
  }
  
  /**
   * Calculates VaR contribution by position
   * @param portfolio Portfolio
   * @param portfolioVaR Portfolio VaR
   * @returns VaR contribution by position
   */
  private calculateVaRContribution(portfolio: Portfolio, portfolioVaR: number): Record<string, number> {
    const contribution: Record<string, number> = {};
    
    // This is a simplified implementation based on position weights
    // A full implementation would use marginal VaR and component VaR
    
    for (const position of portfolio.positions) {
      const weight = position.value / portfolio.totalValue;
      contribution[position.symbol] = weight * portfolioVaR * portfolio.totalValue;
    }
    
    return contribution;
  }
  
  /**
   * Calculates VaR contribution by asset class
   * @param portfolio Portfolio
   * @param contributionByPosition VaR contribution by position
   * @returns VaR contribution by asset class
   */
  private calculateVaRContributionByAssetClass(
    portfolio: Portfolio,
    contributionByPosition: Record<string, number>
  ): Record<string, number> {
    const contribution: Record<string, number> = {};
    
    for (const position of portfolio.positions) {
      const assetClass = position.assetClass;
      
      if (!contribution[assetClass]) {
        contribution[assetClass] = 0;
      }
      
      contribution[assetClass] += contributionByPosition[position.symbol];
    }
    
    return contribution;
  }
  
  /**
   * Calculates VaR contribution by sector
   * @param portfolio Portfolio
   * @param contributionByPosition VaR contribution by position
   * @returns VaR contribution by sector
   */
  private calculateVaRContributionBySector(
    portfolio: Portfolio,
    contributionByPosition: Record<string, number>
  ): Record<string, number> | undefined {
    // Check if sector information is available
    const hasSectors = portfolio.positions.some(p => p.sector);
    
    if (!hasSectors) {
      return undefined;
    }
    
    const contribution: Record<string, number> = {};
    
    for (const position of portfolio.positions) {
      const sector = position.sector || 'Unknown';
      
      if (!contribution[sector]) {
        contribution[sector] = 0;
      }
      
      contribution[sector] += contributionByPosition[position.symbol];
    }
    
    return contribution;
  }
  
  /**
   * Gets VaR metric type based on method
   * @param method VaR method
   * @returns VaR metric type
   */
  private getVaRMetricType(method: string): RiskMetricType.VAR_HISTORICAL | RiskMetricType.VAR_PARAMETRIC | RiskMetricType.VAR_MONTE_CARLO {
    switch (method) {
      case 'historical':
        return RiskMetricType.VAR_HISTORICAL;
      case 'parametric':
        return RiskMetricType.VAR_PARAMETRIC;
      case 'monte_carlo':
        return RiskMetricType.VAR_MONTE_CARLO;
      default:
        throw new Error(`Invalid VaR method: ${method}`);
    }
  }
  
  /**
   * Checks if VaR exceeds threshold and creates alert if needed
   * @param varResult VaR result
   */
  private checkVaRThreshold(varResult: VaRResult): void {
    const { portfolioId, value, percentOfPortfolio } = varResult;
    
    // Get portfolio
    const portfolio = this.portfolios.get(portfolioId);
    
    if (!portfolio) {
      return;
    }
    
    // Check if VaR exceeds threshold
    const thresholdPercentage = 0.1; // 10% of portfolio value
    
    if (percentOfPortfolio > thresholdPercentage) {
      this.createAlert({
        id: `var-alert-${portfolioId}-${Date.now()}`,
        level: percentOfPortfolio > 0.2 ? 'critical' : percentOfPortfolio > 0.15 ? 'high' : 'medium',
        title: 'High Value at Risk',
        message: `Portfolio ${portfolio.name} has a VaR of ${(percentOfPortfolio * 100).toFixed(2)}% (${value.toFixed(2)} ${portfolio.currency}), which exceeds the threshold of ${(thresholdPercentage * 100).toFixed(2)}%.`,
        portfolioId,
        metricType: varResult.type,
        timestamp: Date.now(),
        thresholdValue: thresholdPercentage * portfolio.totalValue,
        actualValue: value
      });
    }
  }
  
  /**
   * Checks if stress test result exceeds threshold and creates alert if needed
   * @param stressTestResult Stress test result
   */
  private checkStressTestThreshold(stressTestResult: StressTestResult): void {
    const { portfolioId, percentageChange, absoluteChange } = stressTestResult;
    
    // Get portfolio
    const portfolio = this.portfolios.get(portfolioId);
    
    if (!portfolio) {
      return;
    }
    
    // Check if stress test result exceeds threshold
    const thresholdPercentage = -0.15; // -15% change
    
    if (percentageChange < thresholdPercentage) {
      this.createAlert({
        id: `stress-test-alert-${portfolioId}-${Date.now()}`,
        level: percentageChange < -0.3 ? 'critical' : percentageChange < -0.2 ? 'high' : 'medium',
        title: 'High Stress Test Impact',
        message: `Portfolio ${portfolio.name} has a stress test impact of ${(percentageChange * 100).toFixed(2)}% (${absoluteChange.toFixed(2)} ${portfolio.currency}) under the ${stressTestResult.scenarioName} scenario, which exceeds the threshold of ${(thresholdPercentage * 100).toFixed(2)}%.`,
        portfolioId,
        metricType: RiskMetricType.STRESS_TEST,
        timestamp: Date.now(),
        thresholdValue: thresholdPercentage * portfolio.totalValue,
        actualValue: absoluteChange
      });
    }
  }
  
  /**
   * Calculates correlation between two arrays
   * @param x First array
   * @param y Second array
   * @returns Correlation coefficient
   */
  private calculateCorrelation(x: number[], y: number[]): number {
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
   * Calculates standard deviation
   * @param values Array of values
   * @returns Standard deviation
   */
  private calculateStdDev(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance);
  }
  
  /**
   * Calculates inverse of standard normal cumulative distribution
   * @param p Probability
   * @returns Z-score
   */
  private calculateNormalInverse(p: number): number {
    // Approximation of the inverse of the standard normal CDF
    // Abramowitz and Stegun approximation 26.2.23
    // Valid for 0.001 < p < 0.999
    
    if (p < 0.001 || p > 0.999) {
      throw new Error('Probability must be between 0.001 and 0.999');
    }
    
    const a1 = -3.969683028665376e+01;
    const a2 = 2.209460984245205e+02;
    const a3 = -2.759285104469687e+02;
    const a4 = 1.383577518672690e+02;
    const a5 = -3.066479806614716e+01;
    const a6 = 2.506628277459239e+00;
    
    const b1 = -5.447609879822406e+01;
    const b2 = 1.615858368580409e+02;
    const b3 = -1.556989798598866e+02;
    const b4 = 6.680131188771972e+01;
    const b5 = -1.328068155288572e+01;
    
    const c1 = -7.784894002430293e-03;
    const c2 = -3.223964580411365e-01;
    const c3 = -2.400758277161838e+00;
    const c4 = -2.549732539343734e+00;
    const c5 = 4.374664141464968e+00;
    const c6 = 2.938163982698783e+00;
    
    const d1 = 7.784695709041462e-03;
    const d2 = 3.224671290700398e-01;
    const d3 = 2.445134137142996e+00;
    const d4 = 3.754408661907416e+00;
    
    // Define break-points
    const pLow = 0.02425;
    const pHigh = 1 - pLow;
    
    let q: number;
    let r: number;
    let x: number;
    
    // Rational approximation for lower region
    if (p < pLow) {
      q = Math.sqrt(-2 * Math.log(p));
      x = (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
          ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    }
    // Rational approximation for central region
    else if (p <= pHigh) {
      q = p - 0.5;
      r = q * q;
      x = (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
          (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
    }
    // Rational approximation for upper region
    else {
      q = Math.sqrt(-2 * Math.log(1 - p));
      x = -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
           ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    }
    
    return x;
  }
  
  /**
   * Generates a random number from a normal distribution
   * @param mean Mean
   * @param stdDev Standard deviation
   * @returns Random number
   */
  private generateNormalRandom(mean: number, stdDev: number): number {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    
    return mean + stdDev * z0;
  }
}