import { MarketDataService } from '../market/MarketDataService';
import { StrategyBacktestService, BacktestConfig, BacktestResult, BacktestMetrics, BacktestDailyPerformance } from './StrategyBacktestService';
import { StrategyType } from './StrategyRecommendationService';

/**
 * Risk analysis result
 */
export interface RiskAnalysisResult {
  drawdownAnalysis: DrawdownAnalysis;
  volatilityAnalysis: VolatilityAnalysis;
  tailRiskAnalysis: TailRiskAnalysis;
  stressTestResults: StressTestResult[];
  correlationAnalysis: CorrelationAnalysis;
  riskMetrics: RiskMetrics;
  riskAttribution: RiskAttribution;
  liquidityAnalysis?: LiquidityAnalysis;
  riskDecomposition: RiskDecomposition;
}

/**
 * Drawdown analysis
 */
export interface DrawdownAnalysis {
  maxDrawdown: number;
  maxDrawdownDuration: number;
  averageDrawdown: number;
  averageDrawdownDuration: number;
  drawdownFrequency: number;
  recoveryFactor: number;
  painIndex: number;
  ulcerIndex: number;
  drawdownPeriods: Array<{
    startDate: Date;
    endDate: Date | null; // null if not yet recovered
    depth: number;
    duration: number;
    recoveryDate: Date | null; // null if not yet recovered
    recoveryDuration: number | null; // null if not yet recovered
  }>;
  drawdownDistribution: Array<{
    range: string;
    frequency: number;
    averageDuration: number;
  }>;
}

/**
 * Volatility analysis
 */
export interface VolatilityAnalysis {
  annualizedVolatility: number;
  rollingVolatility: Array<{
    date: Date;
    volatility: number;
  }>;
  volatilityRegimes: Array<{
    startDate: Date;
    endDate: Date;
    volatilityLevel: 'low' | 'medium' | 'high';
    averageVolatility: number;
    performance: number;
  }>;
  volatilityDistribution: Array<{
    range: string;
    frequency: number;
  }>;
  garch: {
    alpha: number;
    beta: number;
    omega: number;
    persistence: number;
    halfLife: number;
    forecastedVolatility: number;
  };
  impliedVsRealized: {
    averageImplied: number;
    averageRealized: number;
    correlation: number;
    volatilityRiskPremium: number;
  };
}

/**
 * Tail risk analysis
 */
export interface TailRiskAnalysis {
  valueAtRisk: {
    var95: number;
    var99: number;
    cvar95: number;
    cvar99: number;
    modifiedVar: number;
  };
  extremeEvents: Array<{
    date: Date;
    return: number;
    zscore: number;
    description: string;
  }>;
  tailRatio: number;
  skewness: number;
  kurtosis: number;
  jarqueBera: {
    statistic: number;
    pValue: number;
    isNormal: boolean;
  };
  downCapture: number;
  upCapture: number;
  worstDrawdowns: Array<{
    startDate: Date;
    endDate: Date;
    depth: number;
    duration: number;
    recoverDuration: number | null;
  }>;
}

/**
 * Stress test result
 */
export interface StressTestResult {
  scenarioName: string;
  scenarioDescription: string;
  scenarioPeriod?: {
    startDate: Date;
    endDate: Date;
  };
  benchmarkReturn: number;
  strategyReturn: number;
  maxDrawdown: number;
  volatility: number;
  recoveryTime: number | null;
  dailyPerformance?: Array<{
    date: Date;
    strategyReturn: number;
    benchmarkReturn: number;
    cumulativeStrategyReturn: number;
    cumulativeBenchmarkReturn: number;
  }>;
}

/**
 * Correlation analysis
 */
export interface CorrelationAnalysis {
  benchmarkCorrelation: number;
  rollingBenchmarkCorrelation: Array<{
    date: Date;
    correlation: number;
  }>;
  marketRegimeCorrelations: Array<{
    regime: string;
    correlation: number;
    description: string;
  }>;
  assetClassCorrelations: Record<string, number>;
  factorCorrelations: Record<string, number>;
  correlationMatrix: Array<{
    assetA: string;
    assetB: string;
    correlation: number;
  }>;
  betaAnalysis: {
    fullPeriodBeta: number;
    upMarketBeta: number;
    downMarketBeta: number;
    rollingBeta: Array<{
      date: Date;
      beta: number;
    }>;
  };
}

/**
 * Risk metrics
 */
export interface RiskMetrics {
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  sterlingRatio: number;
  informationRatio: number;
  treynorRatio: number;
  omega: number;
  gainToPainRatio: number;
  ulcerPerformanceIndex: number;
  riskAdjustedReturn: number;
  returnToVaR: number;
  returnToCVaR: number;
  modifiedSharpeRatio: number;
  downCapture: number;
  upCapture: number;
  captureRatio: number;
}

/**
 * Risk attribution
 */
export interface RiskAttribution {
  factorContribution: Array<{
    factor: string;
    contribution: number;
    tStatistic: number;
    pValue: number;
  }>;
  sectorContribution: Array<{
    sector: string;
    allocation: number;
    contribution: number;
  }>;
  assetContribution: Array<{
    asset: string;
    allocation: number;
    contribution: number;
    marginalContribution: number;
  }>;
  riskDecomposition: {
    systematic: number;
    specific: number;
    total: number;
  };
}

/**
 * Liquidity analysis
 */
export interface LiquidityAnalysis {
  averageDailyVolume: Record<string, number>;
  daysToLiquidate: Record<string, number>;
  marketImpact: Record<string, number>;
  liquidityRisk: 'low' | 'medium' | 'high';
  concentrationRisk: number;
  liquidityScore: number;
  liquidityByPosition: Array<{
    asset: string;
    position: number;
    adv: number;
    daysToLiquidate: number;
    marketImpact: number;
  }>;
}

/**
 * Risk decomposition
 */
export interface RiskDecomposition {
  byFactor: Record<string, number>;
  byAssetClass: Record<string, number>;
  byGeography: Record<string, number>;
  byTimeHorizon: Record<string, number>;
  byVolatilityRegime: Record<string, number>;
  byMarketRegime: Record<string, number>;
}

/**
 * Risk analysis configuration
 */
export interface RiskAnalysisConfig {
  strategyType: StrategyType;
  strategyParameters: Record<string, any>;
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  symbols: string[];
  benchmark: string;
  confidenceLevel: number;
  stressScenarios: string[];
  rollingWindowSize: number;
  includeFactorAnalysis: boolean;
  includeLiquidityAnalysis: boolean;
}

/**
 * Service for analyzing risks associated with trading strategies
 */
export class StrategyRiskAnalysisService {
  private backtestService: StrategyBacktestService;
  private marketDataService: MarketDataService;
  private riskAnalysisCache: Map<string, RiskAnalysisResult>;
  private readonly CACHE_TTL_MS = 86400000; // 24 hour cache TTL

  constructor(
    backtestService: StrategyBacktestService,
    marketDataService: MarketDataService
  ) {
    this.backtestService = backtestService;
    this.marketDataService = marketDataService;
    this.riskAnalysisCache = new Map();
  }

  /**
   * Analyze risks associated with a trading strategy
   * @param config Risk analysis configuration
   * @returns Risk analysis result
   */
  public async analyzeRisk(config: RiskAnalysisConfig): Promise<RiskAnalysisResult> {
    const cacheKey = this.generateCacheKey(config);
    const cachedResult = this.riskAnalysisCache.get(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }

    // Run backtest to get performance data
    const backtestConfig: BacktestConfig = {
      strategyType: config.strategyType,
      strategyParameters: config.strategyParameters,
      startDate: config.startDate,
      endDate: config.endDate,
      initialCapital: config.initialCapital,
      symbols: config.symbols,
      benchmark: config.benchmark
    };
    
    const backtestResult = await this.backtestService.runBacktest(backtestConfig);
    
    // Perform risk analysis
    const riskAnalysis: RiskAnalysisResult = {
      drawdownAnalysis: await this.analyzeDrawdowns(backtestResult),
      volatilityAnalysis: await this.analyzeVolatility(backtestResult, config),
      tailRiskAnalysis: await this.analyzeTailRisk(backtestResult, config),
      stressTestResults: await this.runStressTests(config),
      correlationAnalysis: await this.analyzeCorrelations(backtestResult, config),
      riskMetrics: this.calculateRiskMetrics(backtestResult),
      riskAttribution: await this.attributeRisk(backtestResult, config),
      riskDecomposition: await this.decomposeRisk(backtestResult, config)
    };
    
    // Add liquidity analysis if requested
    if (config.includeLiquidityAnalysis) {
      riskAnalysis.liquidityAnalysis = await this.analyzeLiquidity(backtestResult, config);
    }
    
    // Cache the result
    this.riskAnalysisCache.set(cacheKey, riskAnalysis);
    
    return riskAnalysis;
  }

  /**
   * Generate a cache key based on risk analysis configuration
   */
  private generateCacheKey(config: RiskAnalysisConfig): string {
    return JSON.stringify({
      strategyType: config.strategyType,
      strategyParameters: config.strategyParameters,
      startDate: config.startDate.toISOString(),
      endDate: config.endDate.toISOString(),
      initialCapital: config.initialCapital,
      symbols: config.symbols.sort(),
      benchmark: config.benchmark,
      confidenceLevel: config.confidenceLevel,
      stressScenarios: config.stressScenarios.sort(),
      rollingWindowSize: config.rollingWindowSize
    });
  }

  /**
   * Analyze drawdowns
   */
  private async analyzeDrawdowns(backtestResult: BacktestResult): Promise<DrawdownAnalysis> {
    const dailyPerformance = backtestResult.dailyPerformance;
    const drawdownPeriods: DrawdownAnalysis['drawdownPeriods'] = [];
    
    let inDrawdown = false;
    let drawdownStart: Date | null = null;
    let peakValue = dailyPerformance[0].equity;
    let currentDrawdown = 0;
    let drawdownDepth = 0;
    
    // Identify drawdown periods
    for (let i = 0; i < dailyPerformance.length; i++) {
      const day = dailyPerformance[i];
      
      if (day.equity > peakValue) {
        // New peak
        peakValue = day.equity;
        
        if (inDrawdown) {
          // End of drawdown
          const endDate = new Date(day.date);
          const startDate = new Date(drawdownStart!);
          const duration = this.calculateDaysBetween(startDate, endDate);
          
          drawdownPeriods.push({
            startDate,
            endDate,
            depth: drawdownDepth,
            duration,
            recoveryDate: endDate,
            recoveryDuration: duration
          });
          
          inDrawdown = false;
          drawdownStart = null;
          drawdownDepth = 0;
        }
      } else {
        // Calculate current drawdown
        currentDrawdown = (peakValue - day.equity) / peakValue;
        
        if (!inDrawdown && currentDrawdown > 0.01) { // 1% threshold to consider it a drawdown
          // Start of drawdown
          inDrawdown = true;
          drawdownStart = new Date(day.date);
          drawdownDepth = currentDrawdown;
        } else if (inDrawdown && currentDrawdown > drawdownDepth) {
          // Deeper drawdown
          drawdownDepth = currentDrawdown;
        }
      }
    }
    
    // If still in drawdown at the end
    if (inDrawdown) {
      const lastDay = dailyPerformance[dailyPerformance.length - 1];
      
      drawdownPeriods.push({
        startDate: new Date(drawdownStart!),
        endDate: null,
        depth: drawdownDepth,
        duration: this.calculateDaysBetween(new Date(drawdownStart!), new Date(lastDay.date)),
        recoveryDate: null,
        recoveryDuration: null
      });
    }
    
    // Calculate drawdown statistics
    const drawdownValues = drawdownPeriods.map(d => d.depth);
    const drawdownDurations = drawdownPeriods.map(d => d.duration);
    
    const maxDrawdown = Math.max(...drawdownValues, 0);
    const maxDrawdownPeriod = drawdownPeriods.find(d => d.depth === maxDrawdown);
    const maxDrawdownDuration = maxDrawdownPeriod ? maxDrawdownPeriod.duration : 0;
    
    const averageDrawdown = drawdownValues.length > 0 
      ? drawdownValues.reduce((sum, val) => sum + val, 0) / drawdownValues.length 
      : 0;
    
    const averageDrawdownDuration = drawdownDurations.length > 0 
      ? drawdownDurations.reduce((sum, val) => sum + val, 0) / drawdownDurations.length 
      : 0;
    
    const drawdownFrequency = drawdownPeriods.length / 
      (this.calculateDaysBetween(
        new Date(dailyPerformance[0].date), 
        new Date(dailyPerformance[dailyPerformance.length - 1].date)
      ) / 365);
    
    // Calculate recovery factor
    const totalReturn = (dailyPerformance[dailyPerformance.length - 1].equity / 
      dailyPerformance[0].equity) - 1;
    
    const recoveryFactor = maxDrawdown > 0 ? Math.abs(totalReturn / maxDrawdown) : 0;
    
    // Calculate pain index (average drawdown over time)
    const painIndex = dailyPerformance.reduce((sum, day) => 
      sum + day.drawdown, 0) / dailyPerformance.length;
    
    // Calculate ulcer index (root mean square of drawdowns)
    const ulcerIndex = Math.sqrt(
      dailyPerformance.reduce((sum, day) => 
        sum + Math.pow(day.drawdown, 2), 0) / dailyPerformance.length
    );
    
    // Create drawdown distribution
    const drawdownRanges = [
      { min: 0, max: 0.05, label: '0-5%' },
      { min: 0.05, max: 0.1, label: '5-10%' },
      { min: 0.1, max: 0.15, label: '10-15%' },
      { min: 0.15, max: 0.2, label: '15-20%' },
      { min: 0.2, max: 1, label: '20%+' }
    ];
    
    const drawdownDistribution = drawdownRanges.map(range => {
      const periodsInRange = drawdownPeriods.filter(
        d => d.depth >= range.min && d.depth < range.max
      );
      
      const frequency = periodsInRange.length;
      const durations = periodsInRange.map(d => d.duration);
      const averageDuration = durations.length > 0 
        ? durations.reduce((sum, val) => sum + val, 0) / durations.length 
        : 0;
      
      return {
        range: range.label,
        frequency,
        averageDuration
      };
    });
    
    return {
      maxDrawdown,
      maxDrawdownDuration,
      averageDrawdown,
      averageDrawdownDuration,
      drawdownFrequency,
      recoveryFactor,
      painIndex,
      ulcerIndex,
      drawdownPeriods,
      drawdownDistribution
    };
  }

  /**
   * Analyze volatility
   */
  private async analyzeVolatility(
    backtestResult: BacktestResult,
    config: RiskAnalysisConfig
  ): Promise<VolatilityAnalysis> {
    const dailyPerformance = backtestResult.dailyPerformance;
    const returns = dailyPerformance.map(day => day.dailyReturn);
    
    // Calculate annualized volatility
    const annualizedVolatility = this.calculateAnnualizedVolatility(returns);
    
    // Calculate rolling volatility
    const rollingWindowSize = config.rollingWindowSize || 20;
    const rollingVolatility: VolatilityAnalysis['rollingVolatility'] = [];
    
    for (let i = rollingWindowSize; i < dailyPerformance.length; i++) {
      const windowReturns = returns.slice(i - rollingWindowSize, i);
      const windowVolatility = this.calculateAnnualizedVolatility(windowReturns);
      
      rollingVolatility.push({
        date: new Date(dailyPerformance[i].date),
        volatility: windowVolatility
      });
    }
    
    // Identify volatility regimes
    const volatilityRegimes: VolatilityAnalysis['volatilityRegimes'] = [];
    let currentRegime: {
      startDate: Date;
      endDate: Date;
      volatilityLevel: 'low' | 'medium' | 'high';
      volatilities: number[];
      returns: number[];
    } | null = null;
    
    for (const point of rollingVolatility) {
      const volatilityLevel = this.getVolatilityLevel(point.volatility);
      
      if (!currentRegime) {
        // Start first regime
        currentRegime = {
          startDate: new Date(point.date),
          endDate: new Date(point.date),
          volatilityLevel,
          volatilities: [point.volatility],
          returns: []
        };
      } else if (volatilityLevel !== currentRegime.volatilityLevel) {
        // Regime change
        const regimeIndex = dailyPerformance.findIndex(
          day => new Date(day.date).getTime() >= currentRegime!.startDate.getTime()
        );
        
        const endIndex = dailyPerformance.findIndex(
          day => new Date(day.date).getTime() >= point.date.getTime()
        );
        
        // Calculate performance during this regime
        const startEquity = dailyPerformance[regimeIndex].equity;
        const endEquity = dailyPerformance[endIndex - 1].equity;
        const performance = (endEquity / startEquity) - 1;
        
        // Add completed regime
        volatilityRegimes.push({
          startDate: currentRegime.startDate,
          endDate: new Date(point.date),
          volatilityLevel: currentRegime.volatilityLevel,
          averageVolatility: currentRegime.volatilities.reduce((sum, val) => sum + val, 0) / 
            currentRegime.volatilities.length,
          performance
        });
        
        // Start new regime
        currentRegime = {
          startDate: new Date(point.date),
          endDate: new Date(point.date),
          volatilityLevel,
          volatilities: [point.volatility],
          returns: []
        };
      } else {
        // Continue current regime
        currentRegime.endDate = new Date(point.date);
        currentRegime.volatilities.push(point.volatility);
      }
    }
    
    // Add final regime if exists
    if (currentRegime) {
      const regimeIndex = dailyPerformance.findIndex(
        day => new Date(day.date).getTime() >= currentRegime!.startDate.getTime()
      );
      
      // Calculate performance during this regime
      const startEquity = dailyPerformance[regimeIndex].equity;
      const endEquity = dailyPerformance[dailyPerformance.length - 1].equity;
      const performance = (endEquity / startEquity) - 1;
      
      volatilityRegimes.push({
        startDate: currentRegime.startDate,
        endDate: currentRegime.endDate,
        volatilityLevel: currentRegime.volatilityLevel,
        averageVolatility: currentRegime.volatilities.reduce((sum, val) => sum + val, 0) / 
          currentRegime.volatilities.length,
        performance
      });
    }
    
    // Create volatility distribution
    const volatilityRanges = [
      { min: 0, max: 0.1, label: '0-10%' },
      { min: 0.1, max: 0.15, label: '10-15%' },
      { min: 0.15, max: 0.2, label: '15-20%' },
      { min: 0.2, max: 0.25, label: '20-25%' },
      { min: 0.25, max: 1, label: '25%+' }
    ];
    
    const volatilityDistribution = volatilityRanges.map(range => {
      const pointsInRange = rollingVolatility.filter(
        point => point.volatility >= range.min && point.volatility < range.max
      );
      
      return {
        range: range.label,
        frequency: pointsInRange.length
      };
    });
    
    // Calculate GARCH parameters (simplified)
    const garch = this.calculateSimplifiedGARCH(returns);
    
    // Calculate implied vs realized volatility (placeholder)
    const impliedVsRealized = {
      averageImplied: annualizedVolatility * 1.1, // Placeholder
      averageRealized: annualizedVolatility,
      correlation: 0.8, // Placeholder
      volatilityRiskPremium: 0.02 // Placeholder
    };
    
    return {
      annualizedVolatility,
      rollingVolatility,
      volatilityRegimes,
      volatilityDistribution,
      garch,
      impliedVsRealized
    };
  }

  /**
   * Analyze tail risk
   */
  private async analyzeTailRisk(
    backtestResult: BacktestResult,
    config: RiskAnalysisConfig
  ): Promise<TailRiskAnalysis> {
    const dailyPerformance = backtestResult.dailyPerformance;
    const returns = dailyPerformance.map(day => day.dailyReturn);
    
    // Sort returns for percentile calculations
    const sortedReturns = [...returns].sort((a, b) => a - b);
    
    // Calculate Value at Risk (VaR)
    const var95Index = Math.floor(sortedReturns.length * 0.05);
    const var99Index = Math.floor(sortedReturns.length * 0.01);
    
    const var95 = -sortedReturns[var95Index];
    const var99 = -sortedReturns[var99Index];
    
    // Calculate Conditional Value at Risk (CVaR)
    const cvar95 = -sortedReturns.slice(0, var95Index).reduce((sum, val) => sum + val, 0) / var95Index;
    const cvar99 = -sortedReturns.slice(0, var99Index).reduce((sum, val) => sum + val, 0) / var99Index;
    
    // Calculate Modified VaR (using Cornish-Fisher expansion)
    const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length;
    const variance = returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    const skewness = this.calculateSkewness(returns);
    const kurtosis = this.calculateKurtosis(returns);
    
    const z95 = 1.645; // 95% confidence z-score
    const modifiedZ95 = z95 + 
      (z95 * z95 - 1) * skewness / 6 + 
      (z95 * z95 * z95 - 3 * z95) * kurtosis / 24 - 
      (2 * z95 * z95 * z95 - 5 * z95) * Math.pow(skewness, 2) / 36;
    
    const modifiedVar = -(mean + modifiedZ95 * stdDev);
    
    // Identify extreme events
    const extremeEvents: TailRiskAnalysis['extremeEvents'] = [];
    
    for (let i = 0; i < returns.length; i++) {
      const returnValue = returns[i];
      const zScore = (returnValue - mean) / stdDev;
      
      if (Math.abs(zScore) > 2.5) {
        extremeEvents.push({
          date: new Date(dailyPerformance[i].date),
          return: returnValue,
          zscore: zScore,
          description: `${Math.abs(zScore).toFixed(1)} standard deviation ${returnValue < 0 ? 'loss' : 'gain'}`
        });
      }
    }
    
    // Calculate tail ratio
    const positiveReturns = returns.filter(r => r > 0);
    const negativeReturns = returns.filter(r => r < 0);
    
    const positiveStdDev = this.calculateStandardDeviation(positiveReturns);
    const negativeStdDev = this.calculateStandardDeviation(negativeReturns);
    
    const tailRatio = positiveStdDev / negativeStdDev;
    
    // Calculate Jarque-Bera test for normality
    const jbStatistic = returns.length * (
      Math.pow(skewness, 2) / 6 + 
      Math.pow(kurtosis - 3, 2) / 24
    );
    
    const jbPValue = this.approximateChiSquarePValue(jbStatistic, 2);
    const isNormal = jbPValue > 0.05;
    
    // Calculate up/down capture
    const benchmarkReturns = backtestResult.benchmarkPerformance?.dailyPerformance.map(
      day => day.dailyReturn
    ) || [];
    
    let upCapture = 0;
    let downCapture = 0;
    
    if (benchmarkReturns.length > 0) {
      const upMarketReturns = returns.filter((_, i) => benchmarkReturns[i] > 0);
      const downMarketReturns = returns.filter((_, i) => benchmarkReturns[i] < 0);
      
      const upMarketBenchmarkReturns = benchmarkReturns.filter(r => r > 0);
      const downMarketBenchmarkReturns = benchmarkReturns.filter(r => r < 0);
      
      const avgUpReturn = upMarketReturns.reduce((sum, val) => sum + val, 0) / upMarketReturns.length;
      const avgDownReturn = downMarketReturns.reduce((sum, val) => sum + val, 0) / downMarketReturns.length;
      
      const avgUpBenchmarkReturn = upMarketBenchmarkReturns.reduce((sum, val) => sum + val, 0) / 
        upMarketBenchmarkReturns.length;
      
      const avgDownBenchmarkReturn = downMarketBenchmarkReturns.reduce((sum, val) => sum + val, 0) / 
        downMarketBenchmarkReturns.length;
      
      upCapture = avgUpReturn / avgUpBenchmarkReturn;
      downCapture = avgDownReturn / avgDownBenchmarkReturn;
    }
    
    // Get worst drawdowns
    const drawdownAnalysis = await this.analyzeDrawdowns(backtestResult);
    const worstDrawdowns = [...drawdownAnalysis.drawdownPeriods]
      .sort((a, b) => b.depth - a.depth)
      .slice(0, 5);
    
    return {
      valueAtRisk: {
        var95,
        var99,
        cvar95,
        cvar99,
        modifiedVar
      },
      extremeEvents,
      tailRatio,
      skewness,
      kurtosis,
      jarqueBera: {
        statistic: jbStatistic,
        pValue: jbPValue,
        isNormal
      },
      downCapture,
      upCapture,
      worstDrawdowns
    };
  }

  /**
   * Run stress tests
   */
  private async runStressTests(config: RiskAnalysisConfig): Promise<StressTestResult[]> {
    const results: StressTestResult[] = [];
    
    // Define historical stress scenarios
    const scenarios = [
      {
        name: '2008 Financial Crisis',
        description: 'Global financial crisis triggered by the subprime mortgage crisis',
        startDate: new Date('2008-09-01'),
        endDate: new Date('2009-03-31')
      },
      {
        name: 'COVID-19 Crash',
        description: 'Market crash due to the COVID-19 pandemic',
        startDate: new Date('2020-02-19'),
        endDate: new Date('2020-03-23')
      },
      {
        name: '2018 Q4 Selloff',
        description: 'Market correction due to interest rate concerns and trade tensions',
        startDate: new Date('2018-10-01'),
        endDate: new Date('2018-12-24')
      },
      {
        name: '2010 Flash Crash',
        description: 'Rapid stock market crash and recovery',
        startDate: new Date('2010-05-06'),
        endDate: new Date('2010-05-06')
      },
      {
        name: '2011 Debt Ceiling Crisis',
        description: 'Market volatility due to US debt ceiling crisis',
        startDate: new Date('2011-07-22'),
        endDate: new Date('2011-08-08')
      }
    ];
    
    // Filter scenarios based on config
    const selectedScenarios = config.stressScenarios.length > 0
      ? scenarios.filter(s => config.stressScenarios.includes(s.name))
      : scenarios;
    
    // Run stress tests for each scenario
    for (const scenario of selectedScenarios) {
      try {
        // Create backtest config for this scenario
        const backtestConfig: BacktestConfig = {
          strategyType: config.strategyType,
          strategyParameters: config.strategyParameters,
          startDate: scenario.startDate,
          endDate: scenario.endDate,
          initialCapital: config.initialCapital,
          symbols: config.symbols,
          benchmark: config.benchmark
        };
        
        // Run backtest
        const backtestResult = await this.backtestService.runBacktest(backtestConfig);
        
        // Calculate stress test metrics
        const strategyReturn = backtestResult.metrics.totalReturn;
        const benchmarkReturn = backtestResult.benchmarkPerformance?.totalReturn || 0;
        const maxDrawdown = backtestResult.metrics.maxDrawdown;
        const volatility = backtestResult.metrics.volatility;
        
        // Calculate recovery time (if available in historical data)
        let recoveryTime: number | null = null;
        
        if (backtestResult.metrics.maxDrawdownDuration) {
          recoveryTime = backtestResult.metrics.maxDrawdownDuration;
        }
        
        // Create daily performance data
        const dailyPerformance = backtestResult.dailyPerformance.map((day, index) => {
          const benchmarkDay = backtestResult.benchmarkPerformance?.dailyPerformance[index];
          
          return {
            date: new Date(day.date),
            strategyReturn: day.dailyReturn,
            benchmarkReturn: benchmarkDay?.dailyReturn || 0,
            cumulativeStrategyReturn: (day.equity / backtestResult.dailyPerformance[0].equity) - 1,
            cumulativeBenchmarkReturn: benchmarkDay 
              ? (benchmarkDay.value / backtestResult.benchmarkPerformance!.dailyPerformance[0].value) - 1
              : 0
          };
        });
        
        // Add result
        results.push({
          scenarioName: scenario.name,
          scenarioDescription: scenario.description,
          scenarioPeriod: {
            startDate: scenario.startDate,
            endDate: scenario.endDate
          },
          benchmarkReturn,
          strategyReturn,
          maxDrawdown,
          volatility,
          recoveryTime,
          dailyPerformance
        });
      } catch (error) {
        console.error(`Error running stress test for scenario: ${scenario.name}`, error);
        
        // Add placeholder result
        results.push({
          scenarioName: scenario.name,
          scenarioDescription: scenario.description,
          scenarioPeriod: {
            startDate: scenario.startDate,
            endDate: scenario.endDate
          },
          benchmarkReturn: 0,
          strategyReturn: 0,
          maxDrawdown: 0,
          volatility: 0,
          recoveryTime: null
        });
      }
    }
    
    return results;
  }

  /**
   * Analyze correlations
   */
  private async analyzeCorrelations(
    backtestResult: BacktestResult,
    config: RiskAnalysisConfig
  ): Promise<CorrelationAnalysis> {
    const dailyPerformance = backtestResult.dailyPerformance;
    const returns = dailyPerformance.map(day => day.dailyReturn);
    
    // Get benchmark returns
    const benchmarkReturns = backtestResult.benchmarkPerformance?.dailyPerformance.map(
      day => day.dailyReturn
    ) || [];
    
    // Calculate benchmark correlation
    const benchmarkCorrelation = this.calculateCorrelation(returns, benchmarkReturns);
    
    // Calculate rolling benchmark correlation
    const rollingWindowSize = config.rollingWindowSize || 20;
    const rollingBenchmarkCorrelation: CorrelationAnalysis['rollingBenchmarkCorrelation'] = [];
    
    for (let i = rollingWindowSize; i < returns.length; i++) {
      const windowReturns = returns.slice(i - rollingWindowSize, i);
      const windowBenchmarkReturns = benchmarkReturns.slice(i - rollingWindowSize, i);
      
      const correlation = this.calculateCorrelation(windowReturns, windowBenchmarkReturns);
      
      rollingBenchmarkCorrelation.push({
        date: new Date(dailyPerformance[i].date),
        correlation
      });
    }
    
    // Calculate market regime correlations
    const marketRegimeCorrelations: CorrelationAnalysis['marketRegimeCorrelations'] = [
      {
        regime: 'Bull Market',
        correlation: this.calculateRegimeCorrelation(returns, benchmarkReturns, 'bull'),
        description: 'Correlation during periods of rising markets'
      },
      {
        regime: 'Bear Market',
        correlation: this.calculateRegimeCorrelation(returns, benchmarkReturns, 'bear'),
        description: 'Correlation during periods of falling markets'
      },
      {
        regime: 'High Volatility',
        correlation: this.calculateRegimeCorrelation(returns, benchmarkReturns, 'high_vol'),
        description: 'Correlation during periods of high market volatility'
      },
      {
        regime: 'Low Volatility',
        correlation: this.calculateRegimeCorrelation(returns, benchmarkReturns, 'low_vol'),
        description: 'Correlation during periods of low market volatility'
      }
    ];
    
    // Calculate asset class correlations (placeholder)
    const assetClassCorrelations: Record<string, number> = {
      equities: 0.8,
      bonds: -0.3,
      commodities: 0.4,
      currencies: 0.1,
      real_estate: 0.6
    };
    
    // Calculate factor correlations (placeholder)
    const factorCorrelations: Record<string, number> = {
      market: 0.7,
      size: 0.3,
      value: 0.2,
      momentum: 0.5,
      quality: 0.4,
      volatility: -0.3
    };
    
    // Calculate correlation matrix (placeholder)
    const correlationMatrix: CorrelationAnalysis['correlationMatrix'] = [
      { assetA: 'strategy', assetB: 'benchmark', correlation: benchmarkCorrelation },
      { assetA: 'strategy', assetB: 'bonds', correlation: -0.3 },
      { assetA: 'strategy', assetB: 'gold', correlation: 0.2 },
      { assetA: 'benchmark', assetB: 'bonds', correlation: -0.4 },
      { assetA: 'benchmark', assetB: 'gold', correlation: 0.1 }
    ];
    
    // Calculate beta analysis
    const fullPeriodBeta = this.calculateBeta(returns, benchmarkReturns);
    
    const upMarketReturns = returns.filter((_, i) => benchmarkReturns[i] > 0);
    const upMarketBenchmarkReturns = benchmarkReturns.filter(r => r > 0);
    const upMarketBeta = this.calculateBeta(upMarketReturns, upMarketBenchmarkReturns);
    
    const downMarketReturns = returns.filter((_, i) => benchmarkReturns[i] < 0);
    const downMarketBenchmarkReturns = benchmarkReturns.filter(r => r < 0);
    const downMarketBeta = this.calculateBeta(downMarketReturns, downMarketBenchmarkReturns);
    
    // Calculate rolling beta
    const rollingBeta: CorrelationAnalysis['betaAnalysis']['rollingBeta'] = [];
    
    for (let i = rollingWindowSize; i < returns.length; i++) {
      const windowReturns = returns.slice(i - rollingWindowSize, i);
      const windowBenchmarkReturns = benchmarkReturns.slice(i - rollingWindowSize, i);
      
      const beta = this.calculateBeta(windowReturns, windowBenchmarkReturns);
      
      rollingBeta.push({
        date: new Date(dailyPerformance[i].date),
        beta
      });
    }
    
    return {
      benchmarkCorrelation,
      rollingBenchmarkCorrelation,
      marketRegimeCorrelations,
      assetClassCorrelations,
      factorCorrelations,
      correlationMatrix,
      betaAnalysis: {
        fullPeriodBeta,
        upMarketBeta,
        downMarketBeta,
        rollingBeta
      }
    };
  }

  /**
   * Calculate risk metrics
   */
  private calculateRiskMetrics(backtestResult: BacktestResult): RiskMetrics {
    const metrics = backtestResult.metrics;
    const dailyPerformance = backtestResult.dailyPerformance;
    const returns = dailyPerformance.map(day => day.dailyReturn);
    
    // Get benchmark returns
    const benchmarkReturns = backtestResult.benchmarkPerformance?.dailyPerformance.map(
      day => day.dailyReturn
    ) || [];
    
    // Calculate Sharpe ratio (already in metrics)
    const sharpeRatio = metrics.sharpeRatio;
    
    // Calculate Sortino ratio (already in metrics)
    const sortinoRatio = metrics.sortinoRatio;
    
    // Calculate Calmar ratio (already in metrics)
    const calmarRatio = metrics.calmarRatio;
    
    // Calculate Sterling ratio
    const averageAnnualReturn = Math.pow(1 + metrics.totalReturn, 365 / dailyPerformance.length) - 1;
    const sterlingRatio = averageAnnualReturn / metrics.maxDrawdown;
    
    // Calculate Information ratio
    let informationRatio = 0;
    
    if (benchmarkReturns.length > 0) {
      const excessReturns = returns.map((r, i) => r - benchmarkReturns[i]);
      const trackingError = this.calculateAnnualizedVolatility(excessReturns);
      const averageExcessReturn = excessReturns.reduce((sum, val) => sum + val, 0) / excessReturns.length;
      const annualizedExcessReturn = averageExcessReturn * 252;
      
      informationRatio = annualizedExcessReturn / trackingError;
    }
    
    // Calculate Treynor ratio
    const beta = this.calculateBeta(returns, benchmarkReturns);
    const riskFreeRate = 0.02 / 252; // Placeholder for daily risk-free rate
    const excessReturn = metrics.annualizedReturn - (riskFreeRate * 252);
    const treynorRatio = beta !== 0 ? excessReturn / beta : 0;
    
    // Calculate Omega ratio
    const threshold = 0;
    const positiveReturns = returns.filter(r => r > threshold);
    const negativeReturns = returns.filter(r => r <= threshold);
    
    const positiveSum = positiveReturns.reduce((sum, val) => sum + val, 0);
    const negativeSum = Math.abs(negativeReturns.reduce((sum, val) => sum + val, 0));
    
    const omega = negativeSum > 0 ? positiveSum / negativeSum : positiveSum > 0 ? Infinity : 0;
    
    // Calculate Gain to Pain ratio
    const monthlyReturns: number[] = [];
    let currentMonth = -1;
    let monthlyReturn = 0;
    
    for (let i = 0; i < dailyPerformance.length; i++) {
      const date = new Date(dailyPerformance[i].date);
      const month = date.getMonth();
      
      if (currentMonth === -1) {
        currentMonth = month;
        monthlyReturn = dailyPerformance[i].dailyReturn;
      } else if (month !== currentMonth) {
        monthlyReturns.push(monthlyReturn);
        currentMonth = month;
        monthlyReturn = dailyPerformance[i].dailyReturn;
      } else {
        monthlyReturn = (1 + monthlyReturn) * (1 + dailyPerformance[i].dailyReturn) - 1;
      }
    }
    
    // Add the last month
    if (monthlyReturns.length > 0) {
      monthlyReturns.push(monthlyReturn);
    }
    
    const positiveMonthlySum = monthlyReturns.filter(r => r > 0).reduce((sum, val) => sum + val, 0);
    const negativeMonthlySum = Math.abs(monthlyReturns.filter(r => r < 0).reduce((sum, val) => sum + val, 0));
    
    const gainToPainRatio = negativeMonthlySum > 0 ? positiveMonthlySum / negativeMonthlySum : 
      positiveMonthlySum > 0 ? Infinity : 0;
    
    // Calculate Ulcer Performance Index
    const ulcerIndex = Math.sqrt(
      dailyPerformance.reduce((sum, day) => 
        sum + Math.pow(day.drawdown, 2), 0) / dailyPerformance.length
    );
    
    const ulcerPerformanceIndex = ulcerIndex > 0 ? (metrics.annualizedReturn - riskFreeRate * 252) / ulcerIndex : 0;
    
    // Calculate Risk-Adjusted Return
    const riskAdjustedReturn = metrics.annualizedReturn / metrics.volatility;
    
    // Calculate Return to VaR
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const var95Index = Math.floor(sortedReturns.length * 0.05);
    const var95 = -sortedReturns[var95Index];
    
    const returnToVaR = var95 > 0 ? metrics.annualizedReturn / var95 : 0;
    
    // Calculate Return to CVaR
    const cvar95 = -sortedReturns.slice(0, var95Index).reduce((sum, val) => sum + val, 0) / var95Index;
    const returnToCVaR = cvar95 > 0 ? metrics.annualizedReturn / cvar95 : 0;
    
    // Calculate Modified Sharpe Ratio
    const skewness = this.calculateSkewness(returns);
    const kurtosis = this.calculateKurtosis(returns);
    
    const modifiedSharpeRatio = sharpeRatio * (1 + skewness * sharpeRatio / 6 - kurtosis * Math.pow(sharpeRatio, 2) / 24);
    
    // Calculate Up/Down Capture
    let upCapture = 0;
    let downCapture = 0;
    
    if (benchmarkReturns.length > 0) {
      const upMarketReturns = returns.filter((_, i) => benchmarkReturns[i] > 0);
      const downMarketReturns = returns.filter((_, i) => benchmarkReturns[i] < 0);
      
      const upMarketBenchmarkReturns = benchmarkReturns.filter(r => r > 0);
      const downMarketBenchmarkReturns = benchmarkReturns.filter(r => r < 0);
      
      const avgUpReturn = upMarketReturns.reduce((sum, val) => sum + val, 0) / upMarketReturns.length;
      const avgDownReturn = downMarketReturns.reduce((sum, val) => sum + val, 0) / downMarketReturns.length;
      
      const avgUpBenchmarkReturn = upMarketBenchmarkReturns.reduce((sum, val) => sum + val, 0) / 
        upMarketBenchmarkReturns.length;
      
      const avgDownBenchmarkReturn = downMarketBenchmarkReturns.reduce((sum, val) => sum + val, 0) / 
        downMarketBenchmarkReturns.length;
      
      upCapture = avgUpReturn / avgUpBenchmarkReturn;
      downCapture = avgDownReturn / avgDownBenchmarkReturn;
    }
    
    // Calculate Capture Ratio
    const captureRatio = downCapture !== 0 ? Math.abs(upCapture / downCapture) : 0;
    
    return {
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
      sterlingRatio,
      informationRatio,
      treynorRatio,
      omega,
      gainToPainRatio,
      ulcerPerformanceIndex,
      riskAdjustedReturn,
      returnToVaR,
      returnToCVaR,
      modifiedSharpeRatio,
      downCapture,
      upCapture,
      captureRatio
    };
  }

  /**
   * Attribute risk
   */
  private async attributeRisk(
    backtestResult: BacktestResult,
    config: RiskAnalysisConfig
  ): Promise<RiskAttribution> {
    // This would implement a more sophisticated risk attribution model
    // For now, return placeholder data
    
    // Factor contribution (placeholder)
    const factorContribution: RiskAttribution['factorContribution'] = [
      {
        factor: 'Market',
        contribution: 0.65,
        tStatistic: 8.2,
        pValue: 0.0001
      },
      {
        factor: 'Size',
        contribution: 0.12,
        tStatistic: 3.4,
        pValue: 0.0008
      },
      {
        factor: 'Value',
        contribution: 0.08,
        tStatistic: 2.1,
        pValue: 0.037
      },
      {
        factor: 'Momentum',
        contribution: 0.15,
        tStatistic: 3.8,
        pValue: 0.0002
      },
      {
        factor: 'Specific',
        contribution: 0.10,
        tStatistic: 1.5,
        pValue: 0.134
      }
    ];
    
    // Sector contribution (placeholder)
    const sectorContribution: RiskAttribution['sectorContribution'] = [
      {
        sector: 'Technology',
        allocation: 0.25,
        contribution: 0.40
      },
      {
        sector: 'Healthcare',
        allocation: 0.18,
        contribution: 0.15
      },
      {
        sector: 'Financials',
        allocation: 0.15,
        contribution: 0.10
      },
      {
        sector: 'Consumer Discretionary',
        allocation: 0.12,
        contribution: 0.20
      },
      {
        sector: 'Industrials',
        allocation: 0.10,
        contribution: 0.08
      },
      {
        sector: 'Other',
        allocation: 0.20,
        contribution: 0.07
      }
    ];
    
    // Asset contribution (placeholder)
    const assetContribution: RiskAttribution['assetContribution'] = [
      {
        asset: 'AAPL',
        allocation: 0.08,
        contribution: 0.15,
        marginalContribution: 0.12
      },
      {
        asset: 'MSFT',
        allocation: 0.07,
        contribution: 0.12,
        marginalContribution: 0.10
      },
      {
        asset: 'AMZN',
        allocation: 0.06,
        contribution: 0.10,
        marginalContribution: 0.09
      },
      {
        asset: 'GOOGL',
        allocation: 0.05,
        contribution: 0.08,
        marginalContribution: 0.07
      },
      {
        asset: 'FB',
        allocation: 0.04,
        contribution: 0.07,
        marginalContribution: 0.06
      }
    ];
    
    // Risk decomposition
    const riskDecomposition: RiskAttribution['riskDecomposition'] = {
      systematic: 0.75,
      specific: 0.25,
      total: 1.0
    };
    
    return {
      factorContribution,
      sectorContribution,
      assetContribution,
      riskDecomposition
    };
  }

  /**
   * Analyze liquidity
   */
  private async analyzeLiquidity(
    backtestResult: BacktestResult,
    config: RiskAnalysisConfig
  ): Promise<LiquidityAnalysis> {
    // This would implement a more sophisticated liquidity analysis
    // For now, return placeholder data
    
    // Average daily volume (placeholder)
    const averageDailyVolume: Record<string, number> = {};
    
    for (const symbol of config.symbols) {
      averageDailyVolume[symbol] = 1000000 + Math.random() * 9000000;
    }
    
    // Days to liquidate (placeholder)
    const daysToLiquidate: Record<string, number> = {};
    const marketImpact: Record<string, number> = {};
    const liquidityByPosition: LiquidityAnalysis['liquidityByPosition'] = [];
    
    for (const symbol of config.symbols) {
      const position = 100000 + Math.random() * 900000;
      const adv = averageDailyVolume[symbol];
      const daysToLiq = position / (adv * 0.1); // Assume can trade 10% of ADV
      const impact = 0.0001 * Math.sqrt(position / adv);
      
      daysToLiquidate[symbol] = daysToLiq;
      marketImpact[symbol] = impact;
      
      liquidityByPosition.push({
        asset: symbol,
        position,
        adv,
        daysToLiquidate: daysToLiq,
        marketImpact: impact
      });
    }
    
    // Calculate overall liquidity metrics
    const avgDaysToLiquidate = Object.values(daysToLiquidate).reduce((sum, val) => sum + val, 0) / 
      Object.values(daysToLiquidate).length;
    
    const maxDaysToLiquidate = Math.max(...Object.values(daysToLiquidate));
    
    let liquidityRisk: 'low' | 'medium' | 'high' = 'low';
    
    if (maxDaysToLiquidate > 5) {
      liquidityRisk = 'high';
    } else if (maxDaysToLiquidate > 2) {
      liquidityRisk = 'medium';
    }
    
    // Calculate concentration risk
    const totalPosition = liquidityByPosition.reduce((sum, pos) => sum + pos.position, 0);
    const positionWeights = liquidityByPosition.map(pos => pos.position / totalPosition);
    const concentrationRisk = Math.sqrt(positionWeights.reduce((sum, w) => sum + w * w, 0));
    
    // Calculate liquidity score (0-100, higher is better)
    const liquidityScore = Math.max(0, Math.min(100, 100 - (avgDaysToLiquidate * 10) - (concentrationRisk * 50)));
    
    return {
      averageDailyVolume,
      daysToLiquidate,
      marketImpact,
      liquidityRisk,
      concentrationRisk,
      liquidityScore,
      liquidityByPosition
    };
  }

  /**
   * Decompose risk
   */
  private async decomposeRisk(
    backtestResult: BacktestResult,
    config: RiskAnalysisConfig
  ): Promise<RiskDecomposition> {
    // This would implement a more sophisticated risk decomposition
    // For now, return placeholder data
    
    return {
      byFactor: {
        market: 0.45,
        size: 0.15,
        value: 0.10,
        momentum: 0.20,
        quality: 0.05,
        specific: 0.05
      },
      byAssetClass: {
        equities: 0.70,
        fixed_income: 0.15,
        commodities: 0.10,
        currencies: 0.05
      },
      byGeography: {
        north_america: 0.60,
        europe: 0.20,
        asia_pacific: 0.15,
        emerging_markets: 0.05
      },
      byTimeHorizon: {
        short_term: 0.25,
        medium_term: 0.45,
        long_term: 0.30
      },
      byVolatilityRegime: {
        low_volatility: 0.30,
        medium_volatility: 0.40,
        high_volatility: 0.30
      },
      byMarketRegime: {
        bull_market: 0.40,
        bear_market: 0.30,
        sideways_market: 0.30
      }
    };
  }

  /**
   * Calculate days between two dates
   */
  private calculateDaysBetween(startDate: Date, endDate: Date): number {
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    return Math.round(Math.abs((startDate.getTime() - endDate.getTime()) / oneDay));
  }

  /**
   * Calculate annualized volatility from an array of returns
   */
  private calculateAnnualizedVolatility(returns: number[]): number {
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) / returns.length;
    return Math.sqrt(variance * 252); // Annualize daily volatility
  }

  /**
   * Get volatility level based on annualized volatility
   */
  private getVolatilityLevel(volatility: number): 'low' | 'medium' | 'high' {
    if (volatility < 0.15) {
      return 'low';
    } else if (volatility < 0.25) {
      return 'medium';
    } else {
      return 'high';
    }
  }

  /**
   * Calculate simplified GARCH parameters
   */
  private calculateSimplifiedGARCH(returns: number[]): VolatilityAnalysis['garch'] {
    // This is a very simplified GARCH(1,1) approximation
    // A real implementation would use maximum likelihood estimation
    
    // Calculate variance
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) / returns.length;
    
    // Placeholder GARCH parameters
    const alpha = 0.1;
    const beta = 0.8;
    const omega = variance * (1 - alpha - beta);
    const persistence = alpha + beta;
    const halfLife = Math.log(0.5) / Math.log(persistence);
    
    // Calculate forecasted volatility
    const lastReturn = returns[returns.length - 1];
    const lastVariance = variance;
    const forecastedVariance = omega + alpha * Math.pow(lastReturn, 2) + beta * lastVariance;
    const forecastedVolatility = Math.sqrt(forecastedVariance * 252);
    
    return {
      alpha,
      beta,
      omega,
      persistence,
      halfLife,
      forecastedVolatility
    };
  }

  /**
   * Calculate skewness of an array of returns
   */
  private calculateSkewness(returns: number[]): number {
    const n = returns.length;
    const mean = returns.reduce((sum, val) => sum + val, 0) / n;
    const variance = returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return 0;
    
    const cubedDeviations = returns.map(val => Math.pow((val - mean) / stdDev, 3));
    return cubedDeviations.reduce((sum, val) => sum + val, 0) / n;
  }

  /**
   * Calculate kurtosis of an array of returns
   */
  private calculateKurtosis(returns: number[]): number {
    const n = returns.length;
    const mean = returns.reduce((sum, val) => sum + val, 0) / n;
    const variance = returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return 3; // Normal distribution kurtosis
    
    const fourthPowerDeviations = returns.map(val => Math.pow((val - mean) / stdDev, 4));
    return fourthPowerDeviations.reduce((sum, val) => sum + val, 0) / n;
  }

  /**
   * Approximate chi-square p-value
   */
  private approximateChiSquarePValue(chiSquare: number, df: number): number {
    // This is a very rough approximation
    // A real implementation would use a proper chi-square distribution function
    
    if (chiSquare <= df) {
      return 1 - 0.5 * (chiSquare / df);
    } else {
      return Math.exp(-0.5 * (chiSquare - df));
    }
  }

  /**
   * Calculate correlation between two arrays
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) {
      return 0;
    }
    
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

  /**
   * Calculate regime correlation
   */
  private calculateRegimeCorrelation(
    returns: number[],
    benchmarkReturns: number[],
    regime: 'bull' | 'bear' | 'high_vol' | 'low_vol'
  ): number {
    if (returns.length !== benchmarkReturns.length || returns.length === 0) {
      return 0;
    }
    
    // Filter returns based on regime
    const filteredIndices: number[] = [];
    
    if (regime === 'bull') {
      // Bull market: benchmark returns > 0
      for (let i = 0; i < benchmarkReturns.length; i++) {
        if (benchmarkReturns[i] > 0) {
          filteredIndices.push(i);
        }
      }
    } else if (regime === 'bear') {
      // Bear market: benchmark returns < 0
      for (let i = 0; i < benchmarkReturns.length; i++) {
        if (benchmarkReturns[i] < 0) {
          filteredIndices.push(i);
        }
      }
    } else if (regime === 'high_vol' || regime === 'low_vol') {
      // Calculate rolling volatility
      const windowSize = 20;
      const rollingVol: number[] = [];
      
      for (let i = windowSize; i < benchmarkReturns.length; i++) {
        const windowReturns = benchmarkReturns.slice(i - windowSize, i);
        const variance = windowReturns.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) / windowSize;
        rollingVol.push(Math.sqrt(variance));
      }
      
      // Calculate median volatility
      const sortedVol = [...rollingVol].sort((a, b) => a - b);
      const medianVol = sortedVol[Math.floor(sortedVol.length / 2)];
      
      // Filter based on volatility regime
      for (let i = windowSize; i < benchmarkReturns.length; i++) {
        if ((regime === 'high_vol' && rollingVol[i - windowSize] > medianVol) ||
            (regime === 'low_vol' && rollingVol[i - windowSize] <= medianVol)) {
          filteredIndices.push(i);
        }
      }
    }
    
    // If no data points match the regime, return 0
    if (filteredIndices.length === 0) {
      return 0;
    }
    
    // Extract regime returns
    const regimeReturns = filteredIndices.map(i => returns[i]);
    const regimeBenchmarkReturns = filteredIndices.map(i => benchmarkReturns[i]);
    
    // Calculate correlation
    return this.calculateCorrelation(regimeReturns, regimeBenchmarkReturns);
  }

  /**
   * Calculate beta
   */
  private calculateBeta(returns: number[], benchmarkReturns: number[]): number {
    if (returns.length !== benchmarkReturns.length || returns.length === 0) {
      return 0;
    }
    
    // Calculate covariance
    const n = returns.length;
    const returnsMean = returns.reduce((sum, val) => sum + val, 0) / n;
    const benchmarkMean = benchmarkReturns.reduce((sum, val) => sum + val, 0) / n;
    
    let covariance = 0;
    let benchmarkVariance = 0;
    
    for (let i = 0; i < n; i++) {
      covariance += (returns[i] - returnsMean) * (benchmarkReturns[i] - benchmarkMean);
      benchmarkVariance += Math.pow(benchmarkReturns[i] - benchmarkMean, 2);
    }
    
    covariance /= n;
    benchmarkVariance /= n;
    
    // Calculate beta
    return benchmarkVariance > 0 ? covariance / benchmarkVariance : 0;
  }

  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance);
  }
}