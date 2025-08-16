import { EventEmitter } from 'events';
import { MarketDataService } from '../market-data/MarketDataService';
import { MarketAnalyticsService } from '../analytics/MarketAnalyticsService';
import { Bar } from '../market-data/IMarketDataProvider';

/**
 * Market Prediction Service
 * 
 * Provides machine learning-based predictions for market data
 */
export class MarketPredictionService {
  private static instance: MarketPredictionService;
  
  private marketDataService: MarketDataService;
  private analyticsService: MarketAnalyticsService;
  private eventEmitter: EventEmitter = new EventEmitter();
  private isInitialized: boolean = false;
  
  // Cache for predictions
  private pricePredictions: Map<string, PricePrediction[]> = new Map(); // symbol -> predictions
  private trendPredictions: Map<string, TrendPrediction[]> = new Map(); // symbol -> predictions
  private volatilityPredictions: Map<string, VolatilityPrediction[]> = new Map(); // symbol -> predictions
  private sentimentAnalysis: Map<string, SentimentAnalysis[]> = new Map(); // symbol -> analysis
  
  // Model configurations
  private modelConfigs: Map<string, ModelConfig> = new Map(); // modelId -> config
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.marketDataService = MarketDataService.getInstance();
    this.analyticsService = MarketAnalyticsService.getInstance();
  }
  
  /**
   * Get the singleton instance
   * @returns The singleton instance
   */
  public static getInstance(): MarketPredictionService {
    if (!MarketPredictionService.instance) {
      MarketPredictionService.instance = new MarketPredictionService();
    }
    return MarketPredictionService.instance;
  }
  
  /**
   * Initialize the market prediction service
   * @param config Configuration for the service
   */
  public async initialize(config: Record<string, any> = {}): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    try {
      // Initialize default models
      this.initializeDefaultModels();
      
      // Subscribe to analytics events
      this.analyticsService.addListener('analytics_updated', this.handleAnalyticsUpdate.bind(this));
      
      this.isInitialized = true;
      console.log('Market Prediction Service initialized');
    } catch (error) {
      console.error('Error initializing Market Prediction Service:', error);
      throw error;
    }
  }
  
  /**
   * Subscribe to predictions for a symbol
   * @param symbol Symbol to subscribe to
   * @param timeframe Timeframe for the data
   */
  public async subscribeToPredictions(symbol: string, timeframe: string): Promise<void> {
    // Subscribe to analytics
    await this.analyticsService.subscribeToAnalytics(symbol, timeframe);
    
    // Generate initial predictions
    await this.generateAllPredictions(symbol, timeframe);
  }
  
  /**
   * Unsubscribe from predictions for a symbol
   * @param symbol Symbol to unsubscribe from
   */
  public async unsubscribeFromPredictions(symbol: string): Promise<void> {
    // Unsubscribe from analytics
    await this.analyticsService.unsubscribeFromAnalytics(symbol);
    
    // Clear cached predictions
    this.pricePredictions.delete(symbol);
    this.trendPredictions.delete(symbol);
    this.volatilityPredictions.delete(symbol);
    this.sentimentAnalysis.delete(symbol);
  }
  
  /**
   * Get price predictions for a symbol
   * @param symbol Symbol to get predictions for
   * @param modelId Optional model ID to use
   * @returns Price predictions
   */
  public async getPricePredictions(
    symbol: string,
    modelId: string = 'price_lstm'
  ): Promise<PricePrediction[]> {
    // Check if we have cached predictions
    const cachedPredictions = this.pricePredictions.get(symbol);
    if (cachedPredictions) {
      return cachedPredictions;
    }
    
    // Generate predictions
    const predictions = await this.generatePricePredictions(symbol, modelId);
    
    // Cache the result
    this.pricePredictions.set(symbol, predictions);
    
    return predictions;
  }
  
  /**
   * Get trend predictions for a symbol
   * @param symbol Symbol to get predictions for
   * @param modelId Optional model ID to use
   * @returns Trend predictions
   */
  public async getTrendPredictions(
    symbol: string,
    modelId: string = 'trend_classifier'
  ): Promise<TrendPrediction[]> {
    // Check if we have cached predictions
    const cachedPredictions = this.trendPredictions.get(symbol);
    if (cachedPredictions) {
      return cachedPredictions;
    }
    
    // Generate predictions
    const predictions = await this.generateTrendPredictions(symbol, modelId);
    
    // Cache the result
    this.trendPredictions.set(symbol, predictions);
    
    return predictions;
  }
  
  /**
   * Get volatility predictions for a symbol
   * @param symbol Symbol to get predictions for
   * @param modelId Optional model ID to use
   * @returns Volatility predictions
   */
  public async getVolatilityPredictions(
    symbol: string,
    modelId: string = 'volatility_garch'
  ): Promise<VolatilityPrediction[]> {
    // Check if we have cached predictions
    const cachedPredictions = this.volatilityPredictions.get(symbol);
    if (cachedPredictions) {
      return cachedPredictions;
    }
    
    // Generate predictions
    const predictions = await this.generateVolatilityPredictions(symbol, modelId);
    
    // Cache the result
    this.volatilityPredictions.set(symbol, predictions);
    
    return predictions;
  }
  
  /**
   * Get sentiment analysis for a symbol
   * @param symbol Symbol to get sentiment analysis for
   * @param modelId Optional model ID to use
   * @returns Sentiment analysis
   */
  public async getSentimentAnalysis(
    symbol: string,
    modelId: string = 'sentiment_analyzer'
  ): Promise<SentimentAnalysis[]> {
    // Check if we have cached analysis
    const cachedAnalysis = this.sentimentAnalysis.get(symbol);
    if (cachedAnalysis) {
      return cachedAnalysis;
    }
    
    // Generate sentiment analysis
    const analysis = await this.generateSentimentAnalysis(symbol, modelId);
    
    // Cache the result
    this.sentimentAnalysis.set(symbol, analysis);
    
    return analysis;
  }
  
  /**
   * Register a model
   * @param modelId Model ID
   * @param config Model configuration
   */
  public registerModel(modelId: string, config: ModelConfig): void {
    this.modelConfigs.set(modelId, config);
  }
  
  /**
   * Unregister a model
   * @param modelId Model ID
   * @returns True if the model was unregistered, false otherwise
   */
  public unregisterModel(modelId: string): boolean {
    return this.modelConfigs.delete(modelId);
  }
  
  /**
   * Get a model configuration
   * @param modelId Model ID
   * @returns Model configuration, or undefined if not found
   */
  public getModelConfig(modelId: string): ModelConfig | undefined {
    return this.modelConfigs.get(modelId);
  }
  
  /**
   * Add a listener for prediction events
   * @param eventType Type of event to listen for
   * @param listener Listener function
   */
  public addListener(eventType: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(eventType, listener);
  }
  
  /**
   * Remove a listener for prediction events
   * @param eventType Type of event to listen for
   * @param listener Listener function
   */
  public removeListener(eventType: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(eventType, listener);
  }
  
  /**
   * Initialize default models
   */
  private initializeDefaultModels(): void {
    // Price prediction models
    this.registerModel('price_lstm', {
      type: 'price_prediction',
      algorithm: 'lstm',
      parameters: {
        lookbackPeriod: 30,
        forecastHorizon: 5,
        features: ['close', 'volume', 'rsi', 'macd']
      }
    });
    
    this.registerModel('price_arima', {
      type: 'price_prediction',
      algorithm: 'arima',
      parameters: {
        p: 5,
        d: 1,
        q: 0,
        forecastHorizon: 5
      }
    });
    
    // Trend prediction models
    this.registerModel('trend_classifier', {
      type: 'trend_prediction',
      algorithm: 'random_forest',
      parameters: {
        lookbackPeriod: 20,
        forecastHorizon: 5,
        features: ['sma_20', 'sma_50', 'rsi', 'macd', 'bollinger']
      }
    });
    
    // Volatility prediction models
    this.registerModel('volatility_garch', {
      type: 'volatility_prediction',
      algorithm: 'garch',
      parameters: {
        lookbackPeriod: 30,
        forecastHorizon: 5
      }
    });
    
    // Sentiment analysis models
    this.registerModel('sentiment_analyzer', {
      type: 'sentiment_analysis',
      algorithm: 'nlp',
      parameters: {
        sources: ['news', 'social_media', 'earnings_calls'],
        lookbackDays: 7
      }
    });
  }
  
  /**
   * Handle analytics update
   * @param data Analytics update data
   */
  private async handleAnalyticsUpdate(data: any): Promise<void> {
    const { symbol, timeframe } = data;
    
    // Generate new predictions
    await this.generateAllPredictions(symbol, timeframe);
    
    // Emit event
    this.eventEmitter.emit('predictions_updated', {
      symbol,
      timeframe,
      timestamp: new Date()
    });
  }
  
  /**
   * Generate all predictions for a symbol
   * @param symbol Symbol to generate predictions for
   * @param timeframe Timeframe for the data
   */
  private async generateAllPredictions(symbol: string, timeframe: string): Promise<void> {
    try {
      // Generate price predictions
      await this.generatePricePredictions(symbol);
      
      // Generate trend predictions
      await this.generateTrendPredictions(symbol);
      
      // Generate volatility predictions
      await this.generateVolatilityPredictions(symbol);
      
      // Generate sentiment analysis
      await this.generateSentimentAnalysis(symbol);
    } catch (error) {
      console.error(`Error generating predictions for ${symbol}:`, error);
    }
  }
  
  /**
   * Generate price predictions for a symbol
   * @param symbol Symbol to generate predictions for
   * @param modelId Optional model ID to use
   * @returns Price predictions
   */
  private async generatePricePredictions(
    symbol: string,
    modelId: string = 'price_lstm'
  ): Promise<PricePrediction[]> {
    // Get model configuration
    const modelConfig = this.modelConfigs.get(modelId);
    if (!modelConfig) {
      throw new Error(`Model ${modelId} not found`);
    }
    
    // Get historical data
    const historicalData = await this.getHistoricalBars(symbol);
    
    // Generate predictions based on model type
    let predictions: PricePrediction[] = [];
    
    switch (modelConfig.algorithm) {
      case 'lstm':
        predictions = this.simulateLSTMPredictions(historicalData, modelConfig);
        break;
        
      case 'arima':
        predictions = this.simulateARIMAPredictions(historicalData, modelConfig);
        break;
        
      default:
        throw new Error(`Unsupported algorithm: ${modelConfig.algorithm}`);
    }
    
    // Cache the result
    this.pricePredictions.set(symbol, predictions);
    
    return predictions;
  }
  
  /**
   * Generate trend predictions for a symbol
   * @param symbol Symbol to generate predictions for
   * @param modelId Optional model ID to use
   * @returns Trend predictions
   */
  private async generateTrendPredictions(
    symbol: string,
    modelId: string = 'trend_classifier'
  ): Promise<TrendPrediction[]> {
    // Get model configuration
    const modelConfig = this.modelConfigs.get(modelId);
    if (!modelConfig) {
      throw new Error(`Model ${modelId} not found`);
    }
    
    // Get historical data
    const historicalData = await this.getHistoricalBars(symbol);
    
    // Generate predictions based on model type
    const predictions = this.simulateTrendPredictions(historicalData, modelConfig);
    
    // Cache the result
    this.trendPredictions.set(symbol, predictions);
    
    return predictions;
  }
  
  /**
   * Generate volatility predictions for a symbol
   * @param symbol Symbol to generate predictions for
   * @param modelId Optional model ID to use
   * @returns Volatility predictions
   */
  private async generateVolatilityPredictions(
    symbol: string,
    modelId: string = 'volatility_garch'
  ): Promise<VolatilityPrediction[]> {
    // Get model configuration
    const modelConfig = this.modelConfigs.get(modelId);
    if (!modelConfig) {
      throw new Error(`Model ${modelId} not found`);
    }
    
    // Get historical data
    const historicalData = await this.getHistoricalBars(symbol);
    
    // Generate predictions based on model type
    const predictions = this.simulateVolatilityPredictions(historicalData, modelConfig);
    
    // Cache the result
    this.volatilityPredictions.set(symbol, predictions);
    
    return predictions;
  }
  
  /**
   * Generate sentiment analysis for a symbol
   * @param symbol Symbol to generate sentiment analysis for
   * @param modelId Optional model ID to use
   * @returns Sentiment analysis
   */
  private async generateSentimentAnalysis(
    symbol: string,
    modelId: string = 'sentiment_analyzer'
  ): Promise<SentimentAnalysis[]> {
    // Get model configuration
    const modelConfig = this.modelConfigs.get(modelId);
    if (!modelConfig) {
      throw new Error(`Model ${modelId} not found`);
    }
    
    // Simulate sentiment analysis
    const analysis = this.simulateSentimentAnalysis(symbol, modelConfig);
    
    // Cache the result
    this.sentimentAnalysis.set(symbol, analysis);
    
    return analysis;
  }
  
  /**
   * Get historical bars for a symbol
   * @param symbol Symbol to get historical bars for
   * @param timeframe Optional timeframe for the data
   * @returns Historical bars
   */
  private async getHistoricalBars(symbol: string, timeframe: string = '1d'): Promise<Bar[]> {
    // Get historical data from market data service
    const end = new Date();
    const start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
    
    const historicalData = await this.marketDataService.getHistoricalData(
      symbol,
      timeframe,
      start,
      end
    );
    
    return historicalData as Bar[];
  }
  
  /**
   * Simulate LSTM price predictions
   * @param historicalData Historical data
   * @param modelConfig Model configuration
   * @returns Price predictions
   */
  private simulateLSTMPredictions(
    historicalData: Bar[],
    modelConfig: ModelConfig
  ): PricePrediction[] {
    if (historicalData.length === 0) {
      return [];
    }
    
    const { forecastHorizon } = modelConfig.parameters;
    const predictions: PricePrediction[] = [];
    
    // Get the last price
    const lastPrice = historicalData[historicalData.length - 1].close;
    const lastDate = historicalData[historicalData.length - 1].timestamp;
    
    // Calculate average daily volatility
    const dailyReturns = [];
    for (let i = 1; i < historicalData.length; i++) {
      dailyReturns.push(
        (historicalData[i].close - historicalData[i - 1].close) / historicalData[i - 1].close
      );
    }
    
    const avgVolatility = dailyReturns.reduce((sum, ret) => sum + Math.abs(ret), 0) / dailyReturns.length;
    
    // Generate predictions
    for (let i = 1; i <= forecastHorizon; i++) {
      // Simulate a prediction with increasing uncertainty
      const drift = 0.0002 * i; // Slight upward bias
      const volatility = avgVolatility * Math.sqrt(i);
      
      // Generate a random prediction with increasing confidence interval
      const predictedPrice = lastPrice * (1 + drift + (Math.random() - 0.5) * volatility);
      const confidenceLow = predictedPrice * (1 - volatility);
      const confidenceHigh = predictedPrice * (1 + volatility);
      
      // Calculate prediction date
      const predictionDate = new Date(lastDate);
      predictionDate.setDate(predictionDate.getDate() + i);
      
      predictions.push({
        symbol: historicalData[0].symbol,
        targetDate: predictionDate,
        predictedPrice,
        confidenceLow,
        confidenceHigh,
        modelId: 'price_lstm',
        generatedAt: new Date()
      });
    }
    
    return predictions;
  }
  
  /**
   * Simulate ARIMA price predictions
   * @param historicalData Historical data
   * @param modelConfig Model configuration
   * @returns Price predictions
   */
  private simulateARIMAPredictions(
    historicalData: Bar[],
    modelConfig: ModelConfig
  ): PricePrediction[] {
    if (historicalData.length === 0) {
      return [];
    }
    
    const { forecastHorizon } = modelConfig.parameters;
    const predictions: PricePrediction[] = [];
    
    // Get the last price
    const lastPrice = historicalData[historicalData.length - 1].close;
    const lastDate = historicalData[historicalData.length - 1].timestamp;
    
    // Calculate average daily volatility
    const dailyReturns = [];
    for (let i = 1; i < historicalData.length; i++) {
      dailyReturns.push(
        (historicalData[i].close - historicalData[i - 1].close) / historicalData[i - 1].close
      );
    }
    
    const avgVolatility = dailyReturns.reduce((sum, ret) => sum + Math.abs(ret), 0) / dailyReturns.length;
    
    // Generate predictions
    for (let i = 1; i <= forecastHorizon; i++) {
      // Simulate a prediction with increasing uncertainty
      const drift = 0.0001 * i; // Slight upward bias
      const volatility = avgVolatility * Math.sqrt(i) * 0.8; // ARIMA is typically less volatile than LSTM
      
      // Generate a random prediction with increasing confidence interval
      const predictedPrice = lastPrice * (1 + drift + (Math.random() - 0.5) * volatility);
      const confidenceLow = predictedPrice * (1 - volatility);
      const confidenceHigh = predictedPrice * (1 + volatility);
      
      // Calculate prediction date
      const predictionDate = new Date(lastDate);
      predictionDate.setDate(predictionDate.getDate() + i);
      
      predictions.push({
        symbol: historicalData[0].symbol,
        targetDate: predictionDate,
        predictedPrice,
        confidenceLow,
        confidenceHigh,
        modelId: 'price_arima',
        generatedAt: new Date()
      });
    }
    
    return predictions;
  }
  
  /**
   * Simulate trend predictions
   * @param historicalData Historical data
   * @param modelConfig Model configuration
   * @returns Trend predictions
   */
  private simulateTrendPredictions(
    historicalData: Bar[],
    modelConfig: ModelConfig
  ): TrendPrediction[] {
    if (historicalData.length === 0) {
      return [];
    }
    
    const { forecastHorizon } = modelConfig.parameters;
    const predictions: TrendPrediction[] = [];
    
    // Get the last date
    const lastDate = historicalData[historicalData.length - 1].timestamp;
    
    // Calculate recent trend
    const recentBars = historicalData.slice(-20);
    const firstPrice = recentBars[0].close;
    const lastPrice = recentBars[recentBars.length - 1].close;
    const trendStrength = (lastPrice - firstPrice) / firstPrice;
    
    // Generate predictions
    for (let i = 1; i <= forecastHorizon; i++) {
      // Calculate prediction date
      const predictionDate = new Date(lastDate);
      predictionDate.setDate(predictionDate.getDate() + i);
      
      // Determine trend probabilities based on recent trend
      let upProbability = 0.5 + (trendStrength * 10); // Adjust based on recent trend
      upProbability = Math.max(0.1, Math.min(0.9, upProbability)); // Clamp between 0.1 and 0.9
      
      const downProbability = 1 - upProbability;
      
      // Determine predicted trend
      const predictedTrend = upProbability > downProbability ? 'UP' : 'DOWN';
      
      predictions.push({
        symbol: historicalData[0].symbol,
        targetDate: predictionDate,
        predictedTrend,
        upProbability,
        downProbability,
        confidence: Math.abs(upProbability - 0.5) * 2, // 0-1 scale
        modelId: 'trend_classifier',
        generatedAt: new Date()
      });
    }
    
    return predictions;
  }
  
  /**
   * Simulate volatility predictions
   * @param historicalData Historical data
   * @param modelConfig Model configuration
   * @returns Volatility predictions
   */
  private simulateVolatilityPredictions(
    historicalData: Bar[],
    modelConfig: ModelConfig
  ): VolatilityPrediction[] {
    if (historicalData.length === 0) {
      return [];
    }
    
    const { forecastHorizon } = modelConfig.parameters;
    const predictions: VolatilityPrediction[] = [];
    
    // Get the last date
    const lastDate = historicalData[historicalData.length - 1].timestamp;
    
    // Calculate historical volatility
    const dailyReturns = [];
    for (let i = 1; i < historicalData.length; i++) {
      dailyReturns.push(
        (historicalData[i].close - historicalData[i - 1].close) / historicalData[i - 1].close
      );
    }
    
    // Calculate standard deviation of returns
    const mean = dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / dailyReturns.length;
    const stdDev = Math.sqrt(variance);
    
    // Annualize volatility
    const annualizedVol = stdDev * Math.sqrt(252); // 252 trading days in a year
    
    // Generate predictions
    for (let i = 1; i <= forecastHorizon; i++) {
      // Calculate prediction date
      const predictionDate = new Date(lastDate);
      predictionDate.setDate(predictionDate.getDate() + i);
      
      // Simulate volatility forecast with mean reversion
      // If current volatility is high, it tends to decrease, and vice versa
      const meanReversionFactor = 0.05;
      const longTermVol = 0.2; // Long-term average volatility
      const randomFactor = (Math.random() - 0.5) * 0.02 * i; // Random noise that increases with horizon
      
      const predictedVol = annualizedVol + 
        (longTermVol - annualizedVol) * meanReversionFactor * i + 
        randomFactor;
      
      // Calculate confidence interval
      const confidenceLow = Math.max(0.01, predictedVol - 0.05 * i);
      const confidenceHigh = predictedVol + 0.05 * i;
      
      predictions.push({
        symbol: historicalData[0].symbol,
        targetDate: predictionDate,
        predictedVolatility: predictedVol,
        confidenceLow,
        confidenceHigh,
        modelId: 'volatility_garch',
        generatedAt: new Date()
      });
    }
    
    return predictions;
  }
  
  /**
   * Simulate sentiment analysis
   * @param symbol Symbol to generate sentiment analysis for
   * @param modelConfig Model configuration
   * @returns Sentiment analysis
   */
  private simulateSentimentAnalysis(
    symbol: string,
    modelConfig: ModelConfig
  ): SentimentAnalysis[] {
    const { lookbackDays } = modelConfig.parameters;
    const analysis: SentimentAnalysis[] = [];
    
    // Generate sentiment analysis for each day
    const today = new Date();
    
    for (let i = lookbackDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate random sentiment scores
      const newsScore = 0.5 + (Math.random() - 0.5) * 0.6;
      const socialMediaScore = 0.5 + (Math.random() - 0.5) * 0.8;
      const analystsScore = 0.5 + (Math.random() - 0.5) * 0.4;
      
      // Calculate overall sentiment
      const overallScore = (newsScore * 0.4) + (socialMediaScore * 0.3) + (analystsScore * 0.3);
      
      // Determine sentiment category
      let sentimentCategory: 'VERY_BEARISH' | 'BEARISH' | 'NEUTRAL' | 'BULLISH' | 'VERY_BULLISH';
      
      if (overallScore < 0.3) {
        sentimentCategory = 'VERY_BEARISH';
      } else if (overallScore < 0.45) {
        sentimentCategory = 'BEARISH';
      } else if (overallScore < 0.55) {
        sentimentCategory = 'NEUTRAL';
      } else if (overallScore < 0.7) {
        sentimentCategory = 'BULLISH';
      } else {
        sentimentCategory = 'VERY_BULLISH';
      }
      
      // Generate top keywords
      const keywords = this.generateRandomKeywords(sentimentCategory);
      
      analysis.push({
        symbol,
        date,
        overallScore,
        sentimentCategory,
        sources: {
          news: {
            score: newsScore,
            volume: Math.floor(Math.random() * 100) + 10
          },
          socialMedia: {
            score: socialMediaScore,
            volume: Math.floor(Math.random() * 1000) + 100
          },
          analysts: {
            score: analystsScore,
            volume: Math.floor(Math.random() * 20) + 1
          }
        },
        keywords,
        modelId: 'sentiment_analyzer',
        generatedAt: new Date()
      });
    }
    
    return analysis;
  }
  
  /**
   * Generate random keywords based on sentiment
   * @param sentiment Sentiment category
   * @returns Array of keywords
   */
  private generateRandomKeywords(
    sentiment: 'VERY_BEARISH' | 'BEARISH' | 'NEUTRAL' | 'BULLISH' | 'VERY_BULLISH'
  ): string[] {
    const keywordsByCategory = {
      VERY_BEARISH: ['crash', 'sell-off', 'plunge', 'recession', 'bankruptcy', 'crisis', 'downgrade', 'warning'],
      BEARISH: ['decline', 'drop', 'weak', 'disappointing', 'underperform', 'risk', 'concern', 'caution'],
      NEUTRAL: ['steady', 'stable', 'unchanged', 'mixed', 'balanced', 'hold', 'wait', 'monitor'],
      BULLISH: ['gain', 'rise', 'strong', 'positive', 'outperform', 'opportunity', 'growth', 'upside'],
      VERY_BULLISH: ['surge', 'soar', 'rally', 'breakthrough', 'upgrade', 'record', 'exceptional', 'innovation']
    };
    
    const availableKeywords = keywordsByCategory[sentiment];
    const numKeywords = Math.floor(Math.random() * 3) + 3; // 3-5 keywords
    const selectedKeywords = [];
    
    for (let i = 0; i < numKeywords; i++) {
      const randomIndex = Math.floor(Math.random() * availableKeywords.length);
      selectedKeywords.push(availableKeywords[randomIndex]);
      availableKeywords.splice(randomIndex, 1); // Remove selected keyword
      
      if (availableKeywords.length === 0) {
        break;
      }
    }
    
    return selectedKeywords;
  }
}

/**
 * Model configuration interface
 */
export interface ModelConfig {
  type: 'price_prediction' | 'trend_prediction' | 'volatility_prediction' | 'sentiment_analysis';
  algorithm: string;
  parameters: Record<string, any>;
}

/**
 * Price prediction interface
 */
export interface PricePrediction {
  symbol: string;
  targetDate: Date;
  predictedPrice: number;
  confidenceLow: number;
  confidenceHigh: number;
  modelId: string;
  generatedAt: Date;
}

/**
 * Trend prediction interface
 */
export interface TrendPrediction {
  symbol: string;
  targetDate: Date;
  predictedTrend: 'UP' | 'DOWN';
  upProbability: number;
  downProbability: number;
  confidence: number;
  modelId: string;
  generatedAt: Date;
}

/**
 * Volatility prediction interface
 */
export interface VolatilityPrediction {
  symbol: string;
  targetDate: Date;
  predictedVolatility: number;
  confidenceLow: number;
  confidenceHigh: number;
  modelId: string;
  generatedAt: Date;
}

/**
 * Sentiment analysis interface
 */
export interface SentimentAnalysis {
  symbol: string;
  date: Date;
  overallScore: number;
  sentimentCategory: 'VERY_BEARISH' | 'BEARISH' | 'NEUTRAL' | 'BULLISH' | 'VERY_BULLISH';
  sources: {
    news: {
      score: number;
      volume: number;
    };
    socialMedia: {
      score: number;
      volume: number;
    };
    analysts: {
      score: number;
      volume: number;
    };
  };
  keywords: string[];
  modelId: string;
  generatedAt: Date;
}