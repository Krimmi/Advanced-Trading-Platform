/**
 * Factor Models API Service
 * This service provides methods to interact with the factor models API endpoints.
 */
import axios from 'axios';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/factor-models`;

/**
 * Interface for factor model information
 */
export interface FactorModel {
  model_name: string;
  model_type: string;
  created_at: string;
  updated_at: string;
  factors: string[];
  is_trained: boolean;
  performance_metrics?: any;
}

/**
 * Interface for factor exposures
 */
export interface FactorExposures {
  [symbol: string]: {
    [factor: string]: number;
  };
}

/**
 * Interface for risk decomposition
 */
export interface RiskDecomposition {
  [symbol: string]: {
    [factor: string]: {
      beta: number;
      marginal_contribution: number;
      component_contribution: number;
      percentage_contribution: number;
    };
  };
}

/**
 * Interface for factor contributions
 */
export interface FactorContributions {
  [symbol: string]: {
    [date: string]: {
      [factor: string]: number;
      total: number;
    };
  };
}

/**
 * Interface for model predictions
 */
export interface ModelPredictions {
  [date: string]: {
    [symbol: string]: number;
  };
}

/**
 * Factor Models API Service
 */
const factorModelsService = {
  /**
   * Get a list of all factor models
   */
  async getModels(): Promise<FactorModel[]> {
    try {
      const response = await axios.get(`${API_URL}/models`);
      return response.data.models;
    } catch (error) {
      console.error('Error fetching factor models:', error);
      throw error;
    }
  },

  /**
   * Create a new factor model
   * @param modelType Type of factor model (fama_french, apt, custom)
   * @param modelName Name of the model (optional)
   * @param modelSubtype Subtype for Fama-French model (three_factor or five_factor)
   * @param numFactors Number of factors for APT model
   */
  async createModel(
    modelType: string,
    modelName?: string,
    modelSubtype?: string,
    numFactors?: number
  ): Promise<FactorModel> {
    try {
      const params: any = { model_type: modelType };
      
      if (modelName) params.model_name = modelName;
      if (modelSubtype) params.model_subtype = modelSubtype;
      if (numFactors) params.num_factors = numFactors;
      
      const response = await axios.post(`${API_URL}/models`, null, { params });
      return response.data;
    } catch (error) {
      console.error('Error creating factor model:', error);
      throw error;
    }
  },

  /**
   * Get information about a specific factor model
   * @param modelName Name of the factor model
   */
  async getModelInfo(modelName: string): Promise<FactorModel> {
    try {
      const response = await axios.get(`${API_URL}/models/${modelName}`);
      return response.data.model_info;
    } catch (error) {
      console.error(`Error fetching model info for ${modelName}:`, error);
      throw error;
    }
  },

  /**
   * Delete a factor model
   * @param modelName Name of the factor model to delete
   */
  async deleteModel(modelName: string): Promise<boolean> {
    try {
      const response = await axios.delete(`${API_URL}/models/${modelName}`);
      return response.data.deleted;
    } catch (error) {
      console.error(`Error deleting model ${modelName}:`, error);
      throw error;
    }
  },

  /**
   * Train a factor model using historical data
   * @param modelName Name of the factor model
   * @param symbols List of stock symbols to use for training
   * @param lookbackDays Number of days of historical data to use
   */
  async trainModel(
    modelName: string,
    symbols: string[],
    lookbackDays: number = 252
  ): Promise<any> {
    try {
      const params = {
        symbols: symbols,
        lookback_days: lookbackDays
      };
      
      const response = await axios.post(
        `${API_URL}/models/${modelName}/train`,
        null,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error(`Error training model ${modelName}:`, error);
      throw error;
    }
  },

  /**
   * Get factor exposures for a model
   * @param modelName Name of the factor model
   */
  async getFactorExposures(modelName: string): Promise<FactorExposures> {
    try {
      const response = await axios.get(`${API_URL}/models/${modelName}/factor-exposures`);
      return response.data.factor_exposures;
    } catch (error) {
      console.error(`Error fetching factor exposures for ${modelName}:`, error);
      throw error;
    }
  },

  /**
   * Predict returns using a factor model
   * @param modelName Name of the factor model
   * @param symbols List of stock symbols to predict (optional)
   * @param days Number of days to predict
   */
  async predictReturns(
    modelName: string,
    symbols?: string[],
    days: number = 30
  ): Promise<ModelPredictions> {
    try {
      const params: any = { days };
      if (symbols && symbols.length > 0) params.symbols = symbols;
      
      const response = await axios.post(
        `${API_URL}/models/${modelName}/predict`,
        null,
        { params }
      );
      return response.data.predictions;
    } catch (error) {
      console.error(`Error predicting returns with model ${modelName}:`, error);
      throw error;
    }
  },

  /**
   * Analyze risk decomposition by factor
   * @param modelName Name of the factor model
   * @param symbols List of stock symbols to analyze (optional)
   */
  async analyzeRiskDecomposition(
    modelName: string,
    symbols?: string[]
  ): Promise<RiskDecomposition> {
    try {
      const params: any = {};
      if (symbols && symbols.length > 0) params.symbols = symbols;
      
      const response = await axios.post(
        `${API_URL}/models/${modelName}/risk-decomposition`,
        null,
        { params }
      );
      return response.data.risk_decomposition;
    } catch (error) {
      console.error(`Error analyzing risk decomposition for ${modelName}:`, error);
      throw error;
    }
  },

  /**
   * Analyze factor contribution to returns
   * @param modelName Name of the factor model
   * @param symbols List of stock symbols to analyze (optional)
   * @param days Number of days to analyze
   */
  async analyzeFactorContribution(
    modelName: string,
    symbols?: string[],
    days: number = 30
  ): Promise<FactorContributions> {
    try {
      const params: any = { days };
      if (symbols && symbols.length > 0) params.symbols = symbols;
      
      const response = await axios.post(
        `${API_URL}/models/${modelName}/factor-contribution`,
        null,
        { params }
      );
      return response.data.factor_contributions;
    } catch (error) {
      console.error(`Error analyzing factor contribution for ${modelName}:`, error);
      throw error;
    }
  },

  /**
   * Compare multiple factor models
   * @param modelNames List of model names to compare
   * @param symbols List of stock symbols to use for comparison
   * @param days Number of days of historical data to use
   */
  async compareModels(
    modelNames: string[],
    symbols: string[],
    days: number = 90
  ): Promise<any> {
    try {
      const params = {
        model_names: modelNames,
        symbols: symbols,
        days: days
      };
      
      const response = await axios.post(
        `${API_URL}/models/compare`,
        null,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Error comparing factor models:', error);
      throw error;
    }
  }
};

export default factorModelsService;