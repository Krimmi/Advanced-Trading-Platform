import * as tf from '@tensorflow/tfjs';

/**
 * Class for preprocessing time series data for machine learning models
 */
export class TimeSeriesPreprocessor {
  private lookbackWindow: number;
  private forecastHorizon: number;
  private featureColumns: string[];
  private targetColumns: string[];
  private scalers: Map<string, MinMaxScaler> = new Map();
  private config: TimeSeriesPreprocessorConfig;

  /**
   * Constructor for TimeSeriesPreprocessor
   * @param config Preprocessor configuration
   */
  constructor(config: TimeSeriesPreprocessorConfig) {
    this.config = {
      ...DEFAULT_PREPROCESSOR_CONFIG,
      ...config
    };
    this.lookbackWindow = this.config.lookbackWindow;
    this.forecastHorizon = this.config.forecastHorizon;
    this.featureColumns = this.config.featureColumns;
    this.targetColumns = this.config.targetColumns;
  }

  /**
   * Preprocess data for training or inference
   * @param data Raw time series data
   * @param fitScalers Whether to fit scalers on this data
   * @returns Processed data ready for model input
   */
  preprocess(data: TimeSeriesData[], fitScalers: boolean = false): ProcessedTimeSeriesData {
    // Sort data by timestamp
    const sortedData = [...data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Extract features and targets
    const features = this.extractFeatures(sortedData);
    
    // Scale features
    const scaledFeatures = this.scaleFeatures(features, fitScalers);
    
    // Create sequences
    const { X, y } = this.createSequences(scaledFeatures);
    
    return {
      X,
      y,
      originalData: sortedData,
      featureColumns: this.featureColumns,
      targetColumns: this.targetColumns
    };
  }

  /**
   * Extract features from raw data
   * @param data Raw time series data
   * @returns Extracted features
   */
  private extractFeatures(data: TimeSeriesData[]): Record<string, number[]> {
    const features: Record<string, number[]> = {};
    
    // Initialize feature arrays
    for (const column of this.featureColumns) {
      features[column] = [];
    }
    
    // Extract feature values
    for (const item of data) {
      for (const column of this.featureColumns) {
        if (column in item) {
          features[column].push(item[column] as number);
        } else {
          features[column].push(0); // Default value if feature is missing
        }
      }
    }
    
    return features;
  }

  /**
   * Scale features using Min-Max scaling
   * @param features Extracted features
   * @param fitScalers Whether to fit scalers on this data
   * @returns Scaled features
   */
  private scaleFeatures(features: Record<string, number[]>, fitScalers: boolean): Record<string, number[]> {
    const scaledFeatures: Record<string, number[]> = {};
    
    for (const column of this.featureColumns) {
      if (!this.scalers.has(column) || fitScalers) {
        // Create and fit scaler
        const scaler = new MinMaxScaler();
        scaler.fit(features[column]);
        this.scalers.set(column, scaler);
      }
      
      // Transform features
      const scaler = this.scalers.get(column)!;
      scaledFeatures[column] = scaler.transform(features[column]);
    }
    
    return scaledFeatures;
  }

  /**
   * Create sequences for time series modeling
   * @param scaledFeatures Scaled features
   * @returns X (input sequences) and y (target sequences)
   */
  private createSequences(scaledFeatures: Record<string, number[]>): { X: number[][][], y: number[][][] } {
    const X: number[][][] = [];
    const y: number[][][] = [];
    
    const dataLength = scaledFeatures[this.featureColumns[0]].length;
    
    // Create sequences
    for (let i = 0; i < dataLength - this.lookbackWindow - this.forecastHorizon + 1; i++) {
      const xSequence: number[][] = [];
      const ySequence: number[][] = [];
      
      // Create input sequence (X)
      for (let j = 0; j < this.lookbackWindow; j++) {
        const features: number[] = [];
        for (const column of this.featureColumns) {
          features.push(scaledFeatures[column][i + j]);
        }
        xSequence.push(features);
      }
      
      // Create target sequence (y)
      for (let j = 0; j < this.forecastHorizon; j++) {
        const targets: number[] = [];
        for (const column of this.targetColumns) {
          const idx = this.featureColumns.indexOf(column);
          if (idx !== -1) {
            targets.push(scaledFeatures[column][i + this.lookbackWindow + j]);
          }
        }
        ySequence.push(targets);
      }
      
      X.push(xSequence);
      y.push(ySequence);
    }
    
    return { X, y };
  }

  /**
   * Inverse transform scaled predictions back to original scale
   * @param predictions Scaled predictions
   * @param targetColumn Target column name
   * @returns Unscaled predictions
   */
  inversePredictions(predictions: number[][][] | number[][], targetColumn: string): number[][] | number[] {
    if (!this.scalers.has(targetColumn)) {
      throw new Error(`No scaler found for column: ${targetColumn}`);
    }
    
    const scaler = this.scalers.get(targetColumn)!;
    
    // Handle 3D predictions [batch, sequence_length, features]
    if (predictions.length > 0 && Array.isArray(predictions[0]) && Array.isArray(predictions[0][0])) {
      const pred3D = predictions as number[][][];
      const result: number[][] = [];
      
      for (const sequence of pred3D) {
        const unscaledSequence: number[] = [];
        for (const step of sequence) {
          // Assuming target is the first feature in step
          unscaledSequence.push(scaler.inverseTransform([step[0]])[0]);
        }
        result.push(unscaledSequence);
      }
      
      return result;
    }
    
    // Handle 2D predictions [batch, features]
    else if (predictions.length > 0 && Array.isArray(predictions[0])) {
      const pred2D = predictions as number[][];
      const result: number[] = [];
      
      for (const step of pred2D) {
        // Assuming target is the first feature in step
        result.push(scaler.inverseTransform([step[0]])[0]);
      }
      
      return result;
    }
    
    throw new Error('Unsupported prediction format');
  }

  /**
   * Get the scalers
   * @returns Map of column names to scalers
   */
  getScalers(): Map<string, MinMaxScaler> {
    return this.scalers;
  }

  /**
   * Save the preprocessor state
   * @returns Serialized preprocessor state
   */
  saveState(): TimeSeriesPreprocessorState {
    const scalersState: Record<string, MinMaxScalerState> = {};
    
    for (const [column, scaler] of this.scalers.entries()) {
      scalersState[column] = {
        min: scaler.min,
        max: scaler.max
      };
    }
    
    return {
      config: this.config,
      scalers: scalersState
    };
  }

  /**
   * Load the preprocessor state
   * @param state Serialized preprocessor state
   */
  loadState(state: TimeSeriesPreprocessorState): void {
    this.config = state.config;
    this.lookbackWindow = this.config.lookbackWindow;
    this.forecastHorizon = this.config.forecastHorizon;
    this.featureColumns = this.config.featureColumns;
    this.targetColumns = this.config.targetColumns;
    
    this.scalers.clear();
    for (const [column, scalerState] of Object.entries(state.scalers)) {
      const scaler = new MinMaxScaler();
      scaler.min = scalerState.min;
      scaler.max = scalerState.max;
      this.scalers.set(column, scaler);
    }
  }

  /**
   * Get the preprocessor configuration
   * @returns Preprocessor configuration
   */
  getConfig(): TimeSeriesPreprocessorConfig {
    return this.config;
  }
}

/**
 * Min-Max scaler for feature normalization
 */
export class MinMaxScaler {
  min: number = 0;
  max: number = 1;
  
  /**
   * Fit the scaler to the data
   * @param data Data to fit
   */
  fit(data: number[]): void {
    this.min = Math.min(...data);
    this.max = Math.max(...data);
    
    // Handle case where min equals max (constant feature)
    if (this.min === this.max) {
      this.max = this.min + 1;
    }
  }
  
  /**
   * Transform data using the fitted scaler
   * @param data Data to transform
   * @returns Scaled data
   */
  transform(data: number[]): number[] {
    return data.map(value => this.scaleValue(value));
  }
  
  /**
   * Inverse transform scaled data back to original scale
   * @param data Scaled data
   * @returns Unscaled data
   */
  inverseTransform(data: number[]): number[] {
    return data.map(value => this.unscaleValue(value));
  }
  
  /**
   * Scale a single value
   * @param value Value to scale
   * @returns Scaled value
   */
  private scaleValue(value: number): number {
    return (value - this.min) / (this.max - this.min);
  }
  
  /**
   * Unscale a single value
   * @param value Scaled value
   * @returns Unscaled value
   */
  private unscaleValue(value: number): number {
    return value * (this.max - this.min) + this.min;
  }
}

/**
 * Default configuration for time series preprocessor
 */
export const DEFAULT_PREPROCESSOR_CONFIG: TimeSeriesPreprocessorConfig = {
  lookbackWindow: 60,        // 60 days of historical data
  forecastHorizon: 5,        // Predict 5 days ahead
  featureColumns: ['open', 'high', 'low', 'close', 'volume'],
  targetColumns: ['close']
};

/**
 * Configuration interface for time series preprocessor
 */
export interface TimeSeriesPreprocessorConfig {
  lookbackWindow: number;    // Number of time steps to look back
  forecastHorizon: number;   // Number of time steps to forecast
  featureColumns: string[];  // Column names to use as features
  targetColumns: string[];   // Column names to predict
}

/**
 * Interface for time series data
 */
export interface TimeSeriesData {
  timestamp: Date;
  [key: string]: number | string | Date;
}

/**
 * Interface for processed time series data
 */
export interface ProcessedTimeSeriesData {
  X: number[][][];           // Input sequences [batch, sequence_length, features]
  y: number[][][];           // Target sequences [batch, sequence_length, targets]
  originalData: TimeSeriesData[]; // Original data
  featureColumns: string[];  // Feature column names
  targetColumns: string[];   // Target column names
}

/**
 * Interface for Min-Max scaler state
 */
export interface MinMaxScalerState {
  min: number;
  max: number;
}

/**
 * Interface for time series preprocessor state
 */
export interface TimeSeriesPreprocessorState {
  config: TimeSeriesPreprocessorConfig;
  scalers: Record<string, MinMaxScalerState>;
}