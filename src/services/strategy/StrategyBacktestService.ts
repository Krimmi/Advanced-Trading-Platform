/**
 * StrategyBacktestService - Backtesting service for trading strategies
 * 
 * This service provides functionality for backtesting trading strategies with
 * historical market data, evaluating performance, and optimizing parameters.
 */

import axios from 'axios';
import { 
  StrategyBacktestResult,
  StrategyOptimizationResult,
  Timeframe,
  TradingStrategy,
  StrategyPerformanceMetrics,
  MarketCondition
} from '../../models/strategy/StrategyTypes';

export class StrategyBacktestService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly backtestCache: Map<string, StrategyBacktestResult>;
  private readonly optimizationCache: Map<string, StrategyOptimizationResult>;
  private readonly marketDataCache: Map<string, any>;

  constructor(apiKey: string, baseUrl: string = 'https://api.ninjatechfinance.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.backtestCache = new Map<string, StrategyBacktestResult>();
    this.optimizationCache = new Map<string, StrategyOptimizationResult>();
    this.marketDataCache = new Map<string, any>();
  }

  /**
   * Run a backtest for a strategy
   * @param strategyId The ID of the strategy to backtest
   * @param ticker The ticker symbol to backtest on
   * @param parameters Strategy parameters for the backtest
   * @param startDate Start date for the backtest
   * @param endDate End date for the backtest
   * @param initialCapital Initial capital for the backtest (default: 100000)
   * @returns Promise with backtest results
   */
  public async runBacktest(
    strategyId: string,
    ticker: string,
    parameters: Record<string, any>,
    startDate: Date,
    endDate: Date,
    initialCapital: number = 100000
  ): Promise<StrategyBacktestResult> {
    try {
      // Generate cache key
      const cacheKey = `${strategyId}_${ticker}_${JSON.stringify(parameters)}_${startDate.toISOString()}_${endDate.toISOString()}_${initialCapital}`;
      
      // Check cache first
      if (this.backtestCache.has(cacheKey)) {
        return this.backtestCache.get(cacheKey)!;
      }
      
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

      const result = response.data;
      
      // Update cache
      this.backtestCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error(`Error backtesting strategy ${strategyId}:`, error);
      
      // Fallback to local backtesting if possible
      return this.runLocalBacktest(strategyId, ticker, parameters, startDate, endDate, initialCapital);
    }
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
   * Run walk-forward analysis for a strategy
   * @param strategyId The ID of the strategy to analyze
   * @param ticker The ticker symbol to analyze
   * @param parameters Strategy parameters
   * @param startDate Start date for analysis
   * @param endDate End date for analysis
   * @param windowSize Size of each window in days
   * @param trainSize Percentage of window to use for training (0-1)
   * @returns Promise with walk-forward analysis results
   */
  public async runWalkForwardAnalysis(
    strategyId: string,
    ticker: string,
    parameters: Record<string, any>,
    startDate: Date,
    endDate: Date,
    windowSize: number = 180,
    trainSize: number = 0.7
  ): Promise<{
    periods: {
      trainStart: Date;
      trainEnd: Date;
      testStart: Date;
      testEnd: Date;
      trainPerformance: StrategyPerformanceMetrics;
      testPerformance: StrategyPerformanceMetrics;
      parameters: Record<string, any>;
    }[];
    overallPerformance: StrategyPerformanceMetrics;
    robustness: number; // 0-100 scale
  }> {
    try {
      // Call the API for walk-forward analysis
      const response = await axios.post(`${this.baseUrl}/strategies/${strategyId}/walk-forward`, {
        ticker,
        parameters,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        windowSize,
        trainSize
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data;
    } catch (error) {
      console.error(`Error running walk-forward analysis for strategy ${strategyId}:`, error);
      throw new Error(`Failed to run walk-forward analysis for strategy ${strategyId}`);
    }
  }

  /**
   * Compare multiple strategies on the same ticker
   * @param strategyIds Array of strategy IDs to compare
   * @param ticker The ticker symbol to compare on
   * @param parameters Parameters for each strategy (keyed by strategy ID)
   * @param startDate Start date for comparison
   * @param endDate End date for comparison
   * @returns Promise with comparison results
   */
  public async compareStrategies(
    strategyIds: string[],
    ticker: string,
    parameters: Record<string, Record<string, any>>,
    startDate: Date,
    endDate: Date
  ): Promise<{
    strategies: {
      strategyId: string;
      name: string;
      performance: StrategyPerformanceMetrics;
      equityCurve: { date: Date; equity: number }[];
    }[];
    benchmark: {
      ticker: string;
      performance: StrategyPerformanceMetrics;
      equityCurve: { date: Date; equity: number }[];
    };
    correlationMatrix: number[][];
    bestStrategy: string;
    worstStrategy: string;
    marketConditions: {
      condition: MarketCondition;
      period: { start: Date; end: Date };
      bestStrategy: string;
      worstStrategy: string;
    }[];
  }> {
    try {
      // Call the API for strategy comparison
      const response = await axios.post(`${this.baseUrl}/strategies/compare`, {
        strategyIds,
        ticker,
        parameters,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }, {
        headers: { 'X-API-KEY': this.apiKey }
      });

      return response.data;
    } catch (error) {
      console.error(`Error comparing strategies:`, error);
      throw new Error(`Failed to compare strategies`);
    }
  }

  /**
   * Get historical market data for a ticker
   * @param ticker The ticker symbol
   * @param startDate Start date
   * @param endDate End date
   * @param timeframe Timeframe for the data
   * @returns Promise with market data
   */
  public async getMarketData(
    ticker: string,
    startDate: Date,
    endDate: Date,
    timeframe: Timeframe = Timeframe.DAILY
  ): Promise<{
    ticker: string;
    timeframe: Timeframe;
    data: {
      date: Date;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
      adjustedClose: number;
    }[];
  }> {
    try {
      // Generate cache key
      const cacheKey = `${ticker}_${timeframe}_${startDate.toISOString()}_${endDate.toISOString()}`;
      
      // Check cache first
      if (this.marketDataCache.has(cacheKey)) {
        return this.marketDataCache.get(cacheKey);
      }
      
      // Call the API for market data
      const response = await axios.get(`${this.baseUrl}/market-data/${ticker}`, {
        headers: { 'X-API-KEY': this.apiKey },
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          timeframe
        }
      });

      const result = response.data;
      
      // Convert date strings to Date objects
      result.data = result.data.map((bar: any) => ({
        ...bar,
        date: new Date(bar.date)
      }));
      
      // Update cache
      this.marketDataCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error(`Error fetching market data for ${ticker}:`, error);
      throw new Error(`Failed to fetch market data for ${ticker}`);
    }
  }

  /**
   * Detect market conditions in a given period
   * @param ticker The ticker symbol
   * @param startDate Start date
   * @param endDate End date
   * @returns Promise with detected market conditions
   */
  public async detectMarketConditions(
    ticker: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    ticker: string;
    periods: {
      condition: MarketCondition;
      startDate: Date;
      endDate: Date;
      confidence: number; // 0-100 scale
    }[];
  }> {
    try {
      // Call the API for market condition detection
      const response = await axios.get(`${this.baseUrl}/market-conditions/${ticker}`, {
        headers: { 'X-API-KEY': this.apiKey },
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });

      const result = response.data;
      
      // Convert date strings to Date objects
      result.periods = result.periods.map((period: any) => ({
        ...period,
        startDate: new Date(period.startDate),
        endDate: new Date(period.endDate)
      }));
      
      return result;
    } catch (error) {
      console.error(`Error detecting market conditions for ${ticker}:`, error);
      throw new Error(`Failed to detect market conditions for ${ticker}`);
    }
  }

  /**
   * Calculate performance metrics from equity curve
   * @param equityCurve Array of equity values
   * @param benchmark Optional benchmark equity curve for comparison
   * @returns Performance metrics
   */
  public calculatePerformanceMetrics(
    equityCurve: { date: Date; equity: number }[],
    benchmark?: { date: Date; equity: number }[]
  ): StrategyPerformanceMetrics {
    // Calculate returns
    const returns: number[] = [];
    for (let i = 1; i < equityCurve.length; i++) {
      const returnPct = (equityCurve[i].equity / equityCurve[i-1].equity) - 1;
      returns.push(returnPct);
    }
    
    // Calculate benchmark returns if provided
    const benchmarkReturns: number[] = [];
    if (benchmark) {
      for (let i = 1; i < benchmark.length; i++) {
        const returnPct = (benchmark[i].equity / benchmark[i-1].equity) - 1;
        benchmarkReturns.push(returnPct);
      }
    }
    
    // Calculate metrics
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const annualizedReturn = Math.pow(1 + avgReturn, 252) - 1; // Assuming daily returns
    
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance * 252); // Annualized volatility
    
    // Calculate drawdowns
    let maxDrawdown = 0;
    let peak = equityCurve[0].equity;
    for (const point of equityCurve) {
      if (point.equity > peak) {
        peak = point.equity;
      } else {
        const drawdown = (peak - point.equity) / peak;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }
    }
    
    // Calculate win rate and profit factor
    const trades = this.extractTradesFromEquityCurve(equityCurve);
    const winningTrades = trades.filter(t => t > 0);
    const losingTrades = trades.filter(t => t < 0);
    
    const winRate = winningTrades.length / trades.length;
    const profitFactor = winningTrades.reduce((sum, t) => sum + t, 0) / 
                         Math.abs(losingTrades.reduce((sum, t) => sum + t, 0));
    
    // Calculate Sharpe ratio
    const riskFreeRate = 0.02; // Assuming 2% risk-free rate
    const excessReturns = returns.map(r => r - (riskFreeRate / 252));
    const avgExcessReturn = excessReturns.reduce((sum, r) => sum + r, 0) / excessReturns.length;
    const excessReturnStdDev = Math.sqrt(excessReturns.reduce((sum, r) => sum + Math.pow(r - avgExcessReturn, 2), 0) / excessReturns.length);
    const sharpeRatio = (avgExcessReturn / excessReturnStdDev) * Math.sqrt(252);
    
    // Calculate Sortino ratio (downside risk only)
    const negativeReturns = returns.filter(r => r < 0);
    const downsideDeviation = Math.sqrt(negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length);
    const sortino = (avgReturn / downsideDeviation) * Math.sqrt(252);
    
    // Calculate beta and alpha if benchmark provided
    let beta = 0;
    let alpha = 0;
    if (benchmark && benchmarkReturns.length > 0) {
      const benchmarkAvgReturn = benchmarkReturns.reduce((sum, r) => sum + r, 0) / benchmarkReturns.length;
      
      // Calculate covariance
      let covariance = 0;
      for (let i = 0; i < Math.min(returns.length, benchmarkReturns.length); i++) {
        covariance += (returns[i] - avgReturn) * (benchmarkReturns[i] - benchmarkAvgReturn);
      }
      covariance /= Math.min(returns.length, benchmarkReturns.length);
      
      // Calculate benchmark variance
      const benchmarkVariance = benchmarkReturns.reduce((sum, r) => sum + Math.pow(r - benchmarkAvgReturn, 2), 0) / benchmarkReturns.length;
      
      // Calculate beta
      beta = covariance / benchmarkVariance;
      
      // Calculate alpha (annualized)
      alpha = annualizedReturn - (beta * (Math.pow(1 + benchmarkAvgReturn, 252) - 1));
    }
    
    // Calculate information ratio if benchmark provided
    let informationRatio = 0;
    if (benchmark && benchmarkReturns.length > 0) {
      const trackingError = [];
      for (let i = 0; i < Math.min(returns.length, benchmarkReturns.length); i++) {
        trackingError.push(returns[i] - benchmarkReturns[i]);
      }
      const trackingErrorStdDev = Math.sqrt(trackingError.reduce((sum, te) => sum + Math.pow(te, 0), 0) / trackingError.length);
      const avgTrackingError = trackingError.reduce((sum, te) => sum + te, 0) / trackingError.length;
      informationRatio = (avgTrackingError / trackingErrorStdDev) * Math.sqrt(252);
    }
    
    // Calculate Calmar ratio
    const calmarRatio = annualizedReturn / maxDrawdown;
    
    // Calculate average win, average loss, and average holding period
    const averageWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t, 0) / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? losingTrades.reduce((sum, t) => sum + t, 0) / losingTrades.length : 0;
    
    // Estimate trades per month (assuming 21 trading days per month)
    const tradingDays = (equityCurve[equityCurve.length - 1].date.getTime() - equityCurve[0].date.getTime()) / (1000 * 60 * 60 * 24);
    const tradesPerMonth = trades.length / (tradingDays / 21);
    
    // Estimate average holding period (in days)
    const averageHoldingPeriod = tradingDays / trades.length;
    
    return {
      sharpeRatio,
      sortino,
      maxDrawdown: -maxDrawdown,
      annualizedReturn,
      winRate,
      profitFactor,
      volatility,
      beta,
      alpha,
      informationRatio,
      calmarRatio,
      averageWin,
      averageLoss,
      averageHoldingPeriod,
      tradesPerMonth
    };
  }

  /**
   * Extract trades from equity curve
   * @param equityCurve Equity curve
   * @returns Array of trade returns
   */
  private extractTradesFromEquityCurve(equityCurve: { date: Date; equity: number }[]): number[] {
    // This is a simplified approach - in reality, we would need actual trade data
    // Here we're just looking for local maxima and minima to estimate trades
    const trades: number[] = [];
    let inPosition = false;
    let entryEquity = 0;
    
    for (let i = 1; i < equityCurve.length - 1; i++) {
      // Simple peak/valley detection
      const prev = equityCurve[i-1].equity;
      const curr = equityCurve[i].equity;
      const next = equityCurve[i+1].equity;
      
      if (!inPosition && curr < prev && curr < next) {
        // Valley - enter position
        inPosition = true;
        entryEquity = curr;
      } else if (inPosition && curr > prev && curr > next) {
        // Peak - exit position
        inPosition = false;
        const tradeReturn = (curr - entryEquity) / entryEquity;
        trades.push(tradeReturn);
      }
    }
    
    // Close any open position at the end
    if (inPosition) {
      const exitEquity = equityCurve[equityCurve.length - 1].equity;
      const tradeReturn = (exitEquity - entryEquity) / entryEquity;
      trades.push(tradeReturn);
    }
    
    return trades;
  }

  /**
   * Run a simple local backtest for fallback purposes
   * @param strategyId Strategy ID
   * @param ticker Ticker symbol
   * @param parameters Strategy parameters
   * @param startDate Start date
   * @param endDate End date
   * @param initialCapital Initial capital
   * @returns Backtest result
   */
  private async runLocalBacktest(
    strategyId: string,
    ticker: string,
    parameters: Record<string, any>,
    startDate: Date,
    endDate: Date,
    initialCapital: number
  ): Promise<StrategyBacktestResult> {
    try {
      // Try to get market data
      const marketData = await this.getMarketData(ticker, startDate, endDate);
      
      // Run a very simple moving average crossover strategy as fallback
      const shortPeriod = parameters.shortPeriod || 20;
      const longPeriod = parameters.longPeriod || 50;
      
      // Calculate moving averages
      const shortMA = this.calculateMovingAverage(marketData.data.map(d => d.close), shortPeriod);
      const longMA = this.calculateMovingAverage(marketData.data.map(d => d.close), longPeriod);
      
      // Generate signals and equity curve
      let equity = initialCapital;
      let position = 0;
      const equityCurve: { date: Date; equity: number; drawdown: number }[] = [];
      const trades: {
        entryDate: Date;
        exitDate: Date;
        entryPrice: number;
        exitPrice: number;
        quantity: number;
        direction: 'long' | 'short';
        pnl: number;
        pnlPercentage: number;
        holdingPeriod: number;
      }[] = [];
      
      let maxEquity = initialCapital;
      let entryDate: Date | null = null;
      let entryPrice = 0;
      let entryPosition = 0;
      
      // Skip the first longPeriod bars since we don't have enough data for moving averages
      for (let i = Math.max(shortPeriod, longPeriod); i < marketData.data.length; i++) {
        const bar = marketData.data[i];
        const prevBar = marketData.data[i-1];
        
        // Check for crossover
        const shortCrossAbove = shortMA[i-1] <= longMA[i-1] && shortMA[i] > longMA[i];
        const shortCrossBelow = shortMA[i-1] >= longMA[i-1] && shortMA[i] < longMA[i];
        
        // Generate signals
        if (shortCrossAbove && position <= 0) {
          // Buy signal
          const quantity = Math.floor(equity / bar.close);
          const cost = quantity * bar.close;
          
          if (position < 0) {
            // Close short position
            const exitPrice = bar.close;
            const pnl = entryPosition * (entryPrice - exitPrice);
            const pnlPercentage = (entryPrice - exitPrice) / entryPrice;
            const holdingPeriod = Math.round((bar.date.getTime() - entryDate!.getTime()) / (1000 * 60 * 60 * 24));
            
            trades.push({
              entryDate: entryDate!,
              exitDate: bar.date,
              entryPrice,
              exitPrice,
              quantity: Math.abs(entryPosition),
              direction: 'short',
              pnl,
              pnlPercentage,
              holdingPeriod
            });
            
            equity += pnl;
          }
          
          // Enter long position
          position = quantity;
          entryDate = bar.date;
          entryPrice = bar.close;
          entryPosition = position;
          equity -= cost;
        } else if (shortCrossBelow && position >= 0) {
          // Sell signal
          if (position > 0) {
            // Close long position
            const exitPrice = bar.close;
            const pnl = entryPosition * (exitPrice - entryPrice);
            const pnlPercentage = (exitPrice - entryPrice) / entryPrice;
            const holdingPeriod = Math.round((bar.date.getTime() - entryDate!.getTime()) / (1000 * 60 * 60 * 24));
            
            trades.push({
              entryDate: entryDate!,
              exitDate: bar.date,
              entryPrice,
              exitPrice,
              quantity: entryPosition,
              direction: 'long',
              pnl,
              pnlPercentage,
              holdingPeriod
            });
            
            equity += position * bar.close;
          }
          
          // Enter short position
          const quantity = Math.floor(equity / bar.close);
          position = -quantity;
          entryDate = bar.date;
          entryPrice = bar.close;
          entryPosition = position;
        }
        
        // Update equity (mark-to-market)
        const currentEquity = equity + (position * bar.close);
        maxEquity = Math.max(maxEquity, currentEquity);
        const drawdown = (maxEquity - currentEquity) / maxEquity;
        
        equityCurve.push({
          date: bar.date,
          equity: currentEquity,
          drawdown
        });
      }
      
      // Close any open position at the end
      const lastBar = marketData.data[marketData.data.length - 1];
      if (position !== 0) {
        if (position > 0) {
          // Close long position
          const exitPrice = lastBar.close;
          const pnl = entryPosition * (exitPrice - entryPrice);
          const pnlPercentage = (exitPrice - entryPrice) / entryPrice;
          const holdingPeriod = Math.round((lastBar.date.getTime() - entryDate!.getTime()) / (1000 * 60 * 60 * 24));
          
          trades.push({
            entryDate: entryDate!,
            exitDate: lastBar.date,
            entryPrice,
            exitPrice,
            quantity: entryPosition,
            direction: 'long',
            pnl,
            pnlPercentage,
            holdingPeriod
          });
          
          equity += position * lastBar.close;
        } else {
          // Close short position
          const exitPrice = lastBar.close;
          const pnl = entryPosition * (entryPrice - exitPrice);
          const pnlPercentage = (entryPrice - exitPrice) / entryPrice;
          const holdingPeriod = Math.round((lastBar.date.getTime() - entryDate!.getTime()) / (1000 * 60 * 60 * 24));
          
          trades.push({
            entryDate: entryDate!,
            exitDate: lastBar.date,
            entryPrice,
            exitPrice,
            quantity: Math.abs(entryPosition),
            direction: 'short',
            pnl,
            pnlPercentage,
            holdingPeriod
          });
          
          equity += pnl;
        }
        
        position = 0;
      }
      
      // Calculate performance metrics
      const finalEquity = equityCurve[equityCurve.length - 1].equity;
      const totalReturn = (finalEquity - initialCapital) / initialCapital;
      const annualizedReturn = Math.pow(1 + totalReturn, 365 / ((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))) - 1;
      
      // Calculate other metrics
      const metrics = this.calculatePerformanceMetrics(equityCurve);
      
      // Detect market conditions
      const marketConditions = await this.detectMarketConditions(ticker, startDate, endDate)
        .catch(() => ({ ticker, periods: [] }));
      
      return {
        strategyId,
        ticker,
        startDate,
        endDate,
        initialCapital,
        finalCapital: finalEquity,
        totalReturn,
        annualizedReturn,
        trades,
        metrics,
        equityCurve,
        parameters,
        marketConditions: marketConditions.periods.map(period => ({
          condition: period.condition,
          startDate: period.startDate,
          endDate: period.endDate,
          performance: this.calculatePerformanceInPeriod(equityCurve, period.startDate, period.endDate)
        }))
      };
    } catch (error) {
      console.error(`Error running local backtest for strategy ${strategyId}:`, error);
      throw new Error(`Failed to run backtest for strategy ${strategyId}`);
    }
  }

  /**
   * Calculate simple moving average
   * @param data Array of values
   * @param period Moving average period
   * @returns Array of moving averages
   */
  private calculateMovingAverage(data: number[], period: number): number[] {
    const result: number[] = [];
    
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(NaN);
      } else {
        let sum = 0;
        for (let j = 0; j < period; j++) {
          sum += data[i - j];
        }
        result.push(sum / period);
      }
    }
    
    return result;
  }

  /**
   * Calculate performance in a specific period
   * @param equityCurve Equity curve
   * @param startDate Start date
   * @param endDate End date
   * @returns Performance as a percentage
   */
  private calculatePerformanceInPeriod(
    equityCurve: { date: Date; equity: number; drawdown: number }[],
    startDate: Date,
    endDate: Date
  ): number {
    // Find closest points in equity curve
    let startIndex = 0;
    let endIndex = equityCurve.length - 1;
    
    for (let i = 0; i < equityCurve.length; i++) {
      if (equityCurve[i].date >= startDate) {
        startIndex = i;
        break;
      }
    }
    
    for (let i = equityCurve.length - 1; i >= 0; i--) {
      if (equityCurve[i].date <= endDate) {
        endIndex = i;
        break;
      }
    }
    
    if (startIndex >= endIndex) {
      return 0;
    }
    
    const startEquity = equityCurve[startIndex].equity;
    const endEquity = equityCurve[endIndex].equity;
    
    return (endEquity - startEquity) / startEquity;
  }
}

export default StrategyBacktestService;