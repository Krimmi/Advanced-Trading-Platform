import * as tf from '@tensorflow/tfjs';
import { TimeSeriesModel } from './models/TimeSeriesModel';
import { LSTMTimeSeriesModel } from './models/LSTMTimeSeriesModel';
import { TransformerTimeSeriesModel } from './models/TransformerTimeSeriesModel';
import { TimeSeriesPreprocessor, TimeSeriesData } from './preprocessing/TimeSeriesPreprocessor';
import { MarketDataLoader } from './preprocessing/MarketDataLoader';
import { ModelEvaluator } from './evaluation/ModelEvaluator';
import { ModelDeploymentService } from './deployment/ModelDeploymentService';

/**
 * Service for market prediction using machine learning models
 */
export class MarketPredictionService {
  private static instance: MarketPredictionService;
  private modelDeploymentService: ModelDeploymentService;
  private modelEvaluator: ModelEvaluator;
  private activeModels: Map<string, ActiveModelInfo> = new Map();

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.modelDeploymentService = ModelDeploymentService.getInstance();
    this.modelEvaluator = new ModelEvaluator();
  }

  /**
   * Get the singleton instance
   * @returns MarketPredictionService instance
   */
  public static getInstance(): MarketPredictionService {
    if (!MarketPredictionService.instance) {
      MarketPredictionService.instance = new MarketPredictionService();
    }
    return MarketPredictionService.instance;
  }

  /**
   * Train a new market prediction model
   * @param config Training configuration
   * @returns Training results
   */
  async trainModel(config: ModelTrainingConfig): Promise<ModelTrainingResult> {
    console.log(`Starting model training for ${config.symbol}...`);
    
    try {
      // 1. Load market data
      const dataLoader = new MarketDataLoader({
        apiKey: config.apiKey,
        dataSource: config.dataSource
      });
      
      const historicalData = await dataLoader.loadHistoricalData(
        config.symbol,
        config.startDate,
        config.endDate,
        config.dataInterval
      );
      
      console.log(`Loaded ${historicalData.length} data points for ${config.symbol}`);
      
      // 2. Preprocess data
      const preprocessor = new TimeSeriesPreprocessor({
        lookbackWindow: config.lookbackWindow,
        forecastHorizon: config.forecastHorizon,
        featureColumns: config.featureColumns,
        targetColumns: config.targetColumns
      });
      
      const processedData = preprocessor.preprocess(historicalData, true);
      console.log(`Preprocessed data: ${processedData.X.length} sequences`);
      
      // 3. Split data into training and validation sets
      const splitIndex = Math.floor(processedData.X.length * config.trainTestSplit);
      
      const trainX = processedData.X.slice(0, splitIndex);
      const trainY = processedData.y.slice(0, splitIndex);
      const testX = processedData.X.slice(splitIndex);
      const testY = processedData.y.slice(splitIndex);
      
      console.log(`Training set: ${trainX.length} sequences`);
      console.log(`Test set: ${testX.length} sequences`);
      
      // 4. Create and train model
      let model: TimeSeriesModel;
      
      if (config.modelType === 'lstm') {
        model = new LSTMTimeSeriesModel(
          {
            lookbackWindow: config.lookbackWindow,
            forecastHorizon: config.forecastHorizon,
            inputFeatures: config.featureColumns.length,
            outputFeatures: config.targetColumns.length,
            epochs: config.epochs,
            batchSize: config.batchSize,
            learningRate: config.learningRate,
            shuffle: true,
            earlyStoppingPatience: 10
          },
          config.lstmLayers || [128, 64],
          config.denseLayers || [32],
          config.dropout || 0.2
        );
      } else if (config.modelType === 'transformer') {
        model = new TransformerTimeSeriesModel(
          {
            lookbackWindow: config.lookbackWindow,
            forecastHorizon: config.forecastHorizon,
            inputFeatures: config.featureColumns.length,
            outputFeatures: config.targetColumns.length,
            epochs: config.epochs,
            batchSize: config.batchSize,
            learningRate: config.learningRate,
            shuffle: true,
            earlyStoppingPatience: 10
          },
          config.headSize || 32,
          config.numHeads || 4,
          config.ffDim || 128,
          config.numTransformerBlocks || 2,
          config.mlpUnits || [64, 32],
          config.dropout || 0.2
        );
      } else {
        throw new Error(`Unsupported model type: ${config.modelType}`);
      }
      
      console.log(`Created ${config.modelType} model`);
      console.log(model.getModelSummary());
      
      // Train the model
      console.log('Starting model training...');
      const trainingHistory = await model.train(trainX, trainY, [testX, testY]);
      console.log('Model training completed');
      
      // 5. Evaluate model
      console.log('Evaluating model...');
      
      // Make predictions on test set
      const predictions = model.predict(testX) as number[][][];
      
      // Extract actual and predicted values for the target column
      const targetIndex = config.targetColumns.indexOf(config.targetColumns[0]);
      const actualValues: number[] = [];
      const predictedValues: number[] = [];
      
      for (let i = 0; i < testY.length; i++) {
        // Get the last value in each sequence for evaluation
        actualValues.push(testY[i][config.forecastHorizon - 1][targetIndex]);
        predictedValues.push(predictions[i][config.forecastHorizon - 1][targetIndex]);
      }
      
      // Inverse transform values
      const actualPrices = preprocessor.inversePredictions(
        actualValues.map(v => [[v]]),
        config.targetColumns[0]
      ) as number[];
      
      const predictedPrices = preprocessor.inversePredictions(
        predictedValues.map(v => [[v]]),
        config.targetColumns[0]
      ) as number[];
      
      // Calculate evaluation metrics
      const metrics = this.modelEvaluator.evaluateAll(actualPrices, predictedPrices);
      console.log('Evaluation metrics:', metrics);
      
      // 6. Register and deploy model
      const modelId = `${config.modelType}-${config.symbol}-${Date.now()}`;
      
      // Register model in registry
      this.modelDeploymentService.registerModel(modelId, {
        modelId,
        name: `${config.symbol} ${config.modelType.toUpperCase()} Model`,
        version: '1.0.0',
        description: `${config.modelType.toUpperCase()} model for predicting ${config.symbol} prices`,
        modelType: config.modelType,
        created: new Date(),
        lastModified: new Date(),
        author: 'MarketPredictionService',
        tags: [config.symbol, config.modelType, 'market-prediction'],
        metrics: {
          mae: metrics.mae,
          rmse: metrics.rmse,
          mape: metrics.mape,
          rSquared: metrics.rSquared,
          directionAccuracy: metrics.directionAccuracy
        },
        hyperparameters: {
          lookbackWindow: config.lookbackWindow,
          forecastHorizon: config.forecastHorizon,
          epochs: config.epochs,
          batchSize: config.batchSize,
          learningRate: config.learningRate
        }
      });
      
      // Deploy model
      const tfModel = (model as any).model as tf.LayersModel;
      const deploymentId = await this.modelDeploymentService.deployModel(
        modelId,
        tfModel,
        preprocessor
      );
      
      console.log(`Model deployed with ID: ${deploymentId}`);
      
      // 7. Store active model info
      this.activeModels.set(config.symbol, {
        symbol: config.symbol,
        modelId,
        deploymentId,
        modelType: config.modelType,
        lastUpdated: new Date()
      });
      
      // 8. Return training results
      return {
        modelId,
        deploymentId,
        symbol: config.symbol,
        modelType: config.modelType,
        metrics,
        trainingHistory: {
          loss: trainingHistory.history.loss as number[],
          valLoss: trainingHistory.history.val_loss as number[]
        },
        actualPrices,
        predictedPrices
      };
    } catch (error) {
      console.error('Error training model:', error);
      throw error;
    }
  }

  /**
   * Make price predictions for a symbol
   * @param symbol Stock symbol
   * @param days Number of days to predict
   * @returns Prediction results
   */
  async predictPrices(symbol: string, days: number = 5): Promise<PredictionResult> {
    // Check if we have an active model for this symbol
    if (!this.activeModels.has(symbol)) {
      throw new Error(`No active model found for symbol: ${symbol}`);
    }
    
    const activeModel = this.activeModels.get(symbol)!;
    
    try {
      // 1. Load latest market data
      const dataLoader = new MarketDataLoader({
        apiKey: 'demo', // Replace with actual API key in production
        dataSource: 'alphavantage'
      });
      
      // Get historical data for the past 60 days (or more based on lookback window)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 60); // Assuming lookback window <= 60
      
      const historicalData = await dataLoader.loadHistoricalData(
        symbol,
        startDate,
        endDate,
        'daily'
      );
      
      // 2. Create preprocessor from deployed model
      const preprocessor = this.modelDeploymentService.createPreprocessorFromDeployedModel(
        activeModel.deploymentId
      );
      
      // 3. Preprocess data
      const processedData = preprocessor.preprocess(historicalData, false);
      
      // Get the last sequence for prediction
      const lastSequence = [processedData.X[processedData.X.length - 1]];
      
      // 4. Make prediction
      const predictions = await this.modelDeploymentService.predict(
        activeModel.deploymentId,
        lastSequence
      );
      
      // 5. Inverse transform predictions
      const targetColumn = preprocessor.getConfig().targetColumns[0];
      const predictedPrices = preprocessor.inversePredictions(
        predictions,
        targetColumn
      ) as number[][];
      
      // 6. Extract prediction values
      const predictionDates: Date[] = [];
      const predictionValues: number[] = [];
      
      const lastDate = historicalData[historicalData.length - 1].timestamp;
      
      for (let i = 0; i < days; i++) {
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + i + 1);
        
        // Skip weekends
        while (nextDate.getDay() === 0 || nextDate.getDay() === 6) {
          nextDate.setDate(nextDate.getDate() + 1);
        }
        
        predictionDates.push(nextDate);
        
        // Use prediction if available, otherwise use the last available prediction
        if (i < predictedPrices[0].length) {
          predictionValues.push(predictedPrices[0][i]);
        } else {
          predictionValues.push(predictionValues[predictionValues.length - 1]);
        }
      }
      
      // 7. Return prediction result
      return {
        symbol,
        modelId: activeModel.modelId,
        modelType: activeModel.modelType,
        predictionDate: new Date(),
        predictionDates,
        predictionValues,
        lastPrice: historicalData[historicalData.length - 1].close as number
      };
    } catch (error) {
      console.error(`Error predicting prices for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get active models
   * @returns Map of active models
   */
  getActiveModels(): Map<string, ActiveModelInfo> {
    return this.activeModels;
  }

  /**
   * Get model evaluator
   * @returns Model evaluator
   */
  getModelEvaluator(): ModelEvaluator {
    return this.modelEvaluator;
  }

  /**
   * Get model deployment service
   * @returns Model deployment service
   */
  getModelDeploymentService(): ModelDeploymentService {
    return this.modelDeploymentService;
  }
}

/**
 * Interface for model training configuration
 */
export interface ModelTrainingConfig {
  symbol: string;
  modelType: 'lstm' | 'transformer';
  startDate: Date;
  endDate: Date;
  dataInterval: 'daily' | 'weekly' | 'monthly' | '1min' | '5min' | '15min' | '30min' | '60min';
  lookbackWindow: number;
  forecastHorizon: number;
  featureColumns: string[];
  targetColumns: string[];
  trainTestSplit: number;
  epochs: number;
  batchSize: number;
  learningRate: number;
  apiKey: string;
  dataSource: 'alphavantage' | 'polygon' | 'iex' | 'yahoo' | 'custom';
  
  // LSTM-specific parameters
  lstmLayers?: number[];
  denseLayers?: number[];
  dropout?: number;
  
  // Transformer-specific parameters
  headSize?: number;
  numHeads?: number;
  ffDim?: number;
  numTransformerBlocks?: number;
  mlpUnits?: number[];
}

/**
 * Interface for model training result
 */
export interface ModelTrainingResult {
  modelId: string;
  deploymentId: string;
  symbol: string;
  modelType: string;
  metrics: {
    mae: number;
    rmse: number;
    mape: number;
    rSquared: number;
    directionAccuracy: number;
    sharpeRatio: number;
    maxDrawdown: number;
  };
  trainingHistory: {
    loss: number[];
    valLoss: number[];
  };
  actualPrices: number[];
  predictedPrices: number[];
}

/**
 * Interface for active model information
 */
export interface ActiveModelInfo {
  symbol: string;
  modelId: string;
  deploymentId: string;
  modelType: string;
  lastUpdated: Date;
}

/**
 * Interface for prediction result
 */
export interface PredictionResult {
  symbol: string;
  modelId: string;
  modelType: string;
  predictionDate: Date;
  predictionDates: Date[];
  predictionValues: number[];
  lastPrice: number;
}