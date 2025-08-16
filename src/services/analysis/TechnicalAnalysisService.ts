/**
 * Technical Analysis Service
 * Provides technical indicators and pattern recognition for market analysis
 */

import { injectable, inject } from 'inversify';
import { MarketDataService } from '../market/MarketDataService';
import { LoggerService } from '../common/LoggerService';

export interface PriceData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorResult {
  timestamp: Date;
  value: number | number[] | null;
}

export interface PatternRecognitionResult {
  timestamp: Date;
  pattern: string;
  strength: number; // 0-1 indicating pattern strength/confidence
  direction: 'bullish' | 'bearish' | 'neutral';
}

export enum IndicatorType {
  // Trend Indicators
  SMA = 'SMA', // Simple Moving Average
  EMA = 'EMA', // Exponential Moving Average
  MACD = 'MACD', // Moving Average Convergence Divergence
  BOLLINGER_BANDS = 'BOLLINGER_BANDS',
  PARABOLIC_SAR = 'PARABOLIC_SAR',
  
  // Momentum Indicators
  RSI = 'RSI', // Relative Strength Index
  STOCHASTIC = 'STOCHASTIC',
  CCI = 'CCI', // Commodity Channel Index
  ADX = 'ADX', // Average Directional Index
  
  // Volume Indicators
  OBV = 'OBV', // On-Balance Volume
  VOLUME_SMA = 'VOLUME_SMA',
  CHAIKIN_MONEY_FLOW = 'CHAIKIN_MONEY_FLOW',
  
  // Volatility Indicators
  ATR = 'ATR', // Average True Range
  STANDARD_DEVIATION = 'STANDARD_DEVIATION',
  
  // Support/Resistance
  PIVOT_POINTS = 'PIVOT_POINTS',
  FIBONACCI_RETRACEMENT = 'FIBONACCI_RETRACEMENT'
}

export enum PatternType {
  // Reversal Patterns
  HEAD_AND_SHOULDERS = 'HEAD_AND_SHOULDERS',
  INVERSE_HEAD_AND_SHOULDERS = 'INVERSE_HEAD_AND_SHOULDERS',
  DOUBLE_TOP = 'DOUBLE_TOP',
  DOUBLE_BOTTOM = 'DOUBLE_BOTTOM',
  TRIPLE_TOP = 'TRIPLE_TOP',
  TRIPLE_BOTTOM = 'TRIPLE_BOTTOM',
  
  // Continuation Patterns
  TRIANGLE = 'TRIANGLE',
  WEDGE = 'WEDGE',
  FLAG = 'FLAG',
  PENNANT = 'PENNANT',
  RECTANGLE = 'RECTANGLE',
  
  // Candlestick Patterns
  DOJI = 'DOJI',
  HAMMER = 'HAMMER',
  ENGULFING = 'ENGULFING',
  MORNING_STAR = 'MORNING_STAR',
  EVENING_STAR = 'EVENING_STAR',
  HARAMI = 'HARAMI',
  
  // Gap Patterns
  GAP_UP = 'GAP_UP',
  GAP_DOWN = 'GAP_DOWN'
}

@injectable()
export class TechnicalAnalysisService {
  constructor(
    @inject(MarketDataService) private marketDataService: MarketDataService,
    @inject(LoggerService) private logger: LoggerService
  ) {}

  /**
   * Calculates a technical indicator for a given symbol
   * @param symbol The symbol to calculate the indicator for
   * @param indicator The indicator type
   * @param period The period for the indicator calculation
   * @param params Additional parameters for the indicator
   * @returns The indicator results
   */
  public async calculateIndicator(
    symbol: string,
    indicator: IndicatorType,
    period: number,
    params?: Record<string, any>
  ): Promise<IndicatorResult[]> {
    this.logger.info('Calculating technical indicator', { symbol, indicator, period });
    
    try {
      // Get historical price data
      const priceData = await this.getPriceData(symbol, period * 2); // Get extra data for calculation
      
      // Calculate the indicator
      let results: IndicatorResult[] = [];
      
      switch (indicator) {
        case IndicatorType.SMA:
          results = this.calculateSMA(priceData, period);
          break;
        
        case IndicatorType.EMA:
          results = this.calculateEMA(priceData, period);
          break;
        
        case IndicatorType.MACD:
          const fastPeriod = params?.fastPeriod || 12;
          const slowPeriod = params?.slowPeriod || 26;
          const signalPeriod = params?.signalPeriod || 9;
          results = this.calculateMACD(priceData, fastPeriod, slowPeriod, signalPeriod);
          break;
        
        case IndicatorType.BOLLINGER_BANDS:
          const stdDev = params?.stdDev || 2;
          results = this.calculateBollingerBands(priceData, period, stdDev);
          break;
        
        case IndicatorType.RSI:
          results = this.calculateRSI(priceData, period);
          break;
        
        case IndicatorType.STOCHASTIC:
          const kPeriod = params?.kPeriod || 14;
          const dPeriod = params?.dPeriod || 3;
          const smooth = params?.smooth || 3;
          results = this.calculateStochastic(priceData, kPeriod, dPeriod, smooth);
          break;
        
        case IndicatorType.OBV:
          results = this.calculateOBV(priceData);
          break;
        
        case IndicatorType.ATR:
          results = this.calculateATR(priceData, period);
          break;
        
        default:
          throw new Error(`Indicator ${indicator} not implemented`);
      }
      
      return results;
    } catch (error) {
      this.logger.error('Error calculating technical indicator', { 
        symbol, 
        indicator, 
        period, 
        error: error.message 
      });
      
      throw error;
    }
  }

  /**
   * Detects patterns in price data
   * @param symbol The symbol to detect patterns for
   * @param patternTypes The pattern types to detect
   * @param lookbackPeriod The lookback period for pattern detection
   * @returns The detected patterns
   */
  public async detectPatterns(
    symbol: string,
    patternTypes: PatternType[],
    lookbackPeriod: number = 100
  ): Promise<PatternRecognitionResult[]> {
    this.logger.info('Detecting patterns', { symbol, patternTypes, lookbackPeriod });
    
    try {
      // Get historical price data
      const priceData = await this.getPriceData(symbol, lookbackPeriod);
      
      // Detect patterns
      let results: PatternRecognitionResult[] = [];
      
      for (const patternType of patternTypes) {
        switch (patternType) {
          case PatternType.HEAD_AND_SHOULDERS:
            results = [...results, ...this.detectHeadAndShoulders(priceData)];
            break;
          
          case PatternType.DOUBLE_TOP:
            results = [...results, ...this.detectDoubleTop(priceData)];
            break;
          
          case PatternType.DOUBLE_BOTTOM:
            results = [...results, ...this.detectDoubleBottom(priceData)];
            break;
          
          case PatternType.DOJI:
            results = [...results, ...this.detectDoji(priceData)];
            break;
          
          case PatternType.ENGULFING:
            results = [...results, ...this.detectEngulfing(priceData)];
            break;
          
          case PatternType.GAP_UP:
          case PatternType.GAP_DOWN:
            results = [...results, ...this.detectGaps(priceData)];
            break;
          
          default:
            this.logger.warn(`Pattern ${patternType} detection not implemented`);
        }
      }
      
      return results;
    } catch (error) {
      this.logger.error('Error detecting patterns', { 
        symbol, 
        patternTypes, 
        lookbackPeriod, 
        error: error.message 
      });
      
      throw error;
    }
  }

  /**
   * Analyzes support and resistance levels
   * @param symbol The symbol to analyze
   * @param lookbackPeriod The lookback period
   * @returns The support and resistance levels
   */
  public async analyzeSupportResistance(
    symbol: string,
    lookbackPeriod: number = 200
  ): Promise<{ support: number[], resistance: number[] }> {
    this.logger.info('Analyzing support and resistance', { symbol, lookbackPeriod });
    
    try {
      // Get historical price data
      const priceData = await this.getPriceData(symbol, lookbackPeriod);
      
      // Find support and resistance levels
      const levels = this.findSupportResistanceLevels(priceData);
      
      return levels;
    } catch (error) {
      this.logger.error('Error analyzing support and resistance', { 
        symbol, 
        lookbackPeriod, 
        error: error.message 
      });
      
      throw error;
    }
  }

  /**
   * Generates a technical analysis report for a symbol
   * @param symbol The symbol to analyze
   * @returns The technical analysis report
   */
  public async generateTechnicalAnalysisReport(
    symbol: string
  ): Promise<{
    trend: { direction: 'up' | 'down' | 'sideways', strength: number },
    momentum: { value: number, overbought: boolean, oversold: boolean },
    support: number[],
    resistance: number[],
    patterns: PatternRecognitionResult[],
    indicators: Record<string, IndicatorResult[]>
  }> {
    this.logger.info('Generating technical analysis report', { symbol });
    
    try {
      // Get historical price data
      const priceData = await this.getPriceData(symbol, 200);
      
      // Calculate various indicators
      const sma20 = await this.calculateIndicator(symbol, IndicatorType.SMA, 20);
      const sma50 = await this.calculateIndicator(symbol, IndicatorType.SMA, 50);
      const sma200 = await this.calculateIndicator(symbol, IndicatorType.SMA, 200);
      const rsi = await this.calculateIndicator(symbol, IndicatorType.RSI, 14);
      const macd = await this.calculateIndicator(symbol, IndicatorType.MACD, 0, { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 });
      const bollingerBands = await this.calculateIndicator(symbol, IndicatorType.BOLLINGER_BANDS, 20, { stdDev: 2 });
      
      // Detect patterns
      const patterns = await this.detectPatterns(symbol, [
        PatternType.HEAD_AND_SHOULDERS,
        PatternType.DOUBLE_TOP,
        PatternType.DOUBLE_BOTTOM,
        PatternType.ENGULFING,
        PatternType.DOJI
      ]);
      
      // Find support and resistance levels
      const { support, resistance } = await this.analyzeSupportResistance(symbol);
      
      // Determine trend direction and strength
      const trendAnalysis = this.analyzeTrend(priceData, sma20, sma50, sma200);
      
      // Analyze momentum
      const momentumAnalysis = this.analyzeMomentum(rsi, macd);
      
      return {
        trend: trendAnalysis,
        momentum: momentumAnalysis,
        support,
        resistance,
        patterns,
        indicators: {
          sma20,
          sma50,
          sma200,
          rsi,
          macd,
          bollingerBands
        }
      };
    } catch (error) {
      this.logger.error('Error generating technical analysis report', { 
        symbol, 
        error: error.message 
      });
      
      throw error;
    }
  }

  /**
   * Gets historical price data for a symbol
   * @param symbol The symbol to get data for
   * @param lookbackPeriod The number of periods to look back
   * @returns The price data
   */
  private async getPriceData(symbol: string, lookbackPeriod: number): Promise<PriceData[]> {
    // In a real implementation, this would call the market data service
    // For now, we'll generate mock data
    
    const priceData: PriceData[] = [];
    const today = new Date();
    let price = 100 + Math.random() * 100; // Start with a random price between 100 and 200
    
    for (let i = lookbackPeriod; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Generate random price movement
      const change = (Math.random() - 0.48) * 2; // Slight upward bias
      const percentChange = change / 100;
      
      // Calculate OHLC
      const open = price;
      const close = price * (1 + percentChange);
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      const volume = Math.floor(100000 + Math.random() * 900000);
      
      priceData.push({
        timestamp: date,
        open,
        high,
        close,
        low,
        volume
      });
      
      price = close;
    }
    
    return priceData;
  }

  /**
   * Calculates Simple Moving Average (SMA)
   * @param priceData The price data
   * @param period The period for the SMA
   * @returns The SMA results
   */
  private calculateSMA(priceData: PriceData[], period: number): IndicatorResult[] {
    const results: IndicatorResult[] = [];
    
    for (let i = 0; i < priceData.length; i++) {
      if (i < period - 1) {
        // Not enough data yet
        results.push({
          timestamp: priceData[i].timestamp,
          value: null
        });
        continue;
      }
      
      // Calculate SMA
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += priceData[i - j].close;
      }
      
      const sma = sum / period;
      
      results.push({
        timestamp: priceData[i].timestamp,
        value: sma
      });
    }
    
    return results;
  }

  /**
   * Calculates Exponential Moving Average (EMA)
   * @param priceData The price data
   * @param period The period for the EMA
   * @returns The EMA results
   */
  private calculateEMA(priceData: PriceData[], period: number): IndicatorResult[] {
    const results: IndicatorResult[] = [];
    const multiplier = 2 / (period + 1);
    
    // Calculate SMA for the first period as the initial EMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += priceData[i].close;
    }
    
    let ema = sum / period;
    
    for (let i = 0; i < priceData.length; i++) {
      if (i < period - 1) {
        // Not enough data yet
        results.push({
          timestamp: priceData[i].timestamp,
          value: null
        });
        continue;
      }
      
      if (i === period - 1) {
        // First EMA is the SMA
        results.push({
          timestamp: priceData[i].timestamp,
          value: ema
        });
        continue;
      }
      
      // Calculate EMA
      ema = (priceData[i].close - ema) * multiplier + ema;
      
      results.push({
        timestamp: priceData[i].timestamp,
        value: ema
      });
    }
    
    return results;
  }

  /**
   * Calculates Moving Average Convergence Divergence (MACD)
   * @param priceData The price data
   * @param fastPeriod The fast period
   * @param slowPeriod The slow period
   * @param signalPeriod The signal period
   * @returns The MACD results
   */
  private calculateMACD(
    priceData: PriceData[],
    fastPeriod: number,
    slowPeriod: number,
    signalPeriod: number
  ): IndicatorResult[] {
    const results: IndicatorResult[] = [];
    
    // Calculate fast EMA
    const fastEMA = this.calculateEMA(priceData, fastPeriod);
    
    // Calculate slow EMA
    const slowEMA = this.calculateEMA(priceData, slowPeriod);
    
    // Calculate MACD line
    const macdLine: { timestamp: Date, value: number | null }[] = [];
    
    for (let i = 0; i < priceData.length; i++) {
      if (fastEMA[i].value === null || slowEMA[i].value === null) {
        macdLine.push({
          timestamp: priceData[i].timestamp,
          value: null
        });
        continue;
      }
      
      macdLine.push({
        timestamp: priceData[i].timestamp,
        value: (fastEMA[i].value as number) - (slowEMA[i].value as number)
      });
    }
    
    // Calculate signal line (EMA of MACD line)
    const signalLine: number[] = [];
    let macdValues: number[] = macdLine
      .filter(item => item.value !== null)
      .map(item => item.value as number);
    
    // Calculate initial signal line value (SMA of MACD)
    if (macdValues.length >= signalPeriod) {
      let sum = 0;
      for (let i = 0; i < signalPeriod; i++) {
        sum += macdValues[i];
      }
      
      let signal = sum / signalPeriod;
      signalLine.push(signal);
      
      // Calculate remaining signal line values (EMA of MACD)
      const multiplier = 2 / (signalPeriod + 1);
      for (let i = signalPeriod; i < macdValues.length; i++) {
        signal = (macdValues[i] - signal) * multiplier + signal;
        signalLine.push(signal);
      }
    }
    
    // Combine MACD line and signal line
    let signalIndex = 0;
    for (let i = 0; i < priceData.length; i++) {
      if (macdLine[i].value === null || i < slowPeriod + signalPeriod - 2) {
        results.push({
          timestamp: priceData[i].timestamp,
          value: [null, null, null] // [MACD, Signal, Histogram]
        });
        continue;
      }
      
      const macd = macdLine[i].value as number;
      const signal = signalLine[signalIndex++];
      const histogram = macd - signal;
      
      results.push({
        timestamp: priceData[i].timestamp,
        value: [macd, signal, histogram]
      });
    }
    
    return results;
  }

  /**
   * Calculates Bollinger Bands
   * @param priceData The price data
   * @param period The period for the SMA
   * @param stdDev The number of standard deviations
   * @returns The Bollinger Bands results
   */
  private calculateBollingerBands(
    priceData: PriceData[],
    period: number,
    stdDev: number
  ): IndicatorResult[] {
    const results: IndicatorResult[] = [];
    
    for (let i = 0; i < priceData.length; i++) {
      if (i < period - 1) {
        // Not enough data yet
        results.push({
          timestamp: priceData[i].timestamp,
          value: [null, null, null] // [Lower, Middle, Upper]
        });
        continue;
      }
      
      // Calculate SMA
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += priceData[i - j].close;
      }
      
      const sma = sum / period;
      
      // Calculate standard deviation
      let sumSquaredDiff = 0;
      for (let j = 0; j < period; j++) {
        const diff = priceData[i - j].close - sma;
        sumSquaredDiff += diff * diff;
      }
      
      const standardDeviation = Math.sqrt(sumSquaredDiff / period);
      
      // Calculate Bollinger Bands
      const upper = sma + (standardDeviation * stdDev);
      const lower = sma - (standardDeviation * stdDev);
      
      results.push({
        timestamp: priceData[i].timestamp,
        value: [lower, sma, upper]
      });
    }
    
    return results;
  }

  /**
   * Calculates Relative Strength Index (RSI)
   * @param priceData The price data
   * @param period The period for the RSI
   * @returns The RSI results
   */
  private calculateRSI(priceData: PriceData[], period: number): IndicatorResult[] {
    const results: IndicatorResult[] = [];
    
    // Calculate price changes
    const changes: number[] = [];
    for (let i = 1; i < priceData.length; i++) {
      changes.push(priceData[i].close - priceData[i - 1].close);
    }
    
    // Calculate initial average gain and loss
    let sumGain = 0;
    let sumLoss = 0;
    
    for (let i = 0; i < period; i++) {
      if (i >= changes.length) break;
      
      if (changes[i] > 0) {
        sumGain += changes[i];
      } else {
        sumLoss += Math.abs(changes[i]);
      }
    }
    
    let avgGain = sumGain / period;
    let avgLoss = sumLoss / period;
    
    // Add null values for the first period
    for (let i = 0; i < period; i++) {
      results.push({
        timestamp: priceData[i].timestamp,
        value: null
      });
    }
    
    // Calculate RSI
    for (let i = period; i < priceData.length; i++) {
      // Calculate RS
      const rs = avgGain / (avgLoss || 0.00001); // Avoid division by zero
      
      // Calculate RSI
      const rsi = 100 - (100 / (1 + rs));
      
      results.push({
        timestamp: priceData[i].timestamp,
        value: rsi
      });
      
      // Update average gain and loss for the next period
      if (i < changes.length) {
        const change = changes[i];
        const currentGain = change > 0 ? change : 0;
        const currentLoss = change < 0 ? Math.abs(change) : 0;
        
        // Smoothed averages
        avgGain = ((avgGain * (period - 1)) + currentGain) / period;
        avgLoss = ((avgLoss * (period - 1)) + currentLoss) / period;
      }
    }
    
    return results;
  }

  /**
   * Calculates Stochastic Oscillator
   * @param priceData The price data
   * @param kPeriod The %K period
   * @param dPeriod The %D period
   * @param smooth The smoothing period
   * @returns The Stochastic Oscillator results
   */
  private calculateStochastic(
    priceData: PriceData[],
    kPeriod: number,
    dPeriod: number,
    smooth: number
  ): IndicatorResult[] {
    const results: IndicatorResult[] = [];
    
    // Calculate %K
    const kValues: number[] = [];
    
    for (let i = 0; i < priceData.length; i++) {
      if (i < kPeriod - 1) {
        // Not enough data yet
        results.push({
          timestamp: priceData[i].timestamp,
          value: [null, null] // [%K, %D]
        });
        continue;
      }
      
      // Find highest high and lowest low in the period
      let highestHigh = -Infinity;
      let lowestLow = Infinity;
      
      for (let j = 0; j < kPeriod; j++) {
        const high = priceData[i - j].high;
        const low = priceData[i - j].low;
        
        if (high > highestHigh) {
          highestHigh = high;
        }
        
        if (low < lowestLow) {
          lowestLow = low;
        }
      }
      
      // Calculate %K
      const range = highestHigh - lowestLow;
      const k = range === 0 ? 50 : ((priceData[i].close - lowestLow) / range) * 100;
      kValues.push(k);
      
      // Calculate %D (SMA of %K)
      if (kValues.length >= dPeriod) {
        let sum = 0;
        for (let j = 0; j < dPeriod; j++) {
          sum += kValues[kValues.length - 1 - j];
        }
        
        const d = sum / dPeriod;
        
        results.push({
          timestamp: priceData[i].timestamp,
          value: [k, d]
        });
      } else {
        results.push({
          timestamp: priceData[i].timestamp,
          value: [k, null]
        });
      }
    }
    
    return results;
  }

  /**
   * Calculates On-Balance Volume (OBV)
   * @param priceData The price data
   * @returns The OBV results
   */
  private calculateOBV(priceData: PriceData[]): IndicatorResult[] {
    const results: IndicatorResult[] = [];
    
    let obv = 0;
    
    for (let i = 0; i < priceData.length; i++) {
      if (i === 0) {
        // First day, just set the initial OBV
        results.push({
          timestamp: priceData[i].timestamp,
          value: obv
        });
        continue;
      }
      
      // Calculate OBV
      if (priceData[i].close > priceData[i - 1].close) {
        // Price up, add volume
        obv += priceData[i].volume;
      } else if (priceData[i].close < priceData[i - 1].close) {
        // Price down, subtract volume
        obv -= priceData[i].volume;
      }
      // If price unchanged, OBV remains the same
      
      results.push({
        timestamp: priceData[i].timestamp,
        value: obv
      });
    }
    
    return results;
  }

  /**
   * Calculates Average True Range (ATR)
   * @param priceData The price data
   * @param period The period for the ATR
   * @returns The ATR results
   */
  private calculateATR(priceData: PriceData[], period: number): IndicatorResult[] {
    const results: IndicatorResult[] = [];
    
    // Calculate True Range (TR)
    const trueRanges: number[] = [];
    
    for (let i = 0; i < priceData.length; i++) {
      if (i === 0) {
        // First day, TR is simply High - Low
        trueRanges.push(priceData[i].high - priceData[i].low);
        results.push({
          timestamp: priceData[i].timestamp,
          value: null
        });
        continue;
      }
      
      // Calculate TR
      const tr1 = priceData[i].high - priceData[i].low; // Current high - current low
      const tr2 = Math.abs(priceData[i].high - priceData[i - 1].close); // Current high - previous close
      const tr3 = Math.abs(priceData[i].low - priceData[i - 1].close); // Current low - previous close
      
      const tr = Math.max(tr1, tr2, tr3);
      trueRanges.push(tr);
      
      if (i < period) {
        results.push({
          timestamp: priceData[i].timestamp,
          value: null
        });
        continue;
      }
      
      // Calculate ATR
      if (i === period) {
        // First ATR is simple average of TR
        let sum = 0;
        for (let j = 0; j < period; j++) {
          sum += trueRanges[i - j];
        }
        
        const atr = sum / period;
        
        results.push({
          timestamp: priceData[i].timestamp,
          value: atr
        });
        continue;
      }
      
      // Calculate smoothed ATR
      const previousATR = results[i - 1].value as number;
      const atr = ((previousATR * (period - 1)) + tr) / period;
      
      results.push({
        timestamp: priceData[i].timestamp,
        value: atr
      });
    }
    
    return results;
  }

  /**
   * Detects Head and Shoulders pattern
   * @param priceData The price data
   * @returns The detected patterns
   */
  private detectHeadAndShoulders(priceData: PriceData[]): PatternRecognitionResult[] {
    const results: PatternRecognitionResult[] = [];
    
    // Simplified pattern detection
    // In a real implementation, this would be more sophisticated
    
    // Need at least 20 data points for a head and shoulders pattern
    if (priceData.length < 20) {
      return results;
    }
    
    // Look for potential head and shoulders patterns
    for (let i = 20; i < priceData.length; i++) {
      // Check for left shoulder, head, right shoulder
      // This is a simplified implementation
      
      // Get local maxima and minima
      const leftShoulderIndex = i - 15;
      const headIndex = i - 10;
      const rightShoulderIndex = i - 5;
      
      const leftShoulder = priceData[leftShoulderIndex].high;
      const head = priceData[headIndex].high;
      const rightShoulder = priceData[rightShoulderIndex].high;
      
      // Check if it forms a head and shoulders pattern
      if (head > leftShoulder && head > rightShoulder && Math.abs(leftShoulder - rightShoulder) / leftShoulder < 0.1) {
        results.push({
          timestamp: priceData[i].timestamp,
          pattern: PatternType.HEAD_AND_SHOULDERS,
          strength: 0.7, // Simplified strength calculation
          direction: 'bearish'
        });
      }
      
      // Check for inverse head and shoulders
      const leftShoulderLow = priceData[leftShoulderIndex].low;
      const headLow = priceData[headIndex].low;
      const rightShoulderLow = priceData[rightShoulderIndex].low;
      
      if (headLow < leftShoulderLow && headLow < rightShoulderLow && Math.abs(leftShoulderLow - rightShoulderLow) / leftShoulderLow < 0.1) {
        results.push({
          timestamp: priceData[i].timestamp,
          pattern: PatternType.INVERSE_HEAD_AND_SHOULDERS,
          strength: 0.7, // Simplified strength calculation
          direction: 'bullish'
        });
      }
    }
    
    return results;
  }

  /**
   * Detects Double Top pattern
   * @param priceData The price data
   * @returns The detected patterns
   */
  private detectDoubleTop(priceData: PriceData[]): PatternRecognitionResult[] {
    const results: PatternRecognitionResult[] = [];
    
    // Simplified pattern detection
    // In a real implementation, this would be more sophisticated
    
    // Need at least 15 data points for a double top pattern
    if (priceData.length < 15) {
      return results;
    }
    
    // Look for potential double top patterns
    for (let i = 15; i < priceData.length; i++) {
      // Check for two peaks with similar heights
      const peak1Index = i - 10;
      const peak2Index = i - 2;
      
      const peak1 = priceData[peak1Index].high;
      const peak2 = priceData[peak2Index].high;
      
      // Check if it forms a double top pattern
      if (Math.abs(peak1 - peak2) / peak1 < 0.03 && peak1 > priceData[peak1Index - 5].high && peak2 > priceData[peak2Index - 5].high) {
        results.push({
          timestamp: priceData[i].timestamp,
          pattern: PatternType.DOUBLE_TOP,
          strength: 0.8, // Simplified strength calculation
          direction: 'bearish'
        });
      }
    }
    
    return results;
  }

  /**
   * Detects Double Bottom pattern
   * @param priceData The price data
   * @returns The detected patterns
   */
  private detectDoubleBottom(priceData: PriceData[]): PatternRecognitionResult[] {
    const results: PatternRecognitionResult[] = [];
    
    // Simplified pattern detection
    // In a real implementation, this would be more sophisticated
    
    // Need at least 15 data points for a double bottom pattern
    if (priceData.length < 15) {
      return results;
    }
    
    // Look for potential double bottom patterns
    for (let i = 15; i < priceData.length; i++) {
      // Check for two troughs with similar heights
      const trough1Index = i - 10;
      const trough2Index = i - 2;
      
      const trough1 = priceData[trough1Index].low;
      const trough2 = priceData[trough2Index].low;
      
      // Check if it forms a double bottom pattern
      if (Math.abs(trough1 - trough2) / trough1 < 0.03 && trough1 < priceData[trough1Index - 5].low && trough2 < priceData[trough2Index - 5].low) {
        results.push({
          timestamp: priceData[i].timestamp,
          pattern: PatternType.DOUBLE_BOTTOM,
          strength: 0.8, // Simplified strength calculation
          direction: 'bullish'
        });
      }
    }
    
    return results;
  }

  /**
   * Detects Doji candlestick pattern
   * @param priceData The price data
   * @returns The detected patterns
   */
  private detectDoji(priceData: PriceData[]): PatternRecognitionResult[] {
    const results: PatternRecognitionResult[] = [];
    
    for (let i = 0; i < priceData.length; i++) {
      const data = priceData[i];
      const bodySize = Math.abs(data.open - data.close);
      const totalRange = data.high - data.low;
      
      // Check if it's a doji (very small body compared to range)
      if (totalRange > 0 && bodySize / totalRange < 0.1) {
        results.push({
          timestamp: data.timestamp,
          pattern: PatternType.DOJI,
          strength: 0.6, // Simplified strength calculation
          direction: 'neutral'
        });
      }
    }
    
    return results;
  }

  /**
   * Detects Engulfing candlestick pattern
   * @param priceData The price data
   * @returns The detected patterns
   */
  private detectEngulfing(priceData: PriceData[]): PatternRecognitionResult[] {
    const results: PatternRecognitionResult[] = [];
    
    for (let i = 1; i < priceData.length; i++) {
      const prev = priceData[i - 1];
      const curr = priceData[i];
      
      const prevBody = Math.abs(prev.open - prev.close);
      const currBody = Math.abs(curr.open - curr.close);
      
      // Bullish engulfing
      if (prev.close < prev.open && curr.close > curr.open && curr.open < prev.close && curr.close > prev.open && currBody > prevBody) {
        results.push({
          timestamp: curr.timestamp,
          pattern: PatternType.ENGULFING,
          strength: 0.7, // Simplified strength calculation
          direction: 'bullish'
        });
      }
      
      // Bearish engulfing
      if (prev.close > prev.open && curr.close < curr.open && curr.open > prev.close && curr.close < prev.open && currBody > prevBody) {
        results.push({
          timestamp: curr.timestamp,
          pattern: PatternType.ENGULFING,
          strength: 0.7, // Simplified strength calculation
          direction: 'bearish'
        });
      }
    }
    
    return results;
  }

  /**
   * Detects Gap patterns
   * @param priceData The price data
   * @returns The detected patterns
   */
  private detectGaps(priceData: PriceData[]): PatternRecognitionResult[] {
    const results: PatternRecognitionResult[] = [];
    
    for (let i = 1; i < priceData.length; i++) {
      const prev = priceData[i - 1];
      const curr = priceData[i];
      
      // Gap up
      if (curr.low > prev.high) {
        const gapSize = (curr.low - prev.high) / prev.high;
        
        // Only consider significant gaps
        if (gapSize > 0.01) {
          results.push({
            timestamp: curr.timestamp,
            pattern: PatternType.GAP_UP,
            strength: Math.min(gapSize * 10, 1), // Strength based on gap size
            direction: 'bullish'
          });
        }
      }
      
      // Gap down
      if (curr.high < prev.low) {
        const gapSize = (prev.low - curr.high) / prev.low;
        
        // Only consider significant gaps
        if (gapSize > 0.01) {
          results.push({
            timestamp: curr.timestamp,
            pattern: PatternType.GAP_DOWN,
            strength: Math.min(gapSize * 10, 1), // Strength based on gap size
            direction: 'bearish'
          });
        }
      }
    }
    
    return results;
  }

  /**
   * Finds support and resistance levels
   * @param priceData The price data
   * @returns The support and resistance levels
   */
  private findSupportResistanceLevels(priceData: PriceData[]): { support: number[], resistance: number[] } {
    // Simplified implementation
    // In a real implementation, this would be more sophisticated
    
    const pivotPoints: { price: number, type: 'high' | 'low' }[] = [];
    
    // Find pivot points (local highs and lows)
    for (let i = 2; i < priceData.length - 2; i++) {
      // Check for local high
      if (priceData[i].high > priceData[i - 1].high && 
          priceData[i].high > priceData[i - 2].high && 
          priceData[i].high > priceData[i + 1].high && 
          priceData[i].high > priceData[i + 2].high) {
        pivotPoints.push({
          price: priceData[i].high,
          type: 'high'
        });
      }
      
      // Check for local low
      if (priceData[i].low < priceData[i - 1].low && 
          priceData[i].low < priceData[i - 2].low && 
          priceData[i].low < priceData[i + 1].low && 
          priceData[i].low < priceData[i + 2].low) {
        pivotPoints.push({
          price: priceData[i].low,
          type: 'low'
        });
      }
    }
    
    // Group pivot points into zones
    const zones: { price: number, count: number, type: 'high' | 'low' }[] = [];
    const zoneThreshold = 0.01; // 1% threshold for grouping
    
    for (const pivot of pivotPoints) {
      let foundZone = false;
      
      for (const zone of zones) {
        if (Math.abs(pivot.price - zone.price) / zone.price < zoneThreshold && pivot.type === zone.type) {
          // Update zone
          zone.price = (zone.price * zone.count + pivot.price) / (zone.count + 1);
          zone.count++;
          foundZone = true;
          break;
        }
      }
      
      if (!foundZone) {
        zones.push({
          price: pivot.price,
          count: 1,
          type: pivot.type
        });
      }
    }
    
    // Sort zones by count (strength)
    zones.sort((a, b) => b.count - a.count);
    
    // Get top support and resistance levels
    const support = zones
      .filter(zone => zone.type === 'low')
      .slice(0, 3)
      .map(zone => zone.price);
    
    const resistance = zones
      .filter(zone => zone.type === 'high')
      .slice(0, 3)
      .map(zone => zone.price);
    
    return { support, resistance };
  }

  /**
   * Analyzes trend direction and strength
   * @param priceData The price data
   * @param sma20 The 20-period SMA
   * @param sma50 The 50-period SMA
   * @param sma200 The 200-period SMA
   * @returns The trend analysis
   */
  private analyzeTrend(
    priceData: PriceData[],
    sma20: IndicatorResult[],
    sma50: IndicatorResult[],
    sma200: IndicatorResult[]
  ): { direction: 'up' | 'down' | 'sideways', strength: number } {
    // Get the latest values
    const latestSma20 = sma20[sma20.length - 1].value as number;
    const latestSma50 = sma50[sma50.length - 1].value as number;
    const latestSma200 = sma200[sma200.length - 1].value as number;
    
    // Determine trend direction
    let direction: 'up' | 'down' | 'sideways' = 'sideways';
    let strength = 0;
    
    if (latestSma20 > latestSma50 && latestSma50 > latestSma200) {
      direction = 'up';
      strength = 0.8;
    } else if (latestSma20 < latestSma50 && latestSma50 < latestSma200) {
      direction = 'down';
      strength = 0.8;
    } else if (latestSma20 > latestSma50 && latestSma50 < latestSma200) {
      direction = 'up';
      strength = 0.4;
    } else if (latestSma20 < latestSma50 && latestSma50 > latestSma200) {
      direction = 'down';
      strength = 0.4;
    } else {
      // Check recent price action
      const recentPrices = priceData.slice(-20);
      const priceChanges = recentPrices.map((p, i) => i > 0 ? p.close - recentPrices[i - 1].close : 0);
      const positiveChanges = priceChanges.filter(c => c > 0).length;
      const negativeChanges = priceChanges.filter(c => c < 0).length;
      
      if (positiveChanges > negativeChanges * 1.5) {
        direction = 'up';
        strength = 0.3;
      } else if (negativeChanges > positiveChanges * 1.5) {
        direction = 'down';
        strength = 0.3;
      } else {
        direction = 'sideways';
        strength = 0.2;
      }
    }
    
    return { direction, strength };
  }

  /**
   * Analyzes momentum
   * @param rsi The RSI indicator results
   * @param macd The MACD indicator results
   * @returns The momentum analysis
   */
  private analyzeMomentum(
    rsi: IndicatorResult[],
    macd: IndicatorResult[]
  ): { value: number, overbought: boolean, oversold: boolean } {
    // Get the latest values
    const latestRsi = rsi[rsi.length - 1].value as number;
    const latestMacd = macd[macd.length - 1].value as number[];
    
    // Determine momentum
    let momentum = 0;
    
    // RSI contribution
    if (latestRsi > 70) {
      momentum = 0.8;
    } else if (latestRsi > 60) {
      momentum = 0.6;
    } else if (latestRsi > 50) {
      momentum = 0.4;
    } else if (latestRsi > 40) {
      momentum = 0.2;
    } else if (latestRsi > 30) {
      momentum = 0;
    } else {
      momentum = -0.2;
    }
    
    // MACD contribution
    if (latestMacd[2] > 0 && latestMacd[2] > latestMacd[2]) {
      momentum += 0.2;
    } else if (latestMacd[2] < 0 && latestMacd[2] < latestMacd[2]) {
      momentum -= 0.2;
    }
    
    // Normalize to 0-100 scale
    const normalizedMomentum = (momentum + 1) * 50;
    
    return {
      value: normalizedMomentum,
      overbought: latestRsi > 70,
      oversold: latestRsi < 30
    };
  }
}