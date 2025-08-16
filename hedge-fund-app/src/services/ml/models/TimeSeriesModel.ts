import * as tf from '@tensorflow/tfjs';

/**
 * Base class for time series forecasting models
 */
export abstract class TimeSeriesModel {
  protected model: tf.LayersModel | null = null;
  protected inputShape: number[];
  protected outputShape: number[];
  protected config: TimeSeriesModelConfig;
  protected isTraining: boolean = false;
  protected isLoaded: boolean = false;

  /**
   * Constructor for TimeSeriesModel
   * @param config Model configuration
   */
  constructor(config: TimeSeriesModelConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };
    this.inputShape = [this.config.lookbackWindow, this.config.inputFeatures];
    this.outputShape = [this.config.forecastHorizon, this.config.outputFeatures];
  }

  /**
   * Build the model architecture
   */
  abstract buildModel(): tf.LayersModel;

  /**
   * Load a pre-trained model
   * @param modelPath Path to the model
   */
  async loadModel(modelPath: string): Promise<void> {
    try {
      this.model = await tf.loadLayersModel(modelPath);
      this.isLoaded = true;
      console.log('Model loaded successfully');
    } catch (error) {
      console.error('Error loading model:', error);
      throw error;
    }
  }

  /**
   * Save the current model
   * @param modelPath Path to save the model
   */
  async saveModel(modelPath: string): Promise<void> {
    if (!this.model) {
      throw new Error('Model not built or trained');
    }

    try {
      await this.model.save(modelPath);
      console.log('Model saved successfully');
    } catch (error) {
      console.error('Error saving model:', error);
      throw error;
    }
  }

  /**
   * Train the model
   * @param trainX Training features
   * @param trainY Training targets
   * @param validationData Validation data (optional)
   * @param callbacks Training callbacks (optional)
   */
  async train(
    trainX: tf.Tensor | number[][],
    trainY: tf.Tensor | number[][],
    validationData?: [tf.Tensor | number[][], tf.Tensor | number[][]], 
    callbacks?: tf.Callback[]
  ): Promise<tf.History> {
    if (!this.model) {
      this.model = this.buildModel();
    }

    this.isTraining = true;

    // Convert inputs to tensors if they're arrays
    const xTensor = Array.isArray(trainX) ? tf.tensor(trainX) : trainX;
    const yTensor = Array.isArray(trainY) ? tf.tensor(trainY) : trainY;

    // Convert validation data to tensors if provided
    let valData: [tf.Tensor, tf.Tensor] | undefined = undefined;
    if (validationData) {
      const valX = Array.isArray(validationData[0]) 
        ? tf.tensor(validationData[0]) 
        : validationData[0];
      const valY = Array.isArray(validationData[1]) 
        ? tf.tensor(validationData[1]) 
        : validationData[1];
      valData = [valX, valY];
    }

    try {
      // Train the model
      const history = await this.model.fit(xTensor, yTensor, {
        epochs: this.config.epochs,
        batchSize: this.config.batchSize,
        validationData: valData,
        callbacks: callbacks || this.getDefaultCallbacks(),
        shuffle: this.config.shuffle
      });

      this.isTraining = false;
      return history;
    } catch (error) {
      this.isTraining = false;
      console.error('Error training model:', error);
      throw error;
    } finally {
      // Dispose tensors to prevent memory leaks
      if (Array.isArray(trainX)) xTensor.dispose();
      if (Array.isArray(trainY)) yTensor.dispose();
      if (valData) {
        if (Array.isArray(validationData![0])) valData[0].dispose();
        if (Array.isArray(validationData![1])) valData[1].dispose();
      }
    }
  }

  /**
   * Make predictions with the model
   * @param input Input data
   * @returns Predictions
   */
  predict(input: tf.Tensor | number[][]): tf.Tensor | number[][] {
    if (!this.model) {
      throw new Error('Model not built or trained');
    }

    // Convert input to tensor if it's an array
    const inputTensor = Array.isArray(input) ? tf.tensor(input) : input;

    try {
      // Make prediction
      const prediction = this.model.predict(inputTensor) as tf.Tensor;
      
      // Convert prediction to array if input was an array
      if (Array.isArray(input)) {
        const predictionArray = prediction.arraySync() as number[][];
        prediction.dispose();
        return predictionArray;
      }
      
      return prediction;
    } catch (error) {
      console.error('Error making prediction:', error);
      throw error;
    } finally {
      // Dispose tensor to prevent memory leaks
      if (Array.isArray(input)) inputTensor.dispose();
    }
  }

  /**
   * Evaluate the model
   * @param testX Test features
   * @param testY Test targets
   * @returns Evaluation metrics
   */
  async evaluate(testX: tf.Tensor | number[][], testY: tf.Tensor | number[][]): Promise<tf.Scalar | number> {
    if (!this.model) {
      throw new Error('Model not built or trained');
    }

    // Convert inputs to tensors if they're arrays
    const xTensor = Array.isArray(testX) ? tf.tensor(testX) : testX;
    const yTensor = Array.isArray(testY) ? tf.tensor(testY) : testY;

    try {
      // Evaluate the model
      const evaluation = await this.model.evaluate(xTensor, yTensor) as tf.Scalar;
      
      // Convert evaluation to number if inputs were arrays
      if (Array.isArray(testX) && Array.isArray(testY)) {
        const evaluationValue = await evaluation.data();
        evaluation.dispose();
        return evaluationValue[0];
      }
      
      return evaluation;
    } catch (error) {
      console.error('Error evaluating model:', error);
      throw error;
    } finally {
      // Dispose tensors to prevent memory leaks
      if (Array.isArray(testX)) xTensor.dispose();
      if (Array.isArray(testY)) yTensor.dispose();
    }
  }

  /**
   * Get default training callbacks
   * @returns Array of callbacks
   */
  protected getDefaultCallbacks(): tf.Callback[] {
    return [
      tf.callbacks.earlyStopping({
        monitor: 'val_loss',
        patience: this.config.earlyStoppingPatience,
        restoreBestWeights: true
      }),
      {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1}: loss = ${logs?.loss.toFixed(4)}, val_loss = ${logs?.val_loss.toFixed(4)}`);
        }
      }
    ];
  }

  /**
   * Get the model configuration
   * @returns Model configuration
   */
  getConfig(): TimeSeriesModelConfig {
    return this.config;
  }

  /**
   * Check if the model is currently training
   * @returns True if training, false otherwise
   */
  isModelTraining(): boolean {
    return this.isTraining;
  }

  /**
   * Check if the model is loaded
   * @returns True if loaded, false otherwise
   */
  isModelLoaded(): boolean {
    return this.isLoaded;
  }

  /**
   * Get the model summary
   * @returns Model summary as string
   */
  getModelSummary(): string {
    if (!this.model) {
      return 'Model not built';
    }

    const lines: string[] = [];
    this.model.summary(undefined, undefined, (line) => lines.push(line));
    return lines.join('\n');
  }
}

/**
 * Default configuration for time series models
 */
export const DEFAULT_CONFIG: TimeSeriesModelConfig = {
  lookbackWindow: 60,        // 60 days of historical data
  forecastHorizon: 5,        // Predict 5 days ahead
  inputFeatures: 5,          // OHLCV (Open, High, Low, Close, Volume)
  outputFeatures: 1,         // Predict closing price
  epochs: 100,
  batchSize: 32,
  learningRate: 0.001,
  shuffle: true,
  earlyStoppingPatience: 10
};

/**
 * Configuration interface for time series models
 */
export interface TimeSeriesModelConfig {
  lookbackWindow: number;    // Number of time steps to look back
  forecastHorizon: number;   // Number of time steps to forecast
  inputFeatures: number;     // Number of input features
  outputFeatures: number;    // Number of output features
  epochs: number;            // Number of training epochs
  batchSize: number;         // Batch size for training
  learningRate: number;      // Learning rate
  shuffle: boolean;          // Whether to shuffle training data
  earlyStoppingPatience: number; // Patience for early stopping
}