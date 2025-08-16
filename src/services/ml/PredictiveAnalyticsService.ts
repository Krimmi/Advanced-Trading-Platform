import { performanceMonitoring, MetricType } from '../monitoring/performanceMonitoring';
import { cachingService, CacheVolatility } from '../api/cache/CachingService';

/**
 * Prediction model type
 */
export enum PredictionModelType {
  ARIMA = 'arima',
  LSTM = 'lstm',
  PROPHET = 'prophet',
  XGB = 'xgboost',
  ENSEMBLE = 'ensemble'
}

/**
 * Prediction configuration
 */
export interface PredictionConfig {
  modelType: PredictionModelType;
  horizon: number; // Number of periods to forecast
  historyLength: number; // Number of historical data points to use
  features: string[]; // Features to use for prediction
  targetVariable: string; // Variable to predict
  confidenceInterval: number; // 0-1, confidence interval width (e.g., 0.95 for 95%)
}

/**
 * Prediction result
 */
export interface PredictionResult {
  predictions: Array<{
    timestamp: number;
    value: number;
    lowerBound: number;
    upperBound: number;
  }>;
  accuracy: {
    mape: number; // Mean Absolute Percentage Error
    rmse: number; // Root Mean Square Error
    r2: number; // R-squared
  };
  featureImportance: Array<{
    feature: string;
    importance: number; // 0-1, importance score
  }>;
  modelType: PredictionModelType;
  lastUpdated: number;
}

/**
 * Trading signal type
 */
export enum SignalType {
  BUY = 'buy',
  SELL = 'sell',
  HOLD = 'hold'
}

/**
 * Trading signal
 */
export interface TradingSignal {
  symbol: string;
  signalType: SignalType;
  strength: number; // 0-1, signal strength
  timestamp: number;
  expiresAt: number;
  confidence: number; // 0-1, confidence in the signal
  rationale: string[];
  predictedChange: number; // Predicted percentage change
}

/**
 * Time series data point
 */
export interface TimeSeriesDataPoint {
  timestamp: number;
  [key: string]: number | string | Date;
}

/**
 * Predictive analytics service for forecasting and generating trading signals
 */
export class PredictiveAnalyticsService {
  private static instance: PredictiveAnalyticsService;
  private models: Map<string, any> = new Map(); // In a real implementation, this would store trained models
  private defaultConfig: PredictionConfig = {
    modelType: PredictionModelType.ENSEMBLE,
    horizon: 5,
    historyLength: 30,
    features: ['price', 'volume', 'change', 'volatility'],
    targetVariable: 'price',
    confidenceInterval: 0.95
  };

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): PredictiveAnalyticsService {
    if (!PredictiveAnalyticsService.instance) {
      PredictiveAnalyticsService.instance = new PredictiveAnalyticsService();
    }
    return PredictiveAnalyticsService.instance;
  }

  /**
   * Forecast future values
   * @param symbol - Stock symbol
   * @param data - Time series data
   * @param config - Prediction configuration
   * @returns Promise with prediction result
   */
  public async forecast(
    symbol: string,
    data: TimeSeriesDataPoint[],
    config?: Partial<PredictionConfig>
  ): Promise<PredictionResult> {
    const metricId = performanceMonitoring.startMetric(
      `PredictiveAnalyticsService.forecast.${symbol}`,
      MetricType.DATA_PROCESSING,
      { symbol, dataPoints: data.length }
    );

    try {
      // Check cache first
      const cacheKey = `prediction:${symbol}:${config?.modelType || this.defaultConfig.modelType}`;
      const cachedResult = await cachingService.get<PredictionResult>(cacheKey);
      
      if (cachedResult) {
        performanceMonitoring.endMetric(metricId, true, { cached: true });
        return cachedResult;
      }

      // Merge with default config
      const fullConfig = { ...this.defaultConfig, ...config };

      // Check if we have enough data
      if (data.length < fullConfig.historyLength) {
        throw new Error(`Not enough data points for prediction. Need at least ${fullConfig.historyLength}, got ${data.length}`);
      }

      // Get or create model
      const modelKey = `${symbol}_${fullConfig.modelType}_${fullConfig.targetVariable}`;
      let model = this.models.get(modelKey);

      if (!model) {
        model = await this.createModel(fullConfig.modelType, symbol, fullConfig);
        this.models.set(modelKey, model);
      }

      // Preprocess data
      const processedData = this.preprocessData(data, fullConfig.features);

      // Generate predictions based on model type
      let result: PredictionResult;

      switch (fullConfig.modelType) {
        case PredictionModelType.ARIMA:
          result = await this.forecastARIMA(processedData, fullConfig);
          break;
        case PredictionModelType.LSTM:
          result = await this.forecastLSTM(processedData, fullConfig);
          break;
        case PredictionModelType.PROPHET:
          result = await this.forecastProphet(processedData, fullConfig);
          break;
        case PredictionModelType.XGB:
          result = await this.forecastXGB(processedData, fullConfig);
          break;
        case PredictionModelType.ENSEMBLE:
          result = await this.forecastEnsemble(processedData, fullConfig);
          break;
        default:
          result = await this.forecastEnsemble(processedData, fullConfig);
      }

      // Cache the result
      await cachingService.set(cacheKey, result, {
        ttl: 3600000, // 1 hour
        volatility: CacheVolatility.MEDIUM,
        persistToDisk: true
      });

      performanceMonitoring.endMetric(metricId, true, {
        modelType: fullConfig.modelType,
        horizon: fullConfig.horizon
      });

      return result;
    } catch (error) {
      performanceMonitoring.endMetric(metricId, false, { error: error.message });
      throw error;
    }
  }

  /**
   * Generate trading signals
   * @param symbol - Stock symbol
   * @param data - Time series data
   * @param predictionResult - Optional prediction result to use
   * @returns Promise with trading signal
   */
  public async generateSignal(
    symbol: string,
    data: TimeSeriesDataPoint[],
    predictionResult?: PredictionResult
  ): Promise<TradingSignal> {
    const metricId = performanceMonitoring.startMetric(
      `PredictiveAnalyticsService.generateSignal.${symbol}`,
      MetricType.DATA_PROCESSING,
      { symbol, dataPoints: data.length }
    );

    try {
      // Get prediction if not provided
      if (!predictionResult) {
        predictionResult = await this.forecast(symbol, data);
      }

      // Get current price
      const currentPrice = data[data.length - 1][this.defaultConfig.targetVariable] as number;
      
      // Get predicted price (first prediction)
      const predictedPrice = predictionResult.predictions[0].value;
      
      // Calculate predicted change
      const predictedChange = (predictedPrice - currentPrice) / currentPrice;
      
      // Determine signal type and strength
      let signalType: SignalType;
      let strength: number;
      let rationale: string[] = [];
      
      // Strong buy: >3% increase with high confidence
      if (predictedChange > 0.03 && predictionResult.accuracy.r2 > 0.7) {
        signalType = SignalType.BUY;
        strength = 0.8 + (Math.min(predictedChange, 0.1) / 0.1) * 0.2; // 0.8-1.0 based on predicted change
        rationale.push(`Strong upward trend predicted (${(predictedChange * 100).toFixed(2)}%)`);
        rationale.push(`High model confidence (R² = ${predictionResult.accuracy.r2.toFixed(2)})`);
      }
      // Moderate buy: 1-3% increase
      else if (predictedChange > 0.01) {
        signalType = SignalType.BUY;
        strength = 0.5 + (predictedChange - 0.01) / 0.02 * 0.3; // 0.5-0.8 based on predicted change
        rationale.push(`Moderate upward trend predicted (${(predictedChange * 100).toFixed(2)}%)`);
      }
      // Strong sell: >3% decrease with high confidence
      else if (predictedChange < -0.03 && predictionResult.accuracy.r2 > 0.7) {
        signalType = SignalType.SELL;
        strength = 0.8 + (Math.min(Math.abs(predictedChange), 0.1) / 0.1) * 0.2; // 0.8-1.0 based on predicted change
        rationale.push(`Strong downward trend predicted (${(predictedChange * 100).toFixed(2)}%)`);
        rationale.push(`High model confidence (R² = ${predictionResult.accuracy.r2.toFixed(2)})`);
      }
      // Moderate sell: 1-3% decrease
      else if (predictedChange < -0.01) {
        signalType = SignalType.SELL;
        strength = 0.5 + (Math.abs(predictedChange) - 0.01) / 0.02 * 0.3; // 0.5-0.8 based on predicted change
        rationale.push(`Moderate downward trend predicted (${(predictedChange * 100).toFixed(2)}%)`);
      }
      // Hold: <1% change
      else {
        signalType = SignalType.HOLD;
        strength = 0.5 - Math.abs(predictedChange) / 0.01 * 0.5; // 0.0-0.5 based on how close to 0 the change is
        rationale.push(`Minimal price movement predicted (${(predictedChange * 100).toFixed(2)}%)`);
      }
      
      // Add feature importance to rationale
      if (predictionResult.featureImportance.length > 0) {
        const topFeature = predictionResult.featureImportance[0];
        rationale.push(`${topFeature.feature} is the most influential factor (${(topFeature.importance * 100).toFixed(2)}% importance)`);
      }
      
      // Add confidence interval to rationale
      const firstPrediction = predictionResult.predictions[0];
      const intervalWidth = firstPrediction.upperBound - firstPrediction.lowerBound;
      const intervalPercentage = intervalWidth / firstPrediction.value * 100;
      
      if (intervalPercentage < 5) {
        rationale.push(`Narrow prediction interval (±${intervalPercentage.toFixed(2)}%) indicates high certainty`);
      } else if (intervalPercentage > 15) {
        rationale.push(`Wide prediction interval (±${intervalPercentage.toFixed(2)}%) indicates uncertainty`);
        // Reduce strength if uncertainty is high
        strength = Math.max(0.3, strength * 0.7);
      }
      
      // Calculate confidence based on model accuracy and prediction interval
      const confidence = (
        predictionResult.accuracy.r2 * 0.4 + 
        (1 - Math.min(1, intervalPercentage / 30)) * 0.4 + 
        Math.min(1, Math.abs(predictedChange) / 0.05) * 0.2
      );
      
      // Create signal
      const signal: TradingSignal = {
        symbol,
        signalType,
        strength,
        timestamp: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        confidence,
        rationale,
        predictedChange
      };

      performanceMonitoring.endMetric(metricId, true, {
        signalType,
        strength,
        confidence
      });

      return signal;
    } catch (error) {
      performanceMonitoring.endMetric(metricId, false, { error: error.message });
      throw error;
    }
  }

  /**
   * Backtest a prediction model
   * @param symbol - Stock symbol
   * @param data - Historical data
   * @param config - Prediction configuration
   * @returns Promise with backtest results
   */
  public async backtestModel(
    symbol: string,
    data: TimeSeriesDataPoint[],
    config?: Partial<PredictionConfig>
  ): Promise<{
    accuracy: {
      mape: number;
      rmse: number;
      r2: number;
    };
    predictions: Array<{
      timestamp: number;
      actual: number;
      predicted: number;
      error: number;
      percentError: number;
    }>;
  }> {
    const metricId = performanceMonitoring.startMetric(
      `PredictiveAnalyticsService.backtestModel.${symbol}`,
      MetricType.DATA_PROCESSING,
      { symbol, dataPoints: data.length }
    );

    try {
      // Merge with default config
      const fullConfig = { ...this.defaultConfig, ...config };
      
      // Need enough data for training and testing
      const minDataPoints = fullConfig.historyLength * 2;
      if (data.length < minDataPoints) {
        throw new Error(`Not enough data points for backtesting. Need at least ${minDataPoints}, got ${data.length}`);
      }
      
      // Sort data by timestamp (oldest first)
      const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
      
      // Create test windows
      const testWindows = [];
      const step = Math.floor(sortedData.length / 10); // 10 test windows
      
      for (let i = fullConfig.historyLength; i < sortedData.length - fullConfig.horizon; i += step) {
        testWindows.push({
          train: sortedData.slice(i - fullConfig.historyLength, i),
          test: sortedData.slice(i, i + fullConfig.horizon)
        });
      }
      
      // Run predictions for each window
      const predictions = [];
      let totalSquaredError = 0;
      let totalAbsPercentError = 0;
      let totalActualVariance = 0;
      
      for (const window of testWindows) {
        // Generate prediction
        const predictionResult = await this.forecast(symbol, window.train, fullConfig);
        
        // Compare with actual values
        for (let i = 0; i < Math.min(predictionResult.predictions.length, window.test.length); i++) {
          const predicted = predictionResult.predictions[i].value;
          const actual = window.test[i][fullConfig.targetVariable] as number;
          
          const error = predicted - actual;
          const squaredError = error * error;
          const percentError = Math.abs(error / actual);
          
          totalSquaredError += squaredError;
          totalAbsPercentError += percentError;
          totalActualVariance += Math.pow(actual - this.mean(window.test.map(p => p[fullConfig.targetVariable] as number)), 2);
          
          predictions.push({
            timestamp: window.test[i].timestamp,
            actual,
            predicted,
            error,
            percentError
          });
        }
      }
      
      // Calculate accuracy metrics
      const n = predictions.length;
      const rmse = Math.sqrt(totalSquaredError / n);
      const mape = (totalAbsPercentError / n) * 100;
      const r2 = 1 - (totalSquaredError / totalActualVariance);
      
      const result = {
        accuracy: {
          mape,
          rmse,
          r2
        },
        predictions
      };

      performanceMonitoring.endMetric(metricId, true, {
        rmse,
        mape,
        r2
      });

      return result;
    } catch (error) {
      performanceMonitoring.endMetric(metricId, false, { error: error.message });
      throw error;
    }
  }

  /**
   * Create a new prediction model
   * @param modelType - Model type
   * @param symbol - Stock symbol
   * @param config - Prediction configuration
   * @returns Promise with created model
   */
  private async createModel(
    modelType: PredictionModelType,
    symbol: string,
    config: PredictionConfig
  ): Promise<any> {
    // In a real implementation, this would create and train a model
    // For now, we'll just return a mock model
    return {
      type: modelType,
      symbol,
      config,
      created: Date.now(),
      predict: (data: any) => ({ value: 0, lowerBound: 0, upperBound: 0 })
    };
  }

  /**
   * Preprocess data for prediction
   * @param data - Time series data
   * @param features - Features to include
   * @returns Preprocessed data
   */
  private preprocessData(data: TimeSeriesDataPoint[], features: string[]): any[] {
    // Extract relevant features
    return data.map(point => {
      const processed: any = { timestamp: point.timestamp };
      
      for (const feature of features) {
        if (feature in point) {
          processed[feature] = point[feature];
        }
      }
      
      return processed;
    });
  }

  /**
   * Forecast using ARIMA model
   * @param data - Preprocessed data
   * @param config - Prediction configuration
   * @returns Promise with prediction result
   */
  private async forecastARIMA(
    data: any[],
    config: PredictionConfig
  ): Promise<PredictionResult> {
    // In a real implementation, this would use an actual ARIMA model
    // For now, we'll simulate it
    
    // Extract target variable
    const targetValues = data.map(point => point[config.targetVariable] as number);
    
    // Calculate simple moving average
    const lastValue = targetValues[targetValues.length - 1];
    const lastValues = targetValues.slice(-5);
    const avgChange = this.calculateAverageChange(lastValues);
    
    // Generate predictions
    const predictions = [];
    let currentValue = lastValue;
    const now = Date.now();
    const interval = 24 * 60 * 60 * 1000; // 1 day
    
    for (let i = 0; i < config.horizon; i++) {
      currentValue += avgChange * (1 + (Math.random() * 0.2 - 0.1)); // Add some randomness
      
      // Calculate confidence interval
      const stdDev = this.standardDeviation(lastValues);
      const z = 1.96; // 95% confidence interval
      const marginOfError = z * stdDev / Math.sqrt(lastValues.length);
      
      predictions.push({
        timestamp: now + interval * (i + 1),
        value: currentValue,
        lowerBound: currentValue - marginOfError,
        upperBound: currentValue + marginOfError
      });
    }
    
    // Calculate mock accuracy metrics
    const mape = 5 + Math.random() * 3; // 5-8%
    const rmse = lastValue * (mape / 100);
    const r2 = 0.7 + Math.random() * 0.2; // 0.7-0.9
    
    // Generate mock feature importance
    const featureImportance = config.features.map(feature => ({
      feature,
      importance: Math.random()
    }));
    
    // Normalize importance to sum to 1
    const totalImportance = featureImportance.reduce((sum, { importance }) => sum + importance, 0);
    featureImportance.forEach(item => {
      item.importance /= totalImportance;
    });
    
    // Sort by importance (highest first)
    featureImportance.sort((a, b) => b.importance - a.importance);
    
    return {
      predictions,
      accuracy: {
        mape,
        rmse,
        r2
      },
      featureImportance,
      modelType: PredictionModelType.ARIMA,
      lastUpdated: Date.now()
    };
  }

  /**
   * Forecast using LSTM model
   * @param data - Preprocessed data
   * @param config - Prediction configuration
   * @returns Promise with prediction result
   */
  private async forecastLSTM(
    data: any[],
    config: PredictionConfig
  ): Promise<PredictionResult> {
    // In a real implementation, this would use an actual LSTM model
    // For now, we'll simulate it with a more sophisticated approach
    
    // Extract target variable
    const targetValues = data.map(point => point[config.targetVariable] as number);
    
    // Calculate exponential moving average with more weight to recent values
    const weights = Array.from({ length: 10 }, (_, i) => Math.exp(i / 2));
    const weightSum = weights.reduce((sum, w) => sum + w, 0);
    const normalizedWeights = weights.map(w => w / weightSum);
    
    const lastValues = targetValues.slice(-10);
    const weightedAvg = lastValues.reduce((sum, val, i) => sum + val * normalizedWeights[i], 0);
    
    // Calculate trend
    const shortTermAvg = this.mean(targetValues.slice(-5));
    const longTermAvg = this.mean(targetValues.slice(-20, -5));
    const trend = (shortTermAvg - longTermAvg) / longTermAvg;
    
    // Generate predictions
    const predictions = [];
    let currentValue = targetValues[targetValues.length - 1];
    const now = Date.now();
    const interval = 24 * 60 * 60 * 1000; // 1 day
    
    for (let i = 0; i < config.horizon; i++) {
      // Apply trend with dampening factor
      const dampening = 0.9 ** i; // Reduce trend influence over time
      currentValue *= (1 + trend * dampening);
      
      // Add some randomness
      currentValue *= (1 + (Math.random() * 0.1 - 0.05));
      
      // Calculate confidence interval (wider for further predictions)
      const stdDev = this.standardDeviation(lastValues);
      const z = 1.96; // 95% confidence interval
      const timeFactorUncertainty = 1 + (i * 0.2); // Increase uncertainty over time
      const marginOfError = z * stdDev * timeFactorUncertainty / Math.sqrt(lastValues.length);
      
      predictions.push({
        timestamp: now + interval * (i + 1),
        value: currentValue,
        lowerBound: currentValue - marginOfError,
        upperBound: currentValue + marginOfError
      });
    }
    
    // Calculate mock accuracy metrics
    const mape = 4 + Math.random() * 2; // 4-6%
    const rmse = targetValues[targetValues.length - 1] * (mape / 100);
    const r2 = 0.75 + Math.random() * 0.15; // 0.75-0.9
    
    // Generate feature importance
    const featureImportance = config.features.map(feature => ({
      feature,
      importance: Math.random()
    }));
    
    // Normalize importance to sum to 1
    const totalImportance = featureImportance.reduce((sum, { importance }) => sum + importance, 0);
    featureImportance.forEach(item => {
      item.importance /= totalImportance;
    });
    
    // Sort by importance (highest first)
    featureImportance.sort((a, b) => b.importance - a.importance);
    
    return {
      predictions,
      accuracy: {
        mape,
        rmse,
        r2
      },
      featureImportance,
      modelType: PredictionModelType.LSTM,
      lastUpdated: Date.now()
    };
  }

  /**
   * Forecast using Prophet model
   * @param data - Preprocessed data
   * @param config - Prediction configuration
   * @returns Promise with prediction result
   */
  private async forecastProphet(
    data: any[],
    config: PredictionConfig
  ): Promise<PredictionResult> {
    // In a real implementation, this would use an actual Prophet model
    // For now, we'll simulate it
    
    // Extract target variable
    const targetValues = data.map(point => point[config.targetVariable] as number);
    
    // Calculate trend and seasonality
    const lastValue = targetValues[targetValues.length - 1];
    const trend = this.calculateTrend(targetValues);
    
    // Generate predictions
    const predictions = [];
    let currentValue = lastValue;
    const now = Date.now();
    const interval = 24 * 60 * 60 * 1000; // 1 day
    
    for (let i = 0; i < config.horizon; i++) {
      // Apply trend
      currentValue *= (1 + trend);
      
      // Add seasonality (simulated)
      const dayOfWeek = new Date(now + interval * (i + 1)).getDay();
      const seasonalFactor = 1 + (dayOfWeek === 0 || dayOfWeek === 6 ? -0.01 : 0.005);
      currentValue *= seasonalFactor;
      
      // Add some randomness
      currentValue *= (1 + (Math.random() * 0.08 - 0.04));
      
      // Calculate confidence interval
      const stdDev = this.standardDeviation(targetValues);
      const z = 1.96; // 95% confidence interval
      const timeFactorUncertainty = 1 + (i * 0.15); // Increase uncertainty over time
      const marginOfError = z * stdDev * timeFactorUncertainty / Math.sqrt(targetValues.length);
      
      predictions.push({
        timestamp: now + interval * (i + 1),
        value: currentValue,
        lowerBound: currentValue - marginOfError,
        upperBound: currentValue + marginOfError
      });
    }
    
    // Calculate mock accuracy metrics
    const mape = 4.5 + Math.random() * 2.5; // 4.5-7%
    const rmse = lastValue * (mape / 100);
    const r2 = 0.72 + Math.random() * 0.18; // 0.72-0.9
    
    // Generate feature importance
    const featureImportance = config.features.map(feature => ({
      feature,
      importance: Math.random()
    }));
    
    // Normalize importance to sum to 1
    const totalImportance = featureImportance.reduce((sum, { importance }) => sum + importance, 0);
    featureImportance.forEach(item => {
      item.importance /= totalImportance;
    });
    
    // Sort by importance (highest first)
    featureImportance.sort((a, b) => b.importance - a.importance);
    
    return {
      predictions,
      accuracy: {
        mape,
        rmse,
        r2
      },
      featureImportance,
      modelType: PredictionModelType.PROPHET,
      lastUpdated: Date.now()
    };
  }

  /**
   * Forecast using XGBoost model
   * @param data - Preprocessed data
   * @param config - Prediction configuration
   * @returns Promise with prediction result
   */
  private async forecastXGB(
    data: any[],
    config: PredictionConfig
  ): Promise<PredictionResult> {
    // In a real implementation, this would use an actual XGBoost model
    // For now, we'll simulate it
    
    // Extract target variable and features
    const targetValues = data.map(point => point[config.targetVariable] as number);
    
    // Calculate feature statistics
    const featureStats = {};
    for (const feature of config.features) {
      if (feature === config.targetVariable) continue;
      
      const values = data.map(point => point[feature] as number);
      featureStats[feature] = {
        mean: this.mean(values),
        stdDev: this.standardDeviation(values),
        correlation: this.correlation(values, targetValues)
      };
    }
    
    // Calculate trend with feature weights
    let weightedTrend = 0;
    let totalWeight = 0;
    
    for (const feature of config.features) {
      if (feature === config.targetVariable) continue;
      
      const stats = featureStats[feature];
      const weight = Math.abs(stats.correlation);
      const featureValues = data.map(point => point[feature] as number);
      const featureTrend = this.calculateTrend(featureValues);
      
      weightedTrend += featureTrend * weight * Math.sign(stats.correlation);
      totalWeight += weight;
    }
    
    // Add target variable trend
    const targetTrend = this.calculateTrend(targetValues);
    weightedTrend = (weightedTrend + targetTrend * 2) / (totalWeight + 2);
    
    // Generate predictions
    const predictions = [];
    let currentValue = targetValues[targetValues.length - 1];
    const now = Date.now();
    const interval = 24 * 60 * 60 * 1000; // 1 day
    
    for (let i = 0; i < config.horizon; i++) {
      // Apply weighted trend
      currentValue *= (1 + weightedTrend);
      
      // Add some randomness
      currentValue *= (1 + (Math.random() * 0.06 - 0.03));
      
      // Calculate confidence interval
      const stdDev = this.standardDeviation(targetValues);
      const z = 1.96; // 95% confidence interval
      const timeFactorUncertainty = 1 + (i * 0.1); // Increase uncertainty over time
      const marginOfError = z * stdDev * timeFactorUncertainty / Math.sqrt(targetValues.length);
      
      predictions.push({
        timestamp: now + interval * (i + 1),
        value: currentValue,
        lowerBound: currentValue - marginOfError,
        upperBound: currentValue + marginOfError
      });
    }
    
    // Calculate mock accuracy metrics
    const mape = 3.5 + Math.random() * 2; // 3.5-5.5%
    const rmse = targetValues[targetValues.length - 1] * (mape / 100);
    const r2 = 0.8 + Math.random() * 0.15; // 0.8-0.95
    
    // Generate feature importance based on correlation
    const featureImportance = config.features.map(feature => {
      if (feature === config.targetVariable) {
        return {
          feature,
          importance: 0.4 + Math.random() * 0.2 // Target's autocorrelation is important
        };
      } else {
        return {
          feature,
          importance: Math.abs(featureStats[feature].correlation) * (0.8 + Math.random() * 0.4)
        };
      }
    });
    
    // Normalize importance to sum to 1
    const totalImportance = featureImportance.reduce((sum, { importance }) => sum + importance, 0);
    featureImportance.forEach(item => {
      item.importance /= totalImportance;
    });
    
    // Sort by importance (highest first)
    featureImportance.sort((a, b) => b.importance - a.importance);
    
    return {
      predictions,
      accuracy: {
        mape,
        rmse,
        r2
      },
      featureImportance,
      modelType: PredictionModelType.XGB,
      lastUpdated: Date.now()
    };
  }

  /**
   * Forecast using ensemble of models
   * @param data - Preprocessed data
   * @param config - Prediction configuration
   * @returns Promise with prediction result
   */
  private async forecastEnsemble(
    data: any[],
    config: PredictionConfig
  ): Promise<PredictionResult> {
    // Run all models and combine results
    const [arima, lstm, prophet, xgb] = await Promise.all([
      this.forecastARIMA(data, config),
      this.forecastLSTM(data, config),
      this.forecastProphet(data, config),
      this.forecastXGB(data, config)
    ]);
    
    // Weights based on accuracy (R²)
    const weights = {
      arima: arima.accuracy.r2,
      lstm: lstm.accuracy.r2,
      prophet: prophet.accuracy.r2,
      xgb: xgb.accuracy.r2
    };
    
    // Normalize weights
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    Object.keys(weights).forEach(key => {
      weights[key] /= totalWeight;
    });
    
    // Combine predictions
    const predictions = [];
    for (let i = 0; i < config.horizon; i++) {
      const value = (
        arima.predictions[i].value * weights.arima +
        lstm.predictions[i].value * weights.lstm +
        prophet.predictions[i].value * weights.prophet +
        xgb.predictions[i].value * weights.xgb
      );
      
      // Calculate combined confidence interval
      // Use the weighted average of the intervals
      const lowerBound = (
        arima.predictions[i].lowerBound * weights.arima +
        lstm.predictions[i].lowerBound * weights.lstm +
        prophet.predictions[i].lowerBound * weights.prophet +
        xgb.predictions[i].lowerBound * weights.xgb
      );
      
      const upperBound = (
        arima.predictions[i].upperBound * weights.arima +
        lstm.predictions[i].upperBound * weights.lstm +
        prophet.predictions[i].upperBound * weights.prophet +
        xgb.predictions[i].upperBound * weights.xgb
      );
      
      predictions.push({
        timestamp: arima.predictions[i].timestamp,
        value,
        lowerBound,
        upperBound
      });
    }
    
    // Combine accuracy metrics
    const accuracy = {
      mape: (
        arima.accuracy.mape * weights.arima +
        lstm.accuracy.mape * weights.lstm +
        prophet.accuracy.mape * weights.prophet +
        xgb.accuracy.mape * weights.xgb
      ),
      rmse: (
        arima.accuracy.rmse * weights.arima +
        lstm.accuracy.rmse * weights.lstm +
        prophet.accuracy.rmse * weights.prophet +
        xgb.accuracy.rmse * weights.xgb
      ),
      r2: (
        arima.accuracy.r2 * weights.arima +
        lstm.accuracy.r2 * weights.lstm +
        prophet.accuracy.r2 * weights.prophet +
        xgb.accuracy.r2 * weights.xgb
      )
    };
    
    // Combine feature importance
    const featureMap = new Map<string, number>();
    
    // Add all features with their weighted importance
    for (const model of [arima, lstm, prophet, xgb]) {
      const modelWeight = weights[model.modelType.toLowerCase()];
      
      for (const { feature, importance } of model.featureImportance) {
        const currentImportance = featureMap.get(feature) || 0;
        featureMap.set(feature, currentImportance + importance * modelWeight);
      }
    }
    
    // Convert to array
    const featureImportance = Array.from(featureMap.entries()).map(([feature, importance]) => ({
      feature,
      importance
    }));
    
    // Sort by importance (highest first)
    featureImportance.sort((a, b) => b.importance - a.importance);
    
    return {
      predictions,
      accuracy,
      featureImportance,
      modelType: PredictionModelType.ENSEMBLE,
      lastUpdated: Date.now()
    };
  }

  /**
   * Calculate mean of an array
   * @param values - Array of numbers
   * @returns Mean value
   */
  private mean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate standard deviation of an array
   * @param values - Array of numbers
   * @returns Standard deviation
   */
  private standardDeviation(values: number[]): number {
    const avg = this.mean(values);
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    return Math.sqrt(this.mean(squareDiffs));
  }

  /**
   * Calculate correlation between two arrays
   * @param x - First array
   * @param y - Second array
   * @returns Correlation coefficient
   */
  private correlation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    
    // Calculate means
    const xMean = this.mean(x.slice(0, n));
    const yMean = this.mean(y.slice(0, n));
    
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
    
    // Calculate correlation
    return covariance / (Math.sqrt(xVariance) * Math.sqrt(yVariance));
  }

  /**
   * Calculate average change in an array
   * @param values - Array of numbers
   * @returns Average change
   */
  private calculateAverageChange(values: number[]): number {
    if (values.length < 2) return 0;
    
    let totalChange = 0;
    
    for (let i = 1; i < values.length; i++) {
      totalChange += values[i] - values[i - 1];
    }
    
    return totalChange / (values.length - 1);
  }

  /**
   * Calculate trend in an array
   * @param values - Array of numbers
   * @returns Trend as a percentage
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    // Use linear regression to calculate trend
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;
    
    // Calculate means
    const xMean = this.mean(x);
    const yMean = this.mean(y);
    
    // Calculate slope
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (x[i] - xMean) * (y[i] - yMean);
      denominator += Math.pow(x[i] - xMean, 2);
    }
    
    const slope = numerator / denominator;
    
    // Convert slope to percentage change
    return slope / yMean;
  }
}

// Export singleton instance
export const predictiveAnalyticsService = PredictiveAnalyticsService.getInstance();