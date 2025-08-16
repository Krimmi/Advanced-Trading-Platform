import { apiRequest } from './api';
import { FinancialEvent } from './eventService';

// Types
export interface EventMetricCorrelation {
  symbol: string;
  event_type: string;
  correlations: Record<string, {
    correlation: number;
    p_value: number;
    significant: boolean;
    sample_size: number;
  }>;
}

export interface EventImpactByMetric {
  symbol: string;
  event_type: string;
  metric: string;
  window_days: number;
  quartile_results: Record<string, {
    avg_price_change: number;
    median_price_change: number;
    positive_count: number;
    negative_count: number;
    total_count: number;
    events: Array<{
      event_id: string;
      event_type: string;
      date: string;
      metric_value: number;
      price_change: number;
    }>;
  }>;
}

export interface EventPrediction {
  symbol: string;
  event_type: string;
  metrics: string[];
  model_accuracy: {
    mean: number;
    std: number;
    scores: number[];
  };
  feature_importance: Record<string, number>;
  sample_size: number;
  positive_outcome_ratio: number;
  next_event_prediction: {
    outcome: string | null;
    probability: number | null;
    latest_metrics: Record<string, number>;
  };
}

export interface EventCluster {
  cluster_id: number;
  start_date: string;
  end_date: string;
  duration_days: number;
  num_events: number;
  event_types: string[];
  event_type_counts: Record<string, number>;
  cluster_return: number;
  cluster_volatility: number | null;
  volume_change: number | null;
  post_cluster_returns: Record<string, number>;
}

export interface EventClusterAnalysis {
  clusters: EventCluster[];
  statistics: {
    total_clusters: number;
    avg_duration_days?: number;
    avg_events_per_cluster?: number;
    avg_cluster_return?: number;
    positive_clusters?: number;
    negative_clusters?: number;
    positive_ratio?: number;
    post_cluster_returns?: Record<string, {
      avg_return: number;
      positive_count: number;
      negative_count: number;
      positive_ratio: number;
    }>;
    top_event_combinations?: Array<{
      types: string[];
      count: number;
    }>;
  };
}

// Correlation Analysis service
const correlationAnalysisService = {
  // Analyze correlation between events and metrics
  analyzeEventMetricCorrelation: (
    symbol: string,
    event_type: string,
    metrics: string[],
    window_days?: number,
    lookback_days?: number
  ) => {
    return apiRequest<EventMetricCorrelation>({
      method: 'GET',
      url: `/api/correlation/event-metric-correlation/${symbol}`,
      params: {
        event_type,
        metrics: metrics.join(','),
        window_days,
        lookback_days,
      },
    });
  },

  // Analyze event impact by metric
  analyzeEventImpactByMetric: (
    symbol: string,
    event_type: string,
    metric: string,
    window_days?: number,
    lookback_days?: number
  ) => {
    return apiRequest<EventImpactByMetric>({
      method: 'GET',
      url: `/api/correlation/event-impact-by-metric/${symbol}`,
      params: {
        event_type,
        metric,
        window_days,
        lookback_days,
      },
    });
  },

  // Predict event outcome
  predictEventOutcome: (
    symbol: string,
    event_type: string,
    metrics: string[],
    window_days?: number,
    lookback_days?: number
  ) => {
    return apiRequest<EventPrediction>({
      method: 'GET',
      url: `/api/correlation/event-prediction/${symbol}`,
      params: {
        event_type,
        metrics: metrics.join(','),
        window_days,
        lookback_days,
      },
    });
  },

  // Analyze event clusters
  analyzeEventClusters: (
    symbol: string,
    max_days_between?: number,
    lookback_days?: number
  ) => {
    return apiRequest<EventClusterAnalysis>({
      method: 'GET',
      url: `/api/correlation/event-clusters/${symbol}`,
      params: {
        max_days_between,
        lookback_days,
      },
    });
  },
};

export default correlationAnalysisService;