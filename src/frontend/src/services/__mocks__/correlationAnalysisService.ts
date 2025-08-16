// Mock implementation of correlationAnalysisService
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

// Mock data
const mockEventMetricCorrelation: EventMetricCorrelation = {
  symbol: 'AAPL',
  event_type: 'earnings',
  correlations: {
    price_change: {
      correlation: 0.65,
      p_value: 0.008,
      significant: true,
      sample_size: 24
    },
    volume_change: {
      correlation: 0.42,
      p_value: 0.04,
      significant: true,
      sample_size: 24
    },
    volatility_change: {
      correlation: 0.28,
      p_value: 0.18,
      significant: false,
      sample_size: 24
    }
  }
};

const mockEventImpactByMetric: EventImpactByMetric = {
  symbol: 'AAPL',
  event_type: 'earnings',
  metric: 'eps_surprise',
  window_days: 1,
  quartile_results: {
    q1: {
      avg_price_change: -1.2,
      median_price_change: -1.0,
      positive_count: 1,
      negative_count: 5,
      total_count: 6,
      events: [
        {
          event_id: 'event1',
          event_type: 'earnings',
          date: '2021-01-27',
          metric_value: -0.05,
          price_change: -2.1
        }
      ]
    },
    q2: {
      avg_price_change: 0.5,
      median_price_change: 0.4,
      positive_count: 4,
      negative_count: 2,
      total_count: 6,
      events: [
        {
          event_id: 'event2',
          event_type: 'earnings',
          date: '2021-04-28',
          metric_value: 0.02,
          price_change: 0.5
        }
      ]
    },
    q3: {
      avg_price_change: 2.1,
      median_price_change: 1.8,
      positive_count: 5,
      negative_count: 1,
      total_count: 6,
      events: [
        {
          event_id: 'event3',
          event_type: 'earnings',
          date: '2021-07-27',
          metric_value: 0.08,
          price_change: 2.3
        }
      ]
    },
    q4: {
      avg_price_change: 4.8,
      median_price_change: 4.5,
      positive_count: 6,
      negative_count: 0,
      total_count: 6,
      events: [
        {
          event_id: 'event4',
          event_type: 'earnings',
          date: '2021-10-28',
          metric_value: 0.15,
          price_change: 5.2
        }
      ]
    }
  }
};

const mockEventPrediction: EventPrediction = {
  symbol: 'AAPL',
  event_type: 'earnings',
  metrics: ['eps_surprise', 'revenue_surprise', 'guidance'],
  model_accuracy: {
    mean: 0.78,
    std: 0.05,
    scores: [0.75, 0.79, 0.80, 0.78]
  },
  feature_importance: {
    eps_surprise: 0.45,
    revenue_surprise: 0.30,
    guidance: 0.15,
    market_sentiment: 0.10
  },
  sample_size: 24,
  positive_outcome_ratio: 0.67,
  next_event_prediction: {
    outcome: 'positive',
    probability: 0.72,
    latest_metrics: {
      eps_surprise: 0.08,
      revenue_surprise: 0.05,
      guidance: 1
    }
  }
};

const mockEventClusterAnalysis: EventClusterAnalysis = {
  clusters: [
    {
      cluster_id: 1,
      start_date: '2023-01-10',
      end_date: '2023-01-20',
      duration_days: 10,
      num_events: 3,
      event_types: ['earnings', 'analyst_rating', 'news'],
      event_type_counts: { earnings: 1, analyst_rating: 1, news: 1 },
      cluster_return: 3.5,
      cluster_volatility: 1.8,
      volume_change: 1.4,
      post_cluster_returns: { '1d': 0.5, '5d': 1.2, '10d': 2.1 }
    },
    {
      cluster_id: 2,
      start_date: '2023-04-05',
      end_date: '2023-04-12',
      duration_days: 7,
      num_events: 2,
      event_types: ['product_launch', 'news'],
      event_type_counts: { product_launch: 1, news: 1 },
      cluster_return: 2.1,
      cluster_volatility: 1.2,
      volume_change: 1.1,
      post_cluster_returns: { '1d': 0.2, '5d': 0.8, '10d': 1.5 }
    }
  ],
  statistics: {
    total_clusters: 2,
    avg_duration_days: 8.5,
    avg_events_per_cluster: 2.5,
    avg_cluster_return: 2.8,
    positive_clusters: 2,
    negative_clusters: 0,
    positive_ratio: 1.0,
    post_cluster_returns: {
      '1d': {
        avg_return: 0.35,
        positive_count: 2,
        negative_count: 0,
        positive_ratio: 1.0
      },
      '5d': {
        avg_return: 1.0,
        positive_count: 2,
        negative_count: 0,
        positive_ratio: 1.0
      },
      '10d': {
        avg_return: 1.8,
        positive_count: 2,
        negative_count: 0,
        positive_ratio: 1.0
      }
    },
    top_event_combinations: [
      {
        types: ['earnings', 'analyst_rating', 'news'],
        count: 1
      },
      {
        types: ['product_launch', 'news'],
        count: 1
      }
    ]
  }
};

// Mock event-fundamental correlation data
const mockEventFundamentalCorrelation = {
  eventType: 'earnings',
  fundamentalMetric: 'revenue_growth',
  correlationCoefficient: 0.78,
  pValue: 0.001,
  dataPoints: [
    {
      eventDate: '2022-01-15',
      eventId: 'event1',
      eventValue: 1.2,
      metricValue: 0.15,
      metricDate: '2022-01-31'
    },
    {
      eventDate: '2022-04-15',
      eventId: 'event2',
      eventValue: 1.5,
      metricValue: 0.18,
      metricDate: '2022-04-30'
    },
    {
      eventDate: '2022-07-15',
      eventId: 'event3',
      eventValue: 1.8,
      metricValue: 0.22,
      metricDate: '2022-07-31'
    },
    {
      eventDate: '2022-10-15',
      eventId: 'event4',
      eventValue: 1.7,
      metricValue: 0.20,
      metricDate: '2022-10-31'
    }
  ],
  regressionLine: [
    { x: 1.2, y: 0.14 },
    { x: 1.8, y: 0.23 }
  ]
};

// Mock top event-fundamental correlations
const mockTopEventFundamentalCorrelations = [
  {
    eventType: 'earnings',
    fundamentalMetric: 'revenue_growth',
    correlationCoefficient: 0.78,
    pValue: 0.001,
    significant: true,
    sampleSize: 24
  },
  {
    eventType: 'dividend',
    fundamentalMetric: 'eps_growth',
    correlationCoefficient: -0.65,
    pValue: 0.008,
    significant: true,
    sampleSize: 18
  },
  {
    eventType: 'product_launch',
    fundamentalMetric: 'gross_profit_margin',
    correlationCoefficient: 0.42,
    pValue: 0.04,
    significant: true,
    sampleSize: 12
  }
];

// Mock service
const correlationAnalysisService = {
  analyzeEventMetricCorrelation: jest.fn().mockResolvedValue(mockEventMetricCorrelation),
  
  analyzeEventImpactByMetric: jest.fn().mockResolvedValue(mockEventImpactByMetric),
  
  predictEventOutcome: jest.fn().mockResolvedValue(mockEventPrediction),
  
  analyzeEventClusters: jest.fn().mockResolvedValue(mockEventClusterAnalysis),
  
  getEventFundamentalCorrelation: jest.fn().mockImplementation((symbol, eventType, fundamentalMetric, timeframe) => {
    // Return different correlation data based on parameters
    if (eventType === 'dividend') {
      return Promise.resolve({
        ...mockEventFundamentalCorrelation,
        eventType: 'dividend',
        fundamentalMetric,
        correlationCoefficient: 0.45
      });
    } else if (fundamentalMetric === 'eps_growth') {
      return Promise.resolve({
        ...mockEventFundamentalCorrelation,
        eventType,
        fundamentalMetric: 'eps_growth',
        correlationCoefficient: 0.62
      });
    } else if (timeframe === '3y') {
      return Promise.resolve({
        ...mockEventFundamentalCorrelation,
        eventType,
        fundamentalMetric,
        correlationCoefficient: 0.71
      });
    } else if (eventType === 'product_launch' && fundamentalMetric === 'gross_profit_margin') {
      return Promise.resolve({
        ...mockEventFundamentalCorrelation,
        eventType: 'product_launch',
        fundamentalMetric: 'gross_profit_margin',
        correlationCoefficient: 0.42
      });
    }
    
    return Promise.resolve(mockEventFundamentalCorrelation);
  }),
  
  getTopEventFundamentalCorrelations: jest.fn().mockResolvedValue(mockTopEventFundamentalCorrelations)
};

export default correlationAnalysisService;