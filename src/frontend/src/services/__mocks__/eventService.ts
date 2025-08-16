// Mock implementation of eventService

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

// Mock data
const mockEvents: FinancialEvent[] = [
  {
    id: 'event1',
    event_type: 'earnings',
    date: '2023-01-15',
    symbol: 'AAPL',
    description: 'Q1 2023 Earnings',
    source: 'Company Report',
    impact_score: 0.75,
    metadata: { eps: 1.52, eps_estimate: 1.43 }
  },
  {
    id: 'event2',
    event_type: 'dividend',
    date: '2023-02-10',
    symbol: 'AAPL',
    description: 'Quarterly Dividend',
    source: 'Company Report',
    impact_score: 0.3,
    metadata: { dividend: 0.23 }
  },
  {
    id: 'event3',
    event_type: 'product_launch',
    date: '2023-03-08',
    symbol: 'AAPL',
    description: 'New Product Announcement',
    source: 'Press Release',
    impact_score: 0.6,
    metadata: { product: 'iPhone SE 3' }
  },
  {
    id: 'event4',
    event_type: 'analyst_rating',
    date: '2023-04-05',
    symbol: 'AAPL',
    description: 'Analyst Upgrade',
    source: 'Morgan Stanley',
    impact_score: 0.4,
    metadata: { old_rating: 'Hold', new_rating: 'Buy', target_price: 180 }
  }
];

const mockImpactAnalysis: EventImpactAnalysis = {
  earnings: {
    count: 10,
    avg_price_change: 2.5,
    median_price_change: 1.8,
    std_dev: 3.2,
    positive_count: 7,
    negative_count: 3
  },
  dividend: {
    count: 8,
    avg_price_change: 0.8,
    median_price_change: 0.5,
    std_dev: 1.2,
    positive_count: 5,
    negative_count: 3
  },
  product_launch: {
    count: 6,
    avg_price_change: 3.2,
    median_price_change: 2.9,
    std_dev: 2.8,
    positive_count: 5,
    negative_count: 1
  }
};

const mockMetricCorrelation: Record<string, EventMetricCorrelation> = {
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
};

// Mock service
const eventService = {
  getEarningsEvents: jest.fn().mockResolvedValue(mockEvents.filter(e => e.event_type === 'earnings')),
  
  getDividendEvents: jest.fn().mockResolvedValue(mockEvents.filter(e => e.event_type === 'dividend')),
  
  getNewsEvents: jest.fn().mockResolvedValue([]),
  
  getTechnicalEvents: jest.fn().mockResolvedValue([]),
  
  getAllEvents: jest.fn().mockResolvedValue(mockEvents),
  
  filterEvents: jest.fn().mockImplementation((symbol, params) => {
    let filteredEvents = mockEvents.filter(e => e.symbol === symbol);
    
    if (params?.event_types) {
      filteredEvents = filteredEvents.filter(e => params.event_types.includes(e.event_type));
    }
    
    if (params?.start_date) {
      filteredEvents = filteredEvents.filter(e => new Date(e.date) >= new Date(params.start_date));
    }
    
    if (params?.end_date) {
      filteredEvents = filteredEvents.filter(e => new Date(e.date) <= new Date(params.end_date));
    }
    
    if (params?.min_impact_score) {
      filteredEvents = filteredEvents.filter(e => e.impact_score !== null && e.impact_score >= params.min_impact_score);
    }
    
    return Promise.resolve(filteredEvents);
  }),
  
  analyzeEventImpact: jest.fn().mockImplementation((symbol, event_type) => {
    if (mockImpactAnalysis[event_type]) {
      return Promise.resolve({ [event_type]: mockImpactAnalysis[event_type] });
    }
    return Promise.resolve({});
  }),
  
  analyzeEventMetricCorrelation: jest.fn().mockResolvedValue(mockMetricCorrelation),
  
  analyzeEventImpactByMetric: jest.fn().mockResolvedValue({
    symbol: 'AAPL',
    event_type: 'earnings',
    metric: 'eps_surprise',
    quartile_results: {
      q1: {
        avg_price_change: -1.2,
        median_price_change: -1.0,
        positive_count: 1,
        negative_count: 5,
        total_count: 6
      },
      q2: {
        avg_price_change: 0.5,
        median_price_change: 0.4,
        positive_count: 4,
        negative_count: 2,
        total_count: 6
      },
      q3: {
        avg_price_change: 2.1,
        median_price_change: 1.8,
        positive_count: 5,
        negative_count: 1,
        total_count: 6
      },
      q4: {
        avg_price_change: 4.8,
        median_price_change: 4.5,
        positive_count: 6,
        negative_count: 0,
        total_count: 6
      }
    }
  }),
  
  predictEventOutcome: jest.fn().mockResolvedValue({
    symbol: 'AAPL',
    event_type: 'earnings',
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
      probability: 0.72
    }
  }),
  
  analyzeEventClusters: jest.fn().mockResolvedValue({
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
      }
    ],
    statistics: {
      total_clusters: 1,
      avg_duration_days: 10,
      avg_events_per_cluster: 3,
      avg_cluster_return: 3.5
    }
  })
};

export default eventService;