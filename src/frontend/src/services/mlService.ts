import { apiRequest } from './api';

// Types
export interface PricePrediction {
  date: string;
  predictedPrice: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

export interface SentimentAnalysis {
  date: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  source: string;
  title?: string;
  summary?: string;
}

export interface AnomalyDetection {
  date: string;
  price: number;
  isAnomaly: boolean;
  anomalyScore: number;
  anomalyType?: 'price' | 'volume' | 'volatility';
}

export interface FactorAnalysis {
  factor: string;
  exposure: number;
  contribution: number;
}

export interface SmartBetaAnalysis {
  strategy: string;
  expectedReturn: number;
  expectedRisk: number;
  sharpeRatio: number;
  weights: { [symbol: string]: number };
}

// ML Model Management Types
import {
  MLModel,
  ModelType,
  ModelStatus,
  ModelMetrics,
  ModelVersion,
  FeatureImportance,
  TrainingHistoryPoint,
  ModelLog,
  ModelPrediction,
  PredictionConfig,
  PredictionResult,
  PredictionMetrics,
  FeatureContribution,
  GlobalFeatureImportance,
  FeatureCorrelation,
  PartialDependencePlot,
  PerformanceMetric,
  PerformanceOverTime,
  ClassPerformance,
  ModelComparison,
  AutoMLConfig,
  AutoMLResult
} from '../types/ml';

export class MLService {
  // Get all models
  getModels = async (): Promise<MLModel[]> => {
    return apiRequest<MLModel[]>({
      method: 'GET',
      url: '/api/ml/models',
    });
  };

  // Get a specific model by ID
  getModel = async (modelId: string): Promise<MLModel> => {
    return apiRequest<MLModel>({
      method: 'GET',
      url: `/api/ml/models/${modelId}`,
    });
  };

  // Create a new model
  createModel = async (modelData: {
    name: string;
    type: ModelType;
    description: string;
  }): Promise<MLModel> => {
    return apiRequest<MLModel>({
      method: 'POST',
      url: '/api/ml/models',
      data: modelData,
    });
  };

  // Update a model
  updateModel = async (
    modelId: string,
    modelData: Partial<MLModel>
  ): Promise<MLModel> => {
    return apiRequest<MLModel>({
      method: 'PUT',
      url: `/api/ml/models/${modelId}`,
      data: modelData,
    });
  };

  // Delete a model
  deleteModel = async (modelId: string): Promise<void> => {
    return apiRequest<void>({
      method: 'DELETE',
      url: `/api/ml/models/${modelId}`,
    });
  };

  // Deploy a model
  deployModel = async (modelId: string): Promise<MLModel> => {
    return apiRequest<MLModel>({
      method: 'POST',
      url: `/api/ml/models/${modelId}/deploy`,
    });
  };

  // Train a model
  trainModel = async (
    modelId: string,
    trainingConfig: any
  ): Promise<MLModel> => {
    return apiRequest<MLModel>({
      method: 'POST',
      url: `/api/ml/models/${modelId}/train`,
      data: trainingConfig,
    });
  };

  // Get model versions
  getModelVersions = async (modelId: string): Promise<ModelVersion[]> => {
    return apiRequest<ModelVersion[]>({
      method: 'GET',
      url: `/api/ml/models/${modelId}/versions`,
    });
  };

  // Get model metrics
  getModelMetrics = async (modelId: string): Promise<ModelMetrics> => {
    return apiRequest<ModelMetrics>({
      method: 'GET',
      url: `/api/ml/models/${modelId}/metrics`,
    });
  };

  // Get model feature importance
  getFeatureImportance = async (modelId: string): Promise<FeatureImportance[]> => {
    return apiRequest<FeatureImportance[]>({
      method: 'GET',
      url: `/api/ml/models/${modelId}/feature-importance`,
    });
  };

  // Get feature correlations
  getFeatureCorrelations = async (modelId: string): Promise<FeatureCorrelation[]> => {
    return apiRequest<FeatureCorrelation[]>({
      method: 'GET',
      url: `/api/ml/models/${modelId}/feature-correlations`,
    });
  };

  // Get partial dependence plots
  getPartialDependence = async (
    modelId: string,
    feature: string
  ): Promise<PartialDependencePlot> => {
    return apiRequest<PartialDependencePlot>({
      method: 'GET',
      url: `/api/ml/models/${modelId}/partial-dependence`,
      params: { feature },
    });
  };

  // Get model logs
  getModelLogs = async (modelId: string): Promise<ModelLog[]> => {
    return apiRequest<ModelLog[]>({
      method: 'GET',
      url: `/api/ml/models/${modelId}/logs`,
    });
  };

  // Run a prediction
  runPrediction = async (config: PredictionConfig): Promise<PredictionResult> => {
    return apiRequest<PredictionResult>({
      method: 'POST',
      url: '/api/ml/predict',
      data: config,
    });
  };

  // Get prediction history
  getPredictionHistory = async (modelId: string): Promise<PredictionResult[]> => {
    return apiRequest<PredictionResult[]>({
      method: 'GET',
      url: `/api/ml/models/${modelId}/predictions`,
    });
  };

  // Get prediction metrics
  getPredictionMetrics = async (modelId: string): Promise<PredictionMetrics> => {
    return apiRequest<PredictionMetrics>({
      method: 'GET',
      url: `/api/ml/models/${modelId}/prediction-metrics`,
    });
  };

  // Get local feature explanations
  getLocalExplanations = async (
    modelId: string,
    inputData: Record<string, any>
  ): Promise<FeatureContribution[]> => {
    return apiRequest<FeatureContribution[]>({
      method: 'POST',
      url: `/api/ml/models/${modelId}/explain`,
      data: { inputData },
    });
  };

  // Get model performance metrics
  getPerformanceMetrics = async (modelId: string): Promise<PerformanceMetric[]> => {
    return apiRequest<PerformanceMetric[]>({
      method: 'GET',
      url: `/api/ml/models/${modelId}/performance-metrics`,
    });
  };

  // Get performance over time
  getPerformanceOverTime = async (
    modelId: string,
    timeRange: string
  ): Promise<PerformanceOverTime[]> => {
    return apiRequest<PerformanceOverTime[]>({
      method: 'GET',
      url: `/api/ml/models/${modelId}/performance-history`,
      params: { timeRange },
    });
  };

  // Get class performance (for classification models)
  getClassPerformance = async (modelId: string): Promise<ClassPerformance[]> => {
    return apiRequest<ClassPerformance[]>({
      method: 'GET',
      url: `/api/ml/models/${modelId}/class-performance`,
    });
  };

  // Compare models
  compareModels = async (modelIds: string[]): Promise<ModelComparison[]> => {
    return apiRequest<ModelComparison[]>({
      method: 'POST',
      url: '/api/ml/models/compare',
      data: { modelIds },
    });
  };

  // Run AutoML
  runAutoML = async (config: AutoMLConfig): Promise<AutoMLResult> => {
    return apiRequest<AutoMLResult>({
      method: 'POST',
      url: '/api/ml/automl',
      data: config,
    });
  };

  // Get AutoML status
  getAutoMLStatus = async (autoMLId: string): Promise<AutoMLResult> => {
    return apiRequest<AutoMLResult>({
      method: 'GET',
      url: `/api/ml/automl/${autoMLId}`,
    });
  };

  // Get AutoML history
  getAutoMLHistory = async (): Promise<AutoMLResult[]> => {
    return apiRequest<AutoMLResult[]>({
      method: 'GET',
      url: '/api/ml/automl/history',
    });
  };

  // Get available datasets
  getDatasets = async (): Promise<any[]> => {
    return apiRequest<any[]>({
      method: 'GET',
      url: '/api/ml/datasets',
    });
  };

  // Get dataset columns
  getDatasetColumns = async (datasetId: string): Promise<string[]> => {
    return apiRequest<string[]>({
      method: 'GET',
      url: `/api/ml/datasets/${datasetId}/columns`,
    });
  };

  // Legacy ML predictions service methods
  getPricePredictions = (
    symbol: string,
    days: number = 30,
    modelType: 'ensemble' | 'lstm' | 'prophet' | 'arima' = 'ensemble'
  ) => {
    return apiRequest<PricePrediction[]>({
      method: 'GET',
      url: `/api/predictions/price/${symbol}`,
      params: {
        days,
        model_type: modelType,
      },
    });
  };

  getSentimentAnalysis = (symbol: string, days: number = 30) => {
    return apiRequest<SentimentAnalysis[]>({
      method: 'GET',
      url: `/api/predictions/sentiment/${symbol}`,
      params: {
        days,
      },
    });
  };

  getAnomalyDetection = (symbol: string, days: number = 90) => {
    return apiRequest<AnomalyDetection[]>({
      method: 'GET',
      url: `/api/predictions/anomalies/${symbol}`,
      params: {
        days,
      },
    });
  };

  getFactorAnalysis = (symbol: string) => {
    return apiRequest<FactorAnalysis[]>({
      method: 'GET',
      url: `/api/predictions/factors/${symbol}`,
    });
  };

  getSmartBetaAnalysis = (symbols: string[]) => {
    return apiRequest<SmartBetaAnalysis>({
      method: 'POST',
      url: '/api/predictions/smart-beta',
      data: {
        symbols,
      },
    });
  };

  getCorrelationAnalysis = (symbols: string[], timeframe: 'daily' | 'weekly' | 'monthly' = 'daily') => {
    return apiRequest<{ [symbol: string]: { [symbol: string]: number } }>({
      method: 'POST',
      url: '/api/predictions/correlation',
      data: {
        symbols,
        timeframe,
      },
    });
  };

  getVolatilityForecast = (symbol: string, days: number = 30) => {
    return apiRequest<any[]>({
      method: 'GET',
      url: `/api/predictions/volatility/${symbol}`,
      params: {
        days,
      },
    });
  };

  getTrendPrediction = (symbol: string) => {
    return apiRequest<{
      trend: 'bullish' | 'bearish' | 'neutral';
      confidence: number;
      timeframe: string;
      factors: { factor: string; impact: number }[];
    }>({
      method: 'GET',
      url: `/api/predictions/trend/${symbol}`,
    });
  };

  getModelPerformance = (symbol: string, modelType: 'ensemble' | 'lstm' | 'prophet' | 'arima' = 'ensemble') => {
    return apiRequest<{
      mse: number;
      rmse: number;
      mae: number;
      mape: number;
      r2: number;
      lastUpdated: string;
    }>({
      method: 'GET',
      url: `/api/predictions/performance/${symbol}`,
      params: {
        model_type: modelType,
      },
    });
  };
}

export default MLService;