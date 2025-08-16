import axios from 'axios';
import { 
  MLModel, 
  ModelType, 
  ModelStatus, 
  ModelTrainingConfig,
  PredictionConfig,
  PredictionResult,
  PredictionMetrics
} from '../types/ml';

/**
 * Service for interacting with the ML API
 */
export class MLService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  }

  /**
   * Get all ML models
   * @returns Array of ML models
   */
  public async getModels(): Promise<MLModel[]> {
    try {
      // In a real implementation, this would call the API
      // For now, we'll simulate it with a timeout and mock data
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockModels: MLModel[] = [
            {
              id: '1',
              name: 'Stock Price Predictor',
              description: 'Predicts stock prices based on historical data',
              type: ModelType.REGRESSION,
              status: ModelStatus.DEPLOYED,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isProduction: true,
              metrics: {
                accuracy: 0.92,
                rmse: 0.08,
                mae: 0.06,
                r2: 0.89,
                lastUpdated: new Date().toISOString()
              }
            },
            {
              id: '2',
              name: 'Market Trend Classifier',
              description: 'Classifies market trends as bullish, bearish, or neutral',
              type: ModelType.CLASSIFICATION,
              status: ModelStatus.READY,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isProduction: false,
              metrics: {
                accuracy: 0.87,
                f1Score: 0.86,
                precision: 0.89,
                recall: 0.84,
                lastUpdated: new Date().toISOString()
              }
            },
            {
              id: '3',
              name: 'Volatility Forecaster',
              description: 'Forecasts market volatility for risk management',
              type: ModelType.TIME_SERIES,
              status: ModelStatus.TRAINING,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isProduction: false
            }
          ];
          
          resolve(mockModels);
        }, 500);
      });
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }

  /**
   * Get model by ID
   * @param id Model ID
   * @returns ML model
   */
  public async getModel(id: string): Promise<MLModel> {
    try {
      // In a real implementation, this would call the API
      // For now, we'll simulate it with a timeout and mock data
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const mockModel: MLModel = {
            id,
            name: 'Stock Price Predictor',
            description: 'Predicts stock prices based on historical data',
            type: ModelType.REGRESSION,
            status: ModelStatus.DEPLOYED,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isProduction: true,
            metrics: {
              accuracy: 0.92,
              rmse: 0.08,
              mae: 0.06,
              r2: 0.89,
              lastUpdated: new Date().toISOString()
            },
            schema: {
              properties: {
                open: { type: 'number' },
                high: { type: 'number' },
                low: { type: 'number' },
                close: { type: 'number' },
                volume: { type: 'number' },
                ma_20: { type: 'number' },
                rsi_14: { type: 'number' }
              },
              required: ['open', 'high', 'low', 'close', 'volume']
            },
            trainingHistory: Array.from({ length: 50 }, (_, i) => ({
              epoch: i + 1,
              accuracy: Math.min(0.5 + (i / 50) * 0.4 + Math.random() * 0.05, 0.99),
              loss: Math.max(0.5 - (i / 50) * 0.4 + Math.random() * 0.05, 0.01),
              val_accuracy: Math.min(0.45 + (i / 50) * 0.35 + Math.random() * 0.07, 0.95),
              val_loss: Math.max(0.55 - (i / 50) * 0.35 + Math.random() * 0.07, 0.05)
            })),
            featureImportance: [
              { feature: 'close', importance: 0.35 },
              { feature: 'volume', importance: 0.25 },
              { feature: 'rsi_14', importance: 0.20 },
              { feature: 'ma_20', importance: 0.15 },
              { feature: 'open', importance: 0.05 }
            ]
          };
          
          resolve(mockModel);
        }, 500);
      });
    } catch (error) {
      console.error(`Error fetching model with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new model
   * @param model Model to create
   * @returns Created model
   */
  public async createModel(model: Partial<MLModel>): Promise<MLModel> {
    try {
      // In a real implementation, this would call the API
      // For now, we'll simulate it with a timeout and mock data
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockModel: MLModel = {
            id: Math.random().toString(36).substring(2, 11),
            name: model.name || 'New Model',
            description: model.description || '',
            type: model.type || ModelType.REGRESSION,
            status: ModelStatus.DRAFT,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isProduction: false
          };
          
          resolve(mockModel);
        }, 500);
      });
    } catch (error) {
      console.error('Error creating model:', error);
      throw error;
    }
  }

  /**
   * Update an existing model
   * @param id Model ID
   * @param model Updated model data
   * @returns Updated model
   */
  public async updateModel(id: string, model: Partial<MLModel>): Promise<MLModel> {
    try {
      // In a real implementation, this would call the API
      // For now, we'll simulate it with a timeout and mock data
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockModel: MLModel = {
            id,
            name: model.name || 'Updated Model',
            description: model.description || '',
            type: model.type || ModelType.REGRESSION,
            status: model.status || ModelStatus.DRAFT,
            createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            updatedAt: new Date().toISOString(),
            isProduction: model.isProduction || false,
            metrics: model.metrics
          };
          
          resolve(mockModel);
        }, 500);
      });
    } catch (error) {
      console.error(`Error updating model with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a model
   * @param id Model ID
   * @returns Success status
   */
  public async deleteModel(id: string): Promise<{ success: boolean }> {
    try {
      // In a real implementation, this would call the API
      // For now, we'll simulate it with a timeout
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 500);
      });
    } catch (error) {
      console.error(`Error deleting model with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deploy a model
   * @param id Model ID
   * @returns Deployed model
   */
  public async deployModel(id: string): Promise<MLModel> {
    try {
      // In a real implementation, this would call the API
      // For now, we'll simulate it with a timeout and mock data
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockModel: MLModel = {
            id,
            name: 'Deployed Model',
            description: 'This model has been deployed',
            type: ModelType.REGRESSION,
            status: ModelStatus.DEPLOYED,
            createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            updatedAt: new Date().toISOString(),
            isProduction: false,
            metrics: {
              accuracy: 0.92,
              rmse: 0.08,
              mae: 0.06,
              r2: 0.89,
              lastUpdated: new Date().toISOString()
            }
          };
          
          resolve(mockModel);
        }, 1000);
      });
    } catch (error) {
      console.error(`Error deploying model with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Train a model
   * @param id Model ID
   * @param config Training configuration
   * @returns Training job ID
   */
  public async trainModel(id: string, config: ModelTrainingConfig): Promise<{ jobId: string }> {
    try {
      // In a real implementation, this would call the API
      // For now, we'll simulate it with a timeout
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ jobId: Math.random().toString(36).substring(2, 11) });
        }, 500);
      });
    } catch (error) {
      console.error(`Error training model with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get training job status
   * @param jobId Training job ID
   * @returns Job status
   */
  public async getTrainingJobStatus(jobId: string): Promise<{ 
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    metrics?: any;
    error?: string;
  }> {
    try {
      // In a real implementation, this would call the API
      // For now, we'll simulate it with a timeout and mock data
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            status: 'running',
            progress: Math.random() * 100
          });
        }, 500);
      });
    } catch (error) {
      console.error(`Error getting training job status for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Run a prediction
   * @param config Prediction configuration
   * @returns Prediction result
   */
  public async runPrediction(config: PredictionConfig): Promise<PredictionResult> {
    try {
      // In a real implementation, this would call the API
      // For now, we'll simulate it with a timeout and mock data
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockResult: PredictionResult = {
            id: Math.random().toString(36).substring(2, 11),
            modelId: config.modelId,
            timestamp: new Date().toISOString(),
            prediction: Math.random() > 0.5 ? 1 : 0,
            confidence: 0.7 + Math.random() * 0.25,
            probabilities: {
              '0': 0.2 + Math.random() * 0.2,
              '1': 0.6 + Math.random() * 0.3
            },
            featureContributions: {
              'close': 0.35 + Math.random() * 0.1,
              'volume': 0.25 + Math.random() * 0.1,
              'rsi_14': 0.2 + Math.random() * 0.1,
              'ma_20': 0.15 + Math.random() * 0.1,
              'open': 0.05 + Math.random() * 0.05
            },
            inputData: config.inputData
          };
          
          resolve(mockResult);
        }, 1000);
      });
    } catch (error) {
      console.error('Error running prediction:', error);
      throw error;
    }
  }

  /**
   * Get prediction history for a model
   * @param modelId Model ID
   * @returns Array of prediction results
   */
  public async getPredictionHistory(modelId: string): Promise<PredictionResult[]> {
    try {
      // In a real implementation, this would call the API
      // For now, we'll simulate it with a timeout and mock data
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockHistory: PredictionResult[] = Array.from({ length: 20 }, (_, i) => ({
            id: Math.random().toString(36).substring(2, 11),
            modelId,
            timestamp: new Date(Date.now() - i * 3600000).toISOString(), // Hours ago
            prediction: Math.random() > 0.5 ? 1 : 0,
            confidence: 0.7 + Math.random() * 0.25,
            inputData: {
              open: 150 + Math.random() * 10,
              high: 155 + Math.random() * 10,
              low: 145 + Math.random() * 10,
              close: 152 + Math.random() * 10,
              volume: 1000000 + Math.random() * 500000,
              ma_20: 150 + Math.random() * 5,
              rsi_14: 50 + Math.random() * 20
            },
            actual: i < 15 ? (Math.random() > 0.5 ? 1 : 0) : undefined,
            error: i < 15 ? Math.random() * 0.2 : undefined
          }));
          
          resolve(mockHistory);
        }, 500);
      });
    } catch (error) {
      console.error(`Error getting prediction history for model ${modelId}:`, error);
      throw error;
    }
  }

  /**
   * Get prediction metrics for a model
   * @param modelId Model ID
   * @returns Prediction metrics
   */
  public async getPredictionMetrics(modelId: string): Promise<PredictionMetrics> {
    try {
      // In a real implementation, this would call the API
      // For now, we'll simulate it with a timeout and mock data
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockMetrics: PredictionMetrics = {
            accuracy: 0.85 + Math.random() * 0.1,
            meanError: 0.05 + Math.random() * 0.05,
            rmse: 0.08 + Math.random() * 0.05,
            averageLatency: 50 + Math.random() * 20,
            confusionMatrix: {
              '0': { '0': 42, '1': 8 },
              '1': { '0': 7, '1': 43 }
            },
            timeSeriesMetrics: Array.from({ length: 30 }, (_, i) => ({
              timestamp: new Date(Date.now() - i * 86400000).toISOString(), // Days ago
              accuracy: 0.8 + Math.random() * 0.15,
              error: 0.05 + Math.random() * 0.1,
              count: 10 + Math.floor(Math.random() * 20)
            })),
            scatterData: Array.from({ length: 50 }, () => ({
              actual: Math.random() * 100,
              predicted: Math.random() * 100,
              count: 1 + Math.floor(Math.random() * 5)
            })),
            featureImportance: {
              'close': 0.35 + Math.random() * 0.1,
              'volume': 0.25 + Math.random() * 0.1,
              'rsi_14': 0.2 + Math.random() * 0.1,
              'ma_20': 0.15 + Math.random() * 0.1,
              'open': 0.05 + Math.random() * 0.05
            }
          };
          
          resolve(mockMetrics);
        }, 500);
      });
    } catch (error) {
      console.error(`Error getting prediction metrics for model ${modelId}:`, error);
      throw error;
    }
  }

  /**
   * Get available datasets
   * @returns Array of datasets
   */
  public async getDatasets(): Promise<any[]> {
    try {
      // In a real implementation, this would call the API
      // For now, we'll simulate it with a timeout and mock data
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockDatasets = [
            { id: 'ds1', name: 'S&P 500 Historical Data', rows: 5000, columns: 12, lastUpdated: new Date().toISOString() },
            { id: 'ds2', name: 'NASDAQ Tech Stocks', rows: 3500, columns: 15, lastUpdated: new Date().toISOString() },
            { id: 'ds3', name: 'Forex Exchange Rates', rows: 8000, columns: 10, lastUpdated: new Date().toISOString() },
            { id: 'ds4', name: 'Cryptocurrency Market Data', rows: 4200, columns: 18, lastUpdated: new Date().toISOString() }
          ];
          
          resolve(mockDatasets);
        }, 500);
      });
    } catch (error) {
      console.error('Error fetching datasets:', error);
      throw error;
    }
  }

  /**
   * Get dataset preview
   * @param datasetId Dataset ID
   * @returns Dataset preview
   */
  public async getDatasetPreview(datasetId: string): Promise<any> {
    try {
      // In a real implementation, this would call the API
      // For now, we'll simulate it with a timeout and mock data
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockPreview = {
            columns: ['date', 'open', 'high', 'low', 'close', 'volume', 'adj_close', 'returns', 'volatility', 'ma_20', 'rsi_14', 'target'],
            data: [
              { date: '2023-01-01', open: 150.25, high: 152.75, low: 149.50, close: 151.20, volume: 1500000, adj_close: 151.20, returns: 0.015, volatility: 0.12, ma_20: 148.50, rsi_14: 65.2, target: 1 },
              { date: '2023-01-02', open: 151.50, high: 153.25, low: 150.75, close: 152.80, volume: 1620000, adj_close: 152.80, returns: 0.011, volatility: 0.11, ma_20: 149.10, rsi_14: 67.5, target: 1 },
              { date: '2023-01-03', open: 152.90, high: 155.00, low: 152.00, close: 154.50, volume: 1750000, adj_close: 154.50, returns: 0.011, volatility: 0.10, ma_20: 149.80, rsi_14: 70.1, target: 1 },
              { date: '2023-01-04', open: 154.75, high: 156.25, low: 153.50, close: 155.75, volume: 1830000, adj_close: 155.75, returns: 0.008, volatility: 0.09, ma_20: 150.40, rsi_14: 72.3, target: 1 },
              { date: '2023-01-05', open: 155.50, high: 157.00, low: 154.25, close: 156.50, volume: 1680000, adj_close: 156.50, returns: 0.005, volatility: 0.10, ma_20: 151.10, rsi_14: 73.8, target: 1 }
            ]
          };
          
          resolve(mockPreview);
        }, 500);
      });
    } catch (error) {
      console.error(`Error fetching preview for dataset ${datasetId}:`, error);
      throw error;
    }
  }

  /**
   * Validate a model
   * @param model Model to validate
   * @returns Validation results
   */
  public async validateModel(model: MLModel): Promise<{
    valid: boolean;
    errors: { type: string; message: string }[];
    warnings: { type: string; message: string }[];
  }> {
    try {
      // In a real implementation, this would call the API
      // For now, we'll simulate it with a timeout and mock data
      return new Promise((resolve) => {
        setTimeout(() => {
          // Simple validation logic
          const errors = [];
          const warnings = [];
          
          if (!model.name) {
            errors.push({ type: 'name', message: 'Model name is required' });
          }
          
          if (!model.type) {
            errors.push({ type: 'type', message: 'Model type is required' });
          }
          
          if (model.name && model.name.length < 3) {
            warnings.push({ type: 'name', message: 'Model name is too short' });
          }
          
          resolve({
            valid: errors.length === 0,
            errors,
            warnings
          });
        }, 500);
      });
    } catch (error) {
      console.error('Error validating model:', error);
      throw error;
    }
  }
}

export default MLService;