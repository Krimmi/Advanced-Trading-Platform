// ML Model Types

export enum ModelType {
  REGRESSION = 'REGRESSION',
  CLASSIFICATION = 'CLASSIFICATION',
  TIME_SERIES = 'TIME_SERIES',
  CLUSTERING = 'CLUSTERING',
  REINFORCEMENT = 'REINFORCEMENT'
}

export enum ModelStatus {
  DRAFT = 'DRAFT',
  TRAINING = 'TRAINING',
  READY = 'READY',
  DEPLOYED = 'DEPLOYED',
  FAILED = 'FAILED',
  ARCHIVED = 'ARCHIVED'
}

export interface ModelMetrics {
  accuracy: number;
  f1Score?: number;
  precision?: number;
  recall?: number;
  rmse?: number;
  mae?: number;
  r2?: number;
  lastUpdated: string;
}

export interface ModelVersion {
  id: string;
  version: string;
  status: ModelStatus;
  createdAt: string;
  updatedAt: string;
  metrics?: ModelMetrics;
  isProduction: boolean;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface TrainingHistoryPoint {
  epoch: number;
  accuracy: number;
  loss: number;
  val_accuracy: number;
  val_loss: number;
}

export interface ModelLog {
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  message: string;
}

export interface ModelPrediction {
  timestamp: string;
  input: any;
  prediction: any;
  confidence?: number;
  actual?: any;
  error?: number;
}

export interface MLModel {
  id: string;
  name: string;
  description: string;
  type: ModelType;
  status: ModelStatus;
  createdAt: string;
  updatedAt: string;
  framework?: string;
  version?: string;
  isProduction: boolean;
  metrics?: ModelMetrics;
  schema?: {
    properties: Record<string, any>;
    required?: string[];
  };
  versions?: ModelVersion[];
  featureImportance?: FeatureImportance[];
  trainingHistory?: TrainingHistoryPoint[];
  recentPredictions?: ModelPrediction[];
  logs?: ModelLog[];
}

export interface ModelTrainingConfig {
  hyperparameters: Record<string, any>;
  datasetId: string;
  validationSplit: number;
  epochs: number;
  batchSize: number;
  earlyStoppingPatience?: number;
  learningRate?: number;
}

// Prediction Types

export interface PredictionConfig {
  modelId: string;
  inputData: Record<string, any>;
  options: {
    returnProbabilities: boolean;
    includeFeatureContributions: boolean;
    confidenceThreshold: number;
    batchSize: number;
  };
}

export interface PredictionInterval {
  lower: number;
  upper: number;
}

export interface PredictionResult {
  id: string;
  modelId: string;
  timestamp: string;
  prediction: any;
  confidence?: number;
  probabilities?: Record<string, number>;
  featureContributions?: Record<string, number>;
  predictionInterval?: PredictionInterval;
  inputData: Record<string, any>;
  actual?: any;
  error?: number;
}

export interface ConfusionMatrix {
  [actualClass: string]: {
    [predictedClass: string]: number;
  };
}

export interface TimeSeriesMetric {
  timestamp: string;
  accuracy: number;
  error: number;
  count: number;
}

export interface ScatterDataPoint {
  actual: number;
  predicted: number;
  count: number;
}

export interface PredictionMetrics {
  accuracy: number;
  meanError: number;
  rmse: number;
  averageLatency: number;
  confusionMatrix?: ConfusionMatrix;
  timeSeriesMetrics?: TimeSeriesMetric[];
  scatterData?: ScatterDataPoint[];
  featureImportance?: Record<string, number>;
}

// Feature Importance Types

export interface FeatureContribution {
  feature: string;
  value: number;
  contribution: number;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface GlobalFeatureImportance {
  feature: string;
  importance: number;
  description?: string;
}

export interface FeatureCorrelation {
  feature1: string;
  feature2: string;
  correlation: number;
}

export interface PartialDependencePlot {
  feature: string;
  values: number[];
  predictions: number[];
}

// Model Performance Types

export interface PerformanceMetric {
  name: string;
  value: number;
  change: number;
  target?: number;
}

export interface PerformanceOverTime {
  timestamp: string;
  accuracy: number;
  loss: number;
}

export interface ClassPerformance {
  class: string;
  precision: number;
  recall: number;
  f1Score: number;
  support: number;
}

export interface ModelComparison {
  modelId: string;
  modelName: string;
  accuracy: number;
  latency: number;
  size: number;
  lastUpdated: string;
}

// AutoML Types

export interface AutoMLConfig {
  datasetId: string;
  targetColumn: string;
  optimizationMetric: string;
  timeLimit: number;
  maxModels: number;
  modelTypes: ModelType[];
  validationStrategy: 'cross_validation' | 'train_test_split' | 'time_series_split';
  validationParams: Record<string, any>;
}

export interface AutoMLResult {
  id: string;
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  bestModel?: {
    modelId: string;
    modelType: string;
    accuracy: number;
    hyperparameters: Record<string, any>;
  };
  leaderboard: {
    modelId: string;
    modelType: string;
    accuracy: number;
    rank: number;
  }[];
  progress: number;
}