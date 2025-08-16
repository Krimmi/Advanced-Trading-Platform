/**
 * Data Infrastructure Service
 * This service provides methods to interact with the data infrastructure API.
 */
import axios from 'axios';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/api/data`;

/**
 * Interface for data source
 */
export interface DataSource {
  id: number;
  name: string;
  type: string;
  description?: string;
  config: Record<string, any>;
  rate_limit?: number;
  enabled: boolean;
  created_at: string;
  last_updated: string;
}

/**
 * Interface for data pipeline
 */
export interface DataPipeline {
  id: number;
  name: string;
  description?: string;
  source_id?: number;
  steps: Record<string, any>[];
  schedule?: string;
  schedule_params: Record<string, any>;
  enabled: boolean;
  created_at: string;
  last_updated: string;
}

/**
 * Interface for data job
 */
export interface DataJob {
  job_id: string;
  pipeline_name: string;
  pipeline_id?: number;
  status: string;
  params: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
  start_time: string;
  end_time?: string;
}

/**
 * Interface for scheduled job
 */
export interface ScheduledJob {
  job_id: string;
  name: string;
  data_type: string;
  source: string;
  schedule_type: string;
  schedule_params: Record<string, any>;
  symbols?: string[];
  status: string;
  created_at: string;
  last_updated: string;
  next_run_time?: string;
  recent_logs?: Record<string, any>[];
}

/**
 * Interface for update log
 */
export interface UpdateLog {
  id: number;
  job_id: string;
  pipeline_job_id?: string;
  data_type: string;
  source: string;
  status: string;
  symbols?: string[];
  start_time: string;
  end_time?: string;
  duration?: number;
  result?: Record<string, any>;
  error?: string;
}

/**
 * Interface for market data request
 */
export interface MarketDataRequest {
  symbol: string;
  source?: string;
  data: Record<string, any>[];
}

/**
 * Interface for fundamental data request
 */
export interface FundamentalDataRequest {
  symbol: string;
  source?: string;
  data: Record<string, any>;
}

/**
 * Interface for alternative data request
 */
export interface AlternativeDataRequest {
  data_type: string;
  source?: string;
  data: any;
  metadata?: Record<string, any>;
}

/**
 * Interface for available data item
 */
export interface AvailableDataItem {
  id: number;
  data_type: string;
  symbol?: string;
  source: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  [key: string]: any;
}

/**
 * Data Infrastructure Service
 */
const dataInfrastructureService = {
  /**
   * Get all data sources
   */
  async getDataSources(type?: string, enabled?: boolean): Promise<DataSource[]> {
    try {
      const params: Record<string, any> = {};
      if (type) params.type = type;
      if (enabled !== undefined) params.enabled = enabled;

      const response = await axios.get(`${API_URL}/sources`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching data sources:', error);
      throw error;
    }
  },

  /**
   * Get a data source by ID
   */
  async getDataSource(id: number): Promise<DataSource> {
    try {
      const response = await axios.get(`${API_URL}/sources/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching data source ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new data source
   */
  async createDataSource(source: Omit<DataSource, 'id' | 'created_at' | 'last_updated'>): Promise<DataSource> {
    try {
      const response = await axios.post(`${API_URL}/sources`, source);
      return response.data;
    } catch (error) {
      console.error('Error creating data source:', error);
      throw error;
    }
  },

  /**
   * Update a data source
   */
  async updateDataSource(id: number, source: Partial<DataSource>): Promise<DataSource> {
    try {
      const response = await axios.put(`${API_URL}/sources/${id}`, source);
      return response.data;
    } catch (error) {
      console.error(`Error updating data source ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a data source
   */
  async deleteDataSource(id: number): Promise<void> {
    try {
      await axios.delete(`${API_URL}/sources/${id}`);
    } catch (error) {
      console.error(`Error deleting data source ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get all data pipelines
   */
  async getDataPipelines(sourceId?: number, enabled?: boolean): Promise<DataPipeline[]> {
    try {
      const params: Record<string, any> = {};
      if (sourceId) params.source_id = sourceId;
      if (enabled !== undefined) params.enabled = enabled;

      const response = await axios.get(`${API_URL}/pipelines`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching data pipelines:', error);
      throw error;
    }
  },

  /**
   * Get a data pipeline by ID
   */
  async getDataPipeline(id: number): Promise<DataPipeline> {
    try {
      const response = await axios.get(`${API_URL}/pipelines/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching data pipeline ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new data pipeline
   */
  async createDataPipeline(pipeline: Omit<DataPipeline, 'id' | 'created_at' | 'last_updated'>): Promise<DataPipeline> {
    try {
      const response = await axios.post(`${API_URL}/pipelines`, pipeline);
      return response.data;
    } catch (error) {
      console.error('Error creating data pipeline:', error);
      throw error;
    }
  },

  /**
   * Update a data pipeline
   */
  async updateDataPipeline(id: number, pipeline: Partial<DataPipeline>): Promise<DataPipeline> {
    try {
      const response = await axios.put(`${API_URL}/pipelines/${id}`, pipeline);
      return response.data;
    } catch (error) {
      console.error(`Error updating data pipeline ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a data pipeline
   */
  async deleteDataPipeline(id: number): Promise<void> {
    try {
      await axios.delete(`${API_URL}/pipelines/${id}`);
    } catch (error) {
      console.error(`Error deleting data pipeline ${id}:`, error);
      throw error;
    }
  },

  /**
   * Run a data pipeline
   */
  async runDataPipeline(name: string, params?: Record<string, any>): Promise<{ job_id: string }> {
    try {
      const response = await axios.post(`${API_URL}/pipelines/${name}/run`, params || {});
      return response.data;
    } catch (error) {
      console.error(`Error running data pipeline ${name}:`, error);
      throw error;
    }
  },

  /**
   * Get all data jobs
   */
  async getDataJobs(pipelineName?: string, status?: string): Promise<DataJob[]> {
    try {
      const params: Record<string, any> = {};
      if (pipelineName) params.pipeline_name = pipelineName;
      if (status) params.status = status;

      const response = await axios.get(`${API_URL}/jobs`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching data jobs:', error);
      throw error;
    }
  },

  /**
   * Get a data job by ID
   */
  async getDataJob(jobId: string): Promise<DataJob> {
    try {
      const response = await axios.get(`${API_URL}/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching data job ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Cancel a data job
   */
  async cancelDataJob(jobId: string): Promise<void> {
    try {
      await axios.delete(`${API_URL}/jobs/${jobId}`);
    } catch (error) {
      console.error(`Error cancelling data job ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Get all scheduled jobs
   */
  async getScheduledJobs(dataType?: string, source?: string, status?: string): Promise<ScheduledJob[]> {
    try {
      const params: Record<string, any> = {};
      if (dataType) params.data_type = dataType;
      if (source) params.source = source;
      if (status) params.status = status;

      const response = await axios.get(`${API_URL}/scheduled-jobs`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching scheduled jobs:', error);
      throw error;
    }
  },

  /**
   * Get a scheduled job by ID
   */
  async getScheduledJob(jobId: string): Promise<ScheduledJob> {
    try {
      const response = await axios.get(`${API_URL}/scheduled-jobs/${jobId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching scheduled job ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Create a new scheduled job
   */
  async createScheduledJob(job: {
    data_type: string;
    source: string;
    schedule_type: string;
    schedule_params: Record<string, any>;
    symbols?: string[];
  }): Promise<ScheduledJob> {
    try {
      const response = await axios.post(`${API_URL}/scheduled-jobs`, job);
      return response.data;
    } catch (error) {
      console.error('Error creating scheduled job:', error);
      throw error;
    }
  },

  /**
   * Pause a scheduled job
   */
  async pauseScheduledJob(jobId: string): Promise<void> {
    try {
      await axios.put(`${API_URL}/scheduled-jobs/${jobId}/pause`);
    } catch (error) {
      console.error(`Error pausing scheduled job ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Resume a scheduled job
   */
  async resumeScheduledJob(jobId: string): Promise<void> {
    try {
      await axios.put(`${API_URL}/scheduled-jobs/${jobId}/resume`);
    } catch (error) {
      console.error(`Error resuming scheduled job ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a scheduled job
   */
  async deleteScheduledJob(jobId: string): Promise<void> {
    try {
      await axios.delete(`${API_URL}/scheduled-jobs/${jobId}`);
    } catch (error) {
      console.error(`Error deleting scheduled job ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Get update logs
   */
  async getUpdateLogs(
    jobId?: string,
    dataType?: string,
    source?: string,
    status?: string,
    limit: number = 100
  ): Promise<UpdateLog[]> {
    try {
      const params: Record<string, any> = { limit };
      if (jobId) params.job_id = jobId;
      if (dataType) params.data_type = dataType;
      if (source) params.source = source;
      if (status) params.status = status;

      const response = await axios.get(`${API_URL}/update-logs`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching update logs:', error);
      throw error;
    }
  },

  /**
   * Store market data
   */
  async storeMarketData(request: MarketDataRequest): Promise<{ storage_id: string }> {
    try {
      const response = await axios.post(`${API_URL}/market-data`, request);
      return response.data;
    } catch (error) {
      console.error('Error storing market data:', error);
      throw error;
    }
  },

  /**
   * Get market data
   */
  async getMarketData(
    symbol: string,
    startDate?: string,
    endDate?: string,
    source: string = 'default'
  ): Promise<Record<string, any>[]> {
    try {
      const params: Record<string, any> = { source };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await axios.get(`${API_URL}/market-data/${symbol}`, { params });
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching market data for ${symbol}:`, error);
      throw error;
    }
  },

  /**
   * Store fundamental data
   */
  async storeFundamentalData(request: FundamentalDataRequest): Promise<{ storage_id: string }> {
    try {
      const response = await axios.post(`${API_URL}/fundamental-data`, request);
      return response.data;
    } catch (error) {
      console.error('Error storing fundamental data:', error);
      throw error;
    }
  },

  /**
   * Get fundamental data
   */
  async getFundamentalData(
    symbol: string,
    statementType?: string,
    source: string = 'default'
  ): Promise<Record<string, any>> {
    try {
      const params: Record<string, any> = { source };
      if (statementType) params.statement_type = statementType;

      const response = await axios.get(`${API_URL}/fundamental-data/${symbol}`, { params });
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching fundamental data for ${symbol}:`, error);
      throw error;
    }
  },

  /**
   * Store alternative data
   */
  async storeAlternativeData(request: AlternativeDataRequest): Promise<{ storage_id: string }> {
    try {
      const response = await axios.post(`${API_URL}/alternative-data`, request);
      return response.data;
    } catch (error) {
      console.error('Error storing alternative data:', error);
      throw error;
    }
  },

  /**
   * Get alternative data
   */
  async getAlternativeData(
    dataType: string,
    source: string = 'default',
    filters?: Record<string, any>
  ): Promise<any> {
    try {
      const params: Record<string, any> = { source };
      if (filters) params.filters = filters;

      const response = await axios.get(`${API_URL}/alternative-data/${dataType}`, { params });
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching alternative data for ${dataType}:`, error);
      throw error;
    }
  },

  /**
   * List available data
   */
  async listAvailableData(
    dataType?: string,
    symbol?: string,
    source?: string
  ): Promise<AvailableDataItem[]> {
    try {
      const params: Record<string, any> = {};
      if (dataType) params.data_type = dataType;
      if (symbol) params.symbol = symbol;
      if (source) params.source = source;

      const response = await axios.get(`${API_URL}/available-data`, { params });
      return response.data.data;
    } catch (error) {
      console.error('Error listing available data:', error);
      throw error;
    }
  }
};

export default dataInfrastructureService;