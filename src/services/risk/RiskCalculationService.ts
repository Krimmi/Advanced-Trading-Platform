import { EventEmitter } from 'events';
import {
  Portfolio,
  Position,
  RiskMetricType,
  RiskMetricResult,
  RiskCalculationParams,
  VaRResult,
  StressTestResult,
  RiskScenario,
  CorrelationMatrixResult,
  PositionSizingRecommendation,
  RiskAlert,
  RiskAlertLevel,
  VaRConfig
} from './models/RiskModels';

/**
 * Interface for risk calculation services
 */
export interface IRiskCalculationService {
  /**
   * Calculates a risk metric for a portfolio
   * @param params Risk calculation parameters
   * @returns Promise with risk metric result
   */
  calculateRiskMetric(params: RiskCalculationParams): Promise<RiskMetricResult>;
  
  /**
   * Calculates Value at Risk (VaR) for a portfolio
   * @param portfolioId Portfolio ID
   * @param config VaR configuration
   * @returns Promise with VaR result
   */
  calculateVaR(portfolioId: string, config: VaRConfig): Promise<VaRResult>;
  
  /**
   * Runs a stress test on a portfolio
   * @param portfolioId Portfolio ID
   * @param scenarioId Scenario ID
   * @returns Promise with stress test result
   */
  runStressTest(portfolioId: string, scenarioId: string): Promise<StressTestResult>;
  
  /**
   * Calculates correlation matrix for a set of symbols
   * @param symbols Array of symbols
   * @param lookbackPeriod Lookback period in days
   * @returns Promise with correlation matrix result
   */
  calculateCorrelationMatrix(symbols: string[], lookbackPeriod: number): Promise<CorrelationMatrixResult>;
  
  /**
   * Gets position sizing recommendations for a portfolio
   * @param portfolioId Portfolio ID
   * @param method Position sizing method
   * @param params Additional parameters
   * @returns Promise with position sizing recommendations
   */
  getPositionSizingRecommendations(
    portfolioId: string,
    method: string,
    params?: Record<string, any>
  ): Promise<PositionSizingRecommendation[]>;
  
  /**
   * Gets risk alerts for a portfolio
   * @param portfolioId Portfolio ID
   * @param minLevel Minimum alert level
   * @returns Promise with risk alerts
   */
  getRiskAlerts(portfolioId: string, minLevel?: RiskAlertLevel): Promise<RiskAlert[]>;
  
  /**
   * Gets available risk scenarios
   * @returns Promise with risk scenarios
   */
  getAvailableScenarios(): Promise<RiskScenario[]>;
  
  /**
   * Creates a custom risk scenario
   * @param scenario Risk scenario
   * @returns Promise with created scenario
   */
  createScenario(scenario: RiskScenario): Promise<RiskScenario>;
  
  /**
   * Gets a portfolio by ID
   * @param portfolioId Portfolio ID
   * @returns Promise with portfolio
   */
  getPortfolio(portfolioId: string): Promise<Portfolio>;
  
  /**
   * Gets all portfolios
   * @returns Promise with portfolios
   */
  getAllPortfolios(): Promise<Portfolio[]>;
  
  /**
   * Creates or updates a portfolio
   * @param portfolio Portfolio
   * @returns Promise with updated portfolio
   */
  savePortfolio(portfolio: Portfolio): Promise<Portfolio>;
}

/**
 * Base implementation of the risk calculation service
 */
export abstract class BaseRiskCalculationService extends EventEmitter implements IRiskCalculationService {
  protected portfolios: Map<string, Portfolio> = new Map();
  protected scenarios: Map<string, RiskScenario> = new Map();
  protected riskAlerts: Map<string, RiskAlert[]> = new Map();
  protected metricCache: Map<string, RiskMetricResult> = new Map();
  
  /**
   * Creates a new BaseRiskCalculationService
   */
  constructor() {
    super();
    this.initializeDefaultScenarios();
  }
  
  /**
   * Calculates a risk metric for a portfolio
   * @param params Risk calculation parameters
   * @returns Promise with risk metric result
   */
  public async calculateRiskMetric(params: RiskCalculationParams): Promise<RiskMetricResult> {
    const { portfolioId, metricType } = params;
    
    // Get portfolio
    const portfolio = await this.getPortfolio(portfolioId);
    
    if (!portfolio) {
      throw new Error(`Portfolio with ID ${portfolioId} not found`);
    }
    
    // Check cache
    const cacheKey = this.getCacheKey(portfolioId, metricType, params);
    const cachedResult = this.metricCache.get(cacheKey);
    
    if (cachedResult && this.isCacheValid(cachedResult)) {
      return cachedResult;
    }
    
    // Calculate metric based on type
    let result: RiskMetricResult;
    
    switch (metricType) {
      case RiskMetricType.VAR_HISTORICAL:
      case RiskMetricType.VAR_PARAMETRIC:
      case RiskMetricType.VAR_MONTE_CARLO:
        const varConfig: VaRConfig = {
          confidenceLevel: params.confidenceLevel || 0.95,
          timeHorizon: params.timeHorizon || 1,
          method: this.getVaRMethodFromMetricType(metricType),
          lookbackPeriod: params.lookbackPeriod,
          iterations: params.iterations,
          decayFactor: params.decayFactor,
          returnDistribution: params.returnDistribution,
          degreesOfFreedom: params.degreesOfFreedom
        };
        result = await this.calculateVaR(portfolioId, varConfig);
        break;
      
      case RiskMetricType.CORRELATION:
        const symbols = portfolio.positions.map(p => p.symbol);
        result = await this.calculateCorrelationMatrix(symbols, params.lookbackPeriod || 252);
        break;
      
      case RiskMetricType.STRESS_TEST:
        if (!params.scenarios || params.scenarios.length === 0) {
          throw new Error('No scenarios provided for stress test');
        }
        const scenarioId = params.scenarios[0].id;
        result = await this.runStressTest(portfolioId, scenarioId);
        break;
      
      default:
        throw new Error(`Risk metric type ${metricType} not implemented`);
    }
    
    // Cache result
    this.metricCache.set(cacheKey, result);
    
    return result;
  }
  
  /**
   * Calculates Value at Risk (VaR) for a portfolio
   * @param portfolioId Portfolio ID
   * @param config VaR configuration
   * @returns Promise with VaR result
   */
  public abstract calculateVaR(portfolioId: string, config: VaRConfig): Promise<VaRResult>;
  
  /**
   * Runs a stress test on a portfolio
   * @param portfolioId Portfolio ID
   * @param scenarioId Scenario ID
   * @returns Promise with stress test result
   */
  public abstract runStressTest(portfolioId: string, scenarioId: string): Promise<StressTestResult>;
  
  /**
   * Calculates correlation matrix for a set of symbols
   * @param symbols Array of symbols
   * @param lookbackPeriod Lookback period in days
   * @returns Promise with correlation matrix result
   */
  public abstract calculateCorrelationMatrix(symbols: string[], lookbackPeriod: number): Promise<CorrelationMatrixResult>;
  
  /**
   * Gets position sizing recommendations for a portfolio
   * @param portfolioId Portfolio ID
   * @param method Position sizing method
   * @param params Additional parameters
   * @returns Promise with position sizing recommendations
   */
  public abstract getPositionSizingRecommendations(
    portfolioId: string,
    method: string,
    params?: Record<string, any>
  ): Promise<PositionSizingRecommendation[]>;
  
  /**
   * Gets risk alerts for a portfolio
   * @param portfolioId Portfolio ID
   * @param minLevel Minimum alert level
   * @returns Promise with risk alerts
   */
  public async getRiskAlerts(portfolioId: string, minLevel: RiskAlertLevel = RiskAlertLevel.LOW): Promise<RiskAlert[]> {
    const alerts = this.riskAlerts.get(portfolioId) || [];
    
    // Filter by minimum level
    const levelPriority = {
      [RiskAlertLevel.LOW]: 0,
      [RiskAlertLevel.MEDIUM]: 1,
      [RiskAlertLevel.HIGH]: 2,
      [RiskAlertLevel.CRITICAL]: 3
    };
    
    const minLevelPriority = levelPriority[minLevel];
    
    return alerts.filter(alert => levelPriority[alert.level] >= minLevelPriority);
  }
  
  /**
   * Gets available risk scenarios
   * @returns Promise with risk scenarios
   */
  public async getAvailableScenarios(): Promise<RiskScenario[]> {
    return Array.from(this.scenarios.values());
  }
  
  /**
   * Creates a custom risk scenario
   * @param scenario Risk scenario
   * @returns Promise with created scenario
   */
  public async createScenario(scenario: RiskScenario): Promise<RiskScenario> {
    // Generate ID if not provided
    if (!scenario.id) {
      scenario.id = `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    this.scenarios.set(scenario.id, scenario);
    
    this.emit('scenarioCreated', scenario);
    
    return scenario;
  }
  
  /**
   * Gets a portfolio by ID
   * @param portfolioId Portfolio ID
   * @returns Promise with portfolio
   */
  public async getPortfolio(portfolioId: string): Promise<Portfolio> {
    const portfolio = this.portfolios.get(portfolioId);
    
    if (!portfolio) {
      throw new Error(`Portfolio with ID ${portfolioId} not found`);
    }
    
    return portfolio;
  }
  
  /**
   * Gets all portfolios
   * @returns Promise with portfolios
   */
  public async getAllPortfolios(): Promise<Portfolio[]> {
    return Array.from(this.portfolios.values());
  }
  
  /**
   * Creates or updates a portfolio
   * @param portfolio Portfolio
   * @returns Promise with updated portfolio
   */
  public async savePortfolio(portfolio: Portfolio): Promise<Portfolio> {
    // Generate ID if not provided
    if (!portfolio.id) {
      portfolio.id = `portfolio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Calculate total value
    let totalValue = portfolio.cash;
    
    for (const position of portfolio.positions) {
      totalValue += position.value;
    }
    
    portfolio.totalValue = totalValue;
    portfolio.lastUpdated = Date.now();
    
    this.portfolios.set(portfolio.id, portfolio);
    
    this.emit('portfolioUpdated', portfolio);
    
    return portfolio;
  }
  
  /**
   * Initializes default risk scenarios
   */
  protected initializeDefaultScenarios(): void {
    // Financial Crisis 2008
    this.scenarios.set('financial-crisis-2008', {
      id: 'financial-crisis-2008',
      name: 'Financial Crisis 2008',
      description: 'Simulates market conditions during the 2008 financial crisis',
      factors: [
        { factorId: 'market', factorName: 'Equity Market', shiftType: 'percentage', shiftValue: -0.40 },
        { factorId: 'credit', factorName: 'Credit Spreads', shiftType: 'absolute', shiftValue: 2.5 },
        { factorId: 'volatility', factorName: 'Volatility', shiftType: 'percentage', shiftValue: 1.5 },
        { factorId: 'interest_rate', factorName: 'Interest Rates', shiftType: 'absolute', shiftValue: -1.0 }
      ],
      isHistorical: true,
      date: new Date('2008-09-15').getTime(),
      probability: 0.05
    });
    
    // COVID-19 Market Crash
    this.scenarios.set('covid-crash-2020', {
      id: 'covid-crash-2020',
      name: 'COVID-19 Market Crash',
      description: 'Simulates market conditions during the COVID-19 market crash in March 2020',
      factors: [
        { factorId: 'market', factorName: 'Equity Market', shiftType: 'percentage', shiftValue: -0.35 },
        { factorId: 'volatility', factorName: 'Volatility', shiftType: 'percentage', shiftValue: 2.0 },
        { factorId: 'credit', factorName: 'Credit Spreads', shiftType: 'absolute', shiftValue: 1.5 },
        { factorId: 'interest_rate', factorName: 'Interest Rates', shiftType: 'absolute', shiftValue: -0.5 }
      ],
      isHistorical: true,
      date: new Date('2020-03-23').getTime(),
      probability: 0.1
    });
    
    // Interest Rate Spike
    this.scenarios.set('interest-rate-spike', {
      id: 'interest-rate-spike',
      name: 'Interest Rate Spike',
      description: 'Simulates a sudden increase in interest rates',
      factors: [
        { factorId: 'interest_rate', factorName: 'Interest Rates', shiftType: 'absolute', shiftValue: 2.0 },
        { factorId: 'market', factorName: 'Equity Market', shiftType: 'percentage', shiftValue: -0.15 },
        { factorId: 'credit', factorName: 'Credit Spreads', shiftType: 'absolute', shiftValue: 0.5 }
      ],
      isHistorical: false,
      probability: 0.15
    });
    
    // Inflation Surge
    this.scenarios.set('inflation-surge', {
      id: 'inflation-surge',
      name: 'Inflation Surge',
      description: 'Simulates a significant increase in inflation',
      factors: [
        { factorId: 'inflation', factorName: 'Inflation', shiftType: 'absolute', shiftValue: 5.0 },
        { factorId: 'interest_rate', factorName: 'Interest Rates', shiftType: 'absolute', shiftValue: 1.5 },
        { factorId: 'market', factorName: 'Equity Market', shiftType: 'percentage', shiftValue: -0.1 }
      ],
      isHistorical: false,
      probability: 0.2
    });
  }
  
  /**
   * Gets cache key for a risk metric
   * @param portfolioId Portfolio ID
   * @param metricType Metric type
   * @param params Calculation parameters
   * @returns Cache key
   */
  protected getCacheKey(portfolioId: string, metricType: RiskMetricType, params: RiskCalculationParams): string {
    return `${portfolioId}-${metricType}-${JSON.stringify(params)}`;
  }
  
  /**
   * Checks if cached result is still valid
   * @param result Cached result
   * @returns True if cache is valid
   */
  protected isCacheValid(result: RiskMetricResult): boolean {
    // Cache is valid for 1 hour
    const cacheValidityMs = 60 * 60 * 1000;
    return Date.now() - result.timestamp < cacheValidityMs;
  }
  
  /**
   * Gets VaR method from metric type
   * @param metricType Metric type
   * @returns VaR method
   */
  protected getVaRMethodFromMetricType(metricType: RiskMetricType): 'historical' | 'parametric' | 'monte_carlo' {
    switch (metricType) {
      case RiskMetricType.VAR_HISTORICAL:
        return 'historical';
      case RiskMetricType.VAR_PARAMETRIC:
        return 'parametric';
      case RiskMetricType.VAR_MONTE_CARLO:
        return 'monte_carlo';
      default:
        throw new Error(`Invalid metric type for VaR: ${metricType}`);
    }
  }
  
  /**
   * Creates a risk alert
   * @param alert Risk alert
   * @returns Created alert
   */
  protected createAlert(alert: RiskAlert): RiskAlert {
    // Generate ID if not provided
    if (!alert.id) {
      alert.id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Set timestamp if not provided
    if (!alert.timestamp) {
      alert.timestamp = Date.now();
    }
    
    // Add to alerts
    const portfolioAlerts = this.riskAlerts.get(alert.portfolioId) || [];
    portfolioAlerts.push(alert);
    this.riskAlerts.set(alert.portfolioId, portfolioAlerts);
    
    // Emit event
    this.emit('riskAlert', alert);
    
    return alert;
  }
}