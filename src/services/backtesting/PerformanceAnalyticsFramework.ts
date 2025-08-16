import {
  BacktestResult,
  BacktestTrade,
  EquityCurvePoint,
  DrawdownPoint,
  MonthlyReturn,
  PerformanceMetrics,
  TradeStatistics
} from '../../types/backtesting';

/**
 * Performance analytics framework for backtesting
 * 
 * This service provides comprehensive performance metrics calculation
 * for backtesting results, including returns, risk metrics, drawdowns,
 * and trade statistics.
 */
export class PerformanceAnalyticsFramework {
  /**
   * Calculate performance metrics for a backtest result
   * @param equityCurve Equity curve data
   * @param trades List of trades
   * @param initialCapital Initial capital
   * @param benchmarkReturns Optional benchmark returns for comparison
   * @returns Performance metrics
   */
  public calculatePerformanceMetrics(
    equityCurve: EquityCurvePoint[],
    trades: BacktestTrade[],
    initialCapital: number,
    benchmarkReturns?: { date: Date; value: number }[]
  ): PerformanceMetrics {
    if (equityCurve.length === 0) {
      throw new Error('Equity curve is empty');
    }

    // Calculate returns
    const returns = this.calculateReturns(equityCurve);
    
    // Calculate drawdowns
    const drawdowns = this.calculateDrawdowns(equityCurve);
    
    // Calculate trade statistics
    const tradeStats = this.calculateTradeStatistics(trades);
    
    // Calculate final equity
    const finalEquity = equityCurve[equityCurve.length - 1].equity;
    
    // Calculate total return
    const totalReturn = finalEquity - initialCapital;
    const totalReturnPercentage = (totalReturn / initialCapital) * 100;
    
    // Calculate annualized return
    const startDate = new Date(equityCurve[0].date);
    const endDate = new Date(equityCurve[equityCurve.length - 1].date);
    const yearFraction = this.calculateYearFraction(startDate, endDate);
    const annualizedReturn = Math.pow(1 + totalReturnPercentage / 100, 1 / yearFraction) - 1;
    
    // Calculate max drawdown
    const maxDrawdown = Math.max(...drawdowns.map(d => d.drawdown));
    const maxDrawdownPercentage = Math.max(...drawdowns.map(d => d.drawdownPercentage));
    
    // Calculate max drawdown duration
    const maxDrawdownDuration = this.calculateMaxDrawdownDuration(drawdowns);
    
    // Calculate volatility (standard deviation of returns)
    const dailyReturns = this.calculateDailyReturns(equityCurve);
    const volatility = this.calculateStandardDeviation(dailyReturns) * Math.sqrt(252); // Annualized
    
    // Calculate downside deviation (standard deviation of negative returns only)
    const negativeReturns = dailyReturns.filter(r => r < 0);
    const downside = this.calculateStandardDeviation(negativeReturns) * Math.sqrt(252); // Annualized
    
    // Calculate Sharpe ratio (assuming risk-free rate of 0)
    const averageDailyReturn = this.calculateMean(dailyReturns);
    const sharpeRatio = volatility > 0 ? (averageDailyReturn * 252) / volatility : 0;
    
    // Calculate Sortino ratio (using downside deviation)
    const sortinoRatio = downside > 0 ? (averageDailyReturn * 252) / downside : 0;
    
    // Calculate Calmar ratio
    const calmarRatio = maxDrawdownPercentage > 0 ? annualizedReturn / (maxDrawdownPercentage / 100) : 0;
    
    // Calculate alpha and beta if benchmark returns are provided
    let alpha = 0;
    let beta = 0;
    let informationRatio = 0;
    
    if (benchmarkReturns && benchmarkReturns.length > 0) {
      const benchmarkDailyReturns = this.calculateDailyReturnsFromSeries(benchmarkReturns);
      
      // Calculate beta (covariance / variance)
      beta = this.calculateBeta(dailyReturns, benchmarkDailyReturns);
      
      // Calculate alpha (excess return)
      const benchmarkAverageReturn = this.calculateMean(benchmarkDailyReturns);
      alpha = (averageDailyReturn * 252) - (beta * benchmarkAverageReturn * 252);
      
      // Calculate tracking error
      const trackingError = this.calculateTrackingError(dailyReturns, benchmarkDailyReturns);
      
      // Calculate information ratio
      informationRatio = trackingError > 0 ? alpha / trackingError : 0;
    }
    
    // Calculate Treynor ratio
    const treynorRatio = beta !== 0 ? (averageDailyReturn * 252) / beta : 0;
    
    // Calculate Ulcer Index
    const ulcerIndex = this.calculateUlcerIndex(drawdowns);
    
    // Calculate recovery factor
    const recoveryFactor = maxDrawdown > 0 ? totalReturn / maxDrawdown : 0;
    
    // Calculate profit per day
    const tradingDays = this.calculateTradingDays(startDate, endDate);
    const profitPerDay = tradingDays > 0 ? totalReturn / tradingDays : 0;
    
    // Calculate return on max drawdown
    const returnOnMaxDrawdown = maxDrawdown > 0 ? totalReturn / maxDrawdown : 0;
    
    // Calculate market correlation
    let marketCorrelation = 0;
    if (benchmarkReturns && benchmarkReturns.length > 0) {
      const benchmarkDailyReturns = this.calculateDailyReturnsFromSeries(benchmarkReturns);
      marketCorrelation = this.calculateCorrelation(dailyReturns, benchmarkDailyReturns);
    }
    
    // Return the complete performance metrics
    return {
      totalReturn,
      annualizedReturn,
      maxDrawdown,
      maxDrawdownPercentage,
      maxDrawdownDuration,
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
      alpha,
      beta,
      informationRatio,
      treynorRatio,
      volatility,
      downside,
      winRate: tradeStats.winRate,
      profitFactor: tradeStats.profitFactor,
      expectancy: tradeStats.expectancy,
      averageWin: tradeStats.averageWin,
      averageLoss: tradeStats.averageLoss,
      largestWin: tradeStats.largestWin,
      largestLoss: tradeStats.largestLoss,
      averageHoldingPeriod: tradeStats.averageHoldingPeriod,
      averageWinHoldingPeriod: tradeStats.averageWinHoldingPeriod,
      averageLossHoldingPeriod: tradeStats.averageLossHoldingPeriod,
      totalTrades: tradeStats.totalTrades,
      winningTrades: tradeStats.winningTrades,
      losingTrades: tradeStats.losingTrades,
      breakEvenTrades: tradeStats.breakEvenTrades,
      maxConsecutiveWins: tradeStats.maxConsecutiveWins,
      maxConsecutiveLosses: tradeStats.maxConsecutiveLosses,
      recoveryFactor,
      payoffRatio: tradeStats.payoffRatio,
      profitPerDay,
      returnOnMaxDrawdown,
      ulcerIndex,
      marketCorrelation
    };
  }
  
  /**
   * Calculate returns from equity curve
   * @param equityCurve Equity curve data
   * @returns Array of return percentages
   */
  private calculateReturns(equityCurve: EquityCurvePoint[]): number[] {
    const returns: number[] = [];
    
    for (let i = 1; i < equityCurve.length; i++) {
      const previousEquity = equityCurve[i - 1].equity;
      const currentEquity = equityCurve[i].equity;
      
      const returnPct = (currentEquity - previousEquity) / previousEquity;
      returns.push(returnPct);
    }
    
    return returns;
  }
  
  /**
   * Calculate daily returns from equity curve
   * @param equityCurve Equity curve data
   * @returns Array of daily return percentages
   */
  private calculateDailyReturns(equityCurve: EquityCurvePoint[]): number[] {
    const dailyReturns: number[] = [];
    let previousDate = new Date(equityCurve[0].date);
    let previousEquity = equityCurve[0].equity;
    
    for (let i = 1; i < equityCurve.length; i++) {
      const currentDate = new Date(equityCurve[i].date);
      const currentEquity = equityCurve[i].equity;
      
      // Check if it's a new day
      if (currentDate.toDateString() !== previousDate.toDateString()) {
        const returnPct = (currentEquity - previousEquity) / previousEquity;
        dailyReturns.push(returnPct);
        
        previousDate = currentDate;
        previousEquity = currentEquity;
      }
    }
    
    return dailyReturns;
  }
  
  /**
   * Calculate daily returns from a time series
   * @param series Time series data
   * @returns Array of daily return percentages
   */
  private calculateDailyReturnsFromSeries(series: { date: Date; value: number }[]): number[] {
    const dailyReturns: number[] = [];
    let previousDate = new Date(series[0].date);
    let previousValue = series[0].value;
    
    for (let i = 1; i < series.length; i++) {
      const currentDate = new Date(series[i].date);
      const currentValue = series[i].value;
      
      // Check if it's a new day
      if (currentDate.toDateString() !== previousDate.toDateString()) {
        const returnPct = (currentValue - previousValue) / previousValue;
        dailyReturns.push(returnPct);
        
        previousDate = currentDate;
        previousValue = currentValue;
      }
    }
    
    return dailyReturns;
  }
  
  /**
   * Calculate drawdowns from equity curve
   * @param equityCurve Equity curve data
   * @returns Array of drawdown points
   */
  private calculateDrawdowns(equityCurve: EquityCurvePoint[]): DrawdownPoint[] {
    const drawdowns: DrawdownPoint[] = [];
    let highWaterMark = equityCurve[0].equity;
    
    for (const point of equityCurve) {
      // Update high water mark
      if (point.equity > highWaterMark) {
        highWaterMark = point.equity;
      }
      
      // Calculate drawdown
      const drawdown = highWaterMark - point.equity;
      const drawdownPercentage = (drawdown / highWaterMark) * 100;
      
      drawdowns.push({
        date: point.date,
        drawdown,
        drawdownPercentage
      });
    }
    
    return drawdowns;
  }
  
  /**
   * Calculate maximum drawdown duration in days
   * @param drawdowns Array of drawdown points
   * @returns Maximum drawdown duration in days
   */
  private calculateMaxDrawdownDuration(drawdowns: DrawdownPoint[]): number {
    if (drawdowns.length === 0) {
      return 0;
    }
    
    let maxDuration = 0;
    let currentDuration = 0;
    let inDrawdown = false;
    let drawdownStartDate: Date | null = null;
    
    for (const point of drawdowns) {
      if (point.drawdown > 0) {
        if (!inDrawdown) {
          inDrawdown = true;
          drawdownStartDate = new Date(point.date);
        }
      } else {
        if (inDrawdown) {
          inDrawdown = false;
          const endDate = new Date(point.date);
          const duration = this.calculateDaysBetween(drawdownStartDate!, endDate);
          
          if (duration > maxDuration) {
            maxDuration = duration;
          }
          
          drawdownStartDate = null;
        }
      }
    }
    
    // If we're still in a drawdown at the end, calculate duration until the last point
    if (inDrawdown && drawdownStartDate) {
      const endDate = new Date(drawdowns[drawdowns.length - 1].date);
      const duration = this.calculateDaysBetween(drawdownStartDate, endDate);
      
      if (duration > maxDuration) {
        maxDuration = duration;
      }
    }
    
    return maxDuration;
  }
  
  /**
   * Calculate trade statistics
   * @param trades List of trades
   * @returns Trade statistics
   */
  private calculateTradeStatistics(trades: BacktestTrade[]): TradeStatistics {
    // Filter closed trades
    const closedTrades = trades.filter(trade => trade.status === 'CLOSED');
    
    if (closedTrades.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        breakEvenTrades: 0,
        winRate: 0,
        averageWin: 0,
        averageLoss: 0,
        largestWin: 0,
        largestLoss: 0,
        profitFactor: 0,
        expectancy: 0,
        averageHoldingPeriod: 0,
        averageWinHoldingPeriod: 0,
        averageLossHoldingPeriod: 0,
        maxConsecutiveWins: 0,
        maxConsecutiveLosses: 0,
        payoffRatio: 0
      };
    }
    
    // Categorize trades
    const winningTrades = closedTrades.filter(trade => (trade.pnl || 0) > 0);
    const losingTrades = closedTrades.filter(trade => (trade.pnl || 0) < 0);
    const breakEvenTrades = closedTrades.filter(trade => (trade.pnl || 0) === 0);
    
    // Calculate win rate
    const winRate = winningTrades.length / closedTrades.length;
    
    // Calculate average win/loss
    const totalProfit = winningTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0));
    
    const averageWin = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;
    
    // Calculate largest win/loss
    const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(trade => trade.pnl || 0)) : 0;
    const largestLoss = losingTrades.length > 0 ? Math.abs(Math.min(...losingTrades.map(trade => trade.pnl || 0))) : 0;
    
    // Calculate profit factor
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
    
    // Calculate expectancy
    const expectancy = (winRate * averageWin) - ((1 - winRate) * averageLoss);
    
    // Calculate average holding period
    const totalHoldingPeriod = closedTrades.reduce((sum, trade) => sum + (trade.holdingPeriod || 0), 0);
    const averageHoldingPeriod = totalHoldingPeriod / closedTrades.length;
    
    // Calculate average holding period for winning/losing trades
    const totalWinHoldingPeriod = winningTrades.reduce((sum, trade) => sum + (trade.holdingPeriod || 0), 0);
    const totalLossHoldingPeriod = losingTrades.reduce((sum, trade) => sum + (trade.holdingPeriod || 0), 0);
    
    const averageWinHoldingPeriod = winningTrades.length > 0 ? totalWinHoldingPeriod / winningTrades.length : 0;
    const averageLossHoldingPeriod = losingTrades.length > 0 ? totalLossHoldingPeriod / losingTrades.length : 0;
    
    // Calculate max consecutive wins/losses
    const { maxConsecutiveWins, maxConsecutiveLosses } = this.calculateConsecutiveWinsLosses(closedTrades);
    
    // Calculate payoff ratio
    const payoffRatio = averageLoss > 0 ? averageWin / averageLoss : averageWin > 0 ? Infinity : 0;
    
    return {
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      breakEvenTrades: breakEvenTrades.length,
      winRate,
      averageWin,
      averageLoss,
      largestWin,
      largestLoss,
      profitFactor,
      expectancy,
      averageHoldingPeriod,
      averageWinHoldingPeriod,
      averageLossHoldingPeriod,
      maxConsecutiveWins,
      maxConsecutiveLosses,
      payoffRatio
    };
  }
  
  /**
   * Calculate maximum consecutive wins and losses
   * @param trades List of trades
   * @returns Maximum consecutive wins and losses
   */
  private calculateConsecutiveWinsLosses(trades: BacktestTrade[]): {
    maxConsecutiveWins: number;
    maxConsecutiveLosses: number;
  } {
    let currentConsecutiveWins = 0;
    let currentConsecutiveLosses = 0;
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    
    // Sort trades by exit date
    const sortedTrades = [...trades].sort((a, b) => {
      if (!a.exitDate || !b.exitDate) return 0;
      return new Date(a.exitDate).getTime() - new Date(b.exitDate).getTime();
    });
    
    for (const trade of sortedTrades) {
      const pnl = trade.pnl || 0;
      
      if (pnl > 0) {
        // Winning trade
        currentConsecutiveWins++;
        currentConsecutiveLosses = 0;
        
        if (currentConsecutiveWins > maxConsecutiveWins) {
          maxConsecutiveWins = currentConsecutiveWins;
        }
      } else if (pnl < 0) {
        // Losing trade
        currentConsecutiveLosses++;
        currentConsecutiveWins = 0;
        
        if (currentConsecutiveLosses > maxConsecutiveLosses) {
          maxConsecutiveLosses = currentConsecutiveLosses;
        }
      } else {
        // Break-even trade - reset both counters
        currentConsecutiveWins = 0;
        currentConsecutiveLosses = 0;
      }
    }
    
    return { maxConsecutiveWins, maxConsecutiveLosses };
  }
  
  /**
   * Calculate monthly returns from equity curve
   * @param equityCurve Equity curve data
   * @returns Array of monthly returns
   */
  public calculateMonthlyReturns(equityCurve: EquityCurvePoint[]): MonthlyReturn[] {
    const monthlyReturns: MonthlyReturn[] = [];
    
    if (equityCurve.length === 0) {
      return monthlyReturns;
    }
    
    let currentYear = new Date(equityCurve[0].date).getFullYear();
    let currentMonth = new Date(equityCurve[0].date).getMonth();
    let monthStartEquity = equityCurve[0].equity;
    
    for (let i = 1; i < equityCurve.length; i++) {
      const date = new Date(equityCurve[i].date);
      const year = date.getFullYear();
      const month = date.getMonth();
      
      // If we've moved to a new month
      if (year !== currentYear || month !== currentMonth) {
        // Calculate return for the previous month
        const monthEndEquity = equityCurve[i - 1].equity;
        const monthReturn = (monthEndEquity - monthStartEquity) / monthStartEquity * 100;
        
        monthlyReturns.push({
          year: currentYear,
          month: currentMonth,
          return: monthReturn
        });
        
        // Update for the new month
        currentYear = year;
        currentMonth = month;
        monthStartEquity = equityCurve[i].equity;
      }
    }
    
    // Add the last month
    const lastPoint = equityCurve[equityCurve.length - 1];
    const lastMonthReturn = (lastPoint.equity - monthStartEquity) / monthStartEquity * 100;
    
    monthlyReturns.push({
      year: currentYear,
      month: currentMonth,
      return: lastMonthReturn
    });
    
    return monthlyReturns;
  }
  
  /**
   * Calculate Ulcer Index from drawdowns
   * @param drawdowns Array of drawdown points
   * @returns Ulcer Index
   */
  private calculateUlcerIndex(drawdowns: DrawdownPoint[]): number {
    if (drawdowns.length === 0) {
      return 0;
    }
    
    // Sum of squared drawdown percentages
    const sumSquaredDrawdowns = drawdowns.reduce(
      (sum, point) => sum + Math.pow(point.drawdownPercentage, 2),
      0
    );
    
    // Ulcer Index is the square root of the mean of squared drawdown percentages
    return Math.sqrt(sumSquaredDrawdowns / drawdowns.length);
  }
  
  /**
   * Calculate beta (systematic risk) between strategy and benchmark
   * @param strategyReturns Array of strategy returns
   * @param benchmarkReturns Array of benchmark returns
   * @returns Beta
   */
  private calculateBeta(strategyReturns: number[], benchmarkReturns: number[]): number {
    if (strategyReturns.length === 0 || benchmarkReturns.length === 0) {
      return 0;
    }
    
    // Use the minimum length of both arrays
    const length = Math.min(strategyReturns.length, benchmarkReturns.length);
    
    // Calculate covariance
    const covariance = this.calculateCovariance(
      strategyReturns.slice(0, length),
      benchmarkReturns.slice(0, length)
    );
    
    // Calculate benchmark variance
    const benchmarkVariance = this.calculateVariance(benchmarkReturns.slice(0, length));
    
    // Beta = Covariance / Benchmark Variance
    return benchmarkVariance > 0 ? covariance / benchmarkVariance : 0;
  }
  
  /**
   * Calculate tracking error between strategy and benchmark
   * @param strategyReturns Array of strategy returns
   * @param benchmarkReturns Array of benchmark returns
   * @returns Tracking error (annualized)
   */
  private calculateTrackingError(strategyReturns: number[], benchmarkReturns: number[]): number {
    if (strategyReturns.length === 0 || benchmarkReturns.length === 0) {
      return 0;
    }
    
    // Use the minimum length of both arrays
    const length = Math.min(strategyReturns.length, benchmarkReturns.length);
    
    // Calculate excess returns
    const excessReturns: number[] = [];
    
    for (let i = 0; i < length; i++) {
      excessReturns.push(strategyReturns[i] - benchmarkReturns[i]);
    }
    
    // Calculate standard deviation of excess returns
    const trackingError = this.calculateStandardDeviation(excessReturns);
    
    // Annualize tracking error (assuming daily returns)
    return trackingError * Math.sqrt(252);
  }
  
  /**
   * Calculate correlation between two return series
   * @param returns1 First return series
   * @param returns2 Second return series
   * @returns Correlation coefficient
   */
  private calculateCorrelation(returns1: number[], returns2: number[]): number {
    if (returns1.length === 0 || returns2.length === 0) {
      return 0;
    }
    
    // Use the minimum length of both arrays
    const length = Math.min(returns1.length, returns2.length);
    
    // Calculate covariance
    const covariance = this.calculateCovariance(
      returns1.slice(0, length),
      returns2.slice(0, length)
    );
    
    // Calculate standard deviations
    const stdDev1 = this.calculateStandardDeviation(returns1.slice(0, length));
    const stdDev2 = this.calculateStandardDeviation(returns2.slice(0, length));
    
    // Correlation = Covariance / (StdDev1 * StdDev2)
    return (stdDev1 > 0 && stdDev2 > 0) ? covariance / (stdDev1 * stdDev2) : 0;
  }
  
  /**
   * Calculate covariance between two series
   * @param series1 First series
   * @param series2 Second series
   * @returns Covariance
   */
  private calculateCovariance(series1: number[], series2: number[]): number {
    if (series1.length === 0 || series2.length === 0 || series1.length !== series2.length) {
      return 0;
    }
    
    const mean1 = this.calculateMean(series1);
    const mean2 = this.calculateMean(series2);
    
    let sum = 0;
    
    for (let i = 0; i < series1.length; i++) {
      sum += (series1[i] - mean1) * (series2[i] - mean2);
    }
    
    return sum / series1.length;
  }
  
  /**
   * Calculate variance of a series
   * @param series Data series
   * @returns Variance
   */
  private calculateVariance(series: number[]): number {
    if (series.length === 0) {
      return 0;
    }
    
    const mean = this.calculateMean(series);
    
    let sum = 0;
    
    for (const value of series) {
      sum += Math.pow(value - mean, 2);
    }
    
    return sum / series.length;
  }
  
  /**
   * Calculate standard deviation of a series
   * @param series Data series
   * @returns Standard deviation
   */
  private calculateStandardDeviation(series: number[]): number {
    return Math.sqrt(this.calculateVariance(series));
  }
  
  /**
   * Calculate mean of a series
   * @param series Data series
   * @returns Mean
   */
  private calculateMean(series: number[]): number {
    if (series.length === 0) {
      return 0;
    }
    
    const sum = series.reduce((acc, value) => acc + value, 0);
    return sum / series.length;
  }
  
  /**
   * Calculate year fraction between two dates
   * @param startDate Start date
   * @param endDate End date
   * @returns Year fraction
   */
  private calculateYearFraction(startDate: Date, endDate: Date): number {
    const millisecondsPerYear = 365.25 * 24 * 60 * 60 * 1000;
    const millisecondsDiff = endDate.getTime() - startDate.getTime();
    
    return millisecondsDiff / millisecondsPerYear;
  }
  
  /**
   * Calculate number of days between two dates
   * @param startDate Start date
   * @param endDate End date
   * @returns Number of days
   */
  private calculateDaysBetween(startDate: Date, endDate: Date): number {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const millisecondsDiff = endDate.getTime() - startDate.getTime();
    
    return Math.round(millisecondsDiff / millisecondsPerDay);
  }
  
  /**
   * Calculate number of trading days between two dates
   * @param startDate Start date
   * @param endDate End date
   * @returns Number of trading days
   */
  private calculateTradingDays(startDate: Date, endDate: Date): number {
    let tradingDays = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        tradingDays++;
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return tradingDays;
  }
}

// Export singleton instance
export const performanceAnalyticsFramework = new PerformanceAnalyticsFramework();