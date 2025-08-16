/**
 * Behavioral Metrics Service
 * 
 * This service provides functionality for analyzing behavioral metrics and indicators
 * derived from market data, trading patterns, and investor behavior.
 */

import axios from 'axios';
import { 
  BehavioralMetricsResult, 
  MarketAnomaly, 
  BehavioralIndicator, 
  TradingPattern,
  MarketRegime
} from '../types/behavioralTypes';

export class BehavioralMetricsService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.ninjatechfinance.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Get behavioral metrics for a specific ticker
   * @param ticker Stock ticker symbol
   * @param startDate Optional start date for analysis
   * @param endDate Optional end date for analysis
   * @returns Promise with behavioral metrics results
   */
  public async getBehavioralMetrics(
    ticker: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<BehavioralMetricsResult> {
    try {
      // Fetch market data from API
      const response = await axios.get(`${this.baseUrl}/market/data/${ticker}`, {
        headers: { 'X-API-KEY': this.apiKey },
        params: {
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
          includeVolume: true,
          includeVIX: true
        }
      });
      
      const marketData = response.data;
      
      // Calculate behavioral indicators
      const fearGreedIndex = this.calculateFearGreedIndex(marketData);
      const momentumIndicator = this.calculateMomentumIndicator(marketData);
      const volatilityRegime = this.calculateVolatilityRegime(marketData);
      const tradingPatterns = this.identifyTradingPatterns(marketData);
      const marketAnomalies = this.detectMarketAnomalies(marketData);
      const marketRegime = this.determineMarketRegime(marketData);
      const optionsIndicators = await this.getOptionsIndicators(ticker);
      
      // Calculate behavioral metrics
      const behavioralIndicators: BehavioralIndicator[] = [
        {
          name: 'Fear & Greed Index',
          value: fearGreedIndex.value,
          classification: fearGreedIndex.classification,
          description: 'Measures investor sentiment based on market volatility, momentum, and trading patterns',
          trend: fearGreedIndex.trend
        },
        {
          name: 'Momentum Indicator',
          value: momentumIndicator.value,
          classification: momentumIndicator.classification,
          description: 'Measures the strength and persistence of price movements',
          trend: momentumIndicator.trend
        },
        {
          name: 'Volatility Regime',
          value: volatilityRegime.value,
          classification: volatilityRegime.classification,
          description: 'Identifies the current volatility environment',
          trend: volatilityRegime.trend
        },
        {
          name: 'Put/Call Ratio',
          value: optionsIndicators.putCallRatio,
          classification: optionsIndicators.putCallRatio > 1 ? 'bearish' : 'bullish',
          description: 'Ratio of put options to call options, indicating market sentiment',
          trend: optionsIndicators.putCallRatioTrend
        },
        {
          name: 'Implied Volatility',
          value: optionsIndicators.impliedVolatility,
          classification: optionsIndicators.impliedVolatility > 30 ? 'high' : 'low',
          description: 'Market\'s expectation of future volatility derived from options prices',
          trend: optionsIndicators.impliedVolatilityTrend
        }
      ];
      
      return {
        ticker,
        behavioralIndicators,
        tradingPatterns,
        marketAnomalies,
        marketRegime,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error fetching behavioral metrics:', error);
      throw new Error('Failed to fetch behavioral metrics data');
    }
  }

  /**
   * Calculate Fear & Greed Index based on market data
   * @param marketData Market data including price, volume, and volatility
   * @returns Fear & Greed Index calculation
   */
  private calculateFearGreedIndex(marketData: any): {
    value: number;
    classification: string;
    trend: string;
  } {
    // In a real implementation, this would use multiple indicators:
    // - Market Momentum
    // - Price Strength
    // - Market Volatility
    // - Put/Call Ratio
    // - Junk Bond Demand
    // - Safe Haven Demand
    // - Market Breadth
    
    // Simplified implementation for demonstration
    const prices = marketData.prices;
    const volumes = marketData.volumes;
    const vix = marketData.vix;
    
    if (!prices || prices.length < 10) {
      return { value: 50, classification: 'neutral', trend: 'stable' };
    }
    
    // Calculate price momentum (last 10 days)
    const recentPrices = prices.slice(-10);
    const priceChange = (recentPrices[recentPrices.length - 1] - recentPrices[0]) / recentPrices[0];
    const momentumComponent = Math.min(Math.max(priceChange * 100 + 50, 0), 100);
    
    // Calculate volume trend
    const recentVolumes = volumes.slice(-10);
    const avgVolume = recentVolumes.reduce((sum: number, vol: number) => sum + vol, 0) / recentVolumes.length;
    const prevAvgVolume = volumes.slice(-20, -10).reduce((sum: number, vol: number) => sum + vol, 0) / 10;
    const volumeChange = (avgVolume - prevAvgVolume) / prevAvgVolume;
    const volumeComponent = Math.min(Math.max(volumeChange * 100 + 50, 0), 100);
    
    // Calculate volatility component
    const recentVix = vix ? vix.slice(-5) : [];
    let volatilityComponent = 50;
    if (recentVix.length > 0) {
      const avgVix = recentVix.reduce((sum: number, v: number) => sum + v, 0) / recentVix.length;
      // VIX is inversely related to greed (high VIX = fear)
      volatilityComponent = Math.min(Math.max(100 - avgVix * 2, 0), 100);
    }
    
    // Combine components with weights
    const fearGreedValue = (momentumComponent * 0.4) + (volumeComponent * 0.3) + (volatilityComponent * 0.3);
    
    // Determine classification
    let classification = 'neutral';
    if (fearGreedValue >= 80) classification = 'extreme greed';
    else if (fearGreedValue >= 60) classification = 'greed';
    else if (fearGreedValue <= 20) classification = 'extreme fear';
    else if (fearGreedValue <= 40) classification = 'fear';
    
    // Determine trend
    const previousFearGreed = this.calculatePreviousFearGreedValue(marketData);
    let trend = 'stable';
    const change = fearGreedValue - previousFearGreed;
    if (change > 10) trend = 'increasing';
    else if (change < -10) trend = 'decreasing';
    
    return {
      value: Math.round(fearGreedValue),
      classification,
      trend
    };
  }

  /**
   * Calculate previous Fear & Greed value for trend analysis
   * @param marketData Market data
   * @returns Previous Fear & Greed value
   */
  private calculatePreviousFearGreedValue(marketData: any): number {
    // Simplified implementation - calculate for previous period
    const previousPrices = marketData.prices.slice(-20, -10);
    const previousVolumes = marketData.volumes.slice(-20, -10);
    const previousVix = marketData.vix ? marketData.vix.slice(-10, -5) : [];
    
    if (previousPrices.length < 10) {
      return 50;
    }
    
    // Calculate previous price momentum
    const priceChange = (previousPrices[previousPrices.length - 1] - previousPrices[0]) / previousPrices[0];
    const momentumComponent = Math.min(Math.max(priceChange * 100 + 50, 0), 100);
    
    // Calculate previous volume trend
    const avgVolume = previousVolumes.reduce((sum: number, vol: number) => sum + vol, 0) / previousVolumes.length;
    const prevAvgVolume = marketData.volumes.slice(-30, -20).reduce((sum: number, vol: number) => sum + vol, 0) / 10;
    const volumeChange = (avgVolume - prevAvgVolume) / prevAvgVolume;
    const volumeComponent = Math.min(Math.max(volumeChange * 100 + 50, 0), 100);
    
    // Calculate previous volatility component
    let volatilityComponent = 50;
    if (previousVix.length > 0) {
      const avgVix = previousVix.reduce((sum: number, v: number) => sum + v, 0) / previousVix.length;
      volatilityComponent = Math.min(Math.max(100 - avgVix * 2, 0), 100);
    }
    
    // Combine components with weights
    return (momentumComponent * 0.4) + (volumeComponent * 0.3) + (volatilityComponent * 0.3);
  }

  /**
   * Calculate momentum indicator based on market data
   * @param marketData Market data including price and volume
   * @returns Momentum indicator calculation
   */
  private calculateMomentumIndicator(marketData: any): {
    value: number;
    classification: string;
    trend: string;
  } {
    const prices = marketData.prices;
    
    if (!prices || prices.length < 20) {
      return { value: 0, classification: 'neutral', trend: 'stable' };
    }
    
    // Calculate Rate of Change (ROC)
    const currentPrice = prices[prices.length - 1];
    const priceNPeriodsAgo = prices[prices.length - 20];
    const roc = ((currentPrice - priceNPeriodsAgo) / priceNPeriodsAgo) * 100;
    
    // Calculate Moving Average Convergence Divergence (MACD)
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macd = ema12 - ema26;
    const signal = this.calculateEMA([...Array(prices.length - 9).fill(0), macd], 9);
    const histogram = macd - signal;
    
    // Calculate Relative Strength Index (RSI)
    const rsi = this.calculateRSI(prices, 14);
    
    // Combine indicators into a momentum score (-100 to 100)
    const rocComponent = Math.min(Math.max(roc * 2, -100), 100);
    const macdComponent = Math.min(Math.max(histogram * 20, -100), 100);
    const rsiComponent = (rsi - 50) * 2; // Convert 0-100 to -100 to 100
    
    const momentumValue = (rocComponent * 0.4) + (macdComponent * 0.3) + (rsiComponent * 0.3);
    
    // Determine classification
    let classification = 'neutral';
    if (momentumValue >= 60) classification = 'strong bullish';
    else if (momentumValue >= 20) classification = 'bullish';
    else if (momentumValue <= -60) classification = 'strong bearish';
    else if (momentumValue <= -20) classification = 'bearish';
    
    // Determine trend
    const previousMomentum = this.calculatePreviousMomentumValue(prices);
    let trend = 'stable';
    const change = momentumValue - previousMomentum;
    if (change > 15) trend = 'improving';
    else if (change < -15) trend = 'deteriorating';
    
    return {
      value: Math.round(momentumValue),
      classification,
      trend
    };
  }

  /**
   * Calculate previous momentum value for trend analysis
   * @param prices Array of price data
   * @returns Previous momentum value
   */
  private calculatePreviousMomentumValue(prices: number[]): number {
    if (prices.length < 40) {
      return 0;
    }
    
    const previousPrices = prices.slice(0, -10);
    
    // Calculate previous ROC
    const currentPrice = previousPrices[previousPrices.length - 1];
    const priceNPeriodsAgo = previousPrices[previousPrices.length - 20];
    const roc = ((currentPrice - priceNPeriodsAgo) / priceNPeriodsAgo) * 100;
    
    // Calculate previous MACD
    const ema12 = this.calculateEMA(previousPrices, 12);
    const ema26 = this.calculateEMA(previousPrices, 26);
    const macd = ema12 - ema26;
    const signal = this.calculateEMA([...Array(previousPrices.length - 9).fill(0), macd], 9);
    const histogram = macd - signal;
    
    // Calculate previous RSI
    const rsi = this.calculateRSI(previousPrices, 14);
    
    // Combine indicators
    const rocComponent = Math.min(Math.max(roc * 2, -100), 100);
    const macdComponent = Math.min(Math.max(histogram * 20, -100), 100);
    const rsiComponent = (rsi - 50) * 2;
    
    return (rocComponent * 0.4) + (macdComponent * 0.3) + (rsiComponent * 0.3);
  }

  /**
   * Calculate Exponential Moving Average (EMA)
   * @param data Array of price data
   * @param period EMA period
   * @returns EMA value
   */
  private calculateEMA(data: number[], period: number): number {
    if (data.length < period) {
      return data[data.length - 1];
    }
    
    const k = 2 / (period + 1);
    
    // Start with SMA for the first EMA value
    let ema = data.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
    
    // Calculate EMA for the rest of the data
    for (let i = period; i < data.length; i++) {
      ema = (data[i] * k) + (ema * (1 - k));
    }
    
    return ema;
  }

  /**
   * Calculate Relative Strength Index (RSI)
   * @param prices Array of price data
   * @param period RSI period
   * @returns RSI value
   */
  private calculateRSI(prices: number[], period: number): number {
    if (prices.length <= period) {
      return 50; // Default to neutral if not enough data
    }
    
    let gains = 0;
    let losses = 0;
    
    // Calculate initial average gain and loss
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change >= 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    // Calculate RSI using smoothed method
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      
      if (change >= 0) {
        avgGain = ((avgGain * (period - 1)) + change) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = ((avgLoss * (period - 1)) - change) / period;
      }
    }
    
    if (avgLoss === 0) {
      return 100; // No losses, RSI is 100
    }
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Calculate volatility regime based on market data
   * @param marketData Market data including price and volatility
   * @returns Volatility regime calculation
   */
  private calculateVolatilityRegime(marketData: any): {
    value: number;
    classification: string;
    trend: string;
  } {
    const prices = marketData.prices;
    const vix = marketData.vix;
    
    if (!prices || prices.length < 20) {
      return { value: 15, classification: 'normal', trend: 'stable' };
    }
    
    // Calculate historical volatility (standard deviation of returns)
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const squaredDiffs = returns.map(ret => Math.pow(ret - mean, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const annualizedVol = stdDev * Math.sqrt(252) * 100; // Annualized volatility in percentage
    
    // Use VIX if available, otherwise use historical volatility
    let volatilityValue = annualizedVol;
    if (vix && vix.length > 0) {
      volatilityValue = vix[vix.length - 1];
    }
    
    // Determine classification
    let classification = 'normal';
    if (volatilityValue >= 30) classification = 'high';
    else if (volatilityValue >= 20) classification = 'elevated';
    else if (volatilityValue <= 10) classification = 'low';
    
    // Determine trend
    let trend = 'stable';
    const previousVol = this.calculatePreviousVolatility(marketData);
    const change = volatilityValue - previousVol;
    
    if (change > 5) trend = 'increasing';
    else if (change < -5) trend = 'decreasing';
    
    return {
      value: Math.round(volatilityValue * 10) / 10, // Round to 1 decimal place
      classification,
      trend
    };
  }

  /**
   * Calculate previous volatility for trend analysis
   * @param marketData Market data
   * @returns Previous volatility value
   */
  private calculatePreviousVolatility(marketData: any): number {
    const prices = marketData.prices;
    const vix = marketData.vix;
    
    if (vix && vix.length > 5) {
      // Use average of previous 5 VIX values
      return vix.slice(-10, -5).reduce((sum: number, v: number) => sum + v, 0) / 5;
    }
    
    if (!prices || prices.length < 40) {
      return 15; // Default value
    }
    
    // Calculate historical volatility for previous period
    const previousPrices = prices.slice(0, -20);
    const returns: number[] = [];
    
    for (let i = 1; i < previousPrices.length; i++) {
      returns.push((previousPrices[i] - previousPrices[i - 1]) / previousPrices[i - 1]);
    }
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const squaredDiffs = returns.map(ret => Math.pow(ret - mean, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev * Math.sqrt(252) * 100; // Annualized volatility in percentage
  }

  /**
   * Identify trading patterns in market data
   * @param marketData Market data including price and volume
   * @returns Array of identified trading patterns
   */
  private identifyTradingPatterns(marketData: any): TradingPattern[] {
    const prices = marketData.prices;
    const volumes = marketData.volumes;
    const patterns: TradingPattern[] = [];
    
    if (!prices || prices.length < 30 || !volumes || volumes.length < 30) {
      return patterns;
    }
    
    // Check for trend patterns
    if (this.isUptrend(prices.slice(-30))) {
      patterns.push({
        name: 'Uptrend',
        type: 'trend',
        strength: this.calculatePatternStrength(prices.slice(-30), 'uptrend'),
        description: 'Series of higher highs and higher lows',
        startIndex: prices.length - 30,
        endIndex: prices.length - 1
      });
    } else if (this.isDowntrend(prices.slice(-30))) {
      patterns.push({
        name: 'Downtrend',
        type: 'trend',
        strength: this.calculatePatternStrength(prices.slice(-30), 'downtrend'),
        description: 'Series of lower highs and lower lows',
        startIndex: prices.length - 30,
        endIndex: prices.length - 1
      });
    }
    
    // Check for reversal patterns
    const headAndShoulders = this.detectHeadAndShoulders(prices.slice(-50));
    if (headAndShoulders.detected) {
      patterns.push({
        name: 'Head and Shoulders',
        type: 'reversal',
        strength: headAndShoulders.strength,
        description: 'Bearish reversal pattern consisting of three peaks with the middle peak being the highest',
        startIndex: prices.length - 50 + headAndShoulders.startIndex,
        endIndex: prices.length - 50 + headAndShoulders.endIndex
      });
    }
    
    const doubleBottom = this.detectDoubleBottom(prices.slice(-40));
    if (doubleBottom.detected) {
      patterns.push({
        name: 'Double Bottom',
        type: 'reversal',
        strength: doubleBottom.strength,
        description: 'Bullish reversal pattern consisting of two lows at approximately the same price level',
        startIndex: prices.length - 40 + doubleBottom.startIndex,
        endIndex: prices.length - 40 + doubleBottom.endIndex
      });
    }
    
    // Check for continuation patterns
    const flag = this.detectFlag(prices.slice(-20), volumes.slice(-20));
    if (flag.detected) {
      patterns.push({
        name: flag.bullish ? 'Bull Flag' : 'Bear Flag',
        type: 'continuation',
        strength: flag.strength,
        description: flag.bullish ? 
          'Bullish continuation pattern showing a consolidation before continuing the uptrend' : 
          'Bearish continuation pattern showing a consolidation before continuing the downtrend',
        startIndex: prices.length - 20 + flag.startIndex,
        endIndex: prices.length - 20 + flag.endIndex
      });
    }
    
    // Check for volatility patterns
    if (this.isVolatilityContraction(prices.slice(-15))) {
      patterns.push({
        name: 'Volatility Contraction',
        type: 'volatility',
        strength: this.calculateVolatilityContractionStrength(prices.slice(-15)),
        description: 'Period of decreasing volatility often preceding a significant move',
        startIndex: prices.length - 15,
        endIndex: prices.length - 1
      });
    }
    
    // Check for volume patterns
    if (this.isVolumeClimaxSelling(prices.slice(-10), volumes.slice(-10))) {
      patterns.push({
        name: 'Climax Selling',
        type: 'volume',
        strength: this.calculateVolumePatternStrength(volumes.slice(-10), 'climax'),
        description: 'Heavy selling volume that may indicate capitulation and potential reversal',
        startIndex: prices.length - 10,
        endIndex: prices.length - 1
      });
    } else if (this.isVolumeClimaxBuying(prices.slice(-10), volumes.slice(-10))) {
      patterns.push({
        name: 'Climax Buying',
        type: 'volume',
        strength: this.calculateVolumePatternStrength(volumes.slice(-10), 'climax'),
        description: 'Heavy buying volume that may indicate euphoria and potential reversal',
        startIndex: prices.length - 10,
        endIndex: prices.length - 1
      });
    }
    
    return patterns;
  }

  /**
   * Check if prices are in an uptrend
   * @param prices Array of price data
   * @returns Boolean indicating if prices are in an uptrend
   */
  private isUptrend(prices: number[]): boolean {
    if (prices.length < 10) return false;
    
    // Calculate 10-day moving average
    const ma10 = [];
    for (let i = 9; i < prices.length; i++) {
      const sum = prices.slice(i - 9, i + 1).reduce((sum, price) => sum + price, 0);
      ma10.push(sum / 10);
    }
    
    // Check if MA is trending up
    let upCount = 0;
    for (let i = 1; i < ma10.length; i++) {
      if (ma10[i] > ma10[i - 1]) upCount++;
    }
    
    // Consider it an uptrend if at least 70% of MA changes are positive
    return upCount / (ma10.length - 1) >= 0.7;
  }

  /**
   * Check if prices are in a downtrend
   * @param prices Array of price data
   * @returns Boolean indicating if prices are in a downtrend
   */
  private isDowntrend(prices: number[]): boolean {
    if (prices.length < 10) return false;
    
    // Calculate 10-day moving average
    const ma10 = [];
    for (let i = 9; i < prices.length; i++) {
      const sum = prices.slice(i - 9, i + 1).reduce((sum, price) => sum + price, 0);
      ma10.push(sum / 10);
    }
    
    // Check if MA is trending down
    let downCount = 0;
    for (let i = 1; i < ma10.length; i++) {
      if (ma10[i] < ma10[i - 1]) downCount++;
    }
    
    // Consider it a downtrend if at least 70% of MA changes are negative
    return downCount / (ma10.length - 1) >= 0.7;
  }

  /**
   * Calculate the strength of a trend pattern
   * @param prices Array of price data
   * @param trendType Type of trend ('uptrend' or 'downtrend')
   * @returns Strength value between 0 and 1
   */
  private calculatePatternStrength(prices: number[], trendType: 'uptrend' | 'downtrend'): number {
    if (prices.length < 10) return 0;
    
    // Calculate linear regression
    const n = prices.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = prices;
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const yMean = sumY / n;
    const totalSS = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    
    const regressionLine = x.map(val => slope * val + intercept);
    const residualSS = y.reduce((sum, val, i) => sum + Math.pow(val - regressionLine[i], 2), 0);
    
    const rSquared = 1 - (residualSS / totalSS);
    
    // Calculate strength based on slope direction and R-squared
    let strength = Math.abs(rSquared);
    
    // Adjust strength based on trend type and slope direction
    if ((trendType === 'uptrend' && slope <= 0) || (trendType === 'downtrend' && slope >= 0)) {
      strength = 0;
    } else {
      // Normalize slope to contribute to strength
      const normalizedSlope = Math.min(Math.abs(slope) / (prices[0] * 0.01), 1);
      strength = (strength * 0.7) + (normalizedSlope * 0.3);
    }
    
    return Math.min(Math.max(strength, 0), 1);
  }

  /**
   * Detect Head and Shoulders pattern
   * @param prices Array of price data
   * @returns Object with detection results
   */
  private detectHeadAndShoulders(prices: number[]): {
    detected: boolean;
    strength: number;
    startIndex: number;
    endIndex: number;
  } {
    if (prices.length < 30) {
      return { detected: false, strength: 0, startIndex: 0, endIndex: 0 };
    }
    
    // Simplified head and shoulders detection
    // In a real implementation, this would use more sophisticated pattern recognition
    
    // Find local maxima (peaks)
    const peaks: number[] = [];
    for (let i = 5; i < prices.length - 5; i++) {
      const window = prices.slice(i - 5, i + 6);
      if (prices[i] === Math.max(...window)) {
        peaks.push(i);
      }
    }
    
    // Need at least 3 peaks for head and shoulders
    if (peaks.length < 3) {
      return { detected: false, strength: 0, startIndex: 0, endIndex: 0 };
    }
    
    // Check for head and shoulders pattern in the peaks
    for (let i = 0; i < peaks.length - 2; i++) {
      const leftShoulder = peaks[i];
      const head = peaks[i + 1];
      const rightShoulder = peaks[i + 2];
      
      // Check if head is higher than shoulders
      if (prices[head] > prices[leftShoulder] && prices[head] > prices[rightShoulder]) {
        // Check if shoulders are at similar heights
        const shoulderDiff = Math.abs(prices[leftShoulder] - prices[rightShoulder]);
        const shoulderAvg = (prices[leftShoulder] + prices[rightShoulder]) / 2;
        
        if (shoulderDiff / shoulderAvg < 0.1) { // Shoulders within 10% of each other
          // Calculate neckline (support level)
          const leftTrough = Math.min(...prices.slice(leftShoulder, head));
          const rightTrough = Math.min(...prices.slice(head, rightShoulder));
          const neckline = (leftTrough + rightTrough) / 2;
          
          // Check if price has broken below neckline
          if (prices[prices.length - 1] < neckline) {
            // Calculate pattern strength
            const patternHeight = prices[head] - neckline;
            const priceRange = Math.max(...prices) - Math.min(...prices);
            const strength = Math.min(patternHeight / priceRange, 1);
            
            return {
              detected: true,
              strength,
              startIndex: leftShoulder - 5,
              endIndex: rightShoulder + 5
            };
          }
        }
      }
    }
    
    return { detected: false, strength: 0, startIndex: 0, endIndex: 0 };
  }

  /**
   * Detect Double Bottom pattern
   * @param prices Array of price data
   * @returns Object with detection results
   */
  private detectDoubleBottom(prices: number[]): {
    detected: boolean;
    strength: number;
    startIndex: number;
    endIndex: number;
  } {
    if (prices.length < 20) {
      return { detected: false, strength: 0, startIndex: 0, endIndex: 0 };
    }
    
    // Find local minima (troughs)
    const troughs: number[] = [];
    for (let i = 5; i < prices.length - 5; i++) {
      const window = prices.slice(i - 5, i + 6);
      if (prices[i] === Math.min(...window)) {
        troughs.push(i);
      }
    }
    
    // Need at least 2 troughs for double bottom
    if (troughs.length < 2) {
      return { detected: false, strength: 0, startIndex: 0, endIndex: 0 };
    }
    
    // Check for double bottom pattern in the troughs
    for (let i = 0; i < troughs.length - 1; i++) {
      const firstBottom = troughs[i];
      const secondBottom = troughs[i + 1];
      
      // Check if bottoms are at similar levels
      const bottomDiff = Math.abs(prices[firstBottom] - prices[secondBottom]);
      const bottomAvg = (prices[firstBottom] + prices[secondBottom]) / 2;
      
      if (bottomDiff / bottomAvg < 0.05) { // Bottoms within 5% of each other
        // Check if there's a peak between the bottoms
        const middlePeak = Math.max(...prices.slice(firstBottom, secondBottom));
        const bottomToMiddle = middlePeak - bottomAvg;
        
        // Check if middle peak is significantly higher than bottoms
        if (bottomToMiddle / bottomAvg > 0.1) {
          // Check if price has moved above the middle peak after the second bottom
          if (secondBottom < prices.length - 5 && 
              Math.max(...prices.slice(secondBottom)) > middlePeak) {
            
            // Calculate pattern strength
            const patternHeight = middlePeak - bottomAvg;
            const priceRange = Math.max(...prices) - Math.min(...prices);
            const strength = Math.min(patternHeight / priceRange, 1);
            
            return {
              detected: true,
              strength,
              startIndex: firstBottom - 5,
              endIndex: prices.length - 1
            };
          }
        }
      }
    }
    
    return { detected: false, strength: 0, startIndex: 0, endIndex: 0 };
  }

  /**
   * Detect Flag pattern
   * @param prices Array of price data
   * @param volumes Array of volume data
   * @returns Object with detection results
   */
  private detectFlag(prices: number[], volumes: number[]): {
    detected: boolean;
    bullish: boolean;
    strength: number;
    startIndex: number;
    endIndex: number;
  } {
    if (prices.length < 15 || volumes.length < 15) {
      return { detected: false, bullish: false, strength: 0, startIndex: 0, endIndex: 0 };
    }
    
    // Check for pole (strong directional move)
    const firstHalf = prices.slice(0, 7);
    const secondHalf = prices.slice(7);
    
    const firstHalfChange = (firstHalf[firstHalf.length - 1] - firstHalf[0]) / firstHalf[0];
    const secondHalfChange = (secondHalf[secondHalf.length - 1] - secondHalf[0]) / secondHalf[0];
    
    // Check for bull flag
    if (firstHalfChange > 0.05 && Math.abs(secondHalfChange) < 0.03) {
      // Check if volume was higher during pole and lower during flag
      const firstHalfAvgVolume = volumes.slice(0, 7).reduce((sum, vol) => sum + vol, 0) / 7;
      const secondHalfAvgVolume = volumes.slice(7).reduce((sum, vol) => sum + vol, 0) / (volumes.length - 7);
      
      if (firstHalfAvgVolume > secondHalfAvgVolume) {
        // Calculate pattern strength
        const poleHeight = firstHalfChange;
        const flagTightness = 1 - (Math.abs(secondHalfChange) / 0.03);
        const volumeRatio = Math.min(firstHalfAvgVolume / secondHalfAvgVolume, 3) / 3;
        
        const strength = (poleHeight * 0.4) + (flagTightness * 0.3) + (volumeRatio * 0.3);
        
        return {
          detected: true,
          bullish: true,
          strength: Math.min(strength, 1),
          startIndex: 0,
          endIndex: prices.length - 1
        };
      }
    }
    
    // Check for bear flag
    if (firstHalfChange < -0.05 && Math.abs(secondHalfChange) < 0.03) {
      // Check if volume was higher during pole and lower during flag
      const firstHalfAvgVolume = volumes.slice(0, 7).reduce((sum, vol) => sum + vol, 0) / 7;
      const secondHalfAvgVolume = volumes.slice(7).reduce((sum, vol) => sum + vol, 0) / (volumes.length - 7);
      
      if (firstHalfAvgVolume > secondHalfAvgVolume) {
        // Calculate pattern strength
        const poleHeight = Math.abs(firstHalfChange);
        const flagTightness = 1 - (Math.abs(secondHalfChange) / 0.03);
        const volumeRatio = Math.min(firstHalfAvgVolume / secondHalfAvgVolume, 3) / 3;
        
        const strength = (poleHeight * 0.4) + (flagTightness * 0.3) + (volumeRatio * 0.3);
        
        return {
          detected: true,
          bullish: false,
          strength: Math.min(strength, 1),
          startIndex: 0,
          endIndex: prices.length - 1
        };
      }
    }
    
    return { detected: false, bullish: false, strength: 0, startIndex: 0, endIndex: 0 };
  }

  /**
   * Check if prices show volatility contraction
   * @param prices Array of price data
   * @returns Boolean indicating if volatility is contracting
   */
  private isVolatilityContraction(prices: number[]): boolean {
    if (prices.length < 10) return false;
    
    // Calculate true range for each period
    const trueRanges: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      const high = prices[i];
      const low = prices[i];
      const prevClose = prices[i - 1];
      
      const tr1 = high - low;
      const tr2 = Math.abs(high - prevClose);
      const tr3 = Math.abs(low - prevClose);
      
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }
    
    // Calculate average true range for first and second half
    const firstHalfATR = trueRanges.slice(0, Math.floor(trueRanges.length / 2))
      .reduce((sum, tr) => sum + tr, 0) / Math.floor(trueRanges.length / 2);
    
    const secondHalfATR = trueRanges.slice(Math.floor(trueRanges.length / 2))
      .reduce((sum, tr) => sum + tr, 0) / (trueRanges.length - Math.floor(trueRanges.length / 2));
    
    // Volatility is contracting if second half ATR is significantly lower
    return secondHalfATR < firstHalfATR * 0.7;
  }

  /**
   * Calculate the strength of volatility contraction
   * @param prices Array of price data
   * @returns Strength value between 0 and 1
   */
  private calculateVolatilityContractionStrength(prices: number[]): number {
    if (prices.length < 10) return 0;
    
    // Calculate true range for each period
    const trueRanges: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      const high = prices[i];
      const low = prices[i];
      const prevClose = prices[i - 1];
      
      const tr1 = high - low;
      const tr2 = Math.abs(high - prevClose);
      const tr3 = Math.abs(low - prevClose);
      
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }
    
    // Calculate average true range for first and second half
    const firstHalfATR = trueRanges.slice(0, Math.floor(trueRanges.length / 2))
      .reduce((sum, tr) => sum + tr, 0) / Math.floor(trueRanges.length / 2);
    
    const secondHalfATR = trueRanges.slice(Math.floor(trueRanges.length / 2))
      .reduce((sum, tr) => sum + tr, 0) / (trueRanges.length - Math.floor(trueRanges.length / 2));
    
    // Calculate contraction ratio
    const contractionRatio = 1 - (secondHalfATR / firstHalfATR);
    
    // Normalize to 0-1 range
    return Math.min(Math.max(contractionRatio, 0), 1);
  }

  /**
   * Check if there's climax selling
   * @param prices Array of price data
   * @param volumes Array of volume data
   * @returns Boolean indicating if there's climax selling
   */
  private isVolumeClimaxSelling(prices: number[], volumes: number[]): boolean {
    if (prices.length < 10 || volumes.length < 10) return false;
    
    // Check if recent prices are declining
    const recentPriceChange = (prices[prices.length - 1] - prices[0]) / prices[0];
    
    // Check if recent volume is significantly higher than average
    const avgVolume = volumes.slice(0, -1).reduce((sum, vol) => sum + vol, 0) / (volumes.length - 1);
    const recentVolume = volumes[volumes.length - 1];
    
    // Climax selling: declining prices with volume spike
    return recentPriceChange < -0.03 && recentVolume > avgVolume * 2;
  }

  /**
   * Check if there's climax buying
   * @param prices Array of price data
   * @param volumes Array of volume data
   * @returns Boolean indicating if there's climax buying
   */
  private isVolumeClimaxBuying(prices: number[], volumes: number[]): boolean {
    if (prices.length < 10 || volumes.length < 10) return false;
    
    // Check if recent prices are rising
    const recentPriceChange = (prices[prices.length - 1] - prices[0]) / prices[0];
    
    // Check if recent volume is significantly higher than average
    const avgVolume = volumes.slice(0, -1).reduce((sum, vol) => sum + vol, 0) / (volumes.length - 1);
    const recentVolume = volumes[volumes.length - 1];
    
    // Climax buying: rising prices with volume spike
    return recentPriceChange > 0.03 && recentVolume > avgVolume * 2;
  }

  /**
   * Calculate the strength of a volume pattern
   * @param volumes Array of volume data
   * @param patternType Type of volume pattern
   * @returns Strength value between 0 and 1
   */
  private calculateVolumePatternStrength(volumes: number[], patternType: 'climax' | 'divergence'): number {
    if (volumes.length < 5) return 0;
    
    if (patternType === 'climax') {
      // Calculate how much recent volume exceeds average
      const avgVolume = volumes.slice(0, -1).reduce((sum, vol) => sum + vol, 0) / (volumes.length - 1);
      const recentVolume = volumes[volumes.length - 1];
      
      // Normalize to 0-1 range (capped at 5x average volume)
      return Math.min((recentVolume / avgVolume - 1) / 4, 1);
    } else {
      // For divergence patterns (not implemented in this simplified version)
      return 0.5;
    }
  }

  /**
   * Detect market anomalies in market data
   * @param marketData Market data including price, volume, and volatility
   * @returns Array of detected market anomalies
   */
  private detectMarketAnomalies(marketData: any): MarketAnomaly[] {
    const prices = marketData.prices;
    const volumes = marketData.volumes;
    const anomalies: MarketAnomaly[] = [];
    
    if (!prices || prices.length < 30 || !volumes || volumes.length < 30) {
      return anomalies;
    }
    
    // Check for price gaps
    for (let i = 1; i < prices.length; i++) {
      const prevPrice = prices[i - 1];
      const currPrice = prices[i];
      const priceChange = (currPrice - prevPrice) / prevPrice;
      
      // Significant gap up or down
      if (Math.abs(priceChange) > 0.03) {
        anomalies.push({
          type: priceChange > 0 ? 'Gap Up' : 'Gap Down',
          date: new Date(marketData.dates[i]),
          value: priceChange * 100, // Convert to percentage
          significance: Math.min(Math.abs(priceChange) * 10, 1), // Normalize to 0-1
          description: priceChange > 0 
            ? `Price gapped up by ${(priceChange * 100).toFixed(2)}%` 
            : `Price gapped down by ${(Math.abs(priceChange) * 100).toFixed(2)}%`
        });
      }
    }
    
    // Check for volume spikes
    const avgVolume = volumes.reduce((sum: number, vol: number) => sum + vol, 0) / volumes.length;
    const volStdDev = Math.sqrt(
      volumes.reduce((sum: number, vol: number) => sum + Math.pow(vol - avgVolume, 2), 0) / volumes.length
    );
    
    for (let i = 0; i < volumes.length; i++) {
      const volumeZScore = (volumes[i] - avgVolume) / volStdDev;
      
      // Volume more than 3 standard deviations from mean
      if (volumeZScore > 3) {
        anomalies.push({
          type: 'Volume Spike',
          date: new Date(marketData.dates[i]),
          value: volumes[i],
          significance: Math.min(volumeZScore / 5, 1), // Normalize to 0-1
          description: `Trading volume ${volumeZScore.toFixed(1)} standard deviations above average`
        });
      }
    }
    
    // Check for volatility spikes
    if (marketData.vix && marketData.vix.length > 0) {
      const vix = marketData.vix;
      const avgVix = vix.reduce((sum: number, v: number) => sum + v, 0) / vix.length;
      
      for (let i = 1; i < vix.length; i++) {
        const vixChange = vix[i] - vix[i - 1];
        
        // Significant VIX spike
        if (vixChange > 5) {
          anomalies.push({
            type: 'Volatility Spike',
            date: new Date(marketData.dates[i]),
            value: vixChange,
            significance: Math.min(vixChange / 10, 1), // Normalize to 0-1
            description: `VIX increased by ${vixChange.toFixed(1)} points`
          });
        }
      }
    }
    
    // Check for price velocity anomalies
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const returnStdDev = Math.sqrt(
      returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length
    );
    
    for (let i = 0; i < returns.length; i++) {
      const returnZScore = (returns[i] - avgReturn) / returnStdDev;
      
      // Return more than 3 standard deviations from mean
      if (Math.abs(returnZScore) > 3) {
        anomalies.push({
          type: returnZScore > 0 ? 'Abnormal Gain' : 'Abnormal Loss',
          date: new Date(marketData.dates[i + 1]),
          value: returns[i] * 100, // Convert to percentage
          significance: Math.min(Math.abs(returnZScore) / 5, 1), // Normalize to 0-1
          description: `Price change ${Math.abs(returnZScore).toFixed(1)} standard deviations from average`
        });
      }
    }
    
    return anomalies;
  }

  /**
   * Determine market regime based on market data
   * @param marketData Market data including price, volume, and volatility
   * @returns Market regime analysis
   */
  private determineMarketRegime(marketData: any): MarketRegime {
    const prices = marketData.prices;
    const vix = marketData.vix;
    
    if (!prices || prices.length < 60) {
      return {
        regime: 'Normal',
        confidence: 0.5,
        description: 'Insufficient data to determine market regime',
        characteristics: []
      };
    }
    
    // Calculate returns
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    // Calculate volatility (standard deviation of returns)
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const volatility = Math.sqrt(
      returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length
    ) * Math.sqrt(252); // Annualized
    
    // Calculate trend
    const startPrice = prices[0];
    const endPrice = prices[prices.length - 1];
    const totalReturn = (endPrice - startPrice) / startPrice;
    
    // Calculate moving averages
    const ma50 = this.calculateSMA(prices, 50);
    const ma200 = this.calculateSMA(prices, 200);
    
    // Use VIX if available
    let currentVix = 15; // Default value
    if (vix && vix.length > 0) {
      currentVix = vix[vix.length - 1];
    }
    
    // Determine regime
    let regime: string;
    let confidence: number;
    let characteristics: string[] = [];
    
    if (totalReturn > 0.15 && volatility < 0.15 && ma50 > ma200 && currentVix < 20) {
      regime = 'Bull Market';
      confidence = 0.8;
      characteristics = [
        'Positive price trend',
        'Low volatility',
        'Moving averages in bullish alignment',
        'Low implied volatility (VIX)'
      ];
    } else if (totalReturn < -0.15 && volatility > 0.25 && ma50 < ma200 && currentVix > 25) {
      regime = 'Bear Market';
      confidence = 0.8;
      characteristics = [
        'Negative price trend',
        'High volatility',
        'Moving averages in bearish alignment',
        'Elevated implied volatility (VIX)'
      ];
    } else if (Math.abs(totalReturn) < 0.05 && volatility < 0.15 && Math.abs(ma50 - ma200) / ma200 < 0.02) {
      regime = 'Sideways/Consolidation';
      confidence = 0.7;
      characteristics = [
        'Minimal price trend',
        'Low volatility',
        'Moving averages in close proximity',
        'Range-bound price action'
      ];
    } else if (volatility > 0.3 && currentVix > 30) {
      regime = 'High Volatility';
      confidence = 0.75;
      characteristics = [
        'Elevated historical volatility',
        'High implied volatility (VIX)',
        'Large price swings',
        'Uncertain market direction'
      ];
    } else if (volatility < 0.1 && currentVix < 15 && Math.abs(totalReturn) < 0.1) {
      regime = 'Low Volatility';
      confidence = 0.7;
      characteristics = [
        'Suppressed historical volatility',
        'Low implied volatility (VIX)',
        'Small price movements',
        'Reduced trading activity'
      ];
    } else {
      regime = 'Transitional';
      confidence = 0.6;
      characteristics = [
        'Mixed market signals',
        'Changing volatility patterns',
        'Unclear trend direction',
        'Potential regime shift in progress'
      ];
    }
    
    return {
      regime,
      confidence,
      description: `${regime} conditions with ${confidence * 100}% confidence`,
      characteristics
    };
  }

  /**
   * Calculate Simple Moving Average
   * @param data Array of price data
   * @param period SMA period
   * @returns SMA value
   */
  private calculateSMA(data: number[], period: number): number {
    if (data.length < period) {
      return data[data.length - 1];
    }
    
    const sum = data.slice(-period).reduce((sum, price) => sum + price, 0);
    return sum / period;
  }

  /**
   * Get options-based indicators for a ticker
   * @param ticker Stock ticker symbol
   * @returns Promise with options indicators
   */
  private async getOptionsIndicators(ticker: string): Promise<{
    putCallRatio: number;
    putCallRatioTrend: string;
    impliedVolatility: number;
    impliedVolatilityTrend: string;
  }> {
    try {
      // Fetch options data from API
      const response = await axios.get(`${this.baseUrl}/options/metrics/${ticker}`, {
        headers: { 'X-API-KEY': this.apiKey }
      });
      
      const optionsData = response.data;
      
      // Extract put/call ratio and implied volatility
      const putCallRatio = optionsData.putCallRatio;
      const impliedVolatility = optionsData.impliedVolatility;
      
      // Determine trends
      let putCallRatioTrend = 'stable';
      if (optionsData.putCallRatioChange > 0.2) putCallRatioTrend = 'increasing';
      else if (optionsData.putCallRatioChange < -0.2) putCallRatioTrend = 'decreasing';
      
      let impliedVolatilityTrend = 'stable';
      if (optionsData.impliedVolatilityChange > 2) impliedVolatilityTrend = 'increasing';
      else if (optionsData.impliedVolatilityChange < -2) impliedVolatilityTrend = 'decreasing';
      
      return {
        putCallRatio,
        putCallRatioTrend,
        impliedVolatility,
        impliedVolatilityTrend
      };
    } catch (error) {
      console.error('Error fetching options indicators:', error);
      
      // Return default values if API call fails
      return {
        putCallRatio: 1.0,
        putCallRatioTrend: 'stable',
        impliedVolatility: 20,
        impliedVolatilityTrend: 'stable'
      };
    }
  }
}

export default BehavioralMetricsService;