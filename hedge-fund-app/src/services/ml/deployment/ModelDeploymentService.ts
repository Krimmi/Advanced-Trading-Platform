import * as tf from '@tensorflow/tfjs';
import { TimeSeriesModel } from '../models/TimeSeriesModel';
import { TimeSeriesPreprocessor, TimeSeriesPreprocessorState } from '../preprocessing/TimeSeriesPreprocessor';

/**
 * Service for deploying and managing machine learning models
 */
export class ModelDeploymentService {
  private static instance: ModelDeploymentService;
  private deployedModels: Map<string, DeployedModel> = new Map();
  private modelRegistry: Map<string, ModelRegistryEntry> = new Map();

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}

  /**
   * Get the singleton instance
   * @returns ModelDeploymentService instance
   */
  public static getInstance(): ModelDeploymentService {
    if (!ModelDeploymentService.instance) {
      ModelDeploymentService.instance = new ModelDeploymentService();
    }
    return ModelDeploymentService.instance;
  }

  /**
   * Register a model in the registry
   * @param modelId Unique model identifier
   * @param entry Model registry entry
   */
  registerModel(modelId: string, entry: ModelRegistryEntry): void {
    if (this.modelRegistry.has(modelId)) {
      console.warn(`Model ${modelId} already exists in registry. Overwriting.`);
    }
    
    this.modelRegistry.set(modelId, entry);
    console.log(`Model ${modelId} registered successfully.`);
  }

  /**
   * Get a model from the registry
   * @param modelId Model identifier
   * @returns Model registry entry or undefined if not found
   */
  getModelRegistryEntry(modelId: string): ModelRegistryEntry | undefined {
    return this.modelRegistry.get(modelId);
  }

  /**
   * List all registered models
   * @returns Array of model registry entries
   */
  listRegisteredModels(): ModelRegistryEntry[] {
    return Array.from(this.modelRegistry.values());
  }

  /**
   * Deploy a model for inference
   * @param modelId Model identifier
   * @param model TensorFlow.js model
   * @param preprocessor Time series preprocessor
   * @returns Deployed model ID
   */
  async deployModel(
    modelId: string,
    model: tf.LayersModel,
    preprocessor: TimeSeriesPreprocessor
  ): Promise<string> {
    const deploymentId = `${modelId}-${Date.now()}`;
    
    // Save preprocessor state
    const preprocessorState = preprocessor.saveState();
    
    // Create deployed model entry
    const deployedModel: DeployedModel = {
      deploymentId,
      modelId,
      model,
      preprocessorState,
      deploymentTime: new Date(),
      lastUsed: new Date(),
      inferenceCount: 0,
      status: 'active'
    };
    
    // Store deployed model
    this.deployedModels.set(deploymentId, deployedModel);
    
    console.log(`Model ${modelId} deployed successfully with deployment ID: ${deploymentId}`);
    return deploymentId;
  }

  /**
   * Get a deployed model
   * @param deploymentId Deployment identifier
   * @returns Deployed model or undefined if not found
   */
  getDeployedModel(deploymentId: string): DeployedModel | undefined {
    return this.deployedModels.get(deploymentId);
  }

  /**
   * List all deployed models
   * @returns Array of deployed models
   */
  listDeployedModels(): DeployedModel[] {
    return Array.from(this.deployedModels.values());
  }

  /**
   * Unload a deployed model
   * @param deploymentId Deployment identifier
   * @returns True if successful, false otherwise
   */
  unloadModel(deploymentId: string): boolean {
    const deployedModel = this.deployedModels.get(deploymentId);
    
    if (!deployedModel) {
      console.warn(`Model with deployment ID ${deploymentId} not found.`);
      return false;
    }
    
    // Dispose TensorFlow.js model to free memory
    deployedModel.model.dispose();
    
    // Update status
    deployedModel.status = 'unloaded';
    
    console.log(`Model with deployment ID ${deploymentId} unloaded successfully.`);
    return true;
  }

  /**
   * Delete a deployed model
   * @param deploymentId Deployment identifier
   * @returns True if successful, false otherwise
   */
  deleteDeployedModel(deploymentId: string): boolean {
    const deployedModel = this.deployedModels.get(deploymentId);
    
    if (!deployedModel) {
      console.warn(`Model with deployment ID ${deploymentId} not found.`);
      return false;
    }
    
    // Dispose TensorFlow.js model to free memory
    if (deployedModel.status === 'active') {
      deployedModel.model.dispose();
    }
    
    // Remove from deployed models
    this.deployedModels.delete(deploymentId);
    
    console.log(`Model with deployment ID ${deploymentId} deleted successfully.`);
    return true;
  }

  /**
   * Make predictions using a deployed model
   * @param deploymentId Deployment identifier
   * @param inputData Input data for prediction
   * @returns Prediction results
   */
  async predict(deploymentId: string, inputData: number[][]): Promise<number[][]> {
    const deployedModel = this.deployedModels.get(deploymentId);
    
    if (!deployedModel) {
      throw new Error(`Model with deployment ID ${deploymentId} not found.`);
    }
    
    if (deployedModel.status !== 'active') {
      throw new Error(`Model with deployment ID ${deploymentId} is not active.`);
    }
    
    try {
      // Convert input to tensor
      const inputTensor = tf.tensor(inputData);
      
      // Make prediction
      const predictionTensor = deployedModel.model.predict(inputTensor) as tf.Tensor;
      
      // Convert prediction to array
      const predictions = await predictionTensor.array() as number[][];
      
      // Clean up tensors
      inputTensor.dispose();
      predictionTensor.dispose();
      
      // Update model usage statistics
      deployedModel.lastUsed = new Date();
      deployedModel.inferenceCount++;
      
      return predictions;
    } catch (error) {
      console.error(`Error making prediction with model ${deploymentId}:`, error);
      throw error;
    }
  }

  /**
   * Create a preprocessor from a deployed model
   * @param deploymentId Deployment identifier
   * @returns Time series preprocessor
   */
  createPreprocessorFromDeployedModel(deploymentId: string): TimeSeriesPreprocessor {
    const deployedModel = this.deployedModels.get(deploymentId);
    
    if (!deployedModel) {
      throw new Error(`Model with deployment ID ${deploymentId} not found.`);
    }
    
    // Create preprocessor
    const preprocessor = new TimeSeriesPreprocessor(deployedModel.preprocessorState.config);
    
    // Load preprocessor state
    preprocessor.loadState(deployedModel.preprocessorState);
    
    return preprocessor;
  }

  /**
   * Update model registry entry
   * @param modelId Model identifier
   * @param updates Updates to apply
   * @returns True if successful, false otherwise
   */
  updateModelRegistryEntry(modelId: string, updates: Partial<ModelRegistryEntry>): boolean {
    const entry = this.modelRegistry.get(modelId);
    
    if (!entry) {
      console.warn(`Model ${modelId} not found in registry.`);
      return false;
    }
    
    // Apply updates
    Object.assign(entry, updates);
    
    // Update last modified timestamp
    entry.lastModified = new Date();
    
    console.log(`Model ${modelId} registry entry updated successfully.`);
    return true;
  }

  /**
   * Delete model from registry
   * @param modelId Model identifier
   * @returns True if successful, false otherwise
   */
  deleteModelFromRegistry(modelId: string): boolean {
    if (!this.modelRegistry.has(modelId)) {
      console.warn(`Model ${modelId} not found in registry.`);
      return false;
    }
    
    // Remove from registry
    this.modelRegistry.delete(modelId);
    
    console.log(`Model ${modelId} deleted from registry successfully.`);
    return true;
  }

  /**
   * Get deployment statistics
   * @returns Deployment statistics
   */
  getDeploymentStatistics(): DeploymentStatistics {
    const totalModels = this.deployedModels.size;
    let activeModels = 0;
    let unloadedModels = 0;
    let totalInferences = 0;
    
    for (const model of this.deployedModels.values()) {
      if (model.status === 'active') {
        activeModels++;
      } else {
        unloadedModels++;
      }
      
      totalInferences += model.inferenceCount;
    }
    
    return {
      totalModels,
      activeModels,
      unloadedModels,
      totalInferences
    };
  }
}

/**
 * Interface for deployed model
 */
export interface DeployedModel {
  deploymentId: string;
  modelId: string;
  model: tf.LayersModel;
  preprocessorState: TimeSeriesPreprocessorState;
  deploymentTime: Date;
  lastUsed: Date;
  inferenceCount: number;
  status: 'active' | 'unloaded';
}

/**
 * Interface for model registry entry
 */
export interface ModelRegistryEntry {
  modelId: string;
  name: string;
  version: string;
  description: string;
  modelType: string;
  created: Date;
  lastModified: Date;
  author: string;
  tags: string[];
  metrics?: Record<string, number>;
  hyperparameters?: Record<string, any>;
  storageLocation?: string;
}

/**
 * Interface for deployment statistics
 */
export interface DeploymentStatistics {
  totalModels: number;
  activeModels: number;
  unloadedModels: number;
  totalInferences: number;
}