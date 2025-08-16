# Event-Driven & Fundamental Analysis Implementation Summary

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Component Implementation](#component-implementation)
4. [Service Implementation](#service-implementation)
5. [API Integration](#api-integration)
6. [Data Flow](#data-flow)
7. [Key Features](#key-features)
8. [Technical Highlights](#technical-highlights)
9. [Dependencies](#dependencies)
10. [Future Enhancements](#future-enhancements)

---

## Overview

The Event-Driven & Fundamental Analysis feature provides a comprehensive suite of tools for analyzing financial events and their impact on stock performance, as well as detailed fundamental analysis capabilities. This implementation summary documents the components, services, and integrations that have been developed to deliver this feature.

### Feature Scope

The implemented feature includes:

1. **Event Dashboard**: A comprehensive dashboard for visualizing and analyzing financial events
2. **Fundamental Analysis Dashboard**: Tools for analyzing company financials, ratios, and valuations
3. **Integration Components**: Features that combine event and fundamental analysis for deeper insights

### Business Value

This feature delivers significant value to users by:

1. Providing visibility into how financial events impact stock prices
2. Enabling detailed fundamental analysis of companies
3. Uncovering correlations between events and fundamental metrics
4. Supporting event-driven investment strategies
5. Facilitating comparison between companies and their peers

---

## Architecture

The Event-Driven & Fundamental Analysis feature follows a modular architecture with clear separation of concerns:

### Frontend Architecture

```
src/
├── components/
│   ├── EventDashboard/
│   │   ├── EventDashboard.tsx
│   │   ├── EventTimeline.tsx
│   │   ├── EventFilterPanel.tsx
│   │   ├── EventDetailPanel.tsx
│   │   ├── EventImpactChart.tsx
│   │   ├── EventMetricCorrelation.tsx
│   │   ├── EventFundamentalCorrelation.tsx
│   │   ├── EventBasedBacktesting.tsx
│   │   └── EventDrivenStrategyBuilder.tsx
│   ├── FundamentalAnalysis/
│   │   ├── FundamentalAnalysisDashboard.tsx
│   │   ├── FinancialRatioVisualization.tsx
│   │   ├── ValuationModelVisualization.tsx
│   │   ├── FinancialStatementAnalysis.tsx
│   │   ├── CompanyComparison.tsx
│   │   └── GrowthAnalysis.tsx
├── services/
│   ├── eventService.ts
│   ├── financialAnalysisService.ts
│   ├── valuationService.ts
│   └── correlationAnalysisService.ts
├── types/
│   ├── eventTypes.ts
│   ├── financialTypes.ts
│   ├── valuationTypes.ts
│   └── correlationTypes.ts
└── utils/
    ├── formatters.ts
    ├── calculators.ts
    ├── chartHelpers.ts
    └── dateUtils.ts
```

### Backend Architecture

The frontend components integrate with backend services through RESTful APIs:

```
api/
├── events/
│   ├── all-events/{symbol}
│   ├── earnings-events/{symbol}
│   ├── dividend-events/{symbol}
│   ├── filter-events/{symbol}
│   └── event-impact/{symbol}
├── financial-analysis/
│   ├── company-profile/{symbol}
│   ├── financial-ratios/{symbol}
│   ├── income-statement-analysis/{symbol}
│   ├── balance-sheet-analysis/{symbol}
│   ├── cash-flow-analysis/{symbol}
│   └── peer-comparison
├── valuation/
│   ├── dcf/{symbol}
│   ├── comparable-company-analysis/{symbol}
│   ├── consensus-valuation/{symbol}
│   └── peer-valuation-metrics/{symbol}
└── correlation/
    ├── event-metric-correlation/{symbol}
    ├── event-impact-by-metric/{symbol}
    ├── event-prediction/{symbol}
    ├── event-clusters/{symbol}
    └── event-fundamental-correlation/{symbol}
```

### Design Patterns

The implementation uses several design patterns:

1. **Container/Presentational Pattern**: Separating data fetching and state management from presentation
2. **Provider Pattern**: Using context providers for shared state
3. **Custom Hook Pattern**: Encapsulating reusable logic in custom hooks
4. **Service Pattern**: Abstracting API calls into service modules
5. **Adapter Pattern**: Converting API data to component-friendly formats

---

## Component Implementation

### Event Dashboard Components

#### EventDashboard.tsx

The main container component for the Event Dashboard that:
- Manages the overall state of the dashboard
- Handles tab switching between different views
- Fetches event data using eventService
- Passes data and callbacks to child components

```typescript
// Key features
const [events, setEvents] = useState<FinancialEvent[]>([]);
const [filteredEvents, setFilteredEvents] = useState<FinancialEvent[]>([]);
const [selectedEvent, setSelectedEvent] = useState<FinancialEvent | null>(null);
const [tabValue, setTabValue] = useState<number>(0);

// Fetch events when symbol changes
useEffect(() => {
  if (symbol) {
    fetchEvents();
  }
}, [symbol]);

// Handle event selection
const handleEventSelect = (event: FinancialEvent) => {
  setSelectedEvent(event);
  if (tabValue === 0) {
    setTabValue(2); // Switch to event details tab
  }
};
```

#### EventTimeline.tsx

A visualization component that:
- Displays events in a chronological timeline
- Shows event type indicators and impact scores
- Handles event selection
- Formats event dates and metadata

```typescript
// Key features
const sortedEvents = useMemo(() => {
  return [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}, [events]);

// Event selection handler
const handleEventClick = (event: FinancialEvent) => {
  onEventSelect(event);
};
```

#### EventFilterPanel.tsx

A control panel component that:
- Provides filters for event types, date ranges, and impact scores
- Updates the filtered events list based on user selections
- Handles filter reset

```typescript
// Key features
const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
const [minImpactScore, setMinImpactScore] = useState<number | null>(null);

// Apply filters
useEffect(() => {
  const filtered = events.filter(event => {
    // Apply event type filter
    if (selectedEventTypes.length > 0 && !selectedEventTypes.includes(event.event_type)) {
      return false;
    }
    
    // Apply date range filter
    if (dateRange[0] && new Date(event.date) < dateRange[0]) {
      return false;
    }
    
    if (dateRange[1] && new Date(event.date) > dateRange[1]) {
      return false;
    }
    
    // Apply impact score filter
    if (minImpactScore !== null && (event.impact_score === null || event.impact_score < minImpactScore)) {
      return false;
    }
    
    return true;
  });
  
  onFilterChange(filtered);
}, [events, selectedEventTypes, dateRange, minImpactScore]);
```

#### EventDetailPanel.tsx

A detail view component that:
- Displays comprehensive information about a selected event
- Shows price impact charts
- Displays related news and social media sentiment
- Formats event metadata based on event type

```typescript
// Key features
const renderEventMetadata = () => {
  if (!event || !event.metadata) return null;
  
  switch (event.event_type) {
    case 'earnings':
      return (
        <Box>
          <Typography variant="subtitle2">EPS: {event.metadata.eps}</Typography>
          <Typography variant="subtitle2">EPS Estimate: {event.metadata.eps_estimate}</Typography>
          <Typography variant="subtitle2">Surprise: {((event.metadata.eps / event.metadata.eps_estimate - 1) * 100).toFixed(2)}%</Typography>
        </Box>
      );
    case 'dividend':
      return (
        <Box>
          <Typography variant="subtitle2">Dividend: ${event.metadata.dividend}</Typography>
          <Typography variant="subtitle2">Ex-Date: {formatDate(event.metadata.ex_date)}</Typography>
          <Typography variant="subtitle2">Payment Date: {formatDate(event.metadata.payment_date)}</Typography>
        </Box>
      );
    // Other event types...
  }
};
```

#### EventImpactChart.tsx

A visualization component that:
- Displays the impact of events on stock prices
- Shows statistical measures (average, median, standard deviation)
- Visualizes positive vs. negative outcomes
- Provides interactive tooltips with detailed information

```typescript
// Key features
const renderImpactChart = () => {
  if (!impactAnalysis) return null;
  
  const eventType = Object.keys(impactAnalysis)[0];
  const data = impactAnalysis[eventType];
  
  const chartData = [
    { name: 'Average', value: data.avg_price_change },
    { name: 'Median', value: data.median_price_change }
  ];
  
  return (
    <Box sx={{ height: 400 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis label={{ value: 'Price Change (%)', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1">Statistics:</Typography>
        <Typography>Count: {data.count}</Typography>
        <Typography>Standard Deviation: {data.std_dev.toFixed(2)}%</Typography>
        <Typography>Positive Outcomes: {data.positive_count} ({(data.positive_count / data.count * 100).toFixed(2)}%)</Typography>
        <Typography>Negative Outcomes: {data.negative_count} ({(data.negative_count / data.count * 100).toFixed(2)}%)</Typography>
      </Box>
    </Box>
  );
};
```

#### EventMetricCorrelation.tsx

An analysis component that:
- Analyzes correlations between events and market metrics
- Displays correlation coefficients and statistical significance
- Visualizes correlations using scatter plots and heat maps
- Allows selection of different metrics and time windows

```typescript
// Key features
const [selectedEventType, setSelectedEventType] = useState<string>('earnings');
const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['price_change', 'volume_change']);
const [windowDays, setWindowDays] = useState<number>(1);
const [correlationData, setCorrelationData] = useState<Record<string, EventMetricCorrelation> | null>(null);

// Fetch correlation data
useEffect(() => {
  if (symbol && selectedEventType && selectedMetrics.length > 0) {
    fetchCorrelationData();
  }
}, [symbol, selectedEventType, selectedMetrics, windowDays]);

const fetchCorrelationData = async () => {
  setLoading(true);
  try {
    const data = await eventService.analyzeEventMetricCorrelation(
      symbol,
      selectedEventType,
      selectedMetrics,
      windowDays
    );
    setCorrelationData(data);
  } catch (error) {
    console.error('Error fetching correlation data:', error);
    setError('Failed to fetch correlation data');
  } finally {
    setLoading(false);
  }
};
```

### Fundamental Analysis Dashboard Components

#### FundamentalAnalysisDashboard.tsx

The main container component for the Fundamental Analysis Dashboard that:
- Manages the overall state of the dashboard
- Handles tab switching between different views
- Fetches company data using financialAnalysisService and valuationService
- Passes data and callbacks to child components

```typescript
// Key features
const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
const [tabValue, setTabValue] = useState<number>(0);
const [financialRatios, setFinancialRatios] = useState<any>(null);
const [valuationData, setValuationData] = useState<any>(null);
const [peerSymbols, setPeerSymbols] = useState<string[]>([]);

// Fetch company data
useEffect(() => {
  if (symbol) {
    fetchCompanyData();
  }
}, [symbol]);

const fetchCompanyData = async () => {
  setLoading(true);
  try {
    // Fetch company profile
    const profile = await financialAnalysisService.getCompanyProfile(symbol as string);
    setCompanyProfile(profile);

    // Fetch financial ratios
    const ratios = await financialAnalysisService.getFinancialRatios(symbol as string);
    setFinancialRatios(ratios);

    // Fetch valuation data
    const valuation = await valuationService.getValuationSummary(symbol as string);
    setValuationData(valuation);

    // Fetch peer companies
    const peers = await financialAnalysisService.getPeerCompanies(symbol as string);
    setPeerSymbols(peers);
  } catch (error) {
    console.error('Error fetching company data:', error);
  } finally {
    setLoading(false);
  }
};
```

#### FinancialRatioVisualization.tsx

A visualization component that:
- Displays financial ratios by category
- Shows historical trends for each ratio
- Compares ratios to industry averages
- Provides explanations and health indicators for each ratio

```typescript
// Key features
const renderRatioCategory = (category: string, ratios: Record<string, number | null>) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>{formatCategoryName(category)} Ratios</Typography>
      <Grid container spacing={2}>
        {Object.entries(ratios).map(([key, value]) => (
          <Grid item xs={12} sm={6} md={4} key={key}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1">{formatRatioName(key)}</Typography>
              <Typography variant="h5">{formatRatioValue(key, value)}</Typography>
              {previousRatios && (
                <Typography variant="body2" color={getChangeColor(value, previousRatios[category]?.[key])}>
                  {formatChange(value, previousRatios[category]?.[key])}
                </Typography>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
```

#### ValuationModelVisualization.tsx

A visualization component that:
- Displays different valuation models (DCF, comparable company analysis, analyst consensus)
- Shows valuation results and underlying assumptions
- Allows parameter adjustments to see impact on valuations
- Provides a consensus view combining multiple valuation methods

```typescript
// Key features
const [activeModel, setActiveModel] = useState<string>('dcf');

const renderDCFModel = () => {
  if (!valuationData?.dcf) {
    return <Typography>DCF model data not available</Typography>;
  }
  
  const { dcf } = valuationData;
  
  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>DCF Valuation Results</Typography>
            <Typography variant="subtitle1">DCF Share Price: ${dcf.share_price.toFixed(2)}</Typography>
            <Typography variant="subtitle1">Equity Value: ${formatLargeNumber(dcf.equity_value)}</Typography>
            <Typography variant="subtitle1">Enterprise Value: ${formatLargeNumber(dcf.enterprise_value)}</Typography>
            <Typography variant="subtitle1">Discount Rate: {(dcf.discount_rate * 100).toFixed(1)}%</Typography>
            <Typography variant="subtitle1">Terminal Growth Rate: {(dcf.terminal_growth_rate * 100).toFixed(1)}%</Typography>
            <Typography variant="subtitle1">Forecast Period: {dcf.forecast_period} years</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Forecasted Cash Flows</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dcf.forecasted_cash_flows.map((value, index) => ({ year: `Year ${index + 1}`, value }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value) => `$${formatLargeNumber(value as number)}`} />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
```

#### FinancialStatementAnalysis.tsx

An analysis component that:
- Displays income statements, balance sheets, and cash flow statements
- Shows trend analysis for key line items
- Provides common-size analysis for easier comparison
- Calculates growth rates for key metrics

```typescript
// Key features
const [statementType, setStatementType] = useState<'income' | 'balance' | 'cash_flow'>('income');
const [periodType, setPeriodType] = useState<'annual' | 'quarter'>('annual');
const [viewType, setViewType] = useState<'absolute' | 'common_size'>('absolute');
const [statements, setStatements] = useState<any[]>([]);

// Fetch statement data
useEffect(() => {
  if (symbol) {
    fetchStatementData();
  }
}, [symbol, statementType, periodType]);

const fetchStatementData = async () => {
  setLoading(true);
  try {
    let data;
    switch (statementType) {
      case 'income':
        data = await financialAnalysisService.getIncomeStatements(symbol, { period: periodType, limit: 5 });
        break;
      case 'balance':
        data = await financialAnalysisService.getBalanceSheets(symbol, { period: periodType, limit: 5 });
        break;
      case 'cash_flow':
        data = await financialAnalysisService.getCashFlowStatements(symbol, { period: periodType, limit: 5 });
        break;
    }
    setStatements(data);
  } catch (error) {
    console.error('Error fetching statement data:', error);
    setError('Failed to fetch statement data');
  } finally {
    setLoading(false);
  }
};
```

#### CompanyComparison.tsx

A comparison component that:
- Compares the selected company against its peers
- Shows comparison across various financial metrics
- Visualizes comparisons using bar charts and radar charts
- Calculates percentile rankings among peers

```typescript
// Key features
const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
  'pe_ratio', 'ps_ratio', 'pb_ratio', 'ev_ebitda', 'gross_margin', 'operating_margin'
]);
const [comparisonData, setComparisonData] = useState<any>(null);

// Fetch comparison data
useEffect(() => {
  if (mainSymbol && peerSymbols.length > 0 && selectedMetrics.length > 0) {
    fetchComparisonData();
  }
}, [mainSymbol, peerSymbols, selectedMetrics]);

const fetchComparisonData = async () => {
  setLoading(true);
  try {
    const data = await financialAnalysisService.getPeerComparison(
      mainSymbol,
      peerSymbols,
      selectedMetrics
    );
    setComparisonData(data);
  } catch (error) {
    console.error('Error fetching comparison data:', error);
    setError('Failed to fetch comparison data');
  } finally {
    setLoading(false);
  }
};
```

#### GrowthAnalysis.tsx

An analysis component that:
- Analyzes historical growth rates for key financial metrics
- Calculates compound annual growth rates (CAGR)
- Visualizes growth trends over time
- Provides growth stability analysis

```typescript
// Key features
const [growthData, setGrowthData] = useState<any>(null);
const [periodType, setPeriodType] = useState<'annual' | 'quarter'>('annual');

// Fetch growth data
useEffect(() => {
  if (symbol) {
    fetchGrowthData();
  }
}, [symbol, periodType]);

const fetchGrowthData = async () => {
  setLoading(true);
  try {
    const data = await financialAnalysisService.getGrowthAnalysis(symbol, { period: periodType });
    setGrowthData(data);
  } catch (error) {
    console.error('Error fetching growth data:', error);
    setError('Failed to fetch growth data');
  } finally {
    setLoading(false);
  }
};
```

### Integration Components

#### EventFundamentalCorrelation.tsx

An analysis component that:
- Analyzes correlations between financial events and fundamental metrics
- Displays correlation coefficients and statistical significance
- Visualizes correlations using scatter plots and time series charts
- Provides interpretation of correlation results

```typescript
// Key features
const [selectedEventType, setSelectedEventType] = useState<string>('earnings');
const [selectedMetric, setSelectedMetric] = useState<string>('revenue_growth');
const [timeframe, setTimeframe] = useState<string>('1y');
const [correlationData, setCorrelationData] = useState<CorrelationData | null>(null);
const [topCorrelations, setTopCorrelations] = useState<any[]>([]);

// Fetch top correlations
useEffect(() => {
  fetchTopCorrelations();
}, [symbol]);

// Fetch correlation data when selections change
useEffect(() => {
  if (selectedEventType && selectedMetric) {
    fetchCorrelationData();
  }
}, [selectedEventType, selectedMetric, timeframe]);

const fetchCorrelationData = async () => {
  setLoading(true);
  setError(null);
  try {
    const data = await correlationAnalysisService.getEventFundamentalCorrelation(
      symbol,
      selectedEventType,
      selectedMetric,
      timeframe
    );
    setCorrelationData(data);
  } catch (err) {
    console.error('Error fetching correlation data:', err);
    setError('Failed to fetch correlation data. Please try again later.');
    setCorrelationData(null);
  } finally {
    setLoading(false);
  }
};
```

#### EventBasedBacktesting.tsx

A backtesting component that:
- Allows definition of trading strategies based on financial events
- Simulates strategy performance on historical data
- Calculates performance metrics (returns, drawdowns, Sharpe ratio)
- Compares strategy performance to benchmarks

```typescript
// Key features
const [strategy, setStrategy] = useState<BacktestStrategy>({
  eventType: 'earnings',
  entryCondition: 'positive_surprise',
  entryThreshold: 0.05,
  exitType: 'time_based',
  exitDays: 5,
  positionSize: 0.1,
  stopLoss: 0.05
});
const [backtestResults, setBacktestResults] = useState<BacktestResults | null>(null);

// Run backtest
const runBacktest = async () => {
  setLoading(true);
  try {
    const results = await backtestService.runEventBasedBacktest(symbol, strategy);
    setBacktestResults(results);
  } catch (error) {
    console.error('Error running backtest:', error);
    setError('Failed to run backtest');
  } finally {
    setLoading(false);
  }
};
```

#### EventDrivenStrategyBuilder.tsx

A strategy building component that:
- Provides a visual interface for building event-driven strategies
- Allows definition of conditions based on event characteristics
- Supports multiple event types and condition combinations
- Enables strategy testing and export

```typescript
// Key features
const [strategy, setStrategy] = useState<EventStrategy>({
  name: '',
  description: '',
  events: [],
  conditions: [],
  actions: []
});

// Add event to strategy
const addEvent = (eventType: string) => {
  setStrategy(prev => ({
    ...prev,
    events: [...prev.events, { id: uuidv4(), type: eventType }]
  }));
};

// Add condition to strategy
const addCondition = (eventId: string, field: string, operator: string, value: any) => {
  setStrategy(prev => ({
    ...prev,
    conditions: [...prev.conditions, { id: uuidv4(), eventId, field, operator, value }]
  }));
};

// Add action to strategy
const addAction = (type: string, parameters: Record<string, any>) => {
  setStrategy(prev => ({
    ...prev,
    actions: [...prev.actions, { id: uuidv4(), type, parameters }]
  }));
};
```

---

## Service Implementation

### eventService.ts

A service module that:
- Provides methods for retrieving and analyzing financial events
- Handles API requests to event-related endpoints
- Processes and transforms event data for component consumption

```typescript
// Key methods
const getAllEvents = (
  symbol: string,
  days?: number,
  event_types?: string[]
) => {
  return apiRequest<FinancialEvent[]>({
    method: 'GET',
    url: `/api/events/all-events/${symbol}`,
    params: { days, event_types },
  });
};

const filterEvents = (
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
};

const analyzeEventImpact = (
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
};
```

### financialAnalysisService.ts

A service module that:
- Provides methods for retrieving and analyzing financial data
- Handles API requests to financial analysis endpoints
- Processes and transforms financial data for component consumption

```typescript
// Key methods
const getCompanyProfile = (symbol: string) => {
  return apiRequest<CompanyProfile>({
    method: 'GET',
    url: `/api/financial-analysis/company-profile/${symbol}`,
  });
};

const getFinancialRatios = (
  symbol: string,
  params?: {
    period?: 'annual' | 'quarter';
    limit?: number;
  }
) => {
  return apiRequest<FinancialRatios>({
    method: 'GET',
    url: `/api/financial-analysis/financial-ratios/${symbol}`,
    params,
  });
};

const getPeerComparison = (
  symbol: string,
  peer_symbols: string[],
  metrics: string[],
  period?: 'annual' | 'quarter'
) => {
  return apiRequest<PeerComparison>({
    method: 'POST',
    url: `/api/financial-analysis/peer-comparison`,
    data: {
      symbol,
      peer_symbols,
      metrics,
      period: period || 'annual',
    },
  });
};
```

### valuationService.ts

A service module that:
- Provides methods for company valuation using different methodologies
- Handles API requests to valuation endpoints
- Processes and transforms valuation data for component consumption

```typescript
// Key methods
const getDCFValuation = (
  symbol: string,
  params?: {
    years?: number;
    forecast_period?: number;
    discount_rate?: number;
    terminal_growth_rate?: number;
  }
) => {
  return apiRequest<DCFValuationResult>({
    method: 'GET',
    url: `/api/valuation/dcf/${symbol}`,
    params,
  });
};

const getComparableCompanyAnalysis = (
  symbol: string,
  comparable_symbols: string[],
  multiples_to_use?: string[]
) => {
  return apiRequest<ComparableCompanyResult>({
    method: 'POST',
    url: `/api/valuation/comparable-company-analysis/${symbol}`,
    data: {
      comparable_symbols,
      multiples_to_use,
    },
  });
};

const getConsensusValuation = (
  symbol: string,
  params: {
    comparable_symbols?: string[];
    methods?: string[];
    parameters?: Record<string, any>;
  }
) => {
  return apiRequest<ConsensusValuationResult>({
    method: 'POST',
    url: `/api/valuation/consensus-valuation/${symbol}`,
    data: params,
  });
};
```

### correlationAnalysisService.ts

A service module that:
- Provides methods for analyzing correlations between events, metrics, and fundamentals
- Handles API requests to correlation analysis endpoints
- Processes and transforms correlation data for component consumption

```typescript
// Key methods
const getEventFundamentalCorrelation = (
  symbol: string,
  eventType: string,
  fundamentalMetric: string,
  timeframe?: string
) => {
  return apiRequest<any>({
    method: 'GET',
    url: `/api/correlation/event-fundamental-correlation/${symbol}`,
    params: {
      event_type: eventType,
      fundamental_metric: fundamentalMetric,
      timeframe
    },
  });
};

const getTopEventFundamentalCorrelations = (
  symbol: string,
  limit?: number,
  min_significance?: number
) => {
  return apiRequest<any[]>({
    method: 'GET',
    url: `/api/correlation/top-event-fundamental-correlations/${symbol}`,
    params: {
      limit,
      min_significance
    },
  });
};
```

---

## API Integration

The frontend components integrate with backend APIs through a centralized API request utility:

```typescript
// apiRequest.ts
export interface ApiRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  params?: Record<string, any>;
  data?: any;
  headers?: Record<string, string>;
}

export async function apiRequest<T>(config: ApiRequestConfig): Promise<T> {
  try {
    const { method, url, params, data, headers = {} } = config;
    
    // Add default headers
    const requestHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    
    // Build query string for GET requests
    const queryString = params
      ? `?${Object.entries(params)
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => {
            if (Array.isArray(value)) {
              return `${key}=${value.join(',')}`;
            }
            return `${key}=${value}`;
          })
          .join('&')}`
      : '';
    
    // Make the request
    const response = await fetch(`${url}${queryString}`, {
      method,
      headers: requestHeaders,
      body: data ? JSON.stringify(data) : undefined,
    });
    
    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }
    
    // Parse and return the response
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}
```

---

## Data Flow

The data flow in the Event-Driven & Fundamental Analysis feature follows a unidirectional pattern:

1. **User Interaction**: User interacts with the UI (e.g., selects a stock, clicks a button)
2. **Component Action**: Component calls appropriate service method
3. **Service Request**: Service makes API request to backend
4. **API Response**: Backend returns data
5. **Data Processing**: Service processes and transforms data
6. **State Update**: Component updates its state with the processed data
7. **UI Update**: UI re-renders to reflect the new state

### Example Data Flow: Event Timeline

1. User selects a stock symbol
2. EventDashboard component calls `eventService.getAllEvents(symbol)`
3. eventService makes API request to `/api/events/all-events/{symbol}`
4. Backend returns array of events
5. eventService processes the events data
6. EventDashboard updates its `events` state
7. EventTimeline re-renders to display the events

---

## Key Features

### Event Timeline Visualization

- Chronological display of financial events
- Visual indicators for event type and impact
- Interactive event selection
- Event filtering by type, date range, and impact score

### Event Impact Analysis

- Statistical analysis of event impact on stock prices
- Visualization of average and median price changes
- Comparison of positive vs. negative outcomes
- Analysis across different time windows

### Financial Ratio Analysis

- Comprehensive display of financial ratios by category
- Historical trend visualization
- Industry comparison and percentile ranking
- Ratio explanations and health indicators

### Valuation Models

- Multiple valuation methodologies (DCF, comparable company analysis, analyst consensus)
- Interactive parameter adjustment
- Visualization of valuation results
- Consensus valuation combining multiple methods

### Event-Fundamental Correlation

- Analysis of correlations between events and fundamental metrics
- Statistical significance testing
- Visualization using scatter plots and time series charts
- Interpretation of correlation results

### Event-Based Backtesting

- Definition of event-driven trading strategies
- Simulation on historical data
- Performance metrics calculation
- Benchmark comparison

---

## Technical Highlights

### Performance Optimizations

1. **Memoization**: Using React's `useMemo` and `useCallback` to prevent unnecessary re-renders
2. **Virtualization**: Implementing virtualized lists for large datasets
3. **Lazy Loading**: Loading data only when needed
4. **Debouncing**: Debouncing user inputs to reduce API calls
5. **Caching**: Caching API responses to reduce redundant requests

### Responsive Design

1. **Fluid Layouts**: Using Grid and Flexbox for responsive layouts
2. **Breakpoints**: Implementing responsive breakpoints for different screen sizes
3. **Conditional Rendering**: Showing/hiding elements based on screen size
4. **Touch Support**: Implementing touch-friendly interactions for mobile devices

### Accessibility

1. **Keyboard Navigation**: Ensuring all interactive elements are keyboard accessible
2. **ARIA Attributes**: Using appropriate ARIA attributes for screen readers
3. **Color Contrast**: Ensuring sufficient color contrast for all text
4. **Focus Management**: Managing focus for modal dialogs and other interactive elements

### Error Handling

1. **Graceful Degradation**: Displaying fallback UI when errors occur
2. **Retry Mechanism**: Implementing retry logic for failed API requests
3. **User Feedback**: Providing clear error messages to users
4. **Logging**: Logging errors for debugging and monitoring

---

## Dependencies

### External Libraries

1. **React**: UI library for building component-based interfaces
2. **Material-UI**: Component library for consistent design
3. **Recharts**: Charting library for data visualization
4. **D3.js**: Data visualization library for complex visualizations
5. **date-fns**: Date utility library for date formatting and manipulation
6. **lodash**: Utility library for data manipulation
7. **axios**: HTTP client for API requests
8. **react-router-dom**: Routing library for navigation

### Internal Dependencies

1. **API Service**: Central API request utility
2. **Authentication Service**: User authentication and authorization
3. **Theme Provider**: Application-wide theming
4. **Store**: Global state management
5. **Utils**: Shared utility functions

---

## Future Enhancements

1. **Advanced Filtering**: Implement more sophisticated event filtering options
2. **Custom Visualizations**: Add user-defined custom visualizations
3. **Export Functionality**: Add ability to export data and charts
4. **Alerts**: Implement alerts for significant events and correlations
5. **Machine Learning**: Integrate ML models for event prediction
6. **Real-Time Updates**: Add real-time data updates for events
7. **Mobile App**: Develop dedicated mobile application
8. **Offline Mode**: Implement offline functionality for key features
9. **Collaboration**: Add sharing and collaboration features
10. **Integration with Trading**: Connect event analysis directly to trading execution