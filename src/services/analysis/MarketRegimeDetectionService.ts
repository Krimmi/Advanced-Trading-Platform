/**
 * Market Regime Detection Service
 * Identifies market regimes, detects regime transitions, and adapts strategies accordingly
 */

import { injectable, inject } from 'inversify';
import { MarketDataService } from '../market/MarketDataService';
import { LoggerService } from '../common/LoggerService';
import { TechnicalAnalysisService } from './TechnicalAnalysisService';

export enum MarketRegimeType {
  BULL_TREND = 'BULL_TREND',
  BEAR_TREND = 'BEAR_TREND',
  SIDEWAYS = 'SIDEWAYS',
  HIGH_VOLATILITY = 'HIGH_VOLATILITY',
  LOW_VOLATILITY = 'LOW_VOLATILITY',
  RECOVERY = 'RECOVERY',
  CORRECTION = 'CORRECTION',
  BUBBLE = 'BUBBLE',
  CRASH = 'CRASH',
  ROTATION = 'ROTATION'
}

export interface MarketRegime {
  type: MarketRegimeType;
  startDate: Date;
  endDate?: Date;
  confidence: number; // 0-1
  characteristics: {
    trend: 'up' | 'down' | 'sideways';
    volatility: 'high' | 'normal' | 'low';
    breadth: 'wide' | 'narrow';
    sentiment: 'bullish' | 'bearish' | 'neutral';
    liquidity: 'high' | 'normal' | 'low';
  };
  metrics: {
    averageReturn: number;
    volatility: number;
    drawdown: number;
    sharpeRatio: number;
    breadthIndicator: number; // 0-100
  };
}

export interface RegimeTransition {
  from: MarketRegimeType;
  to: MarketRegimeType;
  date: Date;
  confidence: number; // 0-1
  signals: {
    name: string;
    value: number;
    threshold: number;
    triggered: boolean;
  }[];
  leadingIndicators: {
    name: string;
    value: number;
    direction: 'improving' | 'deteriorating' | 'stable';
  }[];
}

export interface MarketRegimeAnalysis {
  symbol: string;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  startDate: Date;
  endDate: Date;
  currentRegime: MarketRegime;
  historicalRegimes: MarketRegime[];
  recentTransitions: RegimeTransition[];
  regimeProbabilities: {
    type: MarketRegimeType;
    probability: number;
  }[];
  leadingIndicators: {
    name: string;
    value: number;
    direction: 'improving' | 'deteriorating' | 'stable';
    regimeImplication: MarketRegimeType;
  }[];
}

export interface RegimeBasedStrategy {
  id: string;
  name: string;
  description: string;
  applicableRegimes: MarketRegimeType[];
  parameters: Record<string, any>;
  expectedPerformance: {
    regime: MarketRegimeType;
    expectedReturn: number;
    expectedRisk: number;
    winRate: number;
    drawdown: number;
  }[];
}

@injectable()
export class MarketRegimeDetectionService {
  constructor(
    @inject(MarketDataService) private marketDataService: MarketDataService,
    @inject(TechnicalAnalysisService) private technicalAnalysisService: TechnicalAnalysisService,
    @inject(LoggerService) private logger: LoggerService
  ) {}

  /**
   * Detects the current market regime
   * @param symbol The symbol to analyze (e.g., SPY for S&P 500)
   * @param lookbackPeriod The lookback period in days
   * @returns The market regime analysis
   */
  public async detectMarketRegime(
    symbol: string = 'SPY',
    lookbackPeriod: number = 252
  ): Promise<MarketRegimeAnalysis> {
    this.logger.info('Detecting market regime', { symbol, lookbackPeriod });
    
    try {
      // Get historical price data
      const priceData = await this.getPriceData(symbol, lookbackPeriod);
      
      // Calculate technical indicators
      const sma50 = await this.technicalAnalysisService.calculateIndicator(symbol, 'SMA', 50);
      const sma200 = await this.technicalAnalysisService.calculateIndicator(symbol, 'SMA', 200);
      const rsi = await this.technicalAnalysisService.calculateIndicator(symbol, 'RSI', 14);
      const atr = await this.technicalAnalysisService.calculateIndicator(symbol, 'ATR', 14);
      const bollingerBands = await this.technicalAnalysisService.calculateIndicator(symbol, 'BOLLINGER_BANDS', 20);
      
      // Identify historical regimes
      const historicalRegimes = this.identifyHistoricalRegimes(priceData, sma50, sma200, rsi, atr, bollingerBands);
      
      // Determine current regime
      const currentRegime = historicalRegimes[historicalRegimes.length - 1];
      
      // Identify regime transitions
      const recentTransitions = this.identifyRegimeTransitions(historicalRegimes);
      
      // Calculate regime probabilities
      const regimeProbabilities = this.calculateRegimeProbabilities(priceData, sma50, sma200, rsi, atr, bollingerBands);
      
      // Identify leading indicators
      const leadingIndicators = this.identifyLeadingIndicators(priceData, sma50, sma200, rsi, atr, bollingerBands);
      
      return {
        symbol,
        period: lookbackPeriod <= 30 ? 'month' : lookbackPeriod <= 90 ? 'quarter' : 'year',
        startDate: priceData[0].timestamp,
        endDate: priceData[priceData.length - 1].timestamp,
        currentRegime,
        historicalRegimes,
        recentTransitions,
        regimeProbabilities,
        leadingIndicators
      };
    } catch (error) {
      this.logger.error('Error detecting market regime', { 
        symbol, 
        lookbackPeriod, 
        error: error.message 
      });
      
      throw error;
    }
  }

  /**
   * Gets regime-based strategies for the current market regime
   * @param regimeAnalysis The market regime analysis
   * @returns The recommended strategies
   */
  public async getRegimeBasedStrategies(
    regimeAnalysis: MarketRegimeAnalysis
  ): Promise<RegimeBasedStrategy[]> {
    this.logger.info('Getting regime-based strategies', { 
      symbol: regimeAnalysis.symbol,
      currentRegime: regimeAnalysis.currentRegime.type
    });
    
    try {
      // Get all available strategies
      const allStrategies = await this.getAllStrategies();
      
      // Filter strategies applicable to the current regime
      const applicableStrategies = allStrategies.filter(strategy => 
        strategy.applicableRegimes.includes(regimeAnalysis.currentRegime.type)
      );
      
      // Sort by expected performance in the current regime
      applicableStrategies.sort((a, b) => {
        const aPerf = a.expectedPerformance.find(p => p.regime === regimeAnalysis.currentRegime.type);
        const bPerf = b.expectedPerformance.find(p => p.regime === regimeAnalysis.currentRegime.type);
        
        if (!aPerf) return 1;
        if (!bPerf) return -1;
        
        // Sort by Sharpe ratio (expected return / expected risk)
        const aSharpe = aPerf.expectedReturn / aPerf.expectedRisk;
        const bSharpe = bPerf.expectedReturn / bPerf.expectedRisk;
        
        return bSharpe - aSharpe;
      });
      
      return applicableStrategies;
    } catch (error) {
      this.logger.error('Error getting regime-based strategies', { 
        symbol: regimeAnalysis.symbol, 
        currentRegime: regimeAnalysis.currentRegime.type, 
        error: error.message 
      });
      
      throw error;
    }
  }

  /**
   * Adapts a strategy to the current market regime
   * @param strategy The strategy to adapt
   * @param regimeAnalysis The market regime analysis
   * @returns The adapted strategy parameters
   */
  public async adaptStrategyToRegime(
    strategy: RegimeBasedStrategy,
    regimeAnalysis: MarketRegimeAnalysis
  ): Promise<{
    originalParameters: Record<string, any>;
    adaptedParameters: Record<string, any>;
    adaptationRationale: {
      parameter: string;
      originalValue: any;
      newValue: any;
      reason: string;
    }[];
  }> {
    this.logger.info('Adapting strategy to regime', { 
      strategyId: strategy.id,
      currentRegime: regimeAnalysis.currentRegime.type
    });
    
    try {
      const originalParameters = { ...strategy.parameters };
      const adaptedParameters = { ...strategy.parameters };
      const adaptationRationale = [];
      
      // Adapt parameters based on the current regime
      switch (regimeAnalysis.currentRegime.type) {
        case MarketRegimeType.BULL_TREND:
          // In bull trend, increase exposure and reduce stop loss
          if ('exposure' in adaptedParameters) {
            const originalExposure = adaptedParameters.exposure;
            adaptedParameters.exposure = Math.min(1, originalExposure * 1.2);
            
            adaptationRationale.push({
              parameter: 'exposure',
              originalValue: originalExposure,
              newValue: adaptedParameters.exposure,
              reason: 'Increased exposure to capitalize on bullish trend'
            });
          }
          
          if ('stopLossPercent' in adaptedParameters) {
            const originalStopLoss = adaptedParameters.stopLossPercent;
            adaptedParameters.stopLossPercent = originalStopLoss * 0.8;
            
            adaptationRationale.push({
              parameter: 'stopLossPercent',
              originalValue: originalStopLoss,
              newValue: adaptedParameters.stopLossPercent,
              reason: 'Reduced stop loss to allow for normal market fluctuations in bullish trend'
            });
          }
          break;
        
        case MarketRegimeType.BEAR_TREND:
          // In bear trend, decrease exposure and increase stop loss
          if ('exposure' in adaptedParameters) {
            const originalExposure = adaptedParameters.exposure;
            adaptedParameters.exposure = originalExposure * 0.6;
            
            adaptationRationale.push({
              parameter: 'exposure',
              originalValue: originalExposure,
              newValue: adaptedParameters.exposure,
              reason: 'Decreased exposure to reduce risk in bearish trend'
            });
          }
          
          if ('stopLossPercent' in adaptedParameters) {
            const originalStopLoss = adaptedParameters.stopLossPercent;
            adaptedParameters.stopLossPercent = originalStopLoss * 0.7;
            
            adaptationRationale.push({
              parameter: 'stopLossPercent',
              originalValue: originalStopLoss,
              newValue: adaptedParameters.stopLossPercent,
              reason: 'Tightened stop loss to protect capital in bearish trend'
            });
          }
          break;
        
        case MarketRegimeType.HIGH_VOLATILITY:
          // In high volatility, decrease position size and widen stop loss
          if ('positionSize' in adaptedParameters) {
            const originalPositionSize = adaptedParameters.positionSize;
            adaptedParameters.positionSize = originalPositionSize * 0.7;
            
            adaptationRationale.push({
              parameter: 'positionSize',
              originalValue: originalPositionSize,
              newValue: adaptedParameters.positionSize,
              reason: 'Reduced position size to manage risk in high volatility environment'
            });
          }
          
          if ('stopLossPercent' in adaptedParameters) {
            const originalStopLoss = adaptedParameters.stopLossPercent;
            adaptedParameters.stopLossPercent = originalStopLoss * 1.3;
            
            adaptationRationale.push({
              parameter: 'stopLossPercent',
              originalValue: originalStopLoss,
              newValue: adaptedParameters.stopLossPercent,
              reason: 'Widened stop loss to accommodate higher volatility'
            });
          }
          break;
        
        case MarketRegimeType.SIDEWAYS:
          // In sideways market, focus on mean reversion
          if ('meanReversionStrength' in adaptedParameters) {
            const originalStrength = adaptedParameters.meanReversionStrength;
            adaptedParameters.meanReversionStrength = originalStrength * 1.5;
            
            adaptationRationale.push({
              parameter: 'meanReversionStrength',
              originalValue: originalStrength,
              newValue: adaptedParameters.meanReversionStrength,
              reason: 'Increased mean reversion strength for sideways market'
            });
          }
          
          if ('trendFollowingStrength' in adaptedParameters) {
            const originalStrength = adaptedParameters.trendFollowingStrength;
            adaptedParameters.trendFollowingStrength = originalStrength * 0.5;
            
            adaptationRationale.push({
              parameter: 'trendFollowingStrength',
              originalValue: originalStrength,
              newValue: adaptedParameters.trendFollowingStrength,
              reason: 'Decreased trend following strength for sideways market'
            });
          }
          break;
        
        // Add more regime-specific adaptations as needed
      }
      
      return {
        originalParameters,
        adaptedParameters,
        adaptationRationale
      };
    } catch (error) {
      this.logger.error('Error adapting strategy to regime', { 
        strategyId: strategy.id, 
        currentRegime: regimeAnalysis.currentRegime.type, 
        error: error.message 
      });
      
      throw error;
    }
  }

  /**
   * Backtests strategies across different market regimes
   * @param symbol The symbol to backtest
   * @param strategies The strategies to backtest
   * @param startDate The start date
   * @param endDate The end date
   * @returns The backtest results
   */
  public async backtestStrategiesAcrossRegimes(
    symbol: string,
    strategies: RegimeBasedStrategy[],
    startDate: Date,
    endDate: Date
  ): Promise<{
    symbol: string;
    startDate: Date;
    endDate: Date;
    regimes: MarketRegime[];
    results: {
      strategyId: string;
      strategyName: string;
      overallPerformance: {
        totalReturn: number;
        annualizedReturn: number;
        sharpeRatio: number;
        maxDrawdown: number;
        winRate: number;
      };
      regimePerformance: {
        regime: MarketRegimeType;
        totalReturn: number;
        sharpeRatio: number;
        maxDrawdown: number;
        winRate: number;
      }[];
    }[];
  }> {
    this.logger.info('Backtesting strategies across regimes', { 
      symbol, 
      strategies: strategies.map(s => s.id),
      startDate,
      endDate
    });
    
    try {
      // Get historical price data
      const priceData = await this.getPriceData(symbol, 0, startDate, endDate);
      
      // Calculate technical indicators
      const sma50 = await this.technicalAnalysisService.calculateIndicator(symbol, 'SMA', 50);
      const sma200 = await this.technicalAnalysisService.calculateIndicator(symbol, 'SMA', 200);
      const rsi = await this.technicalAnalysisService.calculateIndicator(symbol, 'RSI', 14);
      const atr = await this.technicalAnalysisService.calculateIndicator(symbol, 'ATR', 14);
      const bollingerBands = await this.technicalAnalysisService.calculateIndicator(symbol, 'BOLLINGER_BANDS', 20);
      
      // Identify historical regimes
      const regimes = this.identifyHistoricalRegimes(priceData, sma50, sma200, rsi, atr, bollingerBands);
      
      // Backtest each strategy
      const results = [];
      
      for (const strategy of strategies) {
        // Simulate strategy performance
        const strategyPerformance = this.simulateStrategyPerformance(strategy, priceData, regimes);
        
        results.push({
          strategyId: strategy.id,
          strategyName: strategy.name,
          overallPerformance: strategyPerformance.overall,
          regimePerformance: strategyPerformance.byRegime
        });
      }
      
      return {
        symbol,
        startDate,
        endDate,
        regimes,
        results
      };
    } catch (error) {
      this.logger.error('Error backtesting strategies across regimes', { 
        symbol, 
        strategies: strategies.map(s => s.id),
        startDate,
        endDate,
        error: error.message 
      });
      
      throw error;
    }
  }

  /**
   * Gets historical price data
   * @param symbol The symbol
   * @param lookbackPeriod The lookback period in days
   * @param startDate Optional start date
   * @param endDate Optional end date
   * @returns The price data
   */
  private async getPriceData(
    symbol: string,
    lookbackPeriod: number = 0,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ timestamp: Date; open: number; high: number; low: number; close: number; volume: number }[]> {
    // In a real implementation, this would call the market data service
    // For now, we'll generate mock data
    
    const priceData = [];
    const end = endDate || new Date();
    let start: Date;
    
    if (startDate) {
      start = startDate;
    } else {
      start = new Date(end);
      start.setDate(end.getDate() - lookbackPeriod);
    }
    
    // Calculate number of days
    const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // Generate price data
    let price = 100 + Math.random() * 100; // Start with a random price between 100 and 200
    
    for (let i = 0; i <= days; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      
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
   * Identifies historical market regimes
   * @param priceData The price data
   * @param sma50 The 50-day SMA
   * @param sma200 The 200-day SMA
   * @param rsi The RSI
   * @param atr The ATR
   * @param bollingerBands The Bollinger Bands
   * @returns The historical regimes
   */
  private identifyHistoricalRegimes(
    priceData: any[],
    sma50: any[],
    sma200: any[],
    rsi: any[],
    atr: any[],
    bollingerBands: any[]
  ): MarketRegime[] {
    const regimes: MarketRegime[] = [];
    let currentRegime: MarketRegime | null = null;
    
    // Minimum regime length in days
    const minRegimeLength = 20;
    
    // Process each day
    for (let i = 0; i < priceData.length; i++) {
      // Skip days with insufficient indicator data
      if (!sma50[i]?.value || !sma200[i]?.value || !rsi[i]?.value || !atr[i]?.value || !bollingerBands[i]?.value) {
        continue;
      }
      
      // Get indicator values
      const price = priceData[i].close;
      const sma50Value = sma50[i].value as number;
      const sma200Value = sma200[i].value as number;
      const rsiValue = rsi[i].value as number;
      const atrValue = atr[i].value as number;
      const bbValue = bollingerBands[i].value as number[];
      
      // Calculate volatility
      const volatility = atrValue / price;
      
      // Calculate breadth (simplified)
      const breadth = Math.random(); // In a real implementation, this would use actual market breadth data
      
      // Determine regime type
      let regimeType: MarketRegimeType;
      let confidence = 0.7; // Default confidence
      
      // Bull trend conditions
      if (sma50Value > sma200Value && price > sma50Value && rsiValue > 50) {
        regimeType = MarketRegimeType.BULL_TREND;
        confidence = 0.7 + (rsiValue - 50) / 100; // Higher RSI increases confidence
      }
      // Bear trend conditions
      else if (sma50Value < sma200Value && price < sma50Value && rsiValue < 50) {
        regimeType = MarketRegimeType.BEAR_TREND;
        confidence = 0.7 + (50 - rsiValue) / 100; // Lower RSI increases confidence
      }
      // High volatility conditions
      else if (volatility > 0.02) {
        regimeType = MarketRegimeType.HIGH_VOLATILITY;
        confidence = 0.6 + volatility * 10; // Higher volatility increases confidence
      }
      // Low volatility conditions
      else if (volatility < 0.01 && Math.abs(sma50Value - sma200Value) / sma200Value < 0.03) {
        regimeType = MarketRegimeType.LOW_VOLATILITY;
        confidence = 0.7 - volatility * 10; // Lower volatility increases confidence
      }
      // Sideways conditions
      else if (Math.abs(sma50Value - sma200Value) / sma200Value < 0.05 && rsiValue > 40 && rsiValue < 60) {
        regimeType = MarketRegimeType.SIDEWAYS;
        confidence = 0.6 + (1 - Math.abs(rsiValue - 50) / 10) / 5; // RSI closer to 50 increases confidence
      }
      // Recovery conditions
      else if (sma50Value > sma50[Math.max(0, i - 20)]?.value && sma50Value < sma200Value && rsiValue > 50) {
        regimeType = MarketRegimeType.RECOVERY;
        confidence = 0.6 + (rsiValue - 50) / 100; // Higher RSI increases confidence
      }
      // Correction conditions
      else if (sma50Value < sma50[Math.max(0, i - 20)]?.value && sma50Value > sma200Value && rsiValue < 50) {
        regimeType = MarketRegimeType.CORRECTION;
        confidence = 0.6 + (50 - rsiValue) / 100; // Lower RSI increases confidence
      }
      // Default to sideways
      else {
        regimeType = MarketRegimeType.SIDEWAYS;
        confidence = 0.5; // Lower confidence due to unclear signals
      }
      
      // Determine characteristics
      const trend = regimeType === MarketRegimeType.BULL_TREND || regimeType === MarketRegimeType.RECOVERY ? 'up' :
                    regimeType === MarketRegimeType.BEAR_TREND || regimeType === MarketRegimeType.CORRECTION ? 'down' : 'sideways';
      
      const volatilityLevel = regimeType === MarketRegimeType.HIGH_VOLATILITY ? 'high' :
                              regimeType === MarketRegimeType.LOW_VOLATILITY ? 'low' : 'normal';
      
      const breadthLevel = breadth > 0.7 ? 'wide' : 'narrow';
      
      const sentiment = rsiValue > 60 ? 'bullish' :
                        rsiValue < 40 ? 'bearish' : 'neutral';
      
      const liquidity = 'normal'; // Simplified
      
      // Calculate metrics
      // In a real implementation, these would be calculated from actual data
      const averageReturn = trend === 'up' ? 0.05 : trend === 'down' ? -0.05 : 0.01;
      const metricVolatility = volatilityLevel === 'high' ? 0.2 : volatilityLevel === 'low' ? 0.05 : 0.1;
      const drawdown = trend === 'down' ? 0.15 : trend === 'up' ? 0.05 : 0.1;
      const sharpeRatio = averageReturn / metricVolatility;
      const breadthIndicator = breadthLevel === 'wide' ? 70 : 40;
      
      // Check if regime has changed
      if (!currentRegime || currentRegime.type !== regimeType) {
        // If there's a current regime, set its end date
        if (currentRegime) {
          // Only end the regime if it has lasted long enough
          if (i - regimes.indexOf(currentRegime) >= minRegimeLength) {
            currentRegime.endDate = priceData[i - 1].timestamp;
            
            // Start new regime
            currentRegime = {
              type: regimeType,
              startDate: priceData[i].timestamp,
              confidence,
              characteristics: {
                trend,
                volatility: volatilityLevel,
                breadth: breadthLevel,
                sentiment,
                liquidity
              },
              metrics: {
                averageReturn,
                volatility: metricVolatility,
                drawdown,
                sharpeRatio,
                breadthIndicator
              }
            };
            
            regimes.push(currentRegime);
          }
          // If regime hasn't lasted long enough, just update the current regime
          else {
            currentRegime.type = regimeType;
            currentRegime.confidence = confidence;
            currentRegime.characteristics = {
              trend,
              volatility: volatilityLevel,
              breadth: breadthLevel,
              sentiment,
              liquidity
            };
            currentRegime.metrics = {
              averageReturn,
              volatility: metricVolatility,
              drawdown,
              sharpeRatio,
              breadthIndicator
            };
          }
        }
        // If there's no current regime, create one
        else {
          currentRegime = {
            type: regimeType,
            startDate: priceData[i].timestamp,
            confidence,
            characteristics: {
              trend,
              volatility: volatilityLevel,
              breadth: breadthLevel,
              sentiment,
              liquidity
            },
            metrics: {
              averageReturn,
              volatility: metricVolatility,
              drawdown,
              sharpeRatio,
              breadthIndicator
            }
          };
          
          regimes.push(currentRegime);
        }
      }
    }
    
    return regimes;
  }

  /**
   * Identifies regime transitions
   * @param regimes The historical regimes
   * @returns The regime transitions
   */
  private identifyRegimeTransitions(regimes: MarketRegime[]): RegimeTransition[] {
    const transitions: RegimeTransition[] = [];
    
    for (let i = 1; i < regimes.length; i++) {
      const fromRegime = regimes[i - 1];
      const toRegime = regimes[i];
      
      if (fromRegime.type !== toRegime.type && toRegime.startDate) {
        // Generate signals that triggered the transition
        const signals = [
          {
            name: 'SMA 50/200 Crossover',
            value: Math.random(), // In a real implementation, this would be actual indicator values
            threshold: 0.5,
            triggered: Math.random() > 0.5
          },
          {
            name: 'RSI Extreme',
            value: Math.random() * 100,
            threshold: 70,
            triggered: Math.random() > 0.5
          },
          {
            name: 'Volatility Spike',
            value: Math.random() * 0.05,
            threshold: 0.02,
            triggered: Math.random() > 0.5
          }
        ];
        
        // Generate leading indicators
        const leadingIndicators = [
          {
            name: 'Advance/Decline Line',
            value: Math.random() * 2 - 1,
            direction: Math.random() > 0.5 ? 'improving' as const : 'deteriorating' as const
          },
          {
            name: 'New Highs/Lows Ratio',
            value: Math.random() * 5,
            direction: Math.random() > 0.5 ? 'improving' as const : 'deteriorating' as const
          },
          {
            name: 'VIX',
            value: 15 + Math.random() * 20,
            direction: Math.random() > 0.5 ? 'improving' as const : 'deteriorating' as const
          }
        ];
        
        transitions.push({
          from: fromRegime.type,
          to: toRegime.type,
          date: toRegime.startDate,
          confidence: toRegime.confidence,
          signals,
          leadingIndicators
        });
      }
    }
    
    return transitions;
  }

  /**
   * Calculates regime probabilities
   * @param priceData The price data
   * @param sma50 The 50-day SMA
   * @param sma200 The 200-day SMA
   * @param rsi The RSI
   * @param atr The ATR
   * @param bollingerBands The Bollinger Bands
   * @returns The regime probabilities
   */
  private calculateRegimeProbabilities(
    priceData: any[],
    sma50: any[],
    sma200: any[],
    rsi: any[],
    atr: any[],
    bollingerBands: any[]
  ): { type: MarketRegimeType; probability: number }[] {
    // Get the latest data point
    const i = priceData.length - 1;
    
    // Skip if insufficient indicator data
    if (!sma50[i]?.value || !sma200[i]?.value || !rsi[i]?.value || !atr[i]?.value || !bollingerBands[i]?.value) {
      return [];
    }
    
    // Get indicator values
    const price = priceData[i].close;
    const sma50Value = sma50[i].value as number;
    const sma200Value = sma200[i].value as number;
    const rsiValue = rsi[i].value as number;
    const atrValue = atr[i].value as number;
    
    // Calculate volatility
    const volatility = atrValue / price;
    
    // Calculate probabilities
    const probabilities: { type: MarketRegimeType; probability: number }[] = [];
    
    // Bull trend probability
    let bullProb = 0;
    if (sma50Value > sma200Value) bullProb += 0.3;
    if (price > sma50Value) bullProb += 0.2;
    if (rsiValue > 50) bullProb += 0.2;
    if (rsiValue > 60) bullProb += 0.1;
    if (volatility < 0.015) bullProb += 0.1;
    probabilities.push({ type: MarketRegimeType.BULL_TREND, probability: bullProb });
    
    // Bear trend probability
    let bearProb = 0;
    if (sma50Value < sma200Value) bearProb += 0.3;
    if (price < sma50Value) bearProb += 0.2;
    if (rsiValue < 50) bearProb += 0.2;
    if (rsiValue < 40) bearProb += 0.1;
    if (volatility > 0.02) bearProb += 0.1;
    probabilities.push({ type: MarketRegimeType.BEAR_TREND, probability: bearProb });
    
    // Sideways probability
    let sidewaysProb = 0;
    if (Math.abs(sma50Value - sma200Value) / sma200Value < 0.05) sidewaysProb += 0.3;
    if (Math.abs(price - sma50Value) / sma50Value < 0.03) sidewaysProb += 0.2;
    if (rsiValue > 40 && rsiValue < 60) sidewaysProb += 0.3;
    if (volatility < 0.015) sidewaysProb += 0.1;
    probabilities.push({ type: MarketRegimeType.SIDEWAYS, probability: sidewaysProb });
    
    // High volatility probability
    let highVolProb = 0;
    if (volatility > 0.02) highVolProb += 0.4;
    if (Math.abs(price - sma50Value) / sma50Value > 0.05) highVolProb += 0.2;
    if (Math.abs(rsiValue - 50) > 20) highVolProb += 0.2;
    probabilities.push({ type: MarketRegimeType.HIGH_VOLATILITY, probability: highVolProb });
    
    // Low volatility probability
    let lowVolProb = 0;
    if (volatility < 0.01) lowVolProb += 0.4;
    if (Math.abs(price - sma50Value) / sma50Value < 0.02) lowVolProb += 0.2;
    if (Math.abs(rsiValue - 50) < 10) lowVolProb += 0.2;
    probabilities.push({ type: MarketRegimeType.LOW_VOLATILITY, probability: lowVolProb });
    
    // Recovery probability
    let recoveryProb = 0;
    if (sma50Value > sma50[Math.max(0, i - 20)]?.value) recoveryProb += 0.3;
    if (sma50Value < sma200Value) recoveryProb += 0.2;
    if (rsiValue > 50) recoveryProb += 0.2;
    if (price > sma50Value) recoveryProb += 0.2;
    probabilities.push({ type: MarketRegimeType.RECOVERY, probability: recoveryProb });
    
    // Correction probability
    let correctionProb = 0;
    if (sma50Value < sma50[Math.max(0, i - 20)]?.value) correctionProb += 0.3;
    if (sma50Value > sma200Value) correctionProb += 0.2;
    if (rsiValue < 50) correctionProb += 0.2;
    if (price < sma50Value) correctionProb += 0.2;
    probabilities.push({ type: MarketRegimeType.CORRECTION, probability: correctionProb });
    
    // Sort by probability
    probabilities.sort((a, b) => b.probability - a.probability);
    
    return probabilities;
  }

  /**
   * Identifies leading indicators
   * @param priceData The price data
   * @param sma50 The 50-day SMA
   * @param sma200 The 200-day SMA
   * @param rsi The RSI
   * @param atr The ATR
   * @param bollingerBands The Bollinger Bands
   * @returns The leading indicators
   */
  private identifyLeadingIndicators(
    priceData: any[],
    sma50: any[],
    sma200: any[],
    rsi: any[],
    atr: any[],
    bollingerBands: any[]
  ): {
    name: string;
    value: number;
    direction: 'improving' | 'deteriorating' | 'stable';
    regimeImplication: MarketRegimeType;
  }[] {
    // Get the latest data point
    const i = priceData.length - 1;
    
    // Skip if insufficient indicator data
    if (!sma50[i]?.value || !sma200[i]?.value || !rsi[i]?.value || !atr[i]?.value || !bollingerBands[i]?.value) {
      return [];
    }
    
    // Get indicator values
    const price = priceData[i].close;
    const sma50Value = sma50[i].value as number;
    const sma200Value = sma200[i].value as number;
    const rsiValue = rsi[i].value as number;
    const atrValue = atr[i].value as number;
    
    // Get previous values (20 days ago)
    const prevIndex = Math.max(0, i - 20);
    const prevRsiValue = rsi[prevIndex]?.value as number || 50;
    const prevAtrValue = atr[prevIndex]?.value as number || atrValue;
    
    // Calculate volatility
    const volatility = atrValue / price;
    const prevVolatility = prevAtrValue / priceData[prevIndex].close;
    
    // Create leading indicators
    const indicators = [];
    
    // RSI indicator
    indicators.push({
      name: 'RSI (14)',
      value: rsiValue,
      direction: rsiValue > prevRsiValue ? 'improving' as const : rsiValue < prevRsiValue ? 'deteriorating' as const : 'stable' as const,
      regimeImplication: rsiValue > 60 ? MarketRegimeType.BULL_TREND : rsiValue < 40 ? MarketRegimeType.BEAR_TREND : MarketRegimeType.SIDEWAYS
    });
    
    // Volatility indicator
    indicators.push({
      name: 'Volatility (ATR/Price)',
      value: volatility,
      direction: volatility < prevVolatility ? 'improving' as const : volatility > prevVolatility ? 'deteriorating' as const : 'stable' as const,
      regimeImplication: volatility > 0.02 ? MarketRegimeType.HIGH_VOLATILITY : volatility < 0.01 ? MarketRegimeType.LOW_VOLATILITY : MarketRegimeType.SIDEWAYS
    });
    
    // SMA 50/200 indicator
    indicators.push({
      name: 'SMA 50/200 Ratio',
      value: sma50Value / sma200Value,
      direction: sma50Value > sma200Value ? 'improving' as const : sma50Value < sma200Value ? 'deteriorating' as const : 'stable' as const,
      regimeImplication: sma50Value > sma200Value ? MarketRegimeType.BULL_TREND : MarketRegimeType.BEAR_TREND
    });
    
    // Price vs SMA 50 indicator
    indicators.push({
      name: 'Price vs SMA 50',
      value: price / sma50Value,
      direction: price > sma50Value ? 'improving' as const : price < sma50Value ? 'deteriorating' as const : 'stable' as const,
      regimeImplication: price > sma50Value ? MarketRegimeType.BULL_TREND : MarketRegimeType.BEAR_TREND
    });
    
    // Add more indicators as needed
    
    return indicators;
  }

  /**
   * Gets all available strategies
   * @returns The strategies
   */
  private async getAllStrategies(): Promise<RegimeBasedStrategy[]> {
    // In a real implementation, this would fetch from a database or API
    // For now, we'll return mock strategies
    
    return [
      {
        id: 'trend-following',
        name: 'Trend Following Strategy',
        description: 'Follows market trends using moving averages and momentum indicators',
        applicableRegimes: [
          MarketRegimeType.BULL_TREND,
          MarketRegimeType.BEAR_TREND,
          MarketRegimeType.RECOVERY
        ],
        parameters: {
          fastPeriod: 20,
          slowPeriod: 50,
          momentumPeriod: 14,
          entryThreshold: 0.02,
          exitThreshold: 0.01,
          stopLossPercent: 0.05,
          exposure: 1.0
        },
        expectedPerformance: [
          {
            regime: MarketRegimeType.BULL_TREND,
            expectedReturn: 0.15,
            expectedRisk: 0.12,
            winRate: 0.65,
            drawdown: 0.1
          },
          {
            regime: MarketRegimeType.BEAR_TREND,
            expectedReturn: 0.05,
            expectedRisk: 0.15,
            winRate: 0.55,
            drawdown: 0.15
          },
          {
            regime: MarketRegimeType.RECOVERY,
            expectedReturn: 0.2,
            expectedRisk: 0.18,
            winRate: 0.6,
            drawdown: 0.12
          }
        ]
      },
      {
        id: 'mean-reversion',
        name: 'Mean Reversion Strategy',
        description: 'Capitalizes on price reversals to the mean',
        applicableRegimes: [
          MarketRegimeType.SIDEWAYS,
          MarketRegimeType.HIGH_VOLATILITY,
          MarketRegimeType.CORRECTION
        ],
        parameters: {
          lookbackPeriod: 20,
          entryZScore: 2.0,
          exitZScore: 0.5,
          stopLossPercent: 0.03,
          meanReversionStrength: 1.0,
          positionSize: 0.1
        },
        expectedPerformance: [
          {
            regime: MarketRegimeType.SIDEWAYS,
            expectedReturn: 0.1,
            expectedRisk: 0.08,
            winRate: 0.7,
            drawdown: 0.06
          },
          {
            regime: MarketRegimeType.HIGH_VOLATILITY,
            expectedReturn: 0.18,
            expectedRisk: 0.2,
            winRate: 0.6,
            drawdown: 0.15
          },
          {
            regime: MarketRegimeType.CORRECTION,
            expectedReturn: 0.08,
            expectedRisk: 0.12,
            winRate: 0.55,
            drawdown: 0.1
          }
        ]
      },
      {
        id: 'volatility-breakout',
        name: 'Volatility Breakout Strategy',
        description: 'Trades breakouts from low volatility periods',
        applicableRegimes: [
          MarketRegimeType.LOW_VOLATILITY,
          MarketRegimeType.RECOVERY,
          MarketRegimeType.CORRECTION
        ],
        parameters: {
          volatilityPeriod: 20,
          breakoutThreshold: 1.5,
          confirmationPeriod: 3,
          stopLossPercent: 0.04,
          positionSize: 0.15,
          trailStopFactor: 2.0
        },
        expectedPerformance: [
          {
            regime: MarketRegimeType.LOW_VOLATILITY,
            expectedReturn: 0.12,
            expectedRisk: 0.1,
            winRate: 0.6,
            drawdown: 0.08
          },
          {
            regime: MarketRegimeType.RECOVERY,
            expectedReturn: 0.15,
            expectedRisk: 0.12,
            winRate: 0.65,
            drawdown: 0.1
          },
          {
            regime: MarketRegimeType.CORRECTION,
            expectedReturn: 0.08,
            expectedRisk: 0.15,
            winRate: 0.5,
            drawdown: 0.12
          }
        ]
      },
      {
        id: 'defensive-rotation',
        name: 'Defensive Sector Rotation',
        description: 'Rotates between defensive and cyclical sectors based on market regime',
        applicableRegimes: [
          MarketRegimeType.BEAR_TREND,
          MarketRegimeType.CORRECTION,
          MarketRegimeType.HIGH_VOLATILITY
        ],
        parameters: {
          momentumLookback: 3,
          rebalancePeriod: 21,
          sectorCount: 3,
          defensiveSectors: ['XLP', 'XLU', 'XLV'],
          cyclicalSectors: ['XLY', 'XLF', 'XLI'],
          stopLossPercent: 0.07,
          exposure: 0.8
        },
        expectedPerformance: [
          {
            regime: MarketRegimeType.BEAR_TREND,
            expectedReturn: 0.05,
            expectedRisk: 0.1,
            winRate: 0.6,
            drawdown: 0.08
          },
          {
            regime: MarketRegimeType.CORRECTION,
            expectedReturn: 0.03,
            expectedRisk: 0.08,
            winRate: 0.55,
            drawdown: 0.06
          },
          {
            regime: MarketRegimeType.HIGH_VOLATILITY,
            expectedReturn: 0.07,
            expectedRisk: 0.12,
            winRate: 0.58,
            drawdown: 0.1
          }
        ]
      },
      {
        id: 'momentum-growth',
        name: 'Momentum Growth Strategy',
        description: 'Focuses on high-momentum growth stocks in bullish regimes',
        applicableRegimes: [
          MarketRegimeType.BULL_TREND,
          MarketRegimeType.RECOVERY,
          MarketRegimeType.LOW_VOLATILITY
        ],
        parameters: {
          momentumPeriod: 126,
          stockCount: 10,
          rebalancePeriod: 21,
          volatilityFilter: 0.3,
          stopLossPercent: 0.1,
          exposure: 1.0,
          trendFollowingStrength: 1.0
        },
        expectedPerformance: [
          {
            regime: MarketRegimeType.BULL_TREND,
            expectedReturn: 0.25,
            expectedRisk: 0.18,
            winRate: 0.7,
            drawdown: 0.15
          },
          {
            regime: MarketRegimeType.RECOVERY,
            expectedReturn: 0.3,
            expectedRisk: 0.22,
            winRate: 0.65,
            drawdown: 0.18
          },
          {
            regime: MarketRegimeType.LOW_VOLATILITY,
            expectedReturn: 0.15,
            expectedRisk: 0.12,
            winRate: 0.6,
            drawdown: 0.1
          }
        ]
      }
    ];
  }

  /**
   * Simulates strategy performance
   * @param strategy The strategy
   * @param priceData The price data
   * @param regimes The market regimes
   * @returns The strategy performance
   */
  private simulateStrategyPerformance(
    strategy: RegimeBasedStrategy,
    priceData: any[],
    regimes: MarketRegime[]
  ): {
    overall: {
      totalReturn: number;
      annualizedReturn: number;
      sharpeRatio: number;
      maxDrawdown: number;
      winRate: number;
    };
    byRegime: {
      regime: MarketRegimeType;
      totalReturn: number;
      sharpeRatio: number;
      maxDrawdown: number;
      winRate: number;
    }[];
  } {
    // In a real implementation, this would simulate the strategy on historical data
    // For now, we'll generate mock performance data
    
    // Generate overall performance
    const totalReturn = 0.1 + Math.random() * 0.3; // 10-40%
    const annualizedReturn = totalReturn / 2; // Assuming 2-year period
    const sharpeRatio = 0.8 + Math.random() * 1.2; // 0.8-2.0
    const maxDrawdown = 0.05 + Math.random() * 0.15; // 5-20%
    const winRate = 0.5 + Math.random() * 0.3; // 50-80%
    
    // Generate performance by regime
    const byRegime = [];
    
    // Get unique regimes
    const uniqueRegimes = Array.from(new Set(regimes.map(r => r.type)));
    
    for (const regime of uniqueRegimes) {
      // Check if strategy is applicable to this regime
      const isApplicable = strategy.applicableRegimes.includes(regime);
      
      // Generate performance based on applicability
      const regimeReturn = isApplicable ? 
        0.05 + Math.random() * 0.2 : // 5-25% for applicable regimes
        -0.05 + Math.random() * 0.1; // -5% to 5% for non-applicable regimes
      
      const regimeSharpe = isApplicable ?
        0.7 + Math.random() * 1.3 : // 0.7-2.0 for applicable regimes
        -0.5 + Math.random() * 1.0; // -0.5 to 0.5 for non-applicable regimes
      
      const regimeDrawdown = isApplicable ?
        0.03 + Math.random() * 0.07 : // 3-10% for applicable regimes
        0.1 + Math.random() * 0.2; // 10-30% for non-applicable regimes
      
      const regimeWinRate = isApplicable ?
        0.6 + Math.random() * 0.2 : // 60-80% for applicable regimes
        0.3 + Math.random() * 0.2; // 30-50% for non-applicable regimes
      
      byRegime.push({
        regime,
        totalReturn: regimeReturn,
        sharpeRatio: regimeSharpe,
        maxDrawdown: regimeDrawdown,
        winRate: regimeWinRate
      });
    }
    
    return {
      overall: {
        totalReturn,
        annualizedReturn,
        sharpeRatio,
        maxDrawdown,
        winRate
      },
      byRegime
    };
  }
}