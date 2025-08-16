import { performanceMonitoring, MetricType } from '../monitoring/performanceMonitoring';
import { cachingService, CacheVolatility } from '../api/cache/CachingService';

/**
 * Anomaly detection model type
 */
export enum AnomalyModelType {
  STATISTICAL = 'statistical',
  ISOLATION_FOREST = 'isolation_forest',
  AUTOENCODER = 'autoencoder',
  ENSEMBLE = 'ensemble'
}

/**
 * Anomaly detection configuration
 */
export interface AnomalyDetectionConfig {
  modelType: AnomalyModelType;
  sensitivity: number; // 0-1, higher means more sensitive
  lookbackPeriod: number; // Number of data points to consider
  features: string[]; // Features to analyze
}

/**
 * Anomaly detection result
 */
export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  anomalyScore: number; // 0-1, higher means more anomalous
  confidence: number; // 0-1, confidence in the detection
  contributingFeatures: Array<{
    feature: string;
    contribution: number; // 0-1, contribution to anomaly
  }>;
  timestamp: number;
}

/**
 * Time series data point
 */
export interface TimeSeriesDataPoint {
  timestamp: number;
  [key: string]: number | string | Date;
}

/**
 * Anomaly detection service for identifying unusual patterns in data
 */
export class AnomalyDetectionService {
  private static instance: AnomalyDetectionService;
  private models: Map<string, any> = new Map(); // In a real implementation, this would store trained models
  private defaultConfig: AnomalyDetectionConfig = {
    modelType: AnomalyModelType.STATISTICAL,
    sensitivity: 0.7,
    lookbackPeriod: 30,
    features: ['price', 'volume', 'change']
  };

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): AnomalyDetectionService {
    if (!AnomalyDetectionService.instance) {
      AnomalyDetectionService.instance = new AnomalyDetectionService();
    }
    return AnomalyDetectionService.instance;
  }

  /**
   * Detect anomalies in market data
   * @param symbol - Stock symbol
   * @param data - Time series data
   * @param config - Anomaly detection configuration
   * @returns Promise with anomaly detection result
   */
  public async detectMarketAnomalies(
    symbol: string,
    data: TimeSeriesDataPoint[],
    config?: Partial<AnomalyDetectionConfig>
  ): Promise<AnomalyDetectionResult> {
    const metricId = performanceMonitoring.startMetric(
      `AnomalyDetectionService.detectMarketAnomalies.${symbol}`,
      MetricType.DATA_PROCESSING,
      { symbol, dataPoints: data.length }
    );

    try {
      // Merge with default config
      const fullConfig = { ...this.defaultConfig, ...config };

      // Check if we have enough data
      if (data.length < fullConfig.lookbackPeriod) {
        throw new Error(`Not enough data points for anomaly detection. Need at least ${fullConfig.lookbackPeriod}, got ${data.length}`);
      }

      // Get or create model
      const modelKey = `${symbol}_${fullConfig.modelType}`;
      let model = this.models.get(modelKey);

      if (!model) {
        model = await this.createModel(fullConfig.modelType, symbol);
        this.models.set(modelKey, model);
      }

      // Preprocess data
      const processedData = this.preprocessData(data, fullConfig.features);

      // Detect anomalies based on model type
      let result: AnomalyDetectionResult;

      switch (fullConfig.modelType) {
        case AnomalyModelType.STATISTICAL:
          result = this.detectStatisticalAnomalies(processedData, fullConfig);
          break;
        case AnomalyModelType.ISOLATION_FOREST:
          result = await this.detectIsolationForestAnomalies(processedData, fullConfig);
          break;
        case AnomalyModelType.AUTOENCODER:
          result = await this.detectAutoencoderAnomalies(processedData, fullConfig);
          break;
        case AnomalyModelType.ENSEMBLE:
          result = await this.detectEnsembleAnomalies(processedData, fullConfig);
          break;
        default:
          result = this.detectStatisticalAnomalies(processedData, fullConfig);
      }

      performanceMonitoring.endMetric(metricId, true, {
        isAnomaly: result.isAnomaly,
        anomalyScore: result.anomalyScore
      });

      return result;
    } catch (error) {
      performanceMonitoring.endMetric(metricId, false, { error: error.message });
      throw error;
    }
  }

  /**
   * Detect anomalies in trading activity
   * @param symbol - Stock symbol
   * @param data - Trading activity data
   * @param config - Anomaly detection configuration
   * @returns Promise with anomaly detection result
   */
  public async detectTradingAnomalies(
    symbol: string,
    data: any[],
    config?: Partial<AnomalyDetectionConfig>
  ): Promise<AnomalyDetectionResult> {
    const metricId = performanceMonitoring.startMetric(
      `AnomalyDetectionService.detectTradingAnomalies.${symbol}`,
      MetricType.DATA_PROCESSING,
      { symbol, dataPoints: data.length }
    );

    try {
      // Merge with default config
      const fullConfig = {
        ...this.defaultConfig,
        features: ['quantity', 'price', 'value'],
        ...config
      };

      // Convert trading data to time series format
      const timeSeriesData = data.map(trade => ({
        timestamp: new Date(trade.timestamp).getTime(),
        quantity: trade.quantity,
        price: trade.price,
        value: trade.quantity * trade.price
      }));

      // Use the market anomaly detection method
      const result = await this.detectMarketAnomalies(symbol, timeSeriesData, fullConfig);

      performanceMonitoring.endMetric(metricId, true, {
        isAnomaly: result.isAnomaly,
        anomalyScore: result.anomalyScore
      });

      return result;
    } catch (error) {
      performanceMonitoring.endMetric(metricId, false, { error: error.message });
      throw error;
    }
  }

  /**
   * Monitor real-time data for anomalies
   * @param symbol - Stock symbol
   * @param dataStream - Observable data stream
   * @param config - Anomaly detection configuration
   * @returns Observable with anomaly detection results
   */
  public monitorRealTimeData(
    symbol: string,
    dataStream: any,
    config?: Partial<AnomalyDetectionConfig>
  ): any {
    // In a real implementation, this would use RxJS or similar to process a stream
    // For now, we'll just return a mock implementation
    return {
      subscribe: (observer: any) => {
        const buffer: TimeSeriesDataPoint[] = [];
        const fullConfig = { ...this.defaultConfig, ...config };

        return dataStream.subscribe({
          next: async (data: TimeSeriesDataPoint) => {
            // Add to buffer
            buffer.push(data);

            // Keep buffer size limited to lookback period
            if (buffer.length > fullConfig.lookbackPeriod) {
              buffer.shift();
            }

            // Only detect anomalies if we have enough data
            if (buffer.length >= fullConfig.lookbackPeriod) {
              try {
                const result = await this.detectMarketAnomalies(symbol, buffer, fullConfig);
                
                // Only emit if it's an anomaly or every 10th data point
                if (result.isAnomaly || buffer.length % 10 === 0) {
                  observer.next(result);
                }
              } catch (error) {
                console.error('Error detecting anomalies:', error);
              }
            }
          },
          error: (error: any) => observer.error(error),
          complete: () => observer.complete()
        });
      }
    };
  }

  /**
   * Create a new anomaly detection model
   * @param modelType - Model type
   * @param symbol - Stock symbol
   * @returns Promise with created model
   */
  private async createModel(modelType: AnomalyModelType, symbol: string): Promise<any> {
    // In a real implementation, this would create and train a model
    // For now, we'll just return a mock model
    return {
      type: modelType,
      symbol,
      created: Date.now(),
      predict: (data: any) => ({ score: Math.random() })
    };
  }

  /**
   * Preprocess data for anomaly detection
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
   * Detect anomalies using statistical methods
   * @param data - Preprocessed data
   * @param config - Anomaly detection configuration
   * @returns Anomaly detection result
   */
  private detectStatisticalAnomalies(
    data: any[],
    config: AnomalyDetectionConfig
  ): AnomalyDetectionResult {
    // Get the most recent data point
    const currentPoint = data[data.length - 1];
    
    // Calculate z-scores for each feature
    const featureScores = config.features.map(feature => {
      // Extract feature values
      const values = data.slice(0, -1).map(point => Number(point[feature]));
      
      // Calculate mean and standard deviation
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const stdDev = Math.sqrt(
        values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
      );
      
      // Calculate z-score
      const currentValue = Number(currentPoint[feature]);
      const zScore = stdDev === 0 ? 0 : Math.abs((currentValue - mean) / stdDev);
      
      return {
        feature,
        zScore,
        contribution: Math.min(1, zScore / 3) // Normalize to 0-1
      };
    });
    
    // Sort by contribution (highest first)
    featureScores.sort((a, b) => b.contribution - a.contribution);
    
    // Calculate overall anomaly score
    const anomalyScore = featureScores.reduce(
      (sum, { contribution }) => sum + contribution,
      0
    ) / featureScores.length;
    
    // Determine if it's an anomaly based on sensitivity
    const isAnomaly = anomalyScore > config.sensitivity;
    
    // Calculate confidence
    const confidence = Math.min(1, anomalyScore * 1.5);
    
    return {
      isAnomaly,
      anomalyScore,
      confidence,
      contributingFeatures: featureScores.map(({ feature, contribution }) => ({
        feature,
        contribution
      })),
      timestamp: currentPoint.timestamp
    };
  }

  /**
   * Detect anomalies using Isolation Forest
   * @param data - Preprocessed data
   * @param config - Anomaly detection configuration
   * @returns Promise with anomaly detection result
   */
  private async detectIsolationForestAnomalies(
    data: any[],
    config: AnomalyDetectionConfig
  ): Promise<AnomalyDetectionResult> {
    // In a real implementation, this would use an actual Isolation Forest algorithm
    // For now, we'll simulate it with a more sophisticated random score
    
    // Get the most recent data point
    const currentPoint = data[data.length - 1];
    
    // Calculate feature contributions using a more sophisticated approach
    const featureContributions = config.features.map(feature => {
      // Extract feature values
      const values = data.slice(0, -1).map(point => Number(point[feature]));
      
      // Calculate mean and standard deviation
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const stdDev = Math.sqrt(
        values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
      );
      
      // Calculate how unusual the current value is
      const currentValue = Number(currentPoint[feature]);
      const zScore = stdDev === 0 ? 0 : Math.abs((currentValue - mean) / stdDev);
      
      // Check for sudden changes
      const previousValue = data[data.length - 2][feature];
      const changeRate = Math.abs((currentValue - previousValue) / previousValue);
      
      // Combine signals
      const contribution = Math.min(1, (zScore / 3 + changeRate) / 2);
      
      return {
        feature,
        contribution
      };
    });
    
    // Sort by contribution (highest first)
    featureContributions.sort((a, b) => b.contribution - a.contribution);
    
    // Calculate overall anomaly score with some randomness to simulate model behavior
    const baseScore = featureContributions.reduce(
      (sum, { contribution }) => sum + contribution,
      0
    ) / featureContributions.length;
    
    // Add some randomness to simulate model behavior
    const randomFactor = 0.9 + Math.random() * 0.2; // 0.9-1.1
    const anomalyScore = Math.min(1, baseScore * randomFactor);
    
    // Determine if it's an anomaly based on sensitivity
    const isAnomaly = anomalyScore > config.sensitivity;
    
    // Calculate confidence
    const confidence = Math.min(1, anomalyScore * 1.3);
    
    return {
      isAnomaly,
      anomalyScore,
      confidence,
      contributingFeatures: featureContributions,
      timestamp: currentPoint.timestamp
    };
  }

  /**
   * Detect anomalies using Autoencoder
   * @param data - Preprocessed data
   * @param config - Anomaly detection configuration
   * @returns Promise with anomaly detection result
   */
  private async detectAutoencoderAnomalies(
    data: any[],
    config: AnomalyDetectionConfig
  ): Promise<AnomalyDetectionResult> {
    // In a real implementation, this would use an actual Autoencoder model
    // For now, we'll simulate it with a more sophisticated approach
    
    // Get the most recent data point
    const currentPoint = data[data.length - 1];
    
    // Calculate feature contributions
    const featureContributions = config.features.map(feature => {
      // Extract feature values
      const values = data.slice(0, -1).map(point => Number(point[feature]));
      
      // Calculate mean and standard deviation
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const stdDev = Math.sqrt(
        values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
      );
      
      // Calculate reconstruction error (simulated)
      const currentValue = Number(currentPoint[feature]);
      const zScore = stdDev === 0 ? 0 : Math.abs((currentValue - mean) / stdDev);
      
      // Simulate reconstruction error
      const reconstructionError = Math.min(1, zScore / 3);
      
      return {
        feature,
        contribution: reconstructionError
      };
    });
    
    // Sort by contribution (highest first)
    featureContributions.sort((a, b) => b.contribution - a.contribution);
    
    // Calculate overall anomaly score
    const anomalyScore = featureContributions.reduce(
      (sum, { contribution }) => sum + contribution,
      0
    ) / featureContributions.length;
    
    // Determine if it's an anomaly based on sensitivity
    const isAnomaly = anomalyScore > config.sensitivity;
    
    // Calculate confidence
    const confidence = Math.min(1, anomalyScore * 1.4);
    
    return {
      isAnomaly,
      anomalyScore,
      confidence,
      contributingFeatures: featureContributions,
      timestamp: currentPoint.timestamp
    };
  }

  /**
   * Detect anomalies using an ensemble of methods
   * @param data - Preprocessed data
   * @param config - Anomaly detection configuration
   * @returns Promise with anomaly detection result
   */
  private async detectEnsembleAnomalies(
    data: any[],
    config: AnomalyDetectionConfig
  ): Promise<AnomalyDetectionResult> {
    // Run all methods and combine results
    const [statistical, isolationForest, autoencoder] = await Promise.all([
      this.detectStatisticalAnomalies(data, config),
      this.detectIsolationForestAnomalies(data, config),
      this.detectAutoencoderAnomalies(data, config)
    ]);
    
    // Combine scores with weights
    const weights = {
      statistical: 0.3,
      isolationForest: 0.4,
      autoencoder: 0.3
    };
    
    const anomalyScore = (
      statistical.anomalyScore * weights.statistical +
      isolationForest.anomalyScore * weights.isolationForest +
      autoencoder.anomalyScore * weights.autoencoder
    );
    
    // Determine if it's an anomaly based on sensitivity
    const isAnomaly = anomalyScore > config.sensitivity;
    
    // Calculate confidence as weighted average
    const confidence = (
      statistical.confidence * weights.statistical +
      isolationForest.confidence * weights.isolationForest +
      autoencoder.confidence * weights.autoencoder
    );
    
    // Combine contributing features
    const featureMap = new Map<string, number>();
    
    // Add all features with their contributions
    for (const result of [statistical, isolationForest, autoencoder]) {
      for (const { feature, contribution } of result.contributingFeatures) {
        const currentContribution = featureMap.get(feature) || 0;
        featureMap.set(feature, currentContribution + contribution);
      }
    }
    
    // Normalize contributions
    const contributingFeatures = Array.from(featureMap.entries()).map(([feature, totalContribution]) => ({
      feature,
      contribution: totalContribution / 3 // Divide by number of methods
    }));
    
    // Sort by contribution (highest first)
    contributingFeatures.sort((a, b) => b.contribution - a.contribution);
    
    return {
      isAnomaly,
      anomalyScore,
      confidence,
      contributingFeatures,
      timestamp: data[data.length - 1].timestamp
    };
  }
}

// Export singleton instance
export const anomalyDetectionService = AnomalyDetectionService.getInstance();