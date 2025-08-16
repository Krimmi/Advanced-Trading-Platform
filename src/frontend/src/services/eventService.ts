import { apiRequest } from './api';

// Types
export interface FinancialEvent {
  id: string;
  event_type: string;
  date: string;
  symbol: string;
  description: string;
  source: string;
  impact_score: number | null;
  metadata: Record<string, any>;
}

export interface EventImpactAnalysis {
  [event_type: string]: {
    count: number;
    avg_price_change: number;
    median_price_change: number;
    std_dev: number;
    positive_count: number;
    negative_count: number;
  };
}

export interface EventMetricCorrelation {
  correlation: number;
  p_value: number;
  significant: boolean;
  sample_size: number;
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

// Event service
const eventService = {
  // Get earnings events
  getEarningsEvents: (symbol: string, limit?: number) => {
    return apiRequest<FinancialEvent[]>({
      method: 'GET',
      url: `/api/events/earnings-events/${symbol}`,
      params: { limit },
    });
  },

  // Get dividend events
  getDividendEvents: (symbol: string, limit?: number) => {
    return apiRequest<FinancialEvent[]>({
      method: 'GET',
      url: `/api/events/dividend-events/${symbol}`,
      params: { limit },
    });
  },

  // Get news events
  getNewsEvents: (symbol: string, limit?: number) => {
    return apiRequest<FinancialEvent[]>({
      method: 'GET',
      url: `/api/events/news-events/${symbol}`,
      params: { limit },
    });
  },

  // Get technical events
  getTechnicalEvents: (symbol: string, days?: number) => {
    return apiRequest<FinancialEvent[]>({
      method: 'GET',
      url: `/api/events/technical-events/${symbol}`,
      params: { days },
    });
  },

  // Get all events
  getAllEvents: (
    symbol: string,
    days?: number,
    event_types?: string[]
  ) => {
    return apiRequest<FinancialEvent[]>({
      method: 'GET',
      url: `/api/events/all-events/${symbol}`,
      params: { days, event_types },
    });
  },

  // Filter events
  filterEvents: (
    symbol: string,
    params?: {
      start_date?: string;
      end_date?: string;
      event_types?: string[];
      min_impact_score?: number;
    }
  ) => {
    return apiRequest<FinancialEvent[]>({
      method: 'GET',
      url: `/api/events/filter-events/${symbol}`,
      params,
    });
  },

  // Analyze event impact
  analyzeEventImpact: (
    symbol: string,
    event_type: string,
    window_days?: number,
    days?: number
  ) => {
    return apiRequest<EventImpactAnalysis>({
      method: 'GET',
      url: `/api/events/event-impact/${symbol}`,
      params: { event_type, window_days, days },
    });
  },

  // Analyze event-metric correlation
  analyzeEventMetricCorrelation: (
    symbol: string,
    event_type: string,
    metrics: string[],
    window_days?: number,
    lookback_days?: number
  ) => {
    return apiRequest<Record<string, EventMetricCorrelation>>({
      method: 'GET',
      url: `/api/correlation/event-metric-correlation/${symbol}`,
      params: { event_type, metrics, window_days, lookback_days },
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
    return apiRequest<any>({
      method: 'GET',
      url: `/api/correlation/event-impact-by-metric/${symbol}`,
      params: { event_type, metric, window_days, lookback_days },
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
    return apiRequest<any>({
      method: 'GET',
      url: `/api/correlation/event-prediction/${symbol}`,
      params: { event_type, metrics, window_days, lookback_days },
    });
  },

  // Analyze event clusters
  analyzeEventClusters: (
    symbol: string,
    max_days_between?: number,
    lookback_days?: number
  ) => {
    return apiRequest<{ clusters: EventCluster[]; statistics: any }>({
      method: 'GET',
      url: `/api/correlation/event-clusters/${symbol}`,
      params: { max_days_between, lookback_days },
    });
  },
};

export default eventService;